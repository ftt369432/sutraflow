/**
 * Mode Toggle Component
 * 
 * Three-button toggle for switching between Simple/Auto/Power modes.
 * Displays in AI Assistant header for quick mode switching.
 * 
 * Design: Segmented control with icons + labels, active state highlighted
 * 
 * @module components/mode/ModeToggle
 */

import React from 'react';
import { Zap, Sparkles, Gauge, Info } from 'lucide-react';
import { useMode } from '../../contexts/ModeContext';
import type { UserMode } from '../../config/modes';

interface ModeToggleProps {
  /** Optional className for container */
  className?: string;
  /** Show descriptions on hover */
  showTooltips?: boolean;
  /** Compact mode (icons only, no labels) */
  compact?: boolean;
}

/**
 * Mode Toggle Component
 * 
 * @example
 * ```tsx
 * // In AIAssistantPageSectioned header
 * <ModeToggle className="ml-4" />
 * 
 * // Compact version for mobile
 * <ModeToggle compact={true} />
 * ```
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({ 
  className = '', 
  showTooltips = true,
  compact = false 
}) => {
  const { currentMode, setMode, config } = useMode();

  const modes: Array<{
    id: UserMode;
    icon: typeof Zap;
    label: string;
    description: string;
    color: string;
  }> = [
    {
      id: 'simple',
      icon: Zap,
      label: 'Simple',
      description: 'Clean chat experience with minimal interface',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'auto',
      icon: Sparkles,
      label: 'Auto',
      description: 'Intelligent mode switching based on task complexity',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: 'power',
      icon: Gauge,
      label: 'Power',
      description: 'Full-featured environment for power users',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const handleModeChange = (mode: UserMode) => {
    setMode(mode);
    
    // Log for debugging
    console.log('🎯 Mode switched:', {
      from: currentMode,
      to: mode,
      orchestration: config.execution.orchestration,
      canvasType: config.ui.canvasType
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Mode Toggle Buttons */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {modes.map(({ id, icon: Icon, label, description, color }) => {
          const isActive = currentMode === id;
          
          return (
            <button
              key={id}
              onClick={() => handleModeChange(id)}
              className={`
                group relative px-3 py-1.5 rounded-md
                flex items-center gap-2 
                transition-all duration-200
                ${isActive 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
              title={showTooltips ? description : undefined}
            >
              <Icon 
                className={`
                  w-4 h-4 
                  ${isActive ? color : 'text-gray-600 dark:text-gray-400'}
                  transition-colors duration-200
                `} 
              />
              
              {!compact && (
                <span 
                  className={`
                    text-sm font-medium
                    ${isActive 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-600 dark:text-gray-400'
                    }
                    transition-colors duration-200
                  `}
                >
                  {label}
                </span>
              )}

              {/* Tooltip on hover (optional) */}
              {showTooltips && !compact && (
                <div className="
                  absolute top-full left-1/2 -translate-x-1/2 mt-2
                  px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity duration-200 whitespace-nowrap
                  z-50 shadow-lg
                ">
                  {description}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info Icon with Mode Description */}
      {!compact && (
        <div className="relative group">
          <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
          
          <div className="
            absolute top-full right-0 mt-2
            px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg
            opacity-0 group-hover:opacity-100 pointer-events-none
            transition-opacity duration-200 whitespace-nowrap
            z-50 shadow-lg min-w-[300px]
          ">
            <div className="font-semibold mb-1">{config.name} Mode</div>
            <div className="text-xs text-gray-300">{config.description}</div>
            
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Active Features:</div>
              <div className="text-xs space-y-0.5">
                {config.features.multiDocument && <div>• Multi-document creation</div>}
                {config.features.workflowAutomation && <div>• Workflow automation</div>}
                {config.features.knowledgeBase && <div>• Knowledge base access</div>}
                {config.features.canvasHistory && <div>• Canvas version history</div>}
                {config.features.advancedPrompting && <div>• Advanced prompting</div>}
              </div>
            </div>
            
            <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Mode Toggle (Icon-only version for mobile/constrained spaces)
 */
export const CompactModeToggle: React.FC<{ className?: string }> = ({ className }) => {
  return <ModeToggle compact={true} className={className} />;
};
