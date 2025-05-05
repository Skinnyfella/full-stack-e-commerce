import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session after OAuth redirect
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed');
          navigate('/login');
          return;
        }

        if (!session) {
          toast.error('No session found');
          navigate('/login');
          return;
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