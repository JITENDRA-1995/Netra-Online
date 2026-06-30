import { supabase } from '../client';

export const getCashbookEntries = async () => {
  const { data, error } = await supabase
    .from('cashbook_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching cashbook entries:", error);
    throw error;
  }
  return data;
};

export const addCashbookEntry = async (entry) => {
  const { data, error } = await supabase
    .from('cashbook_entries')
    .insert([entry])
    .select();

  if (error) {
    console.error("Error adding cashbook entry:", error);
    throw error;
  }
  return data[0];
};

export const updateCashbookEntry = async (id, updates) => {
  const { data, error } = await supabase
    .from('cashbook_entries')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error("Error updating cashbook entry:", error);
    throw error;
  }
  return data[0];
};

export const deleteCashbookEntry = async (id) => {
  const { error } = await supabase
    .from('cashbook_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting cashbook entry:", error);
    throw error;
  }
  return true;
};

export const updateCashbookCategory = async (oldCategory, newCategory, type) => {
  const { error } = await supabase
    .from('cashbook_entries')
    .update({ category: newCategory })
    .eq('category', oldCategory)
    .eq('type', type);

  if (error) {
    console.error("Error updating cashbook category:", error);
    throw error;
  }
  return true;
};
