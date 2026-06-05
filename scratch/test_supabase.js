const supabaseUrl = 'https://zfqksxmlcffxmhcbpsus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcWtzeG1sY2ZmeG1oY2Jwc3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTY3OTIsImV4cCI6MjA5NDc3Mjc5Mn0.YU6zUVKJG705JLyyi2UdIBaRpYlwTOtna7ZO-dEABXQ';

async function test() {
  console.log("Fetching inquiries...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/inquiries`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    console.log("Inquiries Status:", res.status);
    const data = await res.json();
    console.log("Inquiries count:", data.length);
  } catch (err) {
    console.error("Inquiries Query Error:", err);
  }

  console.log("\nFetching invoices...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/invoices`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    console.log("Invoices Status:", res.status);
    const data = await res.json();
    console.log("Invoices count:", data.length);
  } catch (err) {
    console.error("Invoices Query Error:", err);
  }
}

test();
