// FinanceFlow - Investment Service
import { supabase, TABLES } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';

// Tablo isimleri (fallback için)
const FALLBACK_TABLES = {
  INVESTMENTS: 'investments',
  TRANSACTIONS: 'transactions',
  USERS: 'users'
};

class InvestmentService {
  constructor() {
    this.supabase = supabase;
    this.investmentCache = new Map();
    this.portfolioCache = new Map();
    this.realTimeCallbacks = new Map();
    this.alertCallbacks = new Map();
    // this.setupNetworkMonitoring(); // Geçici olarak devre dışı
  }

  // Network monitoring setup - Geçici olarak devre dışı
  setupNetworkMonitoring() {
    // NetInfo.addEventListener(state => {
    //   if (state.isConnected && state.isInternetReachable) {
    //     this.syncInvestmentData();
    //   }
    // });
  }

  // Real-time investment tracking setup
  setupRealTimeInvestmentTracking(userId, callback) {
    if (!userId) return null;

    // Clean up existing subscription
    if (this.realTimeCallbacks.has(userId)) {
      this.cleanupRealTimeTracking(userId);
    }

    // Store callback
    this.realTimeCallbacks.set(userId, callback);

    // Setup subscription for investment changes
    const subscription = this.supabase
      .channel(`investment_tracking_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments', // Assuming investments table exists
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleInvestmentUpdate(userId, payload);
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

  // Handle investment updates
  handleInvestmentUpdate(userId, payload) {
    const callback = this.realTimeCallbacks.get(userId);
    if (callback) {
      // Invalidate cache for affected investment
      this.investmentCache.delete(payload.new?.id || payload.old?.id);
      this.portfolioCache.delete(userId);
      
      // Notify callback
      callback({
        type: 'investment_update',
        investment: payload.new || payload.old,
        eventType: payload.eventType
      });
    }
  }

  // Handle transaction updates that affect investments
  handleTransactionUpdate(userId, payload) {
    const transaction = payload.new || payload.old;
    if (transaction?.type === 'investment') {
      // Invalidate portfolio cache
      this.portfolioCache.delete(userId);
      
      const callback = this.realTimeCallbacks.get(userId);
      if (callback) {
        callback({
          type: 'transaction_update',
          transaction,
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

  // Yatırım portföyünü getir
  async getInvestmentPortfolio(userId) {
    try {
      // Check cache first
      if (this.portfolioCache.has(userId)) {
        const cached = this.portfolioCache.get(userId);
        const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
        
        // Use cache if less than 10 minutes old
        if (cacheAge < 10 * 60 * 1000) {
          return { success: true, data: cached.data, fromCache: true };
        }
      }

      // Get investment transactions
      const { data: transactions, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'investment')
        .order('date', { ascending: false });

      if (error) throw error;

      // Group by investment symbol/name
      const portfolioMap = new Map();
      
      transactions.forEach(transaction => {
        const symbol = transaction.investment_symbol || transaction.description || 'Unknown';
        const amount = parseFloat(transaction.amount);
        const shares = parseFloat(transaction.shares || 1);
        const pricePerShare = shares > 0 ? amount / shares : amount;
        
        if (portfolioMap.has(symbol)) {
          const existing = portfolioMap.get(symbol);
          existing.totalInvested += amount;
          existing.totalShares += shares;
          existing.transactions.push(transaction);
          existing.averagePrice = existing.totalInvested / existing.totalShares;
        } else {
          portfolioMap.set(symbol, {
            symbol,
            totalInvested: amount,
            totalShares: shares,
            averagePrice: pricePerShare,
            currentPrice: pricePerShare, // Would be updated from market data
            transactions: [transaction],
            lastUpdated: transaction.date
          });
        }
      });

      // Convert to array and calculate metrics
      const portfolio = Array.from(portfolioMap.values()).map(investment => {
        const currentValue = investment.totalShares * investment.currentPrice;
        const gainLoss = currentValue - investment.totalInvested;
        const gainLossPercentage = investment.totalInvested > 0 
          ? (gainLoss / investment.totalInvested) * 100 
          : 0;

        return {
          ...investment,
          currentValue,
          gainLoss,
          gainLossPercentage,
          weight: 0 // Will be calculated after total portfolio value
        };
      });

      // Calculate portfolio totals
      const totalPortfolioValue = portfolio.reduce((sum, inv) => sum + inv.currentValue, 0);
      const totalInvested = portfolio.reduce((sum, inv) => sum + inv.totalInvested, 0);
      const totalGainLoss = totalPortfolioValue - totalInvested;
      const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

      // Update weights
      portfolio.forEach(investment => {
        investment.weight = totalPortfolioValue > 0 
          ? (investment.currentValue / totalPortfolioValue) * 100 
          : 0;
      });

      const portfolioData = {
        investments: portfolio,
        summary: {
          totalValue: totalPortfolioValue,
          totalInvested,
          totalGainLoss,
          totalGainLossPercentage,
          investmentCount: portfolio.length,
          lastUpdated: new Date().toISOString()
        }
      };

      // Update cache
      this.portfolioCache.set(userId, {
        data: portfolioData,
        lastUpdated: new Date().toISOString()
      });

      return { success: true, data: portfolioData };
    } catch (error) {
      console.error('Get investment portfolio error:', error);
      return { success: false, error: 'Yatırım portföyü alınamadı' };
    }
  }

  // Yatırım işlemi kaydet
  async recordInvestmentTransaction(userId, transactionData) {
    try {
      const {
        symbol,
        amount,
        shares,
        pricePerShare,
        transactionType, // 'buy' or 'sell'
        description,
        date,
        accountId
      } = transactionData;

      // Create investment transaction
      const { data: transaction, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .insert([{
          user_id: userId,
          account_id: accountId,
          type: 'investment',
          amount: transactionType === 'buy' ? -Math.abs(amount) : Math.abs(amount),
          description: description || `${transactionType.toUpperCase()} ${shares} shares of ${symbol}`,
          date: date || new Date().toISOString(),
          investment_symbol: symbol,
          shares: transactionType === 'buy' ? shares : -shares,
          price_per_share: pricePerShare,
          investment_type: transactionType,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update account balance if provided
      if (accountId) {
        await this.updateAccountForInvestment(accountId, amount, transactionType);
      }

      // Invalidate cache
      this.portfolioCache.delete(userId);

      return { success: true, data: transaction };
    } catch (error) {
      console.error('Record investment transaction error:', error);
      return { success: false, error: 'Yatırım işlemi kaydedilemedi' };
    }
  }

  // Hesap bakiyesini yatırım işlemi için güncelle
  async updateAccountForInvestment(accountId, amount, transactionType) {
    try {
      const { data: account, error: accountError } = await this.supabase
        .from(TABLES.ACCOUNTS)
        .select('balance')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;

      const currentBalance = parseFloat(account.balance);
      const newBalance = transactionType === 'buy' 
        ? currentBalance - amount 
        : currentBalance + amount;

      const { error: updateError } = await this.supabase
        .from(TABLES.ACCOUNTS)
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (updateError) throw updateError;

      return { success: true, newBalance };
    } catch (error) {
      console.error('Update account for investment error:', error);
      return { success: false, error: 'Hesap bakiyesi güncellenemedi' };
    }
  }

  // Yatırım performans analizi
  async getInvestmentPerformanceAnalysis(userId, period = 'year') {
    try {
      const portfolioResult = await this.getInvestmentPortfolio(userId);
      if (!portfolioResult.success) {
        throw new Error(portfolioResult.error);
      }

      const { investments, summary } = portfolioResult.data;
      
      // Analyze performance by period
      const startDate = this.getStartDate(period);
      const { data: periodTransactions, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'investment')
        .gte('date', startDate.toISOString());

      if (error) throw error;

      const periodInvested = periodTransactions.reduce((sum, t) => {
        return t.investment_type === 'buy' ? sum + Math.abs(parseFloat(t.amount)) : sum;
      }, 0);

      const periodSold = periodTransactions.reduce((sum, t) => {
        return t.investment_type === 'sell' ? sum + Math.abs(parseFloat(t.amount)) : sum;
      }, 0);

      // Performance metrics
      const bestPerformer = investments.reduce((best, inv) => 
        inv.gainLossPercentage > (best?.gainLossPercentage || -Infinity) ? inv : best, null);
      
      const worstPerformer = investments.reduce((worst, inv) => 
        inv.gainLossPercentage < (worst?.gainLossPercentage || Infinity) ? inv : worst, null);

      const analysis = {
        summary,
        period: {
          invested: periodInvested,
          sold: periodSold,
          netInvestment: periodInvested - periodSold
        },
        performance: {
          bestPerformer,
          worstPerformer,
          profitableInvestments: investments.filter(inv => inv.gainLoss > 0).length,
          losingInvestments: investments.filter(inv => inv.gainLoss < 0).length,
          breakEvenInvestments: investments.filter(inv => Math.abs(inv.gainLoss) < 0.01).length
        },
        diversification: {
          investmentCount: investments.length,
          concentrationRisk: Math.max(...investments.map(inv => inv.weight)),
          averageInvestmentSize: investments.length > 0 ? summary.totalValue / investments.length : 0
        }
      };

      return { success: true, data: analysis };
    } catch (error) {
      console.error('Get investment performance analysis error:', error);
      return { success: false, error: 'Yatırım performans analizi yapılamadı' };
    }
  }

  // Yatırım önerileri
  async getInvestmentRecommendations(userId) {
    try {
      const analysisResult = await this.getInvestmentPerformanceAnalysis(userId);
      if (!analysisResult.success) {
        throw new Error(analysisResult.error);
      }

      const { summary, diversification, performance } = analysisResult.data;
      const recommendations = [];

      // Diversification recommendations
      if (diversification.investmentCount < 3) {
        recommendations.push({
          type: 'info',
          title: 'Çeşitlendirme Önerisi',
          description: 'Portföyünüzü çeşitlendirmek için farklı sektörlerden yatırımlar eklemeyi düşünün.',
          priority: 'medium'
        });
      }

      // Concentration risk
      if (diversification.concentrationRisk > 50) {
        recommendations.push({
          type: 'warning',
          title: 'Konsantrasyon Riski',
          description: `Portföyünüzün %${diversification.concentrationRisk.toFixed(1)}'i tek yatırımda. Risk dağıtımı yapın.`,
          priority: 'high'
        });
      }

      // Performance-based recommendations
      if (summary.totalGainLossPercentage < -10) {
        recommendations.push({
          type: 'warning',
          title: 'Portföy Performansı',
          description: `Portföyünüz %${Math.abs(summary.totalGainLossPercentage).toFixed(1)} değer kaybetti. Stratejinizi gözden geçirin.`,
          priority: 'high'
        });
      } else if (summary.totalGainLossPercentage > 20) {
        recommendations.push({
          type: 'success',
          title: 'Mükemmel Performans',
          description: `Portföyünüz %${summary.totalGainLossPercentage.toFixed(1)} kazandırdı. Harika performans!`,
          priority: 'low'
        });
      }

      // Rebalancing recommendation
      if (performance.losingInvestments > performance.profitableInvestments) {
        recommendations.push({
          type: 'info',
          title: 'Portföy Yeniden Dengeleme',
          description: 'Zarar eden yatırımların sayısı fazla. Portföyünüzü yeniden dengelemeyi düşünün.',
          priority: 'medium'
        });
      }

      // Risk management
      if (summary.totalValue > summary.totalInvested * 2) {
        recommendations.push({
          type: 'info',
          title: 'Kar Realizasyonu',
          description: 'Önemli kazançlarınız var. Kısmi kar realizasyonu düşünebilirsiniz.',
          priority: 'low'
        });
      }

      return { success: true, data: recommendations };
    } catch (error) {
      console.error('Get investment recommendations error:', error);
      return { success: false, error: 'Yatırım önerileri alınamadı' };
    }
  }

  // Yatırım geçmişi
  async getInvestmentHistory(userId, symbol = null, period = 'year') {
    try {
      const startDate = this.getStartDate(period);
      
      let query = this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'investment')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false });

      if (symbol) {
        query = query.eq('investment_symbol', symbol);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      // Group by month for trend analysis
      const monthlyData = {};
      transactions.forEach(transaction => {
        const month = transaction.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = {
            invested: 0,
            sold: 0,
            transactions: []
          };
        }

        const amount = Math.abs(parseFloat(transaction.amount));
        if (transaction.investment_type === 'buy') {
          monthlyData[month].invested += amount;
        } else {
          monthlyData[month].sold += amount;
        }
        monthlyData[month].transactions.push(transaction);
      });

      return { 
        success: true, 
        data: { 
          transactions, 
          monthlyData,
          period,
          symbol 
        } 
      };
    } catch (error) {
      console.error('Get investment history error:', error);
      return { success: false, error: 'Yatırım geçmişi alınamadı' };
    }
  }

  // Mock price update (in real app, this would fetch from market data API)
  async updateInvestmentPrices(userId) {
    try {
      const portfolioResult = await this.getInvestmentPortfolio(userId);
      if (!portfolioResult.success) {
        throw new Error(portfolioResult.error);
      }

      // Mock price changes for demonstration
      const priceChanges = portfolioResult.data.investments.map(investment => {
        const randomChange = (Math.random() - 0.5) * 0.1; // ±5% random change
        const newPrice = investment.currentPrice * (1 + randomChange);
        
        return {
          symbol: investment.symbol,
          oldPrice: investment.currentPrice,
          newPrice,
          changePercentage: randomChange * 100
        };
      });

      // In a real app, you would save these prices to database
      console.log('Mock price updates:', priceChanges);

      // Invalidate cache to force recalculation
      this.portfolioCache.delete(userId);

      return { success: true, data: priceChanges };
    } catch (error) {
      console.error('Update investment prices error:', error);
      return { success: false, error: 'Yatırım fiyatları güncellenemedi' };
    }
  }

  // Helper methods
  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      case 'all':
        return new Date(2020, 0, 1); // Start from 2020
      default:
        return new Date(now.getFullYear(), 0, 1);
    }
  }

  // Setup investment alert callbacks
  setupInvestmentAlerts(userId, callback) {
    this.alertCallbacks.set(userId, callback);
  }

  // Cleanup investment alerts
  cleanupInvestmentAlerts(userId) {
    this.alertCallbacks.delete(userId);
  }

  // Sync investment data
  async syncInvestmentData() {
    try {
      // Clear caches to force fresh data
      this.investmentCache.clear();
      this.portfolioCache.clear();
      
      console.log('Investment data synced');
    } catch (error) {
      console.error('Sync investment data error:', error);
    }
  }

  // Yatırım kategorileri
  getInvestmentCategories() {
    return [
      { id: 'stocks', name: 'Hisse Senetleri', icon: 'trending-up', color: '#4CAF50' },
      { id: 'bonds', name: 'Tahviller', icon: 'account-balance', color: '#2196F3' },
      { id: 'etf', name: 'ETF', icon: 'pie-chart', color: '#FF9800' },
      { id: 'mutual_funds', name: 'Yatırım Fonları', icon: 'business', color: '#9C27B0' },
      { id: 'crypto', name: 'Kripto Para', icon: 'currency-bitcoin', color: '#FF5722' },
      { id: 'commodities', name: 'Emtialar', icon: 'local-grocery-store', color: '#795548' },
      { id: 'real_estate', name: 'Gayrimenkul', icon: 'home', color: '#607D8B' },
      { id: 'forex', name: 'Döviz', icon: 'swap-horiz', color: '#FFC107' }
    ];
  }

  // Yatırım şablonları
  getInvestmentTemplates() {
    return [
      {
        id: 'conservative',
        name: 'Muhafazakar Portföy',
        description: 'Düşük risk, istikrarlı getiri',
        allocation: {
          bonds: 60,
          stocks: 30,
          commodities: 10
        },
        riskLevel: 'low',
        expectedReturn: '5-8%'
      },
      {
        id: 'balanced',
        name: 'Dengeli Portföy',
        description: 'Orta risk, dengeli getiri',
        allocation: {
          stocks: 50,
          bonds: 30,
          etf: 15,
          commodities: 5
        },
        riskLevel: 'medium',
        expectedReturn: '8-12%'
      },
      {
        id: 'aggressive',
        name: 'Agresif Portföy',
        description: 'Yüksek risk, yüksek getiri potansiyeli',
        allocation: {
          stocks: 70,
          etf: 20,
          crypto: 5,
          commodities: 5
        },
        riskLevel: 'high',
        expectedReturn: '12-20%'
      }
    ];
  }
}

export default new InvestmentService();
