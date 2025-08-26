-- Migration: Add missing fields to transactions table
-- Date: 2024-12-19

-- Add missing fields to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS time time,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS receipt_url text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS recurring_frequency text;

-- Add missing fields to recurring_transactions table
ALTER TABLE public.recurring_transactions 
ADD COLUMN IF NOT EXISTS time time,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS receipt_url text,
ADD COLUMN IF NOT EXISTS tags text[];

-- Fix constraint in recurring_transactions table
ALTER TABLE public.recurring_transactions 
DROP CONSTRAINT IF EXISTS recurring_transactions_month_of_year_check;

ALTER TABLE public.recurring_transactions 
ADD CONSTRAINT recurring_transactions_month_of_year_check 
CHECK (month_of_year >= 1 AND month_of_year <= 12);

-- Add constraint for recurring_frequency values
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_recurring_frequency_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_recurring_frequency_check 
CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON public.transactions(account_id, type);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_next_due ON public.recurring_transactions(user_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_frequency ON public.transactions(recurring_frequency);
