/**
 * 📚 Document History Panel
 * 
 * Beautiful, professional document version control interface.
 * Clean Material Design following constant prompt principles.
 * 
 * Features:
 * - Visual timeline of document changes
 * - Quick undo/redo buttons with keyboard shortcuts
 * - Version comparison and restoration
 * - Beautiful animations and transitions
 * - Non-intrusive collapsible design
 */

import React, { useState } from 'react';
import { 
  Undo2, 
  Redo2, 
  History, 
  Clock, 
  FileText, 
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Save,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useDocumentHistory, DocumentSnapshot, DocumentHistoryState } from '../../hooks/canvas/useDocumentHistory';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DocumentHistoryPanelProps {
  content: string;
  title: string;
  onContentRestore: (content: string, title: string) => void;
  onSnapshotCreate?: (description: string) => void;
  className?: string;
  showInSidebar?: boolean;
  collapsed?: boolean;
}

/**
 * 🎨 Document History Controls
 * 
 * Clean, beautiful undo/redo controls with visual state indicators
 */
function HistoryControls({ 
  historyState, 
  onUndo, 
  onRedo, 
  onCreateSnapshot 
}: {
  historyState: DocumentHistoryState;
  onUndo: () => void;
  onRedo: () => void;
  onCreateSnapshot: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Undo Button */}
      <Button
        onClick={onUndo}
        disabled={!historyState.hasUndo}
        variant="outline"
        size="sm"
        className={cn(
          "flex items-center gap-2 transition-all duration-200",
          historyState.hasUndo 
            ? "hover:bg-blue-50 hover:border-blue-300" 
            : "opacity-50 cursor-not-allowed"
        )}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
        <span className="hidden sm:inline">Undo</span>
      </Button>

      {/* Redo Button */}
      <Button
        onClick={onRedo}
        disabled={!historyState.hasRedo}
        variant="outline"
        size="sm"
        className={cn(
          "flex items-center gap-2 transition-all duration-200",
          historyState.hasRedo 
            ? "hover:bg-green-50 hover:border-green-300" 
            : "opacity-50 cursor-not-allowed"
        )}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
        <span className="hidden sm:inline">Redo</span>
      </Button>

      {/* Create Snapshot Button */}
      <Button
        onClick={onCreateSnapshot}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300"
        title="Create Version Snapshot"
      >
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">Save Version</span>
      </Button>

      {/* History Indicator */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
        <History className="h-3 w-3 text-gray-500" />
        <span className="text-gray-600">
          {historyState.currentIndex + 1} / {historyState.snapshots.length}
        </span>
      </div>
    </div>
  );
}

/**
 * 📋 Snapshot Timeline Item
 * 
 * Beautiful individual snapshot display with actions
 */
function SnapshotItem({ 
  snapshot, 
  isActive, 
  onRestore, 
  onPreview 
}: {
  snapshot: DocumentSnapshot;
  isActive: boolean;
  onRestore: () => void;
  onPreview: () => void;
}) {
  const getTypeInfo = (changeType: DocumentSnapshot['changeType']) => {
    switch (changeType) {
      case 'manual':
        return { icon: '✋', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'auto':
        return { icon: '🤖', color: 'text-green-600', bg: 'bg-green-100' };
      case 'major':
        return { icon: '🎯', color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { icon: '📝', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const typeInfo = getTypeInfo(snapshot.changeType);

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
      isActive 
        ? "bg-blue-50 border-blue-200 shadow-sm" 
        : "bg-white border-gray-200 hover:border-gray-300"
    )}>
      {/* Type Indicator */}
      <div className={cn("p-2 rounded-full", typeInfo.bg)}>
        <span className="text-sm">{typeInfo.icon}</span>
      </div>

      {/* Snapshot Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 truncate">
            {snapshot.description}
          </h4>
          {isActive && (
            <Badge variant="default" className="text-xs">
              Current
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(snapshot.timestamp, { addSuffix: true })}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {snapshot.wordCount} words
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          onClick={onPreview}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Preview Version"
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        {!isActive && (
          <Button
            onClick={onRestore}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Restore This Version"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 📚 Main Document History Panel
 */
export function DocumentHistoryPanel({
  content,
  title,
  onContentRestore,
  onSnapshotCreate,
  className = "",
  showInSidebar = false,
  collapsed: initialCollapsed = false
}: DocumentHistoryPanelProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [previewSnapshot, setPreviewSnapshot] = useState<DocumentSnapshot | null>(null);
  
  const {
    historyState,
    currentSnapshot,
    createSnapshot,
    undo,
    redo,
    jumpToSnapshot,
    clearHistory,
    exportHistory
  } = useDocumentHistory(content, title);

  // Handle undo with content restoration
  const handleUndo = () => {
    const previousSnapshot = undo();
    if (previousSnapshot) {
      onContentRestore(previousSnapshot.content, previousSnapshot.title);
    }
  };

  // Handle redo with content restoration
  const handleRedo = () => {
    const nextSnapshot = redo();
    if (nextSnapshot) {
      onContentRestore(nextSnapshot.content, nextSnapshot.title);
    }
  };

  // Handle snapshot restoration
  const handleSnapshotRestore = (snapshot: DocumentSnapshot) => {
    const restoredSnapshot = jumpToSnapshot(snapshot.id);
    if (restoredSnapshot) {
      onContentRestore(restoredSnapshot.content, restoredSnapshot.title);
    }
  };

  // Handle manual snapshot creation
  const handleCreateSnapshot = () => {
    const description = `Manual snapshot - ${new Date().toLocaleTimeString()}`;
    createSnapshot(content, title, 'manual', description);
    onSnapshotCreate?.(description);
  };

  // Handle export
  const handleExport = () => {
    const historyData = exportHistory();
    const blob = new Blob([historyData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-history.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (showInSidebar) {
    // Sidebar version - compact
    return (
      <Card className={cn("border-0 shadow-none", className)}>
        <div className="p-4">
          {/* Header */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <History className="h-4 w-4" />
              Version History
            </h3>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Collapsed content */}
          {!collapsed && (
            <div className="space-y-3">
              {/* Quick Controls */}
              <HistoryControls
                historyState={historyState}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onCreateSnapshot={handleCreateSnapshot}
              />

              {/* Recent Snapshots */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {historyState.snapshots.slice(-5).reverse().map((snapshot) => (
                  <SnapshotItem
                    key={snapshot.id}
                    snapshot={snapshot}
                    isActive={currentSnapshot?.id === snapshot.id}
                    onRestore={() => handleSnapshotRestore(snapshot)}
                    onPreview={() => setPreviewSnapshot(snapshot)}
                  />
                ))}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  onClick={handleExport}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                
                <Button
                  onClick={clearHistory}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Full panel version
  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-5 w-5" />
            Document History
          </h2>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export History
            </Button>
            <Button 
              onClick={clearHistory} 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          <HistoryControls
            historyState={historyState}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onCreateSnapshot={handleCreateSnapshot}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {historyState.snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No version history yet</p>
              <p className="text-sm">Start editing to create snapshots</p>
            </div>
          ) : (
            historyState.snapshots.slice().reverse().map((snapshot) => (
              <SnapshotItem
                key={snapshot.id}
                snapshot={snapshot}
                isActive={currentSnapshot?.id === snapshot.id}
                onRestore={() => handleSnapshotRestore(snapshot)}
                onPreview={() => setPreviewSnapshot(snapshot)}
              />
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

export default DocumentHistoryPanel;
