/**
 * Mode Transition Component
 * 
 * Smooth animation wrapper for content that changes based on mode.
 * Handles fade/slide transitions when switching between Simple/Power modes.
 * 
 * @module components/mode/ModeTransition
 */

import React, { useEffect, useState, ReactNode } from 'react';
import { useMode } from '../../contexts/ModeContext';

interface ModeTransitionProps {
  /** Content to render with transitions */
  children: ReactNode;
  
  /** Transition type */
  type?: 'fade' | 'slide' | 'scale' | 'none';
  
  /** Transition duration in ms */
  duration?: number;
  
  /** Optional className for container */
  className?: string;
}

/**
 * Mode Transition Component
 * 
 * Wraps content that should animate when mode changes.
 * Uses CSS transitions for smooth visual feedback.
 * 
 * @example
 * ```tsx
 * // Fade panels in/out when switching modes
 * <ModeTransition type="fade">
 *   {should.showPanel('taskOrchestrator') && <UnifiedTaskOrchestrator />}
 * </ModeTransition>
 * 
 * // Slide content when canvas type changes
 * <ModeTransition type="slide">
 *   {config.ui.canvasType === 'simple' ? (
 *     <SimpleCanvasOverlay {...props} />
 *   ) : (
 *     <UnifiedCanvasSystem {...props} />
 *   )}
 * </ModeTransition>
 * ```
 */
export const ModeTransition: React.FC<ModeTransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  className = ''
}) => {
  const { currentMode } = useMode();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousMode, setPreviousMode] = useState(currentMode);

  // Detect mode changes and trigger transition
  useEffect(() => {
    if (previousMode !== currentMode) {
      setIsTransitioning(true);
      
      // Complete transition after duration
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousMode(currentMode);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [currentMode, previousMode, duration]);

  // Transition styles based on type
  const getTransitionStyles = (): string => {
    const baseStyles = `transition-all duration-${duration}`;
    
    switch (type) {
      case 'fade':
        return `${baseStyles} ${isTransitioning ? 'opacity-0' : 'opacity-100'}`;
      
      case 'slide':
        return `${baseStyles} transform ${isTransitioning ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'}`;
      
      case 'scale':
        return `${baseStyles} transform ${isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`;
      
      case 'none':
        return '';
      
      default:
        return baseStyles;
    }
  };

  return (
    <div className={`${getTransitionStyles()} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Panel Transition Component
 * 
 * Specialized transition for panels that appear/disappear based on mode.
 * Handles mounting/unmounting with smooth animations.
 */
interface PanelTransitionProps {
  /** Whether panel should be visible */
  show: boolean;
  
  /** Panel content */
  children: ReactNode;
  
  /** Optional className */
  className?: string;
  
  /** Position for slide animation */
  slideFrom?: 'left' | 'right' | 'top' | 'bottom';
}

export const PanelTransition: React.FC<PanelTransitionProps> = ({
  show,
  children,
  className = '',
  slideFrom = 'right'
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Trigger animation after render
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Remove from DOM after animation
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!shouldRender) {
    return null;
  }

  // Get transform based on slide direction
  const getTransform = (): string => {
    if (isAnimating) {
      return 'translate-x-0 translate-y-0';
    }
    
    switch (slideFrom) {
      case 'left':
        return '-translate-x-full';
      case 'right':
        return 'translate-x-full';
      case 'top':
        return '-translate-y-full';
      case 'bottom':
        return 'translate-y-full';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        transition-all duration-300 ease-in-out
        transform ${getTransform()}
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

/**
 * Content Swap Transition
 * 
 * For swapping between two different content pieces with smooth crossfade.
 * Useful for canvas type switching (Simple vs Unified).
 */
interface ContentSwapTransitionProps {
  /** Unique key for current content (triggers transition when changed) */
  contentKey: string;
  
  /** Content to display */
  children: ReactNode;
  
  /** Optional className */
  className?: string;
}

export const ContentSwapTransition: React.FC<ContentSwapTransitionProps> = ({
  contentKey,
  children,
  className = ''
}) => {
  const [displayContent, setDisplayContent] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousKey, setPreviousKey] = useState(contentKey);

  useEffect(() => {
    if (previousKey !== contentKey) {
      // Start fade out
      setIsTransitioning(true);
      
      // After fade out, swap content and fade in
      const timer = setTimeout(() => {
        setDisplayContent(children);
        setPreviousKey(contentKey);
        setIsTransitioning(false);
      }, 150); // Half of total transition time

      return () => clearTimeout(timer);
    } else {
      // Update content without transition if key unchanged
      setDisplayContent(children);
    }
  }, [contentKey, children, previousKey]);

  return (
    <div
      className={`
        transition-opacity duration-300
        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
        ${className}
      `}
    >
      {displayContent}
    </div>
  );
};
