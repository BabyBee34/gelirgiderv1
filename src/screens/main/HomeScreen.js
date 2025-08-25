// FinanceFlow - Home Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, RefreshControl, Modal, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import CustomCard from '../../components/ui/CustomCard';
import { goldCurrencyData, goldCurrencyFunctions } from '../../utils/goldCurrencyData';
import { formatCurrency } from '../../utils/formatters';
import DetailedAddTransactionModal from '../modals/DetailedAddTransactionModal';
import ReceiptScannerModal from '../modals/ReceiptScannerModal';
import { transactionStorage } from '../../utils/storage';
import { LoadingScreen, EmptyState } from '../../components/ui/LoadingScreen';
import transactionService from '../../services/transactionService';
import accountService from '../../services/accountService';
import categoryService from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import { 
  AccessibleButton, 
  AccessibleCard, 
  AccessibleText, 
  AccessibleIcon,
  createAccessibilityLabel,
  createAccessibilityHint 
} from '../../components/ui/AccessibilityWrapper';
import { testSupabaseConnection, testAllConnections } from '../../config/supabase';
import goalService from '../../services/goalService';
import budgetService from '../../services/budgetService';
import recurringTransactionService from '../../services/recurringTransactionService';
import serviceManager from '../../services/serviceManager';
import ServiceStatusModal from '../../components/ServiceStatusModal';
import dataSyncService from '../../services/dataSyncService';

const { width, height } = Dimensions.get('window');
// Improved card width calculations for better centering and responsiveness
const HORIZONTAL_PADDING = theme.spacing.lg; // Consistent padding
const CARD_SPACING = theme.spacing.md; // Space between cards

// Responsive card width based on screen size
const getResponsiveCardWidth = () => {
  if (width < 375) { // Small screens (iPhone SE, etc.)
    return width - (HORIZONTAL_PADDING * 1.5);
  } else if (width > 414) { // Large screens (Plus, Max models)
    return width - (HORIZONTAL_PADDING * 2.5);
  }
  return width - (HORIZONTAL_PADDING * 2); // Standard screens
};

const CARD_WIDTH = getResponsiveCardWidth();
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING; // Include spacing for snap

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [addTransactionVisible, setAddTransactionVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [receiptScannerVisible, setReceiptScannerVisible] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [balanceSettingsVisible, setBalanceSettingsVisible] = useState(false);
  const [assetsSettingsVisible, setAssetsSettingsVisible] = useState(false);
  const [assetsBreakdownVisible, setAssetsBreakdownVisible] = useState(false); // Yeni eklenen
  const [notificationsVisible, setNotificationsVisible] = useState(false); // Bildirimler modal'ı
  const [pendingConfirmations, setPendingConfirmations] = useState([]); // Bekleyen onaylar
  const [userSettings, setUserSettings] = useState(null); // Kullanıcı ayarları
  
  // Professional services integration
  const [notificationCount, setNotificationCount] = useState(0);
  const [servicesHealth, setServicesHealth] = useState('checking');
  const [lastSystemCheck, setLastSystemCheck] = useState(null);
  const [serviceStatusVisible, setServiceStatusVisible] = useState(false);
  
  // Toplam Bakiye için ayarlar
  const [includeCashAccounts, setIncludeCashAccounts] = useState(true);
  const [includeSavings, setIncludeSavings] = useState(true);
  const [includeCreditAvailable, setIncludeCreditAvailable] = useState(false);
  const [includeGoldCurrency, setIncludeGoldCurrency] = useState(false);
  
  // Varlıklarım için ayrı ayarlar
  const [assetsIncludeCashAccounts, setAssetsIncludeCashAccounts] = useState(true);
  const [assetsIncludeSavings, setAssetsIncludeSavings] = useState(true);
  const [assetsIncludeCreditAvailable, setAssetsIncludeCreditAvailable] = useState(false);
  const [assetsIncludeGoldCurrency, setAssetsIncludeGoldCurrency] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const horizontalScrollRef = useRef(null);

  const getCashAccountsTotal = () => {
    if (!accounts || accounts.length === 0) return 0;
    // Sadece ana hesabın bakiyesini döndür
    const primaryAccount = accounts.find(a => a.is_primary === true);
    return primaryAccount ? parseFloat(primaryAccount.balance || 0) : 0;
  };

  const getSavingsTotal = () => {
    if (!accounts || accounts.length === 0) return 0;
    // Ana hesap hariç tüm hesapların toplamı
    return accounts
      .filter(a => a.is_primary !== true && (a.type === 'bank' || a.type === 'cash' || a.type === 'investment'))
      .reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
  };

  const getCreditAvailableTotal = () => {
    if (!accounts || accounts.length === 0) return 0;
    // Ana hesap hariç kredi kartlarının kullanılabilir limitlerini hesapla
    return accounts
      .filter(a => a.is_primary !== true && a.type === 'credit_card' && typeof a.credit_limit === 'number')
      .reduce((sum, a) => sum + (parseFloat(a.credit_limit) || 0), 0);
  };

  const getGoldCurrencyTotalTRY = () => {
    if (!goldCurrencyFunctions || typeof goldCurrencyFunctions.getTotalGoldValue !== 'function') {
      return 0;
    }
    return goldCurrencyFunctions.getTotalGoldValue();
  };

  useEffect(() => {
    if (user) {
      loadAllData();
      initializeProfessionalFeatures();
      setupRealtimeSync();
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Cleanup on unmount
    return () => {
      cleanupRealtimeSync();
    };
  }, [user]);

  // Setup real-time data synchronization
  const setupRealtimeSync = async () => {
    try {
      if (!user?.id) return;
      
      // Initialize data sync service
      const syncInitialized = await dataSyncService.initialize(user.id);
      if (!syncInitialized) {
        console.warn('Data sync service failed to initialize');
        return;
      }
      
      // Register callbacks for different data types
      dataSyncService.onDataUpdate('transaction', handleTransactionUpdate);
      dataSyncService.onDataUpdate('account', handleAccountUpdate);
      dataSyncService.onDataUpdate('account_balance', handleAccountBalanceUpdate);
      dataSyncService.onDataUpdate('category', handleCategoryUpdate);
      
      console.log('✓ Real-time data sync setup complete');
    } catch (error) {
      console.error('Failed to setup real-time sync:', error);
    }
  };

  // Cleanup real-time synchronization
  const cleanupRealtimeSync = () => {
    try {
      dataSyncService.cleanup();
      console.log('✓ Real-time sync cleaned up');
    } catch (error) {
      console.error('Error cleaning up real-time sync:', error);
    }
  };

  // Handle real-time transaction updates
  const handleTransactionUpdate = (updateData) => {
    const { type, data } = updateData;
    console.log('Real-time transaction update:', { type, data });
    
    if (type === 'INSERT') {
      // Add new transaction to state
      setTransactions(prev => [data, ...prev]);
    } else if (type === 'UPDATE') {
      // Update existing transaction
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === data.id ? data : transaction
        )
      );
    } else if (type === 'DELETE') {
      // Remove deleted transaction
      setTransactions(prev => 
        prev.filter(transaction => transaction.id !== data.id)
      );
    }
  };

  // Handle real-time account updates
  const handleAccountUpdate = (updateData) => {
    const { type, data } = updateData;
    console.log('Real-time account update:', { type, data });
    
    if (type === 'INSERT') {
      setAccounts(prev => [data, ...prev]);
    } else if (type === 'UPDATE') {
      setAccounts(prev => 
        prev.map(account => 
          account.id === data.id ? data : account
        )
      );
    } else if (type === 'DELETE') {
      setAccounts(prev => 
        prev.filter(account => account.id !== data.id)
      );
    }
  };

  // Handle real-time account balance updates
  const handleAccountBalanceUpdate = (updateData) => {
    console.log('Real-time balance update:', updateData);
    
    // Refresh accounts to get updated balances
    if (user?.id) {
      loadAccounts();
    }
  };

  // Handle real-time category updates
  const handleCategoryUpdate = (updateData) => {
    const { type, data } = updateData;
    console.log('Real-time category update:', { type, data });
    
    // Reload categories
    if (user?.id) {
      loadCategories();
    }
  };

  // Load categories function
  const loadCategories = async () => {
    if (!user) return;
    
    try {
      const result = await categoryService.getCategories(user.id);
      if (result.success) {
        const incomeCats = result.data.filter(cat => cat.type === 'income');
        const expenseCats = result.data.filter(cat => cat.type === 'expense');
        setCategories({ income: incomeCats, expense: expenseCats });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Initialize professional features
  const initializeProfessionalFeatures = async () => {
    try {
      // Check services health
      const healthStatus = await serviceManager.getHealthStatus();
      setServicesHealth(healthStatus.overall);
      setLastSystemCheck(new Date());

      // Get notification count from professional service
      const notificationService = serviceManager.getService('notification');
      if (notificationService) {
        // Mock notification count - in real app this would come from service
        setNotificationCount(2);
      }

      // Track screen view
      const monitoringService = serviceManager.getService('monitoring');
      if (monitoringService) {
        await monitoringService.trackScreenView('HomeScreen');
      }

      // Add breadcrumb for error tracking
      const errorService = serviceManager.getService('errorHandling');
      if (errorService) {
        await errorService.addBreadcrumb('home_screen_loaded', {
          userId: user?.id,
          timestamp: Date.now()
        });
      }

      console.log('✅ Professional features initialized on HomeScreen');
    } catch (error) {
      console.warn('⚠️ Professional features initialization failed:', error);
      setServicesHealth('error');
    }
  };

  // Tüm verileri yükle
  const loadAllData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load data in parallel for better performance
      const [transactionsResult, accountsResult, categoriesResult, recurringResult] = await Promise.all([
        transactionService.getTransactions(user.id),
        accountService.getAccounts(user.id),
        categoryService.getCategories(user.id),
        recurringTransactionService.getRecurringTransactions(user.id)
      ]);

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data || []);
      } else {
        console.error('Transactions loading error:', transactionsResult.error);
      }

      if (accountsResult.success) {
        setAccounts(accountsResult.data || []);
        
        // Ensure primary account exists
        await ensurePrimaryAccount(user.id, accountsResult.data);
      } else {
        console.error('Accounts loading error:', accountsResult.error);
        setError('Hesaplar yüklenirken hata oluştu');
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data || { income: [], expense: [] });
      } else {
        console.error('Categories loading error:', categoriesResult.error);
      }

      if (recurringResult.success) {
        setRecurringTransactions(recurringResult.data || []);
        console.log('Recurring transactions loaded:', recurringResult.data?.length || 0);
      } else {
        console.error('Recurring transactions loading error:', recurringResult.error);
      }
      
      // Kullanıcı ayarlarını ve bekleyen onayları yükle
      const [settingsResult, confirmationsResult] = await Promise.all([
        recurringTransactionService.getUserSettings(user.id),
        recurringTransactionService.getPendingConfirmations(user.id)
      ]);

      if (settingsResult.success) {
        setUserSettings(settingsResult.data);
      } else {
        console.error('User settings loading error:', settingsResult.error);
      }

      if (confirmationsResult.success) {
        setPendingConfirmations(confirmationsResult.data || []);
      } else {
        console.error('Pending confirmations loading error:', confirmationsResult.error);
      }
      
    } catch (error) {
      console.error('Data loading error:', error);
      setError('Veriler yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Separate function to load accounts (for refreshing after transactions)
  const loadAccounts = async () => {
    if (!user) return;
    
    try {
      const accountsResult = await accountService.getAccounts(user.id);
      if (accountsResult.success) {
        setAccounts(accountsResult.data || []);
      }
    } catch (error) {
      console.error('Accounts refresh error:', error);
    }
  };

  // Ensure user has a primary account
  const ensurePrimaryAccount = async (userId, existingAccounts) => {
    try {
      if (!existingAccounts || existingAccounts.length === 0) {
        // Create default primary account
        const defaultAccount = {
          user_id: userId,
          name: 'Ana Hesap',
          type: 'cash',
          balance: 0.00,
          currency: 'TRY',
          is_primary: true,
          is_active: true
        };
        
        const createResult = await accountService.createAccount(defaultAccount);
        if (createResult.success) {
          console.log('✓ Primary account created for user');
          // Reload accounts to include the new primary account
          await loadAccounts();
        }
      } else {
        // Check if any account is marked as primary
        const hasPrimary = existingAccounts.some(account => account.is_primary === true);
        if (!hasPrimary) {
          // Set the first account as primary
          const firstAccount = existingAccounts[0];
          await accountService.setPrimaryAccount(firstAccount.id);
          console.log('✓ Primary account set for existing accounts');
          await loadAccounts();
        }
      }
    } catch (error) {
      console.error('Error ensuring primary account:', error);
    }
  };


  const loadGoals = async () => {
    if (!user) return;
    try {
      const goalsResult = await goalService.getGoals(user.id);
      if (goalsResult.success) {
        setGoals(goalsResult.data || []);
      } else {
        console.error('Load goals error:', goalsResult.error);
        setGoals([]);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    }
  };

  const loadBudgets = async () => {
    if (!user) return;
    try {
      const budgetsResult = await budgetService.getBudgets(user.id);
      if (budgetsResult.success) {
        setBudgets(budgetsResult.data || []);
      } else {
        console.error('Load budgets error:', budgetsResult.error);
        setBudgets([]);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      setBudgets([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await loadAllData();
    }
    setRefreshing(false);
  };

  const getTotalBalance = () => {
    // Sadece ana hesap bakiyesini döndür
    return getCashAccountsTotal();
  };

  const getRecentTransactions = () => {
    if (!transactions || !Array.isArray(transactions)) return [];
    return transactions.slice(0, 3);
  };

  const handleTransactionAdded = async (newTransaction) => {
    try {
      // Professional error handling and monitoring
      const errorService = serviceManager.getService('errorHandling');
      const monitoringService = serviceManager.getService('monitoring');
      
      if (errorService) {
        await errorService.addBreadcrumb('transaction_added', {
          transactionType: newTransaction.type,
          amount: newTransaction.amount,
          timestamp: Date.now()
        });
      }
      
      // Transaction'ı ekle
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Hesapları yeniden yükle (bakiye güncellemesi için)
      await loadAccounts();
      
      // Tüm verileri yeniden yükle
      await loadAllData();
      
      // Track successful transaction
      if (monitoringService) {
        await monitoringService.trackEvent('transaction_added_success', {
          type: newTransaction.type,
          amount: newTransaction.amount,
          method: 'manual'
        });
      }
      
      // Send success notification
      const notificationService = serviceManager.getService('notification');
      if (notificationService) {
        await notificationService.sendTransactionNotification(newTransaction);
      }
      
    } catch (error) {
      console.error('Transaction handling error:', error);
      
      // Professional error logging
      const errorService = serviceManager.getService('errorHandling');
      if (errorService) {
        await errorService.handleBusinessLogicError(error, {
          operation: 'handleTransactionAdded',
          transactionData: newTransaction
        });
      }
    }
  };

  const renderFABMenu = () => {
    const fabMenuItems = [
      {
        id: 'income',
        label: 'Gelir Ekle',
        icon: 'trending-up',
        color: '#48BB78',
        onPress: () => {
          setFabMenuVisible(false);
          setTransactionType('income');
          setAddTransactionVisible(true);
        }
      },
      {
        id: 'expense',
        label: 'Gider Ekle',
        icon: 'trending-down',
        color: '#F56565',
        onPress: () => {
          setFabMenuVisible(false);
          setTransactionType('expense');
          setAddTransactionVisible(true);
        }
      },
      {
        id: 'scan',
        label: 'Fiş Tara',
        icon: 'camera-alt',
        color: '#ED8936',
        onPress: () => {
          setFabMenuVisible(false);
          setReceiptScannerVisible(true);
        }
      },
      {
        id: 'goal',
        label: 'Hedef Ekle',
        icon: 'flag',
        color: '#9F7AEA',
        onPress: () => {
          setFabMenuVisible(false);
          navigation.navigate('Budget');
        }
      },
      {
        id: 'transfer',
        label: 'Hesap Transferi',
        icon: 'swap-horiz',
        color: '#4ECDC4',
        onPress: () => {
          setFabMenuVisible(false);
          // Mock transfer action
        }
      }
    ];

    return (
      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Backdrop - ARKADA OLMALI */}
        {fabMenuVisible && (
          <TouchableOpacity
            style={styles.fabBackdrop}
            onPress={() => setFabMenuVisible(false)}
            activeOpacity={1}
          />
        )}

        {/* FAB Menu Items - ÖNDE */}
        {fabMenuVisible && (
          <View style={styles.fabMenuContainer} pointerEvents="box-none">
            {fabMenuItems.map((item, index) => (
              <Animated.View
                key={`fab-menu-${item.id}`}
                style={[
                  styles.fabMenuItem,
                  {
                    transform: [{
                      translateY: fabMenuVisible 
                        ? -(60 * (fabMenuItems.length - index))
                        : 0
                    }],
                    opacity: fabMenuVisible ? 1 : 0,
                    zIndex: 2,
                    elevation: 6,
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.fabMenuButton}
                  onPress={item.onPress}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.8}
                >
                  <View style={styles.fabMenuLabelContainer}>
                    <Text style={styles.fabMenuLabel}>{item.label}</Text>
                  </View>
                  <View style={[styles.fabMenuIconContainer, { backgroundColor: item.color }]}>
                    <MaterialIcons name={item.icon} size={20} color="#ffffff" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Main FAB - EN ÖNDE */}
        <TouchableOpacity 
          style={[styles.fab, { zIndex: 3, elevation: 8 }]}
          onPress={() => setFabMenuVisible(!fabMenuVisible)}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View
              style={{
                transform: [{
                  rotate: fabMenuVisible ? '45deg' : '0deg'
                }]
              }}
            >
              <MaterialIcons name="add" size={28} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // Recurring transactions yardımcı fonksiyonları
  const getRecurringIncomeTotal = () => {
    if (!recurringTransactions || !Array.isArray(recurringTransactions)) return 0;
    return recurringTransactions
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const getRecurringExpenseTotal = () => {
    if (!recurringTransactions || !Array.isArray(recurringTransactions)) return 0;
    return recurringTransactions
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const getRecurringNetTotal = () => {
    return getRecurringIncomeTotal() - getRecurringExpenseTotal();
  };

  const getMonthlyStats = () => {
    if (!transactions || !Array.isArray(transactions)) {
      return { income: 0, expenses: 0, net: 0 };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return {
      income,
      expenses,
      net: income - expenses
    };
  };

  const getFrequencyText = (frequency) => {
    const frequencyMap = {
      daily: 'Günlük',
      weekly: 'Haftalık', 
      monthly: 'Aylık',
      quarterly: 'Üç Aylık',
      yearly: 'Yıllık'
    };
    return frequencyMap[frequency] || 'Aylık';
  };

  const formatNextDueDate = (dueDateString) => {
    if (!dueDateString) return 'Belirtilmemiş';
    try {
      const dueDate = new Date(dueDateString);
      const today = new Date();
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `${Math.abs(diffDays)} gün gecikmiş`;
      } else if (diffDays === 0) {
        return 'Bugün';
      } else if (diffDays === 1) {
        return 'Yarın';
      } else if (diffDays <= 7) {
        return `${diffDays} gün sonra`;
      } else {
        return dueDate.toLocaleDateString('tr-TR');
      }
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  const renderRecurringTransactionItem = (item, type) => {
    const isOverdue = item.next_due_date && new Date(item.next_due_date) < new Date();
    const amountColor = type === 'income' ? '#48BB78' : '#F56565';
    const sign = type === 'income' ? '+' : '-';

    // Debug: item.name değerini kontrol et
    console.log('Recurring item:', { 
      id: item.id, 
      name: item.name, 
      description: item.description,
      type: item.type 
    });

    // Fallback: name yoksa description, o da yoksa varsayılan değer kullan
    const displayName = item.name || item.description || `Sabit ${type === 'income' ? 'Gelir' : 'Gider'}`;

    return (
      <View key={item.id} style={styles.recurringItem}>
        <View style={styles.recurringItemLeft}>
          <View style={[
            styles.recurringItemIcon, 
            { backgroundColor: `${amountColor}20` }
          ]}>
            <MaterialIcons 
              name={item.category?.icon || 'category'} 
              size={16} 
              color={amountColor} 
            />
          </View>
          <View style={styles.recurringItemDetails}>
            <Text style={styles.recurringItemName}>{displayName}</Text>
            <Text style={styles.recurringItemFrequency}>
              {getFrequencyText(item.frequency)} • {formatNextDueDate(item.next_due_date)}
            </Text>
            {isOverdue && (
              <Text style={[styles.recurringItemFrequency, { color: '#F56565', fontWeight: '600' }]}>
                ⚠️ Vadesi geçmiş
              </Text>
            )}
          </View>
        </View>
        <View style={styles.recurringItemRight}>
          <Text style={[styles.recurringItemAmount, { color: amountColor }]}>
            {sign}{formatCurrency(item.amount)}
          </Text>
          <Text style={styles.recurringItemAccount}>
            {item.account?.name || 'Hesap'}
          </Text>
        </View>
      </View>
    );
  };

  const monthlyStats = getMonthlyStats();
  const totalBalance = getTotalBalance();
  const recentTransactions = getRecentTransactions();

  // Varlıklarım kartı için kalem bazlı özet
  const assetsBreakdown = [
    {
      id: 'primary',
      label: 'Ana Hesap',
      icon: 'account-balance',
      enabled: true, // Ana hesap her zaman gösterilir
      amount: getCashAccountsTotal(),
      color: '#6C63FF',
    },
    {
      id: 'other_accounts',
      label: 'Diğer Hesaplar',
      icon: 'account-balance-wallet',
      enabled: assetsIncludeCashAccounts,
      amount: getSavingsTotal(),
      color: '#4ECDC4',
    },
    {
      id: 'credit',
      label: 'Kredi Limit',
      icon: 'credit-card',
      enabled: assetsIncludeCreditAvailable,
      amount: getCreditAvailableTotal(),
      color: '#ED8936',
    },
    {
      id: 'gold',
      label: 'Altın & Döviz',
      icon: 'star',
      enabled: assetsIncludeGoldCurrency,
      amount: getGoldCurrencyTotalTRY(),
      color: '#FFE66D',
    },
  ];

  const getCategoryName = (categoryId) => {
    if (!categories || !categories.income || !categories.expense) return 'Kategori';
    const allCategories = [...categories.income, ...categories.expense];
    const category = allCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Kategori';
  };

  const getCategoryIcon = (categoryId) => {
    if (!categories || !categories.income || !categories.expense) return 'category';
    const allCategories = [...categories.income, ...categories.expense];
    const category = allCategories.find(cat => cat.id === categoryId);
    return category ? category.icon : 'category';
  };

  const renderQuickActionButton = (icon, label, color, onPress) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.quickActionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialIcons name={icon} size={24} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  // Onay işleme fonksiyonu
  const handleConfirmation = async (notificationId, type, confirmed) => {
    try {
      let result;
      
      if (type === 'salary_confirmation') {
        result = await recurringTransactionService.confirmSalary(notificationId, confirmed);
      } else if (type === 'large_expense_confirmation') {
        result = await recurringTransactionService.confirmLargeExpense(notificationId, confirmed);
      }

      if (result && result.success) {
        // Bildirimi listeden kaldır
        setPendingConfirmations(prev => prev.filter(n => n.id !== notificationId));
        
        // Hesapları yeniden yükle (bakiye güncellemesi için)
        await loadAccounts();
        
        // Başarı mesajı göster
        Alert.alert('Başarılı', result.message);
      } else {
        Alert.alert('Hata', result?.error || 'Onay işlenirken hata oluştu');
      }
    } catch (error) {
      console.error('Confirmation handling error:', error);
      Alert.alert('Hata', 'Onay işlenirken beklenmeyen bir hata oluştu');
    }
  };

  if (loading) {
    return <LoadingScreen message="Veriler yükleniyor..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Hata Oluştu</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setError(null);
            if (user) {
              loadAllData();
            }
          }}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <AccessibleText 
              style={styles.greetingText}
              accessibilityLabel="Selamlama"
              accessibilityHint="Kullanıcı selamlanıyor"
            >
              Merhaba,
            </AccessibleText>
            <AccessibleText 
              style={styles.userName}
              accessibilityLabel={`Kullanıcı adı: ${user?.email ? user.email.split('@')[0] : 'Kullanıcı'}`}
              accessibilityHint="Giriş yapmış kullanıcının adı"
            >
              {user?.email ? user.email.split('@')[0] : 'Kullanıcı'}
            </AccessibleText>
          </View>
          <AccessibleButton
            style={styles.notificationButton}
            accessibilityLabel={`Bildirimler - ${notificationCount} yeni bildirim`}
            accessibilityHint="Bildirimleri görüntüle ve sistem durumunu kontrol et"
            onPress={async () => {
              // Professional notification and service status handling
              setServiceStatusVisible(true);
              
              const notificationService = serviceManager.getService('notification');
              if (notificationService) {
                // Show notification history or settings
                await notificationService.sendLocalNotification(
                  '🔔 Servis Durumu',
                  `Sistem sağlığı: ${servicesHealth === 'healthy' ? 'Normal' : 'Dikkat Gerekli'}. ${notificationCount} yeni bildirim var.`,
                  { type: 'info' }
                );
              }
            }}
          >
            <AccessibleIcon 
              name="notifications-none" 
              size={24} 
              color={theme.colors.textPrimary}
              accessibilityLabel="Bildirim ikonu"
            />
            {notificationCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: '#F56565' }]}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
            {/* System health indicator */}
            <View style={[
              styles.healthIndicator,
              { backgroundColor: servicesHealth === 'healthy' ? '#48BB78' : servicesHealth === 'error' ? '#F56565' : '#FFE66D' }
            ]} />
          </AccessibleButton>
          
          {/* Professional System Health Check Button */}
          <TouchableOpacity 
            style={[styles.testButton, {
              backgroundColor: servicesHealth === 'healthy' ? '#48BB78' : servicesHealth === 'error' ? '#F56565' : '#FFE66D'
            }]}
            onPress={async () => {
              setServicesHealth('checking');
              
              // Run comprehensive system test
              const testingService = serviceManager.getService('testing');
              if (testingService) {
                console.log('🧪 Starting comprehensive system test...');
                const testResults = await testingService.runQuickTest();
                
                if (testResults.success) {
                  setServicesHealth('healthy');
                  console.log('✅ System test passed:', testResults);
                  
                  // Send success notification
                  const notificationService = serviceManager.getService('notification');
                  if (notificationService) {
                    await notificationService.sendLocalNotification(
                      '✅ Sistem Testi Başarılı',
                      `Tüm testler geçti (${testResults.passed}/${testResults.total})`,
                      { type: 'success' }
                    );
                  }
                } else {
                  setServicesHealth('error');
                  console.log('❌ System test failed:', testResults);
                  
                  // Send error notification
                  const notificationService = serviceManager.getService('notification');
                  if (notificationService) {
                    await notificationService.sendLocalNotification(
                      '❌ Sistem Testi Başarısız',
                      'Bazı sistem bileşenleri dikkat gerektiriyor',
                      { type: 'error' }
                    );
                  }
                }
                
                setLastSystemCheck(new Date());
              } else {
                // Fallback to basic Supabase test
                const isConnected = await testSupabaseConnection();
                setServicesHealth(isConnected ? 'healthy' : 'error');
                console.log(isConnected ? '✅ Supabase bağlantısı başarılı' : '❌ Supabase bağlantısı başarısız');
              }
            }}
          >
            <MaterialIcons 
              name={servicesHealth === 'checking' ? 'refresh' : servicesHealth === 'healthy' ? 'check-circle' : 'error'} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          {/* Professional Comprehensive Test Button */}
          <TouchableOpacity 
            style={[styles.testButton, { marginLeft: 8, backgroundColor: '#6C63FF' }]}
            onPress={async () => {
              console.log('🔍 Starting comprehensive professional test suite...');
              
              const testingService = serviceManager.getService('testing');
              if (testingService) {
                try {
                  const comprehensiveResults = await serviceManager.runSystemTest();
                  
                  if (comprehensiveResults) {
                    console.log('✅ Comprehensive test completed:', comprehensiveResults);
                    
                    // Send detailed notification
                    const notificationService = serviceManager.getService('notification');
                    if (notificationService) {
                      await notificationService.sendLocalNotification(
                        '📈 Kapsamlı Test Tamamlandı',
                        `Sonuç: ${comprehensiveResults.passed}/${comprehensiveResults.total} test geçti (${comprehensiveResults.passRate}%)`,
                        { 
                          type: comprehensiveResults.passRate > 80 ? 'success' : 'warning',
                          data: comprehensiveResults
                        }
                      );
                    }
                    
                    // Update health status based on test results
                    setServicesHealth(comprehensiveResults.passRate > 80 ? 'healthy' : 'degraded');
                  } else {
                    throw new Error('Test service not available');
                  }
                } catch (error) {
                  console.error('❌ Comprehensive test failed:', error);
                  setServicesHealth('error');
                }
              } else {
                // Fallback to basic connection test
                console.log('🔍 Kapsamlı test başlatılıyor...');
                const allConnected = await testAllConnections();
                if (allConnected) {
                  console.log('✅ Tüm bağlantılar başarılı!');
                  setServicesHealth('healthy');
                } else {
                  console.log('❌ Bazı bağlantılar başarısız!');
                  setServicesHealth('error');
                }
              }
            }}
          >
            <MaterialIcons name="analytics" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Top Cards (Balance + Assets) */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={horizontalScrollRef}
            pagingEnabled={false}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={[
              styles.topCardsContainer, 
              { 
                paddingTop: theme.spacing.lg, // Üst padding ekle - header'dan uzaklaştır
                paddingBottom: theme.spacing.sm,
                paddingHorizontal: theme.screen.isSmall ? theme.spacing.md : theme.screen.isMedium ? theme.spacing.lg : theme.spacing.xl,
                overflow: 'visible',
              }
            ]}
            scrollEventThrottle={16}
            bounces={false}
            centerContent={true}
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const cardIndex = Math.round(x / SNAP_INTERVAL);
              const targetX = cardIndex * SNAP_INTERVAL;
              
              // Ensure we don't scroll beyond bounds
              const maxScrollX = SNAP_INTERVAL; // For 2 cards (0 and 1 index)
              const clampedX = Math.max(0, Math.min(targetX, maxScrollX));
              
              // Only scroll if there's a significant difference to prevent unnecessary animations
              if (Math.abs(x - clampedX) > 10) {
                horizontalScrollRef.current?.scrollTo({ 
                  x: clampedX, 
                  animated: true 
                });
              }
            }}
            onScrollEndDrag={(e) => {
              // Handle manual scroll end for better user experience
              const x = e.nativeEvent.contentOffset.x;
              const cardIndex = Math.round(x / SNAP_INTERVAL);
              const targetX = cardIndex * SNAP_INTERVAL;
              const maxScrollX = SNAP_INTERVAL;
              const clampedX = Math.max(0, Math.min(targetX, maxScrollX));
              
              horizontalScrollRef.current?.scrollTo({ 
                x: clampedX, 
                animated: true 
              });
            }}
            onLayout={() => {
              // Auto-center the first card when layout is complete
              setTimeout(() => {
                horizontalScrollRef.current?.scrollTo({ 
                  x: 0, 
                  animated: false 
                });
              }, 100);
            }}
          >
            {/* Toplam Bakiye */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={[styles.balanceCard, styles.topCard, { width: CARD_WIDTH }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Ana Hesap Bakiyesi</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setBalanceSettingsVisible(true)} style={styles.balanceSettingsButton}>
                    <MaterialIcons name="tune" size={20} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                    <MaterialIcons name={showBalance ? 'visibility' : 'visibility-off'} size={20} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.balanceAmount}>
                {showBalance ? formatCurrency(totalBalance) : '••••••'}
              </Text>
              <View style={styles.balanceSubInfo}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceSubLabel}>Bu Ay Gelir</Text>
                  <Text style={[styles.balanceSubAmount, { color: '#48BB78' }]}>+{formatCurrency(monthlyStats.income)}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceSubLabel}>Bu Ay Gider</Text>
                  <Text style={[styles.balanceSubAmount, { color: '#F56565' }]}>-{formatCurrency(monthlyStats.expenses)}</Text>
                </View>
              </View>
              </LinearGradient>
            </View>

            {/* Varlıklarım */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={[theme.colors.secondary, theme.colors.primary]}
                style={[styles.balanceCard, styles.assetsCard, styles.topCard, { width: CARD_WIDTH }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Varlıklarım</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setAssetsSettingsVisible(true)} style={styles.balanceSettingsButton}>
                    <MaterialIcons name="tune" size={20} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowAssets(!showAssets)}>
                    <MaterialIcons name={showAssets ? 'visibility' : 'visibility-off'} size={20} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.balanceAmount}>
                {showAssets ? formatCurrency(
                  (assetsIncludeCashAccounts ? getSavingsTotal() : 0) +
                  (assetsIncludeCreditAvailable ? getCreditAvailableTotal() : 0) +
                  (assetsIncludeGoldCurrency ? getGoldCurrencyTotalTRY() : 0)
                ) : '••••••'}
              </Text>
              <Text style={styles.assetsSubtitle}>Dahil edilenler</Text>
              {showAssets && (
                <TouchableOpacity 
                  style={styles.assetsBreakdownContainer}
                  onPress={() => setAssetsBreakdownVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.assetsBreakdownHeader}>
                    <Text style={styles.assetsBreakdownTitle}>Detayları Gör</Text>
                    <MaterialIcons name="expand-more" size={16} color="rgba(255,255,255,0.8)" />
                  </View>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
          </ScrollView>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActions}>
            {renderQuickActionButton("add", "Gelir Ekle", "#48BB78", () => {
              setTransactionType('income');
              setAddTransactionVisible(true);
            })}
            {renderQuickActionButton("remove", "Gider Ekle", "#F56565", () => {
              setTransactionType('expense');
              setAddTransactionVisible(true);
            })}
            {renderQuickActionButton("camera-enhance", "Fiş Tara", "#6C63FF", () => setReceiptScannerVisible(true))}
            {renderQuickActionButton("star", "Altın & Döviz", "#FFE66D", () => navigation.navigate('GoldCurrency'))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son İşlemler</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllButton}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsList}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <TouchableOpacity key={transaction.id || index} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <MaterialIcons 
                      name={getCategoryIcon(transaction.category_id)} 
                      size={24} 
                      color={transaction.type === 'income' ? '#48BB78' : '#F56565'} 
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{transaction.description || 'İşlem'}</Text>
                    <Text style={styles.transactionCategory}>{getCategoryName(transaction.category_id)}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? '#48BB78' : '#F56565' }
                  ]}>
                    {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                type="transactions"
                onAction={() => {
                  setTransactionType('expense');
                  setAddTransactionVisible(true);
                }}
                size="small"
              />
            )}
          </View>
        </View>

        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bu Ay Özet</Text>
          <View style={styles.overviewGrid}>
            <CustomCard style={styles.overviewCard}>
              <MaterialIcons name="trending-up" size={32} color="#48BB78" />
              <Text style={styles.overviewTitle}>Tasarruf</Text>
              <Text style={styles.overviewAmount}>
                {formatCurrency(monthlyStats.income - monthlyStats.expenses)}
              </Text>
            </CustomCard>
            
            <CustomCard style={styles.overviewCard}>
              <MaterialIcons name="account-balance-wallet" size={32} color="#6C63FF" />
              <Text style={styles.overviewTitle}>Hesap Sayısı</Text>
              <Text style={styles.overviewAmount}>{accounts.length}</Text>
            </CustomCard>
            
            <CustomCard style={styles.overviewCard}>
              <MaterialIcons name="receipt" size={32} color="#4ECDC4" />
              <Text style={styles.overviewTitle}>İşlem Sayısı</Text>
              <Text style={styles.overviewAmount}>{transactions.length}</Text>
            </CustomCard>
            
            <CustomCard style={styles.overviewCard}>
              <MaterialIcons name="flag" size={32} color="#9F7AEA" />
              <Text style={styles.overviewTitle}>Hedef Sayısı</Text>
              <Text style={styles.overviewAmount}>{goals.length}</Text>
            </CustomCard>
          </View>
        </View>

        {/* Sabit Gelir ve Giderler Özeti */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sabit Gelir & Giderler</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllButton}>Yönet</Text>
            </TouchableOpacity>
          </View>
          {/* Recurring Transactions Summary */}
          {recurringTransactions && recurringTransactions.length > 0 ? (
            <View style={styles.recurringContainer}>
              {/* Sabit Gelirler */}
              {recurringTransactions.filter(item => item.type === 'income').length > 0 && (
                <View style={styles.recurringSection}>
                  <View style={styles.recurringHeader}>
                    <MaterialIcons name="trending-up" size={20} color="#48BB78" />
                    <Text style={styles.recurringSectionTitle}>Sabit Gelirler</Text>
                    <Text style={styles.recurringTotal}>
                      +{formatCurrency(getRecurringIncomeTotal())}
                    </Text>
                  </View>
                  <View style={styles.recurringItems}>
                    {recurringTransactions.filter(item => item.type === 'income').map(item => renderRecurringTransactionItem(item, 'income'))}
                  </View>
                </View>
              )}

              {/* Sabit Giderler */}
              {recurringTransactions.filter(item => item.type === 'expense').length > 0 && (
                <View style={styles.recurringSection}>
                  <View style={styles.recurringHeader}>
                    <MaterialIcons name="trending-down" size={20} color="#F56565" />
                    <Text style={styles.recurringSectionTitle}>Sabit Giderler</Text>
                    <Text style={styles.recurringTotal}>
                      -{formatCurrency(getRecurringExpenseTotal())}
                    </Text>
                  </View>
                  <View style={styles.recurringItems}>
                    {recurringTransactions.filter(item => item.type === 'expense').map(item => renderRecurringTransactionItem(item, 'expense'))}
                  </View>
                </View>
              )}

              {/* Net Durum */}
              <View style={styles.netStatusContainer}>
                <View style={styles.netStatusHeader}>
                  <MaterialIcons 
                    name={getRecurringNetTotal() >= 0 ? "trending-up" : "trending-down"} 
                    size={20} 
                    color={getRecurringNetTotal() >= 0 ? '#48BB78' : '#F56565'} 
                  />
                  <Text style={styles.netStatusLabel}>Aylık Net Durum</Text>
                </View>
                <Text style={[
                  styles.netStatusText,
                  { color: getRecurringNetTotal() >= 0 ? '#48BB78' : '#F56565' }
                ]}>
                  {getRecurringNetTotal() >= 0 ? '+' : ''}{formatCurrency(getRecurringNetTotal())}
                </Text>
                <Text style={styles.netStatusDescription}>
                  {getRecurringNetTotal() >= 0 
                    ? 'Sabit gelirleriniz giderlerinizi karşılıyor' 
                    : 'Sabit giderleriniz gelirlerinizi aşıyor'
                  }
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.recurringEmptyContainer}>
              <MaterialIcons name="repeat" size={48} color={theme.colors.textSecondary} style={styles.recurringEmptyIcon} />
              <Text style={styles.recurringEmptyTitle}>Sabit Gelir/Gider Tanımlı Değil</Text>
              <Text style={styles.recurringEmptySubtitle}>
                Düzenli gelir ve giderlerinizi tanımlayarak finansal planlamanızı kolaylaştırın
              </Text>
              <TouchableOpacity 
                style={styles.recurringEmptyButton}
                onPress={() => navigation.navigate('Transactions')}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.recurringEmptyButtonText}>İlk Sabit İşlemi Ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bildirimler ve Onaylar Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bildirimler & Onaylar</Text>
            <TouchableOpacity onPress={() => setNotificationsVisible(true)}>
              <Text style={styles.seeAllButton}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          {/* Bekleyen Onaylar */}
          {pendingConfirmations && pendingConfirmations.length > 0 ? (
            <View style={styles.notificationsContainer}>
              {pendingConfirmations.slice(0, 3).map((notification) => (
                <View key={notification.id} style={styles.notificationItem}>
                  <View style={styles.notificationIcon}>
                    <MaterialIcons 
                      name={notification.type === 'salary_confirmation' ? 'account-balance' : 'receipt'} 
                      size={20} 
                      color={notification.type === 'salary_confirmation' ? '#48BB78' : '#F56565'} 
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.created_at).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  <View style={styles.notificationActions}>
                    <TouchableOpacity 
                      style={[styles.notificationButton, styles.confirmButton]}
                      onPress={() => handleConfirmation(notification.id, notification.type, true)}
                    >
                      <Text style={styles.confirmButtonText}>Onayla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.notificationButton, styles.rejectButton]}
                      onPress={() => handleConfirmation(notification.id, notification.type, false)}
                    >
                      <Text style={styles.rejectButtonText}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {pendingConfirmations.length > 3 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setNotificationsVisible(true)}
                >
                  <Text style={styles.showMoreButtonText}>
                    +{pendingConfirmations.length - 3} daha onay bekliyor
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noNotificationsContainer}>
              <MaterialIcons name="notifications-none" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.noNotificationsTitle}>Bekleyen Onay Yok</Text>
              <Text style={styles.noNotificationsSubtitle}>
                Tüm sabit işlemleriniz otomatik olarak işleniyor
              </Text>
            </View>
          )}
        </View>

        {/* Altın & Döviz kısayolu halen Hızlı İşlemlerden erişilebilir */}

        {/* Goals Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hedeflerim</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
              <Text style={styles.seeAllButton}>Yönet</Text>
            </TouchableOpacity>
          </View>
          {goals && goals.length > 0 ? (
            goals.filter(goal => goal.showOnHome).map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <CustomCard key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <MaterialIcons name={goal.icon} size={24} color={goal.color} />
                    <Text style={styles.goalTitle}>{goal.name}</Text>
                    <Text style={styles.goalAmount}>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                  </View>
                </CustomCard>
              );
            })
          ) : (
            <EmptyState
              type="goals"
              onAction={() => navigation.navigate('Budget')}
              size="small"
            />
          )}
        </View>

        {/* Budgets Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bütçelerim</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
              <Text style={styles.seeAllButton}>Yönet</Text>
            </TouchableOpacity>
          </View>
          {budgets && budgets.length > 0 ? (
            budgets.filter(budget => budget.showOnHome).map((budget) => {
              const progress = (budget.spent / budget.limit) * 100;
              const isOverBudget = progress > 100;
              return (
                <CustomCard key={budget.id} style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <MaterialIcons name={budget.icon} size={24} color={budget.color} />
                    <Text style={styles.budgetTitle}>{budget.name}</Text>
                    <Text style={[styles.budgetAmount, { color: isOverBudget ? '#F56565' : '#48BB78' }]}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: isOverBudget ? '#F56565' : budget.color }]} />
                    </View>
                    <Text style={[styles.progressText, { color: isOverBudget ? '#F56565' : budget.color }]}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                </CustomCard>
              );
            })
          ) : (
            <EmptyState
              type="budgets"
              onAction={() => navigation.navigate('Budget')}
              size="small"
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      {renderFABMenu()}

      {/* Modals */}
      <DetailedAddTransactionModal
        visible={addTransactionVisible}
        onClose={() => setAddTransactionVisible(false)}
        type={transactionType}
        onTransactionAdded={handleTransactionAdded}
      />

      <ReceiptScannerModal
        visible={receiptScannerVisible}
        onClose={() => setReceiptScannerVisible(false)}
        onReceiptScanned={(data) => {
          // Handle receipt data
          console.log('Receipt scanned:', data);
        }}
      />

      {/* Balance Settings Modal */}
      <Modal
        visible={balanceSettingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBalanceSettingsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setBalanceSettingsVisible(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Bakiye Ayarları</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Altın & Döviz</Text>
            <Switch value={includeGoldCurrency} onValueChange={setIncludeGoldCurrency} />
          </View>
          
          {/* Varlık Ayarları Bölümü */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Varlık Kalemleri</Text>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Nakit & Vadesiz Hesaplar</Text>
              <Switch value={includeCashAccounts} onValueChange={setIncludeCashAccounts} />
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Tasarruf Hesapları</Text>
              <Switch value={includeSavings} onValueChange={setIncludeSavings} />
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Kredi Kartı Kullanılabilir Limit</Text>
              <Switch value={includeCreditAvailable} onValueChange={setIncludeCreditAvailable} />
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Altın & Döviz</Text>
              <Switch value={includeGoldCurrency} onValueChange={setIncludeGoldCurrency} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Varlıklar Ayarları Modal */}
      <Modal
        visible={assetsSettingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAssetsSettingsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAssetsSettingsVisible(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Varlık Ayarları</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Varlık Kalemleri Bölümü */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Varlık Kalemleri</Text>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Nakit & Vadesiz Hesaplar</Text>
              <Switch value={assetsIncludeCashAccounts} onValueChange={setAssetsIncludeCashAccounts} />
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Tasarruf Hesapları</Text>
              <Switch value={assetsIncludeSavings} onValueChange={setAssetsIncludeSavings} />
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Kredi Kartı Kullanılabilir Limit</Text>
              <Switch value={assetsIncludeCreditAvailable} onValueChange={setAssetsIncludeCreditAvailable} />
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Altın & Döviz</Text>
              <Switch value={assetsIncludeGoldCurrency} onValueChange={setAssetsIncludeGoldCurrency} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Professional Service Status Modal */}
      <ServiceStatusModal
        visible={serviceStatusVisible}
        onClose={() => setServiceStatusVisible(false)}
      />

      {/* Varlıklar Detayları Modal */}
      <Modal
        visible={assetsBreakdownVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAssetsBreakdownVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAssetsBreakdownVisible(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Varlık Detayları</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {assetsBreakdown.filter(b => b.id !== 'primary' && b.enabled).map(item => (
              <View key={item.id} style={styles.assetDetailItem}>
                <View style={styles.assetDetailLeft}>
                  <View style={[styles.assetDetailIcon, { backgroundColor: item.color }]}>
                    <MaterialIcons name={item.icon} size={20} color="#fff" />
                  </View>
                  <View style={styles.assetDetailInfo}>
                    <Text style={styles.assetDetailLabel}>{item.label}</Text>
                    <Text style={styles.assetDetailDescription}>
                      {item.id === 'other_accounts' ? 'Tasarruf ve yatırım hesapları' :
                       item.id === 'credit' ? 'Kullanılabilir kredi limiti' :
                       item.id === 'gold' ? 'Altın ve döviz varlıkları' : 'Diğer varlıklar'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.assetDetailAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
            
            {assetsBreakdown.filter(b => b.id !== 'primary' && b.enabled).length === 0 && (
              <View style={styles.emptyAssetsContainer}>
                <MaterialIcons name="info" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyAssetsTitle}>Varlık Kalemi Seçilmemiş</Text>
                <Text style={styles.emptyAssetsSubtitle}>
                  Varlık ayarlarından hangi kalemlerin dahil edileceğini seçin
                </Text>
                <TouchableOpacity 
                  style={styles.emptyAssetsButton}
                  onPress={() => {
                    setAssetsBreakdownVisible(false);
                    setAssetsSettingsVisible(true);
                  }}
                >
                  <Text style={styles.emptyAssetsButtonText}>Ayarları Aç</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bildirimler Modal */}
      <Modal
        visible={notificationsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setNotificationsVisible(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Bildirimler & Onaylar</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {pendingConfirmations.length > 0 ? (
              pendingConfirmations.map((notification) => (
                <View key={notification.id} style={styles.modalNotificationItem}>
                  <View style={styles.modalNotificationHeader}>
                    <View style={styles.modalNotificationIcon}>
                      <MaterialIcons 
                        name={notification.type === 'salary_confirmation' ? 'account-balance' : 'receipt'} 
                        size={24} 
                        color={notification.type === 'salary_confirmation' ? '#48BB78' : '#F56565'} 
                      />
                    </View>
                    <View style={styles.modalNotificationInfo}>
                      <Text style={styles.modalNotificationTitle}>{notification.title}</Text>
                      <Text style={styles.modalNotificationTime}>
                        {new Date(notification.created_at).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.modalNotificationMessage}>{notification.message}</Text>
                  
                  <View style={styles.modalNotificationActions}>
                    <TouchableOpacity 
                      style={[styles.modalNotificationButton, styles.modalConfirmButton]}
                      onPress={() => {
                        handleConfirmation(notification.id, notification.type, true);
                        setNotificationsVisible(false);
                      }}
                    >
                      <Text style={styles.modalConfirmButtonText}>Onayla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalNotificationButton, styles.modalRejectButton]}
                      onPress={() => {
                        handleConfirmation(notification.id, notification.type, false);
                        setNotificationsVisible(false);
                      }}
                    >
                      <Text style={styles.modalRejectButtonText}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.modalNoNotificationsContainer}>
                <MaterialIcons name="notifications-none" size={64} color={theme.colors.textSecondary} />
                <Text style={styles.modalNoNotificationsTitle}>Bekleyen Onay Yok</Text>
                <Text style={styles.modalNoNotificationsSubtitle}>
                  Tüm sabit işlemleriniz otomatik olarak işleniyor veya zaten onaylandı
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl, // lg'den xl'e çıkar - kartlar için daha fazla alan
  },

  greeting: {
    flex: 1,
  },

  greetingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },

  userName: {
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginTop: 4,
  },

  notificationButton: {
    position: 'relative',
    padding: theme.spacing.sm,
  },

  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },

  balanceCard: {
    marginHorizontal: 0,
    marginTop: theme.spacing.md, // Üst margin ekle - header'dan uzaklaştır
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minHeight: 240,
    height: 240,
    justifyContent: 'space-between',
    overflow: 'visible',
  },

  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı
  },

  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    flex: 1, // Flex ekle
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı
  },

  balanceAmount: {
    fontSize: 30, // 32'den 30'a düşür - daha iyi sığması için
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: theme.spacing.md,
    letterSpacing: -1,
    // overflow: 'hidden' kaldırıldı
    textAlign: 'center', // Merkeze hizala
  },

  balanceSubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı
  },

  balanceItem: {
    flex: 1,
  },

  balanceSubLabel: {
    fontSize: 12, // 11'den 12'ye çıkar - daha okunabilir
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 4,
    // overflow: 'hidden' kaldırıldı
    flexWrap: 'wrap', // Wrap ekle
  },

  balanceSubAmount: {
    fontSize: 15, // 14'ten 15'e çıkar - daha okunabilir
    fontWeight: '700',
    // overflow: 'hidden' kaldırıldı
    flexWrap: 'wrap', // Wrap ekle
  },

  section: {
    marginBottom: theme.layout.sectionSpacing,
    marginTop: theme.spacing.lg, // Üst margin ekle
    paddingHorizontal: theme.spacing.lg, // Yatay padding ekle
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md, // Üst margin ekle
    // paddingHorizontal kaldırıldı - section'ta zaten var
  },

  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    flex: 1, // Başlığa flex: 1 ekle
    marginRight: theme.spacing.md, // Sağ margin ekle
    // overflow: 'hidden' kaldırıldı
  },

  seeAllButton: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    paddingHorizontal: theme.spacing.sm, // Yatay padding ekle
    paddingVertical: theme.spacing.xs, // Dikey padding ekle
    // overflow: 'hidden' kaldırıldı
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md, // Üst margin ekle
    marginBottom: theme.spacing.md, // Alt margin ekle
    // paddingHorizontal kaldırıldı - section'ta zaten var
  },

  quickActionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },

  quickActionGradient: {
    width: theme.screen.isSmall ? 48 : theme.screen.isMedium ? 52 : 56,
    height: theme.screen.isSmall ? 48 : theme.screen.isMedium ? 52 : 56,
    borderRadius: theme.screen.isSmall ? 24 : theme.screen.isMedium ? 26 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.medium,
  },

  quickActionLabel: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },

  transactionsList: {
    marginTop: theme.spacing.md, // Üst margin ekle
    marginBottom: theme.spacing.md, // Alt margin ekle
    // paddingHorizontal kaldırıldı - section'ta zaten var
  },

  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.screen.isSmall ? theme.spacing.sm : theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },

  transactionIcon: {
    width: theme.screen.isSmall ? 40 : theme.screen.isMedium ? 44 : 48,
    height: theme.screen.isSmall ? 40 : theme.screen.isMedium ? 44 : 48,
    borderRadius: theme.screen.isSmall ? 20 : theme.screen.isMedium ? 22 : 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  transactionDetails: {
    flex: 1,
  },

  transactionTitle: {
    fontSize: theme.typography.bodyLarge.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },

  transactionCategory: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },

  transactionDate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },

  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.md, // Üst margin ekle
    marginBottom: theme.spacing.md, // Alt margin ekle
    justifyContent: 'space-between',
    // paddingHorizontal kaldırıldı - section'ta zaten var
  },

  overviewCard: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.sm) / 2,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },

  overviewTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  overviewAmount: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },

  goalCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    // marginHorizontal kaldırıldı - section'ta zaten var
  },

  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  goalTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  goalProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },

  goalProgressFill: {
    height: 8,
    borderRadius: 4,
  },

  goalProgressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },

  goalAmount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: theme.spacing.xs,
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  budgetTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  budgetAmount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: theme.spacing.lg,
    left: 0,
    top: 0,
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 2,
  },
  fabMenuItem: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  fabMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  fabMenuLabelContainer: {
    backgroundColor: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.sm,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  fabMenuLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  fabMenuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fab: {
    elevation: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 3,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabBackdrop: {
    position: 'absolute',
    top: -height,
    left: -width,
    width: width * 2,
    height: height * 2,
    backgroundColor: 'transparent',
    zIndex: 1,
  },

  goldCurrencyScroll: {
    paddingLeft: theme.spacing.lg,
  },

  goldCard: {
    width: 150,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  goldCardTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  goldCardAmount: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  goldCardSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  currencyCard: {
    width: 120,
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  currencyCode: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginLeft: theme.spacing.xs,
  },

  currencyRate: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },

  currencyChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  currencyChangeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },

  bottomPadding: {
    height: 100,
  },

  balanceSettingsButton: {
    marginRight: theme.spacing.sm,
    padding: theme.spacing.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)'
  },

  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  settingsSection: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsSectionTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  topCardsContainer: {
    paddingTop: theme.spacing.lg, // Üst padding ekle - header'dan uzaklaştır
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.screen.isSmall ? theme.spacing.md : theme.screen.isMedium ? theme.spacing.lg : theme.spacing.xl,
    overflow: 'visible',
  },
  topCard: {
    marginRight: CARD_SPACING,
    // Her iki kartın da aynı boyutta olması için
    height: 240, // 220'den 240'a çıkar
    minHeight: 240, // 220'den 240'a çıkar
  },
  assetsCard: {
    backgroundColor: 'transparent',
    // Varlıklar kartının da aynı boyutta olması için
    height: 240, // 220'den 240'a çıkar
    minHeight: 240, // 220'den 240'a çıkar
  },
  assetsSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  assetsBreakdownContainer: {
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  assetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  assetChipIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  assetChipLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
  assetChipAmount: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: theme.spacing.md,
  },
  recurringContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.borderRadius.md,
    padding: theme.screen.isSmall ? theme.spacing.md : theme.spacing.lg,
    marginTop: theme.spacing.md, // Üst margin ekle
    marginBottom: theme.spacing.md,
    // marginHorizontal kaldırıldı - section'ta zaten var
    ...theme.shadows.medium,
  },
  recurringSection: {
    marginBottom: theme.spacing.md,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı
  },
  recurringHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Sol tarafa flex: 1 ekle
    // overflow: 'hidden' kaldırıldı
  },
  recurringHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  recurringSectionTitle: {
    fontSize: 16,
    color: '#1A202C', // Daha koyu ve belirgin renk
    fontWeight: '600',
    flex: 1, // Başlığa flex: 1 ekle
    marginLeft: theme.spacing.sm,
    // overflow: 'hidden' kaldırıldı
  },
  recurringSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  recurringTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C', // Daha koyu ve belirgin renk
    textAlign: 'right', // Sağa hizala
    minWidth: 80, // Minimum genişlik ekle
    // overflow: 'hidden' kaldırıldı
  },
  recurringItems: {
    marginLeft: theme.spacing.sm,
  },
  recurringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı - yazının görünmesini engelleyebilir
  },
  recurringItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Flex ekle
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı - yazının görünmesini engelleyebilir
  },
  recurringItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  recurringItemInfo: {
    flex: 1,
  },
  recurringItemLabel: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  recurringItemCategory: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  recurringItemRight: {
    alignItems: 'flex-end',
    flex: 0, // Flex 0 yap - sabit genişlik
    minWidth: 80, // Minimum genişlik ekle
    overflow: 'hidden', // Taşan içeriği gizle
  },
  recurringItemAmount: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right', // Sağa hizala
    overflow: 'hidden', // Taşan içeriği gizle
    flexWrap: 'wrap', // Wrap ekle
  },
  recurringItemAccount: {
    fontSize: 10,
    color: '#4A5568', // Daha belirgin renk
    marginTop: 2,
    textAlign: 'right', // Sağa hizala
    overflow: 'hidden', // Taşan içeriği gizle
    flexWrap: 'wrap', // Wrap ekle
  },
  recurringItemFrequency: {
    fontSize: 10,
    color: '#4A5568', // Daha belirgin renk
    marginTop: 2,
    overflow: 'hidden', // Taşan içeriği gizle
    flexWrap: 'wrap', // Wrap ekle
  },
  netStatusContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    // overflow: 'hidden' kaldırıldı - gölge efekti korunuyor
  },
  netStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    justifyContent: 'center', // Merkeze hizala
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı
  },
  netStatusLabel: {
    fontSize: 14,
    color: '#1A202C', // Daha koyu ve belirgin renk
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
    textAlign: 'center', // Merkeze hizala
    // overflow: 'hidden' kaldırıldı
  },
  netStatusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C', // Daha koyu ve belirgin renk
    textAlign: 'center',
    marginVertical: theme.spacing.xs,
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı
  },
  netStatusDescription: {
    fontSize: 12,
    color: '#4A5568', // Daha belirgin renk
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: theme.spacing.sm, // Yatay padding ekle
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },

  // Budget Card Styles
  budgetCard: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm, // Üst margin ekle
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  budgetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  budgetInfo: {
    flex: 1,
  },

  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },

  budgetAmount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  budgetStatus: {
    alignItems: 'flex-end',
  },

  budgetPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },

  budgetProgressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },

  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  budgetRemaining: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  overBudgetText: {
    fontSize: 14,
    color: '#F56565',
    fontWeight: '500',
  },
  recurringItemName: {
    fontSize: 13,
    color: '#1A202C', // Daha koyu ve belirgin renk
    fontWeight: '600',
    marginBottom: 2,
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı - yazının görünmesini engelleyebilir
  },
  recurringEmptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md, // Üst margin ekle
    marginBottom: theme.spacing.md, // Alt margin ekle
    // marginHorizontal kaldırıldı - section'ta zaten var
  },
  recurringEmptyIcon: {
    marginBottom: theme.spacing.md,
    opacity: 0.6,
  },
  recurringEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C', // Daha koyu ve belirgin renk
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  recurringEmptySubtitle: {
    fontSize: 14,
    color: '#4A5568', // Daha belirgin renk
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  recurringEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recurringEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },

  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    padding: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: theme.spacing.sm,
  },
  
  // Professional service styles
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  healthIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  
  // New styles for improved card centering
  topCardsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: '100%',
  },
  
  cardWrapper: {
    marginRight: CARD_SPACING,
    marginTop: theme.spacing.sm, // Üst margin ekle
    alignItems: 'center',
    justifyContent: 'center',
    width: CARD_WIDTH,
    height: 240,
    overflow: 'visible',
  },

  // Varlık Detayları Modal Stilleri
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  assetDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  assetDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  assetDetailInfo: {
    flex: 1,
  },
  assetDetailLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  assetDetailDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  assetDetailAmount: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginLeft: theme.spacing.md,
  },
  emptyAssetsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyAssetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyAssetsSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  emptyAssetsButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  emptyAssetsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  assetsBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetsBreakdownTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  recurringItemDetails: {
    flex: 1,
    flexWrap: 'wrap', // Wrap ekle
    // overflow: 'hidden' kaldırıldı - yazının görünmesini engelleyebilir
  },

  // Bildirim Sistemi Stilleri
  notificationsContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#4A5568',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
    color: '#718096',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  notificationButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
  },
  confirmButton: {
    backgroundColor: '#48BB78',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  rejectButton: {
    backgroundColor: '#F56565',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  showMoreButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  showMoreButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  noNotificationsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  noNotificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  noNotificationsSubtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 20,
  },

  // Modal Bildirim Stilleri
  modalNotificationItem: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modalNotificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalNotificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  modalNotificationInfo: {
    flex: 1,
  },
  modalNotificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  modalNotificationTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  modalNotificationMessage: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  modalNotificationActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalNotificationButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalConfirmButton: {
    backgroundColor: '#48BB78',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalRejectButton: {
    backgroundColor: '#F56565',
  },
  modalRejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalNoNotificationsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  modalNoNotificationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalNoNotificationsSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreen;