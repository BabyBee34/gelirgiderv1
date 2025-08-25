// FinanceFlow - Professional Notification Service
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrency } from '../utils/formatters';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
    this.settings = {
      enabled: true,
      sound: true,
      badge: true,
      alert: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      categories: {
        budget: true,
        goals: true,
        payments: true,
        transactions: true,
        security: true,
        general: true
      }
    };
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Request permissions
      const { granted } = await this.requestPermissions();
      if (!granted) {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Get push token
      await this.registerForPushNotifications();

      // Load settings
      await this.loadSettings();

      // Set up listeners
      this.setupListeners();

      // Schedule default notifications
      await this.scheduleDefaultNotifications();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        return {
          granted: finalStatus === 'granted',
          status: finalStatus
        };
      } else {
        console.warn('Must use physical device for Push Notifications');
        return { granted: false, status: 'undetermined' };
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return { granted: false, status: 'error' };
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications() {
    try {
      if (!Device.isDevice) return null;

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.error('Project ID not found');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      this.expoPushToken = token.data;
      
      // Save token for backend communication
      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
      
      return this.expoPushToken;
    } catch (error) {
      console.error('Push token registration error:', error);
      return null;
    }
  }

  /**
   * Setup notification listeners
   */
  setupListeners() {
    // Listener for when notification is received while app is open
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle received notification
   */
  handleNotificationReceived(notification) {
    const { data } = notification.request.content;
    
    // Update badge count
    if (Platform.OS === 'ios') {
      Notifications.setBadgeCountAsync(data.badgeCount || 1);
    }

    // Store notification for history
    this.storeNotification(notification);
  }

  /**
   * Handle notification tap
   */
  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    if (data.screen) {
      // Navigation logic would go here
      console.log(`Navigate to: ${data.screen}`);
    }
  }

  /**
   * Store notification in local storage
   */
  async storeNotification(notification) {
    try {
      const stored = await AsyncStorage.getItem('notificationHistory');
      const history = stored ? JSON.parse(stored) : [];
      
      const notificationData = {
        id: notification.request.identifier,
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        timestamp: Date.now(),
        read: false
      };
      
      history.unshift(notificationData);
      
      // Keep only last 50 notifications
      if (history.length > 50) {
        history.splice(50);
      }
      
      await AsyncStorage.setItem('notificationHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Store notification error:', error);
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(title, body, data = {}, schedulingOptions = null) {
    try {
      if (!this.settings.enabled) return null;

      // Check quiet hours
      if (this.isQuietHours()) {
        console.log('Notification suppressed due to quiet hours');
        return null;
      }

      const notificationContent = {
        title,
        body,
        data: {
          ...data,
          timestamp: Date.now()
        },
        sound: this.settings.sound,
        badge: this.settings.badge,
      };

      let identifier;
      
      if (schedulingOptions) {
        identifier = await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: schedulingOptions
        });
      } else {
        identifier = await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: null
        });
      }

      return identifier;
    } catch (error) {
      console.error('Send notification error:', error);
      return null;
    }
  }

  /**
   * Budget alert notifications
   */
  async sendBudgetAlert(category, spent, limit, percentage) {
    if (!this.settings.categories.budget) return;

    let title, body, urgency;
    
    if (percentage >= 100) {
      title = '🚨 Bütçe Aşıldı!';
      body = `${category} kategorisinde bütçenizi %${percentage.toFixed(1)} aştınız!`;
      urgency = 'high';
    } else if (percentage >= 90) {
      title = '⚠️ Bütçe Uyarısı';
      body = `${category} kategorisinde bütçenizin %${percentage.toFixed(1)}'ini kullandınız!`;
      urgency = 'high';
    } else if (percentage >= 75) {
      title = '📊 Bütçe Bildirimi';
      body = `${category} kategorisinde bütçenizin %${percentage.toFixed(1)}'ini kullandınız.`;
      urgency = 'normal';
    } else {
      return; // Don't send notification for lower percentages
    }

    await this.sendLocalNotification(title, body, {
      type: 'budget_alert',
      category,
      spent,
      limit,
      percentage,
      urgency,
      screen: 'Budget'
    });
  }

  /**
   * Goal progress notifications
   */
  async sendGoalProgress(goal, milestone) {
    if (!this.settings.categories.goals) return;

    let title, body;
    
    if (milestone === 'completed') {
      title = '🎉 Hedef Tamamlandı!';
      body = `"${goal.name}" hedefinizi başarıyla tamamladınız!`;
    } else {
      title = '🎯 Hedef İlerlemesi';
      body = `"${goal.name}" hedefinizin %${milestone}'ini tamamladınız!`;
    }

    await this.sendLocalNotification(title, body, {
      type: 'goal_progress',
      goalId: goal.id,
      goalName: goal.name,
      milestone,
      screen: 'Budget'
    });
  }

  /**
   * Payment reminder notifications
   */
  async sendPaymentReminder(payment, daysLeft) {
    if (!this.settings.categories.payments) return;

    let title, body, urgency;
    
    if (daysLeft === 0) {
      title = '🚨 Ödeme Günü!';
      body = `${payment.name} ödemesi bugün yapılmalı: ${formatCurrency(payment.amount)}`;
      urgency = 'critical';
    } else if (daysLeft === 1) {
      title = '⏰ Ödeme Hatırlatması';
      body = `${payment.name} ödemesi yarın: ${formatCurrency(payment.amount)}`;
      urgency = 'high';
    } else {
      title = '📅 Yaklaşan Ödeme';
      body = `${payment.name} ödemesi ${daysLeft} gün sonra: ${formatCurrency(payment.amount)}`;
      urgency = 'normal';
    }

    await this.sendLocalNotification(title, body, {
      type: 'payment_reminder',
      paymentId: payment.id,
      paymentName: payment.name,
      amount: payment.amount,
      daysLeft,
      urgency,
      screen: 'Transactions'
    });
  }

  /**
   * Transaction notifications
   */
  async sendTransactionNotification(transaction) {
    if (!this.settings.categories.transactions) return;

    const type = transaction.type === 'income' ? 'Gelir' : 'Gider';
    const icon = transaction.type === 'income' ? '💰' : '💸';
    
    const title = `${icon} Yeni ${type}`;
    const body = `${transaction.description}: ${formatCurrency(transaction.amount)}`;

    await this.sendLocalNotification(title, body, {
      type: 'transaction',
      transactionId: transaction.id,
      transactionType: transaction.type,
      amount: transaction.amount,
      screen: 'Transactions'
    });
  }

  /**
   * Security notifications
   */
  async sendSecurityAlert(alertType, details = {}) {
    if (!this.settings.categories.security) return;

    let title, body;
    
    switch (alertType) {
      case 'login':
        title = '🔐 Yeni Giriş';
        body = 'Hesabınıza yeni bir giriş yapıldı.';
        break;
      case 'suspicious':
        title = '🚨 Şüpheli Aktivite';
        body = 'Hesabınızda olağandışı aktivite tespit edildi.';
        break;
      case 'password_change':
        title = '🔑 Şifre Değiştirildi';
        body = 'Hesap şifreniz başarıyla değiştirildi.';
        break;
      default:
        title = '🔒 Güvenlik Bildirimi';
        body = 'Hesap güvenliğinizle ilgili bir bildirim.';
    }

    await this.sendLocalNotification(title, body, {
      type: 'security',
      alertType,
      details,
      urgency: 'high',
      screen: 'Profile'
    });
  }

  /**
   * Schedule recurring notifications
   */
  async scheduleDefaultNotifications() {
    // Daily summary at 8 PM
    await this.scheduleDailySummary();
    
    // Weekly report on Sundays at 9 AM
    await this.scheduleWeeklyReport();
    
    // Monthly report on 1st of month at 9 AM
    await this.scheduleMonthlyReport();
  }

  /**
   * Schedule daily summary
   */
  async scheduleDailySummary() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Günlük Özet',
        body: 'Günlük harcama ve gelir özetinizi görüntüleyin.',
        data: { type: 'daily_summary', screen: 'Analytics' }
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true
      }
    });
  }

  /**
   * Schedule weekly report
   */
  async scheduleWeeklyReport() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📈 Haftalık Rapor',
        body: 'Haftalık finansal raporunuz hazır!',
        data: { type: 'weekly_report', screen: 'Analytics' }
      },
      trigger: {
        weekday: 1, // Sunday
        hour: 9,
        minute: 0,
        repeats: true
      }
    });
  }

  /**
   * Schedule monthly report
   */
  async scheduleMonthlyReport() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Aylık Rapor',
        body: 'Aylık finansal raporunuz hazır!',
        data: { type: 'monthly_report', screen: 'Analytics' }
      },
      trigger: {
        day: 1,
        hour: 9,
        minute: 0,
        repeats: true
      }
    });
  }

  /**
   * Check if current time is in quiet hours
   */
  isQuietHours() {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = this.settings.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    
    return currentTime >= start && currentTime <= end;
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    
    // Re-schedule notifications if needed
    if (newSettings.categories || newSettings.quietHours) {
      await this.cancelAllScheduledNotifications();
      await this.scheduleDefaultNotifications();
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem('notificationSettings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory() {
    try {
      const stored = await AsyncStorage.getItem('notificationHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Get notification history error:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      );
      
      await AsyncStorage.setItem('notificationHistory', JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Mark as read error:', error);
      return false;
    }
  }

  /**
   * Clear notification history
   */
  async clearHistory() {
    try {
      await AsyncStorage.removeItem('notificationHistory');
      return true;
    } catch (error) {
      console.error('Clear history error:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Cancel notifications error:', error);
      return false;
    }
  }

  /**
   * Get current settings
   */
  getSettings() {
    return this.settings;
  }

  /**
   * Test notification
   */
  async sendTestNotification() {
    await this.sendLocalNotification(
      '🧪 Test Bildirimi',
      'Bu bir test bildirimidir. Bildirim sistemi çalışıyor!',
      { type: 'test' }
    );
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;