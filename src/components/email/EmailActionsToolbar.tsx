import React from 'react';
import { 
  Reply, 
  Forward, 
  Archive, 
  Trash2, 
  Star, 
  Flag,
  Users,
  Calendar,
  CheckCircle,
  Download,
  Share,
  MoreVertical
} from 'lucide-react';
import { EmailMessage } from '../../services/email/types';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface EmailActionsToolbarProps {
  email: EmailMessage;
  onReply: (email: EmailMessage) => void;
  onReplyAll: (email: EmailMessage) => void;
  onForward: (email: EmailMessage) => void;
  onArchive: (email: EmailMessage) => void;
  onDelete: (email: EmailMessage) => void;
  onStar: (email: EmailMessage) => void;
  onFlag: (email: EmailMessage) => void;
  onAddToCalendar?: (email: EmailMessage) => void;
  onCreateTask?: (email: EmailMessage) => void;
  className?: string;
}

export function EmailActionsToolbar({
  email,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onStar,
  onFlag,
  onAddToCalendar,
  onCreateTask,
  className
}: EmailActionsToolbarProps) {
  return (
    <div className={cn("email-actions-bar", className)}>
      {/* Primary Actions */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Email Actions</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onReply?.(email)}
            size="sm"
            className="btn-blue-metallic flex items-center gap-2"
          >
            <Reply className="h-4 w-4" />
            Reply
          </Button>
          
          <Button
            onClick={() => onReplyAll?.(email)}
            size="sm"
            className="btn-gray-metallic flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Reply All
          </Button>
          
          <Button
            onClick={() => onForward?.(email)}
            size="sm"
            className="btn-gray-metallic flex items-center gap-2"
          >
            <Forward className="h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onArchive?.(email)}
            size="sm"
            className="btn-gray-metallic"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => onStar?.(email)}
            size="sm"
            className="btn-gray-metallic"
            title="Star"
          >
            <Star className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => onFlag?.(email)}
            size="sm"
            className="btn-gray-metallic"
            title="Flag"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onAddToCalendar && (
            <Button
              onClick={() => onAddToCalendar?.(email)}
              size="sm"
              className="btn-gray-metallic"
              title="Add to Calendar"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          )}
          
          {onCreateTask && (
            <Button
              onClick={() => onCreateTask?.(email)}
              size="sm"
              className="btn-gray-metallic"
              title="Create Task"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            className="btn-gray-metallic"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            className="btn-gray-metallic"
            title="Share"
          >
            <Share className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => onDelete?.(email)}
            size="sm"
            className="btn-gray-metallic text-red-400 hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 