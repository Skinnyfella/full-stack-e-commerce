import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle hash fragment from OAuth redirect
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            // Set the session manually since we got the token in the URL hash
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token')
            });

            if (sessionError) {
              throw sessionError;
            }

            if (!session) {
              throw new Error('No session established');
            }

            // Check user role and redirect accordingly
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            const role = profile?.role || 'customer';
            toast.success('Successfully logged in');
            navigate(role === 'admin' ? '/admin' : '/');
            return;
          }
        }

        // Fallback to getting the session directly
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (!session) {
          throw new Error('No session found');
        }

        // Check user role and redirect accordingly
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const role = profile?.role || 'customer';
        toast.success('Successfully logged in');
        navigate(role === 'admin' ? '/admin' : '/');
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast.error('Authentication failed');
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