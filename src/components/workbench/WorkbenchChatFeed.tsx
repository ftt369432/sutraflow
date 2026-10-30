import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Search,
  Scale,
  FileText,
  Copy,
  Check,
  Cpu,
  Layers,
  Eye,
  EyeOff,
  Brain,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { StudioMessage, ThoughtTraceStep, ArtifactBadge } from './types';
import { MarkdownMessage } from '../ai/MarkdownMessage';

/**
 * Safely extracts or parses work product artifact badges from a message.
 */
function extractArtifactBadges(msg: StudioMessage): ArtifactBadge[] {
  if (!msg) return [];
  const result: ArtifactBadge[] = [];
  const seenPaths = new Set<string>();

  // 1. Explicitly attached artifacts from sovereign orchestrator
  if (msg.artifacts && Array.isArray(msg.artifacts)) {
    for (const art of msg.artifacts) {
      if (art && (art.path || art.name)) {
        const key = art.path || art.name;
        if (!seenPaths.has(key)) {
          seenPaths.add(key);
          result.push(art);
        }
      }
    }
  }

  // 2. Fallback: Parse markdown content for generated deliverables/files
  const content = msg.content || '';
  if (content) {
    // Match [Title](path/to/file.ext)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+\.(?:md|docx|pdf|txt))\)/gi;
    let match: RegExpExecArray | null;
    while ((match = mdLinkRegex.exec(content)) !== null) {
      const title = match[1].trim();
      const path = match[2].trim();
      if (!seenPaths.has(path)) {
        seenPaths.add(path);
        const ext = path.split('.').pop()?.toLowerCase();
        result.push({
          id: `art-link-${result.length}`,
          name: title || path.split(/[\\/]/).pop() || 'Work Product',
          path,
          type: ext === 'docx' ? 'docx' : ext === 'md' ? 'md' : 'text'
        });
      }
    }

    // Match backtick or raw paths like `AI_GENERATED_DOCS/filename.md` or `02_OUTPUT/filename.docx`
    const pathRegex = /`?((?:[A-Za-z]:[\\/][^\s"'`]+|(?:AI_GENERATED_DOCS|02_OUTPUT)[\\/][^\s"'`]+)\.(?:md|docx|pdf|txt))`?/gi;
    while ((match = pathRegex.exec(content)) !== null) {
      const rawPath = match[1].trim();
      if (!seenPaths.has(rawPath)) {
        seenPaths.add(rawPath);
        const fileName = rawPath.split(/[\\/]/).pop() || rawPath;
        const ext = fileName.split('.').pop()?.toLowerCase();
        result.push({
          id: `art-path-${result.length}`,
          name: fileName,
          path: rawPath,
          type: ext === 'docx' ? 'docx' : ext === 'md' ? 'md' : 'text'
        });
      }
    }
  }

  return result;
}

interface WorkbenchChatFeedProps {
  messages: StudioMessage[];
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  expandedThoughtIds: Record<string, boolean>;
  toggleThought: (msgId: string) => void;
  isProcessing: boolean;
  progressStep?: string;
  liveThoughtSteps?: ThoughtTraceStep[];
  onSelectSuggestion?: (prompt: string) => void;
}

export const WorkbenchChatFeed: React.FC<WorkbenchChatFeedProps> = ({
  messages,
  chatScrollRef,
  expandedThoughtIds,
  toggleThought,
  isProcessing,
  progressStep,
  liveThoughtSteps = [],
  onSelectSuggestion
}) => {
  // Individual step expansion map (for behind-the-scenes deep inspection)
  const [expandedStepIds, setExpandedStepIds] = useState<Record<string, boolean>>({});
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);

  const handleOpenArtifact = (art: ArtifactBadge) => {
    window.dispatchEvent(
      new CustomEvent('genieflow:open-artifact', {
        detail: {
          path: art.path,
          title: art.name,
          name: art.name,
          type: art.type
        }
      })
    );
  };

  const toggleStep = (stepId: string) => {
    setExpandedStepIds((prev) => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleCopyStep = (e: React.MouseEvent, step: ThoughtTraceStep) => {
    e.stopPropagation();
    const text = `[PROCESS STEP]: ${step.title}\n[DETAIL]: ${step.detail || 'None'}\n[STATUS]: ${step.status}\n[LATENCY]: ${step.timeSeconds ? `${step.timeSeconds}s` : 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedStepId(step.id);
    setTimeout(() => setCopiedStepId(null), 1500);
  };

  // Resolve agent domain identity & telemetry metadata based on step content
  const getStepTelemetry = (step: ThoughtTraceStep) => {
    const text = `${step.title} ${step.detail || ''}`.toLowerCase();

    if (text.includes('tavily') || text.includes('precedent') || text.includes('search api') || text.includes('court of appeal')) {
      return {
        badge: 'Tavily Precedent Engine',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: <Search className="w-3 h-3 text-amber-500" />,
        systemLog: 'Querying California Court of Appeal & WCAB En Banc precedents via Tavily Legal API. Live legal grounding cross-referenced against official California Labor Code statutes.',
        scope: 'California Appellate & WCAB Case Law',
        privacy: 'Zero-PHI (Masked search tokens only)'
      };
    }

    if (text.includes('zero-phi') || text.includes('scrubbing') || text.includes('egress') || text.includes('harvesting')) {
      return {
        badge: 'Zero-PHI Egress Shield',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        icon: <Shield className="w-3 h-3 text-indigo-500" />,
        systemLog: 'Local privacy boundary enforced. Direct claimant identifiers (SSN, DOB, Address, Claim #) sanitized prior to external model dispatch. CMIA & HIPAA compliant.',
        scope: 'Local LAN / Air-Gapped Sanitization',
        privacy: '100% De-identified'
      };
    }

    if (text.includes('28-line') || text.includes('drafting') || text.includes('pleading') || text.includes('gutierrez')) {
      return {
        badge: '28-Line Pleading Engine',
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        icon: <Scale className="w-3 h-3 text-purple-500" />,
        systemLog: 'Enforcing California 28-line legal paper formatting, judicial district court caption rules, points & authorities layout, and statutory verification.',
        scope: 'WCAB Rules of Practice & Procedure',
        privacy: 'Firm-Conformed Document Standard'
      };
    }

    if (text.includes('audit') || text.includes('quote guard') || text.includes('linting') || text.includes('quality score')) {
      return {
        badge: 'Quote Guard Linting Audit',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: <CheckCircle className="w-3 h-3 text-emerald-500" />,
        systemLog: 'Executing automated adversarial legal linting. Verifying word-for-word statutory quotes and checking line numbers for 28-line paper compliance.',
        scope: 'Deterministic Statutory Validation',
        privacy: 'Internal Automated Audit'
      };
    }

    if (text.includes('drive') || text.includes('vault') || text.includes('scanning') || text.includes('connected')) {
      return {
        badge: 'Sovereign Storage Vault',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: <Layers className="w-3 h-3 text-blue-500" />,
        systemLog: 'Scanning attached external media (Travel Drive E:\\, Google Drive G:\\My Drive, and local AI_GENERATED_DOCS) to locate conformed case files.',
        scope: 'On-Prem Local Filesystem Bridge',
        privacy: 'Read-Only Strict Egress Gate'
      };
    }

    return {
      badge: 'Sovereign Swarm Node',
      badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      icon: <Cpu className="w-3 h-3 text-slate-500" />,
      systemLog: 'Deterministic multi-agent reasoning pass executed across active practice context.',
      scope: 'Active Workspace Session',
      privacy: 'Air-Gapped Sovereign Execution'
    };
  };

  // Helper renderer for an individual interactive thought step (HQ Antigravity-grade streamline)
  const renderInteractiveStep = (step: ThoughtTraceStep) => {
    const isStepExpanded = !!expandedStepIds[step.id];

    return (
      <div
        key={step.id}
        className="rounded-md border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/40 text-xs transition overflow-hidden"
      >
        <div
          onClick={() => toggleStep(step.id)}
          className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 select-none transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-400 font-bold select-none text-[11px]">›</span>
            {step.status === 'completed' ? (
              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
            ) : step.status === 'warning' ? (
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
            ) : (
              <Clock className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
            )}
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
              {step.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {step.timeSeconds !== undefined && (
              <span className="font-mono text-[9px] text-slate-400">
                +{step.timeSeconds}s
              </span>
            )}
            {step.detail && (
              <ChevronRight
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                  isStepExpanded ? 'transform rotate-90 text-blue-500' : ''
                }`}
              />
            )}
          </div>
        </div>

        {isStepExpanded && step.detail && (
          <div className="px-3 py-2 bg-slate-50/70 dark:bg-slate-950/70 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed select-text">
            {step.detail}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={chatScrollRef as any}
      className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4 text-sm leading-relaxed"
    >
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        // Open and free by default (like HQ chevrons) unless user explicitly collapses it
        const isExpanded = expandedThoughtIds[msg.id] !== undefined ? expandedThoughtIds[msg.id] : true;
        const thinkMatch = msg.content?.match(/<think>([\s\S]*?)<\/think>/i);
        const internalMonologue = thinkMatch ? thinkMatch[1].trim() : null;
        const cleanContent = msg.content ? msg.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() : '';
        const hasThoughtSteps = (msg.thoughtSteps && msg.thoughtSteps.length > 0) || !!msg.thoughtDuration || !!internalMonologue;

        if (isUser) {
          return (
            <div key={msg.id} className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100">You</span>
                <span className="font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-normal">
                {msg.content}
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            {/* Thought / Reasoning Header Banner */}
            {hasThoughtSteps && (
              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleThought(msg.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {msg.thoughtDuration
                        ? `Thought for ${msg.thoughtDuration}`
                        : internalMonologue
                        ? `Reasoning Process (${internalMonologue.split(/\s+/).length} words)`
                        : `Process & Swarm Telemetry (${msg.thoughtSteps?.length || 0} steps)`}
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isExpanded ? 'transform rotate-90 text-blue-500' : ''
                      }`}
                    />
                  </button>

                  {/* Quick Expand All Steps Toggle when trace is open */}
                  {isExpanded && msg.thoughtSteps && msg.thoughtSteps.length > 0 && (
                    <button
                      onClick={() => {
                        const allExpanded = msg.thoughtSteps!.every((s) => expandedStepIds[s.id]);
                        const updated = { ...expandedStepIds };
                        msg.thoughtSteps!.forEach((s) => {
                          updated[s.id] = !allExpanded;
                        });
                        setExpandedStepIds(updated);
                      }}
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {msg.thoughtSteps.every((s) => expandedStepIds[s.id])
                        ? 'Collapse All Behind-the-Scenes'
                        : 'Expand All Behind-the-Scenes'}
                    </button>
                  )}
                </div>

                {/* Expanded Thought Trace: Interactive List of Steps + Monologue Terminal */}
                {isExpanded && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    {msg.thoughtSteps && msg.thoughtSteps.length > 0 && (
                      <div className="space-y-1.5">
                        {msg.thoughtSteps.map((step) => renderInteractiveStep(step))}
                      </div>
                    )}

                    {internalMonologue && (
                      <div className="rounded-xl bg-slate-950 dark:bg-[#07070b] border border-slate-800/80 dark:border-white/10 p-3.5 font-mono text-[11px] leading-relaxed text-blue-300/90 shadow-inner overflow-hidden">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[9px] uppercase tracking-wider font-bold">
                          <span className="flex items-center gap-1.5 text-blue-400">
                            <Brain className="w-3.5 h-3.5 text-blue-400" />
                            Model Internal Monologue ({internalMonologue.split(/\s+/).length} words)
                          </span>
                          <span className="text-slate-500 font-mono">Chain-of-Thought Dump</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto whitespace-pre-wrap select-text pr-2 font-mono">
                          {internalMonologue}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Continuous Markdown Artifact Stream */}
            <div className="text-slate-800 dark:text-slate-200 font-normal leading-relaxed">
              <MarkdownMessage content={cleanContent || msg.content} isStreaming={msg.isStreaming} />
            </div>

            {/* Work Product Artifacts Dock */}
            {(() => {
              const artifacts = extractArtifactBadges(msg);
              if (artifacts.length === 0) return null;
              return (
                <div className="mt-3.5 p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/70 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900/40 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                        Work Product Artifacts ({artifacts.length})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                      Click to open in Deliverable Viewport ↗
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {artifacts.map((art) => {
                      const isDocx = art.path?.toLowerCase().endsWith('.docx') || art.type === 'docx';
                      return (
                        <button
                          key={art.path || art.name}
                          type="button"
                          onClick={() => handleOpenArtifact(art)}
                          className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xs transition text-left cursor-pointer"
                          title={`Click to open ${art.name} in viewport`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 font-bold text-[10px] ${
                                isDocx
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {isDocx ? 'DOCX' : 'MD'}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {art.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                {art.path || 'AI_GENERATED_DOCS'}
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0 ml-1.5 transition" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Quality Audit Badge */}
            {msg.auditScore !== undefined && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Quality Audit Score: {msg.auditScore}/100</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  • Quote Guard Verified • 28-Line Conformed • Zero-PHI Shield Active
                </span>
              </div>
            )}

            {/* Contextual Suggestive Prompts / Next Actions inside Message Bubble */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="pt-3 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Suggested Next Actions:
                </span>
                {msg.suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => onSelectSuggestion?.(sug.prompt)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 hover:bg-blue-50/90 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 hover:text-blue-700 dark:text-slate-200 dark:hover:text-white border border-slate-200/90 hover:border-blue-300 dark:border-slate-700/70 dark:hover:border-blue-500/50 shadow-2xs transition-all duration-150 cursor-pointer group"
                  >
                    <span>{sug.label}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Live Streaming Processing Indicator with Interactive Live Trace */}
      {isProcessing && (
        <div className="space-y-2 pt-2 animate-in fade-in duration-150">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span className="font-semibold">{progressStep || 'Executing Swarm Pipeline...'}</span>
          </div>

          {liveThoughtSteps.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                <span>Live Behind-the-Scenes Pipeline ({liveThoughtSteps.length} steps)</span>
                <span className="text-blue-500 font-mono animate-pulse">● Streaming</span>
              </div>
              <div className="space-y-1.5">
                {liveThoughtSteps.map((step) => renderInteractiveStep(step, true))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
