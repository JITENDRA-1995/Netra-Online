-- Migration: Add pending profile column and enable Realtime replication
-- Execute this SQL in your Supabase SQL editor (https://supabase.com/dashboard/project/zfqksxmlcffxmhcbpsus/sql/new):

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pending_profile_update JSONB;

-- Enable Supabase Realtime for tables to broadcast inserts and updates in realtime:
-- (Note: If some tables are already added, you can also toggle this via Supabase Database -> Replication dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.micro_jobs_ledger;
