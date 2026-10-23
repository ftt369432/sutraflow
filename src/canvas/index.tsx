/**
 * Canvas System Entry Point
 * 
 * Main integration component that brings together all canvas functionality
 * following the prompt guidelines for unified entry points.
 */

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Import our new unified canvas system - using default imports
import UnifiedCanvasSystem from '../components/canvas/UnifiedCanvasSystem';
import DocumentEditorLayout from '../components/canvas/DocumentEditorLayout';
import EnhancedTabSystem from '../components/canvas/EnhancedTabSystem';

// Import canvas routes
import { canvasRoutes } from '../routes/canvas';

// Loading component
const CanvasLoading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading Canvas...</span>
  </div>
);

/**
 * Canvas System Provider - Wraps canvas functionality
 */
export const CanvasSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="canvas-system-container">
      {children}
      
      {/* Toast notifications for canvas operations */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
          },
        }}
      />
    </div>
  );
};

/**
 * Canvas Router - Handles canvas-specific routing
 */
export const CanvasRouter: React.FC = () => {
  return (
    <Suspense fallback={<CanvasLoading />}>
      <Routes>
        {canvasRoutes.map((route, index) => (
          <Route key={index} {...route} />
        ))}
      </Routes>
    </Suspense>
  );
};

/**
 * Main Canvas Integration Component
 * 
 * This component integrates the new canvas system with the existing
 * AIAssistantPage while maintaining all current functionality.
 */
export const CanvasIntegration: React.FC<{
  mode?: 'embedded' | 'standalone';
  className?: string;
}> = ({ 
  mode = 'embedded',
  className = ''
}) => {
  if (mode === 'standalone') {
    return (
      <CanvasSystemProvider>
        <div className={`canvas-standalone ${className}`}>
          <CanvasRouter />
        </div>
      </CanvasSystemProvider>
    );
  }

  // Embedded mode - for integration with AIAssistantPage
  return (
    <CanvasSystemProvider>
      <div className={`canvas-embedded ${className}`}>
        <UnifiedCanvasSystem />
      </div>
    </CanvasSystemProvider>
  );
};

/**
 * Canvas Hook Integration - For use in existing components
 */
export const useCanvasIntegration = () => {
  return {
    // Export all canvas hooks through centralized entry point
    ...require('../hooks/canvas'),
    
    // Canvas system components
    UnifiedCanvasSystem,
    DocumentEditorLayout,
    EnhancedTabSystem,
    
    // Utilities
    CanvasSystemProvider,
    CanvasRouter,
  };
};

/**
 * Export everything for easy integration
 */
// Re-export the components that are already imported above
export {
  UnifiedCanvasSystem,
  DocumentEditorLayout,
  EnhancedTabSystem,
};

export * from '../hooks/canvas';
export { canvasRoutes } from '../routes/canvas';

export default CanvasIntegration;
