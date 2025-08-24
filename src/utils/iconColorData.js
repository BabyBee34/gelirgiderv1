// FinanceFlow - Icon & Color Data (Cleaned for Production)
// Bu dosya artık mock data içermiyor, sadece gerekli export'lar mevcut

// Boş mock data (production'da kullanılmayacak)
export const mockIconColors = [];
export const mockCategoryIcons = [];

// Category icons ve colors için güvenli export'lar
export const categoryIcons = [
  'category', 'shopping-cart', 'local-dining', 'directions-car',
  'home', 'fitness-center', 'school', 'local-hospital',
  'movie', 'flight', 'pets', 'work', 'phone', 'wifi',
  'electric-bolt', 'local-gas-station', 'restaurant',
  'coffee', 'shopping-bag', 'card-giftcard'
];

export const categoryColors = [
  '#6C63FF', '#4ECDC4', '#FFE66D', '#48BB78', '#F56565', 
  '#ED8936', '#9F7AEA', '#38B2AC', '#ECC94B', '#FC8181',
  '#68D391', '#63B3ED', '#F687B3', '#FBB6CE', '#C6F6D5',
  '#BEE3F8', '#FEEBC8', '#FED7D7', '#E9D8FD', '#C6F7E9',
  '#FEFCBF', '#FED7E2', '#C4B5FD'
];

// Helper function
export const getIconsByCategory = (category = '') => {
  return categoryIcons.slice(0, 12);
};

// Development flag
export const isDevelopment = __DEV__;

// Mock data helper (sadece development'ta)
export const getMockIconData = () => {
  if (!isDevelopment) {
    return {
      iconColors: [],
      categoryIcons: []
    };
  }
  
  // Development'ta boş data döndür
  return {
    iconColors: [],
    categoryIcons: []
  };
};

// Export default
export default {
  mockIconColors,
  mockCategoryIcons,
  categoryIcons,
  categoryColors,
  getIconsByCategory,
  getMockIconData,
  isDevelopment
};
