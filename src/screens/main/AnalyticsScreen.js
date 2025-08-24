// FinanceFlow - Analytics Screen
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/formatters';
import analyticsService from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  
  // Analytics data states
  const [financialSummary, setFinancialSummary] = useState({
    income: 0,
    expenses: 0,
    net: 0,
    savingsRate: 0
  });
  const [topExpenseCategories, setTopExpenseCategories] = useState([]);
  const [topIncomeCategories, setTopIncomeCategories] = useState([]);
  const [insights, setInsights] = useState([]);

  // Real-time update handler
  const handleRealTimeUpdate = useCallback((payload) => {
    console.log('Real-time update received:', payload);
    
    // Show notification to user
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
      // Refresh data after a short delay to allow database to settle
      setTimeout(() => {
        loadAnalyticsData(selectedPeriod, true); // Force refresh
      }, 1000);
    }
  }, [selectedPeriod]);

  // Load analytics data
  const loadAnalyticsData = async (period = selectedPeriod, forceRefresh = false) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [summaryResult, expensesResult, incomeResult, insightsResult] = await Promise.all([
        analyticsService.getFinancialSummary(user.id, period, forceRefresh),
        analyticsService.getCategoryAnalysis(user.id, period, 'expense', forceRefresh),
        analyticsService.getCategoryAnalysis(user.id, period, 'income', forceRefresh),
        analyticsService.getInsights(user.id, period, forceRefresh)
      ]);

      if (summaryResult.success) {
        setFinancialSummary(summaryResult.data);
      }
      
      if (expensesResult.success) {
        setTopExpenseCategories(expensesResult.data);
      }
      
      if (incomeResult.success) {
        setTopIncomeCategories(incomeResult.data);
      }
      
      if (insightsResult.success) {
        setInsights(insightsResult.data);
      }

      // Check for errors
      const errors = [summaryResult, expensesResult, incomeResult, insightsResult]
        .filter(result => !result.success)
        .map(result => result.error);

      if (errors.length > 0) {
        setError(errors[0]);
      }

      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Load analytics data error:', error);
      setError('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData(selectedPeriod, true); // Force refresh
    setRefreshing(false);
  };

  // Period change handler
  const handlePeriodChange = async (period) => {
    setSelectedPeriod(period);
    await loadAnalyticsData(period);
  };

  // Toggle real-time updates
  const toggleRealTime = () => {
    if (isRealTimeEnabled) {
      analyticsService.cleanupSubscription(user?.id);
      setIsRealTimeEnabled(false);
      Alert.alert('Real-time Güncellemeler', 'Real-time güncellemeler devre dışı bırakıldı');
    } else {
      if (user?.id) {
        analyticsService.setupRealTimeSubscription(user.id, handleRealTimeUpdate);
        setIsRealTimeEnabled(true);
        Alert.alert('Real-time Güncellemeler', 'Real-time güncellemeler etkinleştirildi');
      }
    }
  };

  // Force refresh all data
  const forceRefreshAll = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.forceRefreshAll(user?.id);
      
      if (result.success) {
        setFinancialSummary(result.data.summary);
        setTopExpenseCategories(result.data.topExpenses);
        setTopIncomeCategories(result.data.topIncome);
        setInsights(result.data.insights);
        setLastUpdated(new Date());
        setError(null);
        Alert.alert('Başarılı', 'Tüm veriler yenilendi');
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Force refresh error:', error);
      setError('Veri yenileme hatası');
    } finally {
      setLoading(false);
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      const result = await analyticsService.clearCache();
      if (result.success) {
        Alert.alert('Cache Temizlendi', 'Analytics cache başarıyla temizlendi');
        // Reload data after clearing cache
        await loadAnalyticsData(selectedPeriod, true);
      } else {
        Alert.alert('Hata', result.error);
      }
    } catch (error) {
      console.error('Clear cache error:', error);
      Alert.alert('Hata', 'Cache temizlenirken hata oluştu');
    }
  };

  // Load data on mount and user change
  useEffect(() => {
    if (user?.id) {
      loadAnalyticsData();
      
      // Setup real-time subscription
      if (isRealTimeEnabled) {
        analyticsService.setupRealTimeSubscription(user.id, handleRealTimeUpdate);
      }
    }

    // Cleanup on unmount
    return () => {
      if (user?.id) {
        analyticsService.cleanupSubscription(user.id);
      }
    };
  }, [user?.id, isRealTimeEnabled]);

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
        onPress={() => handlePeriodChange('week')}
      >
        <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
          Hafta
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
        onPress={() => handlePeriodChange('month')}
      >
        <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
          Ay
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
        onPress={() => handlePeriodChange('year')}
      >
        <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.periodButtonTextActive]}>
          Yıl
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Analiz & Raporlar</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={toggleRealTime} style={styles.headerButton}>
          <MaterialIcons 
            name={isRealTimeEnabled ? "sync" : "sync-disabled"} 
            size={20} 
            color={isRealTimeEnabled ? theme.colors.success : theme.colors.textSecondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={forceRefreshAll} style={styles.headerButton}>
          <MaterialIcons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={clearCache} style={styles.headerButton}>
          <MaterialIcons name="clear" size={20} color={theme.colors.warning} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLastUpdated = () => (
    lastUpdated && (
      <View style={styles.lastUpdatedContainer}>
        <MaterialIcons name="access-time" size={16} color={theme.colors.textSecondary} />
        <Text style={styles.lastUpdatedText}>
          Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
        </Text>
        {isRealTimeEnabled && (
          <View style={styles.realTimeIndicator}>
            <View style={styles.realTimeDot} />
            <Text style={styles.realTimeText}>Canlı</Text>
          </View>
        )}
      </View>
    )
  );

  const renderFinancialSummary = () => (
    <View style={styles.financialSummary}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryTitle}>Finansal Özet</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <MaterialIcons name="trending-up" size={24} color="#48BB78" />
            <Text style={styles.summaryLabel}>Gelir</Text>
            <Text style={styles.summaryValue}>{formatCurrency(financialSummary.income)}</Text>
          </View>
          <View style={styles.summaryStat}>
            <MaterialIcons name="trending-down" size={24} color="#F56565" />
            <Text style={styles.summaryLabel}>Gider</Text>
            <Text style={styles.summaryValue}>{formatCurrency(financialSummary.expenses)}</Text>
          </View>
          <View style={styles.summaryStat}>
            <MaterialIcons name="account-balance" size={24} color="#4ECDC4" />
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[
              styles.summaryValue,
              { color: financialSummary.net >= 0 ? '#48BB78' : '#F56565' }
            ]}>
              {formatCurrency(financialSummary.net)}
            </Text>
          </View>
        </View>
        {financialSummary.savingsRate > 0 && (
          <View style={styles.savingsRateContainer}>
            <Text style={styles.savingsRateLabel}>Tasarruf Oranı</Text>
            <Text style={styles.savingsRateValue}>%{financialSummary.savingsRate.toFixed(1)}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderCategoryChart = (title, categories, type) => (
    <View style={styles.chartSection}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartContainer}>
        {categories.length === 0 ? (
          <View style={styles.emptyChart}>
            <MaterialIcons name="bar-chart" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyChartText}>Bu dönemde veri bulunamadı</Text>
          </View>
        ) : (
          categories.map((item, index) => {
            const maxAmount = Math.max(...categories.map(c => c.amount));
            const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
            const colors = type === 'income' ? ['#48BB78', '#38A169'] : ['#F56565', '#E53E3E'];

            return (
              <View key={index} style={styles.chartItem}>
                <View style={styles.chartItemHeader}>
                  <View style={styles.chartItemInfo}>
                    {item.icon && (
                      <MaterialIcons 
                        name={item.icon} 
                        size={16} 
                        color={item.color || theme.colors.primary} 
                        style={styles.categoryIcon}
                      />
                    )}
                    <Text style={styles.chartItemLabel}>{item.name}</Text>
                  </View>
                  <Text style={styles.chartItemAmount}>{formatCurrency(item.amount)}</Text>
                </View>
                <View style={styles.chartBar}>
                  <LinearGradient
                    colors={colors}
                    style={[styles.chartBarFill, { width: `${percentage}%` }]}
                  />
                </View>
                <Text style={styles.chartPercentage}>%{percentage.toFixed(1)}</Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );

  const renderInsights = () => (
    <View style={styles.insightsSection}>
      <Text style={styles.insightsTitle}>Akıllı Öneriler</Text>
      
      {insights.length === 0 ? (
        <View style={styles.emptyInsights}>
          <MaterialIcons name="lightbulb" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyInsightsText}>Henüz öneri bulunmuyor</Text>
        </View>
      ) : (
        insights.map((insight, index) => (
          <View key={index} style={[
            styles.insightCard,
            { borderLeftColor: getInsightColor(insight.type) }
          ]}>
            <MaterialIcons 
              name={insight.icon} 
              size={24} 
              color={getInsightColor(insight.type)} 
            />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightText}>{insight.message}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return '#48BB78';
      case 'warning': return '#ED8936';
      case 'danger': return '#F56565';
      default: return theme.colors.primary;
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Analiz verileri yükleniyor...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error" size={48} color={theme.colors.error} />
      <Text style={styles.errorTitle}>Hata Oluştu</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadAnalyticsData(selectedPeriod, true)}>
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return renderLoadingState();
  }

  if (error && !refreshing) {
    return renderErrorState();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        {renderHeader()}

        {/* Last Updated Info */}
        {renderLastUpdated()}

        {/* Period Selector */}
        {renderPeriodSelector()}

        {/* Financial Summary */}
        {renderFinancialSummary()}

        {/* Expense Categories Chart */}
        {renderCategoryChart('En Yüksek Gider Kategorileri', topExpenseCategories, 'expense')}

        {/* Income Categories Chart */}
        {renderCategoryChart('En Yüksek Gelir Kategorileri', topIncomeCategories, 'income')}

        {/* Insights */}
        {renderInsights()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerButton: {
    marginLeft: theme.spacing.md,
  },

  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  lastUpdatedText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },

  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },

  realTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: theme.spacing.xs,
  },

  realTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.success,
  },

  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },

  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },

  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },

  periodButtonTextActive: {
    color: '#FFFFFF',
  },

  financialSummary: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  summaryCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },

  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  savingsRateContainer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },

  savingsRateLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: theme.spacing.xs,
  },

  savingsRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  chartSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },

  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  chartItem: {
    marginBottom: theme.spacing.md,
  },

  chartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },

  chartItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryIcon: {
    marginRight: theme.spacing.xs,
  },

  chartItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    flex: 1,
  },

  chartItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  chartBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
  },

  chartBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  chartPercentage: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },

  emptyChart: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },

  emptyChartText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  insightsSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },

  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },

  insightContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },

  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },

  insightText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  emptyInsights: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },

  emptyInsightsText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },

  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },

  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },

  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomPadding: {
    height: 100,
  },
});

export default AnalyticsScreen;