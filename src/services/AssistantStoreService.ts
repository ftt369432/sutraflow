import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface AssistantTemplate {
  id: string;
  name: string;
  description: string;
  profession: string;
  category: string;
  capabilities: string[];
  templates: string[];
  rating: number;
  downloads: number;
  price: number;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  featured: boolean;
  trending: boolean;
  tags: string[];
  preview: {
    thumbnail: string;
    screenshots: string[];
  };
  lastUpdated: string;
  version: string;
  installData?: {
    systemPrompt: string;
    capabilities: any[];
    templates: any[];
    workflows: any[];
  };
}

class AssistantStoreService {
  private assistants: AssistantTemplate[] = [];
  private userInstalledAssistants: string[] = [];

  async getAssistants(): Promise<AssistantTemplate[]> {
    try {
      // Load from database first
      const { data, error } = await supabase
        .from('assistant_store')
        .select('*')
        .order('downloads', { ascending: false });

      if (error) {
        console.warn('Failed to load from database, using demo data:', error);
        return this.getDemoAssistants();
      }

      if (data && data.length > 0) {
        this.assistants = data;
        return this.assistants;
      } else {
        // If no data in database, return demo data and seed database
        const demoData = this.getDemoAssistants();
        await this.seedDemoData(demoData);
        return demoData;
      }
    } catch (error) {
      console.error('Error loading assistants:', error);
      return this.getDemoAssistants();
    }
  }

  private getDemoAssistants(): AssistantTemplate[] {
    return [
      // Elite & Universal Professional Services
      {
        id: 'elite-legal-toolbox',
        name: 'Elite Legal Toolbox (Second Brain)',
        description: 'Premium legal document automation and chronology generation. Uses proprietary timeline engines and PDF mapping.',
        profession: 'legal',
        category: 'featured',
        capabilities: ['Master Chronology', 'PDF Form Auto-Fill', 'Pleading Automation', 'Discovery Mapping'],
        templates: ['Petition for Reconsideration', 'Chronological Timeline', 'PTC Forms'],
        rating: 5.0,
        downloads: 850,
        price: 99.99,
        creator: { name: 'Sovereign Protocol Labs', avatar: '/avatars/sovereign.jpg', verified: true },
        featured: true,
        trending: true,
        tags: ['legal', 'pro', 'mcp', 'automation'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2026-03-09',
        version: '1.0.0'
      },
      {
        id: 'universal-agentic-os',
        name: 'Universal Agentic OS (Plug & Play)',
        description: 'Universal workflow organization and document grounding. Bootstraps any project into an organized Agentic structure.',
        profession: 'business',
        category: 'trending',
        capabilities: ['Universal Ingest', 'Grounding Engine', 'Source Mapping', 'Asset Centralization'],
        templates: ['Asset Registry', 'Grounding Report', 'Workflow Bootstrap'],
        rating: 4.9,
        downloads: 1200,
        price: 29.99,
        creator: { name: 'Sovereign Protocol Labs', avatar: '/avatars/sovereign.jpg', verified: true },
        featured: true,
        trending: true,
        tags: ['universal', 'agentic', 'mcp', 'productivity'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2026-03-09',
        version: '1.0.0'
      },
      // Legal Profession
      {
        id: 'legal-contract-specialist',
        name: 'Legal Contract Specialist',
        description: 'AI assistant specialized in contract drafting, review, and legal document automation for law firms.',
        profession: 'legal',
        category: 'featured',
        capabilities: ['Contract Drafting', 'Legal Research', 'Document Review', 'Compliance Checking'],
        templates: ['Settlement Agreements', 'Service Contracts', 'NDAs', 'Employment Contracts'],
        rating: 4.9,
        downloads: 15420,
        price: 0,
        creator: { name: 'GenieFlow Legal', avatar: '/avatars/legal.jpg', verified: true },
        featured: true,
        trending: true,
        tags: ['legal', 'contracts', 'automation', 'compliance'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-20',
        version: '2.1.0'
      },

      // Medical Profession
      {
        id: 'medical-documentation-assistant',
        name: 'Medical Documentation Assistant',
        description: 'Streamline medical record keeping, patient notes, and clinical documentation with AI precision.',
        profession: 'medical',
        category: 'trending',
        capabilities: ['Clinical Notes', 'Patient Records', 'Medical Coding', 'Prescription Management'],
        templates: ['SOAP Notes', 'Discharge Summaries', 'Medical Letters', 'Insurance Forms'],
        rating: 4.8,
        downloads: 12850,
        price: 29.99,
        creator: { name: 'HealthTech AI', avatar: '/avatars/medical.jpg', verified: true },
        featured: true,
        trending: true,
        tags: ['medical', 'healthcare', 'documentation', 'clinical'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-18',
        version: '1.8.2'
      },

      // Business Profession
      {
        id: 'business-proposal-expert',
        name: 'Business Proposal Expert',
        description: 'Create winning business proposals, pitches, and strategic documents that close deals.',
        profession: 'business',
        category: 'popular',
        capabilities: ['Proposal Writing', 'Market Analysis', 'Financial Modeling', 'Presentation Design'],
        templates: ['Business Plans', 'Project Proposals', 'RFP Responses', 'Investment Pitches'],
        rating: 4.7,
        downloads: 8950,
        price: 19.99,
        creator: { name: 'BizDev Pro', avatar: '/avatars/business.jpg', verified: true },
        featured: false,
        trending: true,
        tags: ['business', 'proposals', 'strategy', 'sales'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-15',
        version: '3.2.1'
      },

      // Technology Profession
      {
        id: 'software-development-mentor',
        name: 'Software Development Mentor',
        description: 'AI coding assistant for developers with code review, documentation, and architecture guidance.',
        profession: 'technology',
        category: 'new',
        capabilities: ['Code Review', 'Documentation', 'Architecture Design', 'Bug Detection'],
        templates: ['API Documentation', 'Code Comments', 'Technical Specs', 'README Files'],
        rating: 4.6,
        downloads: 22100,
        price: 0,
        creator: { name: 'DevTools Inc', avatar: '/avatars/tech.jpg', verified: true },
        featured: false,
        trending: false,
        tags: ['programming', 'development', 'code', 'documentation'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-22',
        version: '1.0.0'
      },

      // Education Profession
      {
        id: 'curriculum-designer',
        name: 'Curriculum Designer',
        description: 'Design engaging curricula, lesson plans, and educational materials for teachers and educators.',
        profession: 'education',
        category: 'popular',
        capabilities: ['Lesson Planning', 'Assessment Creation', 'Learning Objectives', 'Content Development'],
        templates: ['Lesson Plans', 'Quiz Templates', 'Rubrics', 'Course Outlines'],
        rating: 4.8,
        downloads: 7650,
        price: 14.99,
        creator: { name: 'EduTech Solutions', avatar: '/avatars/education.jpg', verified: true },
        featured: false,
        trending: false,
        tags: ['education', 'teaching', 'curriculum', 'assessment'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-10',
        version: '2.5.3'
      },

      // Healthcare Profession
      {
        id: 'patient-care-coordinator',
        name: 'Patient Care Coordinator',
        description: 'Optimize patient scheduling, care plans, and communication for healthcare facilities.',
        profession: 'healthcare',
        category: 'trending',
        capabilities: ['Care Planning', 'Patient Communication', 'Scheduling', 'Health Monitoring'],
        templates: ['Care Plans', 'Patient Letters', 'Health Assessments', 'Follow-up Notes'],
        rating: 4.9,
        downloads: 5420,
        price: 24.99,
        creator: { name: 'CareFlow Systems', avatar: '/avatars/healthcare.jpg', verified: true },
        featured: true,
        trending: true,
        tags: ['healthcare', 'patient care', 'coordination', 'communication'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-16',
        version: '1.9.1'
      },

      // Finance Profession
      {
        id: 'financial-analyst-pro',
        name: 'Financial Analyst Pro',
        description: 'Advanced financial modeling, analysis, and reporting for finance professionals.',
        profession: 'finance',
        category: 'premium',
        capabilities: ['Financial Modeling', 'Risk Analysis', 'Investment Research', 'Report Generation'],
        templates: ['Financial Reports', 'Investment Memos', 'Budget Plans', 'Risk Assessments'],
        rating: 4.7,
        downloads: 9800,
        price: 49.99,
        creator: { name: 'FinTech Analytics', avatar: '/avatars/finance.jpg', verified: true },
        featured: true,
        trending: false,
        tags: ['finance', 'analysis', 'modeling', 'investment'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-12',
        version: '4.1.2'
      },

      // Real Estate Profession
      {
        id: 'real-estate-marketing-expert',
        name: 'Real Estate Marketing Expert',
        description: 'Create compelling property listings, marketing materials, and client communications.',
        profession: 'real_estate',
        category: 'popular',
        capabilities: ['Property Listings', 'Marketing Copy', 'Client Communications', 'Market Analysis'],
        templates: ['Property Descriptions', 'Listing Flyers', 'Client Letters', 'Market Reports'],
        rating: 4.6,
        downloads: 6750,
        price: 16.99,
        creator: { name: 'RealtyTech Pro', avatar: '/avatars/realestate.jpg', verified: true },
        featured: false,
        trending: true,
        tags: ['real estate', 'marketing', 'listings', 'sales'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-14',
        version: '2.3.0'
      },

      // Creative Profession
      {
        id: 'creative-content-generator',
        name: 'Creative Content Generator',
        description: 'Generate creative content, copy, and marketing materials for designers and content creators.',
        profession: 'creative',
        category: 'trending',
        capabilities: ['Creative Writing', 'Social Media Content', 'Brand Messaging', 'Campaign Ideas'],
        templates: ['Social Posts', 'Ad Copy', 'Blog Articles', 'Brand Guidelines'],
        rating: 4.5,
        downloads: 11200,
        price: 0,
        creator: { name: 'Creative Studios', avatar: '/avatars/creative.jpg', verified: true },
        featured: false,
        trending: true,
        tags: ['creative', 'content', 'marketing', 'social media'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-19',
        version: '1.7.4'
      },

      // Automotive Profession
      {
        id: 'auto-service-advisor',
        name: 'Auto Service Advisor',
        description: 'Streamline automotive service documentation, estimates, and customer communications.',
        profession: 'automotive',
        category: 'new',
        capabilities: ['Service Estimates', 'Work Orders', 'Customer Communications', 'Inventory Management'],
        templates: ['Service Quotes', 'Work Orders', 'Invoice Templates', 'Follow-up Messages'],
        rating: 4.4,
        downloads: 3200,
        price: 12.99,
        creator: { name: 'AutoTech Solutions', avatar: '/avatars/automotive.jpg', verified: false },
        featured: false,
        trending: false,
        tags: ['automotive', 'service', 'estimates', 'customer service'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-21',
        version: '1.2.0'
      },

      // Photography Profession
      {
        id: 'photography-business-manager',
        name: 'Photography Business Manager',
        description: 'Manage photography business operations, client communications, and project workflows.',
        profession: 'photography',
        category: 'new',
        capabilities: ['Client Management', 'Project Planning', 'Contract Creation', 'Invoice Generation'],
        templates: ['Photography Contracts', 'Project Proposals', 'Client Questionnaires', 'Invoice Templates'],
        rating: 4.3,
        downloads: 2100,
        price: 18.99,
        creator: { name: 'PhotoPro Business', avatar: '/avatars/photography.jpg', verified: true },
        featured: false,
        trending: false,
        tags: ['photography', 'business', 'client management', 'contracts'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-20',
        version: '1.1.0'
      },

      // Hospitality Profession
      {
        id: 'hospitality-operations-assistant',
        name: 'Hospitality Operations Assistant',
        description: 'Optimize hotel and restaurant operations with guest communications and service management.',
        profession: 'hospitality',
        category: 'trending',
        capabilities: ['Guest Communications', 'Service Protocols', 'Staff Training', 'Quality Assurance'],
        templates: ['Guest Welcome Letters', 'Service Scripts', 'Training Materials', 'Feedback Forms'],
        rating: 4.5,
        downloads: 4800,
        price: 22.99,
        creator: { name: 'HospitalityTech Pro', avatar: '/avatars/hospitality.jpg', verified: true },
        featured: false,
        trending: true,
        tags: ['hospitality', 'guest service', 'operations', 'training'],
        preview: { 
          thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          screenshots: []
        },
        lastUpdated: '2024-09-17',
        version: '2.0.1'
      }
    ];
  }

  private async seedDemoData(assistants: AssistantTemplate[]) {
    try {
      const { error } = await supabase
        .from('assistant_store')
        .insert(assistants);

      if (error) {
        console.warn('Failed to seed demo data:', error);
      } else {
        console.log('Demo data seeded successfully');
      }
    } catch (error) {
      console.error('Error seeding demo data:', error);
    }
  }

  async installAssistant(assistantId: string): Promise<void> {
    try {
      const assistant = this.assistants.find(a => a.id === assistantId);
      if (!assistant) {
        throw new Error('Assistant not found');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if already installed
      const { data: existing } = await supabase
        .from('user_installed_assistants')
        .select('id')
        .eq('user_id', user.id)
        .eq('assistant_id', assistantId)
        .single();

      if (existing) {
        toast.success('Assistant already installed!');
        return;
      }

      // Install assistant
      const { error } = await supabase
        .from('user_installed_assistants')
        .insert({
          user_id: user.id,
          assistant_id: assistantId,
          installed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update download count
      await supabase
        .from('assistant_store')
        .update({ 
          downloads: assistant.downloads + 1 
        })
        .eq('id', assistantId);

      // Add to local installed list
      this.userInstalledAssistants.push(assistantId);

      console.log(`Assistant ${assistant.name} installed successfully`);
    } catch (error) {
      console.error('Failed to install assistant:', error);
      throw error;
    }
  }

  async getInstalledAssistants(): Promise<AssistantTemplate[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_installed_assistants')
        .select(`
          assistant_id,
          installed_at,
          assistant_store (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      return data?.map(item => item.assistant_store as AssistantTemplate) || [];
    } catch (error) {
      console.error('Failed to get installed assistants:', error);
      return [];
    }
  }

  async searchAssistants(query: string): Promise<AssistantTemplate[]> {
    const searchTerms = query.toLowerCase().split(' ');
    
    return this.assistants.filter(assistant => {
      const searchableText = `
        ${assistant.name} 
        ${assistant.description} 
        ${assistant.profession} 
        ${assistant.capabilities.join(' ')} 
        ${assistant.tags.join(' ')}
      `.toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  async getAssistantsByProfession(profession: string): Promise<AssistantTemplate[]> {
    if (profession === 'all') return this.assistants;
    return this.assistants.filter(a => a.profession === profession);
  }

  async getFeaturedAssistants(): Promise<AssistantTemplate[]> {
    return this.assistants.filter(a => a.featured);
  }

  async getTrendingAssistants(): Promise<AssistantTemplate[]> {
    return this.assistants.filter(a => a.trending);
  }

  async getAssistantById(id: string): Promise<AssistantTemplate | null> {
    return this.assistants.find(a => a.id === id) || null;
  }
}

export const assistantStoreService = new AssistantStoreService();