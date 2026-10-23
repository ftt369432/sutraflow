import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

interface LocationState {
  error?: string;
}

const EmailConnectError = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Try to get error message from multiple sources
  const errorMessage = 
    searchParams.get('message') || 
    (location.state as LocationState)?.error || 
    'An unknown error occurred while connecting your email account.';
  
  const handleRetry = () => {
    navigate('/email');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Email Connection Failed</h1>
          
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We couldn't connect your email account. {errorMessage}
          </p>
          
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailConnectError; 