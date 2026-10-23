import { AIAssistant } from './ai';
import { TrainingEntry } from './training';

export interface AssistantListProps {
  assistants: AIAssistant[];
  selectedAssistant: AIAssistant | null;
  onSelect: (assistant: AIAssistant) => void;
  onDelete?: (assistant: AIAssistant) => void;
}

export interface AssistantConfigProps {
  initialData?: AIAssistant | null;
  onSave: (assistant: AIAssistant) => Promise<void>;
  onCancel: () => void;
}

export interface AssistantTrainingListProps {
  assistant: AIAssistant;
  entries: TrainingEntry[];
  isLoading?: boolean;
  onDelete: (entry: TrainingEntry) => void;
  onEdit: (entry: TrainingEntry) => Promise<void>;
}

export interface AssistantChatProps {
  assistant: AIAssistant;
}
