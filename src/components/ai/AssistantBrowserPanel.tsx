import React from 'react';
import { Globe, RotateCcw, Zap, FileText, Bot, ExternalLink, Sidebar } from 'lucide-react';
import { Button } from '../ui/Button';
import { TooltipProvider, Tooltip } from '../ui/Tooltip';
import { cn } from '@/lib/utils';
import { displayManager } from '@/services/ui/DisplayManager';

interface AssistantBrowserPanelProps {
  browserUrl: string;
  setBrowserUrl: (url: string) => void;
  uiState: any;
  setBrowserCompatibilityMode: (val: boolean) => void;
  setBrowserReaderMode: (val: boolean) => void;
  handleDetachPanel: (id: string) => void;
}

export const AssistantBrowserPanel: React.FC<AssistantBrowserPanelProps> = ({
  browserUrl,
  setBrowserUrl,
  uiState,
  setBrowserCompatibilityMode,
  setBrowserReaderMode,
  handleDetachPanel
}) => {
  return (
    <div className="flex-1 border-l bg-background h-full overflow-hidden flex flex-col">
      <div className="p-3 border-b bg-muted/30 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Globe className="h-4 w-4 text-primary" />
          <div className="flex-1 relative group/browser">
            <input
              type="text"
              value={browserUrl}
              onChange={(e) => setBrowserUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  const url = val.startsWith('http') ? val : `https://www.google.com/search?q=${encodeURIComponent(val)}`;
                  setBrowserUrl(url);
                  displayManager.syncState({ type: 'SYNC_STATE', panel: 'browser', state: { ...uiState, browserUrl: url } });
                }
              }}
              className="w-full h-8 pl-3 pr-10 bg-background border border-border/40 rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-primary/20 outline-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <RotateCcw className="h-3 w-3 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => {
                const current = browserUrl;
                setBrowserUrl('');
                setTimeout(() => setBrowserUrl(current), 10);
              }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip content="Compatibility Mode: Use proxy to bypass iframe blocking">
              <Button
                variant={uiState.browserCompatibilityMode ? "default" : "ghost"}
                size="icon"
                className={cn("h-7 w-7", uiState.browserCompatibilityMode && "bg-blue-600 text-white")}
                onClick={() => {
                  const newMode = !uiState.browserCompatibilityMode;
                  setBrowserCompatibilityMode(newMode);
                  displayManager.syncState({ type: 'SYNC_STATE', panel: 'browser', state: { ...uiState, browserCompatibilityMode: newMode } });
                }}
              >
                <Zap className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content="Reader Mode: Clean text extraction">
              <Button
                variant={uiState.browserReaderMode ? "default" : "ghost"}
                size="icon"
                className={cn("h-7 w-7", uiState.browserReaderMode && "bg-emerald-600 text-white")}
                onClick={() => setBrowserReaderMode(!uiState.browserReaderMode)}
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          </TooltipProvider>

          <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => handleDetachPanel('browser')}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {uiState.browserReaderMode ? (
          <div className="h-full w-full bg-white p-12 overflow-y-auto text-slate-800 selection:bg-emerald-100 prose prose-slate max-w-none">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 mb-8 text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
                <Bot className="h-4 w-4" />
                AI Enhanced Reader View
              </div>
              <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Extracting content...</h1>
              <p className="text-lg opacity-70 leading-relaxed">
                The AI is currently processing the page at {browserUrl || 'no URL'} to provide you with a clean, distraction-free reading experience.
              </p>
              <div className="mt-12 space-y-6 opacity-30 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-[90%]" />
                <div className="h-4 bg-slate-200 rounded w-[95%]" />
                <div className="h-4 bg-slate-200 rounded w-[85%]" />
              </div>
            </div>
          </div>
        ) : browserUrl ? (
          <iframe
            src={uiState.browserCompatibilityMode
              ? `https://api.allorigins.win/raw?url=${encodeURIComponent(browserUrl)}`
              : browserUrl
            }
            className="w-full h-full border-none bg-white"
            title="Smart Browser"
            key={uiState.browserCompatibilityMode ? 'proxied' : 'direct'}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400 text-xs italic">
            Ready to browse...
          </div>
        )}
        {!uiState.browserCompatibilityMode && !uiState.browserReaderMode && browserUrl && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-50 to-amber-50/95 dark:from-amber-950 dark:to-amber-950/95 border-t border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center gap-3 z-10">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
              <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-200 flex-1">
              <strong>Site blocked?</strong> Many sites prevent embedding. Enable <strong>⚡ Compatibility Mode</strong> to load them.
            </p>
            <Button
              size="sm"
              className="h-7 px-3 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              onClick={() => {
                const newMode = true;
                setBrowserCompatibilityMode(newMode);
                displayManager.syncState({ type: 'SYNC_STATE', panel: 'browser', state: { ...uiState, browserCompatibilityMode: newMode } });
              }}
            >
              <Zap className="h-3 w-3 mr-1" />
              Enable
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
