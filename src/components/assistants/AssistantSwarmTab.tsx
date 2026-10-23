import React from 'react';
import {
  Brain,
  Bot,
  Layers,
  Zap,
  BookOpen
} from 'lucide-react';
import { Button } from '../ui/Button';
import { type AIAssistant } from '../../types/ai';
import type { User } from '@supabase/supabase-js';

interface AssistantSwarmTabProps {
  selectedAssistant: AIAssistant;
  currentUser: User | null;
  createSwarm: (swarmData: any) => Promise<any>;
}

export const AssistantSwarmTab: React.FC<AssistantSwarmTabProps> = ({
  selectedAssistant,
  currentUser,
  createSwarm
}) => {
  const handleCreateSwarmFromAssistant = async () => {
    if (!currentUser || !selectedAssistant) {
      alert('Please select an assistant and make sure you are logged in.');
      return;
    }

    try {
      const roles = selectedAssistant.capabilities?.map((capability) => ({
        roleName: `${capability.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Specialist`,
        description: `Specialized in ${capability.replace(/_/g, ' ')} tasks`,
        requiredCapabilities: [capability],
        minAgents: 1,
        maxAgents: 1
      })) || [];

      // Add an orchestrator role
      roles.unshift({
        roleName: 'Orchestrator',
        description: `Lead coordinator using ${selectedAssistant.name}'s expertise`,
        requiredCapabilities: selectedAssistant.capabilities || [],
        minAgents: 1,
        maxAgents: 1
      });

      const swarmData = {
        name: `${selectedAssistant.name} Swarm`,
        description: `Intelligent swarm based on ${selectedAssistant.name} - ${selectedAssistant.description}`,
        members: roles.map((role, index) => ({
          id: `member-${Date.now()}-${index}`,
          name: role.roleName,
          role: role.roleName,
          status: 'pending' as const,
          capabilities: role.requiredCapabilities || []
        })),
        creatorId: currentUser.id,
        status: 'creating' as const,
        type: selectedAssistant.type || 'general',
        efficiency: 0,
        executionLog: [
          `[${new Date().toISOString()}] Swarm created from assistant "${selectedAssistant.name}" by ${currentUser.email}`
        ],
        config: {
          roles,
          defaultInstructions:
            selectedAssistant.system_prompt ||
            `Use the knowledge and style of ${selectedAssistant.name} to coordinate tasks effectively.`,
          knowledgeBase: selectedAssistant.knowledgeBase || []
        }
      };

      const createdSwarm = await createSwarm(swarmData as any);

      if (createdSwarm) {
        alert(
          `Successfully created swarm "${createdSwarm.name}" with ${roles.length} specialized agents!`
        );
      } else {
        alert('Failed to create swarm. Please try again.');
      }
    } catch (error) {
      console.error('Error creating swarm from assistant:', error);
      alert('Error creating swarm. Please check the console for details.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Agent Swarm</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Convert "{selectedAssistant.name}" into a coordinated swarm of specialized agents
          </p>
        </div>
      </div>

      {/* Swarm Architecture Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Generated Swarm Architecture
        </h3>

        <div className="space-y-4">
          {/* Lead Agent */}
          <div className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Orchestrator</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lead coordinator using {selectedAssistant.name}'s expertise
              </p>
            </div>
          </div>

          {/* Specialist Agents */}
          {selectedAssistant.capabilities?.map((capability, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {capability.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Specialist
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Specialized in {capability.replace(/_/g, ' ')} tasks
                </p>
              </div>
            </div>
          ))}

          {/* Integration Points */}
          <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center space-x-2 mb-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-medium text-gray-900 dark:text-white text-sm">Integration Layer</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              • Personal agents from Builder tab can join as specialists
              <br />
              • Workflows from Workflows tab provide automation backbone
              <br />• Voice commands enable real-time swarm coordination
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Swarm Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Parallel Processing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Multiple agents work simultaneously on different aspects of complex tasks
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Specialized Focus</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Each agent concentrates on its specific domain without distraction
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Automatic Coordination</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Orchestrator manages task distribution and synthesizes results
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Shared Knowledge</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All agents share your assistant's knowledge base and learned patterns
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleCreateSwarmFromAssistant}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8"
        >
          <Bot className="w-5 h-5 mr-2" />
          Create Agent Swarm
        </Button>
      </div>
    </div>
  );
};
