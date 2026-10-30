import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

/**
 * Combines class names with Tailwind's merge utility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get avatar URL - either from provided URL or use default based on name/id
 */
export function getAvatar(avatarUrl?: string | null, name?: string, id?: string): string {
  // If avatarUrl starts with http or data URI, use it directly
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:'))) {
    return avatarUrl;
  }
  
  // Default avatar options
  const defaultOptions = [
    'default-avatar.svg',
    'avatar-female-1.svg', 
    'avatar-female-2.svg', 
    'avatar-male-1.svg'
  ];

  // If avatarUrl exists and looks like an image file/path
  if (avatarUrl && (/\.(svg|png|jpg|jpeg|webp|gif|ico)(\?.*)?$/i.test(avatarUrl) || avatarUrl.includes('/images/'))) {
    const cleanPath = avatarUrl.replace(/^\.?\/images\//, '').replace(/^\//, '');
    if (cleanPath.startsWith('avatars/') || cleanPath.startsWith('logos/')) {
      return `./${cleanPath}`;
    }
    return `./images/${cleanPath}`;
  }
  
  // If avatarUrl is provided but doesn't look like an image, treat it as name fallback
  const effectiveName = name || (avatarUrl && !avatarUrl.includes('/') ? avatarUrl : undefined);

  // Use name to generate consistent avatar if provided
  if (effectiveName) {
    // Generate consistent index based on name using hash
    const hash = hashString(effectiveName);
    const index = hash % defaultOptions.length;
    return `./images/${defaultOptions[index]}`;
  }
  
  // Use id as fallback for name
  if (id) {
    // Generate consistent index based on id
    const hash = hashString(id);
    const index = hash % defaultOptions.length;
    return `./images/${defaultOptions[index]}`;
  }
  
  // Default fallback
  return `./images/${defaultOptions[0]}`;
}

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a date to a standard format (e.g., "Jan 1, 2023")
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  try {
    // Handle null or undefined
    if (date === null || date === undefined) {
      return 'N/A';
    }
    
    // Convert string to Date if needed
    let dateObj: Date;
    if (typeof date === 'string') {
      // Try to parse ISO string
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      // Assume timestamp
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Parse an ISO date string to a Date object
 */
export function parseISODate(dateString: string): string {
  return parseISO(dateString).toISOString();
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Truncates text to a certain length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate a random ID (for testing and demo purposes)
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Encrypt text using a simple base64 encoding (for demo purposes only)
 * Not secure for production - use a proper encryption library
 */
export function encryptDemo(text: string): string {
  return btoa(text);
}

/**
 * Decrypt text using a simple base64 decoding (for demo purposes only)
 * Not secure for production - use a proper encryption library
 */
export function decryptDemo(encryptedText: string): string {
  return atob(encryptedText);
}

// Breakpoints for responsive design
export const breakpoints = {
  'xs': 480,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
};

export type Breakpoint = keyof typeof breakpoints;

/**
 * Creates a stable hash from a string
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncates a string to a specified length
 * @param str String to truncate
 * @param length Maximum length (default: 50)
 * @returns Truncated string
 */
export function truncateString(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

/**
 * Safely accesses a nested property in an object
 * @param obj Object to access
 * @param path Path to property (e.g., 'user.profile.name')
 * @param defaultValue Default value if property doesn't exist
 * @returns Property value or default
 */
export function getNestedValue<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return (result === undefined || result === null) ? defaultValue : result;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param value Value to check
 * @returns True if empty, false otherwise
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// #region Encryption utilities
/**
 * Encrypt text (simple implementation for demo purposes)
 * In production, use a proper encryption library and secure key management
 */
export function encrypt(text: string): string {
  try {
    // This is just a basic example using base64 encoding
    const encoded = btoa(text);
    return encoded;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text (simple implementation for demo purposes)
 * In production, use a proper encryption library and secure key management
 */
export function decrypt(encryptedText: string): string {
  try {
    // This is just a basic example using base64 decoding
    const decoded = atob(encryptedText);
    return decoded;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure encryption key
 * @returns A string representing a secure random key
 */
export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare two strings in constant time (for security-sensitive comparisons)
 * @param a First string
 * @param b Second string
 * @returns True if strings are identical
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
// #endregion

// #region API Key validation
/**
 * Check if a key is a test key
 * @param key The API key to check
 * @returns True if the key is a test key
 */
export const isTestKey = (key: string | undefined): boolean => {
  return Boolean(key && key.startsWith('test-'));
};

/**
 * Validate an API key
 * @param key The API key to validate
 * @param prefix Optional prefix that the key should start with
 * @returns True if the key is valid
 */
export const validateApiKey = (key: string | undefined, prefix?: string): boolean => {
  if (isTestKey(key)) {
    return true;
  }

  if (!key) {
    return false;
  }

  if (prefix && !key.startsWith(prefix)) {
    return false;
  }

  return true;
};
// #endregion

// Cache for logged avatar URLs to prevent spam
const loggedAvatarUrls = new Set<string>();

/**
 * Safely handle avatar URLs that may be external and blocked by COEP.
 * Returns a safe local avatar if the URL is from a potentially blocked domain.
 * Special handling for Google User Content domains for profile pictures.
 */
export const getSafeAvatarUrl = (avatarUrl: string | undefined, fallbackName: string): string => {
  // If no avatar URL provided, use local fallback
  if (!avatarUrl) {
    return getAvatar(fallbackName);
  }
  
  // Google User Content domains (Google profile pictures) - these should be allowed
  const googleDomains = [
    'lh3.googleusercontent.com',
    'lh4.googleusercontent.com',
    'lh5.googleusercontent.com',
    'lh6.googleusercontent.com',
    'usercontent.google.com',
  ];
  
  const isGoogleDomain = googleDomains.some(domain => 
    avatarUrl.includes(domain)
  );
  
  // If it's a Google profile picture, try to use it directly
  // Add size parameter for better performance
  if (isGoogleDomain) {
    // Add size parameter if not already present for better loading
    if (!avatarUrl.includes('s=') && !avatarUrl.includes('=s')) {
      const separator = avatarUrl.includes('?') ? '&' : '?';
      return `${avatarUrl}${separator}s=200`; // 200px size for profile pictures
    }
    return avatarUrl;
  }
  
  // Check for other potentially blocked domains (excluding Google)
  const blockedDomains: string[] = [
    // Add other domains that might be blocked by COEP as needed
    // Note: Google domains removed to allow profile pictures
  ];
  
  const isBlockedDomain = blockedDomains.some(domain => 
    avatarUrl.includes(domain)
  );
  
  if (isBlockedDomain) {
    // Only log once per unique URL to reduce spam
    if (!loggedAvatarUrls.has(avatarUrl)) {
      console.debug('Avatar URL from potentially blocked domain, using fallback:', avatarUrl.substring(0, 50) + '...');
      loggedAvatarUrls.add(avatarUrl);
    }
    
    return getAvatar(fallbackName);
  }
  
  // Safe to use the original URL
  return avatarUrl;
};

// Add cache property to function
(getSafeAvatarUrl as any)._loggedUrls = new Set(); 