// FinanceFlow - Account Service
// Gerçek Supabase verilerini kullanır
import { supabase } from '../config/supabase';

const accountService = {
  // Tüm hesapları getir
  async getAccounts(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getAccounts error:', error);
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
      console.error('Get accounts error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Tek hesap getir
  async getAccount(accountId) {
    try {
      if (!accountId) {
        throw new Error('Account ID gerekli');
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get account error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Hesap getirme hatası', 
          code: 'GET_ACCOUNT_ERROR' 
        } 
      };
    }
  },

  // Yeni hesap oluştur
  async createAccount(accountData) {
    try {
      if (!accountData.user_id) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert([accountData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create account error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Hesap oluşturulamadı', 
          code: 'CREATE_ERROR' 
        } 
      };
    }
  },

  // Hesap güncelle
  async updateAccount(accountId, updates) {
    try {
      if (!accountId) {
        throw new Error('Account ID gerekli');
      }

      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', accountId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update account error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Hesap güncellenemedi', 
          code: 'UPDATE_ERROR' 
        } 
      };
    }
  },

  // Hesap sil (soft delete)
  async deleteAccount(accountId) {
    try {
      if (!accountId) {
        throw new Error('Account ID gerekli');
      }

      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) {
        throw error;
      }

      return { success: true, deletedId: accountId };
    } catch (error) {
      console.error('Delete account error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Hesap silinemedi', 
          code: 'DELETE_ERROR' 
        } 
      };
    }
  },

  // Hesap bakiyesi güncelle
  async updateAccountBalance(accountId, newBalance) {
    try {
      if (!accountId) {
        throw new Error('Account ID gerekli');
      }

      const { data, error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update account balance error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Hesap bakiyesi güncellenemedi', 
          code: 'UPDATE_BALANCE_ERROR' 
        } 
      };
    }
  },

  // Toplam bakiye hesapla
  async getTotalBalance(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('balance, type')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const totalBalance = data.reduce((total, account) => {
        if (account.type === 'credit_card') {
          // Kredi kartı için kullanılabilir limit
          return total;
        }
        return total + parseFloat(account.balance || 0);
      }, 0);

      return { success: true, data: totalBalance };
    } catch (error) {
      console.error('Get total balance error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Toplam bakiye hesaplanamadı', 
          code: 'GET_BALANCE_ERROR' 
        } 
      };
    }
  },

  // Hesap türüne göre bakiye getir
  async getBalanceByType(userId, accountType) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId)
        .eq('type', accountType)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const totalBalance = data.reduce((total, account) => {
        return total + parseFloat(account.balance || 0);
      }, 0);

      return { success: true, data: totalBalance };
    } catch (error) {
      console.error('Get balance by type error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Hesap türü bakiyesi getirilemedi', 
          code: 'GET_TYPE_BALANCE_ERROR' 
        } 
      };
    }
  }
};

export default accountService;
