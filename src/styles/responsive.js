// FinanceFlow - Responsive Design System
import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions
const baseWidth = 375; // iPhone X width as base
const baseHeight = 812; // iPhone X height as base

// Scale functions
const scale = (size) => (screenWidth / baseWidth) * size;
const verticalScale = (size) => (screenHeight / baseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Screen classifications
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;
const isTablet = screenWidth >= 768;

// Responsive spacing
const responsiveSpacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// Responsive font sizes
const responsiveFontSize = {
  xs: moderateScale(12),
  sm: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  title: moderateScale(28),
  largeTitle: moderateScale(32),
};

// Responsive dimensions
const responsiveDimensions = {
  borderRadius: {
    sm: scale(8),
    md: scale(12),
    lg: scale(16),
    xl: scale(20),
  },
  iconSize: {
    sm: scale(16),
    md: scale(24),
    lg: scale(32),
    xl: scale(40),
  },
  buttonHeight: {
    sm: verticalScale(36),
    md: verticalScale(44),
    lg: verticalScale(52),
  },
};

// Responsive shadows
const responsiveShadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(8),
    },
    shadowOpacity: 0.2,
    shadowRadius: scale(12),
    elevation: 10,
  },
};

// Responsive layout
const responsiveLayout = {
  headerHeight: verticalScale(60),
  tabBarHeight: verticalScale(80),
  contentPadding: scale(16),
  sectionSpacing: verticalScale(24),
  safeAreaTop: verticalScale(44),
  safeAreaBottom: verticalScale(34),
};

// Responsive grid
const gridColumns = isTablet ? 4 : 2;
const gridGap = scale(16);
const responsiveGrid = {
  columns: gridColumns,
  gap: gridGap,
  itemWidth: (screenWidth - (gridGap * (gridColumns + 1))) / gridColumns,
};

// Responsive animations
const responsiveAnimations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
  },
};

// Screen dimensions
const screenDimensions = {
  width: screenWidth,
  height: screenHeight,
  isSmall: isSmallScreen,
  isMedium: isMediumScreen,
  isLarge: isLargeScreen,
  isTablet: isTablet,
};

export default {
  scale,
  verticalScale,
  moderateScale,
  responsiveSpacing,
  responsiveFontSize,
  responsiveDimensions,
  responsiveShadows,
  responsiveLayout,
  responsiveGrid,
  responsiveAnimations,
  screenDimensions,
};