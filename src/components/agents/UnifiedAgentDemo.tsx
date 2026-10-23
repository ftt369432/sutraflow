import { useState } from 'react';
import { useUnifiedAgents } from '../../hooks/useUnifiedAgents';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';

export function UnifiedAgentDemo() {
  const {
    agents,
    loading,
    error,
    createEmailAgent,
    createCalendarAgent,
    createTaskAgent,
    createDocumentAgent,
    removeAgent
  } = useUnifiedAgents();

  const [name, setName] = useState('');
  const [agentType, setAgentType] = useState('email');
  const [capabilities, setCapabilities] = useState<string[]>([]);

  const handleCreateAgent = () => {
    if (!name) return;

    switch (agentType) {
      case 'email':
        createEmailAgent(name, capabilities);
        break;
      case 'calendar':
        createCalendarAgent(name, capabilities);
        break;
      case 'task':
        createTaskAgent(name, capabilities);
        break;
      case 'document':
        createDocumentAgent(name, capabilities);
        break;
    }

    // Reset form
    setName('');
    setCapabilities([]);
  };

  const handleToggleCapability = (capability: string) => {
    if (capabilities.includes(capability)) {
      setCapabilities(capabilities.filter(c => c !== capability));
    } else {
      setCapabilities([...capabilities, capability]);
    }
  };

  const handleRemoveAgent = (id: string) => {
    removeAgent(id);
  };

  if (loading) {
    return <div>Loading agents...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Unified Agent System</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block mb-2">Agent Name</label>
            <Input
              placeholder="Enter agent name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block mb-2">Agent Type</label>
            <Select
              value={agentType}
              onValueChange={setAgentType}
            >
              <option value="email">Email Agent</option>
              <option value="calendar">Calendar Agent</option>
              <option value="task">Task Agent</option>
              <option value="document">Document Agent</option>
            </Select>
          </div>
          
          <div>
            <label className="block mb-2">Capabilities</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-processing"
                  checked={capabilities.includes('email-processing')}
                  onCheckedChange={() => handleToggleCapability('email-processing')}
                />
                <label htmlFor="email-processing">Email Processing</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="calendar-management"
                  checked={capabilities.includes('calendar-management')}
                  onCheckedChange={() => handleToggleCapability('calendar-management')}
                />
                <label htmlFor="calendar-management">Calendar Management</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="task-management"
                  checked={capabilities.includes('task-management')}
                  onCheckedChange={() => handleToggleCapability('task-management')}
                />
                <label htmlFor="task-management">Task Management</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="document-analysis"
                  checked={capabilities.includes('document-analysis')}
                  onCheckedChange={() => handleToggleCapability('document-analysis')}
                />
                <label htmlFor="document-analysis">Document Analysis</label>
              </div>
            </div>
          </div>
          
          <Button onClick={handleCreateAgent}>Create Agent</Button>
        </CardContent>
      </Card>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">Your Agents ({agents.length})</h3>
        
        {agents.length === 0 ? (
          <p>No agents created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const config = agent.getConfig();
              return (
                <Card key={config.id}>
                  <CardHeader>
                    <CardTitle>{config.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-1">
                      <div>
                        <dt className="text-sm font-medium">Type</dt>
                        <dd>{config.type}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium">Model</dt>
                        <dd>{config.model}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium">Capabilities</dt>
                        <dd>
                          <ul className="list-disc pl-5 text-sm">
                            {config.capabilities.map((capability: string) => (
                              <li key={capability}>{capability}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    </dl>
                    
                    <div className="mt-4">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveAgent(config.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 