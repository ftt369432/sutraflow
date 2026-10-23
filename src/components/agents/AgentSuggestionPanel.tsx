import { Button } from '../ui/Button';
import { Bot, Plus } from 'lucide-react';

export interface AgentPattern {
  id: string;
  name: string;
  description: string;
  type: string;
  capabilities: string[];
}

export interface AgentSuggestionPanelProps {
  patterns: AgentPattern[];
  onCreateAgent: (pattern: AgentPattern) => void;
}

export function AgentSuggestionPanel({ patterns = defaultPatterns, onCreateAgent }: AgentSuggestionPanelProps) {
  return (
    <div className="space-y-4">
      {patterns.map(pattern => (
        <div 
          key={pattern.id}
          className="p-4 rounded-lg bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 hover:border-cyberpunk-neon/50 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyberpunk-neon" />
              <div>
                <h4 className="font-medium text-white">{pattern.name}</h4>
                <p className="text-sm text-gray-400">{pattern.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateAgent(pattern)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {pattern.capabilities.map((capability, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-cyberpunk-neon/10 text-cyberpunk-neon"
              >
                {capability}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const defaultPatterns: AgentPattern[] = [
  {
    id: 'researcher',
    name: 'Research Assistant',
    description: 'Helps with research, data gathering, and analysis',
    type: 'researcher',
    capabilities: ['Web Search', 'Data Analysis', 'Report Generation']
  },
  {
    id: 'coder',
    name: 'Code Generator',
    description: 'Generates and reviews code, suggests improvements',
    type: 'coder',
    capabilities: ['Code Generation', 'Code Review', 'Refactoring']
  },
  {
    id: 'analyst',
    name: 'Data Analyzer',
    description: 'Analyzes data, creates visualizations, finds insights',
    type: 'analyst',
    capabilities: ['Data Processing', 'Visualization', 'Pattern Recognition']
  }
]; 