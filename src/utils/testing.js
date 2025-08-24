// FinanceFlow - Testing Utilities (Cleaned for Production)
// Bu dosya artık mock data içermiyor, sadece gerekli test fonksiyonları mevcut

// Development flag
export const isDevelopment = __DEV__;

// Boş mock data (production'da kullanılmayacak)
export const mockData = {
  generateUser: () => ({}),
  generateTransactions: () => [],
  generateAccounts: () => [],
  generateBudgets: () => [],
  generateGoals: () => [],
  generateCategories: () => [],
  generateCards: () => []
};

// Test data sets (boş)
export const testDataSets = {
  minimal: {
    user: {},
    transactions: [],
    accounts: [],
    budgets: [],
    goals: []
  },
  small: {
    user: {},
    transactions: [],
    accounts: [],
    budgets: [],
    goals: []
  },
  large: {
    user: {},
    transactions: [],
    accounts: [],
    budgets: [],
    goals: []
  }
};

// Test utilities
export const testUtils = {
  // Mock data oluştur (sadece development'ta)
  createMockData: (type, count = 1) => {
    if (!isDevelopment) {
      return [];
    }
    
    switch (type) {
      case 'transactions':
        return Array(count).fill(null).map((_, i) => ({
          id: `mock-transaction-${i}`,
          amount: Math.random() * 1000,
          type: Math.random() > 0.5 ? 'income' : 'expense',
          description: `Mock Transaction ${i}`,
          date: new Date().toISOString()
        }));
      
      case 'accounts':
        return Array(count).fill(null).map((_, i) => ({
          id: `mock-account-${i}`,
          name: `Mock Account ${i}`,
          balance: Math.random() * 10000,
          type: 'bank'
        }));
      
      case 'categories':
        return Array(count).fill(null).map((_, i) => ({
          id: `mock-category-${i}`,
          name: `Mock Category ${i}`,
          icon: 'help-circle',
          color: '#999'
        }));
      
      default:
        return [];
    }
  },

  // Test data temizle
  clearMockData: () => {
    if (isDevelopment) {
      console.log('Mock data cleared');
    }
  },

  // Test mode kontrol
  isTestMode: () => isDevelopment
};

// Export default
export default {
  mockData,
  testDataSets,
  testUtils,
  isDevelopment
};
