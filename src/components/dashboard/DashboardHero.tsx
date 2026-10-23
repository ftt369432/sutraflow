import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface DashboardHeroProps {
  greeting: string;
  userName: string;
  isConfigured: boolean;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  greeting,
  userName,
  isConfigured
}) => {
  return (
    <div className="mb-8">
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/50 isolate">
        {/* Dark Energy Wave Pattern */}
        <div className="absolute inset-0 z-0">
          <svg
            className="absolute inset-0 w-full h-full opacity-30"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 1440 320"
          >
            <defs>
              <linearGradient id="wave-grad-dash" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: "#0f172a", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#334155", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              fill="url(#wave-grad-dash)"
              fillOpacity="1"
              d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
            <path
              fill="url(#wave-grad-dash)"
              fillOpacity="0.5"
              d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20" />
        </div>

        {/* Flowing animated wave lines with emerald / teal / cyan energy */}
        <div className="absolute inset-0 overflow-hidden opacity-40 mix-blend-screen">
          <div className="absolute top-0 left-0 w-full h-full">
            <div
              className="absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent transform -translate-x-1/2 animate-wave-1"
              style={{ top: '20%', transform: 'translateX(-50%) rotate(15deg)' }}
            />
            <div
              className="absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent transform -translate-x-1/2 animate-wave-2"
              style={{ top: '40%', transform: 'translateX(-50%) rotate(-10deg)' }}
            />
            <div
              className="absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent transform -translate-x-1/2 animate-wave-3"
              style={{ top: '60%', transform: 'translateX(-50%) rotate(8deg)' }}
            />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sovereign Enclave • RTX 4090 & Cloud Swarm Online</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-200">{userName}</span>! 👋
              </h1>
              <p className="text-slate-300 text-base sm:text-lg mb-4 max-w-2xl font-light leading-relaxed">
                Ready to accelerate California workers' comp research, pleading generation, and forensic audits with SutraFlow.
              </p>
              <div className="flex items-center space-x-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">
                    {isConfigured ? 'Gemini Pro & Local vLLM Active' : 'Configure Gemini API Key'}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl shadow-emerald-500/20 border-2 border-emerald-400/40 bg-slate-950/90 p-1 flex items-center justify-center ring-4 ring-emerald-500/20 group hover:ring-emerald-400/40 transition-all duration-300">
                <img 
                  src="./logos/sutra-logo.svg" 
                  alt="Sutra OS" 
                  className="w-full h-full object-cover rounded-full" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = './logos/nous-sphere-logo.png';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
