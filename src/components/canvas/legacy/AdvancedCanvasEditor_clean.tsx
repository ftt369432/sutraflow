/**
 * 🎨 Advanced Canvas Editor - Google Docs Style Interface
 * 
 * Integrates all advanced canvas functions:
 * - DocumentEditorLayout (Google Docs interface)
 * - MultiCanvasGrid (parallel editing)
 * - IntelligentCanvas (AI features)
 * - AI Drive integration
 * - Multi-task orchestration
 */

import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DocumentEditorLayout from './DocumentEditorLayout';
import { MultiCanvasGrid } from './MultiCanvasGrid';
import { IntelligentCanvas } from './IntelligentCanvas';
import { CanvasAIDriveIntegration } from './CanvasAIDriveIntegration';
import EnhancedTabSystem from './EnhancedTabSystem';
import { 
  FileText, Grid, Brain, HardDrive, Maximize2, Minimize2, 
  MoreHorizontal, Settings, Download, Share
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

export interface AdvancedCanvasDocument {
  id: string;
  title: string;
  content: string;
  contentType: 'document' | 'legal' | 'business' | 'creative' | 'medical';
  isActive: boolean;
  lastModified: Date;
  metadata?: {
    wordCount?: number;
    assistant?: string;
    aiGenerated?: boolean;
    taskType?: string;
    version?: number;
  };
}

interface AdvancedCanvasEditorProps {
  documents: AdvancedCanvasDocument[];
  activeDocumentId: string | null;
  onDocumentChange: (documentId: string, content: string) => void;
  onDocumentTitleChange: (documentId: string, title: string) => void;
  onDocumentCreate: (template?: string) => void;
  onDocumentClose: (documentId: string) => void;
  onDocumentSwitch: (documentId: string) => void;
  
  // AI Integration
  selectedAssistant?: any;
  neuralSettings?: any;
  
  // Features Toggle
  enableAIDrive?: boolean;
  enableMultiCanvas?: boolean;
  enableIntelligentFeatures?: boolean;
  enableGridView?: boolean;
  
  className?: string;
}

export function AdvancedCanvasEditor({
  documents,
  activeDocumentId,
  onDocumentChange,
  onDocumentTitleChange,
  onDocumentCreate,
  onDocumentClose,
  onDocumentSwitch,
  selectedAssistant,
  neuralSettings,
  enableAIDrive = true,
  enableMultiCanvas = true,
  enableIntelligentFeatures = true,
  enableGridView = true,
  className = ''
}: AdvancedCanvasEditorProps) {
  
  // ⚡ ALL HOOKS MUST BE AT THE TOP - Before any conditional logic or early returns
  // Editor View State
  const [viewMode, setViewMode] = useState<'single' | 'grid' | 'intelligent'>('single');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState<'aidrive' | 'history' | 'ai' | null>('aidrive');
  
  // Get active document with enhanced debugging
  const activeDocument = documents.find(doc => doc.id === activeDocumentId);
  
  // 🚨 EMERGENCY AUTO-FIX: If we have documents but no active document, auto-select the first one
  useEffect(() => {
    if (documents.length > 0 && !activeDocument && !activeDocumentId) {
      console.log('🚨 AUTO-FIX: Documents exist but no active document - auto-selecting first document');
      const firstDoc = documents[0];
      onDocumentSwitch(firstDoc.id);
    }
  }, [documents, activeDocument, activeDocumentId, onDocumentSwitch]);

  // Handle content changes with auto-save
  const handleContentChange = useCallback((content: string) => {
    if (activeDocumentId) {
      onDocumentChange(activeDocumentId, content);
    }
  }, [activeDocumentId, onDocumentChange]);

  // Handle title changes
  const handleTitleChange = useCallback((title: string) => {
    if (activeDocumentId) {
      onDocumentTitleChange(activeDocumentId, title);
    }
  }, [activeDocumentId, onDocumentTitleChange]);
  
  // 🔍 ENHANCED DEBUGGING: Always log current state
  console.log('🔍 AdvancedCanvasEditor State:', {
    documentsCount: documents.length,
    activeDocumentId,
    hasActiveDocument: !!activeDocument,
    documentTitles: documents.map(d => d.title),
    documentIds: documents.map(d => d.id)
  });
  
  // Canvas Stats
  const stats = {
    totalDocuments: documents.length,
    totalWords: documents.reduce((sum, doc) => sum + (doc.content?.split(' ').length || 0), 0),
    aiGenerated: documents.filter(doc => doc.metadata?.aiGenerated).length
  };

  // Right Panel Content Generator
  const getRightPanelContent = () => {
    if (!rightPanelContent) return null;

    switch (rightPanelContent) {
      case 'aidrive':
        return enableAIDrive && activeDocument ? (
          <div className="space-y-4">
            <CanvasAIDriveIntegration 
              canvasId={activeDocument.id}
              canvasContent={activeDocument.content}
              canvasTitle={activeDocument.title}
            />
          </div>
        ) : null;

      case 'ai':
        return enableIntelligentFeatures ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-600">AI features coming soon</p>
            </div>
            
            {selectedAssistant && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Active Assistant</h4>
                <p className="text-sm">{selectedAssistant.name}</p>
              </div>
            )}
          </div>
        ) : null;

      case 'history':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Document History</h3>
              <p className="text-sm text-gray-600">Version history coming soon</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render different view modes
  const renderContent = () => {
    switch (viewMode) {
      case 'grid':
        return enableGridView && enableMultiCanvas ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Grid className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Grid View</p>
              <p className="text-sm mb-4">Multi-canvas grid view coming soon</p>
              <p className="text-xs text-gray-400">
                Currently displaying {documents.length} documents
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Grid view is disabled or not supported
          </div>
        );

      case 'intelligent':
        return enableIntelligentFeatures ? (
          <IntelligentCanvas className="h-full" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Intelligent features are disabled
          </div>
        );

      case 'single':
      default:
        // Enhanced: Show documents list if no active document but documents exist
        if (!activeDocument && documents.length > 0) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <FileText className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <p className="text-lg font-medium mb-2">🚨 Documents Created But Not Selected</p>
                <p className="text-sm text-gray-500 mb-4">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} available but not displaying
                </p>
                
                {/* Emergency Access Buttons */}
                <div className="space-y-2 mb-4">
                  <Button
                    size="lg"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => onDocumentSwitch(documents[0].id)}
                  >
                    🎯 Open First Document: "{documents[0].title}"
                  </Button>
                  
                  {documents.slice(0, 3).map((doc) => (
                    <Button
                      key={doc.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => onDocumentSwitch(doc.id)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {doc.title}
                    </Button>
                  ))}
                  {documents.length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{documents.length - 3} more documents (use tabs above)
                    </p>
                  )}
                </div>
                
                <Button onClick={() => onDocumentCreate()}>
                  <FileText className="w-4 h-4 mr-2" />
                  Create New Document
                </Button>
              </div>
            </div>
          );
        }
        
        return activeDocument ? (
          <DocumentEditorLayout
            documentTitle={activeDocument.title}
            onTitleChange={handleTitleChange}
            documentContent={activeDocument.content}
            onContentChange={handleContentChange}
            documentType={activeDocument.contentType}
            lastModified={activeDocument.lastModified}
            rightPanelContent={getRightPanelContent()}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No document selected</p>
              <p className="text-sm mb-4">Create a new document to get started</p>
              <Button onClick={() => onDocumentCreate()}>
                <FileText className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`h-full flex flex-col bg-gray-50 ${className}`}>
      {/* Advanced Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Document Info & Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Advanced Canvas Editor</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{stats.totalDocuments} docs</span>
              <span>{stats.totalWords} words</span>
              {stats.aiGenerated > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  {stats.aiGenerated} AI
                </Badge>
              )}
            </div>
          </div>

          {/* Right: View Controls */}
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Single
                </TabsTrigger>
                {enableGridView && (
                  <TabsTrigger value="grid" className="text-xs">
                    <Grid className="w-3 h-3 mr-1" />
                    Grid
                  </TabsTrigger>
                )}
                {enableIntelligentFeatures && (
                  <TabsTrigger value="intelligent" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" />
                    AI
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>

            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document Tabs - Only in single view */}
      {viewMode === 'single' && documents.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          {/* Emergency Debug: Show document count and force selection */}
          <div className="px-4 py-1 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <span className="text-xs text-blue-700">
              📄 {documents.length} document{documents.length !== 1 ? 's' : ''} available
              {!activeDocumentId && ' - No active document selected'}
            </span>
            {!activeDocumentId && documents.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDocumentSwitch(documents[0].id)}
                className="text-xs h-6"
              >
                📂 Load First Document
              </Button>
            )}
          </div>
          
          <EnhancedTabSystem
            canvases={documents.map(doc => ({
              id: doc.id,
              title: doc.title,
              type: doc.contentType as any,
              contentType: doc.contentType,
              isActive: doc.id === activeDocumentId,
              created: new Date(), // Fallback for compatibility
              modified: doc.lastModified,
              lastModified: doc.lastModified,
              content: doc.content
            }))}
            activeCanvasId={activeDocumentId || ''}
            onCanvasSelect={onDocumentSwitch}
            onCanvasClose={onDocumentClose}
            onCanvasCreate={() => onDocumentCreate()}
            showTemplateSelector={true}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default AdvancedCanvasEditor;
