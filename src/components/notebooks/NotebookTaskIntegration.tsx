import React, { useState } from 'react';
import { Notebook, NotebookBlock, NotebookSection } from '../../types/notebook';
import { Task, TaskPriority, TaskStatus } from '../../types/tasks';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TaskBlock } from './TaskBlock';

interface NotebookTaskIntegrationProps {
  notebook: Notebook;
  onUpdateNotebook: (notebook: Notebook) => void;
}

export const NotebookTaskIntegration: React.FC<NotebookTaskIntegrationProps> = ({
  notebook,
  onUpdateNotebook,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate task statistics for the notebook
  const taskBlocks = getAllTaskBlocks(notebook);
  const totalTasks = taskBlocks.length;
  const completedTasks = taskBlocks.filter(block => 
    block.metadata?.task?.status === 'completed'
  ).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Function to extract all task blocks from the notebook
  function getAllTaskBlocks(notebook: Notebook): NotebookBlock[] {
    const blocks: NotebookBlock[] = [];
    
    notebook.sections.forEach(section => {
      section.blocks.forEach(block => {
        if (block.type === 'task' || block.metadata?.task) {
          blocks.push(block);
        }
      });
    });
    
    return blocks;
  }

  // Function to update a task block
  const updateTaskBlock = (sectionId: string, blockId: string, updates: Partial<NotebookBlock>) => {
    const updatedSections = notebook.sections.map(section => {
      if (section.id !== sectionId) return section;
      
      const updatedBlocks = section.blocks.map(block => {
        if (block.id !== blockId) return block;
        return { ...block, ...updates };
      });
      
      return { ...section, blocks: updatedBlocks };
    });
    
    onUpdateNotebook({ ...notebook, sections: updatedSections });
  };

  // Function to convert a text block to a task block
  const convertToTask = async (sectionId: string, blockId: string, task: Task): Promise<string> => {
    try {
      // In a real application, this would call your task management API
      // For now, we'll simulate creating a task with a timeout and a generated ID
      setIsGenerating(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a fake task ID
      const taskId = `task-${Date.now()}`;
      
      return taskId;
    } catch (err) {
      setError('Failed to create task. Please try again.');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to view a task in the task management system
  const viewTask = (taskId: string) => {
    // In a real application, this would navigate to the task or open a dialog
    alert(`Viewing task ${taskId}`);
  };

  // Function to generate tasks from notebook content
  const generateTasksFromContent = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // In a real application, this would use AI to extract actionable items
      // For now, we'll just simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Example of what the AI might do:
      const updatedSections = notebook.sections.map(section => {
        // Look for text blocks that mention actions or todos
        const updatedBlocks = section.blocks.map(block => {
          if (block.type === 'text' && 
             !block.metadata?.task &&
             (block.content.toLowerCase().includes('todo') || 
              block.content.toLowerCase().includes('task') ||
              block.content.toLowerCase().includes('action item'))) {
            
            // Create task object with proper string content
            const taskTitle = block.content.split('\n')[0] || 'New Task';
            const taskDescription = block.content.split('\n').slice(1).join('\n') || '';
            
            // Convert to a task block - use the correct type literal
            return {
              ...block,
              // Explicitly set type as a valid NotebookBlock type
              type: 'task' as const,
              // Ensure content is a string, not an object
              content: taskTitle,
              metadata: {
                ...block.metadata,
                task: {
                  id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  title: taskTitle, 
                  description: taskDescription,
                  status: 'todo' as TaskStatus,
                  priority: 'medium' as TaskPriority,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  tags: []
                }
              }
            } as NotebookBlock;
          }
          return block;
        });
        
        return { ...section, blocks: updatedBlocks };
      });
      
      onUpdateNotebook({ ...notebook, sections: updatedSections });
    } catch (err) {
      setError('Failed to generate tasks. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Task Progress</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold">{totalTasks}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold">{completedTasks}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
              <p className="text-2xl font-bold">{totalTasks - completedTasks}</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={generateTasksFromContent}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating Tasks...' : 'Generate Tasks from Content'}
          </Button>
        </CardFooter>
      </Card>
      
      {taskBlocks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Notebook Tasks</h3>
          
          {taskBlocks.map(block => {
            const section = notebook.sections.find(s => 
              s.blocks.some(b => b.id === block.id)
            );
            
            if (!section) return null;
            
            return (
              <TaskBlock
                key={block.id}
                block={block}
                onUpdate={(updates) => updateTaskBlock(section.id, block.id, updates)}
                onConvertToTask={(task) => convertToTask(section.id, block.id, task)}
                onViewTask={viewTask}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}; 