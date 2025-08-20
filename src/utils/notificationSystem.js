// FinanceFlow - Notification System
import { Alert } from 'react-native';
import { testUser } from './testData';
import { formatCurrency } from './formatters';

export const notificationSystem = {
  // Check for budget alerts
  checkBudgetAlerts: () => {
    const alerts = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Simulate monthly spending per category
    const monthlySpending = {
      'food': 2800,
      'entertainment': 1700,
      'transport': 900,
      'shopping': 1200,
      'health': 600,
      'education': 400,
    };

    // Simulated budget limits per category
    const budgetLimits = {
      'food': 3000,
      'entertainment': 2000,
      'transport': 1000,
      'shopping': 1500,
      'health': 800,
      'education': 500,
    };

    Object.keys(monthlySpending).forEach(category => {
      const spent = monthlySpending[category];
      const limit = budgetLimits[category];
      const percentage = (spent / limit) * 100;

      if (percentage >= 85) {
        alerts.push({
          id: `budget-${category}-${Date.now()}`,
          type: 'budget_warning',
          category,
          title: 'Bütçe Uyarısı',
          message: `${category} kategorisinde bütçenizin %${Math.round(percentage)}'ini kullandınız (${formatCurrency(spent)}/${formatCurrency(limit)})`,
          severity: percentage >= 100 ? 'critical' : 'warning',
          createdAt: new Date().toISOString(),
        });
      }
    });

    return alerts;
  },

  // Check for goal deadlines
  checkGoalDeadlines: () => {
    const alerts = [];
    const today = new Date();

    testUser.goals.forEach(goal => {
      const targetDate = new Date(goal.targetDate);
      const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
      const progress = (goal.currentAmount / goal.targetAmount) * 100;

      if (daysLeft <= 30 && progress < 80) {
        alerts.push({
          id: `goal-deadline-${goal.id}`,
          type: 'goal_deadline',
          goalId: goal.id,
          title: 'Hedef Uyarısı',
          message: `${goal.name} hedefinize ${daysLeft} gün kaldı ve %${Math.round(progress)} tamamlandı`,
          severity: daysLeft <= 7 ? 'critical' : 'warning',
          createdAt: new Date().toISOString(),
        });
      }
    });

    return alerts;
  },

  // Check for unusual spending
  checkUnusualSpending: () => {
    const alerts = [];
    
    // Simulate detection of unusual spending patterns
    const todaySpending = 450; // Simulated today's spending
    const averageDailySpending = 180; // Simulated average

    if (todaySpending > averageDailySpending * 2) {
      alerts.push({
        id: `unusual-spending-${Date.now()}`,
        type: 'unusual_spending',
        title: 'Yüksek Harcama',
        message: `Bugün günlük ortalamanızın 2 katından fazla harcama yaptınız (${formatCurrency(todaySpending)})`,
        severity: 'warning',
        createdAt: new Date().toISOString(),
      });
    }

    return alerts;
  },

  // Check for savings opportunities
  checkSavingsOpportunities: () => {
    const alerts = [];

    // Simulate savings opportunity detection
    alerts.push({
      id: `savings-opportunity-${Date.now()}`,
      type: 'savings_opportunity',
      title: 'Tasarruf Fırsatı',
      message: 'Kahve harcamalarınızı %30 azaltarak aylık 150₺ tasarruf edebilirsiniz',
      severity: 'info',
      createdAt: new Date().toISOString(),
    });

    return alerts;
  },

  // Get all notifications
  getAllNotifications: () => {
    const budgetAlerts = notificationSystem.checkBudgetAlerts();
    const goalAlerts = notificationSystem.checkGoalDeadlines();
    const spendingAlerts = notificationSystem.checkUnusualSpending();
    const savingsAlerts = notificationSystem.checkSavingsOpportunities();

    return [
      ...budgetAlerts,
      ...goalAlerts,
      ...spendingAlerts,
      ...savingsAlerts,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Show alert to user
  showAlert: (notification) => {
    const title = notification.title;
    const message = notification.message;
    
    Alert.alert(
      title,
      message,
      [
        { text: 'Tamam', style: 'default' },
        { text: 'Ayarlar', onPress: () => console.log('Navigate to settings') }
      ]
    );
  },

  // Show daily summary
  showDailySummary: () => {
    const notifications = notificationSystem.getAllNotifications();
    const criticalCount = notifications.filter(n => n.severity === 'critical').length;
    const warningCount = notifications.filter(n => n.severity === 'warning').length;

    if (criticalCount > 0 || warningCount > 0) {
      Alert.alert(
        'Günlük Özet',
        `${criticalCount} kritik ve ${warningCount} uyarı bildirimi var. Kontrol etmek ister misiniz?`,
        [
          { text: 'Daha Sonra', style: 'cancel' },
          { text: 'Göster', onPress: () => console.log('Show notifications') }
        ]
      );
    }
  },

  // Automated alert checks
  runAutomatedChecks: () => {
    const notifications = notificationSystem.getAllNotifications();
    const criticalNotifications = notifications.filter(n => n.severity === 'critical');
    
    // Show critical notifications immediately
    criticalNotifications.forEach(notification => {
      notificationSystem.showAlert(notification);
    });

    return notifications;
  }
};

export default notificationSystem;
