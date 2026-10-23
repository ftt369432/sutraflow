/**
 * 🔗 Canvas AI Drive Integration Layer
 * 
 * Clean non-intrusive layer that adds AI Drive persistence to existing Canvas system.
 * Follows constant prompt principles: doesn't disturb working order, clean architecture.
 * 
 * Usage: Wrap existing Canvas components to add AI Drive capabilities
 */

import React, { useEffect, useCallback } from 'react';
import { useCanvasAIDrive, CanvasDocument } from '../../hooks/canvas/useCanvasAIDrive';
import { useToast } from '../../hooks/useToast';

interface CanvasAIDriveIntegrationProps {
  children: React.ReactNode;
  canvas: CanvasDocument | null;
  onCanvasChange?: (canvas: CanvasDocument) => void;
  autoSaveEnabled?: boolean;
  autoSaveInterval?: number; // in milliseconds
}

/**
 * 🎨 Canvas AI Drive Integration Wrapper
 * 
 * Wraps existing Canvas components to add AI Drive persistence.
 * Non-intrusive design that doesn't modify existing Canvas behavior.
 */
export function CanvasAIDriveIntegration({
  children,
  canvas,
  onCanvasChange,
  autoSaveEnabled = true,
  autoSaveInterval = 30000 // 30 seconds
}: CanvasAIDriveIntegrationProps) {
  const { 
    saveCanvasToAIDrive, 
    autoSaveCanvas, 
    enableAutoSave, 
    disableAutoSave,
    saveState 
  } = useCanvasAIDrive();
  const { toast } = useToast();

  // Auto-save setup
  useEffect(() => {
    if (canvas && autoSaveEnabled) {
      enableAutoSave(canvas, autoSaveInterval);
    } else {
      disableAutoSave();
    }

    return () => {
      disableAutoSave();
    };
  }, [canvas, autoSaveEnabled, autoSaveInterval, enableAutoSave, disableAutoSave]);

  // Enhanced canvas change handler with AI Drive integration
  const handleCanvasChange = useCallback((updatedCanvas: CanvasDocument) => {
    // Call original handler first (maintain existing behavior)
    onCanvasChange?.(updatedCanvas);

    // Add AI Drive auto-save (non-intrusive addition)
    if (autoSaveEnabled) {
      autoSaveCanvas(updatedCanvas);
    }
  }, [onCanvasChange, autoSaveCanvas, autoSaveEnabled]);

  // Manual save capability
  const handleManualSave = useCallback(async () => {
    if (canvas) {
      const fileId = await saveCanvasToAIDrive(canvas);
      if (fileId && onCanvasChange) {
        // Update canvas with AI Drive file ID
        const updatedCanvas = { ...canvas, aiDriveFileId: fileId };
        onCanvasChange(updatedCanvas);
      }
    }
  }, [canvas, saveCanvasToAIDrive, onCanvasChange]);

  // Provide integration context to children
  const integrationContext = {
    saveState,
    manualSave: handleManualSave,
    isAutoSaveEnabled: autoSaveEnabled
  };

  // Clone children and inject AI Drive capabilities
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        onCanvasChange: handleCanvasChange,
        aiDriveIntegration: integrationContext
      });
    }
    return child;
  });

  return <>{enhancedChildren}</>;
}

/**
 * 💾 Canvas Save Status Indicator
 * 
 * Clean status indicator that shows AI Drive save state.
 * Can be placed anywhere in the Canvas interface.
 */
interface CanvasSaveStatusProps {
  saveState: any;
  className?: string;
  showText?: boolean;
}

export function CanvasSaveStatus({ 
  saveState, 
  className = "", 
  showText = true 
}: CanvasSaveStatusProps) {
  const getStatusInfo = () => {
    switch (saveState.saveStatus) {
      case 'saved':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: '✅',
          text: 'Saved to AI Drive'
        };
      case 'saving':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          icon: '💾',
          text: 'Saving...'
        };
      case 'error':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: '❌',
          text: 'Save failed'
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          icon: '📄',
          text: 'Ready'
        };
    }
  };

  const status = getStatusInfo();

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.bg} ${className}`}>
      <span className="text-sm">{status.icon}</span>
      {showText && (
        <span className={`text-xs font-medium ${status.color}`}>
          {status.text}
        </span>
      )}
    </div>
  );
}

export default CanvasAIDriveIntegration;
