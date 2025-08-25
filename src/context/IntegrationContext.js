// FinanceFlow - Integration Context Provider
import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import integrationService, { EVENT_TYPES } from '../services/integrationService';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const IntegrationContext = createContext();

// Integration state reducer
const integrationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: {
          ...state.syncStatus,
          [action.dataType]: action.status,
        },
      };
    
    case 'SET_CONNECTIVITY':
      return {
        ...state,
        isOnline: action.isOnline,
        lastConnectivityChange: Date.now(),
      };
    
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.error],
      };
    
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };
    
    case 'SET_COMPONENT_STATES':
      return {
        ...state,
        componentStates: {
          ...state.componentStates,
          [action.component]: action.componentState,
        },
      };
    
    case 'UPDATE_METRICS':
      return {
        ...state,
        metrics: {
          ...state.metrics,
          ...action.metrics,
        },
      };
    
    case 'SET_GLOBAL_STATE':
      return {
        ...state,
        globalState: {
          ...state.globalState,
          ...action.updates,
        },
      };

    default:
      return state;
  }
};

// Initial state
const initialState = {
  isOnline: true,
  syncStatus: {},
  errors: [],
  componentStates: {},
  metrics: {
    eventCount: 0,
    errorCount: 0,
    syncCount: 0,
    lastActivity: null,
  },
  globalState: {},
  lastConnectivityChange: null,
};

export const IntegrationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(integrationReducer, initialState);
  const { user } = useAuth();
  const { theme } = useTheme();

  // Setup global event listeners
  useEffect(() => {
    const unsubscribes = [];

    // Data sync events
    unsubscribes.push(
      integrationService.subscribe(EVENT_TYPES.DATA_SYNC_START, (data) => {
        dispatch({
          type: 'SET_SYNC_STATUS',
          dataType: data.dataType,
          status: { status: 'syncing', timestamp: Date.now() },
        });
        
        dispatch({
          type: 'UPDATE_METRICS',
          metrics: { syncCount: state.metrics.syncCount + 1, lastActivity: Date.now() },
        });
      })
    );

    unsubscribes.push(
      integrationService.subscribe(EVENT_TYPES.DATA_SYNC_COMPLETE, (data) => {
        dispatch({
          type: 'SET_SYNC_STATUS',
          dataType: data.dataType,
          status: { status: 'completed', timestamp: Date.now(), data: data.data },
        });
      })
    );

    unsubscribes.push(
      integrationService.subscribe(EVENT_TYPES.DATA_SYNC_ERROR, (data) => {
        dispatch({
          type: 'SET_SYNC_STATUS',
          dataType: data.dataType,
          status: { status: 'error', timestamp: Date.now(), error: data.error },
        });
        
        dispatch({
          type: 'ADD_ERROR',
          error: {
            type: 'sync',
            message: data.error,
            timestamp: Date.now(),
            context: data,
          },
        });
      })
    );

    // Network and error events
    unsubscribes.push(
      integrationService.subscribe(EVENT_TYPES.NETWORK_ERROR, (data) => {
        dispatch({
          type: 'ADD_ERROR',
          error: {
            type: 'network',
            message: data.error,
            timestamp: Date.now(),
            context: data,
          },
        });
        
        dispatch({
          type: 'UPDATE_METRICS',
          metrics: { errorCount: state.metrics.errorCount + 1, lastActivity: Date.now() },
        });
      })
    );

    // Component state changes
    unsubscribes.push(
      integrationService.subscribe('COMPONENT_STATE_CHANGED', (data) => {
        dispatch({
          type: 'SET_COMPONENT_STATES',
          component: data.source,
          componentState: data.componentState,
        });
      })
    );

    // Theme changes
    unsubscribes.push(
      integrationService.subscribe(EVENT_TYPES.THEME_CHANGED, (data) => {
        dispatch({
          type: 'SET_GLOBAL_STATE',
          updates: { currentTheme: data },
        });
      })
    );

    // Authentication changes
    unsubscribes.push(
      integrationService.subscribe(EVENT_TYPES.USER_AUTHENTICATED, (data) => {
        dispatch({
          type: 'SET_GLOBAL_STATE',
          updates: { user: data },
        });
        
        // Clear cache when user changes
        integrationService.clearCache('user_');
      })
    );

    unsubscribes.push(
      integrationService.subscribe(EVENT_TYPES.USER_LOGGED_OUT, () => {
        dispatch({
          type: 'SET_GLOBAL_STATE',
          updates: { user: null },
        });
        
        // Clear all cache on logout
        integrationService.clearCache();
      })
    );

    // Activity tracking
    unsubscribes.push(
      integrationService.subscribe('*', () => {
        dispatch({
          type: 'UPDATE_METRICS',
          metrics: { 
            eventCount: state.metrics.eventCount + 1, 
            lastActivity: Date.now() 
          },
        });
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [state.metrics]);

  // Emit auth changes
  useEffect(() => {
    if (user) {
      integrationService.emit(EVENT_TYPES.USER_AUTHENTICATED, user);
    } else {
      integrationService.emit(EVENT_TYPES.USER_LOGGED_OUT);
    }
  }, [user]);

  // Emit theme changes
  useEffect(() => {
    if (theme) {
      integrationService.emit(EVENT_TYPES.THEME_CHANGED, theme);
    }
  }, [theme]);

  // Methods for global integration management
  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const updateGlobalState = useCallback((updates) => {
    dispatch({ type: 'SET_GLOBAL_STATE', updates });
  }, []);

  const triggerGlobalSync = useCallback(async (dataTypes = []) => {
    const results = {};
    
    for (const dataType of dataTypes) {
      try {
        results[dataType] = await integrationService.syncData(dataType, null, {
          source: 'global_integration',
          force: true,
        });
      } catch (error) {
        results[dataType] = { success: false, error: error.message };
      }
    }
    
    return results;
  }, []);

  const getIntegrationStats = useCallback(() => {
    return {
      ...integrationService.getStats(),
      state,
    };
  }, [state]);

  const performHealthCheck = useCallback(() => {
    const stats = getIntegrationStats();
    const now = Date.now();
    const health = {
      overall: 'healthy',
      checks: {
        eventSystem: stats.eventListeners.length > 0 ? 'healthy' : 'warning',
        cache: stats.cacheSize < 100 ? 'healthy' : 'warning', // Arbitrary threshold
        errors: state.errors.length === 0 ? 'healthy' : 'warning',
        connectivity: state.isOnline ? 'healthy' : 'error',
        activity: state.metrics.lastActivity && (now - state.metrics.lastActivity) < 60000 ? 'healthy' : 'warning',
      },
      recommendations: [],
    };

    // Generate recommendations based on health checks
    if (health.checks.cache === 'warning') {
      health.recommendations.push('Consider clearing cache to improve performance');
    }
    
    if (health.checks.errors === 'warning') {
      health.recommendations.push('Review and address accumulated errors');
    }
    
    if (health.checks.connectivity === 'error') {
      health.recommendations.push('Check network connectivity');
    }

    // Set overall health
    const hasErrors = Object.values(health.checks).includes('error');
    const hasWarnings = Object.values(health.checks).includes('warning');
    
    if (hasErrors) {
      health.overall = 'error';
    } else if (hasWarnings) {
      health.overall = 'warning';
    }

    return health;
  }, [state, getIntegrationStats]);

  const resetIntegrationSystem = useCallback(() => {
    // Clear all cache
    integrationService.clearCache();
    
    // Reset state
    dispatch({ type: 'CLEAR_ERRORS' });
    dispatch({ 
      type: 'UPDATE_METRICS', 
      metrics: { eventCount: 0, errorCount: 0, syncCount: 0, lastActivity: null } 
    });
    
    // Emit reset event
    integrationService.emit('INTEGRATION_SYSTEM_RESET', { timestamp: Date.now() });
  }, []);

  const value = {
    // State
    ...state,
    
    // Methods
    clearAllErrors,
    updateGlobalState,
    triggerGlobalSync,
    getIntegrationStats,
    performHealthCheck,
    resetIntegrationSystem,
    
    // Direct access to integration service
    integrationService,
  };

  return (
    <IntegrationContext.Provider value={value}>
      {children}
    </IntegrationContext.Provider>
  );
};

// Hook to use integration context
export const useIntegrationContext = () => {
  const context = useContext(IntegrationContext);
  if (!context) {
    throw new Error('useIntegrationContext must be used within an IntegrationProvider');
  }
  return context;
};

// Helper hook for component-specific integration
export const useComponentIntegrationContext = (componentName) => {
  const context = useIntegrationContext();
  
  const componentState = context.componentStates[componentName] || {};
  const componentErrors = context.errors.filter(error => 
    error.context?.source === componentName
  );

  return {
    ...context,
    componentState,
    componentErrors,
    componentName,
  };
};

export default IntegrationContext;