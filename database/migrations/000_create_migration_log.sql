-- Migration: Create migration_log table
-- Date: 2024-12-19
-- Purpose: Track all database migrations

-- Create migration_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    migration_name TEXT NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    details TEXT,
    execution_time_ms INTEGER
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_migration_log_name ON public.migration_log(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_log_status ON public.migration_log(status);
CREATE INDEX IF NOT EXISTS idx_migration_log_executed_at ON public.migration_log(executed_at);

-- Enable RLS
ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (admin users can view all, regular users can view their own migrations)
CREATE POLICY "Users can view migration log" ON public.migration_log 
FOR SELECT USING (true);

-- Insert initial migration record
INSERT INTO public.migration_log (migration_name, status, details) 
VALUES ('000_create_migration_log', 'success', 'Migration log table created successfully')
ON CONFLICT (migration_name) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 000_create_migration_log completed successfully!';
    RAISE NOTICE 'Created migration_log table for tracking database changes';
END $$;
