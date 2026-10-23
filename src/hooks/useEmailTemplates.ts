import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EmailTemplate, Email } from '../types';

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const addTemplate = useCallback((template: Omit<EmailTemplate, 'id' | 'usageCount'>) => {
    setTemplates(current => [
      ...current,
      { ...template, id: uuidv4(), usageCount: 0 }
    ]);
  }, []);

  const getSuggestedTemplates = useCallback((email: Partial<Email>) => {
    return templates
      .filter(template => {
        // Match based on subject similarity or content keywords
        const subjectMatch = email.subject?.toLowerCase().includes(template.subject.toLowerCase());
        const contentMatch = template.tags.some(tag => 
          email.content?.toLowerCase().includes(tag.toLowerCase())
        );
        return subjectMatch || contentMatch;
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  }, [templates]);

  const useTemplate = useCallback((templateId: string) => {
    setTemplates(current =>
      current.map(template =>
        template.id === templateId
          ? {
              ...template,
              usageCount: template.usageCount + 1,
              lastUsed: new Date()
            }
          : template
      )
    );
  }, []);

  return {
    templates,
    addTemplate,
    getSuggestedTemplates,
    useTemplate
  };
} 