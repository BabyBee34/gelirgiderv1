// FinanceFlow - Budget & Goals Screen
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { testUser } from '../../utils/testData';
import { formatCurrency } from '../../utils/formatters';
import AddGoalModal from '../modals/AddGoalModal';

const { width } = Dimensions.get('window');

const BudgetScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('goals'); // goals, budgets, insights
  const [refreshing, setRefreshing] = useState(false);
  const [addGoalVisible, setAddGoalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setAddGoalVisible(true);
  };

  const handleDeleteGoal = (goalId) => {
    Alert.alert(
      'Hedefi Sil',
      'Bu hedefi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => {
            const index = testUser.goals.findIndex(g => g.id === goalId);
            if (index > -1) {
              testUser.goals.splice(index, 1);
              Alert.alert('Başarılı', 'Hedef silindi.');
            }
          }
        }
      ]
    );
  };

  const renderTabButton = (tab, label, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <MaterialIcons 
        name={icon} 
        size={20} 
        color={selectedTab === tab ? '#FFFFFF' : theme.colors.textSecondary} 
      />
      <Text style={[
        styles.tabButtonText,
        selectedTab === tab && styles.tabButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderGoalCard = (goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    return (
      <TouchableOpacity key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <View style={[styles.goalIcon, { backgroundColor: `${goal.color}15` }]}>
              <MaterialIcons name={goal.icon} size={24} color={goal.color} />
            </View>
            <View style={styles.goalDetails}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalDescription}>
                {goal.description || `${daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süre doldu'}`}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.goalMenuButton}
            onPress={() => {
              Alert.alert(
                'Hedef İşlemleri',
                goal.name,
                [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Düzenle', onPress: () => handleEditGoal(goal) },
                  { text: 'Sil', style: 'destructive', onPress: () => handleDeleteGoal(goal.id) }
                ]
              );
            }}
          >
            <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.goalProgress}>
          <View style={styles.goalProgressInfo}>
            <Text style={styles.goalProgressText}>
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </Text>
            <Text style={[
              styles.goalProgressPercent,
              { color: progress >= 100 ? theme.colors.success : goal.color }
            ]}>
              %{Math.round(progress)}
            </Text>
          </View>
          <View style={styles.goalProgressBar}>
            <View style={[
              styles.goalProgressFill, 
              { width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }
            ]} />
          </View>
        </View>

        <View style={styles.goalFooter}>
          <View style={styles.goalStatItem}>
            <Text style={styles.goalStatLabel}>Kalan</Text>
            <Text style={[
              styles.goalStatValue,
              { color: remainingAmount <= 0 ? theme.colors.success : theme.colors.textPrimary }
            ]}>
              {remainingAmount <= 0 ? 'Tamamlandı!' : formatCurrency(remainingAmount)}
            </Text>
          </View>
          <View style={styles.goalStatItem}>
            <Text style={styles.goalStatLabel}>Hedef Tarih</Text>
            <Text style={styles.goalStatValue}>
              {new Date(goal.targetDate).toLocaleDateString('tr-TR', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGoalsTab = () => (
    <View>
      {/* Goals Summary */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialIcons name="flag" size={32} color="#FFFFFF" />
        <Text style={styles.summaryTitle}>Hedeflerim</Text>
        <Text style={styles.summaryAmount}>
          {testUser.goals.length} aktif hedef
        </Text>
        <Text style={styles.summarySubtitle}>
          Toplam hedef: {formatCurrency(testUser.goals.reduce((sum, goal) => sum + goal.targetAmount, 0))}
        </Text>
      </LinearGradient>

      {/* Add Goal Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          setEditingGoal(null);
          setAddGoalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Yeni Hedef Ekle</Text>
      </TouchableOpacity>

      {/* Goals List */}
      <View style={styles.goalsList}>
        {testUser.goals.length > 0 ? (
          testUser.goals.map(renderGoalCard)
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="flag" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>Henüz hedef yok</Text>
            <Text style={styles.emptySubtitle}>
              İlk hedefinizi ekleyerek başlayın
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderBudgetsTab = () => (
    <View style={styles.comingSoon}>
      <MaterialIcons name="account-balance-wallet" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.comingSoonTitle}>Bütçe Yönetimi</Text>
      <Text style={styles.comingSoonSubtitle}>
        Kategori bazlı bütçe belirleme ve takip özellikleri yakında!
      </Text>
    </View>
  );

  const renderInsightsTab = () => (
    <View style={styles.comingSoon}>
      <MaterialIcons name="insights" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.comingSoonTitle}>Akıllı Öneriler</Text>
      <Text style={styles.comingSoonSubtitle}>
        Harcama alışkanlıklarınıza göre tasarruf önerileri yakında!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bütçe & Hedefler</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('goals', 'Hedefler', 'flag')}
        {renderTabButton('budgets', 'Bütçe', 'account-balance-wallet')}
        {renderTabButton('insights', 'Öneriler', 'insights')}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {selectedTab === 'goals' && renderGoalsTab()}
          {selectedTab === 'budgets' && renderBudgetsTab()}
          {selectedTab === 'insights' && renderInsightsTab()}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </Animated.View>

      {/* Add Goal Modal */}
      <AddGoalModal
        visible={addGoalVisible}
        onClose={() => {
          setAddGoalVisible(false);
          setEditingGoal(null);
        }}
        goal={editingGoal}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  headerTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cards,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },

  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },

  tabButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },

  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  content: {
    flex: 1,
  },

  summaryCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  summaryTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },

  summaryAmount: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },

  summarySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  goalsList: {
    paddingHorizontal: theme.spacing.lg,
  },

  goalCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  goalDetails: {
    flex: 1,
  },

  goalName: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },

  goalDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  goalMenuButton: {
    padding: theme.spacing.sm,
  },

  goalProgress: {
    marginBottom: theme.spacing.md,
  },

  goalProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  goalProgressText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  goalProgressPercent: {
    fontSize: 16,
    fontWeight: '700',
  },

  goalProgressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },

  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  goalStatItem: {
    alignItems: 'center',
  },

  goalStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },

  goalStatValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },

  emptyTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },

  comingSoonTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  comingSoonSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  bottomPadding: {
    height: 80,
  },
});

export default BudgetScreen;