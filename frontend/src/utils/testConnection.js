import { supabase } from './supabase';
import { apiClient } from '../services/api';

// Function to test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    // Try to check if we can access Supabase
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      return {
        success: false,
        message: `Supabase connection failed: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Successfully connected to Supabase'
    };
  } catch (error) {
    return {
      success: false,
      message: `Supabase connection error: ${error.message}`
    };
  }
};

// Function to test backend API connection
export const testBackendConnection = async () => {
  try {
    // Try to access the root endpoint
    const data = await apiClient.get('/');
    
    return {
      success: true,
      message: 'Successfully connected to backend API',
      data
    };
  } catch (error) {
    return {
      success: false,
      message: `Backend API connection failed: ${error.message}`
    };
  }
};

// Function to test authentication
export const testAuthentication = async () => {
  try {
    // Get current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        message: 'No active authentication session found'
      };
    }
    
    // Try to access a protected endpoint
    try {
      const userData = await apiClient.get('/users/profile');
      return {
        success: true,
        message: 'Authentication is working correctly',
        user: userData
      };
    } catch (apiError) {
      return {
        success: false,
        message: `API authentication test failed: ${apiError.message}`,
        sessionExists: true
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Authentication test error: ${error.message}`
    };
  }
}; 