import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Brain, ChevronDown, Plus, Save, AlertTriangle, Info, Users, Calendar, Settings, ListChecks, Trash2, CheckSquare, Square } from 'lucide-react';
import { useSwarmTemplateStore } from '../store/swarmTemplateStore';
import type { SwarmTemplate, AgentRoleDefinition } from '../types/templates';
import { useSwarmStore, SwarmMember } from '../stores/swarmStore'; 
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { useToast } from '../hooks/useToast';
import { Separator } from '../components/ui/Separator';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Checkbox } from '../components/ui/Checkbox';
import { Label } from '../components/ui/Label';

// Import Capability Registry Store and defined capabilities
import { useCapabilityRegistryStore } from '../stores/capabilityRegistryStore';
import type { Capability } from '../types/capabilities';
import { createCalendarEventFromAnalysisCapability, updateCalendarEventCapability, findCalendarEventByCaseNumberCapability } from '../capabilities/calendarCapabilities';
import { analyzeEmailCapability } from '../capabilities/emailCapabilities';
import { summarizeTextCapability } from '../capabilities/documentCapabilities';

// Renamed component
const ConfigureSwarmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    templates,
    fetchSwarmTemplates,
    createSwarmTemplate,
    isLoading: templatesLoading,
    error: templatesError,
  } = useSwarmTemplateStore();

  const {
    createSwarm,
    isLoading: swarmCreationLoading,
    error: swarmCreationError,
  } = useSwarmStore();

  // Capability Registry Store
  const {
    capabilities: availableCapabilities,
    registerCapability,
    getCapabilityById,
  } = useCapabilityRegistryStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  // currentSwarmConfig now uses SwarmTemplate directly as its base for properties like name, description etc.
  const [currentSwarmConfig, setCurrentSwarmConfig] = useState<Partial<SwarmTemplate & { 
    customName?: string, 
    customDescription?: string, 
    // members are part of Swarm type, not SwarmTemplate, but useful for UI before creation
    members?: Partial<SwarmMember>[] 
  }>>({}); 

  const [showSaveAsTemplateDialog, setShowSaveAsTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateType, setNewTemplateType] = useState('general');

  // Register capabilities on mount
  useEffect(() => {
    // Check if already registered to avoid duplicates if component re-mounts (simple check by length)
    if (availableCapabilities.length === 0) {
      registerCapability(createCalendarEventFromAnalysisCapability);
      registerCapability(updateCalendarEventCapability);
      registerCapability(findCalendarEventByCaseNumberCapability);
      registerCapability(analyzeEmailCapability);
      registerCapability(summarizeTextCapability);
      console.log('Capabilities registered:', useCapabilityRegistryStore.getState().capabilities);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerCapability]); // availableCapabilities removed from deps to avoid loop, registration is one-time logic

  // Fetch all swarm templates on component mount
  useEffect(() => {
    fetchSwarmTemplates(); // Fetches all templates, no type filter
  }, [fetchSwarmTemplates]);

  // Effect to initialize from location state (e.g., from AgentWizard)
  useEffect(() => {
    if (location.state?.initialName || location.state?.initialDescription) {
      setCurrentSwarmConfig(prevConfig => ({
        ...prevConfig,
        customName: location.state.initialName || prevConfig.customName,
        customDescription: location.state.initialDescription || prevConfig.customDescription,
        name: location.state.initialName || prevConfig.name, // Also set base name
        description: location.state.initialDescription || prevConfig.description // Also set base description
      }));
      // Clear location state after consuming it
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Effect to update swarm config when a template is selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setCurrentSwarmConfig({
          // Preserve customName and customDescription if they came from route state
          customName: currentSwarmConfig.customName,
          customDescription: currentSwarmConfig.customDescription,
          // Populate from template
          ...template,
          // Ensure roles are mapped to a structure that can be edited if needed, or used for display
          members: template.roles.map(roleDef => ({
            name: roleDef.roleName, // Or a default name placeholder
            role: roleDef.roleName,
            status: 'pending' as SwarmMember['status'],
            capabilities: roleDef.requiredCapabilities,
          }))
        });
      }
    } else {
      // If no template is selected, retain customName/Description but clear other template-specific fields
      setCurrentSwarmConfig(prevConfig => ({
        customName: prevConfig.customName,
        customDescription: prevConfig.customDescription,
        name: prevConfig.customName || '', // Default to customName or empty
        description: prevConfig.customDescription || '', // Default to customDescription or empty
        roles: [],
        members: [],
        defaultInstructions: '',
        templateType: 'general' // Default type if no template
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId, templates]); // currentSwarmConfig.customName/Description removed from deps to avoid loop

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'swarmName') {
      setCurrentSwarmConfig(prev => ({ ...prev, customName: value, name: value }));
    } else if (name === 'swarmDescription') {
      setCurrentSwarmConfig(prev => ({ ...prev, customDescription: value, description: value }));
    } else {
        setCurrentSwarmConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRoleChange = (index: number, field: keyof AgentRoleDefinition, value: string | string[]) => {
    const updatedRoles = [...(currentSwarmConfig.roles || [])];
    if (updatedRoles[index]) {
      // Updated to ensure requiredCapabilities are treated as string[] for capability IDs
      if (field === 'requiredCapabilities') {
        if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
          updatedRoles[index] = { ...updatedRoles[index], [field]: value as string[] };
        } else {
          console.warn('Invalid value type for requiredCapabilities, expected string[]');
          return; // Do not update if the type is wrong
        }
      } else if (typeof value === 'string') {
        (updatedRoles[index] as any)[field] = value; 
      } else {
        // Handle other types if necessary, or log a warning
        console.warn(`Unhandled value type for role field ${field}:`, value);
        return;
      }
      
      const updatedMembers = updatedRoles.map(roleDef => ({
        name: roleDef.roleName, 
        role: roleDef.roleName,
        status: 'pending' as SwarmMember['status'],
        capabilities: roleDef.requiredCapabilities, // This is now string[] of capability IDs
      }));

      setCurrentSwarmConfig(prev => ({ ...prev, roles: updatedRoles, members: updatedMembers as Partial<SwarmMember>[] }));
    }
  };

  const addRole = () => {
    const newRole: AgentRoleDefinition = { roleName: '', description: '', requiredCapabilities: [] };
    const updatedRoles = [...(currentSwarmConfig.roles || []), newRole];
    const updatedMembers = updatedRoles.map(roleDef => ({
        name: roleDef.roleName || `Agent ${updatedRoles.length}`,
        role: roleDef.roleName || 'New Role',
        status: 'pending' as SwarmMember['status'],
        capabilities: roleDef.requiredCapabilities,
      }));
    setCurrentSwarmConfig(prev => ({ ...prev, roles: updatedRoles, members: updatedMembers as Partial<SwarmMember>[] }));
  };

  const removeRole = (index: number) => {
    const updatedRoles = (currentSwarmConfig.roles || []).filter((_, i) => i !== index);
    const updatedMembers = updatedRoles.map(roleDef => ({
        name: roleDef.roleName, 
        role: roleDef.roleName,
        status: 'pending' as SwarmMember['status'],
        capabilities: roleDef.requiredCapabilities,
      }));
    setCurrentSwarmConfig(prev => ({ ...prev, roles: updatedRoles, members: updatedMembers as Partial<SwarmMember>[] }));
  };

  const handleCreateSwarm = async () => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    if (!currentSwarmConfig.name) {
      toast({ title: "Error", description: "Swarm name is required.", variant: "destructive" });
      return;
    }
    if (!currentSwarmConfig.roles || currentSwarmConfig.roles.length === 0) {
        toast({ title: "Error", description: "At least one role must be defined for the swarm.", variant: "destructive" });
        return;
    }

    const membersToCreate: SwarmMember[] = (currentSwarmConfig.roles || []).map((roleDef, index) => ({
      id: `member-${Date.now()}-${index}`,
      name: roleDef.roleName || `Agent ${index + 1}`,
      role: roleDef.roleName || 'Undefined Role',
      status: 'pending' as SwarmMember['status'],
      capabilities: roleDef.requiredCapabilities || [],
      // performance, tasksCompleted will be set by the system or agent later
    }));

    const swarmDataToCreate = {
      name: currentSwarmConfig.customName || currentSwarmConfig.name || 'Unnamed Swarm',
      description: currentSwarmConfig.customDescription || currentSwarmConfig.description || '',
      members: membersToCreate,
      creatorId: user.id,
      status: 'creating', // Initial status
      type: currentSwarmConfig.templateType || 'general',
      efficiency: 0, // Initial efficiency
      executionLog: [`[${new Date().toISOString()}] Swarm creation initialized by ${user.email}`],
      // defaultInstructions could come from currentSwarmConfig.defaultInstructions
      config: {
        roles: currentSwarmConfig.roles, // Save the role definitions used for creation
        defaultInstructions: currentSwarmConfig.defaultInstructions,
      }
    };

    const createdSwarm = await createSwarm(swarmDataToCreate as any); // Using any for now, define a SwarmCreationPayload type later

    if (createdSwarm) {
      toast({ title: "Success", description: `Swarm "${createdSwarm.name}" created successfully.` });
      navigate('/automation', { state: { tab: 'swarms' } }); // Navigate to AI Workspace, Swarms tab
    } else {
      toast({ title: "Error", description: swarmCreationError || "Failed to create swarm.", variant: "destructive" });
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!currentSwarmConfig.name || !(currentSwarmConfig.roles && currentSwarmConfig.roles.length > 0)) {
        toast({ title: "Error", description: "Template name and at least one role are required.", variant: "destructive" });
        return;
    }

    const templateToSave: Partial<SwarmTemplate> = {
        name: newTemplateName || currentSwarmConfig.name, // Use dialog input or current config name
        description: newTemplateDescription || currentSwarmConfig.description || '',
        templateType: newTemplateType || currentSwarmConfig.templateType || 'general',
        roles: currentSwarmConfig.roles.map(r => ({ // Ensure roles are clean AgentRoleDefinition
            roleName: r.roleName,
            description: r.description,
            requiredCapabilities: r.requiredCapabilities,
            minAgents: r.minAgents,
            maxAgents: r.maxAgents
        })),
        defaultInstructions: currentSwarmConfig.defaultInstructions || '',
        creatorId: user?.id,
        isSystemTemplate: false, // User-created templates are not system templates
    };

    const newTemplate = await createSwarmTemplate(templateToSave as SwarmTemplate);
    if (newTemplate) {
        toast({ title: "Success", description: `Template "${newTemplate.name}" saved.` });
        setShowSaveAsTemplateDialog(false);
        setNewTemplateName('');
        setNewTemplateDescription('');
        // Optionally, select the new template or refresh list
        if (templatesLoading) { // Check if templatesLoading is true before calling fetchSwarmTemplates
            await fetchSwarmTemplates(); // Re-fetch to include the new one
        }
    } else {
        toast({ title: "Error", description: templatesError || "Failed to save template.", variant: "destructive" });
    }
  };

  const openSaveAsTemplateDialog = () => {
    setNewTemplateName(currentSwarmConfig.customName || currentSwarmConfig.name || '');
    setNewTemplateDescription(currentSwarmConfig.customDescription || currentSwarmConfig.description || '');
    setNewTemplateType(currentSwarmConfig.templateType || 'general');
    setShowSaveAsTemplateDialog(true);
  };
  
  // New handler for capability checkbox changes
  const handleCapabilitySelectionChange = (roleIndex: number, capabilityId: string, isSelected: boolean) => {
    const currentRoles = currentSwarmConfig.roles || [];
    const roleToUpdate = currentRoles[roleIndex];
    if (!roleToUpdate) return;

    let newCapabilities = [...(roleToUpdate.requiredCapabilities || [])];

    if (isSelected) {
      if (!newCapabilities.includes(capabilityId)) {
        newCapabilities.push(capabilityId);
      }
    } else {
      newCapabilities = newCapabilities.filter(id => id !== capabilityId);
    }
    // Call the existing handleRoleChange to update the state
    handleRoleChange(roleIndex, 'requiredCapabilities', newCapabilities);
  };

  if (templatesLoading && !selectedTemplateId) {
    return <div className="flex items-center justify-center h-screen">Loading templates...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center">
              <Brain className="mr-2 h-6 w-6 text-blue-500" /> Configure Swarm
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId || ''}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Load from Template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesError && <SelectItem value="error">Error loading templates</SelectItem>}
                  {!templatesLoading && templates.length === 0 && <SelectItem value="empty">No templates available</SelectItem>}
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.templateType || 'General'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            Design your autonomous agent swarm. Start from scratch or load a template to pre-configure roles and capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="swarmName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Swarm Name
            </label>
            <Input
              id="swarmName"
              name="swarmName"
              value={currentSwarmConfig.customName ?? currentSwarmConfig.name ?? ''}
              onChange={handleInputChange}
              placeholder="e.g., 'Document Analysis Team', 'Client Outreach Unit'"
              className="text-lg"
            />
          </div>
          <div>
            <label htmlFor="swarmDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Swarm Mission / Goal
            </label>
            <Textarea
              id="swarmDescription"
              name="swarmDescription"
              value={currentSwarmConfig.customDescription ?? currentSwarmConfig.description ?? ''}
              onChange={handleInputChange}
              placeholder="Describe the primary objective or task for this swarm."
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="defaultInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Overall Instructions / Context
            </label>
            <Textarea
              id="defaultInstructions"
              name="defaultInstructions"
              value={currentSwarmConfig.defaultInstructions || ''}
              onChange={handleInputChange}
              placeholder="Provide general guidelines, context, or data sources for all agents in the swarm."
              rows={4}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="mr-2 h-5 w-5 text-green-500" /> Agent Roles & Capabilities
            </h3>
            {(currentSwarmConfig.roles || []).map((role, index) => (
              <Card key={index} className="bg-slate-50 dark:bg-slate-800/50 p-0">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md">Role {index + 1}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeRole(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  <div>
                    <label htmlFor={`roleName-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400">Role Name</label>
                    <Input
                      id={`roleName-${index}`}
                      value={role.roleName}
                      onChange={(e) => handleRoleChange(index, 'roleName', e.target.value)}
                      placeholder="e.g., 'Lead Researcher', 'Drafting Specialist'"
                    />
                  </div>
                  <div>
                    <label htmlFor={`roleDescription-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400">Role Description</label>
                    <Textarea
                      id={`roleDescription-${index}`}
                      value={role.description}
                      onChange={(e) => handleRoleChange(index, 'description', e.target.value)}
                      placeholder="Describe responsibilities for this role."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Required Capabilities</label>
                    <ScrollArea className="h-40 w-full rounded-md border p-2">
                      <div className="space-y-2">
                        {availableCapabilities.length === 0 && (
                          <p className="text-xs text-gray-500">No capabilities registered or available.</p>
                        )}
                        {availableCapabilities.map(capability => (
                          <div key={capability.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`capability-${index}-${capability.id}`}
                              checked={(role.requiredCapabilities || []).includes(capability.id)}
                              onCheckedChange={(checked) => {
                                handleCapabilitySelectionChange(index, capability.id, !!checked);
                              }}
                            />
                            <Label htmlFor={`capability-${index}-${capability.id}`} className="text-sm font-normal cursor-pointer">
                              {capability.name}
                              <p className="text-xs text-gray-500 dark:text-gray-400">{capability.description}</p>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={addRole} variant="outline" className="mt-2">
              <Plus className="mr-2 h-4 w-4" /> Add Role
            </Button>
          </div>
          
          {currentSwarmConfig.roles && currentSwarmConfig.roles.length > 0 && (
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Swarm Members Preview</AlertTitle>
                <AlertDescription>
                Based on the roles defined, the following agent members will be part of the swarm upon creation. Specific agents will be assigned or instantiated by the system.
                {(currentSwarmConfig.members || []).map((member, idx) => (
                    <div key={idx} className="mt-2 p-2 border rounded-md text-xs">
                        <strong>{member.name || `Agent ${idx + 1}`}</strong> (Role: {member.role || 'N/A'})
                        <br />Capabilities: {(member.capabilities || []).map(capId => getCapabilityById(capId)?.name || capId).join(', ') || 'None specified'}
                    </div>
                ))}
                </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={openSaveAsTemplateDialog}>
            <Save className="mr-2 h-4 w-4" /> Save as Template
          </Button>
          <Button onClick={handleCreateSwarm} disabled={swarmCreationLoading}>
            {swarmCreationLoading ? 'Creating Swarm...' : <><Brain className="mr-2 h-4 w-4" /> Create Swarm</>}
          </Button>
        </CardFooter>
      </Card>

      {showSaveAsTemplateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Swarm Configuration as Template</CardTitle>
              <CardDescription>Save the current roles and instructions as a reusable template.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="newTemplateName" className="block text-sm font-medium">Template Name</label>
                <Input
                  id="newTemplateName"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., 'Standard Document Review Swarm'"
                />
              </div>
              <div>
                <label htmlFor="newTemplateDescription" className="block text-sm font-medium">Template Description</label>
                <Textarea
                  id="newTemplateDescription"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Describe what this template is for."
                  rows={3}
                />
              </div>
               <div>
                <label htmlFor="newTemplateType" className="block text-sm font-medium">Template Type</label>
                <Select value={newTemplateType} onValueChange={setNewTemplateType}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="email">Email Management</SelectItem> 
                        {/* Add more types as needed */}
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowSaveAsTemplateDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveAsTemplate} disabled={templatesLoading}>
                {templatesLoading ? 'Saving...' : 'Save Template'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ConfigureSwarmPage; // It's a default export! 