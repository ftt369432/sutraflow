import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Filter, 
  Search,
  List,
  Calendar
} from 'lucide-react';
import { useAuditStore, AuditLog } from '../../store/auditStore';
import { PendingActionCard } from './PendingActionCard';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';

export function AutomationAuditDashboard() {
  const { 
    auditLogs, 
    pendingActions, 
    approveAction, 
    rejectAction, 
    bulkApprove, 
    bulkReject 
  } = useAuditStore();
  
  const [filter, setFilter] = useState<'all' | 'email' | 'task' | 'calendar' | 'document'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewingAction, setViewingAction] = useState<AuditLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Reset selections when filters change
  useEffect(() => {
    setSelectedLogs([]);
  }, [filter, searchQuery, dateFilter]);
  
  // Filter logs based on criteria
  const getFilteredLogs = (logs: AuditLog[]) => {
    return logs.filter(log => {
      const matchesType = filter === 'all' || log.sourceType.toLowerCase() === filter;
      const matchesSearch = searchQuery === '' || 
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actionType.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filtering
      let matchesDate = true;
      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesDate = new Date(log.timestamp) >= today;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = new Date(log.timestamp) >= weekAgo;
      }
      
      return matchesType && matchesSearch && matchesDate;
    });
  };
  
  const filteredPendingActions = getFilteredLogs(pendingActions);
  const filteredAuditLogs = getFilteredLogs(auditLogs);
  
  const handleToggleSelect = (id: string) => {
    setSelectedLogs(prev => 
      prev.includes(id) 
        ? prev.filter(logId => logId !== id)
        : [...prev, id]
    );
  };
  
  const handleBulkApprove = () => {
    bulkApprove(selectedLogs);
    setSelectedLogs([]);
  };
  
  const handleBulkReject = () => {
    bulkReject(selectedLogs);
    setSelectedLogs([]);
  };
  
  const handleViewAction = (action: AuditLog) => {
    setViewingAction(action);
    setIsDialogOpen(true);
  };
  
  const getStatusColor = (status: AuditLog['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      case 'auto_approved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: AuditLog['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3 mr-1" />;
      case 'approved': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'rejected': return <XCircle className="h-3 w-3 mr-1" />;
      case 'completed': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'failed': return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'auto_approved': return <CheckCircle className="h-3 w-3 mr-1" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              Automation Audit
              {pendingActions.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                  {pendingActions.length} Pending Approvals
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review, approve, and monitor automated actions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-1" />
              Pending Approval
            </TabsTrigger>
            <TabsTrigger value="recent">
              <List className="h-4 w-4 mr-1" />
              Recent Actions
            </TabsTrigger>
            <TabsTrigger value="all">
              <Calendar className="h-4 w-4 mr-1" />
              Complete Audit Log
            </TabsTrigger>
          </TabsList>
          
          <div className="mb-6 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search actions..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <TabsContent value="pending">
            {filteredPendingActions.length > 0 ? (
              <>
                {selectedLogs.length > 0 && (
                  <div className="flex space-x-2 mb-4">
                    <Button 
                      onClick={handleBulkApprove}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve Selected ({selectedLogs.length})
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleBulkReject}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Selected
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  {filteredPendingActions.map(action => (
                    <PendingActionCard
                      key={action.id}
                      action={action}
                      onApprove={approveAction}
                      onReject={rejectAction}
                      onView={handleViewAction}
                      isSelected={selectedLogs.includes(action.id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center p-8 text-gray-500 flex flex-col items-center">
                <CheckCircle className="h-12 w-12 mb-2 text-gray-300" />
                <p className="text-lg font-medium">All caught up!</p>
                <p>No pending actions require your approval</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent">
            <div className="space-y-2">
              {filteredAuditLogs.slice(0, 10).map(log => (
                <Card key={log.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(log.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {log.sourceType}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    
                    <h3 className="font-medium mb-1">{log.description}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Action: {log.actionType}
                    </p>
                    
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => handleViewAction(log)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="all">
            <div className="space-y-2">
              {filteredAuditLogs.map(log => (
                <Card key={log.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(log.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {log.sourceType}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    
                    <h3 className="font-medium mb-1">{log.description}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Action: {log.actionType}
                    </p>
                    
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => handleViewAction(log)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Action Details</DialogTitle>
            <DialogDescription>
              Detailed information about the automated action
            </DialogDescription>
          </DialogHeader>
          
          {viewingAction && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-mono text-xs">{viewingAction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Timestamp</p>
                  <p>{format(new Date(viewingAction.timestamp), 'MMM d, yyyy h:mm:ss a')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Source Type</p>
                  <p>{viewingAction.sourceType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Action Type</p>
                  <p>{viewingAction.actionType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={getStatusColor(viewingAction.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(viewingAction.status)}
                      {viewingAction.status}
                    </span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Source ID</p>
                  <p className="font-mono text-xs">{viewingAction.sourceId}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">Description</p>
                <p className="mt-1">{viewingAction.description}</p>
              </div>
              
              {viewingAction.details && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Details</p>
                  <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto max-h-56">
                    {JSON.stringify(viewingAction.details, null, 2)}
                  </pre>
                </div>
              )}
              
              {viewingAction.status === 'pending' && (
                <div className="mt-4 flex space-x-2">
                  <Button onClick={() => {
                    approveAction(viewingAction.id);
                    setIsDialogOpen(false);
                  }}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button variant="outline" onClick={() => {
                    rejectAction(viewingAction.id);
                    setIsDialogOpen(false);
                  }}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 