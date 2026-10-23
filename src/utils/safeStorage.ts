// Safe storage middleware for Zustand to handle LocalStorage quota exceeded errors

import { errorRecoverySystem } from '../services/ErrorRecoverySystem';

export interface SafeStorageOptions {
  maxRetries?: number;
  clearOldDataOnQuotaExceeded?: boolean;
  keyPrefix?: string;
  compressionEnabled?: boolean;
}

export class SafeStorage {
  private options: Required<SafeStorageOptions>;

  constructor(options: SafeStorageOptions = {}) {
    this.options = {
      maxRetries: 3,
      clearOldDataOnQuotaExceeded: true,
      keyPrefix: 'app_',
      compressionEnabled: false,
      ...options
    };
  }

  getItem(name: string): string | null {
    try {
      const item = localStorage.getItem(name);
      if (!item) return null;

      // Decompress if enabled
      if (this.options.compressionEnabled) {
        return this.decompress(item);
      }
      
      return item;
    } catch (error) {
      console.warn(`[SafeStorage] Failed to get item ${name}:`, error);
      return null;
    }
  }

  setItem(name: string, value: string): void {
    let attempts = 0;
    let processedValue = value;

    // Compress if enabled
    if (this.options.compressionEnabled) {
      processedValue = this.compress(value);
    }

    while (attempts < this.options.maxRetries) {
      try {
        localStorage.setItem(name, processedValue);
        return; // Success
      } catch (error) {
        attempts++;
        
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn(`[SafeStorage] QuotaExceededError on attempt ${attempts} for ${name}`);
          
          // Capture the quota error
          const errorId = errorRecoverySystem.captureQuotaError(
            `LocalStorage quota exceeded for key: ${name}`,
            {
              key: name,
              attempt: attempts,
              maxRetries: this.options.maxRetries,
              valueSize: processedValue.length,
              totalStorage: this.getTotalStorageSize()
            }
          );
          
          if (this.options.clearOldDataOnQuotaExceeded) {
            this.clearOldData(name);
          }
          
          // Try compression on the value if not already compressed
          if (!this.options.compressionEnabled && attempts === 1) {
            processedValue = this.compress(value);
            console.log(`[SafeStorage] Applying compression to ${name}`);
            continue;
          }
          
          // If still failing, try clearing the current store and retry
          if (attempts === this.options.maxRetries - 1) {
            console.warn(`[SafeStorage] Clearing ${name} due to quota issues`);
            this.removeItem(name);
            
            // Try storing a minimal version
            try {
              const minimalValue = this.createMinimalVersion(value);
              localStorage.setItem(name, minimalValue);
              console.log(`[SafeStorage] Stored minimal version of ${name}`);
              
              // Mark the error as resolved
              errorRecoverySystem.markResolved(errorId);
              return;
            } catch (minimalError) {
              console.error(`[SafeStorage] Failed to store even minimal version of ${name}:`, minimalError);
              
              // Capture the final failure
              errorRecoverySystem.captureQuotaError(
                `Failed to store even minimal version of ${name}`,
                {
                  key: name,
                  minimalError: minimalError instanceof Error ? minimalError.message : String(minimalError),
                  originalErrorId: errorId
                }
              );
            }
          }
        } else {
          console.error(`[SafeStorage] Unexpected error setting ${name}:`, error);
          
          // Capture unexpected storage errors
          errorRecoverySystem.captureStorageError(
            `Unexpected storage error for key: ${name}`,
            {
              key: name,
              error: error instanceof Error ? error.message : String(error),
              errorType: error instanceof Error ? error.constructor.name : 'Unknown'
            }
          );
          
          throw error;
        }
      }
    }
    
    console.error(`[SafeStorage] Failed to store ${name} after ${this.options.maxRetries} attempts`);
  }

  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn(`[SafeStorage] Failed to remove item ${name}:`, error);
    }
  }

  private clearOldData(excludeKey: string): void {
    const keysToRemove: string[] = [];
    
    try {
      // Find keys that match our prefix but aren't the current one
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.options.keyPrefix) && key !== excludeKey) {
          keysToRemove.push(key);
        }
      }
      
      // Remove old data
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`[SafeStorage] Cleared old data: ${key}`);
        } catch (error) {
          console.warn(`[SafeStorage] Failed to clear ${key}:`, error);
        }
      });
      
      // Also clear some browser cache items if needed
      this.clearBrowserCache();
      
    } catch (error) {
      console.warn('[SafeStorage] Error during old data cleanup:', error);
    }
  }

  private clearBrowserCache(): void {
    // Clear some common cache items that might be taking up space
    const commonCacheKeys = [
      'react-dev-tools',
      'redux-devtools',
      'last-visited',
      'user-preferences',
      'ui-state',
      'temp-data'
    ];
    
    commonCacheKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Ignore errors here
      }
    });
  }

  private getTotalStorageSize(): number {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      return totalSize;
    } catch (error) {
      console.warn('[SafeStorage] Error calculating total storage size:', error);
      return 0;
    }
  }

  private compress(value: string): string {
    try {
      // Simple compression using JSON minification and removing whitespace
      if (value.startsWith('{') || value.startsWith('[')) {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed); // This removes extra whitespace
      }
      return value.replace(/\s+/g, ' ').trim();
    } catch (error) {
      return value;
    }
  }

  private decompress(value: string): string {
    // Since we're not using real compression, just return the value
    return value;
  }

  private createMinimalVersion(value: string): string {
    try {
      const parsed = JSON.parse(value);
      
      // If it's a knowledge base store, keep only essential data
      if (parsed.state && parsed.state.documents) {
        return JSON.stringify({
          state: {
            documents: parsed.state.documents.slice(0, 10), // Keep only first 10 documents
            folders: parsed.state.folders?.slice(0, 5) || [], // Keep only first 5 folders
            lastSync: parsed.state.lastSync,
            initialized: parsed.state.initialized || false
          },
          version: parsed.version
        });
      }
      
      return JSON.stringify({ minimal: true, version: parsed.version || 1 });
    } catch (error) {
      return JSON.stringify({ minimal: true, error: 'failed to parse' });
    }
  }

  // Get current storage usage
  getStorageUsage(): { used: number; available: number; percentage: number } {
    let used = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.warn('[SafeStorage] Failed to calculate storage usage:', error);
    }

    // Estimate available space (typical limit is 5-10MB)
    const estimated = 5 * 1024 * 1024; // 5MB estimate
    const available = Math.max(0, estimated - used);
    const percentage = (used / estimated) * 100;

    return { used, available, percentage };
  }
}

// Create a singleton instance
export const safeStorage = new SafeStorage({
  keyPrefix: 'genieflow_',
  clearOldDataOnQuotaExceeded: true,
  compressionEnabled: true
});

// Zustand storage interface implementation
export const zustandSafeStorage = {
  getItem: (name: string): string | null | Promise<string | null> => {
    return safeStorage.getItem(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    safeStorage.setItem(name, value);
  },
  removeItem: (name: string): void | Promise<void> => {
    safeStorage.removeItem(name);
  }
};
