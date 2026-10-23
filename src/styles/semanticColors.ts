/**
 * Semantic Color Utility — Sutra Desktop
 *
 * Single source of truth for all status, priority, and category colors.
 * All values resolve to CSS custom properties defined in theme-colors.css.
 * DO NOT use hardcoded Tailwind colors (bg-red-600, bg-green-100, etc.)
 * in components — import and use these instead.
 */

// ---------------------------------------------------------------------------
// Status Colors — agent state, automation status, connection state
// ---------------------------------------------------------------------------
export const statusColors = {
  /** Running, connected, online, completed successfully */
  active:    'badge-active',
  success:   'badge-active',
  completed: 'badge-active',
  online:    'badge-active',
  connected: 'badge-active',

  /** Paused, needs attention, delayed */
  paused:    'badge-warning',
  warning:   'badge-warning',
  pending:   'badge-warning',
  delayed:   'badge-warning',

  /** Error, failed, urgent, disconnected */
  error:        'badge-critical',
  failed:       'badge-critical',
  critical:     'badge-critical',
  urgent:       'badge-critical',
  disconnected: 'badge-critical',

  /** Info, calendar, dates, scheduled */
  info:      'badge-info',
  scheduled: 'badge-info',
  calendar:  'badge-info',

  /** Default, idle, inactive, low */
  idle:     'badge-neutral',
  inactive: 'badge-neutral',
  default:  'badge-neutral',
  neutral:  'badge-neutral',

  /** Legal, special category, accent */
  legal:   'badge-accent',
  special: 'badge-accent',
  court:   'badge-accent',
} as const satisfies Record<string, string>;

export type StatusKey = keyof typeof statusColors;

/** Resolve a status string to its semantic badge class. Falls back to neutral. */
export function getStatusClass(status: string | undefined | null): string {
  if (!status) return statusColors.neutral;
  const key = status.toLowerCase() as StatusKey;
  return statusColors[key] ?? statusColors.neutral;
}

// ---------------------------------------------------------------------------
// Priority Colors — task priority, email urgency, document importance
// ---------------------------------------------------------------------------
export const priorityColors = {
  high:   'badge-critical',
  urgent: 'badge-critical',
  medium: 'badge-warning',
  low:    'badge-neutral',
  none:   'badge-neutral',
} as const satisfies Record<string, string>;

export type PriorityKey = keyof typeof priorityColors;

/** Resolve a priority string to its semantic badge class. Falls back to neutral. */
export function getPriorityClass(priority: string | undefined | null): string {
  if (!priority) return priorityColors.none;
  const key = priority.toLowerCase() as PriorityKey;
  return priorityColors[key] ?? priorityColors.none;
}

// ---------------------------------------------------------------------------
// Priority Dot Classes — small colored circle indicators (no text)
// ---------------------------------------------------------------------------
export const priorityDotColors = {
  high:   'priority-dot-high',
  urgent: 'priority-dot-high',
  medium: 'priority-dot-medium',
  low:    'priority-dot-low',
  none:   'priority-dot-low',
} as const satisfies Record<string, string>;

export function getPriorityDotClass(priority: string | undefined | null): string {
  if (!priority) return priorityDotColors.none;
  const key = priority.toLowerCase() as keyof typeof priorityDotColors;
  return priorityDotColors[key] ?? priorityDotColors.none;
}

// ---------------------------------------------------------------------------
// Category Colors — email/automation category chips
// ---------------------------------------------------------------------------
export const categoryColors: Record<string, string> = {
  court:      'badge-accent filter-chip filter-chip-accent',
  legal:      'badge-accent filter-chip filter-chip-accent',
  calendar:   'badge-info   filter-chip filter-chip-info',
  scheduling: 'badge-info   filter-chip filter-chip-info',
  unread:     'badge-warning filter-chip filter-chip-warning',
  urgent:     'badge-critical filter-chip filter-chip-critical',
  attachment: 'badge-neutral filter-chip filter-chip-neutral',
  analysis:   'badge-neutral filter-chip filter-chip-neutral',
  automation: 'badge-active  filter-chip filter-chip-active',
  active:     'badge-active  filter-chip filter-chip-active',
};

export function getCategoryClass(category: string | undefined | null): string {
  if (!category) return 'badge-neutral';
  return categoryColors[category.toLowerCase()] ?? 'badge-neutral';
}

// ---------------------------------------------------------------------------
// Chart / Analytics Colors — hex values for Chart.js / recharts
// These pull from the same semantic palette as CSS variables
// ---------------------------------------------------------------------------
export const chartColors = {
  active:   '#5eead4', // --status-active-text (teal shimmer)
  warning:  '#fbbf24', // --status-warning-text (amber shimmer)
  critical: '#fda4af', // --status-critical-text (rose shimmer)
  info:     '#a5b4fc', // --blue-metallic-300
  neutral:  '#d1d5db', // --gray-metallic-300
  accent:   '#a5b4fc', // --blue-metallic-300 (navy steel)
} as const;

export const priorityChartColors = {
  high:   chartColors.critical,
  urgent: chartColors.critical,
  medium: chartColors.warning,
  low:    chartColors.neutral,
} as const;
