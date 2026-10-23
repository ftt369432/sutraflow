import { useState, useEffect, useCallback } from 'react';
import { TemplateService } from '../services/agents/templates/TemplateService';
import { Template } from '../services/agents/types/AgentTypes';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './useToast';

export interface UseTemplateManagerReturn {
  templates: Template[];
  userTemplates: Template[];
  publicTemplates: Template[];
  loading: boolean;
  refreshing: boolean;
  
  // Template management
  createTemplate: (templateData: CreateTemplateData) => Promise<string>;
  updateTemplate: (templateId: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (templateId: string, newName: string) => Promise<string>;
  
  // Template loading
  loadUserTemplates: () => Promise<void>;
  loadPublicTemplates: () => Promise<void>;
  loadAllTemplates: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  
  // Template search and filtering
  searchTemplates: (query: string, profession?: string, type?: string) => Template[];
  getTemplatesByProfession: (profession: string) => Template[];
  getTemplatesByType: (type: string) => Template[];
  
  // Template validation
  validateTemplate: (content: string) => TemplateValidation;
  extractVariables: (content: string) => string[];
}

export interface CreateTemplateData {
  name: string;
  content: string;
  profession: string;
  type: string;
  isPublic?: boolean;
  description?: string;
}

export interface TemplateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variableCount: number;
  variables: string[];
}

export const useTemplateManager = (): UseTemplateManagerReturn => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const templateService = new TemplateService();

  // Initialize templates on mount
  useEffect(() => {
    loadAllTemplates();
  }, []);

  const loadUserTemplates = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userTemplates = await templateService.getUserTemplates(user.id);
      setUserTemplates(userTemplates);
      console.log(`📋 LOADED: ${userTemplates.length} user templates`);
    } catch (error) {
      console.error('Failed to load user templates:', error);
      toast.error('Failed to load your templates');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const loadPublicTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const publicTemplates = await templateService.getPublicTemplates();
      setPublicTemplates(publicTemplates);
      console.log(`📋 LOADED: ${publicTemplates.length} public templates`);
    } catch (error) {
      console.error('Failed to load public templates:', error);
      toast.error('Failed to load public templates');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadAllTemplates = useCallback(async () => {
    setLoading(true);
    try {
      // Load all available templates (database + default)
      const allTemplates = templateService.getAllTemplates();
      setTemplates(allTemplates);
      
      // Also load user and public templates separately
      if (user) {
        await loadUserTemplates();
      }
      await loadPublicTemplates();
      
      console.log(`📋 LOADED: ${allTemplates.length} total templates`);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [user, loadUserTemplates, loadPublicTemplates, toast]);

  const refreshTemplates = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh from database
      await templateService.refreshTemplatesFromDatabase();
      await loadAllTemplates();
      toast.success('Templates refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh templates:', error);
      toast.error('Failed to refresh templates');
    } finally {
      setRefreshing(false);
    }
  }, [loadAllTemplates, toast]);

  const createTemplate = useCallback(async (templateData: CreateTemplateData): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create templates');
    }

    try {
      const templateId = await templateService.createTemplateFromDocument(
        templateData.content,
        templateData.name,
        templateData.type,
        templateData.profession,
        user.id,
        templateData.isPublic || false
      );

      toast.success(`Template "${templateData.name}" created successfully`);
      
      // Refresh templates
      await loadAllTemplates();
      
      return templateId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create template';
      toast.error(message);
      throw error;
    }
  }, [user, toast, loadAllTemplates]);

  const updateTemplate = useCallback(async (templateId: string, updates: Partial<Template>): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to update templates');
    }

    try {
      await templateService.updateTemplateInDatabase(templateId, updates, user.id);
      toast.success('Template updated successfully');
      
      // Refresh templates
      await loadAllTemplates();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update template';
      toast.error(message);
      throw error;
    }
  }, [user, toast, loadAllTemplates]);

  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to delete templates');
    }

    try {
      await templateService.deleteTemplateFromDatabase(templateId, user.id);
      toast.success('Template deleted successfully');
      
      // Refresh templates
      await loadAllTemplates();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete template';
      toast.error(message);
      throw error;
    }
  }, [user, toast, loadAllTemplates]);

  const duplicateTemplate = useCallback(async (templateId: string, newName: string): Promise<string> => {
    const originalTemplate = templates.find(t => t.id === templateId);
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const duplicateData: CreateTemplateData = {
      name: newName,
      content: originalTemplate.content,
      profession: originalTemplate.profession,
      type: originalTemplate.type,
      isPublic: false, // Always make duplicates private initially
      description: `Copy of ${originalTemplate.name}`
    };

    return await createTemplate(duplicateData);
  }, [templates, createTemplate]);

  const searchTemplates = useCallback((query: string, profession?: string, type?: string): Template[] => {
    const searchQuery = query.toLowerCase();
    
    return templates.filter(template => {
      const matchesQuery = 
        template.name.toLowerCase().includes(searchQuery) ||
        template.content.toLowerCase().includes(searchQuery) ||
        template.type.toLowerCase().includes(searchQuery);
      
      const matchesProfession = !profession || template.profession === profession;
      const matchesType = !type || template.type === type;
      
      return matchesQuery && matchesProfession && matchesType;
    });
  }, [templates]);

  const getTemplatesByProfession = useCallback((profession: string): Template[] => {
    return templates.filter(template => template.profession === profession);
  }, [templates]);

  const getTemplatesByType = useCallback((type: string): Template[] => {
    return templateService.getTemplatesByType(type);
  }, [templateService]);

  const validateTemplate = useCallback((content: string): TemplateValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic validation
    if (!content.trim()) {
      errors.push('Template content cannot be empty');
    }
    
    if (content.length < 50) {
      warnings.push('Template content is quite short');
    }
    
    // Extract variables
    const variables = extractVariables(content);
    
    // Check for unmatched braces
    const openBraces = (content.match(/\{\{/g) || []).length;
    const closeBraces = (content.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Unmatched template variable braces detected');
    }
    
    // Check for empty variables
    const emptyVariables = content.match(/\{\{\s*\}\}/g);
    if (emptyVariables) {
      errors.push(`Found ${emptyVariables.length} empty variable(s)`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      variableCount: variables.length,
      variables
    };
  }, []);

  const extractVariables = useCallback((content: string): string[] => {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    const found = new Set<string>();
    
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
      const varName = match[1].trim();
      if (varName && !found.has(varName)) {
        found.add(varName);
        variables.push(varName);
      }
    }
    
    return variables;
  }, []);

  return {
    templates,
    userTemplates,
    publicTemplates,
    loading,
    refreshing,
    
    // Template management
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    
    // Template loading
    loadUserTemplates,
    loadPublicTemplates,
    loadAllTemplates,
    refreshTemplates,
    
    // Template search and filtering
    searchTemplates,
    getTemplatesByProfession,
    getTemplatesByType,
    
    // Template validation
    validateTemplate,
    extractVariables
  };
};

export default useTemplateManager;
