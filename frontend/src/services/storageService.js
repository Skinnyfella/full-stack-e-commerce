import { supabase } from '../utils/supabase';
import { toast } from 'react-hot-toast';

export const storageService = {
  // Upload a file to storage
  async uploadFile(file, bucket = 'product-images') {
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        path: data.path,
        url: publicUrlData.publicUrl
      };
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
      throw error;
    }
  },

  // Delete a file from storage
  async deleteFile(path, bucket = 'product-images') {
    try {
      const { error } = await supabase
        .storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Error deleting file:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      toast.error('Failed to delete file');
      throw error;
    }
  },

  // List files in a bucket/folder
  async listFiles(prefix = '', bucket = 'product-images') {
    try {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(prefix);

      if (error) {
        console.error('Error listing files:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error listing files:', error);
      toast.error('Failed to list files');
      throw error;
    }
  },

  // Get a temporary URL for a file (useful for private buckets)
  async getSignedUrl(path, bucket = 'product-images', expiresIn = 3600) {
    try {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Error getting signed URL:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error('Failed to get file URL');
      throw error;
    }
  }
};