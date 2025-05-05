import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error('No session established');
        }

        // Check user role and redirect accordingly
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          // If profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([{
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email,
              role: session.user.email === import.meta.env.VITE_ADMIN_EMAIL ? 'admin' : 'customer'
            }])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          toast.success('Account created successfully');
          navigate(newProfile.role === 'admin' ? '/admin' : '/');
          return;
        }

        toast.success('Successfully logged in');
        navigate(profile.role === 'admin' ? '/admin' : '/');
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast.error('Authentication failed: ' + error.message);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-medium">Completing login...</h2>
        <p className="mt-2 text-gray-600">Please wait while we authenticate you.</p>
      </div>
    </div>
  );
}

export default AuthCallback;