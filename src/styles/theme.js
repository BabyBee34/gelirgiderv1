// FinanceFlow - Theme System
// Renk paleti ve design tokens

export const theme = {
  colors: {
    // Ana renk paleti (proje.md'den aynen alındı)
    primary: '#6C63FF',      // Soft Purple
    secondary: '#4ECDC4',    // Mint Green
    accent: '#FFE66D',       // Soft Yellow
    background: '#F8F9FA',   // Light Gray
    cards: '#FFFFFF',        // Pure White
    
    // Text renkler
    textPrimary: '#2D3748',   // Dark Gray
    textSecondary: '#718096', // Medium Gray
    
    // Status renkler
    success: '#48BB78',       // Green
    warning: '#ED8936',       // Orange
    error: '#F56565',         // Red
    
    // Border rengi
    border: '#E2E8F0',       // Light Gray Border
    
    // Gradients
    primaryGradient: ['#6C63FF', '#4ECDC4'],
    backgroundGradient: ['#6C63FF', '#4ECDC4'],
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  
  typography: {
    // Headers - Inter Bold/SemiBold
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    
    // Body - Inter Regular/Medium
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    
    // Numbers - SF Mono (para miktarları için)
    currency: {
      fontSize: 24,
      fontWeight: '600',
      fontFamily: 'monospace',
      lineHeight: 32,
    },
    currencyLarge: {
      fontSize: 32,
      fontWeight: '700',
      fontFamily: 'monospace',
      lineHeight: 40,
    },
    
    // Button text
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
    
    // Caption
    caption: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 16,
    },
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  
  // Animation timings
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

// Utility functions for theme
export const getColor = (colorPath) => {
  const paths = colorPath.split('.');
  let color = theme.colors;
  
  for (const path of paths) {
    color = color[path];
  }
  
  return color;
};

export const getSpacing = (size) => theme.spacing[size] || size;
export const getBorderRadius = (size) => theme.borderRadius[size] || size;