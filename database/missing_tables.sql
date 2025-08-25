-- FinanceFlow - Eksik Tablolar için SQL Script
-- Bu script Supabase SQL Editor'da çalıştırılacak

-- Enable UUID extension (eğer yoksa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cards tablosu (credit_cards yerine)
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
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON public.receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON public.currency_rates(date);
CREATE INDEX IF NOT EXISTS idx_gold_prices_date ON public.gold_prices(date);

-- Row Level Security (RLS) etkinleştirme
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies oluşturma
DROP POLICY IF EXISTS "cards_own_data" ON public.cards;
CREATE POLICY "cards_own_data" ON public.cards
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "receipts_own_data" ON public.receipts;
CREATE POLICY "receipts_own_data" ON public.receipts
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_own_data" ON public.notifications;
CREATE POLICY "notifications_own_data" ON public.notifications
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Currency ve Gold tables için public read access
DROP POLICY IF EXISTS "currency_rates_public_read" ON public.currency_rates;
CREATE POLICY "currency_rates_public_read" ON public.currency_rates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "gold_prices_public_read" ON public.gold_prices;
CREATE POLICY "gold_prices_public_read" ON public.gold_prices
    FOR SELECT USING (true);

-- Updated at trigger function (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers oluşturma
DROP TRIGGER IF EXISTS update_cards_updated_at ON public.cards;
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Test data ekleme (opsiyonel)
-- Default kategoriler (eğer yoksa)
INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (NULL, 'Maaş', 'attach-money', '#4CAF50', 'income', true),
    (NULL, 'Freelance', 'work', '#2196F3', 'income', true),
    (NULL, 'Yatırım', 'trending-up', '#FF9800', 'income', true),
    (NULL, 'Market', 'shopping-cart', '#F44336', 'expense', true),
    (NULL, 'Ulaşım', 'directions-car', '#9C27B0', 'expense', true),
    (NULL, 'Fatura', 'receipt', '#607D8B', 'expense', true),
    (NULL, 'Eğlence', 'movie', '#E91E63', 'expense', true),
    (NULL, 'Sağlık', 'local-hospital', '#00BCD4', 'expense', true)
ON CONFLICT (name) DO NOTHING;

-- Başarı mesajı
DO $$
BEGIN
    RAISE NOTICE 'FinanceFlow database tables created successfully!';
END $$;