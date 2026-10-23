import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * SignupPage — Bridges to the unified authentication workflow.
 * Preserves query parameters (e.g. ?plan=pro, ?referral=...) and opens
 * the register mode of LoginPage.
 */
export const SignupPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  searchParams.set('register', 'true');

  const targetPath = location.pathname.startsWith('/auth') ? '/auth/login' : '/login';
  const redirectUrl = `${targetPath}?${searchParams.toString()}`;

  return <Navigate to={redirectUrl} replace />;
};

export default SignupPage;