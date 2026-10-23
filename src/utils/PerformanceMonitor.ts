/**
 * PerformanceMonitor
 * 
 * A utility class to help track and optimize performance in document processing
 * and other potentially expensive operations.
 */
export class PerformanceMonitor {
  private static timers: Record<string, number> = {};
  private static thresholds: Record<string, number> = {
    'document-processing': 50, // ms
    'embedding-generation': 500, // ms
    'insight-calculation': 100, // ms
    'default': 100 // ms
  };
  
  private static warnings: Record<string, number> = {};
  
  /**
   * Start a performance timer
   * @param id Unique identifier for this operation
   */
  static start(id: string): void {
    this.timers[id] = performance.now();
  }
  
  /**
   * End a performance timer and check against thresholds
   * @param id Unique identifier matching a previous start() call
   * @param type Operation type for threshold checking
   * @returns Time elapsed in milliseconds
   */
  static end(id: string, type: string = 'default'): number {
    if (!this.timers[id]) {
      console.warn(`PerformanceMonitor: No timer found for ${id}`);
      return 0;
    }
    
    const elapsed = performance.now() - this.timers[id];
    delete this.timers[id];
    
    // Check against thresholds
    const threshold = this.thresholds[type] || this.thresholds.default;
    if (elapsed > threshold) {
      // Only warn once per hour for each unique operation
      const warningKey = `${id}-${type}`;
      const now = Date.now();
      if (!this.warnings[warningKey] || (now - this.warnings[warningKey] > 3600000)) {
        console.warn(`Performance warning: ${type} operation "${id}" took ${elapsed.toFixed(2)}ms (threshold: ${threshold}ms)`);
        this.warnings[warningKey] = now;
      }
    }
    
    return elapsed;
  }
  
  /**
   * Set a custom threshold for an operation type
   */
  static setThreshold(type: string, thresholdMs: number): void {
    this.thresholds[type] = thresholdMs;
  }
  
  /**
   * Execute a function with performance monitoring
   * @param fn Function to execute
   * @param id Identifier for this operation
   * @param type Operation type
   * @returns Result of the function
   */
  static async measure<T>(
    fn: () => Promise<T>, 
    id: string, 
    type: string = 'default'
  ): Promise<T> {
    this.start(id);
    try {
      return await fn();
    } finally {
      this.end(id, type);
    }
  }
  
  /**
   * Wrap a function with performance monitoring
   * @param fn Function to wrap
   * @param id Identifier prefix for this operation
   * @param type Operation type
   * @returns Wrapped function
   */
  static wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    idPrefix: string,
    type: string = 'default'
  ): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const id = `${idPrefix}-${Date.now()}`;
      return await this.measure(() => fn(...args), id, type);
    }) as T;
  }
  
  /**
   * Break down a large operation into smaller chunks with yielding
   * to prevent UI blocking
   * @param items Items to process
   * @param processFn Function to process each batch
   * @param options Options for chunking
   */
  static async processInChunks<T, R>(
    items: T[],
    processFn: (chunk: T[]) => Promise<R[]>,
    options: {
      chunkSize?: number;
      yieldEvery?: number;
      yieldTimeMs?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    const {
      chunkSize = 10,
      yieldEvery = 1,
      yieldTimeMs = 0,
      onProgress
    } = options;
    
    const results: R[] = [];
    const totalItems = items.length;
    
    for (let i = 0; i < totalItems; i += chunkSize) {
      // Process current chunk
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await processFn(chunk);
      results.push(...chunkResults);
      
      // Report progress if callback provided
      if (onProgress) {
        onProgress(Math.min(i + chunkSize, totalItems), totalItems);
      }
      
      // Yield to main thread periodically
      if (yieldEvery > 0 && (i / chunkSize) % yieldEvery === 0 && i + chunkSize < totalItems) {
        await new Promise(resolve => setTimeout(resolve, yieldTimeMs));
      }
    }
    
    return results;
  }
  
  /**
   * Check if an operation is likely to cause UI blocking
   * @param itemCount Number of items to process
   * @param estimatedTimePerItem Estimated processing time per item in ms
   */
  static willBlockUI(itemCount: number, estimatedTimePerItem: number): boolean {
    // If estimated total processing time > 16ms (60fps), it might block UI
    return itemCount * estimatedTimePerItem > 16;
  }
  
  /**
   * Calculate optimal chunk size to prevent UI blocking
   * @param itemCount Total number of items
   * @param estimatedTimePerItem Estimated processing time per item in ms
   * @param targetChunkTime Target time for processing a chunk (default: 16ms for 60fps)
   */
  static calculateOptimalChunkSize(
    itemCount: number, 
    estimatedTimePerItem: number, 
    targetChunkTime: number = 16
  ): number {
    const optimalSize = Math.max(1, Math.floor(targetChunkTime / estimatedTimePerItem));
    return Math.min(optimalSize, itemCount);
  }
}
