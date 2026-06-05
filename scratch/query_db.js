import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.replace(/^"|"\s*$/g, '');
    }
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing from .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying database tables...');

  try {
    const { data: invoices, error: invError } = await supabase.from('invoices').select('*');
    if (invError) throw invError;
    console.log(`Fetched ${invoices.length} invoices:`);
    console.log(invoices.map(i => ({ id: i.id, invoice_no: i.invoice_no, client_name: i.client_name, issue_date: i.issue_date, grand_total: i.grand_total })));

    const { data: projects, error: projError } = await supabase.from('projects').select('*');
    if (projError) throw projError;
    console.log(`Fetched ${projects.length} projects:`);
    console.log(projects.map(p => ({ id: p.id, name: p.name, created_at: p.created_at })));

    const { data: logs, error: logsError } = await supabase.from('project_activity_logs').select('*');
    if (logsError) throw logsError;
    console.log(`Fetched ${logs.length} activity logs:`);
    console.log(logs.map(l => ({ id: l.id, project_id: l.project_id, action: l.action, created_at: l.created_at })));

    const { data: media, error: mediaError } = await supabase.from('project_media').select('*');
    if (mediaError) throw mediaError;
    console.log(`Fetched ${media.length} media items:`);
    console.log(media.map(m => ({ id: m.id, file_name: m.file_name, uploaded_at: m.uploaded_at })));

  } catch (error) {
    console.error('Error querying database:', error);
  }
}

run();
