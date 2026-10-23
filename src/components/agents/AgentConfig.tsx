import { useState } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Input } from '../ui/Input';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Settings, Save, Sliders, Code, Cpu } from 'lucide-react';
import { AgentType, AgentCapability, AutonomyLevel, Agent } from '../../types/agent';

interface AgentConfigProps {
  agent: Agent;
}

export function AgentConfig({ agent }: AgentConfigProps) {
  const { updateAgent } = useAgentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState({
    ...agent.config,
    description: agent.description,
    capabilities: [...agent.capabilities]
  });

  const availableCapabilities: AgentCapability[] = [
    'email-processing',
    'document-analysis',
    'scheduling',
    'task-management',
    'natural-language',
    'calendar-management',
    'drafting',
    'web-search',
    'data-analysis',
    'report-generation',
    'code-generation',
    'code-review',
    'debugging'
  ];

  const autonomyLevels: AutonomyLevel[] = [
    'supervised',
    'semi-autonomous',
    'autonomous'
  ];

  const agentTypes: AgentType[] = [
    'assistant',
    'research',
    'development',
    'analysis',
    'email',
    'document',
    'calendar',
    'task',
    'custom'
  ];

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCapabilityToggle = (capability: AgentCapability) => {
    if (config.capabilities.includes(capability)) {
      setConfig(prev => ({
        ...prev,
        capabilities: prev.capabilities.filter(cap => cap !== capability)
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, capability]
      }));
    }
  };

  const handleSubmit = () => {
    updateAgent(agent.id, {
      description: config.description,
      capabilities: config.capabilities,
      config: {
        ...agent.config,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        systemPrompt: config.systemPrompt,
        autonomyLevel: config.autonomyLevel,
        type: config.type,
        name: config.name
      }
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Agent Configuration</h2>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Exit Edit Mode
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Edit Configuration
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="model">
            <Cpu className="h-4 w-4 mr-2" />
            Model
          </TabsTrigger>
          <TabsTrigger value="capabilities">
            <Sliders className="h-4 w-4 mr-2" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <Code className="h-4 w-4 mr-2" />
            Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure the general settings for your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Name</Label>
                <Input
                  id="agent-name"
                  value={config.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agent-description">Description</Label>
                <Textarea
                  id="agent-description"
                  value={config.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agent-type">Type</Label>
                <Select
                  value={config.type}
                  onValueChange={(value) => handleInputChange('type', value as AgentType)}
                >
                  <SelectTrigger disabled={!isEditing}>
                    <SelectValue placeholder="Select agent type" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agent-autonomy">Autonomy Level</Label>
                <Select
                  value={config.autonomyLevel}
                  onValueChange={(value) => handleInputChange('autonomyLevel', value as AutonomyLevel)}
                >
                  <SelectTrigger disabled={!isEditing}>
                    <SelectValue placeholder="Select autonomy level" />
                  </SelectTrigger>
                  <SelectContent>
                    {autonomyLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>Configure the AI model settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-model">Model</Label>
                <Select
                  value={config.model}
                  onValueChange={(value) => handleInputChange('model', value)}
                >
                  <SelectTrigger disabled={!isEditing}>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-v1">Claude v1</SelectItem>
                    <SelectItem value="claude-instant">Claude Instant</SelectItem>
                    <SelectItem value="llama-3-70b">Llama 3 70B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="agent-temperature">Temperature: {config.temperature}</Label>
                </div>
                <Slider
                  id="agent-temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.temperature]}
                  onValueChange={(value) => handleInputChange('temperature', value[0])}
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">
                  Lower values produce more deterministic outputs, higher values more creative.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="agent-max-tokens">Max Tokens: {config.maxTokens}</Label>
                </div>
                <Slider
                  id="agent-max-tokens"
                  min={100}
                  max={8000}
                  step={100}
                  value={[config.maxTokens]}
                  onValueChange={(value) => handleInputChange('maxTokens', value[0])}
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of tokens the agent can generate per response.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Capabilities</CardTitle>
              <CardDescription>Configure what your agent can do</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enable or disable capabilities for this agent. Capabilities determine what actions the agent can perform.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableCapabilities.map((capability) => (
                    <div key={capability} className="flex items-center justify-between space-x-2 p-2 border rounded-md">
                      <span className="font-medium">{capability.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                      <Switch
                        checked={config.capabilities.includes(capability)}
                        onCheckedChange={() => handleCapabilityToggle(capability)}
                        disabled={!isEditing}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>Define how your agent behaves</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={config.systemPrompt}
                  onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                  disabled={!isEditing}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  The system prompt provides context and instructions for the AI model that powers this agent.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isEditing && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
} 