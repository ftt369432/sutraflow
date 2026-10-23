import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/Tabs';
import { 
  Brain,
  Copy, 
  Download, 
  Check, 
  Plus,
  X,
  Trash2,
  MoveUp,
  MoveDown,
  Edit2,
  Save
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/Accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { useToast } from '../../hooks/useToast';

// Using a regular JavaScript animation library as a substitute for react-spring
// If you need react-spring functionality, you'll need to install it
const animatedDivStyle = {
  transition: 'opacity 0.3s, transform 0.3s',
  opacity: 1,
  transform: 'translateY(0)'
};

interface PromptSection {
  id: string;
  title: string;
  content: string;
  type: 'instruction' | 'context' | 'example' | 'persona' | 'constraint';
  enabled: boolean;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  sections: PromptSection[];
}

const SECTION_TYPES = [
  { value: 'instruction', label: 'Instructions', description: 'What the AI should do' },
  { value: 'context', label: 'Context', description: 'Background information' },
  { value: 'example', label: 'Examples', description: 'Sample interactions' },
  { value: 'persona', label: 'Persona', description: 'How the AI should behave' },
  { value: 'constraint', label: 'Constraints', description: 'Limitations on responses' },
];

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'customer-support',
    name: 'Customer Support Agent',
    description: 'Professional, helpful support agent template',
    sections: [
      {
        id: 'persona-1',
        title: 'Agent Persona',
        content: 'You are a helpful, friendly customer support agent. You speak in a professional but warm manner.',
        type: 'persona',
        enabled: true
      },
      {
        id: 'instruction-1',
        title: 'Primary Goal',
        content: 'Help customers resolve their issues efficiently and accurately. Prioritize customer satisfaction while following company policies.',
        type: 'instruction',
        enabled: true
      },
      {
        id: 'constraint-1',
        title: 'Response Constraints',
        content: 'Keep responses concise and focused. Don\'t make promises about features or timelines unless explicitly mentioned in available knowledge.',
        type: 'constraint',
        enabled: true
      }
    ]
  },
  {
    id: 'legal-assistant',
    name: 'Legal Assistant',
    description: 'Professional legal assistant with disclaimers',
    sections: [
      {
        id: 'persona-1',
        title: 'Assistant Persona',
        content: 'You are a legal research assistant trained to help with legal questions. You are professional and precise in your language.',
        type: 'persona',
        enabled: true
      },
      {
        id: 'constraint-1', 
        title: 'Disclaimers',
        content: 'You must include a disclaimer that your responses are for informational purposes only and do not constitute legal advice. Always recommend consulting with a licensed attorney for specific legal situations.',
        type: 'constraint',
        enabled: true
      },
      {
        id: 'instruction-1',
        title: 'Research Focus',
        content: 'Focus on providing factual information about laws, regulations, and legal concepts. Cite sources when possible.',
        type: 'instruction',
        enabled: true
      }
    ]
  },
  {
    id: 'custom',
    name: 'Custom Template',
    description: 'Start from scratch with your own sections',
    sections: [
      {
        id: 'instruction-1',
        title: 'Primary Instructions',
        content: 'Write your main instructions here.',
        type: 'instruction',
        enabled: true
      }
    ]
  }
];

interface VisualPromptBuilderProps {
  initialPrompt?: string;
  onChange: (prompt: string) => void;
}

export function VisualPromptBuilder({ initialPrompt = '', onChange }: VisualPromptBuilderProps) {
  const [activeTab, setActiveTab] = useState<string>('builder');
  const [rawPrompt, setRawPrompt] = useState<string>(initialPrompt);
  const [sections, setSections] = useState<PromptSection[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState<string>('');
  const [newSectionContent, setNewSectionContent] = useState<string>('');
  const [newSectionType, setNewSectionType] = useState<PromptSection['type']>('instruction');
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const modelOptions = [
    { id: 'model-1', name: 'Model 1' },
    { id: 'model-2', name: 'Model 2' },
    { id: 'model-3', name: 'Model 3' },
  ];

  // Convert raw prompt to sections on initial load
  useEffect(() => {
    if (initialPrompt && sections.length === 0) {
      // Simple heuristic to convert raw prompt to sections
      const lines = initialPrompt.trim().split('\n\n').filter(l => l.trim());
      const newSections: PromptSection[] = lines.map((line, index) => {
        // Try to infer section type and title
        let type: PromptSection['type'] = 'instruction';
        let title = `Section ${index + 1}`;
        
        if (line.toLowerCase().includes('you are') || line.toLowerCase().includes('behave as')) {
          type = 'persona';
          title = 'Persona';
        } else if (line.toLowerCase().includes('example') || line.toLowerCase().startsWith('user:')) {
          type = 'example';
          title = 'Example';
        } else if (line.toLowerCase().includes('context') || line.toLowerCase().includes('background')) {
          type = 'context';
          title = 'Context';
        } else if (line.toLowerCase().includes('never') || line.toLowerCase().includes('don\'t') || line.toLowerCase().includes('avoid')) {
          type = 'constraint';
          title = 'Constraints';
        }
        
        return {
          id: `section-${index}`,
          title,
          content: line.trim(),
          type,
          enabled: true,
        };
      });
      
      setSections(newSections);
    }
  }, [initialPrompt]);

  // Update raw prompt when sections change
  useEffect(() => {
    const newRawPrompt = sections
      .filter(s => s.enabled)
      .map(s => s.content)
      .join('\n\n');
    
    setRawPrompt(newRawPrompt);
    onChange(newRawPrompt);
  }, [sections, onChange]);

  // Handle direct raw prompt edits
  const handleRawPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setRawPrompt(newPrompt);
    onChange(newPrompt);
  };

  // Copy prompt to clipboard
  const copyPrompt = () => {
    navigator.clipboard.writeText(rawPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "The system prompt has been copied to your clipboard.",
      duration: 2000,
    });
  };

  // Download prompt as .txt file
  const downloadPrompt = () => {
    const element = document.createElement('a');
    const file = new Blob([rawPrompt], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'system-prompt.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Downloaded",
      description: "System prompt saved as system-prompt.txt",
      duration: 2000,
    });
  };

  // Apply a template
  const applyTemplate = (templateId: string) => {
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSections([...template.sections]);
      setSelectedTemplate(templateId);
    }
  };

  // Add a new section
  const addSection = () => {
    if (!newSectionTitle.trim() || !newSectionContent.trim()) return;
    
    const newSection: PromptSection = {
      id: `section-${Date.now()}`,
      title: newSectionTitle,
      content: newSectionContent,
      type: newSectionType,
      enabled: true,
    };
    
    setSections([...sections, newSection]);
    
    // Reset form
    setNewSectionTitle('');
    setNewSectionContent('');
    setNewSectionType('instruction');
  };

  // Delete a section
  const deleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  // Toggle section enabled/disabled
  const toggleSection = (id: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  // Move section up
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    setSections(newSections);
  };

  // Move section down
  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;
    setSections(newSections);
  };

  // Start editing a section
  const startEditingSection = (section: PromptSection) => {
    setEditingSectionId(section.id);
    setNewSectionTitle(section.title);
    setNewSectionContent(section.content);
    setNewSectionType(section.type);
  };

  // Save section edits
  const saveSection = () => {
    if (!editingSectionId || !newSectionTitle.trim() || !newSectionContent.trim()) return;
    
    setSections(sections.map(s => 
      s.id === editingSectionId 
        ? { 
            ...s, 
            title: newSectionTitle, 
            content: newSectionContent,
            type: newSectionType
          } 
        : s
    ));
    
    // Reset editing state
    setEditingSectionId(null);
    setNewSectionTitle('');
    setNewSectionContent('');
    setNewSectionType('instruction');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSectionId(null);
    setNewSectionTitle('');
    setNewSectionContent('');
    setNewSectionType('instruction');
  };

  const getSectionTypeColor = (type: PromptSection['type']) => {
    switch (type) {
      case 'instruction':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'context':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
      case 'example':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      case 'persona':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
      case 'constraint':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">
            Visual Builder
          </TabsTrigger>
          <TabsTrigger value="raw">
            Raw Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          {/* Template Selection */}
          <div className="mb-4">
            <Label>Start with a template</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {DEFAULT_TEMPLATES.map(template => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedTemplate === template.id ? 'border-2 border-primary' : ''
                  }`}
                  onClick={() => applyTemplate(template.id)}
                >
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {template.sections.map(section => (
                        <Badge key={section.id} variant="outline" className="text-xs">
                          {section.type}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Section List */}
          {sections.length > 0 ? (
            <div style={animatedDivStyle} className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Prompt Sections ({sections.filter(s => s.enabled).length}/{sections.length} enabled)</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyPrompt}
                  >
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={downloadPrompt}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <Card 
                    key={section.id}
                    className={`border transition-opacity ${!section.enabled ? 'opacity-60' : ''}`}
                  >
                    <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={section.enabled} 
                          onCheckedChange={() => toggleSection(section.id)} 
                        />
                        <div>
                          <CardTitle className="text-sm flex items-center gap-2">
                            {section.title}
                            <Badge className={`text-xs ${getSectionTypeColor(section.type)}`}>
                              {section.type}
                            </Badge>
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => moveSectionUp(index)}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => moveSectionDown(index)}
                          disabled={index === sections.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => startEditingSection(section)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" 
                          onClick={() => deleteSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Brain className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg">No Prompt Sections Yet</h3>
                <p className="text-muted-foreground mb-4">Add sections to build your system prompt.</p>
              </CardContent>
            </Card>
          )}

          {/* Add/Edit Section Form */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">
                {editingSectionId ? 'Edit Section' : 'Add New Section'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="section-title">Section Title</Label>
                  <Input
                    id="section-title"
                    placeholder="e.g., Primary Instructions"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section-type">Section Type</Label>
                  <Select 
                    value={newSectionType} 
                    onValueChange={(value: string) => setNewSectionType(value as PromptSection['type'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <span>{type.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">({type.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="section-content">Content</Label>
                <Textarea
                  id="section-content"
                  placeholder="Write the content for this section..."
                  className="min-h-[120px]"
                  value={newSectionContent}
                  onChange={(e) => setNewSectionContent(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                {editingSectionId && (
                  <Button variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={editingSectionId ? saveSection : addSection}
                  disabled={!newSectionTitle.trim() || !newSectionContent.trim()}
                >
                  {editingSectionId ? (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Section
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <div className="flex justify-between items-center mb-3">
            <Label htmlFor="raw-prompt" className="text-sm font-medium">Raw System Prompt</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyPrompt}
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadPrompt}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
          <Textarea
            id="raw-prompt"
            value={rawPrompt}
            onChange={handleRawPromptChange}
            placeholder="Enter your system prompt..."
            className="min-h-[400px] font-mono text-sm resize-y"
          />
        </TabsContent>
      </Tabs>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tips">
          <AccordionTrigger className="text-sm">
            Tips for effective system prompts
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-2">
            <p>• Create a clear persona to establish the assistant's tone and style</p>
            <p>• Be specific about the assistant's expertise and limitations</p>
            <p>• Include examples of ideal responses when appropriate</p>
            <p>• Specify constraints to prevent unwanted behaviors</p>
            <p>• Consider adding context about the user's needs when relevant</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex items-center space-x-2">
        <Select 
          value={String(selectedModel)} 
          onValueChange={(value: string) => setSelectedModel(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}