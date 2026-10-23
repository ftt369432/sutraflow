import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { TemplateForm } from '../components/templates/TemplateForm';
import { TemplatePreview } from '../components/templates/TemplatePreview';
import { TemplateOrganizer } from '../components/templates/TemplateOrganizer';
import type { Template } from '../types';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateTemplate = (templateData: Partial<Template>) => {
    const newTemplate: Template = {
      id: String(Date.now()),
      name: templateData.name || '',
      category: templateData.category || 'email',
      content: templateData.content || '',
      variables: templateData.variables || [],
    };
    setTemplates([newTemplate, ...templates]);
    setShowForm(false);
  };

  const handleUpdateTemplate = (updatedTemplate: Template) => {
    setTemplates(templates.map(template =>
      template.id === updatedTemplate.id ? updatedTemplate : template
    ));
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {showForm ? (
        <TemplateForm
          onSubmit={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}
          onCancel={() => {
            setShowForm(false);
            setSelectedTemplate(null);
          }}
          initialData={selectedTemplate || undefined}
        />
      ) : showPreview && selectedTemplate ? (
        <TemplatePreview
          template={selectedTemplate}
          onBack={() => {
            setShowPreview(false);
            setSelectedTemplate(null);
          }}
          onUse={() => {
            // Handle template usage
            setShowPreview(false);
            setSelectedTemplate(null);
          }}
        />
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Templates
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Drag and drop templates to organize them
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus size={20} className="mr-2" />
                New Template
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          <TemplateOrganizer
            templates={filteredTemplates}
            onSelect={(template) => {
              setSelectedTemplate(template);
              setShowPreview(true);
            }}
            onUpdateTemplate={handleUpdateTemplate}
          />
        </>
      )}
    </div>
  );
}