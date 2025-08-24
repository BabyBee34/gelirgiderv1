// FinanceFlow - Transaction Service
// Gerçek Supabase verilerini kullanır
import { supabase } from '../config/supabase';

const transactionService = {
  // Tüm işlemleri getir
  async getTransactions(userId, filters = {}) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, icon, color),
          account:accounts(name, type)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      // Filtreler uygula
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase getTransactions error:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Tek işlem getir
  async getTransaction(transactionId) {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID gerekli');
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, icon, color),
          account:accounts(name, type)
        `)
        .eq('id', transactionId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get transaction error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'İşlem getirme hatası', 
          code: 'GET_TRANSACTION_ERROR' 
        } 
      };
    }
  },

  // Yeni işlem oluştur
  async createTransaction(transactionData) {
    try {
      if (!transactionData.user_id) {
        throw new Error('User ID gerekli');
      }

      // Transaction'ı ekle
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Account balance'ı güncelle
      if (data && transactionData.account_id) {
        try {
          // Mevcut account balance'ı al
          const { data: accountData, error: accountError } = await supabase
            .from('accounts')
            .select('balance')
            .eq('id', transactionData.account_id)
            .single();

          if (!accountError && accountData) {
            let newBalance = parseFloat(accountData.balance || 0);
            
            // Transaction tipine göre balance'ı güncelle
            if (transactionData.type === 'income') {
              newBalance += parseFloat(transactionData.amount);
            } else if (transactionData.type === 'expense') {
              newBalance -= parseFloat(transactionData.amount);
            }
            // Transfer için balance değişmez

            // Account balance'ı güncelle
            await supabase
              .from('accounts')
              .update({ balance: newBalance })
              .eq('id', transactionData.account_id);
          }
        } catch (balanceError) {
          console.warn('Account balance update failed:', balanceError);
          // Balance güncelleme hatası transaction'ı engellemez
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create transaction error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'İşlem oluşturulamadı', 
          code: 'CREATE_ERROR' 
        } 
      };
    }
  },

  // İşlem güncelle
  async updateTransaction(transactionId, updates) {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID gerekli');
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update transaction error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'İşlem güncellenemedi', 
          code: 'UPDATE_ERROR' 
        } 
      };
    }
  },

  // İşlem sil
  async deleteTransaction(transactionId) {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID gerekli');
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        throw error;
      }

      return { success: true, deletedId: transactionId };
    } catch (error) {
      console.error('Delete transaction error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'İşlem silinemedi', 
          code: 'DELETE_ERROR' 
        } 
      };
    }
  },

  // İşlem istatistikleri
  async getTransactionStats(userId, period = 'month') {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const transactions = await this.getTransactions(userId);
      if (!transactions.success) {
        throw new Error(transactions.error);
      }

      const stats = this.calculateStats(transactions.data);
      return { success: true, data: stats };
    } catch (error) {
      console.error('Get transaction stats error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'İstatistikler getirilemedi', 
          code: 'STATS_ERROR' 
        } 
      };
    }
  },

  // Kategori bazında işlem istatistikleri
  async getCategoryStats(userId, period = 'month') {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          type,
          category_id,
          categories(name, icon, color)
        `)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const categoryStats = {};
      data.forEach(transaction => {
        const categoryId = transaction.category_id;
        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            name: transaction.categories?.name || 'Bilinmeyen',
            icon: transaction.categories?.icon || 'category',
            color: transaction.categories?.color || '#718096',
            total: 0,
            count: 0
          };
        }
        
        categoryStats[categoryId].total += Math.abs(parseFloat(transaction.amount));
        categoryStats[categoryId].count += 1;
      });

      return { 
        success: true, 
        data: Object.values(categoryStats).sort((a, b) => b.total - a.total)
      };
    } catch (error) {
      console.error('Get category stats error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Kategori istatistikleri getirilemedi', 
          code: 'CATEGORY_STATS_ERROR' 
        } 
      };
    }
  },

  // Helper methods
  calculateStats(transactions) {
    const stats = {
      totalIncome: 0,
      totalExpense: 0,
      totalTransfer: 0,
      transactionCount: transactions.length,
      averageAmount: 0,
    };

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'income') {
        stats.totalIncome += amount;
      } else if (transaction.type === 'expense') {
        stats.totalExpense += amount;
      } else if (transaction.type === 'transfer') {
        stats.totalTransfer += amount;
      }
    });

    const totalAmount = stats.totalIncome + stats.totalExpense + stats.totalTransfer;
    stats.averageAmount = stats.transactionCount > 0 ? totalAmount / stats.transactionCount : 0;
    stats.netAmount = stats.totalIncome - stats.totalExpense;

    return stats;
  }
};

export default transactionService;
