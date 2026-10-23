import React from 'react';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';

export interface SystemPromptProps {
  value: string;
  onChange: (value: string) => void;
}

export function SystemPrompt({ value, onChange }: SystemPromptProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="system-prompt">System Prompt</Label>
      <Textarea
        id="system-prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a system prompt to guide the AI's behavior..."
        className="min-h-[100px]"
      />
    </div>
  );
} 