import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, AlertTriangle, Terminal } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TraceStep {
    id: string;
    turn: number;
    kind: 'thought' | 'tool_call' | 'tool_result' | 'final' | 'error';
    text?: string;
    toolName?: string;
    toolArgs?: any;
    toolOutput?: string;
    at: number;
}

interface Props {
    steps: TraceStep[];
    status: 'running' | 'complete' | 'error';
    agentName?: string;
}

type Item =
    | { type: 'thought'; id: string; text: string; secs: number | null }
    | { type: 'tool'; id: string; name: string; args: any; output?: string; done: boolean }
    | { type: 'error'; id: string; text: string };

const fmt = (v: any) => {
    try { return typeof v === 'string' ? v : JSON.stringify(v, null, 2); } catch { return String(v); }
};

const base = (p?: string) => (p || '').split(/[\\/]/).filter(Boolean).pop() || p || '';

/** Human verb + target, mirroring Antigravity's inline step labels with everyday user clarity. */
const describe = (name: string, a: any = {}): { verb: string; target: string } => {
    const path = a.AbsolutePath || a.TargetFile || a.DirectoryPath || a.SearchPath || a.path;
    switch (name) {
        case 'view_file': return { verb: 'Analyzed', target: base(path) };
        case 'list_dir': return { verb: 'Explored', target: base(path) || 'folder' };
        case 'grep_search': return { verb: 'Searched', target: `"${a.Query || a.query || ''}"${path ? ` in ${base(path)}` : ''}` };
        case 'write_to_file': return { verb: 'Created document', target: base(path) };
        case 'replace_file_content':
        case 'multi_replace_file_content': return { verb: 'Updated document', target: base(path) };
        case 'run_command': {
            const cmd = a.command || a.CommandLine || '';
            if (/python/i.test(cmd)) {
                if (/pdrs|rating|impairment/i.test(cmd)) return { verb: 'Calculated PDRS rating', target: '' };
                if (/4622|interest|penalty|5814/i.test(cmd)) return { verb: 'Calculated statutory interest & penalties', target: '' };
                const scriptName = cmd.split(/\s+/).find((w: string) => w.endsWith('.py')) || '';
                return { verb: 'Executed data extraction', target: base(scriptName) };
            }
            return { verb: 'Processed background task', target: '' };
        }
        case 'search_web': return { verb: 'Searched live web', target: `"${a.query || ''}"` };
        case 'read_url_content': return { verb: 'Read web page', target: a.Url || a.url || '' };
        case 'extract_web_page': return { verb: 'Extracted clean content', target: Array.isArray(a.urls) ? base(a.urls[0]) : base(a.urls || a.url || '') };
        case 'search_courtlistener': return { verb: 'Verified CourtListener case law', target: `"${a.query || ''}"` };
        case 'lookup_california_labor_code': return { verb: 'Verified Labor Code', target: `§ ${a.section || a.query || ''}` };
        case 'crosswalk_8ccr_rule': return { verb: 'Crosswalked 8 CCR', target: `Rule ${a.rule || a.query || ''}` };
        case 'lookup_med_legal_case': return { verb: 'Verified med-legal precedent', target: String(a.query || a.case_name || '') };
        case 'query_med_legal_cortex': return { verb: 'Queried legal cortex', target: String(a.query || '') };
        case 'read_graph': return { verb: 'Retrieved persistent memory', target: a.query || 'Knowledge Graph' };
        case 'search_nodes':
        case 'open_nodes': return { verb: 'Searched memory graph', target: `"${a.query || 'nodes'}"` };
        case 'create_entities': return { verb: 'Saved memory entities', target: `${Array.isArray(a.entities) ? a.entities.length : ''} records` };
        case 'create_relations': return { verb: 'Linked memory relations', target: `${Array.isArray(a.relations) ? a.relations.length : ''} links` };
        case 'add_observations': return { verb: 'Recorded observations', target: `${Array.isArray(a.observations) ? a.observations.length : ''} notes` };
        default: return { verb: 'Completed', target: name };
    }
};

const Chevron: React.FC<{ open: boolean }> = ({ open }) =>
    open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />;

/**
 * Antigravity-style inline execution flow.
 * - Everyday user experience: Clean prose narration and friendly one-line status chevrons.
 * - Developer Mode: Toggleable containerized terminal block for sophisticated users.
 */
export const ExecutionTraceCard: React.FC<Props> = ({ steps, status }) => {
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const [devMode, setDevMode] = useState<boolean>(() => {
        try { return localStorage.getItem('genieflow_dev_mode') === 'true'; } catch { return false; }
    });

    const toggle = (id: string, dflt = false) => setOpen(o => ({ ...o, [id]: !(o[id] ?? dflt) }));
    const toggleDevMode = () => {
        const next = !devMode;
        setDevMode(next);
        try { localStorage.setItem('genieflow_dev_mode', String(next)); } catch {}
    };

    // Pair calls with results, compute thinking time.
    const items: Item[] = [];
    let prevAt = steps[0]?.at ?? 0;
    for (const s of steps) {
        if (s.kind === 'thought') {
            const secs = prevAt && s.at > prevAt ? Math.max(1, Math.round((s.at - prevAt) / 1000)) : null;
            items.push({ type: 'thought', id: s.id, text: s.text || '', secs });
        } else if (s.kind === 'tool_call') {
            items.push({ type: 'tool', id: s.id, name: s.toolName || 'tool', args: s.toolArgs, done: false });
        } else if (s.kind === 'tool_result') {
            for (let i = items.length - 1; i >= 0; i--) {
                const it = items[i];
                if (it.type === 'tool' && !it.done && it.name === s.toolName) {
                    it.output = s.toolOutput; it.done = true; break;
                }
            }
        } else if (s.kind === 'error') {
            items.push({ type: 'error', id: s.id, text: s.text || 'Error' });
        }
        prevAt = s.at;
    }

    return (
        <div className="w-full text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
            {/* Subtle Developer Mode Toggle for advanced users */}
            {items.some(i => i.type === 'tool' && i.name === 'run_command') && (
                <div className="flex justify-end pr-1">
                    <button
                        onClick={toggleDevMode}
                        title="Toggle Raw Developer Shell"
                        className={cn(
                            "flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded transition-colors",
                            devMode
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                    >
                        <Terminal className="h-2.5 w-2.5" />
                        <span>{devMode ? 'Developer Mode: ON' : 'Developer Mode'}</span>
                    </button>
                </div>
            )}

            {items.map(it => {
                if (it.type === 'thought') {
                    const isOpen = open[it.id] ?? true;
                    return (
                        <div key={it.id}>
                            <button onClick={() => toggle(it.id, true)} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <Chevron open={isOpen} />
                                <span>Thought{it.secs ? ` for ${it.secs}s` : ''}</span>
                            </button>
                            {isOpen && <p className="mt-1 ml-[18px] whitespace-pre-wrap">{it.text}</p>}
                        </div>
                    );
                }
                if (it.type === 'error') {
                    return (
                        <div key={it.id} className="flex items-start gap-2 text-red-500">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="whitespace-pre-wrap">{it.text}</span>
                        </div>
                    );
                }
                const { verb, target } = describe(it.name, it.args);
                const isCmd = it.name === 'run_command';

                // Only render containerized terminal if Developer Mode is explicitly turned ON
                if (isCmd && devMode) {
                    const cmd = it.args?.command || it.args?.CommandLine || fmt(it.args);
                    return (
                        <div key={it.id} className="rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.04] text-[11px] text-slate-500">
                                <Terminal className="h-3.5 w-3.5" />
                                <span>{it.done ? 'Ran command' : 'Running command'}</span>
                                {!it.done && <Loader2 className="h-3 w-3 animate-spin" />}
                            </div>
                            <pre className="px-3 py-2 bg-slate-950 text-emerald-300 font-mono text-[11px] whitespace-pre-wrap">$ {cmd}</pre>
                            {it.output && (
                                <pre className="px-3 py-2 bg-slate-950 text-slate-300 font-mono text-[11px] whitespace-pre-wrap max-h-72 overflow-auto border-t border-white/5">
                                    {it.output.slice(0, 8000)}
                                </pre>
                            )}
                        </div>
                    );
                }

                const isOpen = open[it.id] ?? false;
                return (
                    <div key={it.id}>
                        <button onClick={() => toggle(it.id)} className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 max-w-full">
                            <Chevron open={isOpen} />
                            <span className="text-slate-400">{verb}</span>
                            {target && <span className="font-mono text-[11px] truncate text-slate-600 dark:text-slate-300">{target}</span>}
                            {!it.done && <Loader2 className="h-3 w-3 animate-spin" />}
                        </button>
                        {isOpen && (
                            <div className="ml-[18px] mt-1 space-y-1">
                                <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap">{fmt(it.args)}</pre>
                                {it.output && (
                                    <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap max-h-64 overflow-auto border-l-2 border-slate-200 dark:border-white/10 pl-2">
                                        {it.output.slice(0, 6000)}
                                    </pre>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            {status === 'running' && (
                <div className={cn('flex items-center gap-2 text-[12px] text-slate-400')}>
                    <Loader2 className="h-3 w-3 animate-spin" /> Working…
                </div>
            )}
        </div>
    );
};
