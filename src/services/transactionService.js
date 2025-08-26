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

  // Enhanced validation for transaction data
  validateTransactionData(transactionData) {
    const errors = [];
    
    // Required field validation
    if (!transactionData.user_id) {
      errors.push('User ID gerekli');
    }
    
    if (!transactionData.account_id) {
      errors.push('Hesap seçimi gerekli');
    }
    
    if (!transactionData.amount || parseFloat(transactionData.amount) <= 0) {
      errors.push('Geçerli bir tutar girilmelidir');
    }
    
    if (!transactionData.type || !['income', 'expense', 'transfer'].includes(transactionData.type)) {
      errors.push('Geçerli bir işlem türü seçilmelidir');
    }
    
    // Business logic validation
    const amount = parseFloat(transactionData.amount);
    if (amount > 1000000) {
      errors.push('Tutar çok yüksek (Maksimum: 1,000,000 TL)');
    }
    
    // Date validation
    if (transactionData.date) {
      const transactionDate = new Date(transactionData.date);
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      
      if (transactionDate > now) {
        errors.push('Gelecek tarihli işlemler oluşturulamaz');
      }
      
      if (transactionDate < oneYearAgo) {
        errors.push('1 yıldan eski işlemler oluşturulamaz');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Yeni işlem oluştur
  async createTransaction(transactionData) {
    try {
      // Enhanced validation
      const validation = this.validateTransactionData(transactionData);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            message: validation.errors.join(', '),
            code: 'VALIDATION_ERROR'
          }
        };
      }

      // Check account ownership and existence
      const { data: accountCheck, error: accountCheckError } = await supabase
        .from('accounts')
        .select('id, balance, type, is_active')
        .eq('id', transactionData.account_id)
        .eq('user_id', transactionData.user_id)
        .eq('is_active', true)
        .single();

      if (accountCheckError || !accountCheck) {
        return {
          success: false,
          error: {
            message: 'Hesap bulunamadı veya erişim izni yok',
            code: 'ACCOUNT_NOT_FOUND'
          }
        };
      }

      // For expense transactions, check if account has sufficient balance (warning only)
      if (transactionData.type === 'expense') {
        const currentBalance = parseFloat(accountCheck.balance || 0);
        const expenseAmount = parseFloat(transactionData.amount);
        
        if (currentBalance < expenseAmount && accountCheck.type !== 'credit_card') {
          console.warn(`Warning: Expense (${expenseAmount}) exceeds account balance (${currentBalance})`);
          // Continue with transaction but log warning
        }
      }

      // Use transaction to ensure data consistency
      const { data: transaction, error: transactionError } = await supabase.rpc('create_transaction_with_balance_update', {
        p_user_id: transactionData.user_id,
        p_account_id: transactionData.account_id,
        p_category_id: transactionData.category_id,
        p_amount: parseFloat(transactionData.amount),
        p_type: transactionData.type,
        p_description: transactionData.description || '',
        p_description: transactionData.description || '',
        p_date: transactionData.date || new Date().toISOString().split('T')[0],
        p_time: transactionData.time || new Date().toTimeString().split(' ')[0],
        p_location: transactionData.location || '',
        p_receipt_url: transactionData.receipt_url || '',
        p_tags: transactionData.tags || [],
        p_is_recurring: transactionData.is_recurring || false,
        p_recurring_frequency: transactionData.recurring_frequency || null
      });

      if (transactionError) {
        // Fallback to manual transaction creation if RPC not available
        console.warn('RPC function not available, using manual approach:', transactionError);
        return await this.createTransactionManual(transactionData);
      }

      return { success: true, data: transaction };
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

  // Manual fallback method for transaction creation
  async createTransactionManual(transactionData) {
    try {
      // Start a transaction-like process
      const { data: existingAccount, error: accountCheckError } = await supabase
        .from('accounts')
        .select('balance, type')
        .eq('id', transactionData.account_id)
        .eq('user_id', transactionData.user_id)
        .single();

      if (accountCheckError || !existingAccount) {
        throw new Error('Hesap bulunamadı veya erişim izni yok');
      }

      // Create the transaction first
      const { data: transactionResult, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: transactionData.user_id,
          account_id: transactionData.account_id,
          category_id: transactionData.category_id,
          amount: parseFloat(transactionData.amount),
          type: transactionData.type,
          description: transactionData.description || '',
          description: transactionData.description || '',
          date: transactionData.date || new Date().toISOString().split('T')[0],
          time: transactionData.time || new Date().toTimeString().split(' ')[0],
          location: transactionData.location || '',
          receipt_url: transactionData.receipt_url || '',
          tags: transactionData.tags || [],
          is_recurring: transactionData.is_recurring || false,
          recurring_frequency: transactionData.recurring_frequency || null
        }])
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Update account balance
      let newBalance = parseFloat(existingAccount.balance || 0);
      const transactionAmount = parseFloat(transactionData.amount);
      
      if (transactionData.type === 'income') {
        newBalance += transactionAmount;
      } else if (transactionData.type === 'expense') {
        newBalance -= transactionAmount;
        
        // Check for negative balance warning (but don't prevent transaction)
        if (newBalance < 0 && existingAccount.type !== 'credit_card') {
          console.warn(`Account balance will be negative: ${newBalance}`);
        }
      }
      // For 'transfer' type, balance change is handled separately

      // Update account balance
      const { error: balanceUpdateError } = await supabase
        .from('accounts')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionData.account_id)
        .eq('user_id', transactionData.user_id);

      if (balanceUpdateError) {
        console.error('Balance update failed:', balanceUpdateError);
        // Note: Transaction was created but balance update failed
        // In a real app, you might want to implement rollback or queue for retry
      }

      return { success: true, data: transactionResult };
    } catch (error) {
      console.error('Manual transaction creation error:', error);
      throw error;
    }
  },

  // İşlem güncelle
  async updateTransaction(transactionId, updates) {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID gerekli');
      }

      // Get original transaction data for balance calculation
      const { data: originalTransaction, error: getError } = await supabase
        .from('transactions')
        .select('amount, type, account_id, user_id')
        .eq('id', transactionId)
        .single();

      if (getError || !originalTransaction) {
        throw new Error('Orijinal işlem bulunamadı');
      }

      // Update the transaction
      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Handle balance update if amount, type, or account changed
      const needsBalanceUpdate = (
        updates.amount !== undefined || 
        updates.type !== undefined || 
        updates.account_id !== undefined
      );

      if (needsBalanceUpdate && originalTransaction.account_id) {
        try {
          // Revert original transaction effect
          await this.revertTransactionBalance(originalTransaction);
          
          // Apply new transaction effect
          const newTransactionData = {
            ...originalTransaction,
            ...updates,
            amount: updates.amount || originalTransaction.amount,
            type: updates.type || originalTransaction.type,
            account_id: updates.account_id || originalTransaction.account_id
          };
          
          await this.applyTransactionBalance(newTransactionData);
        } catch (balanceError) {
          console.error('Balance update failed during transaction update:', balanceError);
        }
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

      // Get transaction data before deletion for balance reversion
      const { data: transactionData, error: getError } = await supabase
        .from('transactions')
        .select('amount, type, account_id, user_id')
        .eq('id', transactionId)
        .single();

      if (getError) {
        throw getError;
      }

      // Delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        throw error;
      }

      // Revert the balance change
      if (transactionData && transactionData.account_id) {
        try {
          await this.revertTransactionBalance(transactionData);
        } catch (balanceError) {
          console.error('Balance reversion failed during transaction deletion:', balanceError);
        }
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

  // Helper method to apply transaction balance effect
  async applyTransactionBalance(transactionData) {
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', transactionData.account_id)
      .single();

    if (!accountError && accountData) {
      let newBalance = parseFloat(accountData.balance || 0);
      const amount = parseFloat(transactionData.amount);
      
      if (transactionData.type === 'income') {
        newBalance += amount;
      } else if (transactionData.type === 'expense') {
        newBalance -= amount;
      }

      await supabase
        .from('accounts')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionData.account_id);
    }
  },

  // Helper method to revert transaction balance effect
  async revertTransactionBalance(transactionData) {
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', transactionData.account_id)
      .single();

    if (!accountError && accountData) {
      let newBalance = parseFloat(accountData.balance || 0);
      const amount = parseFloat(transactionData.amount);
      
      // Reverse the effect
      if (transactionData.type === 'income') {
        newBalance -= amount;
      } else if (transactionData.type === 'expense') {
        newBalance += amount;
      }

      await supabase
        .from('accounts')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionData.account_id);
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
