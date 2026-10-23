import { useState } from 'react';
import { Plus, Play, Settings, Trash2, Bot, Zap } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  prompt: string;
  isActive: boolean;
}

export function AIAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: '',
    description: '',
    capabilities: [],
    prompt: '',
    isActive: false,
  });

  const handleCreateAgent = () => {
    if (newAgent.name && newAgent.prompt) {
      const agent: Agent = {
        id: crypto.randomUUID(),
        name: newAgent.name,
        description: newAgent.description || '',
        capabilities: newAgent.capabilities || [],
        prompt: newAgent.prompt,
        isActive: false,
      };
      setAgents([...agents, agent]);
      setNewAgent({
        name: '',
        description: '',
        capabilities: [],
        prompt: '',
        isActive: false,
      });
      setIsCreating(false);
    }
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(agents.filter(agent => agent.id !== id));
    if (selectedAgent === id) {
      setSelectedAgent(null);
    }
  };

  const handleToggleAgent = (id: string) => {
    setAgents(agents.map(agent =>
      agent.id === id ? { ...agent, isActive: !agent.isActive } : agent
    ));
  };

  const handleRunTestMission = async (agent: Agent) => {
    try {
      const { OodarAgent } = await import('../../services/agents/OodarAgent');
      const oodarWorker = new OodarAgent({
        id: agent.id,
        name: agent.name,
        description: agent.description,
      });

      console.log(`[HQ] Deploying mission for ${agent.name}...`);
      // Start the mission in the background
      oodarWorker.startMission(
        `mission-${Date.now()}`,
        `Conduct end-to-end deposition prep for ${agent.name}. 
         Search KB for contradictions and draft initial objection.`
      );
      
      alert(`🚀 ${agent.name} is now LIVE. Check the O.O.D.A.R. tab in the right panel to watch the thought stream!`);
      
    } catch (error) {
      console.error('Failed to start OODAR mission:', error);
    }
  };

  return (
    <div className="h-full flex">
      {/* Agent List */}
      <div className="w-64 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
        <div className="p-4 border-b dark:border-gray-700">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>New Agent</span>
          </button>
        </div>
        <div className="p-2 space-y-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                selectedAgent === agent.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bot size={16} />
                <span className="font-medium">{agent.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                {agent.isActive && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Agent Details/Creation */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        {isCreating ? (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Create New Agent</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full p-2 rounded-lg border dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agent name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  className="w-full h-24 p-2 rounded-lg border dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agent description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">System Prompt</label>
                <textarea
                  value={newAgent.prompt}
                  onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                  className="w-full h-48 p-2 rounded-lg border dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="System prompt..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAgent}
                  disabled={!newAgent.name || !newAgent.prompt}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Agent
                </button>
              </div>
            </div>
          </div>
        ) : selectedAgent ? (
          <div className="p-6">
            {agents.map((agent) => (
              agent.id === selectedAgent && (
                <div key={agent.id} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">{agent.name}</h2>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleToggleAgent(agent.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          agent.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <Play size={16} />
                      </button>
                      <button
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{agent.description}</p>
                  <div>
                    <h3 className="text-lg font-medium mb-2">System Prompt</h3>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-x-auto text-xs">
                      {agent.prompt}
                    </pre>
                  </div>

                  {/* 🚀 OODAR TEST BUTTON */}
                  <div className="pt-4 border-t dark:border-gray-700">
                    <button
                      onClick={() => handleRunTestMission(agent)}
                      className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group"
                    >
                      <Zap size={18} className="animate-pulse group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-sm">Deploy Test O.O.D.A.R. Mission</span>
                    </button>
                    <p className="mt-2 text-[10px] text-gray-500 italic">
                      This will wake up the agent in a background thread and begin the Observe-Orient-Decide-Act loop.
                      Check the "O.O.D.A.R." tab to watch the live thought stream.
                    </p>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Bot size={48} className="mb-4 opacity-20" />
            Select an agent or create a new one to begin deployments
          </div>
        )}
      </div>
    </div>
  );
}