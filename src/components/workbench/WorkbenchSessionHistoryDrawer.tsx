import React, { useState } from 'react';
import {
  History,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle2,
  FolderOpen,
  X,
  Scale,
  Sparkles
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
}

export const WorkbenchSessionHistoryDrawer: React.FC<WorkbenchSessionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onDuplicateSession
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.caseNumber && s.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
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
                Agent Project Sessions
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
          <button
            onClick={onNewSession}
            className="w-full py-2 px-3 sutra-silver-create shimmer-button-energy font-bold rounded-lg flex items-center justify-center gap-2 text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Agent Project / Case Session</span>
          </button>

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
        </div>

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
              const msgCount = session.messages.filter((m) => m.role === 'user').length;
              const hasDeliverable = Boolean(session.generatedOutput && session.generatedOutput.trim());

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400/80 dark:border-blue-500/80 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
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
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 text-center">
          <span className="text-[10px] text-slate-400 font-mono">
            {sessions.length} session{sessions.length === 1 ? '' : 's'} stored locally in Sovereign Browser State
          </span>
        </div>
      </div>
    </div>
  );
};
