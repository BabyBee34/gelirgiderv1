// FinanceFlow - Authentication Service (Cleaned for Production)
// Bu dosya artık mock data içermiyor, sadece gerekli auth fonksiyonları mevcut

import AsyncStorage from '@react-native-async-storage/async-storage';

// Development flag
const isDevelopment = __DEV__;

// Mock auth service (sadece development'ta)
class MockAuthService {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  // Mock login (sadece development'ta)
  async login(email, password) {
    if (!isDevelopment) {
      throw new Error('Mock auth service is not available in production');
    }

    // Development'ta basit mock login
    if (email && password) {
      this.isAuthenticated = true;
      this.currentUser = {
        id: 'mock-user-001',
        email,
        firstName: 'Test',
        lastName: 'User',
        isVerified: true
      };
      
      // Mock session storage
      await AsyncStorage.setItem('mock_user', JSON.stringify(this.currentUser));
      await AsyncStorage.setItem('mock_auth', 'true');
      
      return this.currentUser;
    }
    
    throw new Error('Invalid credentials');
  }

  // Mock logout
  async logout() {
    if (!isDevelopment) {
      throw new Error('Mock auth service is not available in production');
    }

    this.isAuthenticated = false;
    this.currentUser = null;
    
    // Mock session temizle
    await AsyncStorage.removeItem('mock_user');
    await AsyncStorage.removeItem('mock_auth');
  }

  // Mock user get
  async getCurrentUser() {
    if (!isDevelopment) {
      return null;
    }

    if (!this.currentUser) {
      const userData = await AsyncStorage.getItem('mock_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.isAuthenticated = true;
      }
    }
    
    return this.currentUser;
  }

  // Mock auth check
  async isAuthenticated() {
    if (!isDevelopment) {
      return false;
    }

    const authStatus = await AsyncStorage.getItem('mock_auth');
    return authStatus === 'true';
  }
}

// Export mock service (sadece development'ta)
export const mockAuthService = isDevelopment ? new MockAuthService() : null;

// Export default
export default {
  mockAuthService,
  isDevelopment
};
