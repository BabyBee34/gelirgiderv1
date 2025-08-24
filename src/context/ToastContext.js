// FinanceFlow - Toast Context Provider
import React, { createContext, useContext } from 'react';
import { useToast } from '../components/ui/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const toastUtils = useToast();

  return (
    <ToastContext.Provider value={toastUtils}>
      {children}
      <toastUtils.ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

// Global toast methods for use without hooks
let globalToastRef = null;

export const setGlobalToastRef = (ref) => {
  globalToastRef = ref;
};

export const toast = {
  success: (message, options) => {
    if (globalToastRef) {
      return globalToastRef.showSuccess(message, options);
    }
    console.warn('Toast not initialized. Wrap your app with ToastProvider.');
  },
  error: (message, options) => {
    if (globalToastRef) {
      return globalToastRef.showError(message, options);
    }
    console.warn('Toast not initialized. Wrap your app with ToastProvider.');
  },
  warning: (message, options) => {
    if (globalToastRef) {
      return globalToastRef.showWarning(message, options);
    }
    console.warn('Toast not initialized. Wrap your app with ToastProvider.');
  },
  info: (message, options) => {
    if (globalToastRef) {
      return globalToastRef.showInfo(message, options);
    }
    console.warn('Toast not initialized. Wrap your app with ToastProvider.');
  },
  clear: () => {
    if (globalToastRef) {
      return globalToastRef.clearAllToasts();
    }
  },
};

// Enhanced ToastProvider that sets global reference
export const EnhancedToastProvider = ({ children }) => {
  const toastUtils = useToast();

  React.useEffect(() => {
    setGlobalToastRef(toastUtils);
    return () => setGlobalToastRef(null);
  }, [toastUtils]);

  return (
    <ToastContext.Provider value={toastUtils}>
      {children}
      <toastUtils.ToastContainer />
    </ToastContext.Provider>
  );
};

