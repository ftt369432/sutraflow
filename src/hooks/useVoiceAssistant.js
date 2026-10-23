import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';
import VoiceAssistantClient from '../services/VoiceAssistantClient';

/**
 * React Hook for using the "AI in your ear" voice assistant
 * Provides voice transcription, response generation, and context management
 * @param {Object} options - Configuration options
 * @returns {Object} - Voice assistant methods and state
 */
export const useVoiceAssistant = (options = {}) => {
  const { supabase } = useSupabase();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [processingState, setProcessingState] = useState('idle');
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState(null);
  const [currentContext, setCurrentContext] = useState(options.defaultContext || 'working');
  const [listeningMode, setListeningMode] = useState(options.defaultListeningMode || 'focused');
  
  // References
  const clientRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  
  // Initialize client on mount
  useEffect(() => {
    if (!clientRef.current && supabase) {
      clientRef.current = new VoiceAssistantClient(supabase, {
        defaultAssistantId: options.assistantId,
        defaultContext: options.defaultContext || 'working',
        defaultListeningMode: options.defaultListeningMode || 'focused',
        ...options
      });
    }

    // Initialize speech synthesis
    if (!synthRef.current && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    
    return () => {
      // Clean up on unmount
      stopListening();
      if (clientRef.current) {
        clientRef.current.endSession('component_unmount');
      }
    };
  }, [supabase, options.assistantId]);

  /**
   * Initialize a new voice assistant session
   * @param {string} assistantId - The assistant to use
   * @returns {Promise<Object>} - Session information
   */
  const initializeSession = useCallback(async (assistantId = options.assistantId) => {
    if (!assistantId) {
      setError('No assistant ID provided');
      return null;
    }

    try {
      setError(null);
      setProcessingState('initializing');
      
      if (!clientRef.current) {
        clientRef.current = new VoiceAssistantClient(supabase, {
          defaultAssistantId: assistantId,
          defaultContext: options.defaultContext || 'working',
          defaultListeningMode: options.defaultListeningMode || 'focused',
          ...options
        });
      }
      
      const sessionData = await clientRef.current.initializeSession(
        assistantId,
        currentContext,
        listeningMode
      );
      
      setSession(sessionData);
      setIsInitialized(true);
      setProcessingState('ready');
      return sessionData;
    } catch (err) {
      setError(`Failed to initialize voice session: ${err.message}`);
      setProcessingState('error');
      return null;
    }
  }, [supabase, currentContext, listeningMode, options]);

  /**
   * Start listening to the microphone
   * @returns {Promise<boolean>} - Success status
   */
  const startListening = useCallback(async () => {
    if (!isInitialized && !session) {
      await initializeSession();
    }
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return false;
    }
    
    try {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setProcessingState('listening');
      };
      
      recognitionRef.current.onresult = async (event) => {
        // Get transcription
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        
        setTranscript(currentTranscript);
        
        // For final results, process with the voice assistant
        if (event.results[0].isFinal) {
          setProcessingState('processing');
          
          try {
            // Get confidence level
            const confidence = event.results[0][0].confidence;
            
            // Process the voice input
            const response = await clientRef.current.processVoiceInput(
              currentTranscript, 
              confidence
            );
            
            if (response && response.responseText && response.shouldSpeak) {
              setLastResponse(response);
              speakResponse(response.responseText, response.voiceSettings);
            }
            
            setProcessingState('ready');
            // Reset transcript for next utterance
            setTranscript('');
          } catch (err) {
            setError(`Error processing voice input: ${err.message}`);
            setProcessingState('error');
          }
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setProcessingState('error');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Restart if we're supposed to be listening
        if (processingState === 'listening' && !error) {
          recognitionRef.current.start();
        } else {
          setProcessingState('ready');
        }
      };
      
      recognitionRef.current.start();
      return true;
    } catch (err) {
      setError(`Failed to start listening: ${err.message}`);
      setProcessingState('error');
      return false;
    }
  }, [isInitialized, session, initializeSession, processingState, error]);

  /**
   * Stop listening to the microphone
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setProcessingState('ready');
    }
  }, []);

  /**
   * Toggle listening state
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  /**
   * End the current voice session
   */
  const endSession = useCallback(async () => {
    stopListening();
    
    if (clientRef.current && session) {
      await clientRef.current.endSession('user_request');
      setSession(null);
      setIsInitialized(false);
      setProcessingState('idle');
    }
  }, [session, stopListening]);

  /**
   * Update the current context
   * @param {string} newContext - New context name
   */
  const changeContext = useCallback(async (newContext) => {
    if (!clientRef.current || !session) {
      setCurrentContext(newContext); // Update local state even without session
      return false;
    }
    
    try {
      await clientRef.current.updateContext(newContext);
      setCurrentContext(newContext);
      return true;
    } catch (err) {
      setError(`Failed to change context: ${err.message}`);
      return false;
    }
  }, [session]);

  /**
   * Update the listening mode
   * @param {string} newMode - New listening mode
   */
  const changeListeningMode = useCallback((newMode) => {
    setListeningMode(newMode);
    // If we have a session, we'd update it here
    // This would normally be handled through a context change
  }, []);

  /**
   * Speak the response using speech synthesis
   * @param {string} text - Text to speak
   * @param {Object} voiceSettings - Voice settings
   */
  const speakResponse = useCallback((text, voiceSettings = {}) => {
    if (!synthRef.current) {
      setError('Speech synthesis not supported');
      return;
    }
    
    try {
      // Stop any current speech
      synthRef.current.cancel();
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice settings
      if (voiceSettings) {
        const voices = synthRef.current.getVoices();
        
        // Find a voice that matches requirements
        if (voiceSettings.voice) {
          const preferredVoice = voices.find(v => 
            v.name.toLowerCase().includes(voiceSettings.voice.toLowerCase())
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
        
        // Apply other settings
        if (voiceSettings.speed) utterance.rate = voiceSettings.speed;
        if (voiceSettings.pitch) utterance.pitch = voiceSettings.pitch;
      }
      
      // Events
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsSpeaking(false);
      };
      
      // Speak
      synthRef.current.speak(utterance);
    } catch (err) {
      setError(`Failed to speak response: ${err.message}`);
    }
  }, []);

  /**
   * Manually send text to the voice assistant
   * @param {string} text - Text to process
   */
  const sendTextInput = useCallback(async (text) => {
    if (!clientRef.current || !session) {
      setError('No active session');
      return null;
    }
    
    try {
      setProcessingState('processing');
      
      // Process the text input
      const response = await clientRef.current.processVoiceInput(
        text, 
        1.0 // High confidence for direct text input
      );
      
      if (response && response.responseText) {
        setLastResponse(response);
        
        if (response.shouldSpeak) {
          speakResponse(response.responseText, response.voiceSettings);
        }
      }
      
      setProcessingState('ready');
      return response;
    } catch (err) {
      setError(`Failed to process text input: ${err.message}`);
      setProcessingState('error');
      return null;
    }
  }, [session, speakResponse]);

  return {
    // State
    isInitialized,
    isListening,
    isSpeaking,
    processingState,
    error,
    session,
    transcript,
    lastResponse,
    currentContext,
    listeningMode,
    
    // Methods
    initializeSession,
    startListening,
    stopListening,
    toggleListening,
    endSession,
    changeContext,
    changeListeningMode,
    speakResponse,
    sendTextInput
  };
};

export default useVoiceAssistant;
