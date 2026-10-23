import { useState, useCallback, useEffect, useRef } from 'react';
import { EmailMessage } from '../../services/email/types';
import { useEmailCalendarIntegration } from './useEmailCalendarIntegration';
import { debugCalendar } from '../../utils/calendarDebugger';
import { toast } from 'sonner';

/**
 * Hook for managing auto-calendar processing of emails
 * Handles debounced processing of new emails for calendar events
 */
export const useAutoCalendarProcessing = (
  messages: EmailMessage[],
  isAutoCalendarEnabled: boolean,
  routeAccountId?: string,
  selectedAccountId?: string
) => {
  const { processEmailsForCalendar, isLegalEmail } = useEmailCalendarIntegration();
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [autoProcessedIds, setAutoProcessedIds] = useState<Set<string>>(new Set());
  const autoCalendarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-Calendar Processing Effect
  useEffect(() => {
    if (!isAutoCalendarEnabled || !messages || messages.length === 0) {
      return;
    }

    // Clear any existing timeout
    if (autoCalendarTimeoutRef.current) {
      clearTimeout(autoCalendarTimeoutRef.current);
    }

    // Debounced auto-calendar processing
    autoCalendarTimeoutRef.current = setTimeout(async () => {
      debugCalendar.info('sync', `Auto-calendar processing triggered for ${messages.length} emails`);
      
      setIsAutoProcessing(true);
      let processed = 0;
      let eventsCreated = 0;
      
      try {
        // Process recent unread emails for calendar events
        const recentEmails = messages.filter(email => 
          !email.read && 
          isLegalEmail(email) &&
          !autoProcessedIds.has(email.id) &&
          email.date && 
          new Date(email.date) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        ).slice(0, 5); // Limit to 5 most recent to avoid overwhelming

        debugCalendar.debug('events', `Processing ${recentEmails.length} recent legal emails`);

        if (recentEmails.length > 0) {
          const result = await processEmailsForCalendar(
            recentEmails,
            (count) => { eventsCreated = count; },
            (error) => {
              // Check if this is a calendar permissions error
              if (error && typeof error === 'object' && 'message' in error) {
                const errorMessage = String(error.message);
                console.log('🔍 Calendar error message:', errorMessage);
                if (errorMessage.includes('Calendar permissions required') || 
                    errorMessage.includes('insufficient authentication scopes') ||
                    errorMessage.includes('Google Calendar API returned no event ID')) {
                  console.log('✅ Calendar permissions error detected');
                  throw new Error('Calendar permissions required');
                }
              }
            }
          );

          processed = result.processedEmails;
          eventsCreated = result.eventsCreated;

          // Mark emails as processed
          setAutoProcessedIds(prev => {
            const newSet = new Set(prev);
            recentEmails.forEach(email => newSet.add(email.id));
            return newSet;
          });
        }

        if (processed > 0) {
          debugCalendar.syncSuccess(`Auto-calendar created ${eventsCreated} events from ${processed} emails`);
          toast.success(`🤖 Auto-calendar created ${eventsCreated} events from ${processed} emails`, {
            description: `Legal workflows automatically detected and scheduled`,
          });
        }
        
      } catch (error) {
        debugCalendar.syncError('Auto-calendar processing encountered an error', error as Error);
        
        // Handle specific error types
        if (error instanceof Error && error.message.includes('Calendar permissions required')) {
          throw error; // Re-throw to be handled by calling component
        } else {
          toast.error('Auto-calendar processing encountered an error');
        }
      } finally {
        setIsAutoProcessing(false);
      }
    }, 3000); // 3 second debounce

    // Cleanup timeout on unmount
    return () => {
      if (autoCalendarTimeoutRef.current) {
        clearTimeout(autoCalendarTimeoutRef.current);
      }
    };
  }, [messages, isAutoCalendarEnabled, processEmailsForCalendar, isLegalEmail, autoProcessedIds]);

  // Manual batch processing for selected emails
  const processBatchCalendarAnalysis = useCallback(async (emailIds: string[]) => {
    if (emailIds.length === 0) {
      console.log('🤖 No emails selected for batch analysis');
      return { eventsCreated: 0, tasksCreated: 0 };
    }

    const emailsToProcess = messages.filter(email => emailIds.includes(email.id));
    console.log('🔄 Starting batch analysis for', emailsToProcess.length, 'emails');
    setIsAutoProcessing(true);

    try {
      const result = await processEmailsForCalendar(
        emailsToProcess,
        undefined,
        (error) => {
          console.error('Error in batch processing:', error);
        }
      );

      toast.success(
        `✅ Batch analysis complete! Processed: ${result.processedEmails} emails • Events: ${result.eventsCreated}`
      );

      return {
        eventsCreated: result.eventsCreated,
        tasksCreated: result.eventsCreated // Approximate task count
      };

    } catch (error) {
      console.error('❌ Batch calendar analysis failed:', error);
      toast.error('Failed to analyze emails for calendar events');
      throw error;
    } finally {
      setIsAutoProcessing(false);
    }
  }, [messages, processEmailsForCalendar]);

  return {
    isAutoProcessing,
    processBatchCalendarAnalysis,
    autoProcessedIds
  };
};
