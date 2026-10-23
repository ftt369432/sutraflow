import React, { useState } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Label } from '../ui/Label';
import type { AgentType, AgentCapability } from '../../types/agent';

// Define options for AgentType select
const agentTypeOptions: { value: AgentType; label: string }[] = [
  { value: 'assistant', label: 'Assistant' },
  { value: 'research', label: 'Research' },
  { value: 'development', label: 'Development' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'email', label: 'Email' },
  { value: 'document', label: 'Document' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'task', label: 'Task' },
  { value: 'custom', label: 'Custom' },
];

// Assuming allCapabilities is defined elsewhere or passed as a prop
// For this fix, let's assume a structure for allCapabilities if not available in scope
// const allCapabilities: { id: AgentCapability; name: string }[] = [
//   { id: 'email-processing', name: 'Email Processing' },
//   { id: 'document-analysis', name: 'Document Analysis' },
//   // ... other capabilities
// ];


interface CreateAgentModalProps {
  onClose: () => void;
  allCapabilities: { id: AgentCapability; name: string }[]; // Added prop
}

export function CreateAgentModal({ onClose, allCapabilities }: CreateAgentModalProps) {
  const { createAgent } = useAgentStore();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: AgentType;
    capabilities: AgentCapability[]; // Store as AgentCapability[]
    config?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    };
    autonomyLevel: 'supervised' | 'semi-autonomous' | 'autonomous';
  }>({
    name: '',
    description: '',
    type: 'assistant',
    capabilities: [],
    autonomyLevel: 'supervised',
    config: {
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 2000,
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (formData.capabilities.length === 0) newErrors.capabilities = 'At least one capability is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await createAgent(
        formData.name,
        formData.type,
        formData.capabilities // Pass as AgentCapability[]
      );
      onClose();
    } catch (error) {
      console.error('Failed to create agent:', error);
      setErrors({ form: 'Failed to create agent. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Configure the details for your new AI agent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="agentName">Name</Label>
            <Input
              id="agentName"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g., Research Assistant"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentDescription">Description</Label>
            <Input
              id="agentDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Helps with research and data analysis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentType">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: string) => {
                setFormData({ ...formData, type: value as AgentType });
                if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                {agentTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-red-500 text-xs">{errors.type}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentCapabilities">Capabilities</Label>
            <Select
              onValueChange={(value: string) => {
                const capability = value as AgentCapability;
                const newCapabilities = formData.capabilities.includes(capability)
                  ? formData.capabilities.filter(c => c !== capability)
                  : [...formData.capabilities, capability];
                setFormData({ ...formData, capabilities: newCapabilities });
                if (errors.capabilities) setErrors(prev => ({ ...prev, capabilities: '' }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add/Remove capabilities" />
              </SelectTrigger>
              <SelectContent>
                {allCapabilities.map(cap => (
                  <SelectItem key={cap.id} value={cap.id}>{cap.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-1">
              {formData.capabilities.map(cap => {
                const capName = allCapabilities.find(c => c.id === cap)?.name || cap;
                return (
                  <span key={cap} className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs flex items-center">
                    {capName}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, capabilities: prev.capabilities.filter(c => c !== cap) }));
                      }}
                      className="ml-1.5 text-destructive hover:text-destructive/80"
                      aria-label={`Remove ${capName}`}
                    >
                      {"×"}
                    </button>
                  </span>
                );
              })}
            </div>
            {errors.capabilities && <p className="text-red-500 text-xs">{errors.capabilities}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="autonomyLevel">Autonomy Level</Label>
            <Select
              value={formData.autonomyLevel}
              onValueChange={(value: string) => {
                setFormData({ ...formData, autonomyLevel: value as 'supervised' | 'semi-autonomous' | 'autonomous' });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select autonomy level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supervised">Supervised</SelectItem>
                <SelectItem value="semi-autonomous">Semi-Autonomous</SelectItem>
                <SelectItem value="autonomous">Autonomous</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {errors.form && <p className="text-red-500 text-sm">{errors.form}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit"
              variant="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 