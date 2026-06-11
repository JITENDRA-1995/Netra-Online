import { supabase } from '../client';

/**
 * Fetch all micro jobs from the database
 */
export const getMicroJobs = async () => {
  const { data, error } = await supabase
    .from('micro_jobs_ledger')
    .select(`
      *,
      clients (*)
    `)
    .order('date_logged', { ascending: false });

  if (error) {
    console.warn("Failed to fetch micro jobs from Supabase, returning empty array:", error);
    return [];
  }
  
  // Format fields to match UI expectations
  return (data || []).map(job => ({
    jobId: job.job_id,
    clientLink: job.client_link,
    taskName: job.task_name,
    amount: parseFloat(job.amount),
    dateLogged: job.date_logged,
    billingStatus: job.billing_status,
    invoiceLink: job.invoice_link,
    client: job.clients ? {
      id: job.clients.id,
      name: job.clients.name,
      phone: job.clients.phone,
      email: job.clients.email,
      address: job.clients.address
    } : null
  }));
};

/**
 * Create a new micro-job entry
 */
export const createMicroJob = async (jobData) => {
  const insertPayload = {
    client_link: jobData.clientLink || jobData.client_link,
    task_name: jobData.taskName || jobData.task_name,
    amount: jobData.amount,
    billing_status: 'Unbilled'
  };

  const customDate = jobData.dateLogged || jobData.date_logged;
  if (customDate) {
    insertPayload.date_logged = customDate;
  }

  const { data, error } = await supabase
    .from('micro_jobs_ledger')
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Link multiple micro jobs to a single invoice
 */
export const linkJobsToInvoice = async (jobIds, invoiceId) => {
  const { data, error } = await supabase
    .from('micro_jobs_ledger')
    .update({
      billing_status: 'Billed',
      invoice_link: invoiceId
    })
    .in('job_id', jobIds)
    .select();

  if (error) throw error;
  return data;
};
