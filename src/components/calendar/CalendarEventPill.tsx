import React from 'react';
import { motion } from 'framer-motion';
import { useCalendarStore, CalendarEvent } from '../../store/calendarStore';
import { useTheme } from '../../contexts/ThemeContext';

const EVENT_COLORS_DARK: Record<string, { pill: string; dot: string }> = {
  'court-date':   { pill: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-300',      dot: 'bg-red-400' },
  deposition:     { pill: 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-300', dot: 'bg-orange-400' },
  qme:            { pill: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-300', dot: 'bg-purple-400' },
  transit:        { pill: 'from-sky-500/20 to-cyan-500/10 border-sky-500/30 text-sky-300',       dot: 'bg-sky-400' },
  preparation:    { pill: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-300', dot: 'bg-teal-400' },
  deep_work:      { pill: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-300', dot: 'bg-indigo-400' },
  meeting:        { pill: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300',    dot: 'bg-blue-400' },
  default:        { pill: 'from-white/10 to-white/5 border-white/20 text-white/70',               dot: 'bg-white/50' },
};

const EVENT_COLORS_LIGHT: Record<string, { pill: string; dot: string }> = {
  'court-date':   { pill: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100', dot: 'bg-red-500' },
  deposition:     { pill: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100', dot: 'bg-orange-500' },
  qme:            { pill: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100', dot: 'bg-purple-500' },
  transit:        { pill: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100', dot: 'bg-sky-500' },
  preparation:    { pill: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100', dot: 'bg-teal-500' },
  deep_work:      { pill: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100', dot: 'bg-indigo-500' },
  meeting:        { pill: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100', dot: 'bg-blue-500' },
  default:        { pill: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100', dot: 'bg-slate-500' },
};

export function getEventColors(eventType?: string, isDark?: boolean) {
  const key = (eventType || '').toLowerCase();
  const colors = isDark ? EVENT_COLORS_DARK : EVENT_COLORS_LIGHT;
  return colors[key] ?? colors['default'];
}

interface CalendarEventPillProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  compact?: boolean;
}

export function CalendarEventPill({ event, onClick, compact = false }: CalendarEventPillProps) {
  const { isDark } = useTheme();
  const colors = getEventColors(event.eventType || event.tags?.[0], isDark);
  const eventDate = event.start || event.startDate;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={`
        cursor-pointer rounded-md border backdrop-blur-sm
        ${isDark ? 'bg-gradient-to-r' : ''}
        ${colors.pill}
        ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}
        truncate flex items-center gap-1 transition-all duration-150
      `}
    >
      <span className={`shrink-0 rounded-full ${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${colors.dot}`} />
      <span className="truncate font-medium">
        {eventDate && !compact && (
          <span className="opacity-70 mr-1">
            {new Date(eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {event.title}
      </span>
    </motion.div>
  );
}
