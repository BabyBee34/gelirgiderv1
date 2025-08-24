// FinanceFlow - Export Service
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import analyticsService from './analyticsService';
import reportService from './reportService';
import { formatCurrency } from '../utils/formatters';

class ExportService {
  constructor() {
    this.exportDir = `${FileSystem.documentDirectory}exports/`;
    this.ensureExportDirectory();
  }

  // Export directory oluştur
  async ensureExportDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.exportDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.exportDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Export directory creation error:', error);
    }
  }

  // Analytics verilerini dışa aktar
  async exportAnalyticsData(userId, exportConfig) {
    try {
      const {
        dataType = 'all',
        dateRange = 'month',
        format = 'csv',
        includeCharts = false,
        includeInsights = true
      } = exportConfig;

      let dataToExport = {};

      // Veri türüne göre veri topla
      switch (dataType) {
        case 'all':
          dataToExport = await this.collectAllAnalyticsData(userId, dateRange, includeInsights);
          break;
        case 'financial_summary':
          dataToExport = await this.collectFinancialSummaryData(userId, dateRange);
          break;
        case 'transactions':
          dataToExport = await this.collectTransactionData(userId, dateRange);
          break;
        case 'categories':
          dataToExport = await this.collectCategoryData(userId, dateRange);
          break;
        case 'accounts':
          dataToExport = await this.collectAccountData(userId, dateRange);
          break;
        case 'trends':
          dataToExport = await this.collectTrendData(userId, dateRange);
          break;
        case 'insights':
          dataToExport = await this.collectInsightData(userId, dateRange);
          break;
        default:
          throw new Error('Geçersiz veri türü');
      }

      // Format'a göre dışa aktar
      const exportedData = await this.formatForExport(dataToExport, format);
      
      // Dosyayı kaydet
      const fileName = `analytics_${dataType}_${dateRange}_${new Date().toISOString().split('T')[0]}`;
      const filePath = await this.saveToFile(fileName, exportedData, format);
      
      return {
        success: true,
        data: {
          filePath,
          fileName: `${fileName}.${this.getFileExtension(format)}`,
          size: await this.getFileSize(filePath),
          format,
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Export analytics data error:', error);
      return { success: false, error: 'Veri dışa aktarma hatası' };
    }
  }

  // Tüm analytics verilerini topla
  async collectAllAnalyticsData(userId, dateRange, includeInsights) {
    const [summary, expenses, income, accounts, insights] = await Promise.all([
      analyticsService.getFinancialSummary(userId, dateRange),
      analyticsService.getCategoryAnalysis(userId, dateRange, 'expense'),
      analyticsService.getCategoryAnalysis(userId, dateRange, 'income'),
      analyticsService.getAccountAnalysis(userId, dateRange),
      includeInsights ? analyticsService.getInsights(userId, dateRange) : { success: true, data: [] }
    ]);

    return {
      summary: summary.success ? summary.data : null,
      expenses: expenses.success ? expenses.data : [],
      income: income.success ? income.data : [],
      accounts: accounts.success ? accounts.data : [],
      insights: insights.success ? insights.data : [],
      metadata: {
        exportedAt: new Date().toISOString(),
        dateRange,
        userId
      }
    };
  }

  // Finansal özet verilerini topla
  async collectFinancialSummaryData(userId, dateRange) {
    const summary = await analyticsService.getFinancialSummary(userId, dateRange);
    
    return {
      summary: summary.success ? summary.data : null,
      metadata: {
        exportedAt: new Date().toISOString(),
        dateRange,
        userId
      }
    };
  }

  // İşlem verilerini topla
  async collectTransactionData(userId, dateRange) {
    // Bu fonksiyon transaction service'den veri alacak
    // Şimdilik mock data döndürüyoruz
    return {
      transactions: [],
      metadata: {
        exportedAt: new Date().toISOString(),
        dateRange,
        userId
      }
    };
  }

  // Kategori verilerini topla
  async collectCategoryData(userId, dateRange) {
    const [expenses, income] = await Promise.all([
      analyticsService.getCategoryAnalysis(userId, dateRange, 'expense'),
      analyticsService.getCategoryAnalysis(userId, dateRange, 'income')
    ]);

    return {
      expenseCategories: expenses.success ? expenses.data : [],
      incomeCategories: income.success ? income.data : [],
      metadata: {
        exportedAt: new Date().toISOString(),
        dateRange,
        userId
      }
    };
  }

  // Hesap verilerini topla
  async collectAccountData(userId, dateRange) {
    const accounts = await analyticsService.getAccountAnalysis(userId, dateRange);
    
    return {
      accounts: accounts.success ? accounts.data : [],
      metadata: {
        exportedAt: new Date().toISOString(),
        dateRange,
        userId
      }
    };
  }

  // Trend verilerini topla
  async collectTrendData(userId, dateRange) {
    const [expenseTrends, incomeTrends] = await Promise.all([
      analyticsService.getTrendAnalysis(userId, dateRange, 'expense'),
      analyticsService.getTrendAnalysis(userId, dateRange, 'income')
    ]);

    return {
      expenseTrends: expenseTrends.success ? expenseTrends.data : [],
      incomeTrends: incomeTrends.success ? incomeTrends.data : [],
      metadata: {
        exportedAt: new Date().toISOString(),
        dateRange,
        userId
      }
    };
  }

  // Öneri verilerini topla
  async collectInsightData(userId, dateRange) {
    const insights = await analyticsService.getInsights(userId, dateRange);
    
    return {
      insights: insights.success ? insights.data : [],
      metadata: {
        exportedAt: new Date().toISOString(),
        dateRange,
        userId
      }
    };
  }

  // Export için formatla
  async formatForExport(data, format) {
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
        return this.convertToJSON(data);
      case 'xlsx':
        return this.convertToXLSX(data);
      case 'pdf':
        return this.convertToPDF(data);
      case 'html':
        return this.convertToHTML(data);
      default:
        return data;
    }
  }

  // CSV formatına dönüştür
  convertToCSV(data) {
    if (!data) return '';

    let csv = '';
    
    // Metadata
    if (data.metadata) {
      csv += 'Metadata\n';
      csv += 'Exported At,Date Range,User ID\n';
      csv += `${data.metadata.exportedAt},${data.metadata.dateRange},${data.metadata.userId}\n\n`;
    }

    // Financial Summary
    if (data.summary) {
      csv += 'Financial Summary\n';
      csv += 'Income,Expenses,Net,Savings Rate\n';
      csv += `${data.summary.income},${data.summary.expenses},${data.summary.net},${data.summary.savingsRate}%\n\n`;
    }

    // Expense Categories
    if (data.expenses && data.expenses.length > 0) {
      csv += 'Expense Categories\n';
      csv += 'Category,Amount,Count,Percentage\n';
      const totalExpenses = data.expenses.reduce((sum, cat) => sum + cat.amount, 0);
      data.expenses.forEach(cat => {
        const percentage = totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(2) : 0;
        csv += `${cat.name},${cat.amount},${cat.count},${percentage}%\n`;
      });
      csv += '\n';
    }

    // Income Categories
    if (data.income && data.income.length > 0) {
      csv += 'Income Categories\n';
      csv += 'Category,Amount,Count,Percentage\n';
      const totalIncome = data.income.reduce((sum, cat) => sum + cat.amount, 0);
      data.income.forEach(cat => {
        const percentage = totalIncome > 0 ? ((cat.amount / totalIncome) * 100).toFixed(2) : 0;
        csv += `${cat.name},${cat.amount},${cat.count},${percentage}%\n`;
      });
      csv += '\n';
    }

    // Accounts
    if (data.accounts && data.accounts.length > 0) {
      csv += 'Accounts\n';
      csv += 'Account,Income,Expenses,Net,Balance\n';
      data.accounts.forEach(acc => {
        csv += `${acc.name},${acc.income},${acc.expenses},${acc.net},${acc.balance}\n`;
      });
      csv += '\n';
    }

    // Insights
    if (data.insights && data.insights.length > 0) {
      csv += 'Insights\n';
      csv += 'Type,Title,Message,Priority\n';
      data.insights.forEach(insight => {
        csv += `${insight.type},${insight.title},"${insight.message}",${insight.priority}\n`;
      });
      csv += '\n';
    }

    return csv;
  }

  // JSON formatına dönüştür
  convertToJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  // XLSX formatına dönüştür (mock implementation)
  convertToXLSX(data) {
    // Gerçek XLSX oluşturma için xlsx kütüphanesi kullanılabilir
    // Şimdilik CSV olarak döndürüyoruz
    return this.convertToCSV(data);
  }

  // PDF formatına dönüştür (mock implementation)
  convertToPDF(data) {
    // Gerçek PDF oluşturma için react-native-html-to-pdf kullanılabilir
    // Şimdilik HTML olarak döndürüyoruz
    return this.convertToHTML(data);
  }

  // HTML formatına dönüştür
  convertToHTML(data) {
    if (!data) return '';

    let html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FinanceFlow Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: linear-gradient(135deg, #6C63FF, #4ECDC4); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #2D3748; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; }
          .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .metric { display: inline-block; margin: 10px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #6C63FF; }
          .metric-label { color: #718096; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E2E8F0; }
          th { background-color: #F7FAFC; font-weight: 600; }
          .positive { color: #48BB78; }
          .negative { color: #F56565; }
          .insight { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
          .insight.success { background-color: #F0FFF4; border-left-color: #48BB78; }
          .insight.warning { background-color: #FFFBEB; border-left-color: #ED8936; }
          .insight.danger { background-color: #FED7D7; border-left-color: #F56565; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 FinanceFlow Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
    `;

    // Metadata
    if (data.metadata) {
      html += `
        <div class="section">
          <h2>📋 Report Information</h2>
          <div class="card">
            <p><strong>Exported At:</strong> ${new Date(data.metadata.exportedAt).toLocaleString('tr-TR')}</p>
            <p><strong>Date Range:</strong> ${data.metadata.dateRange}</p>
            <p><strong>User ID:</strong> ${data.metadata.userId}</p>
          </div>
        </div>
      `;
    }

    // Financial Summary
    if (data.summary) {
      html += `
        <div class="section">
          <h2>💰 Financial Summary</h2>
          <div class="card">
            <div class="metric">
              <div class="metric-value positive">${formatCurrency(data.summary.income)}</div>
              <div class="metric-label">Total Income</div>
            </div>
            <div class="metric">
              <div class="metric-value negative">${formatCurrency(data.summary.expenses)}</div>
              <div class="metric-label">Total Expenses</div>
            </div>
            <div class="metric">
              <div class="metric-value ${data.summary.net >= 0 ? 'positive' : 'negative'}">${formatCurrency(data.summary.net)}</div>
              <div class="metric-label">Net Amount</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.summary.savingsRate.toFixed(1)}%</div>
              <div class="metric-label">Savings Rate</div>
            </div>
          </div>
        </div>
      `;
    }

    // Expense Categories
    if (data.expenses && data.expenses.length > 0) {
      html += `
        <div class="section">
          <h2>📉 Expense Categories</h2>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      const totalExpenses = data.expenses.reduce((sum, cat) => sum + cat.amount, 0);
      data.expenses.forEach(cat => {
        const percentage = totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(2) : 0;
        html += `
          <tr>
            <td>${cat.name}</td>
            <td>${formatCurrency(cat.amount)}</td>
            <td>${cat.count}</td>
            <td>${percentage}%</td>
          </tr>
        `;
      });
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Income Categories
    if (data.income && data.income.length > 0) {
      html += `
        <div class="section">
          <h2>📈 Income Categories</h2>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      const totalIncome = data.income.reduce((sum, cat) => sum + cat.amount, 0);
      data.income.forEach(cat => {
        const percentage = totalIncome > 0 ? ((cat.amount / totalIncome) * 100).toFixed(2) : 0;
        html += `
          <tr>
            <td>${cat.name}</td>
            <td>${formatCurrency(cat.amount)}</td>
            <td>${cat.count}</td>
            <td>${percentage}%</td>
          </tr>
        `;
      });
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Accounts
    if (data.accounts && data.accounts.length > 0) {
      html += `
        <div class="section">
          <h2>🏦 Accounts</h2>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      data.accounts.forEach(acc => {
        html += `
          <tr>
            <td>${acc.name}</td>
            <td class="positive">${formatCurrency(acc.income)}</td>
            <td class="negative">${formatCurrency(acc.expenses)}</td>
            <td class="${acc.net >= 0 ? 'positive' : 'negative'}">${formatCurrency(acc.net)}</td>
            <td>${formatCurrency(acc.balance)}</td>
          </tr>
        `;
      });
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Insights
    if (data.insights && data.insights.length > 0) {
      html += `
        <div class="section">
          <h2>💡 Insights & Recommendations</h2>
      `;
      
      data.insights.forEach(insight => {
        html += `
          <div class="insight ${insight.type}">
            <h3>${insight.title}</h3>
            <p>${insight.message}</p>
            <small>Priority: ${insight.priority}</small>
          </div>
        `;
      });
      
      html += `</div>`;
    }

    html += `
      </body>
      </html>
    `;

    return html;
  }

  // Dosyayı kaydet
  async saveToFile(fileName, content, format) {
    const extension = this.getFileExtension(format);
    const fullFileName = `${fileName}.${extension}`;
    const filePath = `${this.exportDir}${fullFileName}`;
    
    try {
      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8
      });
      return filePath;
    } catch (error) {
      console.error('Save file error:', error);
      throw new Error('Dosya kaydedilemedi');
    }
  }

  // Dosya uzantısını al
  getFileExtension(format) {
    switch (format) {
      case 'csv': return 'csv';
      case 'json': return 'json';
      case 'xlsx': return 'xlsx';
      case 'pdf': return 'pdf';
      case 'html': return 'html';
      default: return 'txt';
    }
  }

  // Dosya boyutunu al
  async getFileSize(filePath) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.size || 0;
    } catch (error) {
      console.error('Get file size error:', error);
      return 0;
    }
  }

  // Dosyayı paylaş
  async shareFile(filePath) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(filePath);
      return { success: true };
    } catch (error) {
      console.error('Share file error:', error);
      return { success: false, error: 'Dosya paylaşılamadı' };
    }
  }

  // Dosyayı email ile gönder (mock implementation)
  async emailFile(filePath, emailConfig) {
    // Gerçek email gönderimi için expo-mail-composer kullanılabilir
    // Şimdilik shareFile kullanıyoruz
    return this.shareFile(filePath);
  }

  // Export geçmişini al
  async getExportHistory() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.exportDir);
      const exportHistory = [];
      
      for (const file of files) {
        const filePath = `${this.exportDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists) {
          exportHistory.push({
            fileName: file,
            filePath,
            size: fileInfo.size,
            createdAt: fileInfo.modificationTime,
            format: this.getFileExtensionFromFileName(file)
          });
        }
      }
      
      return exportHistory.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Get export history error:', error);
      return [];
    }
  }

  // Dosya adından format uzantısını al
  getFileExtensionFromFileName(fileName) {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'unknown';
  }

  // Export dosyasını sil
  async deleteExportFile(fileName) {
    try {
      const filePath = `${this.exportDir}${fileName}`;
      await FileSystem.deleteAsync(filePath);
      return { success: true };
    } catch (error) {
      console.error('Delete export file error:', error);
      return { success: false, error: 'Dosya silinemedi' };
    }
  }

  // Tüm export dosyalarını temizle
  async clearAllExports() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.exportDir);
      
      for (const file of files) {
        const filePath = `${this.exportDir}${file}`;
        await FileSystem.deleteAsync(filePath);
      }
      
      return { success: true, message: 'Tüm export dosyaları temizlendi' };
    } catch (error) {
      console.error('Clear all exports error:', error);
      return { success: false, error: 'Export dosyaları temizlenemedi' };
    }
  }

  // Export istatistiklerini al
  async getExportStats() {
    try {
      const history = await this.getExportHistory();
      const stats = {
        totalExports: history.length,
        totalSize: history.reduce((sum, file) => sum + file.size, 0),
        formatBreakdown: {},
        recentExports: history.slice(0, 5)
      };
      
      // Format breakdown
      history.forEach(file => {
        const format = file.format;
        if (!stats.formatBreakdown[format]) {
          stats.formatBreakdown[format] = { count: 0, totalSize: 0 };
        }
        stats.formatBreakdown[format].count += 1;
        stats.formatBreakdown[format].totalSize += file.size;
      });
      
      return stats;
    } catch (error) {
      console.error('Get export stats error:', error);
      return null;
    }
  }

  // Export template oluştur
  createExportTemplate() {
    return {
      dataType: 'all',
      dateRange: 'month',
      format: 'csv',
      includeCharts: false,
      includeInsights: true,
      categories: [],
      accounts: [],
      minAmount: null,
      maxAmount: null
    };
  }

  // Export konfigürasyonunu doğrula
  validateExportConfig(config) {
    const errors = [];
    
    if (!config.dataType) {
      errors.push('Veri türü belirtilmelidir');
    }
    
    if (!config.dateRange) {
      errors.push('Tarih aralığı belirtilmelidir');
    }
    
    if (!config.format) {
      errors.push('Export formatı belirtilmelidir');
    }
    
    if (config.minAmount !== null && config.minAmount < 0) {
      errors.push('Minimum tutar negatif olamaz');
    }
    
    if (config.maxAmount !== null && config.maxAmount < 0) {
      errors.push('Maksimum tutar negatif olamaz');
    }
    
    if (config.minAmount !== null && config.maxAmount !== null && config.minAmount > config.maxAmount) {
      errors.push('Minimum tutar maksimum tutardan büyük olamaz');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new ExportService();
