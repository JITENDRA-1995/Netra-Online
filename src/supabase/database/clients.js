import { supabase } from '../client';

/**
 * Fetch all registered client accounts
 */
export const getClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('joined_date', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Create a new client account
 */
export const createClientProfile = async (clientData) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        access_key: clientData.accessKey || clientData.access_key,
        status: clientData.status || 'Active'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Verify client vault credentials by retrieving their passphrase (access_key)
 */
export const verifyClientVaultKey = async (email, accessKey) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('email', email)
    .eq('access_key', accessKey)
    .maybeSingle();

  if (error) throw error;
  return data; // Returns client details if valid, null if incorrect
};

/**
 * Update client profile details
 */
export const updateClientProfile = async (clientId, updates) => {
  const { data, error } = await supabase
    .from('clients')
    .update({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      address: updates.address,
      status: updates.status,
      access_key: updates.accessKey || updates.access_key
    })
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
