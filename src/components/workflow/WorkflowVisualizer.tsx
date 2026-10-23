import React from 'react';
import { motion } from 'framer-motion';
import { WorkflowPattern } from '../../types/workflow';
import { AgentConfig } from '../../types/agents';
import { Activity, GitBranch, GitMerge, Zap, Brain } from 'lucide-react';

interface WorkflowVisualizerProps {
  patterns: WorkflowPattern[];
  activeAgents: AgentConfig[];
}

export function WorkflowVisualizer({ patterns, activeAgents }: WorkflowVisualizerProps) {
  const getPatternColor = (type: string) => {
    switch (type) {
      case 'automation': return '#8b5cf6';
      case 'learning': return '#3b82f6';
      default: return '#10b981';
    }
  };

  return (
    <div className="h-full">
      <h3 className="text-lg font-medium text-white mb-6">Workflow Visualization</h3>
      
      <div className="relative h-[calc(100%-2rem)]">
        {/* Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none">
          {patterns.map((pattern, i) => (
            <g key={`connections-${pattern.id}`}>
              {activeAgents
                .filter(agent => 
                  pattern.capabilities.some(cap => agent.capabilities.includes(cap))
                )
                .map((agent, j) => (
                  <motion.path
                    key={`connection-${pattern.id}-${agent.id}`}
                    d={`M 20,${100 + i * 120} C 100,${100 + i * 120} 100,${150 + j * 80} 180,${150 + j * 80}`}
                    stroke={getPatternColor(pattern.type)}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                  />
                ))}
            </g>
          ))}
        </svg>

        {/* Patterns */}
        <div className="relative z-10">
          {patterns.map((pattern, i) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${getPatternColor(pattern.type)}20` }}>
                  {pattern.type === 'automation' ? (
                    <Zap className="w-5 h-5" style={{ color: getPatternColor(pattern.type) }} />
                  ) : (
                    <Brain className="w-5 h-5" style={{ color: getPatternColor(pattern.type) }} />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-white">{pattern.name}</h4>
                  <p className="text-sm text-white/60">{pattern.frequency} occurrences</p>
                </div>
              </div>

              {/* Connected Agents */}
              <div className="ml-12 mt-2 space-y-2">
                {activeAgents
                  .filter(agent => 
                    pattern.capabilities.some(cap => agent.capabilities.includes(cap))
                  )
                  .map((agent, j) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (i * 0.1) + (j * 0.05) }}
                      className="flex items-center gap-2 text-sm text-white/60"
                    >
                      <GitBranch className="w-4 h-4" />
                      {agent.name}
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 