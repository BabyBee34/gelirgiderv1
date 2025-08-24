-- FinanceFlow Database Schema Validation Script
-- Bu script'i Supabase SQL Editor'da çalıştırarak schema'yı doğrulayın

-- 1. Tablo varlığını kontrol et
DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'users', 'categories', 'accounts', 'transactions', 
        'budgets', 'goals', 'cards', 'receipts', 'notifications',
        'currency_rates', 'gold_prices'
    ];
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== TABLO VARLIĞI KONTROLÜ ===';
    
    FOREACH table_name IN ARRAY required_tables
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ % tablosu mevcut', table_name;
        ELSE
            RAISE NOTICE '❌ % tablosu EKSİK!', table_name;
        END IF;
    END LOOP;
END $$;

-- 2. RLS durumunu kontrol et
DO $$
DECLARE
    rls_tables TEXT[] := ARRAY[
        'users', 'categories', 'accounts', 'transactions', 
        'budgets', 'goals', 'cards', 'receipts', 'notifications'
    ];
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    RAISE NOTICE '=== RLS DURUMU KONTROLÜ ===';
    
    FOREACH table_name IN ARRAY rls_tables
    LOOP
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = table_name 
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        INTO rls_enabled;
        
        IF rls_enabled THEN
            RAISE NOTICE '✅ % tablosunda RLS etkin', table_name;
        ELSE
            RAISE NOTICE '❌ % tablosunda RLS devre dışı!', table_name;
        END IF;
    END LOOP;
END $$;

-- 3. Policy'leri kontrol et
DO $$
DECLARE
    policy_tables TEXT[] := ARRAY[
        'users', 'categories', 'accounts', 'transactions', 
        'budgets', 'goals', 'cards', 'receipts', 'notifications'
    ];
    table_name TEXT;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== POLICY KONTROLÜ ===';
    
    FOREACH table_name IN ARRAY policy_tables
    LOOP
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE tablename = table_name 
        AND schemaname = 'public'
        INTO policy_count;
        
        IF policy_count > 0 THEN
            RAISE NOTICE '✅ % tablosunda % policy mevcut', table_name, policy_count;
        ELSE
            RAISE NOTICE '❌ % tablosunda policy YOK!', table_name;
        END IF;
    END LOOP;
END $$;

-- 4. Index'leri kontrol et
DO $$
DECLARE
    required_indexes TEXT[] := ARRAY[
        'idx_transactions_user_id', 'idx_transactions_date', 'idx_transactions_category_id',
        'idx_accounts_user_id', 'idx_budgets_user_id', 'idx_goals_user_id', 'idx_cards_user_id'
    ];
    index_name TEXT;
    index_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== INDEX KONTROLÜ ===';
    
    FOREACH index_name IN ARRAY required_indexes
    LOOP
        SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = index_name 
            AND schemaname = 'public'
        ) INTO index_exists;
        
        IF index_exists THEN
            RAISE NOTICE '✅ % index mevcut', index_name;
        ELSE
            RAISE NOTICE '❌ % index EKSİK!', index_name;
        END IF;
    END LOOP;
END $$;

-- 5. Trigger'ları kontrol et
DO $$
DECLARE
    trigger_tables TEXT[] := ARRAY[
        'users', 'categories', 'accounts', 'transactions', 
        'budgets', 'goals', 'cards'
    ];
    table_name TEXT;
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '=== TRIGGER KONTROLÜ ===';
    
    FOREACH table_name IN ARRAY trigger_tables
    LOOP
        SELECT COUNT(*) 
        FROM pg_trigger 
        WHERE tgrelid = (
            SELECT oid FROM pg_class 
            WHERE relname = table_name 
            AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        )
        INTO trigger_count;
        
        IF trigger_count > 0 THEN
            RAISE NOTICE '✅ % tablosunda % trigger mevcut', table_name, trigger_count;
        ELSE
            RAISE NOTICE '❌ % tablosunda trigger YOK!', table_name;
        END IF;
    END LOOP;
END $$;

-- 6. Fonksiyonları kontrol et
DO $$
DECLARE
    required_functions TEXT[] := ARRAY['update_updated_at_column'];
    func_name TEXT;
    func_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== FONKSİYON KONTROLÜ ===';
    
    FOREACH func_name IN ARRAY required_functions
    LOOP
        SELECT EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = func_name
        ) INTO func_exists;
        
        IF func_exists THEN
            RAISE NOTICE '✅ % fonksiyonu mevcut', func_name;
        ELSE
            RAISE NOTICE '❌ % fonksiyonu EKSİK!', func_name;
        END IF;
    END LOOP;
END $$;

-- 7. Default kategorileri kontrol et
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    RAISE NOTICE '=== DEFAULT KATEGORİ KONTROLÜ ===';
    
    SELECT COUNT(*) 
    FROM public.categories 
    WHERE user_id IS NULL
    INTO category_count;
    
    IF category_count >= 10 THEN
        RAISE NOTICE '✅ % default kategori mevcut', category_count;
    ELSE
        RAISE NOTICE '❌ Sadece % default kategori var, en az 10 olmalı!', category_count;
    END IF;
END $$;

-- 8. Genel schema sağlığı
DO $$
BEGIN
    RAISE NOTICE '=== SCHEMA SAĞLIĞI ÖZETİ ===';
    RAISE NOTICE 'Tüm kontroller tamamlandı. Yukarıdaki sonuçları inceleyin.';
    RAISE NOTICE '❌ işaretli öğeler varsa bunları düzeltin.';
    RAISE NOTICE '✅ işaretli öğeler doğru şekilde yapılandırılmış.';
END $$;
