// FinanceFlow - Data Backup & Restore System
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

class DataBackupManager {
  constructor() {
    this.backupDir = `${FileSystem.documentDirectory}backups/`;
    this.ensureBackupDirectory();
  }

  // Backup dizinini oluştur
  async ensureBackupDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.backupDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.backupDir, { intermediates: true });
        console.log('📁 Backup dizini oluşturuldu');
      }
    } catch (error) {
      console.error('Backup dizin oluşturma hatası:', error);
    }
  }

  // Tüm verileri yedekle
  async createBackup() {
    try {
      console.log('🔄 Backup başlatılıyor...');
      
      // AsyncStorage'dan tüm verileri al
      const allData = await this.getAllStoredData();
      
      // Backup metadata ekle
      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        device: {
          platform: 'android',
          version: '1.0.0'
        },
        data: allData
      };
      
      // Backup dosyasını oluştur
      const backupFileName = `financeflow_backup_${Date.now()}.json`;
      const backupPath = `${this.backupDir}${backupFileName}`;
      
      await FileSystem.writeAsStringAsync(
        backupPath,
        JSON.stringify(backupData, null, 2)
      );
      
      console.log('✅ Backup oluşturuldu:', backupPath);
      
      return {
        success: true,
        path: backupPath,
        fileName: backupFileName,
        size: backupData.data.length
      };
    } catch (error) {
      console.error('Backup oluşturma hatası:', error);
      throw new Error(`Backup oluşturulamadı: ${error.message}`);
    }
  }

  // AsyncStorage'dan tüm verileri al
  async getAllStoredData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = {};
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            data[key] = value;
          }
        } catch (error) {
          console.warn(`Key okuma hatası (${key}):`, error);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Veri okuma hatası:', error);
      throw error;
    }
  }

  // Backup'ı paylaş
  async shareBackup(backupPath) {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupPath, {
          mimeType: 'application/json',
          dialogTitle: 'FinanceFlow Backup Paylaş'
        });
        return { success: true };
      } else {
        throw new Error('Sharing mevcut değil');
      }
    } catch (error) {
      console.error('Backup paylaşma hatası:', error);
      throw error;
    }
  }

  // Backup'ı email ile gönder (opsiyonel)
  async emailBackup(backupPath, email) {
    try {
      // Email attachment olarak gönder
      const subject = 'FinanceFlow Backup';
      const body = 'FinanceFlow uygulamasından yedeklenen veriler ekte bulunmaktadır.';
      
      // Email client'ı aç
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Bu kısım platform'a göre farklılık gösterebilir
      // Android için Intent kullanılabilir
      
      return { success: true, mailtoUrl };
    } catch (error) {
      console.error('Email backup hatası:', error);
      throw error;
    }
  }

  // Backup'dan veri geri yükle
  async restoreFromBackup(backupPath) {
    try {
      console.log('🔄 Backup geri yükleniyor...');
      
      // Backup dosyasını oku
      const backupContent = await FileSystem.readAsStringAsync(backupPath);
      const backupData = JSON.parse(backupContent);
      
      // Version kontrolü
      if (!backupData.version || !backupData.data) {
        throw new Error('Geçersiz backup formatı');
      }
      
      // Mevcut verileri temizle
      await this.clearAllData();
      
      // Backup verilerini geri yükle
      const restorePromises = Object.entries(backupData.data).map(([key, value]) => {
        return AsyncStorage.setItem(key, value);
      });
      
      await Promise.all(restorePromises);
      
      console.log('✅ Backup başarıyla geri yüklendi');
      
      return {
        success: true,
        restoredKeys: Object.keys(backupData.data).length,
        timestamp: backupData.timestamp
      };
    } catch (error) {
      console.error('Backup geri yükleme hatası:', error);
      throw new Error(`Backup geri yüklenemedi: ${error.message}`);
    }
  }

  // Dosya seçici ile backup geri yükle
  async restoreFromFilePicker() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        return await this.restoreFromBackup(result.uri);
      } else {
        throw new Error('Dosya seçilmedi');
      }
    } catch (error) {
      console.error('Dosya seçici hatası:', error);
      throw error;
    }
  }

  // Tüm verileri temizle
  async clearAllData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      console.log('🗑️ Tüm veriler temizlendi');
    } catch (error) {
      console.error('Veri temizleme hatası:', error);
      throw error;
    }
  }

  // Mevcut backup'ları listele
  async listBackups() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      const backupList = [];
      
      for (const file of backupFiles) {
        try {
          const filePath = `${this.backupDir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists) {
            backupList.push({
              name: file,
              path: filePath,
              size: fileInfo.size,
              modificationTime: fileInfo.modificationTime
            });
          }
        } catch (error) {
          console.warn(`Backup dosya bilgisi alınamadı (${file}):`, error);
        }
      }
      
      // Tarihe göre sırala (en yeni önce)
      backupList.sort((a, b) => b.modificationTime - a.modificationTime);
      
      return backupList;
    } catch (error) {
      console.error('Backup listesi alma hatası:', error);
      return [];
    }
  }

  // Backup'ı sil
  async deleteBackup(backupPath) {
    try {
      await FileSystem.deleteAsync(backupPath);
      console.log('🗑️ Backup silindi:', backupPath);
      return { success: true };
    } catch (error) {
      console.error('Backup silme hatası:', error);
      throw error;
    }
  }

  // Backup'ı doğrula
  async validateBackup(backupPath) {
    try {
      const backupContent = await FileSystem.readAsStringAsync(backupPath);
      const backupData = JSON.parse(backupContent);
      
      // Gerekli alanları kontrol et
      const requiredFields = ['version', 'timestamp', 'data'];
      const missingFields = requiredFields.filter(field => !backupData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Eksik alanlar: ${missingFields.join(', ')}`);
      }
      
      // Data boyutunu kontrol et
      if (Object.keys(backupData.data).length === 0) {
        throw new Error('Backup verisi boş');
      }
      
      return {
        valid: true,
        version: backupData.version,
        timestamp: backupData.timestamp,
        dataSize: Object.keys(backupData.data).length
      };
    } catch (error) {
      console.error('Backup doğrulama hatası:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Otomatik backup oluştur
  async createAutoBackup() {
    try {
      const backupList = await this.listBackups();
      
      // Eski backup'ları temizle (5'ten fazla varsa)
      if (backupList.length >= 5) {
        const oldBackups = backupList.slice(5);
        for (const backup of oldBackups) {
          await this.deleteBackup(backup.path);
        }
        console.log('🧹 Eski backup\'lar temizlendi');
      }
      
      // Yeni backup oluştur
      return await this.createBackup();
    } catch (error) {
      console.error('Otomatik backup hatası:', error);
      throw error;
    }
  }

  // Backup istatistikleri
  async getBackupStats() {
    try {
      const backupList = await this.listBackups();
      const totalSize = backupList.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        totalBackups: backupList.length,
        totalSize: totalSize,
        averageSize: backupList.length > 0 ? totalSize / backupList.length : 0,
        oldestBackup: backupList.length > 0 ? backupList[backupList.length - 1].modificationTime : null,
        newestBackup: backupList.length > 0 ? backupList[0].modificationTime : null
      };
    } catch (error) {
      console.error('Backup istatistik hatası:', error);
      return null;
    }
  }
}

// Singleton instance
const dataBackupManager = new DataBackupManager();

export default dataBackupManager;
