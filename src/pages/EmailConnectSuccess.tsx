import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmailService } from '../services/email';
import { EmailAccount } from '../services/email/types';

const EmailConnectSuccess = () => {
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadAccount = async () => {
      try {
        if (!accountId) {
          throw new Error('Account ID is missing');
        }
        
        const emailService = new EmailService();
        const accounts = await emailService.getAccounts();
        const account = accounts.find((acc: EmailAccount) => acc.id === accountId);
        
        if (!account) {
          throw new Error('Account not found');
        }
        
        setEmail(account.email);
        setLoading(false);
        
        // Redirect to email page after 3 seconds
        setTimeout(() => {
          navigate('/email');
        }, 3000);
      } catch (error: any) {
        console.error('Error loading account:', error);
        navigate('/email/connect/error', { 
          state: { error: error.message || 'Unknown error' } 
        });
      }
    };
    
    loadAccount();
  }, [accountId, navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Email Connected Successfully!</h1>
          
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 mb-4">Loading account details...</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your email account <span className="font-medium">{email}</span> has been connected successfully.
            </p>
          )}
          
          <p className="text-sm text-gray-400 dark:text-gray-500">
            You will be redirected to your email inbox in a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailConnectSuccess; 