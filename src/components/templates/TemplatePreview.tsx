import React, { useState } from 'react';
import { ArrowLeft, Copy, Send } from 'lucide-react';
import type { Template } from '../../types';
import { generateTemplatePreview } from '../../services/ai/templateManager';

interface TemplatePreviewProps {
  template: Template;
  onBack: () => void;
  onUse: (content: string) => void;
}

export function TemplatePreview({ template, onBack, onUse }: TemplatePreviewProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');

  const handleVariableChange = (variable: string, value: string) => {
    const newVariables = { ...variables, [variable]: value };
    setVariables(newVariables);
    updatePreview(newVariables);
  };

  const updatePreview = async (newVariables: Record<string, string>) => {
    const previewContent = await generateTemplatePreview(template, newVariables);
    setPreview(previewContent);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="ml-2 text-lg font-medium">Preview Template</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigator.clipboard.writeText(preview)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
          >
            <Copy size={16} className="mr-2" />
            Copy
          </button>
          <button
            onClick={() => onUse(preview)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Send size={16} className="mr-2" />
            Use Template
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Variables</h3>
          <div className="space-y-4">
            {template.variables.map((variable) => (
              <div key={variable}>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {variable}
                </label>
                <input
                  type="text"
                  value={variables[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
          <div className="p-4 bg-gray-50 rounded-lg min-h-[200px] whitespace-pre-wrap">
            {preview || template.content}
          </div>
        </div>
      </div>
    </div>
  );
}