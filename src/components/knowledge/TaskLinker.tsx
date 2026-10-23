import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Bot, 
  Link2, 
  Unlink, 
  Tag, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Plus,
  Folder
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTaskStore } from '../../store/taskStore';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { Task } from '../../types/task';
import type { AIAssistant } from '../../types/ai';

interface TaskLinkerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TaskAssistantLink {
  taskId: string;
  task: Task;
  assignedAssistants: AIAssistant[];
  suggestedAssistants: AIAssistant[];
  relevantFolders: string[];
}

export function TaskLinker({ isOpen, onClose }: TaskLinkerProps) {
  const { tasks, updateTask } = useTaskStore();
  const { assistants } = useAssistantStore();
  const { folders, documents } = useKnowledgeBaseStore();
  const [taskLinks, setTaskLinks] = useState<TaskAssistantLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkAssignAssistant, setBulkAssignAssistant] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadTaskLinks();
    }
  }, [isOpen, tasks, assistants]);

  const loadTaskLinks = () => {
    const links = tasks.map(task => {
      const assignedAssistants = assistants.filter(assistant => 
        task.assignedAssistants?.includes(assistant.id)
      );
      
      const suggestedAssistants = getSuggestedAssistants(task);
      const relevantFolders = getRelevantFolders(task);

      return {
        taskId: task.id,
        task,
        assignedAssistants,
        suggestedAssistants,
        relevantFolders
      };
    });
    setTaskLinks(links);
  };

  const getSuggestedAssistants = (task: Task): AIAssistant[] => {
    // Suggest assistants based on task content, tags, and type
    return assistants.filter(assistant => {
      const taskText = `${task.title} ${task.description || ''} ${task.tags?.join(' ') || ''}`.toLowerCase();
      const assistantKeywords = [
        assistant.name.toLowerCase(),
        assistant.type.toLowerCase(),
        ...(assistant.capabilities || []).map(cap => cap.toLowerCase())
      ];
      
      return assistantKeywords.some(keyword => taskText.includes(keyword)) &&
             !task.assignedAssistants?.includes(assistant.id);
    }).slice(0, 3); // Limit to top 3 suggestions
  };

  const getRelevantFolders = (task: Task): string[] => {
    // Find folders that might be relevant to this task
    const taskText = `${task.title} ${task.description || ''} ${task.tags?.join(' ') || ''}`.toLowerCase();
    
    return folders.filter(folder => {
      const folderText = folder.name.toLowerCase();
      const folderDocs = documents.filter(doc => doc.folderId === folder.id);
      const folderContent = folderDocs.map(doc => 
        `${doc.title} ${doc.content}`.toLowerCase()
      ).join(' ');
      
      return folderText.includes(taskText.split(' ')[0]) || 
             taskText.split(' ').some(word => word.length > 3 && folderContent.includes(word));
    }).map(folder => folder.id).slice(0, 5);
  };

  const handleAssignAssistant = (taskId: string, assistantId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentAssistants = task.assignedAssistants || [];
    const updatedAssistants = currentAssistants.includes(assistantId)
      ? currentAssistants.filter(id => id !== assistantId)
      : [...currentAssistants, assistantId];

    updateTask(taskId, { assignedAssistants: updatedAssistants });
    loadTaskLinks();
  };

  const handleBulkAssign = () => {
    if (!bulkAssignAssistant || selectedTasks.size === 0) return;

    selectedTasks.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const currentAssistants = task.assignedAssistants || [];
        if (!currentAssistants.includes(bulkAssignAssistant)) {
          updateTask(taskId, { 
            assignedAssistants: [...currentAssistants, bulkAssignAssistant] 
          });
        }
      }
    });

    setSelectedTasks(new Set());
    setBulkAssignAssistant('');
    loadTaskLinks();
  };

  const filteredTaskLinks = taskLinks.filter(link =>
    searchTerm === '' || 
    link.task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'todo': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Task-Assistant Linker
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Connect tasks with AI assistants and Knowledge Base resources
                </p>
              </div>
            </div>            <Button variant="assistant" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {selectedTasks.size > 0 && (
              <div className="flex items-center space-x-2">
                <select
                  value={bulkAssignAssistant}
                  onChange={(e) => setBulkAssignAssistant(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Bulk assign to...</option>
                  {assistants.map(assistant => (
                    <option key={assistant.id} value={assistant.id}>
                      {assistant.name} ({assistant.type})
                    </option>
                  ))}
                </select>                <Button
                  onClick={handleBulkAssign}
                  disabled={!bulkAssignAssistant}
                  size="sm"
                  variant="assistant-primary"
                >
                  Assign ({selectedTasks.size})
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {filteredTaskLinks.map(link => (
              <div
                key={link.taskId}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(link.taskId)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedTasks);
                      if (e.target.checked) {
                        newSelected.add(link.taskId);
                      } else {
                        newSelected.delete(link.taskId);
                      }
                      setSelectedTasks(newSelected);
                    }}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />

                  {/* Task Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(link.task.status)}
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {link.task.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(link.task.priority)}`}>
                        {link.task.priority}
                      </span>
                      {link.task.dueDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Due: {new Date(link.task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {link.task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {link.task.description}
                      </p>
                    )}

                    {/* Tags */}
                    {link.task.tags && link.task.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {link.task.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assigned Assistants */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assigned Assistants ({link.assignedAssistants.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {link.assignedAssistants.map(assistant => (
                          <div
                            key={assistant.id}
                            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 rounded-full"
                          >
                            <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs text-blue-700 dark:text-blue-300">
                              {assistant.name}
                            </span>                            <button
                              onClick={() => handleAssignAssistant(link.taskId, assistant.id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <Unlink className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggested Assistants */}
                    {link.suggestedAssistants.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Suggested Assistants
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {link.suggestedAssistants.map(assistant => (                            <button
                              key={assistant.id}
                              onClick={() => handleAssignAssistant(link.taskId, assistant.id)}
                              className="flex items-center space-x-2 px-3 py-1 border border-blue-200 dark:border-blue-800 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <Bot className="h-3 w-3" />
                              <span className="text-xs">
                                {assistant.name}
                              </span>
                              <Plus className="h-3 w-3 text-green-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Relevant Folders */}
                    {link.relevantFolders.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Relevant Knowledge Folders
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {link.relevantFolders.map(folderId => {
                            const folder = folders.find(f => f.id === folderId);
                            if (!folder) return null;
                            const docCount = documents.filter(doc => doc.folderId === folderId).length;
                            return (
                              <div
                                key={folderId}
                                className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/50 rounded-full"
                              >
                                <Folder className="h-3 w-3 text-green-600 dark:text-green-400" />
                                <span className="text-xs text-green-700 dark:text-green-300">
                                  {folder.name} ({docCount} docs)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTaskLinks.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No tasks match your search.' : 'No tasks available.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 