import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Plus, Search, Settings, X, Clock, MapPin, Users,
  Zap, List, LayoutGrid, Trash2, CheckSquare, Square, Sparkles
} from 'lucide-react';
import { useCalendarStore, CalendarEvent } from '../../store/calendarStore';
import { EnhancedCalendarEventModal } from './EnhancedCalendarEventModal';
import { CalendarEventPill, getEventColors } from './CalendarEventPill';
import { TaskDefinition } from '../../services/calendar/EmailEventAnalyzer';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

type ViewMode = 'month' | 'week' | 'agenda';

interface Props { className?: string; }

export function EnhancedCalendarView({ className = '' }: Props) {
  const [date, setDate]           = useState(new Date());
  const [view, setView]           = useState<ViewMode>('month');
  const [panelOpen, setPanelOpen] = useState(true);
  const [selected, setSelected]   = useState<CalendarEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery]         = useState('');
  const [selectedTodayIds, setSelectedTodayIds] = useState<string[]>([]);
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('calendar_smart_panel_width');
    return saved ? Math.max(240, Math.min(650, parseInt(saved, 10))) : 320;
  });
  const [isResizingPanel, setIsResizingPanel] = useState(false);

  const { events, addEvent, updateEvent, deleteEvent, deleteMultipleEvents, deduplicateEvents } = useCalendarStore();
  const { isDark } = useTheme();

  // Mouse drag handler for Smart Panel resizing
  useEffect(() => {
    if (!isResizingPanel) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 220 && newWidth <= 700) {
        setPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizingPanel(false);
      localStorage.setItem('calendar_smart_panel_width', panelWidth.toString());
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPanel, panelWidth]);

  const today = new Date();

  const isToday = (d: Date) =>
    d.toDateString() === today.toDateString();

  const generateDays = () => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const eventsFor = (d: Date) =>
    events.filter(e => {
      const start = e.start || e.startDate;
      if (!start) return false;
      const startD = typeof start === 'string' ? new Date(start) : start;
      return startD.toDateString() === d.toDateString();
    });

  const filtered = events.filter(e =>
    !query ||
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.description?.toLowerCase().includes(query.toLowerCase()) ||
    e.location?.toLowerCase().includes(query.toLowerCase())
  );

  const handleEventSave = (eventData: CalendarEvent, _tasks: TaskDefinition[]) => {
    if (selected) {
      updateEvent(selected.id, eventData);
    } else {
      addEvent({
        title: eventData.title,
        description: eventData.description,
        start: eventData.start || eventData.startDate || new Date(),
        end: eventData.end || eventData.endDate || new Date(Date.now() + 3600000),
        allDay: eventData.allDay || false,
        sourceId: 'primary',
        location: eventData.location,
        attendees: eventData.attendees || [],
        tags: eventData.tags || [],
      });
    }
    setShowModal(false);
    setSelected(null);
  };

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
    setShowModal(false);
    setSelected(null);
  };

  const calDays = generateDays();
  const todayEvents = eventsFor(today);

  const handleToggleSelectAllToday = () => {
    if (selectedTodayIds.length === todayEvents.length && todayEvents.length > 0) {
      setSelectedTodayIds([]);
    } else {
      setSelectedTodayIds(todayEvents.map((e) => e.id));
    }
  };

  const handleToggleEventSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTodayIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedToday = () => {
    if (selectedTodayIds.length === 0) return;
    deleteMultipleEvents(selectedTodayIds);
    setSelectedTodayIds([]);
  };

  const handleDeduplicate = () => {
    deduplicateEvents();
    setSelectedTodayIds([]);
  };

  // ─── Theme-Specific Styles ───────────────────────────────────────────────
  const outerBg = isDark
    ? 'linear-gradient(135deg, #0a0b1a 0%, #111228 60%, #0d0e20 100%)'
    : '#f8fafc'; // light slate-50

  const headerBg = isDark ? 'bg-white/[0.02]' : 'bg-white shadow-sm';
  const borderClass = isDark ? 'border-white/[0.06]' : 'border-slate-200';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const mutedTextClass = isDark ? 'text-white/30' : 'text-slate-400';
  const subtitleClass = isDark ? 'text-white/70' : 'text-slate-600';

  const ghostBtn = isDark
    ? `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-150`
    : `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150`;

  const inputClass = isDark
    ? 'bg-white/[0.05] border-white/[0.08] text-white/80 placeholder-white/30 focus:border-indigo-500/40'
    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/40';

  const dayCellClass = (inMonth: boolean, isT: boolean) => {
    if (isDark) {
      return cn(
        'rounded-xl border p-2 min-h-[100px] cursor-pointer transition-all duration-150 group',
        inMonth
          ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
          : 'border-transparent bg-white/[0.01] opacity-40',
        isT && 'border-indigo-500/40 bg-indigo-500/[0.07] ring-1 ring-indigo-500/20'
      );
    } else {
      return cn(
        'rounded-xl border p-2 min-h-[100px] cursor-pointer transition-all duration-150 group shadow-sm',
        inMonth
          ? 'border-slate-100 bg-white hover:bg-slate-50/50'
          : 'border-transparent bg-slate-50/30 opacity-40',
        isT && 'border-blue-500/60 bg-blue-50/50 ring-1 ring-blue-500/20'
      );
    }
  };

  const dayNumberClass = (isT: boolean, inMonth: boolean) => {
    if (isDark) {
      return cn(
        'text-xs font-semibold mb-1.5 flex items-center justify-center w-6 h-6 rounded-full mx-auto',
        isT ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50' : 'text-white/50 group-hover:text-white/80'
      );
    } else {
      return cn(
        'text-xs font-semibold mb-1.5 flex items-center justify-center w-6 h-6 rounded-full mx-auto',
        isT ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50' : inMonth ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-400'
      );
    }
  };

  const rightPanelClass = isDark
    ? 'border-l border-white/[0.06] bg-white/[0.02] backdrop-blur-xl'
    : 'border-l border-slate-200 bg-white shadow-xl';

  return (
    <div className={cn('flex h-full overflow-hidden', textClass, className)}
         style={{ background: outerBg }}>

      {/* ═══ MAIN AREA ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* ── Header ── */}
        <div className={cn('flex items-center justify-between px-5 py-3 border-b shrink-0', headerBg, borderClass)}>
          {/* Left: title + nav */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-lg border',
                isDark ? 'bg-blue-600/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
              )}>
                <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/70 bg-clip-text text-transparent">
                Sovereign Calendar
              </span>
            </div>

            <div className="flex items-center gap-1 ml-3">
              <button className={ghostBtn} onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-sm font-semibold min-w-[140px] text-center select-none">
                {MONTHS[date.getMonth()]} {date.getFullYear()}
              </span>
              <button className={ghostBtn} onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button className={ghostBtn} onClick={() => setDate(new Date())}>
                Today
              </button>
            </div>
          </div>

          {/* Right: view toggles + search + actions */}
          <div className="flex items-center gap-2">
            <div className={cn('flex items-center rounded-lg border overflow-hidden',
              isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
            )}>
              {(['month','week','agenda'] as ViewMode[]).map(m => (
                <button key={m} onClick={() => setView(m)}
                  className={cn('px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-150',
                    view === m
                      ? (isDark ? 'bg-blue-600/20 text-blue-300 border-x border-blue-500/20' : 'bg-white text-blue-600 shadow-sm border-x border-slate-200')
                      : (isDark ? 'text-white/50 hover:text-white/80' : 'text-slate-500 hover:text-slate-800')
                  )}>
                  {m}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className={cn('absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5',
                isDark ? 'text-white/30' : 'text-slate-400'
              )} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search events…"
                className={cn('pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none w-52 transition-all', inputClass)}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setSelected(null); setShowModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              New Event
            </motion.button>

            <button onClick={() => setPanelOpen(p => !p)} className={ghostBtn}>
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Calendar Grid (Month) ── */}
        {view === 'month' && (
          <div className="flex-1 p-4 overflow-auto">
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className={cn('text-center text-[10px] font-bold uppercase tracking-widest py-1', mutedTextClass)}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1 h-[calc(100%-2rem)]">
              {calDays.map((day, i) => {
                const dayEvts = eventsFor(day);
                const inMonth = day.getMonth() === date.getMonth();
                const isT = isToday(day);
                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.01 }}
                    className={dayCellClass(inMonth, isT)}
                  >
                    <div className={dayNumberClass(isT, inMonth)}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvts.slice(0, 3).map(evt => (
                        <CalendarEventPill
                          key={evt.id}
                          event={evt}
                          onClick={e => { setSelected(e); setShowModal(true); }}
                          compact
                        />
                      ))}
                      {dayEvts.length > 3 && (
                        <div className={cn('text-[10px] pl-1 font-medium', mutedTextClass)}>
                          +{dayEvts.length - 3} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Agenda View ── */}
        {view === 'agenda' && (
          <div className="flex-1 p-4 overflow-auto space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-40">
                <CalendarIcon className="h-12 w-12 mb-3 text-slate-400" />
                <p className="text-sm font-medium">No events found</p>
                <p className="text-xs mt-1">
                  {query ? 'Try different search terms' : 'Create your first event to get started'}
                </p>
              </div>
            ) : (
              filtered.map(evt => {
                const colors = getEventColors(evt.eventType || evt.tags?.[0], isDark);
                return (
                  <motion.div
                    key={evt.id}
                    whileHover={{ x: 3 }}
                    onClick={() => { setSelected(evt); setShowModal(true); }}
                    className={cn('flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all group',
                      isDark
                        ? 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 shadow-sm'
                    )}
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-800')}>{evt.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 dark:text-white/40">
                        {(() => {
                          const eventDate = evt.start || evt.startDate;
                          if (!eventDate) return null;
                          const dateObj = new Date(eventDate);
                          return (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />
                              {dateObj.toLocaleDateString()} · {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          );
                        })()}
                        {evt.location && (
                          <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{evt.location}</span>
                        )}
                        {evt.attendees?.length > 0 && (
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{evt.attendees.length}</span>
                        )}
                      </div>
                    </div>
                    {evt.metadata?.caseNumber && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 shrink-0">
                        {evt.metadata.caseNumber}
                      </span>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Week view placeholder ── */}
        {view === 'week' && (
          <div className="flex-1 flex items-center justify-center opacity-40">
            <div className="text-center">
              <LayoutGrid className="h-10 w-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Week view coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT PANEL ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: panelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: isResizingPanel ? 0 : 0.2, ease: 'easeInOut' }}
            className={cn('overflow-hidden flex flex-col relative select-none', rightPanelClass)}
            style={{ width: `${panelWidth}px`, minWidth: '220px', maxWidth: '700px' }}
          >
            {/* Draggable Left Resize Handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingPanel(true);
              }}
              onDoubleClick={() => setPanelWidth(320)}
              title="Drag to resize Smart Panel (double-click to reset)"
              className="w-2 hover:w-3 cursor-col-resize absolute left-0 top-0 bottom-0 z-30 flex items-center justify-center transition-all bg-transparent hover:bg-indigo-500/30 group"
            >
              <div className="w-0.5 h-8 bg-slate-400/40 dark:bg-white/20 rounded-full group-hover:bg-indigo-400 group-hover:h-12 transition-all" />
            </div>

            {/* Panel header */}
            <div className={cn('flex items-center justify-between px-4 py-3 border-b', borderClass)}>
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">Smart Panel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDeduplicate}
                  title="Purge duplicate events across entire calendar"
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Deduplicate</span>
                </button>
                <button onClick={() => setPanelOpen(false)} className="opacity-40 hover:opacity-80 transition-colors ml-1 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-5 overflow-y-auto flex-1">
              {/* Today's events with Select All & Bulk Delete */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest', mutedTextClass)}>Today</p>
                    {todayEvents.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {todayEvents.length}
                      </span>
                    )}
                  </div>

                  {todayEvents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleSelectAllToday}
                        className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer select-none"
                      >
                        {selectedTodayIds.length === todayEvents.length && todayEvents.length > 0 ? (
                          <>
                            <CheckSquare className="w-3 h-3 text-blue-500" />
                            <span>Deselect</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3 h-3 opacity-60" />
                            <span>Select All</span>
                          </>
                        )}
                      </button>

                      {selectedTodayIds.length > 0 && (
                        <button
                          type="button"
                          onClick={handleDeleteSelectedToday}
                          className="px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Delete selected events"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete ({selectedTodayIds.length})</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {todayEvents.length === 0 ? (
                  <p className="text-xs opacity-50">No events today</p>
                ) : (
                  <div className="space-y-1.5">
                    {todayEvents.map(e => {
                      const isSelected = selectedTodayIds.includes(e.id);
                      return (
                        <div key={e.id} className="group relative flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(ev) => handleToggleEventSelect(e.id, ev)}
                            className="p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                            title={isSelected ? 'Deselect event' : 'Select event'}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <CalendarEventPill
                              event={e}
                              onClick={ev => { setSelected(ev); setShowModal(true); }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              deleteEvent(e.id);
                              setSelectedTodayIds(prev => prev.filter(id => id !== e.id));
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                            title="Delete this event"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div>
                <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2', mutedTextClass)}>Quick Actions</p>
                <div className="space-y-1.5">
                  {[
                    { icon: Plus, label: 'New Event', action: () => { setSelected(null); setShowModal(true); } },
                    { icon: CalendarIcon, label: 'Sync Google Calendar', action: () => {} },
                    { icon: Settings, label: 'Calendar Settings', action: () => {} },
                  ].map(({ icon: Icon, label, action }) => (
                    <button key={label} onClick={action}
                      className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                        isDark
                          ? 'text-white/50 hover:text-white hover:bg-white/[0.06] border-transparent hover:border-white/[0.08]'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-transparent hover:border-slate-200 shadow-sm bg-white'
                      )}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar legend */}
              <div>
                <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2', mutedTextClass)}>Legend</p>
                <div className="space-y-1.5">
                  {[
                    { type: 'court-date', label: 'Court Hearings' },
                    { type: 'deposition', label: 'Depositions' },
                    { type: 'qme', label: 'QME / Medical' },
                    { type: 'transit', label: 'Travel Buffers' },
                    { type: 'preparation', label: 'Prep Blocks' },
                    { type: 'deep_work', label: 'Deep Work' },
                  ].map(({ type, label }) => {
                    const c = getEventColors(type, isDark);
                    return (
                      <div key={type} className="flex items-center gap-2 text-xs opacity-80">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Event Modal ── */}
      {showModal && (
        <EnhancedCalendarEventModal
          isOpen={showModal}
          event={selected}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={handleEventSave}
          onDelete={selected ? () => handleDelete(selected.id) : undefined}
        />
      )}
    </div>
  );
}
