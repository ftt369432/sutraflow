import React, { useState } from 'react';
import { TaskAssistantCreator } from './TaskAssistantCreator';
import { BusinessTaskSystem } from './BusinessTaskSystem';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Bot, Brain, Target, Settings } from 'lucide-react';

interface TaskAssistant {
  id: string;
  name: string;
  purpose: string;
  capabilities: string[];
  learned_tasks: string[];
  created_at: string;
  updated_at: string;
}

export function BusinessAssistantHub() {
  const [activeAssistant, setActiveAssistant] = useState<TaskAssistant | null>(null);
  const [savedAssistants, setSavedAssistants] = useState<TaskAssistant[]>([]);
  const [view, setView] = useState<'create' | 'tasks'>('create');

  React.useEffect(() => {
    // Load saved assistants on mount
    const saved = JSON.parse(localStorage.getItem('task_assistants') || '[]');
    setSavedAssistants(saved);
    if (saved.length > 0 && !activeAssistant) {
      setActiveAssistant(saved[0]);
    }
  }, []);

  const handleAssistantCreated = (assistant: TaskAssistant) => {
    setActiveAssistant(assistant);
    setSavedAssistants(prev => [...prev, assistant]);
    setView('tasks');
  };

  const selectAssistant = (assistant: TaskAssistant) => {
    setActiveAssistant(assistant);
    setView('tasks');
  };

  return (
    <div className="h-full flex flex-col bg-background_color">
      {/* Header */}
      <div className="p-4 border-b border-border_color bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary_color" />
            <h1 className="text-xl font-semibold">AI Assistant Creator</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={view === 'create' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('create')}
              className="flex items-center gap-1"
            >
              <Bot className="w-4 h-4" />
              Assistant
            </Button>
            <Button
              variant={view === 'tasks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('tasks')}
              className="flex items-center gap-1"
              disabled={!activeAssistant}
            >
              <Target className="w-4 h-4" />
              Tasks
            </Button>
          </div>
        </div>

        {/* Active Assistant Info */}
        {activeAssistant && (
          <Card className="p-3 bg-primary_color/5 border-primary_color/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-primary_color" />
                <div>
                  <h3 className="font-medium text-primary_color">{activeAssistant.name}</h3>
                  <p className="text-sm text-muted-foreground">{activeAssistant.purpose}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {activeAssistant.learned_tasks.length} learned tasks
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('create')}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Assistant Selector */}
        {savedAssistants.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {savedAssistants.map((assistant) => (
              <Button
                key={assistant.id}
                variant={activeAssistant?.id === assistant.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectAssistant(assistant)}
                className="flex-shrink-0"
              >
                {assistant.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'create' ? (
          <TaskAssistantCreator onAssistantCreated={handleAssistantCreated} />
        ) : (
          activeAssistant && (
            <div className="h-full p-4">
              <BusinessTaskSystem assistantId={activeAssistant.id} />
            </div>
          )
        )}
      </div>

      {/* Quick Start Guide */}
      {!activeAssistant && view === 'create' && (
        <div className="p-4 border-t border-border_color bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-medium mb-2">Quick Start Guide:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-primary_color text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <div>
                  <strong>Create Any Assistant:</strong> Coach, teacher, advisor, specialist - just describe what you want
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-primary_color text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <div>
                  <strong>Chat to Train:</strong> Your assistant learns your style and preferences through conversation
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-primary_color text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <div>
                  <strong>Ongoing Partnership:</strong> Your assistant evolves and improves with every interaction
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
