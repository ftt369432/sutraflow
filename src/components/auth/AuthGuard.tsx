import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user } = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [user, location, navigate]);

  if (!user) return null;

  return <>{children}</>;
}