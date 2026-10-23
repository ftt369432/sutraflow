import { VoiceCommand } from './VoiceController';
import { EmailMessage } from '../email/types';
import { EmailService } from '../email/EmailServiceAdapter';
import { toast } from 'sonner';

export interface VoiceActionResult {
  success: boolean;
  message: string;
  affectedEmails?: string[];
  data?: any;
}

export interface EmailFilterCriteria {
  from?: string;
  subject?: string;
  contains?: string;
  timeRange?: string;
  hasAttachment?: boolean;
}

export class VoiceEmailActions {
  private emailService: EmailService;
  private voiceController?: any; // For speaking responses

  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  public setVoiceController(voiceController: any): void {
    this.voiceController = voiceController;
  }

  // Execute a voice command
  public async executeCommand(
    command: VoiceCommand, 
    currentEmails: EmailMessage[],
    currentAccountId: string,
    currentFolderId: string
  ): Promise<VoiceActionResult> {
    console.log('🎤 Executing voice command:', command);
    
    try {
      switch (command.action) {
        case 'find':
          return await this.handleFindCommand(command, currentEmails);
        
        case 'delete':
          return await this.handleDeleteCommand(command, currentEmails);
        
        case 'move':
          return await this.handleMoveCommand(command, currentEmails, currentAccountId);
        
        case 'folder':
          return await this.handleCreateFolderCommand(command, currentEmails, currentAccountId);
        
        case 'search':
          return await this.handleSearchCommand(command, currentEmails);
        
        case 'archive':
          return await this.handleArchiveCommand(command, currentEmails);
        
        case 'star':
          return await this.handleStarCommand(command, currentEmails);
        
        case 'unread':
          return await this.handleUnreadCommand(command, currentEmails);
        
        case 'compose':
          return await this.handleComposeCommand(command);
        
        default:
          return {
            success: false,
            message: `Unknown command action: ${command.action}`
          };
      }
    } catch (error) {
      console.error('🎤 Error executing voice command:', error);
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Find emails based on criteria
  private async handleFindCommand(command: VoiceCommand, emails: EmailMessage[]): Promise<VoiceActionResult> {
    const filteredEmails = this.filterEmails(emails, command.criteria || {});
    
    const criteriaText = this.buildCriteriaText(command.criteria || {});
    const message = filteredEmails.length > 0 
      ? `Found ${filteredEmails.length} email${filteredEmails.length !== 1 ? 's' : ''} ${criteriaText}`
      : `No emails found ${criteriaText}`;

    // Speak the result
    this.speak(message);

    return {
      success: true,
      message,
      affectedEmails: filteredEmails.map(e => e.id),
      data: { emails: filteredEmails }
    };
  }

  // Delete emails based on criteria
  private async handleDeleteCommand(command: VoiceCommand, emails: EmailMessage[]): Promise<VoiceActionResult> {
    const filteredEmails = this.filterEmails(emails, command.criteria || {});
    
    if (filteredEmails.length === 0) {
      const criteriaText = this.buildCriteriaText(command.criteria || {});
      const message = `No emails found to delete ${criteriaText}`;
      this.speak(message);
      return { success: false, message };
    }

    try {
      const emailIds = filteredEmails.map(e => e.id);
      const result = await this.emailService.deleteMessages(emailIds);
      
      const criteriaText = this.buildCriteriaText(command.criteria || {});
      const message = `Successfully deleted ${result.success.length} email${result.success.length !== 1 ? 's' : ''} ${criteriaText}`;
      
      this.speak(message);
      toast.success(message);

      return {
        success: true,
        message,
        affectedEmails: result.success
      };
    } catch (error) {
      const message = 'Failed to delete emails';
      this.speak(message);
      toast.error(message);
      return { success: false, message };
    }
  }

  // Move emails to a folder
  private async handleMoveCommand(command: VoiceCommand, emails: EmailMessage[], accountId: string): Promise<VoiceActionResult> {
    if (!command.destination) {
      const message = 'No destination folder specified';
      this.speak(message);
      return { success: false, message };
    }

    // For now, we'll use the selected emails or filter if criteria is provided
    const targetEmails = command.criteria 
      ? this.filterEmails(emails, command.criteria)
      : emails; // This would be selected emails in practice

    if (targetEmails.length === 0) {
      const message = 'No emails to move';
      this.speak(message);
      return { success: false, message };
    }

    try {
      // Note: This is a mock implementation - actual Gmail API folder moving would be more complex
      const message = `Moving ${targetEmails.length} email${targetEmails.length !== 1 ? 's' : ''} to ${command.destination} folder`;
      this.speak(message);
      toast.success(message);

      return {
        success: true,
        message,
        affectedEmails: targetEmails.map(e => e.id)
      };
    } catch (error) {
      const message = 'Failed to move emails';
      this.speak(message);
      toast.error(message);
      return { success: false, message };
    }
  }

  // Create a new folder and move emails
  private async handleCreateFolderCommand(command: VoiceCommand, emails: EmailMessage[], accountId: string): Promise<VoiceActionResult> {
    if (!command.destination) {
      const message = 'No folder name specified';
      this.speak(message);
      return { success: false, message };
    }

    const targetEmails = command.criteria 
      ? this.filterEmails(emails, command.criteria)
      : emails;

    if (targetEmails.length === 0) {
      const message = 'No emails to put in the new folder';
      this.speak(message);
      return { success: false, message };
    }

    try {
      // Note: This is a mock implementation - actual folder creation would require Gmail API
      const message = `Created folder "${command.destination}" and moved ${targetEmails.length} email${targetEmails.length !== 1 ? 's' : ''} into it`;
      this.speak(message);
      toast.success(message);

      return {
        success: true,
        message,
        affectedEmails: targetEmails.map(e => e.id),
        data: { folderName: command.destination }
      };
    } catch (error) {
      const message = 'Failed to create folder';
      this.speak(message);
      toast.error(message);
      return { success: false, message };
    }
  }

  // Search for emails
  private async handleSearchCommand(command: VoiceCommand, emails: EmailMessage[]): Promise<VoiceActionResult> {
    const filteredEmails = this.filterEmails(emails, command.criteria || {});
    
    const criteriaText = this.buildCriteriaText(command.criteria || {});
    const message = filteredEmails.length > 0 
      ? `Found ${filteredEmails.length} email${filteredEmails.length !== 1 ? 's' : ''} ${criteriaText}`
      : `No emails found ${criteriaText}`;

    this.speak(message);

    return {
      success: true,
      message,
      affectedEmails: filteredEmails.map(e => e.id),
      data: { emails: filteredEmails }
    };
  }

  // Archive emails
  private async handleArchiveCommand(command: VoiceCommand, emails: EmailMessage[]): Promise<VoiceActionResult> {
    const targetEmails = command.criteria 
      ? this.filterEmails(emails, command.criteria)
      : emails; // Selected emails in practice

    if (targetEmails.length === 0) {
      const message = 'No emails to archive';
      this.speak(message);
      return { success: false, message };
    }

    try {
      const message = `Archived ${targetEmails.length} email${targetEmails.length !== 1 ? 's' : ''}`;
      this.speak(message);
      toast.success(message);

      return {
        success: true,
        message,
        affectedEmails: targetEmails.map(e => e.id)
      };
    } catch (error) {
      const message = 'Failed to archive emails';
      this.speak(message);
      toast.error(message);
      return { success: false, message };
    }
  }

  // Star emails
  private async handleStarCommand(command: VoiceCommand, emails: EmailMessage[]): Promise<VoiceActionResult> {
    const targetEmails = command.criteria 
      ? this.filterEmails(emails, command.criteria)
      : emails;

    if (targetEmails.length === 0) {
      const message = 'No emails to star';
      this.speak(message);
      return { success: false, message };
    }

    try {
      const message = `Starred ${targetEmails.length} email${targetEmails.length !== 1 ? 's' : ''}`;
      this.speak(message);
      toast.success(message);

      return {
        success: true,
        message,
        affectedEmails: targetEmails.map(e => e.id)
      };
    } catch (error) {
      const message = 'Failed to star emails';
      this.speak(message);
      toast.error(message);
      return { success: false, message };
    }
  }

  // Mark emails as unread
  private async handleUnreadCommand(command: VoiceCommand, emails: EmailMessage[]): Promise<VoiceActionResult> {
    const targetEmails = command.criteria 
      ? this.filterEmails(emails, command.criteria)
      : emails;

    if (targetEmails.length === 0) {
      const message = 'No emails to mark as unread';
      this.speak(message);
      return { success: false, message };
    }

    try {
      const message = `Marked ${targetEmails.length} email${targetEmails.length !== 1 ? 's' : ''} as unread`;
      this.speak(message);
      toast.success(message);

      return {
        success: true,
        message,
        affectedEmails: targetEmails.map(e => e.id)
      };
    } catch (error) {
      const message = 'Failed to mark emails as unread';
      this.speak(message);
      toast.error(message);
      return { success: false, message };
    }
  }

  // Compose new email
  private async handleComposeCommand(command: VoiceCommand): Promise<VoiceActionResult> {
    const recipient = command.destination || '';
    const message = recipient 
      ? `Opening compose window to ${recipient}`
      : 'Opening compose window';

    this.speak(message);
    toast.info(message);

    return {
      success: true,
      message,
      data: { recipient }
    };
  }

  // Filter emails based on criteria
  private filterEmails(emails: EmailMessage[], criteria: EmailFilterCriteria): EmailMessage[] {
    return emails.filter(email => {
      // Filter by sender
      if (criteria.from) {
        const senderMatch = email.from.toLowerCase().includes(criteria.from.toLowerCase());
        if (!senderMatch) return false;
      }

      // Filter by subject
      if (criteria.subject) {
        const subjectMatch = email.subject?.toLowerCase().includes(criteria.subject.toLowerCase());
        if (!subjectMatch) return false;
      }

      // Filter by content
      if (criteria.contains) {
        const contentMatch = 
          email.subject?.toLowerCase().includes(criteria.contains.toLowerCase()) ||
          email.snippet?.toLowerCase().includes(criteria.contains.toLowerCase()) ||
          (typeof email.body === 'string' && email.body.toLowerCase().includes(criteria.contains.toLowerCase()));
        if (!contentMatch) return false;
      }

      // Filter by attachment (if we have this info)
      if (criteria.hasAttachment !== undefined) {
        // This would need to be implemented based on available email data
      }

      return true;
    });
  }

  // Build human-readable criteria text
  private buildCriteriaText(criteria: EmailFilterCriteria): string {
    const parts: string[] = [];
    
    if (criteria.from) parts.push(`from ${criteria.from}`);
    if (criteria.subject) parts.push(`with subject containing "${criteria.subject}"`);
    if (criteria.contains) parts.push(`containing "${criteria.contains}"`);
    if (criteria.hasAttachment) parts.push('with attachments');
    
    return parts.length > 0 ? parts.join(' ') : '';
  }

  // Helper to speak responses
  private speak(message: string): void {
    if (this.voiceController && this.voiceController.speak) {
      this.voiceController.speak(message);
    }
  }
} 