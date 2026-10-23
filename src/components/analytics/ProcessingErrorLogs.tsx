import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AlertTriangle, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { Input } from '../ui/Input';

interface ErrorLog {
  id: string;
  errorType: string;
  message: string;
  documentName: string;
  documentId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  status: 'new' | 'in-progress' | 'resolved';
}

interface ErrorLogsProps {
  logs?: ErrorLog[];
  className?: string;
}

export function ProcessingErrorLogs({ logs, className = "" }: ErrorLogsProps) {
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data if no logs are provided
  const errorLogs: ErrorLog[] = logs || [
    {
      id: 'err-001',
      errorType: 'Invalid file format',
      message: 'File format not supported',
      documentName: 'document_invalid.xyz',
      documentId: 'doc-123',
      timestamp: '2025-07-06T14:22:00',
      severity: 'medium',
      status: 'new'
    },
    {
      id: 'err-002',
      errorType: 'Embedding failure',
      message: 'Text extraction failed, possible encryption',
      documentName: 'report_2025.pdf',
      documentId: 'doc-456',
      timestamp: '2025-07-06T12:15:00',
      severity: 'high',
      status: 'in-progress'
    },
    {
      id: 'err-003',
      errorType: 'Processing timeout',
      message: 'Document exceeds size limit (25MB)',
      documentName: 'large_document.pdf',
      documentId: 'doc-789',
      timestamp: '2025-07-05T10:30:00',
      severity: 'medium',
      status: 'new'
    },
    {
      id: 'err-004',
      errorType: 'OCR limitation',
      message: 'Low quality image affects text extraction',
      documentName: 'scan_document.jpg',
      documentId: 'doc-101',
      timestamp: '2025-07-04T16:45:00',
      severity: 'low',
      status: 'resolved'
    },
    {
      id: 'err-005',
      errorType: 'Token limit exceeded',
      message: 'Document is too large for embedding (>100K tokens)',
      documentName: 'technical_manual.pdf',
      documentId: 'doc-112',
      timestamp: '2025-07-03T09:20:00',
      severity: 'high',
      status: 'in-progress'
    }
  ];
  
  // Filter logs by search term and status
  const filteredLogs = errorLogs.filter(log => {
    const matchesSearch = filter === '' || 
      log.documentName.toLowerCase().includes(filter.toLowerCase()) ||
      log.errorType.toLowerCase().includes(filter.toLowerCase()) ||
      log.message.toLowerCase().includes(filter.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric' 
    });
  };
  
  const renderSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-amber-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-slate-500">Low</Badge>;
      default:
        return null;
    }
  };
  
  const renderStatusIcon = (status: string) => {
    switch(status) {
      case 'new':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-700">Processing Error Logs</h4>
          <p className="text-sm text-slate-500">Track and resolve document processing issues</p>
        </div>
        <Badge variant="destructive" className="rounded-full px-3">{errorLogs.length} errors</Badge>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search errors..."
            className="pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'new' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setStatusFilter('new')}
          >
            New
          </Button>
          <Button 
            variant={statusFilter === 'in-progress' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setStatusFilter('in-progress')}
          >
            In Progress
          </Button>
          <Button 
            variant={statusFilter === 'resolved' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </Button>
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto border border-slate-100 rounded-md">
        {filteredLogs.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-xs font-medium text-slate-500 border-b">
                <th className="px-4 py-3 text-left">Error</th>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-slate-700">{log.errorType}</div>
                      <div className="text-xs text-slate-500">{log.message}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{log.documentName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-500">{formatDate(log.timestamp)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {renderSeverityBadge(log.severity)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {renderStatusIcon(log.status)}
                      <span className="ml-2 text-sm capitalize">{log.status.replace('-', ' ')}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <XCircle className="h-10 w-10 text-slate-300 mb-2" />
            <h5 className="text-slate-500 font-medium">No errors matching your filters</h5>
            <p className="text-slate-400 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-between">
        <Button variant="outline" size="sm">
          Export Logs
        </Button>
        <Button size="sm">
          Clear Resolved Errors
        </Button>
      </div>
    </Card>
  );
}
