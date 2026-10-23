import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AIAssistant } from '../../types/ai';
import { Trash2, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AssistantListProps {
  assistants: AIAssistant[];
  selectedAssistant: AIAssistant | null;
  onSelect: (assistant: AIAssistant) => void;
  onDelete?: (assistant: AIAssistant) => void;
  marketplaceIds?: Set<string>;
}

export function AssistantList({ assistants, selectedAssistant, onSelect, onDelete, marketplaceIds }: AssistantListProps) {

  const handleDelete = (assistant: AIAssistant, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this assistant?')) {
      onDelete?.(assistant);
    }
  };

  const handleSelectAssistant = (assistant: AIAssistant) => {
    onSelect(assistant);
  };

  return (
    <div className="space-y-2 p-1">
      <div className="space-y-2">
        {assistants.length > 0 ? (
          assistants.map(assistant => (
            <Card
              key={assistant.id}
              className={cn(
                "p-3 hover:shadow-lg transition-shadow cursor-pointer rounded-lg",
                selectedAssistant?.id === assistant.id
                  ? "bg-blue-100 dark:bg-blue-800 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400"
                  : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent"
              )}
              onClick={() => handleSelectAssistant(assistant)}
            >
              <div className="flex justify-between items-center">
                <h3 className={cn(
                  "text-base font-semibold truncate",
                  selectedAssistant?.id === assistant.id ? "text-blue-700 dark:text-blue-200" : "text-slate-800 dark:text-slate-200"
                )}>{assistant.name}</h3>
                <div className="flex items-center gap-1.5">
                  {/* Purple "Live" badge for assistants promoted to Creator Space */}
                  {marketplaceIds?.has(assistant.name) && (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                      <Sparkles className="h-2.5 w-2.5" />
                      Live
                    </span>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={(e) => handleDelete(assistant, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {assistant.description && (
                <p className={cn(
                  "text-xs text-slate-600 dark:text-slate-400 mt-1 truncate",
                  selectedAssistant?.id === assistant.id ? "text-blue-600 dark:text-blue-300" : ""
                )}>
                  {assistant.description}
                </p>
              )}
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400">
            <MessageSquare size={32} className="mb-2 text-slate-400 dark:text-slate-500" />
            <p className="text-sm font-medium">No assistants available.</p>
            <p className="text-xs">Click "New Assistant" in the panel above to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}