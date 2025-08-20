// FinanceFlow - Home Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, RefreshControl, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import CustomCard from '../../components/ui/CustomCard';
import { testUser } from '../../utils/testData';
import { goldCurrencyData, goldCurrencyFunctions } from '../../utils/goldCurrencyData';
import { formatCurrency } from '../../utils/formatters';
import DetailedAddTransactionModal from '../modals/DetailedAddTransactionModal';
import ReceiptScannerModal from '../modals/ReceiptScannerModal';

const { width, height } = Dimensions.get('window');
const TOP_CARD_WIDTH = width - theme.spacing.lg * 2;
const TOP_CARD_GAP = theme.spacing.md;
const SIDE_INSET = (width - TOP_CARD_WIDTH) / 2;

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [addTransactionVisible, setAddTransactionVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [receiptScannerVisible, setReceiptScannerVisible] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [balanceSettingsVisible, setBalanceSettingsVisible] = useState(false);
  const [includeCashAccounts, setIncludeCashAccounts] = useState(true);
  const [includeSavings, setIncludeSavings] = useState(true);
  const [includeCreditAvailable, setIncludeCreditAvailable] = useState(false);
  const [includeGoldCurrency, setIncludeGoldCurrency] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const topScrollRef = useRef(null);

  const getCashAccountsTotal = () => testUser.accounts
    .filter(a => a.type === 'debit' || a.type === 'checking')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const getSavingsTotal = () => testUser.accounts
    .filter(a => a.type === 'savings')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const getCreditAvailableTotal = () => testUser.accounts
    .filter(a => a.type === 'credit' && typeof a.availableCredit === 'number')
    .reduce((sum, a) => sum + a.availableCredit, 0);

  const getGoldCurrencyTotalTRY = () => goldCurrencyFunctions.getTotalGoldValue();

  useEffect(() => {
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
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };



  const getTotalBalance = () => {
    let total = 0;
    if (includeCashAccounts) total += getCashAccountsTotal();
    if (includeSavings) total += getSavingsTotal();
    if (includeCreditAvailable) total += getCreditAvailableTotal();
    if (includeGoldCurrency) total += getGoldCurrencyTotalTRY();
    return total;
  };

  const getRecentTransactions = () => {
    return testUser.transactions.slice(0, 3);
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
      <View style={styles.fabContainer}>
        {/* FAB Menu Items */}
        {fabMenuVisible && (
          <View style={styles.fabMenuContainer}>
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
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.fabMenuButton}
                  onPress={item.onPress}
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

        {/* Main FAB */}
        <TouchableOpacity 
          style={styles.fab}
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

        {/* Backdrop */}
        {fabMenuVisible && (
          <TouchableOpacity
            style={styles.fabBackdrop}
            onPress={() => setFabMenuVisible(false)}
            activeOpacity={1}
          />
        )}
      </View>
    );
  };

  const getMonthlyStats = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const monthlyTransactions = testUser.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === thisMonth && transactionDate.getFullYear() === thisYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { income, expenses };
  };

  const monthlyStats = getMonthlyStats();
  const totalBalance = getTotalBalance();
  const recentTransactions = getRecentTransactions();

  const getCategoryIcon = (categoryId) => {
    const allCategories = [...testUser.categories.income, ...testUser.categories.expense];
    const category = allCategories.find(cat => cat.id === categoryId);
    return category ? category.icon : 'category';
  };

  const getCategoryName = (categoryId) => {
    const allCategories = [...testUser.categories.income, ...testUser.categories.expense];
    const category = allCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Kategori';
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
            <Text style={styles.greetingText}>Merhaba,</Text>
            <Text style={styles.userName}>{testUser.user.firstName} {testUser.user.lastName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications-none" size={24} color={theme.colors.textPrimary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Top Cards (Balance + Assets) */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={topScrollRef}
            snapToInterval={TOP_CARD_WIDTH + TOP_CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={[styles.topCardsContainer, { paddingVertical: theme.spacing.sm }]}
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const index = Math.round(x / (TOP_CARD_WIDTH + TOP_CARD_GAP));
              topScrollRef.current?.scrollTo({ x: index * (TOP_CARD_WIDTH + TOP_CARD_GAP), animated: true });
            }}
            onScrollEndDrag={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const index = Math.round(x / (TOP_CARD_WIDTH + TOP_CARD_GAP));
              topScrollRef.current?.scrollTo({ x: index * (TOP_CARD_WIDTH + TOP_CARD_GAP), animated: true });
            }}
          >
            {/* Toplam Bakiye */}
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={[styles.balanceCard, styles.topCard, { width: TOP_CARD_WIDTH }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Toplam Bakiye</Text>
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

            {/* Varlıklarım */}
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.primary]}
              style={[styles.balanceCard, styles.assetsCard, styles.topCard, { width: TOP_CARD_WIDTH }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Varlıklarım</Text>
                <MaterialIcons name="account-balance" size={20} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.balanceAmount}>
                {formatCurrency(getCashAccountsTotal() + getSavingsTotal() + getGoldCurrencyTotalTRY())}
              </Text>
              <Text style={styles.assetsSubtitle}>Nakit, Tasarruf ve Altın/Döviz</Text>
            </LinearGradient>
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
            {recentTransactions.map((transaction, index) => (
              <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <MaterialIcons 
                    name={getCategoryIcon(transaction.categoryId)} 
                    size={24} 
                    color={transaction.type === 'income' ? '#48BB78' : '#F56565'} 
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>{getCategoryName(transaction.categoryId)}</Text>
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
            ))}
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
              <Text style={styles.overviewAmount}>{testUser.accounts.length}</Text>
            </CustomCard>
            
            <CustomCard style={styles.overviewCard}>
              <MaterialIcons name="receipt" size={32} color="#4ECDC4" />
              <Text style={styles.overviewTitle}>İşlem Sayısı</Text>
              <Text style={styles.overviewAmount}>{testUser.transactions.length}</Text>
            </CustomCard>
            
            <CustomCard style={styles.overviewCard}>
              <MaterialIcons name="flag" size={32} color="#FFE66D" />
              <Text style={styles.overviewTitle}>Aktif Hedef</Text>
              <Text style={styles.overviewAmount}>{testUser.goals.length}</Text>
            </CustomCard>
          </View>
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
          {testUser.goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <CustomCard key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <MaterialIcons name={goal.icon} size={24} color={goal.color} />
                  <Text style={styles.goalTitle}>{goal.name}</Text>
                </View>
                <View style={styles.goalProgress}>
                  <View style={styles.goalProgressBar}>
                    <View style={[styles.goalProgressFill, { width: `${progress}%`, backgroundColor: goal.color }]} />
                  </View>
                  <Text style={styles.goalProgressText}>{Math.round(progress)}%</Text>
                </View>
                <Text style={styles.goalAmount}>
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </Text>
              </CustomCard>
            );
          })}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      {/* FAB Menu */}
      {renderFABMenu()}

      {/* Modals */}
      <DetailedAddTransactionModal
        visible={addTransactionVisible}
        onClose={() => setAddTransactionVisible(false)}
        type={transactionType}
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
            <Text style={styles.settingsLabel}>Vadesiz/Nakit Hesaplar</Text>
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
    paddingBottom: theme.spacing.lg,
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
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  balanceAmount: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: theme.spacing.lg,
    letterSpacing: -1,
  },

  balanceSubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  balanceItem: {
    flex: 1,
  },

  balanceSubLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },

  balanceSubAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  section: {
    marginBottom: theme.spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  seeAllButton: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
  },

  quickActionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },

  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  quickActionLabel: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },

  transactionsList: {
    paddingHorizontal: theme.spacing.lg,
  },

  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  transactionDetails: {
    flex: 1,
  },

  transactionTitle: {
    fontSize: 16,
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
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
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
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
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
  },

  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: theme.spacing.lg,
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  topCardsContainer: {
    paddingVertical: theme.spacing.sm,
  },
  topCard: {
    marginRight: TOP_CARD_GAP,
  },
  assetsCard: {
    backgroundColor: 'transparent',
  },
  assetsSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;