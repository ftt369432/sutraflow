/**
 * Email Service Module
 * 
 * Exports the EmailService class and creates a default instance
 */

// Import the service class and instance from the refactored implementation
import emailService, { EmailService as EmailServiceClass } from './emailService';
// MODIFIED: Import types directly from ./types.ts, replacing EmailOptions with EmailQuery
import { EmailMessage, EmailQuery, EmailResponse, EmailFolder, EmailLabel, EmailAccount, EmailFilter, IMAPConfig, EmailPreferences, EmailAnalysis } from './types';

// Create a reference to the EmailService class
// const EmailService = emailService.constructor as any; // Removed this line

// Export the EmailService class
export { EmailServiceClass as EmailService };

// Export types from the refactored service
export type { 
  EmailMessage,
  EmailQuery, // MODIFIED: Changed from EmailOptions to EmailQuery
  EmailResponse,
  EmailFolder,
  EmailLabel,
  EmailAccount,
  EmailFilter,
  IMAPConfig,
  EmailPreferences,
  EmailAnalysis
};

// Re-export the types from the original EmailService for backward compatibility
// export type { // This block can be removed if the above export type block covers all necessary re-exports
//   EmailFolder,
//   EmailLabel,
//   EmailAccount,
//   EmailFilter,
//   EmailQuery,
//   IMAPConfig,
//   EmailPreferences,
//   EmailAnalysis,
// } from './types'; // This import is now redundant

// Export the singleton instance
export { emailService };

// Default export for convenience
export default emailService; 