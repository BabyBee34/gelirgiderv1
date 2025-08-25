// FinanceFlow - Recurring Transaction Service
// Gelişmiş sabit gelir/gider yönetimi
import { supabase } from '../config/supabase';

const recurringTransactionService = {
  // Tüm sabit işlemleri getir
  async getRecurringTransactions(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          category:categories(*),
          account:accounts(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('next_due_date', { ascending: true });

      if (error) {
        console.error('Supabase getRecurringTransactions error:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('getRecurringTransactions genel hata:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Yeni sabit işlem oluştur
  async createRecurringTransaction(transactionData) {
    try {
      // Debug: Gelen veriyi kontrol et
      console.log('createRecurringTransaction - Gelen veri:', transactionData);
      console.log('createRecurringTransaction - name değeri:', transactionData.name);
      console.log('createRecurringTransaction - name type:', typeof transactionData.name);

      // Name alanı yoksa description'dan al, o da yoksa varsayılan değer kullan
      const transactionName = transactionData.name || transactionData.description || `Sabit ${transactionData.type === 'income' ? 'Gelir' : 'Gider'}`;
      
      console.log('createRecurringTransaction - Kullanılacak name:', transactionName);

      // Name kontrolü
      if (!transactionName || transactionName.trim() === '') {
        throw new Error('Name alanı boş olamaz');
      }

      // Tarih hesaplamaları
      const { nextDueDate, dayOfWeek, dayOfMonth, monthOfYear } = recurringTransactionService.calculateNextDueDate(
        transactionData.frequency,
        transactionData.start_date,
        transactionData.day_of_week,
        transactionData.day_of_month,
        transactionData.month_of_year
      );

      const insertData = {
        user_id: transactionData.user_id,
        account_id: transactionData.account_id,
        category_id: transactionData.category_id,
        name: transactionName.trim(),
        description: transactionData.description,
        type: transactionData.type,
        amount: transactionData.amount,
        frequency: transactionData.frequency,
        start_date: transactionData.start_date,
        next_due_date: nextDueDate,
        day_of_week: dayOfWeek,
        day_of_month: dayOfMonth,
        month_of_year: monthOfYear,
        auto_execute: transactionData.auto_execute || false,
        requires_confirmation: transactionData.requires_confirmation || false,
        confirmation_threshold: transactionData.confirmation_threshold || 1000.00,
        is_active: true
      };

      console.log('createRecurringTransaction - Insert edilecek veri:', insertData);

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase createRecurringTransaction error:', error);
        return {
          success: false,
          error: error.message,
          data: null
        };
      }

      // Eğer onay gerekiyorsa hemen bildirim oluştur
      if (insertData.requires_confirmation || insertData.amount >= insertData.confirmation_threshold) {
        await recurringTransactionService.createConfirmationNotification(
          data.id,
          transactionData.user_id,
          insertData.type,
          insertData.amount,
          insertData.name
        );
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('createRecurringTransaction genel hata:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // Sonraki vade tarihini hesapla
  calculateNextDueDate(frequency, startDate, dayOfWeek, dayOfMonth, monthOfYear) {
    const start = new Date(startDate);
    let nextDue = new Date(start);
    
    let dayOfWeekResult = null;
    let dayOfMonthResult = null;
    let monthOfYearResult = null;

    switch (frequency) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + 1);
        break;
        
      case 'weekly':
        if (dayOfWeek) {
          dayOfWeekResult = dayOfWeek;
          const currentDay = nextDue.getDay();
          const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
          nextDue.setDate(nextDue.getDate() + daysToAdd);
        } else {
          nextDue.setDate(nextDue.getDate() + 7);
        }
        break;
        
      case 'monthly':
        if (dayOfMonth) {
          dayOfMonthResult = dayOfMonth;
          nextDue.setMonth(nextDue.getMonth() + 1);
          nextDue.setDate(dayOfMonth);
          
          // Ayın gün sayısına göre ayarla
          while (nextDue.getDate() !== dayOfMonth) {
            nextDue.setDate(nextDue.getDate() - 1);
          }
        } else {
          nextDue.setMonth(nextDue.getMonth() + 1);
        }
        break;
        
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
        
      case 'yearly':
        if (monthOfYear && dayOfMonth) {
          monthOfYearResult = monthOfYear;
          dayOfMonthResult = dayOfMonth;
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          nextDue.setMonth(monthOfYear - 1);
          nextDue.setDate(dayOfMonth);
          
          // Şubat 29 gibi durumlar için ayarla
          while (nextDue.getDate() !== dayOfMonth) {
            nextDue.setDate(nextDue.getDate() - 1);
          }
        } else {
          nextDue.setFullYear(nextDue.getFullYear() + 1);
        }
        break;
        
      default:
        nextDue.setMonth(nextDue.getMonth() + 1);
    }

    return {
      nextDueDate: nextDue.toISOString().split('T')[0],
      dayOfWeek: dayOfWeekResult,
      dayOfMonth: dayOfMonthResult,
      monthOfYear: monthOfYearResult
    };
  },

  // Sabit işlem güncelle
  async updateRecurringTransaction(id, updates) {
    try {
      // Eğer tarih alanları güncelleniyorsa, sonraki vade tarihini yeniden hesapla
      if (updates.frequency || updates.start_date || updates.day_of_week || updates.day_of_month || updates.month_of_year) {
        const { nextDueDate } = recurringTransactionService.calculateNextDueDate(
          updates.frequency || 'monthly',
          updates.start_date || new Date().toISOString().split('T')[0],
          updates.day_of_week,
          updates.day_of_month,
          updates.month_of_year
        );
        updates.next_due_date = nextDueDate;
      }

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateRecurringTransaction error:', error);
        return {
          success: false,
          error: error.message,
          data: null
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('updateRecurringTransaction genel hata:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // Sabit işlem sil
  async deleteRecurringTransaction(id) {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase deleteRecurringTransaction error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('deleteRecurringTransaction genel hata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Bekleyen onayları getir
  async getPendingConfirmations(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select(`
          *,
          recurring_transaction:recurring_transactions(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getPendingConfirmations error:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      console.log('Bekleyen onaylar:', data);
      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('getPendingConfirmations genel hata:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Maaş onayı
  async confirmSalary(notificationId, confirmed) {
    try {
      // Önce bildirimi ve ilişkili recurring transaction'ı getir
      const { data: notification, error: fetchError } = await supabase
        .from('notification_history')
        .select(`
          *,
          recurring_transaction:recurring_transactions(*)
        `)
        .eq('id', notificationId)
        .single();

      if (fetchError || !notification) {
        throw new Error('Bildirim bulunamadı');
      }

      console.log('Notification data:', notification);
      console.log('Recurring transaction data:', notification.recurring_transaction);

      // Recurring transaction verilerini kontrol et
      if (!notification.recurring_transaction) {
        throw new Error('Recurring transaction bilgisi bulunamadı');
      }

      // Eğer bildirim zaten onaylanmışsa hata ver
      if (notification.status === 'confirmed') {
        throw new Error('Bu bildirim zaten onaylanmış');
      }

      const recurringTransaction = notification.recurring_transaction;

      if (confirmed) {
        // Maaşı ana hesaba ekle
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: notification.user_id,
            account_id: recurringTransaction.account_id,
            category_id: recurringTransaction.category_id,
            type: 'income',
            amount: recurringTransaction.amount,
            description: recurringTransaction.description || recurringTransaction.name,
            date: new Date().toISOString().split('T')[0],
            is_recurring: true,
            recurring_transaction_id: notification.recurring_transaction_id
          });

        if (transactionError) {
          throw new Error('İşlem eklenirken hata: ' + transactionError.message);
        }

        // Ana hesap bakiyesini güncelle
        // Önce mevcut bakiyeyi al
        const { data: currentAccount, error: fetchError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', recurringTransaction.account_id)
          .single();

        if (fetchError) {
          throw new Error('Mevcut bakiye alınamadı: ' + fetchError.message);
        }

        const newBalance = currentAccount.balance + recurringTransaction.amount;

        const { error: accountError } = await supabase
          .from('accounts')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', recurringTransaction.account_id);

        if (accountError) {
          throw new Error('Hesap bakiyesi güncellenirken hata: ' + accountError.message);
        }

        // Bildirimi onaylandı olarak işaretle
        const { error: updateError } = await supabase
          .from('notification_history')
          .update({
            status: 'confirmed',
            salary_confirmed: true,
            salary_confirmation_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notificationId);

        if (updateError) {
          throw new Error('Bildirim güncellenirken hata: ' + updateError.message);
        }

        return {
          success: true,
          message: 'Maaş onaylandı ve ana hesaba eklendi'
        };
      } else {
        // Maaş yatmadı, ertesi gün tekrar sor
        const { error: updateError } = await supabase
          .from('notification_history')
          .update({
            status: 'rejected',
            salary_confirmed: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', notificationId);

        if (updateError) {
          throw new Error('Bildirim güncellenirken hata: ' + updateError.message);
        }

        return {
          success: true,
          message: 'Maaş yatmadı olarak işaretlendi, ertesi gün tekrar sorulacak'
        };
      }
    } catch (error) {
      console.error('confirmSalary genel hata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Büyük gider onayı
  async confirmLargeExpense(notificationId, confirmed) {
    try {
      // Önce bildirimi ve ilişkili recurring transaction'ı getir
      const { data: notification, error: fetchError } = await supabase
        .from('notification_history')
        .select(`
          *,
          recurring_transaction:recurring_transactions(*)
        `)
        .eq('id', notificationId)
        .single();

      if (fetchError || !notification) {
        throw new Error('Bildirim bulunamadı');
      }

      console.log('Notification data:', notification);
      console.log('Recurring transaction data:', notification.recurring_transaction);

      // Recurring transaction verilerini kontrol et
      if (!notification.recurring_transaction) {
        throw new Error('Recurring transaction bilgisi bulunamadı');
      }

      // Eğer bildirim zaten onaylanmışsa hata ver
      if (notification.status === 'confirmed') {
        throw new Error('Bu bildirim zaten onaylanmış');
      }

      const recurringTransaction = notification.recurring_transaction;

      if (confirmed) {
        // Gideri ana hesaptan düş
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: notification.user_id,
            account_id: recurringTransaction.account_id,
            category_id: recurringTransaction.category_id,
            type: 'expense',
            amount: recurringTransaction.amount,
            description: recurringTransaction.description || recurringTransaction.name,
            date: new Date().toISOString().split('T')[0],
            is_recurring: true,
            recurring_transaction_id: notification.recurring_transaction_id
          });

        if (transactionError) {
          throw new Error('İşlem eklenirken hata: ' + transactionError.message);
        }

        // Ana hesap bakiyesini güncelle
        // Önce mevcut bakiyeyi al
        const { data: currentAccount, error: fetchError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', recurringTransaction.account_id)
          .single();

        if (fetchError) {
          throw new Error('Mevcut bakiye alınamadı: ' + fetchError.message);
        }

        const newBalance = currentAccount.balance - recurringTransaction.amount;

        const { error: accountError } = await supabase
          .from('accounts')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', recurringTransaction.account_id);

        if (accountError) {
          throw new Error('Hesap bakiyesi güncellenirken hata: ' + accountError.message);
        }

        // Bildirimi onaylandı olarak işaretle
        const { error: updateError } = await supabase
          .from('notification_history')
          .update({
            status: 'confirmed',
            expense_confirmed: true,
            expense_confirmation_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notificationId);

        if (updateError) {
          throw new Error('Bildirim güncellenirken hata: ' + updateError.message);
        }

        return {
          success: true,
          message: 'Gider onaylandı ve ana hesaptan düşüldü'
        };
      } else {
        // Gider ödenmedi
        const { error: updateError } = await supabase
          .from('notification_history')
          .update({
            status: 'rejected',
            expense_confirmed: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', notificationId);

        if (updateError) {
          throw new Error('Bildirim güncellenirken hata: ' + updateError.message);
        }

        return {
          success: true,
          message: 'Gider ödenmedi olarak işaretlendi'
        };
      }
    } catch (error) {
      console.error('confirmLargeExpense genel hata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Kullanıcı ayarlarını getir
  async getUserSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Supabase getUserSettings error:', error);
        return {
          success: false,
          error: error.message,
          data: null
        };
      }

      // Eğer ayar yoksa varsayılan ayarları oluştur
      if (!data) {
        const defaultSettings = {
          user_id: userId,
          auto_execute_recurring: true,
          confirmation_threshold: 1000.00,
          salary_confirmation_required: true,
          enable_recurring_notifications: true,
          enable_salary_notifications: true,
          enable_large_expense_notifications: true
        };

        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          throw new Error('Varsayılan ayarlar oluşturulamadı: ' + createError.message);
        }

        return {
          success: true,
          data: newSettings
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('getUserSettings genel hata:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // Kullanıcı ayarlarını güncelle
  async updateUserSettings(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateUserSettings error:', error);
        return {
          success: false,
          error: error.message,
          data: null
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('updateUserSettings genel hata:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // Bildirim geçmişini getir
  async getNotificationHistory(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select(`
          *,
          recurring_transaction:recurring_transactions(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Supabase getNotificationHistory error:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('getNotificationHistory genel hata:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Onay bildirimi oluştur
  async createConfirmationNotification(recurringTransactionId, userId, type, amount, name) {
    try {
      let notificationType = 'info';
      let title = '';
      let message = '';

      if (type === 'income' && amount >= 1000) {
        notificationType = 'salary_confirmation';
        title = 'Maaş Onayı Gerekli';
        message = `${name} (${amount.toLocaleString('tr-TR')} ₺) yatırıldı mı?`;
      } else if (type === 'expense' && amount >= 1000) {
        notificationType = 'large_expense_confirmation';
        title = 'Büyük Gider Onayı';
        message = `${name} (${amount.toLocaleString('tr-TR')} ₺) ödendi mi?`;
      } else {
        // Küçük işlemler için bilgi bildirimi
        title = 'İşlem Eklendi';
        message = `${name} (${amount.toLocaleString('tr-TR')} ₺) başarıyla eklendi.`;
      }

      const { data, error } = await supabase
        .from('notification_history')
        .insert({
          user_id: userId,
          recurring_transaction_id: recurringTransactionId,
          type: notificationType,
          title: title,
          message: message,
          status: notificationType.includes('confirmation') ? 'pending' : 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase createConfirmationNotification error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('Bildirim oluşturuldu:', data);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('createConfirmationNotification genel hata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default recurringTransactionService;
