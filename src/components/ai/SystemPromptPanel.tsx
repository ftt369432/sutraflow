import React from 'react';
import { Button } from '../ui/Button';
import { 
  Save,
  Plus,
  Trash2,
  Copy,
  Settings,
  ChevronDown,
  ChevronUp,
  Code,
  MessageSquare,
  Brain
} from 'lucide-react';

interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'coding' | 'chat' | 'analysis';
  isActive: boolean;
}

export function SystemPromptPanel() {
  const [prompts, setPrompts] = React.useState<SystemPrompt[]>([
    {
      id: '1',
      name: 'Code Assistant',
      description: 'Specialized in code generation and review',
      content: 'You are an expert programming assistant...',
      category: 'coding',
      isActive: true
    },
    {
      id: '2',
      name: 'Chat Assistant',
      description: 'General conversation and task assistance',
      content: 'You are a helpful AI assistant...',
      category: 'chat',
      isActive: false
    },
    {
      id: '3',
      name: 'Data Analyst',
      description: 'Focused on data analysis and insights',
      content: 'You are a data analysis expert...',
      category: 'analysis',
      isActive: false
    }
  ]);

  const [selectedPrompt, setSelectedPrompt] = React.useState<SystemPrompt | null>(prompts[0]);
  const [isEditing, setIsEditing] = React.useState(false);

  const categoryIcons = {
    coding: <Code className="h-4 w-4" />,
    chat: <MessageSquare className="h-4 w-4" />,
    analysis: <Brain className="h-4 w-4" />
  };

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Implement save logic
  };

  const handleDelete = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
    if (selectedPrompt?.id === id) {
      setSelectedPrompt(prompts[0]);
    }
  };

  const handleActivate = (id: string) => {
    setPrompts(prompts.map(p => ({
      ...p,
      isActive: p.id === id
    })));
  };

  return (
    <div className="flex h-full gap-4">
      {/* Prompt List */}
      <div className="w-64 space-y-4">
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => setIsEditing(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>

        <div className="space-y-2">
          {prompts.map(prompt => (
            <div
              key={prompt.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedPrompt?.id === prompt.id
                  ? 'bg-cyberpunk-neon/20 border-cyberpunk-neon'
                  : 'border-cyberpunk-neon/20 hover:bg-cyberpunk-neon/10'
              }`}
              onClick={() => setSelectedPrompt(prompt)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {categoryIcons[prompt.category]}
                  <span className="font-medium text-sm">{prompt.name}</span>
                </div>
                {prompt.isActive && (
                  <div className="h-2 w-2 rounded-full bg-cyberpunk-neon" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {prompt.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Editor */}
      {selectedPrompt && (
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {categoryIcons[selectedPrompt.category]}
              <h3 className="text-lg font-medium">{selectedPrompt.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActivate(selectedPrompt.id)}
              >
                {selectedPrompt.isActive ? 'Active' : 'Activate'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(selectedPrompt.id)}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={selectedPrompt.name}
                  className="w-full bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg p-2 text-sm"
                  placeholder="Prompt Name"
                />
                <textarea
                  value={selectedPrompt.content}
                  rows={10}
                  className="w-full bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg p-2 text-sm font-mono"
                  placeholder="Enter your system prompt here..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {selectedPrompt.content}
                </pre>
              </div>
            )}
          </div>

          <div className="border-t border-cyberpunk-neon/20 pt-4">
            <h4 className="text-sm font-medium mb-2">Variables</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-cyberpunk-dark/30 text-xs">
                <span className="text-cyberpunk-neon">{'${username}'}</span>
                <span className="text-gray-400 ml-2">Current user&apos;s name</span>
              </div>
              <div className="p-2 rounded bg-cyberpunk-dark/30 text-xs">
                <span className="text-cyberpunk-neon">{'${context}'}</span>
                <span className="text-gray-400 ml-2">Active document context</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 