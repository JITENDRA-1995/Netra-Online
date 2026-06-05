-- Supabase Storage Policies for 'studio-vault' Bucket
-- Copy and run these commands in your Supabase SQL Editor to enable public uploads and reads.

-- 1. Ensure the bucket exists and is marked as public
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-vault', 'studio-vault', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies on storage.objects for this bucket if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Select Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;

-- 3. Create Policy to allow public SELECT (read) access to all files inside 'studio-vault'
CREATE POLICY "Public Select Access" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'studio-vault');

-- 4. Create Policy to allow public INSERT (upload) access to files inside 'studio-vault'
CREATE POLICY "Public Insert Access" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'studio-vault');

-- 5. Create Policy to allow public UPDATE access to files inside 'studio-vault'
CREATE POLICY "Public Update Access" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'studio-vault');

-- 6. Create Policy to allow public DELETE access to files inside 'studio-vault'
CREATE POLICY "Public Delete Access" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'studio-vault');
