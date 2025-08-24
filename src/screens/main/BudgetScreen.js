// FinanceFlow - Budget Screen
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { testUser } from '../../utils/testData';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';

const { width } = Dimensions.get('window');

const BudgetScreen = ({ navigation }) => {
  const [selectedMonth, setSelectedMonth] = useState('Ocak 2024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTotalBudget = () => {
    if (!testUser || !testUser.budgets) return 0;
    return testUser.budgets.reduce((total, budget) => total + budget.amount, 0);
  };

  const getTotalSpent = () => {
    if (!testUser || !testUser.budgets) return 0;
    return testUser.budgets.reduce((total, budget) => total + budget.spent, 0);
  };

  const getRemainingBudget = () => {
    return getTotalBudget() - getTotalSpent();
  };

  const getBudgetProgress = (spent, amount) => {
    return Math.min((spent / amount) * 100, 100);
  };

  const renderBudgetCard = (budget) => {
    const progress = getBudgetProgress(budget.spent, budget.amount);
    const isOverBudget = budget.spent > budget.amount;
    
    const toggleShowOnHome = () => {
      budget.showOnHome = !budget.showOnHome;
      // Force re-render
      setSelectedMonth(selectedMonth);
    };
    
    return (
      <View key={budget.id} style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetIcon}>
            <MaterialIcons name={budget.icon} size={24} color={budget.color} />
          </View>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetCategory}>{budget.category}</Text>
            <Text style={styles.budgetAmount}>
              {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
            </Text>
          </View>
          <View style={styles.budgetStatus}>
            <View style={styles.budgetStatusTop}>
              <TouchableOpacity 
                style={styles.showOnHomeButton}
                onPress={toggleShowOnHome}
              >
                <MaterialIcons 
                  name={budget.showOnHome ? 'visibility' : 'visibility-off'} 
                  size={20} 
                  color={budget.showOnHome ? '#48BB78' : '#718096'} 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.budgetStatusBottom}>
              <Text style={[
                styles.budgetPercentage, 
                { color: isOverBudget ? '#F56565' : '#48BB78' }
              ]}>
                {progress.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { 
              width: `${progress}%`,
              backgroundColor: isOverBudget ? '#F56565' : budget.color
            }
          ]} />
        </View>
        
        <View style={styles.budgetFooter}>
          <Text style={styles.budgetRemaining}>
            Kalan: {formatCurrency(budget.amount - budget.spent)}
          </Text>
          <Text style={styles.showOnHomeText}>
            {budget.showOnHome ? 'Anasayfada Gösteriliyor' : 'Anasayfada Gizli'}
          </Text>
          {isOverBudget && (
            <Text style={styles.overBudgetText}>
              Bütçe aşıldı! +{formatCurrency(budget.spent - budget.amount)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderGoalCard = (goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    
    const toggleShowOnHome = () => {
      goal.showOnHome = !goal.showOnHome;
      // Force re-render
      setSelectedMonth(selectedMonth);
    };
    
    return (
      <View key={goal.id} style={styles.goalCard}>
        <LinearGradient
          colors={[goal.color, `${goal.color}80`]}
          style={styles.goalGradient}
        >
          <View style={styles.goalHeader}>
            <MaterialIcons name={goal.icon} size={32} color="#fff" />
            <Text style={styles.goalTitle}>{goal.name}</Text>
            <TouchableOpacity 
              style={styles.showOnHomeButton}
              onPress={toggleShowOnHome}
            >
              <MaterialIcons 
                name={goal.showOnHome ? 'visibility' : 'visibility-off'} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.goalAmount}>
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </Text>
          
          <View style={styles.goalProgress}>
            <View style={styles.goalProgressBar}>
              <View style={[styles.goalProgressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.goalPercentage}>{progress.toFixed(1)}%</Text>
          </View>
          
          <Text style={styles.goalDeadline}>
            Hedef Tarih: {goal.deadline}
          </Text>
          
          <View style={styles.goalFooter}>
            <Text style={styles.showOnHomeText}>
              {goal.showOnHome ? 'Anasayfada Gösteriliyor' : 'Anasayfada Gizli'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bütçe & Hedefler</Text>
          <TouchableOpacity>
            <MaterialIcons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Budget Overview */}
        <View style={styles.budgetOverview}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.overviewCard}
          >
            <Text style={styles.overviewTitle}>Aylık Bütçe Özeti</Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewLabel}>Toplam Bütçe</Text>
                <Text style={styles.overviewValue}>{formatCurrency(getTotalBudget())}</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewLabel}>Harcanan</Text>
                <Text style={styles.overviewValue}>{formatCurrency(getTotalSpent())}</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewLabel}>Kalan</Text>
                <Text style={[
                  styles.overviewValue,
                  { color: getRemainingBudget() < 0 ? '#F56565' : '#48BB78' }
                ]}>
                  {formatCurrency(getRemainingBudget())}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Bütçe verileri yükleniyor...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Hata Oluştu</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setError(null);
              // TODO: Implement retry logic
            }}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Budget Categories */}
        {!loading && !error && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bütçe Kategorileri</Text>
            {testUser.budgets && testUser.budgets.length > 0 ? (
              testUser.budgets.map(renderBudgetCard)
            ) : (
              <EmptyState
                type="budgets"
                onAction={() => navigation.navigate('Transactions')}
                size="medium"
              />
            )}
          </View>
        )}

        {/* Financial Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finansal Hedefler</Text>
          {testUser.goals && testUser.goals.length > 0 ? (
            <View style={styles.goalsGrid}>
              {testUser.goals.map(renderGoalCard)}
            </View>
          ) : (
            <EmptyState
              type="goals"
              onAction={() => navigation.navigate('Transactions')}
              size="medium"
            />
          )}
        </View>

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

  budgetOverview: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  overviewCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  overviewStat: {
    alignItems: 'center',
    flex: 1,
  },

  overviewLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: theme.spacing.xs,
  },

  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  section: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },

  budgetCard: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
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
    justifyContent: 'space-between',
    height: 60,
  },

  budgetStatusTop: {
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },

  budgetStatusBottom: {
    alignItems: 'center',
  },

  budgetPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },

  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },

  progressFill: {
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

  showOnHomeButton: {
    padding: theme.spacing.xs,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  showOnHomeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },

  goalCard: {
    width: (width - theme.spacing.lg * 3) / 2,
    borderRadius: theme.borderRadius.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
  },

  goalGradient: {
    padding: theme.spacing.lg,
    minHeight: 160,
  },

  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: theme.spacing.sm,
    flex: 1,
  },

  goalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: theme.spacing.md,
  },

  goalProgress: {
    marginBottom: theme.spacing.md,
  },

  goalProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },

  goalProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },

  goalPercentage: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'right',
  },

  goalDeadline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  showOnHomeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goalFooter: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },

  showOnHomeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  bottomPadding: {
    height: 100,
  },

  // Loading and error styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default BudgetScreen;