import React, { useState, useEffect, useRef } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { sanitizeHtml } from '../../lib/sanitizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';
import { 
  Plus, 
  Save, 
  Trash, 
  FileText, 
  Tag, 
  Clock, 
  Calendar,
  LayoutDashboard,
  ListChecks,
  Share2,
  Upload,
  Info,
  ChevronLeft,
  ChevronRight,
  Pen
} from 'lucide-react';
import { format } from 'date-fns';

type EditorMode = 'edit' | 'preview' | 'split';

// Simple Markdown renderer component
const MarkdownPreview = ({ content }: { content: string }) => {
  const renderMarkdown = (text: string) => {
    // Very basic markdown rendering for demo purposes
    // In a real app, you'd use a proper markdown library like marked or react-markdown
    const html = text
      // Headers
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Lists
      .replace(/^\s*- (.*?)$/gm, '<li>$1</li>')
      .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      // Paragraphs
      .replace(/^((?!<[h|u|p]).+)$/gm, '<p>$1</p>')
      // Fix nested lists
      .replace(/<\/ul>\s*<ul>/g, '');

    return html;
  };

  return (
    <div 
      className="prose prose-slate max-w-none" 
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderMarkdown(content)) }} 
    />
  );
};

export function NotebookEditor() {
  const { 
    notes,
    notebooks,
    activeNoteId, 
    activeNotebookId,
    createNote,
    updateNote,
    deleteNote,
    setActiveNote,
    getNotesByNotebook
  } = useNotebookStore();
  
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const activeNote = notes.find(note => note.id === activeNoteId);
  const activeNotebook = notebooks.find(notebook => notebook.id === activeNotebookId);
  const notebookNotes = getNotesByNotebook(activeNotebookId || '');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (activeNote) {
      setNoteTitle(activeNote.title);
      setNoteContent(activeNote.content);
      setNoteTags(activeNote.tags);
      setIsEditing(false);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteTags([]);
      setIsEditing(true);
    }
  }, [activeNote]);
  
  const handleSaveNote = () => {
    if (activeNoteId && !isEditing) {
      setIsEditing(true);
      return;
    }
    
    if (!noteTitle.trim()) {
      alert('Please enter a note title');
      return;
    }
    
    if (activeNoteId) {
      updateNote(activeNoteId, {
        title: noteTitle,
        content: noteContent,
        tags: noteTags
      });
    } else if (activeNotebookId) {
      const newNoteId = createNote({
        notebookId: activeNotebookId,
        title: noteTitle,
        content: noteContent,
        tags: noteTags
      });
      setActiveNote(newNoteId);
    }
    
    setIsEditing(false);
  };
  
  const handleDeleteNote = () => {
    if (activeNoteId && confirm('Are you sure you want to delete this note?')) {
      deleteNote(activeNoteId);
    }
  };
  
  const handleCreateNewNote = () => {
    setNoteTitle('');
    setNoteContent('');
    setNoteTags([]);
    setActiveNote(null);
    setIsEditing(true);
    setTimeout(() => {
      const titleInput = document.getElementById('note-title') as HTMLInputElement;
      if (titleInput) titleInput.focus();
    }, 0);
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !noteTags.includes(tagInput.trim())) {
      setNoteTags([...noteTags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setNoteTags(noteTags.filter(t => t !== tag));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const newValue = noteContent.substring(0, start) + '  ' + noteContent.substring(end);
        setNoteContent(newValue);
        
        // Set cursor position after the inserted spaces
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Left sidebar - Notes list */}
      <div className="w-64 border-r p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{activeNotebook?.name || 'Notebook'}</h3>
          <Button size="sm" variant="ghost" onClick={handleCreateNewNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {notebookNotes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleCreateNewNote}
                >
                  Create your first note
                </Button>
              </div>
            ) : (
              notebookNotes.map(note => (
                <Card 
                  key={note.id} 
                  className={`p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
                    note.id === activeNoteId ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  onClick={() => setActiveNote(note.id)}
                >
                  <h4 className="font-medium text-sm truncate">{note.title}</h4>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(note.updated), 'MMM d, yyyy')}
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b">
          <Tabs defaultValue={editorMode} onValueChange={(value) => setEditorMode(value as EditorMode)}>
            <div className="flex justify-between items-center px-4 py-2">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="split">Split</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                {activeNoteId && (
                  <Button variant="outline" size="sm" onClick={handleDeleteNote}>
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
                <Button size="sm" onClick={handleSaveNote}>
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  ) : (
                    <>
                      <Pen className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Tabs>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            editorMode === 'split' ? (
              <div className="flex h-full">
                <div className="w-1/2 h-full flex flex-col">
                  <div className="p-4">
                    <Label htmlFor="note-title">Title</Label>
                    <Input
                      id="note-title"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="mb-2"
                      placeholder="Note title"
                    />
                    
                    <div className="flex items-center mb-2">
                      <Label className="mr-2">Tags</Label>
                      <div className="flex flex-1 flex-wrap gap-1 items-center">
                        {noteTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="px-2 py-0">
                            {tag}
                            <button 
                              className="ml-1 text-muted-foreground hover:text-foreground"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              {"×"}
                            </button>
                          </Badge>
                        ))}
                        <div className="flex">
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Add tag"
                            className="h-7 text-xs"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2" 
                            onClick={handleAddTag}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 pt-0">
                    <textarea
                      ref={textareaRef}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full h-full resize-none border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Start writing..."
                    />
                  </div>
                </div>
                
                <div className="w-1/2 border-l p-4 overflow-auto">
                  <h2 className="text-xl font-bold mb-4">{noteTitle || 'Untitled'}</h2>
                  <div className="prose prose-sm max-w-none">
                    <MarkdownPreview content={noteContent} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col p-4">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="mb-2"
                  placeholder="Note title"
                />
                
                <div className="flex items-center mb-2">
                  <Label className="mr-2">Tags</Label>
                  <div className="flex flex-1 flex-wrap gap-1 items-center">
                    {noteTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="px-2 py-0">
                        {tag}
                        <button 
                          className="ml-1 text-muted-foreground hover:text-foreground"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {"×"}
                        </button>
                      </Badge>
                    ))}
                    <div className="flex">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tag"
                        className="h-7 text-xs"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2" 
                        onClick={handleAddTag}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full resize-none border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Start writing..."
                  />
                </div>
              </div>
            )
          ) : (
            editorMode === 'edit' ? (
              <div className="h-full p-4">
                <div className="bg-muted p-8 rounded-md flex items-center justify-center h-full">
                  <div className="text-center">
                    <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">View Only Mode</h3>
                    <p className="text-muted-foreground mb-4">
                      Click the Edit button to make changes to this note
                    </p>
                    <Button onClick={() => setIsEditing(true)}>
                      <Pen className="h-4 w-4 mr-1" />
                      Edit Note
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full p-6">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold mb-1">{noteTitle}</h2>
                  
                  {noteTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {noteTags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground mb-6 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Last updated {activeNote && format(new Date(activeNote.updated), 'MMMM d, yyyy h:mm a')}
                  </div>
                  
                  <div className="prose prose-lg max-w-none">
                    <MarkdownPreview content={noteContent} />
                  </div>
                </div>
              </ScrollArea>
            )
          )}
        </div>
      </div>
    </div>
  );
} 