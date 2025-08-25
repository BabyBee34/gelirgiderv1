// FinanceFlow - React Integration Hook
import { useEffect, useRef, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import integrationService, { EVENT_TYPES } from '../services/integrationService';

/**
 * Enhanced integration hook for React components
 * Provides automatic cleanup, lifecycle management, and communication utilities
 */
export const useComponentIntegration = (componentName, options = {}) => {
  const unsubscribeRefs = useRef([]);
  const [isComponentMounted, setIsComponentMounted] = useState(true);
  const [componentState, setComponentState] = useState({});
  const componentId = useRef(`${componentName}_${Date.now()}_${Math.random()}`).current;

  // Handle component mount
  useEffect(() => {
    integrationService.handleComponentLifecycle(componentName, 'mount', {
      componentId,
      options,
    });

    return () => {
      // Handle component unmount
      setIsComponentMounted(false);
      integrationService.handleComponentLifecycle(componentName, 'unmount', {
        componentId,
      });

      // Cleanup all subscriptions
      unsubscribeRefs.current.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      unsubscribeRefs.current = [];
    };
  }, [componentName, componentId]);

  // Handle screen focus/blur events
  useFocusEffect(
    useCallback(() => {
      integrationService.handleComponentLifecycle(componentName, 'focus', {
        componentId,
      });

      return () => {
        integrationService.handleComponentLifecycle(componentName, 'blur', {
          componentId,
        });
      };
    }, [componentName, componentId])
  );

  // Subscribe to events with automatic cleanup
  const subscribe = useCallback((eventType, callback, subscriptionOptions = {}) => {
    if (!isComponentMounted) return null;

    const unsubscribe = integrationService.subscribe(
      eventType,
      (data) => {
        // Only call callback if component is still mounted
        if (isComponentMounted) {
          callback(data);
        }
      },
      {
        ...subscriptionOptions,
        component: componentName,
        componentId,
      }
    );

    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, [componentName, componentId, isComponentMounted]);

  // Emit events
  const emit = useCallback((eventType, data = {}) => {
    integrationService.emit(eventType, {
      ...data,
      source: componentName,
      componentId,
      timestamp: Date.now(),
    });
  }, [componentName, componentId]);

  // Cache management
  const setCache = useCallback((key, data, ttl) => {
    const prefixedKey = `${componentName}_${key}`;
    integrationService.setCache(prefixedKey, data, ttl);
  }, [componentName]);

  const getCache = useCallback((key) => {
    const prefixedKey = `${componentName}_${key}`;
    return integrationService.getCache(prefixedKey);
  }, [componentName]);

  // Data synchronization
  const syncData = useCallback(async (dataType, data, syncOptions = {}) => {
    return await integrationService.syncData(dataType, data, {
      ...syncOptions,
      source: componentName,
      componentId,
    });
  }, [componentName, componentId]);

  // Error reporting
  const reportError = useCallback((error, context = {}) => {
    integrationService.reportComponentError(componentName, error, {
      ...context,
      componentId,
    });
  }, [componentName, componentId]);

  // Props validation
  const validateProps = useCallback((props, schema) => {
    return integrationService.validateComponentProps(componentName, props, schema);
  }, [componentName]);

  // State consistency
  const ensureStateConsistency = useCallback((toScreen, sharedData = {}) => {
    integrationService.ensureStateConsistency(componentName, toScreen, {
      ...sharedData,
      componentId,
    });
  }, [componentName, componentId]);

  const getSharedState = useCallback((fromScreen) => {
    return integrationService.getSharedState(fromScreen, componentName);
  }, [componentName]);

  // Component state management
  const updateComponentState = useCallback((updates) => {
    setComponentState(prev => ({ ...prev, ...updates }));
    
    // Also cache the state for persistence
    setCache('component_state', { ...componentState, ...updates });
    
    // Emit state change event
    emit('COMPONENT_STATE_CHANGED', { 
      componentState: { ...componentState, ...updates },
      updates 
    });
  }, [componentState, setCache, emit]);

  // Load cached component state on mount
  useEffect(() => {
    const cachedState = getCache('component_state');
    if (cachedState) {
      setComponentState(cachedState);
    }
  }, [getCache]);

  return {
    // Event system
    subscribe,
    emit,
    
    // Cache management
    setCache,
    getCache,
    
    // Data synchronization
    syncData,
    
    // Error handling
    reportError,
    
    // Props validation
    validateProps,
    
    // State management
    ensureStateConsistency,
    getSharedState,
    updateComponentState,
    componentState,
    
    // Component info
    componentName,
    componentId,
    isComponentMounted,
  };
};

/**
 * Hook for navigation integration
 * Provides enhanced navigation with state synchronization
 */
export const useNavigationIntegration = (navigation, componentName) => {
  const { emit, ensureStateConsistency, getSharedState } = useComponentIntegration(componentName);

  const navigateWithSync = useCallback((screen, params = {}, options = {}) => {
    try {
      // Prepare shared state if needed
      if (options.shareState) {
        ensureStateConsistency(screen, options.shareState);
      }

      // Emit navigation event
      emit(EVENT_TYPES.SCREEN_BLUR, {
        to: screen,
        params,
        options,
      });

      // Perform navigation
      navigation.navigate(screen, params);

    } catch (error) {
      console.error('Navigation error:', error);
      emit(EVENT_TYPES.NETWORK_ERROR, {
        type: 'navigation',
        error: error.message,
        screen,
        params,
      });
    }
  }, [navigation, emit, ensureStateConsistency]);

  const goBackWithSync = useCallback((params = {}) => {
    emit(EVENT_TYPES.SCREEN_BLUR, {
      action: 'goBack',
      params,
    });

    navigation.goBack();
  }, [navigation, emit]);

  return {
    navigateWithSync,
    goBackWithSync,
    getSharedState,
  };
};

/**
 * Hook for data synchronization across components
 */
export const useDataSync = (componentName, dataTypes = []) => {
  const { subscribe, emit, syncData } = useComponentIntegration(componentName);
  const [syncStatus, setSyncStatus] = useState({});

  // Subscribe to sync events for specified data types
  useEffect(() => {
    const unsubscribes = [];

    dataTypes.forEach(dataType => {
      // Subscribe to sync start
      const unsubscribeStart = subscribe(EVENT_TYPES.DATA_SYNC_START, (data) => {
        if (data.dataType === dataType) {
          setSyncStatus(prev => ({
            ...prev,
            [dataType]: { status: 'syncing', timestamp: Date.now() }
          }));
        }
      });

      // Subscribe to sync complete
      const unsubscribeComplete = subscribe(EVENT_TYPES.DATA_SYNC_COMPLETE, (data) => {
        if (data.dataType === dataType) {
          setSyncStatus(prev => ({
            ...prev,
            [dataType]: { status: 'completed', timestamp: Date.now(), data: data.data }
          }));
        }
      });

      // Subscribe to sync error
      const unsubscribeError = subscribe(EVENT_TYPES.DATA_SYNC_ERROR, (data) => {
        if (data.dataType === dataType) {
          setSyncStatus(prev => ({
            ...prev,
            [dataType]: { status: 'error', timestamp: Date.now(), error: data.error }
          }));
        }
      });

      unsubscribes.push(unsubscribeStart, unsubscribeComplete, unsubscribeError);
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [dataTypes, subscribe]);

  const triggerSync = useCallback(async (dataType, data, options = {}) => {
    return await syncData(dataType, data, options);
  }, [syncData]);

  const getSyncStatus = useCallback((dataType) => {
    return syncStatus[dataType] || { status: 'idle' };
  }, [syncStatus]);

  return {
    triggerSync,
    getSyncStatus,
    syncStatus,
  };
};

/**
 * Hook for theme integration
 */
export const useThemeIntegration = (componentName) => {
  const { subscribe, emit } = useComponentIntegration(componentName);
  const [themeState, setThemeState] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribe(EVENT_TYPES.THEME_CHANGED, (themeData) => {
      setThemeState(themeData);
    });

    return unsubscribe;
  }, [subscribe]);

  const emitThemeChange = useCallback((themeData) => {
    emit(EVENT_TYPES.THEME_CHANGED, themeData);
  }, [emit]);

  return {
    themeState,
    emitThemeChange,
  };
};

/**
 * Hook for error boundary integration
 */
export const useErrorBoundaryIntegration = (componentName, errorHandler) => {
  const { reportError, subscribe } = useComponentIntegration(componentName);

  useEffect(() => {
    const unsubscribe = subscribe('COMPONENT_ERROR', (errorData) => {
      if (errorData.component === componentName && errorHandler) {
        errorHandler(errorData);
      }
    });

    return unsubscribe;
  }, [componentName, errorHandler, subscribe]);

  const handleError = useCallback((error, context = {}) => {
    reportError(error, context);
  }, [reportError]);

  return {
    handleError,
    reportError,
  };
};