import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Car,
  Briefcase,
  Shield,
  Users,
  MapPin,
  Navigation,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Check,
  CheckSquare,
  Play
} from 'lucide-react';

export interface ScheduleEventItem {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  type: string;
  badge: string;
  color: string;
}

export interface ConflictItem {
  id: string;
  severity: string;
  title: string;
  description: string;
  actionA: string;
  actionB: string;
}

export interface ProactiveLogItem {
  id: string;
  time: string;
  text: string;
}

interface LifeInActionScheduleProps {
  scheduleEvents: ScheduleEventItem[];
  pendingConflicts: ConflictItem[];
  proactiveLogs: ProactiveLogItem[];
  onResolveConflict: (id: string, resolution: string) => void;
  onAddLog: (logText: string) => void;
}

export const LifeInActionSchedule: React.FC<LifeInActionScheduleProps> = ({
  scheduleEvents,
  pendingConflicts,
  proactiveLogs,
  onResolveConflict,
  onAddLog
}) => {
  const navigate = useNavigate();
  const [agendaView, setAgendaView] = useState<'day' | 'week'>('day');
  const [commandInput, setCommandInput] = useState('');

  const weekEvents = [
    {
      day: 'Monday, Sep 8',
      events: [
        { time: '09:00 AM', title: 'Client Portfolio Review', type: 'prep' },
        { time: '11:00 AM', title: 'QME Deposition Prep', type: 'hearing' },
        { time: '02:00 PM', title: 'Focus: Penalty Briefs', type: 'focus' }
      ]
    },
    {
      day: 'Tuesday, Sep 9',
      events: [
        { time: '10:00 AM', title: 'WCAB Hearing — Van Nuys', type: 'hearing' },
        { time: '01:30 PM', title: 'Transit -> Downtown Office', type: 'transit' }
      ]
    },
    {
      day: 'Wednesday, Sep 10',
      events: [
        { time: '09:30 AM', title: 'Team Strategy Huddle', type: 'huddle' },
        { time: '02:00 PM', title: 'Medical-Legal Audit', type: 'prep' }
      ]
    },
    {
      day: 'Thursday, Sep 11',
      events: [
        { time: '11:00 AM', title: 'Pleading Compilation', type: 'focus' },
        { time: '03:00 PM', title: 'Mandatory Settlement Conf', type: 'hearing' }
      ]
    },
    {
      day: 'Friday, Sep 12',
      events: [
        { time: '09:00 AM', title: 'Weekly Revenue & Lien Review', type: 'prep' },
        { time: '01:00 PM', title: 'Deep Work: Case Cataloging', type: 'focus' }
      ]
    }
  ];

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onAddLog(`Processed schedule command: "${commandInput.trim()}"`);
    setCommandInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Timeline Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-500" />
                <span>Agenda</span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Your scheduled timeline and events.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                {(['day', 'week'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setAgendaView(view)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      agendaView === view
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {view === 'day' ? 'Today' : '7-Day'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Day View Timeline */}
          {agendaView === 'day' && (
            scheduleEvents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Events Scheduled For Today</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Add events to your calendar or connect external schedules to populate your daily timeline.
                </p>
              </div>
            ) : (
            <div className="relative pl-6 sm:pl-8 border-l border-dashed border-slate-200 dark:border-slate-700 ml-4 sm:ml-6 space-y-8 py-2">
              {scheduleEvents.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <span className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-indigo-500 transition-colors shadow-sm">
                    {event.type === 'prep' && <Brain className="h-3.5 w-3.5 text-indigo-500" />}
                    {event.type === 'transit' && <Car className="h-3.5 w-3.5 text-amber-500" />}
                    {event.type === 'hearing' && <Briefcase className="h-3.5 w-3.5 text-rose-500" />}
                    {event.type === 'focus' && <Shield className="h-3.5 w-3.5 text-emerald-500" />}
                    {event.type === 'huddle' && <Users className="h-3.5 w-3.5 text-sky-500" />}
                  </span>

                  {/* Live Context Tooltip */}
                  <div className="absolute left-[105%] top-0 w-64 p-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none transform -translate-x-2 group-hover:translate-x-0">
                    <h5 className="text-xs font-bold text-white mb-1">{event.title}</h5>
                    <p className="text-[10px] text-slate-300">Strategic AI Summary: {event.description}</p>
                    <div className="mt-2 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                      Click to open Workspace
                    </div>
                  </div>

                  {/* Event Card */}
                  <div
                    className={`p-5 rounded-2xl border ${event.color} hover:shadow-md transition-all duration-200 hover:-translate-x-0.5`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider bg-white/70 dark:bg-slate-900/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                        {event.time}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded">
                        {event.badge}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {event.title}
                    </h4>

                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-700/40 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {event.type === 'transit' || event.type === 'hearing' ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            event.location
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <span>{event.location}</span>
                          <Navigation className="h-3 w-3" />
                        </a>
                      ) : (
                        <span>{event.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )
          )}

          {/* Week View Timeline */}
          {agendaView === 'week' && (
            <div className="space-y-4">
              {weekEvents.map((dayData, idx) => {
                const isToday = dayData.day.toLowerCase().startsWith('mon');
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isToday
                        ? 'border-l-4 border-l-indigo-500 border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/20'
                        : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <h4 className="font-bold text-sm mb-3 pb-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className={isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}>
                        {dayData.day}
                        {isToday && (
                          <span className="ml-2 text-[9px] font-bold uppercase tracking-wider bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </span>
                      <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                        {dayData.events.length} Events
                      </span>
                    </h4>
                    {dayData.events.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">No events scheduled</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {dayData.events.map((e, eIdx) => (
                          <div
                            key={eIdx}
                            className={`bg-white dark:bg-slate-850 p-3 rounded-lg border shadow-sm flex items-center space-x-3 ${
                              e.type === 'prep'
                                ? 'border-l-2 border-l-indigo-400 border-slate-100 dark:border-slate-700/80'
                                : e.type === 'hearing'
                                ? 'border-l-2 border-l-rose-400 border-slate-100 dark:border-slate-700/80'
                                : e.type === 'transit'
                                ? 'border-l-2 border-l-amber-400 border-slate-100 dark:border-slate-700/80'
                                : e.type === 'focus'
                                ? 'border-l-2 border-l-emerald-400 border-slate-100 dark:border-slate-700/80'
                                : 'border-l-2 border-l-sky-400 border-slate-100 dark:border-slate-700/80'
                            }`}
                          >
                            <span className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                              {e.type === 'prep' && <Brain className="h-4 w-4 text-indigo-500" />}
                              {e.type === 'hearing' && <Briefcase className="h-4 w-4 text-rose-500" />}
                              {e.type === 'transit' && <Car className="h-4 w-4 text-amber-500" />}
                              {e.type === 'focus' && <Shield className="h-4 w-4 text-emerald-500" />}
                              {e.type === 'huddle' && <Users className="h-4 w-4 text-sky-500" />}
                            </span>
                            <div>
                              <p className="text-[10px] text-slate-500 font-medium">{e.time}</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{e.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
            {[
              { label: 'Prep', color: 'bg-indigo-500' },
              { label: 'Hearing', color: 'bg-rose-500' },
              { label: 'Focus', color: 'bg-emerald-500' },
              { label: 'Travel', color: 'bg-amber-500' },
              { label: 'Huddle', color: 'bg-sky-500' }
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full inline-block ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Chat-to-Schedule Command Bar */}
        <form onSubmit={handleCommandSubmit} className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-500/20 backdrop-blur-sm mt-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 text-white p-2 rounded-lg shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Ask Genie to adjust your schedule... (e.g. 'Push my prep back 30 mins and text client')"
                className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all"
              />
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 pl-1">
                💡 <strong>How to Master:</strong> Type schedule modifications like <em>'move hearing to 2pm'</em> or <em>'insert transit before huddle'</em>. Genie's Motor Cortex executes updates dynamically.
              </p>
              <button
                type="submit"
                className="absolute right-2 top-1.5 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right Sidebar Details */}
      <div className="space-y-6">
        {/* Tasks - Drag & Drop Pane */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-indigo-500" />
              <span>Tasks</span>
            </h3>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
              Drag to Agenda
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            Drag tasks directly into your agenda timeline or click to view details.
          </p>

          <div className="space-y-3">
            {[
              { id: 't1', title: 'Draft Strategic Plan', desc: 'Synthesize morning meetings into Q3 roadmap.', time: '45m' },
              { id: 't2', title: 'Review Client Dossier', desc: 'Pre-read required for afternoon huddle.', time: '20m' },
              { id: 't3', title: 'Generate Analytics Report', desc: 'Pull data from CRM and format for execs.', time: '30m' }
            ].map((task) => (
              <div
                key={task.id}
                className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 border-l-4 border-l-indigo-400 rounded-lg cursor-grab hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</h4>
                  <span className="text-[9px] font-semibold text-slate-500">{task.time}</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{task.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Auto-Optimizer Status & Adjustments */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>AI Proactive Planner</span>
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <div className="space-y-3.5">
            {proactiveLogs.map((log) => (
              <div key={log.id} className="flex gap-2.5 text-sm">
                <span className="text-xs text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 h-fit rounded border border-indigo-100/50">
                  {log.time}
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  {log.text}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              onAddLog('Scanned calendar for new incoming email attachments and updated travel buffers.');
            }}
            className="w-full mt-5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Scan Calendar & Emails</span>
          </button>
        </div>

        {/* Pending Action Alerts & Conflicts */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6">
          <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-bounce" />
            <span>Pending Conflict Resolutions</span>
          </h3>

          {pendingConflicts.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
              <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500">No pending conflicts detected</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Your schedule is fully optimized!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingConflicts.map((conflict) => (
                <div key={conflict.id} className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        conflict.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {conflict.severity} Priority
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {conflict.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-normal">
                    {conflict.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onResolveConflict(conflict.id, conflict.actionA)}
                      className="py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-colors"
                    >
                      {conflict.actionA}
                    </button>
                    <button
                      onClick={() => onResolveConflict(conflict.id, conflict.actionB)}
                      className="py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {conflict.actionB}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Huddle Action Card */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/30">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <Users className="h-32 w-32" />
          </div>
          <div className="relative z-10 space-y-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-indigo-500 px-2 py-0.5 rounded">
                Live Connection
              </span>
              <h3 className="text-base font-extrabold mt-2">Huddle Room</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                Instantly join your team in the WebRTC meeting room &ldquo;huddle-client-x&rdquo; to collaborate.
              </p>
            </div>
            <button
              onClick={() => navigate('/huddle/huddle-garcia')}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Launch Huddle Meeting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
