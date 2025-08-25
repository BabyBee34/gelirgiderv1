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

  // Ana hesabı getir (ilk kayıt olan hesap)
  async getPrimaryAccount(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      // İlk olarak is_primary=true olan hesabı bul
      let { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        throw error;
      }

      // Eğer primary hesap varsa, döndür
      if (data && data.length > 0) {
        return { success: true, data: data[0] };
      }

      // Primary hesap yoksa, en eski hesabı bul ve primary yap
      const { data: allAccounts, error: allAccountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (allAccountsError) {
        throw allAccountsError;
      }

      if (allAccounts && allAccounts.length > 0) {
        // En eski hesabı primary yap
        const oldestAccount = allAccounts[0];
        const setPrimaryResult = await this.setPrimaryAccount(oldestAccount.id);
        
        if (setPrimaryResult.success) {
          return { success: true, data: setPrimaryResult.data };
        } else {
          // Eğer primary ayarlama başarısız olursa, yine de hesabı döndür
          return { success: true, data: oldestAccount };
        }
      }

      // Hiç hesap yoksa, varsayılan hesap oluştur
      const createDefaultResult = await this.createDefaultAccountsForUser(userId);
      if (createDefaultResult.success) {
        return { success: true, data: createDefaultResult.primaryAccount };
      }
      
      // Son çare olarak null döndür
      return { success: true, data: null };
      
    } catch (error) {
      console.error('Get primary account error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Ana hesap getirilemedi', 
          code: 'GET_PRIMARY_ACCOUNT_ERROR' 
        } 
      };
    }
  },

  // Ana hesap olarak işaretle
  async setPrimaryAccount(accountId) {
    try {
      if (!accountId) {
        throw new Error('Account ID gerekli');
      }

      // Önce tüm hesapları primary olmaktan çıkar
      await supabase
        .from('accounts')
        .update({ is_primary: false })
        .neq('id', accountId);

      // Seçilen hesabı primary yap
      const { data, error } = await supabase
        .from('accounts')
        .update({ is_primary: true })
        .eq('id', accountId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Set primary account error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Ana hesap ayarlanamadı', 
          code: 'SET_PRIMARY_ACCOUNT_ERROR' 
        } 
      };
    }
  },

  // Sadece ana hesap bakiyesi
  async getPrimaryAccountBalance(userId) {
    try {
      const primaryAccountResult = await this.getPrimaryAccount(userId);
      
      if (!primaryAccountResult.success || !primaryAccountResult.data) {
        return { success: true, data: 0 }; // Ana hesap yoksa 0
      }

      return { 
        success: true, 
        data: parseFloat(primaryAccountResult.data.balance || 0)
      };
    } catch (error) {
      console.error('Get primary account balance error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Ana hesap bakiyesi getirilemedi', 
          code: 'GET_PRIMARY_BALANCE_ERROR' 
        } 
      };
    }
  },

  // Varlık hesapları (ana hesap hariç)
  async getAssetAccounts(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('is_primary', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Get asset accounts error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Varlık hesapları toplam bakiyesi
  async getAssetAccountsBalance(userId) {
    try {
      const assetAccountsResult = await this.getAssetAccounts(userId);
      
      if (!assetAccountsResult.success) {
        return { success: true, data: 0 };
      }

      const totalBalance = assetAccountsResult.data.reduce((total, account) => {
        if (account.type === 'credit_card') {
          // Kredi kartı için kullanılabilir limit ekle
          return total + parseFloat(account.credit_limit || 0);
        }
        return total + parseFloat(account.balance || 0);
      }, 0);

      return { success: true, data: totalBalance };
    } catch (error) {
      console.error('Get asset accounts balance error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Varlık hesapları bakiyesi hesaplanamadı', 
          code: 'GET_ASSETS_BALANCE_ERROR' 
        } 
      };
    }
  },
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
  },

  // Yeni kullanıcı için varsayılan hesapları oluştur
  async createDefaultAccountsForUser(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      // Check if user already has accounts
      const existingAccounts = await this.getAccounts(userId);
      if (existingAccounts.success && existingAccounts.data.length > 0) {
        console.log('User already has accounts, ensuring primary account is set');
        return await this.ensurePrimaryAccount(userId, existingAccounts.data);
      }

      // Create default primary account
      const defaultAccount = {
        user_id: userId,
        name: 'Ana Hesap',
        type: 'cash',
        balance: 0.00,
        currency: 'TRY',
        is_primary: true,
        is_active: true
      };

      const createResult = await this.createAccount(defaultAccount);
      if (createResult.success) {
        console.log('✓ Default primary account created for new user');
        return { success: true, primaryAccount: createResult.data };
      } else {
        throw new Error(createResult.error.message || 'Varsayılan hesap oluşturulamadı');
      }
    } catch (error) {
      console.error('Create default accounts error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Varsayılan hesaplar oluşturulamadı',
          code: 'CREATE_DEFAULT_ACCOUNTS_ERROR'
        }
      };
    }
  },

  // Kullanıcının birincil hesabının olduğundan emin ol
  async ensurePrimaryAccount(userId, existingAccounts = null) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      let accounts = existingAccounts;
      if (!accounts) {
        const accountsResult = await this.getAccounts(userId);
        if (!accountsResult.success) {
          throw new Error('Hesaplar alınamadı');
        }
        accounts = accountsResult.data || [];
      }

      // If no accounts exist, create default
      if (accounts.length === 0) {
        return await this.createDefaultAccountsForUser(userId);
      }

      // Check if any account is marked as primary
      const primaryAccount = accounts.find(account => account.is_primary === true);
      
      if (!primaryAccount) {
        // Set the oldest account as primary
        const oldestAccount = accounts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
        const setPrimaryResult = await this.setPrimaryAccount(oldestAccount.id);
        
        if (setPrimaryResult.success) {
          console.log('✓ Primary account set for existing user');
          return { success: true, primaryAccount: setPrimaryResult.data };
        } else {
          throw new Error('Birincil hesap ayarlanamadı');
        }
      }

      return { success: true, primaryAccount };
    } catch (error) {
      console.error('Ensure primary account error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Birincil hesap kontrolü başarısız',
          code: 'ENSURE_PRIMARY_ACCOUNT_ERROR'
        }
      };
    }
  }
};

export default accountService;
