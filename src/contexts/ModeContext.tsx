/**
 * Mode Context - Progressive Disclosure System
 * 
 * Provides mode-based UI visibility and feature gating across the app.
 * Three modes: Simple (minimal), Power (full features), Auto (intelligent)
 * 
 * @module contexts/ModeContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserMode, 
  ModeConfig, 
  getModeConfig, 
  isFeatureEnabled, 
  shouldShowPanel as shouldShowPanelHelper 
} from '../config/modes';

/**
 * Mode Context Value
 * Exposed to all components via useMode() hook
 */
interface ModeContextValue {
  /** Current active mode */
  currentMode: UserMode;
  
  /** Configuration for current mode */
  config: ModeConfig;
  
  /** Change active mode (persisted to localStorage) */
  setMode: (mode: UserMode) => void;
  
  /** Helpers for conditional rendering */
  should: {
    /** Check if panel should be visible in current mode */
    showPanel: (panelName: string) => boolean;
    
    /** Check if feature is enabled in current mode */
    enableFeature: (featureName: keyof ModeConfig['features']) => boolean;
  };
  
  /** Whether Power Mode suggestion modal should display */
  suggestPowerMode: boolean;
  
  /** Dismiss Power Mode suggestion */
  dismissPowerModeSuggestion: () => void;
  
  /** Trigger Power Mode suggestion (called by useModeDetection hook) */
  triggerPowerModeSuggestion: () => void;
}

/**
 * Mode Context
 * Created with React.createContext following existing pattern
 */
const ModeContext = createContext<ModeContextValue | null>(null);

/**
 * Mode Provider Props
 */
interface ModeProviderProps {
  children: ReactNode;
}

/**
 * Mode Provider Component
 * 
 * Wraps app to provide mode context to all components.
 * Handles mode persistence via localStorage.
 * 
 * Usage:
 * ```tsx
 * <ModeProvider>
 *   <App />
 * </ModeProvider>
 * ```
 */
export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
  // Initialize mode from localStorage or default to 'simple'
  const [currentMode, setCurrentModeState] = useState<UserMode>(() => {
    try {
      const stored = localStorage.getItem('user-mode');
      if (stored === 'simple' || stored === 'power' || stored === 'auto') {
        return stored;
      }
    } catch (error) {
      console.error('Failed to read mode from localStorage:', error);
    }
    return 'simple'; // Default to Simple Mode
  });
  
  // Power Mode suggestion state
  const [suggestPowerMode, setSuggestPowerMode] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  
  // Get configuration for current mode
  const config = getModeConfig(currentMode);
  
  /**
   * Set mode and persist to localStorage
   * Syncs across browser tabs using localStorage events
   */
  const setMode = (mode: UserMode) => {
    try {
      localStorage.setItem('user-mode', mode);
      setCurrentModeState(mode);
      
      // Reset suggestion state when manually switching modes
      setSuggestPowerMode(false);
      setSuggestionDismissed(false);
      
      console.log(`🎯 Mode switched to: ${mode}`);
    } catch (error) {
      console.error('Failed to save mode to localStorage:', error);
      setCurrentModeState(mode); // Still update state even if localStorage fails
    }
  };
  
  /**
   * Trigger Power Mode suggestion
   * Called by useModeDetection when complex task detected
   */
  const triggerPowerModeSuggestion = () => {
    // Only suggest if:
    // 1. Currently in Simple or Auto mode
    // 2. Suggestion hasn't been dismissed this session
    if ((currentMode === 'simple' || currentMode === 'auto') && !suggestionDismissed) {
      setSuggestPowerMode(true);
    }
  };
  
  /**
   * Dismiss Power Mode suggestion
   * User chose to stay in current mode
   */
  const dismissPowerModeSuggestion = () => {
    setSuggestPowerMode(false);
    setSuggestionDismissed(true);
  };
  
  /**
   * Sync mode across browser tabs
   * Listen for localStorage changes from other tabs
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user-mode' && e.newValue) {
        const newMode = e.newValue as UserMode;
        if (newMode === 'simple' || newMode === 'power' || newMode === 'auto') {
          setCurrentModeState(newMode);
          console.log(`🔄 Mode synced from another tab: ${newMode}`);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  /**
   * Log mode changes for debugging
   */
  useEffect(() => {
    console.log('🎨 Mode Context State:', {
      currentMode,
      orchestration: config.execution.orchestration,
      canvasType: config.ui.canvasType,
      panelsVisible: {
        taskOrchestrator: config.ui.showTaskOrchestrator,
        intelligence: config.ui.showIntelligencePanel,
        fineTuning: config.ui.showFineTuning,
        collectiveBrain: config.ui.showCollectiveBrain,
        rightPanel: config.ui.showRightPanel
      },
      featuresEnabled: config.features
    });
  }, [currentMode, config]);
  
  /**
   * Helper functions for conditional rendering
   */
  const should = {
    /**
     * Check if panel should be visible
     * @param panelName Panel name (camelCase, without 'show' prefix)
     * @returns true if panel should be visible in current mode
     * 
     * @example
     * ```tsx
     * {should.showPanel('taskOrchestrator') && <UnifiedTaskOrchestrator />}
     * {should.showPanel('intelligencePanel') && <IntelligenceDisplay />}
     * ```
     */
    showPanel: (panelName: string): boolean => {
      return shouldShowPanelHelper(currentMode, panelName);
    },
    
    /**
     * Check if feature is enabled
     * @param featureName Feature name from ModeConfig.features
     * @returns true if feature enabled in current mode
     * 
     * @example
     * ```tsx
     * if (should.enableFeature('multiDocument')) {
     *   // Split into multiple documents
     * }
     * ```
     */
    enableFeature: (featureName: keyof ModeConfig['features']): boolean => {
      return isFeatureEnabled(currentMode, featureName);
    }
  };
  
  // Context value
  const value: ModeContextValue = {
    currentMode,
    config,
    setMode,
    should,
    suggestPowerMode,
    dismissPowerModeSuggestion,
    triggerPowerModeSuggestion
  };
  
  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
};

/**
 * useMode Hook
 * 
 * Access mode context from any component.
 * Must be used within ModeProvider.
 * 
 * @returns ModeContextValue
 * @throws Error if used outside ModeProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentMode, config, should } = useMode();
 *   
 *   return (
 *     <div>
 *       <p>Current Mode: {currentMode}</p>
 *       {should.showPanel('taskOrchestrator') && <TaskPanel />}
 *     </div>
 *   );
 * }
 * ```
 */
export const useMode = (): ModeContextValue => {
  const context = useContext(ModeContext);
  
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  
  return context;
};

/**
 * Export ModeContext for advanced usage
 * (e.g., testing, custom providers)
 */
export { ModeContext };
