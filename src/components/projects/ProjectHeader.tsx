import React from 'react';
import {
  Brain,
  Calendar,
  MoreHorizontal,
  Plus,
  Settings,
  Users,
  Activity,
  BarChart2,
  Trash2
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Separator } from '../ui/Separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/DropdownMenu';
import { Project } from './ProjectTypes';

interface ProjectHeaderProps {
  project: Project;
  onAIInsights?: () => void;
  onTimeline?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onAIInsights,
  onTimeline
}) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{project.name}</h2>
            <Badge
              variant="outline"
              className={`px-2 text-xs capitalize ${
                project.status === 'active'
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400'
                  : project.status === 'completed'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400'
                  : project.status === 'on-hold'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {project.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {project.teamMembers.map((member) => (
              <Avatar key={member.id} className="h-8 w-8 border-2 border-white dark:border-slate-900">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 ml-1 rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onAIInsights}>
              <Brain className="h-4 w-4 mr-1 text-purple-500" />
              AI Insights
            </Button>
            <Button variant="outline" size="sm" onClick={onTimeline}>
              <Calendar className="h-4 w-4 mr-1" />
              Timeline
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Project Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Activity className="h-4 w-4 mr-2" />
                  Activity Log
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archive Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center mt-4">
        <div className="w-full bg-gray-200 h-2 rounded-full dark:bg-gray-700 mr-3 flex-1">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {project.progress}%
        </span>
      </div>
    </div>
  );
};
