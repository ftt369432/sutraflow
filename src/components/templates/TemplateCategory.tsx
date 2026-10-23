import React from 'react';
import { useDrop } from 'react-dnd';
import { DraggableTemplate } from './DraggableTemplate';
import type { Template } from '../../types';

interface TemplateCategoryProps {
  title: string;
  templates: Template[];
  onSelect: (template: Template) => void;
  onDrop: (template: Template) => void;
}

export function TemplateCategory({
  title,
  templates,
  onSelect,
  onDrop,
}: TemplateCategoryProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TEMPLATE',
    drop: (item: Template) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`p-4 rounded-lg ${
        isOver
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'bg-gray-50 dark:bg-gray-800/50'
      }`}
    >
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="grid gap-4">
        {templates.map((template) => (
          <DraggableTemplate
            key={template.id}
            template={template}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}