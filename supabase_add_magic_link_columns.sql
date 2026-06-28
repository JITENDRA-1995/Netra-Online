-- Migration: Add Magic Link columns to clients table
-- Execute this SQL in your Supabase SQL editor (https://supabase.com/dashboard/project/zfqksxmlcffxmhcbpsus/sql/new):

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS magic_token VARCHAR(100) UNIQUE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMP WITH TIME ZONE;
