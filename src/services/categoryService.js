// FinanceFlow - Category Service
// Gerçek Supabase verilerini kullanır
import { supabase } from '../config/supabase';

const categoryService = {
  // Tüm kategorileri getir
  async getCategories(userId = null) {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      // Eğer userId verilmişse, kullanıcıya özel kategorileri de getir
      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      } else {
        // Sadece default kategorileri getir
        query = query.eq('is_default', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase getCategories error:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      // Duplicate kategorileri filtrele
      const uniqueCategories = this.removeDuplicateCategories(data || []);

      return {
        success: true,
        data: uniqueCategories
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Duplicate kategorileri kaldır
  removeDuplicateCategories(categories) {
    const seen = new Map();
    const unique = [];

    categories.forEach(category => {
      const key = `${category.name}-${category.type}-${category.user_id || 'default'}`;
      
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(category);
      } else {
        console.warn(`Duplicate category found and removed: ${category.name} (${category.type})`);
      }
    });

    return unique;
  },

  // Gelir kategorilerini getir
  async getIncomeCategories(userId = null) {
    try {
      const categories = await this.getCategories(userId);
      if (!categories.success) {
        return categories;
      }

      const incomeCategories = categories.data.filter(cat => cat.type === 'income');
      return {
        success: true,
        data: incomeCategories
      };
    } catch (error) {
      console.error('Get income categories error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Gider kategorilerini getir
  async getExpenseCategories(userId = null) {
    try {
      const categories = await this.getCategories(userId);
      if (!categories.success) {
        return categories;
      }

      const expenseCategories = categories.data.filter(cat => cat.type === 'expense');
      return {
        success: true,
        data: expenseCategories
      };
    } catch (error) {
      console.error('Get expense categories error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Transfer kategorilerini getir
  async getTransferCategories(userId = null) {
    try {
      const categories = await this.getCategories(userId);
      if (!categories.success) {
        return categories;
      }

      const transferCategories = categories.data.filter(cat => cat.type === 'transfer');
      return {
        success: true,
        data: transferCategories
      };
    } catch (error) {
      console.error('Get transfer categories error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Yeni kategori oluştur
  async createCategory(categoryData) {
    try {
      if (!categoryData.name || !categoryData.type) {
        throw new Error('Kategori adı ve türü gerekli');
      }

      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create category error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Kategori oluşturulamadı', 
          code: 'CREATE_ERROR' 
        } 
      };
    }
  },

  // Kategori güncelle
  async updateCategory(categoryId, updates) {
    try {
      if (!categoryId) {
        throw new Error('Category ID gerekli');
      }

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update category error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Kategori güncellenemedi', 
          code: 'UPDATE_ERROR' 
        } 
      };
    }
  },

  // Kategori sil
  async deleteCategory(categoryId) {
    try {
      if (!categoryId) {
        throw new Error('Category ID gerekli');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        throw error;
      }

      return { success: true, deletedId: categoryId };
    } catch (error) {
      console.error('Delete category error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Kategori silinemedi', 
          code: 'DELETE_ERROR' 
        } 
      };
    }
  },

  // Kategori ID'sine göre kategori getir
  async getCategoryById(categoryId) {
    try {
      if (!categoryId) {
        throw new Error('Category ID gerekli');
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get category by ID error:', error);
      return { 
        success: false, 
        error: { 
          message: error.message || 'Kategori bulunamadı', 
          code: 'GET_ERROR' 
        } 
      };
    }
  }
};

export default categoryService;
