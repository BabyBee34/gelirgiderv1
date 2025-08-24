// FinanceFlow - Recurring Transactions System
import { transactionService } from '../services/transactionService';
import { supabase, TABLES } from '../config/supabase';

class RecurringTransactionsManager {
  constructor() {
    this.patterns = {
      daily: { days: 1 },
      weekly: { days: 7 },
      biweekly: { days: 14 },
      monthly: { months: 1 },
      quarterly: { months: 3 },
      yearly: { years: 1 }
    };
  }

  // Recurring transaction oluştur
  async createRecurringTransaction(recurringData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .insert([{
          user_id: recurringData.user_id,
          account_id: recurringData.account_id,
          category_id: recurringData.category_id,
          amount: recurringData.amount,
          type: recurringData.type,
          description: recurringData.description,
          frequency: recurringData.frequency,
          start_date: recurringData.start_date,
          end_date: recurringData.end_date,
          next_occurrence: recurringData.start_date,
          is_active: true,
          last_processed: null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // İlk transaction'ı oluştur
      await this.processRecurringTransaction(data);

      return { success: true, data };
    } catch (error) {
      console.error('Recurring transaction oluşturma hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Recurring transaction güncelle
  async updateRecurringTransaction(recurringId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .update(updates)
        .eq('id', recurringId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Recurring transaction güncelleme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Recurring transaction sil
  async deleteRecurringTransaction(recurringId) {
    try {
      const { error } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .delete()
        .eq('id', recurringId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Recurring transaction silme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Tüm recurring transaction'ları getir
  async getRecurringTransactions(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .select(`
          *,
          category:categories(name, icon, color),
          account:accounts(name, type)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('next_occurrence');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Recurring transactions getirme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Recurring transaction'ları işle
  async processRecurringTransactions() {
    try {
      console.log('🔄 Recurring transactions işleniyor...');
      
      // Aktif recurring transaction'ları getir
      const { data: recurringTransactions, error } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .select('*')
        .eq('is_active', true)
        .lte('next_occurrence', new Date().toISOString());

      if (error) throw error;

      let processedCount = 0;
      let errorCount = 0;

      for (const recurring of recurringTransactions) {
        try {
          await this.processRecurringTransaction(recurring);
          processedCount++;
        } catch (error) {
          console.error(`Recurring transaction işleme hatası (${recurring.id}):`, error);
          errorCount++;
        }
      }

      console.log(`✅ ${processedCount} recurring transaction işlendi, ${errorCount} hata`);

      return {
        success: true,
        processedCount,
        errorCount
      };
    } catch (error) {
      console.error('Recurring transactions işleme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Tek recurring transaction'ı işle
  async processRecurringTransaction(recurring) {
    try {
      // Transaction oluştur
      const transactionData = {
        user_id: recurring.user_id,
        account_id: recurring.account_id,
        category_id: recurring.category_id,
        amount: recurring.amount,
        type: recurring.type,
        description: recurring.description,
        date: recurring.next_occurrence,
        is_recurring: true,
        recurring_id: recurring.id,
        created_at: new Date().toISOString()
      };

      const result = await transactionService.createTransaction(transactionData);
      
      if (!result.success) {
        throw new Error(`Transaction oluşturulamadı: ${result.error}`);
      }

      // Next occurrence'ı hesapla
      const nextOccurrence = this.calculateNextOccurrence(
        recurring.next_occurrence,
        recurring.frequency
      );

      // Recurring transaction'ı güncelle
      const updates = {
        next_occurrence: nextOccurrence,
        last_processed: new Date().toISOString()
      };

      // End date kontrolü
      if (recurring.end_date && new Date(nextOccurrence) > new Date(recurring.end_date)) {
        updates.is_active = false;
        console.log(`🔄 Recurring transaction ${recurring.id} sona erdi`);
      }

      await this.updateRecurringTransaction(recurring.id, updates);

      return { success: true, transaction: result.data };
    } catch (error) {
      console.error('Recurring transaction işleme hatası:', error);
      throw error;
    }
  }

  // Sonraki occurrence'ı hesapla
  calculateNextOccurrence(currentDate, frequency) {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default monthly
    }
    
    return date.toISOString();
  }

  // Recurring transaction durumunu kontrol et
  async checkRecurringTransactionStatus(recurringId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .select('*')
        .eq('id', recurringId)
        .single();

      if (error) throw error;

      const status = {
        id: data.id,
        isActive: data.is_active,
        nextOccurrence: data.next_occurrence,
        lastProcessed: data.last_processed,
        daysUntilNext: this.calculateDaysUntilNext(data.next_occurrence),
        shouldProcess: this.shouldProcessTransaction(data.next_occurrence)
      };

      return { success: true, status };
    } catch (error) {
      console.error('Recurring transaction durum kontrolü hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Sonraki occurrence'a kaç gün kaldığını hesapla
  calculateDaysUntilNext(nextOccurrence) {
    const now = new Date();
    const next = new Date(nextOccurrence);
    const diffTime = next - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Transaction'ın işlenip işlenmeyeceğini kontrol et
  shouldProcessTransaction(nextOccurrence) {
    const now = new Date();
    const next = new Date(nextOccurrence);
    return next <= now;
  }

  // Recurring transaction'ı duraklat
  async pauseRecurringTransaction(recurringId) {
    try {
      const result = await this.updateRecurringTransaction(recurringId, {
        is_active: false
      });

      if (result.success) {
        console.log(`⏸️ Recurring transaction ${recurringId} duraklatıldı`);
      }

      return result;
    } catch (error) {
      console.error('Recurring transaction duraklatma hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Recurring transaction'ı devam ettir
  async resumeRecurringTransaction(recurringId) {
    try {
      const result = await this.updateRecurringTransaction(recurringId, {
        is_active: true
      });

      if (result.success) {
        console.log(`▶️ Recurring transaction ${recurringId} devam ettirildi`);
      }

      return result;
    } catch (error) {
      console.error('Recurring transaction devam ettirme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Recurring transaction'ı sıfırla
  async resetRecurringTransaction(recurringId) {
    try {
      const { data: recurring, error } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .select('*')
        .eq('id', recurringId)
        .single();

      if (error) throw error;

      const updates = {
        next_occurrence: recurring.start_date,
        last_processed: null
      };

      const result = await this.updateRecurringTransaction(recurringId, updates);

      if (result.success) {
        console.log(`🔄 Recurring transaction ${recurringId} sıfırlandı`);
      }

      return result;
    } catch (error) {
      console.error('Recurring transaction sıfırlama hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Recurring transaction istatistikleri
  async getRecurringTransactionStats(userId) {
    try {
      const { data: recurringTransactions, error } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: recurringTransactions.length,
        active: recurringTransactions.filter(t => t.is_active).length,
        paused: recurringTransactions.filter(t => !t.is_active).length,
        byFrequency: this.groupByFrequency(recurringTransactions),
        totalAmount: this.calculateTotalAmount(recurringTransactions),
        nextOccurrences: this.getNextOccurrences(recurringTransactions)
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Recurring transaction istatistikleri hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Frequency'a göre grupla
  groupByFrequency(transactions) {
    const groups = {};
    transactions.forEach(transaction => {
      const frequency = transaction.frequency;
      if (!groups[frequency]) {
        groups[frequency] = [];
      }
      groups[frequency].push(transaction);
    });
    return groups;
  }

  // Toplam tutarı hesapla
  calculateTotalAmount(transactions) {
    return transactions.reduce((total, transaction) => {
      return total + parseFloat(transaction.amount);
    }, 0);
  }

  // Sonraki occurrence'ları getir
  getNextOccurrences(transactions) {
    return transactions
      .filter(t => t.is_active)
      .sort((a, b) => new Date(a.next_occurrence) - new Date(b.next_occurrence))
      .slice(0, 5); // Sadece ilk 5'i
  }

  // Recurring transaction template'leri
  getRecurringTemplates() {
    return [
      {
        name: 'Aylık Faturalar',
        frequency: 'monthly',
        description: 'Elektrik, su, doğalgaz faturaları',
        icon: 'receipt',
        color: '#F44336'
      },
      {
        name: 'Haftalık Market',
        frequency: 'weekly',
        description: 'Düzenli market alışverişi',
        icon: 'shopping-cart',
        color: '#4CAF50'
      },
      {
        name: 'Yıllık Sigorta',
        frequency: 'yearly',
        description: 'Araç, ev sigortası ödemeleri',
        icon: 'shield',
        color: '#2196F3'
      },
      {
        name: '3 Aylık Abonelikler',
        frequency: 'quarterly',
        description: 'Netflix, Spotify vb. abonelikler',
        icon: 'subscription',
        color: '#9C27B0'
      }
    ];
  }
}

// Singleton instance
const recurringTransactionsManager = new RecurringTransactionsManager();

export default recurringTransactionsManager;
