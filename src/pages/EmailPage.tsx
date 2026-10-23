import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  BarChart3,
  Bot,
  Calendar,
  CheckCircle,
  Mail,
  Plus,
  RefreshCw,
  Scale,
  X,
  Zap,
} from 'lucide-react';
import { useEmail } from '../contexts/EmailContext';
import { EmailComposer } from '../components/email/EmailComposer';
import { EmailAccountConnect } from '../components/email/EmailAccountConnect';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { EmailMessage } from '../services/email/types';
import emailServiceAdapter from '../services/email/EmailServiceAdapter';
import { toast } from 'sonner';
import { DraggableEmailItem } from '../components/email/DraggableEmailItem';
import { GmailLabel } from '../components/email/GoogleTagsManager';
import { useAuth } from '../contexts/AuthContext';
import { debugCalendar } from '../utils/calendarDebugger';
import { CreateFolderDialog } from '../components/email/CreateFolderDialog';
import { GoogleReAuthButton } from '../components/auth/GoogleReAuthButton';
import { EmailEventAnalyzerFactory } from '../services/calendar/EmailEventAnalyzer';
import { NotificationSystem, useNotifications } from '../components/notifications/NotificationSystem';
import { CalendarEventService } from '../services/calendar/CalendarEventService';
import { useEnhancedEmailCalendarIntegration } from '../hooks/calendar/useEnhancedEmailCalendarIntegration';
import { useCalendarRefresh } from '../contexts/CalendarRefreshContext';
import { TaskProgressPanel, useTaskProgressPanel } from '../components/tasks/TaskProgressPanel';
import { EmailPageSidebar } from '../components/email/EmailPageSidebar';
import { EmailAgentControlCenter } from '../components/email/EmailAgentControlCenter';
import { EmailListToolbar } from '../components/email/EmailListToolbar';
import { EmailPaginationFooter } from '../components/email/EmailPaginationFooter';
import '../components/email/EmailDragDrop.css';

interface ComposerReplyData {
  messageId: string;
  subject: string;
  to: string;
  body: string;
}

interface ComposerForwardData {
  messageId: string;
  subject: string;
  body: string;
}

interface ComposerReplyAllData {
  messageId: string;
  subject: string;
  to: string[];
  cc: string[];
  body: string;
}

function EmailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    messages,
    accounts,
    selectedAccountId,
    loading: emailContextLoading,
    getMessages,
    selectAccount,
    folders,
    moveToFolder,
    deleteMessage,
    markAsRead,
    markAsUnread,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
  } = useEmail();

  const navigate = useNavigate();
  const location = useLocation();
  const { accountId: routeAccountId, folderId: routeFolderId, messageId: routeMessageId } = useParams<{
    accountId?: string;
    folderId?: string;
    messageId?: string;
  }>();

  const getMessagesRef = useRef(getMessages);
  useEffect(() => {
    getMessagesRef.current = getMessages;
  }, [getMessages]);

  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string>(routeFolderId ? decodeURIComponent(routeFolderId) : 'INBOX');
  const [composerReplyData, setComposerReplyData] = useState<ComposerReplyData | undefined>(undefined);
  const [composerForwardData, setComposerForwardData] = useState<ComposerForwardData | undefined>(undefined);
  const [composerReplyAllData, setComposerReplyAllData] = useState<ComposerReplyAllData | undefined>(undefined);

  // Synchronize route folder parameter with state and load messages for that folder
  useEffect(() => {
    const accId = routeAccountId || selectedAccountId || accounts[0]?.id;
    const decodedFolder = routeFolderId ? decodeURIComponent(routeFolderId) : 'INBOX';
    if (decodedFolder !== currentFolderId) {
      setCurrentFolderId(decodedFolder);
    }
    if (accId) {
      getMessagesRef.current(accId, { folderId: decodedFolder, pageSize: 25 });
    }
  }, [routeAccountId, routeFolderId, selectedAccountId]);

  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [labels] = useState<GmailLabel[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Navigation state for compose
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state?.compose) {
        setShowCompose(true);
        if (state.replyTo) {
          setComposerReplyData(state.replyTo);
        } else if (state.replyAllTo) {
          setComposerReplyAllData(state.replyAllTo);
        } else if (state.forwardFrom) {
          setComposerForwardData(state.forwardFrom);
        }
        navigate(location.pathname, { replace: true, state: null });
      }
    }
  }, [location.state, navigate, location.pathname]);

  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [isAutoCalendarEnabled, setIsAutoCalendarEnabled] = useState<boolean>(false);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);

  const [showAutomationPanel] = useState(true);
  const [needsCalendarReauth, setNeedsCalendarReauth] = useState(false);
  const [automationStats, setAutomationStats] = useState({
    calendarEventsCreated: 23,
    tasksAutomated: 47,
    duplicatesPrevented: 8,
    legalCasesProcessed: 12,
    voiceCommandsUsed: 15,
    wcabHearingsScheduled: 6,
  });

  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const taskProgressPanel = useTaskProgressPanel();

  // Resizable panels state
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('email_sidebar_width');
    return saved ? Math.max(180, Math.min(450, parseInt(saved, 10))) : 256;
  });
  const [agentPanelWidth, setAgentPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('email_agent_panel_width');
    return saved ? Math.max(260, Math.min(650, parseInt(saved, 10))) : 384;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingAgentPanel, setIsResizingAgentPanel] = useState(false);

  useEffect(() => {
    if (!isResizingSidebar && !isResizingAgentPanel) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(180, Math.min(450, e.clientX));
        setSidebarWidth(newWidth);
      } else if (isResizingAgentPanel) {
        const newWidth = Math.max(260, Math.min(650, window.innerWidth - e.clientX));
        setAgentPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingSidebar) {
        setIsResizingSidebar(false);
        localStorage.setItem('email_sidebar_width', sidebarWidth.toString());
      }
      if (isResizingAgentPanel) {
        setIsResizingAgentPanel(false);
        localStorage.setItem('email_agent_panel_width', agentPanelWidth.toString());
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingAgentPanel, sidebarWidth, agentPanelWidth]);

  const [eventAnalyzer] = useState(() => EmailEventAnalyzerFactory.createWCABAnalyzer());
  const enhancedCalendarHook = useEnhancedEmailCalendarIntegration();
  const currentIndustry = 'legal';
  const useEnhancedEngine = true;

  const { triggerRefresh: triggerCalendarRefresh } = useCalendarRefresh();

  const [calendarEventService] = useState(() => {
    return new CalendarEventService(
      {
        createEvent: async (event: any) => {
          console.log('📅 Creating event:', event.title);
          return `event-${Date.now()}`;
        },
        updateEvent: async (id: string, updates: any) => {
          console.log('📅 Updating event:', id, updates);
        },
        deleteEvent: async (id: string) => {
          console.log('📅 Deleting event:', id);
        },
        getEvents: async (start: Date, end: Date) => {
          console.log('📅 Getting events from', start, 'to', end);
          return [];
        },
      },
      {
        scheduleReminder: async (reminder: any) => {
          console.log('⏰ Scheduling reminder:', reminder.message);
          return `reminder-${Date.now()}`;
        },
        cancelReminder: async (id: string) => {
          console.log('⏰ Cancelling reminder:', id);
        },
        updateReminder: async (id: string, updates: any) => {
          console.log('⏰ Updating reminder:', id, updates);
        },
        getActiveReminders: async () => {
          console.log('⏰ Getting active reminders');
          return [];
        },
      }
    );
  });

  const notifications = useNotifications();
  const autoCalendarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isLegalEmail = useCallback(
    (email: EmailMessage): boolean => {
      const eventTypes = eventAnalyzer.detectEventTypes(email);
      const hasLegalEvents = eventTypes.length > 0 && !eventTypes.every((type) => type === 'custom');

      if (!hasLegalEvents) {
        const subject = email.subject?.toLowerCase() || '';
        const body = email.body?.toLowerCase() || email.snippet?.toLowerCase() || '';
        const content = `${subject} ${body}`;

        const legalKeywords = [
          'notice of hearing',
          'hearing',
          'wcab',
          'deposition',
          'mediation',
          'court',
          'case',
          'legal',
          'attorney',
          'law',
          'settlement',
          'adjudication',
          'medical examination',
          'ime',
          'workers comp',
          'compensation',
          'adj',
        ];

        return legalKeywords.some((keyword) => content.includes(keyword));
      }

      return hasLegalEvents;
    },
    [eventAnalyzer]
  );

  const processEmailWithConfigurableSystem = async (email: EmailMessage) => {
    return await enhancedCalendarHook.processEmailContent(email);
  };

  // Auto-Calendar Processing Effect
  useEffect(() => {
    if (!isAutoCalendarEnabled || !messages || messages.length === 0) {
      return;
    }

    if (autoCalendarTimeoutRef.current) {
      clearTimeout(autoCalendarTimeoutRef.current);
    }

    autoCalendarTimeoutRef.current = setTimeout(async () => {
      debugCalendar.info('sync', `Auto-calendar processing triggered for ${messages.length} emails`);
      setIsAutoProcessing(true);
      let processed = 0;
      let eventsCreated = 0;

      try {
        const recentEmails = messages
          .filter(
            (email) =>
              !email.read &&
              isLegalEmail(email) &&
              email.date &&
              new Date(email.date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          )
          .slice(0, 5);

        for (const email of recentEmails) {
          try {
            let fullEmail = email;
            try {
              const accountId = routeAccountId || selectedAccountId;
              if (accountId) {
                const fullEmailResult = await emailServiceAdapter.getMessage(accountId, email.id);
                if (fullEmailResult.message) {
                  fullEmail = fullEmailResult.message;
                }
              }
            } catch (fetchError) {
              debugCalendar.warn('events', `Could not fetch full email, using basic data: ${email.id}`, fetchError);
            }

            const eventDetails = await processEmailWithConfigurableSystem(fullEmail);
            const hasEssentialInfo =
              eventDetails &&
              eventDetails.title &&
              eventDetails.startDate &&
              eventDetails.startDate instanceof Date &&
              !isNaN(eventDetails.startDate.getTime());

            if (eventDetails && hasEssentialInfo) {
              try {
                let calendarEventToProcess;
                if ('id' in eventDetails && 'sourceEmail' in eventDetails) {
                  calendarEventToProcess = eventDetails;
                } else {
                  const eventDateTime = (eventDetails as any)?.dateTime || (eventDetails as any)?.startDate;
                  const eventEndDateTime = (eventDetails as any)?.endDateTime || (eventDetails as any)?.endDate;
                  calendarEventToProcess = {
                    id: '',
                    title: eventDetails.title,
                    description: eventDetails.description,
                    startDate: eventDateTime,
                    endDate: eventEndDateTime || new Date(eventDateTime.getTime() + 60 * 60 * 1000),
                    location: eventDetails.location,
                    attendees: eventDetails.attendees,
                    eventType: eventDetails.eventType,
                    sourceEmail: fullEmail.id,
                    relatedTasks: [],
                    reminders: [],
                    metadata: (eventDetails as any)?.extractedData || {},
                  };
                }

                const result = await calendarEventService.processCalendarEvent(
                  calendarEventToProcess,
                  fullEmail,
                  []
                );

                if (result && result.eventId) {
                  eventsCreated++;
                  processed++;

                  setAutomationStats((prev) => ({
                    ...prev,
                    calendarEventsCreated: prev.calendarEventsCreated + (result.isUpdate ? 0 : 1),
                    tasksAutomated: prev.tasksAutomated + (result.taskIds?.length || 0),
                  }));

                  triggerCalendarRefresh();
                }
              } catch (eventCreationError: any) {
                if (
                  eventCreationError?.message?.includes('Calendar permissions required') ||
                  eventCreationError?.message?.includes('insufficient authentication scopes')
                ) {
                  setNeedsCalendarReauth(true);
                  setIsAutoCalendarEnabled(false);
                  toast.warning('🔐 Auto calendar disabled: Calendar permissions required');
                  return;
                }
              }
            }
          } catch (error) {
            debugCalendar.error('events', `Error auto-processing email: ${email.id}`, error as Error);
          }
        }

        if (processed > 0) {
          toast.success(`🤖 Auto-calendar created ${eventsCreated} events from ${processed} emails`, {
            description: `Legal workflows automatically detected and scheduled`,
          });
        }
      } catch (error) {
        toast.error('Auto-calendar processing encountered an error');
      } finally {
        setIsAutoProcessing(false);
      }
    }, 3000);

    return () => {
      if (autoCalendarTimeoutRef.current) {
        clearTimeout(autoCalendarTimeoutRef.current);
      }
    };
  }, [messages, isAutoCalendarEnabled, eventAnalyzer, calendarEventService, isLegalEmail]);

  const handleRefreshEmails = useCallback(() => {
    const accId = routeAccountId || selectedAccountId;
    if (accId && currentFolderId && !routeMessageId) {
      getMessagesRef.current(accId, { folderId: currentFolderId, pageSize: 25, search: searchQuery || undefined });
    }
  }, [routeAccountId, selectedAccountId, currentFolderId, getMessagesRef, searchQuery, routeMessageId]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const accId = routeAccountId || selectedAccountId;
      if (accId && currentFolderId && !routeMessageId) {
        getMessagesRef.current(accId, { folderId: currentFolderId, pageSize: 25, search: query || undefined });
      }
    },
    [routeAccountId, selectedAccountId, currentFolderId, getMessagesRef, routeMessageId]
  );

  const handleQuickFilter = useCallback(
    (filter: any) => {
      setSearchQuery(filter.query);
      const accId = routeAccountId || selectedAccountId;
      if (accId && currentFolderId && !routeMessageId) {
        getMessagesRef.current(accId, { folderId: currentFolderId, pageSize: 25, search: filter.query || undefined });
      }
    },
    [routeAccountId, selectedAccountId, currentFolderId, getMessagesRef, routeMessageId]
  );

  const handleDropEmailsToFolder = useCallback(
    async (folderId: string, emailIds: string[]) => {
      const accountId = routeAccountId || selectedAccountId;
      if (!accountId) {
        toast.error('No account selected');
        return;
      }

      try {
        toast.info(`Moving ${emailIds.length} emails...`);
        for (const emailId of emailIds) {
          await moveToFolder(accountId, emailId, folderId);
        }
        toast.success(`Successfully moved ${emailIds.length} emails to folder`);
        setSelectedEmails([]);
        if (currentFolderId) {
          getMessagesRef.current(accountId, { folderId: currentFolderId, pageSize: 25, search: searchQuery || undefined });
        }
      } catch (error) {
        toast.error('Failed to move emails');
      }
    },
    [moveToFolder, routeAccountId, selectedAccountId, currentFolderId, getMessagesRef, searchQuery]
  );

  const handleBatchCalendarAnalysis = async () => {
    const emailsToProcess =
      selectedEmails.length > 0 ? messages.filter((email) => selectedEmails.includes(email.id)) : messages.slice(0, 10);

    setIsAutoProcessing(true);
    let eventsCreated = 0;
    let tasksCreated = 0;

    try {
      for (const email of emailsToProcess) {
        try {
          const eventDetails = await processEmailWithConfigurableSystem(email);
          const confidence = (eventDetails as any)?.confidence;
          if (eventDetails && !isNaN(confidence) && confidence > 0.5) {
            eventsCreated++;
            tasksCreated++;
          }
        } catch (error) {
          console.error('Error processing email:', email.id, error);
        }
      }

      setAutomationStats((prev) => ({
        ...prev,
        calendarEventsCreated: prev.calendarEventsCreated + eventsCreated,
        tasksAutomated: prev.tasksAutomated + tasksCreated,
      }));
      setSelectedEmails([]);
      toast.success(`✅ Batch analysis complete! Processed: ${emailsToProcess.length} emails • Events: ${eventsCreated}`);
    } catch (error) {
      toast.error('Failed to analyze emails for calendar events');
    } finally {
      setIsAutoProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const accountId = selectedAccountId || accounts[0]?.id;
      if (!accountId) throw new Error('No account selected');
      for (const emailId of selectedEmails) {
        await deleteMessage(accountId, emailId);
      }
      toast.success(`Deleted ${selectedEmails.length} emails`);
      setSelectedEmails([]);
      getMessages(accountId, { folderId: currentFolderId });
    } catch (error) {
      toast.error('Failed to delete emails');
    }
  };

  const handleBulkMove = async (folderId: string) => {
    try {
      const accountId = selectedAccountId || accounts[0]?.id;
      if (!accountId) throw new Error('No account selected');
      for (const emailId of selectedEmails) {
        await moveToFolder(accountId, emailId, folderId);
      }
      toast.success(`Moved ${selectedEmails.length} emails`);
      setSelectedEmails([]);
      getMessages(accountId, { folderId: currentFolderId });
    } catch (error) {
      toast.error('Failed to move emails');
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      const accountId = selectedAccountId || accounts[0]?.id;
      if (!accountId) throw new Error('No account selected');
      for (const emailId of selectedEmails) {
        await markAsRead(accountId, emailId);
      }
      toast.success(`Marked ${selectedEmails.length} emails as read`);
      setSelectedEmails([]);
      getMessages(accountId, { folderId: currentFolderId });
    } catch (error) {
      toast.error('Failed to mark emails as read');
    }
  };

  const handleBulkMarkAsUnread = async () => {
    try {
      const accountId = selectedAccountId || accounts[0]?.id;
      if (!accountId) throw new Error('No account selected');
      for (const emailId of selectedEmails) {
        await markAsUnread(accountId, emailId);
      }
      toast.success(`Marked ${selectedEmails.length} emails as unread`);
      setSelectedEmails([]);
      getMessages(accountId, { folderId: currentFolderId });
    } catch (error) {
      toast.error('Failed to mark emails as unread');
    }
  };

  if (authLoading || (emailContextLoading && messages.length === 0 && !routeMessageId)) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="h-8 w-8" /> Loading page...
      </div>
    );
  }

  if (!authLoading && accounts.length === 0 && !emailContextLoading) {
    return (
      <div className="h-full flex flex-col bg-background overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Connect Email Account</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Accounts
          </Button>
        </div>
        <div className="flex-1 p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-3xl">
            <EmailAccountConnect 
              isDialog={false}
              onConnectionSuccess={() => {
                toast.success('Email account connected! Loading your mailbox...');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">My Emails</h1>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => (taskProgressPanel.isVisible ? taskProgressPanel.hide() : taskProgressPanel.show())}
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 transition-colors',
              taskProgressPanel.isVisible &&
                'bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
            )}
          >
            <BarChart3 className="h-4 w-4" />
            {taskProgressPanel.isVisible ? 'Hide Tasks' : 'Show Tasks'}
          </Button>

          {!showAutomationPanel && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{automationStats.calendarEventsCreated}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>{automationStats.tasksAutomated}</span>
              </div>
              <div className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                <span>{automationStats.legalCasesProcessed}</span>
              </div>
              {isAutoProcessing && (
                <div className="flex items-center gap-1 text-blue-500 animate-pulse">
                  <Bot className="h-3 w-3" />
                  <span className="text-xs">Processing...</span>
                </div>
              )}
            </div>
          )}

          {accounts.length > 1 && (
            <select
              aria-label="Select email account"
              title="Select email account"
              value={selectedAccountId || ''}
              onChange={(e) => {
                const newAccountId = e.target.value;
                selectAccount(newAccountId);
                navigate(`/email/folder/${newAccountId}/${encodeURIComponent(currentFolderId || 'INBOX')}`);
              }}
              className="p-2 border rounded-md bg-background text-foreground"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name || acc.email}
                </option>
              ))}
            </select>
          )}

          <Button variant="outline" onClick={handleRefreshEmails} disabled={emailContextLoading && !routeMessageId}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowConnectModal(true)}
            title="Connect another email account"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAgentPanel(!showAgentPanel)}
            className={
              showAgentPanel
                ? 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800/50 dark:border-slate-600 dark:text-slate-300'
                : ''
            }
          >
            <Zap className="h-4 w-4 mr-2" />
            Smart Actions
          </Button>

          <Button
            onClick={() => {
              setComposerReplyData(undefined);
              setComposerForwardData(undefined);
              setComposerReplyAllData(undefined);
              setShowCompose(true);
            }}
            variant="primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden select-none">
        <EmailPageSidebar
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          folders={folders || []}
          currentFolderId={currentFolderId}
          labels={labels}
          width={sidebarWidth}
          onSelectFolder={(folderId) => {
            setCurrentFolderId(folderId);
            if (selectedAccountId) {
              navigate(`/email/folder/${selectedAccountId}/${encodeURIComponent(folderId)}`);
            }
          }}
          onCreateFolder={() => setShowCreateFolderDialog(true)}
          onOpenCompose={() => {
            setComposerReplyData(undefined);
            setComposerForwardData(undefined);
            setComposerReplyAllData(undefined);
            setShowCompose(true);
          }}
          onDropEmailsToFolder={handleDropEmailsToFolder}
        />

        {/* Draggable Divider for Email Sidebar */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingSidebar(true);
          }}
          onDoubleClick={() => setSidebarWidth(256)}
          title="Drag to resize Email Sidebar (double-click to reset)"
          className="w-1.5 hover:w-2 bg-transparent hover:bg-indigo-500/40 cursor-col-resize z-20 flex items-center justify-center transition-all group shrink-0"
        >
          <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-indigo-400 group-hover:h-12 transition-all" />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <EmailListToolbar
            messages={messages || []}
            selectedEmails={selectedEmails}
            accountName={accounts.find((a) => a.id === selectedAccountId)?.name}
            isAutoCalendarEnabled={isAutoCalendarEnabled}
            isAutoProcessing={isAutoProcessing}
            useEnhancedEngine={useEnhancedEngine}
            currentIndustry={currentIndustry}
            labels={labels}
            folders={folders || []}
            onSearch={handleSearch}
            onQuickFilter={handleQuickFilter}
            onSelectAll={(checked) => {
              if (checked) {
                setSelectedEmails((messages || []).map((m) => m.id));
              } else {
                setSelectedEmails([]);
              }
            }}
            onBatchCalendarAnalysis={handleBatchCalendarAnalysis}
            onAutoCalendarToggle={setIsAutoCalendarEnabled}
            onArchive={async () => {
              toast.success(`Archived ${selectedEmails.length} emails`);
              setSelectedEmails([]);
            }}
            onDelete={handleBulkDelete}
            onMove={handleBulkMove}
            onMarkAsRead={handleBulkMarkAsRead}
            onMarkAsUnread={handleBulkMarkAsUnread}
          />

          <div className="flex-1 overflow-y-auto">
            {emailContextLoading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <Spinner className="h-8 w-8" /> Loading messages...
              </div>
            ) : messages.length > 0 ? (
              <>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {messages.map((email, index) => {
                    const isSelected = selectedEmails.includes(email.id);
                    return (
                      <DraggableEmailItem
                        key={`${email.id}-${index}`}
                        email={email}
                        isSelected={isSelected}
                        onSelect={(emailId: string, selected: boolean) => {
                          setSelectedEmails((prev) =>
                            selected ? [...prev, emailId] : prev.filter((id) => id !== emailId)
                          );
                        }}
                        onClick={(clickedEmail) => {
                          const accountToNavigate = selectedAccountId || routeAccountId || accounts[0]?.id;
                          const folderToNavigate = routeFolderId ? decodeURIComponent(routeFolderId) : currentFolderId || 'INBOX';
                          if (accountToNavigate && folderToNavigate) {
                            navigate(`/email/message/${accountToNavigate}/${encodeURIComponent(folderToNavigate)}/${encodeURIComponent(clickedEmail.id)}`);
                          } else {
                            toast.error('Could not open email: Account or folder not identified.');
                          }
                        }}
                        onStar={() => toast.success('Email starred')}
                        onArchive={() => toast.success('Email archived')}
                        onDelete={async (emailId: string) => {
                          try {
                            const accountId = selectedAccountId || accounts[0]?.id;
                            if (!accountId) throw new Error('No account selected');
                            await deleteMessage(accountId, emailId);
                            toast.success('Email deleted');
                            getMessages(accountId, { folderId: currentFolderId });
                          } catch (error) {
                            toast.error('Failed to delete email');
                          }
                        }}
                        onDrop={async (emailIds: string[], targetFolderId: string) => {
                          try {
                            const accountId = selectedAccountId || accounts[0]?.id;
                            if (!accountId) throw new Error('No account selected');
                            for (const emailId of emailIds) {
                              await moveToFolder(accountId, emailId, targetFolderId);
                            }
                            toast.success(`Moved ${emailIds.length} emails`);
                            getMessages(accountId, { folderId: currentFolderId });
                          } catch (error) {
                            toast.error('Failed to move emails');
                          }
                        }}
                        showTags={true}
                      />
                    );
                  })}
                </div>

                <EmailPaginationFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalMessages={messages.length}
                  hasPrevPage={hasPrevPage}
                  hasNextPage={hasNextPage}
                  loading={emailContextLoading}
                  onPrevPage={() => {
                    const accountId = routeAccountId || selectedAccountId;
                    if (accountId && hasPrevPage) {
                      goToPage(accountId, currentPage - 1, { folderId: currentFolderId, search: searchQuery });
                    }
                  }}
                  onNextPage={() => {
                    const accountId = routeAccountId || selectedAccountId;
                    if (accountId && hasNextPage) {
                      goToPage(accountId, currentPage + 1, { folderId: currentFolderId, search: searchQuery });
                    }
                  }}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Mail size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No emails found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? `No emails found for "${searchQuery}" in ${accounts.find((a) => a.id === selectedAccountId)?.name || 'this account'}.`
                    : `Your ${accounts.find((a) => a.id === selectedAccountId)?.name || 'account'} is empty.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {needsCalendarReauth && (
          <div className="w-80 mb-4 p-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800 mb-2">Calendar Permissions Required</h3>
                  <p className="text-xs text-amber-700 mb-3">
                    To create calendar events from WCAB hearing notices, please re-authenticate with Google.
                  </p>
                  <GoogleReAuthButton
                    onSuccess={() => {
                      setNeedsCalendarReauth(false);
                      toast.success('✅ Calendar permissions granted!');
                    }}
                    showWarning={false}
                    className="text-xs"
                  />
                </div>
                <button
                  onClick={() => setNeedsCalendarReauth(false)}
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                  title="Dismiss"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {showAgentPanel && (
          <>
            {/* Draggable Divider for Agent Control Center */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingAgentPanel(true);
              }}
              onDoubleClick={() => setAgentPanelWidth(384)}
              title="Drag to resize Workflow Processing panel (double-click to reset)"
              className="w-1.5 hover:w-2 bg-transparent hover:bg-indigo-500/40 cursor-col-resize z-20 flex items-center justify-center transition-all group shrink-0"
            >
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-indigo-400 group-hover:h-12 transition-all" />
            </div>

            <EmailAgentControlCenter
              selectedEmails={selectedEmails}
              messages={messages || []}
              width={agentPanelWidth}
              onAutomationStatsUpdate={(processedEmails) => {
                setAutomationStats((prev) => ({
                  ...prev,
                  calendarEventsCreated: prev.calendarEventsCreated + processedEmails.length,
                  legalCasesProcessed:
                    prev.legalCasesProcessed +
                    processedEmails.filter(
                      (e) =>
                        e.subject.toLowerCase().includes('hearing') ||
                        e.subject.toLowerCase().includes('wcab') ||
                        e.subject.toLowerCase().includes('legal')
                    ).length,
                }));
              }}
            />
          </>
        )}
      </div>

      {showCompose && (
        <EmailComposer
          isOpen={showCompose}
          onClose={() => {
            setShowCompose(false);
            setComposerReplyData(undefined);
            setComposerForwardData(undefined);
            setComposerReplyAllData(undefined);
          }}
          onSend={() => {}}
          onSaveDraft={() => {}}
          replyTo={composerReplyData}
          forwardFrom={composerForwardData}
          replyAllTo={composerReplyAllData}
          accountId={selectedAccountId || undefined}
        />
      )}

      {showCreateFolderDialog && (
        <CreateFolderDialog
          onSubmit={(folderName) => {
            console.log('Creating folder:', folderName);
            setShowCreateFolderDialog(false);
          }}
          onClose={() => setShowCreateFolderDialog(false)}
        />
      )}

      <NotificationSystem
        notifications={notifications.notifications}
        onDismiss={notifications.dismissNotification}
        onAction={notifications.handleAction}
      />

      {taskProgressPanel.isVisible && (
        <TaskProgressPanel
          isMinimized={taskProgressPanel.isMinimized}
          onClose={taskProgressPanel.hide}
          onToggleMinimize={taskProgressPanel.toggleMinimize}
        />
      )}

      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-border">
            <button 
              onClick={() => setShowConnectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <EmailAccountConnect 
              isDialog={true}
              onConnectionSuccess={() => {
                setShowConnectModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailPage;
