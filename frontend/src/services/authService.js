// Mock authentication service
// In a real application, this would make API calls to your backend

import { supabase } from '../utils/supabase';
import { jwtDecode } from 'jwt-decode';

// Get admin email from environment variables
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
  console.warn('Admin email not configured in environment variables');
}

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
    // Check if the user is admin by email
    const isAdminEmail = user.email === ADMIN_EMAIL;
    
    // Fetch user profile from database
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return {
        ...user,
        role: isAdminEmail ? 'admin' : 'customer'
      };
    }
    
    if (!profile) {
      console.warn('No profile found, creating one with appropriate role');
      
      // Create a profile for this user
      try {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || '',
            role: isAdminEmail ? 'admin' : 'customer'
          }]);
          
        if (insertError) {
          console.error('Failed to create user profile:', insertError);
        }
      } catch (insertErr) {
        console.error('Exception creating profile:', insertErr);
      }
      
      return {
        ...user,
        role: isAdminEmail ? 'admin' : 'customer'
      };
    }
    
    return {
      ...user,
      role: profile.role
    };
  } catch (error) {
    console.error('Error enhancing user with role:', error);
    return {
      ...user,
      role: user.email === ADMIN_EMAIL ? 'admin' : 'customer'
    };
  }
};

export const authService = {
  // Login with email and password
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return await enhanceUserWithRole(data.user);
  },
  
  // Login with Google
  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // This may not return user data immediately due to the redirect
    console.log('Google auth initiated, redirecting...');
    return data;
  },
  
  // Register a new user
  async register({ email, password, name }) {
    const isAdmin = email === ADMIN_EMAIL;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: isAdmin ? 'admin' : 'customer'
        }
      }
    });
    
    if (error) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('User creation failed');
    }

    // Profile will be created by the database trigger
    return await enhanceUserWithRole(data.user);
  },
  
  // Logout
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
    
    return await enhanceUserWithRole(session.user);
  },

  // Get JWT fallback token
  async getJWTFallbackToken() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // Create a JWT that expires in 1 hour
      const token = session.access_token;
      const decodedToken = jwtDecode(token);
      
      // If the Supabase token is valid and has an expiration, use it
      if (decodedToken && decodedToken.exp) {
        return token;
      }

      // If no valid token from Supabase, create a fallback token
      const fallbackToken = {
        ...decodedToken,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000)
      };

      // In a real app, you would sign this token with your backend
      // For now, we'll use the Supabase token as is
      return token;
    } catch (error) {
      console.error('Error getting JWT fallback token:', error);
      return null;
    }
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