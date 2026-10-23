/**
 * Neural Control Panel - The On/Off Switch for AI Thinking
 * 
 * This gives users complete control over the AI's thinking depth
 * and intellectual integrity settings
 */

import React, { useState, useCallback } from 'react';
import { Brain, Settings, Zap, Shield, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import './NeuralControlPanel.css';

export interface NeuralSettings {
  // Core thinking toggles
  deepThinking: boolean;           // Full cognitive processing
  strategicPlanning: boolean;      // Multi-step planning
  riskAnalysis: boolean;          // Obstacle identification
  creativeSynthesis: boolean;     // Novel solution generation
  
  // Intellectual integrity settings
  truthSeekingMode: boolean;      // Will disagree when needed
  peopleePleasingResistance: number; // 0-100, how much to resist agreement
  directnessLevel: number;        // 0-100, how direct to be
  challengeWillingness: number;   // 0-100, willingness to challenge user
  
  // Processing depth
  thinkingDepth: number;          // 1-5 layers of analysis
  responseTime: 'instant' | 'thoughtful' | 'deep'; // Speed vs depth
  
  // Transparency settings
  showThinkingProcess: boolean;   // Show the AI's reasoning
  showAlternatives: boolean;      // Show other options considered
  showConcerns: boolean;         // Show risks and warnings
}

interface NeuralControlPanelProps {
  settings: NeuralSettings;
  onSettingsChange: (settings: NeuralSettings) => void;
  isThinking: boolean;
  thinkingState?: {
    currentLayer: string;
    progress: number;
    insights: string[];
  };
}

export const NeuralControlPanel: React.FC<NeuralControlPanelProps> = ({
  settings,
  onSettingsChange,
  isThinking,
  thinkingState
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const updateSetting = useCallback((key: keyof NeuralSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  }, [settings, onSettingsChange]);
  
  const presets = {
    genius: {
      name: "🧠 Genius",
      description: "Maximum depth thinking with comprehensive analysis and creative exploration",
      settings: {
        ...settings,
        deepThinking: true,
        strategicPlanning: true,
        riskAnalysis: true,
        creativeSynthesis: true,
        truthSeekingMode: true,
        peopleePleasingResistance: 85,
        directnessLevel: 80,
        challengeWillingness: 90,
        thinkingDepth: 5,
        responseTime: 'deep' as const,
        showThinkingProcess: true,
        showAlternatives: true,
        showConcerns: true
      }
    },
    balanced: {
      name: "⚖️ Balanced", 
      description: "Moderate depth balancing speed and thoroughness",
      settings: {
        ...settings,
        deepThinking: true,
        strategicPlanning: true,
        riskAnalysis: true,
        creativeSynthesis: false,
        truthSeekingMode: true,
        peopleePleasingResistance: 60,
        directnessLevel: 65,
        challengeWillingness: 70,
        thinkingDepth: 3,
        responseTime: 'thoughtful' as const,
        showThinkingProcess: false,
        showAlternatives: true,
        showConcerns: true
      }
    },
    supportive: {
      name: "🤝 Supportive",
      description: "Light thinking optimized for quick responses",
      settings: {
        ...settings,
        deepThinking: false,
        strategicPlanning: false,
        riskAnalysis: false,
        creativeSynthesis: false,
        truthSeekingMode: false,
        peopleePleasingResistance: 20,
        directnessLevel: 40,
        challengeWillingness: 30,
        thinkingDepth: 1,
        responseTime: 'instant' as const,
        showThinkingProcess: false,
        showAlternatives: false,
        showConcerns: false
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Neural Status Display - Compact */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border p-3">
        <div className="flex items-center gap-2 mb-2">
          <Brain className={`h-4 w-4 ${isThinking ? 'animate-pulse text-purple-600' : 'text-gray-600'}`} />
          <span className="font-medium text-sm">Neural Thinking Engine</span>
          {isThinking && (
            <span className="text-xs text-purple-600">
              {thinkingState?.currentLayer}
            </span>
          )}
        </div>
        {isThinking && thinkingState ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Depth</span>
              <span>{thinkingState.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`bg-purple-600 h-1 rounded-full neural-progress-bar neural-progress-${Math.round(thinkingState.progress / 10) * 10}`}
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-600">
            Engine ready. Configure parameters below.
          </div>
        )}
      </div>
      
      {/* Quick Presets - Compact */}
      <div className="border rounded-lg p-3">
        <h3 className="font-medium text-sm mb-3">Quick Presets</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(presets).map(([key, preset]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-8 text-xs justify-center"
              onClick={() => onSettingsChange(preset.settings)}
              title={preset.description}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Core Thinking Controls - Compact */}
      <div className="border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4" />
          <h3 className="font-medium text-sm">Core Thinking Systems</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Deep Thinking</div>
              <div className="text-xs text-gray-600">Multi-layer processing</div>
            </div>
            <Switch
              checked={settings.deepThinking}
              onCheckedChange={(checked) => updateSetting('deepThinking', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Strategic Planning</div>
              <div className="text-xs text-gray-600">Long-term analysis</div>
            </div>
            <Switch
              checked={settings.strategicPlanning}
              onCheckedChange={(checked) => updateSetting('strategicPlanning', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Risk Analysis</div>
              <div className="text-xs text-gray-600">Problem identification</div>
            </div>
            <Switch
              checked={settings.riskAnalysis}
              onCheckedChange={(checked) => updateSetting('riskAnalysis', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Creative Synthesis</div>
              <div className="text-xs text-gray-600">Novel solutions</div>
            </div>
            <Switch
              checked={settings.creativeSynthesis}
              onCheckedChange={(checked) => updateSetting('creativeSynthesis', checked)}
            />
          </div>
        </div>
      </div>
      
      {/* Intellectual Integrity Controls - Compact */}
      <div className="border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4" />
          <h3 className="font-medium text-sm">Intellectual Integrity</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Truth-Seeking Mode</div>
              <div className="text-xs text-gray-600">Will disagree when necessary</div>
            </div>
            <Switch
              checked={settings.truthSeekingMode}
              onCheckedChange={(checked) => updateSetting('truthSeekingMode', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Resistance</span>
              <span className="text-xs text-gray-600">{settings.peopleePleasingResistance}%</span>
            </div>
            <Slider
              value={[settings.peopleePleasingResistance]}
              onValueChange={(value) => updateSetting('peopleePleasingResistance', value[0])}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Directness</span>
              <span className="text-xs text-gray-600">{settings.directnessLevel}%</span>
            </div>
            <Slider
              value={[settings.directnessLevel]}
              onValueChange={(value) => updateSetting('directnessLevel', value[0])}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Challenge</span>
              <span className="text-xs text-gray-600">{settings.challengeWillingness}%</span>
            </div>
            <Slider
              value={[settings.challengeWillingness]}
              onValueChange={(value) => updateSetting('challengeWillingness', value[0])}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="h-5 w-5" />
            Advanced Neural Settings
            <span className="text-sm font-normal text-gray-600 ml-auto">
              {showAdvanced ? 'Hide' : 'Show'}
            </span>
          </CardTitle>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Thinking Depth</span>
                <span className="text-sm text-gray-600">{settings.thinkingDepth} layers</span>
              </div>
              <Slider
                value={[settings.thinkingDepth]}
                onValueChange={(value) => updateSetting('thinkingDepth', value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500">
                More layers = deeper analysis but slower responses
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="font-medium">Response Timing</div>
              <div className="grid grid-cols-3 gap-2">
                {['instant', 'thoughtful', 'deep'].map((timing) => (
                  <Button
                    key={timing}
                    variant={settings.responseTime === timing ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSetting('responseTime', timing)}
                    className="capitalize"
                  >
                    {timing}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="font-medium">Transparency Options</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Thinking Process</span>
                  <Switch
                    checked={settings.showThinkingProcess}
                    onCheckedChange={(checked) => updateSetting('showThinkingProcess', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Alternative Solutions</span>
                  <Switch
                    checked={settings.showAlternatives}
                    onCheckedChange={(checked) => updateSetting('showAlternatives', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Concerns & Risks</span>
                  <Switch
                    checked={settings.showConcerns}
                    onCheckedChange={(checked) => updateSetting('showConcerns', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
