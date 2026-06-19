-- Supabase Migration: Create client_notifications table
-- Run this in your Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.client_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'communication', 'asset_comment', 'profile_update', 'new_asset'
    title TEXT, -- Added title column
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix if table already exists without title
ALTER TABLE public.client_notifications ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.client_notifications;
CREATE POLICY "Enable read access for all users" ON public.client_notifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON public.client_notifications;
CREATE POLICY "Enable insert access for all users" ON public.client_notifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON public.client_notifications;
CREATE POLICY "Enable update access for all users" ON public.client_notifications
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON public.client_notifications;
CREATE POLICY "Enable delete access for all users" ON public.client_notifications
    FOR DELETE USING (true);

-- 4. Enable Realtime via SQL (if supported) or do it manually
-- IMPORTANT: Go to Database -> Replication -> Turn on realtime for `client_notifications`
-- Alternatively, this command enables it automatically in some Supabase versions:
alter publication supabase_realtime add table public.client_notifications;
