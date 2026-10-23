import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PracticalEmailAutomation } from './PracticalEmailAutomation';
import { EmailMessage } from '../../services/email/types';

interface EmailAgentControlCenterProps {
  selectedEmails: string[];
  messages: EmailMessage[];
  onAutomationStatsUpdate: (emails: EmailMessage[]) => void;
  width?: number;
}

export const EmailAgentControlCenter: React.FC<EmailAgentControlCenterProps> = ({
  selectedEmails,
  messages,
  onAutomationStatsUpdate,
  width,
}) => {
  return (
    <div
      style={width ? { width: `${width}px`, minWidth: '260px', maxWidth: '650px' } : undefined}
      className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 ${!width ? 'w-96' : ''}`}
    >
      {/* Executive Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Workflow Processing</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Automated scheduling, action items, and routing</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
          {selectedEmails.length > 0 ? `${selectedEmails.length} selected` : 'Inbox queue'}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3">
        <PracticalEmailAutomation
          selectedEmails={selectedEmails}
          messages={messages}
          onEmailUpdate={(emailId, updates) => {
            console.log(`📧 Email ${emailId} updated:`, updates);
            if (onAutomationStatsUpdate) {
              const email = messages.find(m => m.id === emailId);
              if (email) onAutomationStatsUpdate([email]);
            }
          }}
        />
      </div>
    </div>
  );
};
