/**
 * AI Model Switcher Component
 * Allows dynamic switching between AI providers and models
 */

import React, { useState, useEffect } from 'react';
import { switchAIProvider, getCurrentAIProvider, AIProvider } from '../../services/ai/aiServiceFactory';
import { getEnv, updateEnvConfig } from '../../config/env';

interface ModelOption {
    provider: AIProvider;
    model: string;
    name: string;
    description: string;
    icon: string;
    tier: 'free' | 'paid';
    speed: 'fast' | 'medium' | 'slow';
}

const AVAILABLE_MODELS: ModelOption[] = [
    {
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient - Best for free tier',
        icon: '⚡',
        tier: 'free',
        speed: 'fast'
    },
    {
        provider: 'gemini',
        model: 'gemini-1.5-flash-8b',
        name: 'Gemini 1.5 Flash 8B',
        description: 'Ultra-fast, smaller model',
        icon: '🚀',
        tier: 'free',
        speed: 'fast'
    },
    {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable, lower rate limits',
        icon: '🎯',
        tier: 'free',
        speed: 'medium'
    },
    {
        provider: 'gemini',
        model: 'gemini-pro',
        name: 'Gemini Pro (Legacy)',
        description: 'Original Gemini model',
        icon: '📚',
        tier: 'free',
        speed: 'medium'
    },
    {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        description: 'Powerful open-source model',
        icon: '🦙',
        tier: 'free',
        speed: 'fast'
    },
    {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        description: 'Lightning fast responses',
        icon: '⚡',
        tier: 'free',
        speed: 'fast'
    },
    {
        provider: 'groq',
        model: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Large context window',
        icon: '🎨',
        tier: 'free',
        speed: 'fast'
    },
    {
        provider: 'claude',
        model: 'claude-3-5-sonnet-20240620',
        name: 'Claude 3.5 Sonnet',
        description: 'Advanced reasoning and document editing',
        icon: '🎭',
        tier: 'paid',
        speed: 'medium'
    }
];

interface AIModelSwitcherProps {
    compact?: boolean;
    showDescription?: boolean;
    className?: string;
}

export const AIModelSwitcher: React.FC<AIModelSwitcherProps> = ({
    compact = false,
    showDescription = true,
    className = ''
}) => {
    const [currentProvider, setCurrentProvider] = useState<AIProvider>('groq');
    const [currentModel, setCurrentModel] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);

    useEffect(() => {
        // Get current configuration
        const env = getEnv();
        setCurrentProvider(getCurrentAIProvider() || env.aiProvider as AIProvider);
        setCurrentModel(env.aiModel);
    }, []);

    const handleModelSwitch = async (option: ModelOption) => {
        setIsSwitching(true);

        try {
            // Update environment config
            updateEnvConfig({
                aiProvider: option.provider,
                aiModel: option.model
            });

            // Switch the provider
            switchAIProvider(option.provider);

            // Update state
            setCurrentProvider(option.provider);
            setCurrentModel(option.model);
            setIsOpen(false);

            // Show success notification
            console.log(`✅ Switched to ${option.name}`);

            // Optional: Show toast notification if you have a toast system
            if ((window as any).showToast) {
                (window as any).showToast(`Switched to ${option.name}`, 'success');
            }
        } catch (error) {
            console.error('Failed to switch model:', error);
        } finally {
            setIsSwitching(false);
        }
    };

    const currentOption = AVAILABLE_MODELS.find(
        m => m.provider === currentProvider && m.model === currentModel
    ) || AVAILABLE_MODELS[0];

    const groupedModels = AVAILABLE_MODELS.reduce((acc, model) => {
        if (!acc[model.provider]) {
            acc[model.provider] = [];
        }
        acc[model.provider].push(model);
        return acc;
    }, {} as Record<string, ModelOption[]>);

    if (compact) {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
                    disabled={isSwitching}
                >
                    <span className="text-lg">{currentOption.icon}</span>
                    <span className="text-sm font-medium text-white">{currentOption.name}</span>
                    <svg
                        className={`w-4 h-4 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
                            {Object.entries(groupedModels).map(([provider, models]) => (
                                <div key={provider} className="border-b border-white/10 last:border-b-0">
                                    <div className="px-4 py-2 bg-white/5">
                                        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                                            {provider}
                                        </span>
                                    </div>
                                    {models.map((option) => (
                                        <button
                                            key={`${option.provider}-${option.model}`}
                                            onClick={() => handleModelSwitch(option)}
                                            className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${option.provider === currentProvider && option.model === currentModel
                                                    ? 'bg-blue-500/20 border-l-2 border-blue-500'
                                                    : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl">{option.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-white">{option.name}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${option.speed === 'fast' ? 'bg-green-500/20 text-green-300' :
                                                                option.speed === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                    'bg-red-500/20 text-red-300'
                                                            }`}>
                                                            {option.speed}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-white/60 mt-1">{option.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Full card view
    return (
        <div className={`bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">AI Model</h3>
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    {currentProvider.toUpperCase()}
                </span>
            </div>

            <div className="space-y-3">
                {Object.entries(groupedModels).map(([provider, models]) => (
                    <div key={provider}>
                        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                            {provider}
                        </h4>
                        <div className="space-y-2">
                            {models.map((option) => (
                                <button
                                    key={`${option.provider}-${option.model}`}
                                    onClick={() => handleModelSwitch(option)}
                                    disabled={isSwitching}
                                    className={`w-full p-3 rounded-lg border transition-all text-left ${option.provider === currentProvider && option.model === currentModel
                                            ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{option.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-white">{option.name}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${option.speed === 'fast' ? 'bg-green-500/20 text-green-300' :
                                                        option.speed === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                            'bg-red-500/20 text-red-300'
                                                    }`}>
                                                    {option.speed}
                                                </span>
                                            </div>
                                            {showDescription && (
                                                <p className="text-xs text-white/60">{option.description}</p>
                                            )}
                                        </div>
                                        {option.provider === currentProvider && option.model === currentModel && (
                                            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {isSwitching && (
                <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-white/70">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Switching model...
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIModelSwitcher;
