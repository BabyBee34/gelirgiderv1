-- Migration: Fix missing recurring_frequency column in transactions table
-- Date: 2024-12-19
-- Problem: transactions tablosunda recurring_frequency kolonu eksik

-- Add missing recurring_frequency column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS recurring_frequency text;

-- Add constraint for recurring_frequency values
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_recurring_frequency_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_recurring_frequency_check 
CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));

-- Add index for better performance on recurring transactions
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_frequency ON public.transactions(recurring_frequency);

-- Update existing transactions that are recurring to have a default frequency
UPDATE public.transactions 
SET recurring_frequency = 'monthly' 
WHERE is_recurring = true AND recurring_frequency IS NULL;

-- Migration log güncelle (eğer migration_log tablosu varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_log' AND table_schema = 'public') THEN
        INSERT INTO public.migration_log (migration_name, status) 
        VALUES ('004_fix_recurring_frequency', 'success')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 004_fix_recurring_frequency completed successfully!';
    RAISE NOTICE 'Added recurring_frequency column to transactions table';
END $$;
