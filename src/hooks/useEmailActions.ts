import { useState } from 'react';
import { moveToFolder, archiveEmails, deleteEmails, starEmails } from '../services/email/emailActions';
import { createTasksFromEmails } from '../services/tasks/taskService';
import type { Email, Task } from '../types';

export function useEmailActions() {
  const [loading, setLoading] = useState(false);

  const handleMoveToFolder = async (emails: Email[], folderId: string) => {
    setLoading(true);
    try {
      await moveToFolder(emails, folderId);
      return true;
    } catch (error) {
      console.error('Error moving emails:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (emails: Email[]) => {
    setLoading(true);
    try {
      await archiveEmails(emails);
      return true;
    } catch (error) {
      console.error('Error archiving emails:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (emails: Email[]) => {
    setLoading(true);
    try {
      await deleteEmails(emails);
      return true;
    } catch (error) {
      console.error('Error deleting emails:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleStar = async (emails: Email[]) => {
    setLoading(true);
    try {
      await starEmails(emails);
      return true;
    } catch (error) {
      console.error('Error starring emails:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = (emails: Email[]): Task[] => {
    return createTasksFromEmails(emails);
  };

  return {
    loading,
    moveToFolder: handleMoveToFolder,
    archive: handleArchive,
    delete: handleDelete,
    star: handleStar,
    createTasks: handleCreateTasks,
  };
}