import React from 'react';
import { Search, GitBranch, Eye, Zap, Play, Workflow, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { N8NVisualFlowBuilder } from './N8NVisualFlowBuilder';

interface AutomationN8NTabProps {
  n8nSearchQuery: string;
  setN8nSearchQuery: (val: string) => void;
  showVisualBuilder: boolean;
  setShowVisualBuilder: (val: boolean) => void;
  filteredN8nWorkflows: any[];
  selectedN8nWorkflow: any;
  setSelectedN8nWorkflow: (workflow: any) => void;
  onDeployN8nTemplate: (templateId: string) => void;
  onRunN8nWorkflow: (workflowId: string) => void;
  onSaveVisualWorkflow: (workflow: any) => void;
  onDeployVisualWorkflow: (workflow: any) => void;
}

export const AutomationN8NTab: React.FC<AutomationN8NTabProps> = ({
  n8nSearchQuery,
  setN8nSearchQuery,
  showVisualBuilder,
  setShowVisualBuilder,
  filteredN8nWorkflows,
  selectedN8nWorkflow,
  setSelectedN8nWorkflow,
  onDeployN8nTemplate,
  onRunN8nWorkflow,
  onSaveVisualWorkflow,
  onDeployVisualWorkflow,
}) => {
  return (
    <div className="space-y-4">
      {/* Visual Builder Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search N8N templates..."
              className="pl-8"
              value={n8nSearchQuery}
              onChange={(e) => setN8nSearchQuery(e.target.value)}
            />
          </div>

          <Button
            variant={showVisualBuilder ? 'default' : 'outline'}
            onClick={() => setShowVisualBuilder(!showVisualBuilder)}
            className="flex items-center gap-2"
          >
            <GitBranch className="w-4 h-4" />
            {showVisualBuilder ? 'Hide Visual Builder' : 'Visual Builder'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {filteredN8nWorkflows.length} templates available
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredN8nWorkflows.map((workflow) => (
          <Card
            key={workflow.id}
            className="flex flex-col justify-between dark:bg-gray-800 hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">🔗</span>
                  {workflow.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {workflow.category}
                  </Badge>
                  <Badge
                    variant={
                      workflow.difficulty === 'beginner'
                        ? 'default'
                        : workflow.difficulty === 'intermediate'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="text-xs capitalize"
                  >
                    {workflow.difficulty}
                  </Badge>
                  {workflow.creator?.verified && (
                    <Badge variant="outline" className="text-xs text-blue-600">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="mt-2">{workflow.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div>
                <strong className="text-muted-foreground">Setup Time:</strong> ~
                {workflow.estimatedSetupTime} minutes
              </div>

              {workflow.rating && (
                <div className="flex items-center gap-2">
                  <strong className="text-muted-foreground">Rating:</strong>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{workflow.rating}</span>
                    <span className="text-xs text-gray-500">
                      ({workflow.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              )}

              {workflow.creator && (
                <div>
                  <strong className="text-muted-foreground">Creator:</strong>{' '}
                  {workflow.creator.name}
                </div>
              )}

              {workflow.template?.requiredInputs && workflow.template.requiredInputs.length > 0 && (
                <div>
                  <strong className="text-muted-foreground">Required Inputs:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {workflow.template.requiredInputs.slice(0, 3).map((input: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {input}
                      </Badge>
                    ))}
                    {workflow.template.requiredInputs.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{workflow.template.requiredInputs.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {workflow.tags && workflow.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {workflow.tags.slice(0, 4).map((tag: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between gap-2 pt-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedN8nWorkflow(workflow)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeployN8nTemplate(workflow.template?.id)}
                className="flex-1"
              >
                <Zap className="h-4 w-4 mr-1" />
                Deploy
              </Button>
              <Button
                size="sm"
                onClick={() => onRunN8nWorkflow(workflow.id)}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-1" />
                Test
              </Button>
            </CardFooter>
          </Card>
        ))}

        {filteredN8nWorkflows.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Workflow className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                No N8N templates found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {n8nSearchQuery
                  ? 'Try adjusting your search terms.'
                  : 'N8N integration is loading or no templates are available.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Visual Flow Builder */}
      {showVisualBuilder && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-metallic-600" />
              N8N Visual Workflow Builder
            </CardTitle>
            <CardDescription>
              Create sophisticated workflows with drag-and-drop visual interface. Connect
              triggers, actions, and conditions to build powerful automations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] border rounded-lg overflow-hidden bg-gray-50/50">
              <N8NVisualFlowBuilder
                onSave={onSaveVisualWorkflow}
                onDeploy={onDeployVisualWorkflow}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* N8N Template Preview Modal */}
      {selectedN8nWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{selectedN8nWorkflow.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedN8nWorkflow(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedN8nWorkflow.template?.description}
                  </p>
                </div>

                {selectedN8nWorkflow.template?.requiredInputs && (
                  <div>
                    <h4 className="font-semibold mb-2">Required Inputs</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedN8nWorkflow.template.requiredInputs.map(
                        (input: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {input}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedN8nWorkflow.useCases && (
                  <div>
                    <h4 className="font-semibold mb-2">Use Cases</h4>
                    <ul className="space-y-1 text-sm">
                      {selectedN8nWorkflow.useCases.map((useCase: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedN8nWorkflow(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    onDeployN8nTemplate(selectedN8nWorkflow.template?.id);
                    setSelectedN8nWorkflow(null);
                  }}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Deploy Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
