import { supabase } from "./supabase";

function isMockUrl() {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('SETUP_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
    return url === "https://placeholder.supabase.co";
  }
  return false;
}

const getMockDb = (): Record<string, any[]> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('MOCK_SUPABASE_DB');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveMockDb = (db: Record<string, any[]>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('MOCK_SUPABASE_DB', JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save mock DB", e);
  }
};

export const dbService = {
  addDocument: async (collection: string, data: any) => {
    if (isMockUrl()) {
        const db = getMockDb();
        if (!db[collection]) db[collection] = [];
        const newDoc = { ...data, id: data.id || Date.now().toString(), created_at: new Date().toISOString() };
        db[collection].push(newDoc);
        saveMockDb(db);
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
        const db = getMockDb();
        if (!db[collection]) return [];
        let items = [...db[collection]];
        if (orderByColumn) {
          items.sort((a, b) => {
            const valA = a[orderByColumn];
            const valB = b[orderByColumn];
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
            return 0;
          });
        }
        return items;
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
        const db = getMockDb();
        if (!db[collection]) throw new Error("Not found");
        const idx = db[collection].findIndex(d => String(d.id) === String(id));
        if (idx === -1) throw new Error("Not found");
        db[collection][idx] = { ...db[collection][idx], ...updates, updated_at: new Date().toISOString() };
        saveMockDb(db);
        return db[collection][idx];
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
        const db = getMockDb();
        if (!db[collection]) return;
        db[collection] = db[collection].filter(d => String(d.id) !== String(id));
        saveMockDb(db);
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
        const db = getMockDb();
        if (!db[collection]) throw new Error("Not found");
        const doc = db[collection].find(d => String(d.id) === String(id));
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
