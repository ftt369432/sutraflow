import React from 'react';
import { Plus, Clock, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Project } from './ProjectTypes';

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject: Project;
  onSelectProject: (project: Project) => void;
  onNewProject?: () => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  onNewProject
}) => {
  return (
    <div className="w-72 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">My Projects</h2>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onNewProject}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedProject.id === project.id
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 shadow-sm'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 border-transparent'
            }`}
            onClick={() => onSelectProject(project)}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{project.name}</h3>
              <Badge
                variant="outline"
                className={`px-2 py-0 text-[10px] capitalize ${
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

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {project.description}
            </p>

            <div className="flex items-center justify-between mt-3">
              <div className="flex -space-x-2">
                {project.teamMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-6 w-6 border-2 border-white dark:border-slate-900">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {project.teamMembers.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900">
                    +{project.teamMembers.length - 3}
                  </div>
                )}
              </div>

              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  {project.dueDate
                    ? new Date(project.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'No deadline'}
                </span>
              </div>
            </div>

            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 dark:bg-gray-700">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {project.progress}% completed
              </span>
              <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400">
                <FileText className="h-3 w-3 mr-1" />
                <span>{project.tasks.length} tasks</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
