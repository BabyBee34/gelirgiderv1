import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase konfigürasyon bilgileri
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Environment variables kontrolü
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables eksik!');
  console.error('Lütfen .env dosyasını oluşturun ve Supabase bilgilerinizi ekleyin.');
  console.error('env.example dosyasını .env olarak kopyalayın.');
}

// Supabase client oluşturma
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Supabase bağlantı test fonksiyonu
export const testSupabaseConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase environment variables eksik');
      return false;
    }

    // Basit bir test query
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase bağlantı hatası:', error);
      return false;
    }

    console.log('✅ Supabase bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('❌ Supabase test hatası:', error);
    return false;
  }
};

// Kapsamlı bağlantı test fonksiyonu
export const testAllConnections = async () => {
  try {
    console.log('🔍 Tüm Supabase bağlantıları test ediliyor...');
    
    // 1. Temel bağlantı testi
    const basicTest = await testSupabaseConnection();
    if (!basicTest) {
      console.error('❌ Temel bağlantı başarısız');
      return false;
    }
    
    // 2. Tüm tabloları test et
    const tableTests = await Promise.all([
      testTable('categories'),
      testTable('accounts'),
      testTable('transactions'),
      testTable('budgets'),
      testTable('goals'),
      testTable('credit_cards')
    ]);
    
    const failedTables = tableTests.filter(test => !test.success);
    
    if (failedTables.length > 0) {
      console.error('❌ Bazı tablolar erişilemez:', failedTables.map(t => t.table));
      return false;
    }
    
    console.log('✅ Tüm bağlantılar başarılı!');
    return true;
    
  } catch (error) {
    console.error('❌ Bağlantı test hatası:', error);
    return false;
  }
};

// Tek tablo test fonksiyonu
const testTable = async (tableName) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    if (error) {
      return { success: false, table: tableName, error: error.message };
    }
    
    return { success: true, table: tableName };
  } catch (error) {
    return { success: false, table: tableName, error: error.message };
  }
};

// Tablo isimleri
export const TABLES = {
  USERS: 'users',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  BUDGETS: 'budgets',
  GOALS: 'goals',
  CREDIT_CARDS: 'credit_cards',
  CARDS: 'credit_cards', // Alias for consistency
  NOTIFICATIONS: 'notifications',
  CURRENCY_RATES: 'currency_rates',
  GOLD_PRICES: 'gold_prices',
  RECEIPTS: 'receipts'
};

// RLS (Row Level Security) policies için
export const POLICIES = {
  USERS_OWN_DATA: 'users_own_data',
  ACCOUNTS_OWN_DATA: 'accounts_own_data',
  TRANSACTIONS_OWN_DATA: 'transactions_own_data',
  BUDGETS_OWN_DATA: 'budgets_own_data',
  GOALS_OWN_DATA: 'goals_own_data',
  CARDS_OWN_DATA: 'credit_cards_own_data',
  CATEGORIES_OWN_DATA: 'categories_own_data'
};

// Supabase bağlantı durumu
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export default supabase;
