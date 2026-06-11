import { supabase } from "./supabase";

function isMockUrl() {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('SETUP_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
    return url === "https://placeholder.supabase.co";
  }
  return false;
}

const mockDb: Record<string, any[]> = {};

export const dbService = {
  addDocument: async (collection: string, data: any) => {
    if (isMockUrl()) {
        if (!mockDb[collection]) mockDb[collection] = [];
        const newDoc = { ...data, id: data.id || Date.now().toString() };
        mockDb[collection].push(newDoc);
        return newDoc;
    }
    const { data: result, error } = await supabase
      .from(collection)
      .insert([data])
      .select()
      .single();
      
    if (error) throw error;
    return result;
  },

  getDocuments: async (collection: string, orderByColumn?: string, ascending = false) => {
    if (isMockUrl()) {
        if (!mockDb[collection]) return [];
        return [...mockDb[collection]];
    }
    let query = supabase.from(collection).select('*');
    if (orderByColumn) {
      query = query.order(orderByColumn, { ascending });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  
  updateDocument: async (collection: string, id: string, updates: any) => {
    if (isMockUrl()) {
        if (!mockDb[collection]) throw new Error("Not found");
        const idx = mockDb[collection].findIndex(d => d.id === id);
        if (idx === -1) throw new Error("Not found");
        mockDb[collection][idx] = { ...mockDb[collection][idx], ...updates };
        return mockDb[collection][idx];
    }
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
    if (isMockUrl()) {
        if (!mockDb[collection]) return;
        mockDb[collection] = mockDb[collection].filter(d => d.id !== id);
        return;
    }
    const { error } = await supabase
      .from(collection)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },
  
  getDocument: async (collection: string, id: string) => {
    if (isMockUrl()) {
        if (!mockDb[collection]) throw new Error("Not found");
        const doc = mockDb[collection].find(d => d.id === id);
        if (!doc) throw new Error("Not found");
        return doc;
    }
    const { data, error } = await supabase
      .from(collection)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  subscribeToCollection: (collection: string, callback: (payload: any) => void) => {
    if (isMockUrl()) {
        return () => {};
    }
    const channel = supabase
      .channel(`public:${collection}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: collection }, callback)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
