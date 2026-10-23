import React, { useState } from 'react';
import { Inbox, BarChart2 } from 'lucide-react';
import { EmailList } from './EmailList';
import { EmailAnalytics } from './EmailAnalytics';
import { useEmailAnalytics } from '../../hooks/useEmailAnalytics';
import type { Email } from '../../types';

interface EmailDashboardProps {
  emails: Email[];
  selectedEmails: string[];
  onSelectEmail: (email: Email) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMove: (folder: string) => void;
  onCreateTasks: () => void;
}

export function EmailDashboard({
  emails,
  selectedEmails,
  onSelectEmail,
  onToggleSelect,
  onSelectAll,
  onArchive,
  onDelete,
  onMove,
  onCreateTasks
}: EmailDashboardProps) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'analytics'>('inbox');
  const analytics = useEmailAnalytics(emails);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4 p-4">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              activeTab === 'inbox'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Inbox className="h-5 w-5" />
            <span>Inbox</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              activeTab === 'analytics'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <BarChart2 className="h-5 w-5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === 'inbox' ? (
        <EmailList
          emails={emails}
          selectedEmails={selectedEmails}
          onSelectEmail={onSelectEmail}
          onToggleSelect={onToggleSelect}
          onSelectAll={onSelectAll}
          onArchive={onArchive}
          onDelete={onDelete}
          onMove={onMove}
          onCreateTasks={onCreateTasks}
        />
      ) : (
        analytics && <EmailAnalytics analytics={analytics} />
      )}
    </div>
  );
} 