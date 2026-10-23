import React from 'react';
import { Sparkles, GraduationCap, Video, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AcademyMarketingBannerProps {
  onDismiss?: () => void;
}

export const AcademyMarketingBanner: React.FC<AcademyMarketingBannerProps> = ({ onDismiss }) => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border border-indigo-500/30 p-5 shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Weekly Masterclass
              </span>
              <span className="text-xs text-indigo-300">Live Every Saturday @ 10:00 AM PST</span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-white mt-1">
              Mastering California WCAB Automation & Local RTX 4090 Zero-PHI Inference
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Join 150+ attorneys and hearing reps in our live weekly hands-on workshop. Practice 500-page medical chronologies and 28-line penalty drafting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            onClick={() => navigate('/academy')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-950 flex items-center gap-1.5 transition-all"
          >
            <span>Explore Academy & Live Sessions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
