/**
 * Power Mode Suggestion Modal
 * 
 * Appears when complexity detected in Auto Mode.
 * Suggests switching to Power Mode for better handling of complex tasks.
 * 
 * Design: Modal dialog with clear explanation and choice buttons
 * 
 * @module components/mode/PowerModeSuggestion
 */

import React, { useEffect, useState } from 'react';
import { Gauge, Sparkles, X, ChevronRight, Zap } from 'lucide-react';
import { useMode } from '../../contexts/ModeContext';

interface PowerModeSuggestionProps {
  /** Optional custom message */
  message?: string;
  
  /** Optional features list to highlight */
  suggestedFeatures?: string[];
}

/**
 * Power Mode Suggestion Modal
 * 
 * Automatically displays when useMode().suggestPowerMode is true.
 * User can accept (switch to Power Mode) or dismiss (stay in current mode).
 * 
 * @example
 * ```tsx
 * // In AIAssistantPageSectioned
 * import { PowerModeSuggestion } from './components/mode/PowerModeSuggestion';
 * 
 * function AIAssistantPage() {
 *   return (
 *     <>
 *       {/* Your page content *\/}
 *       <PowerModeSuggestion />
 *     </>
 *   );
 * }
 * ```
 */
export const PowerModeSuggestion: React.FC<PowerModeSuggestionProps> = ({
  message = 'This looks like a complex task that could benefit from Power Mode features.',
  suggestedFeatures = [
    'Advanced orchestration with Think-Research-Act-Reflect cycle',
    'Multi-document creation and management',
    'Intelligent workflow automation',
    'Deep knowledge base integration',
    'Canvas version history and tracking'
  ]
}) => {
  const { suggestPowerMode, dismissPowerModeSuggestion, setMode } = useMode();
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when modal appears
  useEffect(() => {
    if (suggestPowerMode) {
      setIsAnimating(true);
    }
  }, [suggestPowerMode]);

  if (!suggestPowerMode) {
    return null;
  }

  /**
   * Accept suggestion and switch to Power Mode
   */
  const handleAccept = () => {
    console.log('✅ User accepted Power Mode suggestion');
    setMode('power');
    dismissPowerModeSuggestion();
  };

  /**
   * Dismiss suggestion and stay in current mode
   */
  const handleDismiss = () => {
    console.log('❌ User dismissed Power Mode suggestion');
    dismissPowerModeSuggestion();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black/50 backdrop-blur-sm
          transition-opacity duration-300
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div 
        className={`
          relative w-full max-w-lg mx-4
          bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
          transform transition-all duration-300
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="
            absolute top-4 right-4 p-2 rounded-lg
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors duration-200
          "
          title="Close"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Header with Icons */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Gauge className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Switch to Power Mode?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>

        {/* Features List */}
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-900/10 dark:to-purple-900/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              Power Mode Features
            </h3>
            <ul className="space-y-2">
              {suggestedFeatures.map((feature, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <ChevronRight className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="
                flex-1 px-4 py-3 rounded-lg
                bg-gradient-to-r from-orange-600 to-purple-600
                hover:from-orange-700 hover:to-purple-700
                text-white font-semibold
                transition-all duration-200
                shadow-lg hover:shadow-xl
                flex items-center justify-center gap-2
              "
            >
              <Gauge className="w-5 h-5" />
              Switch to Power Mode
            </button>
            
            <button
              onClick={handleDismiss}
              className="
                flex-1 px-4 py-3 rounded-lg
                bg-gray-100 dark:bg-gray-700
                hover:bg-gray-200 dark:hover:bg-gray-600
                text-gray-700 dark:text-gray-300 font-medium
                transition-colors duration-200
                flex items-center justify-center gap-2
              "
            >
              <Zap className="w-5 h-5" />
              Stay in Simple Mode
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            You can always switch modes using the toggle in the header
          </p>
        </div>
      </div>
    </div>
  );
};
