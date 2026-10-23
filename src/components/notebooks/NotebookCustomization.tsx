import React, { useState } from 'react';
import { 
  Layout, 
  Palette, 
  Layers, 
  Sliders, 
  BookOpen, 
  Briefcase, 
  GraduationCap, 
  Home,
  Code,
  FileText,
  Save,
  RotateCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Notebook } from '../../types/notebook';
import { useNotebookStore } from '../../store/notebookStore';

type NotebookPurpose = 'business' | 'education' | 'personal' | 'research' | 'creative' | 'custom';
type NotebookLayout = 'standard' | 'kanban' | 'timeline' | 'mindmap' | 'document';

interface NotebookSettings {
  purpose: NotebookPurpose;
  layout: NotebookLayout;
  features: {
    aiAssistant: boolean;
    taskIntegration: boolean;
    calendarIntegration: boolean;
    collaborationTools: boolean;
    codeBlocks: boolean;
    mathEquations: boolean;
    drawingTools: boolean;
    attachments: boolean;
    tags: boolean;
    tableOfContents: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    fontFamily: string;
    compact: boolean;
  };
}

interface NotebookCustomizationProps {
  notebook: Notebook;
  onClose: () => void;
}

export const NotebookCustomization: React.FC<NotebookCustomizationProps> = ({
  notebook,
  onClose
}) => {
  const { updateNotebook } = useNotebookStore();
  const [settings, setSettings] = useState<NotebookSettings>({
    purpose: (notebook.metadata?.purpose as NotebookPurpose) || 'personal',
    layout: (notebook.metadata?.layout as NotebookLayout) || 'standard',
    features: {
      aiAssistant: notebook.metadata?.features?.aiAssistant !== false,
      taskIntegration: notebook.metadata?.features?.taskIntegration || false,
      calendarIntegration: notebook.metadata?.features?.calendarIntegration || false,
      collaborationTools: notebook.metadata?.features?.collaborationTools || false,
      codeBlocks: notebook.metadata?.features?.codeBlocks || false,
      mathEquations: notebook.metadata?.features?.mathEquations || false,
      drawingTools: notebook.metadata?.features?.drawingTools || false,
      attachments: notebook.metadata?.features?.attachments || false,
      tags: notebook.metadata?.features?.tags !== false,
      tableOfContents: notebook.metadata?.features?.tableOfContents || false,
    },
    appearance: {
      theme: (notebook.metadata?.appearance?.theme as 'light' | 'dark' | 'system') || 'system',
      accentColor: notebook.metadata?.appearance?.accentColor || '#0ea5e9',
      fontFamily: notebook.metadata?.appearance?.fontFamily || 'Inter',
      compact: notebook.metadata?.appearance?.compact || false,
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  const setPurpose = (purpose: NotebookPurpose) => {
    // Apply default settings based on purpose
    const newSettings = { ...settings, purpose };
    
    switch (purpose) {
      case 'business':
        newSettings.features = {
          ...newSettings.features,
          taskIntegration: true,
          calendarIntegration: true,
          collaborationTools: true,
          tags: true,
          tableOfContents: true,
        };
        newSettings.layout = 'standard';
        break;
      
      case 'education':
        newSettings.features = {
          ...newSettings.features,
          mathEquations: true,
          attachments: true,
          tags: true,
          tableOfContents: true,
        };
        newSettings.layout = 'standard';
        break;
        
      case 'research':
        newSettings.features = {
          ...newSettings.features,
          aiAssistant: true,
          codeBlocks: true,
          mathEquations: true,
          attachments: true,
          tags: true,
          tableOfContents: true,
        };
        break;
        
      case 'creative':
        newSettings.features = {
          ...newSettings.features,
          drawingTools: true,
          attachments: true,
        };
        newSettings.layout = 'mindmap';
        break;
    }
    
    setSettings(newSettings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    await updateNotebook(notebook.id, {
      metadata: {
        ...notebook.metadata,
        purpose: settings.purpose,
        layout: settings.layout,
        features: settings.features,
        appearance: settings.appearance
      }
    });
    
    setIsSaving(false);
    onClose();
  };

  const renderPurposeCard = (
    purpose: NotebookPurpose,
    title: string,
    description: string,
    icon: React.ReactNode
  ) => (
    <Card 
      className={`cursor-pointer transition-all hover:border-primary ${settings.purpose === purpose ? 'border-primary bg-primary/5' : ''}`}
      onClick={() => setPurpose(purpose)}
    >
      <CardContent className="p-4 flex items-start space-x-4">
        <div className={`p-2 rounded-md ${settings.purpose === purpose ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
          {icon}
        </div>
        <div className="space-y-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  const FeatureToggle = ({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <Label htmlFor={id} className="flex-1">{label}</Label>
      <Switch 
        id={id} 
        checked={checked} 
        onCheckedChange={onChange} 
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Customize Notebook</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="purpose">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="purpose">
            <BookOpen className="mr-2 h-4 w-4" />
            Purpose
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="mr-2 h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="features">
            <Layers className="mr-2 h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purpose" className="space-y-4">
          <p className="text-muted-foreground mb-4">
            Choose a purpose for your notebook to apply optimized settings automatically.
            You can further customize these settings in the other tabs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderPurposeCard(
              'business',
              'Business',
              'For meetings, projects, and work-related notes with task management.',
              <Briefcase className="h-5 w-5" />
            )}
            
            {renderPurposeCard(
              'education',
              'Education',
              'For courses, studying, and academic note-taking.',
              <GraduationCap className="h-5 w-5" />
            )}
            
            {renderPurposeCard(
              'personal',
              'Personal',
              'For everyday notes, ideas, and personal organization.',
              <Home className="h-5 w-5" />
            )}
            
            {renderPurposeCard(
              'research',
              'Research',
              'For collecting research, citations, and academic writing.',
              <BookOpen className="h-5 w-5" />
            )}
            
            {renderPurposeCard(
              'creative',
              'Creative',
              'For brainstorming, ideation, and creative projects.',
              <Palette className="h-5 w-5" />
            )}
            
            {renderPurposeCard(
              'custom',
              'Custom',
              'Create your own custom setup with specific features.',
              <Sliders className="h-5 w-5" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <p className="text-muted-foreground mb-4">
            Choose how your notebook content is displayed and organized.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-all hover:border-primary ${settings.layout === 'standard' ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setSettings({...settings, layout: 'standard'})}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-2 rounded-md mb-3 ${settings.layout === 'standard' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <h4 className="font-medium">Standard</h4>
                <p className="text-sm text-muted-foreground">Traditional notebook with sections and blocks</p>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:border-primary ${settings.layout === 'kanban' ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setSettings({...settings, layout: 'kanban'})}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-2 rounded-md mb-3 ${settings.layout === 'kanban' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="font-medium">Kanban</h4>
                <p className="text-sm text-muted-foreground">Visual board with cards in columns</p>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:border-primary ${settings.layout === 'timeline' ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setSettings({...settings, layout: 'timeline'})}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-2 rounded-md mb-3 ${settings.layout === 'timeline' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                  <Code className="h-5 w-5" />
                </div>
                <h4 className="font-medium">Timeline</h4>
                <p className="text-sm text-muted-foreground">Chronological view with events and milestones</p>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:border-primary ${settings.layout === 'mindmap' ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setSettings({...settings, layout: 'mindmap'})}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-2 rounded-md mb-3 ${settings.layout === 'mindmap' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                  <Code className="h-5 w-5" />
                </div>
                <h4 className="font-medium">Mind Map</h4>
                <p className="text-sm text-muted-foreground">Visual diagram for connected ideas and concepts</p>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:border-primary ${settings.layout === 'document' ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setSettings({...settings, layout: 'document'})}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-2 rounded-md mb-3 ${settings.layout === 'document' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <h4 className="font-medium">Document</h4>
                <p className="text-sm text-muted-foreground">Continuous document with headings and formatting</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <p className="text-muted-foreground mb-4">
            Enable or disable features for this notebook.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h3 className="text-base font-medium mb-2">Productivity</h3>
              
              <FeatureToggle 
                id="aiAssistant"
                label="AI Assistant"
                checked={settings.features.aiAssistant}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, aiAssistant: checked}
                })}
              />
              
              <FeatureToggle 
                id="taskIntegration"
                label="Task Integration"
                checked={settings.features.taskIntegration}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, taskIntegration: checked}
                })}
              />
              
              <FeatureToggle 
                id="calendarIntegration"
                label="Calendar Integration"
                checked={settings.features.calendarIntegration}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, calendarIntegration: checked}
                })}
              />
              
              <FeatureToggle 
                id="tableOfContents"
                label="Table of Contents"
                checked={settings.features.tableOfContents}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, tableOfContents: checked}
                })}
              />
              
              <FeatureToggle 
                id="tags"
                label="Tags"
                checked={settings.features.tags}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, tags: checked}
                })}
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-medium mb-2">Content Types</h3>
              
              <FeatureToggle 
                id="codeBlocks"
                label="Code Blocks"
                checked={settings.features.codeBlocks}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, codeBlocks: checked}
                })}
              />
              
              <FeatureToggle 
                id="mathEquations"
                label="Math Equations"
                checked={settings.features.mathEquations}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, mathEquations: checked}
                })}
              />
              
              <FeatureToggle 
                id="drawingTools"
                label="Drawing Tools"
                checked={settings.features.drawingTools}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, drawingTools: checked}
                })}
              />
              
              <FeatureToggle 
                id="attachments"
                label="Attachments"
                checked={settings.features.attachments}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, attachments: checked}
                })}
              />
              
              <FeatureToggle 
                id="collaborationTools"
                label="Collaboration Tools"
                checked={settings.features.collaborationTools}
                onChange={(checked) => setSettings({
                  ...settings,
                  features: {...settings.features, collaborationTools: checked}
                })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <p className="text-muted-foreground mb-4">
            Customize the look and feel of your notebook.
          </p>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={settings.appearance.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => 
                  setSettings({
                    ...settings, 
                    appearance: {...settings.appearance, theme: value}
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                {[
                  "#0ea5e9", // Blue
                  "#6366f1", // Indigo
                  "#8b5cf6", // Violet
                  "#d946ef", // Pink
                  "#ec4899", // Fuchsia
                  "#ef4444", // Red
                  "#f97316", // Orange
                  "#f59e0b", // Amber
                  "#10b981", // Emerald
                  "#14b8a6", // Teal
                ].map(color => (
                  <div 
                    key={color}
                    className={`w-8 h-8 rounded-full cursor-pointer ${settings.appearance.accentColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSettings({
                      ...settings,
                      appearance: {...settings.appearance, accentColor: color}
                    })}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select 
                value={settings.appearance.fontFamily}
                onValueChange={(value) => 
                  setSettings({
                    ...settings, 
                    appearance: {...settings.appearance, fontFamily: value}
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                  <SelectItem value="Serif">Serif</SelectItem>
                  <SelectItem value="Mono">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <FeatureToggle 
                id="compact"
                label="Compact Mode"
                checked={settings.appearance.compact}
                onChange={(checked) => setSettings({
                  ...settings,
                  appearance: {...settings.appearance, compact: checked}
                })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 