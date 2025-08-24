// FinanceFlow - Toast Notification System
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

// Toast types with their configurations
const TOAST_TYPES = {
  success: {
    icon: 'check-circle',
    backgroundColor: '#48BB78',
    iconColor: '#FFFFFF',
  },
  error: {
    icon: 'error',
    backgroundColor: '#F56565',
    iconColor: '#FFFFFF',
  },
  warning: {
    icon: 'warning',
    backgroundColor: '#ED8936',
    iconColor: '#FFFFFF',
  },
  info: {
    icon: 'info',
    backgroundColor: '#4299E1',
    iconColor: '#FFFFFF',
  },
};

// Individual Toast Component
const ToastItem = ({ toast, onRemove }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleRemove = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove(toast.id);
    });
  };

  const toastConfig = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: toastConfig.backgroundColor,
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <MaterialIcons
          name={toastConfig.icon}
          size={24}
          color={toastConfig.iconColor}
          style={styles.toastIcon}
        />
        
        <View style={styles.toastTextContainer}>
          {toast.title && (
            <Text style={styles.toastTitle}>{toast.title}</Text>
          )}
          <Text style={styles.toastMessage}>{toast.message}</Text>
        </View>

        {toast.dismissible !== false && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name="close"
              size={20}
              color={toastConfig.iconColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar for timed toasts */}
      {toast.duration > 0 && (
        <ToastProgressBar duration={toast.duration} color={toastConfig.iconColor} />
      )}
    </Animated.View>
  );
};

// Progress Bar Component
const ToastProgressBar = ({ duration, color }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, [duration]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: color,
            width,
          },
        ]}
      />
    </View>
  );
};

// Main Toast Container Component
const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      duration: 4000, // Default 4 seconds
      dismissible: true,
      ...toast,
    };

    setToasts(prev => [newToast, ...prev]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const showSuccess = (message, options = {}) => {
    return addToast({ ...options, type: 'success', message });
  };

  const showError = (message, options = {}) => {
    return addToast({ ...options, type: 'error', message, duration: 6000 });
  };

  const showWarning = (message, options = {}) => {
    return addToast({ ...options, type: 'warning', message });
  };

  const showInfo = (message, options = {}) => {
    return addToast({ ...options, type: 'info', message });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer: () => <ToastContainer toasts={toasts} onRemove={removeToast} />,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: theme.spacing.lg,
  },
  toastContainer: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
  },
  toastIcon: {
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
    marginLeft: theme.spacing.sm,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});

export default ToastContainer;

