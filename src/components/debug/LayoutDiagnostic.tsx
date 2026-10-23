import React, { useEffect, useState } from 'react';

interface LayoutDiagnosticProps {
  isCanvasOpen: boolean;
  sideBySideMode: boolean;
}

export const LayoutDiagnostic: React.FC<LayoutDiagnosticProps> = ({ 
  isCanvasOpen, 
  sideBySideMode 
}) => {
  const [measurements, setMeasurements] = useState<any>({});

  useEffect(() => {
    const updateMeasurements = () => {
      const mainContainer = document.querySelector('[data-debug="main-container"]') as HTMLElement;
      const chatContainer = document.querySelector('[data-debug="chat-container"]') as HTMLElement;
      const canvasContainer = document.querySelector('[data-debug="canvas-container"]') as HTMLElement;
      const chatHeader = document.querySelector('[data-debug="chat-header"]') as HTMLElement;

      setMeasurements({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        mainContainerWidth: mainContainer?.offsetWidth || 'N/A',
        chatContainerWidth: chatContainer?.offsetWidth || 'N/A',
        canvasContainerWidth: canvasContainer?.offsetWidth || 'N/A',
        chatHeaderHeight: chatHeader?.offsetHeight || 'N/A',
        timestamp: new Date().toLocaleTimeString()
      });
    };

    // Update immediately
    updateMeasurements();

    // Update on window resize
    window.addEventListener('resize', updateMeasurements);
    
    // Update periodically for dynamic changes
    const interval = setInterval(updateMeasurements, 1000);

    return () => {
      window.removeEventListener('resize', updateMeasurements);
      clearInterval(interval);
    };
  }, [isCanvasOpen, sideBySideMode]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-0 right-0 bg-red-500 text-white text-xs p-2 z-50 opacity-90 max-w-xs">
      <div className="font-bold mb-1">Layout Debug</div>
      <div>Canvas: {isCanvasOpen ? 'OPEN' : 'CLOSED'}</div>
      <div>Side Mode: {sideBySideMode ? 'YES' : 'NO'}</div>
      <div>Window: {measurements.windowWidth}×{measurements.windowHeight}</div>
      <div>Chat W: {measurements.chatContainerWidth}px</div>
      <div>Canvas W: {measurements.canvasContainerWidth}px</div>
      <div>Header H: {measurements.chatHeaderHeight}px</div>
      <div className="text-xs opacity-75">{measurements.timestamp}</div>
      
      {/* Calculate percentages */}
      {measurements.chatContainerWidth !== 'N/A' && measurements.windowWidth && (
        <div className="mt-1 pt-1 border-t border-red-300">
          <div>Chat: {Math.round((measurements.chatContainerWidth / measurements.windowWidth) * 100)}%</div>
          {measurements.canvasContainerWidth !== 'N/A' && (
            <div>Canvas: {Math.round((measurements.canvasContainerWidth / measurements.windowWidth) * 100)}%</div>
          )}
        </div>
      )}
    </div>
  );
};
