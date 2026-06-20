const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
content = content.replace(/import { supabase } from '\.\/supabase\/client';/, "import { getISTDateString, getISTDateTimeString } from './lib/utils';\nimport { supabase } from './supabase/client';");
content = content.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'getISTDateString()');
content = content.replace(/new Date\(([^)]+)\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'getISTDateString($1)');
content = content.replace(/new Date\(\)\.toISOString\(\)/g, 'getISTDateTimeString()');
content = content.replace(/new Date\(([^)]+)\)\.toISOString\(\)/g, 'getISTDateTimeString($1)');
fs.writeFileSync('src/App.jsx', content);

let content2 = fs.readFileSync('src/pages/projects.tsx', 'utf8');
content2 = content2.replace(/import { saveInvoice, deleteInvoice, updateInvoice } from "@\/supabase\/database";/, "import { saveInvoice, deleteInvoice, updateInvoice } from \"@/supabase/database\";\nimport { getISTDateString, getISTDateTimeString } from \"@/lib/utils\";");
content2 = content2.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'getISTDateString()');
content2 = content2.replace(/new Date\(([^)]+)\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'getISTDateString($1)');
content2 = content2.replace(/new Date\(\)\.toISOString\(\)/g, 'getISTDateTimeString()');
content2 = content2.replace(/new Date\(([^)]+)\)\.toISOString\(\)/g, 'getISTDateTimeString($1)');
fs.writeFileSync('src/pages/projects.tsx', content2);
