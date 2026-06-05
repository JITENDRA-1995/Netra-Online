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
  const fileContent = 'Hello World from test script';
  const buffer = Buffer.from(fileContent, 'utf-8');
  const filePath = `test_uploads/test_${Date.now()}.txt`;

  console.log('Attempting upload to studio-vault storage at path:', filePath);

  const { data, error } = await supabase.storage
    .from('studio-vault')
    .upload(filePath, buffer, {
      contentType: 'text/plain',
      upsert: true
    });

  if (error) {
    console.error('UPLOAD FAILED:', error);
  } else {
    console.log('UPLOAD SUCCEEDED! Response data:', data);
    
    // Test getPublicUrl
    const { data: urlData } = supabase.storage
      .from('studio-vault')
      .getPublicUrl(filePath);
      
    console.log('Generated Public URL:', urlData?.publicUrl);
  }
}

run();
