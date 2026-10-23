/**
 * useCanvasTemplates - Template Management Hook
 * 
 * Manages canvas templates, including loading, creating, and applying templates
 * for different document types.
 */

import { useState, useCallback, useMemo } from 'react';
import { CanvasTemplateData } from './types';
import { useCanvas } from './useCanvas';
import { toast } from 'sonner';

const DEFAULT_TEMPLATES: CanvasTemplateData[] = [
  {
    id: 'legal-contract',
    name: 'Legal Contract',
    description: 'Professional legal contract template',
    category: 'Legal',
    type: 'document',
    content: `# LEGAL CONTRACT AGREEMENT

**Parties:**
- Party A: [Name]
- Party B: [Name]

**Terms and Conditions:**
1. [Term 1]
2. [Term 2]
3. [Term 3]

**Effective Date:** [Date]
**Signature:** ________________`,
    variables: {
      'Party A': '',
      'Party B': '',
      'Date': new Date().toLocaleDateString(),
    },
  },
  {
    id: 'business-plan',
    name: 'Business Plan',
    description: 'Comprehensive business plan template',
    category: 'Business',
    type: 'document',
    content: `# BUSINESS PLAN

## Executive Summary
[Brief overview of your business]

## Company Description
[Detailed description of your company]

## Market Analysis
[Market research and analysis]

## Financial Projections
[Financial forecasts and projections]`,
    variables: {
      'Company Name': '',
      'Industry': '',
      'Founded': '',
    },
  },
  {
    id: 'technical-report',
    name: 'Technical Report',
    description: 'Professional technical documentation',
    category: 'Technical',
    type: 'document',
    content: `# TECHNICAL REPORT

## Abstract
[Summary of the technical work]

## Introduction
[Background and objectives]

## Methodology
[Technical approach and methods]

## Results
[Findings and analysis]

## Conclusion
[Summary and recommendations]`,
  },
  {
    id: 'presentation',
    name: 'Presentation',
    description: 'Professional presentation template',
    category: 'Presentation',
    type: 'presentation',
    content: `# PRESENTATION TITLE

## Slide 1: Introduction
- Welcome
- Agenda
- Objectives

## Slide 2: Overview
- Key Points
- Main Topics

## Slide 3: Conclusion
- Summary
- Next Steps
- Questions`,
  },
];

export function useCanvasTemplates() {
  const { createDocument } = useCanvas();
  const [templates] = useState<CanvasTemplateData[]>(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);

  // Get templates by category
  const getTemplatesByCategory = useCallback((category: string) => {
    return templates.filter(template => template.category === category);
  }, [templates]);

  // Get template by ID
  const getTemplate = useCallback((templateId: string) => {
    return templates.find(template => template.id === templateId);
  }, [templates]);

  // Apply template variables
  const applyTemplateVariables = useCallback((
    content: string, 
    variables: Record<string, string>
  ) => {
    let processedContent = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `[${key}]`;
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return processedContent;
  }, []);

  // Create document from template
  const createFromTemplate = useCallback((
    templateId: string,
    variables: Record<string, string> = {},
    customTitle?: string
  ) => {
    setIsLoading(true);
    
    try {
      const template = getTemplate(templateId);
      
      if (!template) {
        toast.error('Template not found');
        return null;
      }

      // Process template content with variables
      const processedContent = applyTemplateVariables(template.content, {
        ...template.variables,
        ...variables,
      });

      // Create document
      const documentTitle = customTitle || template.name;
      const windowId = createDocument(template.type, documentTitle, processedContent);

      toast.success(`Created ${template.name}`);
      return windowId;
      
    } catch (error) {
      console.error('Error creating document from template:', error);
      toast.error('Failed to create document from template');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getTemplate, applyTemplateVariables, createDocument]);

  // Get template categories
  const categories = useMemo(() => {
    const categorySet = new Set(templates.map(template => template.category));
    return Array.from(categorySet);
  }, [templates]);

  // Get templates by type
  const getTemplatesByType = useCallback((type: CanvasTemplateData['type']) => {
    return templates.filter(template => template.type === type);
  }, [templates]);

  // Preview template
  const previewTemplate = useCallback((templateId: string, variables: Record<string, string> = {}) => {
    const template = getTemplate(templateId);
    
    if (!template) return null;
    
    return {
      ...template,
      content: applyTemplateVariables(template.content, {
        ...template.variables,
        ...variables,
      }),
    };
  }, [getTemplate, applyTemplateVariables]);

  return {
    // State
    templates,
    categories,
    isLoading,
    
    // Getters
    getTemplate,
    getTemplatesByCategory,
    getTemplatesByType,
    previewTemplate,
    
    // Actions
    createFromTemplate,
    applyTemplateVariables,
    
    // Computed
    templateCount: templates.length,
    hasTemplates: templates.length > 0,
  };
}
