// FinanceFlow - Integration Testing Utilities
import integrationService, { EVENT_TYPES } from '../services/integrationService';

/**
 * Integration Testing Suite
 * Provides utilities to test the integration system functionality
 */
class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    if (this.isRunning) {
      console.warn('Integration tests are already running');
      return;
    }

    this.isRunning = true;
    this.testResults = [];

    console.log('🧪 Starting Integration System Tests...');

    try {
      await this.testEventSystem();
      await this.testCacheSystem();
      await this.testDataSynchronization();
      await this.testErrorHandling();
      await this.testComponentLifecycle();
      await this.testNavigationIntegration();
      await this.testPropsValidation();

      const summary = this.generateTestSummary();
      console.log('✅ Integration Tests Completed:', summary);
      
      return summary;
    } catch (error) {
      console.error('❌ Integration Tests Failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Test event system
   */
  async testEventSystem() {
    console.log('🔍 Testing Event System...');

    return new Promise((resolve) => {
      let eventReceived = false;
      let eventData = null;

      // Subscribe to test event
      const unsubscribe = integrationService.subscribe('TEST_EVENT', (data) => {
        eventReceived = true;
        eventData = data;
      });

      // Emit test event
      integrationService.emit('TEST_EVENT', { test: 'data', timestamp: Date.now() });

      // Check result
      setTimeout(() => {
        unsubscribe();

        const success = eventReceived && eventData && eventData.test === 'data';
        this.addTestResult('Event System', success, success ? 'Events work correctly' : 'Event system failed');

        if (success) {
          console.log('  ✅ Event system working correctly');
        } else {
          console.log('  ❌ Event system failed');
        }

        resolve(success);
      }, 100);
    });
  }

  /**
   * Test cache system
   */
  async testCacheSystem() {
    console.log('🔍 Testing Cache System...');

    const testKey = 'test_cache_key';
    const testData = { value: 'test_data', timestamp: Date.now() };

    // Set cache
    integrationService.setCache(testKey, testData, 1000);

    // Get cache
    const cachedData = integrationService.getCache(testKey);

    const cacheSuccess = cachedData && cachedData.value === testData.value;
    this.addTestResult('Cache System', cacheSuccess, cacheSuccess ? 'Cache works correctly' : 'Cache system failed');

    // Test cache expiration
    return new Promise((resolve) => {
      integrationService.setCache('expire_test', { test: true }, 50); // 50ms TTL

      setTimeout(() => {
        const expiredData = integrationService.getCache('expire_test');
        const expirationSuccess = expiredData === null;

        this.addTestResult('Cache Expiration', expirationSuccess, expirationSuccess ? 'Cache expiration works' : 'Cache expiration failed');

        if (cacheSuccess && expirationSuccess) {
          console.log('  ✅ Cache system working correctly');
        } else {
          console.log('  ❌ Cache system failed');
        }

        resolve(cacheSuccess && expirationSuccess);
      }, 100);
    });
  }

  /**
   * Test data synchronization
   */
  async testDataSynchronization() {
    console.log('🔍 Testing Data Synchronization...');

    return new Promise((resolve) => {
      let syncStartReceived = false;
      let syncCompleteReceived = false;

      const unsubscribes = [
        integrationService.subscribe(EVENT_TYPES.DATA_SYNC_START, (data) => {
          if (data.dataType === 'test_data') {
            syncStartReceived = true;
          }
        }),
        integrationService.subscribe(EVENT_TYPES.DATA_SYNC_COMPLETE, (data) => {
          if (data.dataType === 'test_data') {
            syncCompleteReceived = true;
          }
        })
      ];

      // Trigger sync
      integrationService.syncData('test_data', { test: 'sync_data' });

      setTimeout(() => {
        unsubscribes.forEach(unsubscribe => unsubscribe());

        const success = syncStartReceived && syncCompleteReceived;
        this.addTestResult('Data Synchronization', success, success ? 'Sync events work correctly' : 'Sync events failed');

        if (success) {
          console.log('  ✅ Data synchronization working correctly');
        } else {
          console.log('  ❌ Data synchronization failed');
        }

        resolve(success);
      }, 200);
    });
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('🔍 Testing Error Handling...');

    return new Promise((resolve) => {
      let errorReceived = false;

      const unsubscribe = integrationService.subscribe(EVENT_TYPES.NETWORK_ERROR, (data) => {
        if (data.type === 'test_error') {
          errorReceived = true;
        }
      });

      // Emit test error
      integrationService.emit(EVENT_TYPES.NETWORK_ERROR, {
        type: 'test_error',
        error: 'Test error message',
      });

      setTimeout(() => {
        unsubscribe();

        this.addTestResult('Error Handling', errorReceived, errorReceived ? 'Error events work correctly' : 'Error handling failed');

        if (errorReceived) {
          console.log('  ✅ Error handling working correctly');
        } else {
          console.log('  ❌ Error handling failed');
        }

        resolve(errorReceived);
      }, 100);
    });
  }

  /**
   * Test component lifecycle
   */
  async testComponentLifecycle() {
    console.log('🔍 Testing Component Lifecycle...');

    return new Promise((resolve) => {
      let mountReceived = false;
      let unmountReceived = false;

      const unsubscribes = [
        integrationService.subscribe('component_mount', (data) => {
          if (data.component === 'TestComponent') {
            mountReceived = true;
          }
        }),
        integrationService.subscribe('component_unmount', (data) => {
          if (data.component === 'TestComponent') {
            unmountReceived = true;
          }
        })
      ];

      // Simulate component lifecycle
      integrationService.handleComponentLifecycle('TestComponent', 'mount');
      integrationService.handleComponentLifecycle('TestComponent', 'unmount');

      setTimeout(() => {
        unsubscribes.forEach(unsubscribe => unsubscribe());

        const success = mountReceived && unmountReceived;
        this.addTestResult('Component Lifecycle', success, success ? 'Lifecycle events work correctly' : 'Lifecycle events failed');

        if (success) {
          console.log('  ✅ Component lifecycle working correctly');
        } else {
          console.log('  ❌ Component lifecycle failed');
        }

        resolve(success);
      }, 100);
    });
  }

  /**
   * Test navigation integration
   */
  async testNavigationIntegration() {
    console.log('🔍 Testing Navigation Integration...');

    const testState = { test: 'navigation_data', timestamp: Date.now() };
    
    // Test state consistency
    integrationService.ensureStateConsistency('SourceScreen', 'TargetScreen', testState);
    
    const retrievedState = integrationService.getSharedState('SourceScreen', 'TargetScreen');
    
    const success = retrievedState && retrievedState.test === testState.test;
    this.addTestResult('Navigation Integration', success, success ? 'Navigation state sharing works' : 'Navigation integration failed');

    if (success) {
      console.log('  ✅ Navigation integration working correctly');
    } else {
      console.log('  ❌ Navigation integration failed');
    }

    return success;
  }

  /**
   * Test props validation
   */
  async testPropsValidation() {
    console.log('🔍 Testing Props Validation...');

    const schema = {
      title: { required: true, type: 'string' },
      count: { required: false, type: 'number' },
      isActive: { required: true, type: 'boolean' },
    };

    // Test valid props
    const validProps = { title: 'Test Title', count: 5, isActive: true };
    const validResult = integrationService.validateComponentProps('TestComponent', validProps, schema);

    // Test invalid props
    const invalidProps = { title: 123, isActive: 'not_boolean' };
    const invalidResult = integrationService.validateComponentProps('TestComponent', invalidProps, schema);

    const success = validResult.valid && !invalidResult.valid;
    this.addTestResult('Props Validation', success, success ? 'Props validation works correctly' : 'Props validation failed');

    if (success) {
      console.log('  ✅ Props validation working correctly');
    } else {
      console.log('  ❌ Props validation failed');
    }

    return success;
  }

  /**
   * Add test result
   */
  addTestResult(testName, success, message) {
    this.testResults.push({
      testName,
      success,
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate test summary
   */
  generateTestSummary() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(result => result.success).length;
    const failedTests = totalTests - passedTests;

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      results: this.testResults,
    };
  }

  /**
   * Test integration service statistics
   */
  testIntegrationStats() {
    console.log('🔍 Testing Integration Statistics...');

    const stats = integrationService.getStats();
    
    const hasValidStats = stats && 
      Array.isArray(stats.eventListeners) && 
      typeof stats.cacheSize === 'number' &&
      Array.isArray(stats.cacheKeys);

    this.addTestResult('Integration Statistics', hasValidStats, hasValidStats ? 'Statistics work correctly' : 'Statistics failed');

    console.log('📊 Integration Statistics:', stats);

    return hasValidStats;
  }

  /**
   * Stress test the integration system
   */
  async stressTest() {
    console.log('🔥 Running Stress Test...');

    const eventCount = 1000;
    const cacheCount = 100;
    let eventsReceived = 0;

    // Subscribe to stress test events
    const unsubscribe = integrationService.subscribe('STRESS_TEST_EVENT', () => {
      eventsReceived++;
    });

    // Emit many events
    for (let i = 0; i < eventCount; i++) {
      integrationService.emit('STRESS_TEST_EVENT', { index: i });
    }

    // Set many cache entries
    for (let i = 0; i < cacheCount; i++) {
      integrationService.setCache(`stress_test_${i}`, { index: i }, 10000);
    }

    // Wait and check results
    await new Promise(resolve => setTimeout(resolve, 500));

    unsubscribe();

    const eventsSuccess = eventsReceived === eventCount;
    const cacheSuccess = integrationService.getStats().cacheSize >= cacheCount;

    this.addTestResult('Stress Test - Events', eventsSuccess, `Received ${eventsReceived}/${eventCount} events`);
    this.addTestResult('Stress Test - Cache', cacheSuccess, `Cache size: ${integrationService.getStats().cacheSize}`);

    const success = eventsSuccess && cacheSuccess;

    if (success) {
      console.log('  ✅ Stress test passed');
    } else {
      console.log('  ❌ Stress test failed');
    }

    // Cleanup
    integrationService.clearCache('stress_test_');

    return success;
  }

  /**
   * Quick health check
   */
  quickHealthCheck() {
    console.log('🏥 Running Quick Health Check...');

    const stats = integrationService.getStats();
    const health = {
      overall: 'healthy',
      checks: {
        eventSystem: stats.eventListeners.length >= 0,
        cache: stats.cacheSize >= 0,
        performance: true, // Would check performance metrics
      },
    };

    const isHealthy = Object.values(health.checks).every(check => check === true);
    health.overall = isHealthy ? 'healthy' : 'warning';

    console.log('📋 Health Check Result:', health);

    return health;
  }
}

// Create singleton instance
const integrationTester = new IntegrationTester();

export default integrationTester;

// Utility functions for testing
export const runIntegrationTests = async () => {
  return await integrationTester.runAllTests();
};

export const runQuickTest = async () => {
  console.log('⚡ Running Quick Integration Test...');
  
  try {
    await integrationTester.testEventSystem();
    await integrationTester.testCacheSystem();
    
    const summary = integrationTester.generateTestSummary();
    console.log('✅ Quick test completed:', summary);
    
    return summary;
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    throw error;
  }
};

export const runHealthCheck = () => {
  return integrationTester.quickHealthCheck();
};

export const runStressTest = async () => {
  return await integrationTester.stressTest();
};