import React, { useState, useEffect } from 'react';
import { Minimize, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { StickyNote } from './ProjectTypes';

interface StickyNotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const noteColors = [
  '#FFFDD0', // Light Yellow
  '#FFCCCC', // Light Red
  '#CCFFCC', // Light Green
  '#CCE0FF', // Light Blue
  '#E6CCFF', // Light Purple
  '#FFE5CC', // Light Orange
];

export const StickyNotesPanel: React.FC<StickyNotesPanelProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteColor, setNoteColor] = useState('#FFFDD0');

  useEffect(() => {
    const savedNotes = localStorage.getItem('stickyNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse saved notes', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
  }, [notes]);

  if (!isOpen) return null;

  const addNote = () => {
    if (currentNote.trim()) {
      if (editingId !== null) {
        const updatedNotes = notes.map((note) =>
          note.id === editingId ? { ...note, content: currentNote, color: noteColor } : note
        );
        setNotes(updatedNotes);
        setEditingId(null);
      } else {
        const newNote: StickyNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: currentNote,
          timestamp: Date.now(),
          color: noteColor
        };
        setNotes([...notes, newNote]);
      }
      setCurrentNote('');
      setNoteColor('#FFFDD0');
    }
  };

  const editNote = (note: StickyNote) => {
    setCurrentNote(note.content);
    setEditingId(note.id);
    setNoteColor(note.color);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed right-0 top-16 w-80 h-[calc(100vh-64px)] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">Sticky Notes</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <Minimize className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <textarea
          className="w-full p-2 border rounded-md text-sm min-h-24 text-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Type your note here..."
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          style={{ backgroundColor: noteColor }}
        />

        <div className="flex items-center gap-2 my-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Color:</span>
          {noteColors.map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded-full transition-transform ${
                noteColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setNoteColor(color)}
              aria-label={`Select ${color} color`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={addNote}>
            {editingId !== null ? 'Update Note' : 'Add Note'}
          </Button>
          {editingId !== null && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCurrentNote('');
                setEditingId(null);
                setNoteColor('#FFFDD0');
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="text-center text-slate-400 text-sm p-4">
            No notes yet. Add your first note above.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-md shadow-sm relative group border border-black/10 text-slate-900"
              style={{ backgroundColor: note.color }}
            >
              <p className="text-sm whitespace-pre-wrap mb-2">{note.content}</p>
              <div className="text-xs text-slate-500 mt-1">{formatDate(note.timestamp)}</div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex bg-white/80 dark:bg-slate-900/80 rounded transition-opacity">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => editNote(note)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteNote(note.id)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
