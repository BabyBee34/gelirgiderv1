// FinanceFlow - Test User Data
export const testUser = {
  // Test kullanıcı bilgileri
  user: {
    id: 'test-user-001',
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
  },

  // Test finansal veriler
  accounts: [
    {
      id: 'acc-001',
      name: 'Ana Hesap',
      type: 'checking',
      balance: 15650.50,
      currency: 'TRY',
      icon: 'account-balance-wallet',
      color: '#6C63FF',
      isDefault: true,
      bankName: 'Garanti BBVA',
    },
    {
      id: 'acc-002', 
      name: 'Tasarruf Hesabı',
      type: 'savings',
      balance: 25000.00,
      currency: 'TRY',
      icon: 'savings',
      color: '#4ECDC4',
      isDefault: false,
      bankName: 'İş Bankası',
    },
    {
      id: 'acc-003',
      name: 'Kredi Kartı',
      type: 'credit',
      balance: -4250.75, // Negatif değer = borç
      creditLimit: 20000.00,
      availableCredit: 15749.25,
      minimumPayment: 212.54,
      dueDate: '15 Mart 2024',
      statementDate: '20 Şubat 2024', // Hesap kesim tarihi
      currency: 'TRY',
      icon: 'credit-card',
      color: '#F56565',
      isDefault: false,
      interestRate: 3.99, // Aylık faiz oranı %
      bankName: 'Yapı Kredi',
      lastStatement: {
        date: '2024-01-20', // Son kesim tarihi
        amount: 4250.75,
        dueDate: '2024-02-15',
        nextStatementDate: '2024-02-20' // Bir sonraki kesim tarihi
      },
      currentPeriodSpending: 1250.30, // Mevcut dönem harcama (henüz kesilmemiş)
      previousPeriodDebt: 3000.45, // Önceki dönem borcu (kesilmiş, ödenmesi gereken)
      recentTransactions: [
        { id: 't1', description: 'Market Alışverişi', amount: 125.50, type: 'expense', date: '2024-02-18' },
        { id: 't2', description: 'Benzin', amount: 250.00, type: 'expense', date: '2024-02-17' },
        { id: 't3', description: 'Restoran', amount: 180.75, type: 'expense', date: '2024-02-16' }
      ]
    },

  ],

  // Test kategoriler
  categories: {
    income: [
      { id: 'inc-001', name: 'Maaş', icon: 'work', color: '#48BB78' },
      { id: 'inc-002', name: 'Freelance', icon: 'computer', color: '#4ECDC4' },
      { id: 'inc-003', name: 'Yatırım', icon: 'trending-up', color: '#ED8936' },
      { id: 'inc-004', name: 'Kira Geliri', icon: 'home', color: '#9F7AEA' },
      { id: 'inc-005', name: 'Diğer', icon: 'more-horiz', color: '#718096' },
    ],
    expense: [
      { id: 'exp-001', name: 'Market', icon: 'shopping-cart', color: '#F56565' },
      { id: 'exp-002', name: 'Ulaşım', icon: 'directions-car', color: '#ED8936' },
      { id: 'exp-003', name: 'Faturalar', icon: 'receipt', color: '#ECC94B' },
      { id: 'exp-004', name: 'Eğlence', icon: 'movie', color: '#9F7AEA' },
      { id: 'exp-005', name: 'Sağlık', icon: 'local-hospital', color: '#38B2AC' },
      { id: 'exp-006', name: 'Kira', icon: 'home', color: '#6C63FF' },
      { id: 'exp-007', name: 'Eğitim', icon: 'school', color: '#4299E1' },
      { id: 'exp-008', name: 'Giyim', icon: 'shopping-bag', color: '#ED64A6' },
      
      // Platformlar
      { id: 'exp-009', name: 'Netflix', icon: 'play-circle-filled', color: '#E50914', isPlatform: true, monthlyFee: 63.99 },
      { id: 'exp-010', name: 'Amazon Prime', icon: 'local-shipping', color: '#FF9900', isPlatform: true, monthlyFee: 7.90 },
      { id: 'exp-011', name: 'YouTube Premium', icon: 'play-arrow', color: '#FF0000', isPlatform: true, monthlyFee: 29.99 },
      { id: 'exp-012', name: 'Spotify', icon: 'music-note', color: '#1DB954', isPlatform: true, monthlyFee: 17.99 },
      { id: 'exp-013', name: 'Disney+', icon: 'stars', color: '#113CCF', isPlatform: true, monthlyFee: 34.99 },
    ]
  },

  // Backward compatibility for components expecting these names
  incomeCategories: [
    { id: 'inc-001', name: 'Maaş', icon: 'work', color: '#48BB78' },
    { id: 'inc-002', name: 'Freelance', icon: 'computer', color: '#4ECDC4' },
    { id: 'inc-003', name: 'Yatırım', icon: 'trending-up', color: '#ED8936' },
    { id: 'inc-004', name: 'Kira Geliri', icon: 'home', color: '#9F7AEA' },
    { id: 'inc-005', name: 'Diğer', icon: 'more-horiz', color: '#718096' },
  ],

  expenseCategories: [
    { id: 'exp-001', name: 'Market', icon: 'shopping-cart', color: '#F56565' },
    { id: 'exp-002', name: 'Ulaşım', icon: 'directions-car', color: '#ED8936' },
    { id: 'exp-003', name: 'Faturalar', icon: 'receipt', color: '#ECC94B' },
    { id: 'exp-004', name: 'Eğlence', icon: 'movie', color: '#9F7AEA' },
    { id: 'exp-005', name: 'Sağlık', icon: 'local-hospital', color: '#38B2AC' },
    { id: 'exp-006', name: 'Kira', icon: 'home', color: '#6C63FF' },
    { id: 'exp-007', name: 'Eğitim', icon: 'school', color: '#4299E1' },
    { id: 'exp-008', name: 'Giyim', icon: 'shopping-bag', color: '#ED64A6' },
    
    // Dijital Platformlar & Abonelikler
    { id: 'exp-009', name: 'Netflix', icon: 'play-circle-filled', color: '#E50914', isPlatform: true, monthlyFee: 63.99, type: 'subscription' },
    { id: 'exp-010', name: 'Amazon Prime', icon: 'local-shipping', color: '#FF9900', isPlatform: true, monthlyFee: 7.90, type: 'subscription' },
    { id: 'exp-011', name: 'YouTube Premium', icon: 'play-arrow', color: '#FF0000', isPlatform: true, monthlyFee: 29.99, type: 'subscription' },
    { id: 'exp-012', name: 'Spotify', icon: 'music-note', color: '#1DB954', isPlatform: true, monthlyFee: 17.99, type: 'subscription' },
    { id: 'exp-013', name: 'Disney+', icon: 'stars', color: '#113CCF', isPlatform: true, monthlyFee: 34.99, type: 'subscription' },
    { id: 'exp-014', name: 'Apple Music', icon: 'library-music', color: '#FC3C44', isPlatform: true, monthlyFee: 19.99, type: 'subscription' },
    { id: 'exp-015', name: 'Adobe Creative', icon: 'brush', color: '#FF0000', isPlatform: true, monthlyFee: 169.00, type: 'subscription' },
    { id: 'exp-016', name: 'Microsoft 365', icon: 'computer', color: '#0078D4', isPlatform: true, monthlyFee: 69.00, type: 'subscription' },
    { id: 'exp-017', name: 'iCloud', icon: 'cloud', color: '#007AFF', isPlatform: true, monthlyFee: 2.99, type: 'subscription' },
    { id: 'exp-018', name: 'Twitch', icon: 'videogame-asset', color: '#9146FF', isPlatform: true, monthlyFee: 34.99, type: 'subscription' },
    { id: 'exp-019', name: 'LinkedIn Premium', icon: 'work', color: '#0077B5', isPlatform: true, monthlyFee: 129.99, type: 'subscription' },
    { id: 'exp-020', name: 'Canva Pro', icon: 'palette', color: '#00C4CC', isPlatform: true, monthlyFee: 54.99, type: 'subscription' },
    { id: 'exp-021', name: 'GitHub Pro', icon: 'code', color: '#24292F', isPlatform: true, monthlyFee: 24.00, type: 'subscription' },
    { id: 'exp-022', name: 'Dropbox Plus', icon: 'cloud-download', color: '#0061FF', isPlatform: true, monthlyFee: 44.99, type: 'subscription' },
  ],

  // Son 30 gün test işlemleri
  transactions: [
    {
      id: 'trx-001',
      type: 'income',
      amount: 8500.00,
      categoryId: 'inc-001',
      accountId: 'acc-001',
      description: 'Maaş ödemesi',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: true,
      tags: ['maaş', 'işyeri'],
    },
    {
      id: 'trx-002',
      type: 'expense',
      amount: -250.75,
      categoryId: 'exp-001',
      accountId: 'acc-001',
      description: 'Haftalık market alışverişi',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      receipt: 'receipt-001.jpg',
      location: 'Migros AVM',
    },
    {
      id: 'trx-003',
      type: 'expense',
      amount: -85.50,
      categoryId: 'exp-002',
      accountId: 'acc-003',
      description: 'Uber yolculukları',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['ulaşım', 'uber'],
    },
    {
      id: 'trx-004',
      type: 'expense',
      amount: -1250.00,
      categoryId: 'exp-006',
      accountId: 'acc-001',
      description: 'Aylık kira ödemesi',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: true,
      tags: ['kira', 'ev'],
    },
    {
      id: 'trx-005',
      type: 'income',
      amount: 1500.00,
      categoryId: 'inc-002',
      accountId: 'acc-001',
      description: 'Web sitesi projesu',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['freelance', 'web'],
    },
    {
      id: 'trx-006',
      type: 'expense',
      amount: -320.00,
      categoryId: 'exp-003',
      accountId: 'acc-001',
      description: 'Elektrik faturası',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['fatura', 'elektrik'],
    },
    {
      id: 'trx-007',
      type: 'expense',
      amount: -150.00,
      categoryId: 'exp-004',
      accountId: 'acc-003',
      description: 'Sinema ve yemek',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Akasya AVM',
      tags: ['eğlence', 'sinema'],
    },
    {
      id: 'trx-008',
      type: 'expense',
      amount: -45.00,
      categoryId: 'exp-002',
      accountId: 'acc-001',
      description: 'Otobüs kart yükleme',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['ulaşım', 'otobüs'],
    },
    {
      id: 'trx-009',
      type: 'income',
      amount: 500.00,
      categoryId: 'inc-004',
      accountId: 'acc-002',
      description: 'Dükkan kira geliri',
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: true,
      tags: ['kira', 'gelir'],
    },
    {
      id: 'trx-010',
      type: 'expense',
      amount: -180.00,
      categoryId: 'exp-005',
      accountId: 'acc-003',
      description: 'Doktor kontrolu',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['sağlık', 'doktor'],
    }
  ],

  // Bütçe hedefleri
  budgets: [
    {
      id: 'budget-001',
      categoryId: 'exp-001',
      name: 'Market Bütçesi',
      amount: 1000,
      spent: 750.25,
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    },
    {
      id: 'budget-002',
      categoryId: 'exp-002',
      name: 'Ulaşım Bütçesi',
      amount: 300,
      spent: 130.50,
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    }
  ],

  // Finansal hedefler
  goals: [
    {
      id: 'goal-001',
      name: 'Acil Durum Fonu',
      targetAmount: 50000,
      currentAmount: 25000,
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      description: '6 aylık giderim kadar acil durum fonu',
      color: '#48BB78',
      icon: 'security',
    },
    {
      id: 'goal-002',
      name: 'Tatil Fonu',
      targetAmount: 15000,
      currentAmount: 8500,
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Yaz tatili için birikim',
      color: '#4ECDC4',
      icon: 'flight',
    }
  ],

  // İstatistikler
  statistics: {
    monthlyIncome: 10500,
    monthlyExpenses: 6250,
    monthlySavings: 4250,
    savingsRate: 40.5,
    topExpenseCategory: 'Market',
    transactionCount: 45,
    avgTransactionAmount: 275.50,
  }
};

// Test fonksiyonları
export const testFunctions = {
  // Login test kullanıcısı
  loginTestUser: () => {
    return {
      success: true,
      user: testUser.user,
      token: 'test-jwt-token-123456789',
      expiresIn: '7d',
    };
  },

  // Kullanıcı verilerini getir
  getUserData: () => {
    return {
      ...testUser,
      lastSync: new Date().toISOString(),
    };
  },

  // Test işlemi ekle
  addTestTransaction: (type, amount, categoryId, description) => {
    const newTransaction = {
      id: `trx-${Date.now()}`,
      type,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      categoryId,
      accountId: testUser.accounts[0].id,
      description,
      date: new Date().toISOString(),
      tags: [],
    };
    
    testUser.transactions.unshift(newTransaction);
    return newTransaction;
  },

  // Test hesap güncelle
  updateAccountBalance: (accountId, amount) => {
    const account = testUser.accounts.find(acc => acc.id === accountId);
    if (account) {
      account.balance += amount;
      return account;
    }
    return null;
  },

  // Test kategorisi ekle
  addTestCategory: (type, name, icon, color) => {
    const newCategory = {
      id: `${type === 'income' ? 'inc' : 'exp'}-${Date.now()}`,
      name,
      icon,
      color,
    };
    
    testUser.categories[type].push(newCategory);
    return newCategory;
  },
};

export default testUser;
