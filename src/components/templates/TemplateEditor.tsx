import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import type { Template } from '../../types';

interface TemplateEditorProps {
  template: Template;
  onBack: () => void;
  onSave: (template: Template) => void;
}

export function TemplateEditor({ template, onBack, onSave }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState(template);
  const [newVariable, setNewVariable] = useState('');

  const handleAddVariable = () => {
    if (newVariable && !editedTemplate.variables.includes(newVariable)) {
      setEditedTemplate({
        ...editedTemplate,
        variables: [...editedTemplate.variables, newVariable],
        content: editedTemplate.content + ` {{${newVariable}}}`,
      });
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setEditedTemplate({
      ...editedTemplate,
      variables: editedTemplate.variables.filter((v) => v !== variable),
      content: editedTemplate.content.replace(`{{${variable}}}`, ''),
    });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="ml-2 text-lg font-medium">Edit Template</h2>
        </div>
        <button
          onClick={() => onSave(editedTemplate)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Save size={16} className="mr-2" />
          Save Changes
        </button>
      </div>
      
      <div className="p-6 flex-1 overflow-auto">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name
          </label>
          <input
            type="text"
            value={editedTemplate.name}
            onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={editedTemplate.category}
            onChange={(e) => setEditedTemplate({
              ...editedTemplate,
              category: e.target.value as Template['category'],
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="email">Email</option>
            <option value="document">Document</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variables
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              placeholder="Add new variable"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddVariable}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {editedTemplate.variables.map((variable) => (
              <span
                key={variable}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center"
              >
                {variable}
                <button
                  onClick={() => handleRemoveVariable(variable)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            value={editedTemplate.content}
            onChange={(e) => setEditedTemplate({ ...editedTemplate, content: e.target.value })}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}