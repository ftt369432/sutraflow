import React from 'react';
import { Book, Brain, MessageSquare, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { TrainingEntry } from '@/services/assistantTrainingService';
import { Button } from '@/components/ui/Button';
import { AIAssistant } from '@/types/ai';

interface TrainingEntryCardProps {
  entry: TrainingEntry;
  onDelete?: (entry: TrainingEntry) => void;
  onEdit?: (entry: TrainingEntry) => void;
}

const TrainingEntryCard: React.FC<TrainingEntryCardProps> = ({ entry, onDelete, onEdit }) => {
  const getIconForType = () => {
    // Use Brain icon as default for all Q&A entries
    if (!entry.entry_type) {
      return <Brain className="h-4 w-4 text-purple-500" />;
    }
    
    // For backward compatibility with older entry types
    switch (entry.entry_type) {
      case 'example_conversation':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'knowledge_fact':
        return <Book className="h-4 w-4 text-green-500" />;
      case 'behavioral_prompt':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'capability_demo':
        return <Sparkles className="h-4 w-4 text-yellow-500" />;
      default:
        return <Brain className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTypeLabel = () => {
    // Use "Q&A" as default type label for new entries
    if (!entry.entry_type) {
      return 'Q&A';
    }
    
    // For backward compatibility with older entry types
    switch (entry.entry_type) {
      case 'example_conversation':
        return 'Example';
      case 'knowledge_fact':
        return 'Knowledge';
      case 'behavioral_prompt':
        return 'Behavior';
      case 'capability_demo':
        return 'Capability';
      default:
        return 'Q&A';
    }
  };

  return (
    <div className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary/50 dark:hover:border-primary-dark/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1">{getIconForType()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {getTypeLabel()}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(entry.created_at).toLocaleDateString()}
            </span>
          </div>          <div className="text-sm whitespace-pre-wrap break-words">
            {entry.question && (
              <div className="mb-2">
                <strong>Q:</strong> {entry.question}
              </div>
            )}
            {entry.answer && (
              <div>
                <strong>A:</strong> {entry.answer}
              </div>
            )}
            {/* Fallback to text_content for backward compatibility */}
            {!entry.question && !entry.answer && entry.text_content && (
              <p>{entry.text_content}</p>
            )}
          </div>
          {(entry.conversation_context || entry.expected_outcome) && (
            <div className="mt-2 text-xs text-muted-foreground">
              {entry.conversation_context && (
                <div className="mb-1">
                  <strong>Context:</strong>{' '}
                  {JSON.stringify(entry.conversation_context)}
                </div>
              )}
              {entry.expected_outcome && (
                <div>
                  <strong>Expected:</strong> {entry.expected_outcome}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {(onDelete || onEdit) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 mr-1"
              onClick={() => onEdit(entry)}
            >
              <span className="sr-only">Edit</span>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(entry)}
            >
              <span className="sr-only">Delete</span>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import TrainingEntryForm from './TrainingEntryForm';
import { assistantTrainingService } from '@/services/assistantTrainingService';
import { PlusCircle } from 'lucide-react';

interface AssistantTrainingListProps {
  assistant?: AIAssistant;
  assistantId?: string;
  entries?: TrainingEntry[];
  trainingData?: TrainingEntry[];
  onDelete?: (entry: TrainingEntry) => void;
  onEdit?: (entry: TrainingEntry) => void;
}

export const AssistantTrainingList: React.FC<AssistantTrainingListProps> = ({
  assistant,
  assistantId,
  entries,
  trainingData = [],
  onDelete,
  onEdit,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [localTrainingData, setLocalTrainingData] = useState<TrainingEntry[]>([]);
  
  // Use the assistantId from props or from the assistant object
  const currentAssistantId = assistantId || (assistant?.id || '');
  
  // Combine provided training data with local state
  const allTrainingData = [...(entries || trainingData || []), ...localTrainingData];
  
  const handleAddSuccess = (newEntry: TrainingEntry) => {
    setLocalTrainingData(prev => [...prev, newEntry]);
    setShowAddForm(false);
  };
  
  const handleDelete = async (entry: TrainingEntry) => {
    if (!entry.id) return;
    
    try {
      await assistantTrainingService.deleteTrainingEntry(entry.id);
      setLocalTrainingData(prev => prev.filter(e => e.id !== entry.id));
      
      if (onDelete) {
        onDelete(entry);
      }
    } catch (err) {
      console.error('Error deleting training entry:', err);
    }
  };  // Use combined training data with local state
  const trainingEntries = [...(entries || trainingData || []), ...localTrainingData];
  
  // Group entries by type - safely access the reduce method
  const groupedEntries = trainingEntries.reduce((acc, entry) => {
    // For new entries without entry_type, use "q_and_a" as the type
    const type = entry.entry_type || 'q_and_a';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(entry);
    return acc;
  }, {} as Record<string, TrainingEntry[]>);  return (
    <div className="space-y-6">
      {/* Add Entry Button & Form */}
      {currentAssistantId && (
        <div className="mb-6">
          {!showAddForm ? (
            <Button 
              variant="outline"
              className="w-full flex justify-center items-center gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <PlusCircle size={18} />
              Add Training Entry
            </Button>
          ) : (
            <TrainingEntryForm
              assistantId={currentAssistantId}
              onSuccess={handleAddSuccess}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </div>
      )}
      
      {/* Training Entries List */}
      {Object.entries(groupedEntries).map(([type, typeEntries]) => (
        <div key={type}>
          <h3 className="text-sm font-medium mb-3 capitalize">
            {type === 'q_and_a' ? 'Questions & Answers' : type.replace(/_/g, ' ')}s ({(typeEntries as TrainingEntry[]).length})
          </h3>
          <div className="space-y-3">
            {(typeEntries as TrainingEntry[]).map((entry: TrainingEntry) => (              <TrainingEntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}      {trainingEntries.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No training entries yet.</p>
          <p className="text-sm">Add some knowledge or examples to help train your assistant.</p>
        </div>
      )}
    </div>
  );
};
