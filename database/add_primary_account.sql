-- Accounts tablosuna is_primary column ekleme
-- Bu script Supabase SQL Editor'da çalıştırılmalı

-- is_primary column ekle (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'is_primary'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN is_primary BOOLEAN DEFAULT false;
        RAISE NOTICE 'is_primary column added to accounts table';
    ELSE
        RAISE NOTICE 'is_primary column already exists';
    END IF;
END $$;

-- Eğer hiç primary hesap yoksa, ilk hesabı primary yap
DO $$
DECLARE
    first_account_id UUID;
BEGIN
    -- Hiç primary hesap var mı kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM public.accounts WHERE is_primary = true
    ) THEN
        -- Her kullanıcının ilk hesabını primary yap
        FOR first_account_id IN 
            SELECT DISTINCT ON (user_id) id 
            FROM public.accounts 
            WHERE is_active = true 
            ORDER BY user_id, created_at ASC
        LOOP
            UPDATE public.accounts 
            SET is_primary = true 
            WHERE id = first_account_id;
        END LOOP;
        
        RAISE NOTICE 'Primary accounts set for all users';
    END IF;
END $$;