// FinanceFlow - Integration Service for Component Communication
import { Alert } from 'react-native';

/**
 * Integration Service for managing component communication,
 * data consistency, and cross-component operations
 */
class IntegrationService {
  constructor() {
    this.eventListeners = new Map();
    this.dataCache = new Map();
    this.pendingOperations = new Map();
    this.retryQueue = [];
    this.isOnline = true;
    
    // Initialize event system
    this.initializeEventSystem();
  }

  /**
   * Initialize global event system for cross-component communication
   */
  initializeEventSystem() {
    this.eventTypes = {
      // Authentication events
      USER_AUTHENTICATED: 'user_authenticated',
      USER_LOGGED_OUT: 'user_logged_out',
      PROFILE_UPDATED: 'profile_updated',
      
      // Data events
      TRANSACTION_ADDED: 'transaction_added',
      TRANSACTION_UPDATED: 'transaction_updated',
      TRANSACTION_DELETED: 'transaction_deleted',
      ACCOUNT_UPDATED: 'account_updated',
      BALANCE_CHANGED: 'balance_changed',
      
      // Navigation events
      SCREEN_FOCUS: 'screen_focus',
      SCREEN_BLUR: 'screen_blur',
      TAB_CHANGED: 'tab_changed',
      
      // Theme events
      THEME_CHANGED: 'theme_changed',
      
      // Notification events
      NOTIFICATION_RECEIVED: 'notification_received',
      NOTIFICATION_SETTINGS_CHANGED: 'notification_settings_changed',
      
      // Error events
      NETWORK_ERROR: 'network_error',
      SYNC_ERROR: 'sync_error',
      VALIDATION_ERROR: 'validation_error',
      
      // Data sync events
      DATA_SYNC_START: 'data_sync_start',
      DATA_SYNC_COMPLETE: 'data_sync_complete',
      DATA_SYNC_ERROR: 'data_sync_error',
    };
  }

  /**
   * Subscribe to events
   * @param {string} eventType - Type of event to listen for
   * @param {function} callback - Callback function to execute
   * @param {object} options - Additional options
   * @returns {function} Unsubscribe function
   */
  subscribe(eventType, callback, options = {}) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    const listener = {
      id: Date.now() + Math.random(),
      callback,
      options,
      once: options.once || false,
    };

    this.eventListeners.get(eventType).push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.findIndex(l => l.id === listener.id);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit events to all subscribers
   * @param {string} eventType - Type of event to emit
   * @param {any} data - Data to pass to listeners
   */
  emit(eventType, data = null) {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners) return;

    // Create a copy to avoid issues if listeners array is modified during iteration
    const listenersCopy = [...listeners];

    listenersCopy.forEach((listener, index) => {
      try {
        listener.callback(data);

        // Remove one-time listeners
        if (listener.once) {
          const currentListeners = this.eventListeners.get(eventType);
          if (currentListeners) {
            const idx = currentListeners.findIndex(l => l.id === listener.id);
            if (idx > -1) {
              currentListeners.splice(idx, 1);
            }
          }
        }
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
        // Optionally remove problematic listeners
        if (listener.options.removeOnError) {
          const currentListeners = this.eventListeners.get(eventType);
          if (currentListeners) {
            const idx = currentListeners.findIndex(l => l.id === listener.id);
            if (idx > -1) {
              currentListeners.splice(idx, 1);
            }
          }
        }
      }
    });
  }

  /**
   * Set data in cache with expiration
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setCache(key, data, ttl = 300000) { // Default 5 minutes
    this.dataCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Emit cache updated event
    this.emit('CACHE_UPDATED', { key, data });
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {any} Cached data or null if expired/not found
   */
  getCache(key) {
    const cached = this.dataCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.dataCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to match keys
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const [key] of this.dataCache) {
        if (key.includes(pattern)) {
          this.dataCache.delete(key);
        }
      }
    } else {
      this.dataCache.clear();
    }

    this.emit('CACHE_CLEARED', { pattern });
  }

  /**
   * Handle cross-component navigation with state preservation
   * @param {object} navigation - Navigation object
   * @param {string} screen - Target screen
   * @param {object} params - Navigation parameters
   * @param {object} options - Additional options
   */
  navigateWithStateSync(navigation, screen, params = {}, options = {}) {
    try {
      // Preserve current screen state if requested
      if (options.preserveState) {
        const currentRoute = navigation.getCurrentRoute();
        if (currentRoute) {
          this.setCache(`screen_state_${currentRoute.name}`, {
            params: currentRoute.params,
            timestamp: Date.now(),
          });
        }
      }

      // Emit navigation event
      this.emit(this.eventTypes.SCREEN_BLUR, {
        from: navigation.getCurrentRoute()?.name,
        to: screen,
      });

      // Navigate
      navigation.navigate(screen, params);

      // Emit focus event
      this.emit(this.eventTypes.SCREEN_FOCUS, {
        screen,
        params,
      });

    } catch (error) {
      console.error('Navigation error:', error);
      this.emit(this.eventTypes.NETWORK_ERROR, {
        type: 'navigation',
        error: error.message,
      });
    }
  }

  /**
   * Synchronize data across components
   * @param {string} dataType - Type of data to sync
   * @param {any} data - Data to synchronize
   * @param {object} options - Sync options
   */
  async syncData(dataType, data, options = {}) {
    try {
      this.emit(this.eventTypes.DATA_SYNC_START, { dataType, data });

      // Cache the data
      this.setCache(`sync_${dataType}`, data, options.ttl);

      // Emit appropriate events based on data type
      switch (dataType) {
        case 'transactions':
          this.emit(this.eventTypes.TRANSACTION_UPDATED, data);
          break;
        case 'accounts':
          this.emit(this.eventTypes.ACCOUNT_UPDATED, data);
          break;
        case 'balance':
          this.emit(this.eventTypes.BALANCE_CHANGED, data);
          break;
        case 'profile':
          this.emit(this.eventTypes.PROFILE_UPDATED, data);
          break;
        default:
          console.warn(`Unknown data type for sync: ${dataType}`);
      }

      this.emit(this.eventTypes.DATA_SYNC_COMPLETE, { dataType, data });

      return { success: true, data };
    } catch (error) {
      console.error(`Data sync error for ${dataType}:`, error);
      this.emit(this.eventTypes.DATA_SYNC_ERROR, {
        dataType,
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Handle component lifecycle events
   * @param {string} componentName - Name of the component
   * @param {string} event - Lifecycle event (mount, unmount, focus, blur)
   * @param {object} data - Additional data
   */
  handleComponentLifecycle(componentName, event, data = {}) {
    const eventKey = `component_${event}`;
    
    this.emit(eventKey, {
      component: componentName,
      event,
      timestamp: Date.now(),
      ...data,
    });

    // Special handling for component unmount - cleanup
    if (event === 'unmount') {
      this.clearCache(componentName);
      
      // Remove component-specific listeners
      for (const [eventType, listeners] of this.eventListeners) {
        const filteredListeners = listeners.filter(
          listener => !listener.options.component || listener.options.component !== componentName
        );
        this.eventListeners.set(eventType, filteredListeners);
      }
    }
  }

  /**
   * Validate component props and emit errors if invalid
   * @param {string} componentName - Name of the component
   * @param {object} props - Props to validate
   * @param {object} schema - Validation schema
   */
  validateComponentProps(componentName, props, schema) {
    const errors = [];

    for (const [propName, rules] of Object.entries(schema)) {
      const value = props[propName];

      // Check required props
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${propName} is required`);
        continue;
      }

      // Check type validation
      if (value !== undefined && rules.type) {
        const actualType = typeof value;
        if (actualType !== rules.type) {
          errors.push(`${propName} should be of type ${rules.type}, got ${actualType}`);
        }
      }

      // Check custom validators
      if (value !== undefined && rules.validator) {
        try {
          const isValid = rules.validator(value);
          if (!isValid) {
            errors.push(`${propName} failed validation`);
          }
        } catch (validationError) {
          errors.push(`${propName} validation error: ${validationError.message}`);
        }
      }
    }

    if (errors.length > 0) {
      const errorMessage = `${componentName} prop validation errors: ${errors.join(', ')}`;
      console.error(errorMessage);
      
      this.emit(this.eventTypes.VALIDATION_ERROR, {
        component: componentName,
        errors,
        props,
      });

      // In development, show alert
      if (__DEV__) {
        Alert.alert(
          'Component Prop Validation Error',
          `${componentName}: ${errors.join('\n')}`,
          [{ text: 'OK' }]
        );
      }

      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Ensure consistent state across screens when navigating
   * @param {string} fromScreen - Source screen
   * @param {string} toScreen - Target screen
   * @param {object} sharedData - Data to share between screens
   */
  ensureStateConsistency(fromScreen, toScreen, sharedData = {}) {
    // Store shared data
    const stateKey = `shared_state_${fromScreen}_to_${toScreen}`;
    this.setCache(stateKey, {
      ...sharedData,
      timestamp: Date.now(),
      fromScreen,
      toScreen,
    });

    // Emit state transition event
    this.emit('STATE_TRANSITION', {
      from: fromScreen,
      to: toScreen,
      sharedData,
    });
  }

  /**
   * Get shared state between screens
   * @param {string} fromScreen - Source screen
   * @param {string} toScreen - Target screen
   */
  getSharedState(fromScreen, toScreen) {
    const stateKey = `shared_state_${fromScreen}_to_${toScreen}`;
    return this.getCache(stateKey);
  }

  /**
   * Register component error boundary
   * @param {string} componentName - Name of the component
   * @param {function} errorHandler - Error handler function
   */
  registerErrorBoundary(componentName, errorHandler) {
    this.subscribe('COMPONENT_ERROR', (errorData) => {
      if (errorData.component === componentName) {
        errorHandler(errorData);
      }
    }, { component: componentName });
  }

  /**
   * Report component error
   * @param {string} componentName - Name of the component
   * @param {Error} error - Error object
   * @param {object} context - Additional context
   */
  reportComponentError(componentName, error, context = {}) {
    const errorData = {
      component: componentName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      timestamp: Date.now(),
    };

    console.error(`Component error in ${componentName}:`, error);
    
    this.emit('COMPONENT_ERROR', errorData);
    
    // Also emit general error event
    this.emit(this.eventTypes.NETWORK_ERROR, {
      type: 'component',
      component: componentName,
      error: error.message,
    });
  }

  /**
   * Clean up all listeners and cache when app is unmounted
   */
  cleanup() {
    this.eventListeners.clear();
    this.dataCache.clear();
    this.pendingOperations.clear();
    this.retryQueue = [];
  }

  /**
   * Get integration statistics
   */
  getStats() {
    return {
      eventListeners: Array.from(this.eventListeners.entries()).map(([type, listeners]) => ({
        type,
        count: listeners.length,
      })),
      cacheSize: this.dataCache.size,
      cacheKeys: Array.from(this.dataCache.keys()),
      pendingOperations: this.pendingOperations.size,
      retryQueueLength: this.retryQueue.length,
      isOnline: this.isOnline,
    };
  }
}

// Create singleton instance
const integrationService = new IntegrationService();

export default integrationService;

// Export event types for use in components
export const EVENT_TYPES = integrationService.eventTypes;

// Export helper hooks for React components
export const useIntegration = () => {
  return {
    subscribe: integrationService.subscribe.bind(integrationService),
    emit: integrationService.emit.bind(integrationService),
    setCache: integrationService.setCache.bind(integrationService),
    getCache: integrationService.getCache.bind(integrationService),
    syncData: integrationService.syncData.bind(integrationService),
    validateProps: integrationService.validateComponentProps.bind(integrationService),
    navigateWithSync: integrationService.navigateWithStateSync.bind(integrationService),
    handleLifecycle: integrationService.handleComponentLifecycle.bind(integrationService),
    reportError: integrationService.reportComponentError.bind(integrationService),
    ensureConsistency: integrationService.ensureStateConsistency.bind(integrationService),
    getSharedState: integrationService.getSharedState.bind(integrationService),
  };
};