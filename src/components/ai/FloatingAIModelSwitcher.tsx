/**
 * Floating AI Model Switcher Button
 * Quick access model switcher that floats on the screen
 */

import React, { useState } from 'react';
import { AIModelSwitcher } from './AIModelSwitcher';

interface FloatingAIModelSwitcherProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const FloatingAIModelSwitcher: React.FC<FloatingAIModelSwitcherProps> = ({
    position = 'bottom-right'
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4'
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-50`}>
            {isExpanded ? (
                <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 w-80">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">Switch AI Model</h3>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <AIModelSwitcher compact={false} showDescription={true} />
                </div>
            ) : (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    title="Switch AI Model"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-sm font-medium opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden whitespace-nowrap">
                        AI Model
                    </span>
                </button>
            )}
        </div>
    );
};

export default FloatingAIModelSwitcher;
