import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  StickyNote as StickyNoteIcon,
  Maximize,
  Minimize,
  Settings,
  KanbanSquare,
  FileText,
  Calendar,
  BarChart2,
  FolderPlus,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Project, Task } from '../components/projects/ProjectTypes';
import { StickyNotesPanel } from '../components/projects/StickyNotesPanel';
import { ProjectSidebar } from '../components/projects/ProjectSidebar';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { ProjectKanbanBoard } from '../components/projects/ProjectKanbanBoard';
import { useProjectStore } from '../store/projectStore';

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    addProject,
    moveTask
  } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('board');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Selected project resolution
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination || !selectedProject) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    moveTask(selectedProject.id, draggableId, destination.droppableId as Task['status']);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    addProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Custom case and project workspace.',
      progress: 0,
      teamMembers: [],
      tasks: [],
      tags: ['workspace'],
      status: 'active'
    });

    setNewProjectName('');
    setNewProjectDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Projects</h1>
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs font-normal">
                {projects.length} Projects
              </Badge>
              <Separator orientation="vertical" className="h-4 mx-2" />
              <Badge variant="outline" className="text-xs font-normal bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                {projects.filter((p) => p.status === 'active').length} Active
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search projects or tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm rounded-lg"
              />
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotes(!showNotes)}
              title="Sticky Notes"
            >
              <StickyNoteIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Notes Slideout Panel */}
      <StickyNotesPanel isOpen={showNotes} onClose={() => setShowNotes(false)} />

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-indigo-500" />
                Create New Project
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name
                </label>
                <Input
                  required
                  placeholder="e.g. Martinez WCAB Defense Portfolio"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Project scope, objectives, or case details..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {projects.length > 0 && selectedProject ? (
          <>
            {/* Project Sidebar */}
            <ProjectSidebar
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={(p) => setSelectedProjectId(p.id)}
              onNewProject={() => setShowCreateModal(true)}
            />

            {/* Selected Project Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Project Details Header */}
              <ProjectHeader project={selectedProject} />

              {/* View Selector Tabs */}
              <div className="border-b border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-950">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-auto bg-slate-100 dark:bg-slate-900">
                    <TabsTrigger value="board" className="text-sm">
                      <KanbanSquare className="h-4 w-4 mr-1.5" />
                      Board
                    </TabsTrigger>
                    <TabsTrigger value="list" className="text-sm">
                      <FileText className="h-4 w-4 mr-1.5" />
                      List
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="text-sm">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      Calendar
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="text-sm">
                      <BarChart2 className="h-4 w-4 mr-1.5" />
                      Analytics
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Tab Content Panels */}
              <div className="flex-1 overflow-hidden p-4 bg-gray-50 dark:bg-gray-900">
                <Tabs value={activeTab}>
                  <TabsContent value="board" className="h-full m-0">
                    <ProjectKanbanBoard
                      project={selectedProject}
                      searchQuery={searchQuery}
                      onDragEnd={handleDragEnd}
                    />
                  </TabsContent>

                  <TabsContent value="list" className="h-full m-0">
                    <div className="h-full bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center items-center text-center">
                      <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white">Task List View</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Switch to the Board view for interactive drag-and-drop workflow coordination.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="calendar" className="h-full m-0">
                    <div className="h-full bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center items-center text-center">
                      <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white">Project Calendar View</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Connect milestones and task due dates with the full calendar engine.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="h-full m-0">
                    <div className="h-full bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center items-center text-center">
                      <BarChart2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white">Project Analytics</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Velocity metrics and team performance insights automatically compiled by the Cortex engine.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-slate-900/50">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
              <FolderPlus className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Projects</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
              Organize cases, legal briefs, medical ratings, and tasks into dedicated project spaces with live Kanban tracking.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Your First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;