import React, { useState, useEffect } from 'react';
import { 
  processVoiceTranscription, 
  getAllAssistantTriggers,
  VoiceTrigger 
} from '../utils/location';
import TriggerWordSettings from '../components/TriggerWordSettings';

const AssistantTriggerDemo: React.FC = () => {
  const [transcription, setTranscription] = useState<string>('');
  const [activeAssistant, setActiveAssistant] = useState<{
    assistantId: string;
    assistantType: string;
    response: string;
  } | null>(null);
  const [allTriggers, setAllTriggers] = useState<VoiceTrigger[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Load all triggers on component mount
  useEffect(() => {
    loadTriggers();
  }, []);
  
  // Load triggers from storage
  const loadTriggers = async () => {
    try {
      const loadedTriggers = await getAllAssistantTriggers();
      setAllTriggers(loadedTriggers);
    } catch (error) {
      console.error('Error loading triggers:', error);
    }
  };

  // Process transcription for trigger words
  const handleProcessTranscription = async () => {
    if (!transcription.trim()) return;
    
    setTranscriptionHistory(prev => [...prev, transcription]);
    
    const result = await processVoiceTranscription(transcription);
    if (result) {
      setActiveAssistant(result);
      // In a real app, this would activate the specific assistant
      console.log(`Activated assistant: ${result.assistantType}`, result);
      
      // Clear transcription after a brief delay
      setTimeout(() => {
        setTranscription('');
      }, 1000);
    } else {
      setActiveAssistant(null);
    }
  };

  // Handle transcription input change
  const handleTranscriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranscription(e.target.value);
  };

  // Toggle the settings panel
  const handleToggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Simulates starting/stopping voice recognition
  const toggleListening = () => {
    setIsListening(!isListening);
  };

  // Generate example trigger phrases
  const generateExamplePhrases = () => {
    if (!allTriggers.length) return [];
    
    return allTriggers
      .filter(trigger => trigger.enabled)
      .map(trigger => ({
        phrase: trigger.primaryTrigger,
        assistant: trigger.assistantName || trigger.assistantType
      }));
  };

  // Get a random example phrase for demo purposes
  const getRandomExamplePhrase = () => {
    const examples = generateExamplePhrases();
    if (!examples.length) return "hey genie";
    
    const randomIndex = Math.floor(Math.random() * examples.length);
    return examples[randomIndex].phrase;
  };

  // Fill in a random example phrase
  const handleUseExample = () => {
    setTranscription(getRandomExamplePhrase());
  };

  // Find the current active trigger from allTriggers
  const findActiveTrigger = (): VoiceTrigger | undefined => {
    if (!activeAssistant) return undefined;
    return allTriggers.find(trigger => trigger.assistantId === activeAssistant.assistantId);
  };
  
  const activeTrigger = findActiveTrigger();

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Multi-Assistant Trigger System Demo</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - Demo */}
        <div className={`flex-1 p-6 rounded-lg shadow-lg ${activeAssistant ? `bg-${activeTrigger?.triggerColor || 'blue'}-50` : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-4">Test Assistant Triggers</h2>
          
          {/* Voice assistant status */}
          <div className={`p-4 mb-4 rounded-lg ${isListening ? 'bg-green-100' : 'bg-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                ></div>
                <span>{isListening ? 'Listening...' : 'Microphone Off'}</span>
              </div>
              <button 
                onClick={toggleListening}
                className={`py-1 px-3 rounded ${isListening ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
              >
                {isListening ? 'Stop' : 'Start'} Listening
              </button>
            </div>
          </div>
          
          {/* Speech transcription input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Say a trigger phrase (or type one to test):
            </label>
            <div className="flex">
              <input
                type="text"
                className="flex-grow p-3 border border-gray-300 rounded-l"
                placeholder={`Try saying "${getRandomExamplePhrase()}"`}
                value={transcription}
                onChange={handleTranscriptionChange}
              />
              <button
                onClick={handleUseExample}
                className="bg-gray-100 text-gray-700 px-3 border-t border-b border-r border-gray-300"
              >
                Use Example
              </button>
              <button
                onClick={handleProcessTranscription}
                className="bg-blue-600 text-white px-4 py-2 rounded-r"
              >
                Test
              </button>
            </div>
          </div>
          
          {/* Active assistant display */}
          {activeAssistant && (
            <div 
              className={`p-4 rounded-lg mb-6 bg-${activeTrigger?.triggerColor || 'blue'}-100 border border-${activeTrigger?.triggerColor || 'blue'}-200`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-10 h-10 rounded-full bg-${activeTrigger?.triggerColor || 'blue'}-500 flex items-center justify-center text-white`}>
                  {(activeTrigger?.assistantName || activeAssistant.assistantType).charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <div className="font-semibold">{activeTrigger?.assistantName || `${activeAssistant.assistantType} Assistant`}</div>
                  <div className="text-sm opacity-75">{activeAssistant.assistantType}</div>
                </div>
              </div>
              <div className="p-3 bg-white rounded text-gray-700">
                {activeAssistant.response}
              </div>
            </div>
          )}
          
          {/* Transcription history */}
          {transcriptionHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Recent Transcriptions:</h3>
              <div className="bg-gray-50 p-2 rounded max-h-32 overflow-y-auto text-sm">
                {transcriptionHistory.slice(-5).map((text, i) => (
                  <div key={i} className="py-1 border-b border-gray-100 last:border-0">
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Available assistants */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Available Assistants:</h3>
            {allTriggers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allTriggers.filter(t => t.enabled).map(trigger => (
                  <div 
                    key={trigger.assistantId}
                    className="p-2 border rounded flex items-center text-sm"
                    style={{ borderColor: trigger.triggerColor || '#e5e7eb' }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-xs"
                      style={{ backgroundColor: trigger.triggerColor || '#6b7280' }}
                    >
                      {(trigger.assistantName || trigger.assistantType).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{trigger.assistantName || `${trigger.assistantType} Assistant`}</div>
                      <div className="text-xs text-gray-500">&quot;{trigger.primaryTrigger}&quot;</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No assistants configured.</div>
            )}
          </div>
        </div>
        
        {/* Right side - Settings Toggle */}
        <div className="md:w-1/4 flex flex-col">
          <button
            onClick={handleToggleSettings}
            className="mb-4 p-2 bg-gray-100 text-gray-700 rounded flex items-center justify-center hover:bg-gray-200"
          >
            <span>{showSettings ? 'Hide' : 'Show'} Settings</span>
          </button>
          
          {/* Settings panel */}
          {showSettings && (
            <div className="flex-grow">
              <TriggerWordSettings onTriggersChanged={loadTriggers} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantTriggerDemo;
