import { supabase } from '../client';

/**
 * Fetch overview summary statistics and recent activity logs for a client
 */
export const fetchClientDashboardSummary = async (clientId) => {
  // Fetch all projects for the client
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('id, status, name')
    .eq('client_id', clientId);

  if (pError) throw pError;

  const projectIds = (projects || []).map(p => p.id);

  // 1. Calculate Active Projects Count
  const activeProjects = (projects || []).filter(p => 
    !['completed', 'cancelled'].includes((p.status || '').toLowerCase())
  ).length;

  // 2. Calculate Completed Projects Count
  const completedProjects = (projects || []).filter(p => 
    (p.status || '').toLowerCase() === 'completed'
  ).length;

  // 3. Fetch Invoices and calculate pending invoices
  let pendingInvoices = 0;
  let invQuery = supabase
    .from('invoices')
    .select('*, projects(payment_status)');
  
  if (projectIds.length > 0) {
    invQuery = invQuery.or(`project_id.in.(${projectIds.join(',')}),client_link.eq.${clientId}`);
  } else {
    invQuery = invQuery.eq('client_link', clientId);
  }

  const { data: invoices, error: invError } = await invQuery;

  if (!invError && invoices) {
    pendingInvoices = invoices.filter(inv => {
      const paymentStatusLower = (inv.payment_status || '').toLowerCase();
      const projPaymentStatusLower = (inv.projects?.payment_status || '').toLowerCase();
      return paymentStatusLower !== 'paid' && paymentStatusLower !== 'settled' && 
             projPaymentStatusLower !== 'paid' && projPaymentStatusLower !== 'settled';
    }).length;
  }

  // 4. Calculate total messages sent/received in project chats
  let totalMessages = 0;
  if (projectIds.length > 0) {
    const { count, error: chatError } = await supabase
      .from('project_chats')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds);

    if (!chatError && count !== null) {
      totalMessages = count;
    }
  }

  // 5. Fetch recent project activity logs
  let recentActivity = [];
  if (projectIds.length > 0) {
    const { data: logs, error: logError } = await supabase
      .from('project_activity_logs')
      .select('*, projects(name, clients(name))')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(10);

    if (!logError && logs) {
      recentActivity = logs.map(log => {
        let type = 'status_change';
        const actionText = (log.action || '').toLowerCase();
        
        if (actionText.includes('chat') || actionText.includes('message')) {
          type = 'message';
        } else if (actionText.includes('milestone') || actionText.includes('progress')) {
          type = 'milestone';
        } else if (actionText.includes('asset') || actionText.includes('upload') || actionText.includes('file') || actionText.includes('media')) {
          type = 'asset';
        } else if (actionText.includes('invoice') || actionText.includes('billing')) {
          type = 'invoice';
        }

        return {
          id: log.id,
          description: log.action,
          createdAt: log.created_at,
          projectTitle: log.projects?.clients?.name || log.projects?.name || 'Project Update',
          type
        };
      });
    }
  }

  // 6. Synthesize recent activity for micro-job / CMS invoices (Option A)
  //    These invoices have no project_id so they never appear in project_activity_logs.
  //    We read them directly from the invoices table via client_link.
  const { data: cmsInvoices, error: cmsError } = await supabase
    .from('invoices')
    .select('id, invoice_no, grand_total, payment_status, created_at, updated_at')
    .eq('client_link', clientId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!cmsError && cmsInvoices && cmsInvoices.length > 0) {
    const cmsActivity = cmsInvoices.map(inv => {
      const status = (inv.payment_status || 'Pending');
      const total = inv.grand_total || '—';
      const invNo = inv.invoice_no || 'CMS';
      return {
        id: `cms-inv-${inv.id}`,
        description: `Micro-Job Invoice #${invNo} for ₹${total} — ${status}`,
        createdAt: inv.created_at,
        projectTitle: 'Micro-Job Invoice',
        type: 'invoice'
      };
    });

    // Merge with project activity logs, sort by date desc, keep top 10
    recentActivity = [...recentActivity, ...cmsActivity]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }

  return {
    activeProjects,
    completedProjects,
    pendingInvoices,
    totalMessages,
    recentActivity
  };
};


/**
 * Fetch all projects belonging to a client
 */
export const fetchClientProjects = async (clientId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;

  return (data || []).map(project => {
    let descText = project.description || '';
    if (descText.startsWith("JSON_METADATA:")) {
      try {
        const parsed = JSON.parse(descText.substring(14));
        descText = parsed.description || '';
      } catch (e) {
        console.error("Error parsing project JSON_METADATA:", e);
      }
    }

    return {
      id: project.id,
      title: project.name,
      service: project.service,
      stage: project.stage,
      status: project.status,
      createdAt: project.created_at,
      deadline: project.deadline,
      progressPercent: project.progress || (project.stage * 25),
      category: project.category || 'design',
      thumbnailUrl: null,
      description: descText
    };
  });
};

/**
 * Fetch full project blueprints & milestones
 */
export const fetchClientProjectDetail = async (projectId) => {
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_milestones (*)
    `)
    .eq('id', projectId)
    .single();

  if (error) throw error;

  let descText = project.description || '';
  if (descText.startsWith("JSON_METADATA:")) {
    try {
      const parsed = JSON.parse(descText.substring(14));
      descText = parsed.description || '';
    } catch (e) {
      console.error("Error parsing project detail JSON_METADATA:", e);
    }
  }

  const status = project.status;
  const progress = project.progress;
  const stage = project.stage;

  let maxCompletedPosition = -1;
  if (status === "Completed" || progress >= 100 || stage >= 5) {
    maxCompletedPosition = 4;
  } else if (progress >= 80 || stage >= 4) {
    maxCompletedPosition = 3;
  } else if (progress >= 60 || stage >= 3) {
    maxCompletedPosition = 2;
  } else if (progress >= 40 || stage >= 2) {
    maxCompletedPosition = 1;
  } else if (progress >= 20 || stage >= 1) {
    maxCompletedPosition = 0;
  }

  // Self-heal database if milestones state does not match stage/progress
  let needsSync = false;
  for (const m of (project.project_milestones || [])) {
    const shouldBeCompleted = maxCompletedPosition >= 0 && m.position <= maxCompletedPosition;
    if (m.completed !== shouldBeCompleted) {
      needsSync = true;
      break;
    }
  }

  if (needsSync && maxCompletedPosition >= 0) {
    supabase
      .from('project_milestones')
      .update({ completed: true })
      .eq('project_id', projectId)
      .lte('position', maxCompletedPosition)
      .then(() => {
        supabase
          .from('project_milestones')
          .update({ completed: false })
          .eq('project_id', projectId)
          .gt('position', maxCompletedPosition)
          .catch(err => console.error("Error healing milestones gt:", err));
      })
      .catch(err => console.error("Error healing milestones lte:", err));
  }

  const milestones = (project.project_milestones || [])
    .sort((a, b) => a.position - b.position)
    .map(m => {
      const isCompleted = m.completed || (maxCompletedPosition >= 0 && m.position <= maxCompletedPosition);
      return {
        id: m.id,
        title: m.name,
        description: '',
        isCompleted,
        completedAt: isCompleted ? m.updated_at || project.updated_at || project.created_at : null,
        order: m.position
      };
    });

  return {
    id: project.id,
    title: project.name,
    description: descText,
    service: project.service,
    stage: project.stage,
    status: project.status,
    createdAt: project.created_at,
    deadline: project.deadline,
    progressPercent: project.progress || (project.stage * 25),
    category: project.category || 'design',
    isPaid: (project.payment_status || '').toLowerCase() === 'paid' || (project.payment_status || '').toLowerCase() === 'settled',
    paymentStatus: project.payment_status || 'unpaid',
    milestones
  };
};

/**
 * Fetch deliverables/media assets for a project (locked until paid)
 */
export const fetchClientProjectMedia = async (projectId) => {
  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('payment_status')
    .eq('id', projectId)
    .single();

  if (pError) throw pError;

  const { data: media, error } = await supabase
    .from('project_media')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;

  const canDownload = (project?.payment_status || '').toLowerCase() === 'paid' || (project?.payment_status || '').toLowerCase() === 'settled';

  return (media || []).map(m => {
    const isImage = ['image', 'jpg', 'jpeg', 'png', 'webp', 'gif'].includes((m.file_type || '').toLowerCase()) || 
                    (m.file_name || '').match(/\.(jpg|jpeg|png|webp|gif)$/i);
    return {
      id: m.id,
      name: m.file_name,
      fileType: m.file_type || 'application/octet-stream',
      previewUrl: isImage ? m.file_url : null,
      canDownload,
      isOriginal: true,
      fileSizeMb: null,
      downloadUrl: m.file_url,
      uploadedAt: m.uploaded_at
    };
  });
};

/**
 * Fetch messaging stream
 */
export const fetchClientProjectChats = async (projectId, clientName) => {
  const { data, error } = await supabase
    .from('project_chats')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;

  return (data || []).map(c => {
    const isClient = (c.sender || '').toLowerCase() === 'client' || 
                     (clientName && (c.sender || '').toLowerCase() === clientName.toLowerCase());
    return {
      id: c.id,
      senderName: c.sender,
      senderType: isClient ? 'client' : 'admin',
      content: c.message,
      createdAt: c.created_at,
      attachmentUrl: null,
      attachmentName: null
    };
  });
};

/**
 * Send chat message in client thread
 */
export const sendClientChatMessage = async (projectId, senderName, content) => {
  const { data, error } = await supabase
    .from('project_chats')
    .insert([
      {
        project_id: projectId,
        sender: senderName || 'Client',
        message: content
      }
    ])
    .select()
    .single();

  if (error) throw error;

  // Insert project activity log for chat update
  await supabase
    .from('project_activity_logs')
    .insert([
      {
        project_id: projectId,
        action: `Client sent message: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`
      }
    ]);

  // Insert system alert notification for the Admin
  if ((senderName || '').toLowerCase() !== 'admin') {
    // We need the client_id. The easiest way is to fetch it from the project, 
    // or just pass it. Since we only have projectId here, let's fetch client_id.
    const { data: proj } = await supabase.from('projects').select('client_id').eq('id', projectId).single();
    if (proj && proj.client_id) {
      await supabase.from('client_notifications').insert([{
        client_id: proj.client_id,
        type: 'communication',
        title: 'New Client Message',
        message: `${senderName || 'Client'} sent: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        is_read: false
      }]);
    }
  }

  return data;
};

/**
 * Real-time Supabase chat subscription for client vault
 */
export const subscribeToClientChats = (projectId, clientName, onMessageReceived) => {
  return supabase
    .channel(`client-project-chat-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'project_chats',
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new;
          const isClient = (msg.sender || '').toLowerCase() === 'client' || 
                           (clientName && (msg.sender || '').toLowerCase() === clientName.toLowerCase());
          onMessageReceived({
            id: msg.id,
            senderName: msg.sender,
            senderType: isClient ? 'client' : 'admin',
            content: msg.message,
            createdAt: msg.created_at,
            attachmentUrl: null,
            attachmentName: null,
            eventType: 'INSERT'
          });
        } else if (payload.eventType === 'DELETE') {
          onMessageReceived({
            id: payload.old.id,
            eventType: 'DELETE'
          });
        }
      }
    )
    .subscribe();
};

/**
 * Clear all chat messages for a client's project
 */
export const clearClientProjectChats = async (projectId, clientName) => {
  const { data, error } = await supabase
    .from('project_chats')
    .delete()
    .eq('project_id', projectId);

  if (error) throw error;

  // Insert project activity log for chat cleared
  await supabase
    .from('project_activity_logs')
    .insert([
      {
        project_id: projectId,
        action: `Chat history was cleared by client ${clientName || 'Client'}.`
      }
    ]);

  return data;
};

const getVirtualInvoiceMap = async () => {
  try {
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('invoice_no, project_id');
      
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id, name, status, created_at');

    const getHighestInvoiceSerial = (invsList) => {
      let maxSerial = 22; // Baseline
      (invsList || []).forEach(inv => {
        if (!inv.invoice_no) return;
        const parts = inv.invoice_no.split('/');
        if (parts.length === 3 && parts[0] === 'NG' && !parts[2].startsWith('C')) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxSerial) {
            maxSerial = num;
          }
        }
      });
      return maxSerial;
    };

    let nextSerial = getHighestInvoiceSerial(allInvoices) + 1;
    const getLocalInvoiceNumber = (date, serial) => {
      const d = new Date(date || Date.now());
      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
      return `NG/${dateStr}/${serial.toString().padStart(4, '0')}`;
    };

    const sortedAllProjects = [...(allProjects || [])].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    const virtualInvoiceMap = new Map();
    sortedAllProjects.forEach(p => {
      const isCompleted = ['completed', 'cancelled', 'closed'].includes((p.status || '').toLowerCase());
      const isStandalone = p.is_standalone || false;
      
      if (!isCompleted && !isStandalone) {
        const hasDbInvoice = (allInvoices || []).some(inv => inv.project_id === p.id);
        if (!hasDbInvoice) {
          const createdDate = p.created_at || new Date().toISOString();
          let invNo = getLocalInvoiceNumber(createdDate, nextSerial);
          while ((allInvoices || []).some(i => i.invoice_no === invNo) || Array.from(virtualInvoiceMap.values()).includes(invNo)) {
            nextSerial++;
            invNo = getLocalInvoiceNumber(createdDate, nextSerial);
          }
          virtualInvoiceMap.set(p.id, invNo);
          nextSerial++;
        }
      }
    });

    return virtualInvoiceMap;
  } catch (err) {
    console.error("Failed to compute virtual invoice map:", err);
    return new Map();
  }
};

/**
 * Fetch invoices ledger of a client
 */
export const fetchClientInvoices = async (clientId) => {
  // 1. Fetch client's projects to get project mapping (with full details for virtual invoices)
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('id, name, service, status, payment_status, quote, discount, advance_amount, created_at, deadline, description')
    .eq('client_id', clientId);

  if (pError) throw pError;
  const projectIds = (projects || []).map(p => p.id);
  const projectMap = new Map((projects || []).map(p => [p.id, p]));

  // 2. Fetch invoices belonging to those projects OR directly linked to the client
  let query = supabase.from('invoices').select('*');
  if (projectIds.length > 0) {
    query = query.or(`project_id.in.(${projectIds.join(',')}),client_link.eq.${clientId}`);
  } else {
    query = query.eq('client_link', clientId);
  }

  const { data: invoices, error: invError } = await query
    .order('created_at', { ascending: false })
    .order('invoice_no', { ascending: false });

  if (invError) throw invError;

  const resultInvoices = [];

  // Format existing invoices from the database
  if (invoices && invoices.length > 0) {
    invoices.forEach(inv => {
      const proj = projectMap.get(inv.project_id);
      const paymentStatusLower = (inv.payment_status || '').toLowerCase();
      const projPaymentStatusLower = (proj?.payment_status || '').toLowerCase();
      const status = (paymentStatusLower === 'paid' || paymentStatusLower === 'settled' || 
                      projPaymentStatusLower === 'paid' || projPaymentStatusLower === 'settled') ? 'paid' : 'sent';
      
      const subtotal = proj ? parseFloat(proj.quote) : parseFloat(inv.grand_total);
      const discount = proj ? parseFloat(proj.discount || 0) : 0;
      const amount = subtotal - discount;
      
      resultInvoices.push({
        id: inv.id,
        invoiceNumber: inv.invoice_no,
        projectTitle: inv.project_service || proj?.name || 'Design Services',
        amount,
        status,
        projectStatus: proj?.status || 'Completed',
        createdAt: inv.issue_date || inv.created_at,
        dueDate: inv.issue_date ? new Date(new Date(inv.issue_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        paidAt: status === 'paid' ? inv.created_at : null,
        currency: 'INR'
      });
    });
  }

  // 3. For any project that does NOT have an invoice record in the database,
  // we dynamically generate a virtual invoice.
  const virtualInvoiceMap = await getVirtualInvoiceMap();
  for (const proj of projects) {
    // Skip general support chat or projects with quote <= 0
    if (parseFloat(proj.quote) <= 0 || (proj.service === "General Support & Chat" && parseFloat(proj.quote) <= 0)) {
      continue;
    }

    const hasDbInvoice = (invoices || []).some(inv => inv.project_id === proj.id);
    if (!hasDbInvoice) {
      const subtotal = parseFloat(proj.quote) || 0;
      const discount = parseFloat(proj.discount || 0);
      const grandTotal = subtotal - discount;
      
      const createdDate = new Date(proj.created_at || Date.now());
      const dateStr = createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
      const virtualInvoiceNo = virtualInvoiceMap.get(proj.id) || `NG/${dateStr}/${String(proj.id).padStart(4, '0')}`;
      const projPaymentStatusLower = (proj.payment_status || '').toLowerCase();
      const status = (projPaymentStatusLower === 'paid' || projPaymentStatusLower === 'settled') ? 'paid' : 'sent';

      resultInvoices.push({
        id: `virtual-${proj.id}`,
        invoiceNumber: virtualInvoiceNo,
        projectTitle: proj.service || proj.name || 'Design Services',
        amount: grandTotal,
        status,
        projectStatus: proj.status || 'Active',
        createdAt: proj.created_at,
        dueDate: proj.created_at ? new Date(new Date(proj.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        paidAt: status === 'paid' ? proj.created_at : null,
        currency: 'INR',
        isVirtual: true
      });
    }
  }

  // Sort the final result invoices stably so that the latest issueDate/createdAt and highest serial number are always at the top
  resultInvoices.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    if (timeA !== timeB) return timeB - timeA;

    const numA = a.invoiceNumber || "";
    const numB = b.invoiceNumber || "";
    if (numA < numB) return 1;
    if (numA > numB) return -1;
    return 0;
  });

  return resultInvoices;
};

/**
 * Fetch detailed invoice and generate items/bill structure
 */
export const fetchClientInvoiceDetail = async (invoiceId) => {
  if (typeof invoiceId === 'string' && invoiceId.startsWith('virtual-')) {
    const projectId = parseInt(invoiceId.replace('virtual-', ''));
    
    const { data: proj, error: projError } = await supabase
      .from('projects')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', projectId)
      .single();
      
    if (projError) throw projError;
    
    const createdDate = new Date(proj.created_at || Date.now());
    const dateStr = createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
    
    const virtualInvoiceMap = await getVirtualInvoiceMap();
    const virtualInvoiceNo = virtualInvoiceMap.get(proj.id) || `NG/${dateStr}/${String(proj.id).padStart(4, '0')}`;
    
    const subtotal = parseFloat(proj.quote) || 0;
    const discount = parseFloat(proj.discount || 0);
    const grandTotal = subtotal - discount;
    
    const projPaymentStatusLower = (proj.payment_status || '').toLowerCase();
    const status = (projPaymentStatusLower === 'paid' || projPaymentStatusLower === 'settled') ? 'paid' : 'sent';
    
    let qty = 1;
    let rate = subtotal;
    let descText = proj.service || 'Design Services';

    if (proj.description?.startsWith("JSON_METADATA:")) {
      try {
        const parsed = JSON.parse(proj.description.substring(14));
        qty = parsed.qty || 1;
        rate = parsed.rate || (subtotal / qty);
        descText = proj.service || parsed.description || 'Design Services';
      } catch (e) {
        console.error("Error parsing virtual invoice project description:", e);
      }
    }

    const lineItems = [
      {
        id: 1,
        description: descText,
        quantity: qty,
        unitPrice: rate,
        total: subtotal - discount
      }
    ];

    let bankingDetails = {
      bankName: "STATE BANK OF INDIA",
      accountName: "NETRA GRAPHICS",
      accountNumber: "20198798116",
      ifscCode: "SBIN0060152",
      upiId: "netragraphics@sbi"
    };
    let adminProfile = {
      businessName: "NETRA GRAPHICS",
      address: "Shreeji Complex, Opp. AaramGruh, Mendarda-Sasan Road, Mendarda-362260",
      phone: "73590 93035",
      email: "contact@netragraphics.com",
      instagram: "HIRAPARASAVANPHOTOGRAPHER"
    };

    try {
      const { data: settingsClient } = await supabase
        .from('clients')
        .select('address')
        .eq('email', 'settings@netra.graphics')
        .maybeSingle();
        
      if (settingsClient?.address) {
        const parsed = JSON.parse(settingsClient.address);
        if (parsed.banking) bankingDetails = parsed.banking;
        if (parsed.profile) adminProfile = parsed.profile;
      }
    } catch (e) {
      console.error("Error fetching system settings for client virtual invoice details:", e);
    }

    return {
      id: invoiceId,
      invoiceNumber: virtualInvoiceNo,
      status,
      projectStatus: proj.status || 'Active',
      advanceAmount: parseFloat(proj.advance_amount || 0),
      discount,
      subtotal,
      amount: grandTotal,
      createdAt: proj.created_at,
      dueDate: proj.created_at ? new Date(new Date(proj.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      projectTitle: proj.service || 'Design Services',
      currency: 'INR',
      lineItems,
      notes: "Thank you for trusting Netra Graphics with your brand's design and digital evolution. Payments can be processed through UPI, bank details, or directly from the administrative portal invoice link.",
      client: proj.clients ? {
        name: proj.clients.name,
        email: proj.clients.email,
        phone: proj.clients.phone,
        address: proj.clients.address
      } : {
        name: proj.name,
        email: '',
        phone: '',
        address: ''
      },
      bankingDetails,
      adminProfile
    };
  }

  const { data: inv, error } = await supabase
    .from('invoices')
    .select(`
      *,
      projects (
        *,
        clients (*),
        project_activity_logs (*)
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (error) throw error;

  let lineItems = [];
  let fetchedMicroJobs = false;

  if (inv.micro_job_ids && inv.micro_job_ids.length > 0) {
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('micro_jobs_ledger')
        .select('*')
        .in('job_id', inv.micro_job_ids);
      
      if (!jobsError && jobs && jobs.length > 0) {
        jobs.sort((a, b) => new Date(a.date_logged).getTime() - new Date(b.date_logged).getTime());

        lineItems = jobs.map((job, idx) => {
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
              console.error("Failed to parse JSON_METADATA in client micro job:", e);
            }
          }
          
          return {
            id: idx + 1,
            description: taskName,
            quantity: qty,
            unitPrice: rate,
            discount: discount,
            total: (qty * rate) - discount
          };
        });
        fetchedMicroJobs = true;
      }
    } catch (jobsErr) {
      console.error("Error fetching micro jobs for client invoice detail:", jobsErr);
    }
  }

  const payStatus = (inv.payment_status || inv.projects?.payment_status || '').toLowerCase();
  const status = (payStatus === 'paid' || payStatus === 'settled') ? 'paid' : 'sent';
  const amount = parseFloat(inv.grand_total);
  
  let discount, subtotal;
  if (fetchedMicroJobs) {
    discount = lineItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  } else {
    discount = parseFloat(inv.projects?.discount || 0);
    subtotal = parseFloat(inv.projects?.quote || amount + discount);

    let qty = 1;
    let rate = subtotal;
    let descText = inv.project_service || inv.projects?.service || inv.projects?.name || 'Design Services';

    if (inv.projects?.description?.startsWith("JSON_METADATA:")) {
      try {
        const parsed = JSON.parse(inv.projects.description.substring(14));
        qty = parsed.qty || 1;
        rate = parsed.rate || (subtotal / qty);
        descText = inv.project_service || inv.projects?.service || parsed.description || inv.projects?.name || 'Design Services';
      } catch (e) {
        console.error("Error parsing invoice item JSON_METADATA:", e);
      }
    }

    lineItems = [
      {
        id: 1,
        description: descText,
        quantity: qty,
        unitPrice: rate,
        discount: discount,
        total: subtotal - discount
      }
    ];
  }

  // Fetch global settings for bankingDetails and adminProfile
  let bankingDetails = {
    bankName: "STATE BANK OF INDIA",
    accountName: "NETRA GRAPHICS",
    accountNumber: "20198798116",
    ifscCode: "SBIN0060152",
    upiId: "netragraphics@sbi"
  };
  let adminProfile = {
    businessName: "NETRA GRAPHICS",
    address: "Shreeji Complex, Opp. AaramGruh, Mendarda-Sasan Road, Mendarda-362260",
    phone: "73590 93035",
    email: "contact@netragraphics.com",
    instagram: "HIRAPARASAVANPHOTOGRAPHER"
  };

  try {
    const { data: settingsClient } = await supabase
      .from('clients')
      .select('address')
      .eq('email', 'settings@netra.graphics')
      .maybeSingle();
      
    if (settingsClient?.address) {
      const parsed = JSON.parse(settingsClient.address);
      if (parsed.banking) bankingDetails = parsed.banking;
      if (parsed.profile) adminProfile = parsed.profile;
    }
  } catch (e) {
    console.error("Error fetching system settings for client invoice details:", e);
  }

  const discountVal = discount;
  const subtotalVal = subtotal;

  // Derive completion date: look in activity logs for a "completed" entry
  let completionDate = null;
  const projectStatus = (inv.projects?.status || '').toLowerCase();
  if (projectStatus === 'completed') {
    const activityLogs = inv.projects?.project_activity_logs || [];
    const completionLog = activityLogs
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .find(l => {
        const action = (l.action || '').toLowerCase();
        return action.includes('completed') || action.includes('final payment');
      });
    if (completionLog?.created_at) {
      completionDate = completionLog.created_at;
    }
  }

  // For batch invoices (no linked project), the completion date was stored in the JSON_MOCK payload
  if (!completionDate && inv.client_name?.startsWith('JSON_MOCK:')) {
    try {
      const batchData = JSON.parse(inv.client_name.substring(10));
      if (batchData.completionDate) completionDate = batchData.completionDate;
    } catch (e) { /* ignore parse errors */ }
  }

  return {
    id: inv.id,
    invoiceNumber: inv.invoice_no,
    status,
    projectStatus: (inv.micro_job_ids && inv.micro_job_ids.length > 0) ? 'Completed' : (inv.projects?.status || 'Active'),
    advanceAmount: inv.projects?.advance_amount || 0,
    discount: discountVal,
    subtotal: subtotalVal,
    amount: subtotalVal - discountVal,
    createdAt: inv.issue_date || inv.created_at,
    dueDate: inv.issue_date ? new Date(new Date(inv.issue_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
    projectTitle: inv.projects?.name || inv.project_service || 'Design Services',
    currency: 'INR',
    lineItems,
    completionDate, // null for non-completed or virtual invoices
    notes: "Thank you for trusting Netra Graphics with your brand's design and digital evolution. Payments can be processed through UPI, bank details, or directly from the administrative portal invoice link.",
    client: inv.projects?.clients ? {
      name: inv.projects.clients.name,
      email: inv.projects.clients.email,
      phone: inv.projects.clients.phone,
      address: inv.projects.clients.address
    } : {
      name: inv.client_name,
      email: '',
      phone: '',
      address: ''
    },
    bankingDetails,
    adminProfile
  };
};

/**
 * Update client profile contact information
 */
export const updateClientVaultProfile = async (clientId, updates) => {
  const { data, error } = await supabase
    .from('clients')
    .update({
      pending_profile_update: updates
    })
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
