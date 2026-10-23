import React, { useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ZoomControlsProps {
  className?: string;
  compact?: boolean;
}

const ZOOM_STORAGE_KEY = 'genieflow_zoom_level';
const DEFAULT_ZOOM = 100;
const MIN_ZOOM = 60;
const MAX_ZOOM = 150;
const ZOOM_STEP = 5;

export const ZoomControls: React.FC<ZoomControlsProps> = ({ className, compact = false }) => {
  const [zoom, setZoom] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ZOOM_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : DEFAULT_ZOOM;
    } catch {
      return DEFAULT_ZOOM;
    }
  });

  const applyZoom = useCallback((newZoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    setZoom(clamped);
    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, clamped.toString());
    } catch {}

    const factor = clamped / 100;
    // Apply zoom across document
    document.documentElement.style.zoom = `${clamped}%`;
    document.documentElement.style.setProperty('--zoom-scale', factor.toString());
    document.documentElement.style.setProperty('--zoom-viewport-height', `${(100 / factor).toFixed(4)}vh`);

    // If running in Electron, inform webFrame if available
    if ((window as any).electronBridge?.setZoomFactor) {
      try {
        (window as any).electronBridge.setZoomFactor(clamped / 100);
      } catch {}
    }
  }, []);

  const handleZoomIn = () => applyZoom(zoom + ZOOM_STEP);
  const handleZoomOut = () => applyZoom(zoom - ZOOM_STEP);
  const handleResetZoom = () => applyZoom(DEFAULT_ZOOM);

  // Apply on mount
  useEffect(() => {
    applyZoom(zoom);
  }, [applyZoom, zoom]);

  // Global keyboard shortcuts: Ctrl + +, Ctrl + -, Ctrl + 0
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Zoom In: '=' key, '+' key, Equal keycode, or NumpadAdd
        if (e.key === '=' || e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd') {
          e.preventDefault();
          handleZoomIn();
        } 
        // Zoom Out: '-' key, Minus keycode, or NumpadSubtract
        else if (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          handleZoomOut();
        } 
        // Reset Zoom: '0' key or Numpad0
        else if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [zoom, applyZoom]);

  return (
    <div
      className={cn(
        "flex items-center bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-1 py-0.5 shadow-sm text-xs select-none transition-all",
        className
      )}
      title="Scale frame: Zoom In (Ctrl +), Zoom Out (Ctrl -), Reset (Ctrl 0)"
    >
      <button
        onClick={handleZoomOut}
        disabled={zoom <= MIN_ZOOM}
        className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
        aria-label="Zoom Out"
        title="Zoom Out (Ctrl -)"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleResetZoom}
        className="px-1.5 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/80 dark:hover:bg-slate-700 rounded-md transition-all flex items-center gap-1.5"
        title="Click to reset zoom to 100% (Ctrl 0)"
      >
        <span>{zoom}%</span>
        {zoom !== DEFAULT_ZOOM && (
          <RotateCcw className="w-2.5 h-2.5 opacity-60 hover:opacity-100 transition-opacity" />
        )}
      </button>

      <button
        onClick={handleZoomIn}
        disabled={zoom >= MAX_ZOOM}
        className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
        aria-label="Zoom In"
        title="Zoom In (Ctrl + or Ctrl =)"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
