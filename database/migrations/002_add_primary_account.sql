-- Migration: Add is_primary column to accounts table
-- This migration adds support for primary account designation

-- Add is_primary column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'is_primary'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN is_primary BOOLEAN DEFAULT false;
        
        -- For existing users, set the first account (oldest) as primary
        WITH first_accounts AS (
            SELECT DISTINCT ON (user_id) id, user_id
            FROM public.accounts
            WHERE is_active = true
            ORDER BY user_id, created_at ASC
        )
        UPDATE public.accounts 
        SET is_primary = true 
        WHERE id IN (SELECT id FROM first_accounts);
        
        RAISE NOTICE 'Added is_primary column to accounts table and set primary accounts for existing users';
    ELSE
        RAISE NOTICE 'is_primary column already exists in accounts table';
    END IF;
END $$;

-- Create a unique constraint to ensure only one primary account per user
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'accounts' 
        AND constraint_name = 'accounts_one_primary_per_user'
        AND table_schema = 'public'
    ) THEN
        -- Note: This creates a partial unique index instead of constraint to allow multiple false values
        CREATE UNIQUE INDEX accounts_one_primary_per_user 
        ON public.accounts (user_id) 
        WHERE is_primary = true;
        
        RAISE NOTICE 'Created unique index for one primary account per user';
    ELSE
        RAISE NOTICE 'Primary account constraint already exists';
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'Unique index already exists';
END $$;

-- Create a function to automatically manage primary account updates
CREATE OR REPLACE FUNCTION manage_primary_account()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting an account as primary, unset all other accounts for this user
    IF NEW.is_primary = true THEN
        UPDATE public.accounts 
        SET is_primary = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary account management
DROP TRIGGER IF EXISTS trigger_manage_primary_account ON public.accounts;
CREATE TRIGGER trigger_manage_primary_account
    BEFORE UPDATE OF is_primary ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION manage_primary_account();

-- Create a stored procedure for transaction creation with balance update
CREATE OR REPLACE FUNCTION create_transaction_with_balance_update(
    p_user_id UUID,
    p_account_id UUID,
    p_category_id UUID,
    p_amount DECIMAL(15,2),
    p_type TEXT,
    p_description TEXT DEFAULT '',
    p_notes TEXT DEFAULT '',
    p_date DATE DEFAULT CURRENT_DATE,
    p_time TIME DEFAULT CURRENT_TIME,
    p_location TEXT DEFAULT '',
    p_receipt_url TEXT DEFAULT '',
    p_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_is_recurring BOOLEAN DEFAULT false,
    p_recurring_frequency TEXT DEFAULT NULL
)
RETURNS TABLE(transaction_id UUID, new_balance DECIMAL(15,2)) AS $$
DECLARE
    v_transaction_id UUID;
    v_current_balance DECIMAL(15,2);
    v_new_balance DECIMAL(15,2);
    v_account_type TEXT;
BEGIN
    -- Validate account ownership
    SELECT balance, type INTO v_current_balance, v_account_type
    FROM public.accounts 
    WHERE id = p_account_id AND user_id = p_user_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found or access denied';
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance;
    
    IF p_type = 'income' THEN
        v_new_balance := v_current_balance + p_amount;
    ELSIF p_type = 'expense' THEN
        v_new_balance := v_current_balance - p_amount;
    END IF;
    -- For 'transfer' type, balance updates are handled separately
    
    -- Insert transaction
    INSERT INTO public.transactions (
        user_id, account_id, category_id, amount, type, description, 
        date, time, location, receipt_url, tags, 
        is_recurring, recurring_frequency
    ) VALUES (
        p_user_id, p_account_id, p_category_id, p_amount, p_type, p_description,
        p_date, p_time, p_location, p_receipt_url, p_tags,
        p_is_recurring, p_recurring_frequency
    ) RETURNING id INTO v_transaction_id;
    
    -- Update account balance (only for income and expense, not transfer)
    IF p_type IN ('income', 'expense') THEN
        UPDATE public.accounts 
        SET balance = v_new_balance, updated_at = NOW()
        WHERE id = p_account_id;
    END IF;
    
    RETURN QUERY SELECT v_transaction_id, v_new_balance;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_transaction_with_balance_update IS 'Creates a transaction and updates account balance atomically';