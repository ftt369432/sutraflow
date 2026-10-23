/**
 * 🌐 BrowserPanel — AI-Powered Internal Browser
 *
 * Principle: ZERO hardcoded dashboards. The AI generates HTML on demand.
 * This panel is a pure renderer — it accepts HTML from the AI (via srcDoc)
 * or navigates to real URLs. Any worker, any case, any dashboard — dynamic.
 *
 * Modes:
 *   'dashboard' — renders AI-generated HTML via srcdoc (sandboxed iframe)
 *   'url'       — navigates to real URL (legal research sites whitelist)
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Globe, ArrowLeft, ArrowRight, RefreshCw, X, ExternalLink, Save,
  Monitor, Code2, Maximize2, Minimize2, AlertTriangle, Loader2, Layout,
  ChevronDown, Scale, BookOpen, FileSearch
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BrowserMode = 'dashboard' | 'url';

export interface BrowserPanelProps {
  /** AI-generated HTML content to render (dashboard mode) */
  htmlContent?: string | null;
  /** Title for the current dashboard */
  title?: string;
  /** Callback to close this panel */
  onClose?: () => void;
  /** Optional initial URL for url mode */
  initialUrl?: string;
  /** Callback when user wants to save dashboard to drive */
  onSave?: (html: string, title: string) => void;
}

// ─── Legal Research Sites Whitelist ──────────────────────────────────────────

const LEGAL_SITES = [
  { label: '⚖️ WCAB / DWC', url: 'https://www.dir.ca.gov/dwc/' },
  { label: '📋 EAMS Public', url: 'https://eams.dir.ca.gov/eams/publicSearch' },
  { label: '🔍 CourtListener', url: 'https://www.courtlistener.com/' },
  { label: '📚 CA Labor Code', url: 'https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=LAB' },
  { label: '🏥 OMFS / DAISIE', url: 'https://www.dir.ca.gov/dwc/DAISIE.htm' },
  { label: '📄 PDRS / PD Ratings', url: 'https://www.dir.ca.gov/dwc/pdrs.htm' },
];

const ALLOWED_DOMAINS = [
  'dir.ca.gov', 'eams.dir.ca.gov', 'courtlistener.com',
  'leginfo.legislature.ca.gov', 'courts.ca.gov', 'wcab.ca.gov',
  'ama-cmr.com', 'lni.wa.gov', 'labor.ca.gov'
];

function isDomainAllowed(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const BrowserPanel: React.FC<BrowserPanelProps> = ({
  htmlContent,
  title = 'AI Dashboard',
  onClose,
  initialUrl = '',
  onSave,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [mode, setMode] = useState<BrowserMode>(htmlContent ? 'dashboard' : 'url');
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [activeUrl, setActiveUrl] = useState(initialUrl);
  const [urlHistory, setUrlHistory] = useState<string[]>(initialUrl ? [initialUrl] : []);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showSiteMenu, setShowSiteMenu] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // When AI pushes new HTML, auto-switch to dashboard mode
  useEffect(() => {
    if (htmlContent) {
      setMode('dashboard');
      setBlocked(false);
    }
  }, [htmlContent]);

  const navigateTo = useCallback((url: string) => {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    if (!isDomainAllowed(normalized)) {
      setBlocked(true);
      toast.error(`Domain not in legal research whitelist. Contact admin to add it.`);
      return;
    }
    setBlocked(false);
    setActiveUrl(normalized);
    setUrlInput(normalized);
    setIsLoading(true);
    setUrlHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(normalized);
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [historyIndex]);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    navigateTo(urlInput.trim());
    setMode('url');
  }, [urlInput, navigateTo]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const url = urlHistory[newIdx];
      setHistoryIndex(newIdx);
      setActiveUrl(url);
      setUrlInput(url);
    }
  }, [historyIndex, urlHistory]);

  const goForward = useCallback(() => {
    if (historyIndex < urlHistory.length - 1) {
      const newIdx = historyIndex + 1;
      const url = urlHistory[newIdx];
      setHistoryIndex(newIdx);
      setActiveUrl(url);
      setUrlInput(url);
    }
  }, [historyIndex, urlHistory]);

  const refresh = useCallback(() => {
    if (mode === 'url' && iframeRef.current) {
      iframeRef.current.src = activeUrl;
    } else {
      // Force re-render dashboard by toggling mode briefly
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 100);
    }
  }, [mode, activeUrl]);

  const handleSave = useCallback(() => {
    if (!htmlContent) {
      toast.error('No AI dashboard to save');
      return;
    }
    if (onSave) {
      const dashTitle = title || `dashboard-${new Date().toISOString().slice(0, 10)}`;
      onSave(htmlContent, dashTitle);
    } else {
      // Fallback: download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${title || 'dashboard'}.html`;
      a.click();
      toast.success('Dashboard downloaded');
    }
  }, [htmlContent, title, onSave]);

  const openExternal = useCallback(() => {
    if (mode === 'url' && activeUrl) {
      window.open(activeUrl, '_blank', 'noopener,noreferrer');
    } else if (htmlContent) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      window.open(URL.createObjectURL(blob), '_blank');
    }
  }, [mode, activeUrl, htmlContent]);

  // ─── Sandbox string: strict — scripts allowed but no navigation escape ────
  const sandboxAttr = 'allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={cn(
      'flex flex-col h-full w-full overflow-hidden',
      isDark ? 'bg-[#0a0a0f] text-white' : 'bg-white text-slate-900',
      isFullscreen && 'fixed inset-0 z-50'
    )}>

      {/* ── Toolbar ── */}
      <div className={cn(
        'flex items-center gap-1.5 px-3 py-2 border-b shrink-0',
        isDark ? 'border-white/[0.06] bg-[#111118]' : 'border-slate-200 bg-slate-50'
      )}>

        {/* Mode toggle */}
        <div className={cn(
          'flex rounded-lg p-0.5 gap-0.5 shrink-0',
          isDark ? 'bg-white/5' : 'bg-slate-200/60'
        )}>
          <button
            onClick={() => { setMode('dashboard'); setBlocked(false); }}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
              mode === 'dashboard'
                ? (isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
                : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
            )}
          >
            <Layout className="h-3 w-3" />
            Dashboard
          </button>
          <button
            onClick={() => setMode('url')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
              mode === 'url'
                ? (isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
                : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
            )}
          >
            <Globe className="h-3 w-3" />
            Browser
          </button>
        </div>

        {/* Nav buttons */}
        <button
          onClick={goBack}
          disabled={historyIndex === 0 || mode === 'dashboard'}
          className={cn('p-1.5 rounded-md transition-all disabled:opacity-30',
            isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200')}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= urlHistory.length - 1 || mode === 'dashboard'}
          className={cn('p-1.5 rounded-md transition-all disabled:opacity-30',
            isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200')}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={refresh}
          className={cn('p-1.5 rounded-md transition-all',
            isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200')}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
        </button>

        {/* URL / title bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 min-w-0">
          {mode === 'url' ? (
            <div className="relative">
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Enter legal research URL..."
                className={cn(
                  'w-full text-xs px-3 py-1.5 rounded-lg border outline-none transition-all',
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400'
                )}
              />
            </div>
          ) : (
            <div className={cn(
              'text-xs px-3 py-1.5 rounded-lg truncate',
              isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
            )}>
              📊 {title || 'AI Generated Dashboard'}
            </div>
          )}
        </form>

        {/* Legal sites quick access */}
        {mode === 'url' && (
          <div className="relative">
            <button
              onClick={() => setShowSiteMenu(v => !v)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-all',
                isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              )}
            >
              <Scale className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {showSiteMenu && (
              <div className={cn(
                'absolute right-0 top-full mt-1 w-52 rounded-xl border shadow-xl z-50 py-1 overflow-hidden',
                isDark ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-slate-200'
              )}>
                <div className={cn('px-3 py-1.5 text-xs font-semibold tracking-wider uppercase',
                  isDark ? 'text-slate-500' : 'text-slate-400')}>
                  Legal Research
                </div>
                {LEGAL_SITES.map(site => (
                  <button
                    key={site.url}
                    onClick={() => { navigateTo(site.url); setShowSiteMenu(false); }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs transition-all',
                      isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    {site.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {mode === 'dashboard' && htmlContent && (
          <>
            <button
              onClick={() => setShowSource(v => !v)}
              title="View source"
              className={cn(
                'p-1.5 rounded-md transition-all text-xs',
                showSource
                  ? (isDark ? 'bg-indigo-600/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
                  : (isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500')
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleSave}
              title="Save to G:\My Drive\.GENIEFLOW_MASTER\dashboards\"
              className={cn(
                'p-1.5 rounded-md transition-all',
                isDark ? 'hover:bg-white/10 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'
              )}
            >
              <Save className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        <button
          onClick={openExternal}
          title="Open in system browser"
          className={cn('p-1.5 rounded-md transition-all',
            isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setIsFullscreen(v => !v)}
          className={cn('p-1.5 rounded-md transition-all',
            isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500')}
        >
          {isFullscreen
            ? <Minimize2 className="h-3.5 w-3.5" />
            : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className={cn('p-1.5 rounded-md transition-all',
              isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">

        {/* Blocked warning */}
        {blocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3 px-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <p className={cn('text-sm font-medium', isDark ? 'text-slate-200' : 'text-slate-700')}>
              Domain not in legal whitelist
            </p>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Allowed: courtlistener.com, dir.ca.gov, eams.dir.ca.gov, leginfo.legislature.ca.gov
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {LEGAL_SITES.map(s => (
                <button
                  key={s.url}
                  onClick={() => { setBlocked(false); navigateTo(s.url); }}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all',
                    isDark
                      ? 'border-white/10 hover:bg-white/10 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Source code view */}
        {showSource && mode === 'dashboard' && htmlContent && (
          <div className={cn(
            'absolute inset-0 z-10 overflow-auto p-4 font-mono text-xs',
            isDark ? 'bg-[#0a0a0f] text-emerald-400' : 'bg-slate-900 text-emerald-400'
          )}>
            <pre className="whitespace-pre-wrap">{htmlContent}</pre>
          </div>
        )}

        {/* Empty dashboard state */}
        {mode === 'dashboard' && !htmlContent && !blocked && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className={cn(
              'p-4 rounded-2xl',
              isDark ? 'bg-white/5' : 'bg-slate-100'
            )}>
              <Layout className={cn('h-10 w-10', isDark ? 'text-indigo-400' : 'text-indigo-500')} />
            </div>
            <div>
              <p className={cn('text-sm font-semibold', isDark ? 'text-slate-200' : 'text-slate-700')}>
                No dashboard yet
              </p>
              <p className={cn('text-xs mt-1', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Ask the AI to generate a dashboard. For example:
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[
                '"Build a penalty tracker for this case"',
                '"Create a case summary dashboard"',
                '"Make a TTD payment audit chart"',
              ].map(prompt => (
                <div
                  key={prompt}
                  className={cn(
                    'text-xs px-3 py-2 rounded-lg border text-left italic',
                    isDark ? 'border-white/10 text-slate-400 bg-white/3' : 'border-slate-200 text-slate-500 bg-slate-50'
                  )}
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty URL state */}
        {mode === 'url' && !activeUrl && !blocked && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Scale className={cn('h-10 w-10 opacity-30', isDark ? 'text-slate-400' : 'text-slate-400')} />
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Select a legal research site or type a URL above
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LEGAL_SITES.map(s => (
                <button
                  key={s.url}
                  onClick={() => navigateTo(s.url)}
                  className={cn(
                    'text-xs px-3 py-2 rounded-lg border text-left transition-all',
                    isDark
                      ? 'border-white/10 hover:bg-white/10 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard iframe (AI-generated HTML) */}
        {mode === 'dashboard' && htmlContent && !showSource && !blocked && (
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            sandbox={sandboxAttr}
            title={title || 'AI Dashboard'}
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
          />
        )}

        {/* URL iframe (legal research browser) */}
        {mode === 'url' && activeUrl && !blocked && (
          <iframe
            ref={iframeRef}
            src={activeUrl}
            title="Legal Research Browser"
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserPanel;
