import { supabase } from '../client';

/* ==========================================================================
   1. Projects Core (Ignition Queue / Flames)
   ========================================================================== */

/**
 * Fetch all projects, optionally resolving nested milestones, logs, media, and client details
 */
export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients (*),
      project_milestones (*),
      project_activity_logs (*),
      project_chats (*),
      project_media (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Format to match the frontend expected nested state objects
  return data.map(project => {
    let qty = 1;
    let rate = parseFloat(project.quote);
    let descText = project.description || '';
    let priority = 'Normal';
    let acknowledgedDeadline = '';
    let alertMeDays = '';

    if (descText.startsWith("JSON_METADATA:")) {
      try {
        const parsed = JSON.parse(descText.substring(14));
        qty = parsed.qty || 1;
        rate = parsed.rate || (parseFloat(project.quote) / qty);
        descText = parsed.description || '';
        priority = parsed.priority || 'Normal';
        acknowledgedDeadline = parsed.acknowledgedDeadline || '';
        alertMeDays = parsed.alertMeDays !== undefined ? parsed.alertMeDays : '';
      } catch (e) {
        console.error("Failed to parse JSON_METADATA in project description:", e);
      }
    }

    return {
      id: project.id,
      name: project.name,
      service: project.service,
      stage: project.stage,
      status: project.status,
      createdAt: new Date(project.created_at).getTime(),
      deadline: project.deadline,
      quote: parseFloat(project.quote),
      discount: parseFloat(project.discount || 0),
      discountValue: project.discount_value,
      discountType: project.discount_type,
      advanceAmount: parseFloat(project.advance_amount || 0),
      paymentStatus: project.payment_status,
      description: descText,
      qty: qty,
      rate: rate,
      category: project.category || 'branding',
      progress: Math.max(20, project.progress || 0),
      priority: priority,
      acknowledgedDeadline: acknowledgedDeadline,
      alertMeDays: alertMeDays,
      client: project.clients ? {
        id: project.clients.id,
        name: project.clients.name,
        phone: project.clients.phone,
        email: project.clients.email,
        address: project.clients.address
      } : null,
      milestones: (() => {
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

        return (project.project_milestones || [])
          .sort((a, b) => a.position - b.position)
          .map(m => ({
            name: m.name,
            completed: m.completed || (maxCompletedPosition >= 0 && m.position <= maxCompletedPosition)
          }));
      })(),
      activityLog: (project.project_activity_logs || [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(l => ({ action: l.action, time: new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), raw_date: new Date(l.created_at).getTime() })),
      collaborationStream: (project.project_chats || [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(c => ({ id: c.id, sender: c.sender, text: c.message, time: new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), raw_date: new Date(c.created_at).getTime() })),
      mediaVault: (project.project_media || []).map(m => ({
        id: m.id,
        name: m.file_name,
        url: m.file_url,
        type: m.file_type,
        time: new Date(m.uploaded_at).toLocaleDateString(),
        raw_date: new Date(m.uploaded_at).getTime(),
        uploaded_by: m.uploaded_by
      }))
    };
  });
};

/**
 * Ignites a new project with initial milestones and logs
 */
export const igniteProject = async (projectData) => {
  const desc = projectData.description || '';
  const serializedDesc = `JSON_METADATA:${JSON.stringify({
    qty: projectData.qty || 1,
    rate: projectData.rate || (projectData.quote / (projectData.qty || 1)),
    description: desc,
    priority: projectData.priority || 'Normal',
    acknowledgedDeadline: '',
    alertMeDays: projectData.alertMeDays !== undefined ? projectData.alertMeDays : ''
  })}`;

  // 1. Insert core project details
  const { data: project, error: pError } = await supabase
    .from('projects')
    .insert([
      {
        name: projectData.name,
        service: projectData.service,
        stage: projectData.stage || 1,
        status: projectData.status || 'Ongoing',
        quote: projectData.quote,
        discount: projectData.discount || 0,
        discount_value: projectData.discountValue,
        discount_type: projectData.discountType || 'rs',
        advance_amount: projectData.advanceAmount || 0,
        payment_status: projectData.paymentStatus || 'part',
        deadline: projectData.deadline,
        client_id: projectData.client_id,
        description: serializedDesc,
        category: projectData.category || 'branding',
        progress: Math.max(20, projectData.progress || 0)
      }
    ])
    .select()
    .single();

  if (pError) throw pError;

  // 2. Insert initial milestones
  if (projectData.milestones && projectData.milestones.length > 0) {
    const milestonesToInsert = projectData.milestones.map((m, idx) => ({
      project_id: project.id,
      name: m.name,
      completed: m.completed || false,
      position: idx
    }));
    const { error: mError } = await supabase
      .from('project_milestones')
      .insert(milestonesToInsert);
      
    if (mError) throw mError;
  }

  // 3. Insert initial activity log
  const { error: lError } = await supabase
    .from('project_activity_logs')
    .insert([
      { project_id: project.id, action: 'Project Ignited' }
    ]);

  if (lError) throw lError;

  return project;
};

/**
 * Update project state details (stage, financials, timeline)
 */
export const updateProjectState = async (projectId, updates) => {
  const updatePayload = {};
  if (updates.name !== undefined) updatePayload.name = updates.name;
  if (updates.service !== undefined) updatePayload.service = updates.service;
  if (updates.stage !== undefined) updatePayload.stage = updates.stage;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.quote !== undefined) updatePayload.quote = updates.quote;
  if (updates.discount !== undefined) updatePayload.discount = updates.discount;
  if (updates.discountValue !== undefined || updates.discount_value !== undefined) {
    updatePayload.discount_value = updates.discountValue !== undefined ? updates.discountValue : updates.discount_value;
  }
  if (updates.discountType !== undefined || updates.discount_type !== undefined) {
    updatePayload.discount_type = updates.discountType !== undefined ? updates.discountType : updates.discount_type;
  }
  if (updates.advanceAmount !== undefined || updates.advance_amount !== undefined) {
    updatePayload.advance_amount = updates.advanceAmount !== undefined ? updates.advanceAmount : updates.advance_amount;
  }
  if (updates.paymentStatus !== undefined || updates.payment_status !== undefined) {
    updatePayload.payment_status = updates.paymentStatus !== undefined ? updates.paymentStatus : updates.payment_status;
  }
  if (updates.deadline !== undefined) updatePayload.deadline = updates.deadline;
  if (updates.category !== undefined) updatePayload.category = updates.category;
  if (updates.progress !== undefined) updatePayload.progress = updates.progress;

  // Handle QTY and Rate serialization if description, quote, qty, rate, priority, acknowledgedDeadline, or alertMeDays are updated
  if (updates.description !== undefined || updates.qty !== undefined || updates.rate !== undefined || updates.quote !== undefined || updates.priority !== undefined || updates.acknowledgedDeadline !== undefined || updates.alertMeDays !== undefined) {
    // 1. Fetch current description and quote to extract existing metadata
    const { data: currentProj } = await supabase
      .from('projects')
      .select('description, quote')
      .eq('id', projectId)
      .maybeSingle();

    let existingQty = 1;
    let existingRate = currentProj ? parseFloat(currentProj.quote) : 0;
    let existingDesc = currentProj ? (currentProj.description || '') : '';
    let existingPriority = 'Normal';
    let existingAcknowledgedDeadline = '';
    let existingAlertMeDays = '';

    if (existingDesc.startsWith("JSON_METADATA:")) {
      try {
        const parsed = JSON.parse(existingDesc.substring(14));
        existingQty = parsed.qty || 1;
        existingRate = parsed.rate || (currentProj ? parseFloat(currentProj.quote) / existingQty : 0);
        existingDesc = parsed.description || '';
        existingPriority = parsed.priority || 'Normal';
        existingAcknowledgedDeadline = parsed.acknowledgedDeadline || '';
        existingAlertMeDays = parsed.alertMeDays !== undefined ? parsed.alertMeDays : '';
      } catch (e) {
        console.error("Failed to parse JSON_METADATA during project update:", e);
      }
    }

    const newQty = updates.qty !== undefined ? updates.qty : existingQty;
    let newRate = updates.rate !== undefined ? updates.rate : existingRate;
    const newDesc = updates.description !== undefined ? updates.description : existingDesc;
    const newPriority = updates.priority !== undefined ? updates.priority : existingPriority;
    const newAcknowledgedDeadline = updates.acknowledgedDeadline !== undefined ? updates.acknowledgedDeadline : existingAcknowledgedDeadline;
    const newAlertMeDays = updates.alertMeDays !== undefined ? updates.alertMeDays : existingAlertMeDays;
    
    // If quote is updated but rate is not, recalculate rate to match new quote
    if (updates.quote !== undefined && updates.rate === undefined) {
      newRate = parseFloat(updates.quote) / newQty;
    }

    updatePayload.description = `JSON_METADATA:${JSON.stringify({
      qty: newQty,
      rate: newRate,
      description: newDesc,
      priority: newPriority,
      acknowledgedDeadline: newAcknowledgedDeadline,
      alertMeDays: newAlertMeDays
    })}`;
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;

  // Sync project_milestones table based on progress, stage, or status
  try {
    const status = updates.status || data?.status;
    const progress = updates.progress !== undefined ? updates.progress : data?.progress;
    const stage = updates.stage !== undefined ? updates.stage : data?.stage;

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

    if (maxCompletedPosition >= 0) {
      // Mark milestones up to maxCompletedPosition as completed
      await supabase
        .from('project_milestones')
        .update({ completed: true })
        .eq('project_id', projectId)
        .lte('position', maxCompletedPosition);

      // Mark milestones after maxCompletedPosition as incomplete
      await supabase
        .from('project_milestones')
        .update({ completed: false })
        .eq('project_id', projectId)
        .gt('position', maxCompletedPosition);
    }
  } catch (syncErr) {
    console.error("Failed to sync project milestones in database:", syncErr);
  }

  return data;
};

/* ==========================================================================
   2. Project Sub-Resource Modifiers (Milestones, Activity Logs, Chat)
   ========================================================================== */

/**
 * Toggle milestone status
 */
export const toggleMilestone = async (projectId, milestoneName, isCompleted) => {
  const { data, error } = await supabase
    .from('project_milestones')
    .update({ completed: isCompleted })
    .eq('project_id', projectId)
    .eq('name', milestoneName)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Log a new activity/event for the project
 */
export const addProjectActivityLog = async (projectId, action) => {
  const { data, error } = await supabase
    .from('project_activity_logs')
    .insert([{ project_id: projectId, action }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Send custom message down the collaboration stream
 */
export const sendChatMessage = async (projectId, sender, messageText) => {
  const { data, error } = await supabase
    .from('project_chats')
    .insert([{ project_id: projectId, sender, message: messageText }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Listen to real-time chat messages
 */
export const subscribeToChats = (projectId, onMessageReceived) => {
  return supabase
    .channel(`project-chat-${projectId}`)
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
          onMessageReceived({
            id: msg.id,
            sender: msg.sender,
            text: msg.message,
            time: new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
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
 * Listen to all real-time chat messages globally
 */
export const subscribeToAllChats = (onMessageReceived) => {
  return supabase
    .channel('project-chats-global')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'project_chats' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new;
          onMessageReceived({
            id: msg.id,
            project_id: msg.project_id,
            sender: msg.sender,
            text: msg.message,
            time: new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            raw_date: new Date(msg.created_at).getTime(),
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
 * Clear all chat messages for a project
 */
export const clearProjectChats = async (projectId) => {
  const { data, error } = await supabase
    .from('project_chats')
    .delete()
    .eq('project_id', projectId);

  if (error) throw error;

  // Log activity
  await supabase
    .from('project_activity_logs')
    .insert([
      {
        project_id: projectId,
        action: `Project chat history was cleared.`
      }
    ]);

  return data;
};

/* ==========================================================================
   3. Media Vault Integrations (Storage)
   ========================================================================== */

/**
 * Upload an asset to Supabase Storage and register the metadata in project_media
 */
export const uploadMediaVaultAsset = async (projectId, file, fileName) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `projects/${projectId}/${Date.now()}_${fileName}.${fileExt}`;

  // 1. Upload to Supabase Bucket 'studio-vault'
  const { error: uploadError } = await supabase.storage
    .from('studio-vault')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. Retrieve Public Web URL
  const { data: { publicUrl } } = supabase.storage
    .from('studio-vault')
    .getPublicUrl(filePath);

  // 3. Insert record in project_media metadata table
  const { data, error: dbError } = await supabase
    .from('project_media')
    .insert([
      {
        project_id: projectId,
        file_name: fileName,
        file_url: publicUrl,
        file_type: file.type.split('/')[0] // 'image', 'video', 'application' etc.
      }
    ])
    .select()
    .single();

  if (dbError) throw dbError;
  return {
    id: data.id,
    name: data.file_name,
    url: data.file_url,
    type: data.file_type,
    time: new Date(data.uploaded_at).toLocaleDateString(),
    raw_date: new Date(data.uploaded_at).getTime(),
    uploaded_by: data.uploaded_by
  };
};

/**
 * Listen to all real-time media uploads globally
 */
export const subscribeToAllMedia = (onMediaReceived) => {
  return supabase
    .channel('project-media-global')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'project_media' },
      (payload) => {
        const m = payload.new;
        onMediaReceived({
          id: m.id,
          project_id: m.project_id,
          name: m.file_name,
          url: m.file_url,
          type: m.file_type,
          time: new Date(m.uploaded_at).toLocaleDateString(),
          raw_date: new Date(m.uploaded_at).getTime(),
          uploaded_by: m.uploaded_by,
          eventType: 'INSERT'
        });
      }
    )
    .subscribe();
};
