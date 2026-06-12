import { supabase } from '../client';

// Track if we need to use local fallback (in-memory only to allow auto-recovery on reload)
let useLocalFallback = false;

const setLocalFallback = (value) => {
  useLocalFallback = value;
};

const getLocalJobs = () => {
  try {
    const data = localStorage.getItem('mock_micro_jobs');
    console.log("getLocalJobs raw data:", data);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse local micro jobs:", e);
    return [];
  }
};

const saveLocalJobs = (jobs) => {
  try {
    console.log("saveLocalJobs writing:", jobs);
    localStorage.setItem('mock_micro_jobs', JSON.stringify(jobs));
  } catch (e) {
    console.error("Failed to save local micro jobs:", e);
  }
};

/**
 * Fetch all micro jobs from the database
 */
export const getMicroJobs = async () => {
  console.log("getMicroJobs called. useLocalFallback:", useLocalFallback);
  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase
        .from('micro_jobs_ledger')
        .select(`
          *,
          clients (*)
        `)
        .order('date_logged', { ascending: false });

      if (error) {
        console.log("getMicroJobs supabase error:", error);
        if (error.code === 'PGRST205' || error.message?.includes('micro_jobs_ledger')) {
          console.warn("Table micro_jobs_ledger does not exist. Falling back to localStorage.");
          setLocalFallback(true);
        } else {
          throw error;
        }
      } else {
        return (data || []).map(job => {
          let taskName = job.task_name;
          let qty = 1;
          let rate = parseFloat(job.amount);
          let discount = 0;

          if (taskName && taskName.startsWith("JSON_METADATA:")) {
            try {
              const parsed = JSON.parse(taskName.substring(14));
              taskName = parsed.taskName || '';
              qty = parsed.qty !== undefined ? parsed.qty : 1;
              rate = parsed.rate !== undefined ? parsed.rate : (parseFloat(job.amount) / qty);
              discount = parsed.discount !== undefined ? parsed.discount : 0;
            } catch (e) {
              console.error("Failed to parse JSON_METADATA in micro job task name:", e);
            }
          }

          return {
            jobId: job.job_id,
            clientLink: job.client_link,
            taskName,
            qty,
            rate,
            discount,
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
          };
        });
      }
    } catch (err) {
      console.warn("Failed to fetch micro jobs from Supabase, falling back to local:", err);
      setLocalFallback(true);
    }
  }

  if (useLocalFallback) {
    const rawJobs = getLocalJobs();
    let clientsMap = {};
    try {
      const { data: clientsData } = await supabase.from('clients').select('*');
      if (clientsData) {
        clientsData.forEach(c => {
          clientsMap[c.id] = c;
        });
      }
    } catch (err) {
      console.warn("Failed to fetch clients for micro-job resolution:", err);
    }
    
    return rawJobs.map(job => {
      let taskName = job.task_name || job.taskName;
      let qty = job.qty !== undefined ? job.qty : 1;
      let rate = job.rate !== undefined ? job.rate : parseFloat(job.amount);
      let discount = job.discount !== undefined ? job.discount : 0;

      if (taskName && taskName.startsWith("JSON_METADATA:")) {
        try {
          const parsed = JSON.parse(taskName.substring(14));
          taskName = parsed.taskName || '';
          qty = parsed.qty !== undefined ? parsed.qty : 1;
          rate = parsed.rate !== undefined ? parsed.rate : (parseFloat(job.amount) / qty);
          discount = parsed.discount !== undefined ? parsed.discount : 0;
        } catch (e) {
          console.error("Failed to parse JSON_METADATA in micro job task name:", e);
        }
      }

      return {
        jobId: job.job_id || job.jobId,
        clientLink: job.client_link || job.clientLink,
        taskName,
        qty,
        rate,
        discount,
        amount: parseFloat(job.amount),
        dateLogged: job.date_logged || job.dateLogged,
        billingStatus: job.billing_status || job.billingStatus || 'Unbilled',
        invoiceLink: job.invoice_link || job.invoiceLink,
        client: clientsMap[job.client_link || job.clientLink] ? {
          id: clientsMap[job.client_link || job.clientLink].id,
          name: clientsMap[job.client_link || job.clientLink].name,
          phone: clientsMap[job.client_link || job.clientLink].phone,
          email: clientsMap[job.client_link || job.clientLink].email,
          address: clientsMap[job.client_link || job.clientLink].address
        } : null
      };
    }).sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged));
  }
};

/**
 * Create a new micro-job entry
 */
export const createMicroJob = async (jobData) => {
  const qty = jobData.qty !== undefined ? jobData.qty : 1;
  const rate = jobData.rate !== undefined ? jobData.rate : jobData.amount;
  const discount = jobData.discount !== undefined ? jobData.discount : 0;

  const serializedTaskName = `JSON_METADATA:${JSON.stringify({
    taskName: jobData.taskName || jobData.task_name,
    qty,
    rate,
    discount
  })}`;

  const insertPayload = {
    client_link: jobData.clientLink || jobData.client_link,
    task_name: serializedTaskName,
    amount: jobData.amount,
    billing_status: 'Unbilled'
  };

  const customDate = jobData.dateLogged || jobData.date_logged;
  if (customDate) {
    insertPayload.date_logged = customDate;
  }

  if (!useLocalFallback) {
    try {
      console.log("createMicroJob: Attempting Supabase insert with payload:", insertPayload);
      const { data, error } = await supabase
        .from('micro_jobs_ledger')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.log("createMicroJob: Supabase error:", error);
        if (error.code === 'PGRST205' || error.message?.includes('micro_jobs_ledger')) {
          console.warn("Table micro_jobs_ledger does not exist. Saving to localStorage.");
          setLocalFallback(true);
        } else {
          throw error;
        }
      } else {
        console.log("createMicroJob: Supabase insert success:", data);
        return {
          ...data,
          jobId: data.job_id,
          clientLink: data.client_link,
          taskName: jobData.taskName || jobData.task_name,
          qty,
          rate,
          discount,
          amount: parseFloat(data.amount)
        };
      }
    } catch (err) {
      console.warn("Failed to insert micro job to Supabase, falling back to local:", err);
      setLocalFallback(true);
    }
  }

  if (useLocalFallback) {
    console.log("createMicroJob: Using local fallback. jobData:", jobData);
    const rawJobs = getLocalJobs();
    const newJob = {
      job_id: Math.random().toString(36).substr(2, 9),
      client_link: insertPayload.client_link,
      task_name: insertPayload.task_name,
      amount: insertPayload.amount,
      date_logged: insertPayload.date_logged || new Date().toISOString(),
      billing_status: insertPayload.billing_status
    };
    rawJobs.push(newJob);
    saveLocalJobs(rawJobs);
    return {
      ...newJob,
      jobId: newJob.job_id,
      clientLink: newJob.client_link,
      taskName: jobData.taskName || jobData.task_name,
      qty,
      rate,
      discount,
      amount: parseFloat(newJob.amount)
    };
  }
};

/**
 * Link multiple micro jobs to a single invoice
 */
export const linkJobsToInvoice = async (jobIds, invoiceId) => {
  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase
        .from('micro_jobs_ledger')
        .update({
          billing_status: 'Billed',
          invoice_link: invoiceId
        })
        .in('job_id', jobIds)
        .select();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('micro_jobs_ledger')) {
          setLocalFallback(true);
        } else {
          throw error;
        }
      } else {
        return data;
      }
    } catch (err) {
      console.warn("Failed to link micro jobs on Supabase, falling back to local:", err);
      setLocalFallback(true);
    }
  }

  if (useLocalFallback) {
    const rawJobs = getLocalJobs();
    const updatedJobs = rawJobs.map(job => {
      const jId = job.job_id || job.jobId;
      if (jobIds.includes(jId)) {
        return {
          ...job,
          billing_status: 'Billed',
          invoice_link: invoiceId
        };
      }
      return job;
    });
    saveLocalJobs(updatedJobs);
    return updatedJobs.filter(job => jobIds.includes(job.job_id || job.jobId));
  }
};

/**
 * Revert multiple micro jobs back to Unbilled status
 */
export const revertJobsToLedger = async (jobIds) => {
  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase
        .from('micro_jobs_ledger')
        .update({
          billing_status: 'Unbilled',
          invoice_link: null
        })
        .in('job_id', jobIds)
        .select();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('micro_jobs_ledger')) {
          setLocalFallback(true);
        } else {
          throw error;
        }
      } else {
        return data;
      }
    } catch (err) {
      console.warn("Failed to revert micro jobs on Supabase, falling back to local:", err);
      setLocalFallback(true);
    }
  }

  if (useLocalFallback) {
    const rawJobs = getLocalJobs();
    const updatedJobs = rawJobs.map(job => {
      const jId = job.job_id || job.jobId;
      if (jobIds.includes(jId)) {
        return {
          ...job,
          billing_status: 'Unbilled',
          invoice_link: null
        };
      }
      return job;
    });
    saveLocalJobs(updatedJobs);
    return updatedJobs.filter(job => jobIds.includes(job.job_id || job.jobId));
  }
};

/**
 * Update an existing micro-job entry
 */
export const updateMicroJob = async (jobId, jobData) => {
  const qty = jobData.qty !== undefined ? jobData.qty : 1;
  const rate = jobData.rate !== undefined ? jobData.rate : jobData.amount;
  const discount = jobData.discount !== undefined ? jobData.discount : 0;

  const serializedTaskName = `JSON_METADATA:${JSON.stringify({
    taskName: jobData.taskName || jobData.task_name,
    qty,
    rate,
    discount
  })}`;

  const updatePayload = {
    client_link: jobData.clientLink || jobData.client_link,
    task_name: serializedTaskName,
    amount: jobData.amount,
    billing_status: jobData.billingStatus || jobData.billing_status || 'Unbilled',
    invoice_link: jobData.invoiceLink || jobData.invoice_link || null
  };

  const customDate = jobData.dateLogged || jobData.date_logged;
  if (customDate) {
    updatePayload.date_logged = customDate;
  }

  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase
        .from('micro_jobs_ledger')
        .update(updatePayload)
        .eq('job_id', jobId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('micro_jobs_ledger')) {
          setLocalFallback(true);
        } else {
          throw error;
        }
      } else {
        return {
          jobId: data.job_id,
          clientLink: data.client_link,
          taskName: jobData.taskName || jobData.task_name,
          qty,
          rate,
          discount,
          amount: parseFloat(data.amount),
          dateLogged: data.date_logged,
          billingStatus: data.billing_status,
          invoiceLink: data.invoice_link
        };
      }
    } catch (err) {
      console.warn("Failed to update micro job in Supabase, falling back to local:", err);
      setLocalFallback(true);
    }
  }

  if (useLocalFallback) {
    const rawJobs = getLocalJobs();
    const updatedJobs = rawJobs.map(job => {
      const jId = job.job_id || job.jobId;
      if (jId === jobId) {
        return {
          ...job,
          client_link: updatePayload.client_link,
          task_name: updatePayload.task_name,
          amount: updatePayload.amount,
          date_logged: updatePayload.date_logged || job.date_logged || job.dateLogged,
          billing_status: updatePayload.billing_status,
          invoice_link: updatePayload.invoice_link
        };
      }
      return job;
    });
    saveLocalJobs(updatedJobs);
    const job = updatedJobs.find(j => (j.job_id || j.jobId) === jobId);
    return {
      jobId: job.job_id || job.jobId,
      clientLink: job.client_link || job.clientLink,
      taskName: jobData.taskName || jobData.task_name,
      qty,
      rate,
      discount,
      amount: parseFloat(job.amount),
      dateLogged: job.date_logged || job.dateLogged,
      billingStatus: job.billing_status || job.billingStatus,
      invoiceLink: job.invoice_link || job.invoiceLink
    };
  }
};


/**
 * Delete a single micro-job entry by jobId
 */
export const deleteMicroJob = async (jobId) => {
  if (!useLocalFallback) {
    try {
      const { error } = await supabase
        .from('micro_jobs_ledger')
        .delete()
        .eq('job_id', jobId);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('micro_jobs_ledger')) {
          setLocalFallback(true);
        } else {
          throw error;
        }
      } else {
        return { success: true };
      }
    } catch (err) {
      console.warn("Failed to delete micro job in Supabase, falling back to local:", err);
      setLocalFallback(true);
    }
  }

  if (useLocalFallback) {
    const rawJobs = getLocalJobs();
    const filteredJobs = rawJobs.filter(job => (job.job_id || job.jobId) !== jobId);
    saveLocalJobs(filteredJobs);
    return { success: true };
  }
};

/**
 * Clear ALL micro-job entries from the ledger
 */
export const clearAllMicroJobs = async () => {
  if (!useLocalFallback) {
    try {
      const { error } = await supabase
        .from('micro_jobs_ledger')
        .delete()
        .not('job_id', 'is', null);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('micro_jobs_ledger')) {
          setLocalFallback(true);
        } else {
          throw error;
        }
      } else {
        return { success: true };
      }
    } catch (err) {
      console.warn("Failed to clear all micro jobs in Supabase, falling back to local:", err);
      setLocalFallback(true);
    }
  }

  if (useLocalFallback) {
    saveLocalJobs([]);
    return { success: true };
  }
};
