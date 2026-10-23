/**
 * Mode Status Bar Component
 * 
 * Displays current mode with subtle indicator in the UI.
 * Optional: Shows active features and quick mode info.
 * 
 * @module components/mode/ModeStatusBar
 */

import React, { useState } from 'react';
import { Zap, Sparkles, Gauge, ChevronDown, ChevronUp } from 'lucide-react';
import { useMode } from '../../contexts/ModeContext';

interface ModeStatusBarProps {
  /** Position in layout */
  position?: 'top' | 'bottom';
  
  /** Show expanded info on click */
  expandable?: boolean;
  
  /** Optional className */
  className?: string;
  
  /** Compact mode (icon only) */
  compact?: boolean;
}

/**
 * Mode Status Bar Component
 * 
 * Shows current mode and active features.
 * Can be placed at top or bottom of layout.
 * 
 * @example
 * ```tsx
 * // In AIAssistantPageSectioned footer
 * <ModeStatusBar position="bottom" expandable={true} />
 * 
 * // In header (compact)
 * <ModeStatusBar compact={true} />
 * ```
 */
export const ModeStatusBar: React.FC<ModeStatusBarProps> = ({
  position = 'bottom',
  expandable = false,
  className = '',
  compact = false
}) => {
  const { currentMode, config } = useMode();
  const [isExpanded, setIsExpanded] = useState(false);

  // Mode icon mapping
  const modeIcons = {
    simple: Zap,
    auto: Sparkles,
    power: Gauge
  };

  // Mode colors
  const modeColors = {
    simple: {
      icon: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800'
    },
    auto: {
      icon: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800'
    },
    power: {
      icon: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800'
    }
  };

  const Icon = modeIcons[currentMode];
  const colors = modeColors[currentMode];

  // Count active features
  const activeFeatures = Object.entries(config.features).filter(([_, enabled]) => enabled);

  if (compact) {
    return (
      <div 
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full
          ${colors.bg} ${colors.border} border
          ${className}
        `}
        title={`${config.name} Mode - ${activeFeatures.length} features active`}
      >
        <Icon className={`w-4 h-4 ${colors.icon}`} />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {config.name}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`
        ${position === 'top' ? 'border-b' : 'border-t'}
        border-gray-200 dark:border-gray-700
        bg-gray-50 dark:bg-gray-900/50
        ${className}
      `}
    >
      {/* Main Status Bar */}
      <div 
        className={`
          px-4 py-2 flex items-center justify-between
          ${expandable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50' : ''}
          transition-colors duration-200
        `}
        onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
      >
        {/* Left: Mode Info */}
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${colors.bg}`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {config.name} Mode
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                • {activeFeatures.length} features active
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        {/* Right: Expand Button */}
        {expandable && (
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {/* Expanded Info */}
      {expandable && isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Active Features */}
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Active Features
              </h4>
              <ul className="space-y-1">
                {activeFeatures.map(([feature, _]) => (
                  <li 
                    key={feature}
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                    <span className="capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Execution Config */}
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Execution
              </h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                  Orchestration: {config.execution.orchestration}
                </li>
                <li className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                  Canvas: {config.ui.canvasType}
                </li>
                <li className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                  Tool chain: depth {config.execution.maxToolChainDepth}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
