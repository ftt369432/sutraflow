import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Sparkles, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Zap, 
  BookOpen, 
  Target,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Enhancement {
  id: string;
  type: 'grammar' | 'style' | 'structure' | 'clarity' | 'suggestion';
  title: string;
  description: string;
  confidence: number;
  action: () => void;
  preview?: string;
}

interface CanvasEnhancementPanelProps {
  isVisible: boolean;
  onClose: () => void;
  documentContent: string;
  onApplyEnhancement: (enhancement: Enhancement) => void;
  position: { x: number; y: number };
}

const CanvasEnhancementPanel: React.FC<CanvasEnhancementPanelProps> = ({
  isVisible,
  onClose,
  documentContent,
  onApplyEnhancement,
  position
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['suggestions']));

  // Mock AI analysis - in real implementation, this would call AI service
  const [enhancements, setEnhancements] = useState<Enhancement[]>([
    {
      id: '1',
      type: 'grammar',
      title: 'Grammar Correction',
      description: 'Fix subject-verb agreement in paragraph 2',
      confidence: 0.95,
      action: () => console.log('Apply grammar fix'),
      preview: 'Change "data shows" to "data show"'
    },
    {
      id: '2',
      type: 'style',
      title: 'Style Improvement',
      description: 'Simplify complex sentence structure',
      confidence: 0.87,
      action: () => console.log('Apply style fix'),
      preview: 'Break long sentence into two shorter ones'
    },
    {
      id: '3',
      type: 'structure',
      title: 'Document Structure',
      description: 'Add transitional phrases between sections',
      confidence: 0.82,
      action: () => console.log('Apply structure improvement'),
      preview: 'Insert "Furthermore," at beginning of paragraph 3'
    }
  ]);

  const analyzeDocument = useCallback(async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      // In real implementation, this would call your AI service
      const newEnhancements: Enhancement[] = [
        {
          id: `${Date.now()}-1`,
          type: 'clarity',
          title: 'Improve Clarity',
          description: 'Replace technical jargon with clearer terms',
          confidence: 0.91,
          action: () => console.log('Apply clarity improvement'),
          preview: 'Replace "utilize" with "use" in 3 instances'
        },
        {
          id: `${Date.now()}-2`,
          type: 'suggestion',
          title: 'Content Suggestion',
          description: 'Add supporting evidence for main claim',
          confidence: 0.78,
          action: () => console.log('Apply content suggestion'),
          preview: 'Insert citation or example after claim'
        }
      ];
      
      setEnhancements(prev => [...prev, ...newEnhancements]);
      setIsAnalyzing(false);
    }, 2000);
  }, [documentContent]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getEnhancementIcon = (type: Enhancement['type']) => {
    switch (type) {
      case 'grammar': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'style': return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'structure': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'clarity': return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case 'suggestion': return <Target className="w-4 h-4 text-orange-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredEnhancements = activeCategory === 'all' 
    ? enhancements 
    : enhancements.filter(e => e.type === activeCategory);

  if (!isVisible) return null;

  const panelStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -100%)'
  };

  return (
    <div 
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-96 overflow-hidden z-40"
      style={panelStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Enhancements</h3>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {enhancements.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex space-x-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeDocument}
            disabled={isAnalyzing}
            className="flex items-center space-x-1 hover:bg-purple-50"
          >
            <Zap className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log('Format document')}
            className="flex items-center space-x-1 hover:bg-blue-50"
          >
            <BookOpen className="w-4 h-4" />
            <span>Format</span>
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1">
          {['all', 'grammar', 'style', 'structure', 'clarity', 'suggestion'].map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`text-xs capitalize ${
                activeCategory === category 
                  ? 'bg-purple-600 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Enhancements List */}
      <div className="max-h-64 overflow-y-auto">
        {/* Suggestions Section */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('suggestions')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">Suggestions</span>
              <Badge variant="secondary" className="bg-gray-100">
                {filteredEnhancements.length}
              </Badge>
            </div>
            {expandedSections.has('suggestions') ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.has('suggestions') && (
            <div className="pb-2">
              {filteredEnhancements.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No enhancements found</p>
                  <p className="text-sm">Try analyzing your document</p>
                </div>
              ) : (
                filteredEnhancements.map(enhancement => (
                  <div key={enhancement.id} className="px-4 py-2 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      {getEnhancementIcon(enhancement.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {enhancement.title}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getConfidenceColor(enhancement.confidence)}`}
                          >
                            {Math.round(enhancement.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {enhancement.description}
                        </p>
                        {enhancement.preview && (
                          <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-2">
                            {enhancement.preview}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onApplyEnhancement(enhancement)}
                          className="text-xs hover:bg-purple-50"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasEnhancementPanel;