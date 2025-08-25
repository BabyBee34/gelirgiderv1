-- =========================================
-- FinanceFlow - Complete Database Reset and Setup
-- =========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS public.recurring_transactions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.notification_history CASCADE;

-- Create categories table
CREATE TABLE public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  is_custom boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  UNIQUE(user_id, name)
);

-- Create accounts table
CREATE TABLE public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'credit_card', 'investment', 'savings')),
  balance numeric(15,2) default 0.00,
  currency text default 'TRY',
  account_number text,
  bank_name text,
  credit_limit numeric(15,2),
  due_date date,
  interest_rate numeric(6,3),
  monthly_limit numeric(15,2),
  parent_card uuid references public.accounts(id) on delete set null,
  is_primary boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create cards table
CREATE TABLE public.cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  account_id uuid references public.accounts(id) on delete cascade, -- Bağlı hesap
  card_number text unique,
  expiration_date date,
  cvv text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(15,2) not null,
  description text,
  date date not null,
  is_recurring boolean default false,
  recurring_transaction_id uuid, -- Will reference recurring_transactions table
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create recurring_transactions table (ENHANCED)
CREATE TABLE public.recurring_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  type text not null check (type in ('income', 'expense')),
  amount numeric(15,2) not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Enhanced date fields
  start_date date not null,
  next_due_date date not null,
  day_of_week integer check (day_of_week >= 1 and day_of_week <= 7), -- 1=Monday, 7=Sunday
  day_of_month integer check (day_of_month >= 1 and day_of_month <= 31),
  month_of_year integer check (month_of_year >= 1 and month_of_year <= 12),
  
  -- Auto-execution settings
  auto_execute boolean default false, -- Otomatik işlem yapılsın mı?
  requires_confirmation boolean default false, -- Onay gerekiyor mu?
  confirmation_threshold numeric(15,2) default 1000.00, -- Hangi tutardan sonra onay gerekli
  
  -- Status fields
  is_active boolean default true,
  last_executed date,
  next_execution_date date,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create goals table
CREATE TABLE public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric(15,2) not null,
  current_amount numeric(15,2) default 0.00,
  icon text default 'flag',
  color text default '#9F7AEA',
  target_date date,
  show_on_home boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create budgets table
CREATE TABLE public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  limit_amount numeric(15,2) not null,
  spent numeric(15,2) default 0.00,
  period text not null check (period in ('daily', 'weekly', 'monthly', 'yearly')),
  icon text default 'account-balance-wallet',
  color text default '#4ECDC4',
  show_on_home boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create user_settings table (NEW)
CREATE TABLE public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  
  -- Recurring transaction settings
  auto_execute_recurring boolean default true,
  confirmation_threshold numeric(15,2) default 1000.00,
  salary_confirmation_required boolean default true,
  
  -- Notification settings
  enable_recurring_notifications boolean default true,
  enable_salary_notifications boolean default true,
  enable_large_expense_notifications boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  UNIQUE(user_id)
);

-- Create notification_history table (NEW)
CREATE TABLE public.notification_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  recurring_transaction_id uuid references public.recurring_transactions(id) on delete cascade,
  
  type text not null check (type in ('salary_confirmation', 'large_expense_confirmation', 'recurring_executed', 'recurring_due')),
  title text not null,
  message text not null,
  status text not null check (status in ('pending', 'confirmed', 'rejected', 'expired')),
  
  -- For salary confirmations
  salary_confirmed boolean,
  salary_confirmation_date timestamptz,
  
  -- For expense confirmations
  expense_confirmed boolean,
  expense_confirmation_date timestamptz,
  
  -- For recurring executions
  executed_amount numeric(15,2),
  executed_date date,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
CREATE INDEX idx_categories_user_type ON public.categories(user_id, type);
CREATE INDEX idx_accounts_user_primary ON public.accounts(user_id, is_primary);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX idx_recurring_transactions_user_active ON public.recurring_transactions(user_id, is_active);
CREATE INDEX idx_recurring_transactions_next_due ON public.recurring_transactions(next_due_date);
CREATE INDEX idx_goals_user_active ON public.goals(user_id, is_active);
CREATE INDEX idx_budgets_user_active ON public.budgets(user_id, is_active);
CREATE INDEX idx_notification_history_user_status ON public.notification_history(user_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON public.cards FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recurring transactions" ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring transactions" ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring transactions" ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring transactions" ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON public.notification_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notification_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notification_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notification_history FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_history_updated_at BEFORE UPDATE ON public.notification_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate next due date for recurring transactions
CREATE OR REPLACE FUNCTION calculate_next_due_date(
  p_frequency text,
  p_current_date date,
  p_day_of_week integer DEFAULT NULL,
  p_day_of_month integer DEFAULT NULL,
  p_month_of_year integer DEFAULT NULL
)
RETURNS date AS $$
DECLARE
  v_next_date date;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      v_next_date := p_current_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      IF p_day_of_week IS NULL THEN
        v_next_date := p_current_date + INTERVAL '1 week';
      ELSE
        -- Find next occurrence of the specified day of week
        v_next_date := p_current_date + (p_day_of_week - EXTRACT(DOW FROM p_current_date))::integer;
        IF v_next_date <= p_current_date THEN
          v_next_date := v_next_date + INTERVAL '1 week';
        END IF;
      END IF;
    WHEN 'monthly' THEN
      IF p_day_of_month IS NULL THEN
        v_next_date := p_current_date + INTERVAL '1 month';
      ELSE
        -- Find next occurrence of the specified day of month
        v_next_date := DATE_TRUNC('month', p_current_date) + INTERVAL '1 month' + (p_day_of_month - 1) * INTERVAL '1 day';
        -- Adjust for months with fewer days
        WHILE EXTRACT(DAY FROM v_next_date) != p_day_of_month LOOP
          v_next_date := v_next_date - INTERVAL '1 day';
        END LOOP;
      END IF;
    WHEN 'quarterly' THEN
      v_next_date := p_current_date + INTERVAL '3 months';
    WHEN 'yearly' THEN
      IF p_month_of_year IS NULL OR p_day_of_month IS NULL THEN
        v_next_date := p_current_date + INTERVAL '1 year';
      ELSE
        -- Find next occurrence of the specified month and day
        v_next_date := DATE_TRUNC('year', p_current_date) + (p_month_of_year - 1) * INTERVAL '1 month' + (p_day_of_month - 1) * INTERVAL '1 day';
        IF v_next_date <= p_current_date THEN
          v_next_date := v_next_date + INTERVAL '1 year';
        END IF;
        -- Adjust for February 29 in leap years
        WHILE EXTRACT(DAY FROM v_next_date) != p_day_of_month LOOP
          v_next_date := v_next_date - INTERVAL '1 day';
        END LOOP;
      END IF;
    ELSE
      v_next_date := p_current_date + INTERVAL '1 month';
  END CASE;
  
  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to setup default categories for a new user
CREATE OR REPLACE FUNCTION setup_default_categories(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert default income categories
  INSERT INTO public.categories (user_id, name, type, icon, color, is_custom) VALUES
    (p_user_id, 'Maaş', 'income', 'account-balance', '#48BB78', false),
    (p_user_id, 'Ek Gelir', 'income', 'trending-up', '#38A169', false),
    (p_user_id, 'Yatırım Geliri', 'income', 'trending-up', '#319795', false),
    (p_user_id, 'Kira Geliri', 'income', 'home', '#2B6CB0', false)
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Insert default expense categories
  INSERT INTO public.categories (user_id, name, type, icon, color, is_custom) VALUES
    (p_user_id, 'Market', 'expense', 'shopping-cart', '#F56565', false),
    (p_user_id, 'Kira', 'expense', 'home', '#E53E3E', false),
    (p_user_id, 'Faturalar', 'expense', 'receipt', '#DD6B20', false),
    (p_user_id, 'Ulaşım', 'expense', 'directions-car', '#D69E2E', false),
    (p_user_id, 'Sağlık', 'expense', 'local-hospital', '#C53030', false),
    (p_user_id, 'Eğlence', 'expense', 'movie', '#B7791F', false),
    (p_user_id, 'Giyim', 'expense', 'checkroom', '#A0AEC0', false),
    (p_user_id, 'Eğitim', 'expense', 'school', '#9F7AEA', false),
    (p_user_id, 'Diğer', 'expense', 'more-horiz', '#718096', false)
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Insert default user settings
  INSERT INTO public.user_settings (
    user_id, 
    auto_execute_recurring, 
    confirmation_threshold, 
    salary_confirmation_required, 
    enable_recurring_notifications, 
    enable_salary_notifications, 
    enable_large_expense_notifications
  ) VALUES (
    p_user_id, 
    true, 
    1000.00, 
    true, 
    true, 
    true, 
    true
  ) ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create function to execute recurring transactions
CREATE OR REPLACE FUNCTION execute_recurring_transactions()
RETURNS void AS $$
DECLARE
  v_record RECORD;
  v_next_date date;
  v_transaction_id uuid;
  v_notification_id uuid;
BEGIN
  -- Loop through all active recurring transactions that are due
  FOR v_record IN 
    SELECT * FROM public.recurring_transactions 
    WHERE is_active = true 
    AND next_due_date <= CURRENT_DATE
    AND (last_executed IS NULL OR last_executed < next_due_date)
  LOOP
    -- Check if confirmation is required
    IF v_record.requires_confirmation AND v_record.amount >= v_record.confirmation_threshold THEN
      -- Create notification for confirmation
      INSERT INTO public.notification_history (
        user_id, 
        recurring_transaction_id, 
        type, 
        title, 
        message, 
        status
      ) VALUES (
        v_record.user_id,
        v_record.id,
        CASE WHEN v_record.type = 'income' THEN 'salary_confirmation' ELSE 'large_expense_confirmation' END,
        CASE 
          WHEN v_record.type = 'income' THEN 'Maaş Onayı Gerekli'
          ELSE 'Büyük Gider Onayı Gerekli'
        END,
        CASE 
          WHEN v_record.type = 'income' THEN v_record.name || ' yattı mı?'
          ELSE v_record.name || ' ödendi mi?'
        END,
        'pending'
      );
    ELSE
      -- Auto-execute the transaction
      INSERT INTO public.transactions (
        user_id,
        account_id,
        category_id,
        type,
        amount,
        description,
        date,
        is_recurring,
        recurring_transaction_id
      ) VALUES (
        v_record.user_id,
        v_record.account_id,
        v_record.category_id,
        v_record.type,
        v_record.amount,
        v_record.description,
        CURRENT_DATE,
        true,
        v_record.id
      );
      
      -- Update account balance
      IF v_record.type = 'income' THEN
        UPDATE public.accounts 
        SET balance = balance + v_record.amount 
        WHERE id = v_record.account_id;
      ELSE
        UPDATE public.accounts 
        SET balance = balance - v_record.amount 
        WHERE id = v_record.account_id;
      END IF;
      
      -- Create success notification
      INSERT INTO public.notification_history (
        user_id, 
        recurring_transaction_id, 
        type, 
        title, 
        message, 
        status,
        executed_amount,
        executed_date
      ) VALUES (
        v_record.user_id,
        v_record.id,
        'recurring_executed',
        'Otomatik İşlem Tamamlandı',
        v_record.name || ' ' || v_record.amount || ' TL ' || 
        CASE WHEN v_record.type = 'income' THEN 'eklendi' ELSE 'düşüldü' END,
        'confirmed',
        v_record.amount,
        CURRENT_DATE
      );
    END IF;
    
    -- Calculate next due date
    v_next_date := calculate_next_due_date(
      v_record.frequency,
      v_record.next_due_date,
      v_record.day_of_week,
      v_record.day_of_month,
      v_record.month_of_year
    );
    
    -- Update recurring transaction
    UPDATE public.recurring_transactions 
    SET 
      next_due_date = v_next_date,
      last_executed = CASE WHEN v_record.requires_confirmation AND v_record.amount >= v_record.confirmation_threshold 
                           THEN last_executed 
                           ELSE CURRENT_DATE END,
      updated_at = now()
    WHERE id = v_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job or scheduled function call (this would be set up in your application)
-- For now, you can call execute_recurring_transactions() manually or set up a cron job

COMMIT;


