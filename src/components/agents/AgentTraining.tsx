import { useState } from 'react';
import { Brain, Play, Pause, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAgentStore } from '../../store/agentStore';
import { motion } from 'framer-motion';
import { agentTraining } from '../../services/agentTrainingService';

export function AgentTraining({ agentId }: { agentId: string }) {
  const { agents } = useAgentStore();
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [showAddExample, setShowAddExample] = useState(false);
  const [newExample, setNewExample] = useState({
    input: '',
    expectedOutput: '',
    type: ''
  });

  const agent = agents.find(a => a.id === agentId);
  if (!agent) return null;

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    const examples = agentTraining.getTrainingExamples(agent.type);
    const totalExamples = examples.length;
    let completed = 0;

    if (totalExamples === 0) {
      setIsTraining(false);
      return;
    }

    for (const example of examples) {
      await agentTraining.trainAgent(agent, [example]);
      completed++;
      setTrainingProgress((completed / totalExamples) * 100);
    }

    setIsTraining(false);
  };

  const handleAddExample = () => {
    agentTraining.addTrainingExample(agent.type, newExample);
    setNewExample({ input: '', expectedOutput: '', type: '' });
    setShowAddExample(false);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium">Training Progress</h3>
        </div>
        <div className="flex gap-2">
          <button 
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setShowAddExample(true)}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={isTraining ? () => setIsTraining(false) : handleStartTraining}
          >
            {isTraining ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${trainingProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Examples</p>
            <p className="font-medium">
              {agentTraining.getTrainingExamples(agent.type).length}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Accuracy</p>
            <p className="font-medium">{(agent.metrics.accuracy * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {showAddExample && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-4">
            <h3 className="font-medium mb-4">Add Training Example</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Input</label>
                <textarea
                  value={newExample.input}
                  onChange={(e) => setNewExample({ ...newExample, input: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Expected Output</label>
                <textarea
                  value={newExample.expectedOutput}
                  onChange={(e) => setNewExample({ ...newExample, expectedOutput: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Type</label>
                <input
                  type="text"
                  value={newExample.type}
                  onChange={(e) => setNewExample({ ...newExample, type: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddExample(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExample}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Example
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
} 