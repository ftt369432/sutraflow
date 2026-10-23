/**
 * 🎤 Voice Interface Component
 * 
 * Advanced voice control for GenieFlow with multi-stage workflow execution
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

interface VoiceInterfaceProps {
  onVoiceCommand?: (command: string, result: any) => void;
  onVoiceTranscript?: (transcript: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  lastCommand: string;
  commandHistory: string[];
}

interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  threshold: number;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onVoiceCommand,
  onVoiceTranscript,
  className = '',
  size = 'md',
  disabled = false
}) => {
  // Voice state management
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
    lastCommand: '',
    commandHistory: []
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
    threshold: 0.7
  });

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechSynthesis = window.speechSynthesis;
      
      if (SpeechRecognition && speechSynthesis) {
        const recognitionInstance = new SpeechRecognition();
        
        // Configure recognition
        recognitionInstance.continuous = voiceSettings.continuous;
        recognitionInstance.interimResults = voiceSettings.interimResults;
        recognitionInstance.maxAlternatives = voiceSettings.maxAlternatives;
        recognitionInstance.lang = voiceSettings.language;
        
        setRecognition(recognitionInstance);
        setSynthesis(speechSynthesis);
        setIsSupported(true);
        
        console.log('🎤 Voice Interface: Speech recognition initialized');
      } else {
        console.warn('🎤 Voice Interface: Speech recognition not supported');
        setIsSupported(false);
      }
    }
  }, [voiceSettings]);

  // Setup speech recognition event handlers
  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          setVoiceState(prev => ({
            ...prev,
            transcript: finalTranscript,
            confidence: confidence,
            interimTranscript: ''
          }));
          
          // Process the final command
          processVoiceCommand(finalTranscript, confidence);
        } else {
          interimTranscript += transcript;
          setVoiceState(prev => ({
            ...prev,
            interimTranscript: interimTranscript
          }));
        }
      }

      // Notify parent component
      if (onVoiceTranscript) {
        onVoiceTranscript(finalTranscript || interimTranscript);
      }
    };

    const handleStart = () => {
      console.log('🎤 Voice recognition started');
      setVoiceState(prev => ({ ...prev, isListening: true }));
    };

    const handleEnd = () => {
      console.log('🎤 Voice recognition ended');
      setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false }));
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('🎤 Voice recognition error:', event.error);
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false, 
        isProcessing: false 
      }));
    };

    // Attach event listeners
    recognition.onresult = handleResult;
    recognition.onstart = handleStart;
    recognition.onend = handleEnd;
    recognition.onerror = handleError;

    return () => {
      // Clean up event listeners
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
    };
  }, [recognition, onVoiceTranscript]);

  // Process voice command
  const processVoiceCommand = useCallback(async (command: string, confidence: number) => {
    if (confidence < voiceSettings.threshold) {
      console.log('🎤 Command confidence too low:', confidence);
      speakResponse("I didn't catch that. Could you please repeat?");
      return;
    }

    console.log('🎤 Processing voice command:', command);
    
    setVoiceState(prev => ({
      ...prev,
      isProcessing: true,
      lastCommand: command,
      commandHistory: [...prev.commandHistory.slice(-9), command] // Keep last 10 commands
    }));

    try {
      // Enhanced command processing with business patterns
      const result = await executeVoiceCommand(command);
      
      if (onVoiceCommand) {
        onVoiceCommand(command, result);
      }

      // Provide audio feedback
      if (result.success) {
        speakResponse(result.feedback || "Command executed successfully");
      } else {
        speakResponse(result.error || "Sorry, I couldn't process that command");
      }

    } catch (error) {
      console.error('🎤 Voice command processing error:', error);
      speakResponse("Sorry, there was an error processing your command");
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [voiceSettings.threshold, onVoiceCommand]);

  // Execute voice command with enhanced business logic
  const executeVoiceCommand = async (command: string) => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Business document creation patterns
    if (/create.*(?:document|report|proposal|plan|memo|contract|presentation)/i.test(normalizedCommand)) {
      return {
        type: 'document_creation',
        success: true,
        feedback: "Creating document. Opening canvas workspace.",
        action: 'open_canvas',
        details: { documentType: extractDocumentType(command) }
      };
    }

    // Multi-stage workflow patterns  
    if (/(?:schedule.*meeting|create.*agenda|send.*invite)/i.test(normalizedCommand)) {
      return {
        type: 'workflow_execution',
        success: true,
        feedback: "Starting multi-stage workflow. This may take a moment.",
        action: 'execute_workflow',
        details: { workflow: 'meeting_coordination' }
      };
    }

    // Canvas control patterns
    if (/(?:open|show|display).*canvas/i.test(normalizedCommand)) {
      return {
        type: 'canvas_control',
        success: true,
        feedback: "Opening canvas workspace.",
        action: 'open_canvas'
      };
    }

    // Team collaboration patterns
    if (/share.*with.*team|team.*collaboration/i.test(normalizedCommand)) {
      return {
        type: 'team_action',
        success: true,
        feedback: "Setting up team collaboration.",
        action: 'team_share'
      };
    }

    // General AI assistance
    return {
      type: 'general_command',
      success: true,
      feedback: "Processing your request.",
      action: 'ai_chat',
      details: { query: command }
    };
  };

  // Extract document type from voice command
  const extractDocumentType = (command: string): string => {
    const types = [
      'proposal', 'contract', 'memo', 'report', 'presentation', 
      'letter', 'brief', 'plan', 'strategy', 'analysis'
    ];
    
    for (const type of types) {
      if (command.toLowerCase().includes(type)) {
        return type;
      }
    }
    
    return 'document';
  };

  // Text-to-speech response
  const speakResponse = (text: string) => {
    if (!synthesis) return;
    
    // Cancel any ongoing speech
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceSettings.language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    synthesis.speak(utterance);
  };

  // Start/stop voice recognition
  const toggleListening = () => {
    if (!recognition || disabled) return;

    if (voiceState.isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // Size configurations
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base', 
    lg: 'h-12 w-12 text-lg'
  };

  const buttonSizeClass = sizeClasses[size];

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <MicOff className="h-5 w-5" />
        <span className="text-sm">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className={`voice-interface ${className}`}>
      {/* Main voice control button */}
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleListening}
          disabled={disabled || voiceState.isProcessing}
          className={`
            relative transition-all duration-200 
            ${voiceState.isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : voiceState.isProcessing
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${buttonSizeClass}
            rounded-full shadow-lg
          `}
          title={
            voiceState.isListening ? 'Stop listening' :
            voiceState.isProcessing ? 'Processing...' :
            'Start voice command'
          }
        >
          {voiceState.isListening ? (
            <Mic className="h-4 w-4" />
          ) : voiceState.isProcessing ? (
            <Zap className="h-4 w-4 animate-spin" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </Button>

        {/* Settings button */}
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="outline"
          size="sm"
          className="p-2"
          title="Voice settings"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      {/* Voice feedback display */}
      {(voiceState.transcript || voiceState.interimTranscript) && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Voice Input:</div>
          <div className="text-gray-900">
            {voiceState.transcript}
            {voiceState.interimTranscript && (
              <span className="text-gray-500 italic">
                {voiceState.interimTranscript}
              </span>
            )}
          </div>
          {voiceState.confidence > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Confidence: {Math.round(voiceState.confidence * 100)}%
            </div>
          )}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-2 p-3 bg-white border rounded-lg shadow-sm">
          <div className="text-sm font-medium mb-2">Voice Settings</div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Language:</span>
              <select
                value={voiceSettings.language}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, language: e.target.value }))}
                className="border rounded px-2 py-1 text-xs"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Confidence Threshold:</span>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.1"
                value={voiceSettings.threshold}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                className="w-16"
              />
              <span className="text-xs">{Math.round(voiceSettings.threshold * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Command history */}
      {voiceState.commandHistory.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Last command: "{voiceState.lastCommand}"
        </div>
      )}

      {/* Status indicators */}
      <div className="flex items-center gap-1 mt-1">
        {voiceState.isListening && (
          <div className="flex items-center gap-1 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs">Listening...</span>
          </div>
        )}
        
        {voiceState.isProcessing && (
          <div className="flex items-center gap-1 text-yellow-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default VoiceInterface;