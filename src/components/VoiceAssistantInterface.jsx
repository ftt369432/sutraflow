import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

// Status indicator component
const StatusIndicator = ({ status, pulse = false }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'listening': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'speaking': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="relative">
      <div 
        className={`w-3 h-3 rounded-full ${getStatusColor()}`}
      />
      {pulse && (
        <div 
          className={`absolute top-0 left-0 w-3 h-3 rounded-full ${getStatusColor()} opacity-75 animate-ping`}
        />
      )}
    </div>
  );
};

// Main component
const VoiceAssistantInterface = ({ assistantId, defaultContext = 'working' }) => {
  const {
    isInitialized,
    isListening,
    isSpeaking,
    processingState,
    error,
    transcript,
    lastResponse,
    currentContext,
    
    initializeSession,
    toggleListening,
    endSession,
    changeContext,
    sendTextInput
  } = useVoiceAssistant({ 
    assistantId,
    defaultContext
  });

  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  
  // Context options
  const contextOptions = [
    { id: 'working', label: 'Working' },
    { id: 'meeting', label: 'In Meeting' },
    { id: 'driving', label: 'Driving' },
    { id: 'leisure', label: 'Leisure' }
  ];

  // Update messages when we get a new transcript or response
  useEffect(() => {
    if (transcript && isListening) {
      setMessages(prev => {
        // Only add if different from last transcript
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.type === 'transcript' && lastMsg.text === transcript) {
          return prev;
        }
        return [...prev, { id: Date.now(), type: 'transcript', text: transcript }];
      });
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (lastResponse && lastResponse.responseText) {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'response', 
        text: lastResponse.responseText 
      }]);
    }
  }, [lastResponse]);

  // Initialize the session on component mount
  useEffect(() => {
    if (assistantId && !isInitialized) {
      initializeSession(assistantId);
    }
  }, [assistantId, isInitialized, initializeSession]);

  // Handle form submission for text input
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    sendTextInput(textInput);
    setTextInput('');
  };

  // Determine current status for display
  const getStatus = () => {
    if (error) return 'error';
    if (isSpeaking) return 'speaking';
    if (processingState === 'processing') return 'processing';
    if (isListening) return 'listening';
    return 'ready';
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto rounded-lg overflow-hidden bg-white shadow-lg">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <StatusIndicator 
            status={getStatus()} 
            pulse={isListening || isSpeaking || processingState === 'processing'} 
          />
          <h2 className="text-lg font-semibold">AI Voice Assistant</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm"
            value={currentContext}
            onChange={(e) => changeContext(e.target.value)}
          >
            {contextOptions.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 text-sm">
          {error}
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Your conversations will appear here</p>
            <p className="text-sm mt-2">Try saying "Hey, what time is it?"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.type === 'transcript' 
                    ? 'bg-blue-100 ml-auto' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                {message.text}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-md p-2"
            placeholder="Type your message..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          
          <Button 
            type="submit" 
            disabled={!isInitialized || processingState === 'processing'}
          >
            Send
          </Button>
          
          <Button 
            type="button" 
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            disabled={!isInitialized || processingState === 'processing'}
          >
            {isListening ? 'Stop' : 'Listen'}
          </Button>
        </form>
        
        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-center text-sm text-gray-500"
            >
              {transcript ? (
                <p>I heard: "{transcript}"</p>
              ) : (
                <p>Listening...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Status bar */}
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <div>Mode: {currentContext}</div>
          <div>Status: {getStatus()}</div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantInterface;
