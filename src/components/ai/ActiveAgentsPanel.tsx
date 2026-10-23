import React from 'react';
import { Activity, Play, Pause, Bot, Zap, AlertCircle, Flag } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAgentStore } from '../../store/agentStore';
import { Card } from '../ui/Card';
import { formatDistanceToNow } from 'date-fns';
import type { Agent } from '../../types/agent';
import { useOrchestrationManifest } from '../../hooks/useOrchestrationManifest';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { Separator } from '../ui/Separator';
import { FeedbackManager } from '../../services/evolution/FeedbackManager';
import { useUserStore } from '../../stores/userStore';

interface ActiveAgentsPanelProps {
  onSelectAgent: (agentId: string) => void;
  agents?: Agent[];
}

export function ActiveAgentsPanel({ onSelectAgent, agents: propAgents }: ActiveAgentsPanelProps) {
  const { agents: storeAgents, activateAgent, deactivateAgent } = useAgentStore();
  const { user } = useUserStore();
  const manifest = useOrchestrationManifest();

  // Use propAgents if provided, otherwise use agents from the store
  const allAgents = propAgents || storeAgents;

  // Get only non-inactive agents for display
  const displayAgents = allAgents.filter(a => a.status !== 'inactive');

  // Calculate metrics based on displayAgents
  const metrics = {
    totalActive: displayAgents.filter(a => a.status === 'active').length,
    averagePerformance: displayAgents.length > 0
      ? Math.round(displayAgents.reduce((acc, curr) => acc + (curr.metrics?.performance || 0), 0) / displayAgents.length)
      : 0,
    totalUptime: displayAgents.length > 0
      ? `${Math.round(displayAgents.reduce((acc, curr) => acc + (curr.metrics?.uptime || 0), 0) / displayAgents.length)}%`
      : 'N/A'
  };

  // 🧠 Real-time Manifest Integration
  const { currentTask, tasks } = useOrchestrationManifest();
  const sortedTasks = [...tasks].sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Active Agents</h2>
        </div>
        <div className="flex items-center gap-4">
          <StatusMetric label="Active" value={`${metrics.totalActive}/${displayAgents.length}`} />
          <StatusMetric label="Avg. Performance" value={`${metrics.averagePerformance}%`} />
          <StatusMetric label="Uptime" value={metrics.totalUptime} />
        </div>
      </div>

      <div className="space-y-4">
        {displayAgents.length > 0 ? (
          displayAgents.map(agent => (
            <AgentStatusCard
              key={agent.id}
              agent={agent}
              onSelect={() => onSelectAgent(agent.id)}
              onActivate={activateAgent}
              onDeactivate={deactivateAgent}
              currentTask={currentTask?.assignedAgent === agent.type ? currentTask : undefined}
            />
          ))
        ) : (
          <div className="text-center p-6 border border-dashed rounded-lg">
            <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium text-lg mb-1">No Active Agents</h3>
            <p className="text-muted-foreground mb-4">Create an agent to get started with automation</p>
            <Button size="sm" variant="secondary">Create Agent</Button>
          </div>
        )}
      </div>

      {/* 🧠 AGENT THOUGHT HISTORY (Timeline) */}
      {sortedTasks.length > 0 && (
        <div className="mt-8">
          <Separator className="mb-6" />
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Agent Activity log</h3>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {sortedTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="relative pl-6 border-l-2 border-gray-100">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-purple-200" />
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700">{task.assignedAgent || 'Universal'} Agent</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const content = prompt("Repot a Blind Spot: What did the agent fail to do?");
                          if (content && user) {
                            FeedbackManager.submitFeedback({
                              user_id: user.id,
                              type: 'blind_spot',
                              content: content,
                              context: FeedbackManager.captureContext(manifest, task.assignedAgent)
                            });
                            alert("Blind spot reported. The Architect will review this.");
                          }
                        }}
                        className="p-1 rounded hover:bg-red-50 text-red-400 transition-colors"
                        title="Report Blind Spot"
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                      <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(task.modified), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{task.title}</h4>

                  {/* Thought Timeline within each task */}
                  {task.thoughts && task.thoughts.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {task.thoughts.map((thought, idx) => (
                        <div key={idx} className="bg-gray-50 rounded p-2 text-xs border-l-2 border-purple-400">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge variant="outline" className={`text-[10px] h-4 px-1 uppercase ${thought.step === 'think' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                              thought.step === 'research' ? 'text-cyan-600 border-cyan-200 bg-cyan-50' :
                                thought.step === 'act' ? 'text-green-600 border-green-200 bg-green-50' :
                                  'text-amber-600 border-amber-200 bg-amber-50'
                              }`}>
                              {thought.step}
                            </Badge>
                          </div>
                          <p className="text-gray-600 leading-relaxed italic">"{thought.content}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Processing task details...</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

interface AgentStatusCardProps {
  agent: Agent;
  onSelect: () => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  currentTask?: any;
}

function AgentStatusCard({ agent, onSelect, onActivate, onDeactivate, currentTask }: AgentStatusCardProps) {
  const statusColors = {
    active: 'text-green-500',
    idle: 'text-yellow-500',
    error: 'text-red-500',
    inactive: 'text-gray-400',
    training: 'text-blue-500',
    paused: 'text-amber-500'
  };

  const statusIcons = {
    active: <Play className="h-4 w-4" />,
    idle: <Pause className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    inactive: <Pause className="h-4 w-4" />,
    training: <Activity className="h-4 w-4" />,
    paused: <Pause className="h-4 w-4" />
  };

  const toggleActivation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agent.status === 'active') {
      onDeactivate(agent.id);
    } else {
      onActivate(agent.id);
    }
  };

  // Format uptime as "X hours ago"
  const uptime = formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true });

  // Current task if any
  const statusStep = currentTask?.thoughts?.[currentTask.thoughts.length - 1]?.content || (
    agent.status === 'active' ? "Processing tasks..." :
      agent.status === 'training' ? "Training in progress..." : undefined
  );

  return (
    <div
      onClick={onSelect}
      className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:bg-accent/5 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bot className="h-10 w-10 text-primary" />
          <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center ${statusColors[agent.status]}`}>
            {statusIcons[agent.status]}
          </div>
        </div>
        <div>
          <h3 className="font-medium">{agent.name}</h3>
          <p className="text-sm text-muted-foreground">{agent.type}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {statusStep && (
          <div className="text-right max-w-[200px]">
            <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Status Update</div>
            <div className="text-xs font-medium truncate italic text-purple-700">"{statusStep}"</div>
          </div>
        )}
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Last Active</div>
          <div className="text-sm">{uptime}</div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{agent.metrics.performance}%</span>
        </div>
        <Button
          variant={agent.status === 'active' ? 'destructive' : 'secondary'}
          size="sm"
          onClick={toggleActivation}
        >
          {agent.status === 'active' ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </div>
  );
} 