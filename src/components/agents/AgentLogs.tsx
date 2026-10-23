import { useState } from 'react';
import { Agent } from '../../types/agent';
import { useAuditStore } from '../../store/auditStore';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Check, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Filter, 
  Download, 
  Search 
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/Select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';

interface AgentLogsProps {
  agent: Agent;
}

export function AgentLogs({ agent }: AgentLogsProps) {
  const { auditLogs } = useAuditStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Get logs only for this agent
  const agentLogs = auditLogs.filter(log => log.sourceId === agent.id);
  
  // Apply filters
  const filteredLogs = agentLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        log.actionType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    const logDate = new Date(log.timestamp);
    let matchesDate = true;
    
    if (dateFilter === 'today') {
      const today = new Date();
      matchesDate = logDate.getDate() === today.getDate() &&
                   logDate.getMonth() === today.getMonth() &&
                   logDate.getFullYear() === today.getFullYear();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = logDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = logDate >= monthAgo;
    }
    
    const matchesType = typeFilter === 'all' || log.actionType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesType;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Get unique action types for filter
  const actionTypes = Array.from(new Set(agentLogs.map(log => log.actionType)));
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const handleExportLogs = () => {
    const exportData = filteredLogs.map(log => ({
      id: log.id,
      timestamp: format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      actionType: log.actionType,
      description: log.description,
      status: log.status,
      details: log.details
    }));
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`;
    
    const exportFileDefaultName = `${agent.name.replace(/\s+/g, '-')}_logs_${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Logs</CardTitle>
        <Button variant="outline" onClick={handleExportLogs}>
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="w-32">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Logs table */}
          {filteredLogs.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[150px]">Time</TableHead>
                    <TableHead className="w-[200px]">Action</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <span className="ml-2 capitalize">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="tooltip" data-tip={format(new Date(log.timestamp), 'PPpp')}>
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.actionType}</Badge>
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <Filter className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No matching logs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search term to find what you&apos;re looking for.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setTypeFilter('all');
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 