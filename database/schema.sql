-- FinanceFlow Veritabanı Şeması
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users tablosu (Supabase Auth ile entegre)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    currency_preference TEXT DEFAULT 'TRY',
    language_preference TEXT DEFAULT 'tr',
    notification_settings JSONB DEFAULT '{"push": true, "email": true, "sms": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories tablosu
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default kategoriler ekleme (sadece yoksa)
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

-- Accounts tablosu
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'credit_card', 'investment', 'wallet')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'TRY',
    account_number TEXT,
    bank_name TEXT,
    credit_limit DECIMAL(15,2),
    due_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions tablosu
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT,
    notes TEXT,
    date DATE NOT NULL,
    time TIME,
    location TEXT,
    receipt_url TEXT,
    tags TEXT[],
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,
    recurring_pattern JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets tablosu
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    spent DECIMAL(15,2) DEFAULT 0.00,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals tablosu
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards tablosu
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'prepaid')),
    card_number TEXT,
    expiry_date DATE,
    cvv TEXT,
    bank_name TEXT,
    credit_limit DECIMAL(15,2),
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    due_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Transactions tablosu
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT,
    notes TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipts tablosu
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    ocr_text TEXT,
    merchant_name TEXT,
    total_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications tablosu
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currency Rates tablosu
CREATE TABLE IF NOT EXISTS public.currency_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    date DATE NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(base_currency, target_currency, date)
);

-- Gold Prices tablosu
CREATE TABLE IF NOT EXISTS public.gold_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('gram', 'ceyrek', 'yarim', 'tam')),
    price_try DECIMAL(10,2) NOT NULL,
    price_usd DECIMAL(10,2),
    date DATE NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes oluşturma
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_due ON public.recurring_transactions(next_due_date);

-- Row Level Security (RLS) etkinleştirme
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies oluşturma (sadece yoksa)
DO $$
BEGIN
    -- Users tablosu için policy - INSERT için ayrı policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'users_own_data'
    ) THEN
        CREATE POLICY "users_own_data" ON public.users
            FOR ALL USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;

    -- Users tablosu için INSERT policy (yeni kullanıcı kaydı için)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'users_insert_policy'
    ) THEN
        CREATE POLICY "users_insert_policy" ON public.users
            FOR INSERT WITH CHECK (true);
    END IF;

    -- Categories tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' AND policyname = 'categories_own_data'
    ) THEN
        CREATE POLICY "categories_own_data" ON public.categories
            FOR ALL USING (user_id IS NULL OR auth.uid() = user_id);
    END IF;

    -- Accounts tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'accounts' AND policyname = 'accounts_own_data'
    ) THEN
        CREATE POLICY "accounts_own_data" ON public.accounts
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Transactions tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' AND policyname = 'transactions_own_data'
    ) THEN
        CREATE POLICY "transactions_own_data" ON public.transactions
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Budgets tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'budgets' AND policyname = 'budgets_own_data'
    ) THEN
        CREATE POLICY "budgets_own_data" ON public.budgets
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Goals tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'goals' AND policyname = 'goals_own_data'
    ) THEN
        CREATE POLICY "goals_own_data" ON public.goals
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Cards tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cards' AND policyname = 'cards_own_data'
    ) THEN
        CREATE POLICY "cards_own_data" ON public.cards
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Recurring Transactions tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recurring_transactions' AND policyname = 'recurring_transactions_own_data'
    ) THEN
        CREATE POLICY "recurring_transactions_own_data" ON public.recurring_transactions
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Receipts tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'receipts' AND policyname = 'receipts_own_data'
    ) THEN
        CREATE POLICY "receipts_own_data" ON public.receipts
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Notifications tablosu için policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' AND policyname = 'notifications_own_data'
    ) THEN
        CREATE POLICY "notifications_own_data" ON public.notifications
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Functions oluşturma
-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers oluşturma (sadece yoksa)
DO $$
BEGIN
    -- Users trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Categories trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_categories_updated_at'
    ) THEN
        CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Accounts trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_accounts_updated_at'
    ) THEN
        CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Transactions trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_transactions_updated_at'
    ) THEN
        CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Budgets trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_budgets_updated_at'
    ) THEN
        CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Goals trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_goals_updated_at'
    ) THEN
        CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Cards trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_cards_updated_at'
    ) THEN
        CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Recurring Transactions trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_recurring_transactions_updated_at'
    ) THEN
        CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON public.recurring_transactions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- RLS Policy Düzeltmeleri (Manuel olarak çalıştır)
-- Bu komutları Supabase SQL Editor'da çalıştırın

-- Users tablosu için INSERT policy ekleme
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT WITH CHECK (true);

-- Users tablosu için SELECT policy düzeltme
DROP POLICY IF EXISTS "users_own_data" ON public.users;
CREATE POLICY "users_own_data" ON public.users
    FOR ALL USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Email confirmation için auth.users tablosunda email_confirmed_at kontrolü
-- Email confirmation devre dışı bırakıldı - otomatik giriş yapılıyor

-- Categories tablosu için RLS policies
DROP POLICY IF EXISTS "categories_own_data" ON public.categories;
CREATE POLICY "categories_own_data" ON public.categories
    FOR ALL USING (
        user_id IS NULL OR auth.uid() = user_id
    )
    WITH CHECK (
        user_id IS NULL OR auth.uid() = user_id
    );

-- Accounts tablosu için RLS policies
DROP POLICY IF EXISTS "accounts_own_data" ON public.accounts;
CREATE POLICY "accounts_own_data" ON public.accounts
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Transactions tablosu için RLS policies
DROP POLICY IF EXISTS "transactions_own_data" ON public.transactions;
CREATE POLICY "transactions_own_data" ON public.transactions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Budgets tablosu için RLS policies
DROP POLICY IF EXISTS "budgets_own_data" ON public.budgets;
CREATE POLICY "budgets_own_data" ON public.budgets
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Goals tablosu için RLS policies
DROP POLICY IF EXISTS "goals_own_data" ON public.goals;
CREATE POLICY "goals_own_data" ON public.goals
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Cards tablosu için RLS policies
DROP POLICY IF EXISTS "cards_own_data" ON public.cards;
CREATE POLICY "cards_own_data" ON public.cards
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notifications tablosu için RLS policies
DROP POLICY IF EXISTS "notifications_own_data" ON public.notifications;
CREATE POLICY "notifications_own_data" ON public.notifications
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
