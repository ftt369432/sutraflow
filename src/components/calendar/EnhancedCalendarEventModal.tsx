import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Clock, MapPin, User, Tag, Flag, Edit3, Trash2, Check } from 'lucide-react';
import { CalendarEvent } from '../../store/calendarStore';
import { TaskDefinition } from '../../services/calendar/EmailEventAnalyzer';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

interface Props {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent, tasks: TaskDefinition[]) => void | Promise<void>;
  onDelete?: (eventId: string) => void | Promise<void>;
  existingTasks?: TaskDefinition[];
}

const toDatetimeLocal = (d?: Date | string | null): string => {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const formatDisplay = (d?: Date | string | null): string => {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const PRIORITY_STYLES_DARK: Record<string, string> = {
  low:    'bg-green-500/10 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
};
const PRIORITY_STYLES_LIGHT: Record<string, string> = {
  low:    'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high:   'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export const EnhancedCalendarEventModal: React.FC<Props> = ({
  event, isOpen, onClose, onSave, onDelete, existingTasks = []
}) => {
  const { isDark } = useTheme();
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setEditedEvent({ ...event });
      setTasks([...existingTasks]);
      setIsEditing(!event.id);
    }
  }, [event, existingTasks]);

  if (!isOpen || !editedEvent) return null;

  const startDate = editedEvent.start || editedEvent.startDate;
  const endDate   = editedEvent.end   || editedEvent.endDate;

  const handleSave = async () => {
    if (!editedEvent) return;
    setSaving(true);
    try { await onSave(editedEvent, tasks); onClose(); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const t: TaskDefinition = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: '',
      offsetDays: 0,
      priority: 'medium',
      estimatedDuration: 60,
      assignee: undefined,
      reminders: [],
      category: 'general',
    };
    setTasks(prev => [...prev, t]);
    setNewTaskTitle('');
    setAddingTask(false);
  };

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const overlay   = isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/40';
  const card      = isDark
    ? 'bg-[#12132a] border border-white/[0.08] text-white shadow-2xl shadow-black/60'
    : 'bg-white border border-slate-200 text-slate-800 shadow-2xl';
  const divider   = isDark ? 'border-white/[0.06]' : 'border-slate-200';
  const label     = isDark ? 'text-white/50' : 'text-slate-500';
  const inputCls  = isDark
    ? 'bg-white/[0.05] border-white/[0.10] text-white placeholder-white/30 focus:border-indigo-500/50 focus:bg-white/[0.08]'
    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-indigo-500';
  const sectionBg = isDark ? 'bg-white/[0.03]' : 'bg-slate-50';
  const taskCard  = isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-200';
  const ghostBtn  = isDark
    ? 'p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all'
    : 'p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all';
  const footerBg  = isDark ? 'bg-white/[0.02]' : 'bg-slate-50';
  const priorityColors = isDark ? PRIORITY_STYLES_DARK : PRIORITY_STYLES_LIGHT;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={cn('fixed inset-0 flex items-center justify-center z-50 p-4', overlay)}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            className={cn('rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden', card)}
          >
            {/* Header */}
            <div className={cn('flex items-center justify-between px-6 py-4 border-b', divider)}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg',
                  isDark ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                )}>
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-base font-bold">
                  {editedEvent.id ? 'Event Details' : 'New Event'}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {editedEvent.id && (
                  <button onClick={() => setIsEditing(!isEditing)} className={ghostBtn} title="Edit">
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
                <button onClick={onClose} className={ghostBtn}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {/* Event fields */}
              <div className={cn('p-6 border-b space-y-5', divider)}>
                {/* Title */}
                <div>
                  <label className={cn('block text-xs font-semibold uppercase tracking-wider mb-1.5', label)}>Title</label>
                  {isEditing ? (
                    <input
                      value={editedEvent.title}
                      onChange={e => setEditedEvent({ ...editedEvent, title: e.target.value })}
                      placeholder="Event title"
                      className={cn('w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all', inputCls)}
                    />
                  ) : (
                    <p className="text-sm font-semibold">{editedEvent.title}</p>
                  )}
                </div>

                {/* Start / End */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn('block text-xs font-semibold uppercase tracking-wider mb-1.5', label)}>Start</label>
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        value={toDatetimeLocal(startDate)}
                        onChange={e => setEditedEvent({ ...editedEvent, start: new Date(e.target.value), startDate: new Date(e.target.value) })}
                        className={cn('w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all', inputCls)}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className={cn('h-3.5 w-3.5 shrink-0', isDark ? 'text-white/30' : 'text-slate-400')} />
                        {formatDisplay(startDate)}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={cn('block text-xs font-semibold uppercase tracking-wider mb-1.5', label)}>End</label>
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        value={toDatetimeLocal(endDate)}
                        onChange={e => setEditedEvent({ ...editedEvent, end: new Date(e.target.value), endDate: new Date(e.target.value) })}
                        className={cn('w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all', inputCls)}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className={cn('h-3.5 w-3.5 shrink-0', isDark ? 'text-white/30' : 'text-slate-400')} />
                        {formatDisplay(endDate)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className={cn('block text-xs font-semibold uppercase tracking-wider mb-1.5', label)}>Location</label>
                  {isEditing ? (
                    <input
                      value={editedEvent.location || ''}
                      onChange={e => setEditedEvent({ ...editedEvent, location: e.target.value })}
                      placeholder="Location or video link"
                      className={cn('w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all', inputCls)}
                    />
                  ) : (
                    editedEvent.location
                      ? <div className="flex items-center gap-2 text-sm"><MapPin className={cn('h-3.5 w-3.5 shrink-0', isDark ? 'text-white/30' : 'text-slate-400')} />{editedEvent.location}</div>
                      : <p className={cn('text-sm', label)}>No location</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className={cn('block text-xs font-semibold uppercase tracking-wider mb-1.5', label)}>Description</label>
                  {isEditing ? (
                    <textarea
                      value={editedEvent.description || ''}
                      onChange={e => setEditedEvent({ ...editedEvent, description: e.target.value })}
                      rows={3}
                      placeholder="Event description"
                      className={cn('w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all resize-none', inputCls)}
                    />
                  ) : (
                    <p className="text-sm">{editedEvent.description || <span className={label}>No description</span>}</p>
                  )}
                </div>
              </div>

              {/* Tasks Section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Associated Tasks</h3>
                  <button
                    onClick={() => setAddingTask(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 transition-all shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </button>
                </div>

                {addingTask && (
                  <div className={cn('rounded-xl p-3 mb-3 flex items-center gap-2 border', isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200')}>
                    <input
                      autoFocus
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      placeholder="Task title…"
                      className={cn('flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none', inputCls)}
                    />
                    <button onClick={handleAddTask} className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-400">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setAddingTask(false); setNewTaskTitle(''); }} className={ghostBtn}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {tasks.length === 0 ? (
                  <div className={cn('text-center py-10 rounded-xl', sectionBg)}>
                    <Flag className={cn('h-8 w-8 mx-auto mb-2', isDark ? 'text-white/20' : 'text-slate-300')} />
                    <p className={cn('text-sm', label)}>No tasks yet — add one above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div key={task.id} className={cn('rounded-xl border p-3 flex items-start justify-between gap-3', taskCard)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold truncate">{task.title}</p>
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide', priorityColors[task.priority] || priorityColors.medium)}>
                              {task.priority}
                            </span>
                          </div>
                          <div className={cn('flex items-center gap-3 text-xs', isDark ? 'text-white/30' : 'text-slate-400')}>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.estimatedDuration}m</span>
                            {task.assignee && <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignee}</span>}
                            {task.category && <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{task.category}</span>}
                          </div>
                        </div>
                        <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))}
                          className={cn('p-1.5 rounded-lg transition-all', isDark ? 'text-white/20 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50')}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={cn('flex items-center justify-between px-6 py-4 border-t', divider, footerBg)}>
              <div>
                {editedEvent.id && onDelete && (
                  <button onClick={() => onDelete(editedEvent.id)}
                    className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors">
                    Delete Event
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={onClose}
                  className={cn('px-4 py-2 rounded-lg text-sm font-semibold border transition-all',
                    isDark ? 'border-white/[0.10] text-white/60 hover:text-white hover:bg-white/[0.06]'
                           : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
                  {saving ? 'Saving…' : 'Save Event'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
