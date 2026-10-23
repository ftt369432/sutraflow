import { Template, TemplateVariable, TemplateSection, TemplateMetadata } from '../types/AgentTypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

export interface TemplateSearchCriteria {
  documentType: string;
  profession: string;
  complexity: 'basic' | 'standard' | 'high';
  jurisdiction?: string;
  industry?: string;
}

// Database template interface matching our schema
export interface DatabaseTemplate {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  document_type: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Extended metadata stored as JSON
  template_metadata?: {
    profession?: string;
    variables?: TemplateVariable[];
    sections?: TemplateSection[];
    jurisdiction?: string;
    compliance_standards?: string[];
    accuracy_rating?: number;
    complexity?: 'basic' | 'standard' | 'high';
  };
}

export class TemplateService {
  private templates: Map<string, Template> = new Map();
  private databaseTemplates: Map<string, DatabaseTemplate> = new Map();
  private supabase: SupabaseClient;
  
  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || supabase;
    this.initializeTemplateLibrary();
  }

  private async initializeTemplateLibrary(): Promise<void> {
    console.log('📋 TEMPLATE SERVICE: Initializing template library with AI Drive integration');
    
    try {
      // Load templates from database first
      await this.loadTemplatesFromDatabase();
      
      // Then load default templates if none exist in database
      if (this.templates.size === 0) {
        console.log('📋 TEMPLATE SERVICE: No templates found in database, loading defaults');
        this.loadDefaultTemplates();
      }
      
      console.log(`📋 TEMPLATE SERVICE: Loaded ${this.templates.size} templates total`);
      
    } catch (error) {
      console.error('📋 TEMPLATE SERVICE ERROR: Failed to load templates from database:', error);
      console.log('📋 TEMPLATE SERVICE: Falling back to default templates');
      this.loadDefaultTemplates();
    }
  }

  private async loadTemplatesFromDatabase(): Promise<void> {
    console.log('📋 DATABASE: Loading templates from document_templates table');
    
    try {
      // Load public templates and user's private templates
      const { data: templates, error } = await this.supabase
        .from('document_templates')
        .select('*')
        .or('is_public.eq.true,user_id.eq.' + (await this.getCurrentUserId()));

      if (error) {
        throw error;
      }

      if (templates && templates.length > 0) {
        console.log(`📋 DATABASE: Found ${templates.length} templates in database`);
        
        for (const dbTemplate of templates) {
          const template = this.convertDatabaseTemplateToTemplate(dbTemplate);
          this.templates.set(template.id, template);
          this.databaseTemplates.set(template.id, dbTemplate);
        }
      }
      
    } catch (error) {
      console.error('📋 DATABASE ERROR: Failed to load templates:', error);
      throw error;
    }
  }

  private convertDatabaseTemplateToTemplate(dbTemplate: any): Template {
    const metadata = dbTemplate.template_metadata || {};
    
    return {
      id: dbTemplate.id,
      name: dbTemplate.title,
      type: dbTemplate.document_type,
      profession: metadata.profession || this.detectProfession(dbTemplate.content),
      content: dbTemplate.content,
      variables: metadata.variables || this.extractVariablesFromContent(dbTemplate.content),
      sections: metadata.sections || this.extractSectionsFromContent(dbTemplate.content),
      metadata: {
        version: '1.0.0',
        author: 'User Template',
        profession: metadata.profession || this.detectProfession(dbTemplate.content),
        jurisdiction: metadata.jurisdiction,
        compliance_standards: metadata.compliance_standards || [],
        last_updated: new Date(dbTemplate.updated_at),
        accuracy_rating: metadata.accuracy_rating || 0.85
      }
    };
  }

  private extractVariablesFromContent(content: string): TemplateVariable[] {
    const variablePattern = /\\\{\\\{([^}]+)\\\}\\\}/g;
    const variables: TemplateVariable[] = [];
    const found = new Set<string>();
    
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
      const varName = match[1].trim();
      if (!found.has(varName)) {
        found.add(varName);
        variables.push({
          name: varName,
          type: this.guessVariableType(varName),
          required: true,
          description: this.generateVariableDescription(varName)
        });
      }
    }
    
    return variables;
  }

  private extractSectionsFromContent(content: string): TemplateSection[] {
    const sections: TemplateSection[] = [];
    const headerPattern = /^#{1,6}\s+(.+)$/gm;
    
    let match;
    let sectionIndex = 0;
    while ((match = headerPattern.exec(content)) !== null) {
      const sectionName = match[1].trim();
      sections.push({
        id: `section_${sectionIndex++}`,
        name: sectionName,
        type: this.guessSectionType(sectionName),
        required: true,
        agentRequirements: ['template_agent'],
        dependencies: []
      });
    }
    
    return sections;
  }

  private guessVariableType(varName: string): 'text' | 'number' | 'date' | 'boolean' {
    const name = varName.toLowerCase();
    if (name.includes('date') || name.includes('time')) return 'date';
    if (name.includes('amount') || name.includes('cost') || name.includes('price') || name.includes('number')) return 'number';
    return 'text';
  }

  private generateVariableDescription(varName: string): string {
    const name = varName.toLowerCase().replace(/_/g, ' ');
    return `Enter the ${name}`;
  }

  private guessSectionType(sectionName: string): string {
    const name = sectionName.toLowerCase();
    if (name.includes('background') || name.includes('history')) return 'factual';
    if (name.includes('legal') || name.includes('argument') || name.includes('analysis')) return 'legal_analysis';
    if (name.includes('medical') || name.includes('clinical')) return 'clinical_assessment';
    if (name.includes('business') || name.includes('financial')) return 'business_analysis';
    return 'general_content';
  }

  private detectProfession(content: string): string {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('petition') || contentLower.includes('court') || contentLower.includes('statute')) {
      return 'legal';
    }
    if (contentLower.includes('patient') || contentLower.includes('diagnosis') || contentLower.includes('medical')) {
      return 'medical';
    }
    if (contentLower.includes('business plan') || contentLower.includes('revenue') || contentLower.includes('market')) {
      return 'business';
    }
    if (contentLower.includes('architecture') || contentLower.includes('building') || contentLower.includes('design')) {
      return 'architecture';
    }
    if (contentLower.includes('technical') || contentLower.includes('api') || contentLower.includes('system')) {
      return 'technical';
    }
    
    return 'general';
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  private loadDefaultTemplates(): void {
    console.log('📋 TEMPLATE SERVICE: Loading default template library');
    
    // Legal Templates
    this.addLegalTemplates();
    
    // Medical Templates  
    this.addMedicalTemplates();
    
    // Business Templates
    this.addBusinessTemplates();
    
    // Technical Templates
    this.addTechnicalTemplates();
    
    // Architecture Templates
    this.addArchitectureTemplates();
    
    // Creative Templates
    this.addCreativeTemplates();
    
    // General Templates
    this.addGeneralTemplates();
    
    console.log(`📋 TEMPLATE SERVICE: Loaded ${this.templates.size} default professional templates`);
  }

  private addLegalTemplates(): void {
    // Petition for Costs and Sanctions Template
    this.addTemplate({
      id: 'legal_petition_costs_sanctions',
      name: 'Petition for Costs and Sanctions',
      type: 'legal_petition',
      profession: 'legal',
      content: `# PETITION FOR COSTS AND SANCTIONS

**CASE NO.:** \{\{case_number\}\}
**APPLICANT:** \{\{applicant_name\}\}
**DEFENDANT:** \{\{defendant_name\}\}
**DATE OF INJURY:** \{\{injury_date\}\}

---

## I. NATURE OF REQUEST

This petition seeks an award of costs and sanctions against the defense for unreasonable conduct in the handling of medical-legal examinations and reports pursuant to Labor Code Section 4622 and 5813.

## II. FACTUAL BACKGROUND

### A. Injury and Treatment
- **Date of Injury:** \{\{injury_date\}\}
- **Body Parts Injured:** \{\{injured_body_parts\}\}
- **Employment:** \{\{employment_details\}\}
- **Medical Treatment:** \{\{medical_treatment_summary\}\}

### B. Medical-Legal Examination
- **Examining Physician:** \{\{examining_physician\}\}
- **Date of Examination:** \{\{examination_date\}\}
- **Report Date:** \{\{report_date\}\}
- **Amount Billed:** $\{\{amount_billed\}\}
- **Date Bill Submitted:** \{\{bill_submitted_date\}\}

### C. Dispute and Unreasonable Conduct
- **Defense Response Date:** \{\{defense_response_date\}\}
- **Reason for Denial:** \{\{denial_reason\}\}
- **Unreasonable Conduct Details:** \{\{unreasonable_conduct\}\}

## III. LEGAL BASIS FOR SANCTIONS

### A. Reasonable and Necessary (Lab. Code § 4622)
The medical-legal examination was properly requested and is reasonable and necessary for the adjudication of this claim because:

1. {{necessity_reason_1}}
2. {{necessity_reason_2}}
3. {{necessity_reason_3}}

### B. Failure to Pay (Lab. Code § 4622(a))
The defense has failed to pay the medical-legal costs within sixty (60) days without reasonable basis, constituting a violation of Labor Code Section 4622(a).

### C. Sanctions Authority (Lab. Code § 5813)
The Workers' Compensation Appeals Board has the authority to award sanctions for unreasonable conduct that increases the costs of litigation.

**Supporting Case Law:**
- *{{case_citation_1}}*
- *{{case_citation_2}}*
- *{{case_citation_3}}*

## IV. DECLARATION OF {{attorney_name}}

I, {{attorney_name}}, declare under penalty of perjury that:

1. I am the attorney of record for the applicant in this matter.
2. The facts stated herein are true and correct based on my knowledge, information, and belief.
3. {{additional_declaration_facts}}

## V. PRAYER FOR RELIEF

WHEREFORE, Applicant respectfully requests that this Honorable Board:

1. Award medical-legal costs in the amount of $\{\{amount_billed\}\};
2. Award interest on said amount from \{\{interest_start_date\}\};
3. Award sanctions against defendant for unreasonable conduct in the amount of $\{\{sanctions_amount\}\};
4. Award attorney's fees and costs incurred in bringing this petition;
5. Grant such other relief as this Board deems just and proper.

---

**Respectfully submitted,**

\{\{attorney_signature\}\}
\{\{attorney_name\}\}, Esq.
State Bar No. \{\{bar_number\}\}
\{\{law_firm_name\}\}
\{\{law_firm_address\}\}
\{\{law_firm_phone\}\}
\{\{law_firm_email\}\}

**Date:** \{\{filing_date\}\}

---

## EXHIBITS

**Exhibit A:** Proof of Service of Medical-Legal Report
**Exhibit B:** Medical-Legal Bill and Statement
**Exhibit C:** Defense Correspondence
**Exhibit D:** Medical-Legal Report of {{examining_physician}}
{{additional_exhibits}}

---

## PROOF OF SERVICE

I hereby certify that a true and correct copy of the foregoing was served upon the parties listed below:

{{service_list}}

**Date:** {{service_date}}
**Method:** {{service_method}}

{{server_signature}}
{{server_name}}`,
      variables: [
        { name: 'case_number', type: 'text', required: true, description: 'WCAB Case Number' },
        { name: 'applicant_name', type: 'text', required: true, description: 'Full name of applicant' },
        { name: 'defendant_name', type: 'text', required: true, description: 'Name of defendant employer/insurer' },
        { name: 'injury_date', type: 'date', required: true, description: 'Date of injury occurrence' },
        { name: 'injured_body_parts', type: 'text', required: true, description: 'Specific body parts injured' },
        { name: 'examining_physician', type: 'text', required: true, description: 'Name and credentials of examining doctor' },
        { name: 'amount_billed', type: 'number', required: true, description: 'Dollar amount of medical-legal bill' },
        { name: 'attorney_name', type: 'text', required: true, description: 'Attorney name for signature' },
        { name: 'bar_number', type: 'text', required: true, description: 'State Bar number' }
      ],
      sections: [
        {
          id: 'factual_background',
          name: 'Factual Background',
          type: 'factual',
          required: true,
          agentRequirements: ['legal_agent', 'research_agent'],
          dependencies: []
        },
        {
          id: 'legal_basis',
          name: 'Legal Basis',
          type: 'legal_analysis',
          required: true,
          agentRequirements: ['legal_agent'],
          dependencies: ['factual_background']
        }
      ],
      metadata: {
        version: '2.1.0',
        author: 'GenieFlow Legal Templates',
        profession: 'legal',
        jurisdiction: 'California',
        compliance_standards: ['Labor Code 4622', 'Labor Code 5813', 'WCAB Rules'],
        last_updated: new Date('2025-08-17'),
        accuracy_rating: 0.95
      }
    });

    // Legal Brief Template
    this.addTemplate({
      id: 'legal_brief_general',
      name: 'Legal Brief - General',
      type: 'legal_brief',
      profession: 'legal',
      content: `# {{brief_title}}

**CASE:** {{case_name}}
**CASE NO.:** {{case_number}}
**COURT:** {{court_name}}
**DATE:** {{filing_date}}

---

## I. INTRODUCTION

{{introduction_summary}}

## II. STATEMENT OF FACTS

{{statement_of_facts}}

## III. ARGUMENT

### A. {{argument_point_1_header}}

{{argument_point_1_content}}

**Supporting Authority:**
- {{authority_citation_1}}
- {{authority_citation_2}}

### B. {{argument_point_2_header}}

{{argument_point_2_content}}

**Supporting Authority:**
- {{authority_citation_3}}
- {{authority_citation_4}}

## IV. CONCLUSION

{{conclusion_summary}}

---

**Respectfully submitted,**

{{attorney_signature}}
{{attorney_name}}, Esq.
{{law_firm_name}}`,
      variables: [
        { name: 'brief_title', type: 'text', required: true, description: 'Title of the legal brief' },
        { name: 'case_name', type: 'text', required: true, description: 'Full case name' },
        { name: 'case_number', type: 'text', required: true, description: 'Court case number' },
        { name: 'court_name', type: 'text', required: true, description: 'Name of the court' }
      ],
      sections: [
        {
          id: 'introduction',
          name: 'Introduction',
          type: 'overview',
          required: true,
          agentRequirements: ['legal_agent'],
          dependencies: []
        },
        {
          id: 'argument',
          name: 'Legal Argument',
          type: 'legal_analysis',
          required: true,
          agentRequirements: ['legal_agent', 'research_agent'],
          dependencies: ['introduction']
        }
      ],
      metadata: {
        version: '1.0.0',
        author: 'GenieFlow Legal Templates',
        profession: 'legal',
        compliance_standards: ['Court Rules', 'Legal Writing Standards'],
        last_updated: new Date('2025-08-17'),
        accuracy_rating: 0.90
      }
    });
  }

  private addMedicalTemplates(): void {
    // Medical Report Template
    this.addTemplate({
      id: 'medical_report_comprehensive',
      name: 'Comprehensive Medical Report',
      type: 'medical_report',
      profession: 'medical',
      content: `# MEDICAL REPORT

**PATIENT:** {{patient_name}}
**DOB:** {{date_of_birth}}
**MRN:** {{medical_record_number}}
**DATE OF EXAMINATION:** {{examination_date}}
**PHYSICIAN:** {{physician_name}}, {{physician_credentials}}

---

## I. CHIEF COMPLAINT

{{chief_complaint}}

## II. HISTORY OF PRESENT ILLNESS

{{history_present_illness}}

## III. PAST MEDICAL HISTORY

{{past_medical_history}}

## IV. MEDICATIONS

{{current_medications}}

## V. PHYSICAL EXAMINATION

### Vital Signs
- **Blood Pressure:** {{blood_pressure}}
- **Heart Rate:** {{heart_rate}}
- **Temperature:** {{temperature}}
- **Respiratory Rate:** {{respiratory_rate}}

### Physical Findings
{{physical_examination_findings}}

## VI. DIAGNOSTIC STUDIES

{{diagnostic_studies}}

## VII. ASSESSMENT AND PLAN

### Primary Diagnosis:
{{primary_diagnosis}} (ICD-10: {{icd10_code}})

### Secondary Diagnoses:
{{secondary_diagnoses}}

### Treatment Plan:
{{treatment_plan}}

### Prognosis:
{{prognosis}}

## VIII. RECOMMENDATIONS

{{recommendations}}

---

**Physician Signature:**
{{physician_signature}}
{{physician_name}}, {{physician_credentials}}
License No.: {{license_number}}
Date: {{report_date}}

---

**DISCLAIMER:** This medical report is based on examination findings and clinical judgment. All medical decisions should be made in consultation with appropriate healthcare professionals.`,
      variables: [
        { name: 'patient_name', type: 'text', required: true, description: 'Full patient name' },
        { name: 'date_of_birth', type: 'date', required: true, description: 'Patient date of birth' },
        { name: 'examination_date', type: 'date', required: true, description: 'Date of examination' },
        { name: 'physician_name', type: 'text', required: true, description: 'Examining physician name' },
        { name: 'physician_credentials', type: 'text', required: true, description: 'Physician credentials (MD, DO, etc.)' },
        { name: 'primary_diagnosis', type: 'text', required: true, description: 'Primary medical diagnosis' },
        { name: 'icd10_code', type: 'text', required: true, description: 'ICD-10 diagnostic code' }
      ],
      sections: [
        {
          id: 'examination',
          name: 'Physical Examination',
          type: 'clinical_assessment',
          required: true,
          agentRequirements: ['medical_agent'],
          dependencies: []
        },
        {
          id: 'diagnosis',
          name: 'Assessment and Diagnosis',
          type: 'medical_analysis',
          required: true,
          agentRequirements: ['medical_agent', 'qa_agent'],
          dependencies: ['examination']
        }
      ],
      metadata: {
        version: '1.2.0',
        author: 'GenieFlow Medical Templates',
        profession: 'medical',
        compliance_standards: ['HIPAA', 'Medical Record Standards', 'ICD-10'],
        last_updated: new Date('2025-08-17'),
        accuracy_rating: 0.92
      }
    });
  }

  private addBusinessTemplates(): void {
    // Business Plan Template
    this.addTemplate({
      id: 'business_plan_comprehensive',
      name: 'Comprehensive Business Plan',
      type: 'business_plan',
      profession: 'business',
      content: `# {{company_name}} BUSINESS PLAN

**Prepared by:** {{prepared_by}}
**Date:** {{preparation_date}}
**Version:** {{plan_version}}

---

## EXECUTIVE SUMMARY

### Company Overview
{{company_overview}}

### Mission Statement
{{mission_statement}}

### Key Success Factors
{{key_success_factors}}

### Financial Summary
- **Startup Costs:** $\{\{startup_costs\}\}
- **Year 1 Revenue Projection:** $\{\{year1_revenue\}\}
- **Break-even Point:** \{\{breakeven_timeline\}\}

## 1. COMPANY DESCRIPTION

### Business Concept
{{business_concept}}

### Industry Analysis
{{industry_analysis}}

### Target Market
{{target_market}}

## 2. MARKET ANALYSIS

### Market Size
{{market_size}}

### Market Trends
{{market_trends}}

### Competitive Analysis
{{competitive_analysis}}

## 3. ORGANIZATION & MANAGEMENT

### Organizational Structure
{{organizational_structure}}

### Management Team
{{management_team}}

### Personnel Plan
{{personnel_plan}}

## 4. PRODUCTS & SERVICES

### Product/Service Description
{{product_service_description}}

### Competitive Advantages
{{competitive_advantages}}

### Research & Development
{{research_development}}

## 5. MARKETING & SALES

### Marketing Strategy
{{marketing_strategy}}

### Sales Strategy
{{sales_strategy}}

### Pricing Strategy
{{pricing_strategy}}

## 6. FINANCIAL PROJECTIONS

### Revenue Model
{{revenue_model}}

### Financial Assumptions
{{financial_assumptions}}

### 3-Year Financial Forecast
{{financial_forecast}}

## 7. FUNDING REQUEST

### Funding Requirements
{{funding_requirements}}

### Use of Funds
{{use_of_funds}}

### Return on Investment
{{roi_projections}}

## 8. APPENDICES

### Supporting Documents
{{supporting_documents}}

---

**Prepared by:**
{{preparer_signature}}
{{preparer_name}}
{{preparer_title}}
Date: {{signature_date}}`,
      variables: [
        { name: 'company_name', type: 'text', required: true, description: 'Company name' },
        { name: 'prepared_by', type: 'text', required: true, description: 'Plan preparer name' },
        { name: 'startup_costs', type: 'number', required: true, description: 'Initial startup costs' },
        { name: 'year1_revenue', type: 'number', required: true, description: 'First year revenue projection' }
      ],
      sections: [
        {
          id: 'market_analysis',
          name: 'Market Analysis',
          type: 'market_research',
          required: true,
          agentRequirements: ['business_agent', 'research_agent'],
          dependencies: []
        },
        {
          id: 'financial_projections',
          name: 'Financial Projections',
          type: 'financial_analysis',
          required: true,
          agentRequirements: ['business_agent'],
          dependencies: ['market_analysis']
        }
      ],
      metadata: {
        version: '1.1.0',
        author: 'GenieFlow Business Templates',
        profession: 'business',
        compliance_standards: ['GAAP', 'Business Plan Standards'],
        last_updated: new Date('2025-08-17'),
        accuracy_rating: 0.88
      }
    });
  }

  private addTechnicalTemplates(): void {
    // Technical Specification Template
    this.addTemplate({
      id: 'technical_specification',
      name: 'Technical Specification Document',
      type: 'technical_spec',
      profession: 'technical',
      content: `# {{project_name}} - TECHNICAL SPECIFICATION

**Project:** {{project_name}}
**Version:** {{spec_version}}
**Date:** {{creation_date}}
**Author:** {{author_name}}

---

## 1. OVERVIEW

### Purpose
{{project_purpose}}

### Scope
{{project_scope}}

### Objectives
{{project_objectives}}

## 2. SYSTEM ARCHITECTURE

### High-Level Architecture
{{high_level_architecture}}

### Component Overview
{{component_overview}}

### Technology Stack
{{technology_stack}}

## 3. FUNCTIONAL REQUIREMENTS

### Core Features
{{core_features}}

### User Stories
{{user_stories}}

### Use Cases
{{use_cases}}

## 4. NON-FUNCTIONAL REQUIREMENTS

### Performance Requirements
{{performance_requirements}}

### Security Requirements
{{security_requirements}}

### Scalability Requirements
{{scalability_requirements}}

## 5. API SPECIFICATIONS

### Endpoints
{{api_endpoints}}

### Data Models
{{data_models}}

### Authentication
{{authentication_spec}}

## 6. DATABASE DESIGN

### Schema Design
{{database_schema}}

### Data Relationships
{{data_relationships}}

### Indexing Strategy
{{indexing_strategy}}

## 7. IMPLEMENTATION PLAN

### Development Phases
{{development_phases}}

### Timeline
{{project_timeline}}

### Resource Requirements
{{resource_requirements}}

## 8. TESTING STRATEGY

### Testing Approach
{{testing_approach}}

### Test Cases
{{test_cases}}

### Quality Assurance
{{qa_strategy}}

---

**Document Control:**
- **Created:** {{creation_date}}
- **Last Modified:** {{last_modified}}
- **Version:** {{spec_version}}
- **Status:** {{document_status}}`,
      variables: [
        { name: 'project_name', type: 'text', required: true, description: 'Name of the technical project' },
        { name: 'spec_version', type: 'text', required: true, description: 'Specification version number' },
        { name: 'author_name', type: 'text', required: true, description: 'Technical specification author' }
      ],
      sections: [
        {
          id: 'architecture',
          name: 'System Architecture',
          type: 'technical_design',
          required: true,
          agentRequirements: ['technical_agent'],
          dependencies: []
        },
        {
          id: 'implementation',
          name: 'Implementation Plan',
          type: 'project_planning',
          required: true,
          agentRequirements: ['technical_agent', 'business_agent'],
          dependencies: ['architecture']
        }
      ],
      metadata: {
        version: '1.0.0',
        author: 'GenieFlow Technical Templates',
        profession: 'technical',
        compliance_standards: ['Software Development Standards', 'API Documentation Standards'],
        last_updated: new Date('2025-08-17'),
        accuracy_rating: 0.90
      }
    });
  }

  private addArchitectureTemplates(): void {
    // Architectural Design Brief Template
    this.addTemplate({
      id: 'architecture_design_brief',
      name: 'Architectural Design Brief',
      type: 'architecture_brief',
      profession: 'architecture',
      content: `# ARCHITECTURAL DESIGN BRIEF

**Project:** {{project_name}}
**Client:** {{client_name}}
**Architect:** {{architect_name}}
**Date:** {{project_date}}

---

## 1. PROJECT OVERVIEW

### Project Description
{{project_description}}

### Site Location
{{site_location}}

### Project Type
{{project_type}}

## 2. CLIENT REQUIREMENTS

### Functional Requirements
{{functional_requirements}}

### Spatial Requirements
{{spatial_requirements}}

### Budget Parameters
{{budget_parameters}}

## 3. SITE ANALYSIS

### Site Conditions
{{site_conditions}}

### Zoning Requirements
{{zoning_requirements}}

### Building Codes
{{building_codes}}

## 4. DESIGN CONCEPT

### Design Philosophy
{{design_philosophy}}

### Architectural Style
{{architectural_style}}

### Sustainability Features
{{sustainability_features}}

## 5. BUILDING SPECIFICATIONS

### Structural System
{{structural_system}}

### Materials Palette
{{materials_palette}}

### Mechanical Systems
{{mechanical_systems}}

## 6. COMPLIANCE & PERMITS

### Required Permits
{{required_permits}}

### Code Compliance
{{code_compliance}}

### Accessibility Standards
{{accessibility_standards}}

---

**Professional Seal:**

{{architect_seal}}
{{architect_name}}, {{architect_credentials}}
License No.: {{license_number}}
Date: {{seal_date}}`,
      variables: [
        { name: 'project_name', type: 'text', required: true, description: 'Architectural project name' },
        { name: 'client_name', type: 'text', required: true, description: 'Client name' },
        { name: 'architect_name', type: 'text', required: true, description: 'Architect name' },
        { name: 'license_number', type: 'text', required: true, description: 'Architect license number' }
      ],
      sections: [
        {
          id: 'site_analysis',
          name: 'Site Analysis',
          type: 'site_assessment',
          required: true,
          agentRequirements: ['architecture_agent'],
          dependencies: []
        },
        {
          id: 'compliance',
          name: 'Code Compliance',
          type: 'regulatory_compliance',
          required: true,
          agentRequirements: ['architecture_agent', 'legal_agent'],
          dependencies: ['site_analysis']
        }
      ],
      metadata: {
        version: '1.0.0',
        author: 'GenieFlow Architecture Templates',
        profession: 'architecture',
        compliance_standards: ['Building Codes', 'ADA Standards', 'Zoning Requirements'],
        last_updated: new Date('2025-08-17'),
        accuracy_rating: 0.93
      }
    });
  }

  private addCreativeTemplates(): void {
    // Creative Brief Template
    this.addTemplate({
      id: 'creative_brief_comprehensive',
      name: 'Creative Brief',
      type: 'creative_brief',
      profession: 'creative',
      content: `# CREATIVE BRIEF

**Project:** {{project_name}}
**Client:** {{client_name}}
**Agency:** {{agency_name}}
**Date:** {{brief_date}}

---

## 1. PROJECT OVERVIEW

### Background
{{project_background}}

### Objectives
{{project_objectives}}

### Deliverables
{{project_deliverables}}

## 2. TARGET AUDIENCE

### Primary Audience
{{primary_audience}}

### Secondary Audience
{{secondary_audience}}

### Audience Insights
{{audience_insights}}

## 3. BRAND GUIDELINES

### Brand Personality
{{brand_personality}}

### Brand Voice
{{brand_voice}}

### Visual Identity
{{visual_identity}}

## 4. CREATIVE STRATEGY

### Key Message
{{key_message}}

### Creative Concept
{{creative_concept}}

### Tone and Style
{{tone_and_style}}

## 5. TECHNICAL SPECIFICATIONS

### Format Requirements
{{format_requirements}}

### Dimensions
{{dimensions}}

### Technical Constraints
{{technical_constraints}}

## 6. TIMELINE & BUDGET

### Project Timeline
{{project_timeline}}

### Budget Parameters
{{budget_parameters}}

### Milestones
{{project_milestones}}

---

**Approval:**
{{approver_signature}}
{{approver_name}}
{{approver_title}}
Date: {{approval_date}}`,
      variables: [
        { name: 'project_name', type: 'text', required: true, description: 'Creative project name' },
        { name: 'client_name', type: 'text', required: true, description: 'Client name' },
        { name: 'agency_name', type: 'text', required: true, description: 'Creative agency name' }
      ],
      sections: [
        {
          id: 'creative_strategy',
          name: 'Creative Strategy',
          type: 'creative_planning',
          required: true,
          agentRequirements: ['creative_agent'],
          dependencies: []
        },
        {
          id: 'brand_guidelines',
          name: 'Brand Guidelines',
          type: 'brand_strategy',
          required: true,
          agentRequirements: ['creative_agent', 'business_agent'],
          dependencies: []
        }
      ],
      metadata: {
        version: '1.0.0',
        author: 'GenieFlow Creative Templates',
        profession: 'creative',
        compliance_standards: ['Brand Standards', 'Creative Guidelines'],
        last_updated: new Date('2025-08-17'),
        accuracy_rating: 0.85
      }
    });
  }

  private addGeneralTemplates(): void {
    // General Document Template
    this.addTemplate({
      id: 'general_document',
      name: 'General Professional Document',
      type: 'general_document',
      profession: 'general',
      content: `# {{document_title}}

**Date:** {{document_date}}
**Author:** {{author_name}}
**Version:** {{document_version}}

---

## 1. OVERVIEW

{{document_overview}}

## 2. MAIN CONTENT

{{main_content}}

## 3. CONCLUSION

{{conclusion}}

---

**Document Information:**
- **Created:** {{creation_date}}
- **Last Modified:** {{last_modified}}
- **Status:** {{document_status}}`,
      variables: [
        { name: 'document_title', type: 'text', required: true, description: 'Document title' },
        { name: 'author_name', type: 'text', required: true, description: 'Document author' }
      ],
      sections: [
        {
          id: 'main_content',
          name: 'Main Content',
          type: 'general_content',
          required: true,
          agentRequirements: ['template_agent'],
          dependencies: []
        }
      ],
      metadata: {
        version: '1.0.0',
        author: 'GenieFlow General Templates',
        profession: 'general',
        compliance_standards: ['Professional Document Standards'],
        last_updated: new Date('2025-08-17'),
        accuracy_rating: 0.80
      }
    });
  }

  private addTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  public async findOptimalTemplate(criteria: TemplateSearchCriteria): Promise<Template> {
    console.log(`📋 TEMPLATE SEARCH: Looking for ${criteria.documentType} template for ${criteria.profession}`);
    
    // Search for matching templates
    const matchingTemplates = Array.from(this.templates.values()).filter(template => {
      const typeMatch = template.type.toLowerCase().includes(criteria.documentType.toLowerCase()) ||
                       criteria.documentType.toLowerCase().includes(template.type.toLowerCase());
      const professionMatch = template.profession.toLowerCase() === criteria.profession.toLowerCase() ||
                             template.profession === 'general';
      
      return typeMatch && professionMatch;
    });
    
    if (matchingTemplates.length === 0) {
      console.log('📋 TEMPLATE SEARCH: No specific template found, using general template');
      return this.templates.get('general_document') || this.createFallbackTemplate(criteria);
    }
    
    // Score templates and return the best match
    const scoredTemplates = matchingTemplates.map(template => ({
      template,
      score: this.scoreTemplate(template, criteria)
    }));
    
    scoredTemplates.sort((a, b) => b.score - a.score);
    
    const bestTemplate = scoredTemplates[0].template;
    console.log(`📋 TEMPLATE SEARCH: Selected '${bestTemplate.name}' (score: ${scoredTemplates[0].score})`);
    
    return bestTemplate;
  }

  private scoreTemplate(template: Template, criteria: TemplateSearchCriteria): number {
    let score = 0;
    
    // Exact profession match
    if (template.profession.toLowerCase() === criteria.profession.toLowerCase()) {
      score += 50;
    }
    
    // Document type match
    if (template.type.toLowerCase() === criteria.documentType.toLowerCase()) {
      score += 40;
    }
    
    // Partial type match
    if (template.type.toLowerCase().includes(criteria.documentType.toLowerCase()) ||
        criteria.documentType.toLowerCase().includes(template.type.toLowerCase())) {
      score += 20;
    }
    
    // Jurisdiction match
    if (criteria.jurisdiction && template.metadata.jurisdiction === criteria.jurisdiction) {
      score += 10;
    }
    
    // Template quality rating
    score += template.metadata.accuracy_rating * 10;
    
    // Recency bonus
    const daysSinceUpdate = (Date.now() - template.metadata.last_updated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) {
      score += 5;
    }
    
    return score;
  }

  private createFallbackTemplate(criteria: TemplateSearchCriteria): Template {
    console.log('📋 TEMPLATE SERVICE: Creating fallback template');
    
    return {
      id: `fallback_${Date.now()}`,
      name: `${criteria.documentType} Template`,
      type: criteria.documentType,
      profession: criteria.profession,
      content: `# ${criteria.documentType.toUpperCase()}

**Date:** {{creation_date}}
**Author:** {{author_name}}

---

## Overview

{{document_overview}}

## Main Content

{{main_content}}

## Conclusion

{{conclusion}}

---

*This document was created using a general template. For more specific formatting and content requirements, please consult with a professional in the ${criteria.profession} field.*`,
      variables: [
        { name: 'creation_date', type: 'date', required: true, description: 'Document creation date' },
        { name: 'author_name', type: 'text', required: true, description: 'Document author name' },
        { name: 'document_overview', type: 'text', required: true, description: 'Overview of the document' },
        { name: 'main_content', type: 'text', required: true, description: 'Main document content' }
      ],
      sections: [
        {
          id: 'content',
          name: 'Main Content',
          type: 'general',
          required: true,
          agentRequirements: ['template_agent'],
          dependencies: []
        }
      ],
      metadata: {
        version: '1.0.0',
        author: 'GenieFlow Fallback Generator',
        profession: criteria.profession,
        compliance_standards: [],
        last_updated: new Date(),
        accuracy_rating: 0.70
      }
    };
  }

  public getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  public getTemplatesByProfession(profession: string): Template[] {
    return Array.from(this.templates.values()).filter(
      template => template.profession.toLowerCase() === profession.toLowerCase()
    );
  }

  public getTemplatesByType(documentType: string): Template[] {
    return Array.from(this.templates.values()).filter(
      template => template.type.toLowerCase().includes(documentType.toLowerCase())
    );
  }

  // Database integration methods for user templates
  public async saveTemplateToDatabase(template: Omit<Template, 'id'>, userId: string, isPublic: boolean = false): Promise<string> {
    console.log(`📋 SAVING TEMPLATE: '${template.name}' to database`);
    
    try {
      const templateData = {
        user_id: userId,
        title: template.name,
        content: template.content,
        document_type: template.type,
        is_public: isPublic,
        template_metadata: {
          profession: template.profession,
          variables: template.variables,
          sections: template.sections,
          jurisdiction: template.metadata.jurisdiction,
          compliance_standards: template.metadata.compliance_standards,
          accuracy_rating: template.metadata.accuracy_rating
        }
      };

      const { data, error } = await this.supabase
        .from('document_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add to local cache
      const fullTemplate = this.convertDatabaseTemplateToTemplate(data);
      this.templates.set(fullTemplate.id, fullTemplate);
      this.databaseTemplates.set(fullTemplate.id, data);

      console.log(`📋 TEMPLATE SAVED: '${template.name}' with ID: ${data.id}`);
      return data.id;

    } catch (error) {
      console.error('📋 SAVE ERROR:', error);
      throw new Error(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async updateTemplateInDatabase(templateId: string, updates: Partial<Template>, userId: string): Promise<void> {
    console.log(`📋 UPDATING TEMPLATE: ${templateId}`);
    
    try {
      const templateData: any = {};
      
      if (updates.name) templateData.title = updates.name;
      if (updates.content) templateData.content = updates.content;
      if (updates.type) templateData.document_type = updates.type;
      
      if (updates.variables || updates.sections || updates.metadata) {
        const existing = this.databaseTemplates.get(templateId);
        templateData.template_metadata = {
          ...(existing?.template_metadata || {}),
          ...(updates.variables && { variables: updates.variables }),
          ...(updates.sections && { sections: updates.sections }),
          ...(updates.metadata && {
            profession: updates.metadata.profession,
            jurisdiction: updates.metadata.jurisdiction,
            compliance_standards: updates.metadata.compliance_standards,
            accuracy_rating: updates.metadata.accuracy_rating
          })
        };
      }

      const { error } = await this.supabase
        .from('document_templates')
        .update(templateData)
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Update local cache
      if (this.templates.has(templateId)) {
        const existing = this.templates.get(templateId)!;
        const updated = { ...existing, ...updates };
        this.templates.set(templateId, updated);
      }

      console.log(`📋 TEMPLATE UPDATED: ${templateId}`);

    } catch (error) {
      console.error('📋 UPDATE ERROR:', error);
      throw new Error(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async deleteTemplateFromDatabase(templateId: string, userId: string): Promise<void> {
    console.log(`📋 DELETING TEMPLATE: ${templateId}`);
    
    try {
      const { error } = await this.supabase
        .from('document_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Remove from local cache
      this.templates.delete(templateId);
      this.databaseTemplates.delete(templateId);

      console.log(`📋 TEMPLATE DELETED: ${templateId}`);

    } catch (error) {
      console.error('📋 DELETE ERROR:', error);
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getUserTemplates(userId: string): Promise<Template[]> {
    console.log(`📋 LOADING USER TEMPLATES for user: ${userId}`);
    
    try {
      const { data: templates, error } = await this.supabase
        .from('document_templates')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (templates || []).map(dbTemplate => this.convertDatabaseTemplateToTemplate(dbTemplate));

    } catch (error) {
      console.error('📋 USER TEMPLATES ERROR:', error);
      return [];
    }
  }

  public async getPublicTemplates(): Promise<Template[]> {
    console.log('📋 LOADING PUBLIC TEMPLATES');
    
    try {
      const { data: templates, error } = await this.supabase
        .from('document_templates')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (templates || []).map(dbTemplate => this.convertDatabaseTemplateToTemplate(dbTemplate));

    } catch (error) {
      console.error('📋 PUBLIC TEMPLATES ERROR:', error);
      return [];
    }
  }

  public async createTemplateFromDocument(
    documentContent: string,
    templateName: string,
    documentType: string,
    profession: string,
    userId: string,
    isPublic: boolean = false
  ): Promise<string> {
    console.log(`📋 CREATING TEMPLATE from document: '${templateName}'`);
    
    // Extract variables from the content
    const variables = this.extractVariablesFromContent(documentContent);
    const sections = this.extractSectionsFromContent(documentContent);
    
    const template: Omit<Template, 'id'> = {
      name: templateName,
      type: documentType,
      profession: profession,
      content: documentContent,
      variables,
      sections,
      metadata: {
        version: '1.0.0',
        author: 'User Generated',
        profession: profession,
        compliance_standards: [],
        last_updated: new Date(),
        accuracy_rating: 0.85
      }
    };

    return await this.saveTemplateToDatabase(template, userId, isPublic);
  }

  /**
   * 🤖 AI-Enhanced Template Generation
   * Creates optimized templates using Gemini AI based on knowledge base and user patterns
   */
  public async generateIntelligentTemplate(
    documentType: string,
    profession: string,
    userRequirements: string[],
    knowledgeBaseDocuments: any[],
    userId: string,
    assistantId?: string,
    isPublic: boolean = false
  ): Promise<string> {
    console.log(`🤖 AI TEMPLATE GENERATION: Creating intelligent template for ${documentType} - ${profession}`);
    
    try {
      // Step 1: Analyze knowledge base patterns
      const patterns = await this.analyzeKnowledgeBasePatterns(knowledgeBaseDocuments, documentType);
      console.log(`🔍 PATTERN ANALYSIS: Found ${patterns.length} relevant patterns`);
      
      // Step 2: Generate optimized template using Gemini AI
      const aiGeneratedTemplate = await this.generateTemplateWithAI(
        documentType,
        profession,
        userRequirements,
        patterns
      );
      
      // Step 3: Extract metadata and structure
      const variables = this.extractVariablesFromContent(aiGeneratedTemplate.content);
      const sections = this.extractSectionsFromContent(aiGeneratedTemplate.content);
      const complianceStandards = await this.detectComplianceStandards(aiGeneratedTemplate.content, profession);
      
      // Step 4: Create enhanced template with AI metadata
      const template: Omit<Template, 'id'> = {
        name: aiGeneratedTemplate.name,
        type: documentType,
        profession: profession,
        content: aiGeneratedTemplate.content,
        variables,
        sections,
        metadata: {
          version: '1.0.0',
          author: 'AI Generated - Gemini Enhanced',
          profession: profession,
          compliance_standards: complianceStandards,
          last_updated: new Date(),
          accuracy_rating: aiGeneratedTemplate.confidence || 0.90,
          ai_generated: true,
          source_patterns: patterns.length,
          user_requirements: userRequirements,
          assistant_id: assistantId
        }
      };

      // Step 5: Save to AI Drive (user/assistant specific)
      const templateId = await this.saveTemplateToAIDrive(template, userId, assistantId, isPublic);
      
      console.log(`✅ AI TEMPLATE CREATED: ${templateId} with ${variables.length} variables and ${sections.length} sections`);
      return templateId;
      
    } catch (error) {
      console.error('❌ AI TEMPLATE GENERATION FAILED:', error);
      throw new Error(`Failed to generate intelligent template: ${error.message}`);
    }
  }

  /**
   * 🔍 Analyze Knowledge Base for Document Patterns
   */
  private async analyzeKnowledgeBasePatterns(
    documents: any[],
    documentType: string
  ): Promise<any[]> {
    console.log(`🔍 PATTERN ANALYSIS: Analyzing ${documents.length} documents for ${documentType} patterns`);
    
    const patterns = [];
    
    for (const doc of documents.slice(0, 10)) { // Limit to prevent overwhelming AI
      if (doc.content && doc.content.length > 100) {
        const pattern = {
          title: doc.title || 'Untitled Document',
          content_sample: doc.content.substring(0, 1000), // First 1000 chars
          document_type: doc.document_type || 'unknown',
          structure_elements: this.extractStructuralElements(doc.content),
          key_phrases: this.extractKeyPhrases(doc.content, documentType)
        };
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * 🤖 Generate Template Content Using Gemini AI
   */
  private async generateTemplateWithAI(
    documentType: string,
    profession: string,
    userRequirements: string[],
    patterns: any[]
  ): Promise<{ name: string; content: string; confidence: number }> {
    console.log(`🤖 GEMINI AI: Generating optimized template for ${documentType}`);
    
    // Import AIService dynamically to avoid circular dependencies
    const { AIService } = await import('../../ai/aiService');
    const aiService = await AIService.getInstance();
    
    const prompt = `You are an expert legal document template creator. Create a professional, comprehensive template for a ${documentType} in the ${profession} field.

USER REQUIREMENTS:
${userRequirements.map(req => `- ${req}`).join('\n')}

KNOWLEDGE BASE PATTERNS:
${patterns.map(p => `
Document: ${p.title}
Type: ${p.document_type}
Structure: ${p.structure_elements.join(', ')}
Key Elements: ${p.key_phrases.join(', ')}
Sample: ${p.content_sample.substring(0, 300)}...
`).join('\n')}

INSTRUCTIONS:
1. Create a professional template with proper legal formatting
2. Include dynamic placeholders in [brackets] for customization
3. Incorporate best practices from the knowledge base patterns
4. Ensure compliance with professional standards
5. Make it adaptable and reusable
6. Include proper section headers and structure

TEMPLATE FORMAT:
- Use clear section headers (##)
- Include placeholder variables: [Insert_Variable_Name]
- Add instruction comments where helpful
- Maintain professional tone and formatting
- Ensure legal accuracy and completeness

Generate a comprehensive template that incorporates the patterns and meets professional standards.`;

    try {
      const response = await aiService.generateText(prompt);
      
      // Extract template name from the response or generate one
      const templateName = `AI-Generated ${documentType} Template - ${profession}`;
      
      return {
        name: templateName,
        content: response,
        confidence: 0.92 // High confidence for AI-generated templates
      };
      
    } catch (error) {
      console.error('🤖 GEMINI AI ERROR:', error);
      throw new Error(`AI template generation failed: ${error.message}`);
    }
  }

  /**
   * 💾 Save Template to AI Drive with User/Assistant Association
   */
  private async saveTemplateToAIDrive(
    template: Omit<Template, 'id'>,
    userId: string,
    assistantId?: string,
    isPublic: boolean = false
  ): Promise<string> {
    console.log(`💾 AI DRIVE: Saving template to user/assistant storage`);
    
    try {
      const { data, error } = await this.supabase
        .from('document_templates')
        .insert({
          user_id: userId,
          assistant_id: assistantId,
          title: template.name,
          content: template.content,
          document_type: template.type,
          is_public: isPublic,
          template_metadata: {
            profession: template.profession,
            variables: template.variables,
            sections: template.sections,
            ...template.metadata,
            ai_enhanced: true
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local cache
      const fullTemplate: Template = {
        ...template,
        id: data.id
      };
      
      this.templates.set(data.id, fullTemplate);
      this.databaseTemplates.set(data.id, data);
      
      console.log(`✅ AI DRIVE SAVED: Template ${data.id} stored for user ${userId}${assistantId ? ` and assistant ${assistantId}` : ''}`);
      return data.id;
      
    } catch (error) {
      console.error('💾 AI DRIVE ERROR:', error);
      throw new Error(`Failed to save template to AI Drive: ${error.message}`);
    }
  }

  /**
   * 🔍 Extract Structural Elements from Content
   */
  private extractStructuralElements(content: string): string[] {
    const elements = [];
    
    // Look for common structural patterns
    if (content.includes('COMES NOW')) elements.push('Legal Opening');
    if (content.includes('WHEREFORE')) elements.push('Prayer for Relief');
    if (content.includes('I. ') || content.includes('1. ')) elements.push('Numbered Sections');
    if (content.includes('Defendant:') || content.includes('Applicant:')) elements.push('Party Identification');
    if (content.includes('FACTUAL')) elements.push('Factual Allegations');
    if (content.includes('LEGAL')) elements.push('Legal Arguments');
    if (content.includes('CERTIFICATE')) elements.push('Service Certificate');
    if (content.includes('VERIFICATION')) elements.push('Verification');
    
    return elements;
  }

  /**
   * 🔍 Extract Key Phrases for Document Type
   */
  private extractKeyPhrases(content: string, documentType: string): string[] {
    const phrases = [];
    const lowerContent = content.toLowerCase();
    
    // Document type specific phrases
    if (documentType.toLowerCase().includes('petition')) {
      if (lowerContent.includes('penalty')) phrases.push('Penalties');
      if (lowerContent.includes('medical-legal')) phrases.push('Medical-Legal');
      if (lowerContent.includes('reconsideration')) phrases.push('Reconsideration');
      if (lowerContent.includes('labor code')) phrases.push('Labor Code');
    }
    
    if (documentType.toLowerCase().includes('brief')) {
      if (lowerContent.includes('argument')) phrases.push('Legal Arguments');
      if (lowerContent.includes('evidence')) phrases.push('Evidence');
      if (lowerContent.includes('case law')) phrases.push('Case Citations');
    }
    
    // Extract common legal phrases
    const commonPhrases = [
      'workers compensation', 'industrial injury', 'medical treatment',
      'qualified medical evaluator', 'administrative law judge', 'appeals board'
    ];
    
    commonPhrases.forEach(phrase => {
      if (lowerContent.includes(phrase)) {
        phrases.push(phrase.replace(/\b\w/g, l => l.toUpperCase()));
      }
    });
    
    return phrases.slice(0, 10); // Limit to top 10
  }

  /**
   * 🔍 Detect Compliance Standards from Content
   */
  private async detectComplianceStandards(content: string, profession: string): Promise<string[]> {
    const standards = [];
    const lowerContent = content.toLowerCase();
    
    // Legal profession standards
    if (profession.toLowerCase().includes('legal')) {
      if (lowerContent.includes('labor code')) standards.push('California Labor Code');
      if (lowerContent.includes('workers compensation')) standards.push('Workers Compensation Law');
      if (lowerContent.includes('wcab')) standards.push('WCAB Rules and Regulations');
      if (lowerContent.includes('due process')) standards.push('Due Process Requirements');
    }
    
    // Medical profession standards
    if (profession.toLowerCase().includes('medical')) {
      if (lowerContent.includes('hipaa')) standards.push('HIPAA Compliance');
      if (lowerContent.includes('medical record')) standards.push('Medical Records Standards');
    }
    
    // Business standards
    if (lowerContent.includes('contract')) standards.push('Contract Law');
    if (lowerContent.includes('confidential')) standards.push('Confidentiality Standards');
    
    return standards;
  }

  public async refreshTemplatesFromDatabase(): Promise<void> {
    console.log('📋 REFRESHING TEMPLATES from database');
    
    // Clear current templates
    this.templates.clear();
    this.databaseTemplates.clear();
    
    // Reload from database
    await this.loadTemplatesFromDatabase();
    
    // Load defaults if still empty
    if (this.templates.size === 0) {
      this.loadDefaultTemplates();
    }
  }

  /**
   * 📋 Get Template by ID from cache or database
   */
  public async getTemplate(templateId: string): Promise<Template | null> {
    console.log(`📋 GETTING TEMPLATE: ${templateId}`);
    
    // Check cache first
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId) || null;
    }
    
    // Try to load from database
    try {
      const { data, error } = await this.supabase
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error || !data) {
        console.log(`📋 TEMPLATE NOT FOUND: ${templateId}`);
        return null;
      }
      
      const template = this.convertDatabaseTemplateToTemplate(data);
      this.templates.set(template.id, template);
      this.databaseTemplates.set(template.id, data);
      
      return template;
      
    } catch (error) {
      console.error(`📋 TEMPLATE LOAD ERROR: ${templateId}`, error);
      return null;
    }
  }
}
