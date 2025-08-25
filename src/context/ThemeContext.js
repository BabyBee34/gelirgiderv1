// FinanceFlow - Theme Context
// Karanlık/Açık tema yönetimi ve sistem teması algılama
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

// Theme types
export const THEME_TYPES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Light theme colors
const lightTheme = {
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
    
    // Interface elements
    surface: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    ripple: 'rgba(108, 99, 255, 0.12)',
    disabled: '#A0AEC0',
    placeholder: '#CBD5E0',
  },
  isDark: false
};

// Dark theme colors
const darkTheme = {
  colors: {
    // Ana renk paleti - dark versiyonları
    primary: '#7C6AFF',      // Lighter Soft Purple
    secondary: '#5EDCD4',    // Lighter Mint Green
    accent: '#FFEB7A',       // Lighter Soft Yellow
    background: '#121212',   // Very Dark Gray
    cards: '#1E1E1E',        // Dark Gray
    
    // Text renkler - dark için
    textPrimary: '#FFFFFF',   // White
    textSecondary: '#B0BEC5', // Light Gray
    
    // Status renkler - dark optimized
    success: '#4CAF50',       // Material Green
    warning: '#FF9800',       // Material Orange
    error: '#F44336',         // Material Red
    
    // Border rengi - dark
    border: '#333333',        // Dark Border
    
    // Gradients - dark compatible
    primaryGradient: ['#7C6AFF', '#5EDCD4'],
    backgroundGradient: ['#1E1E1E', '#2D2D2D'],
    
    // Interface elements
    surface: '#2D2D2D',
    overlay: 'rgba(0, 0, 0, 0.7)',
    ripple: 'rgba(124, 106, 255, 0.24)',
    disabled: '#4A5568',
    placeholder: '#718096',
  },
  isDark: true
};

// Context
const ThemeContext = createContext();

// Provider component
export const ThemeProvider = ({ children }) => {
  const [themeType, setThemeType] = useState(THEME_TYPES.SYSTEM);
  const [currentTheme, setCurrentTheme] = useState(lightTheme);
  const systemColorScheme = useColorScheme();

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system theme or preference changes
  useEffect(() => {
    updateCurrentTheme();
  }, [themeType, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_preference');
      if (savedTheme && Object.values(THEME_TYPES).includes(savedTheme)) {
        setThemeType(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (theme) => {
    try {
      await AsyncStorage.setItem('@theme_preference', theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const updateCurrentTheme = () => {
    let shouldUseDark = false;

    switch (themeType) {
      case THEME_TYPES.DARK:
        shouldUseDark = true;
        break;
      case THEME_TYPES.LIGHT:
        shouldUseDark = false;
        break;
      case THEME_TYPES.SYSTEM:
      default:
        shouldUseDark = systemColorScheme === 'dark';
        break;
    }

    setCurrentTheme(shouldUseDark ? darkTheme : lightTheme);
  };

  const setTheme = async (newThemeType) => {
    setThemeType(newThemeType);
    await saveThemePreference(newThemeType);
  };

  const toggleTheme = async () => {
    const newTheme = themeType === THEME_TYPES.LIGHT ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;
    await setTheme(newTheme);
  };

  const value = {
    // Current theme object
    theme: currentTheme,
    
    // Theme type (light, dark, system)
    themeType,
    
    // Theme setters
    setTheme,
    toggleTheme,
    
    // Utility functions
    isDark: currentTheme.isDark,
    isSystem: themeType === THEME_TYPES.SYSTEM,
    
    // Theme types for reference
    THEME_TYPES,
    
    // System color scheme
    systemColorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// HOC for theme support
export const withTheme = (Component) => {
  return (props) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

export default ThemeContext;