const fs = require('fs');

const path = 'src/pages/financials.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Replace the Ignition Deposit condition
const oldDepositCond = "{!depPaid && advanceAmt > 0 && (";
const newDepositCond = "{advanceAmt > 0 && (!depPaid || !depInvoiced) && (";
content = content.replace(oldDepositCond, newDepositCond);

// 2. Replace the Delivery Retainer condition
const oldRetainerCond = "{depPaid && p.status !== 'Completed' && (";
const newRetainerCond = "{(!advanceAmt || depInvoiced) && depPaid && p.status !== 'Completed' && (";
content = content.replace(oldRetainerCond, newRetainerCond);

fs.writeFileSync(path, content, 'utf-8');
console.log('Successfully patched financials.tsx');
