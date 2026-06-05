import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfqksxmlcffxmhcbpsus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcWtzeG1sY2ZmeG1oY2Jwc3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTY3OTIsImV4cCI6MjA5NDc3Mjc5Mn0.YU6zUVKJG705JLyyi2UdIBaRpYlwTOtna7ZO-dEABXQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSimulation() {
  console.log("Starting simulation...");
  try {
    // 1. Get or create a client
    const { data: clients, error: cError } = await supabase.from('clients').select('*').limit(1);
    if (cError) throw cError;
    
    let clientId;
    if (clients && clients.length > 0) {
      clientId = clients[0].id;
      console.log("Using existing client:", clients[0].name, "id:", clientId);
    } else {
      const { data: newClient, error: ncError } = await supabase.from('clients').insert([{
        name: 'Test Client',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
        access_key: 'TESTKEY'
      }]).select().single();
      if (ncError) throw ncError;
      clientId = newClient.id;
      console.log("Created new client:", newClient.name, "id:", clientId);
    }

    // 2. Insert project
    const projectPayload = {
      name: 'Test Client',
      service: 'Logo Branding',
      stage: 1,
      status: 'Active',
      quote: 15000,
      discount: 1000,
      advance_amount: 3000,
      payment_status: 'part',
      deadline: '2026-06-30',
      client_id: clientId
    };

    console.log("Inserting project...");
    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert([projectPayload])
      .select()
      .single();

    if (pError) throw pError;
    console.log("Project inserted successfully, ID:", project.id);

    // 3. Insert invoice (simulating saveInvoiceToVault)
    const isCompleted = project.status.toLowerCase() === 'completed';
    const subtotal = parseFloat(project.quote) || 0;
    const discount = parseFloat(project.discount) || 0;
    const advance = parseFloat(project.advance_amount) || 0;
    const grandTotal = isCompleted ? (subtotal - discount) : (subtotal - discount - advance);

    const invoiceNo = `NG/05062026/${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    console.log("Inserting invoice...", { invoiceNo, grandTotal });
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert([{
        invoice_no: invoiceNo,
        project_id: project.id,
        client_name: project.name,
        project_service: project.service,
        issue_date: new Date().toISOString().split('T')[0],
        grand_total: grandTotal
      }])
      .select()
      .single();

    if (invError) throw invError;
    console.log("Invoice inserted successfully, ID:", invoice.id);

  } catch (err) {
    console.error("Simulation failed:", err);
  }
}

runSimulation();
