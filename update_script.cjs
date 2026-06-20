const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Add import
content = content.replace(/import { getISTDateString, getISTDateTimeString } from '\.\/lib\/utils';/, "import { getISTDateString, getISTDateTimeString, extractDateFromInvoiceNo } from './lib/utils';");

// Update finalDate in App.jsx rendering logic
content = content.replace(/let finalDate = invoiceProject\.issueDate \|\| invoiceProject\.createdAt \|\| Date\.now\(\);/, "let finalDate = extractDateFromInvoiceNo(stableInvoiceNo, invoiceProject.issueDate || invoiceProject.createdAt || Date.now());");

// Optionally replace the trueInvoiceDate logic but let's do it simply using regex
// Since trueInvoiceDate logic is multiline:
content = content.replace(/const trueInvoiceDate = \(\(\) => {[\s\S]*?}\)\(\);/m, "const trueInvoiceDate = extractDateFromInvoiceNo(inv.invoiceNo, inv.issueDate);");

fs.writeFileSync('src/App.jsx', content);

let detailContent = fs.readFileSync('src/pages/client-vault/invoice-detail.jsx', 'utf8');
if (!detailContent.includes('extractDateFromInvoiceNo')) {
    detailContent = detailContent.replace(/import { format } from "date-fns";/, "import { format } from \"date-fns\";\nimport { extractDateFromInvoiceNo } from \"../../lib/utils\";");
    detailContent = detailContent.replace(/<strong>Issue Date:<\/strong> \{invoice\.createdAt \? format\(new Date\(invoice\.createdAt\), 'dd-MM-yyyy'\) : 'N\/A'\}/, "<strong>Issue Date:</strong> {format(extractDateFromInvoiceNo(invoice.invoiceNumber, invoice.createdAt || invoice.issueDate), 'dd-MM-yyyy')}");
    fs.writeFileSync('src/pages/client-vault/invoice-detail.jsx', detailContent);
}
