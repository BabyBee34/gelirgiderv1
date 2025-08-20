// FinanceFlow - Data Export System
import { Alert, Share } from 'react-native';
import { testUser } from './testData';

// Local formatter function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
};

export const dataExport = {
  // Generate CSV content for transactions
  generateTransactionsCSV: (transactions = testUser.transactions) => {
    const headers = [
      'Tarih',
      'Açıklama', 
      'Kategori',
      'Tutar',
      'Tür',
      'Hesap',
      'Notlar'
    ];

    const csvContent = [
      headers.join(','),
      ...transactions.map(transaction => {
        const category = testUser.categories.income.find(c => c.id === transaction.categoryId) ||
                        testUser.categories.expense.find(c => c.id === transaction.categoryId) ||
                        { name: 'Bilinmeyen' };
        const account = testUser.accounts.find(a => a.id === transaction.accountId) ||
                       { name: 'Bilinmeyen' };

                    return [
              new Date(transaction.date).toLocaleDateString('tr-TR'),
              `"${transaction.description || ''}"`,
              `"${category.name}"`,
              transaction.amount,
              transaction.type === 'income' ? 'Gelir' : 'Gider',
              `"${account.name}"`,
              `"${transaction.notes || ''}"`
            ].join(',');
      })
    ].join('\n');

    return csvContent;
  },

  // Generate CSV content for goals
  generateGoalsCSV: (goals = testUser.goals) => {
    const headers = [
      'Hedef Adı',
      'Hedef Tutar',
      'Mevcut Tutar',
      'İlerleme %',
      'Hedef Tarih',
      'Kalan Gün',
      'Durum'
    ];

    const csvContent = [
      headers.join(','),
      ...goals.map(goal => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
        const status = progress >= 100 ? 'Tamamlandı' : daysLeft < 0 ? 'Süresi Doldu' : 'Devam Ediyor';

        return [
          `"${goal.name}"`,
          goal.targetAmount,
          goal.currentAmount,
          progress.toFixed(2),
          new Date(goal.targetDate).toLocaleDateString('tr-TR'),
          Math.max(0, daysLeft),
          `"${status}"`
        ].join(',');
      })
    ].join('\n');

    return csvContent;
  },

  // Generate comprehensive financial report
  generateFinancialReport: (period = 'current_month') => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = testUser.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Category breakdown
    const categoryBreakdown = {};
    monthlyTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = testUser.categories.expense.find(c => c.id === transaction.categoryId);
        const categoryName = category ? category.name : 'Diğer';
        categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + transaction.amount;
      });

    const report = `
FİNANCEFLOW AYLIK MALİ RAPORU
${startOfMonth.toLocaleDateString('tr-TR')} - ${endOfMonth.toLocaleDateString('tr-TR')}

GENEL ÖZET
==========
Toplam Gelir: ${formatCurrency(totalIncome)}
Toplam Gider: ${formatCurrency(totalExpense)}
Net Bakiye: ${formatCurrency(netBalance)}
İşlem Sayısı: ${monthlyTransactions.length}

KATEGORİ BAZLI HARCAMALAR
========================
${Object.entries(categoryBreakdown)
  .sort((a, b) => b[1] - a[1])
  .map(([category, amount]) => `${category}: ${formatCurrency(amount)}`)
  .join('\n')}

HEDEFLER DURUMU
===============
${testUser.goals.map(goal => {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  return `${goal.name}: %${progress.toFixed(1)} (${formatCurrency(goal.currentAmount)}/${formatCurrency(goal.targetAmount)})`;
}).join('\n')}

HESAP BAKİYELERİ
================
${testUser.accounts.map(account => 
  `${account.name}: ${formatCurrency(account.balance)}`
).join('\n')}

Bu rapor FinanceFlow uygulaması tarafından ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.
    `.trim();

    return report;
  },

  // Export transactions as CSV
  exportTransactionsCSV: async () => {
    try {
      const csvContent = dataExport.generateTransactionsCSV();
      const fileName = `FinanceFlow_Islemler_${new Date().toISOString().split('T')[0]}.csv`;
      
      await Share.share({
        message: csvContent,
        title: 'İşlemler - CSV Export',
      });

      Alert.alert('Başarılı', 'İşlemler başarıyla dışa aktarıldı.');
    } catch (error) {
      Alert.alert('Hata', 'Dışa aktarma sırasında bir hata oluştu.');
      console.error('Export error:', error);
    }
  },

  // Export goals as CSV
  exportGoalsCSV: async () => {
    try {
      const csvContent = dataExport.generateGoalsCSV();
      const fileName = `FinanceFlow_Hedefler_${new Date().toISOString().split('T')[0]}.csv`;
      
      await Share.share({
        message: csvContent,
        title: 'Hedefler - CSV Export',
      });

      Alert.alert('Başarılı', 'Hedefler başarıyla dışa aktarıldı.');
    } catch (error) {
      Alert.alert('Hata', 'Dışa aktarma sırasında bir hata oluştu.');
      console.error('Export error:', error);
    }
  },

  // Export comprehensive financial report
  exportFinancialReport: async () => {
    try {
      const report = dataExport.generateFinancialReport();
      
      await Share.share({
        message: report,
        title: 'Mali Rapor',
      });

      Alert.alert('Başarılı', 'Mali rapor başarıyla oluşturuldu.');
    } catch (error) {
      Alert.alert('Hata', 'Rapor oluşturma sırasında bir hata oluştu.');
      console.error('Report error:', error);
    }
  },

  // Export all data
  exportAllData: async () => {
    try {
      const allData = {
        exportDate: new Date().toISOString(),
        user: {
          name: testUser.name,
          email: testUser.email,
        },
        accounts: testUser.accounts,
        transactions: testUser.transactions,
        goals: testUser.goals,
        categories: testUser.categories,
        summary: {
          totalBalance: testUser.accounts.reduce((sum, acc) => sum + acc.balance, 0),
          totalTransactions: testUser.transactions.length,
          totalGoals: testUser.goals.length,
        }
      };

      const jsonContent = JSON.stringify(allData, null, 2);
      
      await Share.share({
        message: jsonContent,
        title: 'FinanceFlow - Tüm Veriler',
      });

      Alert.alert('Başarılı', 'Tüm verileriniz başarıyla dışa aktarıldı.');
    } catch (error) {
      Alert.alert('Hata', 'Veri dışa aktarma sırasında bir hata oluştu.');
      console.error('Export error:', error);
    }
  },

  // Backup data to local storage simulation
  backupData: async () => {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          accounts: testUser.accounts,
          transactions: testUser.transactions,
          goals: testUser.goals,
          categories: testUser.categories,
        }
      };

      // In a real app, this would use AsyncStorage
      console.log('Backup created:', backupData);
      
      Alert.alert(
        'Yedek Oluşturuldu', 
        'Verileriniz başarıyla yedeklendi. Yedek dosyası cihazınızda saklandı.',
        [
          { text: 'Tamam' },
          { text: 'Paylaş', onPress: () => dataExport.exportAllData() }
        ]
      );
    } catch (error) {
      Alert.alert('Hata', 'Yedekleme sırasında bir hata oluştu.');
      console.error('Backup error:', error);
    }
  }
};

export default dataExport;
