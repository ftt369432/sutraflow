import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/tasks';
import { TaskService } from '../../services/TaskService';
import { AIService } from '../../services/AIService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from "../ui/Textarea";
import { TaskCard } from './TaskCard';
import { useTaskStore } from '../../store/taskStore';

export function TaskList() {
  const [newTask, setNewTask] = useState<Pick<Task, 'title' | 'description' | 'priority'>>({
    title: '',
    description: '',
    priority: 'medium'
  });

  const { tasks, addTask, updateTask } = useTaskStore();
  const taskService = new TaskService(new AIService());

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      await addTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'todo',
        tags: []
      });
      
      setNewTask({ title: '', description: '', priority: 'medium' });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTask(taskId, { status: newStatus });
  };

  const handleAIEnhancement = async (task: Task) => {
    try {
      const duration = await taskService.estimateDuration(task.description || task.title);
      updateTask(task.id, { estimatedTime: duration });
    } catch (error) {
      console.error('Failed to enhance task:', error);
    }
  };

  return (
    <div className="task-list-container space-y-4">
      <div className="task-list-header flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Button 
          onClick={() => tasks.forEach(task => handleAIEnhancement(task))}
          variant="outline"
          className="ml-auto"
        >
          AI Enhance All
        </Button>
      </div>

      <form onSubmit={handleCreateTask} className="task-form space-y-2">
        <Input
          value={newTask.title}
          onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Task title"
          required
        />
        <Textarea
          value={newTask.description}
          onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description (optional)"
        />
        <Button type="submit">Create Task</Button>
      </form>

      <div className="task-grid grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={() => handleToggleTask(task.id)}
            onEnhance={() => handleAIEnhancement(task)}
          />
        ))}
      </div>
    </div>
  );
}