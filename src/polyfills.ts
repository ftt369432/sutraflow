/**
 * 🔧 Browser Polyfills for Netlify Deployment
 * 
 * Ensures Web APIs are available across different environments
 * and deployment platforms for consistent functionality.
 */

// Polyfill for Request constructor if not available
if (typeof globalThis !== 'undefined' && typeof globalThis.Request === 'undefined') {
  // Minimal Request polyfill for browser compatibility
  globalThis.Request = class Request {
    constructor(input: string | Request, init?: RequestInit) {
      // Basic implementation for compatibility
      Object.assign(this, {
        url: typeof input === 'string' ? input : input.url,
        method: init?.method || 'GET',
        headers: init?.headers || {},
        body: init?.body || null,
      });
    }
  } as any;
}

// Ensure global fetch is available
if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'undefined') {
  // Fetch polyfill indicator - should be handled by browser or build system
  console.warn('⚠️ Fetch API not available - this may cause issues');
}

// Polyfill for Response if not available
if (typeof globalThis !== 'undefined' && typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body?: any, init?: ResponseInit) {
      Object.assign(this, {
        status: init?.status || 200,
        statusText: init?.statusText || 'OK',
        headers: init?.headers || {},
        body: body || null,
        ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
      });
    }
    
    async json() {
      return JSON.parse(this.body || '{}');
    }
    
    async text() {
      return String(this.body || '');
    }
  } as any;
}

// Ensure Headers is available
if (typeof globalThis !== 'undefined' && typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    private _headers: Record<string, string> = {};
    
    constructor(init?: Record<string, string> | Headers) {
      if (init) {
        if (init instanceof Headers) {
          this._headers = { ...init._headers };
        } else {
          this._headers = { ...init };
        }
      }
    }
    
    append(name: string, value: string) {
      this._headers[name.toLowerCase()] = value;
    }
    
    delete(name: string) {
      delete this._headers[name.toLowerCase()];
    }
    
    get(name: string) {
      return this._headers[name.toLowerCase()] || null;
    }
    
    has(name: string) {
      return name.toLowerCase() in this._headers;
    }
    
    set(name: string, value: string) {
      this._headers[name.toLowerCase()] = value;
    }
    
    entries() {
      return Object.entries(this._headers)[Symbol.iterator]();
    }
  } as any;
}

// Ensure window object has fetch API available
if (typeof window !== 'undefined') {
  if (!window.Request) {
    window.Request = globalThis.Request;
  }
  if (!window.Response) {
    window.Response = globalThis.Response;
  }
  if (!window.Headers) {
    window.Headers = globalThis.Headers;
  }
  if (!window.fetch) {
    console.warn('⚠️ Fetch API not available on window object');
  }
}

console.log('🔧 Browser polyfills loaded successfully');

export {};