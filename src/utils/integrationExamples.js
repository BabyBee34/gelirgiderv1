// FinanceFlow - Integration System Usage Examples
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { 
  useComponentIntegration, 
  useNavigationIntegration, 
  useDataSync, 
  useThemeIntegration 
} from '../hooks/useIntegration';
import { EVENT_TYPES } from '../services/integrationService';

/**
 * Example: Enhanced HomeScreen with Integration
 * Shows how to integrate the HomeScreen with the new integration system
 */
export const ExampleHomeScreenWithIntegration = ({ navigation }) => {
  // Initialize component integration
  const {
    subscribe,
    emit,
    setCache,
    getCache,
    syncData,
    reportError,
    validateProps,
    updateComponentState,
    componentState,
  } = useComponentIntegration('HomeScreen', {
    autoSync: true,
    cacheStrategy: 'aggressive',
  });

  // Navigation integration
  const { navigateWithSync } = useNavigationIntegration(navigation, 'HomeScreen');

  // Data synchronization
  const { triggerSync, getSyncStatus } = useDataSync('HomeScreen', [
    'transactions',
    'accounts',
    'balance',
  ]);

  // Theme integration
  const { themeState } = useThemeIntegration('HomeScreen');

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Subscribe to relevant events
  useEffect(() => {
    const unsubscribes = [
      // Listen for transaction updates from other screens
      subscribe(EVENT_TYPES.TRANSACTION_ADDED, (data) => {
        setTransactions(prev => [data.transaction, ...prev]);
        updateComponentState({ lastTransactionUpdate: Date.now() });
        
        // Show toast notification
        Alert.alert('Başarılı', 'Yeni işlem eklendi!');
      }),

      // Listen for balance changes
      subscribe(EVENT_TYPES.BALANCE_CHANGED, (data) => {
        updateComponentState({ 
          currentBalance: data.balance,
          lastBalanceUpdate: Date.now(),
        });
        
        // Update cache
        setCache('balance', data.balance, 300000); // 5 minutes
      }),

      // Listen for account updates
      subscribe(EVENT_TYPES.ACCOUNT_UPDATED, (data) => {
        setAccounts(prev => 
          prev.map(account => 
            account.id === data.account.id ? data.account : account
          )
        );
      }),

      // Listen for sync completion
      subscribe(EVENT_TYPES.DATA_SYNC_COMPLETE, (data) => {
        console.log(`Data sync completed for ${data.dataType}`);
        setLoading(false);
      }),

      // Listen for errors
      subscribe(EVENT_TYPES.NETWORK_ERROR, (data) => {
        console.error('Network error:', data);
        Alert.alert('Hata', 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
        setLoading(false);
      }),
    ];

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [subscribe, updateComponentState, setCache]);

  // Load cached data on mount
  useEffect(() => {
    const cachedTransactions = getCache('transactions');
    const cachedAccounts = getCache('accounts');
    const cachedBalance = getCache('balance');

    if (cachedTransactions) {
      setTransactions(cachedTransactions);
    }

    if (cachedAccounts) {
      setAccounts(cachedAccounts);
    }

    if (cachedBalance) {
      updateComponentState({ currentBalance: cachedBalance });
    }
  }, [getCache, updateComponentState]);

  // Function to handle transaction addition
  const handleAddTransaction = async (transactionData) => {
    try {
      setLoading(true);

      // Validate transaction data
      const validation = validateProps(transactionData, {
        amount: { required: true, type: 'number' },
        type: { required: true, type: 'string' },
        description: { required: true, type: 'string' },
      });

      if (!validation.valid) {
        Alert.alert('Hata', `Geçersiz veri: ${validation.errors.join(', ')}`);
        return;
      }

      // Trigger data sync
      const result = await triggerSync('transactions', transactionData, {
        immediate: true,
        notify: true,
      });

      if (result.success) {
        // Navigate to transaction screen with shared state
        navigateWithSync('Transactions', 
          { newTransaction: result.data },
          { 
            shareState: { 
              recentTransaction: result.data,
              source: 'HomeScreen',
            }
          }
        );

        // Emit transaction added event
        emit(EVENT_TYPES.TRANSACTION_ADDED, {
          transaction: result.data,
          source: 'HomeScreen',
        });

        // Update cache
        setCache('transactions', [...transactions, result.data]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      reportError(error, {
        operation: 'addTransaction',
        data: transactionData,
      });

      Alert.alert('Hata', 'İşlem eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle navigation to analytics
  const handleNavigateToAnalytics = () => {
    navigateWithSync('Analytics', {}, {
      shareState: {
        homeScreenBalance: componentState.currentBalance,
        transactionsCount: transactions.length,
        accountsCount: accounts.length,
      },
    });
  };

  // Return example implementation indicators
  return {
    handleAddTransaction,
    handleNavigateToAnalytics,
    transactions,
    accounts,
    loading,
    componentState,
    syncStatus: getSyncStatus('transactions'),
    themeState,
  };
};

/**
 * Example: Enhanced TransactionScreen with Integration
 */
export const ExampleTransactionScreenWithIntegration = ({ navigation, route }) => {
  const {
    subscribe,
    emit,
    getSharedState,
    updateComponentState,
    reportError,
  } = useComponentIntegration('TransactionScreen');

  const [sharedData, setSharedData] = useState(null);

  useEffect(() => {
    // Get shared state from home screen
    const homeSharedState = getSharedState('HomeScreen');
    if (homeSharedState) {
      setSharedData(homeSharedState);
      updateComponentState({ 
        receivedSharedData: homeSharedState,
        sharedDataTimestamp: Date.now(),
      });
    }

    // Subscribe to transaction updates
    const unsubscribe = subscribe(EVENT_TYPES.TRANSACTION_UPDATED, (data) => {
      console.log('Transaction updated:', data);
      // Handle transaction update
    });

    return unsubscribe;
  }, [subscribe, getSharedState, updateComponentState]);

  const handleTransactionSave = async (transactionData) => {
    try {
      // Emit transaction updated event
      emit(EVENT_TYPES.TRANSACTION_UPDATED, {
        transaction: transactionData,
        source: 'TransactionScreen',
      });

      // Also emit balance change if this affects balance
      if (transactionData.type === 'income' || transactionData.type === 'expense') {
        emit(EVENT_TYPES.BALANCE_CHANGED, {
          transaction: transactionData,
          source: 'TransactionScreen',
        });
      }

    } catch (error) {
      reportError(error, {
        operation: 'saveTransaction',
        data: transactionData,
      });
    }
  };

  return {
    sharedData,
    handleTransactionSave,
  };
};

/**
 * Example: Enhanced ProfileScreen with Integration
 */
export const ExampleProfileScreenWithIntegration = ({ navigation }) => {
  const {
    subscribe,
    emit,
    setCache,
    getCache,
    updateComponentState,
  } = useComponentIntegration('ProfileScreen');

  const [notificationSettings, setNotificationSettings] = useState({});

  useEffect(() => {
    // Load cached notification settings
    const cachedSettings = getCache('notification_settings');
    if (cachedSettings) {
      setNotificationSettings(cachedSettings);
    }

    // Subscribe to notification events
    const unsubscribe = subscribe(EVENT_TYPES.NOTIFICATION_SETTINGS_CHANGED, (data) => {
      setNotificationSettings(data.settings);
      setCache('notification_settings', data.settings, 86400000); // 24 hours
      updateComponentState({ lastSettingsUpdate: Date.now() });
    });

    return unsubscribe;
  }, [subscribe, setCache, getCache, updateComponentState]);

  const handleNotificationSettingsChange = (settings) => {
    setNotificationSettings(settings);
    
    // Cache the settings
    setCache('notification_settings', settings, 86400000); // 24 hours
    
    // Emit settings change event
    emit(EVENT_TYPES.NOTIFICATION_SETTINGS_CHANGED, {
      settings,
      source: 'ProfileScreen',
    });
    
    updateComponentState({ 
      notificationSettings: settings,
      lastSettingsUpdate: Date.now(),
    });
  };

  const handleThemeChange = (themeType) => {
    emit(EVENT_TYPES.THEME_CHANGED, {
      themeType,
      source: 'ProfileScreen',
    });
  };

  return {
    notificationSettings,
    handleNotificationSettingsChange,
    handleThemeChange,
  };
};

/**
 * Example: Error Boundary with Integration
 */
export class ExampleErrorBoundaryWithIntegration extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Report error through integration system
    if (this.props.integrationService) {
      this.props.integrationService.reportComponentError(
        this.props.componentName || 'ErrorBoundary',
        error,
        {
          errorInfo,
          timestamp: Date.now(),
          component: this.props.componentName,
        }
      );
    }

    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Bir hata oluştu</div>;
    }

    return this.props.children;
  }
}

/**
 * Example: HOC for automatic integration
 */
export const withIntegration = (WrappedComponent, componentName, options = {}) => {
  return function IntegratedComponent(props) {
    const integration = useComponentIntegration(componentName, options);
    
    return (
      <ExampleErrorBoundaryWithIntegration 
        componentName={componentName}
        integrationService={integration}
      >
        <WrappedComponent 
          {...props} 
          integration={integration}
        />
      </ExampleErrorBoundaryWithIntegration>
    );
  };
};

/**
 * Usage examples for different scenarios
 */
export const INTEGRATION_USAGE_EXAMPLES = {
  // Basic event communication
  basicEvents: `
    const { subscribe, emit } = useComponentIntegration('MyComponent');
    
    // Subscribe to events
    useEffect(() => {
      const unsubscribe = subscribe('CUSTOM_EVENT', (data) => {
        console.log('Received:', data);
      });
      
      return unsubscribe;
    }, []);
    
    // Emit events
    const handleButtonPress = () => {
      emit('CUSTOM_EVENT', { message: 'Hello from MyComponent' });
    };
  `,

  // Data synchronization
  dataSync: `
    const { triggerSync, getSyncStatus } = useDataSync('MyComponent', ['transactions']);
    
    const syncTransactions = async () => {
      const result = await triggerSync('transactions', transactionData);
      if (result.success) {
        console.log('Sync successful');
      }
    };
    
    const status = getSyncStatus('transactions');
    console.log('Sync status:', status.status);
  `,

  // Navigation with state sharing
  navigationSync: `
    const { navigateWithSync } = useNavigationIntegration(navigation, 'SourceScreen');
    
    const navigateToTarget = () => {
      navigateWithSync('TargetScreen', { id: 123 }, {
        shareState: { 
          currentData: myData,
          timestamp: Date.now(),
        }
      });
    };
  `,

  // Error handling
  errorHandling: `
    const { reportError } = useComponentIntegration('MyComponent');
    
    const handleOperation = async () => {
      try {
        // Some operation
        await riskyOperation();
      } catch (error) {
        reportError(error, {
          operation: 'riskyOperation',
          context: { userId: user.id },
        });
      }
    };
  `,

  // Props validation
  propsValidation: `
    const { validateProps } = useComponentIntegration('MyComponent');
    
    const schema = {
      title: { required: true, type: 'string' },
      count: { required: false, type: 'number' },
    };
    
    const validation = validateProps(props, schema);
    if (!validation.valid) {
      console.error('Props validation failed:', validation.errors);
    }
  `,
};

export default {
  ExampleHomeScreenWithIntegration,
  ExampleTransactionScreenWithIntegration,
  ExampleProfileScreenWithIntegration,
  ExampleErrorBoundaryWithIntegration,
  withIntegration,
  INTEGRATION_USAGE_EXAMPLES,
};