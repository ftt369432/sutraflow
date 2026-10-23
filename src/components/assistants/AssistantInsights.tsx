import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/skeleton';
import { 
  Brain, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle, 
  ArrowUpRight, 
  RefreshCw,
  Sparkles,
  MessageSquare,
  BookOpen,
  Zap,
  BarChart3
} from 'lucide-react';
import { assistantConversationService } from '../../services/ai/assistantConversationService';
import type { AIAssistant } from '../../types/ai';

interface AssistantInsightsProps {
  assistant: AIAssistant | null;
  systemPrompt: string;
  folders?: Array<{ name: string; id: string }>;
}

interface InsightSection {
  score: number;
  content: string;
  recommendations: Array<{ text: string; priority: 'high' | 'medium' | 'low' }>;
}

interface AssistantAnalysis {
  purposeClarity: InsightSection;
  knowledgeCoverage: InsightSection;
  toneConsistency: InsightSection;
  instructionQuality: InsightSection;
  limitations: InsightSection;
  suggestedImprovements: string[];
  strengths: string[];
  conversationStarters: string[];
  overallScore: number;
}

export function AssistantInsights({
  assistant,
  systemPrompt,
  folders = []
}: AssistantInsightsProps) {
  const [analysis, setAnalysis] = useState<AssistantAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate insights when component mounts or assistant/prompt changes
  useEffect(() => {
    if (assistant && assistant.id && systemPrompt) {
      generateInsights();
    }
  }, [assistant?.id]);

  const generateInsights = async () => {
    if (!assistant || !systemPrompt) return;
    
    setLoading(true);
    setError(null);

    try {
      // Prepare context information
      const folderInfo = folders.length > 0 
        ? `The assistant has access to the following knowledge folders: ${folders.map(f => f.name).join(', ')}.`
        : 'The assistant does not have any knowledge folders attached.';
      
      const promptForAnalysis = `
Analyze this AI assistant configuration and generate comprehensive insights.

ASSISTANT NAME: ${assistant.name || 'Unnamed Assistant'}
ASSISTANT DESCRIPTION: ${assistant.description || 'No description provided'}
SYSTEM PROMPT:
${systemPrompt}

KNOWLEDGE CONTEXT:
${folderInfo}

Provide a detailed analysis with:
1. Purpose clarity score (1-10) with explanation
2. Knowledge coverage score (1-10) with explanation
3. Tone consistency score (1-10) with explanation 
4. Instruction quality score (1-10) with explanation
5. Limitations handling score (1-10) with explanation
6. 3-5 key strengths
7. 3-5 suggested improvements
8. 5 effective conversation starters for users
9. Overall assistant quality score (1-10)

Format your response as JSON with the following structure:
{
  "purposeClarity": {
    "score": 8,
    "content": "Detailed analysis of purpose clarity",
    "recommendations": [
      {"text": "Specific recommendation", "priority": "high|medium|low"}
    ]
  },
  "knowledgeCoverage": { /* similar structure */ },
  "toneConsistency": { /* similar structure */ },
  "instructionQuality": { /* similar structure */ },
  "limitations": { /* similar structure */ },
  "suggestedImprovements": ["Improvement 1", "Improvement 2", ...],
  "strengths": ["Strength 1", "Strength 2", ...],
  "conversationStarters": ["Starter 1", "Starter 2", ...],
  "overallScore": 7.5
}
`;

      // Get analysis using the public generateResponse method
      const result = await assistantConversationService.generateResponse(
        promptForAnalysis,
        {
          name: assistant?.name || 'Assistant',
          description: 'Analysis assistant'
        },
        []
      );
      
      try {
        const parsedResult = JSON.parse(result);
        setAnalysis(parsedResult);
      } catch (err) {
        console.error('Failed to parse insights result:', err);
        setError('Failed to parse analysis results');
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate assistant insights');
    } finally {
      setLoading(false);
    }
  };

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get background style for score indicator
  const getScoreBg = (score: number): string => {
    if (score >= 8) return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    if (score >= 5) return 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
  };

  // Get badge variant for priority
  const getPriorityVariant = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium">Assistant Insights</h2>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({length: 4}).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <h3 className="font-medium text-lg">Failed to Generate Insights</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={generateInsights} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render no data state
  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-2">
            <Lightbulb className="h-8 w-8 text-amber-500 mb-2" />
            <h3 className="font-medium text-lg">Generate Assistant Insights</h3>
            <p className="text-muted-foreground">
              Get AI-powered analysis of your assistant's configuration to improve its performance.
            </p>
            <Button 
              onClick={generateInsights} 
              className="mt-4"
            >
              <Brain className="h-4 w-4 mr-2" />
              Generate Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main content with analysis
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium">Assistant Insights</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            Overall Score: 
            <span className={`ml-1 font-medium ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore.toFixed(1)}/10
            </span>
          </Badge>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={generateInsights}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ScoreCard 
          title="Purpose Clarity"
          score={analysis.purposeClarity.score}
          content={analysis.purposeClarity.content}
          recommendations={analysis.purposeClarity.recommendations}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        
        <ScoreCard
          title="Knowledge Coverage"
          score={analysis.knowledgeCoverage.score}
          content={analysis.knowledgeCoverage.content}
          recommendations={analysis.knowledgeCoverage.recommendations}
          icon={<BookOpen className="h-5 w-5" />}
        />
        
        <ScoreCard
          title="Tone Consistency"
          score={analysis.toneConsistency.score}
          content={analysis.toneConsistency.content}
          recommendations={analysis.toneConsistency.recommendations}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        
        <ScoreCard
          title="Instruction Quality"
          score={analysis.instructionQuality.score}
          content={analysis.instructionQuality.content}
          recommendations={analysis.instructionQuality.recommendations}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        
        <ScoreCard
          title="Limitations Handling"
          score={analysis.limitations.score}
          content={analysis.limitations.content}
          recommendations={analysis.limitations.recommendations}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Suggested Improvements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-amber-500" />
              Suggested Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.suggestedImprovements.map((improvement, i) => (
                <li key={i} className="flex gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Starters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Conversation Starters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {analysis.conversationStarters.map((starter, i) => (
              <div key={i} className="border rounded-md p-3 bg-muted/30 hover:bg-muted transition-colors">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{starter}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Score Card Component
interface ScoreCardProps {
  title: string;
  score: number;
  content: string;
  recommendations: Array<{ text: string; priority: 'high' | 'medium' | 'low' }>;
  icon: React.ReactNode;
}

function ScoreCard({ title, score, content, recommendations, icon }: ScoreCardProps) {
  const scoreColor = score >= 8 ? 'text-green-600' 
    : score >= 5 ? 'text-amber-600' 
    : 'text-red-600';

  const scoreBg = score >= 8 ? 'bg-green-50 dark:bg-green-950 border-green-200' 
    : score >= 5 ? 'bg-amber-50 dark:bg-amber-950 border-amber-200' 
    : 'bg-red-50 dark:bg-red-950 border-red-200';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scoreBg}`}>
            <span className={`font-semibold ${scoreColor}`}>{score}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{content}</p>
        
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium">Recommendations:</div>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec, i) => (
                <Badge 
                  key={i}
                  variant={
                    rec.priority === 'high' ? 'destructive' : 
                    rec.priority === 'medium' ? 'outline' : 
                    'secondary'
                  }
                  className="text-xs"
                >
                  {rec.text}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}