// FinanceFlow - Test Data (Cleaned for Production)
// Bu dosya artık mock data içermiyor, sadece gerekli export'lar mevcut

// Gerçek Supabase verilerini kullanacak şekilde temizlendi
export const testUser = null;

// Gerçek Supabase verilerini kullanacağız, mock data'ya gerek yok
export const mockTransactions = [];
export const mockAccounts = [];
export const mockCategories = [];
export const mockBudgets = [];
export const mockGoals = [];
export const mockCards = [];

// Development flag
export const isDevelopment = __DEV__;

// Mock data helper (sadece development'ta)
export const getMockData = () => {
  if (!isDevelopment) {
    return {
      transactions: [],
      accounts: [],
      categories: [],
      budgets: [],
      goals: [],
      cards: []
    };
  }
  
  // Development'ta boş data döndür
  return {
    transactions: [],
    accounts: [],
    categories: [],
    budgets: [],
    goals: [],
    cards: []
  };
};

// Export default
export default {
  testUser,
  mockTransactions,
  mockAccounts,
  mockCategories,
  mockBudgets,
  mockGoals,
  mockCards,
  getMockData,
  isDevelopment
};
