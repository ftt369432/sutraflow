// Voice Assistant Client Utilities for "AI in your ear" feature
import { createClient } from '@supabase/supabase-js';
import { getUserLocation } from '../utils/location';

/**
 * Client utilities for the voice assistant "AI in your ear" feature
 * This module provides functions for initializing sessions, handling
 * real-time voice interactions, and managing context
 */
class VoiceAssistantClient {
  constructor(supabaseClient, options = {}) {
    this.supabase = supabaseClient;
    this.options = {
      defaultAssistantId: null,
      defaultListeningMode: 'focused',
      defaultContext: 'working',
      wakeWordSensitivity: 0.7,
      ambientContextInterval: 60000, // 1 minute
      ...options
    };
    this.currentSession = null;
    this.isListening = false;
    this.ambientContextTimer = null;
    this.lastResponseTimestamp = null;
  }

  /**
   * Initialize a new voice assistant session
   * @param {string} assistantId - The assistant to use
   * @param {string} contextName - Initial context (e.g., "meeting", "driving")
   * @param {string} listeningMode - Initial listening mode
   * @returns {Promise<Object>} - Session information
   */
  async initializeSession(
    assistantId = this.options.defaultAssistantId,
    contextName = this.options.defaultContext,
    listeningMode = this.options.defaultListeningMode
  ) {
    if (!assistantId) {
      throw new Error('No assistant ID provided for voice session');
    }

    try {
      // Get current location context if available
      const locationContext = await getUserLocation();
      
      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        deviceType: this.getDeviceType(),
        hasMicrophone: await this.checkMicrophoneAccess(),
        hasAudioOutput: await this.checkAudioOutput(),
        isLowPower: navigator.deviceMemory < 4 // only available in some browsers
      };

      // Start the enhanced voice session
      const { data, error } = await this.supabase.rpc(
        'start_enhanced_voice_session',
        {
          user_id_param: this.supabase.auth.user()?.id,
          assistant_id_param: assistantId,
          initial_context_name: contextName,
          listening_mode_name: listeningMode,
          device_info_param: deviceInfo,
          location_context: locationContext || { location_type: 'unknown' }
        }
      );

      if (error) throw error;

      this.currentSession = {
        sessionId: data,
        assistantId,
        contextName,
        listeningMode,
        startTime: new Date(),
        deviceInfo,
        locationContext
      };

      // Start ambient context collection
      this.startAmbientContextCollection();
      
      return this.currentSession;
    } catch (error) {
      console.error('Failed to initialize voice session:', error);
      throw error;
    }
  }

  /**
   * Record a voice transcription and get a response
   * @param {string} transcriptionText - The transcribed text from speech recognition
   * @param {number} confidence - Confidence level of transcription (0-1)
   * @param {string} audioUrl - Optional URL to audio recording
   * @param {number} noiseLevel - Background noise level (0-1)
   * @param {string} detectedWakeWord - Wake word that was detected
   * @returns {Promise<Object>} - Response data
   */
  async processVoiceInput(
    transcriptionText,
    confidence = 0.8,
    audioUrl = null,
    noiseLevel = 0,
    detectedWakeWord = null
  ) {
    if (!this.currentSession) {
      throw new Error('No active voice session');
    }

    try {
      // First send the transcription to the database
      const { data: transcriptionData, error: transcriptionError } = await this.supabase.rpc(
        'record_enhanced_transcription',
        {
          session_id_param: this.currentSession.sessionId,
          transcription_text: transcriptionText,
          confidence_param: confidence,
          audio_url_param: audioUrl,
          background_noise_level_param: noiseLevel,
          detected_wake_word: detectedWakeWord
        }
      );

      if (transcriptionError) throw transcriptionError;

      // Check if we should process this transcription (e.g., wake word or high confidence)
      // This would normally be determined by the backend but here we're querying it
      const { data: transcriptionDetails } = await this.supabase
        .from('voice_transcriptions')
        .select('processing_metadata')
        .eq('id', transcriptionData)
        .single();
      
      // Only generate a response if this transcription should be processed
      if (transcriptionDetails?.processing_metadata?.should_process) {
        // Get current context-aware conversation history for better responses
        const { data: contextData } = await this.supabase.rpc(
          'get_context_aware_conversation_history',
          {
            session_id_param: this.currentSession.sessionId,
            limit_count: 5,
            include_ambient_context: true
          }
        );

        // This would normally call your AI service with context
        // For example: llamaClient.complete(), openAI.createChatCompletion(), etc.
        const aiResponse = await this.generateAIResponse(
          transcriptionText, 
          contextData
        );

        // Record the AI response in the database
        const { data: responseData, error: responseError } = await this.supabase.rpc(
          'record_voice_response',
          {
            session_id_param: this.currentSession.sessionId,
            request_id_param: transcriptionData,
            response_text: aiResponse.text,
            voice_settings_param: aiResponse.voiceSettings || {}
          }
        );

        if (responseError) throw responseError;

        this.lastResponseTimestamp = new Date();
        
        return {
          transcriptionId: transcriptionData,
          responseId: responseData,
          responseText: aiResponse.text,
          shouldSpeak: true,
          voiceSettings: aiResponse.voiceSettings
        };
      } else {
        // Not processing this input (background noise, low confidence, etc.)
        return {
          transcriptionId: transcriptionData,
          responseId: null,
          responseText: null,
          shouldSpeak: false
        };
      }
    } catch (error) {
      console.error('Failed to process voice input:', error);
      throw error;
    }
  }

  /**
   * Update the current context of the voice session
   * @param {string} newContextName - New context name
   * @param {number} confidence - Confidence in this context change
   * @param {string} source - What triggered this context change
   * @returns {Promise<Object>} - Updated context state
   */
  async updateContext(newContextName, confidence = 0.8, source = 'user') {
    if (!this.currentSession) {
      throw new Error('No active voice session');
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'update_voice_context',
        {
          session_id_param: this.currentSession.sessionId,
          new_context_name: newContextName,
          confidence_param: confidence,
          trigger_source_param: source
        }
      );

      if (error) throw error;

      // Update local session data
      this.currentSession.contextName = newContextName;
      
      return data;
    } catch (error) {
      console.error('Failed to update voice context:', error);
      throw error;
    }
  }

  /**
   * Record ambient context information
   * @param {string} contextType - Type of context (location, noise, activity, etc.)
   * @param {Object} contextData - Context data object
   * @param {number} confidence - Confidence in this context
   * @returns {Promise<string>} - Context ID
   */
  async recordAmbientContext(contextType, contextData, confidence = 0.8) {
    if (!this.currentSession) {
      throw new Error('No active voice session');
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'record_ambient_context',
        {
          session_id_param: this.currentSession.sessionId,
          context_type_param: contextType,
          context_data_param: contextData,
          confidence_param: confidence,
          source_param: 'client_sensor',
          expiry_minutes: 60
        }
      );

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to record ambient context:', error);
      throw error;
    }
  }

  /**
   * End the current voice session
   * @param {string} reason - Reason for ending (user_request, timeout, error)
   * @returns {Promise<boolean>} - Success
   */
  async endSession(reason = 'user_request') {
    if (!this.currentSession) {
      return false; // No active session to end
    }

    try {
      // Stop ambient context collection
      this.stopAmbientContextCollection();

      // Update session end time
      await this.supabase
        .from('voice_sessions')
        .update({
          end_time: new Date().toISOString(),
          session_status: `ended_${reason}`,
          session_metadata: {
            ...this.currentSession.sessionMetadata,
            end_reason: reason
          }
        })
        .eq('id', this.currentSession.sessionId);
      
      // Optionally convert high-quality exchanges to training data
      await this.supabase.rpc(
        'convert_enhanced_voice_session_to_training',
        {
          session_id_param: this.currentSession.sessionId,
          quality_threshold: 0.7,
          include_context: true
        }
      );

      this.currentSession = null;
      return true;
    } catch (error) {
      console.error('Error ending voice session:', error);
      this.currentSession = null; // Force reset even on error
      return false;
    }
  }

  /**
   * Generate AI response with context awareness
   * This is a placeholder - replace with your actual AI integration
   * @param {string} userInput - User's transcribed speech
   * @param {Object} contextData - Conversation and ambient context
   * @returns {Promise<Object>} - AI response
   */
  async generateAIResponse(userInput, contextData) {
    // This is where you'd connect to your AI service
    // This placeholder shows the expected structure
    console.log('Generating AI response with context:', 
      { input: userInput, contextSummary: {
        conversationLength: contextData?.conversation?.length || 0,
        contextTypes: Object.keys(contextData?.ambient_context || {})
      }}
    );
    
    // Placeholder response
    return {
      text: `I understood your request: "${userInput}". Here's a response based on your current context.`,
      voiceSettings: {
        voice: "natural",
        speed: 1.0,
        pitch: 1.0
      }
    };
  }

  // --- Helper Methods ---

  /**
   * Start collecting ambient context at regular intervals
   */
  startAmbientContextCollection() {
    // Stop any existing timer
    this.stopAmbientContextCollection();
    
    // Start a new timer to collect ambient context periodically
    this.ambientContextTimer = setInterval(async () => {
      try {
        // Check if session is active
        if (!this.currentSession) {
          this.stopAmbientContextCollection();
          return;
        }
        
        // Collect relevant ambient data
        // This would integrate with various device sensors
        
        // Example: location updates
        const locationContext = await getUserLocation();
        if (locationContext) {
          await this.recordAmbientContext('location', locationContext);
        }
        
        // Example: noise level detection
        const noiseLevel = await this.detectNoiseLevel();
        if (noiseLevel !== null) {
          await this.recordAmbientContext('noise', { level: noiseLevel });
        }
        
        // Example: activity detection (would use device sensors)
        const activityData = await this.detectUserActivity();
        if (activityData) {
          await this.recordAmbientContext('activity', activityData);
        }
      } catch (error) {
        console.error('Error collecting ambient context:', error);
      }
    }, this.options.ambientContextInterval);
  }

  /**
   * Stop ambient context collection
   */
  stopAmbientContextCollection() {
    if (this.ambientContextTimer) {
      clearInterval(this.ambientContextTimer);
      this.ambientContextTimer = null;
    }
  }

  /**
   * Get the current device type
   * @returns {string} - Device type
   */
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Check if the user has granted microphone access
   * @returns {Promise<boolean>} - Microphone access granted
   */
  async checkMicrophoneAccess() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      return audioInputs.length > 0;
    } catch (error) {
      console.warn('Could not check microphone access:', error);
      return false;
    }
  }

  /**
   * Check if the device has audio output capability
   * @returns {Promise<boolean>} - Audio output available
   */
  async checkAudioOutput() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      return audioOutputs.length > 0;
    } catch (error) {
      console.warn('Could not check audio output:', error);
      return true; // Assume audio output exists by default
    }
  }

  /**
   * Detect current noise level (placeholder)
   * @returns {Promise<number|null>} - Noise level between 0-1 or null
   */
  async detectNoiseLevel() {
    // This would need to be implemented with Web Audio API
    // Placeholder implementation
    return Math.random() * 0.3; // Simulate random noise level
  }

  /**
   * Detect user's current activity (placeholder)
   * @returns {Promise<Object|null>} - Activity data or null
   */
  async detectUserActivity() {
    // This would integrate with device motion sensors, etc.
    // Placeholder implementation
    const activities = ['stationary', 'walking', 'running', 'vehicle'];
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    return {
      activityType: randomActivity,
      confidence: 0.8,
      lastUpdated: new Date().toISOString()
    };
  }
}

export default VoiceAssistantClient;
