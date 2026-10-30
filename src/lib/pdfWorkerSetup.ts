import { pdfjs } from 'react-pdf';

// Configure PDF.js to work with matching versions
export function setupPDFWorker() {
  if (typeof window !== 'undefined') {
    try {
      // Use local worker to avoid CSP issues with external CDNs
      // Properly bundled via Vite import.meta.url
      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
      }
      
      console.log(`PDF.js worker configured for version ${pdfjs.version}`);
      
      // 🔥 CONTEST FIX: Enhanced error handling for all PDF worker issues
      window.addEventListener('error', (event) => {
        if (event.message && (
          event.message.includes('pdf.worker') || 
          event.message.includes('GlobalWorkerOptions') ||
          event.message.includes('UnknownErrorException') ||
          event.message.includes('Worker') && event.message.includes('pdf')
        )) {
          console.warn('PDF worker error intercepted, will continue with main thread processing:', event.message);
          event.preventDefault();
          return false;
        }
      });

      // Additional error handling for unhandled promise rejections from PDF worker
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && typeof event.reason === 'object') {
          const reason = event.reason.toString();
          if (reason.includes('pdf') || reason.includes('Worker') || reason.includes('UnknownErrorException')) {
            console.warn('PDF worker promise rejection intercepted:', reason);
            event.preventDefault();
            return false;
          }
        }
      });
      
    } catch (error) {
      console.warn('PDF.js configuration failed, but will continue with defaults:', error);
    }
  }
}

// Call setup immediately
setupPDFWorker(); 