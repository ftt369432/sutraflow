/**
 * Welcome Widget - Supercharged Version
 * 
 * Beautiful welcome component with dynamic greetings and quick actions.
 * Follows design guidelines with Tailwind CSS and Lucide icons.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bot, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function WelcomeWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  const tips = [
    "Try asking Gemini to help plan your day",
    "Use the Canvas for creative AI-powered designs",
    "Organize your knowledge with AI assistance",
    "Create custom AI assistants for specific tasks"
  ];

  const todaysTip = tips[new Date().getDate() % tips.length];

  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/50 isolate">
      {/* Dark Energy Wave Pattern */}
      <div className="absolute inset-0 z-0">
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <defs>
            <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: "#0f172a", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#334155", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path fill="url(#wave-grad)" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="url(#wave-grad)" fillOpacity="0.5" d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        {/* Subtle grid overlay for tech feel */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  {greeting}, {userName}! 👋
                </h2>
                <p className="text-slate-300 text-lg">
                  Ready to supercharge your productivity?
                </p>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium">Tip of the Day</span>
              </div>
              <p className="text-white text-opacity-90">{todaysTip}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/ai-assistant')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm border-white border-opacity-30 text-white"
                variant="outline"
              >
                <Bot className="h-4 w-4 mr-2" />
                Chat with AI
              </Button>

              <Button
                onClick={() => navigate('/canvas')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm border-white border-opacity-30 text-white"
                variant="outline"
              >
                <Zap className="h-4 w-4 mr-2" />
                Create
              </Button>

              <Button
                onClick={() => navigate('/assistants')}
                className="bg-white text-slate-900 hover:bg-opacity-90"
              >
                <span>Explore Features</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Welcome Stats */}
          <div className="hidden lg:block ml-8">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center min-w-[120px]">
                <div className="text-2xl font-bold">47</div>
                <div className="text-sm text-white text-opacity-80">AI Chats</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">23</div>
                <div className="text-sm text-white text-opacity-80">Projects</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">156</div>
                <div className="text-sm text-white text-opacity-80">Ideas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white border-opacity-20">
          <div className="flex items-center space-x-4 text-sm text-white text-opacity-80">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Gemini AI Online</span>
            </div>
            <div>•</div>
            <div>Last activity: 2 minutes ago</div>
          </div>

          <div className="text-sm text-white text-opacity-60">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 