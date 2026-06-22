const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://zfqksxmlcffxmhcbpsus.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcWtzeG1sY2ZmeG1oY2Jwc3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTY3OTIsImV4cCI6MjA5NDc3Mjc5Mn0.YU6zUVKJG705JLyyi2UdIBaRpYlwTOtna7ZO-dEABXQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_no, created_at, client_name, grand_total')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    return;
  }

  console.log("Found", data.length, "invoices:");
  data.forEach(i => {
    console.log(`- No: ${i.invoice_no}, Date: ${i.created_at}, Client: ${i.client_name}, Total: ${i.grand_total}`);
  });
}

run();
