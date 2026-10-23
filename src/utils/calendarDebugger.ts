/**
 * 🔍 Calendar Debug Utility
 * 
 * Provides debugging and monitoring capabilities for calendar operations.
 * Helps track errors, performance, and system health.
 */

export interface CalendarDebugEvent {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'calendar' | 'events' | 'tasks' | 'sync' | 'auth' | 'parsing';
  message: string;
  data?: any;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

export interface CalendarHealthMetrics {
  totalEvents: number;
  successfulSyncs: number;
  failedSyncs: number;
  authErrors: number;
  parsingErrors: number;
  lastSuccessfulSync?: Date;
  lastError?: CalendarDebugEvent;
  averageResponseTime: number;
  uptime: number;
}

class CalendarDebugger {
  private events: CalendarDebugEvent[] = [];
  private metrics: CalendarHealthMetrics = {
    totalEvents: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    authErrors: 0,
    parsingErrors: 0,
    averageResponseTime: 0,
    uptime: Date.now()
  };
  private maxEvents = 1000; // Keep last 1000 events
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    return `cal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Log a debug event
   */
  log(
    level: CalendarDebugEvent['level'],
    category: CalendarDebugEvent['category'],
    message: string,
    data?: any,
    error?: Error
  ): void {
    const event: CalendarDebugEvent = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      error,
      sessionId: this.sessionId
    };

    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Update metrics
    this.updateMetrics(event);

    // Console logging based on level
    const logData = { ...event, sessionId: this.sessionId };
    switch (level) {
      case 'error':
        console.error(`🚨 [Calendar ${category}]`, message, logData);
        break;
      case 'warn':
        console.warn(`⚠️ [Calendar ${category}]`, message, logData);
        break;
      case 'info':
        console.info(`ℹ️ [Calendar ${category}]`, message, logData);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(`🔍 [Calendar ${category}]`, message, logData);
        }
        break;
    }

    // In production, you might want to send errors to a monitoring service
    if (level === 'error' && process.env.NODE_ENV === 'production') {
      this.reportToMonitoringService(event);
    }
  }

  private updateMetrics(event: CalendarDebugEvent): void {
    this.metrics.totalEvents++;

    switch (event.category) {
      case 'sync':
        if (event.level === 'error') {
          this.metrics.failedSyncs++;
          this.metrics.lastError = event;
        } else if (event.level === 'info' && event.message.includes('successful')) {
          this.metrics.successfulSyncs++;
          this.metrics.lastSuccessfulSync = event.timestamp;
        }
        break;
      case 'auth':
        if (event.level === 'error') {
          this.metrics.authErrors++;
        }
        break;
      case 'parsing':
        if (event.level === 'error') {
          this.metrics.parsingErrors++;
        }
        break;
    }
  }

  private async reportToMonitoringService(event: CalendarDebugEvent): Promise<void> {
    try {
      // Replace with your monitoring service (e.g., Sentry, LogRocket, etc.)
      // await monitoringService.captureException(event.error, {
      //   extra: {
      //     category: event.category,
      //     message: event.message,
      //     data: event.data,
      //     sessionId: event.sessionId
      //   }
      // });
      console.error('📡 Would report to monitoring service:', event);
    } catch (reportError) {
      console.error('Failed to report to monitoring service:', reportError);
    }
  }

  /**
   * Get recent events by category or level
   */
  getEvents(filter?: {
    category?: CalendarDebugEvent['category'];
    level?: CalendarDebugEvent['level'];
    since?: Date;
    limit?: number;
  }): CalendarDebugEvent[] {
    let filtered = this.events;

    if (filter?.category) {
      filtered = filtered.filter(e => e.category === filter.category);
    }

    if (filter?.level) {
      filtered = filtered.filter(e => e.level === filter.level);
    }

    if (filter?.since) {
      filtered = filtered.filter(e => e.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get current health metrics
   */
  getMetrics(): CalendarHealthMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime
    };
  }

  /**
   * Generate a health report
   */
  generateHealthReport(): string {
    const metrics = this.getMetrics();
    const recentErrors = this.getEvents({ level: 'error', limit: 5 });
    const successRate = metrics.totalEvents > 0 
      ? ((metrics.successfulSyncs / (metrics.successfulSyncs + metrics.failedSyncs)) * 100).toFixed(1)
      : '0';

    return `
📊 Calendar System Health Report
Generated: ${new Date().toISOString()}
Session: ${this.sessionId}

📈 Metrics:
- Total Events: ${metrics.totalEvents}
- Successful Syncs: ${metrics.successfulSyncs}
- Failed Syncs: ${metrics.failedSyncs}
- Success Rate: ${successRate}%
- Auth Errors: ${metrics.authErrors}
- Parsing Errors: ${metrics.parsingErrors}
- Last Sync: ${metrics.lastSuccessfulSync?.toISOString() || 'Never'}
- Uptime: ${Math.floor(metrics.uptime / 1000 / 60)} minutes

🚨 Recent Errors:
${recentErrors.length === 0 ? 'None' : recentErrors.map(e => 
  `- ${e.timestamp.toISOString()}: [${e.category}] ${e.message}`
).join('\n')}
    `.trim();
  }

  /**
   * Clear debug history
   */
  clear(): void {
    this.events = [];
    this.metrics = {
      totalEvents: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      authErrors: 0,
      parsingErrors: 0,
      averageResponseTime: 0,
      uptime: Date.now()
    };
  }

  /**
   * Export debug data
   */
  export(): { events: CalendarDebugEvent[]; metrics: CalendarHealthMetrics } {
    return {
      events: this.events,
      metrics: this.getMetrics()
    };
  }
}

// Singleton instance
export const calendarDebugger = new CalendarDebugger();

// Convenience methods for common logging patterns
export const debugCalendar = {
  info: (category: CalendarDebugEvent['category'], message: string, data?: any) =>
    calendarDebugger.log('info', category, message, data),
  
  warn: (category: CalendarDebugEvent['category'], message: string, data?: any) =>
    calendarDebugger.log('warn', category, message, data),
  
  error: (category: CalendarDebugEvent['category'], message: string, error?: Error, data?: any) =>
    calendarDebugger.log('error', category, message, data, error),
  
  debug: (category: CalendarDebugEvent['category'], message: string, data?: any) =>
    calendarDebugger.log('debug', category, message, data),

  // Specific helper methods
  authError: (message: string, error?: Error) =>
    calendarDebugger.log('error', 'auth', message, undefined, error),
  
  syncSuccess: (message: string, data?: any) =>
    calendarDebugger.log('info', 'sync', `Sync successful: ${message}`, data),
  
  syncError: (message: string, error?: Error) =>
    calendarDebugger.log('error', 'sync', `Sync failed: ${message}`, undefined, error),
  
  parsingError: (message: string, email?: any, error?: Error) =>
    calendarDebugger.log('error', 'parsing', message, { email }, error),

  healthReport: () => calendarDebugger.generateHealthReport()
};

export default calendarDebugger;
