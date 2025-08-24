// FinanceFlow - Report Service
import { supabase, TABLES } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';
import analyticsService from './analyticsService';

class ReportService {
  constructor() {
    this.supabase = supabase;
    this.reportCache = new Map();
    this.realTimeCallbacks = new Map();
    this.setupNetworkMonitoring();
  }

  // Özel rapor oluştur
  async generateCustomReport(userId, reportConfig) {
    try {
      const {
        reportType = 'comprehensive',
        dateRange = 'month',
        categories = [],
        accounts = [],
        minAmount,
        maxAmount,
        includeInsights = true,
        format = 'json'
      } = reportConfig;

      let reportData = {};

      switch (reportType) {
        case 'comprehensive':
          reportData = await this.generateComprehensiveReport(userId, dateRange, categories, accounts, minAmount, maxAmount, includeInsights);
          break;
        case 'spending':
          reportData = await this.generateSpendingReport(userId, dateRange, categories, accounts, minAmount, maxAmount);
          break;
        case 'income':
          reportData = await this.generateIncomeReport(userId, dateRange, categories, accounts, minAmount, maxAmount);
          break;
        case 'category':
          reportData = await this.generateCategoryReport(userId, dateRange, categories, minAmount, maxAmount);
          break;
        case 'account':
          reportData = await this.generateAccountReport(userId, dateRange, accounts, minAmount, maxAmount);
          break;
        case 'trend':
          reportData = await this.generateTrendReport(userId, dateRange, categories, accounts);
          break;
        case 'budget':
          reportData = await this.generateBudgetReport(userId, dateRange);
          break;
        default:
          throw new Error('Geçersiz rapor türü');
      }

      // Format the report
      const formattedReport = this.formatReport(reportData, format);
      
      return {
        success: true,
        data: formattedReport,
        metadata: {
          generatedAt: new Date().toISOString(),
          config: reportConfig,
          userId
        }
      };
    } catch (error) {
      console.error('Generate custom report error:', error);
      return { success: false, error: 'Rapor oluşturulamadı.' };
    }
  }

  // Kapsamlı rapor
  async generateComprehensiveReport(userId, dateRange, categories, accounts, minAmount, maxAmount, includeInsights) {
    const startDate = this.getStartDate(dateRange);
    
    // Get all required data
    const [transactions, summary, categoryAnalysis, accountAnalysis, insights] = await Promise.all([
      this.getFilteredTransactions(userId, startDate, categories, accounts, minAmount, maxAmount),
      analyticsService.getFinancialSummary(userId, dateRange),
      analyticsService.getCategoryAnalysis(userId, dateRange, 'expense'),
      analyticsService.getAccountAnalysis(userId, dateRange),
      includeInsights ? analyticsService.getInsights(userId, dateRange) : { success: true, data: [] }
    ]);

    if (!transactions.success) throw new Error('İşlem verileri alınamadı');

    const report = {
      summary: summary.success ? summary.data : null,
      transactions: {
        total: transactions.data.length,
        income: transactions.data.filter(t => t.type === 'income').length,
        expenses: transactions.data.filter(t => t.type === 'expense').length,
        data: transactions.data
      },
      categories: categoryAnalysis.success ? categoryAnalysis.data : [],
      accounts: accountAnalysis.success ? accountAnalysis.data : [],
      insights: insights.success ? insights.data : [],
      analysis: this.analyzeTransactions(transactions.data),
      recommendations: this.generateRecommendations(summary.success ? summary.data : null, categoryAnalysis.success ? categoryAnalysis.data : [])
    };

    return report;
  }

  // Harcama raporu
  async generateSpendingReport(userId, dateRange, categories, accounts, minAmount, maxAmount) {
    const startDate = this.getStartDate(dateRange);
    
    const transactions = await this.getFilteredTransactions(
      userId, 
      startDate, 
      categories, 
      accounts, 
      minAmount, 
      maxAmount,
      'expense'
    );

    if (!transactions.success) throw new Error('Harcama verileri alınamadı');

    const spendingData = transactions.data;
    const totalSpending = spendingData.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const avgSpending = totalSpending / spendingData.length || 0;

    const report = {
      totalSpending,
      averageSpending: avgSpending,
      transactionCount: spendingData.length,
      spendingByCategory: this.groupByCategory(spendingData),
      spendingByAccount: this.groupByAccount(spendingData),
      spendingByDate: this.groupByDate(spendingData, dateRange),
      topSpendingDays: this.getTopSpendingDays(spendingData),
      spendingTrends: this.calculateSpendingTrends(spendingData, dateRange)
    };

    return report;
  }

  // Gelir raporu
  async generateIncomeReport(userId, dateRange, categories, accounts, minAmount, maxAmount) {
    const startDate = this.getStartDate(dateRange);
    
    const transactions = await this.getFilteredTransactions(
      userId, 
      startDate, 
      categories, 
      accounts, 
      minAmount, 
      maxAmount,
      'income'
    );

    if (!transactions.success) throw new Error('Gelir verileri alınamadı');

    const incomeData = transactions.data;
    const totalIncome = incomeData.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const avgIncome = totalIncome / incomeData.length || 0;

    const report = {
      totalIncome,
      averageIncome: avgIncome,
      transactionCount: incomeData.length,
      incomeByCategory: this.groupByCategory(incomeData),
      incomeByAccount: this.groupByAccount(incomeData),
      incomeByDate: this.groupByDate(incomeData, dateRange),
      topIncomeDays: this.getTopIncomeDays(incomeData),
      incomeTrends: this.calculateIncomeTrends(incomeData, dateRange)
    };

    return report;
  }

  // Kategori raporu
  async generateCategoryReport(userId, dateRange, categories, minAmount, maxAmount) {
    const startDate = this.getStartDate(dateRange);
    
    const [expenseCategories, incomeCategories] = await Promise.all([
      analyticsService.getCategoryAnalysis(userId, dateRange, 'expense'),
      analyticsService.getCategoryAnalysis(userId, dateRange, 'income')
    ]);

    if (!expenseCategories.success || !incomeCategories.success) {
      throw new Error('Kategori verileri alınamadı');
    }

    const report = {
      expenseCategories: expenseCategories.data,
      incomeCategories: incomeCategories.data,
      categoryComparison: this.compareCategories(expenseCategories.data, incomeCategories.data),
      categoryTrends: await this.getCategoryTrends(userId, dateRange),
      categoryInsights: this.generateCategoryInsights(expenseCategories.data, incomeCategories.data)
    };

    return report;
  }

  // Hesap raporu
  async generateAccountReport(userId, dateRange, accounts, minAmount, maxAmount) {
    const startDate = this.getStartDate(dateRange);
    
    const accountAnalysis = await analyticsService.getAccountAnalysis(userId, dateRange);
    
    if (!accountAnalysis.success) {
      throw new Error('Hesap verileri alınamadı');
    }

    const report = {
      accounts: accountAnalysis.data,
      accountBalances: this.calculateAccountBalances(accountAnalysis.data),
      accountPerformance: this.analyzeAccountPerformance(accountAnalysis.data),
      accountInsights: this.generateAccountInsights(accountAnalysis.data)
    };

    return report;
  }

  // Trend raporu
  async generateTrendReport(userId, dateRange, categories, accounts) {
    const startDate = this.getStartDate(dateRange);
    
    const [expenseTrends, incomeTrends, categoryTrends] = await Promise.all([
      analyticsService.getTrendAnalysis(userId, dateRange, 'expense'),
      analyticsService.getTrendAnalysis(userId, dateRange, 'income'),
      this.getCategoryTrends(userId, dateRange)
    ]);

    if (!expenseTrends.success || !incomeTrends.success) {
      throw new Error('Trend verileri alınamadı');
    }

    const report = {
      expenseTrends: expenseTrends.data,
      incomeTrends: incomeTrends.data,
      categoryTrends: categoryTrends,
      trendAnalysis: this.analyzeTrends(expenseTrends.data, incomeTrends.data),
      predictions: this.generateTrendPredictions(expenseTrends.data, incomeTrends.data)
    };

    return report;
  }

  // Bütçe raporu
  async generateBudgetReport(userId, dateRange) {
    const startDate = this.getStartDate(dateRange);
    
    // Get budgets and actual spending
    const { data: budgets, error: budgetError } = await this.supabase
      .from(TABLES.BUDGETS)
      .select('*')
      .eq('user_id', userId);

    if (budgetError) throw budgetError;

    const { data: transactions, error: transactionError } = await this.supabase
      .from(TABLES.TRANSACTIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate.toISOString());

    if (transactionError) throw transactionError;

    const report = {
      budgets: budgets || [],
      actualSpending: this.calculateActualSpending(transactions || []),
      budgetVsActual: this.compareBudgetVsActual(budgets || [], transactions || []),
      budgetInsights: this.generateBudgetInsights(budgets || [], transactions || [])
    };

    return report;
  }

  // Helper methods
  getStartDate(dateRange) {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      case 'custom':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  async getFilteredTransactions(userId, startDate, categories = [], accounts = [], minAmount, maxAmount, type = null) {
    let query = this.supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        category:categories(name, icon, color),
        account:accounts(name, type)
      `)
      .eq('user_id', userId)
      .gte('date', startDate.toISOString());

    if (type) {
      query = query.eq('type', type);
    }

    if (categories.length > 0) {
      query = query.in('category_id', categories);
    }

    if (accounts.length > 0) {
      query = query.in('account_id', accounts);
    }

    if (minAmount !== undefined) {
      query = query.gte('amount', minAmount);
    }

    if (maxAmount !== undefined) {
      query = query.lte('amount', maxAmount);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  }

  analyzeTransactions(transactions) {
    const analysis = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      averageAmount: 0,
      largestTransaction: null,
      smallestTransaction: null,
      mostFrequentCategory: null,
      mostFrequentAccount: null
    };

    if (transactions.length > 0) {
      analysis.averageAmount = analysis.totalAmount / transactions.length;
      analysis.largestTransaction = transactions.reduce((max, t) => 
        parseFloat(t.amount) > parseFloat(max.amount) ? t : max
      );
      analysis.smallestTransaction = transactions.reduce((min, t) => 
        parseFloat(t.amount) < parseFloat(min.amount) ? t : min
      );

      // Most frequent category
      const categoryCounts = {};
      transactions.forEach(t => {
        const categoryName = t.category?.name || 'Bilinmeyen';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });
      analysis.mostFrequentCategory = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];

      // Most frequent account
      const accountCounts = {};
      transactions.forEach(t => {
        const accountName = t.account?.name || 'Bilinmeyen';
        accountCounts[accountName] = (accountCounts[accountName] || 0) + 1;
      });
      analysis.mostFrequentAccount = Object.entries(accountCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
    }

    return analysis;
  }

  groupByCategory(transactions) {
    const groups = {};
    transactions.forEach(t => {
      const categoryName = t.category?.name || 'Bilinmeyen';
      if (!groups[categoryName]) {
        groups[categoryName] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      groups[categoryName].total += parseFloat(t.amount);
      groups[categoryName].count += 1;
      groups[categoryName].transactions.push(t);
    });
    return groups;
  }

  groupByAccount(transactions) {
    const groups = {};
    transactions.forEach(t => {
      const accountName = t.account?.name || 'Bilinmeyen';
      if (!groups[accountName]) {
        groups[accountName] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      groups[accountName].total += parseFloat(t.amount);
      groups[accountName].count += 1;
      groups[accountName].transactions.push(t);
    });
    return groups;
  }

  groupByDate(transactions, dateRange) {
    const groups = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      let key;
      
      switch (dateRange) {
        case 'week':
          key = date.toISOString().split('T')[0];
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
      
      if (!groups[key]) {
        groups[key] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      groups[key].total += parseFloat(t.amount);
      groups[key].count += 1;
      groups[key].transactions.push(t);
    });
    return groups;
  }

  getTopSpendingDays(transactions) {
    const dailyTotals = {};
    transactions.forEach(t => {
      const date = new Date(t.date).toISOString().split('T')[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + parseFloat(t.amount);
    });
    
    return Object.entries(dailyTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([date, amount]) => ({ date, amount }));
  }

  getTopIncomeDays(transactions) {
    const dailyTotals = {};
    transactions.forEach(t => {
      const date = new Date(t.date).toISOString().split('T')[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + parseFloat(t.amount);
    });
    
    return Object.entries(dailyTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([date, amount]) => ({ date, amount }));
  }

  calculateSpendingTrends(transactions, dateRange) {
    // Implementation for spending trends calculation
    return [];
  }

  calculateIncomeTrends(transactions, dateRange) {
    // Implementation for income trends calculation
    return [];
  }

  async getCategoryTrends(userId, dateRange) {
    // Implementation for category trends
    return [];
  }

  compareCategories(expenseCategories, incomeCategories) {
    // Implementation for category comparison
    return [];
  }

  generateCategoryInsights(expenseCategories, incomeCategories) {
    // Implementation for category insights
    return [];
  }

  calculateAccountBalances(accounts) {
    // Implementation for account balance calculation
    return [];
  }

  analyzeAccountPerformance(accounts) {
    // Implementation for account performance analysis
    return [];
  }

  generateAccountInsights(accounts) {
    // Implementation for account insights
    return [];
  }

  analyzeTrends(expenseTrends, incomeTrends) {
    // Implementation for trend analysis
    return [];
  }

  generateTrendPredictions(expenseTrends, incomeTrends) {
    // Implementation for trend predictions
    return [];
  }

  calculateActualSpending(transactions) {
    // Implementation for actual spending calculation
    return [];
  }

  compareBudgetVsActual(budgets, transactions) {
    // Implementation for budget vs actual comparison
    return [];
  }

  generateBudgetInsights(budgets, transactions) {
    // Implementation for budget insights
    return [];
  }

  generateRecommendations(summary, categories) {
    const recommendations = [];
    
    if (summary) {
      if (summary.savingsRate < 20) {
        recommendations.push({
          type: 'warning',
          title: 'Tasarruf Oranınızı Artırın',
          description: 'Tasarruf oranınız %20\'nin altında. Harcamalarınızı gözden geçirin.',
          priority: 'high'
        });
      }
      
      if (summary.net < 0) {
        recommendations.push({
          type: 'danger',
          title: 'Gelir-Gider Dengesi',
          description: 'Giderleriniz gelirlerinizi aşıyor. Acil önlem alın.',
          priority: 'critical'
        });
      }
    }

    if (categories && categories.length > 0) {
      const topCategory = categories[0];
      const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);
      const percentage = (topCategory.amount / totalExpenses) * 100;
      
      if (percentage > 40) {
        recommendations.push({
          type: 'warning',
          title: 'Kategori Çeşitliliği',
          description: `${topCategory.name} kategorisinde çok fazla harcama yapıyorsunuz.`,
          priority: 'medium'
        });
      }
    }

    return recommendations;
  }

  formatReport(reportData, format) {
    switch (format) {
      case 'json':
        return JSON.stringify(reportData, null, 2);
      case 'csv':
        return this.convertToCSV(reportData);
      case 'html':
        return this.convertToHTML(reportData);
      case 'pdf':
        return this.convertToPDF(reportData);
      default:
        return reportData;
    }
  }

  convertToCSV(data) {
    // Implementation for CSV conversion
    return '';
  }

  convertToHTML(data) {
    // Implementation for HTML conversion
    return '';
  }

  convertToPDF(data) {
    // Implementation for PDF conversion
    return '';
  }

  // Get available report types
  getAvailableReportTypes() {
    return [
      { id: 'comprehensive', name: 'Kapsamlı Rapor', description: 'Tüm finansal verileri içeren detaylı rapor' },
      { id: 'spending', name: 'Harcama Raporu', description: 'Sadece harcamaları analiz eden rapor' },
      { id: 'income', name: 'Gelir Raporu', description: 'Sadece gelirleri analiz eden rapor' },
      { id: 'category', name: 'Kategori Raporu', description: 'Kategori bazında analiz raporu' },
      { id: 'account', name: 'Hesap Raporu', description: 'Hesap bazında analiz raporu' },
      { id: 'trend', name: 'Trend Raporu', description: 'Zaman bazında trend analizi' },
      { id: 'budget', name: 'Bütçe Raporu', description: 'Bütçe karşılaştırma raporu' }
    ];
  }

  // Get available date ranges
  getAvailableDateRanges() {
    return [
      { id: 'week', name: 'Son Hafta', days: 7 },
      { id: 'month', name: 'Bu Ay', days: 30 },
      { id: 'quarter', name: 'Bu Çeyrek', days: 90 },
      { id: 'year', name: 'Bu Yıl', days: 365 },
      { id: 'custom', name: 'Özel', days: 30 }
    ];
  }

  // Get available export formats
  getAvailableFormats() {
    return [
      { id: 'json', name: 'JSON', extension: '.json' },
      { id: 'csv', name: 'CSV', extension: '.csv' },
      { id: 'html', name: 'HTML', extension: '.html' },
      { id: 'pdf', name: 'PDF', extension: '.pdf' }
    ];
  }
}

export default new ReportService();
