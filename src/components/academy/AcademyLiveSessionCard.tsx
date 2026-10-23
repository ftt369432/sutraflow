import React, { useState } from 'react';
import { Calendar, Clock, Video, Users, Check, ArrowUpRight } from 'lucide-react';
import { LiveMasterclass } from '../../services/academyService';

interface AcademyLiveSessionCardProps {
  session: LiveMasterclass;
  onJoinSession?: (session: LiveMasterclass) => void;
}

export const AcademyLiveSessionCard: React.FC<AcademyLiveSessionCardProps> = ({
  session,
  onJoinSession,
}) => {
  const [isRsvp, setIsRsvp] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-indigo-950/30 to-slate-900/90 border border-indigo-500/20 p-6 shadow-xl hover:border-indigo-500/40 transition-all">
      <div className="absolute top-0 right-0 p-4">
        {session.status === 'live' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            LIVE NOW
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar className="w-3.5 h-3.5" />
            {session.date}
          </span>
        )}
      </div>

      <div className="pr-20">
        <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{session.title}</h3>
        <p className="text-xs text-indigo-300 font-medium mt-1">
          {session.instructor} • <span className="text-slate-400">{session.role}</span>
        </p>
      </div>

      <p className="text-sm text-slate-300 mt-3 leading-relaxed">{session.description}</p>

      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{session.timePST}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{session.attendeeCount + (isRsvp ? 1 : 0)} Registered</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRsvp(!isRsvp)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isRsvp
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            {isRsvp ? (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> RSVP Confirmed
              </span>
            ) : (
              '1-Click RSVP'
            )}
          </button>

          {onJoinSession && (
            <button
              onClick={() => onJoinSession(session)}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-900/30 flex items-center gap-1.5 transition-all"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{session.status === 'live' ? 'Enter Live Room' : 'Open Live Huddle'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
