import React, { useState, useMemo } from 'react';
import {
  History,
  Plus,
  Trash2,
  Copy,
  Search,
  Clock,
  FileText,
  MessageSquare,
  FolderOpen,
  X,
  Scale,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
  Filter,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { DomainType } from '../../services/ai/UniversalDomainOperator';
import { StudioMessage, ThoughtTraceStep } from './types';

export interface WorkbenchSession {
  id: string;
  title: string;
  caseNumber?: string;
  domainType: DomainType;
  updatedAt: number;
  createdAt: number;
  messages: StudioMessage[];
  generatedOutput: string;
  liveThoughtSteps: ThoughtTraceStep[];
  attachedFileName?: string;
  evidenceText?: string;
  notepadText?: string;
  artifacts?: Array<{ id: string; title: string; content: string; timestamp: string; diskPath?: string }>;
  activeArtifactId?: string;
}

interface WorkbenchSessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: WorkbenchSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (sessionId: string) => void;
  onBatchDeleteSessions?: (sessionIds: string[]) => void;
  onClearInactiveSessions?: () => void;
}

export const WorkbenchSessionHistoryDrawer: React.FC<WorkbenchSessionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onDuplicateSession,
  onBatchDeleteSessions,
  onClearInactiveSessions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [activeClientFilter, setActiveClientFilter] = useState<string>('all');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmClearInactive, setShowConfirmClearInactive] = useState(false);

  // Extract unique clients/cases for quick filter chips
  const clientFilters = useMemo(() => {
    const clients = new Set<string>();
    sessions.forEach((s) => {
      if (s.title && s.title.includes('—')) {
        const clientPart = s.title.split('—')[0].trim();
        if (clientPart.length > 2 && clientPart.length < 35) {
          clients.add(clientPart);
        }
      } else if (s.caseNumber) {
        clients.add(s.caseNumber);
      }
    });
    return Array.from(clients).slice(0, 6);
  }, [sessions]);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.caseNumber && s.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (activeClientFilter === 'all') return true;
    return (
      s.title.toLowerCase().includes(activeClientFilter.toLowerCase()) ||
      (s.caseNumber && s.caseNumber.toLowerCase().includes(activeClientFilter.toLowerCase()))
    );
  });

  const allFilteredSelected =
    filteredSessions.length > 0 &&
    filteredSessions.every((s) => selectedSessionIds.has(s.id));
  const someFilteredSelected =
    filteredSessions.some((s) => selectedSessionIds.has(s.id)) && !allFilteredSelected;

  const toggleSelectSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(filteredSessions.map((s) => s.id)));
    }
  };

  const handleExecuteBatchDelete = () => {
    if (selectedSessionIds.size === 0) return;
    const ids = Array.from(selectedSessionIds);
    if (onBatchDeleteSessions) {
      onBatchDeleteSessions(ids);
    } else {
      ids.forEach((id) => onDeleteSession(id));
    }
    setSelectedSessionIds(new Set());
    setShowConfirmDelete(false);
  };

  const handleExecuteClearInactive = () => {
    if (onClearInactiveSessions) {
      onClearInactiveSessions();
    } else {
      sessions.filter((s) => s.id !== activeSessionId).forEach((s) => onDeleteSession(s.id));
    }
    setSelectedSessionIds(new Set());
    setShowConfirmClearInactive(false);
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const inactiveCount = sessions.filter((s) => s.id !== activeSessionId).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Agent Project Sessions & Smart Panel
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Switch instantly between case workflows & agent transcripts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar: New Session & Search */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onNewSession}
              className="flex-1 py-2 px-3 sutra-silver-create shimmer-button-energy font-bold rounded-lg flex items-center justify-center gap-2 text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Project Session</span>
            </button>

            {inactiveCount > 0 && (
              <button
                onClick={() => setShowConfirmClearInactive(true)}
                title="Purge all background scratch sessions while keeping your active matter"
                className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span className="hidden sm:inline">Clear Inactive ({inactiveCount})</span>
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter prior projects by client, case no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md placeholder:text-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quick Matter Filter Chips */}
          {clientFilters.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
              <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1">
                <Filter className="w-2.5 h-2.5" />
                Client:
              </span>
              <button
                onClick={() => setActiveClientFilter('all')}
                className={`px-2 py-0.5 rounded-full font-medium transition cursor-pointer shrink-0 ${
                  activeClientFilter === 'all'
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All ({sessions.length})
              </button>
              {clientFilters.map((client) => (
                <button
                  key={client}
                  onClick={() => setActiveClientFilter(client)}
                  className={`px-2 py-0.5 rounded-full font-medium transition cursor-pointer shrink-0 ${
                    activeClientFilter === client
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {client}
                </button>
              ))}
            </div>
          )}

          {/* Select All & Multi-Delete Toolbar */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              ) : someFilteredSelected ? (
                <MinusSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Select All ({filteredSessions.length})</span>
            </button>

            {selectedSessionIds.size > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-100">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                  {selectedSessionIds.size} selected
                </span>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Selected</span>
                </button>
                <button
                  onClick={() => setSelectedSessionIds(new Set())}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Deselect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Banner for Batch Delete */}
        {showConfirmDelete && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 flex items-center justify-between animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-200">
                Delete {selectedSessionIds.size} selected session{selectedSessionIds.size === 1 ? '' : 's'}?
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExecuteBatchDelete}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Banner for Clear Inactive */}
        {showConfirmClearInactive && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 flex items-center justify-between animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                Purge all {inactiveCount} inactive sessions? (Active session kept)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExecuteClearInactive}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Purge Inactive
              </button>
              <button
                onClick={() => setShowConfirmClearInactive(false)}
                className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No previous sessions found</p>
              <p className="text-[10px] text-slate-500 mt-1">Start a new project above to begin tracking history</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isSelected = selectedSessionIds.has(session.id);
              const msgCount = session.messages.filter((m) => m.role === 'user').length;
              const hasDeliverable = Boolean(session.generatedOutput && session.generatedOutput.trim());

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 dark:border-blue-500 shadow-xs ring-1 ring-blue-400/50'
                      : isActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400/80 dark:border-blue-500/80 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Multi-Select Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => toggleSelectSession(session.id, e)}
                      className="mt-0.5 p-0.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
                      title={isSelected ? 'Deselect session' : 'Select session'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hover:text-blue-500" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        {session.domainType === 'legal' ? (
                          <Scale className="w-3 h-3 text-amber-500 shrink-0" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {session.title || 'Untitled Session'}
                        </h4>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-500 text-white shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      {session.caseNumber && (
                        <div className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 mb-1">
                          {session.caseNumber}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimestamp(session.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5" />
                          {msgCount} prompt{msgCount === 1 ? '' : 's'}
                        </span>
                        {hasDeliverable && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <FileText className="w-2.5 h-2.5" />
                            {session.artifacts && session.artifacts.length > 1
                              ? `${session.artifacts.length} Artifacts`
                              : 'Draft ready'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Duplicate session"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateSession(session.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {sessions.length > 1 && (
                        <button
                          title="Delete session"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 flex items-center justify-between text-center px-4">
          <span className="text-[10px] text-slate-400 font-mono">
            {sessions.length} session{sessions.length === 1 ? '' : 's'} in Sovereign Storage
          </span>
          {selectedSessionIds.size > 0 && (
            <span className="text-[10px] font-semibold text-blue-500 font-mono">
              {selectedSessionIds.size} ready for batch action
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
