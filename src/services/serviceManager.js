// FinanceFlow - Professional Service Manager
// Manages initialization and coordination of all professional services

import notificationService from './notificationService';
import securityService from './securityService';
import errorHandlingService from './errorHandlingService';
import monitoringService from './monitoringService';
import testingService from './testingService';

class ServiceManager {
  constructor() {
    this.services = {};
    this.initializationOrder = [
      'errorHandling',
      'security', 
      'monitoring',
      'notification',
      'testing'
    ];
    this.isInitialized = false;
    this.initializationStatus = {};
  }

  /**
   * Initialize all professional services in proper order
   */
  async initializeServices(userId = null) {
    try {
      console.log('🚀 Starting Professional Services Initialization...');
      
      // Reset status
      this.initializationStatus = {};
      
      // Register services
      this.services = {
        errorHandling: errorHandlingService,
        security: securityService,
        monitoring: monitoringService,
        notification: notificationService,
        testing: testingService
      };

      // Initialize services in order
      for (const serviceName of this.initializationOrder) {
        await this.initializeService(serviceName, userId);
      }

      // Run post-initialization setup
      await this.postInitializationSetup(userId);
      
      this.isInitialized = true;
      
      console.log('✅ All Professional Services Initialized Successfully');
      console.log('📊 Service Status:', this.getInitializationSummary());
      
      return true;
    } catch (error) {
      console.error('❌ Service Manager Initialization Failed:', error);
      await errorHandlingService.logError({
        category: 'INTEGRATION',
        severity: 'CRITICAL',
        message: `Service manager initialization failed: ${error.message}`,
        source: 'service_manager'
      });
      return false;
    }
  }

  /**
   * Initialize individual service
   */
  async initializeService(serviceName, userId) {
    try {
      console.log(`🔧 Initializing ${serviceName} service...`);
      
      const service = this.services[serviceName];
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }

      const startTime = Date.now();
      
      // Call service-specific initialization
      let result = false;
      switch (serviceName) {
        case 'errorHandling':
          result = await service.initialize();
          break;
        case 'security':
          result = await service.initialize();
          break;
        case 'monitoring':
          result = await service.initialize(userId);
          break;
        case 'notification':
          result = await service.initialize();
          break;
        case 'testing':
          result = await service.initialize();
          break;
        default:
          result = await service.initialize();
      }

      const duration = Date.now() - startTime;
      
      this.initializationStatus[serviceName] = {
        success: result,
        duration,
        timestamp: Date.now()
      };

      if (result) {
        console.log(`  ✅ ${serviceName} service initialized (${duration}ms)`);
      } else {
        console.log(`  ❌ ${serviceName} service failed to initialize`);
      }

      return result;
    } catch (error) {
      console.error(`❌ Failed to initialize ${serviceName}:`, error);
      this.initializationStatus[serviceName] = {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
      return false;
    }
  }

  /**
   * Post-initialization setup and integration
   */
  async postInitializationSetup(userId) {
    try {
      console.log('🔗 Running Post-Initialization Setup...');

      // Send initialization success notification
      if (this.services.notification) {
        await this.services.notification.sendLocalNotification(
          '🚀 FinanceFlow Ready',
          'Tüm sistem servisleri başarıyla başlatıldı',
          { type: 'system', category: 'general' }
        );
      }

      // Log successful initialization
      if (this.services.monitoring) {
        await this.services.monitoring.trackEvent('services_initialized', {
          services: this.initializationOrder,
          success_count: Object.values(this.initializationStatus).filter(s => s.success).length,
          total_duration: Object.values(this.initializationStatus).reduce((sum, s) => sum + (s.duration || 0), 0)
        });
      }

      // Run health check
      if (this.services.testing) {
        setTimeout(async () => {
          const healthCheck = await this.services.testing.runQuickTest();
          console.log('🏥 Health Check Result:', healthCheck);
        }, 2000);
      }

      console.log('✅ Post-Initialization Setup Complete');
    } catch (error) {
      console.error('❌ Post-Initialization Setup Failed:', error);
    }
  }

  /**
   * Get initialization summary
   */
  getInitializationSummary() {
    const total = this.initializationOrder.length;
    const successful = Object.values(this.initializationStatus).filter(s => s.success).length;
    const failed = total - successful;
    const totalDuration = Object.values(this.initializationStatus).reduce((sum, s) => sum + (s.duration || 0), 0);

    return {
      total,
      successful,
      failed,
      successRate: (successful / total * 100).toFixed(1) + '%',
      totalDuration: totalDuration + 'ms',
      status: this.initializationStatus
    };
  }

  /**
   * Get service instance
   */
  getService(serviceName) {
    return this.services[serviceName];
  }

  /**
   * Get all services
   */
  getAllServices() {
    return this.services;
  }

  /**
   * Check if services are ready
   */
  isReady() {
    return this.isInitialized && Object.values(this.initializationStatus).every(s => s.success);
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    try {
      const health = {};
      
      for (const [serviceName, service] of Object.entries(this.services)) {
        try {
          // Get service status if available
          if (service.getServiceStatus) {
            health[serviceName] = service.getServiceStatus();
          } else if (service.getStatus) {
            health[serviceName] = service.getStatus();
          } else {
            health[serviceName] = { status: 'unknown' };
          }
        } catch (error) {
          health[serviceName] = { status: 'error', error: error.message };
        }
      }

      return {
        overall: this.isReady() ? 'healthy' : 'degraded',
        services: health,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        overall: 'error',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Restart failed services
   */
  async restartFailedServices(userId = null) {
    try {
      console.log('🔄 Restarting Failed Services...');
      
      const failedServices = Object.entries(this.initializationStatus)
        .filter(([_, status]) => !status.success)
        .map(([serviceName, _]) => serviceName);

      if (failedServices.length === 0) {
        console.log('✅ No failed services to restart');
        return true;
      }

      let restartedCount = 0;
      for (const serviceName of failedServices) {
        const success = await this.initializeService(serviceName, userId);
        if (success) {
          restartedCount++;
        }
      }

      console.log(`🔄 Restarted ${restartedCount}/${failedServices.length} failed services`);
      return restartedCount === failedServices.length;
    } catch (error) {
      console.error('❌ Failed to restart services:', error);
      return false;
    }
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown() {
    try {
      console.log('🛑 Shutting Down Professional Services...');

      // End monitoring session
      if (this.services.monitoring) {
        await this.services.monitoring.endSession();
      }

      // Final error log flush
      if (this.services.errorHandling) {
        await this.services.errorHandling.saveErrorLogs();
      }

      // Send shutdown notification
      if (this.services.notification) {
        await this.services.notification.sendLocalNotification(
          '👋 FinanceFlow Closed',
          'Uygulama güvenli şekilde kapatıldı',
          { type: 'system', category: 'general' }
        );
      }

      this.isInitialized = false;
      console.log('✅ Services Shutdown Complete');
      
      return true;
    } catch (error) {
      console.error('❌ Service Shutdown Failed:', error);
      return false;
    }
  }

  /**
   * Handle user login
   */
  async handleUserLogin(user) {
    try {
      console.log('👤 Handling User Login for Services...');

      // Update monitoring with user context
      if (this.services.monitoring) {
        await this.services.monitoring.setUserId(user.id);
        await this.services.monitoring.trackEvent('user_login', {
          userId: user.id,
          timestamp: Date.now()
        });
      }

      // Update security context
      if (this.services.security) {
        await this.services.security.createSession(user.id);
      }

      // Setup user-specific notifications
      if (this.services.notification) {
        await this.services.notification.setupUserNotifications(user);
      }

      console.log('✅ User Login Handled Successfully');
    } catch (error) {
      console.error('❌ User Login Handling Failed:', error);
      if (this.services.errorHandling) {
        await this.services.errorHandling.logError({
          category: 'AUTH',
          severity: 'MEDIUM',
          message: `User login handling failed: ${error.message}`,
          source: 'service_manager'
        });
      }
    }
  }

  /**
   * Handle user logout
   */
  async handleUserLogout() {
    try {
      console.log('👤 Handling User Logout for Services...');

      // Clear security session
      if (this.services.security) {
        await this.services.security.clearSession();
      }

      // End monitoring session
      if (this.services.monitoring) {
        await this.services.monitoring.trackEvent('user_logout', {
          timestamp: Date.now()
        });
      }

      console.log('✅ User Logout Handled Successfully');
    } catch (error) {
      console.error('❌ User Logout Handling Failed:', error);
    }
  }

  /**
   * Run comprehensive system test
   */
  async runSystemTest() {
    try {
      if (!this.services.testing) {
        console.warn('Testing service not available');
        return null;
      }

      console.log('🧪 Running Comprehensive System Test...');
      const testResults = await this.services.testing.runComprehensiveTests();
      
      // Log test results
      if (this.services.monitoring) {
        await this.services.monitoring.trackEvent('system_test_completed', {
          passed: testResults.passed,
          total: testResults.total,
          passRate: testResults.passRate,
          duration: testResults.duration
        });
      }

      return testResults;
    } catch (error) {
      console.error('❌ System Test Failed:', error);
      return null;
    }
  }
}

// Create singleton instance
const serviceManager = new ServiceManager();

export default serviceManager;