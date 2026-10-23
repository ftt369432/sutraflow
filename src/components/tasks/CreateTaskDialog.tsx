import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Email, Task } from '../../types';

interface CreateTaskDialogProps {
  emails: Email[];
  onClose: () => void;
  onSubmit: (tasks: Task[]) => void;
}

export function CreateTaskDialog({ emails, onClose, onSubmit }: CreateTaskDialogProps) {
  const [tasks, setTasks] = useState<Task[]>(
    emails.map(email => ({
      id: crypto.randomUUID(),
      title: email.subject,
      description: `From: ${email.from}\n\n${email.content}`,
      priority: 'medium' as const,
      completed: false,
      tags: ['email'],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    }))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(tasks);
    onClose();
  };

  const updateTask = (index: number, updates: Partial<Task>) => {
    setTasks(tasks.map((task, i) =>
      i === index ? { ...task, ...updates } : task
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium">Create Tasks from Emails</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {tasks.map((task, index) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(index, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask(index, { priority: e.target.value as Task['priority'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={task.dueDate?.toISOString().split('T')[0]}
                      onChange={(e) => updateTask(index, { dueDate: new Date(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Tasks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}