import { supabase } from "./supabase";

function isMockUrl() {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('SETUP_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
    return url === "https://placeholder.supabase.co";
  }
  return false;
}

export const authService = {
  loginWithEmail: async (email: string, password?: string) => {
    if (isMockUrl()) {
      const mockUser = {
         id: 'mock-user-123',
         email,
         user_metadata: { full_name: email.split('@')[0] }
      };
      if (typeof window !== 'undefined') {
         localStorage.setItem('MOCK_USER', JSON.stringify(mockUser));
      }
      return mockUser;
    }
    
    if (!password) throw new Error("Password is required");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signUpWithEmail: async (email: string, password?: string, fullName?: string) => {
    if (isMockUrl()) {
      const mockUser = {
         id: 'mock-user-123',
         email,
         user_metadata: { full_name: fullName || email.split('@')[0] }
      };
      if (typeof window !== 'undefined') {
         localStorage.setItem('MOCK_USER', JSON.stringify(mockUser));
      }
      return mockUser;
    }

    if (!password) throw new Error("Password is required");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    if (isMockUrl()) {
       if (typeof window !== 'undefined') localStorage.removeItem('MOCK_USER');
       return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    if (isMockUrl()) {
       if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('MOCK_USER');
          return userStr ? JSON.parse(userStr) : null;
       }
       return null;
    }
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
  
  getSession: async () => {
    if (isMockUrl()) {
       return null;
    }
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
  
  onAuthStateChange: (callback: (user: any) => void) => {
    if (isMockUrl()) {
       if (typeof window !== 'undefined') {
           const userStr = localStorage.getItem('MOCK_USER');
           callback(userStr ? JSON.parse(userStr) : null);
       }
       return { unsubscribe: () => {} };
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
    return subscription;
  }
};
