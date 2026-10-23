import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { assistantConversationService, CapabilityAnalysis } from '../../services/ai/assistantConversationService';
import { Loader2, TrendingUp, TrendingDown, Lightbulb, RefreshCw } from 'lucide-react';
import type { AIAssistant } from '../../types/ai';

interface CapabilityAnalyzerProps {
  assistant: AIAssistant | null;
  onApplySuggestion: (suggestion: string) => void;
}

export function CapabilityAnalyzer({ assistant, onApplySuggestion }: CapabilityAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CapabilityAnalysis | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const analyzeAssistant = async () => {
    if (!assistant) return;
    
    setAnalyzing(true);
    try {
      const result = await assistantConversationService.analyzeCapabilities(assistant);
      setAnalysis(result);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Error analyzing assistant capabilities:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Auto-analyze on first load
  useEffect(() => {
    if (assistant && !analysis && !analyzing) {
      analyzeAssistant();
    }
  }, [assistant]);

  if (!assistant) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center py-4">
          Save your assistant first to analyze its capabilities.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Capability Analysis
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={analyzeAssistant}
          disabled={analyzing}
          className="flex items-center gap-1"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      {analyzing ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            Analyzing assistant capabilities...<br />
            This may take a moment.
          </p>
        </div>
      ) : analysis ? (
        <div className="space-y-4">
          {/* Strengths */}
          <div>
            <h4 className="text-xs font-medium uppercase text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 
              Strengths
            </h4>
            <div className="space-y-1">
              {analysis.strengths.map((strength, index) => (
                <div key={index} className="text-sm flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Weaknesses */}
          <div>
            <h4 className="text-xs font-medium uppercase text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> 
              Areas for Improvement
            </h4>
            <div className="space-y-1">
              {analysis.weaknesses.map((weakness, index) => (
                <div key={index} className="text-sm flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                  <span>{weakness}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Suggestions */}
          <div>
            <h4 className="text-xs font-medium uppercase text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> 
              Improvement Suggestions
            </h4>
            <div className="space-y-2">
              {analysis.suggestedImprovements.map((suggestion, index) => (
                <Card 
                  key={index} 
                  className="p-2 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onApplySuggestion(suggestion)}
                >
                  <div className="text-sm">{suggestion}</div>
                  <div className="text-xs text-primary mt-1">Click to add to conversation</div>
                </Card>
              ))}
            </div>
          </div>
          
          {lastAnalyzed && (
            <p className="text-xs text-muted-foreground mt-4">
              Last analyzed: {lastAnalyzed.toLocaleTimeString()}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No analysis available.<br />
            Click "Refresh Analysis" to evaluate this assistant's capabilities.
          </p>
        </div>
      )}
    </Card>
  );
}