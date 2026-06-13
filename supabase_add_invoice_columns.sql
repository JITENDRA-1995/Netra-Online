-- Migration: Add missing columns to invoices table to support multi-device syncing of payment status
-- Execute this SQL in your Supabase SQL editor (https://supabase.com/dashboard/project/zfqksxmlcffxmhcbpsus/sql/new):

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_link TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_total NUMERIC;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS micro_job_ids JSONB;

-- Refresh the schema cache by altering/re-enabling replication or publication if needed (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
