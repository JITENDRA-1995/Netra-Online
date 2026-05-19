import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-ref')) {
  console.warn(
    "Supabase configuration: Environment variables are using default placeholders. " +
    "Please populate your actual credentials in .env.local."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
