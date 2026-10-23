import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Copy, Lightbulb, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { AIDriveFile, FileInsight } from '../../services/drive/aiDriveService'; // Corrected import path
import type { AIDriveService } from '../../services/drive/aiDriveService';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';

interface GenieDriveAIPanelProps {
  item: AIDriveFile | null;
  aiDriveService: AIDriveService;
  onAnalysisUpdate?: (fileId: string) => void; 
}

export function GenieDriveAIPanel({ item, aiDriveService, onAnalysisUpdate }: GenieDriveAIPanelProps) {
  const [detailedInsights, setDetailedInsights] = useState<FileInsight[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const getInsight = useCallback((insightType: FileInsight['type']): FileInsight | undefined => {
    if (!detailedInsights) return undefined;
    return detailedInsights.find(insight => insight.type === insightType);
  }, [detailedInsights]);

  const loadAnalysis = useCallback(async (showLoadingSpinner = true) => {
    if (!item || item.is_folder || !item.id) {
      setDetailedInsights(null);
      setError(null);
      return;
    }
    
    if (showLoadingSpinner) setIsLoading(true);
    setError(null);
    try {
      const insights = await aiDriveService.getFileInsights(item.id);
      setDetailedInsights(insights || []);
    } catch (err: any) {
      console.error('Failed to load analysis:', err);
      setError(err.message || 'Failed to load AI analysis. Some insights might be missing.');
      setDetailedInsights(prev => prev || []); 
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  }, [item, aiDriveService]);

  useEffect(() => {
    if (item && !item.is_folder && item.id) {
      loadAnalysis();
    } else {
      setDetailedInsights(null);
      setError(null);
      setIsLoading(false);
      setIsGenerating(false);
    }
  }, [item, loadAnalysis]);

  const generateNewAnalysis = async () => {
    if (!item || !item.id || item.is_folder) return;

    try {
      setIsGenerating(true);
      setError(null);
      
      // Regenerate summary and topics (these update the main AIDriveFile record)
      await aiDriveService.generateFileSummary(item.id, { includeKeyPoints: false, includeTopic: true }); 
      // The above might also generate topics if AIService is set up that way, or processFileWithAI logic is hit.
      // For now, we assume generateFileSummary primarily updates ai_summary.
      // To ensure topics are also fresh, we might need a dedicated topics generation or rely on initial processing.

      // Generate other detailed insights
      await aiDriveService.generateFileInsights(item.id, ['key_points', 'sentiment', 'entities', 'questions']);
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate(item.id);
      }
      await loadAnalysis(false); // Reload detailed insights without full page loading spinner
    } catch (err: any) {
      console.error('Failed to generate analysis:', err);
      setError(err.message || 'Failed to generate new AI analysis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const renderSentimentBadge = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Positive</Badge>;
      case 'negative':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Negative</Badge>;
      case 'neutral':
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Neutral</Badge>;
    }
  };

  const renderEntityTag = (entity: string, index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800'
    ];
    const colorClass = colors[index % colors.length];
    return (
      <Badge key={index} className={`${colorClass} hover:bg-opacity-80 mr-2 mb-2`}>
        {entity}
      </Badge>
    );
  };

  const renderSummaryTab = () => {
    if (!item) return null;

    const keyPointsInsight = getInsight('key_points');
    const keyPoints: string[] = Array.isArray(keyPointsInsight?.content) ? keyPointsInsight.content as string[] : [];
    
    const sentimentInsight = getInsight('sentiment');
    let sentimentValue = 'neutral';
    if (sentimentInsight && sentimentInsight.content && typeof (sentimentInsight.content as any).value === 'string') {
        sentimentValue = (sentimentInsight.content as any).value;
    }

    const analysisDate = item.ai_summary 
      ? (getInsight('summary')?.created_at || item.updated_at) 
      : (detailedInsights?.[0]?.created_at || item.updated_at);

    return (
      <div className="p-4 space-y-6">
        {item.ai_summary && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">Summary</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => copyToClipboard(item.ai_summary || '')}
              >
                {copySuccess ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.ai_summary}</p>
          </div>
        )}
        
        {keyPoints.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-2">Key Points</h3>
            <ul className="list-disc list-inside space-y-1">
              {keyPoints.map((point, index) => (
                <li key={index} className="text-sm text-gray-700">{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {sentimentInsight && (
          <div>
            <h3 className="text-md font-medium mb-2">Sentiment</h3>
            <div>{renderSentimentBadge(sentimentValue)}</div>
          </div>
        )}
        
        {item.ai_topics && item.ai_topics.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-2">Topics</h3>
            <div className="flex flex-wrap">
              {item.ai_topics.map((topic: string, index: number) => (
                <Badge key={index} className="mr-2 mb-2">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {(item.ai_summary || keyPoints.length > 0 || sentimentInsight || (item.ai_topics && item.ai_topics.length > 0)) && (
          <div className="text-xs text-gray-500 flex items-center pt-2 border-t mt-2">
            <Clock className="h-3 w-3 mr-1" />
            Analysis updated: {formatDate(analysisDate)}
          </div>
        )}
      </div>
    );
  };

  const renderEntitiesTab = () => {
    const entitiesInsight = getInsight('entities');
    const entities: string[] = Array.isArray(entitiesInsight?.content) ? entitiesInsight.content as string[] : [];

    if (entities.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No entities detected or analysis not available.
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <h3 className="text-md font-medium mb-3">Recognized Entities</h3>
        <div className="flex flex-wrap">
          {entities.map((entity, index) => renderEntityTag(entity, index))}
        </div>
      </div>
    );
  };

  const renderSuggestionsTab = () => {
    const questionsInsight = getInsight('questions'); 
    const suggestions: string[] = Array.isArray(questionsInsight?.content) ? questionsInsight.content as string[] : [];

    if (suggestions.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No suggested questions available or analysis not available.
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <h3 className="text-md font-medium mb-3">Suggested Questions</h3>
        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mr-2 mt-0.5" />
              <span className="text-sm">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-4 rounded-lg shadow">
        <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">Select a file to see AI insights.</p>
      </div>
    );
  }

  if (item.is_folder) { 
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-4 rounded-lg shadow">
        <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">
          AI analysis is not available for folders.
        </p>
      </div>
    );
  }

  if (isLoading && !item.ai_summary && (!detailedInsights || detailedInsights.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner className="h-8 w-8 mb-4" />
        <p>Loading AI analysis...</p>
      </div>
    );
  }
  
  const noAnalysisData = !item.ai_summary && (!detailedInsights || detailedInsights.length === 0);
  const canGenerate = item && !item.is_folder && item.id;

  if (noAnalysisData && !isLoading && !isGenerating && canGenerate) {
     return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-lg shadow">
        <Sparkles className="h-12 w-12 text-blue-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">AI Analysis</h3>
        <p className="text-center text-gray-500 mb-6 max-w-sm">
          {error ? error : "Unlock deeper understanding. Generate an AI analysis for this file to get summaries, key points, and more."}
        </p>
        <Button 
          onClick={generateNewAnalysis} 
          disabled={isGenerating}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isGenerating ? (
            <><Spinner className="h-4 w-4 mr-2" />Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />Generate Insights</>
          )}
        </Button>
        {error && <Button onClick={() => loadAnalysis()} variant="link" className="mt-2 text-blue-500">Try reloading existing</Button>}
      </div>
    );
  }

  const hasEntityInsights = !!getInsight('entities');
  const hasSuggestionInsights = !!getInsight('questions');

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
            AI Insights
          </h2>
          {canGenerate && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateNewAnalysis} 
              disabled={isGenerating || (isLoading && noAnalysisData)}
              title="Refresh or generate new analysis"
              className="text-xs"
            >
              {isGenerating ? <Spinner className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
              <span className="ml-1.5">{isGenerating ? 'Generating' : 'Refresh'}</span>
            </Button>
          )}
        </div>
        {error && !noAnalysisData && <p className="text-xs text-red-600 px-3 py-1 bg-red-50 border-b">Error: {error}</p>}
        {(isLoading && (item.ai_summary || (detailedInsights && detailedInsights.length > 0)) && !isGenerating) && 
            <p className="text-xs text-gray-500 px-3 py-1 bg-slate-50 border-b flex items-center"><Spinner className="h-3 w-3 mr-1.5" /> Refreshing insights...</p>
        }
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col min-h-0">
        <TabsList className="mx-3 mt-2 shrink-0">
          <TabsTrigger value="summary" className="text-xs px-2 py-1.5">Summary & Topics</TabsTrigger>
          <TabsTrigger value="entities" className="text-xs px-2 py-1.5" disabled={!hasEntityInsights && !isLoading}>Entities</TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs px-2 py-1.5" disabled={!hasSuggestionInsights && !isLoading}>Questions</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="flex-grow overflow-y-auto focus:outline-none p-1">
          {renderSummaryTab()}
        </TabsContent>
        <TabsContent value="entities" className="flex-grow overflow-y-auto focus:outline-none p-1">
          {renderEntitiesTab()}
        </TabsContent>
        <TabsContent value="suggestions" className="flex-grow overflow-y-auto focus:outline-none p-1">
          {renderSuggestionsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}