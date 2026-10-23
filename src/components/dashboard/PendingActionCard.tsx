import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { AuditLog } from '../../store/auditStore';
import { formatDistanceToNow } from 'date-fns';

interface PendingActionCardProps {
  action: AuditLog;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (action: AuditLog) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function PendingActionCard({ 
  action, 
  onApprove, 
  onReject, 
  onView, 
  isSelected = false,
  onToggleSelect
}: PendingActionCardProps) {
  return (
    <Card className={`mb-3 border-l-4 ${isSelected ? 'border-l-blue-500' : 'border-l-yellow-500'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => onToggleSelect(action.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
            <Badge className="bg-yellow-100 text-yellow-800">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
            <Badge className="bg-gray-100 text-gray-800">
              {action.sourceType}
            </Badge>
          </div>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(action.timestamp))} ago
          </span>
        </div>
        
        <h3 className="font-medium mb-1">{action.description}</h3>
        <p className="text-sm text-gray-600 mb-3">
          Action: {action.actionType}
        </p>
        
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => onApprove(action.id)}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(action.id)}>
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onView(action)}>
            <Eye className="h-4 w-4 mr-1" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 