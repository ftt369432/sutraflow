import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCanvasStore } from '../../stores/canvasStore';
import { 
  Plus, 
  Image, 
  FileText, 
  Mic, 
  Video, 
  Link, 
  StickyNote,
  Save,
  Download,
  Share2,
  Users,
  History,
  Grid,
  List,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Trash2,
  Copy,
  Eye,
  Edit3,
  MessageSquare,
  Calendar,
  CheckSquare,
  Zap,
  Layers,
  Move,
  MousePointer
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { toast } from 'sonner';

// Canvas Item Types
type CanvasItemType = 'text' | 'image' | 'document' | 'note' | 'link' | 'audio' | 'video' | 'task' | 'comment';
type ProjectType = 'petition' | 'business-plan' | 'legal-brief' | 'research' | 'presentation' | 'custom';

interface CanvasItem {
  id: string;
  type: CanvasItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: any;
  title?: string;
  locked?: boolean;
  layerIndex: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  title: string;
  type: ProjectType;
  description?: string;
  items: CanvasItem[];
  collaborators: string[];
  isPublic: boolean;
  template?: ProjectType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectCanvasProps {
  projectId?: string;
  isReadOnly?: boolean;
  onSave?: (project: Project) => void;
}

export function ProjectCanvas({ projectId, isReadOnly = false, onSave }: ProjectCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [tool, setTool] = useState<'select' | 'text' | 'note' | 'draw'>('select');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'outline' | 'timeline'>('canvas');

  // 🎯 Connect to Canvas Store
  const { documents, getDocument } = useCanvasStore();

  // Project Templates
  const projectTemplates = {
    'petition': {
      title: 'Legal Petition Template',
      items: [
        { type: 'text', content: { title: 'Petition Header', text: 'IN THE [COURT NAME]\n[CASE NUMBER]' }, x: 50, y: 50 },
        { type: 'text', content: { title: 'Parties', text: 'Petitioner:\nRespondent:' }, x: 50, y: 200 },
        { type: 'text', content: { title: 'Facts', text: 'STATEMENT OF FACTS' }, x: 400, y: 50 },
        { type: 'text', content: { title: 'Legal Arguments', text: 'ARGUMENT' }, x: 400, y: 300 },
        { type: 'note', content: { text: 'Remember to cite relevant cases' }, x: 750, y: 50 }
      ]
    },
    'business-plan': {
      title: 'Business Plan Canvas',
      items: [
        { type: 'text', content: { title: 'Executive Summary' }, x: 50, y: 50 },
        { type: 'text', content: { title: 'Market Analysis' }, x: 300, y: 50 },
        { type: 'text', content: { title: 'Products/Services' }, x: 550, y: 50 },
        { type: 'text', content: { title: 'Financial Projections' }, x: 50, y: 300 },
        { type: 'note', content: { text: 'Key Performance Indicators' }, x: 300, y: 300 }
      ]
    },
    'legal-brief': {
      title: 'Legal Brief Structure',
      items: [
        { type: 'text', content: { title: 'Issue Statement' }, x: 50, y: 50 },
        { type: 'text', content: { title: 'Brief Answer' }, x: 50, y: 150 },
        { type: 'text', content: { title: 'Statement of Facts' }, x: 50, y: 250 },
        { type: 'text', content: { title: 'Analysis' }, x: 400, y: 50 },
        { type: 'text', content: { title: 'Conclusion' }, x: 400, y: 300 }
      ]
    }
  };

  // Initialize canvas
  useEffect(() => {
    if (projectId) {
      console.log('🎯 ProjectCanvas: Loading document from canvas store:', projectId);
      const document = getDocument(projectId);
      console.log('🎯 ProjectCanvas: Found document:', document);
      
      if (document) {
        // Convert canvas document to project format
        setProject({
          id: projectId,
          title: document.title,
          type: document.contentType as ProjectType,
          description: `${document.contentType} document`,
          items: document.content ? [
            {
              id: 'main-content',
              type: 'text',
              x: 50,
              y: 50,
              width: 600,
              height: 400,
              content: {
                title: document.title,
                text: document.content
              },
              layerIndex: 1,
              createdBy: 'ai-assistant',
              createdAt: document.lastModified,
              updatedAt: document.lastModified
            }
          ] : [],
          collaborators: [],
          isPublic: false,
          createdBy: 'ai-assistant',
          createdAt: document.lastModified,
          updatedAt: document.lastModified
        });
      } else {
        console.log('🚫 ProjectCanvas: Document not found in store, loading fallback');
        // Load existing project
        loadProject(projectId);
      }
    } else {
      console.log('🎯 ProjectCanvas: No projectId provided, creating default project');
      // Create new project
      setProject({
        id: `project_${Date.now()}`,
        title: 'Untitled Project',
        type: 'custom',
        items: [],
        collaborators: [],
        isPublic: false,
        createdBy: 'current_user',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }, [projectId, documents, getDocument]);

  const loadProject = async (id: string) => {
    // In real implementation, load from backend
    // For now, mock data
    setProject({
      id,
      title: 'Legal Petition Draft',
      type: 'petition',
      description: 'Petition for preliminary injunction',
      items: [
        {
          id: '1',
          type: 'text',
          x: 100,
          y: 100,
          width: 300,
          height: 150,
          content: {
            title: 'Petition Header',
            text: 'IN THE UNITED STATES DISTRICT COURT\nFOR THE DISTRICT OF...'
          },
          layerIndex: 1,
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      collaborators: ['user1', 'user2'],
      isPublic: false,
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  const addCanvasItem = useCallback((type: CanvasItemType, position: { x: number, y: number }) => {
    if (!project || isReadOnly) return;

    const newItem: CanvasItem = {
      id: `item_${Date.now()}`,
      type,
      x: position.x,
      y: position.y,
      width: 250,
      height: type === 'note' ? 100 : 150,
      content: getDefaultContent(type),
      layerIndex: project.items.length + 1,
      createdBy: 'current_user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setProject(prev => prev ? {
      ...prev,
      items: [...prev.items, newItem],
      updatedAt: new Date()
    } : null);
  }, [project, isReadOnly]);

  const getDefaultContent = (type: CanvasItemType) => {
    switch (type) {
      case 'text':
        return { title: 'New Text Block', text: 'Start typing...' };
      case 'note':
        return { text: 'Quick note...' };
      case 'task':
        return { text: 'New task', completed: false, dueDate: null };
      case 'link':
        return { url: '', title: 'Link Title', description: '' };
      case 'comment':
        return { text: 'Add a comment...', author: 'current_user' };
      default:
        return {};
    }
  };

  const updateCanvasItem = (itemId: string, updates: Partial<CanvasItem>) => {
    if (!project || isReadOnly) return;

    setProject(prev => prev ? {
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
      updatedAt: new Date()
    } : null);
  };

  const deleteSelectedItems = () => {
    if (!project || isReadOnly || selectedItems.length === 0) return;

    setProject(prev => prev ? {
      ...prev,
      items: prev.items.filter(item => !selectedItems.includes(item.id)),
      updatedAt: new Date()
    } : null);

    setSelectedItems([]);
  };

  const duplicateSelectedItems = () => {
    if (!project || isReadOnly || selectedItems.length === 0) return;

    const itemsToDuplicate = project.items.filter(item => selectedItems.includes(item.id));
    const duplicatedItems = itemsToDuplicate.map(item => ({
      ...item,
      id: `item_${Date.now()}_${Math.random()}`,
      x: item.x + 20,
      y: item.y + 20,
      layerIndex: project.items.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    setProject(prev => prev ? {
      ...prev,
      items: [...prev.items, ...duplicatedItems],
      updatedAt: new Date()
    } : null);
  };

  const createProjectFromTemplate = (templateType: ProjectType) => {
    const template = projectTemplates[templateType];
    if (!template) return;

    const newProject: Project = {
      id: `project_${Date.now()}`,
      title: template.title,
      type: templateType,
      template: templateType,
      items: template.items.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        type: item.type as CanvasItemType,
        x: item.x,
        y: item.y,
        width: 250,
        height: 150,
        content: item.content,
        layerIndex: index + 1,
        createdBy: 'current_user',
        createdAt: new Date(),
        updatedAt: new Date()
      } as CanvasItem)),
      collaborators: [],
      isPublic: false,
      createdBy: 'current_user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setProject(newProject);
    toast.success(`Created ${template.title}`);
  };

  const exportProject = (format: 'pdf' | 'docx' | 'json') => {
    if (!project) return;

    // In real implementation, this would generate and download the file
    toast.success(`Exporting project as ${format.toUpperCase()}...`);
  };

  const renderCanvasItem = (item: CanvasItem) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <div
        key={item.id}
        className={`absolute border rounded-lg cursor-move transition-all ${
          isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
        } ${item.locked ? 'cursor-not-allowed opacity-75' : ''}`}
        style={{
          left: item.x * zoom + panOffset.x,
          top: item.y * zoom + panOffset.y,
          width: item.width * zoom,
          height: item.height * zoom,
          zIndex: item.layerIndex
        }}
        onClick={() => !isReadOnly && setSelectedItems([item.id])}
      >
        {item.type === 'text' && (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{item.content.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={item.content.text}
                onChange={(e) => updateCanvasItem(item.id, {
                  content: { ...item.content, text: e.target.value }
                })}
                className="border-none resize-none p-0 text-sm"
                disabled={isReadOnly || item.locked}
                rows={4}
              />
            </CardContent>
          </Card>
        )}

        {item.type === 'note' && (
          <div className="bg-yellow-100 border-yellow-300 p-3 h-full rounded-lg">
            <Textarea
              value={item.content.text}
              onChange={(e) => updateCanvasItem(item.id, {
                content: { ...item.content, text: e.target.value }
              })}
              className="bg-transparent border-none resize-none p-0 text-sm"
              disabled={isReadOnly || item.locked}
              placeholder="Quick note..."
              rows={3}
            />
          </div>
        )}

        {item.type === 'task' && (
          <div className="bg-white border p-3 h-full rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={item.content.completed}
                onChange={(e) => updateCanvasItem(item.id, {
                  content: { ...item.content, completed: e.target.checked }
                })}
                disabled={isReadOnly || item.locked}
              />
              <Input
                value={item.content.text}
                onChange={(e) => updateCanvasItem(item.id, {
                  content: { ...item.content, text: e.target.value }
                })}
                className="border-none p-0 text-sm"
                disabled={isReadOnly || item.locked}
              />
            </div>
            {item.content.dueDate && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.content.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {item.type === 'comment' && (
          <div className="bg-blue-50 border-blue-200 p-3 h-full rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium">{item.content.author}</span>
            </div>
            <Textarea
              value={item.content.text}
              onChange={(e) => updateCanvasItem(item.id, {
                content: { ...item.content, text: e.target.value }
              })}
              className="bg-transparent border-none resize-none p-0 text-sm"
              disabled={isReadOnly || item.locked}
              rows={2}
            />
          </div>
        )}

        {isSelected && !isReadOnly && (
          <div className="absolute -top-8 left-0 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => duplicateSelectedItems()}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => deleteSelectedItems()}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (!project) {
    return <div>Loading project...</div>;
  }

  return (
    <div className={`relative w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-screen'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Input
            value={project.title}
            onChange={(e) => setProject(prev => prev ? { ...prev, title: e.target.value } : null)}
            className="text-lg font-semibold border-none p-0 bg-transparent"
            disabled={isReadOnly}
          />
          <Badge variant="outline">{project.type}</Badge>
          {project.collaborators.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">{project.collaborators.length}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="outline">Outline</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="ghost" size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Grid className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportProject('pdf')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportProject('docx')}>
                Export as Word
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportProject('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>

          {!isReadOnly && (
            <Button onClick={() => onSave?.(project)}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Tools Panel */}
      {!isReadOnly && (
        <div className="absolute left-4 top-20 z-10 bg-white border rounded-lg p-2 shadow-lg">
          <div className="flex flex-col gap-2">
            <Button
              variant={tool === 'select' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTool('select')}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Content</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => addCanvasItem('text', { x: 100, y: 100 })}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    Text Block
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => addCanvasItem('note', { x: 150, y: 150 })}
                  >
                    <StickyNote className="h-6 w-6 mb-2" />
                    Sticky Note
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => addCanvasItem('task', { x: 200, y: 200 })}
                  >
                    <CheckSquare className="h-6 w-6 mb-2" />
                    Task
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => addCanvasItem('comment', { x: 250, y: 250 })}
                  >
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Comment
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => addCanvasItem('image', { x: 300, y: 300 })}
                  >
                    <Image className="h-6 w-6 mb-2" />
                    Image
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => addCanvasItem('link', { x: 350, y: 350 })}
                  >
                    <Link className="h-6 w-6 mb-2" />
                    Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Layers className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Project Templates</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => createProjectFromTemplate('petition')}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    Legal Petition
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => createProjectFromTemplate('business-plan')}
                  >
                    <Zap className="h-6 w-6 mb-2" />
                    Business Plan
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => createProjectFromTemplate('legal-brief')}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    Legal Brief
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={canvasRef}
          className={`relative w-full h-full bg-gray-50 ${showGrid ? 'bg-grid-pattern' : ''}`}
          style={{
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
          }}
        >
          {project.items.map(renderCanvasItem)}

          {/* Selection Rectangle */}
          {selectedItems.length > 1 && (
            <div className="absolute border-2 border-blue-500 border-dashed bg-blue-50 bg-opacity-20 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t bg-gray-50 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>{project.items.length} items</span>
          {selectedItems.length > 0 && (
            <span>{selectedItems.length} selected</span>
          )}
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
        
        <div className="flex items-center gap-2">
          {project.collaborators.map((collaborator, index) => (
            <Avatar key={index} className="h-6 w-6">
              <div className="bg-blue-500 text-white text-xs flex items-center justify-center">
                {collaborator[0].toUpperCase()}
              </div>
            </Avatar>
          ))}
          <span className="text-xs">Last saved: {project.updatedAt.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
} 