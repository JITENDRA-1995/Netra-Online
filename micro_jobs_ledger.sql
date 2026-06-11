-- 1. Create Micro-Jobs Ledger Table
CREATE TABLE IF NOT EXISTS public.micro_jobs_ledger (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_link BIGINT REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date_logged TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    billing_status VARCHAR(50) DEFAULT 'Unbilled' NOT NULL CHECK (billing_status IN ('Unbilled', 'Billed')),
    invoice_link BIGINT REFERENCES public.invoices(id) ON DELETE SET NULL
);

-- 2. Enable row-level security (RLS) on the new table
ALTER TABLE public.micro_jobs_ledger ENABLE ROW LEVEL SECURITY;

-- 3. Create public access policies for micro_jobs_ledger
CREATE POLICY "Enable read access for all users" ON public.micro_jobs_ledger
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.micro_jobs_ledger
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.micro_jobs_ledger
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.micro_jobs_ledger
    FOR DELETE USING (true);

-- 4. Update Invoices Table with relationship and status fields
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_link BIGINT REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_total NUMERIC(12, 2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid'));
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS micro_job_ids UUID[] DEFAULT '{}';
