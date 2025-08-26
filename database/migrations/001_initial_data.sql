-- FinanceFlow Initial Data Migration
-- Bu script'i Supabase SQL Editor'da çalıştırın
-- Sadece mevcut olan tablolara veri ekler

-- 1. Default kategorileri ekle (eğer yoksa)
-- NOT: user_id NULL olarak ekleniyor çünkü bunlar global kategoriler
INSERT INTO public.categories (user_id, name, icon, color, type, is_custom) VALUES
    (NULL, 'Maaş', 'cash', '#4CAF50', 'income', false),
    (NULL, 'Freelance', 'briefcase', '#2196F3', 'income', false),
    (NULL, 'Yatırım', 'trending-up', '#FF9800', 'income', false),
    (NULL, 'Market', 'shopping-cart', '#F44336', 'expense', false),
    (NULL, 'Ulaşım', 'car', '#9C27B0', 'expense', false),
    (NULL, 'Fatura', 'receipt', '#607D8B', 'expense', false),
    (NULL, 'Eğlence', 'gamepad', '#E91E63', 'expense', false),
    (NULL, 'Sağlık', 'medical-bag', '#00BCD4', 'expense', false),
    (NULL, 'Eğitim', 'school', '#795548', 'expense', false),
    (NULL, 'Transfer', 'swap-horizontal', '#FF5722', 'expense', false);

-- 2. Test kullanıcısı için örnek hesap ekle (eğer test kullanıcısı varsa)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Test kullanıcısını bul
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'test@financeflow.com' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test hesabı ekle
        INSERT INTO public.accounts (user_id, name, type, balance, currency, bank_name) VALUES
            (test_user_id, 'Ana Banka Hesabı', 'bank', 5000.00, 'TRY', 'Test Bank');
        
        -- Test kategorisi ekle
        INSERT INTO public.categories (user_id, name, icon, color, type, is_custom) VALUES
            (test_user_id, 'Test Kategori', 'star', '#FF5722', 'expense', false);
    END IF;
END $$;

-- 3. Migration log'u güncelle (eğer migration_log tablosu varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_log' AND table_schema = 'public') THEN
        INSERT INTO public.migration_log (migration_name, status, details) 
        VALUES ('001_initial_data', 'success', 'Default categories and test data added successfully');
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_initial_data completed successfully!';
    RAISE NOTICE 'Added default categories and test data';
END $$;
