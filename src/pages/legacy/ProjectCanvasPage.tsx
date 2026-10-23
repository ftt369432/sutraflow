import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Grid, 
  Users, 
  FileText, 
  Zap, 
  Share2, 
  Download,
  Maximize2,
  Clock,
  Star,
  Folder
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/Dialog';
import { PageContainer } from '../components/ui/ResponsiveContainer';

interface ProjectCanvasDemo {
  id: string;
  title: string;
  type: 'petition' | 'business-plan' | 'legal-brief' | 'research' | 'custom';
  description: string;
  itemCount: number;
  collaborators: number;
  lastUpdated: string;
  isStarred: boolean;
  thumbnail: string;
}

export function ProjectCanvasPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Demo projects
  const demoProjects: ProjectCanvasDemo[] = [
    {
      id: '1',
      title: 'Preliminary Injunction Petition',
      type: 'petition',
      description: 'Emergency petition for preliminary injunction in contract dispute',
      itemCount: 12,
      collaborators: 3,
      lastUpdated: '2 hours ago',
      isStarred: true,
      thumbnail: '📄'
    },
    {
      id: '2',
      title: 'SaaS Business Plan 2024',
      type: 'business-plan',
      description: 'Comprehensive business plan for legal tech startup',
      itemCount: 18,
      collaborators: 5,
      lastUpdated: '1 day ago',
      isStarred: false,
      thumbnail: '📊'
    },
    {
      id: '3',
      title: 'Contract Analysis Brief',
      type: 'legal-brief',
      description: 'Legal brief analyzing vendor contract terms',
      itemCount: 8,
      collaborators: 2,
      lastUpdated: '3 days ago',
      isStarred: true,
      thumbnail: '⚖️'
    },
    {
      id: '4',
      title: 'Market Research Canvas',
      type: 'research',
      description: 'Research canvas for legal services market analysis',
      itemCount: 15,
      collaborators: 4,
      lastUpdated: '1 week ago',
      isStarred: false,
      thumbnail: '🔍'
    }
  ];

  const projectTemplates = [
    {
      type: 'petition',
      title: 'Legal Petition',
      description: 'Template for court petitions and motions',
      icon: '📄',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      type: 'business-plan',
      title: 'Business Plan',
      description: 'Comprehensive business planning canvas',
      icon: '📊',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      type: 'legal-brief',
      title: 'Legal Brief',
      description: 'Structured legal brief template',
      icon: '⚖️',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      type: 'research',
      title: 'Research Project',
      description: 'Research planning and organization',
      icon: '🔍',
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    {
      type: 'custom',
      title: 'Blank Canvas',
      description: 'Start with an empty canvas',
      icon: '✨',
      color: 'bg-gray-50 border-gray-200 text-gray-800'
    }
  ];

  const filteredProjects = demoProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || project.type === selectedType;
    return matchesSearch && matchesType;
  });

  const createProject = (templateType: string) => {
    // In real implementation, this would create a new project and navigate to the canvas
    console.log('Creating project with template:', templateType);
    navigate(`/canvas/new?template=${templateType}`);
  };

  const openProject = (projectId: string) => {
    // In real implementation, this would open the existing project
    console.log('Opening project:', projectId);
    navigate(`/canvas/${projectId}`);
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Canvas</h1>
            <p className="text-gray-600 mt-2">
              Create and collaborate on large projects with infinite canvas workspace
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Choose a Project Template</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {projectTemplates.map((template) => (
                  <Card 
                    key={template.type}
                    className={`cursor-pointer transition-all hover:shadow-md ${template.color}`}
                    onClick={() => createProject(template.type)}
                  >
                    <CardHeader className="text-center">
                      <div className="text-3xl mb-2">{template.icon}</div>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Features Banner */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
                  <Grid className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Infinite Canvas</h3>
                <p className="text-sm text-gray-600">
                  Unlimited workspace for large, complex projects
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Collaboration</h3>
                <p className="text-sm text-gray-600">
                  Work together with live cursors and instant updates
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Professional Templates</h3>
                <p className="text-sm text-gray-600">
                  Legal briefs, business plans, and custom templates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedType('all')}
            >
              All
            </Button>
            <Button
              variant={selectedType === 'petition' ? 'default' : 'outline'}
              onClick={() => setSelectedType('petition')}
            >
              Petitions
            </Button>
            <Button
              variant={selectedType === 'business-plan' ? 'default' : 'outline'}
              onClick={() => setSelectedType('business-plan')}
            >
              Business Plans
            </Button>
            <Button
              variant={selectedType === 'legal-brief' ? 'default' : 'outline'}
              onClick={() => setSelectedType('legal-brief')}
            >
              Legal Briefs
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => openProject(project.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{project.thumbnail}</div>
                    <div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {project.type.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  {project.isStarred && (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  )}
                </div>
                
                <CardDescription className="mt-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Grid className="h-4 w-4" />
                      {project.itemCount} items
                    </span>
                    
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {project.collaborators}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {project.lastUpdated}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                  
                  <Button size="sm" variant="ghost">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first project to get started'}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Choose a Project Template</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {projectTemplates.map((template) => (
                    <Card 
                      key={template.type}
                      className={`cursor-pointer transition-all hover:shadow-md ${template.color}`}
                      onClick={() => createProject(template.type)}
                    >
                      <CardHeader className="text-center">
                        <div className="text-3xl mb-2">{template.icon}</div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </PageContainer>
  );
} 