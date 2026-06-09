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
  // 1. Fetch current settings row
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('email', 'settings@netra.graphics')
    .maybeSingle();

  if (error) { console.error('Fetch error:', error); return; }
  if (!data) { console.log('No settings row found!'); return; }

  let parsed;
  try {
    parsed = JSON.parse(data.address);
  } catch (e) {
    console.error('Failed to parse address:', e);
    return;
  }

  const oldCount = (parsed.cashbook || []).length;
  console.log(`Current cashbook entries: ${oldCount}`);
  if (oldCount > 0) {
    console.log('Sample entries:');
    (parsed.cashbook || []).slice(0, 5).forEach(e => {
      console.log(`  - [${e.type}] ${e.desc} | ₹${e.amount} | ${e.date}`);
    });
  }

  // 2. Clear the cashbook array
  parsed.cashbook = [];

  // 3. Write back to Supabase
  const { error: updateError } = await supabase
    .from('clients')
    .update({ address: JSON.stringify(parsed) })
    .eq('email', 'settings@netra.graphics');

  if (updateError) {
    console.error('Update failed:', updateError);
  } else {
    console.log(`\n✅ Successfully cleared ${oldCount} cashbook entries from Supabase!`);
    console.log('The local browser cache (localStorage) will be wiped on next page reload.');
  }
}

run();
