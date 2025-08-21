// FinanceFlow - Authentication Context Provider
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { testUser } from '../utils/testData';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // AsyncStorage keys
  const STORAGE_KEYS = {
    USER_DATA: 'financeflow_user_data',
    AUTH_TOKEN: 'financeflow_auth_token',
    ONBOARDING_COMPLETED: 'financeflow_onboarding_completed',
    REMEMBER_ME: 'financeflow_remember_me',
  };

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if onboarding is completed
      const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      setHasCompletedOnboarding(onboardingCompleted === 'true');

      // Check if user is logged in
      const authToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (authToken && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      setIsLoading(true);

      // For now, use test user validation
      if (email === testUser.user.email && password === testUser.user.password) {
        const userData = {
          ...testUser.user,
          lastLogin: new Date().toISOString(),
        };

        // Save to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'test_token_' + Date.now());
        
        if (rememberMe) {
          await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        }

        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        return { 
          success: false, 
          error: 'Geçersiz e-posta veya şifre' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Giriş yapılırken bir hata oluştu' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.AUTH_TOKEN,
      ]);

      // Clear remember me if not set
      const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (rememberMe !== 'true') {
        await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Onboarding completion error:', error);
    }
  };

  // Update user data
  const updateUser = async (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('User update error:', error);
    }
  };

  // Check if user exists (for registration)
  const checkUserExists = async (email) => {
    // For now, check against test user
    return email === testUser.user.email;
  };

  // Register new user
  const register = async (userData) => {
    try {
      setIsLoading(true);

      // Check if user already exists
      const exists = await checkUserExists(userData.email);
      if (exists) {
        return { 
          success: false, 
          error: 'Bu e-posta adresi zaten kullanılıyor' 
        };
      }

      // Create new user (for now, just simulate)
      const newUser = {
        id: 'user_' + Date.now(),
        ...userData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isVerified: false,
        preferences: {
          currency: 'TRY',
          language: 'tr',
          notifications: true,
          darkMode: false,
        }
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(newUser));
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'token_' + Date.now());

      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: 'Kayıt olurken bir hata oluştu' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setIsLoading(true);
      
      // Check if user exists
      const exists = await checkUserExists(email);
      if (!exists) {
        return { 
          success: false, 
          error: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı' 
        };
      }

      // For now, just simulate password reset
      // In real app, this would send email
      return { 
        success: true, 
        message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: 'Şifre sıfırlama işlemi başarısız oldu' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    hasCompletedOnboarding,
    login,
    logout,
    register,
    resetPassword,
    completeOnboarding,
    updateUser,
    checkUserExists,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
