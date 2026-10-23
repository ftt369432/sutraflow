import { cn } from '../../lib/utils';
import { Agent, AgentStatus } from '../../types/agent';
import { Bot, Circle } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
}

export function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'idle':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'training':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-lg',
        isSelected
          ? 'bg-gray-800 text-white'
          : 'text-white hover:bg-gray-800/50'
      )}
    >
      <div className="relative">
        <Bot className="w-5 h-5" />
        <Circle
          className={cn(
            'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full fill-current',
            getStatusColor(agent.status)
          )}
        />
      </div>
      
      <div className="flex-1 text-left">
        <div className="font-medium truncate">{agent.name}</div>
        <div className="text-xs text-gray-400 truncate">
          {agent.capabilities.slice(0, 2).join(', ')}
          {agent.capabilities.length > 2 && '...'}
        </div>
      </div>
    </button>
  );
} 