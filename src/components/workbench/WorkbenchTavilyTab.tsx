import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Globe, Key, ExternalLink } from 'lucide-react';
import {
  tavilyGrounding,
  TavilySearchResult,
  TavilySearchResponse,
  DOMAIN_GROUNDING_CONFIGS
} from '../../services/legal/TavilyGroundingService';

interface WorkbenchTavilyTabProps {
  activeDomainType: string;
  notepadText: string;
  onNotepadChange: (text: string) => void;
}

export const WorkbenchTavilyTab: React.FC<WorkbenchTavilyTabProps> = ({
  activeDomainType,
  notepadText,
  onNotepadChange
}) => {
  const groundingConfig = DOMAIN_GROUNDING_CONFIGS[activeDomainType || 'legal'] || DOMAIN_GROUNDING_CONFIGS.custom;

  const [tavilyQuery, setTavilyQuery] = useState('');
  const [tavilyLoading, setTavilyLoading] = useState(false);
  const [tavilyResults, setTavilyResults] = useState<TavilySearchResult[]>([]);
  const [tavilyAnswer, setTavilyAnswer] = useState<string>('');
  const [tavilyResponseTime, setTavilyResponseTime] = useState<number>(0);
  const [tavilyKey, setTavilyKey] = useState<string>(() => tavilyGrounding.getApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [recentSearches, setRecentSearches] = useState<TavilySearchResponse[]>(() => tavilyGrounding.getRecentSearches());
  const [selectedSearchQuery, setSelectedSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleSearchEvent = (e: any) => {
      const resp: TavilySearchResponse = e.detail;
      if (resp) {
        setTavilyResults(resp.results || []);
        setTavilyAnswer(resp.answer || '');
        setTavilyResponseTime(resp.responseTime || 0);
        setTavilyQuery(resp.query || '');
        setSelectedSearchQuery(resp.query || '');
        setRecentSearches(tavilyGrounding.getRecentSearches());
      }
    };

    const handleClearEvent = () => {
      setTavilyResults([]);
      setTavilyAnswer('');
      setTavilyResponseTime(0);
      setRecentSearches([]);
      setSelectedSearchQuery('');
    };

    window.addEventListener('genieflow_tavily_searched', handleSearchEvent);
    window.addEventListener('genieflow_tavily_cleared', handleClearEvent);

    const latest = tavilyGrounding.getLatestSearch();
    if (latest) {
      setTavilyResults(latest.results || []);
      setTavilyAnswer(latest.answer || '');
      setTavilyResponseTime(latest.responseTime || 0);
      setTavilyQuery(latest.query || '');
      setSelectedSearchQuery(latest.query || '');
    }

    return () => {
      window.removeEventListener('genieflow_tavily_searched', handleSearchEvent);
      window.removeEventListener('genieflow_tavily_cleared', handleClearEvent);
    };
  }, []);

  const handleSaveTavilyKey = (k: string) => {
    const trimmed = k.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('genieflow_tavily_key', trimmed);
    }
    setTavilyKey(trimmed);
    setShowKeyConfig(false);
  };

  const handleExecuteTavilySearch = async (overrideQuery?: string) => {
    const q = overrideQuery || tavilyQuery;
    if (!q) return;
    setTavilyLoading(true);
    try {
      const resp = await tavilyGrounding.searchPrecedents(q, {
        searchDepth: 'advanced',
        maxResults: 4,
        domainType: activeDomainType
      });
      setTavilyResults(resp.results || []);
      setTavilyAnswer(resp.answer || '');
      setTavilyResponseTime(resp.responseTime || 0);
      setSelectedSearchQuery(q);
      setRecentSearches(tavilyGrounding.getRecentSearches());
    } catch (_err) {
      // Handled gracefully by service fallbacks
    } finally {
      setTavilyLoading(false);
    }
  };

  const handleSelectPastSearch = (search: TavilySearchResponse) => {
    setSelectedSearchQuery(search.query);
    setTavilyQuery(search.query);
    setTavilyResults(search.results || []);
    setTavilyAnswer(search.answer || '');
    setTavilyResponseTime(search.responseTime || 0);
  };

  return (
    <div className="min-h-full flex flex-col space-y-4">
      {/* Header info */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{groundingConfig.headerTitle}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {groundingConfig.badgeLabel}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {groundingConfig.headerSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tavilyResponseTime > 0 && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {tavilyResponseTime}ms latency
              </span>
            )}
            {recentSearches.length > 0 && (
              <button
                onClick={() => tavilyGrounding.clearSearches()}
                className="text-[10px] font-medium text-slate-400 hover:text-rose-500 transition cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Domain Authority Chips */}
        <div className="mt-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Authoritative {groundingConfig.tabLabel} Fast Query Chips
          </div>
          <div className="flex flex-wrap gap-1.5">
            {groundingConfig.suggestedQueries.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setTavilyQuery(item.query);
                  handleExecuteTavilySearch(item.query);
                }}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition cursor-pointer"
              >
                + {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches History Bar */}
        {recentSearches.length > 1 && (
          <div className="mt-3 pt-2 border-t border-amber-500/15">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Recent Swarm & User Grounding Sessions ({recentSearches.length})
            </div>
            <div className="flex flex-wrap gap-1.5 overflow-x-auto max-h-16 py-0.5">
              {recentSearches.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPastSearch(s)}
                  className={`px-2 py-0.5 rounded text-[10px] truncate max-w-[220px] transition cursor-pointer ${
                    selectedSearchQuery === s.query
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title={s.query}
                >
                  {s.query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* API Key Connection Status & Setup Bar */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Key className={`w-3.5 h-3.5 ${tavilyKey ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {tavilyKey ? 'Tavily Search Engine Connected' : 'Tavily API Key Not Hooked Up'}
            </span>
            {tavilyKey ? (
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Active ({tavilyKey.slice(0, 6)}...{tavilyKey.slice(-4)})
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                Action Required
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowKeyConfig((prev) => !prev)}
            className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
          >
            {showKeyConfig ? 'Cancel' : tavilyKey ? 'Update Key' : 'Hook Up Key Now'}
          </button>
        </div>

        {showKeyConfig && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste your Tavily API Key (tvly-...)"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => handleSaveTavilyKey(keyInput)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer"
            >
              Save Key
            </button>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={tavilyQuery}
            onChange={(e) => setTavilyQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteTavilySearch()}
            placeholder={groundingConfig.searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
          />
        </div>
        <button
          onClick={() => handleExecuteTavilySearch()}
          disabled={tavilyLoading}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {tavilyLoading ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Ground Query</span>
            </>
          )}
        </button>
      </div>

      {/* Results or Empty State */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {tavilyAnswer && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tavily Grounded Summary</span>
            </div>
            <p className="text-xs leading-relaxed">
              {tavilyAnswer}
            </p>
          </div>
        )}

        {tavilyResults.length > 0 ? (
          tavilyResults.map((result, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>{result.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  {Math.round((result.score || 0.95) * 100)}% Match
                </span>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 my-2 leading-relaxed italic border-l-2 border-amber-500/40 pl-2">
                "{result.content}"
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                <span className="text-slate-400 truncate max-w-[280px]">
                  {result.url}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const snippet = `\n\n### Grounded Authority: ${result.title}\nURL: ${result.url}\nQuote: "${result.content}"\n`;
                      onNotepadChange(notepadText + snippet);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    + Append to Scratchpad
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : !tavilyLoading && (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Globe className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No active Tavily searches yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Click one of the suggested query chips above or run a custom query to ground {groundingConfig.tabLabel.toLowerCase()} with live web verification.
            </p>
            <button
              onClick={() => handleExecuteTavilySearch(groundingConfig.suggestedQueries[0]?.query || 'Authoritative industry standards')}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer"
            >
              Run Sample {groundingConfig.tabLabel} Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
