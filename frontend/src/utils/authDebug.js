import { supabase } from './supabase';

export const debugAuth = async () => {
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return {
        success: false,
        error: sessionError.message,
        details: {
          session: null,
          profile: null
        }
      };
    }

    if (!session) {
      return {
        success: false,
        error: 'No active session',
        details: {
          session: null,
          profile: null
        }
      };
    }

    // Try to get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return {
        success: false,
        error: 'Failed to fetch user profile',
        details: {
          session,
          profile: null,
          profileError: profileError.message
        }
      };
    }

    return {
      success: true,
      details: {
        session,
        profile,
        user: session.user
      }
    };
  } catch (error) {
    console.error('Auth debug error:', error);
    return {
      success: false,
      error: error.message,
      details: {
        error: error
      }
    };
  }
}; 