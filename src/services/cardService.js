// FinanceFlow - Card Service
// Hem accounts hem de cards tablolarını yönetir
import { supabase } from '../config/supabase';

const cardService = {
  // Tüm kartları getir (cards tablosundan)
  async getCards(userId) {
    try {
      if (!userId) {
        throw new Error('User ID gerekli');
      }

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getCards error:', error);
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
      console.error('Get cards error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Yeni kart oluştur (hem accounts hem cards tablolarına)
  async createCard(cardData) {
    try {
      if (!cardData.user_id) {
        throw new Error('User ID gerekli');
      }

      // 1. Önce accounts tablosuna ekle
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert([{
          user_id: cardData.user_id,
          name: cardData.name,
          bank_name: cardData.bank_name,
          type: cardData.type,
          currency: cardData.currency,
          balance: cardData.balance || 0,
          credit_limit: cardData.credit_limit,
          due_date: cardData.due_date,
          interest_rate: cardData.interest_rate,
          monthly_limit: cardData.monthly_limit,
          parent_card: cardData.parent_card,
          is_active: true,
        }])
        .select()
        .single();

      if (accountError) {
        throw accountError;
      }

      // 2. Sonra cards tablosuna ekle
      const { data: cardRecord, error: cardError } = await supabase
        .from('cards')
        .insert([{
          user_id: cardData.user_id,
          name: cardData.name,
          type: cardData.type,
          account_id: accountData.id, // accounts tablosundaki ID'ye referans
          is_active: true,
        }])
        .select()
        .single();

      if (cardError) {
        // Cards eklenemezse accounts'ı da sil
        await supabase.from('accounts').delete().eq('id', accountData.id);
        throw cardError;
      }

      return { 
        success: true, 
        data: {
          ...accountData,
          card_id: cardRecord.id
        }
      };
    } catch (error) {
      console.error('Create card error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Kart oluşturulamadı', 
          code: 'CREATE_ERROR' 
        } 
      };
    }
  },

  // Kart güncelle
  async updateCard(cardId, updateData) {
    try {
      if (!cardId) {
        throw new Error('Card ID gerekli');
      }

      // Önce cards tablosundan account_id'yi al
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('account_id')
        .eq('id', cardId)
        .single();

      if (cardError) {
        throw cardError;
      }

      // Sonra accounts tablosunu güncelle
      const { data, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', cardData.account_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update card error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Kart güncellenemedi', 
          code: 'UPDATE_ERROR' 
        } 
      };
    }
  },

  // Kart sil
  async deleteCard(cardId) {
    try {
      if (!cardId) {
        throw new Error('Card ID gerekli');
      }

      // Önce cards tablosundan account_id'yi al
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('account_id')
        .eq('id', cardId)
        .single();

      if (cardError) {
        throw cardError;
      }

      // Sonra accounts tablosunu sil
      const { error: accountError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', cardData.account_id);

      if (accountError) {
        throw accountError;
      }

      // Son olarak cards tablosundan sil
      const { error: deleteCardError } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (deleteCardError) {
        throw deleteCardError;
      }

      return { success: true };
    } catch (error) {
      console.error('Delete card error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Kart silinemedi', 
          code: 'DELETE_ERROR' 
        } 
      };
    }
  }
};

export default cardService;
