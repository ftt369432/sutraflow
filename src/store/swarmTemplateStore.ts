import { create } from 'zustand';
import { supabase } from '../services/supabase/supabaseClient'; // Corrected path
import type { SwarmTemplate, AgentRoleDefinition } from '../types/templates';
// import { SupabaseClient } from '@supabase/supabase-js'; // Removed unused import

interface SwarmTemplateState {
  templates: SwarmTemplate[];
  currentTemplate: SwarmTemplate | null;
  isLoading: boolean;
  error: string | null;
  fetchSwarmTemplates: (filters?: {
    templateType?: string;
    userId?: string; // To fetch user's own templates
    systemOnly?: boolean; // To fetch only system templates
  }) => Promise<void>;
  fetchSwarmTemplateById: (id: string) => Promise<void>;
  createSwarmTemplate: (
    templateData: Omit<SwarmTemplate, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'isSystemTemplate'> & { roles: AgentRoleDefinition[] }
  ) => Promise<SwarmTemplate | null>;
  updateSwarmTemplate: (
    id: string,
    updates: Partial<Omit<SwarmTemplate, 'id' | 'creatorId' | 'createdAt' | 'updatedAt' | 'isSystemTemplate'>>
  ) => Promise<SwarmTemplate | null>;
  deleteSwarmTemplate: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useSwarmTemplateStore = create<SwarmTemplateState>((set, _get) => ({
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchSwarmTemplates: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('swarm_templates').select('*');

      if (filters.templateType) {
        query = query.eq('template_type', filters.templateType);
      }
      if (filters.userId) {
        query = query.eq('creator_id', filters.userId).eq('is_system_template', false);
      }
      if (filters.systemOnly) {
        query = query.eq('is_system_template', true);
      }
      // Default: if no user or system flag, fetch user's + system templates
      if (!filters.userId && filters.systemOnly === undefined) {
         const { data: authData, error: authError } = await supabase.auth.getUser();
         if (authError || !authData.user) {
            // Fetch only system templates if user is not authenticated
            query = query.eq('is_system_template', true);
         } else {
            query = query.or(`creator_id.eq.${authData.user.id},is_system_template.eq.true`);
         }
      }


      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      set({ templates: data || [], isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching swarm templates:', error);
    }
  },

  fetchSwarmTemplateById: async (id: string) => {
    set({ isLoading: true, error: null, currentTemplate: null });
    try {
      const { data, error } = await supabase
        .from('swarm_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      set({ currentTemplate: data, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error(`Error fetching swarm template by ID (${id}):`, error);
    }
  },

  createSwarmTemplate: async (templateData) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated to create a template.');

      const newTemplate = {
        ...templateData,
        creator_id: user.id,
        is_system_template: false, // User-created templates are not system templates
      };

      const { data, error } = await supabase
        .from('swarm_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({
        templates: [...state.templates, data].sort((a, b) => a.name.localeCompare(b.name)),
        currentTemplate: data,
        isLoading: false,
      }));
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error creating swarm template:', error);
      return null;
    }
  },

  updateSwarmTemplate: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated to update a template.');

      // Ensure the user is only updating their own template and not a system template
      const { data: existingTemplate, error: fetchError } = await supabase
        .from('swarm_templates')
        .select('creator_id, is_system_template')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!existingTemplate) throw new Error ('Template not found.');
      if (existingTemplate.is_system_template) throw new Error('System templates cannot be modified.');
      if (existingTemplate.creator_id !== user.id) throw new Error('User not authorized to update this template.');
      
      const { data, error } = await supabase
        .from('swarm_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? data : t)).sort((a, b) => a.name.localeCompare(b.name)),
        currentTemplate: state.currentTemplate?.id === id ? data : state.currentTemplate,
        isLoading: false,
      }));
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error(`Error updating swarm template (${id}):`, error);
      return null;
    }
  },

  deleteSwarmTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated to delete a template.');

      // Ensure the user is only deleting their own template and not a system template
      const { data: existingTemplate, error: fetchError } = await supabase
        .from('swarm_templates')
        .select('creator_id, is_system_template')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      if (!existingTemplate) throw new Error ('Template not found.');
      if (existingTemplate.is_system_template) throw new Error('System templates cannot be deleted.');
      if (existingTemplate.creator_id !== user.id) throw new Error('User not authorized to delete this template.');

      const { error } = await supabase.from('swarm_templates').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
        isLoading: false,
      }));
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error(`Error deleting swarm template (${id}):`, error);
      return false;
    }
  },
})); 