// FinanceFlow - Local Storage Utility
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  // User data
  USER_DATA: 'financeflow_user_data',
  USER_PREFERENCES: 'financeflow_user_preferences',
  
  // Transaction data
  TRANSACTIONS: 'financeflow_transactions',
  TRANSACTION_CATEGORIES: 'financeflow_transaction_categories',
  
  // Account data
  ACCOUNTS: 'financeflow_accounts',
  ACCOUNT_BALANCES: 'financeflow_account_balances',
  
  // Budget data
  BUDGETS: 'financeflow_budgets',
  BUDGET_GOALS: 'financeflow_budget_goals',
  
  // Settings
  APP_SETTINGS: 'financeflow_app_settings',
  NOTIFICATION_SETTINGS: 'financeflow_notification_settings',
  
  // Cache
  CACHE_TRANSACTIONS: 'financeflow_cache_transactions',
  CACHE_ANALYTICS: 'financeflow_cache_analytics',
  CACHE_TIMESTAMP: 'financeflow_cache_timestamp',
  
  // Offline data
  OFFLINE_TRANSACTIONS: 'financeflow_offline_transactions',
  SYNC_QUEUE: 'financeflow_sync_queue',
};

// Generic storage functions
export const storage = {
  // Set item
  async set(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  // Get item
  async get(key, defaultValue = null) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },

  // Remove item
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  // Clear all
  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  // Get multiple items
  async getMultiple(keys) {
    try {
      const values = await AsyncStorage.multiGet(keys);
      const result = {};
      values.forEach(([key, value]) => {
        result[key] = value != null ? JSON.parse(value) : null;
      });
      return result;
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      return {};
    }
  },

  // Set multiple items
  async setMultiple(keyValuePairs) {
    try {
      const pairs = keyValuePairs.map(([key, value]) => [
        key,
        JSON.stringify(value)
      ]);
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (error) {
      console.error('Storage setMultiple error:', error);
      return false;
    }
  },
};

// Transaction storage functions
export const transactionStorage = {
  // Get all transactions
  async getTransactions() {
    return await storage.get(STORAGE_KEYS.TRANSACTIONS, []);
  },

  // Save transactions
  async saveTransactions(transactions) {
    return await storage.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  // Add new transaction
  async addTransaction(transaction) {
    const transactions = await this.getTransactions();
    const newTransaction = {
      ...transaction,
      id: transaction.id || `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    transactions.unshift(newTransaction); // Add to beginning
    await this.saveTransactions(transactions);
    return newTransaction;
  },

  // Update transaction
  async updateTransaction(transactionId, updates) {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);
    
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await this.saveTransactions(transactions);
      return transactions[index];
    }
    
    return null;
  },

  // Delete transaction
  async deleteTransaction(transactionId) {
    const transactions = await this.getTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== transactionId);
    await this.saveTransactions(filteredTransactions);
  },

  // Get transactions by date range
  async getTransactionsByDateRange(startDate, endDate) {
    const transactions = await this.getTransactions();
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  },

  // Get transactions by category
  async getTransactionsByCategory(categoryId) {
    const transactions = await this.getTransactions();
    return transactions.filter(transaction => transaction.categoryId === categoryId);
  },
};

// Account storage functions
export const accountStorage = {
  // Get all accounts
  async getAccounts() {
    return await storage.get(STORAGE_KEYS.ACCOUNTS, []);
  },

  // Save accounts
  async saveAccounts(accounts) {
    return await storage.set(STORAGE_KEYS.ACCOUNTS, accounts);
  },

  // Add new account
  async addAccount(account) {
    const accounts = await this.getAccounts();
    const newAccount = {
      ...account,
      id: account.id || `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: account.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    accounts.push(newAccount);
    await this.saveAccounts(accounts);
    return newAccount;
  },

  // Update account
  async updateAccount(accountId, updates) {
    const accounts = await this.getAccounts();
    const index = accounts.findIndex(a => a.id === accountId);
    
    if (index !== -1) {
      accounts[index] = {
        ...accounts[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await this.saveAccounts(accounts);
      return accounts[index];
    }
    
    return null;
  },

  // Delete account
  async deleteAccount(accountId) {
    const accounts = await this.getAccounts();
    const filteredAccounts = accounts.filter(a => a.id !== accountId);
    await this.saveAccounts(filteredAccounts);
  },

  // Update account balance
  async updateAccountBalance(accountId, newBalance) {
    return await this.updateAccount(accountId, { balance: newBalance });
  },
};

// Budget storage functions
export const budgetStorage = {
  // Get all budgets
  async getBudgets() {
    return await storage.get(STORAGE_KEYS.BUDGETS, []);
  },

  // Save budgets
  async saveBudgets(budgets) {
    return await storage.set(STORAGE_KEYS.BUDGETS, budgets);
  },

  // Add new budget
  async addBudget(budget) {
    const budgets = await this.getBudgets();
    const newBudget = {
      ...budget,
      id: budget.id || `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: budget.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    budgets.push(newBudget);
    await this.saveBudgets(budgets);
    return newBudget;
  },

  // Update budget
  async updateBudget(budgetId, updates) {
    const budgets = await this.getBudgets();
    const index = budgets.findIndex(b => b.id === budgetId);
    
    if (index !== -1) {
      budgets[index] = {
        ...budgets[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await this.saveBudgets(budgets);
      return budgets[index];
    }
    
    return null;
  },

  // Delete budget
  async deleteBudget(budgetId) {
    const budgets = await this.getBudgets();
    const filteredBudgets = budgets.filter(b => b.id !== budgetId);
    await this.saveBudgets(filteredBudgets);
  },
};

// Cache management functions
export const cacheStorage = {
  // Set cache with timestamp
  async setCache(key, data, ttl = 3600000) { // Default 1 hour TTL
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    return await storage.set(key, cacheData);
  },

  // Get cache data if not expired
  async getCache(key) {
    const cacheData = await storage.get(key);
    
    if (!cacheData) return null;
    
    const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;
    if (isExpired) {
      await storage.remove(key);
      return null;
    }
    
    return cacheData.data;
  },

  // Clear expired cache
  async clearExpiredCache() {
    const cacheKeys = [
      STORAGE_KEYS.CACHE_TRANSACTIONS,
      STORAGE_KEYS.CACHE_ANALYTICS,
    ];
    
    for (const key of cacheKeys) {
      const cacheData = await storage.get(key);
      if (cacheData && Date.now() - cacheData.timestamp > cacheData.ttl) {
        await storage.remove(key);
      }
    }
  },

  // Clear all cache
  async clearAllCache() {
    const cacheKeys = [
      STORAGE_KEYS.CACHE_TRANSACTIONS,
      STORAGE_KEYS.CACHE_ANALYTICS,
      STORAGE_KEYS.CACHE_TIMESTAMP,
    ];
    
    for (const key of cacheKeys) {
      await storage.remove(key);
    }
  },
};

// Offline data management
export const offlineStorage = {
  // Add offline transaction
  async addOfflineTransaction(transaction) {
    const offlineTransactions = await storage.get(STORAGE_KEYS.OFFLINE_TRANSACTIONS, []);
    offlineTransactions.push({
      ...transaction,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    });
    await storage.set(STORAGE_KEYS.OFFLINE_TRANSACTIONS, offlineTransactions);
  },

  // Get offline transactions
  async getOfflineTransactions() {
    return await storage.get(STORAGE_KEYS.OFFLINE_TRANSACTIONS, []);
  },

  // Clear offline transactions
  async clearOfflineTransactions() {
    await storage.remove(STORAGE_KEYS.OFFLINE_TRANSACTIONS);
  },

  // Add to sync queue
  async addToSyncQueue(action) {
    const syncQueue = await storage.get(STORAGE_KEYS.SYNC_QUEUE, []);
    syncQueue.push({
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    });
    await storage.set(STORAGE_KEYS.SYNC_QUEUE, syncQueue);
  },

  // Get sync queue
  async getSyncQueue() {
    return await storage.get(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  // Clear sync queue
  async clearSyncQueue() {
    await storage.remove(STORAGE_KEYS.SYNC_QUEUE);
  },
};

// Settings storage
export const settingsStorage = {
  // Get app settings
  async getAppSettings() {
    return await storage.get(STORAGE_KEYS.APP_SETTINGS, {
      currency: 'TRY',
      language: 'tr',
      notifications: true,
      darkMode: false,
      biometricEnabled: false,
      autoBackup: true,
    });
  },

  // Save app settings
  async saveAppSettings(settings) {
    return await storage.set(STORAGE_KEYS.APP_SETTINGS, settings);
  },

  // Get notification settings
  async getNotificationSettings() {
    return await storage.get(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
      budgetAlerts: true,
      billReminders: true,
      goalUpdates: true,
      securityAlerts: true,
      marketingNotifications: false,
    });
  },

  // Save notification settings
  async saveNotificationSettings(settings) {
    return await storage.set(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings);
  },
};

// Data migration utility
export const dataMigration = {
  // Check if migration is needed
  async checkMigrationNeeded() {
    const version = await storage.get('app_version', '1.0.0');
    return version !== '1.1.0'; // Current version
  },

  // Perform data migration
  async migrateData() {
    try {
      // Migrate transactions
      const oldTransactions = await storage.get('transactions', []);
      if (oldTransactions.length > 0) {
        await transactionStorage.saveTransactions(oldTransactions);
        await storage.remove('transactions');
      }

      // Migrate accounts
      const oldAccounts = await storage.get('accounts', []);
      if (oldAccounts.length > 0) {
        await accountStorage.saveAccounts(oldAccounts);
        await storage.remove('accounts');
      }

      // Update app version
      await storage.set('app_version', '1.1.0');
      
      return true;
    } catch (error) {
      console.error('Data migration error:', error);
      return false;
    }
  },
};

// Export all storage utilities
export default {
  storage,
  transactionStorage,
  accountStorage,
  budgetStorage,
  cacheStorage,
  offlineStorage,
  settingsStorage,
  dataMigration,
  STORAGE_KEYS,
};
