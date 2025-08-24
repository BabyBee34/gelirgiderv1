-- FinanceFlow Initial Data Migration
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Default kategorileri ekle (eğer yoksa)
INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (NULL, 'Maaş', 'cash', '#4CAF50', 'income', true),
    (NULL, 'Freelance', 'briefcase', '#2196F3', 'income', true),
    (NULL, 'Yatırım', 'trending-up', '#FF9800', 'income', true),
    (NULL, 'Market', 'shopping-cart', '#F44336', 'expense', true),
    (NULL, 'Ulaşım', 'car', '#9C27B0', 'expense', true),
    (NULL, 'Fatura', 'receipt', '#607D8B', 'expense', true),
    (NULL, 'Eğlence', 'gamepad', '#E91E63', 'expense', true),
    (NULL, 'Sağlık', 'medical-bag', '#00BCD4', 'expense', true),
    (NULL, 'Eğitim', 'school', '#795548', 'expense', true),
    (NULL, 'Transfer', 'swap-horizontal', '#FF5722', 'transfer', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Default döviz kurlarını ekle
INSERT INTO public.currency_rates (base_currency, target_currency, rate, date, source) VALUES
    ('USD', 'TRY', 31.50, CURRENT_DATE, 'manual'),
    ('EUR', 'TRY', 34.20, CURRENT_DATE, 'manual'),
    ('GBP', 'TRY', 40.10, CURRENT_DATE, 'manual')
ON CONFLICT (base_currency, target_currency, date) DO NOTHING;

-- 3. Default altın fiyatlarını ekle
INSERT INTO public.gold_prices (type, price_try, price_usd, date, source) VALUES
    ('gram', 2150.00, 68.25, CURRENT_DATE, 'manual'),
    ('ceyrek', 8600.00, 273.00, CURRENT_DATE, 'manual'),
    ('yarim', 17200.00, 546.00, CURRENT_DATE, 'manual'),
    ('tam', 34400.00, 1092.00, CURRENT_DATE, 'manual')
ON CONFLICT (type, date) DO NOTHING;

-- 4. Test kullanıcısı için örnek hesap ekle (eğer test kullanıcısı varsa)
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
            (test_user_id, 'Ana Banka Hesabı', 'bank', 5000.00, 'TRY', 'Test Bank')
        ON CONFLICT DO NOTHING;
        
        -- Test kategorisi ekle
        INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
            (test_user_id, 'Test Kategori', 'star', '#FF5722', 'expense', false)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 5. Migration log'u güncelle
CREATE TABLE IF NOT EXISTS public.migration_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    migration_name TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'success'
);

INSERT INTO public.migration_log (migration_name, status) VALUES
    ('001_initial_data', 'success')
ON CONFLICT DO NOTHING;
