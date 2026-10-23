import React from 'react';
import { TrendingUp, Users, Clock, Star, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { DocumentTemplate } from '../../services/canvas/TemplateService';

interface TemplateLearningInsightsProps {
  template: DocumentTemplate;
}

export function TemplateLearningInsights({ template }: TemplateLearningInsightsProps) {
  const { learningData, usageCount, averageRating } = template;
  
  const getImprovementScore = () => {
    const baseScore = 60;
    const usageBonus = Math.min(usageCount * 2, 30);
    const ratingBonus = averageRating * 2;
    const improvementBonus = learningData.suggestedImprovements.length > 0 ? 10 : 0;
    
    return Math.min(baseScore + usageBonus + ratingBonus + improvementBonus, 100);
  };

  const getUsageGrowth = () => {
    // Simulate growth based on patterns
    const userPatterns = learningData.userPatterns.length;
    return userPatterns > 0 ? Math.min(userPatterns * 15, 100) : 0;
  };

  const commonModifications = learningData.commonModifications
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Template Learning Progress
          </CardTitle>
          <CardDescription>
            How this template is improving through usage and feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Improvement Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Improvement Score</span>
              <span className="text-sm text-gray-600">{getImprovementScore()}%</span>
            </div>
            <Progress value={getImprovementScore()} className="h-2" />
          </div>

          {/* Usage Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{usageCount}</div>
              <div className="text-xs text-blue-600">Total Uses</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-yellow-600">Avg Rating</div>
            </div>
          </div>

          {/* Usage Growth */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">User Adoption</span>
              <span className="text-sm text-gray-600">{getUsageGrowth()}%</span>
            </div>
            <Progress value={getUsageGrowth()} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {learningData.userPatterns.length} different users have customized this template
            </p>
          </div>

          {/* Performance Metrics */}
          {learningData.successMetrics.timeToComplete > 0 && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Clock className="h-3 w-3" />
                  Avg Completion Time
                </div>
                <div className="font-medium">
                  {Math.round(learningData.successMetrics.timeToComplete)} min
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Success Rate
                </div>
                <div className="font-medium">
                  {Math.round(learningData.successMetrics.completionRate * 100)}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Modifications */}
      {commonModifications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-orange-600" />
              Learning Insights
            </CardTitle>
            <CardDescription>
              Common patterns from user modifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commonModifications.map((mod, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    {mod.frequency}x
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{mod.section}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      "{mod.modification}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Suggestions */}
      {learningData.suggestedImprovements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              AI Suggestions
            </CardTitle>
            <CardDescription>
              Automated improvements based on usage patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {learningData.suggestedImprovements.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">How This Template Learns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>Usage Tracking:</strong> Every time you use this template, 
                the system learns your preferences and completion patterns.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>Modification Learning:</strong> Changes you make to generated 
                content help improve the template for future use.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <strong>Auto-Improvement:</strong> The AI suggests template updates 
                based on common user patterns and feedback.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <strong>Personalization:</strong> Templates adapt to your specific 
                writing style and legal practice areas over time.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
