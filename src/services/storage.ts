import { supabase } from "./supabase";

export const storageService = {
  uploadFile: async (userId: string, file: File) => {
    // Implement: users/{userId}/files
    if (!userId) throw new Error("User ID is required to upload files.");
    
    // Create unique filename
    const timestamp = Date.now();
    const filePath = `users/${userId}/files/${timestamp}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);
      
    return {
      path: data.path,
      publicUrl
    };
  },

  deleteFile: async (filePath: string) => {
    const { error } = await supabase.storage
      .from('resources')
      .remove([filePath]);
      
    if (error) throw error;
  },

  getPublicUrl: (filePath: string) => {
    const { data } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);
    return data.publicUrl;
  },

  listUserFiles: async (userId: string) => {
    const prefix = `users/${userId}/files/`;
    const { data, error } = await supabase.storage
      .from('resources')
      .list(prefix);
      
    if (error) throw error;
    return data;
  }
};
