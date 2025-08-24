// FinanceFlow - API Service Layer
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://api.financeflow.app', // Production URL
  DEV_URL: 'http://localhost:3000', // Development URL
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
};

// Environment detection
const isDevelopment = __DEV__;
const BASE_URL = isDevelopment ? API_CONFIG.DEV_URL : API_CONFIG.BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('financeflow_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error adding auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('financeflow_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await AsyncStorage.setItem('financeflow_auth_token', accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        await AsyncStorage.multiRemove([
          'financeflow_auth_token',
          'financeflow_refresh_token',
          'financeflow_user_data',
        ]);
        
        // Show login required message
        Alert.alert(
          'Oturum Süresi Doldu',
          'Lütfen tekrar giriş yapın',
          [{ text: 'Tamam' }]
        );
      }
    }

    // Handle network errors
    if (!error.response) {
      Alert.alert(
        'Bağlantı Hatası',
        'İnternet bağlantınızı kontrol edin',
        [{ text: 'Tamam' }]
      );
    }

    return Promise.reject(error);
  }
);

// API Response wrapper
export const apiResponse = {
  success: (data, message = 'İşlem başarılı') => ({
    success: true,
    data,
    message,
  }),
  
  error: (message = 'Bir hata oluştu', code = null) => ({
    success: false,
    error: message,
    code,
  }),
};

// Generic API methods
export const apiService = {
  // GET request
  async get(endpoint, config = {}) {
    try {
      const response = await api.get(endpoint, config);
      return apiResponse.success(response.data);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return apiResponse.error(message, error.response?.status);
    }
  },

  // POST request
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await api.post(endpoint, data, config);
      return apiResponse.success(response.data);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return apiResponse.error(message, error.response?.status);
    }
  },

  // PUT request
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await api.put(endpoint, data, config);
      return apiResponse.success(response.data);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return apiResponse.error(message, error.response?.status);
    }
  },

  // DELETE request
  async delete(endpoint, config = {}) {
    try {
      const response = await api.delete(endpoint, config);
      return apiResponse.success(response.data);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return apiResponse.error(message, error.response?.status);
    }
  },

  // PATCH request
  async patch(endpoint, data = {}, config = {}) {
    try {
      const response = await api.patch(endpoint, data, config);
      return apiResponse.success(response.data);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return apiResponse.error(message, error.response?.status);
    }
  },
};

// Export axios instance for custom requests
export { api };

// Export configuration
export { API_CONFIG, BASE_URL };
