import { z } from 'zod';

const googleConfigSchema = z.object({
  clientId: z.string(),
  redirectUri: z.string(),
  scopes: z.array(z.string())
});

export type GoogleConfig = z.infer<typeof googleConfigSchema>;

// Define all required scopes in one place
export const GOOGLE_SCOPES = [
  // Basic profile scopes
  'openid',
  'email',
  'profile',
  
  // Gmail scopes - need full access for delete/modify operations
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  
  // Calendar scopes
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar',
  
  // Drive scopes
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  
  // Contacts scope
  'https://www.googleapis.com/auth/contacts.readonly'
];

export const googleConfig: GoogleConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: window.location.origin,
  scopes: GOOGLE_SCOPES
};

export const mockGoogleConfig = {
  clientId: 'mock-client-id',
  clientSecret: 'mock-client-secret',
  redirectUri: `${window.location.protocol}//${window.location.host}/auth/callback`, // Use current host
  scopes: [
    'profile',
    'email',
    'calendar.readonly',
    'gmail.readonly'
  ]
};