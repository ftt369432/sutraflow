import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Copy, Download, Lightbulb, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { GenieDriveItem, GenieDriveAIAnalysis } from '../../types/geniedrive';
import { genieDriveService } from '../../services/geniedrive/genieDriveService';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';

interface GenieDriveAIPopupProps {
  item: GenieDriveItem;
  isOpen: boolean;
  onClose: () => void;
}

export function GenieDriveAIPopup({ item, isOpen, onClose }: GenieDriveAIPopupProps) {
  const [analysis, setAnalysis] = useState<GenieDriveAIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      loadAnalysis();
    }
  }, [item, isOpen]);

  const loadAnalysis = async () => {
    if (item.type === 'folder') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if there's an existing analysis
      const analysis = await genieDriveService.getAIAnalysis(item.id);
      setAnalysis(analysis);
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setError('Failed to load AI analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewAnalysis = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const analysis = await genieDriveService.generateAIAnalysis(item.id);
      setAnalysis(analysis);
    } catch (err) {
      console.error('Failed to generate analysis:', err);
      setError('Failed to generate AI analysis');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Render sentiment badge
  const renderSentimentBadge = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Positive</Badge>;
      case 'negative':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Negative</Badge>;
      case 'neutral':
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Neutral</Badge>;
    }
  };

  // Render entity tag
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

  // Render summary tab
  const renderSummaryTab = () => {
    if (!analysis) return null;
    
    return (
      <div className="p-4 space-y-6">
        {analysis.summary && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">Summary</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => copyToClipboard(analysis.summary || '')}
              >
                {copySuccess ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-700">{analysis.summary}</p>
          </div>
        )}
        
        {analysis.keyPoints && analysis.keyPoints.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-2">Key Points</h3>
            <ul className="list-disc list-inside space-y-1">
              {analysis.keyPoints.map((point, index) => (
                <li key={index} className="text-sm text-gray-700">{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.sentiment && (
          <div>
            <h3 className="text-md font-medium mb-2">Sentiment</h3>
            <div>{renderSentimentBadge(analysis.sentiment)}</div>
          </div>
        )}
        
        {analysis.topics && analysis.topics.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-2">Topics</h3>
            <div className="flex flex-wrap">
              {analysis.topics.map((topic, index) => (
                <Badge key={index} className="mr-2 mb-2">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Generated: {formatDate(analysis.generatedAt)}
        </div>
      </div>
    );
  };

  // Render entities tab
  const renderEntitiesTab = () => {
    if (!analysis || !analysis.entities || analysis.entities.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No entities detected in this document
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <h3 className="text-md font-medium mb-3">Recognized Entities</h3>
        <div className="flex flex-wrap">
          {analysis.entities.map((entity, index) => renderEntityTag(entity, index))}
        </div>
      </div>
    );
  };

  // Render suggestions tab
  const renderSuggestionsTab = () => {
    if (!analysis || !analysis.suggestedActions || analysis.suggestedActions.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No suggestions available for this document
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <h3 className="text-md font-medium mb-3">Suggested Actions</h3>
        <ul className="space-y-3">
          {analysis.suggestedActions.map((suggestion, index) => (
            <li key={index} className="flex">
              <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mr-2" />
              <span className="text-sm">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render similar documents tab
  const renderSimilarTab = () => {
    if (!analysis || !analysis.similarDocuments || analysis.similarDocuments.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No similar documents found
        </div>
      );
    }
    
    // In a real implementation, we'd fetch the actual documents
    return (
      <div className="p-4">
        <h3 className="text-md font-medium mb-3">Similar Documents</h3>
        <p className="text-sm text-gray-500 mb-4">
          These documents appear to be related to the current file.
        </p>
        <div className="space-y-2">
          {analysis.similarDocuments.map((docId, index) => (
            <div key={index} className="border rounded p-2 text-sm">
              Similar Document {index + 1}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-t-lg border-b p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="font-medium text-lg">AI Analysis: {item.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateNewAnalysis}
              disabled={isGenerating}
              className="h-8"
            >
              {isGenerating ? (
                <Spinner className="h-4 w-4 mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* If it's a folder, we don't show analysis */}
        {item.type === 'folder' ? (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
            <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              AI analysis is not available for folders
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner className="h-8 w-8 mb-4" />
            <p>Loading analysis...</p>
          </div>
        ) : error && !analysis ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <AlertTriangle className="h-12 w-12 text-red-300 mb-4" />
            <p className="text-red-500 text-center mb-4">{error}</p>
            <Button onClick={loadAnalysis}>Try Again</Button>
          </div>
        ) : !analysis ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Sparkles className="h-12 w-12 text-blue-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">AI Analysis</h3>
            <p className="text-center text-gray-500 mb-6">
              Generate an AI analysis of this file to get insights and recommendations.
            </p>
            <Button 
              onClick={generateNewAnalysis} 
              disabled={isGenerating}
              className="flex items-center"
            >
              {isGenerating ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Analysis
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Analysis content */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="bg-white px-6 border-b">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="entities">Entities</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="similar">Similar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="flex-1 overflow-auto">
              {renderSummaryTab()}
            </TabsContent>
            
            <TabsContent value="entities" className="flex-1 overflow-auto">
              {renderEntitiesTab()}
            </TabsContent>
            
            <TabsContent value="suggestions" className="flex-1 overflow-auto">
              {renderSuggestionsTab()}
            </TabsContent>
            
            <TabsContent value="similar" className="flex-1 overflow-auto">
              {renderSimilarTab()}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
} 