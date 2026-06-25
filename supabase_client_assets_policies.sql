-- Supabase Migration: Configure policies and realtime for client_assets table
-- Run this in your Supabase SQL Editor

-- 1. Enable Row Level Security (RLS) if not already enabled
ALTER TABLE public.client_assets ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy to allow public/anon SELECT access so client portal can fetch assets
DROP POLICY IF EXISTS "Enable read access for all users" ON public.client_assets;
CREATE POLICY "Enable read access for all users" ON public.client_assets
    FOR SELECT TO public USING (true);

-- 3. Create Policy to allow public/anon INSERT access so client portal can upload assets
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.client_assets;
CREATE POLICY "Enable insert access for all users" ON public.client_assets
    FOR INSERT TO public WITH CHECK (true);

-- 4. Create Policy to allow public/anon DELETE access so clients can delete their own uploaded assets
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.client_assets;
CREATE POLICY "Enable delete access for all users" ON public.client_assets
    FOR DELETE TO public USING (true);

-- 5. Add table to supabase_realtime publication to enable real-time notifications in the admin portal
alter publication supabase_realtime add table public.client_assets;
