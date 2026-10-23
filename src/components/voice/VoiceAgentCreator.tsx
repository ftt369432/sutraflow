/**
 * 🎤 Voice Agent Creator
 * 
 * Simple interface for speaking agent flows into existence
 */

import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Bot, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { voiceAgentCreationService, CreatedAgentWorkflow } from '../../services/VoiceAgentCreationService';

interface VoiceAgentCreatorProps {
  onAgentCreated?: (workflow: CreatedAgentWorkflow) => void;
  className?: string;
}

export function VoiceAgentCreator({ onAgentCreated, className }: VoiceAgentCreatorProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [createdWorkflow, setCreatedWorkflow] = useState<CreatedAgentWorkflow | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  // Web Speech API support check
  const speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const startListening = () => {
    if (!speechSupported) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      toast.info('🎤 Listening... Describe the agent workflow you want to create.');
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setTranscript(speechResult);
      setIsListening(false);
      
      // Automatically process the speech
      processVoiceInput(speechResult);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      toast.error('Voice recognition error: ' + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processVoiceInput = async (voiceText: string) => {
    setIsProcessing(true);
    
    try {
      const workflow = await voiceAgentCreationService.createAgentFromVoice({
        description: voiceText
      });
      
      setCreatedWorkflow(workflow);
      onAgentCreated?.(workflow);
      
      toast.success(`🤖 Created "${workflow.name}" workflow! Estimated to save ${workflow.estimatedTimeSavings} minutes/week.`);
      
    } catch (error) {
      console.error('Error creating agent workflow:', error);
      toast.error('Failed to create agent workflow from voice input');
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleCommands = [
    "Create an agent that finds WCAB hearing notices and automatically schedules them",
    "Build me an agent that processes client emails and creates follow-up tasks",
    "I want an agent that finds appointment emails and adds them to my calendar",
    "Make an agent that organizes legal emails and creates deadline reminders"
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Voice Agent Creator
          </CardTitle>
          <p className="text-sm text-gray-600">
            Speak your automation needs into existence
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Input Button */}
          <div className="flex flex-col items-center space-y-3">
            <Button
              onClick={startListening}
              disabled={isListening || isProcessing || !speechSupported}
              size="lg"
              className={`w-full h-16 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-6 w-6 mr-2 animate-pulse" />
                  Listening... (Click to stop)
                </>
              ) : isProcessing ? (
                <>
                  <Bot className="h-6 w-6 mr-2 animate-spin" />
                  Creating Agent...
                </>
              ) : (
                <>
                  <Mic className="h-6 w-6 mr-2" />
                  Start Voice Command
                </>
              )}
            </Button>

            {!speechSupported && (
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Voice recognition not supported. Try Chrome or Edge browser.
              </div>
            )}
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800 mb-1">You said:</div>
              <div className="text-sm text-blue-700">"{transcript}"</div>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-yellow-600 animate-spin" />
                <span className="text-sm font-medium text-yellow-800">
                  Creating AI Agent Workflow...
                </span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          )}

          {/* Created Workflow Display */}
          {createdWorkflow && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  Agent Workflow Created!
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {createdWorkflow.name}
                </div>
                <div>
                  <span className="font-medium">Industry:</span>{' '}
                  <Badge variant="secondary" className="capitalize">
                    {createdWorkflow.industry}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Agents:</span>
                  <div className="flex flex-wrap gap-1">
                    {createdWorkflow.agents.map((agent, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {agent.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-green-600" />
                    <span>{createdWorkflow.estimatedTimeSavings}min/week saved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-green-600" />
                    <span>{createdWorkflow.successRate}% accuracy</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  <span className="font-medium">Rules created:</span> {createdWorkflow.rules.length}
                </div>
              </div>
            </div>
          )}

          {/* Example Commands */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="text-sm text-gray-600"
            >
              {showExamples ? 'Hide' : 'Show'} Example Commands
            </Button>
            
            {showExamples && (
              <div className="mt-3 space-y-2">
                <div className="text-sm font-medium text-gray-700">Try saying:</div>
                {exampleCommands.map((command, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-sm text-gray-700">
                    "{command}"
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Use browser's built-in Speech Recognition API