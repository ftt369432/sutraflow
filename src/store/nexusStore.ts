import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { zustandSafeStorage } from '../utils/safeStorage';

export interface NexusField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'json' | 'relation' | 'email' | 'url';
  required?: boolean;
  options?: string[]; // For select type
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  validation?: string; // Regex or custom logic
  isTitle?: boolean; // If this field should be used as the primary label for the record
}

export interface NexusObjectType {
  id: string;
  userId: string;
  industryId: string; // 'legal', 'medical', etc.
  name: string;
  icon?: string;
  description?: string;
  schemaDefinition: {
    fields: NexusField[];
  };
  viewConfigs?: {
    available_views: string[];
    default_view: string;
    kanban_column_field?: string; // Which field to use for kanban columns
    grid_visible_columns?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface NexusRecord {
  id: string;
  userId: string;
  objectTypeId: string;
  data: Record<string, any>;
  status: string;
  isDeleted: boolean;
  kbDocumentId?: string; // Optional link to a document
  createdAt: string;
  updatedAt: string;
}

interface NexusState {
  objectTypes: NexusObjectType[];
  records: NexusRecord[];
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  fetchObjectTypes: () => Promise<void>;
  fetchRecords: (objectTypeId?: string) => Promise<void>;
  
  // Object Type Actions
  createObjectType: (type: Omit<NexusObjectType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<NexusObjectType | null>;
  updateObjectType: (id: string, updates: Partial<NexusObjectType>) => Promise<void>;
  deleteObjectType: (id: string) => Promise<void>;

  // Record Actions
  createRecord: (record: Omit<NexusRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<NexusRecord | null>;
  updateRecord: (id: string, updates: Partial<NexusRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  // Helpers
  getRecordsByType: (typeId: string) => NexusRecord[];
  getObjectTypeById: (id: string) => NexusObjectType | undefined;
}

export const useNexusStore = create<NexusState>()(
  persist(
    (set, get) => ({
      objectTypes: [],
      records: [],
      loading: false,
      initialized: false,
      error: null,

      initialize: async () => {
        if (get().initialized) return;
        set({ loading: true });
        try {
          await get().fetchObjectTypes();
          await get().fetchRecords();
          set({ initialized: true, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      fetchObjectTypes: async () => {
        const { data, error } = await supabase
          .from('nexus_object_types')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        
        const mapped: NexusObjectType[] = (data || []).map(item => ({
          id: item.id,
          userId: item.user_id,
          industryId: item.industry_id,
          name: item.name,
          icon: item.icon,
          description: item.description,
          schemaDefinition: item.schema_definition,
          viewConfigs: item.view_configs,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));

        set({ objectTypes: mapped });
      },

      fetchRecords: async (objectTypeId) => {
        let query = supabase.from('nexus_records').select('*').eq('is_deleted', false);
        
        if (objectTypeId) {
          query = query.eq('object_type_id', objectTypeId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        
        const mapped: NexusRecord[] = (data || []).map(item => ({
          id: item.id,
          userId: item.user_id,
          objectTypeId: item.object_type_id,
          data: item.data,
          status: item.status,
          isDeleted: item.is_deleted,
          kbDocumentId: item.kb_document_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));

        if (objectTypeId) {
            // Merge with existing records or replace? Let's replace for now to simplify
            set(state => ({
                records: [
                    ...state.records.filter(r => r.objectTypeId !== objectTypeId),
                    ...mapped
                ]
            }));
        } else {
            set({ records: mapped });
        }
      },

      createObjectType: async (newType) => {
        set({ loading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from('nexus_object_types')
          .insert([{
            user_id: user.id,
            industry_id: newType.industryId,
            name: newType.name,
            icon: newType.icon,
            description: newType.description,
            schema_definition: newType.schemaDefinition,
            view_configs: newType.viewConfigs || { available_views: ['grid'], default_view: 'grid' }
          }])
          .select()
          .single();

        if (error) {
          set({ loading: false, error: error.message });
          return null;
        }

        const mapped: NexusObjectType = {
          id: data.id,
          userId: data.user_id,
          industryId: data.industry_id,
          name: data.name,
          icon: data.icon,
          description: data.description,
          schemaDefinition: data.schema_definition,
          viewConfigs: data.view_configs,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };

        set(state => ({
          objectTypes: [...state.objectTypes, mapped],
          loading: false
        }));

        return mapped;
      },

      updateObjectType: async (id, updates) => {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.icon) payload.icon = updates.icon;
        if (updates.description) payload.description = updates.description;
        if (updates.schemaDefinition) payload.schema_definition = updates.schemaDefinition;
        if (updates.viewConfigs) payload.view_configs = updates.viewConfigs;

        const { error } = await supabase
          .from('nexus_object_types')
          .update(payload)
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          objectTypes: state.objectTypes.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
      },

      deleteObjectType: async (id) => {
        const { error } = await supabase
          .from('nexus_object_types')
          .delete()
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          objectTypes: state.objectTypes.filter(t => t.id !== id),
          records: state.records.filter(r => r.objectTypeId !== id)
        }));
      },

      createRecord: async (newRecord) => {
        set({ loading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from('nexus_records')
          .insert([{
            user_id: user.id,
            object_type_id: newRecord.objectTypeId,
            data: newRecord.data,
            status: newRecord.status || 'active',
            kb_document_id: newRecord.kbDocumentId
          }])
          .select()
          .single();

        if (error) {
          set({ loading: false, error: error.message });
          return null;
        }

        const mapped: NexusRecord = {
          id: data.id,
          userId: data.user_id,
          objectTypeId: data.object_type_id,
          data: data.data,
          status: data.status,
          isDeleted: data.is_deleted,
          kbDocumentId: data.kb_document_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };

        set(state => ({
          records: [mapped, ...state.records],
          loading: false
        }));

        return mapped;
      },

      updateRecord: async (id, updates) => {
        const payload: any = {};
        if (updates.data) payload.data = updates.data;
        if (updates.status) payload.status = updates.status;
        if (updates.kbDocumentId) payload.kb_document_id = updates.kbDocumentId;

        const { error } = await supabase
          .from('nexus_records')
          .update(payload)
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
      },

      deleteRecord: async (id) => {
        // Soft delete
        const { error } = await supabase
          .from('nexus_records')
          .update({ is_deleted: true })
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          records: state.records.filter(r => r.id !== id)
        }));
      },

      getRecordsByType: (typeId) => {
        return get().records.filter(r => r.objectTypeId === typeId);
      },

      getObjectTypeById: (id) => {
        return get().objectTypes.find(t => t.id === id);
      }
    }),
    {
      name: 'genieflow-nexus-store',
      storage: zustandSafeStorage as any,
    }
  )
);
