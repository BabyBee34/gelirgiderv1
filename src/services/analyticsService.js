// FinanceFlow - Analytics Service
import { supabase, TABLES } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';

class AnalyticsService {
  constructor() {
    this.supabase = supabase;
    this.subscriptions = new Map();
    this.realTimeCallbacks = new Map();
    this.isOnline = true;
    this.pendingUpdates = [];
    
    // Network status monitoring
    this.setupNetworkMonitoring();
  }

  // Network status monitoring
  setupNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      // If we just came back online, process pending updates
      if (!wasOnline && this.isOnline) {
        this.processPendingUpdates();
      }
    });
  }

  // Real-time subscription setup
  setupRealTimeSubscription(userId, callback) {
    if (!userId) return null;

    // Clean up existing subscription
    if (this.subscriptions.has(userId)) {
      this.subscriptions.get(userId).unsubscribe();
    }

    // Store callback
    this.realTimeCallbacks.set(userId, callback);

    // Setup subscription for transactions
    const subscription = this.supabase
      .channel(`analytics_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TRANSACTIONS,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleRealTimeUpdate(userId, payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.CATEGORIES,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleRealTimeUpdate(userId, payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.ACCOUNTS,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleRealTimeUpdate(userId, payload);
        }
      )
      .subscribe((status) => {
        console.log('Analytics real-time subscription status:', status);
      });

    this.subscriptions.set(userId, subscription);
    return subscription;
  }

  // Handle real-time updates
  handleRealTimeUpdate(userId, payload) {
    const callback = this.realTimeCallbacks.get(userId);
    if (callback) {
      // Debounce updates to avoid excessive calls
      this.debounceUpdate(userId, callback, payload);
    }
  }

  // Debounced update handler
  debounceUpdate(userId, callback, payload) {
    const key = `update_${userId}`;
    
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      callback(payload);
    }, 500); // 500ms debounce
  }

  // Cleanup subscription
  cleanupSubscription(userId) {
    if (this.subscriptions.has(userId)) {
      this.subscriptions.get(userId).unsubscribe();
      this.subscriptions.delete(userId);
    }
    
    if (this.realTimeCallbacks.has(userId)) {
      this.realTimeCallbacks.delete(userId);
    }
  }

  // Process pending updates when coming back online
  async processPendingUpdates() {
    if (this.pendingUpdates.length === 0) return;

    console.log(`Processing ${this.pendingUpdates.length} pending updates`);
    
    for (const update of this.pendingUpdates) {
      try {
        await this.processUpdate(update);
      } catch (error) {
        console.error('Error processing pending update:', error);
      }
    }

    this.pendingUpdates = [];
  }

  // Process individual update
  async processUpdate(update) {
    // This would typically involve syncing with the backend
    // For now, we'll just log it
    console.log('Processing update:', update);
  }

  // Add update to pending queue
  addPendingUpdate(update) {
    this.pendingUpdates.push(update);
    
    // Limit pending updates to prevent memory issues
    if (this.pendingUpdates.length > 100) {
      this.pendingUpdates = this.pendingUpdates.slice(-50);
    }
  }

  // Tarih hesaplama yardımcı fonksiyonları
  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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

  // Finansal özet verileri (with caching)
  async getFinancialSummary(userId, period = 'month', forceRefresh = false) {
    try {
      const cacheKey = `financial_summary_${userId}_${period}`;
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const startDate = this.getStartDate(period);
      
      const { data, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('amount, type, date')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString());

      if (error) throw error;

      const summary = this.calculateFinancialSummary(data);
      
      // Cache the result
      await this.cacheData(cacheKey, summary);
      
      return { success: true, data: summary };
    } catch (error) {
      console.error('Get financial summary error:', error);
      return { success: false, error: 'Finansal Özet Getirme Hatası' };
    }
  }

  // Finansal özet hesaplama
  calculateFinancialSummary(transactions) {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const net = income - expenses;

    return {
      income,
      expenses,
      net,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
    };
  }

  // Kategori bazında harcama analizi (with caching)
  async getCategoryAnalysis(userId, period = 'month', type = 'expense', forceRefresh = false) {
    try {
      const cacheKey = `category_analysis_${userId}_${period}_${type}`;
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const startDate = this.getStartDate(period);
      
      const { data, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          amount,
          category_id,
          categories!inner(name, icon, color)
        `)
        .eq('user_id', userId)
        .eq('type', type)
        .gte('date', startDate.toISOString());

      if (error) throw error;

      const analysis = this.calculateCategoryAnalysis(data);
      
      // Cache the result
      await this.cacheData(cacheKey, analysis);
      
      return { success: true, data: analysis };
    } catch (error) {
      console.error('Get category analysis error:', error);
      return { success: false, error: 'Kategori Analizi Getirme Hatası' };
    }
  }

  // Kategori analizi hesaplama
  calculateCategoryAnalysis(transactions) {
    const categoryTotals = {};
    
    transactions.forEach(transaction => {
      const categoryName = transaction.categories?.name || 'Bilinmeyen';
      const amount = parseFloat(transaction.amount);
      
      if (categoryTotals[categoryName]) {
        categoryTotals[categoryName].amount += amount;
        categoryTotals[categoryName].count += 1;
      } else {
        categoryTotals[categoryName] = {
          name: categoryName,
          amount,
          count: 1,
          icon: transaction.categories?.icon,
          color: transaction.categories?.color
        };
      }
    });

    return Object.values(categoryTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }

  // Zaman bazında trend analizi (with caching)
  async getTrendAnalysis(userId, period = 'month', type = 'expense', forceRefresh = false) {
    try {
      const cacheKey = `trend_analysis_${userId}_${period}_${type}`;
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const startDate = this.getStartDate(period);
      
      const { data, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('amount, date')
        .eq('user_id', userId)
        .eq('type', type)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      const trends = this.calculateTrendAnalysis(data, period);
      
      // Cache the result
      await this.cacheData(cacheKey, trends);
      
      return { success: true, data: trends };
    } catch (error) {
      console.error('Get trend analysis error:', error);
      return { success: false, error: 'Trend Analizi Getirme Hatası' };
    }
  }

  // Trend analizi hesaplama
  calculateTrendAnalysis(transactions, period) {
    const groupedData = {};
    
    transactions.forEach(transaction => {
      let key;
      const date = new Date(transaction.date);
      
      switch (period) {
        case 'week':
          key = date.toISOString().split('T')[0]; // Günlük
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'quarter':
          key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
          break;
        case 'year':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (groupedData[key]) {
        groupedData[key] += parseFloat(transaction.amount);
      } else {
        groupedData[key] = parseFloat(transaction.amount);
      }
    });

    return Object.entries(groupedData)
      .map(([key, amount]) => ({ period: key, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  // Hesap bazında analiz (with caching)
  async getAccountAnalysis(userId, period = 'month', forceRefresh = false) {
    try {
      const cacheKey = `account_analysis_${userId}_${period}`;
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const startDate = this.getStartDate(period);
      
      const { data, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          amount,
          type,
          account_id,
          accounts!inner(name, type, balance)
        `)
        .eq('user_id', userId)
        .gte('date', startDate.toISOString());

      if (error) throw error;

      const analysis = this.calculateAccountAnalysis(data);
      
      // Cache the result
      await this.cacheData(cacheKey, analysis);
      
      return { success: true, data: analysis };
    } catch (error) {
      console.error('Get account analysis error:', error);
      return { success: false, error: 'Hesap Analizi Getirme Hatası' };
    }
  }

  // Hesap analizi hesaplama
  calculateAccountAnalysis(transactions) {
    const accountTotals = {};
    
    transactions.forEach(transaction => {
      const accountName = transaction.accounts?.name || 'Bilinmeyen';
      const amount = parseFloat(transaction.amount);
      const type = transaction.type;
      
      if (!accountTotals[accountName]) {
        accountTotals[accountName] = {
          name: accountName,
          income: 0,
          expenses: 0,
          net: 0,
          balance: transaction.accounts?.balance || 0
        };
      }
      
      if (type === 'income') {
        accountTotals[accountName].income += amount;
      } else {
        accountTotals[accountName].expenses += amount;
      }
      
      accountTotals[accountName].net = accountTotals[accountName].income - accountTotals[accountName].expenses;
    });

    return Object.values(accountTotals)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }

  // Akıllı öneriler (with caching)
  async getInsights(userId, period = 'month', forceRefresh = false) {
    try {
      const cacheKey = `insights_${userId}_${period}`;
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const [summaryResult, categoryResult] = await Promise.all([
        this.getFinancialSummary(userId, period),
        this.getCategoryAnalysis(userId, period, 'expense')
      ]);

      if (!summaryResult.success || !categoryResult.success) {
        throw new Error('Veri getirme hatası');
      }

      const insights = this.generateInsights(summaryResult.data, categoryResult.data);
      
      // Cache the result
      await this.cacheData(cacheKey, insights);
      
      return { success: true, data: insights };
    } catch (error) {
      console.error('Get insights error:', error);
      return { success: false, error: 'Öneri Getirme Hatası' };
    }
  }

  // Akıllı öneriler oluşturma
  generateInsights(summary, categories) {
    const insights = [];
    
    // Tasarruf oranı analizi
    if (summary.savingsRate < 20) {
      insights.push({
        type: 'warning',
        title: 'Tasarruf Oranı Düşük',
        message: `Tasarruf oranınız %${summary.savingsRate.toFixed(1)}. %20'nin üzerine çıkarmayı hedefleyin.`,
        icon: 'trending-down',
        priority: 'high'
      });
    } else if (summary.savingsRate > 50) {
      insights.push({
        type: 'success',
        title: 'Mükemmel Tasarruf',
        message: `Tasarruf oranınız %${summary.savingsRate.toFixed(1)}. Harika bir iş çıkarıyorsunuz!`,
        icon: 'trending-up',
        priority: 'low'
      });
    }

    // En yüksek harcama kategorisi
    if (categories.length > 0) {
      const topCategory = categories[0];
      const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);
      const percentage = (topCategory.amount / totalExpenses) * 100;
      
      if (percentage > 40) {
        insights.push({
          type: 'warning',
          title: 'Kategori Konsantrasyonu',
          message: `${topCategory.name} kategorisinde harcamalarınız toplam giderlerinizin %${percentage.toFixed(1)}'ini oluşturuyor.`,
          icon: 'warning',
          priority: 'medium'
        });
      }
    }

    // Gelir-gider dengesi
    if (summary.net < 0) {
      insights.push({
        type: 'danger',
        title: 'Gelir-Gider Dengesi',
        message: 'Giderleriniz gelirlerinizi aşıyor. Harcamalarınızı gözden geçirmenizi öneririz.',
        icon: 'error',
        priority: 'high'
      });
    }

    // Pozitif trend
    if (summary.net > 0 && summary.savingsRate > 30) {
      insights.push({
        type: 'success',
        title: 'Pozitif Finansal Trend',
        message: 'Finansal durumunuz iyi gidiyor. Bu trendi sürdürmeye devam edin.',
        icon: 'check-circle',
        priority: 'low'
      });
    }

    return insights;
  }

  // Dashboard için özet veriler (with real-time updates)
  async getDashboardData(userId, forceRefresh = false) {
    try {
      const cacheKey = `dashboard_${userId}`;
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const [summary, topExpenses, topIncome, insights] = await Promise.all([
        this.getFinancialSummary(userId, 'month'),
        this.getCategoryAnalysis(userId, 'month', 'expense'),
        this.getCategoryAnalysis(userId, 'month', 'income'),
        this.getInsights(userId, 'month')
      ]);

      if (!summary.success || !topExpenses.success || !topIncome.success || !insights.success) {
        throw new Error('Dashboard veri getirme hatası');
      }

      const dashboardData = {
        summary: summary.data,
        topExpenses: topExpenses.data.slice(0, 5),
        topIncome: topIncome.data.slice(0, 5),
        insights: insights.data.slice(0, 3),
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result
      await this.cacheData(cacheKey, dashboardData);
      
      return { success: true, data: dashboardData };
    } catch (error) {
      console.error('Get dashboard data error:', error);
      return { success: false, error: 'Dashboard Veri Getirme Hatası' };
    }
  }

  // Cache management methods - Mock implementation
  async getCachedData(key) {
    try {
      // Mock cache - her zaman null döndür
      return null;
    } catch (error) {
      console.error('Get cached data error:', error);
      return null;
    }
  }

  async cacheData(key, data) {
    try {
      // Mock cache - hiçbir şey yapma
      console.log('Mock cache data:', key);
    } catch (error) {
      console.error('Cache data error:', error);
    }
  }

  isCacheValid(timestamp) {
    // Mock cache validation - her zaman false döndür
    return false;
  }

  // Clear all cache
  async clearCache() {
    try {
      // Mock cache clear - her zaman başarılı
      return { success: true, message: 'Mock cache temizlendi' };
    } catch (error) {
      console.error('Clear cache error:', error);
      return { success: false, error: 'Cache temizlenemedi' };
    }
  }

  // Force refresh all data
  async forceRefreshAll(userId) {
    try {
      const [summary, topExpenses, topIncome, insights, dashboard] = await Promise.all([
        this.getFinancialSummary(userId, 'month', true),
        this.getCategoryAnalysis(userId, 'month', 'expense', true),
        this.getCategoryAnalysis(userId, 'month', 'income', true),
        this.getInsights(userId, 'month', true),
        this.getDashboardData(userId, true)
      ]);

      return {
        success: true,
        data: {
          summary: summary.data,
          topExpenses: topExpenses.data,
          topIncome: topIncome.data,
          insights: insights.data,
          dashboard: dashboard.data
        }
      };
    } catch (error) {
      console.error('Force refresh all error:', error);
      return { success: false, error: 'Veri yenileme hatası' };
    }
  }
}

export default new AnalyticsService();
