import React from 'react';
import { 
  Mail, 
  Reply, 
  Forward, 
  Archive, 
  Trash2, 
  Star, 
  MoreVertical,
  Users,
  Clock,
  Tag,
  Search,
  Filter,
  Settings,
  Bell,
  Calendar,
  CheckCircle,
  Plus,
  Download,
  Share,
  Flag,
  Paperclip
} from 'lucide-react';
import { EmailMessage } from '../../services/email/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface RestoreEmailFunctionalityProps {
  email: EmailMessage;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onStar: () => void;
  onFlag: () => void;
  className?: string;
}

export function RestoreEmailFunctionality({
  email,
  onReply,
  onReplyAll, 
  onForward,
  onArchive,
  onDelete,
  onStar,
  onFlag,
  className
}: RestoreEmailFunctionalityProps) {
  return (
    <div className={cn("bg-gradient-to-br from-blue-900 to-gray-900 text-white p-4 rounded-lg", className)}>
      {/* Email Actions Bar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Email Actions</h3>
          <Badge className="bg-blue-600 text-white">
            {email.read ? 'Read' : 'Unread'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Primary Actions */}
          <Button
            onClick={onReply}
            size="sm"
            className="btn-blue-metallic flex items-center gap-2"
          >
            <Reply className="h-4 w-4" />
            Reply
          </Button>
          
          <Button
            onClick={onReplyAll}
            size="sm"
            className="btn-gray-metallic flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Reply All
          </Button>
          
          <Button
            onClick={onForward}
            size="sm"
            className="btn-gray-metallic flex items-center gap-2"
          >
            <Forward className="h-4 w-4" />
            Forward
          </Button>
          
          {/* Secondary Actions */}
          <div className="w-px h-6 bg-gray-600 mx-2"></div>
          
          <Button
            onClick={onArchive}
            size="sm"
            className="btn-gray-metallic"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={onStar}
            size="sm"
            className="btn-gray-metallic"
            title="Star"
          >
            <Star className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={onFlag}
            size="sm"
            className="btn-gray-metallic"
            title="Flag"
          >
            <Flag className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={onDelete}
            size="sm"
            className="btn-gray-metallic text-red-400 hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-800/30 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">From</span>
          </div>
          <p className="text-sm text-gray-300">{email.from}</p>
        </div>
        
        <div className="bg-gray-800/30 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium">To</span>
          </div>
          <p className="text-sm text-gray-300">
            {Array.isArray(email.to) ? email.to.join(', ') : email.to}
          </p>
        </div>
        
        <div className="bg-gray-800/30 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium">Date</span>
          </div>
          <p className="text-sm text-gray-300">
            {email.date ? new Date(email.date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="bg-gray-800/30 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium">Attachments ({email.attachments.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((attachment, index) => (
              <Badge key={index} className="bg-yellow-600 text-white">
                {attachment.filename || `Attachment ${index + 1}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Quick Actions:</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="btn-gray-metallic"
            title="Add to Calendar"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            className="btn-gray-metallic"
            title="Create Task"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          
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
        </div>
      </div>
    </div>
  );
}

/* Email List Enhancement Component */
export function EnhancedEmailListItem({ 
  email, 
  isSelected, 
  onSelect,
  onOpen,
  className,
  selectedEmails = []
}: {
  email: EmailMessage;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onOpen: () => void;
  className?: string;
  selectedEmails?: string[];
}) {
  const handleDragStart = (e: React.DragEvent) => {
    // If this email is selected, drag all selected emails
    const emailsToMove = isSelected && selectedEmails.length > 0 
      ? selectedEmails 
      : [email.id];
    
    e.dataTransfer.setData('application/json', JSON.stringify(emailsToMove));
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual indication
    e.currentTarget.classList.add('email-dragging');
    
    // Create drag image showing count if multiple emails
    if (emailsToMove.length > 1) {
      const dragIndicator = document.createElement('div');
      dragIndicator.className = 'bulk-drag-indicator';
      dragIndicator.textContent = `Moving ${emailsToMove.length} emails`;
      document.body.appendChild(dragIndicator);
      
      // Position it at cursor
      const rect = e.currentTarget.getBoundingClientRect();
      dragIndicator.style.left = `${rect.left + rect.width / 2}px`;
      dragIndicator.style.top = `${rect.top + rect.height / 2}px`;
      
      e.dataTransfer.setDragImage(dragIndicator, 0, 0);
      
      // Clean up after drag
      setTimeout(() => {
        document.body.removeChild(dragIndicator);
      }, 100);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('email-dragging');
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "email-item email-draggable p-4 border-b border-gray-700 cursor-pointer transition-all duration-200",
        "hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-transparent",
        !email.read && "unread bg-blue-900/10 border-l-4 border-blue-500",
        isSelected && "selected bg-blue-800/20 border-l-4 border-blue-400",
        className
      )}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          className="mt-1 h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "font-medium truncate",
              !email.read ? "text-white" : "text-gray-300"
            )}>
              {email.from}
            </span>
            <span className="text-xs text-gray-500">
              {email.date ? new Date(email.date).toLocaleDateString() : ''}
            </span>
          </div>
          
          <h4 className={cn(
            "font-medium mb-1 truncate",
            !email.read ? "text-white" : "text-gray-300"
          )}>
            {email.subject || "(No Subject)"}
          </h4>
          
          <p className="text-sm text-gray-400 truncate">
            {email.snippet || email.body?.substring(0, 100) || 'No preview available'}
          </p>
          
          {/* Email badges */}
          <div className="flex items-center gap-2 mt-2">
            {email.attachments && email.attachments.length > 0 && (
              <Badge className="bg-yellow-600 text-white text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                {email.attachments.length}
              </Badge>
            )}
            
            {email.analysis?.priority && (
              <Badge className={cn(
                "text-xs",
                email.analysis.priority === 'high' && "bg-red-600",
                email.analysis.priority === 'medium' && "bg-yellow-600",
                email.analysis.priority === 'low' && "bg-green-600"
              )}>
                {email.analysis.priority}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 