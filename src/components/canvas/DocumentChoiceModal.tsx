import React, { useState, useCallback } from 'react';
import { X, FileText, Copy, Sparkles, ArrowRight, Plus, Lightbulb } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface DocumentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoice: (choice: 'single' | 'multiple') => void;
  userRequest?: string;
  suggestedDocuments?: Array<{
    title: string;
    type: string;
    description: string;
  }>;
}

export function DocumentChoiceModal({
  isOpen,
  onClose,
  onChoice,
  userRequest = "Create documents",
  suggestedDocuments = []
}: DocumentChoiceModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<'single' | 'multiple' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleChoice = useCallback(async (choice: 'single' | 'multiple') => {
    setSelectedChoice(choice);
    setIsAnimating(true);
    
    // Beautiful animation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onChoice(choice);
    setIsAnimating(false);
    setSelectedChoice(null);
  }, [onChoice]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Smart Document Creation
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  How would you like me to approach this?
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* User Request Display */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-l-4 border-blue-500">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Your Request</span>
            </div>
            <p className="text-gray-900 dark:text-white font-medium">
              "{userRequest}"
            </p>
          </div>
        </div>

        {/* Choice Options */}
        <div className="p-8 space-y-6">
          {/* Single Document Option */}
          <Card className={`relative p-6 cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
            selectedChoice === 'single' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`} onClick={() => handleChoice('single')}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Single Document
                    </h3>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300">
                      Focused & Precise
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create one comprehensive document that addresses your complete request. 
                  Perfect for cohesive, focused content that flows naturally.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Faster Creation
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Unified Content
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Easy to Review
                  </Badge>
                </div>
              </div>
              <ArrowRight className={`h-5 w-5 text-gray-400 transition-all duration-300 ${
                selectedChoice === 'single' ? 'text-blue-500 translate-x-1' : ''
              }`} />
            </div>
          </Card>

          {/* Multiple Documents Option */}
          <Card className={`relative p-6 cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
            selectedChoice === 'multiple' 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
          }`} onClick={() => handleChoice('multiple')}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Copy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Multiple Documents
                    </h3>
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300">
                      Comprehensive & Organized
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Break down your request into multiple specialized documents. 
                  Ideal for complex projects that benefit from separate, focused pieces.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Organized Structure
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Specialized Content
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Professional Workflow
                  </Badge>
                </div>
                
                {/* Suggested Documents Preview */}
                {suggestedDocuments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Suggested documents:
                    </p>
                    <div className="space-y-1">
                      {suggestedDocuments.slice(0, 3).map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Plus className="h-3 w-3 text-purple-500" />
                          <span className="text-gray-600 dark:text-gray-400">{doc.title}</span>
                        </div>
                      ))}
                      {suggestedDocuments.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{suggestedDocuments.length - 3} more documents...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <ArrowRight className={`h-5 w-5 text-gray-400 transition-all duration-300 ${
                selectedChoice === 'multiple' ? 'text-purple-500 translate-x-1' : ''
              }`} />
            </div>
          </Card>
        </div>

        {/* Loading State */}
        {isAnimating && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedChoice === 'single' ? 'Creating single document...' : 'Analyzing for multiple documents...'}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              💡 You can always create additional documents later
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Choose what works best for your workflow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentChoiceModal;