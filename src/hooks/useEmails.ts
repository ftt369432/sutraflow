import { useState, useCallback, useEffect } from 'react';
import { useLoading } from './useLoading';
import { useError } from './useError';
import { useNotifications } from './useNotifications';
import type { Email } from '../types';
import { 
  fetchEmails, 
  sendEmail as sendEmailApi,
  markEmailAsRead,
  archiveEmail,
  deleteEmail,
  moveEmail
} from '../services/email/manualEmailService';

export function useEmails(folder: string = 'inbox', search: string = '') {
  const [emails, setEmails] = useState<Email[]>([]);
  const { withLoading, isLoading } = useLoading();
  const { handleError } = useError();
  const { showSuccess } = useNotifications();

  const loadEmails = useCallback(async () => {
    try {
      const fetchedEmails = await withLoading(fetchEmails(folder));
      const filteredEmails = search
        ? fetchedEmails.filter(email =>
            email.subject.toLowerCase().includes(search.toLowerCase()) ||
            email.content.toLowerCase().includes(search.toLowerCase()) ||
            email.from.toLowerCase().includes(search.toLowerCase())
          )
        : fetchedEmails;
      setEmails(filteredEmails);
    } catch (error) {
      handleError('Failed to load emails');
    }
  }, [folder, search, withLoading, handleError]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails, folder]);

  const handleMarkAsRead = useCallback(async (emailId: string) => {
    try {
      await markEmailAsRead(emailId);
      setEmails(current =>
        current.map(email =>
          email.id === emailId ? { ...email, read: true } : email
        )
      );
    } catch (error) {
      handleError('Failed to mark email as read');
    }
  }, [handleError]);

  const handleSendEmail = useCallback(async (email: Partial<Email>) => {
    try {
      await withLoading(sendEmailApi(email));
      showSuccess('Email sent successfully');
      return true;
    } catch (error) {
      handleError('Failed to send email');
      return false;
    }
  }, [withLoading, handleError, showSuccess]);

  const handleArchiveEmails = useCallback(async (emailIds: string[]) => {
    try {
      await withLoading(Promise.all(emailIds.map(archiveEmail)));
      showSuccess('Emails archived successfully');
      await loadEmails();
    } catch (error) {
      handleError('Failed to archive emails');
    }
  }, [withLoading, handleError, showSuccess, loadEmails]);

  const handleDeleteEmails = useCallback(async (emailIds: string[]) => {
    try {
      await withLoading(Promise.all(emailIds.map(deleteEmail)));
      showSuccess('Emails deleted successfully');
      await loadEmails();
    } catch (error) {
      handleError('Failed to delete emails');
    }
  }, [withLoading, handleError, showSuccess, loadEmails]);

  const handleMoveEmails = useCallback(async (emailIds: string[], targetFolder: string) => {
    try {
      await withLoading(Promise.all(emailIds.map(id => moveEmail(id, targetFolder))));
      showSuccess('Emails moved successfully');
      await loadEmails();
    } catch (error) {
      handleError('Failed to move emails');
    }
  }, [withLoading, handleError, showSuccess, loadEmails]);

  return {
    emails,
    isLoading,
    loadEmails,
    markAsRead: handleMarkAsRead,
    sendEmail: handleSendEmail,
    archiveEmails: handleArchiveEmails,
    deleteEmails: handleDeleteEmails,
    moveEmails: handleMoveEmails
  };
}