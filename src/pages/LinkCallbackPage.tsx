import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { FullPageSpinner } from '../components/ui/Spinner';

export const LinkCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleLinkAccount = async () => {
      const hash = location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const providerToken = params.get('provider_token');
      const providerRefreshToken = params.get('provider_refresh_token');

      if (providerToken) {
        try {
          const { error } = await supabase.functions.invoke('link-account', {
            body: { 
              provider_token: providerToken,
              provider_refresh_token: providerRefreshToken 
            },
          });

          if (error) {
            throw error;
          }

          toast.success('Account linked successfully!');
        } catch (error: any) {
          toast.error('Failed to link account: ' + error.message);
        } finally {
          // Clear the hash from the URL and navigate
          navigate('/profile', { replace: true });
        }
      } else {
        toast.error('Could not find provider token to link account.');
        navigate('/profile', { replace: true });
      }
    };

    handleLinkAccount();
  }, [location, navigate]);

  return <FullPageSpinner />;
};

export default LinkCallbackPage; 