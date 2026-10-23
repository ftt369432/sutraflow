import React from 'react';
import { FileText, Mail, MoreVertical } from 'lucide-react';
import type { Template } from '../../types';

interface TemplateListProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
}

export function TemplateList({ templates, onSelectTemplate }: TemplateListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow cursor-pointer"
          onClick={() => onSelectTemplate(template)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {template.category === 'email' ? (
                <Mail className="text-blue-500" size={20} />
              ) : (
                <FileText className="text-green-500" size={20} />
              )}
              <h3 className="ml-2 font-medium">{template.name}</h3>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
          </div>
          {template.variables.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {template.variables.map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {variable}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}