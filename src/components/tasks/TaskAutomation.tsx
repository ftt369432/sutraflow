import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TaskExecutor } from '../../lib/agents/TaskExecutor';
import { useAgentStore } from '../../store/agentStore';
import type { Task, ExecutionPlan } from '../../utils/taskUtils';

interface TaskAutomationProps {
  task: Task;
  onUpdate?: (task: Task) => void;
}

export function TaskAutomation({ task, onUpdate }: TaskAutomationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const store = useAgentStore();
  const { agents } = store;

  const taskAgent = agents.find(a => a.capabilities.includes('task-automation'));
  const executor = taskAgent ? new TaskExecutor(taskAgent, store) : null;

  async function handleAutomate() {
    if (!executor) {
      setError('No task automation agent available');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await executor.executeTask({
        task,
        teamCapacity: {}, // Add team capacity data here
        preferences: {}, // Add preferences here
        constraints: {}, // Add constraints here
      });

      setExecutionPlan(result);
      onUpdate?.(result.task);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Task Automation</h3>
        <Button
          onClick={handleAutomate}
          disabled={isProcessing || !executor}
          leftIcon={isProcessing ? <RefreshCw className="animate-spin" /> : <Play />}
        >
          {isProcessing ? 'Processing...' : 'Automate'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4"
          >
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          </motion.div>
        )}

        {executionPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-500 dark:text-gray-400">Subtasks</span>
                <span className="block text-lg font-medium">
                  {executionPlan.subtasks.length}
                </span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-500 dark:text-gray-400">Estimated Time</span>
                <span className="block text-lg font-medium">
                  {executionPlan.task.estimatedEffort}h
                </span>
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-2">Execution Plan</h4>
              <div className="space-y-2">
                {executionPlan.subtasks.map((subtask: Task, index: number) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span>{index + 1}. {subtask.title}</span>
                    <span className="text-sm text-gray-500">
                      {subtask.estimatedEffort}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
} 