import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { SwarmPanel } from '@/components/swarm/SwarmPanel';
import { KnowledgeBasePanel } from '../ai/KnowledgeBasePanel';
import { KnowledgeBaseChat } from '../knowledge/KnowledgeBaseChat';
import { AdvancedTrainingPanel } from '../knowledge/AdvancedTrainingPanel';
import { KnowledgeAnalyticsPanel } from '../knowledge/KnowledgeAnalyticsPanel';
import { KnowledgeSourcesPanel } from '../knowledge/KnowledgeSourcesPanel';
import { AutonomousLearningPanel } from '../knowledge/AutonomousLearningPanel';
import { LearningAnalytics } from '../learning/LearningAnalytics';
import { DemoOodarStream, LiveOodarStream } from '../agents/OodarThoughtStream';
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import type { AIAssistant } from '../../types/ai';

interface RightSidePanelProps {
  isAutoHideEnabled: boolean;
  onToggleAutoHide: (enabled: boolean) => void;
  relevantDocuments?: any[];
  onDocumentClick?: (documentId: string) => void;
  selectedAssistant?: AIAssistant | null;
  onSaveKnowledge?: (content: string, metadata: any) => void;
  conversationContext?: {
    uploadedFiles: Array<{
      name: string;
      content: string;
      type: string;
      uploadedAt: Date;
    }>;
    analysisResults: Array<{
      fileId: string;
      analysis: string;
      timestamp: Date;
    }>;
  };
  chatMessages?: any[];
  // 🧠 Learning Analytics Props
  userId?: string;
  learningProgress?: {
    documentsProcessed: number;
    interactionsLearned: number;
    preferencesAdapted: number;
    lastUpdate: Date;
  };
  adaptiveLearningEnabled?: boolean;
  onToggleAdaptiveLearning?: (enabled: boolean) => void;
}

export function RightSidePanel({ 
  isAutoHideEnabled,
  onToggleAutoHide,
  relevantDocuments = [],
  onDocumentClick,
  selectedAssistant,
  onSaveKnowledge,
  conversationContext,
  chatMessages = [],
  // 🧠 Learning Analytics Props
  userId,
  learningProgress,
  adaptiveLearningEnabled = true,
  onToggleAdaptiveLearning
}: RightSidePanelProps) {
  return (
    <div className="h-full flex flex-col border-l border-border/50 bg-muted/30">
      {/* Auto-Hide Toggle */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <Label htmlFor="right-auto-hide-switch" className="text-xs text-muted-foreground">Auto-hide Panel</Label>
        <Switch
          id="right-auto-hide-switch"
          checked={isAutoHideEnabled}
          onCheckedChange={onToggleAutoHide}
          className="[&>span]:h-3 [&>span]:w-3 data-[state=checked]:bg-primary"
        />
      </div>

      <Tabs defaultValue="knowledge" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start mb-4 mx-4 grid grid-cols-4 gap-1">
          <TabsTrigger value="knowledge" className="text-xs">Sources</TabsTrigger>
          <TabsTrigger value="training" className="text-xs">Training</TabsTrigger>
          <TabsTrigger value="learning" className="text-xs">Learning</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="thoughts" className="text-xs">O.O.D.A.R.</TabsTrigger>
        </TabsList>
        
        {/* Enhanced Knowledge Sources Panel */}
        <TabsContent value="knowledge" className="flex-1 overflow-y-auto">
          <Tabs defaultValue="sources" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start mb-2 mx-4">
              <TabsTrigger value="sources" className="text-xs">Sources</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs">KB Chat</TabsTrigger>
              <TabsTrigger value="manage" className="text-xs">Manage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sources" className="flex-1 overflow-y-auto">
              <KnowledgeBasePanel 
                relevantDocuments={relevantDocuments}
                onDocumentClick={onDocumentClick}
              />
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col">
              <KnowledgeBaseChat 
                selectedAssistant={selectedAssistant}
                onSaveKnowledge={onSaveKnowledge}
                className="flex-1"
              />
            </TabsContent>

            <TabsContent value="manage" className="flex-1 overflow-y-auto">
              <KnowledgeSourcesPanel 
                selectedAssistant={selectedAssistant}
                conversationContext={conversationContext}
                onDocumentClick={onDocumentClick}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Advanced Training Panel */}
        <TabsContent value="training" className="flex-1 overflow-y-auto">
          <AdvancedTrainingPanel 
            selectedAssistant={selectedAssistant}
            conversationContext={conversationContext}
            chatMessages={chatMessages}
            onSaveKnowledge={onSaveKnowledge}
          />
        </TabsContent>

        {/* Enhanced Adaptive Learning Panel */}
        <TabsContent value="learning" className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
            {/* Adaptive Learning Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="adaptive-learning-switch" className="text-sm font-medium">
                🧠 Adaptive Learning
              </Label>
              <Switch
                id="adaptive-learning-switch"
                checked={adaptiveLearningEnabled}
                onCheckedChange={onToggleAdaptiveLearning}
                className="[&>span]:h-3 [&>span]:w-3 data-[state=checked]:bg-primary"
              />
            </div>
            
            {adaptiveLearningEnabled && userId && learningProgress ? (
              <LearningAnalytics
                userId={userId}
                learningProgress={learningProgress}
                onExportData={() => console.log('🧠 Learning data exported')}
                onRefreshData={() => console.log('🧠 Learning data refreshed')}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm">
                  {!adaptiveLearningEnabled 
                    ? "Enable adaptive learning to view analytics" 
                    : "Learning data will appear here as you interact"
                  }
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Knowledge Analytics Panel */}
        <TabsContent value="analytics" className="flex-1 overflow-y-auto">
          <Tabs defaultValue="insights" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start mb-2 mx-4">
              <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              <TabsTrigger value="swarm" className="text-xs">Swarm</TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights" className="flex-1 overflow-y-auto">
              <KnowledgeAnalyticsPanel 
                selectedAssistant={selectedAssistant}
                conversationContext={conversationContext}
                chatMessages={chatMessages}
                relevantDocuments={relevantDocuments}
              />
            </TabsContent>

            <TabsContent value="swarm" className="flex-1 overflow-y-auto p-4">
              <SwarmPanel />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Agent Thought Stream (O.O.D.A.R) */}
        <TabsContent value="thoughts" className="flex-1 overflow-y-auto">
          {selectedAssistant ? (
            <LiveOodarStream agentId={selectedAssistant.id} />
          ) : (
            <DemoOodarStream />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}