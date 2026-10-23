import React, { useState } from 'react';
import { EmailToolbar } from './EmailToolbar';
import { EmailListItem } from './EmailListItem';
import type { Email } from '../../types';
import { useLoading } from '../../hooks/useLoading';
import { useNotifications } from '../../hooks/useNotifications';
import { useError } from '../../hooks/useError';
import { Calendar, Bot, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConversationalCalendarAgent } from '@/components/ConversationalCalendarAgent';
import { toast } from 'react-hot-toast';

interface EmailListProps {
  emails: Email[];
  selectedEmails: string[];
  onSelectEmail: (email: Email) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onCreateTasks: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMove: () => void;
}

export function EmailList({
  emails,
  selectedEmails,
  onSelectEmail,
  onToggleSelect,
  onSelectAll,
  onCreateTasks,
  onArchive,
  onDelete,
  onMove
}: EmailListProps) {
  const { withLoading } = useLoading();
  const { showSuccess } = useNotifications();
  const { handleError } = useError();
  const [showCalendarAgent, setShowCalendarAgent] = useState(false);

  const handleEmailAction = async (action: string) => {
    try {
      await withLoading(
        // Your async action here
        new Promise((resolve) => setTimeout(resolve, 1000))
      );
      showSuccess(`Email ${action} successful`);
    } catch (error) {
      handleError(error instanceof Error ? error : 'Failed to process email');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 🤖 Sutra Calendar Assistant Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-3.5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Calendar Assistant</span>
          <span className="text-xs text-slate-500 hidden sm:inline">• Meeting detection & scheduling</span>
          {selectedEmails.length > 0 && (
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium ml-2">
              ({selectedEmails.length} selected)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={selectedEmails.length > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (selectedEmails.length > 0) {
                console.log('Batch analyzing emails:', selectedEmails);
              }
            }}
            disabled={selectedEmails.length === 0}
            className="h-7 text-xs px-2.5 flex items-center gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            Auto-Schedule
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalendarAgent(!showCalendarAgent)}
            className="h-7 text-xs px-2.5 flex items-center gap-1.5"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            {showCalendarAgent ? 'Close' : 'Calendar Agent'}
          </Button>
        </div>
      </div>

      {/* 🤖 Conversational Calendar Agent Chat */}
      {showCalendarAgent && (
        <div className="border-b">
          <ConversationalCalendarAgent 
            emailContext={messages}
            onEventCreated={(event) => {
              console.log('Calendar event created:', event);
              toast.success(`📅 Event created: ${event.summary}`);
            }}
            onWorkflowBuilt={(workflow) => {
              console.log('Calendar workflow built:', workflow);
              toast.success(`🤖 Workflow created: ${workflow.name}`);
            }}
          />
        </div>
      )}

      <div className="relative min-h-[500px]">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              selected={selectedEmails.includes(email.id)}
              onSelect={onToggleSelect}
              onClick={onSelectEmail}
            />
          ))}
        </div>

        <EmailToolbar
          selectedCount={selectedEmails.length}
          onArchive={onArchive}
          onDelete={onDelete}
          onMove={onMove}
          onCreateTasks={onCreateTasks}
        />
      </div>
    </div>
  );
}