// FinanceFlow - Goal Service
import { supabase, TABLES } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';

// Tablo isimleri (fallback için)
const FALLBACK_TABLES = {
  GOALS: 'goals',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories'
};

class GoalService {
  constructor() {
    this.supabase = supabase;
    this.goalCache = new Map();
    this.progressCache = new Map();
    this.realTimeCallbacks = new Map();
    this.achievementCallbacks = new Map();
    // this.setupNetworkMonitoring(); // Geçici olarak devre dışı
  }

  // Network monitoring setup - Geçici olarak devre dışı
  setupNetworkMonitoring() {
    // NetInfo.addEventListener(state => {
    //   if (state.isConnected && state.isInternetReachable) {
    //     this.syncGoalData();
    //   }
    // });
  }

  // Real-time goal tracking setup
  setupRealTimeGoalTracking(userId, callback) {
    if (!userId) return null;

    // Clean up existing subscription
    if (this.realTimeCallbacks.has(userId)) {
      this.cleanupRealTimeTracking(userId);
    }

    // Store callback
    this.realTimeCallbacks.set(userId, callback);

    // Setup subscription for goal changes
    const subscription = this.supabase
      .channel(`goal_tracking_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.GOALS,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleGoalUpdate(userId, payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TRANSACTIONS,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleTransactionUpdate(userId, payload);
        }
      )
      .subscribe();

    return subscription;
  }

  // Handle goal updates
  handleGoalUpdate(userId, payload) {
    const callback = this.realTimeCallbacks.get(userId);
    if (callback) {
      // Invalidate cache for affected goal
      this.goalCache.delete(payload.new?.id || payload.old?.id);
      
      // Notify callback
      callback({
        type: 'goal_update',
        goal: payload.new || payload.old,
        eventType: payload.eventType
      });
    }
  }

  // Handle transaction updates that affect goals
  handleTransactionUpdate(userId, payload) {
    const transaction = payload.new || payload.old;
    
    // Check if transaction affects any goals
    this.checkGoalProgress(userId, transaction);
    
    const callback = this.realTimeCallbacks.get(userId);
    if (callback) {
      callback({
        type: 'transaction_update',
        transaction,
        eventType: payload.eventType
      });
    }
  }

  // Cleanup real-time tracking
  cleanupRealTimeTracking(userId) {
    if (this.realTimeCallbacks.has(userId)) {
      this.realTimeCallbacks.delete(userId);
    }
  }

  // Tüm hedefleri getir
  async getGoals(userId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOALS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update goal cache and calculate progress
      if (data) {
        const goalsWithProgress = [];
        for (const goal of data) {
          const progress = await this.calculateGoalProgress(goal);
          const goalWithProgress = {
            ...goal,
            ...progress,
            lastUpdated: new Date().toISOString()
          };
          
          this.goalCache.set(goal.id, goalWithProgress);
          goalsWithProgress.push(goalWithProgress);
        }
        return { success: true, data: goalsWithProgress };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Get goals error:', error);
      return { success: false, error: 'Hedef Getirme hatası' };
    }
  }

  // Tek hedef getir
  async getGoal(goalId) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOALS)
        .select('*')
        .eq('id', goalId)
        .single();

      if (error) throw error;
      
      // Calculate progress
      const progress = await this.calculateGoalProgress(data);
      const goalWithProgress = { ...data, ...progress };
      
      // Update cache
      this.goalCache.set(goalId, goalWithProgress);
      
      return { success: true, data: goalWithProgress };
    } catch (error) {
      console.error('Get goal error:', error);
      return { success: false, error: 'Hedef Getirme hatası' };
    }
  }

  // Hedef ilerlemesini hesapla
  async calculateGoalProgress(goal) {
    try {
      const currentAmount = parseFloat(goal.current_amount || 0);
      const targetAmount = parseFloat(goal.target_amount);
      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);
      const now = new Date();

      // Progress calculation
      const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
      const remaining = Math.max(targetAmount - currentAmount, 0);
      
      // Time calculations
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)), 0);
      
      // Status determination
      let status = 'active';
      if (progress >= 100) {
        status = 'completed';
      } else if (remainingDays <= 0) {
        status = 'expired';
      } else if (now < startDate) {
        status = 'pending';
      }

      // Performance metrics
      const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
      const isOnTrack = progress >= expectedProgress * 0.8; // Allow 20% tolerance
      
      // Daily/monthly target calculations
      const dailyTarget = remainingDays > 0 ? remaining / remainingDays : 0;
      const monthlyTarget = remainingDays > 0 ? (remaining / remainingDays) * 30 : 0;

      return {
        progress: Math.min(progress, 100),
        remaining,
        status,
        elapsedDays,
        remainingDays,
        totalDays,
        expectedProgress,
        isOnTrack,
        dailyTarget,
        monthlyTarget,
        achievementRate: progress / 100
      };
    } catch (error) {
      console.error('Calculate goal progress error:', error);
      return {
        progress: 0,
        remaining: parseFloat(goal.target_amount),
        status: 'active',
        elapsedDays: 0,
        remainingDays: 0,
        totalDays: 0,
        expectedProgress: 0,
        isOnTrack: false,
        dailyTarget: 0,
        monthlyTarget: 0,
        achievementRate: 0
      };
    }
  }

  // Hedefe katkı ekle
  async addGoalContribution(goalId, amount, description = '') {
    try {
      // Get current goal
      const goalResult = await this.getGoal(goalId);
      if (!goalResult.success) {
        throw new Error(goalResult.error);
      }

      const goal = goalResult.data;
      const newCurrentAmount = parseFloat(goal.current_amount || 0) + parseFloat(amount);
      
      // Update goal current amount
      const { data, error } = await this.supabase
        .from(TABLES.GOALS)
        .update({ 
          current_amount: newCurrentAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      // Log contribution (you might want to create a contributions table)
      await this.logGoalContribution(goalId, amount, description);

      // Check if goal is achieved
      if (newCurrentAmount >= parseFloat(goal.target_amount)) {
        await this.markGoalAsAchieved(goalId);
      }

      // Invalidate cache
      this.goalCache.delete(goalId);
      
      // Recalculate progress
      const progress = await this.calculateGoalProgress(data);
      const updatedGoal = { ...data, ...progress };
      
      // Update cache
      this.goalCache.set(goalId, updatedGoal);

      return { success: true, data: updatedGoal };
    } catch (error) {
      console.error('Add goal contribution error:', error);
      return { success: false, error: 'Hedef katkısı eklenemedi' };
    }
  }

  // Hedef katkısını logla
  async logGoalContribution(goalId, amount, description) {
    try {
      // This could be stored in a separate goal_contributions table
      // For now, we'll just log it
      console.log(`Goal contribution: Goal ${goalId}, Amount: ${amount}, Description: ${description}`);
    } catch (error) {
      console.error('Log goal contribution error:', error);
    }
  }

  // Hedefi başarılı olarak işaretle
  async markGoalAsAchieved(goalId) {
    try {
      const { error } = await this.supabase
        .from(TABLES.GOALS)
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;

      // Trigger achievement callback
      const achievementCallback = this.achievementCallbacks.get('global');
      if (achievementCallback) {
        achievementCallback({
          type: 'goal_achieved',
          goalId,
          achievedAt: new Date().toISOString()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Mark goal as achieved error:', error);
      return { success: false, error: 'Hedef başarı durumu güncellenemedi' };
    }
  }

  // Hedef kategorilerine göre grupla
  async getGoalsByCategory(userId) {
    try {
      const goalsResult = await this.getGoals(userId);
      if (!goalsResult.success) {
        throw new Error(goalsResult.error);
      }

      const goalsByCategory = goalsResult.data.reduce((groups, goal) => {
        const category = goal.category || 'Other';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(goal);
        return groups;
      }, {});

      return { success: true, data: goalsByCategory };
    } catch (error) {
      console.error('Get goals by category error:', error);
      return { success: false, error: 'Hedef gruplama hatası' };
    }
  }

  // Aktif hedefleri getir
  async getActiveGoals(userId) {
    try {
      const goalsResult = await this.getGoals(userId);
      if (!goalsResult.success) {
        throw new Error(goalsResult.error);
      }

      const activeGoals = goalsResult.data.filter(goal => 
        goal.status === 'active' && new Date(goal.end_date) > new Date()
      );

      return { success: true, data: activeGoals };
    } catch (error) {
      console.error('Get active goals error:', error);
      return { success: false, error: 'Aktif hedefler alınamadı' };
    }
  }

  // Tamamlanan hedefleri getir
  async getCompletedGoals(userId) {
    try {
      const goalsResult = await this.getGoals(userId);
      if (!goalsResult.success) {
        throw new Error(goalsResult.error);
      }

      const completedGoals = goalsResult.data.filter(goal => 
        goal.status === 'completed' || goal.progress >= 100
      );

      return { success: true, data: completedGoals };
    } catch (error) {
      console.error('Get completed goals error:', error);
      return { success: false, error: 'Tamamlanan hedefler alınamadı' };
    }
  }

  // Hedef performans analizi
  async getGoalPerformanceAnalysis(userId) {
    try {
      const goalsResult = await this.getGoals(userId);
      if (!goalsResult.success) {
        throw new Error(goalsResult.error);
      }

      const goals = goalsResult.data;
      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const activeGoals = goals.filter(g => g.status === 'active').length;
      const expiredGoals = goals.filter(g => g.status === 'expired').length;
      
      const averageProgress = totalGoals > 0 
        ? goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals 
        : 0;
        
      const onTrackGoals = goals.filter(g => g.isOnTrack && g.status === 'active').length;
      const offTrackGoals = goals.filter(g => !g.isOnTrack && g.status === 'active').length;

      const performance = {
        totalGoals,
        completedGoals,
        activeGoals,
        expiredGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        averageProgress,
        onTrackGoals,
        offTrackGoals,
        successRate: (completedGoals + onTrackGoals) / Math.max(totalGoals, 1) * 100,
        goalsByCategory: this.groupGoalsByCategory(goals),
        goalsByStatus: {
          active: goals.filter(g => g.status === 'active'),
          completed: goals.filter(g => g.status === 'completed'),
          expired: goals.filter(g => g.status === 'expired'),
          pending: goals.filter(g => g.status === 'pending')
        }
      };

      return { success: true, data: performance };
    } catch (error) {
      console.error('Get goal performance analysis error:', error);
      return { success: false, error: 'Hedef performans analizi yapılamadı' };
    }
  }

  // Hedef önerileri
  async getGoalRecommendations(userId) {
    try {
      const performanceResult = await this.getGoalPerformanceAnalysis(userId);
      if (!performanceResult.success) {
        throw new Error(performanceResult.error);
      }

      const { offTrackGoals, expiredGoals, completionRate, goalsByStatus } = performanceResult.data;
      const recommendations = [];

      // Off track goals
      if (offTrackGoals > 0) {
        recommendations.push({
          type: 'warning',
          title: 'Hedef Takibi',
          description: `${offTrackGoals} hedefiniz hedefin gerisinde. Bu hedeflere daha fazla odaklanın.`,
          priority: 'high',
          goals: goalsByStatus.active.filter(g => !g.isOnTrack)
        });
      }

      // Expired goals
      if (expiredGoals > 0) {
        recommendations.push({
          type: 'danger',
          title: 'Süresi Dolmuş Hedefler',
          description: `${expiredGoals} hedefinizin süresi doldu. Bu hedefleri gözden geçirin veya yenileyin.`,
          priority: 'critical',
          goals: goalsByStatus.expired
        });
      }

      // Low completion rate
      if (completionRate < 50) {
        recommendations.push({
          type: 'warning',
          title: 'Düşük Başarı Oranı',
          description: `Hedef tamamlama oranınız %${completionRate.toFixed(1)}. Daha gerçekçi hedefler belirleyin.`,
          priority: 'medium'
        });
      }

      // Success celebration
      if (completionRate > 80) {
        recommendations.push({
          type: 'success',
          title: 'Mükemmel Performans',
          description: `Hedef tamamlama oranınız %${completionRate.toFixed(1)}. Harika iş çıkarıyorsunuz!`,
          priority: 'low'
        });
      }

      // New goal suggestion
      if (goalsByStatus.active.length < 3) {
        recommendations.push({
          type: 'info',
          title: 'Yeni Hedef Önerisi',
          description: 'Finansal hedeflerinizi artırmak için yeni hedefler belirleyebilirsiniz.',
          priority: 'low'
        });
      }

      return { success: true, data: recommendations };
    } catch (error) {
      console.error('Get goal recommendations error:', error);
      return { success: false, error: 'Hedef önerileri alınamadı' };
    }
  }

  // Helper method: Group goals by category
  groupGoalsByCategory(goals) {
    return goals.reduce((groups, goal) => {
      const category = goal.category || 'Other';
      if (!groups[category]) {
        groups[category] = {
          goals: [],
          totalAmount: 0,
          completedAmount: 0,
          count: 0
        };
      }
      groups[category].goals.push(goal);
      groups[category].totalAmount += parseFloat(goal.target_amount);
      groups[category].completedAmount += parseFloat(goal.current_amount || 0);
      groups[category].count += 1;
      return groups;
    }, {});
  }

  // İşlemlerin hedefler üzerindeki etkisini kontrol et
  async checkGoalProgress(userId, transaction) {
    try {
      if (!transaction || transaction.type !== 'income') return;

      // Get active savings goals
      const activeGoalsResult = await this.getActiveGoals(userId);
      if (!activeGoalsResult.success) return;

      const savingsGoals = activeGoalsResult.data.filter(goal => 
        goal.category === 'savings' || goal.type === 'savings'
      );

      // For now, we'll just log the transaction
      // In a real implementation, you might have specific rules for auto-contributions
      console.log(`Transaction ${transaction.id} might affect ${savingsGoals.length} savings goals`);
      
    } catch (error) {
      console.error('Check goal progress error:', error);
    }
  }

  // Achievement callbacks setup
  setupAchievementCallbacks(callback) {
    this.achievementCallbacks.set('global', callback);
  }

  // Cleanup achievement callbacks
  cleanupAchievementCallbacks() {
    this.achievementCallbacks.delete('global');
  }

  // Sync goal data
  async syncGoalData() {
    try {
      // Clear caches to force fresh data
      this.goalCache.clear();
      this.progressCache.clear();
      
      console.log('Goal data synced');
    } catch (error) {
      console.error('Sync goal data error:', error);
    }
  }

  // Yeni hedef oluştur
  async createGoal(goalData) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOALS)
        .insert([{
          ...goalData,
          current_amount: 0,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Calculate initial progress
      const progress = await this.calculateGoalProgress(data);
      const goalWithProgress = { ...data, ...progress };
      
      // Update cache
      this.goalCache.set(data.id, goalWithProgress);
      
      return { success: true, data: goalWithProgress };
    } catch (error) {
      console.error('Create goal error:', error);
      return { success: false, error: 'Hedef Oluşturma hatası' };
    }
  }

  // Hedef güncelle
  async updateGoal(goalId, updates) {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOALS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      
      // Recalculate progress
      const progress = await this.calculateGoalProgress(data);
      const goalWithProgress = { ...data, ...progress };
      
      // Update cache
      this.goalCache.set(goalId, goalWithProgress);
      
      return { success: true, data: goalWithProgress };
    } catch (error) {
      console.error('Update goal error:', error);
      return { success: false, error: 'Hedef Güncelleme hatası' };
    }
  }

  // Hedef sil
  async deleteGoal(goalId) {
    try {
      const { error } = await this.supabase
        .from(TABLES.GOALS)
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      
      // Remove from cache
      this.goalCache.delete(goalId);
      
      return { success: true };
    } catch (error) {
      console.error('Delete goal error:', error);
      return { success: false, error: 'Hedef Silme hatası' };
    }
  }

  // Hedef şablonları
  getGoalTemplates() {
    return [
      {
        id: 'emergency_fund',
        name: 'Acil Durum Fonu',
        description: '3-6 aylık gideriniz kadar acil durum fonu oluşturun',
        category: 'savings',
        type: 'savings',
        icon: 'security',
        suggestedAmount: 15000,
        suggestedDuration: 12 // months
      },
      {
        id: 'vacation',
        name: 'Tatil Fonu',
        description: 'Hayalinizdeki tatil için para biriktirin',
        category: 'lifestyle',
        type: 'savings',
        icon: 'flight',
        suggestedAmount: 8000,
        suggestedDuration: 6
      },
      {
        id: 'house_down_payment',
        name: 'Ev Peşinatı',
        description: 'Ev satın almak için peşinat biriktirin',
        category: 'investment',
        type: 'savings',
        icon: 'home',
        suggestedAmount: 100000,
        suggestedDuration: 24
      },
      {
        id: 'car_purchase',
        name: 'Araç Alımı',
        description: 'Yeni araç satın almak için para biriktirin',
        category: 'transportation',
        type: 'savings',
        icon: 'directions-car',
        suggestedAmount: 50000,
        suggestedDuration: 18
      },
      {
        id: 'education',
        name: 'Eğitim Fonu',
        description: 'Eğitim masrafları için para biriktirin',
        category: 'education',
        type: 'savings',
        icon: 'school',
        suggestedAmount: 25000,
        suggestedDuration: 12
      },
      {
        id: 'investment',
        name: 'Yatırım Fonu',
        description: 'Yatırım yapmak için para biriktirin',
        category: 'investment',
        type: 'investment',
        icon: 'trending-up',
        suggestedAmount: 20000,
        suggestedDuration: 9
      }
    ];
  }
}

export default new GoalService();
