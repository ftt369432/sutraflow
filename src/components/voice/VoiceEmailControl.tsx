import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { VoiceController, VoiceCommand } from '../../services/voice/VoiceController';
import { VoiceEmailActions, VoiceActionResult } from '../../services/voice/VoiceEmailActions';
import { EmailMessage } from '../../services/email/types';
import { toast } from 'sonner';

interface VoiceEmailControlProps {
  emails: EmailMessage[];
  accountId: string;
  folderId: string;
  emailService: any;
  onEmailsSelected?: (emailIds: string[]) => void;
  onEmailsFiltered?: (emails: EmailMessage[]) => void;
  onRefreshEmails?: () => void;
  className?: string;
}

export function VoiceEmailControl({
  emails,
  accountId,
  folderId,
  emailService,
  onEmailsSelected,
  onEmailsFiltered,
  onRefreshEmails,
  className
}: VoiceEmailControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [lastResult, setLastResult] = useState<VoiceActionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);

  const voiceControllerRef = useRef<VoiceController | null>(null);
  const voiceActionsRef = useRef<VoiceEmailActions | null>(null);

  // Initialize voice control
  useEffect(() => {
    // Initialize voice controller
    const voiceController = new VoiceController({
      continuous: false,
      interimResults: true,
      language: 'en-US'
    });

    // Initialize voice actions
    const voiceActions = new VoiceEmailActions(emailService);
    voiceActions.setVoiceController(voiceController);

    voiceControllerRef.current = voiceController;
    voiceActionsRef.current = voiceActions;
    
    setIsSupported(voiceController.supported);

    // Set up event handlers
    voiceController.onListeningStateChange((listening) => {
      setIsListening(listening);
    });

    voiceController.onVoiceResult((text, isFinal) => {
      setCurrentTranscript(text);
      if (isFinal) {
        // Clear transcript after a delay
        setTimeout(() => setCurrentTranscript(''), 2000);
      }
    });

    voiceController.onCommand(async (command) => {
      setLastCommand(command);
      setIsProcessing(true);
      
      try {
        console.log('🎤 Processing voice command:', command);
        const result = await voiceActions.executeCommand(command, emails, accountId, folderId);
        setLastResult(result);
        
        // Handle specific result actions
        if (result.success) {
          handleCommandResult(command, result);
        }
      } catch (error) {
        console.error('🎤 Error processing command:', error);
        const errorResult: VoiceActionResult = {
          success: false,
          message: 'Failed to process voice command'
        };
        setLastResult(errorResult);
        toast.error(errorResult.message);
      } finally {
        setIsProcessing(false);
      }
    });

    voiceController.onVoiceError((error) => {
      toast.error(`Voice error: ${error}`);
      setIsProcessing(false);
    });

    return () => {
      voiceController.destroy();
    };
  }, [emails, accountId, folderId, emailService]);

  // Handle command results
  const handleCommandResult = (command: VoiceCommand, result: VoiceActionResult) => {
    switch (command.action) {
      case 'find':
      case 'search':
        if (result.data?.emails && onEmailsFiltered) {
          onEmailsFiltered(result.data.emails);
        }
        if (result.affectedEmails && onEmailsSelected) {
          onEmailsSelected(result.affectedEmails);
        }
        break;
      
      case 'delete':
      case 'move':
      case 'archive':
        // Refresh emails after bulk operations
        if (onRefreshEmails) {
          setTimeout(onRefreshEmails, 1000);
        }
        break;
      
      case 'compose':
        // Handle compose window opening
        console.log('🎤 Should open compose window', result.data);
        break;
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (!voiceControllerRef.current) return;

    if (isListening) {
      voiceControllerRef.current.stopListening();
    } else {
      const started = voiceControllerRef.current.startListening();
      if (!started) {
        toast.error('Failed to start voice recognition');
      }
    }
  };

  // Toggle voice feedback
  const toggleVoiceFeedback = () => {
    setVoiceFeedbackEnabled(!voiceFeedbackEnabled);
    // This would affect the voice controller's speech functionality
  };

  // Example voice commands
  const exampleCommands = [
    "Find emails from John",
    "Delete all emails from spam@example.com",
    "Put emails from newsletter in new folder called News",
    "Move selected emails to folder Important",
    "Search for emails containing meeting",
    "Archive all emails from last week",
    "Star emails from my boss",
    "Mark emails as unread",
    "Compose email to john@example.com"
  ];

  if (!isSupported) {
    return (
      <Card className={cn("border-amber-200 bg-amber-50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-700">
            <MicOff className="h-4 w-4" />
            <span className="text-sm">Voice control not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-blue-50 to-purple-50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Control
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoiceFeedback}
              className="h-8 w-8 p-0"
            >
              {voiceFeedbackEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="h-8 w-8 p-0"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Voice Control Button */}
        <div className="flex flex-col items-center space-y-3">
          <Button
            onClick={toggleListening}
            disabled={isProcessing}
            className={cn(
              "h-16 w-16 rounded-full transition-all duration-300",
              isListening 
                ? "bg-red-500 hover:bg-red-600 shadow-lg animate-pulse" 
                : "bg-primary hover:bg-primary/90",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            {isListening ? (
              <Mic className="h-8 w-8 text-white" />
            ) : (
              <MicOff className="h-8 w-8 text-white" />
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm font-medium">
              {isListening ? 'Listening...' : 'Click to speak'}
            </p>
            <p className="text-xs text-muted-foreground">
              Try saying: "Find emails from John"
            </p>
          </div>
        </div>

        {/* Real-time Transcript */}
        {currentTranscript && (
          <div className="bg-white/50 rounded-lg p-3 border">
            <p className="text-sm text-gray-600 mb-1">You said:</p>
            <p className="text-base font-medium">{currentTranscript}</p>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">Processing command...</span>
            </div>
          </div>
        )}

        {/* Last Command Result */}
        {lastResult && (
          <div className={cn(
            "rounded-lg p-3 border",
            lastResult.success 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          )}>
            <div className="flex items-start gap-2">
              <Badge variant={lastResult.success ? "default" : "destructive"} className="mt-0.5">
                {lastResult.success ? "Success" : "Error"}
              </Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">{lastResult.message}</p>
                {lastCommand && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Command: "{lastCommand.originalText}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div className="bg-white/80 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium mb-3">Example Voice Commands:</h4>
            <div className="space-y-2">
              {exampleCommands.map((command, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
                  <span className="text-sm text-gray-600">"{command}"</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-muted-foreground">
                💡 Tip: Speak clearly and naturally. The system understands various phrasings for the same action.
              </p>
            </div>
          </div>
        )}

        {/* Voice Status Indicators */}
        <div className="flex justify-center gap-4 pt-2">
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isSupported ? "bg-green-500" : "bg-red-500"
            )}></div>
            <span className="text-xs text-muted-foreground">
              {isSupported ? "Supported" : "Not Supported"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              voiceFeedbackEnabled ? "bg-blue-500" : "bg-gray-400"
            )}></div>
            <span className="text-xs text-muted-foreground">
              Voice Feedback
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 