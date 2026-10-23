/**
 * Collective Brain Monitor - Unified Neural AI & Thinking Panel
 * 
 * Consolidates all AI thinking, neuro processing, and strategic organization
 * into one powerful, space-flexible panel with knowledge base integration
 */

import React, { useState, useEffect } from 'react';
import { Brain, Zap, Target, Eye, BookOpen, Activity, Lightbulb, X } from 'lucide-react';
import { useCognitiveProcessor, PonderingState } from '../brain/CognitiveProcessor';
import { useStrategicOrganizer } from '../brain/StrategicOrganizer';
import { NEURAL_THINKING_PATTERNS } from '../brain/NeuralThinkingEngine';
import { AgentType } from '../types/ai';

// Default capabilities based on assistant type
const getDefaultCapabilities = (assistantType?: AgentType): string[] => {
  const capabilityMap: Record<AgentType, string[]> = {
    'research': ['information-gathering', 'fact-checking', 'source-analysis', 'data-synthesis'],
    'work': ['document-creation', 'task-management', 'workflow-optimization', 'productivity-analysis'],
    'learning': ['knowledge-extraction', 'skill-development', 'concept-explanation', 'progress-tracking'],
    'building': ['system-design', 'architecture-planning', 'code-generation', 'testing-strategy'],
    'general': ['conversation', 'general-assistance', 'problem-solving', 'information-retrieval'],
    'tasks': ['task-orchestration', 'priority-management', 'deadline-tracking', 'resource-allocation'],
    'email': ['email-composition', 'communication-optimization', 'contact-management', 'scheduling'],
    'calendar': ['appointment-scheduling', 'time-management', 'conflict-resolution', 'reminder-system'],
    'drive': ['file-organization', 'content-analysis', 'search-optimization', 'metadata-management'],
    'coaching': ['guidance-provision', 'goal-setting', 'progress-monitoring', 'motivational-support']
  };
  
  return capabilityMap[assistantType || 'general'] || capabilityMap.general;
};



interface CollectiveBrainState {
  activeMode: 'thinking' | 'organizing' | 'monitoring' | 'knowledge';
  cognitive: PonderingState;
  strategic: any;
  insights: string[];
  currentFocus: string;
  knowledgeContext: any[];
}

interface CollectiveBrainMonitorProps {
  selectedAssistant?: any;
  autonomousLearning?: boolean;
  neuralAIEnabled?: boolean;
  onModeChange?: (mode: 'thinking' | 'organizing' | 'monitoring' | 'knowledge') => void;
  onClose?: () => void;
}

export const CollectiveBrainMonitor: React.FC<CollectiveBrainMonitorProps> = ({ 
  selectedAssistant, 
  autonomousLearning = false, 
  neuralAIEnabled = false,
  onModeChange,
  onClose
}) => {
  const [brainState, setBrainState] = useState<CollectiveBrainState>({
    activeMode: 'thinking',
    cognitive: {
      isThinking: false,
      currentLayer: '',
      thoughtChain: [],
      insights: [],
      concerns: [],
      alternatives: []
    },
    strategic: null,
    insights: [],
    currentFocus: '',
    knowledgeContext: []
  });

  // Local state for capabilities to allow real-time updates
  const [activeCapabilities, setActiveCapabilities] = useState<string[]>([]);

  // Initialize capabilities when selectedAssistant changes
  useEffect(() => {
    if (selectedAssistant) {
      const caps = selectedAssistant.capabilities?.length > 0 
        ? selectedAssistant.capabilities 
        : getDefaultCapabilities(selectedAssistant.type);
      setActiveCapabilities(caps);
    }
  }, [selectedAssistant]);

  // Activate default capabilities for the assistant
  const activateDefaultCapabilities = () => {
    if (!selectedAssistant) return;
    
    const defaultCaps = getDefaultCapabilities(selectedAssistant.type);
    console.log(`🔋 Activating ${defaultCaps.length} capabilities for ${selectedAssistant.name}:`, defaultCaps);
    
    setActiveCapabilities(defaultCaps);
    
    // Optional: Update the assistant in the store (if you have access to the store)
    // updateAssistant(selectedAssistant.id, { capabilities: defaultCaps });
  };

  const { deepThink, ponderingState, NEURAL_THINKING_PATTERNS: patterns } = useCognitiveProcessor();
  const { organizeInformation, prioritizeStrategically } = useStrategicOrganizer();

  // Sync with cognitive processor
  useEffect(() => {
    setBrainState(prev => ({
      ...prev,
      cognitive: ponderingState
    }));
  }, [ponderingState]);

  const handleDeepThink = async (input: string) => {
    const result = await deepThink(input, brainState.knowledgeContext, {
      communicationStyle: 'analytical',
      preferredPacing: 'methodical',
      decisionMaking: 'systematic',
      emotionalMarkers: {
        excitement: [],
        frustration: [],
        satisfaction: [],
        curiosity: []
      }
    });
    
    setBrainState(prev => ({
      ...prev,
      insights: [...prev.insights, result.layers.implications],
      currentFocus: result.layers.intent
    }));
  };

  const handleStrategicOrganization = (objectives: string[]) => {
    const organized = organizeInformation(objectives, brainState.currentFocus);
    const priorities = prioritizeStrategically(objectives, brainState.knowledgeContext);
    
    setBrainState(prev => ({
      ...prev,
      strategic: {
        organized,
        priorities,
        immediate: objectives.slice(0, 3),
        shortTerm: objectives.slice(3, 6),
        longTerm: objectives.slice(6)
      }
    }));
  };

  const renderThinkingMode = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-blue-400">
        <Brain className="w-5 h-5" />
        <span className="font-medium">Cognitive Processing</span>
        {brainState.cognitive.isThinking && (
          <Activity className="w-4 h-4 animate-pulse text-green-400" />
        )}
      </div>

      {brainState.cognitive.currentLayer && (
        <div className="bg-blue-900/20 rounded-lg p-3">
          <div className="text-sm text-blue-300 mb-2">Current Layer:</div>
          <div className="text-blue-100">{brainState.cognitive.currentLayer}</div>
        </div>
      )}

      {brainState.cognitive.thoughtChain.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Thought Chain:</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {brainState.cognitive.thoughtChain.map((thought, idx) => (
              <div key={idx} className="text-sm text-gray-300 bg-gray-800/50 rounded px-2 py-1">
                {thought}
              </div>
            ))}
          </div>
        </div>
      )}

      {brainState.cognitive.insights.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-green-400 flex items-center gap-1">
            <Lightbulb className="w-4 h-4" />
            Insights:
          </div>
          <div className="space-y-1">
            {brainState.cognitive.insights.map((insight, idx) => (
              <div key={idx} className="text-sm text-green-300 bg-green-900/20 rounded px-2 py-1">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderOrganizingMode = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-purple-400">
        <Target className="w-5 h-5" />
        <span className="font-medium">Strategic Organization</span>
      </div>

      {brainState.strategic && (
        <div className="space-y-3">
          <div className="bg-purple-900/20 rounded-lg p-3">
            <div className="text-sm text-purple-300 mb-2">Strategic Focus:</div>
            <div className="text-purple-100">{brainState.currentFocus || 'Organizing objectives'}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-red-900/20 rounded p-2">
              <div className="text-red-300 font-medium mb-1">Immediate</div>
              <div className="space-y-1">
                {brainState.strategic.immediate?.map((item: string, idx: number) => (
                  <div key={idx} className="text-red-200">{item}</div>
                ))}
              </div>
            </div>
            <div className="bg-yellow-900/20 rounded p-2">
              <div className="text-yellow-300 font-medium mb-1">Short Term</div>
              <div className="space-y-1">
                {brainState.strategic.shortTerm?.map((item: string, idx: number) => (
                  <div key={idx} className="text-yellow-200">{item}</div>
                ))}
              </div>
            </div>
            <div className="bg-blue-900/20 rounded p-2">
              <div className="text-blue-300 font-medium mb-1">Long Term</div>
              <div className="space-y-1">
                {brainState.strategic.longTerm?.map((item: string, idx: number) => (
                  <div key={idx} className="text-blue-200">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMonitoringMode = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-400">
        <Eye className="w-5 h-5" />
        <span className="font-medium">Brain Monitoring</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-gray-300 font-medium mb-1">Neural Patterns</div>
          <div className="space-y-1">
            {Object.keys(patterns).slice(0, 3).map(pattern => (
              <div key={pattern} className="text-gray-400">{pattern}</div>
            ))}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-gray-300 font-medium mb-1">Status</div>
          <div className="space-y-1">
            <div className="text-green-400">Cognitive: Active</div>
            <div className="text-blue-400">Strategic: Ready</div>
            <div className="text-purple-400">Knowledge: Synced</div>
          </div>
        </div>
      </div>

      {brainState.currentFocus && (
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-gray-300 font-medium mb-1">Current Focus</div>
          <div className="text-gray-100 text-sm">{brainState.currentFocus}</div>
        </div>
      )}
    </div>
  );

  const renderKnowledgeMode = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-400">
        <BookOpen className="w-5 h-5" />
        <span className="font-medium">Knowledge Integration</span>
      </div>

      {selectedAssistant && (
        <div className="bg-amber-900/20 rounded-lg p-3">
          <div className="text-sm text-amber-300 mb-2">Assistant Knowledge Network:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-amber-200">Knowledge Base:</div>
              <div className="text-amber-100">{selectedAssistant.knowledgeBase?.length || 0} documents</div>
            </div>
            <div>
              <div className="text-amber-200">Linked Folders:</div>
              <div className="text-amber-100">{selectedAssistant.linkedFolders?.length || 0} folders</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-200">
            Neural pathways: {autonomousLearning ? 'Learning active' : 'Static'} • 
            Processing: {neuralAIEnabled ? 'Enhanced' : 'Standard'}
          </div>
        </div>
      )}

      <div className="bg-amber-900/20 rounded-lg p-3">
        <div className="text-sm text-amber-300 mb-2">Context Pool:</div>
        <div className="text-amber-200">{brainState.knowledgeContext.length} items indexed</div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-gray-400">Recent Insights:</div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {brainState.insights.map((insight, idx) => (
            <div key={idx} className="text-sm text-amber-300 bg-amber-900/20 rounded px-2 py-1">
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg">
      {/* Header with mode selector */}
      <div className="border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Collective Brain</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {[
                { mode: 'thinking', icon: Brain, color: 'blue', label: 'Thinking' },
                { mode: 'organizing', icon: Target, color: 'purple', label: 'Organizing' },
                { mode: 'monitoring', icon: Eye, color: 'green', label: 'Monitoring' },
                { mode: 'knowledge', icon: BookOpen, color: 'amber', label: 'Knowledge' }
              ].map(({ mode, icon: Icon, color, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setBrainState(prev => ({ ...prev, activeMode: mode as any }));
                    onModeChange?.(mode as any);
                  }}
                  className={`p-1.5 rounded text-xs transition-colors ${
                    brainState.activeMode === mode
                      ? `bg-${color}-500/20 text-${color}-400`
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 ml-2 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                title="Close Collective Brain"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Assistant Neuro Network Connection */}
      {selectedAssistant && (
        <div className="border-b border-gray-700 p-3 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-200">
                  Connected to {selectedAssistant.name}
                </div>
                <div className="text-xs text-gray-400">
                  Neural link active • Knowledge synced
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {autonomousLearning && (
                <div className="flex items-center gap-1 text-xs text-purple-400">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Learning
                </div>
              )}
              {neuralAIEnabled && (
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <Zap className="w-3 h-3 animate-pulse" />
                  Neural AI
                </div>
              )}
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Active connection" />
            </div>
          </div>
          
          {/* Assistant Knowledge Summary */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-blue-900/20 rounded p-2">
              <div className="text-blue-300 font-medium mb-1">Knowledge Base</div>
              <div className="text-blue-200">
                {selectedAssistant.knowledgeBase?.length || 0} documents
              </div>
            </div>
            <div className="bg-purple-900/20 rounded p-2">
              <div className="text-purple-300 font-medium mb-1">Capabilities</div>
              <div className="text-purple-200">
                {activeCapabilities.length} active
              </div>
              {activeCapabilities.length === 0 && selectedAssistant && (
                <div className="text-xs text-purple-400 mt-1 cursor-pointer hover:text-purple-300" 
                     onClick={activateDefaultCapabilities}>
                  Click to activate →
                </div>
              )}
              {activeCapabilities.length > 0 && (
                <div className="text-xs text-purple-400 mt-1">
                  {activeCapabilities.slice(0, 2).join(', ')}
                  {activeCapabilities.length > 2 && ` +${activeCapabilities.length - 2} more`}
                </div>
              )}
            </div>
            <div className="bg-green-900/20 rounded p-2">
              <div className="text-green-300 font-medium mb-1">Neural State</div>
              <div className="text-green-200">
                {brainState.cognitive.isThinking ? 'Thinking' : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="p-3">
        {brainState.activeMode === 'thinking' && renderThinkingMode()}
        {brainState.activeMode === 'organizing' && renderOrganizingMode()}
        {brainState.activeMode === 'monitoring' && renderMonitoringMode()}
        {brainState.activeMode === 'knowledge' && renderKnowledgeMode()}
      </div>

      {/* Quick actions */}
      <div className="border-t border-gray-700 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => handleDeepThink("Current conversation context")}
            className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
            disabled={brainState.cognitive.isThinking}
          >
            Think
          </button>
          <button
            onClick={() => handleStrategicOrganization(["Current objectives", "User goals", "System tasks"])}
            className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-colors"
          >
            Organize
          </button>
        </div>
      </div>
    </div>
  );
};
