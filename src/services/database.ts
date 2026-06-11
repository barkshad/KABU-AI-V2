import { supabase } from "./supabase";

export const dbService = {
  // Common database operations replacing Firebase Firestore
  addDocument: async (collection: string, data: any) => {
    const { data: result, error } = await supabase
      .from(collection)
      .insert([data])
      .select()
      .single();
      
    if (error) throw error;
    return result;
  },

  getDocuments: async (collection: string, orderByColumn?: string, ascending = false) => {
    let query = supabase.from(collection).select('*');
    if (orderByColumn) {
      query = query.order(orderByColumn, { ascending });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  
  updateDocument: async (collection: string, id: string, updates: any) => {
    const { data, error } = await supabase
      .from(collection)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  deleteDocument: async (collection: string, id: string) => {
    const { error } = await supabase
      .from(collection)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },
  
  getDocument: async (collection: string, id: string) => {
    const { data, error } = await supabase
      .from(collection)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Method meant to subscribe to real-time changes
  subscribeToCollection: (collection: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`public:${collection}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: collection }, callback)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
