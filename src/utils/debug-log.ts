/**
 * Debug logging utility
 * Logs to console and saves to localStorage for retrieval
 */

const LOG_KEY = 'debug_logs';

export function logDebug(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    data: data ? JSON.stringify(data, null, 2) : undefined
  };
  
  // Log to console
  console.warn(`[DEBUG] ${timestamp}: ${message}`, data);

  // Save to localStorage
  try {
    const existingLogs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    existingLogs.push(logEntry);
    // Keep only the last 100 logs
    const trimmedLogs = existingLogs.slice(-100);
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Failed to save log to localStorage:', error);
  }
}

export function getLogs(): unknown[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]') as unknown[];
  } catch (error) {
    console.error('Failed to retrieve logs from localStorage:', error);
    return [];
  }
}

export function clearLogs(): void {
  localStorage.removeItem(LOG_KEY);
}

export default {
  log: logDebug,
  getLogs,
  clearLogs
};