import React from 'react';
import { Button } from '../ui/Button';
import {
  FileText,
  Code,
  GitBranch,
  Terminal,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Brain,
  RefreshCw,
  Layers
} from 'lucide-react';

interface ContextItem {
  id: string;
  type: 'file' | 'code' | 'git' | 'terminal';
  title: string;
  content: string;
  timestamp: Date;
  isActive: boolean;
}

interface ContextGroup {
  id: string;
  name: string;
  items: ContextItem[];
}

export function ContextPanel() {
  const [groups, setGroups] = React.useState<ContextGroup[]>([
    {
      id: '1',
      name: 'Current File',
      items: [
        {
          id: '1',
          type: 'file',
          title: 'src/components/ai/ContextPanel.tsx',
          content: 'React component implementing context management...',
          timestamp: new Date(),
          isActive: true
        }
      ]
    },
    {
      id: '2',
      name: 'Related Code',
      items: [
        {
          id: '2',
          type: 'code',
          title: 'useAI Hook',
          content: 'Custom hook for AI interactions...',
          timestamp: new Date(),
          isActive: true
        },
        {
          id: '3',
          type: 'code',
          title: 'AIContext Interface',
          content: 'TypeScript interface defining context structure...',
          timestamp: new Date(),
          isActive: true
        }
      ]
    },
    {
      id: '3',
      name: 'Environment',
      items: [
        {
          id: '4',
          type: 'git',
          title: 'Current Branch: main',
          content: 'Last commit: Add AI context management...',
          timestamp: new Date(),
          isActive: true
        },
        {
          id: '5',
          type: 'terminal',
          title: 'Terminal Output',
          content: 'npm run build completed successfully...',
          timestamp: new Date(),
          isActive: false
        }
      ]
    }
  ]);

  const typeIcons = {
    file: <FileText className="h-4 w-4" />,
    code: <Code className="h-4 w-4" />,
    git: <GitBranch className="h-4 w-4" />,
    terminal: <Terminal className="h-4 w-4" />
  };

  const toggleItem = (groupId: string, itemId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.map(item => 
            item.id === itemId ? { ...item, isActive: !item.isActive } : item
          )
        };
      }
      return group;
    }));
  };

  const removeItem = (groupId: string, itemId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.filter(item => item.id !== itemId)
        };
      }
      return group;
    }));
  };

  const refreshContext = () => {
    // TODO: Implement context refresh logic
    console.log('Refreshing context...');
  };

  return (
    <div className="space-y-6">
      {/* Context Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-cyberpunk-neon" />
          <h2 className="text-lg font-medium">Context Awareness</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshContext}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Context Groups */}
      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyberpunk-neon" />
                {group.name}
              </h3>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {group.items.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcons[item.type]}
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleItem(group.id, item.id)}
                      >
                        {item.isActive ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(group.id, item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  {item.isActive && (
                    <div className="mt-2 p-2 bg-cyberpunk-dark/50 rounded text-xs font-mono">
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Context Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg">
          <div className="text-xs text-gray-400">Active Items</div>
          <div className="text-xl font-bold text-cyberpunk-neon">
            {groups.reduce((sum, group) => 
              sum + group.items.filter(item => item.isActive).length, 0
            )}
          </div>
        </div>
        <div className="p-3 bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg">
          <div className="text-xs text-gray-400">Total Items</div>
          <div className="text-xl font-bold text-cyberpunk-neon">
            {groups.reduce((sum, group) => sum + group.items.length, 0)}
          </div>
        </div>
        <div className="p-3 bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg">
          <div className="text-xs text-gray-400">Last Update</div>
          <div className="text-xl font-bold text-cyberpunk-neon">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
} 