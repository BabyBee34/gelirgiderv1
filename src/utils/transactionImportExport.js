// FinanceFlow - Transaction Import/Export System
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { accountService } from '../services/accountService';

class TransactionImportExportManager {
  constructor() {
    this.supportedFormats = ['csv', 'json', 'xlsx'];
    this.exportDir = `${FileSystem.documentDirectory}exports/`;
    this.importDir = `${FileSystem.documentDirectory}imports/`;
    this.ensureDirectories();
  }

  // Dizinleri oluştur
  async ensureDirectories() {
    try {
      const exportDirInfo = await FileSystem.getInfoAsync(this.exportDir);
      if (!exportDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.exportDir, { intermediates: true });
      }

      const importDirInfo = await FileSystem.getInfoAsync(this.importDir);
      if (!importDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.importDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Dizin oluşturma hatası:', error);
    }
  }

  // Transaction'ları export et
  async exportTransactions(userId, format = 'csv', filters = {}) {
    try {
      console.log('📤 Transaction export başlatılıyor...');
      
      // Transaction'ları getir
      const result = await transactionService.getTransactions(userId, filters);
      if (!result.success) {
        throw new Error(`Transaction getirme hatası: ${result.error}`);
      }

      const transactions = result.data;
      
      // Format'a göre export yap
      let exportData;
      let fileName;
      let mimeType;

      switch (format.toLowerCase()) {
        case 'csv':
          exportData = this.convertToCSV(transactions);
          fileName = `transactions_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          exportData = JSON.stringify(transactions, null, 2);
          fileName = `transactions_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        case 'xlsx':
          exportData = await this.convertToXLSX(transactions);
          fileName = `transactions_${Date.now()}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        default:
          throw new Error('Desteklenmeyen format');
      }

      // Dosyayı kaydet
      const filePath = `${this.exportDir}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, exportData);

      console.log('✅ Export tamamlandı:', filePath);

      return {
        success: true,
        filePath,
        fileName,
        mimeType,
        recordCount: transactions.length
      };
    } catch (error) {
      console.error('Export hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // CSV formatına dönüştür
  convertToCSV(transactions) {
    if (!transactions || transactions.length === 0) {
      return 'No transactions found';
    }

    // CSV header
    const headers = [
      'ID', 'Date', 'Type', 'Amount', 'Description', 'Category', 'Account', 'Notes', 'Created At'
    ];

    // CSV rows
    const rows = transactions.map(transaction => [
      transaction.id,
      transaction.date,
      transaction.type,
      transaction.amount,
      `"${transaction.description || ''}"`,
      transaction.category?.name || '',
      transaction.account?.name || '',
      `"${transaction.notes || ''}"`,
      transaction.created_at
    ]);

    // CSV content
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    return csvContent;
  }

  // XLSX formatına dönüştür (basit implementation)
  async convertToXLSX(transactions) {
    // Bu kısım gerçek XLSX library ile değiştirilecek
    // Şimdilik CSV olarak döndürüyoruz
    return this.convertToCSV(transactions);
  }

  // Export'u paylaş
  async shareExport(filePath, fileName) {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Transaction Export Paylaş'
        });
        return { success: true };
      } else {
        throw new Error('Sharing mevcut değil');
      }
    } catch (error) {
      console.error('Export paylaşma hatası:', error);
      throw error;
    }
  }

  // Transaction'ları import et
  async importTransactions(userId, filePath, format = 'auto') {
    try {
      console.log('📥 Transaction import başlatılıyor...');
      
      // Format'ı otomatik tespit et
      if (format === 'auto') {
        format = this.detectFileFormat(filePath);
      }

      // Dosyayı oku
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      
      // Format'a göre parse et
      let transactions;
      switch (format.toLowerCase()) {
        case 'csv':
          transactions = this.parseCSV(fileContent);
          break;
        case 'json':
          transactions = JSON.parse(fileContent);
          break;
        default:
          throw new Error('Desteklenmeyen format');
      }

      // Transaction'ları doğrula
      const validationResult = this.validateImportData(transactions);
      if (!validationResult.isValid) {
        throw new Error(`Validation hatası: ${validationResult.errors.join(', ')}`);
      }

      // Transaction'ları import et
      const importResult = await this.processImport(userId, transactions);

      console.log('✅ Import tamamlandı:', importResult);

      return importResult;
    } catch (error) {
      console.error('Import hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Dosya formatını otomatik tespit et
  detectFileFormat(filePath) {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'csv':
        return 'csv';
      case 'json':
        return 'json';
      case 'xlsx':
      case 'xls':
        return 'xlsx';
      default:
        throw new Error('Desteklenmeyen dosya formatı');
    }
  }

  // CSV parse et
  parseCSV(csvContent) {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV dosyası boş veya geçersiz');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const transactions = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const transaction = {};
          headers.forEach((header, index) => {
            transaction[header] = values[index];
          });
          transactions.push(transaction);
        }
      }

      return transactions;
    } catch (error) {
      console.error('CSV parse hatası:', error);
      throw error;
    }
  }

  // CSV satırını parse et (comma içeren alanları handle et)
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  // Import data'yı doğrula
  validateImportData(transactions) {
    const errors = [];
    const requiredFields = ['date', 'type', 'amount', 'description'];
    
    if (!Array.isArray(transactions)) {
      errors.push('Data array olmalı');
      return { isValid: false, errors };
    }

    transactions.forEach((transaction, index) => {
      requiredFields.forEach(field => {
        if (!transaction[field]) {
          errors.push(`Row ${index + 1}: ${field} eksik`);
        }
      });

      // Type kontrolü
      if (transaction.type && !['income', 'expense', 'transfer'].includes(transaction.type)) {
        errors.push(`Row ${index + 1}: Geçersiz type (${transaction.type})`);
      }

      // Amount kontrolü
      if (transaction.amount && isNaN(parseFloat(transaction.amount))) {
        errors.push(`Row ${index + 1}: Geçersiz amount (${transaction.amount})`);
      }

      // Date kontrolü
      if (transaction.date && isNaN(Date.parse(transaction.date))) {
        errors.push(`Row ${index + 1}: Geçersiz date (${transaction.date})`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Import'u işle
  async processImport(userId, transactions) {
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const transaction of transactions) {
        try {
          // Transaction data'yı hazırla
          const transactionData = {
            user_id: userId,
            account_id: await this.resolveAccountId(userId, transaction.account),
            category_id: await this.resolveCategoryId(userId, transaction.category),
            amount: parseFloat(transaction.amount),
            type: transaction.type,
            description: transaction.description,
            date: transaction.date,
            notes: transaction.notes || '',
            created_at: transaction.created_at || new Date().toISOString()
          };

          // Transaction'ı oluştur
          const result = await transactionService.createTransaction(transactionData);
          
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Transaction ${transaction.description}: ${result.error}`);
          }
        } catch (error) {
          errorCount++;
          errors.push(`Transaction ${transaction.description}: ${error.message}`);
        }
      }

      return {
        success: true,
        totalCount: transactions.length,
        successCount,
        errorCount,
        errors
      };
    } catch (error) {
      console.error('Import işleme hatası:', error);
      throw error;
    }
  }

  // Account ID'yi çöz
  async resolveAccountId(userId, accountName) {
    if (!accountName) return null;

    try {
      const result = await accountService.getAccounts(userId);
      if (result.success) {
        const account = result.data.find(acc => 
          acc.name.toLowerCase() === accountName.toLowerCase()
        );
        return account?.id || null;
      }
    } catch (error) {
      console.warn('Account ID çözme hatası:', error);
    }

    return null;
  }

  // Category ID'yi çöz
  async resolveCategoryId(userId, categoryName) {
    if (!categoryName) return null;

    try {
      const result = await categoryService.getCategories(userId);
      if (result.success) {
        const category = result.data.find(cat => 
          cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        return category?.id || null;
      }
    } catch (error) {
      console.warn('Category ID çözme hatası:', error);
    }

    return null;
  }

  // Dosya seçici ile import
  async importFromFilePicker(userId) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/*',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        return await this.importTransactions(userId, result.uri);
      } else {
        throw new Error('Dosya seçilmedi');
      }
    } catch (error) {
      console.error('Dosya seçici hatası:', error);
      throw error;
    }
  }

  // Import template'i oluştur
  async createImportTemplate() {
    try {
      const template = [
        {
          date: '2024-08-15',
          type: 'expense',
          amount: '100.00',
          description: 'Market alışverişi',
          category: 'Market',
          account: 'Ana Banka Hesabı',
          notes: 'Haftalık market'
        },
        {
          date: '2024-08-15',
          type: 'income',
          amount: '5000.00',
          description: 'Maaş',
          category: 'Maaş',
          account: 'Ana Banka Hesabı',
          notes: 'Ağustos maaşı'
        }
      ];

      const templatePath = `${this.exportDir}import_template.json`;
      await FileSystem.writeAsStringAsync(
        templatePath,
        JSON.stringify(template, null, 2)
      );

      return {
        success: true,
        templatePath,
        template
      };
    } catch (error) {
      console.error('Template oluşturma hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Export istatistikleri
  async getExportStats() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.exportDir);
      const exportFiles = files.filter(file => 
        file.includes('transactions_') && 
        (file.endsWith('.csv') || file.endsWith('.json') || file.endsWith('.xlsx'))
      );

      const stats = {
        totalExports: exportFiles.length,
        byFormat: {
          csv: exportFiles.filter(f => f.endsWith('.csv')).length,
          json: exportFiles.filter(f => f.endsWith('.json')).length,
          xlsx: exportFiles.filter(f => f.endsWith('.xlsx')).length
        },
        recentExports: exportFiles
          .map(file => ({
            name: file,
            path: `${this.exportDir}${file}`,
            timestamp: this.extractTimestampFromFileName(file)
          }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Export istatistikleri hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Dosya adından timestamp çıkar
  extractTimestampFromFileName(fileName) {
    const match = fileName.match(/transactions_(\d+)\./);
    return match ? parseInt(match[1]) : 0;
  }

  // Eski export dosyalarını temizle
  async cleanupOldExports(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 gün
    try {
      const files = await FileSystem.readDirectoryAsync(this.exportDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = `${this.exportDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && (now - fileInfo.modificationTime) > maxAge) {
          await FileSystem.deleteAsync(filePath);
          cleanedCount++;
        }
      }

      console.log(`🧹 ${cleanedCount} eski export dosyası temizlendi`);
      return { success: true, cleanedCount };
    } catch (error) {
      console.error('Export temizleme hatası:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const transactionImportExportManager = new TransactionImportExportManager();

export default transactionImportExportManager;
