import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // 1. Fetch current row
  const { data: current, error: getErr } = await supabase
    .from('clients')
    .select('*')
    .eq('email', 'settings@netra.graphics')
    .maybeSingle();

  if (getErr) {
    console.error('Error fetching settings:', getErr);
    return;
  }

  if (!current) {
    console.log('No settings row to update.');
    return;
  }

  console.log('Current address data length:', current.address.length);

  // 2. Try updating the address column
  const parsed = JSON.parse(current.address);
  // Add a dummy service slide to check update
  if (!parsed.services[0].slideshow) {
    parsed.services[0].slideshow = [];
  }
  
  const testSlide = {
    url: 'https://zfqksxmlcffxmhcbpsus.supabase.co/storage/v1/object/public/studio-vault/test_video.mp4',
    title: 'Test Video',
    duration: 5
  };
  
  parsed.services[0].slideshow.push(testSlide);

  const payload = {
    address: JSON.stringify(parsed)
  };

  console.log('Attempting update with payload size:', payload.address.length);

  const { data, error: updateErr } = await supabase
    .from('clients')
    .update(payload)
    .eq('email', 'settings@netra.graphics')
    .select();

  if (updateErr) {
    console.error('UPDATE FAILED:', updateErr);
  } else {
    console.log('UPDATE SUCCEEDED! Response data:', data);
  }
}

run();
