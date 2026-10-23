/**
 * Color utility functions
 */

/**
 * Calculate a contrasting text color (black or white) based on background color
 * @param backgroundColor - Hex color string (#RRGGBB)
 * @returns Contrasting text color (#000000 or #FFFFFF)
 */
export function getContrastingTextColor(backgroundColor: string): string {
  // Remove hash if present
  const color = backgroundColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate luminance
  // Formula: 0.299*R + 0.587*G + 0.114*B
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for bright backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Generate a random color in hex format
 * @returns Random hex color string
 */
export function generateRandomColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * Lighten or darken a color by a percentage
 * @param color - Hex color string
 * @param percent - Percentage to lighten (positive) or darken (negative)
 * @returns Modified hex color string
 */
export function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xff) + amt));
  
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Convert hex color to RGBA
 * @param hex - Hex color string
 * @param alpha - Alpha channel value (0-1)
 * @returns RGBA color string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
} 