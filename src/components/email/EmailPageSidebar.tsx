import React from 'react';
import { Mail, Plus, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { EmailFolders } from './EmailFolders';
import { GmailLabel } from './GoogleTagsManager';
import { EmailAccount } from '../../services/email/types';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface EmailPageSidebarProps {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  folders: any[];
  currentFolderId: string;
  labels: GmailLabel[];
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  onOpenCompose: () => void;
  onDropEmailsToFolder: (folderId: string, emailIds: string[]) => void;
  width?: number;
}

export const EmailPageSidebar: React.FC<EmailPageSidebarProps> = ({
  accounts,
  selectedAccountId,
  folders,
  currentFolderId,
  labels,
  onSelectFolder,
  onCreateFolder,
  onOpenCompose,
  onDropEmailsToFolder,
  width,
}) => {
  const currentAccount = accounts.find((acc) => acc.id === selectedAccountId);

  return (
    <div
      style={width ? { width: `${width}px`, minWidth: '180px', maxWidth: '450px' } : undefined}
      className={cn(
        "border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 shrink-0",
        !width && "w-64"
      )}
    >
      <div className="p-3">
        <Button
          variant="primary"
          className="w-full gap-2 text-sm py-2"
          onClick={onOpenCompose}
        >
          <Plus className="h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* Folders Section */}
      {selectedAccountId && (
        <div className="px-3 pb-2 flex-1">
          <EmailFolders
            folders={folders || []}
            selectedFolder={currentFolderId}
            onSelectFolder={onSelectFolder}
            onCreateFolder={onCreateFolder}
            unreadCounts={{}}
            onDropEmails={onDropEmailsToFolder}
          />
        </div>
      )}

      {/* Labels - Compact collapsed section */}
      {selectedAccountId && labels.length > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300">
              <span>Labels ({labels.length})</span>
              <Tag className="h-3 w-3 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {labels.slice(0, 10).map((label) => (
                <button
                  key={label.id}
                  onClick={() => toast.info('Label filtering not yet implemented')}
                  className="w-full flex items-center justify-between p-1.5 text-xs rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${label.color ? '' : 'bg-gray-400'}`}
                      {...(label.color && { style: { backgroundColor: label.color } })}
                    />
                    <span className="truncate">{label.name}</span>
                  </div>
                  {label.messagesUnread && label.messagesUnread > 0 && (
                    <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-1 py-0.5 rounded-full text-xs">
                      {label.messagesUnread}
                    </span>
                  )}
                </button>
              ))}
              {labels.length > 10 && (
                <div className="text-xs text-gray-400 p-1">
                  +{labels.length - 10} more labels
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      {/* Account info - compact */}
      {selectedAccountId && currentAccount && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Mail className="h-3 w-3" />
            <span className="truncate">{currentAccount.email}</span>
          </div>
        </div>
      )}
    </div>
  );
};
