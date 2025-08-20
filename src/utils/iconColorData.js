// FinanceFlow - Icon and Color Data
export const categoryIcons = [
  // Finance & Money
  'account-balance-wallet', 'attach-money', 'savings', 'credit-card', 'account-balance',
  'payment', 'monetization-on', 'currency-exchange', 'money-off', 'toll',
  
  // Food & Dining
  'restaurant', 'local-dining', 'local-cafe', 'local-bar', 'local-pizza',
  'fastfood', 'restaurant-menu', 'local-grocery-store', 'cake', 'coffee',
  
  // Transportation
  'directions-car', 'directions-bus', 'train', 'flight', 'local-taxi',
  'motorcycle', 'directions-subway', 'local-shipping', 'directions-bike', 'local-gas-station',
  
  // Shopping & Retail  
  'shopping-cart', 'shopping-bag', 'store', 'local-mall', 'card-giftcard',
  'loyalty', 'local-offer', 'redeem', 'storefront', 'inventory',
  
  // Health & Medical
  'local-hospital', 'medical-services', 'health-and-safety', 'fitness-center', 'spa',
  'healing', 'psychology', 'medication', 'monitor-heart', 'local-pharmacy',
  
  // Education & Learning
  'school', 'book', 'library-books', 'menu-book', 'class',
  'science', 'calculate', 'architecture', 'engineering', 'academic-cap',
  
  // Entertainment & Leisure
  'movie', 'theaters', 'music-note', 'games', 'sports-esports',
  'camera-alt', 'photo-camera', 'celebration', 'park', 'beach-access',
  
  // Home & Utilities
  'home', 'house', 'apartment', 'kitchen', 'weekend',
  'power', 'wifi', 'phone', 'tv', 'air',
  
  // Work & Business
  'work', 'business', 'business-center', 'domain', 'desktop-mac',
  'laptop', 'phone-iphone', 'print', 'fax', 'email',
  
  // Travel & Tourism
  'flight-takeoff', 'hotel', 'luggage', 'map', 'place',
  'explore', 'tour', 'camera', 'backpack', 'passport',
  
  // Sports & Fitness
  'sports-soccer', 'sports-basketball', 'sports-tennis', 'pool', 'golf-course',
  'fitness-center', 'directions-run', 'sports-handball', 'sports-volleyball', 'skateboarding',
  
  // Technology & Electronics
  'computer', 'smartphone', 'tablet', 'watch', 'headphones',
  'speaker', 'tv', 'radio', 'camera', 'videocam',
  
  // Personal Care & Beauty
  'face', 'content-cut', 'local-laundry-service', 'dry-cleaning', 'checkroom',
  'shower', 'bathtub', 'brush', 'palette', 'style',
  
  // Miscellaneous
  'pets', 'child-care', 'elderly', 'volunteer-activism', 'favorite',
  'star', 'emoji-events', 'flag', 'local-fire-department', 'security'
];

export const categoryColors = [
  // Primary Colors
  '#F56565', '#ED8936', '#ECC94B', '#48BB78', '#38B2AC',
  '#4299E1', '#3182CE', '#6B73FF', '#9F7AEA', '#ED64A6',
  
  // Secondary Colors  
  '#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#319795',
  '#2B6CB0', '#2C5282', '#553C9A', '#805AD5', '#B83280',
  
  // Soft Colors
  '#FEB2B2', '#FBD38D', '#F6E05E', '#9AE6B4', '#81E6D9',
  '#90CDF4', '#63B3ED', '#A3BFFA', '#B794F6', '#F687B3',
  
  // Dark Colors
  '#C53030', '#C05621', '#B7791F', '#2F855A', '#2C7A7B',
  '#2A69AC', '#2A4365', '#44337A', '#6B46C1', '#97266D',
  
  // Neutral Colors
  '#2D3748', '#4A5568', '#718096', '#A0AEC0', '#CBD5E0',
  '#1A202C', '#171923', '#2D2D2D', '#4A4A4A', '#6B6B6B',
  
  // Bright Colors
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  
  // Pastel Colors
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#D4B5FF', '#FFB3FF', '#C7CEEA', '#B5EAD7', '#F2D7D5'
];

export const getIconsByCategory = (category) => {
  const categoryIconMap = {
    'finance': ['account-balance-wallet', 'attach-money', 'savings', 'credit-card', 'account-balance'],
    'food': ['restaurant', 'local-dining', 'local-cafe', 'local-bar', 'local-pizza'],
    'transport': ['directions-car', 'directions-bus', 'train', 'flight', 'local-taxi'],
    'shopping': ['shopping-cart', 'shopping-bag', 'store', 'local-mall', 'card-giftcard'],
    'health': ['local-hospital', 'medical-services', 'health-and-safety', 'fitness-center', 'spa'],
    'education': ['school', 'book', 'library-books', 'menu-book', 'class'],
    'entertainment': ['movie', 'theaters', 'music-note', 'games', 'sports-esports'],
    'home': ['home', 'house', 'apartment', 'kitchen', 'weekend'],
    'work': ['work', 'business', 'business-center', 'domain', 'desktop-mac'],
    'travel': ['flight-takeoff', 'hotel', 'luggage', 'map', 'place'],
    'sports': ['sports-soccer', 'sports-basketball', 'sports-tennis', 'pool', 'golf-course'],
    'technology': ['computer', 'smartphone', 'tablet', 'watch', 'headphones'],
    'personal': ['face', 'content-cut', 'local-laundry-service', 'dry-cleaning', 'checkroom'],
    'misc': ['pets', 'child-care', 'elderly', 'volunteer-activism', 'favorite']
  };
  
  return categoryIconMap[category] || categoryIcons.slice(0, 10);
};

export const getColorsByType = (type) => {
  const colorTypeMap = {
    'warm': ['#F56565', '#ED8936', '#ECC94B', '#E53E3E', '#DD6B20'],
    'cool': ['#48BB78', '#38B2AC', '#4299E1', '#3182CE', '#6B73FF'],
    'vibrant': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    'pastel': ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'],
    'dark': ['#2D3748', '#4A5568', '#718096', '#1A202C', '#171923']
  };
  
  return colorTypeMap[type] || categoryColors.slice(0, 10);
};

export const defaultIconColorCombinations = [
  { icon: 'restaurant', color: '#F56565', name: 'Yemek' },
  { icon: 'directions-car', color: '#ED8936', name: 'Ulaşım' },
  { icon: 'shopping-cart', color: '#ECC94B', name: 'Market' },
  { icon: 'local-hospital', color: '#48BB78', name: 'Sağlık' },
  { icon: 'home', color: '#38B2AC', name: 'Ev' },
  { icon: 'movie', color: '#4299E1', name: 'Eğlence' },
  { icon: 'school', color: '#6B73FF', name: 'Eğitim' },
  { icon: 'work', color: '#9F7AEA', name: 'İş' },
  { icon: 'fitness-center', color: '#ED64A6', name: 'Spor' },
  { icon: 'pets', color: '#48BB78', name: 'Evcil Hayvan' }
];

export default {
  categoryIcons,
  categoryColors,
  getIconsByCategory,
  getColorsByType,
  defaultIconColorCombinations
};
