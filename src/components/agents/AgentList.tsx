import { Agent } from '../../types/agent';
import { AgentCard } from './AgentCard';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface AgentListProps {
  agents: Agent[];
  selectedAgentId?: string;
  onSelectAgent: (id: string) => void;
  onCreateAgent?: () => void;
}

export function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  onCreateAgent
}: AgentListProps) {
  const activeAgents = agents.filter(agent => agent.status === 'active');
  const otherAgents = agents.filter(agent => agent.status !== 'active');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3">
        <h2 className="text-sm font-semibold text-white uppercase">AI Agents</h2>
        {onCreateAgent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={onCreateAgent}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Agents */}
      {activeAgents.length > 0 && (
        <div className="space-y-1">
          <div className="px-3 py-1 text-xs font-medium text-gray-400">
            Active
          </div>
          {activeAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={agent.id === selectedAgentId}
              onClick={() => onSelectAgent(agent.id)}
            />
          ))}
        </div>
      )}

      {/* Other Agents */}
      {otherAgents.length > 0 && (
        <div className="space-y-1">
          <div className="px-3 py-1 text-xs font-medium text-gray-400">
            Available
          </div>
          {otherAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={agent.id === selectedAgentId}
              onClick={() => onSelectAgent(agent.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {agents.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-400 text-center">
          No agents available
        </div>
      )}
    </div>
  );
} 