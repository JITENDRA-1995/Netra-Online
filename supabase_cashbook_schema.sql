-- Create cashbook_entries table
CREATE TABLE IF NOT EXISTS public.cashbook_entries (
    id bigint PRIMARY KEY,
    date text NOT NULL,
    "desc" text NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    mode text,
    category text,
    details text,
    "invoiceId" bigint,
    "invoiceNo" text,
    "isMicroJobInvoice" boolean DEFAULT false,
    "projectId" bigint,
    "isFinal" boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cashbook_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cashbook_entries;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.cashbook_entries;
DROP POLICY IF EXISTS "Enable update for all users" ON public.cashbook_entries;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.cashbook_entries;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.cashbook_entries FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.cashbook_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.cashbook_entries FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.cashbook_entries FOR DELETE USING (true);

-- Add table to realtime publication
DO $$
BEGIN
  -- We don't drop it inside a block if we're not sure it exists, just add it.
  -- Supabase realtime publication is usually "supabase_realtime"
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cashbook_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cashbook_entries;
  END IF;
END $$;
