import React from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  FileText, 
  PlusCircle, 
  Eye,
  Maximize2,
  X,
  Bot,
  Sparkles
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { ContentType } from '../../types/canvas';

interface MultiWindowCanvasControlProps {
  className?: string;
}

export function MultiWindowCanvasControl({ className = '' }: MultiWindowCanvasControlProps) {
  const {
    windows,
    activeWindowId,
    createWindow,
    setActiveWindow,
    closeWindow,
    isCanvasEnabled,
    toggleCanvasEnabled
  } = useCanvasStore();

  const handleCreateWindow = (contentType: ContentType, title: string, content: string) => {
    const windowId = createWindow(contentType, content);
    const window = windows.find(w => w.id === windowId);
    if (window) {
      // Update the document title
      // Since we just created it, we can access it directly
      console.log(`Created window: ${windowId} for ${contentType}`);
    }
  };

  const quickCreateOptions = [
    {
      type: 'legal_contract' as ContentType,
      title: 'Service Agreement',
      content: '# Service Agreement\n\nThis agreement is entered into between...',
      icon: FileText,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      type: 'business_plan' as ContentType,
      title: 'Startup Business Plan',
      content: '# Business Plan\n\n## Executive Summary\n\nOur company vision...',
      icon: Bot,
      color: 'bg-green-100 text-green-800'
    },
    {
      type: 'formal_letter' as ContentType,
      title: 'Official Letter',
      content: '# Formal Letter\n\nDear [Recipient],\n\nI am writing to...',
      icon: Sparkles,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      type: 'academic_paper' as ContentType,
      title: 'Research Paper',
      content: '# Research Paper\n\n## Abstract\n\nThis paper examines...',
      icon: FileText,
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  return (
    <div className={`fixed top-4 left-4 z-[60] max-w-sm ${className}`}>
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Multi-Window Canvas
            </CardTitle>
            <Badge variant={isCanvasEnabled ? "default" : "secondary"}>
              {isCanvasEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          {!isCanvasEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCanvasEnabled}
              className="w-full"
            >
              Enable Canvas
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Windows Status */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{windows.length}</div>
            <div className="text-sm text-gray-600">Active Windows</div>
            {windows.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {windows.reduce((total, w) => total + w.agents.length, 0)} AI Agents
              </div>
            )}
          </div>

          {/* Quick Create Buttons */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Quick Create:</h4>
            <div className="grid grid-cols-2 gap-2">
              {quickCreateOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateWindow(option.type, option.title, option.content)}
                    disabled={!isCanvasEnabled}
                    className="h-16 flex-col gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{option.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Active Windows List */}
          {windows.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Active Windows:</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {windows.map((window) => (
                  <div
                    key={window.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      window.id === activeWindowId
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveWindow(window.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {window.document.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {window.id.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-500">
                          Doc ID: {window.document.id.slice(0, 8)}...
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {window.contentType.replace('_', ' ')}
                        </Badge>
                        {window.agents.length > 0 && (
                          <Badge variant="secondary" className="text-xs mt-1 ml-1">
                            {window.agents.length} agents
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWindow(window.id);
                          }}
                          className="h-6 w-6 p-0"
                          title="Focus Window"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeWindow(window.id);
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          title="Close Window"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Window Position Info */}
                    <div className="text-xs text-gray-400 mt-2">
                      Position: ({window.position.x}, {window.position.y}) | 
                      Size: {window.size.width}×{window.size.height}
                      {window.isDocked && ' | Docked'}
                      {window.isMinimized && ' | Minimized'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {windows.length === 0 && isCanvasEnabled && (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Bot className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-blue-800 font-medium">Ready for Multi-Window Canvas</div>
              <div className="text-xs text-blue-600 mt-1">
                Click the buttons above to create multiple canvas windows, 
                or try typing phrases like "I need to write a contract" in the chat below.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MultiWindowCanvasControl;