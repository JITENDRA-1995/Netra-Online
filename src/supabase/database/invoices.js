import { supabase } from '../client';

/**
 * Fetch all saved invoices from the database
 */
export const getInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      projects (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Format to match UI state expectation
  return data.map(inv => ({
    id: inv.id,
    invoiceNo: inv.invoice_no,
    clientName: inv.client_name,
    projectService: inv.project_service,
    issueDate: new Date(inv.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    grandTotal: parseFloat(inv.grand_total),
    rawProject: inv.projects ? (() => {
      let qty = 1;
      let rate = parseFloat(inv.projects.quote);
      let descText = inv.projects.description || '';

      if (descText.startsWith("JSON_METADATA:")) {
        try {
          const parsed = JSON.parse(descText.substring(14));
          qty = parsed.qty || 1;
          rate = parsed.rate || (parseFloat(inv.projects.quote) / qty);
          descText = parsed.description || '';
        } catch (e) {
          console.error("Failed to parse JSON_METADATA in invoice project description:", e);
        }
      }

      return {
        id: inv.projects.id,
        name: inv.projects.name,
        service: inv.projects.service,
        stage: inv.projects.stage,
        status: inv.projects.status,
        quote: parseFloat(inv.projects.quote),
        discount: parseFloat(inv.projects.discount || 0),
        advanceAmount: parseFloat(inv.projects.advance_amount || 0),
        qty,
        rate,
        description: descText
      };
    })() : null
  }));
};

/**
 * Save an invoice to the database vault
 */
export const saveInvoice = async (invoiceData) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([
      {
        invoice_no: invoiceData.invoiceNo || invoiceData.invoice_no,
        project_id: invoiceData.projectId || invoiceData.project_id || invoiceData.rawProject?.id,
        client_name: invoiceData.clientName || invoiceData.client_name,
        project_service: invoiceData.projectService || invoiceData.project_service,
        issue_date: (invoiceData.issueDate && !isNaN(new Date(invoiceData.issueDate).getTime()))
          ? new Date(invoiceData.issueDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        grand_total: invoiceData.grandTotal || invoiceData.grand_total
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (invoiceId) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) throw error;
  return true;
};

/**
 * Update an existing invoice
 */
export const updateInvoice = async (invoiceId, invoiceData) => {
  const { data, error } = await supabase
    .from('invoices')
    .update({
      invoice_no: invoiceData.invoiceNo || invoiceData.invoice_no,
      project_id: invoiceData.projectId || invoiceData.project_id || invoiceData.rawProject?.id,
      client_name: invoiceData.clientName || invoiceData.client_name,
      project_service: invoiceData.projectService || invoiceData.project_service,
      issue_date: (invoiceData.issueDate && !isNaN(new Date(invoiceData.issueDate).getTime())) 
        ? new Date(invoiceData.issueDate).toISOString().split('T')[0] 
        : undefined,
      grand_total: invoiceData.grandTotal || invoiceData.grand_total
    })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

