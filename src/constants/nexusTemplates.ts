import { NexusObjectType } from '../store/nexusStore';

export interface NexusTemplate {
  id: string;
  name: string;
  industryId: string;
  icon: string;
  description: string;
  objectTypes: Array<Omit<NexusObjectType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
}

export const NEXUS_TEMPLATES: Record<string, NexusTemplate> = {
  legal: {
    id: 'legal-case-template',
    name: 'Legal Case Command Center',
    industryId: 'legal',
    icon: 'briefcase',
    description: 'Manage legal cases, parties, and deadines with agentic oversight.',
    objectTypes: [
      {
        name: 'Case',
        industryId: 'legal',
        icon: 'folder',
        description: 'Primary case records',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'title', label: 'Case Title', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'status', label: 'Status', type: 'select', options: ['Intake', 'Litigation', 'Discovery', 'Trial', 'Closed'], defaultValue: 'Intake' },
            { id: '3', name: 'client', label: 'Client Name', type: 'text', required: true },
            { id: '4', name: 'incident_date', label: 'Incident Date', type: 'date' },
            { id: '5', name: 'court', label: 'Court Name', type: 'text' },
            { id: '6', name: 'court_case_num', label: 'Court Case #', type: 'text' },
            { id: '7', name: 'description', label: 'Description', type: 'text' },
          ]
        },
        viewConfigs: {
          available_views: ['grid', 'kanban'],
          default_view: 'grid',
          kanban_column_field: 'status',
          grid_visible_columns: ['title', 'status', 'client', 'incident_date']
        }
      },
      {
        name: 'Party',
        industryId: 'legal',
        icon: 'users',
        description: 'Entities involved in the case',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'name', label: 'Full Name', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'role', label: 'Role', type: 'select', options: ['Plaintiff', 'Defendant', 'Witness', 'Counsel', 'Expert'], defaultValue: 'Plaintiff' },
            { id: '3', name: 'phone', label: 'Phone', type: 'text' },
            { id: '4', name: 'email', label: 'Email', type: 'email' },
          ]
        },
        viewConfigs: {
          available_views: ['grid'],
          default_view: 'grid'
        }
      },
      {
        name: 'Deadline',
        industryId: 'legal',
        icon: 'calendar',
        description: 'Critical litigation deadlines',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'task', label: 'Filing Task', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'due_date', label: 'Due Date', type: 'date', required: true },
            { id: '3', name: 'status', label: 'Status', type: 'select', options: ['Upcoming', 'Drafting', 'Filed', 'Missed'], defaultValue: 'Upcoming' },
          ]
        },
        viewConfigs: {
          available_views: ['grid', 'kanban'],
          default_view: 'grid',
          kanban_column_field: 'status'
        }
      }
    ]
  },
  medical: {
    id: 'medical-clinical-template',
    name: 'Clinical Operations Hub',
    industryId: 'medical',
    icon: 'activity',
    description: 'Track patient health, lab results, and condition progress.',
    objectTypes: [
      {
        name: 'Patient',
        industryId: 'medical',
        icon: 'user',
        description: 'Individual patient records',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'name', label: 'Patient Name', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'patient_id', label: 'MRN/ID', type: 'text', required: true },
            { id: '3', name: 'age', label: 'Age', type: 'number' },
            { id: '4', name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inpatient', 'Discharged', 'Critical'], defaultValue: 'Active' },
            { id: '5', name: 'last_visit', label: 'Last Visit', type: 'date' },
          ]
        },
        viewConfigs: {
          available_views: ['grid', 'kanban'],
          default_view: 'grid',
          kanban_column_field: 'status'
        }
      },
      {
        name: 'Lab Result',
        industryId: 'medical',
        icon: 'flask-conical',
        description: 'Stuctured laboratory data',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'analyte', label: 'Test/Analyte', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'value', label: 'Result Value', type: 'text', required: true },
            { id: '3', name: 'unit', label: 'Unit', type: 'text' },
            { id: '4', name: 'ref_range', label: 'Ref Range', type: 'text' },
            { id: '5', name: 'is_abnormal', label: 'Status', type: 'select', options: ['Normal', 'High', 'Low', 'Critical'], defaultValue: 'Normal' },
          ]
        },
        viewConfigs: {
          available_views: ['grid'],
          default_view: 'grid'
        }
      },
      {
        name: 'Condition',
        industryId: 'medical',
        icon: 'thermometer',
        description: 'Diagnoses and conditions',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'diagnosis', label: 'Diagnosis', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'onset_date', label: 'Onset Date', type: 'date' },
            { id: '3', name: 'severity', label: 'Severity', type: 'select', options: ['Mild', 'Moderate', 'Severe', 'Acute'], defaultValue: 'Moderate' },
          ]
        },
        viewConfigs: {
          available_views: ['grid'],
          default_view: 'grid'
        }
      }
    ]
  },
  biolab: {
    id: 'biolab-genomics-hub',
    name: 'Sovereign BioLab Hub',
    industryId: 'biolab',
    icon: 'dna',
    description: 'Advanced genomics research, gene interaction mapping, and medicinal discovery.',
    objectTypes: [
      {
        name: 'Genetic Sample',
        industryId: 'biolab',
        icon: 'test-tube-2',
        description: 'Multi-gene sample records',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'label', label: 'Sample ID/Name', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'genes', label: 'Gene Sequences (Multi)', type: 'json' },
            { id: '3', name: 'source', label: 'Sample Source', type: 'select', options: ['Patient Tissue', 'Blood', 'Synthetic', 'Environmental'], defaultValue: 'Patient Tissue' },
            { id: '4', name: 'analysis_status', label: 'Analysis Status', type: 'select', options: ['Pending', 'Processing', 'Sequenced', 'Interaction Found', 'Verified'], defaultValue: 'Pending' },
          ]
        },
        viewConfigs: {
          available_views: ['grid', 'kanban'],
          default_view: 'grid',
          kanban_column_field: 'analysis_status',
          grid_visible_columns: ['label', 'genes', 'source', 'analysis_status']
        }
      },
      {
        name: 'Interaction Research',
        industryId: 'biolab',
        icon: 'network',
        description: 'AI-derived gene interaction findings',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'interaction_title', label: 'Interaction Title', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'significance', label: 'Clinical Significance', type: 'select', options: ['Pathogenic', 'Likely Pathogenic', 'VUS', 'Benign', 'Synergistic'], defaultValue: 'VUS' },
            { id: '3', name: 'mechanism', label: 'Proposed Mechanism', type: 'text', description: 'How the genes interact verbatim' },
            { id: '4', name: 'therapeutic_candidates', label: 'Relief/Cure Candidates', type: 'text' },
          ]
        },
        viewConfigs: {
          available_views: ['grid'],
          default_view: 'grid'
        }
      },
      {
        name: 'Study/Reference',
        industryId: 'biolab',
        icon: 'book-open',
        description: 'Linked research studies and whitepapers',
        schemaDefinition: {
          fields: [
            { id: '1', name: 'title', label: 'Study Title', type: 'text', required: true, isTitle: true },
            { id: '2', name: 'authors', label: 'Authors', type: 'text' },
            { id: '3', name: 'doi', label: 'DOI/Link', type: 'url' },
            { id: '4', name: 'verbatim_key_finding', label: 'Key Finding', type: 'text' },
          ]
        },
        viewConfigs: {
          available_views: ['grid'],
          default_view: 'grid'
        }
      }
    ]
  }
};
