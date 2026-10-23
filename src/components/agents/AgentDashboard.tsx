import { useState } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { AgentCard } from './AgentCard';
import { CreateAgentModal } from './CreateAgentModal';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import type { AgentCapability } from '../../types/agent';

const allCapabilities: { id: AgentCapability; name: string }[] = [
  { id: 'email-processing', name: 'Email Processing' },
  { id: 'document-analysis', name: 'Document Analysis' },
  { id: 'scheduling', name: 'Scheduling' },
  { id: 'task-management', name: 'Task Management' },
  { id: 'natural-language', name: 'Natural Language' },
  { id: 'calendar-management', name: 'Calendar Management' },
  { id: 'drafting', name: 'Drafting' },
  { id: 'web-search', name: 'Web Search' },
  { id: 'data-analysis', name: 'Data Analysis' },
  { id: 'report-generation', name: 'Report Generation' },
  { id: 'code-generation', name: 'Code Generation' },
  { id: 'code-review', name: 'Code Review' },
  { id: 'debugging', name: 'Debugging' },
];

export function AgentDashboard() {
  const agents = useAgentStore((state) => state.agents);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Agents</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/60">No agents created yet.</p>
          <Button 
            variant="ghost"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4"
          >
            Create your first agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent}
            />
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateAgentModal
          onClose={() => setIsCreateModalOpen(false)}
          allCapabilities={allCapabilities}
        />
      )}
    </div>
  );
} 