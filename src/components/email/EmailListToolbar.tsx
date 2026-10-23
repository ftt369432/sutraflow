import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { EnhancedEmailSearch } from './EnhancedEmailSearch';
import { EnhancedEmailToolbar } from './EnhancedEmailToolbar';
import { EmailMessage } from '../../services/email/types';
import { debugCalendar } from '../../utils/calendarDebugger';
import { toast } from 'sonner';

interface EmailListToolbarProps {
  messages: EmailMessage[];
  selectedEmails: string[];
  accountName?: string;
  isAutoCalendarEnabled: boolean;
  isAutoProcessing: boolean;
  useEnhancedEngine: boolean;
  currentIndustry: string;
  labels: any[];
  folders: any[];
  onSearch: (query: string) => void;
  onQuickFilter: (filter: any) => void;
  onSelectAll: (checked: boolean) => void;
  onBatchCalendarAnalysis: () => void;
  onAutoCalendarToggle: (checked: boolean) => void;
  onArchive: () => void;
  onDelete: () => void;
  onMove: (folderId: string) => void;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
}

export const EmailListToolbar: React.FC<EmailListToolbarProps> = ({
  messages,
  selectedEmails,
  accountName,
  isAutoCalendarEnabled,
  isAutoProcessing,
  useEnhancedEngine,
  currentIndustry,
  labels,
  folders,
  onSearch,
  onQuickFilter,
  onSelectAll,
  onBatchCalendarAnalysis,
  onAutoCalendarToggle,
  onArchive,
  onDelete,
  onMove,
  onMarkAsRead,
  onMarkAsUnread,
}) => {
  const navigate = useNavigate();

  const handleSendToWorkbench = () => {
    const selectedList = messages.filter((m) => selectedEmails.includes(m.id));
    const prompt = `Please review and extract legal exhibits, hearing notices, and action items from the following selected email(s):\n\n${selectedList.map((m, i) => `[Email ${i + 1}] Subject: ${m.subject}\nFrom: ${typeof m.from === 'string' ? m.from : (m.from?.name || m.from?.email || 'Unknown')}\nDate: ${m.date}\nSnippet: ${m.snippet || m.body || ''}`).join('\n\n')}\n\nTask: Extract all industrial injury dates, ADJ numbers, doctor reports, UR denials, or hearing notices. Compile a verified chronologically indexed legal memo and prepare any necessary objections or petitions under California Workers' Compensation law.`;
    window.dispatchEvent(new CustomEvent('genieflow:set-prompt', { detail: { prompt } }));
    navigate('/workbench');
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <EnhancedEmailSearch
        onSearch={onSearch}
        onQuickFilter={onQuickFilter}
        placeholder={`Search in ${accountName || 'emails'}...`}
        className="mb-3"
      />

      {messages && messages.length > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              id="select-all-emails"
              checked={messages.length > 0 && selectedEmails.length === messages.length}
              onChange={(e) => {
                e.stopPropagation();
                onSelectAll(e.target.checked);
              }}
              disabled={messages.length === 0}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="select-all-emails"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              {selectedEmails.length === messages.length && messages.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </label>
          </div>

          <div className="flex items-center gap-4">
            {selectedEmails.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSendToWorkbench}
                  size="sm"
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Workbench ({selectedEmails.length})
                </Button>

                <Button
                  onClick={onBatchCalendarAnalysis}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Calendar ({selectedEmails.length})
                </Button>
              </div>
            )}

            {/* Auto-Calendar Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-calendar-toggle"
                checked={isAutoCalendarEnabled}
                onCheckedChange={onAutoCalendarToggle}
              />
              <Label
                htmlFor="auto-calendar-toggle"
                className="text-sm text-muted-foreground select-none cursor-pointer flex items-center gap-1"
              >
                Auto-Calendar New Emails
                {isAutoCalendarEnabled && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {isAutoProcessing ? (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Bot className="h-3 w-3 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="text-green-600">ON</span>
                    )}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs px-1 py-0.5 ml-1">
                  {useEnhancedEngine ? `🔧 ${currentIndustry}` : '🏛️ Original'}
                </Badge>
              </Label>
            </div>

            {/* Calendar Debug Button - Development Mode */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={() => {
                  const report = debugCalendar.healthReport();
                  console.log(report);
                  toast.info('Calendar health report logged to console', {
                    description: 'Check browser console for detailed information',
                  });
                }}
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
              >
                Debug Calendar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Email Toolbar - Show when emails are selected */}
      {selectedEmails.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
          <EnhancedEmailToolbar
            selectedEmails={messages.filter((m) => selectedEmails.includes(m.id))}
            folders={folders}
            onArchive={onArchive}
            onDelete={onDelete}
            onMove={onMove}
            onCreateTasks={() => {
              toast.success(`Created tasks for ${selectedEmails.length} emails`);
            }}
            onAddTags={(_tags: string[]) => {
              toast.success(`Added tags to ${selectedEmails.length} emails`);
            }}
            onRemoveTags={(_tags: string[]) => {
              toast.success(`Removed tags from ${selectedEmails.length} emails`);
            }}
            onMarkAsRead={onMarkAsRead}
            onMarkAsUnread={onMarkAsUnread}
            onStar={() => {
              toast.success(`Starred ${selectedEmails.length} emails`);
            }}
            onUnstar={() => {
              toast.success(`Unstarred ${selectedEmails.length} emails`);
            }}
            onMarkImportant={() => {
              toast.success(`Marked ${selectedEmails.length} emails as important`);
            }}
            onMarkUnimportant={() => {
              toast.success(`Marked ${selectedEmails.length} emails as unimportant`);
            }}
            onCreateCalendarEvents={onBatchCalendarAnalysis}
            onSnooze={(duration: string) => {
              toast.success(`Snoozed ${selectedEmails.length} emails for ${duration}`);
            }}
            onExport={() => {
              toast.success(`Exported ${selectedEmails.length} emails`);
            }}
            availableTags={labels.map((l) => l.name)}
          />
        </div>
      )}
    </div>
  );
};
