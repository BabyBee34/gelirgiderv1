// FinanceFlow - Notification System Utility (Legacy Wrapper)
import notificationService from '../services/notificationService';
import { Alert } from 'react-native';

// Legacy wrapper for backward compatibility
export const notificationSystem = {
  // Initialize the service
  async initialize() {
    return await notificationService.initialize();
  },

  // Günlük özet bildirimi
  showDailySummary: async () => {
    await notificationService.sendLocalNotification(
      '📊 Günlük Özet',
      'Günlük harcama ve gelir özetinizi görüntüleyin.',
      { type: 'daily_summary', screen: 'Analytics' }
    );
  },

  // Bütçe uyarısı
  showBudgetAlert: async (category, spent, limit) => {
    const percentage = (spent / limit) * 100;
    await notificationService.sendBudgetAlert(category, spent, limit, percentage);
  },

  // Hedef hatırlatması
  showGoalReminder: async (goal) => {
    const progress = (goal.current / goal.target) * 100;
    let milestone;
    
    if (progress >= 100) {
      milestone = 'completed';
    } else if (progress >= 75) {
      milestone = '75';
    } else if (progress >= 50) {
      milestone = '50';
    } else if (progress >= 25) {
      milestone = '25';
    }
    
    if (milestone) {
      await notificationService.sendGoalProgress(goal, milestone);
    }
  },

  // Ödeme hatırlatması
  showPaymentReminder: async (card, dueDate, amount) => {
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 3 && daysUntilDue >= 0) {
      const payment = {
        id: card.id || Date.now(),
        name: card.name,
        amount: amount
      };
      
      await notificationService.sendPaymentReminder(payment, daysUntilDue);
    }
  },

  // Yeni işlem bildirimi
  showTransactionNotification: async (transaction) => {
    await notificationService.sendTransactionNotification(transaction);
  },

  // Başarı bildirimi
  showSuccessNotification: (title, message) => {
    Alert.alert(title, message);
  },

  // Hata bildirimi
  showErrorNotification: (title, message) => {
    Alert.alert(title, message);
  },

  // Bilgi bildirimi
  showInfoNotification: (title, message) => {
    Alert.alert(title, message);
  },

  // Bildirim ayarlarını güncelle
  updateNotificationSettings: async (settings) => {
    await notificationService.updateSettings(settings);
    return true;
  },

  // Bildirim durumunu kontrol et
  checkNotificationStatus: () => {
    const settings = notificationService.getSettings();
    return {
      isEnabled: settings.enabled,
      lastNotification: new Date().toISOString(),
      notificationCount: 15,
      categories: settings.categories
    };
  },

  // Test bildirimi gönder
  sendTestNotification: async () => {
    await notificationService.sendTestNotification();
  },

  // Get notification service instance
  getService: () => notificationService
};

// Direct access to notification service
export { notificationService };

// Default export for backward compatibility
export default notificationSystem;
