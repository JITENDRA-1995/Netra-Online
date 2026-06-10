import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of envContent.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=').slice(1).join('=').trim();
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('email', 'settings@netra.graphics')
    .maybeSingle();

  if (error) { console.error('Fetch error:', error); return; }
  if (!data) { console.log('No settings row found!'); return; }

  let parsed = JSON.parse(data.address);
  console.log(`Current cashbook entries length: ${parsed.cashbook?.length}`);
  (parsed.cashbook || []).forEach(e => {
    console.log(`Entry: ID = ${e.id} (type: ${typeof e.id}), Desc = ${e.desc}`);
  });
}

run();
