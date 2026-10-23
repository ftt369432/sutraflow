import React, { useState, useEffect } from 'react';
import { X, Plus, Variable } from 'lucide-react';
import type { Template } from '../../types';
import { suggestVariables } from '../../services/ai/templateManager';

interface TemplateFormProps {
  onSubmit: (template: Partial<Template>) => void;
  onCancel: () => void;
  initialData?: Partial<Template>;
}

export function TemplateForm({ onSubmit, onCancel, initialData }: TemplateFormProps) {
  const [template, setTemplate] = useState<Partial<Template>>({
    name: initialData?.name || '',
    category: initialData?.category || 'email',
    content: initialData?.content || '',
    variables: initialData?.variables || [],
  });

  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    // Auto-detect variables when content changes
    const detectedVariables = suggestVariables(template.content || '');
    setTemplate(prev => ({
      ...prev,
      variables: Array.from(new Set([...detectedVariables]))
    }));
  }, [template.content]);

  const handleAddVariable = () => {
    if (newVariable && !template.variables?.includes(newVariable)) {
      setTemplate({
        ...template,
        variables: [...(template.variables || []), newVariable],
        content: template.content + ` {{${newVariable}}}`,
      });
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variableToRemove: string) => {
    setTemplate({
      ...template,
      variables: template.variables?.filter(v => v !== variableToRemove) || [],
      content: template.content?.replace(`{{${variableToRemove}}}`, '') || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(template);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {initialData ? 'Edit Template' : 'Create New Template'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter template name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={template.category}
                onChange={(e) => setTemplate({
                  ...template,
                  category: e.target.value as Template['category'],
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="email">Email Template</option>
                <option value="document">Document Template</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variables
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add variable (e.g., name, date)"
                />
                <button
                  type="button"
                  onClick={handleAddVariable}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Add
                </button>
              </div>
              {template.variables && template.variables.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <span
                      key={variable}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      <Variable size={14} className="mr-1" />
                      {variable}
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(variable)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={template.content}
                onChange={(e) => setTemplate({ ...template, content: e.target.value })}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder={`Enter template content...\nUse {{variable}} syntax for variables\nExample: Dear {{name}},\n\nThank you for {{reason}}.\n\nBest regards,\n{{sender}}`}
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {initialData ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}