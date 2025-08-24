// FinanceFlow - Notification System Utility
import { Alert } from 'react-native';

export const notificationSystem = {
  // Günlük özet bildirimi
  showDailySummary: () => {
    console.log('Günlük özet bildirimi gösteriliyor...');
    // Burada gerçek push notification gönderilecek
  },

  // Bütçe uyarısı
  showBudgetAlert: (category, spent, limit) => {
    const remaining = limit - spent;
    const percentage = (spent / limit) * 100;
    
    let message = '';
    if (percentage >= 90) {
      message = `⚠️ ${category} kategorisinde bütçenizin %${percentage.toFixed(1)}'i kullanıldı!`;
    } else if (percentage >= 75) {
      message = `⚠️ ${category} kategorisinde bütçenizin %${percentage.toFixed(1)}'i kullanıldı.`;
    }
    
    if (message) {
      Alert.alert('Bütçe Uyarısı', message);
    }
  },

  // Hedef hatırlatması
  showGoalReminder: (goal) => {
    const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7 && daysLeft > 0) {
      Alert.alert(
        'Hedef Hatırlatması',
        `"${goal.title}" hedefinizin son ${daysLeft} günü kaldı! Mevcut ilerleme: %${((goal.current / goal.target) * 100).toFixed(1)}`
      );
    }
  },

  // Ödeme hatırlatması
  showPaymentReminder: (card, dueDate, amount) => {
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 3 && daysUntilDue > 0) {
      Alert.alert(
        'Ödeme Hatırlatması',
        `${card.name} kartınızın ${daysUntilDue} gün sonra ${amount} TL ödemesi var.`
      );
    }
  },

  // Yeni işlem bildirimi
  showTransactionNotification: (transaction) => {
    const type = transaction.type === 'income' ? 'Gelir' : 'Gider';
    const icon = transaction.type === 'income' ? '💰' : '💸';
    
    Alert.alert(
      'Yeni İşlem',
      `${icon} ${type}: ${transaction.description}\nTutar: ${transaction.amount} TL\nKategori: ${transaction.category}`
    );
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
  updateNotificationSettings: (settings) => {
    console.log('Bildirim ayarları güncellendi:', settings);
    return true;
  },

  // Bildirim durumunu kontrol et
  checkNotificationStatus: () => {
    return {
      isEnabled: true,
      lastNotification: new Date().toISOString(),
      notificationCount: 15,
      categories: {
        budget: true,
        goals: true,
        payments: true,
        transactions: true,
        general: true
      }
    };
  },

  // Test bildirimi gönder
  sendTestNotification: () => {
    Alert.alert(
      'Test Bildirimi',
      'Bu bir test bildirimidir. Bildirim sistemi çalışıyor! 🎉'
    );
  }
};
