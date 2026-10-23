import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { encryptData, decryptData } from '../../lib/encryption';

// Types for email accounts
export interface EmailAccountCredentials {
  id: string;
  userId: string;
  name: string;
  email: string;
  provider: 'google' | 'imap' | 'smtp';
  accessToken?: string; // For OAuth services like Google
  refreshToken?: string; // For OAuth services like Google
  password?: string; // For IMAP/SMTP (encrypted)
  imapHost?: string; // For IMAP
  imapPort?: number; // For IMAP
  smtpHost?: string; // For SMTP
  smtpPort?: number; // For SMTP
  useSSL?: boolean; // For IMAP/SMTP
  createdAt: Date;
  updatedAt: Date;
}

// Interface for the database row (snake_case)
interface EmailAccountDbRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  provider: 'google' | 'imap' | 'smtp';
  access_token?: string | null;
  refresh_token?: string | null;
  password?: string | null;
  imap_host?: string | null;
  imap_port?: number | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  use_ssl?: boolean;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Service for managing email accounts in Supabase
export const supabaseEmailService = {
  /**
   * Get all email accounts for the current user
   */
  async getEmailAccounts(userId: string): Promise<EmailAccountCredentials[]> {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching email accounts:', error);
        return [];
      }
      
      // Decrypt sensitive data
      return data.map((account: EmailAccountDbRow) => ({
        id: account.id,
        userId: account.user_id,
        name: account.name,
        email: account.email,
        provider: account.provider,
        accessToken: account.access_token ? decryptData(account.access_token) : undefined,
        refreshToken: account.refresh_token ? decryptData(account.refresh_token) : undefined,
        password: account.password ? decryptData(account.password) : undefined,
        imapHost: account.imap_host || undefined,
        imapPort: account.imap_port ?? undefined,
        smtpHost: account.smtp_host || undefined,
        smtpPort: account.smtp_port ?? undefined,
        useSSL: account.use_ssl,
        createdAt: new Date(account.created_at),
        updatedAt: new Date(account.updated_at)
      }));
    } catch (error) {
      console.error('Error in getEmailAccounts:', error);
      return [];
    }
  },

  /**
   * Save a new email account
   */
  async saveEmailAccount(account: Omit<EmailAccountCredentials, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailAccountCredentials | null> {
    try {
      const now = new Date().toISOString();
      const id = uuidv4();
      
      // Encrypt sensitive data
      const dbAccount = {
        id,
        user_id: account.userId,
        name: account.name,
        email: account.email,
        provider: account.provider,
        access_token: account.accessToken ? encryptData(account.accessToken) : null,
        refresh_token: account.refreshToken ? encryptData(account.refreshToken) : null,
        password: account.password ? encryptData(account.password) : null,
        imap_host: account.imapHost || null,
        imap_port: account.imapPort || null,
        smtp_host: account.smtpHost || null,
        smtp_port: account.smtpPort || null,
        use_ssl: account.useSSL || false,
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('email_accounts')
        .insert(dbAccount)
        .select()
        .single();
      
      if (error) {
        console.error('Error saving email account:', error);
        return null;
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        provider: data.provider,
        accessToken: data.access_token ? decryptData(data.access_token) : undefined,
        refreshToken: data.refresh_token ? decryptData(data.refresh_token) : undefined,
        password: data.password ? decryptData(data.password) : undefined,
        imapHost: data.imap_host || undefined,
        imapPort: data.imap_port ?? undefined,
        smtpHost: data.smtp_host || undefined,
        smtpPort: data.smtp_port ?? undefined,
        useSSL: data.use_ssl,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in saveEmailAccount:', error);
      return null;
    }
  },

  /**
   * Update an existing email account
   */
  async updateEmailAccount(id: string, updates: Partial<EmailAccountCredentials>): Promise<EmailAccountCredentials | null> {
    try {
      // Convert to snake_case for database and encrypt sensitive data
      const dbUpdates: Partial<EmailAccountDbRow> = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.provider) dbUpdates.provider = updates.provider;
      if (updates.accessToken) dbUpdates.access_token = encryptData(updates.accessToken);
      if (updates.refreshToken) dbUpdates.refresh_token = encryptData(updates.refreshToken);
      if (updates.password) dbUpdates.password = encryptData(updates.password);
      if (updates.imapHost !== undefined) dbUpdates.imap_host = updates.imapHost;
      if (updates.imapPort !== undefined) dbUpdates.imap_port = updates.imapPort;
      if (updates.smtpHost !== undefined) dbUpdates.smtp_host = updates.smtpHost;
      if (updates.smtpPort !== undefined) dbUpdates.smtp_port = updates.smtpPort;
      if (updates.useSSL !== undefined) dbUpdates.use_ssl = updates.useSSL;
      
      const { data, error } = await supabase
        .from('email_accounts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating email account:', error);
        return null;
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        provider: data.provider,
        accessToken: data.access_token ? decryptData(data.access_token) : undefined,
        refreshToken: data.refresh_token ? decryptData(data.refresh_token) : undefined,
        password: data.password ? decryptData(data.password) : undefined,
        imapHost: data.imap_host || undefined,
        imapPort: data.imap_port ?? undefined,
        smtpHost: data.smtp_host || undefined,
        smtpPort: data.smtp_port ?? undefined,
        useSSL: data.use_ssl,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in updateEmailAccount:', error);
      return null;
    }
  },

  /**
   * Delete an email account
   */
  async deleteEmailAccount(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting email account:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteEmailAccount:', error);
      return false;
    }
  }
}; 