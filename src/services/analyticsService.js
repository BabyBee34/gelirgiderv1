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
        priority: 'high',
        actionText: 'Bütçe Planı Oluştur',
        onAction: () => console.log('Navigate to budget planning')
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
          title: `${topCategory.name} Kategorisinde Yüksek Harcama`,
          message: `Toplam harcamanızın %${percentage.toFixed(1)}'i ${topCategory.name} kategorisinde. Bu kategoriyi gözden geçirmeyi düşünün.`,
          icon: 'warning',
          priority: 'medium',
          actionText: 'Kategori Detaylarını Gör',
          onAction: () => console.log('Navigate to category details')
        });
      }
    }

    // Gelir-gider dengesi
    if (summary.net < 0) {
      insights.push({
        type: 'danger',
        title: 'Negatif Nakit Akışı',
        message: `Bu dönemde ${Math.abs(summary.net).toLocaleString('tr-TR')} TL zarar ettiniz. Harcamalarınızı gözden geçirin.`,
        icon: 'trending-down',
        priority: 'high',
        actionText: 'Harcama Analizi Yap',
        onAction: () => console.log('Navigate to expense analysis')
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Harcama desenlerini analiz et
  async getSpendingPatterns(userId, period = 'month', forceRefresh = false) {
    try {
      const cacheKey = `spending_patterns_${userId}_${period}`;
      
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const startDate = this.getStartDate(period);
      
      const { data, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('amount, date, type')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      const patterns = this.analyzeSpendingPatterns(data);
      
      await this.cacheData(cacheKey, patterns);
      
      return { success: true, data: patterns };
    } catch (error) {
      console.error('Get spending patterns error:', error);
      return { success: false, error: 'Harcama Desenleri Analizi Hatası' };
    }
  }

  // Harcama desenlerini analiz et
  analyzeSpendingPatterns(transactions) {
    const patterns = [];
    
    // Haftalık ortalama
    const weeklyAvg = this.calculateWeeklyAverage(transactions);
    patterns.push({
      title: 'Haftalık Ortalama',
      description: 'Son haftalık harcama ortalamanız',
      value: `${weeklyAvg.toLocaleString('tr-TR')} TL`,
      trend: weeklyAvg > 1000 ? '↗️ Yüksek' : '↘️ Normal',
      icon: 'timeline'
    });
    
    // En aktif gün
    const activeDays = this.findMostActiveDay(transactions);
    patterns.push({
      title: 'En Aktif Gün',
      description: 'En çok harcama yaptığınız gün',
      value: activeDays.day,
      trend: `${activeDays.count} işlem`,
      icon: 'today'
    });
    
    // Harcama volatilitesi
    const volatility = this.calculateVolatility(transactions);
    patterns.push({
      title: 'Harcama Tutarlılığı',
      description: 'Harcamalarınızın düzenli olma seviyesi',
      value: volatility.level,
      trend: volatility.score,
      icon: 'show-chart'
    });
    
    return patterns;
  }

  // Bütçe önerilerini getir
  async getBudgetRecommendations(userId, period = 'month', forceRefresh = false) {
    try {
      const cacheKey = `budget_recommendations_${userId}_${period}`;
      
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

      const recommendations = this.generateBudgetRecommendations(
        summaryResult.data, 
        categoryResult.data
      );
      
      await this.cacheData(cacheKey, recommendations);
      
      return { success: true, data: recommendations };
    } catch (error) {
      console.error('Get budget recommendations error:', error);
      return { success: false, error: 'Bütçe Önerileri Getirme Hatası' };
    }
  }

  // Bütçe önerilerini oluştur
  generateBudgetRecommendations(summary, categories) {
    const recommendations = [];
    const monthlyIncome = summary.income;
    
    // 50/30/20 kuralına göre öneriler
    const needsBudget = monthlyIncome * 0.5;  // İhtiyaçlar için %50
    const wantsBudget = monthlyIncome * 0.3;  // İstekler için %30
    const savingsBudget = monthlyIncome * 0.2; // Tasarruf için %20
    
    categories.forEach((category, index) => {
      let suggestedAmount, currentPercentage, recommendation;
      
      // Kategori bazında öneriler
      if (category.name.toLowerCase().includes('market') || 
          category.name.toLowerCase().includes('gıda')) {
        suggestedAmount = monthlyIncome * 0.15; // Gıda için %15
        recommendation = 'Gıda harcamalarınız için önerilen bütçe';
      } else if (category.name.toLowerCase().includes('ulaşım')) {
        suggestedAmount = monthlyIncome * 0.10; // Ulaşım için %10
        recommendation = 'Ulaşım harcamalarınız için önerilen bütçe';
      } else if (category.name.toLowerCase().includes('eğlence')) {
        suggestedAmount = monthlyIncome * 0.05; // Eğlence için %5
        recommendation = 'Eğlence harcamalarınız için önerilen bütçe';
      } else {
        suggestedAmount = monthlyIncome * 0.08; // Diğer kategoriler için %8
        recommendation = `${category.name} kategorisi için önerilen bütçe`;
      }
      
      currentPercentage = (category.amount / suggestedAmount) * 100;
      
      recommendations.push({
        category: category.name,
        currentAmount: category.amount,
        suggestedAmount,
        currentPercentage,
        recommendation,
        icon: category.icon || 'account-balance-wallet',
        color: currentPercentage > 100 ? '#F56565' : '#48BB78'
      });
    });
    
    return recommendations.slice(0, 5); // En önemli 5 kategori
  }

  // Akıllı uyarıları getir
  async getSmartAlerts(userId, forceRefresh = false) {
    try {
      const cacheKey = `smart_alerts_${userId}`;
      
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp, 60)) { // 1 saatlik cache
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      const alerts = [];
      
      // Son 24 saatte büyük harcama kontrolü
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: recentTransactions } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', yesterday.toISOString());
        
      const dailySpending = recentTransactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
      
      if (dailySpending > 500) {
        alerts.push({
          message: `Son 24 saatte ${dailySpending.toLocaleString('tr-TR')} TL harcama yaptınız!`,
          severity: 'high',
          icon: 'warning',
          timestamp: new Date()
        });
      }
      
      // Ay sonu yaklaşırken bütçe durumu
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysLeft = Math.ceil((monthEnd - now) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 5) {
        alerts.push({
          message: `Ay sonuna ${daysLeft} gün kaldı. Bütçenizi kontrol edin.`,
          severity: 'medium',
          icon: 'schedule',
          timestamp: new Date()
        });
      }
      
      await this.cacheData(cacheKey, alerts);
      
      return { success: true, data: alerts };
    } catch (error) {
      console.error('Get smart alerts error:', error);
      return { success: false, error: 'Akıllı Uyarılar Getirme Hatası' };
    }
  }

  // Yardımcı fonksiyonlar
  calculateWeeklyAverage(transactions) {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const weekCount = Math.max(1, expenseTransactions.length / 7);
    return totalExpenses / weekCount;
  }

  findMostActiveDay(transactions) {
    const dayCount = {};
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    
    transactions.forEach(t => {
      const day = new Date(t.date).getDay();
      const dayName = dayNames[day];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });
    
    const mostActiveDay = Object.entries(dayCount)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      day: mostActiveDay ? mostActiveDay[0] : 'Bilinmiyor',
      count: mostActiveDay ? mostActiveDay[1] : 0
    };
  }

  calculateVolatility(transactions) {
    const amounts = transactions
      .filter(t => t.type === 'expense')
      .map(t => parseFloat(t.amount));
    
    if (amounts.length < 2) {
      return { level: 'Yetersiz Veri', score: 'N/A' };
    }
    
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    const volatility = (standardDeviation / mean) * 100;
    
    if (volatility < 20) {
      return { level: 'Tutarlı', score: `%${volatility.toFixed(0)}` };
    } else if (volatility < 50) {
      return { level: 'Orta', score: `%${volatility.toFixed(0)}` };
    } else {
      return { level: 'Değişken', score: `%${volatility.toFixed(0)}` };
    }
  }

  // Cache management
  async getCachedData(key) {
    try {
      // Simple in-memory cache for demo
      return this.cache ? this.cache[key] : null;
    } catch (error) {
      console.error('Get cached data error:', error);
      return null;
    }
  }

  async cacheData(key, data) {
    try {
      if (!this.cache) {
        this.cache = {};
      }
      this.cache[key] = {
        data,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Cache data error:', error);
    }
  }

  isCacheValid(timestamp, maxAgeMinutes = 15) {
    const now = new Date();
    const cacheAge = (now - new Date(timestamp)) / (1000 * 60); // minutes
    return cacheAge < maxAgeMinutes;
  }

  async clearCache() {
    try {
      this.cache = {};
      return { success: true };
    } catch (error) {
      console.error('Clear cache error:', error);
      return { success: false, error: 'Cache temizleme hatası' };
    }
  }
}

export default new AnalyticsService();
