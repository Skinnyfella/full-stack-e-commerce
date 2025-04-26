import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import { testSupabaseConnection, testBackendConnection } from './utils/testConnection';

export default function DebugApp() {
  const [supabaseStatus, setSupabaseStatus] = useState('Testing...');
  const [backendStatus, setBackendStatus] = useState('Testing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const runTests = async () => {
      try {
        // Test Supabase connection
        const supabaseResult = await testSupabaseConnection();
        setSupabaseStatus(
          supabaseResult.success 
            ? '✅ Supabase connected' 
            : `❌ Supabase error: ${supabaseResult.message}`
        );
        
        // Test backend connection
        const backendResult = await testBackendConnection();
        setBackendStatus(
          backendResult.success 
            ? '✅ Backend API connected' 
            : `❌ Backend error: ${backendResult.message}`
        );
      } catch (err) {
        setError(`Error running tests: ${err.message}`);
        console.error('Debug test error:', err);
      }
    };
    
    runTests();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>App Debug Page</h1>
      
      <h2>Environment Variables</h2>
      <pre style={{ background: '#f0f0f0', padding: '10px' }}>
        VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}{'\n'}
        VITE_API_URL: {import.meta.env.VITE_API_URL || 'Not set'}{'\n'}
        VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'}
      </pre>
      
      <h2>Connection Status</h2>
      <div style={{ marginBottom: '10px' }}>
        <strong>Supabase:</strong> {supabaseStatus}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Backend API:</strong> {backendStatus}
      </div>
      
      {error && (
        <div style={{ 
          background: '#ffeeee', 
          color: '#cc0000', 
          padding: '10px',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 