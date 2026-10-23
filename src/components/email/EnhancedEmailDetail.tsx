import React, { useState } from 'react';
import { getPriorityClass, getStatusClass } from '../../styles/semanticColors';
import { 
  ArrowLeft, 
  Archive, 
  Trash2, 
  Reply, 
  Forward, 
  Users, 
  Info, 
  AlertTriangle, 
  ListChecks, 
  CalendarDays, 
  Tags, 
  MessageSquare, 
  FileText, 
  Briefcase,
  Star,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HardDrive,
  Chrome,
  Database,
  ExternalLink,
  Brain,
  Calendar as CalendarIcon,
  ReplyAll
} from 'lucide-react';
import { format } from 'date-fns';
import { EmailMessage } from '../../services/email/types';
import { FollowUpReminder } from './FollowUpReminder';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/DropdownMenu';
import { cn } from '../../lib/utils';

interface EnhancedEmailDetailProps {
  email: EmailMessage;
  onClose: () => void;
  onReply?: (email: EmailMessage) => void;
  onReplyAll?: (email: EmailMessage) => void;
  onForward?: (email: EmailMessage) => void;
  onArchive?: (email: EmailMessage) => void;
  onDelete?: (email: EmailMessage) => void;
  onSetFollowUp: (date: Date) => void;
  onAnalyzeAndCalendar: (email: EmailMessage) => void;
  onPreviousEmail?: () => void;
  onNextEmail?: () => void;
  onAddToKnowledgeBase?: (email: EmailMessage) => void;
  onAddToAIDrive?: (email: EmailMessage) => void;
  onOpenInGmail?: (email: EmailMessage) => void;
  onSmartCalendarAnalysis?: (email: EmailMessage) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function EnhancedEmailDetail({ 
  email, 
  onClose, 
  onReply, 
  onReplyAll, 
  onForward, 
  onArchive, 
  onDelete, 
  onSetFollowUp, 
  onAnalyzeAndCalendar,
  onPreviousEmail,
  onNextEmail,
  onAddToKnowledgeBase,
  onAddToAIDrive,
  onOpenInGmail,
  onSmartCalendarAnalysis,
  hasPrevious = false,
  hasNext = false
}: EnhancedEmailDetailProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-dark-metallic-900 to-blue-dark-metallic-800 text-white">
      {/* Enhanced Toolbar */}
      <div className="border-b border-blue-dark-metallic-700 p-4 flex items-center justify-between bg-blue-dark-metallic-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            onClick={onClose}
            variant="ghost"
            className="btn-blue-metallic flex items-center gap-2 hover:bg-blue-metallic-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Emails</span>
          </Button>
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 ml-2">
            <Button
              onClick={onPreviousEmail}
              disabled={!hasPrevious}
              title="Previous Email"
              size="sm"
              className="btn-gray-metallic disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={onNextEmail}
              disabled={!hasNext}
              title="Next Email"
              size="sm"
              className="btn-gray-metallic disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <Button
            onClick={() => onSmartCalendarAnalysis?.(email)}
            className="btn-purple-metallic gap-2"
            size="sm"
            title="Analyze for Calendar Events"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Smart Calendar</span>
          </Button>
          
          <Button
            onClick={() => onAnalyzeAndCalendar(email)}
            className="btn-green-metallic gap-2"
            size="sm"
            title="Full Legal Analysis & Calendar"
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI Analysis</span>
          </Button>

          {/* Knowledge Base & AI Drive Actions */}
          <Button
            onClick={() => onAddToKnowledgeBase?.(email)}
            className="btn-blue-metallic gap-2"
            size="sm"
            title="Add to Knowledge Base"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden lg:inline">KB</span>
          </Button>
          
          <Button
            onClick={() => onAddToAIDrive?.(email)}
            className="btn-cyan-metallic gap-2"
            size="sm"
            title="Add to AI Drive"
          >
            <Database className="h-4 w-4" />
            <span className="hidden lg:inline">AI Drive</span>
          </Button>
          
          <Button
            onClick={() => onOpenInGmail?.(email)}
            className="btn-red-metallic gap-2"
            size="sm"
            title="Open in Gmail"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden lg:inline">Gmail</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="btn-gray-metallic">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dropdown-metallic">
              <DropdownMenuItem onClick={() => onReply?.(email)}>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReplyAll?.(email)}>
                <ReplyAll className="h-4 w-4 mr-2" />
                Reply All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onForward?.(email)}>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchive?.(email)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(email)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="card-metallic">
          <CardHeader className="border-b border-blue-dark-metallic-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-white">
                {email.subject || '(No Subject)'}
              </CardTitle>
              <Badge className="badge-metallic">
                {email.read ? 'Read' : 'Unread'}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="font-medium text-gray-300">
                  From: <span className="text-white">{email.from}</span>
                </p>
                {email.to && (
                  <p className="text-sm text-gray-400 mt-1">
                    To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {new Date(email.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(email.date).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            {/* Tags Display */}
            {email.tags && email.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {email.tags.map((tag, index) => (
                  <Badge key={index} className={cn(
                    "badge-metallic text-xs",
                    typeof tag === 'object' && tag.autoGenerated && "badge-info",
                    typeof tag === 'object' && tag.category === 'legal' && "badge-accent",
                    typeof tag === 'object' && tag.category === 'priority' && "badge-warning"
                  )}>
                    {typeof tag === 'string' ? tag : tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* AI Analysis Results */}
            {email.analysis && (
              <Card className="card-metallic mb-6 bg-blue-dark-metallic-800/30">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-300 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Legal Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Priority Badge */}
                  {email.analysis.priority && (
                    <div className="mb-4">
                      <Badge className={cn(
                        "text-sm",
                        getPriorityClass(email.analysis.priority)
                      )}>
                        Priority: {email.analysis.priority.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Summary */}
                  {email.analysis.summary && (
                    <div className="mb-4">
                      <h4 className="font-medium text-white mb-2">Summary</h4>
                      <p className="text-gray-300">{email.analysis.summary}</p>
                    </div>
                  )}
                  
                  {/* Action Items */}
                  {email.analysis.actionItems && email.analysis.actionItems.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-white mb-2">Action Items</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {email.analysis.actionItems.map((item, index) => (
                          <li key={index} className="text-gray-300">
                            {typeof item === 'string' ? item : item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Calendar Event Status */}
                  {email.analysis.calendarEventStatus && (
                    <div className="mb-4">
                      <h4 className="font-medium text-white mb-2">Calendar Status</h4>
                      <Badge className={cn(
                        "text-sm",
                        getStatusClass(email.analysis.calendarEventStatus)
                      )}>
                        {email.analysis.calendarEventStatus}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Email Body */}
            <div 
              className="prose prose-invert max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ 
                __html: email.body || email.snippet || 'No content available' 
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}