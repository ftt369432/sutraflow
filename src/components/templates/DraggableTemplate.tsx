import React from 'react';
import { useDrag } from 'react-dnd';
import { FileText, Mail } from 'lucide-react';
import type { Template } from '../../types';

interface DraggableTemplateProps {
  template: Template;
  onSelect: (template: Template) => void;
}

export function DraggableTemplate({ template, onSelect }: DraggableTemplateProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TEMPLATE',
    item: template,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={() => onSelect(template)}
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          {template.category === 'email' ? (
            <Mail className="text-blue-500 dark:text-blue-400" size={20} />
          ) : (
            <FileText className="text-green-500 dark:text-green-400" size={20} />
          )}
          <h3 className="ml-2 font-medium text-gray-900 dark:text-white">
            {template.name}
          </h3>
        </div>
      </div>
      <div className="mt-3">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {template.content}
        </p>
      </div>
      {template.variables.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {template.variables.map((variable) => (
            <span
              key={variable}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
            >
              {variable}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}