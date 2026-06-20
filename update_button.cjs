const fs = require('fs');

const path = 'src/pages/financials.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace the button text "INVOICE FINAL" with "DRAFT INVOICE" inside the Delivery Retainer Action Button section.
// The button is defined as:
// <Button ...>
//   📄 INVOICE FINAL
// </Button>

content = content.replace(
  '📄 INVOICE FINAL',
  '📄 DRAFT INVOICE'
);

fs.writeFileSync(path, content, 'utf-8');
console.log('Successfully updated financials.tsx');
