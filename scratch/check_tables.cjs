const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables from .env.local manually
const envFile = './.env.local';
const envContent = fs.readFileSync(envFile, 'utf-8');
const envConfig = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    envConfig[key] = value;
  }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

console.log("Connecting to Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking inquiries table...");
  const { data: inqData, error: inqError } = await supabase.from('inquiries').select('*').limit(1);
  console.log("inquiries:", { count: inqData?.length, error: inqError?.message });

  console.log("Checking cashbook table...");
  const { data: cbData, error: cbError } = await supabase.from('cashbook').select('*').limit(1);
  console.log("cashbook:", { count: cbData?.length, error: cbError?.message });

  console.log("Checking clients table...");
  const { data: clientData, error: clientError } = await supabase.from('clients').select('*').limit(1);
  console.log("clients:", { count: clientData?.length, error: clientError?.message });
}

check();
