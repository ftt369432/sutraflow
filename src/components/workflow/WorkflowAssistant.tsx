import React, { useEffect, useState } from 'react';
import { WorkflowLearner } from '../../services/WorkflowLearner';
import { VoiceControl } from '../../services/VoiceControl';
import { useAgentStore } from '../../store/agentStore';
import { Button } from '../ui/Button';
import { Mic, MicOff, Brain } from 'lucide-react';
import type { AgentSuggestion } from '../../types/workflow';

export function WorkflowAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const { createAgent } = useAgentStore();
  
  const workflowLearner = new WorkflowLearner();
  const voiceControl = new VoiceControl();

  useEffect(() => {
    // Start learning workflow patterns
    const interval = setInterval(() => {
      const newSuggestions = workflowLearner.suggestAutomation();
      setSuggestions(newSuggestions);
    }, 3600000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  const toggleVoice = () => {
    if (isListening) {
      voiceControl.stopListening();
    } else {
      voiceControl.startListening();
    }
    setIsListening(!isListening);
  };

  const handleCreateAgent = (suggestion: AgentSuggestion) => {
    createAgent(suggestion.suggestedAgent);
    voiceControl.speak(`Created new agent: ${suggestion.suggestedAgent.name}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Workflow Assistant</h2>
        <Button
          onClick={toggleVoice}
          variant={isListening ? 'default' : 'outline'}
          className="flex items-center gap-2"
        >
          {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {isListening ? 'Listening' : 'Start Voice Control'}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Suggestions</h3>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 bg-blue-50 rounded-lg flex items-start justify-between"
            >
              <div>
                <p className="font-medium">{suggestion.description}</p>
                <p className="text-sm text-gray-600">
                  Confidence: {(suggestion.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <Button
                onClick={() => handleCreateAgent(suggestion)}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                Create Agent
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 