/**
 * AI Assistant Widget - Supercharged with Gemini Integration
 * 
 * Beautiful widget showing Gemini AI status and quick access.
 * Uses our useGemini hook and follows design guidelines.
 */

import React, { useState } from 'react';
import { MessageSquare, Bot, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGemini } from '../../hooks/useGemini';
import { Button } from '../ui/Button';

export function AIAssistantWidget() {
  const navigate = useNavigate();
  const { 
    generateResponse, 
    response, 
    isLoading, 
    isStreaming, 
    conversation,
    isConfigured 
  } = useGemini();
  
  const [quickPrompt, setQuickPrompt] = useState('');

  const handleQuickChat = async () => {
    if (!quickPrompt.trim() || !isConfigured) return;
    
    await generateResponse(quickPrompt);
    setQuickPrompt('');
  };

  const quickPrompts = [
    "What can you help me with today?",
    "Generate a creative idea",
    "Help me plan my day",
    "Summarize my recent activity"
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Gemini AI Assistant</h3>
            <p className="text-sm text-gray-600">
              {isConfigured ? 'Ready to help' : 'Setup required'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500">
            {isConfigured ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{conversation.length}</div>
          <div className="text-xs text-gray-600">Conversations</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {conversation.reduce((acc, msg) => acc + (msg.role === 'assistant' ? 1 : 0), 0)}
          </div>
          <div className="text-xs text-gray-600">AI Responses</div>
        </div>
      </div>

      {/* Quick Chat */}
      {isConfigured && (
        <div className="mb-4">
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              placeholder="Ask Gemini anything..."
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickChat()}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={handleQuickChat}
              disabled={!quickPrompt.trim() || isLoading}
              size="sm"
              className="px-3"
            >
              {isLoading ? <Zap className="h-4 w-4 animate-pulse" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex flex-wrap gap-1 mb-3">
            {quickPrompts.slice(0, 2).map((prompt, index) => (
              <button
                key={index}
                onClick={() => setQuickPrompt(prompt)}
                className="text-xs bg-white bg-opacity-60 hover:bg-opacity-80 px-2 py-1 rounded-md text-gray-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Response Preview */}
          {(response || isStreaming) && (
            <div className="bg-white bg-opacity-80 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <Bot className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">
                  {isStreaming ? 'Gemini is thinking...' : 'Gemini says:'}
                </span>
              </div>
              <p className="text-sm text-gray-800 line-clamp-3">
                {response || 'Generating response...'}
              </p>
              {isStreaming && (
                <div className="flex items-center space-x-1 mt-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={() => navigate('/ai-assistant')}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Open Full Chat
        </Button>
        
        {!isConfigured && (
          <Button
            onClick={() => navigate('/settings')}
            variant="outline"
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Configure Gemini
          </Button>
        )}
      </div>

      {/* Recent Activity Preview */}
      {conversation.length > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Recent Chat</div>
          <div className="space-y-1">
            {conversation.slice(-2).map((msg, index) => (
              <div key={index} className="text-xs text-gray-600 truncate">
                <span className="font-medium">
                  {msg.role === 'user' ? 'You:' : 'AI:'}
                </span>
                <span className="ml-1">{msg.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 