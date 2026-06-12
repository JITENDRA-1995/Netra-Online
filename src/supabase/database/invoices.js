import { supabase } from '../client';

const getLocalInvoiceMetadata = () => {
  try {
    const data = localStorage.getItem('mock_invoice_extra_metadata');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to parse local invoice metadata:", e);
    return {};
  }
};

const saveLocalInvoiceMetadata = (metadata) => {
  try {
    localStorage.setItem('mock_invoice_extra_metadata', JSON.stringify(metadata));
  } catch (e) {
    console.error("Failed to save local invoice metadata:", e);
  }
};

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
  
  const extraMetadata = getLocalInvoiceMetadata();

  // Format to match UI state expectation
  return data.map(inv => {
    const localMeta = extraMetadata[inv.id] || extraMetadata[inv.invoice_no] || {};
    
    return {
      id: inv.id,
      invoiceNo: inv.invoice_no,
      projectId: inv.project_id,
      clientName: inv.client_name,
      projectService: inv.project_service,
      issueDate: new Date(inv.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      grandTotal: parseFloat(inv.grand_total),
      clientLink: inv.client_link !== undefined ? inv.client_link : localMeta.client_link,
      invoiceTotal: inv.invoice_total !== undefined ? parseFloat(inv.invoice_total) : (localMeta.invoice_total !== undefined ? parseFloat(localMeta.invoice_total) : parseFloat(inv.grand_total)),
      paymentStatus: inv.payment_status || localMeta.payment_status || 'Paid',
      microJobIds: inv.micro_job_ids || localMeta.micro_job_ids || [],
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
    };
  });
};

/**
 * Save an invoice to the database vault
 */
export const saveInvoice = async (invoiceData) => {
  const payloadWithExtras = {
    invoice_no: invoiceData.invoiceNo || invoiceData.invoice_no,
    project_id: invoiceData.projectId || invoiceData.project_id || invoiceData.rawProject?.id,
    client_name: invoiceData.clientName || invoiceData.client_name,
    project_service: invoiceData.projectService || invoiceData.project_service,
    issue_date: (invoiceData.issueDate && !isNaN(new Date(invoiceData.issueDate).getTime()))
      ? new Date(invoiceData.issueDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    grand_total: invoiceData.grandTotal || invoiceData.grand_total,
    client_link: invoiceData.clientLink || invoiceData.client_link || null,
    invoice_total: invoiceData.invoiceTotal || invoiceData.invoice_total || invoiceData.grandTotal || invoiceData.grand_total,
    payment_status: invoiceData.paymentStatus || invoiceData.payment_status || 'Pending',
    micro_job_ids: invoiceData.microJobIds || invoiceData.micro_job_ids || []
  };

  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([payloadWithExtras])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('client_link') || error.message?.includes('invoice_total')) {
        console.warn("Invoices table lacks extra columns. Saving extra columns locally.");
        const standardPayload = {
          invoice_no: payloadWithExtras.invoice_no,
          project_id: payloadWithExtras.project_id,
          client_name: payloadWithExtras.client_name,
          project_service: payloadWithExtras.project_service,
          issue_date: payloadWithExtras.issue_date,
          grand_total: payloadWithExtras.grand_total
        };
        const { data: stdData, error: stdError } = await supabase
          .from('invoices')
          .insert([standardPayload])
          .select()
          .single();

        if (stdError) throw stdError;

        const extras = getLocalInvoiceMetadata();
        extras[stdData.id] = {
          client_link: payloadWithExtras.client_link,
          invoice_total: payloadWithExtras.invoice_total,
          payment_status: payloadWithExtras.payment_status,
          micro_job_ids: payloadWithExtras.micro_job_ids
        };
        saveLocalInvoiceMetadata(extras);

        return stdData;
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Failed to save invoice:", err);
    throw err;
  }
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
  
  try {
    const extras = getLocalInvoiceMetadata();
    delete extras[invoiceId];
    saveLocalInvoiceMetadata(extras);
  } catch (e) {
    console.error("Failed to delete local invoice metadata:", e);
  }
  
  return true;
};

/**
 * Update an existing invoice
 */
export const updateInvoice = async (invoiceId, invoiceData) => {
  const payloadWithExtras = {
    invoice_no: invoiceData.invoiceNo || invoiceData.invoice_no,
    project_id: invoiceData.projectId || invoiceData.project_id || invoiceData.rawProject?.id,
    client_name: invoiceData.clientName || invoiceData.client_name,
    project_service: invoiceData.projectService || invoiceData.project_service,
    issue_date: (invoiceData.issueDate && !isNaN(new Date(invoiceData.issueDate).getTime())) 
      ? new Date(invoiceData.issueDate).toISOString().split('T')[0] 
      : undefined,
    grand_total: invoiceData.grandTotal || invoiceData.grand_total,
    client_link: invoiceData.clientLink || invoiceData.client_link,
    invoice_total: invoiceData.invoiceTotal || invoiceData.invoice_total,
    payment_status: invoiceData.paymentStatus || invoiceData.payment_status,
    micro_job_ids: invoiceData.microJobIds || invoiceData.micro_job_ids
  };

  try {
    const { data, error } = await supabase
      .from('invoices')
      .update(payloadWithExtras)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('client_link') || error.message?.includes('invoice_total')) {
        console.warn("Invoices table lacks extra columns. Updating extra columns locally.");
        const standardPayload = {
          invoice_no: payloadWithExtras.invoice_no,
          project_id: payloadWithExtras.project_id,
          client_name: payloadWithExtras.client_name,
          project_service: payloadWithExtras.project_service,
          issue_date: payloadWithExtras.issue_date,
          grand_total: payloadWithExtras.grand_total
        };
        const { data: stdData, error: stdError } = await supabase
          .from('invoices')
          .update(standardPayload)
          .eq('id', invoiceId)
          .select()
          .single();

        if (stdError) throw stdError;

        const extras = getLocalInvoiceMetadata();
        extras[invoiceId] = {
          ...extras[invoiceId],
          client_link: payloadWithExtras.client_link !== undefined ? payloadWithExtras.client_link : extras[invoiceId]?.client_link,
          invoice_total: payloadWithExtras.invoice_total !== undefined ? payloadWithExtras.invoice_total : extras[invoiceId]?.invoice_total,
          payment_status: payloadWithExtras.payment_status !== undefined ? payloadWithExtras.payment_status : extras[invoiceId]?.payment_status,
          micro_job_ids: payloadWithExtras.micro_job_ids !== undefined ? payloadWithExtras.micro_job_ids : extras[invoiceId]?.micro_job_ids
        };
        saveLocalInvoiceMetadata(extras);

        return stdData;
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Failed to update invoice:", err);
    throw err;
  }
};


