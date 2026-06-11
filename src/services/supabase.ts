import { createClient } from "@supabase/supabase-js";

const getSupabaseUrl = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('SETUP_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
  }
  return import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
};

const getSupabaseKey = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('SETUP_SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";
  }
  return import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";
};

export let supabase = createClient(getSupabaseUrl(), getSupabaseKey());

export const reinitializeSupabase = (url: string, key: string) => {
  supabase = createClient(url, key);
};
