import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error("Credentials not found in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseAnonKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testIgnitionFlow() {
  console.log("Starting testIgnitionFlow...");
  let createdClientId = null;
  let createdProjectId = null;

  try {
    // 1. Simulating client registration with blank email (using fallback email)
    const clientName = "Test Visionary " + Date.now();
    const clientEmail = `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}@netra.graphics`;
    
    console.log(`Inserting test client: "${clientName}" with generated email "${clientEmail}"...`);
    const { data: newClient, error: cError } = await supabase
      .from('clients')
      .insert([
        {
          name: clientName,
          email: clientEmail,
          phone: "+91 99999 99999",
          address: "Test Address, India",
          access_key: "TESTPASS",
          status: "Active"
        }
      ])
      .select()
      .single();

    if (cError) throw cError;
    createdClientId = newClient.id;
    console.log("Client inserted successfully! ID:", createdClientId);

    // 2. Simulating project ignition for this client
    console.log(`Igniting project for client ID: ${createdClientId}...`);
    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert([
        {
          name: clientName,
          service: "Test Branding",
          stage: 1,
          status: "Active",
          quote: 10000,
          discount: 0,
          discount_value: "0",
          discount_type: "rs",
          advance_amount: 1000,
          payment_status: "part",
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days out
          client_id: createdClientId,
          description: "Temporary test project"
        }
      ])
      .select()
      .single();

    if (pError) throw pError;
    createdProjectId = project.id;
    console.log("Project ignited successfully! ID:", createdProjectId);

    console.log("SUCCESS: All database operations completed without constraint failures!");

  } catch (err) {
    console.error("TEST FAILED:", err);
  } finally {
    // Clean up test data
    console.log("Cleaning up test data...");
    if (createdProjectId) {
      const { error: pDelError } = await supabase.from('projects').delete().eq('id', createdProjectId);
      if (pDelError) console.error("Error deleting test project:", pDelError);
      else console.log("Deleted test project.");
    }
    if (createdClientId) {
      const { error: cDelError } = await supabase.from('clients').delete().eq('id', createdClientId);
      if (cDelError) console.error("Error deleting test client:", cDelError);
      else console.log("Deleted test client.");
    }
  }
}

testIgnitionFlow();
