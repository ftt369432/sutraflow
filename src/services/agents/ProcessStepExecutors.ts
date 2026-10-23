import { ProcessStep, ProcessContext, ProcessResult, StepExecutor, ProcessStepExecutor } from './ProcessChainTemplate';
import { supabase } from '../../lib/supabase';

// Google Authentication Step Executor
export class GoogleAuthStepExecutor implements StepExecutor {
  async execute(step: ProcessStep, context: ProcessContext): Promise<ProcessResult> {
    const { parameters } = step;
    
    try {
      console.log('🔐 Executing Google Auth step:', step.name);
      
      switch (step.id) {
        case 'check_auth_status':
          return await this.checkAuthStatus(context);
          
        case 'initiate_oauth':
          return await this.initiateOAuth(parameters, context);
          
        case 'refresh_token':
          return await this.refreshToken(context);
          
        case 'validate_scopes':
          return await this.validateScopes(parameters.requiredScopes, context);
          
        case 'store_provider_token':
          return await this.storeProviderToken(context);
          
        default:
          throw new Error(`Unknown auth step: ${step.id}`);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        shouldRetry: step.id !== 'initiate_oauth' // Don't retry OAuth initiation
      };
    }
  }

  private async checkAuthStatus(context: ProcessContext): Promise<ProcessResult> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'No active session',
        nextSteps: ['initiate_oauth']
      };
    }

    // Check provider token freshness
    const providerToken = session.provider_token;
    const isTokenFresh = this.isTokenFresh(session);

    context.data.session = session;
    context.data.hasProviderToken = !!providerToken;
    context.data.isTokenFresh = isTokenFresh;

    if (!providerToken || !isTokenFresh) {
      return {
        success: false,
        error: 'Provider token missing or expired',
        nextSteps: ['refresh_token', 'initiate_oauth']
      };
    }

    return {
      success: true,
      data: {
        session,
        providerToken,
        authStatus: 'valid'
      }
    };
  }

  private async initiateOAuth(parameters: any, context: ProcessContext): Promise<ProcessResult> {
    const currentUrl = window.location.origin;
    const redirectUrl = parameters?.redirectUrl || `${currentUrl}/auth/callback`;
    
    const scopes = parameters?.scopes || [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: scopes.join(' '),
        queryParams: {
          access_type: 'offline',
          prompt: parameters?.forceConsent ? 'consent' : 'select_account',
          include_granted_scopes: 'true'
        }
      }
    });

    if (error) throw error;

    return {
      success: true,
      data: {
        oauthInitiated: true,
        redirectUrl: data.url
      },
      nextSteps: ['wait_for_callback']
    };
  }

  private async refreshToken(context: ProcessContext): Promise<ProcessResult> {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      return {
        success: false,
        error: error.message,
        nextSteps: ['initiate_oauth']
      };
    }

    context.data.session = data.session;
    
    return {
      success: true,
      data: {
        session: data.session,
        refreshed: true
      }
    };
  }

  private async validateScopes(requiredScopes: string[], context: ProcessContext): Promise<ProcessResult> {
    const session = context.data.session;
    if (!session?.provider_token) {
      return {
        success: false,
        error: 'No provider token available',
        nextSteps: ['initiate_oauth']
      };
    }

    // In a real implementation, you'd verify scopes with Google's tokeninfo endpoint
    // For now, we'll assume validation passes if we have a provider token
    
    return {
      success: true,
      data: {
        scopesValid: true,
        validatedScopes: requiredScopes
      }
    };
  }

  private async storeProviderToken(context: ProcessContext): Promise<ProcessResult> {
    const session = context.data.session;
    if (!session?.provider_token) {
      return {
        success: false,
        error: 'No provider token to store'
      };
    }

    // Store in user metadata or separate table
    const { error } = await supabase.auth.updateUser({
      data: {
        google_provider_token: session.provider_token,
        google_token_updated_at: new Date().toISOString()
      }
    });

    if (error) throw error;

    return {
      success: true,
      data: {
        tokenStored: true,
        storedAt: new Date()
      }
    };
  }

  private isTokenFresh(session: any): boolean {
    if (!session.provider_token) return false;
    
    // Check if token was issued recently (within last hour)
    const tokenTime = session.user?.user_metadata?.google_token_updated_at;
    if (!tokenTime) return false;
    
    const tokenDate = new Date(tokenTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - tokenDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < 1; // Token is fresh if less than 1 hour old
  }
}

// Reminder Process Step Executor
export class ReminderStepExecutor implements StepExecutor {
  async execute(step: ProcessStep, context: ProcessContext): Promise<ProcessResult> {
    const { parameters } = step;
    
    try {
      console.log('🔔 Executing Reminder step:', step.name);
      
      switch (step.id) {
        case 'create_reminder_workflow':
          return await this.createReminderWorkflow(parameters, context);
          
        case 'schedule_reminder':
          return await this.scheduleReminder(parameters, context);
          
        case 'send_notification':
          return await this.sendNotification(parameters, context);
          
        case 'update_reminder_status':
          return await this.updateReminderStatus(parameters, context);
          
        case 'create_calendar_event':
          return await this.createCalendarEvent(parameters, context);
          
        default:
          throw new Error(`Unknown reminder step: ${step.id}`);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        shouldRetry: true
      };
    }
  }

  private async createReminderWorkflow(parameters: any, context: ProcessContext): Promise<ProcessResult> {
    const { eventTitle, eventDate, template } = parameters;
    
    const workflowId = `workflow_${Date.now()}`;
    const reminders = this.generateRemindersFromTemplate(template, eventDate);
    
    context.data.workflowId = workflowId;
    context.data.reminders = reminders;
    context.data.eventTitle = eventTitle;
    context.data.eventDate = eventDate;
    
    return {
      success: true,
      data: {
        workflowId,
        reminders,
        reminderCount: reminders.length
      },
      nextSteps: ['create_calendar_event']
    };
  }

  private async scheduleReminder(parameters: any, context: ProcessContext): Promise<ProcessResult> {
    const { reminder, eventDate } = parameters;
    const scheduledTime = this.calculateReminderTime(eventDate, reminder.offset, reminder.timing);
    
    // Store reminder in database/queue
    const reminderId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      data: {
        reminderId,
        scheduledTime,
        reminderType: reminder.type,
        reminderMessage: reminder.message
      }
    };
  }

  private async sendNotification(parameters: any, context: ProcessContext): Promise<ProcessResult> {
    const { type, message, urgency } = parameters;
    
    switch (type) {
      case 'email':
        return await this.sendEmailNotification(message, context);
      case 'popup':
        return await this.sendPopupNotification(message, urgency, context);
      case 'desktop':
        return await this.sendDesktopNotification(message, urgency, context);
      case 'sms':
        return await this.sendSMSNotification(message, context);
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  private async updateReminderStatus(parameters: any, context: ProcessContext): Promise<ProcessResult> {
    const { reminderId, status } = parameters;
    
    // Update reminder status in database
    console.log(`📝 Updating reminder ${reminderId} status to: ${status}`);
    
    return {
      success: true,
      data: {
        reminderId,
        status,
        updatedAt: new Date()
      }
    };
  }

  private async createCalendarEvent(parameters: any, context: ProcessContext): Promise<ProcessResult> {
    const { eventTitle, eventDate, reminders } = context.data;
    
    console.log('📅 Creating calendar event:', eventTitle);
    
    // Create calendar event logic here
    const eventId = `cal_event_${Date.now()}`;
    
    return {
      success: true,
      data: {
        eventId,
        eventTitle,
        eventDate,
        reminderCount: reminders?.length || 0
      },
      nextSteps: reminders?.map(() => 'schedule_reminder') || []
    };
  }

  private generateRemindersFromTemplate(template: string, eventDate: Date): any[] {
    const templates = {
      'deposition_intensive': [
        { offset: 20160, timing: 'before', type: 'email', message: 'Deposition in 2 weeks - Begin preparation', urgency: 'info' },
        { offset: 10080, timing: 'before', type: 'email', message: 'Deposition in 1 week - Finalize preparation', urgency: 'warning' },
        { offset: 4320, timing: 'before', type: 'popup', message: 'Deposition in 3 days - Review materials', urgency: 'warning' },
        { offset: 1440, timing: 'before', type: 'popup', message: 'Deposition tomorrow - Final preparation', urgency: 'urgent' },
        { offset: 120, timing: 'before', type: 'desktop', message: 'Deposition in 2 hours', urgency: 'critical' },
        { offset: 240, timing: 'after', type: 'email', message: 'Follow-up: Document deposition outcome', urgency: 'info' }
      ],
      'court_hearing_standard': [
        { offset: 10080, timing: 'before', type: 'email', message: 'Court hearing in 1 week', urgency: 'info' },
        { offset: 2880, timing: 'before', type: 'popup', message: 'Court hearing in 2 days', urgency: 'warning' },
        { offset: 1440, timing: 'before', type: 'popup', message: 'Court hearing tomorrow', urgency: 'urgent' },
        { offset: 60, timing: 'before', type: 'desktop', message: 'Court hearing in 1 hour', urgency: 'critical' },
        { offset: 1440, timing: 'after', type: 'email', message: 'Follow-up: Court hearing results', urgency: 'info' }
      ]
    };
    
    return templates[template as keyof typeof templates] || [];
  }

  private calculateReminderTime(eventDate: Date, offsetMinutes: number, timing: 'before' | 'after'): Date {
    const eventTime = new Date(eventDate);
    const reminderTime = new Date(eventTime);
    
    if (timing === 'before') {
      reminderTime.setMinutes(reminderTime.getMinutes() - offsetMinutes);
    } else {
      reminderTime.setMinutes(reminderTime.getMinutes() + offsetMinutes);
    }
    
    return reminderTime;
  }

  private async sendEmailNotification(message: string, context: ProcessContext): Promise<ProcessResult> {
    console.log('📧 Sending email notification:', message);
    // Email sending logic here
    return { success: true, data: { type: 'email', sent: true } };
  }

  private async sendPopupNotification(message: string, urgency: string, context: ProcessContext): Promise<ProcessResult> {
    console.log('💬 Sending popup notification:', message);
    // Popup notification logic here
    return { success: true, data: { type: 'popup', sent: true } };
  }

  private async sendDesktopNotification(message: string, urgency: string, context: ProcessContext): Promise<ProcessResult> {
    console.log('🖥️ Sending desktop notification:', message);
    // Desktop notification logic here
    return { success: true, data: { type: 'desktop', sent: true } };
  }

  private async sendSMSNotification(message: string, context: ProcessContext): Promise<ProcessResult> {
    console.log('📱 Sending SMS notification:', message);
    // SMS sending logic here
    return { success: true, data: { type: 'sms', sent: true } };
  }
}

// Register the executors
ProcessStepExecutor.registerExecutor('auth', new GoogleAuthStepExecutor());
ProcessStepExecutor.registerExecutor('reminder', new ReminderStepExecutor());
ProcessStepExecutor.registerExecutor('notification', new ReminderStepExecutor());
ProcessStepExecutor.registerExecutor('calendar', new ReminderStepExecutor());
