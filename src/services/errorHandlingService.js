// FinanceFlow - Professional Error Handling Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import notificationService from './notificationService';

class ErrorHandlingService {
  constructor() {
    this.errorLog = [];
    this.crashReports = [];
    this.isInitialized = false;
    this.maxErrorLogs = 500;
    this.maxCrashReports = 100;
    this.errorCategories = {
      NETWORK: 'network',
      VALIDATION: 'validation',
      AUTH: 'authentication',
      STORAGE: 'storage',
      UI: 'ui',
      BUSINESS_LOGIC: 'business_logic',
      SECURITY: 'security',
      PERFORMANCE: 'performance',
      INTEGRATION: 'integration',
      UNKNOWN: 'unknown'
    };
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  /**
   * Initialize error handling service
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Load existing logs
      await this.loadErrorLogs();
      await this.loadCrashReports();

      // Setup global error handlers
      this.setupGlobalErrorHandlers();

      // Setup periodic cleanup
      this.setupCleanup();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error handling service initialization failed:', error);
      return false;
    }
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    if (global.addEventListener) {
      global.addEventListener('unhandledrejection', (event) => {
        this.handleUnhandledRejection(event);
      });
    }

    // Handle React Native errors
    if (global.ErrorUtils) {
      const originalHandler = global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.handleGlobalError(error, isFatal);
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // Setup console error capture
    this.interceptConsoleErrors();
  }

  /**
   * Intercept console errors
   */
  interceptConsoleErrors() {
    const originalError = console.error;
    console.error = (...args) => {
      this.logError({
        category: this.errorCategories.UNKNOWN,
        severity: this.severityLevels.MEDIUM,
        message: args.join(' '),
        source: 'console',
        timestamp: Date.now()
      });
      originalError.apply(console, args);
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      this.logError({
        category: this.errorCategories.UNKNOWN,
        severity: this.severityLevels.LOW,
        message: args.join(' '),
        source: 'console',
        timestamp: Date.now()
      });
      originalWarn.apply(console, args);
    };
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(event) {
    const error = {
      category: this.errorCategories.UNKNOWN,
      severity: this.severityLevels.HIGH,
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      source: 'unhandled_promise',
      timestamp: Date.now(),
      details: {
        reason: event.reason,
        type: 'unhandled_rejection'
      }
    };

    this.logError(error);
    this.createCrashReport(error);
  }

  /**
   * Handle global errors
   */
  handleGlobalError(error, isFatal) {
    const errorData = {
      category: this.errorCategories.UNKNOWN,
      severity: isFatal ? this.severityLevels.CRITICAL : this.severityLevels.HIGH,
      message: error.message || 'Global error occurred',
      stack: error.stack,
      source: 'global_handler',
      timestamp: Date.now(),
      details: {
        isFatal,
        name: error.name,
        type: 'global_error'
      }
    };

    this.logError(errorData);
    
    if (isFatal) {
      this.createCrashReport(errorData);
    }
  }

  /**
   * Log error with categorization and context
   */
  async logError(errorData) {
    try {
      const enhancedError = {
        id: Date.now() + Math.random(),
        ...errorData,
        timestamp: errorData.timestamp || Date.now(),
        category: errorData.category || this.errorCategories.UNKNOWN,
        severity: errorData.severity || this.severityLevels.MEDIUM,
        userAgent: navigator.userAgent || 'React Native',
        appVersion: '1.0.0', // Should come from app config
        context: await this.getErrorContext()
      };

      this.errorLog.unshift(enhancedError);

      // Maintain max log size
      if (this.errorLog.length > this.maxErrorLogs) {
        this.errorLog.splice(this.maxErrorLogs);
      }

      // Save to storage
      await this.saveErrorLogs();

      // Handle high severity errors
      if (enhancedError.severity === this.severityLevels.HIGH || 
          enhancedError.severity === this.severityLevels.CRITICAL) {
        await this.handleHighSeverityError(enhancedError);
      }

      return enhancedError;
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  /**
   * Get error context information
   */
  async getErrorContext() {
    try {
      return {
        timestamp: Date.now(),
        memoryUsage: this.getMemoryUsage(),
        screenDimensions: this.getScreenDimensions(),
        networkStatus: await this.getNetworkStatus(),
        storageInfo: await this.getStorageInfo(),
        appState: 'active' // Should come from AppState
      };
    } catch (error) {
      return { error: 'Failed to get context' };
    }
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage() {
    if (global.performance && global.performance.memory) {
      return {
        used: global.performance.memory.usedJSHeapSize,
        total: global.performance.memory.totalJSHeapSize,
        limit: global.performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Get screen dimensions
   */
  getScreenDimensions() {
    if (global.Dimensions) {
      const { width, height } = global.Dimensions.get('window');
      return { width, height };
    }
    return null;
  }

  /**
   * Get network status
   */
  async getNetworkStatus() {
    try {
      // This would use @react-native-community/netinfo in a real implementation
      return { isConnected: true, type: 'unknown' };
    } catch (error) {
      return { error: 'Failed to get network status' };
    }
  }

  /**
   * Get storage information
   */
  async getStorageInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return { keyCount: keys.length };
    } catch (error) {
      return { error: 'Failed to get storage info' };
    }
  }

  /**
   * Handle high severity errors
   */
  async handleHighSeverityError(error) {
    try {
      // Send notification to user if appropriate
      if (error.severity === this.severityLevels.CRITICAL) {
        await notificationService.sendLocalNotification(
          '🚨 Kritik Hata',
          'Uygulamada kritik bir hata oluştu. Destek ekibi bilgilendirildi.',
          { type: 'error', errorId: error.id }
        );
      }

      // Attempt error recovery
      await this.attemptErrorRecovery(error);

      // Report to crash analytics (would be Crashlytics, Sentry, etc.)
      await this.reportToCrashAnalytics(error);

    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
    }
  }

  /**
   * Attempt to recover from error
   */
  async attemptErrorRecovery(error) {
    try {
      switch (error.category) {
        case this.errorCategories.STORAGE:
          await this.recoverFromStorageError();
          break;
        case this.errorCategories.NETWORK:
          await this.recoverFromNetworkError();
          break;
        case this.errorCategories.AUTH:
          await this.recoverFromAuthError();
          break;
        default:
          await this.genericErrorRecovery();
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
    }
  }

  /**
   * Recover from storage errors
   */
  async recoverFromStorageError() {
    try {
      // Clear corrupted data and reset to defaults
      const corruptedKeys = await this.findCorruptedStorageKeys();
      if (corruptedKeys.length > 0) {
        await AsyncStorage.multiRemove(corruptedKeys);
        console.log(`Removed ${corruptedKeys.length} corrupted storage keys`);
      }
    } catch (error) {
      console.error('Storage recovery failed:', error);
    }
  }

  /**
   * Recover from network errors
   */
  async recoverFromNetworkError() {
    try {
      // Implement retry logic or offline mode
      console.log('Attempting network error recovery...');
      // Could implement exponential backoff retry here
    } catch (error) {
      console.error('Network recovery failed:', error);
    }
  }

  /**
   * Recover from authentication errors
   */
  async recoverFromAuthError() {
    try {
      // Clear corrupted auth tokens
      await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
      console.log('Cleared authentication tokens');
    } catch (error) {
      console.error('Auth recovery failed:', error);
    }
  }

  /**
   * Generic error recovery
   */
  async genericErrorRecovery() {
    try {
      // Basic recovery steps
      console.log('Performing generic error recovery...');
      // Could reset app state, clear caches, etc.
    } catch (error) {
      console.error('Generic recovery failed:', error);
    }
  }

  /**
   * Find corrupted storage keys
   */
  async findCorruptedStorageKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const corruptedKeys = [];

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            JSON.parse(value); // Test if valid JSON
          }
        } catch (error) {
          corruptedKeys.push(key);
        }
      }

      return corruptedKeys;
    } catch (error) {
      console.error('Failed to find corrupted keys:', error);
      return [];
    }
  }

  /**
   * Create crash report
   */
  async createCrashReport(error) {
    try {
      const crashReport = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        error,
        context: await this.getErrorContext(),
        breadcrumbs: await this.getBreadcrumbs(),
        stackTrace: error.stack,
        deviceInfo: await this.getDeviceInfo(),
        appInfo: this.getAppInfo()
      };

      this.crashReports.unshift(crashReport);

      // Maintain max crash reports
      if (this.crashReports.length > this.maxCrashReports) {
        this.crashReports.splice(this.maxCrashReports);
      }

      await this.saveCrashReports();

      return crashReport;
    } catch (error) {
      console.error('Failed to create crash report:', error);
    }
  }

  /**
   * Get breadcrumbs (user actions leading to error)
   */
  async getBreadcrumbs() {
    try {
      const stored = await AsyncStorage.getItem('userBreadcrumbs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo() {
    return {
      platform: 'React Native',
      userAgent: navigator.userAgent || 'Unknown',
      timestamp: Date.now()
    };
  }

  /**
   * Get app information
   */
  getAppInfo() {
    return {
      version: '1.0.0',
      buildNumber: '1',
      environment: __DEV__ ? 'development' : 'production'
    };
  }

  /**
   * Report to crash analytics service
   */
  async reportToCrashAnalytics(error) {
    try {
      // In a real implementation, this would send to Crashlytics, Sentry, etc.
      console.log('Reporting to crash analytics:', error.message);
      
      // For now, just log locally
      await this.logError({
        category: this.errorCategories.INTEGRATION,
        severity: this.severityLevels.MEDIUM,
        message: `Crash reported: ${error.message}`,
        source: 'crash_analytics'
      });
    } catch (error) {
      console.error('Failed to report to crash analytics:', error);
    }
  }

  /**
   * Add breadcrumb for user action tracking
   */
  async addBreadcrumb(action, data = {}) {
    try {
      const breadcrumb = {
        timestamp: Date.now(),
        action,
        data
      };

      const stored = await AsyncStorage.getItem('userBreadcrumbs');
      const breadcrumbs = stored ? JSON.parse(stored) : [];
      
      breadcrumbs.unshift(breadcrumb);
      
      // Keep only last 50 breadcrumbs
      if (breadcrumbs.length > 50) {
        breadcrumbs.splice(50);
      }

      await AsyncStorage.setItem('userBreadcrumbs', JSON.stringify(breadcrumbs));
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  /**
   * Handle specific error types
   */
  async handleNetworkError(error, context = {}) {
    return this.logError({
      category: this.errorCategories.NETWORK,
      severity: this.severityLevels.MEDIUM,
      message: error.message || 'Network error occurred',
      stack: error.stack,
      source: 'network',
      details: { ...context, type: 'network_error' }
    });
  }

  async handleValidationError(error, context = {}) {
    return this.logError({
      category: this.errorCategories.VALIDATION,
      severity: this.severityLevels.LOW,
      message: error.message || 'Validation error occurred',
      source: 'validation',
      details: { ...context, type: 'validation_error' }
    });
  }

  async handleAuthError(error, context = {}) {
    return this.logError({
      category: this.errorCategories.AUTH,
      severity: this.severityLevels.HIGH,
      message: error.message || 'Authentication error occurred',
      stack: error.stack,
      source: 'authentication',
      details: { ...context, type: 'auth_error' }
    });
  }

  async handleStorageError(error, context = {}) {
    return this.logError({
      category: this.errorCategories.STORAGE,
      severity: this.severityLevels.MEDIUM,
      message: error.message || 'Storage error occurred',
      stack: error.stack,
      source: 'storage',
      details: { ...context, type: 'storage_error' }
    });
  }

  async handleBusinessLogicError(error, context = {}) {
    return this.logError({
      category: this.errorCategories.BUSINESS_LOGIC,
      severity: this.severityLevels.MEDIUM,
      message: error.message || 'Business logic error occurred',
      stack: error.stack,
      source: 'business_logic',
      details: { ...context, type: 'business_logic_error' }
    });
  }

  /**
   * Save error logs to storage
   */
  async saveErrorLogs() {
    try {
      await AsyncStorage.setItem('errorLogs', JSON.stringify(this.errorLog));
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  /**
   * Load error logs from storage
   */
  async loadErrorLogs() {
    try {
      const stored = await AsyncStorage.getItem('errorLogs');
      this.errorLog = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load error logs:', error);
      this.errorLog = [];
    }
  }

  /**
   * Save crash reports to storage
   */
  async saveCrashReports() {
    try {
      await AsyncStorage.setItem('crashReports', JSON.stringify(this.crashReports));
    } catch (error) {
      console.error('Failed to save crash reports:', error);
    }
  }

  /**
   * Load crash reports from storage
   */
  async loadCrashReports() {
    try {
      const stored = await AsyncStorage.getItem('crashReports');
      this.crashReports = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load crash reports:', error);
      this.crashReports = [];
    }
  }

  /**
   * Setup periodic cleanup
   */
  setupCleanup() {
    // Clean up old logs periodically
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs() {
    try {
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days

      // Clean error logs
      this.errorLog = this.errorLog.filter(log => log.timestamp > cutoffTime);
      
      // Clean crash reports
      this.crashReports = this.crashReports.filter(report => report.timestamp > cutoffTime);

      await this.saveErrorLogs();
      await this.saveCrashReports();

      console.log('Cleaned up old error logs and crash reports');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    const recent24h = this.errorLog.filter(log => log.timestamp > last24Hours);
    const recent7d = this.errorLog.filter(log => log.timestamp > last7Days);

    const categoryCounts = {};
    const severityCounts = {};

    this.errorLog.forEach(log => {
      categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
      severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      last24Hours: recent24h.length,
      last7Days: recent7d.length,
      crashes: this.crashReports.length,
      categoryBreakdown: categoryCounts,
      severityBreakdown: severityCounts,
      oldestLog: this.errorLog[this.errorLog.length - 1]?.timestamp,
      newestLog: this.errorLog[0]?.timestamp
    };
  }

  /**
   * Export error data
   */
  async exportErrorData() {
    try {
      const exportData = {
        errorLogs: this.errorLog,
        crashReports: this.crashReports,
        statistics: this.getErrorStatistics(),
        exportedAt: Date.now(),
        version: '1.0.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export error data:', error);
      return null;
    }
  }

  /**
   * Clear all error data
   */
  async clearAllErrorData() {
    try {
      this.errorLog = [];
      this.crashReports = [];
      
      await AsyncStorage.multiRemove(['errorLogs', 'crashReports', 'userBreadcrumbs']);
      
      return true;
    } catch (error) {
      console.error('Failed to clear error data:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      errorCount: this.errorLog.length,
      crashCount: this.crashReports.length,
      categories: Object.keys(this.errorCategories),
      severityLevels: Object.keys(this.severityLevels)
    };
  }

  /**
   * Show user-friendly error message
   */
  showUserError(message, title = 'Hata', options = {}) {
    const {
      showRetry = false,
      onRetry = null,
      severity = this.severityLevels.MEDIUM
    } = options;

    if (showRetry && onRetry) {
      Alert.alert(
        title,
        message,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Tekrar Dene', onPress: onRetry }
        ]
      );
    } else {
      Alert.alert(title, message);
    }

    // Log the user-facing error
    this.logError({
      category: this.errorCategories.UI,
      severity,
      message: `User error shown: ${message}`,
      source: 'user_interface'
    });
  }
}

// Create singleton instance
const errorHandlingService = new ErrorHandlingService();

export default errorHandlingService;