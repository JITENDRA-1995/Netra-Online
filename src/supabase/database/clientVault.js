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
  if (projectIds.length > 0) {
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*, projects(payment_status)')
      .in('project_id', projectIds);

    if (!invError && invoices) {
      pendingInvoices = invoices.filter(inv => 
        (inv.projects?.payment_status || '').toLowerCase() !== 'paid'
      ).length;
    }
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
      .select('*, projects(name)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
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
          projectTitle: log.projects?.name || 'Project Update',
          type
        };
      });
    }
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
    .order('created_at', { ascending: false });

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
    isPaid: (project.payment_status || '').toLowerCase() === 'paid',
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
    .order('uploaded_at', { ascending: false });

  if (error) throw error;

  const canDownload = (project?.payment_status || '').toLowerCase() === 'paid';

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
    .order('created_at', { ascending: true });

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

/**
 * Fetch invoices ledger of a client
 */
export const fetchClientInvoices = async (clientId) => {
  // 1. Fetch client's projects to get project mapping
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('id, name, status, payment_status')
    .eq('client_id', clientId);

  if (pError) throw pError;
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map(p => p.id);
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // 2. Fetch invoices belonging to those projects
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  if (invError) throw invError;

  return (invoices || []).map(inv => {
    const proj = projectMap.get(inv.project_id);
    const status = (proj?.payment_status || '').toLowerCase() === 'paid' ? 'paid' : 'sent';
    
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_no,
      projectTitle: inv.project_service || proj?.name || 'Design Services',
      amount: parseFloat(inv.grand_total),
      status,
      projectStatus: proj?.status || 'Active',
      createdAt: inv.issue_date || inv.created_at,
      dueDate: inv.issue_date ? new Date(new Date(inv.issue_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      paidAt: status === 'paid' ? inv.created_at : null,
      currency: 'INR'
    };
  });
};

/**
 * Fetch detailed invoice and generate items/bill structure
 */
export const fetchClientInvoiceDetail = async (invoiceId) => {
  const { data: inv, error } = await supabase
    .from('invoices')
    .select(`
      *,
      projects (
        *,
        clients (*)
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (error) throw error;

  const status = (inv.projects?.payment_status || '').toLowerCase() === 'paid' ? 'paid' : 'sent';
  const amount = parseFloat(inv.grand_total);

  // Line items: map from project description if JSON_METADATA is used, otherwise default
  let qty = 1;
  let rate = amount;
  let descText = inv.project_service || inv.projects?.name || 'Design Services';

  if (inv.projects?.description?.startsWith("JSON_METADATA:")) {
    try {
      const parsed = JSON.parse(inv.projects.description.substring(14));
      qty = parsed.qty || 1;
      rate = parsed.rate || (amount / qty);
      descText = parsed.description || inv.project_service || inv.projects?.name || 'Design Services';
    } catch (e) {
      console.error("Error parsing invoice item JSON_METADATA:", e);
    }
  }

  const lineItems = [
    {
      id: 1,
      description: descText,
      quantity: qty,
      unitPrice: rate,
      total: amount
    }
  ];

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

  const discount = parseFloat(inv.projects?.discount || 0);
  const subtotal = parseFloat(inv.projects?.quote || amount + discount);

  return {
    id: inv.id,
    invoiceNumber: inv.invoice_no,
    status,
    projectStatus: inv.projects?.status || 'Active',
    advanceAmount: inv.projects?.advance_amount || 0,
    discount,
    subtotal,
    amount,
    createdAt: inv.issue_date || inv.created_at,
    dueDate: inv.issue_date ? new Date(new Date(inv.issue_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
    projectTitle: inv.projects?.name || inv.project_service || 'Design Services',
    currency: 'INR',
    lineItems,
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
