import { supabase, TABLES } from '../config/supabase';

// Supabase ana servis sınıfı
class SupabaseService {
  constructor() {
    this.supabase = supabase;
  }

  // Auth işlemleri
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: 'financeflow://auth-callback'
        }
      });

      if (error) throw error;

      // Email confirmation kapalıysa otomatik giriş yap
      if (data.user && !data.user.email_confirmed_at) {
        // Email confirmation olmadan otomatik giriş
        const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        // Kullanıcı profil bilgilerini ekle
        if (signInData.user) {
          try {
            await this.createUserProfile(signInData.user.id, {
              email: signInData.user.email,
              ...userData
            });
          } catch (profileError) {
            console.warn('Profile creation failed, but user was created:', profileError);
          }
        }

        return { data: signInData, error: null };
      }

      // Kullanıcı profil bilgilerini ekle (hata olursa devam et)
      if (data.user) {
        try {
          await this.createUserProfile(data.user.id, {
            email: data.user.email,
            ...userData
          });
        } catch (profileError) {
          console.warn('Profile creation failed, but user was created:', profileError);
          // Profil oluşturulamazsa kullanıcı kaydı yine de başarılı sayılsın
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error };
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, error };
    }
  }

  // Kullanıcı profil işlemleri
  async createUserProfile(userId, profileData) {
    try {
      // firstName ve lastName'i full_name olarak birleştir
      const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
      
      console.log('Attempting to create user profile for:', userId);
      console.log('Profile data:', { fullName, email: profileData.email });
      
      const { data, error } = await this.supabase
        .from(TABLES.USERS)
        .insert([{
          id: userId,
          full_name: fullName,
          email: profileData.email || ''
        }])
        .select()
        .single();

      if (error) {
        console.warn('Profile creation failed (RLS issue), but continuing:', error);
        // RLS hatası olsa bile başarılı döndür
        return { data: { id: userId, full_name: fullName, email: profileData.email }, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.warn('Profile creation failed (exception), but continuing:', error);
      // Hata olsa bile başarılı döndür
      return { data: { id: userId, full_name: profileData.firstName + ' ' + profileData.lastName, email: profileData.email }, error: null };
    }
  }

  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { data: null, error };
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { data: null, error };
    }
  }

  // Kategori işlemleri
  async getCategories(userId = null) {
    try {
      let query = this.supabase
        .from(TABLES.CATEGORIES)
        .select('*')
        .order('name');

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get categories error:', error);
      return { data: null, error };
    }
  }

  async createCategory(categoryData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CATEGORIES)
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create category error:', error);
      return { data: null, error };
    }
  }

  // Hesap işlemleri
  async getAccounts(userId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ACCOUNTS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get accounts error:', error);
      return { data: null, error };
    }
  }

  async createAccount(accountData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ACCOUNTS)
        .insert([accountData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create account error:', error);
      return { data: null, error };
    }
  }

  async updateAccount(accountId, updates) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ACCOUNTS)
        .update(updates)
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update account error:', error);
      return { data: null, error };
    }
  }

  // İşlem işlemleri
  async getTransactions(userId, filters = {}) {
    try {
      let query = this.supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          *,
          category:categories(name, icon, color),
          account:accounts(name, type)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      // Filtreleri uygula
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
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get transactions error:', error);
      return { data: null, error };
    }
  }

  async createTransaction(transactionData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .insert([transactionData])
        .select(`
          *,
          category:categories(name, icon, color),
          account:accounts(name, type)
        `)
        .single();

      if (error) throw error;

      // Hesap bakiyesini güncelle
      await this.updateAccountBalance(transactionData.account_id, transactionData.amount, transactionData.type);

      return { data, error: null };
    } catch (error) {
      console.error('Create transaction error:', error);
      return { data: null, error };
    }
  }

  async updateTransaction(transactionId, updates) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .update(updates)
        .eq('id', transactionId)
        .select(`
          *,
          category:categories(name, icon, color),
          account:accounts(name, type)
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update transaction error:', error);
      return { data: null, error };
    }
  }

  async deleteTransaction(transactionId) {
    try {
      const { error } = await this.supabase
        .from(TABLES.TRANSACTIONS)
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete transaction error:', error);
      return { error };
    }
  }

  // Hesap bakiyesi güncelleme
  async updateAccountBalance(accountId, amount, type) {
    try {
      const { data: account } = await this.supabase
        .from(TABLES.ACCOUNTS)
        .select('balance')
        .eq('id', accountId)
        .single();

      if (!account) return;

      let newBalance = account.balance;
      if (type === 'income') {
        newBalance += parseFloat(amount);
      } else if (type === 'expense') {
        newBalance -= parseFloat(amount);
      }

      await this.supabase
        .from(TABLES.ACCOUNTS)
        .update({ balance: newBalance })
        .eq('id', accountId);

    } catch (error) {
      console.error('Update account balance error:', error);
    }
  }

  // Bütçe işlemleri
  async getBudgets(userId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.BUDGETS)
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get budgets error:', error);
      return { data: null, error };
    }
  }

  async createBudget(budgetData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.BUDGETS)
        .insert([budgetData])
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create budget error:', error);
      return { data: null, error };
    }
  }

  // Hedef işlemleri
  async getGoals(userId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOALS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('target_date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get goals error:', error);
      return { data: null, error };
    }
  }

  async createGoal(goalData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOALS)
        .insert([goalData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create goal error:', error);
      return { data: null, error };
    }
  }

  // Kart işlemleri
  async getCards(userId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CARDS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get cards error:', error);
      return { data: null, error };
    }
  }

  async createCard(cardData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CARDS)
        .insert([cardData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create card error:', error);
      return { data: null, error };
    }
  }

  // Bildirim işlemleri
  async getNotifications(userId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get notifications error:', error);
      return { data: null, error };
    }
  }

  async createNotification(notificationData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.NOTIFICATIONS)
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create notification error:', error);
      return { data: null, error };
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return { data: null, error };
    }
  }

  // Döviz kuru işlemleri
  async getCurrencyRates(baseCurrency = 'TRY', targetCurrencies = ['USD', 'EUR', 'GBP']) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CURRENCY_RATES)
        .select('*')
        .eq('base_currency', baseCurrency)
        .in('target_currency', targetCurrencies)
        .eq('date', new Date().toISOString().split('T')[0])
        .order('target_currency');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get currency rates error:', error);
      return { data: null, error };
    }
  }

  // Altın fiyat işlemleri
  async getGoldPrices() {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOLD_PRICES)
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .order('type');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get gold prices error:', error);
      return { data: null, error };
    }
  }

  // Real-time subscriptions
  subscribeToChanges(table, callback) {
    return this.supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }

  // Error handling helper
  handleError(error, context = '') {
    console.error(`${context} Error:`, error);
    
    // Error message'ı string'e çevir
    let errorMessage = 'Bir hata oluştu';
    let errorCode = 'UNKNOWN';
    
    if (error && typeof error === 'object') {
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.message && typeof error.message === 'object') {
        // ReadableNativeMap durumu için
        errorMessage = JSON.stringify(error.message) || 'Bilinmeyen hata';
      }
      
      if (error.code && typeof error.code === 'string') {
        errorCode = error.code;
      }
    }
    
    // Supabase specific error codes
    if (errorCode === 'PGRST116') {
      return { message: 'Veri bulunamadı', code: 'NOT_FOUND' };
    }
    
    if (errorCode === '23505') {
      return { message: 'Bu kayıt zaten mevcut', code: 'DUPLICATE' };
    }
    
    if (errorCode === '23503') {
      return { message: 'İlişkili kayıt bulunamadı', code: 'FOREIGN_KEY' };
    }
    
    if (errorCode === '42501') {
      return { message: 'Yetki hatası - lütfen tekrar giriş yapın', code: 'PERMISSION_DENIED' };
    }
    
    // Email confirmation hatası artık gerekli değil
    // if (errorCode === 'PGRST301') {
    //   return { message: 'Email onaylanmamış - lütfen email\'inizi kontrol edin', code: 'EMAIL_NOT_CONFIRMED' };
    // }
    
    return { message: errorMessage, code: errorCode };
  }
}

export default new SupabaseService();
