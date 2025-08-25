// FinanceFlow - Theme System
// Renk paleti ve design tokens
import responsive from './responsive';

// Base theme structure (without colors)
export const createTheme = (colors) => {
  return {
    colors,
    
    // Responsive layout
  layout: {
    headerHeight: responsive.responsiveLayout.headerHeight,
    tabBarHeight: responsive.responsiveLayout.tabBarHeight,
    contentPadding: responsive.responsiveLayout.contentPadding,
    sectionSpacing: responsive.responsiveLayout.sectionSpacing,
    safeAreaTop: responsive.responsiveLayout.safeAreaTop,
    safeAreaBottom: responsive.responsiveLayout.safeAreaBottom,
  },
  
  // Responsive grid
  grid: {
    columns: responsive.responsiveGrid.columns,
    gap: responsive.responsiveGrid.gap,
    getItemWidth: responsive.responsiveGrid.itemWidth,
  },
  
  // Responsive animations
  animations: {
    duration: responsive.responsiveAnimations.duration,
    easing: responsive.responsiveAnimations.easing,
  },
  
  // Screen dimensions
  screen: {
    width: responsive.screenDimensions.width,
    height: responsive.screenDimensions.height,
    isSmall: responsive.screenDimensions.isSmall,
    isMedium: responsive.screenDimensions.isMedium,
    isLarge: responsive.screenDimensions.isLarge,
    isTablet: responsive.screenDimensions.isTablet,
  },
  
  spacing: {
    xs: responsive.responsiveSpacing.xs,
    sm: responsive.responsiveSpacing.sm,
    md: responsive.responsiveSpacing.md,
    lg: responsive.responsiveSpacing.lg,
    xl: responsive.responsiveSpacing.xl,
    xxl: responsive.responsiveSpacing.xxl,
  },
  
  borderRadius: {
    sm: responsive.responsiveDimensions.borderRadius.sm,
    md: responsive.responsiveDimensions.borderRadius.md,
    lg: responsive.responsiveDimensions.borderRadius.lg,
    xl: responsive.responsiveDimensions.borderRadius.xl,
    full: 999,
  },
  
  typography: {
    // Headers - Inter Bold/SemiBold
    h1: {
      fontSize: responsive.responsiveFontSize.largeTitle,
      fontWeight: '700',
      lineHeight: responsive.verticalScale(40),
    },
    h2: {
      fontSize: responsive.responsiveFontSize.title,
      fontWeight: '600',
      lineHeight: responsive.verticalScale(32),
    },
    h3: {
      fontSize: responsive.responsiveFontSize.xl,
      fontWeight: '600',
      lineHeight: responsive.verticalScale(28),
    },
    h4: {
      fontSize: responsive.responsiveFontSize.lg,
      fontWeight: '600',
      lineHeight: responsive.verticalScale(24),
    },
    
    // Body - Inter Regular/Medium
    bodyLarge: {
      fontSize: responsive.responsiveFontSize.md,
      fontWeight: '400',
      lineHeight: responsive.verticalScale(24),
    },
    bodyMedium: {
      fontSize: responsive.responsiveFontSize.sm,
      fontWeight: '400',
      lineHeight: responsive.verticalScale(20),
    },
    bodySmall: {
      fontSize: responsive.responsiveFontSize.xs,
      fontWeight: '400',
      lineHeight: responsive.verticalScale(16),
    },
    
    // Numbers - SF Mono (para miktarları için)
    currency: {
      fontSize: responsive.responsiveFontSize.xl,
      fontWeight: '600',
      fontFamily: 'monospace',
      lineHeight: responsive.verticalScale(32),
    },
    currencyLarge: {
      fontSize: responsive.responsiveFontSize.largeTitle,
      fontWeight: '700',
      fontFamily: 'monospace',
      lineHeight: responsive.verticalScale(40),
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
};

// Utility functions for theme
export const getColor = (colorPath, theme) => {
  const paths = colorPath.split('.');
  let color = theme.colors;
  
  for (const path of paths) {
    color = color[path];
  }
  
  return color;
};

export const getSpacing = (size, theme) => theme.spacing[size] || size;
export const getBorderRadius = (size, theme) => theme.borderRadius[size] || size;

// Default light theme for backwards compatibility
export const theme = createTheme({
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
  
  // Interface elements
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  ripple: 'rgba(108, 99, 255, 0.12)',
  disabled: '#A0AEC0',
  placeholder: '#CBD5E0',
});