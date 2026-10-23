import React from 'react';
import { Brain, MessageSquare, Tag, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import type { DocumentWithAnalytics } from '../../types/documents';

interface AIInsightsProps {
  document: DocumentWithAnalytics;
}

export function AIInsights({ document }: AIInsightsProps) {
  return (
    <div className="space-y-6">
      {/* Key Points */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Key Points
        </h3>
        <div className="space-y-2">
          {document.insights.keyPoints.map((point, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start gap-2">
                <span className="text-sm text-muted-foreground">{index + 1}.</span>
                <span className="text-sm">{point}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {document.insights.topics.map((topic, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Entities */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Key Entities
        </h3>
        <div className="flex flex-wrap gap-2">
          {document.insights.entities.map((entity, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded-full bg-secondary/10 text-secondary"
            >
              {entity}
            </span>
          ))}
        </div>
      </div>

      {/* Analytics */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Analytics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Reading Time</div>
            <div className="text-lg font-medium">
              {document.insights.readingTime} min
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Sentiment</div>
            <div className="text-lg font-medium">
              {document.insights.sentiment}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}