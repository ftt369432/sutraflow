import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { assistantTrainingService } from '@/services/assistantTrainingService';
import { TrainingEntry } from '@/types/training';

interface TrainingEntryFormProps {
  assistantId: string;
  onSuccess?: (entry: TrainingEntry) => void;
  onCancel?: () => void;
}

export const TrainingEntryForm: React.FC<TrainingEntryFormProps> = ({
  assistantId,
  onSuccess,
  onCancel
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || !answer.trim()) {
      setError('Both question and answer are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newEntry = await assistantTrainingService.addTrainingEntry(
        assistantId,
        question,
        answer
      );
      
      setQuestion('');
      setAnswer('');
      
      if (onSuccess) {
        onSuccess(newEntry);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add training entry');
      console.error('Error adding training entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-border p-4 rounded-md">
      <h3 className="text-lg font-medium">Add Training Entry</h3>
      
      <div>
        <label htmlFor="question" className="block text-sm font-medium mb-1">
          Question
        </label>
        <Textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would a user ask the assistant?"
          rows={3}
          className="w-full"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label htmlFor="answer" className="block text-sm font-medium mb-1">
          Answer
        </label>
        <Textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="How should the assistant respond?"
          rows={5}
          className="w-full"
          disabled={isSubmitting}
        />
      </div>
      
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Entry'}
        </Button>
      </div>
    </form>
  );
};

export default TrainingEntryForm;
