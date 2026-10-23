import React, { useState, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { NotebookSection } from './NotebookSection';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { ArrowLeft, BookOpen, Share2, Star, Download, Upload, Brain, MessageSquare, RotateCw, Clock, Tag, BookMarked, CheckSquare, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { NotebookTaskIntegration } from './NotebookTaskIntegration';
import { NotebookBlock } from '../../types/notebook';

interface NotebookDetailProps {
  notebookId: string;
  onBack: () => void;
}

export const NotebookDetail: React.FC<NotebookDetailProps> = ({ notebookId, onBack }) => {
  const {
    notebooks,
    selectedNotebook,
    isLoading,
    error,
    selectNotebook,
    updateNotebook,
    addSection,
    updateSection,
    deleteSection,
    addBlock,
    updateBlock,
    deleteBlock,
    generateAIResponse,
    analyzeNotebook,
  } = useNotebookStore();

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'insights' | 'tasks'>('content');
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    selectNotebook(notebookId);
  }, [notebookId, selectNotebook]);

  useEffect(() => {
    if (selectedNotebook) {
      setNewTitle(selectedNotebook.title);
      setNewDescription(selectedNotebook.description);
    }
  }, [selectedNotebook]);

  if (isLoading || !selectedNotebook) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin mr-2">
          <RotateCw size={20} />
        </div>
        <p>Loading notebook...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-md">{error}</div>;
  }

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    await addSection(notebookId, newSectionTitle);
    setNewSectionTitle('');
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    await generateAIResponse(notebookId, aiPrompt, {
      currentSection: selectedSectionId || undefined,
    });
    setAiPrompt('');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await analyzeNotebook(notebookId);
    setIsAnalyzing(false);
    setActiveTab('insights');
  };

  const handleUpdateTitle = () => {
    if (newTitle.trim()) {
      updateNotebook(notebookId, { 
        title: newTitle,
        description: newDescription 
      });
    }
    setEditingTitle(false);
  };

  const handleToggleFavorite = () => {
    updateNotebook(notebookId, { 
      isFavorite: !selectedNotebook.isFavorite 
    });
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...selectedNotebook.tags, newTag];
    updateNotebook(notebookId, { tags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = selectedNotebook.tags.filter(t => t !== tag);
    updateNotebook(notebookId, { tags: updatedTags });
  };

  // Handler for adding a block to a section
  const handleAddBlockToSection = (sectionId: string, blockData: Omit<NotebookBlock, 'id' | 'createdAt' | 'updatedAt'>) => {
    addBlock(notebookId, sectionId, blockData);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={16} />
            <span className="ml-2">Back</span>
          </Button>
          {editingTitle ? (
            <div className="flex gap-2">
              <Input 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="max-w-xs font-semibold text-xl"
              />
              <Button size="sm" onClick={handleUpdateTitle}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
            </div>
          ) : (
            <h1 
              className="text-2xl font-bold flex items-center gap-2 cursor-pointer"
              onClick={() => setEditingTitle(true)}
            >
              <BookOpen size={22} className="text-primary" />
              {/* Revert back to using title, as store should now be consistent */}
              {selectedNotebook.title}
              {selectedNotebook.isFavorite && (
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
              )}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleToggleFavorite}
            className={selectedNotebook.isFavorite ? "bg-yellow-50" : ""}
          >
            <Star size={16} className={selectedNotebook.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
            <span className="ml-2">{selectedNotebook.isFavorite ? "Starred" : "Star"}</span>
          </Button>
          <Button variant="outline" size="sm">
            <Share2 size={16} />
            <span className="ml-2">Share</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} />
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>

      {/* Description and Metadata */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card className="col-span-2">
          {editingTitle ? (
            <CardContent className="pt-6">
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
            </CardContent>
          ) : (
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">{selectedNotebook.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} />
                <span>Last updated: {formatDate(selectedNotebook.lastModified)}</span>
                <span className="mx-2">•</span>
                <BookMarked size={14} />
                <span>Created: {formatDate(selectedNotebook.createdAt)}</span>
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedNotebook.tags.map(tag => (
                <div key={tag} className="bg-muted px-2 py-1 rounded-md text-xs flex items-center">
                  <span>{tag}</span>
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedNotebook.tags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button size="sm" onClick={handleAddTag}>Add</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'content' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'insights' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('insights')}
        >
          AI Insights
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${activeTab === 'tasks' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={16} />
          Tasks
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'content' && (
        <div className="flex flex-col gap-6">
          {/* Sections */}
          {selectedNotebook.sections.map((section) => (
            <NotebookSection
              key={section.id}
              section={section}
              onDelete={() => deleteSection(notebookId, section.id)}
              onUpdate={(updates) => updateSection(notebookId, section.id, updates)}
              onAddBlock={(blockData) => handleAddBlockToSection(section.id, blockData)}
              onDeleteBlock={(blockId) => deleteBlock(notebookId, section.id, blockId)}
              onUpdateBlock={(blockId, updates) => updateBlock(notebookId, section.id, blockId, updates)}
            />
          ))}

          {/* Add Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Add New Section</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Section title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              />
              <Button onClick={handleAddSection}>Add Section</Button>
            </div>
          </div>

          {/* AI Prompt */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Brain size={18} className="mr-2 text-primary" />
              Ask AI Assistant
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question or request content generation..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
              />
              <Button onClick={handleGenerateAI}>Generate</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI will add content to {selectedSectionId ? 'the selected section' : 'a new section'}
            </p>
          </div>

          {/* Analyze Button */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              <Brain size={16} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Notebook with AI'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {selectedNotebook.aiContext ? (
            <>
              {/* AI Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{selectedNotebook.aiContext.summary || 'No summary available yet.'}</p>
                </CardContent>
              </Card>
              
              {/* Key Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedNotebook.aiContext.keyTopics && selectedNotebook.aiContext.keyTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedNotebook.aiContext.keyTopics.map((topic, index) => (
                        <div key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                          {topic}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No key topics identified yet.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Suggested Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedNotebook.aiContext.suggestedActions && selectedNotebook.aiContext.suggestedActions.length > 0 ? (
                    <div className="space-y-3">
                      {selectedNotebook.aiContext.suggestedActions.map((action, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                          {action.type === 'task' && <CheckSquare className="text-blue-500" size={18} />}
                          {action.type === 'calendar' && <Calendar className="text-green-500" size={18} />}
                          {action.type === 'ai' && <Brain className="text-purple-500" size={18} />}
                          <div>
                            <p>{action.description}</p>
                            <div className={`mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full
                              ${action.priority === 'high' ? 'bg-red-100 text-red-700' : 
                                action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-green-100 text-green-700'}`}
                            >
                              {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)} Priority
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No suggested actions available yet.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Related Notebooks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Notebooks</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedNotebook.aiContext.relatedNotebooks && selectedNotebook.aiContext.relatedNotebooks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedNotebook.aiContext.relatedNotebooks.map((notebookId, index) => {
                        const relatedNotebook = notebooks.find(n => n.id === notebookId);
                        return relatedNotebook ? (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                            <BookOpen size={16} />
                            <span>{relatedNotebook.title}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No related notebooks identified yet.</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <Brain size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No AI insights yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Click the "Analyze Notebook with AI" button to generate insights about this notebook.
              </p>
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Notebook with AI'}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <NotebookTaskIntegration 
          notebook={selectedNotebook}
          onUpdateNotebook={(updatedNotebook) => updateNotebook(updatedNotebook.id, updatedNotebook)}
        />
      )}
    </div>
  );
};