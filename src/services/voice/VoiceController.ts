/// <reference path="../../types/speech.d.ts" />
import { universalVoiceToolBridge } from './UniversalVoiceToolBridge';

export interface VoiceCommand {
  action: 'find' | 'delete' | 'move' | 'archive' | 'star' | 'unread' | 'folder' | 'search' | 'compose';
  target?: string; // sender, subject, etc.
  destination?: string; // folder name, recipient, etc.
  criteria?: {
    from?: string;
    subject?: string;
    contains?: string;
    timeRange?: string;
    hasAttachment?: boolean;
  };
  originalText: string;
}

export interface VoiceControllerOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  useUniversalBridge?: boolean;
}

export class VoiceController {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private isSupported = false;
  private useUniversalBridge = false;
  
  // Callbacks
  private onCommandReceived?: (command: VoiceCommand) => void;
  private onListeningChange?: (listening: boolean) => void;
  private onError?: (error: string) => void;
  private onResult?: (text: string, isFinal: boolean) => void;

  constructor(options: VoiceControllerOptions = {}) {
    this.synthesis = window.speechSynthesis;
    this.useUniversalBridge = options.useUniversalBridge ?? false;
    this.initializeSpeechRecognition(options);
  }

  private initializeSpeechRecognition(options: VoiceControllerOptions) {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.isSupported = false;
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.lang = options.language ?? 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onListeningChange?.(true);
      console.log('🎤 Voice recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningChange?.(false);
      console.log('🎤 Voice recognition ended');
    };

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result.transcript.trim();
      const isFinal = result.isFinal;
      
      this.onResult?.(transcript, isFinal);
      
      if (isFinal && transcript) {
        console.log('🎤 Final transcript:', transcript);
        
        if (this.useUniversalBridge) {
          console.log('🎙️ Routing final transcript to Universal Voice Bridge:', transcript);
          // Proactively inform user via speech synthesis
          this.speak("Processing command...");
          
          universalVoiceToolBridge.processTranscript(transcript)
            .then(bridgeResult => {
              console.log('🎙️ Universal Voice Bridge execution result:', bridgeResult);
              if (bridgeResult.spokenResponse) {
                this.speak(bridgeResult.spokenResponse);
              }
            })
            .catch(err => {
              console.error('❌ Universal Voice Bridge execution failed:', err);
              this.speak("I encountered an error executing that command.");
            });
        }

        const command = this.parseVoiceCommand(transcript);
        if (command) {
          this.onCommandReceived?.(command);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      console.error('🎤', errorMessage);
      this.onError?.(errorMessage);
    };
  }

  // Parse natural language voice commands into structured commands
  public parseVoiceCommand(text: string): VoiceCommand | null {
    const lowercaseText = text.toLowerCase().trim();
    
    // Find emails from someone
    if (lowercaseText.includes('find') && lowercaseText.includes('from')) {
      const fromMatch = lowercaseText.match(/find.*(?:emails?|messages?).*from\s+(.+?)(?:\s+and|\s*$)/);
      if (fromMatch) {
        return {
          action: 'find',
          criteria: { from: fromMatch[1].trim() },
          originalText: text
        };
      }
    }

    // Delete emails from someone
    if (lowercaseText.includes('delete') && lowercaseText.includes('from')) {
      const fromMatch = lowercaseText.match(/delete.*(?:emails?|messages?).*from\s+(.+?)(?:\s+and|\s*$)/);
      if (fromMatch) {
        return {
          action: 'delete',
          criteria: { from: fromMatch[1].trim() },
          originalText: text
        };
      }
    }

    // Move emails to folder
    if (lowercaseText.includes('move') && lowercaseText.includes('to')) {
      const moveMatch = lowercaseText.match(/move.*(?:emails?|messages?).*to\s+(.+?)(?:\s+folder)?(?:\s*$)/);
      if (moveMatch) {
        return {
          action: 'move',
          destination: moveMatch[1].trim(),
          originalText: text
        };
      }
    }

    // Create new folder and move emails
    if (lowercaseText.includes('put') && lowercaseText.includes('folder')) {
      const folderMatch = lowercaseText.match(/put.*(?:in|into)\s+(?:a\s+)?(?:new\s+)?folder\s+(?:called\s+)?(.+?)(?:\s*$)/);
      if (folderMatch) {
        return {
          action: 'folder',
          destination: folderMatch[1].trim(),
          originalText: text
        };
      }
    }

    // Search for emails containing text
    if (lowercaseText.includes('search') || lowercaseText.includes('find')) {
      const searchMatch = lowercaseText.match(/(?:search|find).*(?:emails?|messages?).*(?:containing|with|about)\s+(.+?)(?:\s*$)/);
      if (searchMatch) {
        return {
          action: 'search',
          criteria: { contains: searchMatch[1].trim() },
          originalText: text
        };
      }
    }

    // Archive emails
    if (lowercaseText.includes('archive')) {
      return {
        action: 'archive',
        originalText: text
      };
    }

    // Star/favorite emails
    if (lowercaseText.includes('star') || lowercaseText.includes('favorite')) {
      return {
        action: 'star',
        originalText: text
      };
    }

    // Mark as unread
    if (lowercaseText.includes('mark') && lowercaseText.includes('unread')) {
      return {
        action: 'unread',
        originalText: text
      };
    }

    // Compose new email
    if (lowercaseText.includes('compose') || lowercaseText.includes('write')) {
      const toMatch = lowercaseText.match(/(?:compose|write).*(?:email|message).*to\s+(.+?)(?:\s*$)/);
      return {
        action: 'compose',
        destination: toMatch?.[1]?.trim(),
        originalText: text
      };
    }

    console.log('🎤 Could not parse command:', text);
    return null;
  }

  // Start listening for voice commands
  public startListening(): boolean {
    if (!this.isSupported) {
      this.onError?.('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      console.log('🎤 Already listening');
      return true;
    }

    try {
      this.recognition?.start();
      return true;
    } catch (error) {
      console.error('🎤 Failed to start recognition:', error);
      this.onError?.('Failed to start voice recognition');
      return false;
    }
  }

  // Stop listening
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Speak text back to user
  public speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}): void {
    if (!this.synthesis) {
      console.warn('🔊 Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 0.8;

    utterance.onstart = () => console.log('🔊 Speaking:', text);
    utterance.onend = () => console.log('🔊 Finished speaking');
    utterance.onerror = (event) => console.error('🔊 Speech error:', event.error);

    this.synthesis.speak(utterance);
  }

  // Event handlers
  public onCommand(callback: (command: VoiceCommand) => void): void {
    this.onCommandReceived = callback;
  }

  public onListeningStateChange(callback: (listening: boolean) => void): void {
    this.onListeningChange = callback;
  }

  public onVoiceError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  public onVoiceResult(callback: (text: string, isFinal: boolean) => void): void {
    this.onResult = callback;
  }

  // Getters
  public get listening(): boolean {
    return this.isListening;
  }

  public get supported(): boolean {
    return this.isSupported;
  }

  // Cleanup
  public destroy(): void {
    this.stopListening();
    this.synthesis.cancel();
    this.recognition = null;
  }
} 