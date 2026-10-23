import React, { useState } from 'react';
import { FileText, Plus, X, Settings } from 'lucide-react';

import { Canvas } from '../../types/canvas';

interface EnhancedTabSystemProps {
  canvases: Canvas[];
  activeCanvasId: string;
  onCanvasSelect: (id: string) => void;
  onCanvasClose: (id: string) => void;
  onCanvasCreate: (type?: string) => void;
  onCanvasRename?: (id: string, newTitle: string) => void;
  showTemplateSelector?: boolean;
}

const EnhancedTabSystem: React.FC<EnhancedTabSystemProps> = ({
  canvases,
  activeCanvasId,
  onCanvasSelect,
  onCanvasClose,
  onCanvasCreate,
  onCanvasRename,
  showTemplateSelector = false
}) => {
  const [showNewDocumentOptions, setShowNewDocumentOptions] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'legal': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-300';
      case 'business': return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-300';
      case 'creative': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-300';
      case 'medical': return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-300';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'legal': return '⚖️';
      case 'business': return '💼';
      case 'creative': return '🎨';
      case 'medical': return '🏥';
      default: return '📄';
    }
  };

  const getInactiveTabStyle = () => {
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:shadow-md border-gray-200';
  };

  const documentTemplates = [
    { type: 'blank', title: 'Blank Document', description: 'Start with an empty document' },
    { type: 'legal', title: 'Legal Document', description: 'Petitions, contracts, briefs' },
    { type: 'business', title: 'Business Document', description: 'Reports, proposals, memos' },
    { type: 'creative', title: 'Research Report', description: 'Research papers and analysis' },
    { type: 'medical', title: 'Personal Letter', description: 'Personal correspondence' }
  ];

  // Show template selector when no canvases exist or when explicitly requested
  const shouldShowTemplates = canvases.length === 0 || showTemplateSelector;

  if (shouldShowTemplates) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header Tabs - Similar to Picture 1 */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center px-6 py-3">
            <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium text-sm">
              New Document
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm ml-4">
              My Documents
            </button>
          </div>
        </div>

        {/* Template Selection Area - Matches Picture 1 Layout */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create New Document</h2>
              <p className="text-gray-600">Start with a blank document or choose from templates</p>
            </div>

            {/* Template Grid - Matches Picture 1 Style */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {/* Blank Document - Prominent */}
              <div className="col-span-2">
                <button
                  onClick={() => onCanvasCreate('blank')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Blank Document</span>
                </button>
              </div>

              {/* Template Options */}
              {documentTemplates.slice(1).map((template) => (
                <button
                  key={template.type}
                  onClick={() => onCanvasCreate(template.type)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                  title={`Create ${template.title}`}
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {template.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Canvas Tab Interface - When documents exist
  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Enhanced Document Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          {canvases.map((canvas) => (
            <div
              key={canvas.id}
              className="relative group flex-shrink-0"
            >
              <div
                onClick={() => editingTabId !== canvas.id && onCanvasSelect(canvas.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTabId(canvas.id);
                  setEditingTitle(canvas.title);
                }}
                className={`
                  relative flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-t-xl cursor-pointer
                  transition-all duration-300 ease-in-out min-w-[160px] max-w-[220px] border-b-2
                  ${activeCanvasId === canvas.id
                    ? `${getTypeColor(canvas.type)} shadow-lg transform -translate-y-1 border-transparent`
                    : `${getInactiveTabStyle()}`
                  }
                `}
                title={`${canvas.title} (${canvas.type}) - Double-click to rename`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                {editingTabId === canvas.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => {
                      if (onCanvasRename && editingTitle.trim()) {
                        onCanvasRename(canvas.id, editingTitle.trim());
                      }
                      setEditingTabId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (onCanvasRename && editingTitle.trim()) {
                          onCanvasRename(canvas.id, editingTitle.trim());
                        }
                        setEditingTabId(null);
                      } else if (e.key === 'Escape') {
                        setEditingTabId(null);
                      }
                    }}
                    className="bg-white/90 text-gray-900 px-1 py-0.5 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-white w-full"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate font-medium text-xs">{canvas.title}</span>
                )}

                {/* 🎨 NEW: Save Status Indicator */}
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Saved"></div>
                </div>

                {/* Enhanced Close Button - Always show for better UX */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCanvasClose(canvas.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 hover:text-white rounded-full transition-all ml-2 transform hover:scale-110"
                  title={`Close ${canvas.title}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* 🎨 NEW: Active Tab Glow Effect */}
              {activeCanvasId === canvas.id && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full animate-pulse"></div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced New Document Controls */}
        <div className="flex items-center space-x-3">
          {/* Quick New Document - Enhanced */}
          <button
            onClick={() => onCanvasCreate('blank')}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            title="Create Blank Document"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Enhanced Template Selector */}
          <div className="relative">
            <button
              onClick={() => setShowNewDocumentOptions(!showNewDocumentOptions)}
              className="p-2 text-gray-500 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 rounded-lg transition-all duration-300 transform hover:scale-110"
              title="Document templates"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showNewDocumentOptions && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl py-3 min-w-[280px] z-50">
                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Choose Template
                  </h3>
                </div>

                {documentTemplates.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => {
                      onCanvasCreate(template.type);
                      setShowNewDocumentOptions(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 group"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                        {template.title}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-blue-600">
                        {template.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTabSystem;
