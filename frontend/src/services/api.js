import { supabase } from '../utils/supabase';

// API base URL - will be removed once we fully switch to Supabase
const API_URL = import.meta.env.VITE_API_URL || 'https://full-stack-e-commerce-6.onrender.com/api';

// Create a function to get the auth token
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
};

// Create a Supabase API client with common functions
export const supabaseApi = {
  // Generic SELECT query with pagination
  async select(table, options = {}) {
    const {
      columns = '*',
      filters = {},
      limit = 10,
      page = 1,
      orderBy = 'created_at',
      ascending = false
    } = options;
    
    try {
      let query = supabase
        .from(table)
        .select(columns)
        .order(orderBy, { ascending });
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });
      
      // Apply pagination
      const startRange = (page - 1) * limit;
      const endRange = page * limit - 1;
      query = query.range(startRange, endRange);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error(`Error selecting from ${table}:`, error);
      throw error;
    }
  },
  
  // Get a single item by ID
  async getById(table, id, columns = '*') {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error getting item from ${table}:`, error);
      throw error;
    }
  },
  
  // Insert a new item
  async insert(table, item) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(item)
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  },
  
  // Update an item
  async update(table, id, updates) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  },
  
  // Delete an item
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }
};

// Legacy API client - will be phased out
export const apiClient = {
  async get(endpoint, params = {}) {
    const token = await getAuthToken();
    const url = new URL(`${API_URL}${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
  },
  
  async post(endpoint, data = {}) {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
  },
  
  async put(endpoint, data = {}) {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
  },
  
  async delete(endpoint) {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
  }
};