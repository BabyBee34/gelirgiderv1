// FinanceFlow - Gold & Currency Data (Cleaned for Production)
// Bu dosya artık mock data içermiyor, sadece gerekli export'lar mevcut

// Boş mock data (production'da kullanılmayacak)
export const mockGoldPrices = [];
export const mockCurrencyRates = [];

// Development flag
export const isDevelopment = __DEV__;

// Gold currency functions
export const goldCurrencyFunctions = {
  getTotalGoldValue: () => {
    // Mock gold value - production'da gerçek API'den gelecek
    return 0;
  },
  
  getGoldPrice: () => {
    // Mock gold price
    return 0;
  },
  
  getCurrencyRate: (currency) => {
    // Mock currency rate
    return 1;
  }
};

// Mock data helper (sadece development'ta)
export const getMockGoldData = () => {
  if (!isDevelopment) {
    return {
      goldPrices: [],
      currencyRates: []
    };
  }
  
  // Development'ta boş data döndür
  return {
    goldPrices: [],
    currencyRates: []
  };
};

// Export default
export default {
  mockGoldPrices,
  mockCurrencyRates,
  getMockGoldData,
  isDevelopment,
  goldCurrencyFunctions
};
