// FinanceFlow - Offline Sync Mechanism
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class OfflineSyncManager {
  constructor() {
    this.syncQueue = [];
    this.isOnline = true;
    this.syncInProgress = false;
    this.syncInterval = null;
    this.initializeNetworkListener();
  }

  // Network durumunu dinle
  initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      // Offline'dan online'a geçiş
      if (wasOffline && this.isOnline) {
        console.log('🟢 Online - Sync başlatılıyor...');
        this.processSyncQueue();
      } else if (!this.isOnline) {
        console.log('🔴 Offline - Sync duraklatıldı');
      }
    });
  }

  // Sync queue'ya ekle
  async addToSyncQueue(operation) {
    try {
      const syncItem = {
        id: Date.now().toString(),
        operation,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3
      };

      this.syncQueue.push(syncItem);
      await this.saveSyncQueue();
      
      console.log('📝 Sync queue\'ya eklendi:', operation.type);
      
      // Online ise hemen sync et
      if (this.isOnline && !this.syncInProgress) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('Sync queue ekleme hatası:', error);
    }
  }

  // Sync queue'yu kaydet
  async saveSyncQueue() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Sync queue kaydetme hatası:', error);
    }
  }

  // Sync queue'yu yükle
  async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        console.log('📋 Sync queue yüklendi:', this.syncQueue.length, 'item');
      }
    } catch (error) {
      console.error('Sync queue yükleme hatası:', error);
    }
  }

  // Sync queue'yu işle
  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Sync başlatılıyor...', this.syncQueue.length, 'item');

    try {
      const itemsToProcess = [...this.syncQueue];
      
      for (const item of itemsToProcess) {
        if (item.retryCount >= item.maxRetries) {
          console.warn('⚠️ Max retry limit:', item.operation.type);
          this.removeFromQueue(item.id);
          continue;
        }

        try {
          await this.processSyncItem(item);
          this.removeFromQueue(item.id);
        } catch (error) {
          console.error('Sync item hatası:', error);
          item.retryCount++;
          await this.saveSyncQueue();
        }
      }
    } catch (error) {
      console.error('Sync işleme hatası:', error);
    } finally {
      this.syncInProgress = false;
      console.log('✅ Sync tamamlandı');
    }
  }

  // Sync item'ı işle
  async processSyncItem(item) {
    const { operation } = item;
    
    switch (operation.type) {
      case 'CREATE_TRANSACTION':
        await this.syncCreateTransaction(operation.data);
        break;
      case 'UPDATE_TRANSACTION':
        await this.syncUpdateTransaction(operation.data);
        break;
      case 'DELETE_TRANSACTION':
        await this.syncDeleteTransaction(operation.data);
        break;
      case 'CREATE_CATEGORY':
        await this.syncCreateCategory(operation.data);
        break;
      case 'UPDATE_CATEGORY':
        await this.syncUpdateCategory(operation.data);
        break;
      case 'CREATE_ACCOUNT':
        await this.syncCreateAccount(operation.data);
        break;
      case 'UPDATE_ACCOUNT':
        await this.syncUpdateAccount(operation.data);
        break;
      default:
        console.warn('Bilinmeyen sync operation:', operation.type);
    }
  }

  // Transaction sync işlemleri
  async syncCreateTransaction(data) {
    // Mock sync - başarılı olarak döndür
    console.log('✅ Transaction sync edildi (mock):', data.id);
    return { success: true };
  }

  async syncUpdateTransaction(data) {
    // Mock sync - başarılı olarak döndür
    console.log('✅ Transaction update sync edildi (mock):', data.id);
    return { success: true };
  }

  async syncDeleteTransaction(data) {
    // Mock sync - başarılı olarak döndür
    console.log('✅ Transaction delete sync edildi (mock):', data.id);
    return { success: true };
  }

  // Category sync işlemleri
  async syncCreateCategory(data) {
    const { categoryService } = await import('../services/categoryService');
    const result = await categoryService.createCategory(data);
    
    if (!result.success) {
      throw new Error(`Category sync hatası: ${result.error?.message}`);
    }
    
    console.log('✅ Category sync edildi:', data.name);
  }

  async syncUpdateCategory(data) {
    const { categoryService } = await import('../services/categoryService');
    const result = await categoryService.updateCategory(data.id, data.updates);
    
    if (!result.success) {
      throw new Error(`Category update sync hatası: ${result.error?.message}`);
    }
    
    console.log('✅ Category update sync edildi:', data.id);
  }

  // Account sync işlemleri
  async syncCreateAccount(data) {
    const { accountService } = await import('../services/accountService');
    const result = await accountService.createAccount(data);
    
    if (!result.success) {
      throw new Error(`Account sync hatası: ${result.error?.message}`);
    }
    
    console.log('✅ Account sync edildi:', data.name);
  }

  async syncUpdateAccount(data) {
    const { accountService } = await import('../services/accountService');
    const result = await accountService.updateAccount(data.id, data.updates);
    
    if (!result.success) {
      throw new Error(`Account update sync hatası: ${result.error?.message}`);
    }
    
    console.log('✅ Account update sync edildi:', data.id);
  }

  // Queue'dan item kaldır
  async removeFromQueue(itemId) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== itemId);
    await this.saveSyncQueue();
  }

  // Manuel sync başlat
  async manualSync() {
    if (!this.isOnline) {
      throw new Error('Offline - sync yapılamaz');
    }
    
    await this.processSyncQueue();
  }

  // Sync durumunu al
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      pendingItems: this.syncQueue.map(item => ({
        type: item.operation.type,
        timestamp: item.timestamp,
        retryCount: item.retryCount
      }))
    };
  }

  // Sync queue'yu temizle
  async clearSyncQueue() {
    this.syncQueue = [];
    await this.saveSyncQueue();
    console.log('🗑️ Sync queue temizlendi');
  }

  // Periyodik sync başlat
  startPeriodicSync(intervalMs = 30000) { // 30 saniye
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, intervalMs);
    
    console.log('⏰ Periyodik sync başlatıldı:', intervalMs, 'ms');
  }

  // Periyodik sync'i durdur
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Periyodik sync durduruldu');
    }
  }

  // Cleanup
  cleanup() {
    this.stopPeriodicSync();
    NetInfo.removeEventListener(this.networkListener);
  }
}

// Singleton instance
const offlineSyncManager = new OfflineSyncManager();

export default offlineSyncManager;
