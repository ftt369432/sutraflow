/**
 * useCanvasUI - Canvas UI State Management Hook
 * 
 * Manages the overall canvas UI state, including layout, panels, and user preferences.
 */

import { useState, useCallback, useEffect } from 'react';
import { useCanvas } from './useCanvas';

interface CanvasUIState {
  // Layout
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: string;
  
  // View preferences
  viewMode: 'single' | 'split' | 'grid';
  zoomLevel: number;
  
  // Tool panels
  toolbarVisible: boolean;
  toolbarCollapsed: boolean;
  
  // Document tabs
  tabsVisible: boolean;
  maxTabs: number;
  
  // Keyboard shortcuts
  shortcutsEnabled: boolean;
}

const DEFAULT_UI_STATE: CanvasUIState = {
  sidebarOpen: true,
  rightPanelOpen: false,
  rightPanelTab: 'outline',
  viewMode: 'single',
  zoomLevel: 100,
  toolbarVisible: true,
  toolbarCollapsed: false,
  tabsVisible: true,
  maxTabs: 8,
  shortcutsEnabled: true,
};

export function useCanvasUI() {
  const { hasDocuments, documentCount } = useCanvas();
  const [uiState, setUIState] = useState<CanvasUIState>(DEFAULT_UI_STATE);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  }, []);

  // Toggle right panel - DISABLED: Keep right panel closed at all times
  const toggleRightPanel = useCallback((tab?: string) => {
    // RIGHT PANEL DISABLED - Do nothing, keep it closed always
    // setUIState(prev => ({
    //   ...prev,
    //   rightPanelOpen: tab ? true : !prev.rightPanelOpen,
    //   rightPanelTab: tab || prev.rightPanelTab,
    // }));
  }, []);

  // Set view mode
  const setViewMode = useCallback((mode: CanvasUIState['viewMode']) => {
    setUIState(prev => ({
      ...prev,
      viewMode: mode,
    }));
  }, []);

  // Adjust zoom
  const setZoomLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(50, Math.min(200, level));
    setUIState(prev => ({
      ...prev,
      zoomLevel: clampedLevel,
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevel(uiState.zoomLevel + 10);
  }, [uiState.zoomLevel, setZoomLevel]);

  const zoomOut = useCallback(() => {
    setZoomLevel(uiState.zoomLevel - 10);
  }, [uiState.zoomLevel, setZoomLevel]);

  const resetZoom = useCallback(() => {
    setZoomLevel(100);
  }, [setZoomLevel]);

  // Toggle toolbar
  const toggleToolbar = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      toolbarVisible: !prev.toolbarVisible,
    }));
  }, []);

  // Collapse/expand toolbar
  const toggleToolbarCollapse = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      toolbarCollapsed: !prev.toolbarCollapsed,
    }));
  }, []);

  // Auto-hide toolbar in certain conditions
  const autoHideToolbar = useCallback((shouldHide: boolean) => {
    setUIState(prev => ({
      ...prev,
      toolbarCollapsed: shouldHide,
    }));
  }, []);

  // Keyboard shortcuts handler
  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    if (!uiState.shortcutsEnabled) return;

    const { ctrlKey, metaKey, key } = event;
    const isCmd = ctrlKey || metaKey;

    if (isCmd) {
      switch (key) {
        case 'b':
          event.preventDefault();
          toggleSidebar();
          break;
        case 'r':
          event.preventDefault();
          toggleRightPanel();
          break;
        case '=':
        case '+':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case '0':
          event.preventDefault();
          resetZoom();
          break;
        default:
          break;
      }
    }
  }, [uiState.shortcutsEnabled, toggleSidebar, toggleRightPanel, zoomIn, zoomOut, resetZoom]);

  // Setup keyboard listeners
  useEffect(() => {
    if (uiState.shortcutsEnabled) {
      document.addEventListener('keydown', handleKeyboardShortcut);
      return () => document.removeEventListener('keydown', handleKeyboardShortcut);
    }
  }, [uiState.shortcutsEnabled, handleKeyboardShortcut]);

  // FORCE right panel to stay closed at ALL times
  useEffect(() => {
    setUIState(prev => ({
      ...prev,
      rightPanelOpen: false, // ALWAYS keep right panel closed
      toolbarCollapsed: !hasDocuments, // Only collapse toolbar when no documents
    }));
  }, [hasDocuments]);

  // Layout calculations
  const getLayoutClasses = useCallback(() => {
    const classes = ['canvas-layout'];
    
    if (uiState.sidebarOpen) classes.push('sidebar-open');
    if (uiState.rightPanelOpen) classes.push('right-panel-open');
    if (uiState.toolbarCollapsed) classes.push('toolbar-collapsed');
    if (!uiState.toolbarVisible) classes.push('toolbar-hidden');
    
    classes.push(`view-${uiState.viewMode}`);
    
    return classes.join(' ');
  }, [uiState]);

  return {
    // State
    ...uiState,
    hasDocuments,
    documentCount,
    
    // Layout actions
    toggleSidebar,
    toggleRightPanel,
    setViewMode,
    
    // Zoom actions
    setZoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    
    // Toolbar actions
    toggleToolbar,
    toggleToolbarCollapse,
    autoHideToolbar,
    
    // Utilities
    getLayoutClasses,
    
    // Computed properties
    canSplit: documentCount > 1,
    shouldShowTabs: uiState.tabsVisible && hasDocuments,
    effectiveZoom: uiState.zoomLevel / 100,
  };
}
