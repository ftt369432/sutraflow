/**
 * 🔢 TokenUsagePanel — Real-time AI Usage Dashboard
 * 
 * Shows token consumption, provider breakdown, source attribution,
 * and cost estimates in a collapsible panel matching Light & Dark themes.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { TokenTracker, type TokenEvent, type SessionStats } from '../../services/ai/TokenTracker';
import { Activity, ChevronDown, ChevronUp, Zap, Clock, AlertTriangle, Flame, Eye, EyeOff, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const CATEGORY_COLORS: Record<string, string> = {
  chat: '#3b82f6',       // blue
  agentic: '#f59e0b',    // amber
  utility: '#8b5cf6',    // purple
  learning: '#10b981',   // emerald
  embedding: '#6366f1',  // indigo
  canvas: '#ec4899',     // pink
  system: '#6b7280',     // gray
};

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  gemini: { label: 'Gemini', color: '#4285f4' },
  groq:   { label: 'Groq LPU', color: '#f97316' },
  mock:   { label: 'Mock (Offline)', color: '#9ca3af' },
  openai: { label: 'OpenAI', color: '#10a37f' },
  private:{ label: 'Private (Local GPU)', color: '#7c3aed' },
};

export const TokenUsagePanel: React.FC = () => {
  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = themeContext.isDark;
  } catch {
    isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  }

  const [stats, setStats] = useState<SessionStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<TokenEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean>(
    () => localStorage.getItem('genieflow_show_token_tracker') !== 'false'
  );

  useEffect(() => {
    // Initial load
    setStats(TokenTracker.getSessionStats());
    setRecentEvents(TokenTracker.getRecentEvents(15));

    // Listen for settings changes from other components (Settings page)
    const handleStorage = () => {
      setIsVisible(localStorage.getItem('genieflow_show_token_tracker') !== 'false');
    };
    window.addEventListener('storage', handleStorage);

    // Subscribe to real-time updates
    const unsub = TokenTracker.subscribe((newStats, _event) => {
      setStats({ ...newStats });
      setRecentEvents(TokenTracker.getRecentEvents(15));
    });

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const daily = useMemo(() => TokenTracker.getDailyStats(), [stats?.totalCalls]);

  if (!stats || !isVisible) return null;

  const sessionMinutes = Math.max(1, Math.round((Date.now() - stats.sessionStartTime) / 60000));
  const tokensPerMinute = Math.round(stats.totalTokens / sessionMinutes);

  // Theme-aware color palette
  const themeStyles = isDark ? {
    barBg: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))',
    barBorder: '1px solid rgba(255,255,255,0.1)',
    textColor: '#e2e8f0',
    secondaryText: '#94a3b8',
    panelBg: 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(10,15,30,0.98))',
    panelBorder: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    cardBg: 'rgba(255,255,255,0.04)',
    progressBg: 'rgba(255,255,255,0.08)',
    buttonBg: 'rgba(255,255,255,0.05)',
    buttonBorder: 'rgba(255,255,255,0.1)',
    feedBorder: 'rgba(255,255,255,0.05)',
    tipColor: '#64748b',
    codeBg: 'rgba(255,255,255,0.06)'
  } : {
    barBg: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
    barBorder: '1px solid rgba(203,213,225,0.8)',
    textColor: '#0f172a',
    secondaryText: '#64748b',
    panelBg: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.98))',
    panelBorder: '1px solid rgba(203,213,225,0.8)',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    cardBg: 'rgba(0,0,0,0.03)',
    progressBg: 'rgba(0,0,0,0.06)',
    buttonBg: 'rgba(0,0,0,0.04)',
    buttonBorder: 'rgba(203,213,225,0.8)',
    feedBorder: 'rgba(0,0,0,0.06)',
    tipColor: '#94a3b8',
    codeBg: 'rgba(0,0,0,0.06)'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      zIndex: 9999,
      fontFamily: "'Inter', -apple-system, sans-serif",
      fontSize: 12,
      width: isExpanded ? 380 : 230,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {/* Collapsed Mini Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: themeStyles.barBg,
          backdropFilter: 'blur(20px)',
          border: themeStyles.barBorder,
          borderRadius: isExpanded ? '16px 16px 0 0' : 16,
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: themeStyles.textColor,
          boxShadow: themeStyles.boxShadow,
        }}
      >
        <Zap size={14} color="#f59e0b" />
        <span style={{ fontWeight: 700, flex: 1 }}>
          {stats.totalTokens.toLocaleString()} tokens
        </span>
        <span style={{ color: themeStyles.secondaryText, fontSize: 10 }}>
          {stats.totalCalls} calls
        </span>
        <span style={{ color: '#10b981', fontSize: 10, fontWeight: 700 }}>
          {stats.totalCost === 0 ? 'FREE' : `$${stats.totalCost.toFixed(4)}`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <div
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem('genieflow_show_token_tracker', 'false');
              setIsVisible(false);
              window.dispatchEvent(new Event('storage'));
            }}
            title="Hide token panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
              borderRadius: 4,
              opacity: 0.5,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
          >
            <X size={11} />
          </div>
        </div>
      </div>

      {/* Expanded Dashboard */}
      {isExpanded && (
        <div style={{
          background: themeStyles.panelBg,
          backdropFilter: 'blur(20px)',
          border: themeStyles.panelBorder,
          borderTop: 'none',
          borderRadius: '0 0 16px 16px',
          padding: 14,
          color: themeStyles.textColor,
          maxHeight: 480,
          overflowY: 'auto',
          boxShadow: themeStyles.boxShadow,
        }}>
          {/* Session Summary Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <StatBox icon={<Activity size={12} />} label="Rate" value={`${tokensPerMinute}/min`} color="#3b82f6" isDark={isDark} />
            <StatBox icon={<Clock size={12} />} label="Session" value={`${sessionMinutes}m`} color="#8b5cf6" isDark={isDark} />
            <StatBox icon={<AlertTriangle size={12} />} label="Failed" value={`${stats.failedCalls}`} color={stats.failedCalls > 0 ? '#ef4444' : '#10b981'} isDark={isDark} />
          </div>

          {/* Daily Cumulative */}
          <div style={{ 
            background: themeStyles.cardBg, 
            borderRadius: 8, 
            padding: '6px 10px', 
            marginBottom: 10, 
            fontSize: 10,
            border: isDark ? 'none' : '1px solid rgba(226,232,240,0.8)'
          }}>
            <span style={{ color: themeStyles.secondaryText }}>📅 Today: </span>
            <span style={{ fontWeight: 700 }}>{daily.totalTokens.toLocaleString()} tokens</span>
            <span style={{ color: themeStyles.secondaryText }}> / </span>
            <span>{daily.totalCalls} calls</span>
            <span style={{ color: '#10b981', marginLeft: 6, fontWeight: 700 }}>
              {daily.totalCost === 0 ? 'FREE' : `$${daily.totalCost.toFixed(4)}`}
            </span>
          </div>

          {/* Provider Breakdown */}
          <SectionLabel color={themeStyles.secondaryText}>By Provider</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {Object.entries(stats.byProvider).map(([provider, data]) => {
              const info = PROVIDER_LABELS[provider] || { label: provider, color: '#94a3b8' };
              const pct = stats.totalTokens > 0 ? Math.round((data.tokens / stats.totalTokens) * 100) : 0;
              return (
                <div key={provider} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 500 }}>{info.label}</span>
                  <span style={{ fontSize: 10, color: themeStyles.secondaryText }}>{data.calls} calls</span>
                  <div style={{ width: 60, height: 4, background: themeStyles.progressBg, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: info.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Category Breakdown */}
          <SectionLabel color={themeStyles.secondaryText}>By Category</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {Object.entries(stats.byCategory).sort((a, b) => b[1].tokens - a[1].tokens).map(([cat, data]) => (
              <div key={cat} style={{
                background: `${CATEGORY_COLORS[cat] || '#6b7280'}18`,
                border: `1px solid ${CATEGORY_COLORS[cat] || '#6b7280'}35`,
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: themeStyles.textColor
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: CATEGORY_COLORS[cat] || '#6b7280' }} />
                <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                <span style={{ fontWeight: 700 }}>{data.calls}</span>
              </div>
            ))}
          </div>

          {/* Top Sources (Token Consumers) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <SectionLabel color={themeStyles.secondaryText} style={{ marginBottom: 0 }}>Top Sources</SectionLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
            {Object.entries(stats.bySource)
              .sort((a, b) => b[1].tokens - a[1].tokens)
              .slice(0, 5)
              .map(([source, data]) => (
                <div key={source} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                  <Flame size={10} color="#f59e0b" />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{source}</span>
                  <span style={{ fontWeight: 700 }}>{data.tokens.toLocaleString()}</span>
                  <span style={{ color: themeStyles.secondaryText }}>({data.calls})</span>
                </div>
              ))}
          </div>

          {/* Live Feed Toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowFeed(!showFeed); }}
            style={{
              width: '100%',
              background: themeStyles.buttonBg,
              border: `1px solid ${themeStyles.buttonBorder}`,
              borderRadius: 8,
              padding: '6px 10px',
              color: themeStyles.secondaryText,
              fontSize: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.2s',
            }}
          >
            {showFeed ? <EyeOff size={10} /> : <Eye size={10} />}
            {showFeed ? 'Hide' : 'Show'} Live Feed
          </button>

          {/* Live Event Feed */}
          {showFeed && (
            <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
              {recentEvents.map((evt) => (
                <div key={evt.id} style={{
                  display: 'flex',
                  gap: 6,
                  padding: '4px 0',
                  borderBottom: `1px solid ${themeStyles.feedBorder}`,
                  fontSize: 10,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ color: evt.success ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                    {evt.success ? '✓' : '✗'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ 
                        background: `${CATEGORY_COLORS[evt.category] || '#6b7280'}20`, 
                        padding: '0 4px', 
                        borderRadius: 3,
                        textTransform: 'capitalize',
                        fontSize: 9,
                        color: themeStyles.textColor 
                      }}>
                        {evt.category}
                      </span>
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {evt.source}
                      </span>
                    </div>
                    <div style={{ color: themeStyles.secondaryText, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.promptPreview}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, flexShrink: 0, color: '#f59e0b' }}>
                    {evt.totalTokens.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Console Tip */}
          <div style={{ marginTop: 8, fontSize: 9, color: themeStyles.tipColor, textAlign: 'center' }}>
            💡 Run <code style={{ background: themeStyles.codeBg, padding: '1px 4px', borderRadius: 3 }}>getTokenStats()</code> in Console
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components
const StatBox: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; isDark: boolean }> = ({ icon, label, value, color, isDark }) => (
  <div style={{
    background: `${color}12`,
    border: `1px solid ${color}25`,
    borderRadius: 8,
    padding: '6px 8px',
    textAlign: 'center',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color, marginBottom: 2 }}>
      {icon}
      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#f1f5f9' : '#0f172a' }}>{value}</div>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; color?: string }> = ({ children, style, color }) => (
  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: color || '#64748b', fontWeight: 700, marginBottom: 6, ...style }}>
    {children}
  </div>
);

export default TokenUsagePanel;
