// Mock authentication service
// In a real application, this would make API calls to your backend

import { supabase } from '../utils/supabase';

// Mock user database for demo purposes
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    // In a real app, passwords would be hashed and never stored like this
    password: 'admin123',
  },
  {
    id: '2',
    name: 'John Customer',
    email: 'customer@example.com',
    role: 'customer',
    password: 'customer123',
  }
]

// Simulate API delay for development/testing purposes
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to enhance user data with role information
const enhanceUserWithRole = async (user) => {
  if (!user) return null;
  
  try {
    // First check if user has role in their metadata
    if (user.user_metadata && user.user_metadata.role) {
      return {
        ...user,
        role: user.user_metadata.role
      };
    }
    
    // Fallback to fetching from user_profiles table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error || !profile) {
      console.warn('No role found, defaulting to customer role');
      return {
        ...user,
        role: 'customer'  // Default role
      };
    }
    
    return {
      ...user,
      role: profile.role
    };
  } catch (error) {
    console.error('Error enhancing user with role:', error);
    // Fallback to a default role
    return {
      ...user,
      role: 'customer'
    };
  }
};

export const authService = {
  // Login with email and password using Supabase
  async login(email, password) {
    // For demo purposes only - allow direct login to demo accounts
    if (
      (email === 'admin@example.com' && password === 'admin123') ||
      (email === 'customer@example.com' && password === 'customer123')
    ) {
      await delay(500); // Simulate API delay
      
      // Mock response for demo accounts
      if (email === 'admin@example.com') {
        return {
          id: '1',
          email: 'admin@example.com',
          role: 'admin',
          name: 'Admin User'
        };
      } else {
        return {
          id: '2',
          email: 'customer@example.com',
          role: 'customer',
          name: 'John Customer'
        };
      }
    }
    
    // Use Supabase Auth for real authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Enhance user with role information
    return await enhanceUserWithRole(data.user);
  },
  
  // Register a new user using Supabase
  async register({ email, password, name }) {
    // Use Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'customer' // Default role for new users
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Create a profile entry for the new user
    if (data.user) {
      try {
        await supabase.from('user_profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: name || '',
            role: 'customer'
          }
        ]);
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }
    
    // Add role to user data
    return {
      ...data.user,
      role: 'customer'
    };
  },
  
  // Sign out
  async logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  },
  
  // Get current session
  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    // Enhance user with role information
    return await enhanceUserWithRole(session.user);
  },
  
  // Update user profile
  async updateProfile(profile) {
    const { data, error } = await supabase.auth.updateUser({
      data: profile
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return await enhanceUserWithRole(data.user);
  },
  
  // For demonstration purposes, expose the mock users
  // (this would not exist in a real auth service)
  getMockUsers() {
    return mockUsers.map(user => {
      const { password: _, ...userData } = user
      return userData
    })
  }
}