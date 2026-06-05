const supabaseUrl = 'https://zfqksxmlcffxmhcbpsus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcWtzeG1sY2ZmeG1oY2Jwc3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTY3OTIsImV4cCI6MjA5NDc3Mjc5Mn0.YU6zUVKJG705JLyyi2UdIBaRpYlwTOtna7ZO-dEABXQ';

async function testProject() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.39`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const data = await res.json();
    console.log("Project 39:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

testProject();
