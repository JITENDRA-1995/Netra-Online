import { supabase } from '../client';

/**
 * Fetch all client inquiries (Sparks) from the database
 */
export const getInquiries = async () => {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Create a new inquiry (usually from public contact form)
 */
export const createInquiry = async (inquiryData) => {
  const { data, error } = await supabase
    .from('inquiries')
    .insert([
      {
        name: inquiryData.name,
        email: inquiryData.email,
        phone: inquiryData.phone,
        service: inquiryData.service,
        description: inquiryData.desc || inquiryData.description,
        status: inquiryData.status || 'New Spark'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an inquiry status or administrator remarks
 */
export const updateInquiry = async (inquiryId, updates) => {
  const { data, error } = await supabase
    .from('inquiries')
    .update({
      status: updates.status,
      remarks: updates.remarks
    })
    .eq('id', inquiryId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete an inquiry
 */
export const deleteInquiry = async (inquiryId) => {
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', inquiryId);

  if (error) throw error;
  return true;
};
