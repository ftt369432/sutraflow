-- Nexus Studio Core Schema
-- Unified Object & Record system for any industry

-- 🏢 1. Object Types (The blueprint for an industry vertical)
CREATE TABLE IF NOT EXISTS public.nexus_object_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    industry_id TEXT NOT NULL, -- 'legal', 'medical', 'real_estate'
    name TEXT NOT NULL,        -- 'Case', 'Patient', 'Asset'
    icon TEXT,                 -- Lucide icon name
    description TEXT,
    schema_definition JSONB DEFAULT '{}' NOT NULL, -- { fields: [{ name, type, label, required }] }
    view_configs JSONB DEFAULT '{}' NOT NULL,      -- { available_views: ['grid', 'kanban'], default_view: 'grid' }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📊 2. Records (The actual data instances)
CREATE TABLE IF NOT EXISTS public.nexus_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    object_type_id UUID REFERENCES public.nexus_object_types NOT NULL,
    data JSONB DEFAULT '{}' NOT NULL, -- Field-value mapping based on the schema
    status TEXT DEFAULT 'active',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- RAG indexing links
    kb_document_id UUID REFERENCES public.kb_documents(id) -- Optional link to an source PDF/MD
);

-- Enable RLS
ALTER TABLE public.nexus_object_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_records ENABLE ROW LEVEL SECURITY;

-- Policies for Object Types
CREATE POLICY "Users can manage their own object types"
    ON public.nexus_object_types
    FOR ALL
    USING (auth.uid() = user_id);

-- Policies for Records
CREATE POLICY "Users can manage their own records"
    ON public.nexus_records
    FOR ALL
    USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nexus_object_types_modtime
    BEFORE UPDATE ON public.nexus_object_types
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_nexus_records_modtime
    BEFORE UPDATE ON public.nexus_records
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
