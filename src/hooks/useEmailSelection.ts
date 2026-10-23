import { useState } from 'react';
import type { Email } from '../types';

export function useEmailSelection() {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const toggleSelect = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const selectAll = (emails: Email[]) => {
    setSelectedEmails(
      selectedEmails.length === emails.length
        ? []
        : emails.map(email => email.id)
    );
  };

  const clearSelection = () => {
    setSelectedEmails([]);
  };

  return {
    selectedEmails,
    toggleSelect,
    selectAll,
    clearSelection
  };
}