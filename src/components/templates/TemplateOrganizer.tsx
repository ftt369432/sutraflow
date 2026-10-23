import React from 'react';
import type { Template } from '../../types';

interface TemplateOrganizerProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  onUpdateTemplate: (id: string, updates: Partial<Template>) => void;
}

export function TemplateOrganizer({ templates, onSelect, onUpdateTemplate }: TemplateOrganizerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div 
          key={template.id}
          className="p-4 border rounded-lg hover:shadow-md cursor-pointer"
          onClick={() => onSelect(template)}
        >
          <h3 className="font-medium">{template.name}</h3>
          <p className="text-sm text-gray-600">{template.description}</p>
        </div>
      ))}
    </div>
  );
}