const supabaseUrl = 'https://zfqksxmlcffxmhcbpsus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcWtzeG1sY2ZmeG1oY2Jwc3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTY3OTIsImV4cCI6MjA5NDc3Mjc5Mn0.YU6zUVKJG705JLyyi2UdIBaRpYlwTOtna7ZO-dEABXQ';

async function testInsert() {
  const newInvoice = {
    invoice_no: 'NG/05062026/0004',
    project_id: 39,
    client_name: 'BHAVESHBHAI DHAREJIYA',
    project_service: 'Digital Invitations',
    issue_date: '2026-06-05',
    grand_total: 5000
  };

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/invoices`, {
      method: 'POST',
      headers: { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newInvoice)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data/Error:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testInsert();
