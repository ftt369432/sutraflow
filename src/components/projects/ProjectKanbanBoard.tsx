import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Plus,
  Clock,
  Brain,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/DropdownMenu';
import { Project, Task } from './ProjectTypes';

const statusColumns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-300', textColor: 'text-gray-700' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-300', textColor: 'text-blue-700' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-300', textColor: 'text-yellow-700' },
  { id: 'review', title: 'Review', color: 'bg-purple-300', textColor: 'text-purple-700' },
  { id: 'done', title: 'Done', color: 'bg-green-300', textColor: 'text-green-700' }
];

const priorityBadges: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
};

interface ProjectKanbanBoardProps {
  project: Project;
  searchQuery: string;
  onDragEnd: (result: any) => void;
  onAddTask?: (status: Task['status']) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const ProjectKanbanBoard: React.FC<ProjectKanbanBoardProps> = ({
  project,
  searchQuery,
  onDragEnd,
  onAddTask,
  onDeleteTask
}) => {
  const filterTasks = (tasks: Task[]) => {
    if (!searchQuery) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const getTasksByStatus = (status: Task['status']) => {
    return filterTasks(project.tasks).filter((task) => task.status === status);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.id as Task['status']);
          return (
            <div key={column.id} className="flex-shrink-0 w-72">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full ${column.color} mr-2`} />
                  <h3 className={`font-semibold text-sm ${column.textColor}`}>{column.title}</h3>
                  <span className="ml-2 text-xs text-muted-foreground bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-medium">
                    {columnTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onAddTask?.(column.id as Task['status'])}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3 min-h-[50px]"
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className={`px-2 py-0 text-[10px] uppercase font-bold ${
                                  priorityBadges[task.priority]?.bg || 'bg-gray-100'
                                } ${priorityBadges[task.priority]?.text || 'text-gray-700'} ${
                                  priorityBadges[task.priority]?.border || 'border-gray-300'
                                }`}
                              >
                                {task.priority}
                              </Badge>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Add Comment
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => onDeleteTask?.(task.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <h4 className="font-semibold text-sm mt-2 text-slate-900 dark:text-white">
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Tags */}
                            {task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {task.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="px-1.5 py-0 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* AI indicator */}
                            {task.hasAIRecommendations && (
                              <div className="mt-2 flex items-center text-xs text-purple-600 dark:text-purple-400 font-medium">
                                <Brain className="h-3 w-3 mr-1" />
                                <span>AI recommendations available</span>
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                              <div className="flex -space-x-2">
                                {task.assignees.slice(0, 2).map((assignee) => (
                                  <Avatar key={assignee.id} className="h-5 w-5 border border-white dark:border-slate-800">
                                    <AvatarImage src={assignee.avatar} alt={assignee.name} />
                                    <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {task.assignees.length > 2 && (
                                  <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold border border-white dark:border-slate-800">
                                    +{task.assignees.length - 2}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {task.attachments && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <FileText className="h-3 w-3 mr-1" />
                                    <span>{task.attachments}</span>
                                  </div>
                                )}

                                {task.comments && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    <span>{task.comments}</span>
                                  </div>
                                )}

                                {task.dueDate && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>
                                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
