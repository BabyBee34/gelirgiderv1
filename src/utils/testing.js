// FinanceFlow - Testing Utilities
import { testUser } from './testData';

// Mock data generators
export const mockData = {
  // Generate mock transactions
  generateTransactions(count = 10, type = 'expense') {
    const transactions = [];
    const categories = type === 'income' ? testUser.categories.income : testUser.categories.expense;
    
    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const amount = Math.floor(Math.random() * 1000) + 10;
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      transactions.push({
        id: `mock_trans_${i}`,
        type,
        amount: type === 'expense' ? -amount : amount,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        description: `Mock ${type} transaction ${i + 1}`,
        date: date.toISOString(),
        accountId: testUser.accounts[0].id,
        accountName: testUser.accounts[0].name,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }
    
    return transactions;
  },

  // Generate mock accounts
  generateAccounts(count = 3) {
    const accounts = [];
    const accountTypes = ['checking', 'savings', 'credit'];
    const bankNames = ['Garanti BBVA', 'İş Bankası', 'Yapı Kredi', 'Akbank'];
    
    for (let i = 0; i < count; i++) {
      const type = accountTypes[i % accountTypes.length];
      const balance = type === 'credit' ? -Math.floor(Math.random() * 5000) : Math.floor(Math.random() * 50000);
      
      accounts.push({
        id: `mock_acc_${i}`,
        name: `${bankNames[i % bankNames.length]} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type,
        balance,
        currency: 'TRY',
        icon: type === 'credit' ? 'credit-card' : 'account-balance-wallet',
        color: ['#6C63FF', '#4ECDC4', '#F56565'][i % 3],
        isDefault: i === 0,
        bankName: bankNames[i % bankNames.length],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    return accounts;
  },

  // Generate mock budgets
  generateBudgets(count = 5) {
    const budgets = [];
    const categories = testUser.categories.expense;
    
    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const amount = Math.floor(Math.random() * 2000) + 500;
      const spent = Math.floor(Math.random() * amount);
      
      budgets.push({
        id: `mock_budget_${i}`,
        name: `${category.name} Bütçesi`,
        amount,
        spent,
        remaining: amount - spent,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        period: 'monthly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    return budgets;
  },

  // Generate mock goals
  generateGoals(count = 3) {
    const goals = [];
    const goalNames = ['Acil Durum Fonu', 'Tatil Fonu', 'Araba Alımı', 'Ev Alımı', 'Eğitim Fonu'];
    
    for (let i = 0; i < count; i++) {
      const targetAmount = Math.floor(Math.random() * 50000) + 10000;
      const saved = Math.floor(Math.random() * targetAmount);
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + Math.floor(Math.random() * 24) + 6);
      
      goals.push({
        id: `mock_goal_${i}`,
        name: goalNames[i % goalNames.length],
        targetAmount,
        saved,
        remaining: targetAmount - saved,
        targetDate: targetDate.toISOString(),
        icon: ['savings', 'flight', 'directions-car', 'home', 'school'][i % 5],
        color: ['#6C63FF', '#4ECDC4', '#F56565', '#48BB78', '#ED8936'][i % 5],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    return goals;
  },

  // Generate mock user
  generateUser() {
    return {
      id: 'mock_user_001',
      firstName: 'Test',
      lastName: 'Kullanıcısı',
      email: 'test@financeflow.app',
      password: '123456',
      profilePicture: null,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isVerified: true,
      preferences: {
        currency: 'TRY',
        language: 'tr',
        notifications: true,
        darkMode: false,
      }
    };
  },
};

// Test utilities
export const testUtils = {
  // Wait for a specified time
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Mock async function
  mockAsyncFunction(data, delay = 100) {
    return new Promise(resolve => {
      setTimeout(() => resolve(data), delay);
    });
  },

  // Mock async function that throws error
  mockAsyncError(error, delay = 100) {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(error), delay);
    });
  },

  // Generate random string
  randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate random email
  randomEmail() {
    return `test_${this.randomString(8)}@example.com`;
  },

  // Generate random phone number
  randomPhone() {
    return `05${Math.floor(Math.random() * 90000000) + 10000000}`;
  },

  // Generate random amount
  randomAmount(min = 10, max = 10000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Generate random date
  randomDate(start = new Date(2020, 0, 1), end = new Date()) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },

  // Deep clone object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Check if two objects are equal
  isEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  // Mock console methods
  mockConsole() {
    const originalConsole = { ...console };
    
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    
    return {
      restore: () => {
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
      }
    };
  },

  // Mock AsyncStorage
  mockAsyncStorage() {
    const store = {};
    
    return {
      setItem: jest.fn((key, value) => {
        return Promise.resolve(store[key] = value);
      }),
      getItem: jest.fn((key) => {
        return Promise.resolve(store[key] || null);
      }),
      removeItem: jest.fn((key) => {
        return Promise.resolve(delete store[key]);
      }),
      clear: jest.fn(() => {
        return Promise.resolve(Object.keys(store).forEach(key => delete store[key]));
      }),
      getAllKeys: jest.fn(() => {
        return Promise.resolve(Object.keys(store));
      }),
      multiGet: jest.fn((keys) => {
        return Promise.resolve(keys.map(key => [key, store[key] || null]));
      }),
      multiSet: jest.fn((keyValuePairs) => {
        return Promise.resolve(keyValuePairs.forEach(([key, value]) => store[key] = value));
      }),
      multiRemove: jest.fn((keys) => {
        return Promise.resolve(keys.forEach(key => delete store[key]));
      }),
    };
  },

  // Mock navigation
  mockNavigation() {
    return {
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  },

  // Mock route
  mockRoute(params = {}) {
    return {
      params,
      key: 'mock_route_key',
      name: 'MockScreen',
    };
  },
};

// Test data sets
export const testDataSets = {
  // Empty data set
  empty: {
    transactions: [],
    accounts: [],
    budgets: [],
    goals: [],
    user: mockData.generateUser(),
  },

  // Small data set
  small: {
    transactions: mockData.generateTransactions(5, 'expense').concat(mockData.generateTransactions(3, 'income')),
    accounts: mockData.generateAccounts(2),
    budgets: mockData.generateBudgets(2),
    goals: mockData.generateGoals(1),
    user: mockData.generateUser(),
  },

  // Medium data set
  medium: {
    transactions: mockData.generateTransactions(20, 'expense').concat(mockData.generateTransactions(10, 'income')),
    accounts: mockData.generateAccounts(3),
    budgets: mockData.generateBudgets(5),
    goals: mockData.generateGoals(3),
    user: mockData.generateUser(),
  },

  // Large data set
  large: {
    transactions: mockData.generateTransactions(100, 'expense').concat(mockData.generateTransactions(50, 'income')),
    accounts: mockData.generateAccounts(5),
    budgets: mockData.generateBudgets(10),
    goals: mockData.generateGoals(5),
    user: mockData.generateUser(),
  },
};

// Test scenarios
export const testScenarios = {
  // First time user
  firstTimeUser: {
    hasCompletedOnboarding: false,
    isAuthenticated: false,
    hasTransactions: false,
    hasAccounts: false,
    hasBudgets: false,
    hasGoals: false,
  },

  // Returning user with data
  returningUser: {
    hasCompletedOnboarding: true,
    isAuthenticated: true,
    hasTransactions: true,
    hasAccounts: true,
    hasBudgets: true,
    hasGoals: true,
  },

  // User with no transactions
  userNoTransactions: {
    hasCompletedOnboarding: true,
    isAuthenticated: true,
    hasTransactions: false,
    hasAccounts: true,
    hasBudgets: false,
    hasGoals: false,
  },

  // User with only expenses
  userOnlyExpenses: {
    hasCompletedOnboarding: true,
    isAuthenticated: true,
    hasTransactions: true,
    transactionTypes: ['expense'],
    hasAccounts: true,
    hasBudgets: true,
    hasGoals: false,
  },

  // User with only income
  userOnlyIncome: {
    hasCompletedOnboarding: true,
    isAuthenticated: true,
    hasTransactions: true,
    transactionTypes: ['income'],
    hasAccounts: true,
    hasBudgets: false,
    hasGoals: true,
  },
};

// Performance test utilities
export const performanceTests = {
  // Measure function execution time
  measureExecutionTime(fn, iterations = 1000) {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    
    const end = performance.now();
    const averageTime = (end - start) / iterations;
    
    return {
      totalTime: end - start,
      averageTime,
      iterations,
    };
  },

  // Memory usage test
  measureMemoryUsage(fn) {
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    fn();
    const endMemory = performance.memory?.usedJSHeapSize || 0;
    
    return {
      memoryUsed: endMemory - startMemory,
      startMemory,
      endMemory,
    };
  },

  // Render performance test
  measureRenderTime(renderFn, iterations = 100) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      renderFn();
      const end = performance.now();
      times.push(end - start);
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return {
      averageTime,
      minTime,
      maxTime,
      times,
      iterations,
    };
  },
};

// Export all testing utilities
export default {
  mockData,
  testUtils,
  testDataSets,
  testScenarios,
  performanceTests,
};
