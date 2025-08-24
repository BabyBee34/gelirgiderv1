// FinanceFlow - Budget Service
import { supabase, TABLES } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';

// Tablo isimleri (fallback için)
const FALLBACK_TABLES = {
  BUDGETS: 'budgets',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories'
};

class BudgetService {
  constructor() {
    this.supabase = supabase;
    this.budgetCache = new Map();
    this.spentCache = new Map();
    this.realTimeCallbacks = new Map();
    this.alertCallbacks = new Map();
    // this.setupNetworkMonitoring(); // Geçici olarak devre dışı
  }

  // Network monitoring setup - Geçici olarak devre dışı
  setupNetworkMonitoring() {
    // NetInfo.addEventListener(state => {
    //   if (state.isConnected && state.isInternetReachable) {
    //     this.syncBudgetData();
    //   }
    // });
  }

  // Real-time budget tracking setup
  setupRealTimeBudgetTracking(userId, callback) {
    if (!userId) return null;

    // Clean up existing subscription
    if (this.realTimeCallbacks.has(userId)) {
      this.cleanupRealTimeTracking(userId);
    }

    // Store callback
    this.realTimeCallbacks.set(userId, callback);

    // Setup subscription for budget and transaction changes
    const subscription = this.supabase
      .channel(`budget_tracking_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.BUDGETS,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleBudgetUpdate(userId, payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TRANSACTIONS,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleTransactionUpdate(userId, payload);
        }
      )
      .subscribe();

    return subscription;
  }

  // Handle budget updates
  handleBudgetUpdate(userId, payload) {
    const callback = this.realTimeCallbacks.get(userId);
    if (callback) {
      // Invalidate cache for affected budget
      this.budgetCache.delete(payload.new?.id || payload.old?.id);
      
      // Notify callback
      callback({
        type: 'budget_update',
        budget: payload.new || payload.old,
        eventType: payload.eventType
      });
    }
  }

  // Handle transaction updates that affect budgets
  handleTransactionUpdate(userId, payload) {
    const transaction = payload.new || payload.old;
    if (transaction?.category_id) {
      // Invalidate spent cache for affected category
      this.spentCache.delete(`${userId}_${transaction.category_id}`);
      
      // Check budget alerts
      this.checkBudgetAlerts(userId, transaction.category_id);
      
      const callback = this.realTimeCallbacks.get(userId);
      if (callback) {
        callback({
          type: 'transaction_update',
          transaction,
          categoryId: transaction.category_id,
          eventType: payload.eventType
        });
      }
    }
  }

  // Cleanup real-time tracking
  cleanupRealTimeTracking(userId) {
    if (this.realTimeCallbacks.has(userId)) {
      this.realTimeCallbacks.delete(userId);
    }
  }

  // Tüm bütçeleri getir
  async getBudgets(userId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.BUDGETS)
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update budget cache
      if (data) {
        data.forEach(budget => {
          this.budgetCache.set(budget.id, {
            ...budget,
            lastUpdated: new Date().toISOString()
          });
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Get budgets error:', error);
      return { success: false, error: 'Bütçe Getirme hatası' };
    }
  }

  // Bütçe ile gerçek harcama karşılaştırması
  async getBudgetWithSpending(userId, period = 'month') {
    try {
      const budgetsResult = await this.getBudgets(userId);
      if (!budgetsResult.success) {
        throw new Error(budgetsResult.error);
      }

      const budgetsWithSpending = [];
      
      for (const budget of budgetsResult.data) {
        const spentResult = await this.getCategorySpending(userId, budget.category_id, period);
        const spent = spentResult.success ? spentResult.data.totalSpent : 0;
        
        const remaining = parseFloat(budget.amount) - spent;
        const percentage = parseFloat(budget.amount) > 0 ? (spent / parseFloat(budget.amount)) * 100 : 0;
        
        budgetsWithSpending.push({
          ...budget,
          spent,
          remaining,
          percentage,
          status: this.getBudgetStatus(percentage),
          isOverBudget: spent > parseFloat(budget.amount),
          daysLeft: this.getDaysLeftInPeriod(budget.period)
        });
      }

      return { success: true, data: budgetsWithSpending };
    } catch (error) {
      console.error('Get budget with spending error:', error);
      return { success: false, error: 'Bütçe karşılaştırması alınamadı' };
    }
  }

  // Kategori harcamasını getir
  async getCategorySpending(userId, categoryId, period = 'month') {
    try {
      const cacheKey = `${userId}_${categoryId}_${period}`;
      
      // Check cache first
      if (this.spentCache.has(cacheKey)) {
        const cached = this.spentCache.get(cacheKey);
        const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
        
        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const startDate = this.getStartDate(period);
      
      const { data: transactions, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('amount, date')
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .eq('type', 'expense')
        .gte('date', startDate.toISOString());

      if (error) throw error;

      const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const transactionCount = transactions.length;
      const averageSpent = transactionCount > 0 ? totalSpent / transactionCount : 0;
      
      const spendingData = {
        totalSpent,
        transactionCount,
        averageSpent,
        period,
        categoryId
      };

      // Update cache
      this.spentCache.set(cacheKey, {
        data: spendingData,
        lastUpdated: new Date().toISOString()
      });

      return { success: true, data: spendingData };
    } catch (error) {
      console.error('Get category spending error:', error);
      return { success: false, error: 'Kategori harcaması alınamadı' };
    }
  }

  // Bütçe durumunu belirle
  getBudgetStatus(percentage) {
    if (percentage >= 100) return 'over_budget';
    if (percentage >= 80) return 'warning';
    if (percentage >= 60) return 'caution';
    return 'good';
  }

  // Dönemde kalan gün sayısı
  getDaysLeftInPeriod(period) {
    const now = new Date();
    let endDate;
    
    switch (period) {
      case 'week':
        endDate = new Date(now);
        endDate.setDate(now.getDate() + (7 - now.getDay()));
        break;
      case 'month':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    const diffTime = endDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Bütçe uyarılarını kontrol et
  async checkBudgetAlerts(userId, categoryId) {
    try {
      // Get budget for this category
      const { data: budget, error } = await this.supabase
        .from(TABLES.BUDGETS)
        .select('*')
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .single();

      if (error || !budget) return;

      // Get current spending
      const spentResult = await this.getCategorySpending(userId, categoryId, budget.period);
      if (!spentResult.success) return;

      const spent = spentResult.data.totalSpent;
      const budgetAmount = parseFloat(budget.amount);
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      // Check alert thresholds
      const alerts = [];
      
      if (percentage >= 100) {
        alerts.push({
          type: 'over_budget',
          title: 'Bütçe Aşıldı!',
          message: `${budget.category?.name || 'Kategori'} bütçenizi aştınız. Harcanan: ${spent.toFixed(2)} TL, Bütçe: ${budgetAmount.toFixed(2)} TL`,
          priority: 'critical',
          budgetId: budget.id,
          categoryId,
          percentage
        });
      } else if (percentage >= 90) {
        alerts.push({
          type: 'budget_warning',
          title: 'Bütçe Uyarısı',
          message: `${budget.category?.name || 'Kategori'} bütçenizin %${percentage.toFixed(1)}'ini kullandınız.`,
          priority: 'high',
          budgetId: budget.id,
          categoryId,
          percentage
        });
      } else if (percentage >= 75) {
        alerts.push({
          type: 'budget_caution',
          title: 'Bütçe Dikkat',
          message: `${budget.category?.name || 'Kategori'} bütçenizin %${percentage.toFixed(1)}'ini kullandınız.`,
          priority: 'medium',
          budgetId: budget.id,
          categoryId,
          percentage
        });
      }

      // Trigger alert callbacks
      if (alerts.length > 0) {
        const alertCallback = this.alertCallbacks.get(userId);
        if (alertCallback) {
          alertCallback(alerts);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Check budget alerts error:', error);
      return [];
    }
  }

  // Setup budget alert callbacks
  setupBudgetAlerts(userId, callback) {
    this.alertCallbacks.set(userId, callback);
  }

  // Cleanup budget alerts
  cleanupBudgetAlerts(userId) {
    this.alertCallbacks.delete(userId);
  }

  // Bütçe projeksiyonu
  async getBudgetProjection(userId, categoryId, period = 'month') {
    try {
      const spentResult = await this.getCategorySpending(userId, categoryId, period);
      if (!spentResult.success) {
        throw new Error(spentResult.error);
      }

      const { totalSpent, transactionCount } = spentResult.data;
      const daysElapsed = this.getDaysElapsedInPeriod(period);
      const totalDays = this.getTotalDaysInPeriod(period);
      const daysLeft = totalDays - daysElapsed;
      
      // Calculate daily average
      const dailyAverage = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
      
      // Project spending for remaining days
      const projectedSpending = totalSpent + (dailyAverage * daysLeft);
      
      return {
        success: true,
        data: {
          currentSpent: totalSpent,
          projectedTotal: projectedSpending,
          dailyAverage,
          daysElapsed,
          daysLeft,
          transactionCount
        }
      };
    } catch (error) {
      console.error('Get budget projection error:', error);
      return { success: false, error: 'Bütçe projeksiyonu hesaplanamadı' };
    }
  }

  // Dönemde geçen gün sayısı
  getDaysElapsedInPeriod(period) {
    const now = new Date();
    const startDate = this.getStartDate(period);
    const diffTime = now - startDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Dönemdeki toplam gün sayısı
  getTotalDaysInPeriod(period) {
    const now = new Date();
    
    switch (period) {
      case 'week':
        return 7;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        return Math.ceil((quarterEnd - quarterStart) / (1000 * 60 * 60 * 24));
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        return Math.ceil((yearEnd - yearStart) / (1000 * 60 * 60 * 24));
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }
  }

  // Bütçe performans analizi
  async getBudgetPerformanceAnalysis(userId, period = 'month') {
    try {
      const budgetsResult = await this.getBudgetWithSpending(userId, period);
      if (!budgetsResult.success) {
        throw new Error(budgetsResult.error);
      }

      const budgets = budgetsResult.data;
      const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
      const totalRemaining = totalBudgeted - totalSpent;
      
      const overBudgetCount = budgets.filter(b => b.isOverBudget).length;
      const onTrackCount = budgets.filter(b => b.status === 'good').length;
      const warningCount = budgets.filter(b => b.status === 'warning' || b.status === 'caution').length;
      
      const performance = {
        totalBudgeted,
        totalSpent,
        totalRemaining,
        utilizationRate: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
        overBudgetCount,
        onTrackCount,
        warningCount,
        totalBudgets: budgets.length,
        budgetsByStatus: {
          good: budgets.filter(b => b.status === 'good'),
          caution: budgets.filter(b => b.status === 'caution'),
          warning: budgets.filter(b => b.status === 'warning'),
          over_budget: budgets.filter(b => b.status === 'over_budget')
        }
      };

      return { success: true, data: performance };
    } catch (error) {
      console.error('Get budget performance analysis error:', error);
      return { success: false, error: 'Bütçe performans analizi yapılamadı' };
    }
  }

  // Bütçe önerileri
  async getBudgetRecommendations(userId) {
    try {
      const performanceResult = await this.getBudgetPerformanceAnalysis(userId);
      if (!performanceResult.success) {
        throw new Error(performanceResult.error);
      }

      const { budgetsByStatus, utilizationRate, overBudgetCount } = performanceResult.data;
      const recommendations = [];

      // Over budget recommendations
      if (overBudgetCount > 0) {
        recommendations.push({
          type: 'critical',
          title: 'Bütçe Aşımları',
          description: `${overBudgetCount} kategoride bütçenizi aştınız. Bu kategorilerdeki harcamalarınızı azaltın.`,
          priority: 'high',
          categories: budgetsByStatus.over_budget.map(b => b.category?.name).filter(Boolean)
        });
      }

      // High utilization warning
      if (utilizationRate > 85) {
        recommendations.push({
          type: 'warning',
          title: 'Yüksek Bütçe Kullanımı',
          description: `Bütçenizin %${utilizationRate.toFixed(1)}'ini kullandınız. Dikkatli harcama yapın.`,
          priority: 'medium'
        });
      }

      // Savings opportunity
      if (utilizationRate < 60) {
        recommendations.push({
          type: 'success',
          title: 'Tasarruf Fırsatı',
          description: `Bütçenizin sadece %${utilizationRate.toFixed(1)}'ini kullandınız. Fazla parayı tasarrufa yönlendirebilirsiniz.`,
          priority: 'low'
        });
      }

      // Category-specific recommendations
      budgetsByStatus.warning.forEach(budget => {
        recommendations.push({
          type: 'warning',
          title: `${budget.category?.name || 'Kategori'} Dikkat`,
          description: `Bu kategoride bütçenizin %${budget.percentage.toFixed(1)}'ini kullandınız.`,
          priority: 'medium',
          categoryId: budget.category_id
        });
      });

      return { success: true, data: recommendations };
    } catch (error) {
      console.error('Get budget recommendations error:', error);
      return { success: false, error: 'Bütçe önerileri alınamadı' };
    }
  }

  // Sync budget data
  async syncBudgetData() {
    try {
      // Clear caches to force fresh data
      this.budgetCache.clear();
      this.spentCache.clear();
      
      console.log('Budget data synced');
    } catch (error) {
      console.error('Sync budget data error:', error);
    }
  }

  // Helper methods
  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return weekStart;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  // Tek bütçe getir
  async getBudget(budgetId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.BUDGETS)
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .eq('id', budgetId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get budget error:', error);
      return { success: false, error: 'Bütçe Getirme hatası' };
    }
  }

  // Yeni bütçe oluştur
  async createBudget(budgetData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.BUDGETS)
        .insert([budgetData])
        .select()
        .single();

      if (error) throw error;
      
      // Update cache
      if (data) {
        this.budgetCache.set(data.id, {
          ...data,
          lastUpdated: new Date().toISOString()
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Create budget error:', error);
      return { success: false, error: 'Bütçe Oluşturma hatası' };
    }
  }

  // Bütçe güncelle
  async updateBudget(budgetId, updates) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.BUDGETS)
        .update(updates)
        .eq('id', budgetId)
        .select()
        .single();

      if (error) throw error;
      
      // Update cache
      if (data) {
        this.budgetCache.set(data.id, {
          ...data,
          lastUpdated: new Date().toISOString()
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Update budget error:', error);
      return { success: false, error: 'Bütçe Güncelleme hatası' };
    }
  }

  // Bütçe sil
  async deleteBudget(budgetId) {
    try {
      const { error } = await this.supabase
        .from(TABLES.BUDGETS)
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
      
      // Remove from cache
      this.budgetCache.delete(budgetId);
      
      return { success: true };
    } catch (error) {
      console.error('Delete budget error:', error);
      return { success: false, error: 'Bütçe Silme hatası' };
    }
  }
}

export default new BudgetService();