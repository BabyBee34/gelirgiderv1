// FinanceFlow - Credit Card Service
import { supabase, TABLES } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';

// Tablo isimleri (fallback için)
const FALLBACK_TABLES = {
  CARDS: 'credit_cards',
  TRANSACTIONS: 'transactions',
  USERS: 'users'
};

class CreditCardService {
  constructor() {
    this.supabase = supabase;
    this.cardCache = new Map();
    this.utilizationCache = new Map();
    this.realTimeCallbacks = new Map();
    this.alertCallbacks = new Map();
    // this.setupNetworkMonitoring(); // Geçici olarak devre dışı
  }

  // Network monitoring setup - Geçici olarak devre dışı
  setupNetworkMonitoring() {
    // NetInfo.addEventListener(state => {
    //   if (state.isConnected && state.isInternetReachable) {
    //     this.syncCreditCardData();
    //   }
    // });
  }

  // Real-time credit card tracking setup
  setupRealTimeCreditCardTracking(userId, callback) {
    if (!userId) return null;

    // Clean up existing subscription
    if (this.realTimeCallbacks.has(userId)) {
      this.cleanupRealTimeTracking(userId);
    }

    // Store callback
    this.realTimeCallbacks.set(userId, callback);

    // Setup subscription for card and transaction changes
    const subscription = this.supabase
      .channel(`credit_card_tracking_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.CARDS,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleCardUpdate(userId, payload);
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

  // Handle card updates
  handleCardUpdate(userId, payload) {
    const callback = this.realTimeCallbacks.get(userId);
    if (callback) {
      // Invalidate cache for affected card
      this.cardCache.delete(payload.new?.id || payload.old?.id);
      
      // Notify callback
      callback({
        type: 'card_update',
        card: payload.new || payload.old,
        eventType: payload.eventType
      });
    }
  }

  // Handle transaction updates that affect credit cards
  handleTransactionUpdate(userId, payload) {
    const transaction = payload.new || payload.old;
    if (transaction?.card_id) {
      // Invalidate utilization cache for affected card
      this.utilizationCache.delete(transaction.card_id);
      
      // Check credit card alerts
      this.checkCreditCardAlerts(userId, transaction.card_id);
      
      const callback = this.realTimeCallbacks.get(userId);
      if (callback) {
        callback({
          type: 'transaction_update',
          transaction,
          cardId: transaction.card_id,
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

  // Tüm kredi kartlarını getir
  async getCreditCards(userId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CARDS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update card cache and calculate metrics
      if (data) {
        const cardsWithMetrics = [];
        for (const card of data) {
          const metrics = await this.calculateCardMetrics(card);
          const cardWithMetrics = {
            ...card,
            ...metrics,
            lastUpdated: new Date().toISOString()
          };
          
          this.cardCache.set(card.id, cardWithMetrics);
          cardsWithMetrics.push(cardWithMetrics);
        }
        return { success: true, data: cardsWithMetrics };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Get credit cards error:', error);
      return { success: false, error: 'Kredi Kartı Getirme Hatası' };
    }
  }

  // Tek kredi kartını getir
  async getCreditCard(cardId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CARDS)
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;
      
      // Calculate metrics
      const metrics = await this.calculateCardMetrics(data);
      const cardWithMetrics = { ...data, ...metrics };
      
      // Update cache
      this.cardCache.set(cardId, cardWithMetrics);
      
      return { success: true, data: cardWithMetrics };
    } catch (error) {
      console.error('Get credit card error:', error);
      return { success: false, error: 'Kredi Kartı Getirme Hatası' };
    }
  }

  // Kredi kartı metriklerini hesapla
  async calculateCardMetrics(card) {
    try {
      const creditLimit = parseFloat(card.credit_limit || 0);
      const currentBalance = parseFloat(card.current_balance || 0);
      const minimumPayment = parseFloat(card.minimum_payment || 0);
      
      // Basic calculations
      const availableCredit = Math.max(creditLimit - currentBalance, 0);
      const utilizationRate = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
      
      // Get recent transactions for spending analysis
      const { data: transactions, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .select('amount, date, type')
        .eq('card_id', card.id)
        .gte('date', this.getLastMonthDate().toISOString())
        .order('date', { ascending: false });

      if (error) {
        console.error('Get card transactions error:', error);
      }

      // Calculate spending metrics
      const monthlySpending = transactions ? 
        transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) : 0;

      const monthlyPayments = transactions ? 
        transactions
          .filter(t => t.type === 'payment')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) : 0;

      // Status determination
      let status = 'good';
      if (utilizationRate >= 90) {
        status = 'critical';
      } else if (utilizationRate >= 70) {
        status = 'warning';
      } else if (utilizationRate >= 50) {
        status = 'caution';
      }

      // Payment due analysis
      const dueDate = card.due_date ? new Date(card.due_date) : null;
      const daysUntilDue = dueDate ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
      
      let paymentStatus = 'current';
      if (daysUntilDue < 0) {
        paymentStatus = 'overdue';
      } else if (daysUntilDue <= 3) {
        paymentStatus = 'due_soon';
      } else if (daysUntilDue <= 7) {
        paymentStatus = 'upcoming';
      }

      // Interest calculation (simplified)
      const annualInterestRate = parseFloat(card.interest_rate || 0) / 100;
      const monthlyInterestRate = annualInterestRate / 12;
      const potentialInterest = currentBalance * monthlyInterestRate;

      return {
        availableCredit,
        utilizationRate: Math.min(utilizationRate, 100),
        status,
        monthlySpending,
        monthlyPayments,
        daysUntilDue,
        paymentStatus,
        potentialInterest,
        isOverLimit: currentBalance > creditLimit,
        transactionCount: transactions ? transactions.length : 0
      };
    } catch (error) {
      console.error('Calculate card metrics error:', error);
      return {
        availableCredit: 0,
        utilizationRate: 0,
        status: 'unknown',
        monthlySpending: 0,
        monthlyPayments: 0,
        daysUntilDue: 0,
        paymentStatus: 'unknown',
        potentialInterest: 0,
        isOverLimit: false,
        transactionCount: 0
      };
    }
  }

  // Kredi kartı kullanım analizi
  async getCreditCardUsageAnalysis(userId, period = 'month') {
    try {
      const cardsResult = await this.getCreditCards(userId);
      if (!cardsResult.success) {
        throw new Error(cardsResult.error);
      }

      const cards = cardsResult.data;
      const totalCreditLimit = cards.reduce((sum, c) => sum + parseFloat(c.credit_limit || 0), 0);
      const totalCurrentBalance = cards.reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0);
      const totalAvailableCredit = cards.reduce((sum, c) => sum + c.availableCredit, 0);
      
      const overallUtilizationRate = totalCreditLimit > 0 ? (totalCurrentBalance / totalCreditLimit) * 100 : 0;
      
      const cardsByStatus = {
        good: cards.filter(c => c.status === 'good'),
        caution: cards.filter(c => c.status === 'caution'),
        warning: cards.filter(c => c.status === 'warning'),
        critical: cards.filter(c => c.status === 'critical')
      };

      const paymentAlerts = cards.filter(c => 
        c.paymentStatus === 'overdue' || c.paymentStatus === 'due_soon'
      );

      const analysis = {
        totalCards: cards.length,
        totalCreditLimit,
        totalCurrentBalance,
        totalAvailableCredit,
        overallUtilizationRate,
        cardsByStatus,
        paymentAlerts,
        highUtilizationCards: cards.filter(c => c.utilizationRate > 70),
        overlimitCards: cards.filter(c => c.isOverLimit),
        totalMonthlySpending: cards.reduce((sum, c) => sum + c.monthlySpending, 0),
        totalMonthlyPayments: cards.reduce((sum, c) => sum + c.monthlyPayments, 0),
        averageUtilization: cards.length > 0 ? 
          cards.reduce((sum, c) => sum + c.utilizationRate, 0) / cards.length : 0
      };

      return { success: true, data: analysis };
    } catch (error) {
      console.error('Get credit card usage analysis error:', error);
      return { success: false, error: 'Kredi kartı kullanım analizi yapılamadı' };
    }
  }

  // Kredi kartı uyarılarını kontrol et
  async checkCreditCardAlerts(userId, cardId) {
    try {
      // Get card details
      const cardResult = await this.getCreditCard(cardId);
      if (!cardResult.success) return;

      const card = cardResult.data;
      const alerts = [];

      // High utilization alert
      if (card.utilizationRate >= 90) {
        alerts.push({
          type: 'high_utilization',
          title: 'Yüksek Kredi Kartı Kullanımı',
          message: `${card.card_name || 'Kredi kartınız'} %${card.utilizationRate.toFixed(1)} oranında kullanılmış. Limit aşımına dikkat edin.`,
          priority: 'critical',
          cardId,
          utilizationRate: card.utilizationRate
        });
      } else if (card.utilizationRate >= 70) {
        alerts.push({
          type: 'utilization_warning',
          title: 'Kredi Kartı Kullanım Uyarısı',
          message: `${card.card_name || 'Kredi kartınız'} %${card.utilizationRate.toFixed(1)} oranında kullanılmış.`,
          priority: 'high',
          cardId,
          utilizationRate: card.utilizationRate
        });
      }

      // Over limit alert
      if (card.isOverLimit) {
        alerts.push({
          type: 'over_limit',
          title: 'Kredi Limiti Aşıldı!',
          message: `${card.card_name || 'Kredi kartınız'} limitini aştı. Ekstra ücretlerden kaçınmak için ödeme yapın.`,
          priority: 'critical',
          cardId
        });
      }

      // Payment due alerts
      if (card.paymentStatus === 'overdue') {
        alerts.push({
          type: 'payment_overdue',
          title: 'Gecikmiş Ödeme',
          message: `${card.card_name || 'Kredi kartınız'} ödemesi gecikti. Hemen ödeme yapın.`,
          priority: 'critical',
          cardId,
          daysOverdue: Math.abs(card.daysUntilDue)
        });
      } else if (card.paymentStatus === 'due_soon') {
        alerts.push({
          type: 'payment_due_soon',
          title: 'Ödeme Tarihi Yaklaşıyor',
          message: `${card.card_name || 'Kredi kartınız'} ödemesi ${card.daysUntilDue} gün içinde.`,
          priority: 'high',
          cardId,
          daysUntilDue: card.daysUntilDue
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
      console.error('Check credit card alerts error:', error);
      return [];
    }
  }

  // Kredi kartı ödemesi kaydet
  async recordPayment(cardId, amount, paymentDate = null) {
    try {
      const paymentDateStr = paymentDate || new Date().toISOString();
      
      // Get current card details
      const cardResult = await this.getCreditCard(cardId);
      if (!cardResult.success) {
        throw new Error(cardResult.error);
      }

      const card = cardResult.data;
      const newBalance = Math.max(parseFloat(card.current_balance) - parseFloat(amount), 0);
      
      // Update card balance
      const { error: updateError } = await this.supabase
        .from(TABLES.CARDS)
        .update({ 
          current_balance: newBalance,
          last_payment_date: paymentDateStr,
          last_payment_amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Create payment transaction record
      const { data: transaction, error: transactionError } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .insert([{
          user_id: card.user_id,
          card_id: cardId,
          type: 'payment',
          amount: amount,
          description: `Kredi kartı ödemesi - ${card.card_name || 'Card'}`,
          date: paymentDateStr,
          category_id: null, // Payment category could be added
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Invalidate cache
      this.cardCache.delete(cardId);
      this.utilizationCache.delete(cardId);

      return { 
        success: true, 
        data: { 
          newBalance, 
          transaction,
          paymentAmount: amount 
        } 
      };
    } catch (error) {
      console.error('Record payment error:', error);
      return { success: false, error: 'Ödeme kaydedilemedi' };
    }
  }

  // Kredi kartı harcaması kaydet
  async recordExpense(cardId, amount, description, categoryId = null) {
    try {
      // Get current card details
      const cardResult = await this.getCreditCard(cardId);
      if (!cardResult.success) {
        throw new Error(cardResult.error);
      }

      const card = cardResult.data;
      const newBalance = parseFloat(card.current_balance) + parseFloat(amount);
      
      // Check if it would exceed credit limit
      const creditLimit = parseFloat(card.credit_limit || 0);
      if (newBalance > creditLimit) {
        return { 
          success: false, 
          error: `Bu harcama kredi limitinizi (${creditLimit.toFixed(2)} TL) aşacak.` 
        };
      }

      // Update card balance
      const { error: updateError } = await this.supabase
        .from(TABLES.CARDS)
        .update({ 
          current_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Create expense transaction record
      const { data: transaction, error: transactionError } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .insert([{
          user_id: card.user_id,
          card_id: cardId,
          type: 'expense',
          amount: amount,
          description: description,
          date: new Date().toISOString(),
          category_id: categoryId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Invalidate cache
      this.cardCache.delete(cardId);
      this.utilizationCache.delete(cardId);

      // Check for alerts
      this.checkCreditCardAlerts(card.user_id, cardId);

      return { 
        success: true, 
        data: { 
          newBalance, 
          transaction,
          expenseAmount: amount 
        } 
      };
    } catch (error) {
      console.error('Record expense error:', error);
      return { success: false, error: 'Harcama kaydedilemedi' };
    }
  }

  // Kredi kartı önerileri
  async getCreditCardRecommendations(userId) {
    try {
      const analysisResult = await this.getCreditCardUsageAnalysis(userId);
      if (!analysisResult.success) {
        throw new Error(analysisResult.error);
      }

      const { 
        overallUtilizationRate, 
        highUtilizationCards, 
        paymentAlerts,
        overlimitCards 
      } = analysisResult.data;
      
      const recommendations = [];

      // High utilization recommendations
      if (overallUtilizationRate > 70) {
        recommendations.push({
          type: 'warning',
          title: 'Yüksek Kredi Kullanımı',
          description: `Genel kredi kullanım oranınız %${overallUtilizationRate.toFixed(1)}. Bu oranı %30'un altına indirmeye çalışın.`,
          priority: 'high',
          action: 'Ödeme yapın veya harcamalarınızı azaltın'
        });
      }

      // Individual card recommendations
      highUtilizationCards.forEach(card => {
        recommendations.push({
          type: 'warning',
          title: `${card.card_name || 'Kredi Kartı'} Yüksek Kullanım`,
          description: `Bu kartın kullanım oranı %${card.utilizationRate.toFixed(1)}. Ödeme yapmanız önerilir.`,
          priority: 'medium',
          cardId: card.id
        });
      });

      // Payment alerts
      paymentAlerts.forEach(card => {
        const priority = card.paymentStatus === 'overdue' ? 'critical' : 'high';
        recommendations.push({
          type: 'payment',
          title: 'Ödeme Gerekli',
          description: card.paymentStatus === 'overdue' 
            ? `${card.card_name || 'Kredi kartı'} ödemesi gecikti.`
            : `${card.card_name || 'Kredi kartı'} ödemesi yaklaşıyor.`,
          priority,
          cardId: card.id,
          minimumPayment: card.minimum_payment
        });
      });

      // Over limit recommendations
      overlimitCards.forEach(card => {
        recommendations.push({
          type: 'critical',
          title: 'Limit Aşımı',
          description: `${card.card_name || 'Kredi kartı'} limitini aştı. Ekstra ücretlerden kaçınmak için hemen ödeme yapın.`,
          priority: 'critical',
          cardId: card.id
        });
      });

      // Good practices
      if (overallUtilizationRate < 30) {
        recommendations.push({
          type: 'success',
          title: 'Mükemmel Kredi Kullanımı',
          description: `Kredi kullanım oranınız %${overallUtilizationRate.toFixed(1)}. Bu harika bir oran!`,
          priority: 'low'
        });
      }

      return { success: true, data: recommendations };
    } catch (error) {
      console.error('Get credit card recommendations error:', error);
      return { success: false, error: 'Kredi kartı önerileri alınamadı' };
    }
  }

  // Helper methods
  getLastMonthDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  }

  // Setup credit card alert callbacks
  setupCreditCardAlerts(userId, callback) {
    this.alertCallbacks.set(userId, callback);
  }

  // Cleanup credit card alerts
  cleanupCreditCardAlerts(userId) {
    this.alertCallbacks.delete(userId);
  }

  // Sync credit card data
  async syncCreditCardData() {
    try {
      // Clear caches to force fresh data
      this.cardCache.clear();
      this.utilizationCache.clear();
      
      console.log('Credit card data synced');
    } catch (error) {
      console.error('Sync credit card data error:', error);
    }
  }

  // Yeni kredi kartı oluştur
  async createCreditCard(cardData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CARDS)
        .insert([{
          ...cardData,
          current_balance: cardData.current_balance || 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Calculate initial metrics
      const metrics = await this.calculateCardMetrics(data);
      const cardWithMetrics = { ...data, ...metrics };
      
      // Update cache
      this.cardCache.set(data.id, cardWithMetrics);
      
      return { success: true, data: cardWithMetrics };
    } catch (error) {
      console.error('Create credit card error:', error);
      return { success: false, error: 'Kredi Kartı Oluşturma Hatası' };
    }
  }

  // Kredi kartı güncelle
  async updateCreditCard(cardId, updates) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CARDS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      
      // Recalculate metrics
      const metrics = await this.calculateCardMetrics(data);
      const cardWithMetrics = { ...data, ...metrics };
      
      // Update cache
      this.cardCache.set(cardId, cardWithMetrics);
      
      return { success: true, data: cardWithMetrics };
    } catch (error) {
      console.error('Update credit card error:', error);
      return { success: false, error: 'Kredi Kartı Güncelleme Hatası' };
    }
  }

  // Kredi kartı sil (soft delete)
  async deleteCreditCard(cardId) {
    try {
      const { error } = await this.supabase
        .from(TABLES.CARDS)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (error) throw error;
      
      // Remove from cache
      this.cardCache.delete(cardId);
      this.utilizationCache.delete(cardId);
      
      return { success: true };
    } catch (error) {
      console.error('Delete credit card error:', error);
      return { success: false, error: 'Kredi Kartı Silme Hatası' };
    }
  }
}

export default new CreditCardService();
