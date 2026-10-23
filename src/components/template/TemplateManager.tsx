import React, { useState, useEffect } from 'react';
import { Plus, Upload, Download, Edit, Trash2, Eye, Copy, Tag, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../../hooks/useToast';
import { TemplateService } from '../../services/agents/templates/TemplateService';
import { Template } from '../../services/agents/types/AgentTypes';
import { useAuth } from '../../contexts/AuthContext';

interface TemplateManagerProps {
  onTemplateSelect?: (template: Template) => void;
  showSelector?: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ onTemplateSelect, showSelector = false }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'user' | 'public' | 'all'>('user');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    profession: 'general',
    type: 'document',
    isPublic: false
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const templateService = new TemplateService();

  useEffect(() => {
    loadTemplates();
  }, [selectedTab]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      if (selectedTab === 'user' && user) {
        const userTemplates = await templateService.getUserTemplates(user.id);
        setUserTemplates(userTemplates);
        setTemplates(userTemplates);
      } else if (selectedTab === 'public') {
        const publicTemplates = await templateService.getPublicTemplates();
        setPublicTemplates(publicTemplates);
        setTemplates(publicTemplates);
      } else if (selectedTab === 'all') {
        const allTemplates = templateService.getAllTemplates();
        setTemplates(allTemplates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user) {
      toast.error('Please log in to create templates');
      return;
    }

    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const templateId = await templateService.createTemplateFromDocument(
        newTemplate.content,
        newTemplate.name,
        newTemplate.type,
        newTemplate.profession,
        user.id,
        newTemplate.isPublic
      );

      toast.success(`Template "${newTemplate.name}" created successfully!`);
      setShowCreateModal(false);
      setNewTemplate({ name: '', content: '', profession: 'general', type: 'document', isPublic: false });
      loadTemplates();

    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await templateService.deleteTemplateFromDatabase(templateId, user.id);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleTemplateSelect = (template: Template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      toast.success(`Template "${template.name}" selected`);
    }
  };

  const copyTemplateContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Template content copied to clipboard');
  };

  const exportTemplate = (template: Template) => {
    const templateData = JSON.stringify(template, null, 2);
    const blob = new Blob([templateData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="w-8 h-8" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Manager</h2>
          <p className="text-gray-600">Create, manage, and use document templates</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setSelectedTab('user')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Templates ({userTemplates.length})
        </button>
        <button
          onClick={() => setSelectedTab('public')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'public' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Public Templates ({publicTemplates.length})
        </button>
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Templates ({templates.length})
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={template.profession === 'legal' ? 'default' : 
                                  template.profession === 'medical' ? 'default' :
                                  template.profession === 'business' ? 'default' : 'outline'}>
                      {template.profession}
                    </Badge>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                </div>
                {template.metadata.accuracy_rating && template.metadata.accuracy_rating > 0.9 && (
                  <Star className="w-5 h-5 text-yellow-500" />
                )}
              </div>

              {/* Content Preview */}
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {template.content.substring(0, 150)}...
                </p>
              </div>

              {/* Variables Count */}
              {template.variables && template.variables.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Tag className="w-4 h-4" />
                  {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                {showSelector && (
                  <Button 
                    size="sm" 
                    onClick={() => handleTemplateSelect(template)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Use
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyTemplateContent(template.content)}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportTemplate(template)}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                {selectedTab === 'user' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {selectedTab === 'user' 
                ? 'Create your first template to get started'
                : 'No templates available in this category'
              }
            </p>
            {selectedTab === 'user' && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Template
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Create New Template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Profession</label>
                    <select
                      title="Select profession"
                      value={newTemplate.profession}
                      onChange={(e) => setNewTemplate({ ...newTemplate, profession: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="legal">Legal</option>
                      <option value="medical">Medical</option>
                      <option value="business">Business</option>
                      <option value="technical">Technical</option>
                      <option value="architecture">Architecture</option>
                      <option value="creative">Creative</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Document Type</label>
                    <input
                      type="text"
                      value={newTemplate.type}
                      onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., contract, letter, report"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Template Content *</label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your template content. Use {{variable_name}} for variables that will be filled in later."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use {`{{variable_name}}`} syntax for variables (e.g., {`{{client_name}}`}, {`{{creation_date}}`})
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newTemplate.isPublic}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Make this template public (others can use it)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
