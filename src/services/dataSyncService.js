// FinanceFlow - Real-Time Data Synchronization Service
import { supabase } from '../config/supabase';

class DataSyncService {
  constructor() {
    this.subscriptions = new Map();
    this.callbacks = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize data synchronization for a user
   */
  async initialize(userId) {
    try {
      if (!userId) {
        throw new Error('User ID required for data sync');
      }

      this.userId = userId;
      this.setupRealtimeSubscriptions();
      this.isInitialized = true;
      
      console.log('✓ Data sync service initialized for user:', userId);
      return true;
    } catch (error) {
      console.error('Data sync initialization failed:', error);
      return false;
    }
  }

  /**
   * Setup real-time subscriptions for all relevant tables
   */
  setupRealtimeSubscriptions() {
    // Subscribe to transactions changes
    this.subscribeToTable('transactions', (payload) => {
      this.handleTransactionChange(payload);
    });

    // Subscribe to accounts changes
    this.subscribeToTable('accounts', (payload) => {
      this.handleAccountChange(payload);
    });

    // Subscribe to categories changes
    this.subscribeToTable('categories', (payload) => {
      this.handleCategoryChange(payload);
    });

    // Subscribe to budgets changes
    this.subscribeToTable('budgets', (payload) => {
      this.handleBudgetChange(payload);
    });

    // Subscribe to goals changes
    this.subscribeToTable('goals', (payload) => {
      this.handleGoalChange(payload);
    });
  }

  /**
   * Subscribe to a specific table changes
   */
  subscribeToTable(tableName, callback) {
    const channelName = `${tableName}_${this.userId}`;
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `user_id=eq.${this.userId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(tableName, subscription);
  }

  /**
   * Register callback for data updates
   */
  onDataUpdate(type, callback) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type).push(callback);
  }

  /**
   * Emit data update to registered callbacks
   */
  emitDataUpdate(type, data) {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${type} callback:`, error);
        }
      });
    }
  }

  /**
   * Handle transaction table changes
   */
  handleTransactionChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log('Transaction change detected:', { eventType, newRecord, oldRecord });
    
    this.emitDataUpdate('transaction', {
      type: eventType,
      data: newRecord || oldRecord,
      timestamp: new Date().toISOString()
    });

    // If transaction affects account balance, emit account update
    if (eventType === 'INSERT' || eventType === 'DELETE') {
      const accountId = newRecord?.account_id || oldRecord?.account_id;
      if (accountId) {
        this.emitDataUpdate('account_balance', {
          accountId,
          reason: 'transaction_change',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Handle account table changes
   */
  handleAccountChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log('Account change detected:', { eventType, newRecord, oldRecord });
    
    this.emitDataUpdate('account', {
      type: eventType,
      data: newRecord || oldRecord,
      timestamp: new Date().toISOString()
    });

    // Check for balance changes
    if (eventType === 'UPDATE' && newRecord && oldRecord) {
      if (newRecord.balance !== oldRecord.balance) {
        this.emitDataUpdate('account_balance', {
          accountId: newRecord.id,
          oldBalance: oldRecord.balance,
          newBalance: newRecord.balance,
          reason: 'balance_update',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Handle category table changes
   */
  handleCategoryChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log('Category change detected:', { eventType, newRecord, oldRecord });
    
    this.emitDataUpdate('category', {
      type: eventType,
      data: newRecord || oldRecord,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle budget table changes
   */
  handleBudgetChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log('Budget change detected:', { eventType, newRecord, oldRecord });
    
    this.emitDataUpdate('budget', {
      type: eventType,
      data: newRecord || oldRecord,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle goal table changes
   */
  handleGoalChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log('Goal change detected:', { eventType, newRecord, oldRecord });
    
    this.emitDataUpdate('goal', {
      type: eventType,
      data: newRecord || oldRecord,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Force refresh specific data type
   */
  async forceRefresh(dataType, refreshCallback) {
    try {
      console.log(`Force refreshing ${dataType} data...`);
      
      if (refreshCallback && typeof refreshCallback === 'function') {
        await refreshCallback();
      }
      
      this.emitDataUpdate('force_refresh', {
        dataType,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error(`Force refresh failed for ${dataType}:`, error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isInitialized: this.isInitialized,
      userId: this.userId,
      activeSubscriptions: Array.from(this.subscriptions.keys()),
      registeredCallbacks: Array.from(this.callbacks.keys()),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    try {
      this.subscriptions.forEach((subscription, tableName) => {
        supabase.removeChannel(subscription);
        console.log(`✓ Unsubscribed from ${tableName}`);
      });
      
      this.subscriptions.clear();
      this.callbacks.clear();
      this.isInitialized = false;
      this.userId = null;
      
      console.log('✓ Data sync service cleaned up');
    } catch (error) {
      console.error('Error during data sync cleanup:', error);
    }
  }

  /**
   * Remove specific callback
   */
  removeCallback(type, callback) {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

// Create singleton instance
const dataSyncService = new DataSyncService();

export default dataSyncService;