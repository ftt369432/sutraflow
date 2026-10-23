import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Document, Page } from 'react-pdf';

// PDF worker is configured by src/lib/pdfWorkerSetup.ts
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Download,
  Loader2,
  Pencil,
  Highlighter,
  Type,
  Save,
  RotateCcw
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { GenieDrivePDFAnnotationLayer, Annotation } from './GenieDrivePDFAnnotationLayer';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface GenieDrivePDFViewerProps {
  pdfUrl: string;
  fileName?: string;
  onDownload?: () => void;
  fileId?: string;
  aiDriveService?: any;
}

export const GenieDrivePDFViewer: React.FC<GenieDrivePDFViewerProps> = ({
  pdfUrl,
  fileName,
  onDownload,
  fileId,
  aiDriveService
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isToolbarOpen, setIsToolbarOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDocLoaded, setIsDocLoaded] = useState<boolean>(false);
  const [pageInputValue, setPageInputValue] = useState<string>('1');
  
  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnoMode, setActiveAnnoMode] = useState<'none' | 'pen' | 'highlight' | 'text' | 'eraser'>('none');
  const [activeAnnoColor, setActiveAnnoColor] = useState<string>('#ef4444'); // Default red
  const [isSaving, setIsSaving] = useState(false);
  const [loadingAnnos, setLoadingAnnos] = useState(false);

  // Load annotations on mount
  useEffect(() => {
    if (fileId && aiDriveService?.getAnnotations) {
      const loadAnnos = async () => {
        setLoadingAnnos(true);
        try {
          const annos = await aiDriveService.getAnnotations(fileId);
          if (annos && annos.length > 0) {
            // Flatten the data if it's stored as an array of DB records with .data field
            // Our new service returns the parsed data array.
            setAnnotations(annos);
          }
        } catch (err) {
          console.error('Failed to load annotations:', err);
        } finally {
          setLoadingAnnos(false);
        }
      };
      loadAnnos();
    }
  }, [fileId, aiDriveService]);

  const mainViewRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize PDF options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/standard_fonts/',
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true
  }), []);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setIsDocLoaded(true);
  }, []);

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(page, numPages));
    setCurrentPage(clamped);
    setPageInputValue(String(clamped));
  }, [numPages]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  }, []);

  const handlePageInputSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInputValue, 10);
      if (!isNaN(parsed)) {
        goToPage(parsed);
      }
    }
  }, [pageInputValue, goToPage]);

  const handlePageInputBlur = useCallback(() => {
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setPageInputValue(String(currentPage));
    }
  }, [pageInputValue, goToPage, currentPage]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen exit via Escape
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Scroll thumbnail into view when page changes
  useEffect(() => {
    if (thumbnailContainerRef.current && isDocLoaded) {
      const activeThumb = thumbnailContainerRef.current.querySelector(`[data-page="${currentPage}"]`);
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentPage, isDocLoaded]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPage(currentPage - 1);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          goToPage(currentPage + 1);
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomIn(); }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomOut(); }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage, goToPage, zoomIn, zoomOut]);

  const zoomPercentage = Math.round(scale * 100);

  const handleAddAnnotation = useCallback((newAnno: Annotation) => {
    setAnnotations(prev => [...prev, newAnno]);
  }, []);

  const clearAnnotations = useCallback(() => {
    if (confirm('Are you sure you want to clear all markups on this document?')) {
      setAnnotations([]);
    }
  }, []);

  const saveMarkup = useCallback(async () => {
    if (!fileId || !aiDriveService?.saveAnnotations) {
      alert('Persistence service not available.');
      return;
    }

    setIsSaving(true);
    try {
      await aiDriveService.saveAnnotations(fileId, annotations);
      alert('Markup saved successfully.');
    } catch (error) {
      console.error('Failed to save markup:', error);
      alert('Failed to save markup. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [annotations, fileId, aiDriveService]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full bg-slate-100 dark:bg-gray-950 overflow-hidden"
    >
      {/* ─────────── TOOLBAR ─────────── */}
      <div className={`flex-none flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 shadow-sm z-30 transition-all duration-300 ease-in-out ${
        isToolbarOpen ? 'h-auto opacity-100' : 'h-0 py-0 opacity-0 pointer-events-none overflow-hidden border-none'
      }`}>
        {/* Left: sidebar toggle + page nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              isSidebarOpen 
                ? 'bg-slate-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400'
            }`}
            title={isSidebarOpen ? 'Hide thumbnails' : 'Show thumbnails'}
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-gray-700" />

          <button
            onClick={() => goToPage(1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
            title="First page"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-gray-300">
            <input
              type="text"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              onBlur={handlePageInputBlur}
              className="w-10 text-center bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded px-1 py-0.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-400 dark:text-gray-500">of</span>
            <span className="font-mono">{numPages}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => goToPage(numPages)}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
            title="Last page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        {/* Center: File name */}
        {fileName && (
          <span className="hidden md:block text-sm font-medium text-slate-600 dark:text-gray-400 truncate max-w-[200px]">
            {fileName}
          </span>
        )}

        {/* Right: zoom + fullscreen + download */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <span className="text-xs font-mono text-slate-500 dark:text-gray-400 w-10 text-center select-none">
            {zoomPercentage}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-gray-700" />

          {onDownload && (
            <button
              onClick={onDownload}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 transition-colors"
              title="Download"
            >
              <Download size={16} />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* ─────────── ANNOTATION TOOLBAR ─────────── */}
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-gray-950 border-b border-slate-200 dark:border-gray-800 shadow-sm z-30">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveAnnoMode(activeAnnoMode === 'pen' ? 'none' : 'pen')}
            className={cn(
              "p-2 rounded-md transition-colors",
              activeAnnoMode === 'pen' ? "bg-blue-600 text-white" : "hover:bg-slate-200 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400"
            )}
            title="Pen Tool"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => setActiveAnnoMode(activeAnnoMode === 'highlight' ? 'none' : 'highlight')}
            className={cn(
              "p-2 rounded-md transition-colors",
              activeAnnoMode === 'highlight' ? "bg-yellow-500 text-white" : "hover:bg-slate-200 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400"
            )}
            title="Highlight Tool"
          >
            <Highlighter size={18} />
          </button>
          <button
            onClick={() => setActiveAnnoMode(activeAnnoMode === 'text' ? 'none' : 'text')}
            className={cn(
              "p-2 rounded-md transition-colors",
              activeAnnoMode === 'text' ? "bg-green-600 text-white" : "hover:bg-slate-200 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400"
            )}
            title="Text Tool"
          >
            <Type size={18} />
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-gray-800 mx-1" />
          
          <div className="flex items-center gap-1.5 px-2">
            {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#000000'].map(color => (
              <button
                key={color}
                onClick={() => setActiveAnnoColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-transform",
                  activeAnnoColor === color ? "border-slate-400 scale-110 shadow-sm" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {annotations.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAnnotations} className="text-red-500 hover:text-red-600">
              <RotateCcw size={16} className="mr-1.5" />
              Clear
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={saveMarkup} 
            disabled={annotations.length === 0 || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
            Save Markup
          </Button>
        </div>
      </div>

      {/* Floating Toolbar Restore Button (when closed) */}
      {!isToolbarOpen && (
        <button
          onClick={() => setIsToolbarOpen(true)}
          className="absolute top-2 right-12 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-slate-200 dark:border-gray-800 rounded-full shadow-lg text-xs font-semibold text-slate-600 dark:text-gray-300 hover:scale-105 transition-all"
        >
          <ChevronDown size={14} />
          Show Tools
        </button>
      )}

      {/* ─────────── BODY: sidebar + main ─────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Toggle Tools Button (inside body to be visible when toolbar hidden) */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 z-20 opacity-0 hover:opacity-100 transition-opacity">
           <button 
             onClick={() => setIsToolbarOpen(!isToolbarOpen)}
             className="bg-slate-200 dark:bg-gray-800 px-4 py-0.5 rounded-b-lg border-x border-b border-slate-300 dark:border-gray-700 text-slate-500 hover:text-blue-500 transition-colors"
           >
             {isToolbarOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
           </button>
        </div>
        {/* THUMBNAIL SIDEBAR */}
        <div
          className={`flex-none border-r border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out overflow-hidden ${
            isSidebarOpen ? 'w-[140px]' : 'w-0'
          }`}
        >
          <div
            ref={thumbnailContainerRef}
            className="h-full overflow-y-auto py-3 px-2 space-y-2"
          >
            {isDocLoaded && (
              <Document file={pdfUrl} options={pdfOptions}>
                {Array.from({ length: numPages }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <div
                      key={`thumb-${pageNum}`}
                      data-page={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                        isActive
                          ? 'border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Page
                        pageNumber={pageNum}
                        width={116}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={
                          <div className="w-[116px] h-[150px] bg-slate-50 dark:bg-gray-800 animate-pulse rounded" />
                        }
                      />
                      <div className={`text-center text-[10px] py-1 font-mono ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30'
                          : 'text-slate-400 dark:text-gray-500'
                      }`}>
                        {pageNum}
                      </div>
                    </div>
                  );
                })}
              </Document>
            )}
          </div>
        </div>

        {/* MAIN PAGE VIEW */}
        <div
          ref={mainViewRef}
          className="flex-1 overflow-auto flex justify-center bg-slate-200/50 dark:bg-gray-950"
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error('PDF load error:', error);
            }}
            loading={
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-slate-500 dark:text-gray-400">Loading document…</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
                <p className="font-semibold">Failed to load PDF</p>
                <p className="text-sm text-slate-500">The file may be corrupted or incompatible.</p>
              </div>
            }
            options={pdfOptions}
          >
            <div className="py-6 flex justify-center">
                <div className="relative shadow-2xl rounded-sm bg-white dark:bg-gray-100">
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <Skeleton className="w-[600px] h-[800px]" />
                    }
                    onRenderError={(error) => {
                      console.warn(`Page ${currentPage} render error:`, error);
                    }}
                  />
                  {isDocLoaded && (
                    <GenieDrivePDFAnnotationLayer
                      pageNumber={currentPage}
                      width={mainViewRef.current?.querySelector('.react-pdf__Page__canvas')?.clientWidth || 0}
                      height={mainViewRef.current?.querySelector('.react-pdf__Page__canvas')?.clientHeight || 0}
                      scale={scale}
                      annotations={annotations}
                      onAddAnnotation={handleAddAnnotation}
                      activeMode={activeAnnoMode}
                      activeColor={activeAnnoColor}
                    />
                  )}
                </div>
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};
