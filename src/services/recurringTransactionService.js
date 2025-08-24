// FinanceFlow - Recurring Transaction Service
// Gerçek Supabase verilerini kullanır
import { supabase } from '../config/supabase';

const recurringTransactionService = {
  // Tüm recurring transaction'ları getir
  async getRecurringTransactions(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          category:categories(name, icon, color),
          account:accounts(name, type)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('next_due_date', { ascending: true });

      if (error) {
        console.error('Supabase getRecurringTransactions error:', error);
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
      console.error('Get recurring transactions error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Yeni recurring transaction oluştur
  async createRecurringTransaction(transactionData) {
    try {
      if (!transactionData.user_id) {
        throw new Error('User ID gerekli');
      }

      // Next due date hesapla
      const startDate = new Date(transactionData.start_date);
      let nextDueDate = new Date(startDate);
      
      switch (transactionData.frequency) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + 1);
          break;
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          break;
        default:
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const recurringData = {
        ...transactionData,
        next_due_date: nextDueDate.toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([recurringData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create recurring transaction error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Recurring transaction oluşturulamadı', 
          code: 'CREATE_ERROR' 
        } 
      };
    }
  },

  // Recurring transaction güncelle
  async updateRecurringTransaction(transactionId, updates) {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID gerekli');
      }

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update recurring transaction error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Recurring transaction güncellenemedi', 
          code: 'UPDATE_ERROR' 
        } 
      };
    }
  },

  // Recurring transaction sil
  async deleteRecurringTransaction(transactionId) {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID gerekli');
      }

      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        throw error;
      }

      return { success: true, deletedId: transactionId };
    } catch (error) {
      console.error('Delete recurring transaction error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Recurring transaction silinemedi', 
          code: 'DELETE_ERROR' 
        } 
      };
    }
  },

  // Due olan recurring transaction'ları getir
  async getDueRecurringTransactions(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          category:categories(name, icon, color),
          account:accounts(name, type)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('next_due_date', today)
        .order('next_due_date', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get due recurring transactions error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Due recurring transactions getirilemedi', 
          code: 'GET_DUE_ERROR' 
        } 
      };
    }
  }
};

export default recurringTransactionService;
