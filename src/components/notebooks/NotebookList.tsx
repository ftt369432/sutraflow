import React from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NotebookSection } from './NotebookSection';
import { formatDate } from '../../lib/utils';
import { BookOpen, Star, ArrowUpRight, Archive, Trash2 } from 'lucide-react';

interface NotebookListProps {
  onSelectNotebook?: (id: string) => void;
}

export const NotebookList: React.FC<NotebookListProps> = ({ onSelectNotebook }) => {
  const {
    notebooks,
    selectedNotebook,
    isLoading,
    error,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    selectNotebook,
    addSection,
    updateSection,
    deleteSection,
    addBlock,
    updateBlock,
    deleteBlock,
    generateAIResponse,
  } = useNotebookStore();

  const [newNotebookTitle, setNewNotebookTitle] = React.useState('');
  const [newNotebookDescription, setNewNotebookDescription] = React.useState('');
  const [newSectionTitle, setNewSectionTitle] = React.useState('');
  const [selectedSection, setSelectedSection] = React.useState<string | null>(null);

  const handleCreateNotebook = async () => {
    if (!newNotebookTitle.trim()) return;
    await createNotebook(newNotebookTitle, newNotebookDescription);
    setNewNotebookTitle('');
    setNewNotebookDescription('');
  };

  const handleAddSection = async (notebookId: string) => {
    if (!newSectionTitle.trim()) return;
    await addSection(notebookId, newSectionTitle);
    setNewSectionTitle('');
  };

  const handleAddBlock = async (notebookId: string, sectionId: string, block: any) => {
    await addBlock(notebookId, sectionId, block);
  };

  const handleGenerateAIResponse = async (notebookId: string, message: string) => {
    await generateAIResponse(notebookId, message, {
      currentSection: selectedSection || undefined,
    });
  };

  const handleViewNotebook = (id: string) => {
    selectNotebook(id);
    if (typeof onSelectNotebook === 'function') {
      onSelectNotebook(id);
    }
  };

  const handleToggleFavorite = (id: string, isFavorite: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateNotebook(id, { isFavorite: !isFavorite });
  };

  const handleToggleArchive = (id: string, isArchived: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateNotebook(id, { isArchived: !isArchived });
  };

  const handleDeleteNotebook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notebook?')) {
      deleteNotebook(id);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const filteredNotebooks = notebooks.filter(notebook => !notebook.isArchived);
  const archivedNotebooks = notebooks.filter(notebook => notebook.isArchived);

  return (
    <div className="space-y-8">
      {notebooks.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-lg">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No notebooks yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first notebook to organize your thoughts, research, and ideas with AI assistance.
          </p>
          <div className="flex gap-4 justify-center">
            <Input
              placeholder="My first notebook"
              value={newNotebookTitle}
              onChange={(e) => setNewNotebookTitle(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleCreateNotebook}>Create Notebook</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotebooks.map((notebook) => (
              <Card 
                key={notebook.id} 
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewNotebook(notebook.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{notebook.title}</h3> 
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => handleToggleFavorite(notebook.id, notebook.isFavorite, e)}
                      className={`p-1.5 rounded-full ${notebook.isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500'}`}
                    >
                      <Star className={`h-4 w-4 ${notebook.isFavorite ? 'fill-yellow-500' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => handleToggleArchive(notebook.id, notebook.isArchived, e)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-gray-700"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{notebook.description}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Sections: {notebook.sections.length}
                    </p>
                    <p className="text-xs text-gray-400">
                      Last modified: {formatDate(notebook.lastModified)}
                    </p>
                  </div>
                  <button className="text-primary hover:underline text-sm flex items-center">
                    View <ArrowUpRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {archivedNotebooks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archived Notebooks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                {archivedNotebooks.map((notebook) => (
                  <Card 
                    key={notebook.id} 
                    className="p-6 hover:shadow-md transition-shadow cursor-pointer bg-muted/30"
                    onClick={() => handleViewNotebook(notebook.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold text-muted-foreground">{notebook.title}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => handleToggleArchive(notebook.id, notebook.isArchived, e)}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{notebook.description}</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Archived: {formatDate(notebook.updatedAt)}
                        </p>
                      </div>
                      <button className="text-primary hover:underline text-sm flex items-center">
                        View <ArrowUpRight className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};