import React from 'react';
import { useAuditStore } from '../../store/auditStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function PendingApprovalsWidget() {
  const pendingActions = useAuditStore(state => state.pendingActions);
  const navigate = useNavigate();
  
  // Group by type for summary
  const actionsByType = pendingActions.reduce((acc, action) => {
    acc[action.sourceType] = (acc[action.sourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Clock className="mr-2 h-5 w-5" />
          Pending Approvals 
          {pendingActions.length > 0 && (
            <Badge className="ml-2 px-2 py-0.5 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              {pendingActions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingActions.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(actionsByType).map(([type, count]) => (
                <div key={type} className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-sm text-gray-500">{type}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {pendingActions.slice(0, 3).map(action => (
                <div key={action.id} className="p-2 border rounded text-sm">
                  {action.description}
                </div>
              ))}
              {pendingActions.length > 3 && (
                <div className="text-sm text-center text-gray-500">
                  +{pendingActions.length - 3} more pending
                </div>
              )}
            </div>
            <Button
              className="w-full mt-3"
              onClick={() => navigate('/dashboard/audit')}
            >
              Review All
            </Button>
          </>
        ) : (
          <div className="text-center p-4 text-gray-500 flex flex-col items-center">
            <AlertCircle className="h-10 w-10 mb-2 text-gray-300" />
            <p>No pending approvals</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 