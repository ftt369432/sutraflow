/**
 * 🎤 Voice-to-SQL Interface - Contest Feature UI
 * 
 * Interactive voice-driven SQL query interface with real-time
 * optimization, cost analysis, and intelligent suggestions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { 
  Mic, 
  Play, 
  Pause, 
  Square,
  Database, 
  Zap, 
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  History,
  BarChart3,
  Copy,
  Download,
  RefreshCw,
  Sparkles
} from 'lucide-react';

// Import our Voice-to-SQL Engine
import { VoiceToSQLEngine, VoiceToSQLResult, VoiceCommand } from '../../services/voice/VoiceToSQLEngine';
import VoiceToSQLServiceProvider from '../../services/VoiceToSQLServiceProvider';

interface VoiceToSQLInterfaceProps {
  voiceEngine?: VoiceToSQLEngine;
  onQueryExecuted?: (result: VoiceToSQLResult) => void;
}

interface AudioVisualizerProps {
  isListening: boolean;
  audioLevel: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isListening, audioLevel }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-gradient-to-t from-blue-600 to-indigo-600 rounded-full transition-all duration-150 ${
            isListening ? 'animate-pulse' : ''
          }`}
          style={{
            height: isListening 
              ? `${Math.random() * audioLevel * 100 + 10}%` 
              : '20%',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

export const VoiceToSQLInterface: React.FC<VoiceToSQLInterfaceProps> = ({
  voiceEngine: providedVoiceEngine,
  onQueryExecuted
}) => {
  // Voice Recording States
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Engine States
  const [voiceEngine, setVoiceEngine] = useState<VoiceToSQLEngine | null>(providedVoiceEngine || null);
  const [isEngineReady, setIsEngineReady] = useState(false);

  // Query Results States
  const [currentResult, setCurrentResult] = useState<VoiceToSQLResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<VoiceToSQLResult[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<string | null>(null);

  // Analytics States
  const [analytics, setAnalytics] = useState({
    totalQueries: 0,
    averageConfidence: 0,
    successRate: 0,
    averageCostSavings: 0,
    topIntents: [] as Array<{ type: string; count: number }>
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Demo voice commands for showcase
  const demoCommands = [
    "Show me total revenue for this month",
    "List top 10 customers by order value",
    "What's the average order amount by product category?",
    "Find customers who haven't ordered in the last 30 days",
    "Show me sales trend over the last 6 months"
  ];

  useEffect(() => {
    // Initialize voice engine and load analytics
    const initializeEngine = async () => {
      try {
        if (!voiceEngine) {
          console.log('🎤 Initializing Voice-to-SQL Engine...');
          const engine = await VoiceToSQLServiceProvider.getVoiceToSQLEngine();
          setVoiceEngine(engine);
          setIsEngineReady(true);
          console.log('✅ Voice-to-SQL Engine ready!');
        }
        
        if (voiceEngine) {
          loadAnalytics();
        }
      } catch (error) {
        console.error('❌ Failed to initialize Voice-to-SQL Engine:', error);
        setIsEngineReady(false);
      }
    };

    initializeEngine();
  }, [voiceEngine]);

  const loadAnalytics = () => {
    if (voiceEngine) {
      const stats = voiceEngine.getAnalytics();
      setAnalytics(stats);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const analyser = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // In production, convert to text using speech-to-text API
        // For demo, we'll use the text input
        await processVoiceCommand(voiceInput);
      };
      
      // Start recording and visualization
      mediaRecorderRef.current.start();
      setIsListening(true);
      
      // Audio level monitoring for visualization
      const updateAudioLevel = () => {
        if (isListening && analyser) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average / 255);
          
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();
      
    } catch (error) {
      console.error('❌ Failed to start voice recording:', error);
      alert('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsListening(false);
    setAudioLevel(0);
  };

  const processVoiceCommand = async (command: string) => {
    if (!command.trim()) {
      alert('Please enter a voice command');
      return;
    }
    
    if (!voiceEngine || !isEngineReady) {
      alert('Voice-to-SQL engine is still initializing. Please wait a moment...');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🎯 Processing voice command:', command);
      
      const result = await voiceEngine.translateVoiceToSQL(command, {
        userId: 'demo-user',
        sessionId: `session_${Date.now()}`
      });
      
      setCurrentResult(result);
      setQueryHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      
      if (onQueryExecuted) {
        onQueryExecuted(result);
      }
      
      // Reload analytics
      loadAnalytics();
      
      console.log('✅ Voice-to-SQL processing completed:', result);
      
    } catch (error) {
      console.error('❌ Voice command processing failed:', error);
      alert('Failed to process voice command. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDemo = (demoCommand: string) => {
    setVoiceInput(demoCommand);
    processVoiceCommand(demoCommand);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const downloadResults = () => {
    if (currentResult) {
      const data = {
        query: currentResult.voiceCommand.transcript,
        sql: currentResult.translation.sql,
        results: currentResult.executionResult?.data || [],
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-sql-results-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl mb-6 shadow-2xl shadow-blue-500/25">
          {isEngineReady ? (
            <Mic className="h-10 w-10 text-white" />
          ) : (
            <RefreshCw className="h-10 w-10 text-white animate-spin" />
          )}
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent mb-3">
          Voice-to-SQL Engine
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg font-medium max-w-3xl mx-auto">
          Revolutionary natural language to Snowflake SQL translation with AI optimization and cost analysis
        </p>
        {!isEngineReady && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Initializing AI engine...</span>
          </div>
        )}
      </div>

      {/* Voice Input Interface */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">Voice Command Interface</span>
          </CardTitle>
          <CardDescription className="font-medium">
            Speak naturally or type your data question. Our AI will generate optimized Snowflake SQL.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Voice Input Area */}
            <div className="space-y-4">
              <Textarea
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                placeholder="Ask about your data... e.g., 'Show me total sales last month' or 'List top customers by revenue'"
                className="min-h-24 text-lg resize-none border-2 focus:border-blue-500"
                disabled={isProcessing}
              />
              
              {/* Voice Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing}
                    className={`h-14 w-14 rounded-full transition-all duration-300 ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/25' 
                        : 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-500/25'
                    }`}
                  >
                    {isListening ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  
                  <Button
                    onClick={() => processVoiceCommand(voiceInput)}
                    disabled={!voiceInput.trim() || isProcessing}
                    className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white font-medium px-6 py-3 shadow-lg shadow-purple-500/25"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Play className="h-5 w-5 mr-2" />
                    )}
                    {isProcessing ? 'Processing...' : 'Generate SQL'}
                  </Button>
                </div>

                {/* Audio Visualizer */}
                {(isListening || audioLevel > 0) && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Listening</span>
                    <AudioVisualizer isListening={isListening} audioLevel={audioLevel} />
                  </div>
                )}
              </div>
            </div>

            {/* Demo Commands */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                💡 Try these demo commands:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {demoCommands.map((command, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => executeDemo(command)}
                    disabled={isProcessing}
                    className="text-left justify-start h-auto py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <div className="text-sm">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{command}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {currentResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SQL Translation Result */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span>Generated SQL Query</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getConfidenceColor(currentResult.translation.confidence)}>
                      {Math.round(currentResult.translation.confidence * 100)}% confidence
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(currentResult.translation.sql)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{currentResult.translation.sql}</pre>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Explanation:</h4>
                  <p className="text-slate-600 dark:text-slate-300">{currentResult.translation.explanation}</p>
                </div>

                {/* Optimization Info */}
                {currentResult.translation.optimization && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">AI Optimization Applied</h4>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-3">{currentResult.translation.optimization.improvementReason}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-white/60 dark:bg-slate-700/60 rounded">
                        <div className="text-xl font-bold text-green-600">{Math.round(currentResult.translation.optimization.costSavings)}%</div>
                        <div className="text-slate-600 dark:text-slate-400">Cost Savings</div>
                      </div>
                      <div className="text-center p-2 bg-white/60 dark:bg-slate-700/60 rounded">
                        <div className="text-xl font-bold text-blue-600">{Math.round(currentResult.translation.optimization.performanceGain)}%</div>
                        <div className="text-slate-600 dark:text-slate-400">Faster</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Execution Plan & Suggestions */}
          <div className="space-y-6">
            {/* Execution Plan */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Execution Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-bold">${currentResult.translation.executionPlan.estimatedCost.toFixed(3)}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">Est. Cost</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-bold">{currentResult.translation.executionPlan.estimatedTime.toFixed(1)}s</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">Est. Time</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Badge className={
                    currentResult.translation.executionPlan.complexity === 'low' ? 'bg-green-100 text-green-700' :
                    currentResult.translation.executionPlan.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {currentResult.translation.executionPlan.complexity.toUpperCase()} COMPLEXITY
                  </Badge>
                </div>

                {currentResult.translation.executionPlan.warnings && (
                  <div className="space-y-2">
                    {currentResult.translation.executionPlan.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-yellow-800 dark:text-yellow-200">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Suggestions */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Smart Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentResult.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full text-left justify-start h-auto py-3 px-3 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => executeDemo(suggestion)}
                    >
                      <Lightbulb className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {analytics.totalQueries > 0 && (
        <Card className="bg-gradient-to-br from-white/90 to-blue-50/90 dark:from-slate-800/90 dark:to-blue-900/20 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Voice-to-SQL Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-600">{analytics.totalQueries}</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Queries</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm">
                <div className="text-3xl font-bold text-green-600">{Math.round(analytics.averageConfidence * 100)}%</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Avg Confidence</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm">
                <div className="text-3xl font-bold text-purple-600">{Math.round(analytics.successRate * 100)}%</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Success Rate</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm">
                <div className="text-3xl font-bold text-orange-600">{Math.round(analytics.averageCostSavings * 100)}%</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Avg Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceToSQLInterface;