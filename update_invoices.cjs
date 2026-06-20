const fs = require('fs');

const path = 'src/pages/invoices.tsx';
let content = fs.readFileSync(path, 'utf-8');

const target = `  const upToDateInvoices = invoices.map(getUpToDateInvoice);`;

const replacement = `  const upToDateInvoices = React.useMemo(() => {
    const updated = invoices.map(getUpToDateInvoice);
    
    // Auto-inject draft invoices for active projects that don't have an explicitly saved invoice yet
    if (projects && projects.length > 0) {
      projects.forEach(p => {
        // Only include non-completed, non-standalone projects
        if (p.status !== 'Completed' && !p.isStandalone) {
          const hasInvoice = updated.some(inv => inv.rawProject && String(inv.rawProject.id) === String(p.id));
          if (!hasInvoice) {
            const clientName = p.client?.name || p.name || 'Unknown Client';
            updated.push({
              id: \`draft-virtual-\${p.id}\`,
              invoiceNo: \`DRAFT-\${p.id}\`,
              clientName: clientName,
              projectService: p.service,
              issueDate: p.createdAt || new Date().toISOString(),
              paymentStatus: p.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
              grandTotal: p.quote,
              rawProject: p,
              isVirtualDraft: true
            });
          }
        }
      });
    }
    return updated;
  }, [invoices, projects, clients]);`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf-8');
  console.log('Successfully updated invoices.tsx');
} else {
  console.log('Target string not found in invoices.tsx');
}
