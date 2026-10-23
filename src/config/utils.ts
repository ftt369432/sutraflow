/**
 * Utility functions for environment configuration
 */

/**
 * Get an environment variable with fallback
 */
export function getEnvironmentVariable(key: string, defaultValue: string = ''): string {
  const value = import.meta.env ? import.meta.env[key] || defaultValue : defaultValue;
  return value as string;
}

/**
 * Parse a boolean environment variable
 */
export function parseBoolean(value: string | undefined | null): boolean {
  if (!value) return false;
  return value.toLowerCase() === 'true';
}

/**
 * Parse a numeric environment variable
 */
export function parseNumber(value: string | undefined | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
} 