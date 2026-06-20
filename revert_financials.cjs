const fs = require('fs');

const path = 'src/pages/financials.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Revert the Ignition Deposit condition
const oldDepositCond = "{advanceAmt > 0 && (!depPaid || !depInvoiced) && (";
const newDepositCond = "{!depPaid && advanceAmt > 0 && (";
content = content.replace(oldDepositCond, newDepositCond);

// 2. Revert the Delivery Retainer condition
const oldRetainerCond = "{(!advanceAmt || depInvoiced) && depPaid && p.status !== 'Completed' && (";
const newRetainerCond = "{depPaid && p.status !== 'Completed' && (";
content = content.replace(oldRetainerCond, newRetainerCond);

fs.writeFileSync(path, content, 'utf-8');
console.log('Successfully reverted financials.tsx');
