/**
 * Neural AI Integration - The Complete Brain System
 * 
 * This integrates all the thinking components into your chat system
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useCognitiveProcessor } from '../brain/CognitiveProcessor';
import { useStrategicOrganizer } from '../brain/StrategicOrganizer';
import { useUserBonding } from '../hooks/useUserBonding';
import { NeuralControlPanel, NeuralSettings } from './NeuralControlPanel';
import { Brain, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface NeuralAIProps {
  userId: string;
  chatMessages: any[];
  onResponseGenerated: (response: any) => void;
  userPersonality?: any;
}

export const NeuralAI: React.FC<NeuralAIProps> = ({
  userId,
  chatMessages,
  onResponseGenerated,
  userPersonality
}) => {
  const [neuralSettings, setNeuralSettings] = useState<NeuralSettings>({
    deepThinking: true,
    strategicPlanning: true,
    riskAnalysis: true,
    creativeSynthesis: false,
    truthSeekingMode: true,
    peopleePleasingResistance: 70,
    directnessLevel: 75,
    challengeWillingness: 80,
    thinkingDepth: 3,
    responseTime: 'thoughtful',
    showThinkingProcess: true,
    showAlternatives: true,
    showConcerns: true
  });
  
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [currentThought, setCurrentThought] = useState<any>(null);
  
  const { deepThink, ponderingState } = useCognitiveProcessor();
  const { organizeInformation, prioritizeStrategically, createStrategicFramework } = useStrategicOrganizer();
  const { generatePersonalizedResponse, bondingState } = useUserBonding(userId, chatMessages);
  
  // The main thinking process
  const processUserMessage = useCallback(async (userMessage: string) => {
    if (!neuralSettings.deepThinking) {
      // Simple response mode
      const baseResponse = await generateSimpleResponse(userMessage);
      onResponseGenerated({ content: baseResponse, metadata: { mode: 'simple' } });
      return;
    }
    
    // Deep thinking mode
    const thinkingProcess = await deepThink(userMessage, chatMessages, userPersonality);
    setCurrentThought(thinkingProcess);
    
    // Generate response based on thinking
    const response = await generateThoughtfulResponse(thinkingProcess, userMessage);
    
    onResponseGenerated({
      content: response.content,
      metadata: {
        mode: 'neural',
        thinkingProcess: neuralSettings.showThinkingProcess ? thinkingProcess : null,
        alternatives: neuralSettings.showAlternatives ? response.alternatives : null,
        concerns: neuralSettings.showConcerns ? response.concerns : null,
        bondingLevel: bondingState.connectionDepth
      }
    });
  }, [neuralSettings, deepThink, chatMessages, userPersonality, onResponseGenerated]);
  
  const generateSimpleResponse = async (message: string) => {
    // Simple AI response without deep thinking
    return "I understand. Let me help you with that.";
  };
  
  const generateThoughtfulResponse = async (thinking: any, userMessage: string) => {
    const { layers, breakdown, integrity } = thinking;
    
    // Core response based on deep analysis
    let response = `Based on my analysis of "${layers.surface}", I understand you're looking for ${layers.intent}.`;
    
    // Add strategic insights
    if (neuralSettings.strategicPlanning) {
      response += `\n\n## Strategic Approach\n${breakdown.coreChallenge}`;
      
      if (breakdown.subProblems.length > 0) {
        response += `\n\n**Key Areas to Address:**\n${breakdown.subProblems.map(p => `- ${p}`).join('\n')}`;
      }
    }
    
    // Add risk analysis
    const concerns = [];
    if (neuralSettings.riskAnalysis && layers.obstacles.length > 0) {
      concerns.push(...layers.obstacles);
      response += `\n\n## Potential Challenges\n${layers.obstacles.map(o => `⚠️ ${o}`).join('\n')}`;
    }
    
    // Add opportunities
    const alternatives = [];
    if (layers.opportunities.length > 0) {
      alternatives.push(...layers.opportunities);
      response += `\n\n## Opportunities\n${layers.opportunities.map(o => `🚀 ${o}`).join('\n')}`;
    }
    
    // Apply truth-seeking integrity
    if (neuralSettings.truthSeekingMode && integrity.disagreementWillingness > 70) {
      // Check if we should challenge the user's approach
      if (userMessage.includes('quick fix') || userMessage.includes('easy way')) {
        response += `\n\n**Honest Assessment:** While you're looking for a quick solution, I think we should consider a more robust approach that will serve you better long-term.`;
      }
    }
    
    // Personalize based on bonding
    const personalizedResponse = generatePersonalizedResponse(response, userMessage);
    
    return {
      content: personalizedResponse.enhancedResponse,
      alternatives,
      concerns,
      personalizations: personalizedResponse.personalizations
    };
  };
  
  // Show thinking process in real-time
  const ThinkingVisualization = () => {
    if (!ponderingState.isThinking || !neuralSettings.showThinkingProcess) return null;
    
    return (
      <Card className="mb-4 border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 animate-pulse text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Thinking Process</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="font-medium text-purple-700">
              Current Layer: {ponderingState.currentLayer}
            </div>
            
            {ponderingState.thoughtChain.length > 0 && (
              <div>
                <div className="text-purple-600 mb-1">Thought Chain:</div>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  {ponderingState.thoughtChain.slice(-3).map((thought, i) => (
                    <li key={i} className="text-xs">{thought}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {ponderingState.insights.length > 0 && (
              <div>
                <div className="text-purple-600 mb-1">Current Insights:</div>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  {ponderingState.insights.slice(-2).map((insight, i) => (
                    <li key={i} className="text-xs">💡 {insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="neural-ai-container">
      {/* Neural Control Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className={`h-5 w-5 ${neuralSettings.deepThinking ? 'text-purple-600' : 'text-gray-400'}`} />
          <span className="font-medium">
            Neural AI {neuralSettings.deepThinking ? 'Active' : 'Inactive'}
          </span>
          {bondingState.connectionDepth > 50 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              Connection: {bondingState.connectionDepth}%
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowControlPanel(!showControlPanel)}
          className="flex items-center gap-2"
        >
          {showControlPanel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          Neural Controls
        </Button>
      </div>
      
      {/* Thinking Visualization */}
      <ThinkingVisualization />
      
      {/* Control Panel */}
      {showControlPanel && (
        <div className="mb-6">
          <NeuralControlPanel
            settings={neuralSettings}
            onSettingsChange={setNeuralSettings}
            isThinking={ponderingState.isThinking}
            thinkingState={{
              currentLayer: ponderingState.currentLayer,
              progress: ponderingState.isThinking ? 65 : 0, // Mock progress
              insights: ponderingState.insights
            }}
          />
        </div>
      )}
      
      {/* Hidden interface to trigger thinking */}
      <div className="hidden">
        <button onClick={() => processUserMessage("test")}>Process</button>
      </div>
    </div>
  );
};

export default NeuralAI;
