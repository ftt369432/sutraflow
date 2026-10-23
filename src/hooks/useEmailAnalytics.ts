import { useState, useEffect } from 'react';
import { generateEmailAnalytics } from '../services/email/emailAnalyticsService';
import type { Email, EmailAnalytics } from '../types';

export function useEmailAnalytics(emails: Email[]) {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);

  useEffect(() => {
    if (emails.length > 0) {
      const emailAnalytics = generateEmailAnalytics(emails);
      setAnalytics(emailAnalytics);
    }
  }, [emails]);

  return analytics;
} 