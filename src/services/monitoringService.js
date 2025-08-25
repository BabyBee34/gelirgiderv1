// FinanceFlow - Professional Monitoring & Analytics Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions, Platform } from 'react-native';
import errorHandlingService from './errorHandlingService';

class MonitoringService {
  constructor() {
    this.isInitialized = false;
    this.sessionId = null;
    this.userId = null;
    this.startTime = Date.now();
    this.events = [];
    this.performanceMetrics = [];
    this.userBehavior = [];
    this.systemHealth = {};
    this.featureUsage = {};
    this.screenViews = [];
    this.maxEvents = 1000;
    this.batchSize = 50;
    this.flushInterval = 30000; // 30 seconds
  }

  /**
   * Initialize monitoring service
   */
  async initialize(userId = null) {
    try {
      if (this.isInitialized) return;

      this.userId = userId;
      this.sessionId = this.generateSessionId();
      
      // Load cached data
      await this.loadCachedData();
      
      // Start monitoring
      this.startPerformanceMonitoring();
      this.startSystemHealthMonitoring();
      this.startBehaviorTracking();
      
      // Setup periodic data flushing
      this.setupPeriodicFlush();
      
      // Track app launch
      await this.trackEvent('app_launch', {
        sessionId: this.sessionId,
        platform: Platform.OS,
        version: Platform.Version
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Monitoring service initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user ID for monitoring context
   */
  async setUserId(userId) {
    try {
      this.userId = userId;
      
      // Track user ID change event
      await this.trackEvent('user_id_set', {
        userId: userId,
        sessionId: this.sessionId,
        timestamp: Date.now()
      }, 'user_context');
      
      // Update all cached data with new user ID
      await this.saveAllData();
      
      return true;
    } catch (error) {
      console.error('Set user ID error:', error);
      return false;
    }
  }

  /**
   * Track user events
   */
  async trackEvent(eventName, properties = {}, category = 'user_action') {
    try {
      const event = {
        id: Date.now() + Math.random(),
        name: eventName,
        category,
        properties: {
          ...properties,
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: Date.now(),
          platform: Platform.OS
        },
        timestamp: Date.now()
      };

      this.events.unshift(event);

      // Maintain max events
      if (this.events.length > this.maxEvents) {
        this.events.splice(this.maxEvents);
      }

      // Track feature usage
      this.trackFeatureUsage(eventName);

      // Save to storage
      await this.saveEvents();

      return event;
    } catch (error) {
      console.error('Track event error:', error);
    }
  }

  /**
   * Track screen views
   */
  async trackScreenView(screenName, previousScreen = null, params = {}) {
    const screenView = {
      id: Date.now() + Math.random(),
      screenName,
      previousScreen,
      params,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.screenViews.unshift(screenView);

    // Keep only last 100 screen views
    if (this.screenViews.length > 100) {
      this.screenViews.splice(100);
    }

    await this.trackEvent('screen_view', {
      screen: screenName,
      previous_screen: previousScreen,
      ...params
    }, 'navigation');

    return screenView;
  }

  /**
   * Track user behavior patterns
   */
  async trackUserBehavior(action, context = {}) {
    const behavior = {
      id: Date.now() + Math.random(),
      action,
      context,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.userBehavior.unshift(behavior);

    // Keep only last 500 behavior events
    if (this.userBehavior.length > 500) {
      this.userBehavior.splice(500);
    }

    await this.saveUserBehavior();
    return behavior;
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName) {
    if (!this.featureUsage[featureName]) {
      this.featureUsage[featureName] = {
        count: 0,
        firstUsed: Date.now(),
        lastUsed: Date.now()
      };
    }

    this.featureUsage[featureName].count += 1;
    this.featureUsage[featureName].lastUsed = Date.now();
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    // Monitor app performance every 10 seconds
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 10000);
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const metrics = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        sessionId: this.sessionId,
        memory: this.getMemoryUsage(),
        storage: await this.getStorageUsage(),
        network: await this.getNetworkInfo(),
        battery: await this.getBatteryInfo(),
        screen: this.getScreenInfo(),
        performance: this.getPerformanceInfo()
      };

      this.performanceMetrics.unshift(metrics);

      // Keep only last 100 metrics
      if (this.performanceMetrics.length > 100) {
        this.performanceMetrics.splice(100);
      }

      // Check for performance issues
      await this.checkPerformanceIssues(metrics);

      return metrics;
    } catch (error) {
      console.error('Performance metrics collection error:', error);
    }
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage() {
    if (global.performance && global.performance.memory) {
      const memory = global.performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usage_percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  /**
   * Get storage usage information
   */
  async getStorageUsage() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys.slice(0, 10)) { // Sample first 10 keys for performance
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        } catch (error) {
          // Skip corrupted keys
        }
      }

      return {
        keyCount: keys.length,
        estimatedSize: totalSize,
        estimatedTotalSize: (totalSize / Math.min(keys.length, 10)) * keys.length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      // This would use @react-native-community/netinfo in a real implementation
      return {
        isConnected: true,
        type: 'unknown',
        isInternetReachable: true
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get battery information
   */
  async getBatteryInfo() {
    try {
      // This would use react-native-device-info in a real implementation
      return {
        level: null,
        isCharging: null
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get screen information
   */
  getScreenInfo() {
    const { width, height } = Dimensions.get('window');
    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
    
    return {
      window: { width, height },
      screen: { width: screenWidth, height: screenHeight },
      scale: Dimensions.get('window').scale,
      fontScale: Dimensions.get('window').fontScale
    };
  }

  /**
   * Get performance information
   */
  getPerformanceInfo() {
    if (global.performance) {
      return {
        timing: global.performance.timing ? {
          navigationStart: global.performance.timing.navigationStart,
          loadEventEnd: global.performance.timing.loadEventEnd
        } : null,
        now: global.performance.now()
      };
    }
    return null;
  }

  /**
   * Check for performance issues
   */
  async checkPerformanceIssues(metrics) {
    const issues = [];

    // Check memory usage
    if (metrics.memory && metrics.memory.usage_percentage > 80) {
      issues.push({
        type: 'high_memory_usage',
        severity: 'warning',
        value: metrics.memory.usage_percentage,
        threshold: 80
      });
    }

    // Check storage usage
    if (metrics.storage && metrics.storage.keyCount > 1000) {
      issues.push({
        type: 'high_storage_usage',
        severity: 'warning',
        value: metrics.storage.keyCount,
        threshold: 1000
      });
    }

    // Log performance issues
    for (const issue of issues) {
      await errorHandlingService.logError({
        category: 'performance',
        severity: issue.severity === 'warning' ? 'medium' : 'high',
        message: `Performance issue detected: ${issue.type}`,
        source: 'performance_monitor',
        details: issue
      });
    }

    return issues;
  }

  /**
   * Start system health monitoring
   */
  startSystemHealthMonitoring() {
    // Check system health every 30 seconds
    setInterval(() => {
      this.checkSystemHealth();
    }, 30000);
  }

  /**
   * Check system health
   */
  async checkSystemHealth() {
    try {
      const health = {
        timestamp: Date.now(),
        sessionId: this.sessionId,
        storage: await this.checkStorageHealth(),
        network: await this.checkNetworkHealth(),
        services: await this.checkServicesHealth(),
        errors: await this.checkErrorRates()
      };

      this.systemHealth = health;

      // Log critical health issues
      if (health.storage.status === 'critical' || 
          health.network.status === 'critical' ||
          health.services.status === 'critical') {
        await this.trackEvent('system_health_critical', health, 'system');
      }

      return health;
    } catch (error) {
      console.error('System health check error:', error);
    }
  }

  /**
   * Check storage health
   */
  async checkStorageHealth() {
    try {
      const testKey = 'health_check_test';
      const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
      
      const writeStart = Date.now();
      await AsyncStorage.setItem(testKey, testValue);
      const writeTime = Date.now() - writeStart;
      
      const readStart = Date.now();
      const readValue = await AsyncStorage.getItem(testKey);
      const readTime = Date.now() - readStart;
      
      await AsyncStorage.removeItem(testKey);
      
      const isWorking = JSON.parse(readValue).test === true;
      const latency = writeTime + readTime;
      
      let status = 'healthy';
      if (!isWorking) {
        status = 'critical';
      } else if (latency > 1000) {
        status = 'warning';
      }

      return {
        status,
        isWorking,
        writeTime,
        readTime,
        totalLatency: latency
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Check network health
   */
  async checkNetworkHealth() {
    try {
      const start = Date.now();
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        timeout: 5000
      });
      const latency = Date.now() - start;
      
      const isWorking = response.ok;
      
      let status = 'healthy';
      if (!isWorking) {
        status = 'critical';
      } else if (latency > 3000) {
        status = 'warning';
      }

      return {
        status,
        isWorking,
        latency,
        statusCode: response.status
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Check services health
   */
  async checkServicesHealth() {
    try {
      // Check critical app services
      const services = {
        notification: !!global.notificationService,
        security: !!global.securityService,
        error_handling: !!global.errorHandlingService
      };

      const workingServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;
      const healthPercentage = (workingServices / totalServices) * 100;

      let status = 'healthy';
      if (healthPercentage < 50) {
        status = 'critical';
      } else if (healthPercentage < 80) {
        status = 'warning';
      }

      return {
        status,
        services,
        workingServices,
        totalServices,
        healthPercentage
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message
      };
    }
  }

  /**
   * Check error rates
   */
  async checkErrorRates() {
    try {
      const now = Date.now();
      const last5Minutes = now - (5 * 60 * 1000);
      const last1Hour = now - (60 * 60 * 1000);

      const recentErrors = this.events.filter(
        event => event.category === 'error' && event.timestamp > last5Minutes
      );
      
      const hourlyErrors = this.events.filter(
        event => event.category === 'error' && event.timestamp > last1Hour
      );

      const errorRate5min = recentErrors.length;
      const errorRateHourly = hourlyErrors.length;

      let status = 'healthy';
      if (errorRate5min > 10) {
        status = 'critical';
      } else if (errorRate5min > 5 || errorRateHourly > 50) {
        status = 'warning';
      }

      return {
        status,
        errorRate5min,
        errorRateHourly,
        totalErrors: hourlyErrors.length
      };
    } catch (error) {
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Start behavior tracking
   */
  startBehaviorTracking() {
    // Track session duration
    this.trackSessionDuration();
  }

  /**
   * Track session duration
   */
  trackSessionDuration() {
    setInterval(() => {
      const duration = Date.now() - this.startTime;
      this.trackEvent('session_heartbeat', {
        duration,
        sessionId: this.sessionId
      }, 'session');
    }, 60000); // Every minute
  }

  /**
   * Track user journey
   */
  async trackUserJourney(step, context = {}) {
    return await this.trackEvent('user_journey', {
      step,
      context,
      timestamp: Date.now()
    }, 'journey');
  }

  /**
   * Track conversion events
   */
  async trackConversion(event, value = null, currency = 'TRY') {
    return await this.trackEvent('conversion', {
      event,
      value,
      currency,
      timestamp: Date.now()
    }, 'conversion');
  }

  /**
   * Setup periodic data flushing
   */
  setupPeriodicFlush() {
    setInterval(() => {
      this.flushData();
    }, this.flushInterval);
  }

  /**
   * Flush data to storage and analytics
   */
  async flushData() {
    try {
      await this.saveAllData();
      
      // In a real implementation, this would send data to analytics service
      console.log('Data flushed to storage');
      
      return true;
    } catch (error) {
      console.error('Data flush error:', error);
      return false;
    }
  }

  /**
   * Get analytics dashboard data
   */
  getAnalyticsDashboard() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    // Event analytics
    const events24h = this.events.filter(e => e.timestamp > last24Hours);
    const events7d = this.events.filter(e => e.timestamp > last7Days);

    // Screen analytics
    const screenViews24h = this.screenViews.filter(s => s.timestamp > last24Hours);
    const screenViews7d = this.screenViews.filter(s => s.timestamp > last7Days);

    // Most used features
    const topFeatures = Object.entries(this.featureUsage)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10);

    // Most visited screens
    const screenCounts = {};
    screenViews7d.forEach(view => {
      screenCounts[view.screenName] = (screenCounts[view.screenName] || 0) + 1;
    });
    
    const topScreens = Object.entries(screenCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      overview: {
        totalEvents: this.events.length,
        events24h: events24h.length,
        events7d: events7d.length,
        totalScreenViews: this.screenViews.length,
        screenViews24h: screenViews24h.length,
        screenViews7d: screenViews7d.length,
        sessionDuration: now - this.startTime,
        featureUsageCount: Object.keys(this.featureUsage).length
      },
      features: {
        topFeatures: topFeatures.map(([name, data]) => ({
          name,
          count: data.count,
          lastUsed: data.lastUsed
        }))
      },
      screens: {
        topScreens: topScreens.map(([name, count]) => ({ name, count }))
      },
      performance: {
        latestMetrics: this.performanceMetrics[0],
        avgMemoryUsage: this.getAverageMetric('memory.usage_percentage'),
        avgLatency: this.getAverageMetric('storage.totalLatency')
      },
      systemHealth: this.systemHealth
    };
  }

  /**
   * Get average metric value
   */
  getAverageMetric(metricPath) {
    try {
      const values = this.performanceMetrics
        .map(metric => this.getNestedValue(metric, metricPath))
        .filter(value => value !== null && value !== undefined);
      
      if (values.length === 0) return null;
      
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get nested object value by path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Load cached data
   */
  async loadCachedData() {
    try {
      const [events, metrics, behavior, features, screenViews] = await Promise.all([
        AsyncStorage.getItem('monitoring_events'),
        AsyncStorage.getItem('monitoring_metrics'),
        AsyncStorage.getItem('monitoring_behavior'),
        AsyncStorage.getItem('monitoring_features'),
        AsyncStorage.getItem('monitoring_screen_views')
      ]);

      this.events = events ? JSON.parse(events) : [];
      this.performanceMetrics = metrics ? JSON.parse(metrics) : [];
      this.userBehavior = behavior ? JSON.parse(behavior) : [];
      this.featureUsage = features ? JSON.parse(features) : {};
      this.screenViews = screenViews ? JSON.parse(screenViews) : [];
    } catch (error) {
      console.error('Load cached data error:', error);
    }
  }

  /**
   * Save all data to storage
   */
  async saveAllData() {
    try {
      await Promise.all([
        this.saveEvents(),
        this.saveMetrics(),
        this.saveUserBehavior(),
        this.saveFeatureUsage(),
        this.saveScreenViews()
      ]);
      return true;
    } catch (error) {
      console.error('Save all data error:', error);
      return false;
    }
  }

  /**
   * Save individual data types
   */
  async saveEvents() {
    await AsyncStorage.setItem('monitoring_events', JSON.stringify(this.events));
  }

  async saveMetrics() {
    await AsyncStorage.setItem('monitoring_metrics', JSON.stringify(this.performanceMetrics));
  }

  async saveUserBehavior() {
    await AsyncStorage.setItem('monitoring_behavior', JSON.stringify(this.userBehavior));
  }

  async saveFeatureUsage() {
    await AsyncStorage.setItem('monitoring_features', JSON.stringify(this.featureUsage));
  }

  async saveScreenViews() {
    await AsyncStorage.setItem('monitoring_screen_views', JSON.stringify(this.screenViews));
  }

  /**
   * Export monitoring data
   */
  async exportData() {
    try {
      const exportData = {
        sessionId: this.sessionId,
        userId: this.userId,
        startTime: this.startTime,
        exportTime: Date.now(),
        events: this.events,
        performanceMetrics: this.performanceMetrics,
        userBehavior: this.userBehavior,
        featureUsage: this.featureUsage,
        screenViews: this.screenViews,
        systemHealth: this.systemHealth,
        analytics: this.getAnalyticsDashboard()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Export data error:', error);
      return null;
    }
  }

  /**
   * Clear all monitoring data
   */
  async clearAllData() {
    try {
      this.events = [];
      this.performanceMetrics = [];
      this.userBehavior = [];
      this.featureUsage = {};
      this.screenViews = [];
      this.systemHealth = {};

      await AsyncStorage.multiRemove([
        'monitoring_events',
        'monitoring_metrics',
        'monitoring_behavior',
        'monitoring_features',
        'monitoring_screen_views'
      ]);

      return true;
    } catch (error) {
      console.error('Clear monitoring data error:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      sessionId: this.sessionId,
      userId: this.userId,
      uptime: Date.now() - this.startTime,
      eventCount: this.events.length,
      metricsCount: this.performanceMetrics.length,
      behaviorCount: this.userBehavior.length,
      featureCount: Object.keys(this.featureUsage).length,
      screenViewCount: this.screenViews.length
    };
  }

  /**
   * End session
   */
  async endSession() {
    try {
      const sessionDuration = Date.now() - this.startTime;
      
      await this.trackEvent('session_end', {
        sessionId: this.sessionId,
        duration: sessionDuration,
        eventCount: this.events.length,
        screenViewCount: this.screenViews.length
      }, 'session');

      await this.flushData();
      return true;
    } catch (error) {
      console.error('End session error:', error);
      return false;
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

export default monitoringService;