# Migration SQL Komutları

## Transactions Tablosuna Eksik Alanları Ekleme

Aşağıdaki SQL komutlarını Supabase SQL Editor'da çalıştırın:

### 1. Transactions Tablosuna Eksik Alanları Ekle
```sql
-- Add missing fields to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS time time,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS receipt_url text,
ADD COLUMN IF NOT EXISTS tags text[];
```

### 2. Recurring Transactions Tablosuna Eksik Alanları Ekle
```sql
-- Add missing fields to recurring_transactions table
ALTER TABLE public.recurring_transactions 
ADD COLUMN IF NOT EXISTS time time,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS receipt_url text,
ADD COLUMN IF NOT EXISTS tags text[];
```

### 3. Constraint Hatasını Düzelt
```sql
-- Fix constraint in recurring_transactions table
ALTER TABLE public.recurring_transactions 
DROP CONSTRAINT IF EXISTS recurring_transactions_month_of_year_check;

ALTER TABLE public.recurring_transactions 
ADD CONSTRAINT recurring_transactions_month_of_year_check 
CHECK (month_of_year >= 1 AND month_of_year <= 12);
```

### 4. Performans İndeksleri Ekle
```sql
-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON public.transactions(account_id, type);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_next_due ON public.recurring_transactions(user_id, next_due_date);
```

## Nasıl Çalıştırılır

1. Supabase Dashboard'a gidin
2. SQL Editor'ı açın
3. Yukarıdaki komutları sırayla çalıştırın
4. Her komutun başarılı olduğundan emin olun

## Kontrol

Migration sonrası tabloları kontrol etmek için:

```sql
-- Transactions tablosu yapısını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Recurring transactions tablosu yapısını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'recurring_transactions' 
ORDER BY ordinal_position;
```
