// FinanceFlow - Performance Optimization Utilities
import { useMemo, useCallback, useRef, useEffect } from 'react';

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading hook
export const useLazyLoad = (items, pageSize = 10) => {
  const [displayedItems, setDisplayedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const endIndex = currentPage * pageSize;
    const newItems = items.slice(0, endIndex);
    setDisplayedItems(newItems);
    setHasMore(endIndex < items.length);
  }, [items, currentPage, pageSize]);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setDisplayedItems([]);
    setHasMore(true);
  }, []);

  return {
    displayedItems,
    hasMore,
    loadMore,
    reset,
    currentPage,
  };
};

// Image optimization hook
export const useImageOptimization = (imageUrl, options = {}) => {
  const { width = 300, height = 300, quality = 0.8 } = options;
  const [optimizedUrl, setOptimizedUrl] = useState(imageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrl) return;

    setLoading(true);
    setError(null);

    // For now, just use the original URL
    // In a real app, you would optimize the image here
    setOptimizedUrl(imageUrl);
    setLoading(false);
  }, [imageUrl, width, height, quality]);

  return {
    optimizedUrl,
    loading,
    error,
  };
};

// Memory management hook
export const useMemoryManagement = () => {
  const memoryRef = useRef(new Map());

  const setItem = useCallback((key, value) => {
    memoryRef.current.set(key, value);
  }, []);

  const getItem = useCallback((key) => {
    return memoryRef.current.get(key);
  }, []);

  const removeItem = useCallback((key) => {
    memoryRef.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    memoryRef.current.clear();
  }, []);

  const getSize = useCallback(() => {
    return memoryRef.current.size;
  }, []);

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    getSize,
  };
};

// Cache management hook
export const useCache = (ttl = 300000) => { // 5 minutes default
  const cacheRef = useRef(new Map());

  const set = useCallback((key, value) => {
    const item = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    cacheRef.current.set(key, item);
  }, [ttl]);

  const get = useCallback((key) => {
    const item = cacheRef.current.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      cacheRef.current.delete(key);
      return null;
    }

    return item.value;
  }, []);

  const has = useCallback((key) => {
    return cacheRef.current.has(key);
  }, []);

  const remove = useCallback((key) => {
    cacheRef.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const clearExpired = useCallback(() => {
    const now = Date.now();
    for (const [key, item] of cacheRef.current.entries()) {
      if (now - item.timestamp > item.ttl) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  return {
    set,
    get,
    has,
    remove,
    clear,
    clearExpired,
  };
};

// Network request optimization
export const useNetworkOptimization = () => {
  const pendingRequests = useRef(new Map());
  const cache = useCache();

  const makeRequest = useCallback(async (key, requestFn, options = {}) => {
    const { useCache: shouldUseCache = true, ttl = 300000 } = options;

    // Check cache first
    if (shouldUseCache) {
      const cached = cache.get(key);
      if (cached) return cached;
    }

    // Check if request is already pending
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key);
    }

    // Make the request
    const requestPromise = requestFn();
    pendingRequests.current.set(key, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      if (shouldUseCache) {
        cache.set(key, result, ttl);
      }
      
      return result;
    } finally {
      pendingRequests.current.delete(key);
    }
  }, [cache]);

  const cancelRequest = useCallback((key) => {
    pendingRequests.current.delete(key);
  }, []);

  const cancelAllRequests = useCallback(() => {
    pendingRequests.current.clear();
  }, []);

  return {
    makeRequest,
    cancelRequest,
    cancelAllRequests,
    cache,
  };
};

// Component memoization utilities
export const memoizeComponent = (Component, propsAreEqual) => {
  return React.memo(Component, propsAreEqual);
};

export const memoizeValue = (value, deps) => {
  return useMemo(() => value, deps);
};

export const memoizeCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

// List optimization hook
export const useListOptimization = (items, options = {}) => {
  const {
    keyExtractor = (item, index) => item.id || index.toString(),
    getItemLayout,
    initialNumToRender = 10,
    maxToRenderPerBatch = 10,
    windowSize = 21,
    removeClippedSubviews = true,
  } = options;

  const optimizedItems = useMemo(() => {
    return items.map((item, index) => ({
      ...item,
      key: keyExtractor(item, index),
    }));
  }, [items, keyExtractor]);

  const listProps = useMemo(() => ({
    data: optimizedItems,
    keyExtractor,
    getItemLayout,
    initialNumToRender,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews,
  }), [optimizedItems, keyExtractor, getItemLayout, initialNumToRender, maxToRenderPerBatch, windowSize, removeClippedSubviews]);

  return {
    items: optimizedItems,
    listProps,
  };
};

// Animation optimization hook
export const useAnimationOptimization = () => {
  const animationRefs = useRef(new Map());

  const createAnimation = useCallback((key, initialValue = 0) => {
    if (!animationRefs.current.has(key)) {
      animationRefs.current.set(key, new Animated.Value(initialValue));
    }
    return animationRefs.current.get(key);
  }, []);

  const cleanupAnimation = useCallback((key) => {
    animationRefs.current.delete(key);
  }, []);

  const cleanupAllAnimations = useCallback(() => {
    animationRefs.current.clear();
  }, []);

  return {
    createAnimation,
    cleanupAnimation,
    cleanupAllAnimations,
  };
};

// Bundle size optimization
export const lazyImport = (importFn) => {
  return React.lazy(importFn);
};

// Performance monitoring
export const usePerformanceMonitor = () => {
  const metrics = useRef({
    renderCount: 0,
    renderTime: 0,
    memoryUsage: 0,
  });

  const startRender = useCallback(() => {
    metrics.current.renderCount++;
    metrics.current.renderTime = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (metrics.current.renderTime > 0) {
      const renderTime = performance.now() - metrics.current.renderTime;
      console.log(`Render ${metrics.current.renderCount} took ${renderTime.toFixed(2)}ms`);
    }
  }, []);

  const getMetrics = useCallback(() => {
    return { ...metrics.current };
  }, []);

  return {
    startRender,
    endRender,
    getMetrics,
  };
};

// Export all performance utilities
export default {
  debounce,
  throttle,
  useLazyLoad,
  useImageOptimization,
  useMemoryManagement,
  useCache,
  useNetworkOptimization,
  memoizeComponent,
  memoizeValue,
  memoizeCallback,
  useListOptimization,
  useAnimationOptimization,
  lazyImport,
  usePerformanceMonitor,
};
