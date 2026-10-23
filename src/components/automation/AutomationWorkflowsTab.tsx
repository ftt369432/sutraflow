import React from 'react';
import { Search, Play, RefreshCw, Settings, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AutomationWorkflowsTabProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  filteredWorkflows: any[];
  getStatusColor: (status: string) => string;
  onRunWorkflow: (workflowId: string) => void;
  onSelectWorkflow: (workflowId: string) => void;
}

export const AutomationWorkflowsTab: React.FC<AutomationWorkflowsTabProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filteredWorkflows,
  getStatusColor,
  onRunWorkflow,
  onSelectWorkflow,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search workflows..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm">
            Status:
          </Label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md text-sm p-1 dark:bg-gray-700 dark:border-gray-600"
            title="Filter workflows by status"
            aria-label="Filter workflows by status"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="flex flex-col justify-between dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <Badge className={getStatusColor(workflow.status)}>{workflow.status}</Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                ID: {workflow.id}
              </CardDescription>
              <CardDescription>{workflow.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong className="text-muted-foreground">Trigger:</strong> {workflow.trigger}
              </p>
              <p>
                <strong className="text-muted-foreground">Steps:</strong> {workflow.steps.length}
              </p>
              <p>
                <strong className="text-muted-foreground">Created:</strong>{' '}
                {new Date(workflow.created).toLocaleDateString()}
              </p>
              {workflow.lastRun && (
                <p>
                  <strong className="text-muted-foreground">Last Run:</strong>{' '}
                  {new Date(workflow.lastRun).toLocaleString()}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
              <Button variant="outline" size="sm" onClick={() => onSelectWorkflow(workflow.id)}>
                <Settings className="h-4 w-4 mr-1" /> Manage
              </Button>
              <Button
                size="sm"
                onClick={() => onRunWorkflow(workflow.id)}
                disabled={workflow.status === 'running'}
              >
                {workflow.status === 'running' ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Run
              </Button>
            </CardFooter>
          </Card>
        ))}
        {filteredWorkflows.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            No workflows match your criteria.
          </p>
        )}
      </div>
    </div>
  );
};
