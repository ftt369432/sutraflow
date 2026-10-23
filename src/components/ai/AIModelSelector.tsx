import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/Popover';

interface ModelConfig {
  name: string;
  description: string;
  temperature: number;
  maxTokens: number;
  features?: string[];
  category?: 'general' | 'code' | 'analysis' | 'productivity';
}

interface ModelGroup {
  name: string;
  description: string;
  models: Record<string, ModelConfig>;
  features?: string[];
}

interface AIModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  modelGroups: Record<string, ModelGroup>;
}

export function AIModelSelector({ selectedModel, onModelSelect, modelGroups }: AIModelSelectorProps) {
  const selectedModelConfig = Object.values(modelGroups)
    .flatMap(group => Object.entries(group.models))
    .find(([id]) => id === selectedModel)?.[1];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <span>{selectedModelConfig?.name || 'Select Model'}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="grid gap-2 p-4">
          {Object.entries(modelGroups).map(([provider, group]) => (
            <div key={provider} className="space-y-2">
              <h4 className="font-medium text-sm">{group.name}</h4>
              <div className="grid gap-1">
                {Object.entries(group.models).map(([id, model]) => (
                  <div
                    key={id}
                    onClick={() => onModelSelect(id)}
                    className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm ${
                      selectedModel === id
                        ? 'bg-primary text-white'
                        : 'hover:bg-primary/10'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs opacity-75">{model.description}</span>
                    </div>
                    {selectedModel === id && (
                      <span className="text-current">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 