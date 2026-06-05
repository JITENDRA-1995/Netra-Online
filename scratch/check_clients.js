const supabaseUrl = 'https://zfqksxmlcffxmhcbpsus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcWtzeG1sY2ZmeG1oY2Jwc3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTY3OTIsImV4cCI6MjA5NDc3Mjc5Mn0.YU6zUVKJG705JLyyi2UdIBaRpYlwTOtna7ZO-dEABXQ';

async function test() {
  console.log("Fetching clients columns...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/clients?limit=1`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      console.log("Clients Columns:", Object.keys(data[0]));
    } else {
      console.log("Clients table is empty.");
    }
  } catch (err) {
    console.error("Query Error:", err);
  }
}

test();
