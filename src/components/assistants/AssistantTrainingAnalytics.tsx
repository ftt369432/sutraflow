import React, { useEffect, useState } from 'react';
import { 
  Book, Brain, MessageSquare, Sparkles, 
  TrendingUp, BarChart2, Calendar 
} from 'lucide-react';
import { TrainingAnalytics } from '@/services/trainingAnalyticsService';
import { AIAssistant } from '@/types/ai';
import { Card } from '@/components/ui/Card';

interface AssistantTrainingAnalyticsProps {
  assistant: AIAssistant;
  analytics: TrainingAnalytics;
}

export function AssistantTrainingAnalytics({ assistant, analytics }: AssistantTrainingAnalyticsProps) {
  const stats = [
    {
      name: 'Total Entries',
      value: analytics.total_entries,
      icon: BarChart2,
      description: 'Total number of training entries',
    },
    {
      name: 'Examples',
      value: analytics.conversation_examples,
      icon: MessageSquare,
      description: 'Conversation example entries',
    },
    {
      name: 'Knowledge',
      value: analytics.knowledge_facts,
      icon: Book,
      description: 'Knowledge fact entries',
    },
    {
      name: 'Behavior',
      value: analytics.behavioral_prompts,
      icon: Brain,
      description: 'Behavioral prompt entries',
    },
    {
      name: 'Capabilities',
      value: analytics.capability_demos,
      icon: Sparkles,
      description: 'Capability demonstration entries',
    },
    {
      name: 'Effectiveness',
      value: `${(analytics.avg_effectiveness * 100).toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Average effectiveness score',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Training Analytics</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Overview of training data and effectiveness metrics for {assistant.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-4">
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-primary/10 mr-3">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last entry added: {new Date(analytics.last_entry_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <TrendingUp className="h-4 w-4" />
          <span>Total uses: {analytics.total_uses}</span>
        </div>
      </div>
    </div>
  );
}
