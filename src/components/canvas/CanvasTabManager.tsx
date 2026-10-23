/**
 * Canvas Tab Manager
 * 
 * Manages canvas document tabs with proper closing, switching, and persistence.
 * Integrated with conversation-document linking for seamless experience.
 */

import React, { useCallback } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useConversationDocumentStore } from '../../stores/conversationDocumentStore';
import { Button } from '../ui/Button';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

export interface CanvasTab {
  id: string;
  title: string;
  isActive: boolean;
  isDirty: boolean;
  documentType: string;
  source: 'ai-generated' | 'ai-drive' | 'template' | 'user-created';
}

interface CanvasTabManagerProps {
  tabs: CanvasTab[];
  activeTabId: string | null;
  onTabSwitch: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab?: () => void;
  className?: string;
}

export const CanvasTabManager: React.FC<CanvasTabManagerProps> = ({
  tabs,
  activeTabId,
  onTabSwitch,
  onTabClose,
  onNewTab,
  className
}) => {
  const { removeDocumentLink } = useConversationDocumentStore();

  const handleTabClose = useCallback((tabId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent tab activation
    
    // Find the tab to check if it has unsaved changes
    const tab = tabs.find(t => t.id === tabId);
    
    if (tab?.isDirty) {
      // Show confirmation dialog for unsaved changes
      const shouldClose = window.confirm(
        `"${tab.title}" has unsaved changes. Close without saving?`
      );
      if (!shouldClose) return;
    }
    
    // Remove from conversation-document linking
    removeDocumentLink(tabId);
    
    // Call parent close handler
    onTabClose(tabId);
    
    console.log('🗑️ Tab closed:', tab?.title);
  }, [tabs, onTabClose, removeDocumentLink]);

  const handleTabClick = useCallback((tabId: string) => {
    if (tabId !== activeTabId) {
      onTabSwitch(tabId);
      console.log('🎯 Switched to tab:', tabs.find(t => t.id === tabId)?.title);
    }
  }, [activeTabId, onTabSwitch, tabs]);

  const getTabIcon = (documentType: string, source: string) => {
    // Only show one icon - prioritize source type over document type
    if (source === 'ai-drive') {
      return <ExternalLink className="w-3 h-3" />;
    }
    // Default to FileText for all other cases
    return <FileText className="w-3 h-3" />;
  };

  if (tabs.length === 0) {
    return (
      <div className={cn("border-b border-gray-200 bg-gray-50 p-2", className)}>
        <div className="text-center text-gray-500 text-sm">
          No documents open
          {onNewTab && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewTab}
              className="ml-2"
            >
              Create New
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex border-b border-gray-200 bg-white overflow-x-auto", className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          
          return (
            <div
              key={tab.id}
              className={cn(
                "flex items-center min-w-0 max-w-48 px-3 py-2 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors group",
                isActive && "bg-blue-50 border-b-2 border-blue-500 hover:bg-blue-50",
                tab.isDirty && "bg-orange-50"
              )}
              onClick={() => handleTabClick(tab.id)}
            >
              {/* Tab Icon */}
              <div className="flex-shrink-0 mr-2 text-gray-400">
                {getTabIcon(tab.documentType, tab.source)}
              </div>
              
              {/* Tab Title */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "flex-1 truncate text-sm font-medium",
                    isActive ? "text-blue-600" : "text-gray-600",
                    tab.isDirty && "text-orange-600"
                  )}>
                    {tab.title}
                    {tab.isDirty && " •"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div className="font-medium">{tab.title}</div>
                    <div className="text-gray-500">
                      Type: {tab.documentType} | Source: {tab.source}
                      {tab.isDirty && " | Unsaved changes"}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Close Button */}
              <button
                onClick={(e) => handleTabClose(tab.id, e)}
                className={cn(
                  "flex-shrink-0 ml-1 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity",
                  isActive && "opacity-100"
                )}
                title="Close document"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        
        {/* New Tab Button */}
        {onNewTab && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onNewTab}
                className="flex-shrink-0 px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                title="Create new document"
              >
                <span className="text-lg font-light">+</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Create new document
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CanvasTabManager;