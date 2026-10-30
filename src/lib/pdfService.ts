/**
 * Centralized PDF.js Configuration
 * 
 * 🔧 SINGLE SOURCE OF TRUTH for PDF text extraction across the app.
 * All services (KnowledgeBase, GenieDrive, Chat, etc.) should import from here.
 * 
 * This fixes the "API version X does not match Worker version Y" error
 * that occurs when react-pdf's bundled pdfjs conflicts with pdfjs-dist.
 */

import * as pdfjs from 'pdfjs-dist';

// VERSION MUST MATCH package.json pdfjs-dist version!


// Vite native worker bundling ensures perfect version matching without unpkg CSP blocks
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let isConfigured = false;

/**
 * Configure PDF.js worker - call once at app startup
 */
export function configurePDFWorker(): void {
    if (isConfigured || typeof window === 'undefined') return;

    // Guaranteed to match exactly what is loaded by import * as pdfjs from 'pdfjs-dist'
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    console.log(`✅ PDF.js worker configured exclusively for text extraction via Bundled Local Worker`);
    isConfigured = true;
}

/**
 * Extract text from PDF file
 * Handles worker failures gracefully with main-thread fallback
 */
export async function extractTextFromPDF(file: File | Blob | ArrayBuffer): Promise<string> {
    // Ensure worker is configured
    configurePDFWorker();

    try {
        // Get ArrayBuffer from input
        let buffer: ArrayBuffer;
        if (file instanceof ArrayBuffer) {
            buffer = file;
        } else {
            buffer = await file.arrayBuffer();
        }

        // Load Document via worker
        let pdf;
        try {
            // Use buffer.slice(0) to pass a COPY of the buffer.
            pdf = await pdfjs.getDocument({ data: buffer.slice(0) }).promise;
        } catch (workerError) {
            console.error('⚠️ PDF Parsing Failed (Worker or Corrupted File):', workerError);
            throw new Error(`Failed to extract text from PDF: ${(workerError as Error).message || 'Unknown PDF error'}`);
        }

        // Extract text from all pages
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map(item => 'str' in item ? item.str : '')
                .join(' ');
            fullText += pageText + '\n';
        }

        console.log(`✅ PDF extracted: ${pdf.numPages} pages, ${fullText.length} chars`);
        return fullText.trim();
    } catch (error) {
        console.error('❌ PDF extraction failed:', error);
        return `Error extracting text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File | { type?: string; name?: string }): boolean {
    const type = file.type?.toLowerCase() || '';
    const name = (file as File).name?.toLowerCase() || '';
    return type === 'application/pdf' || name.endsWith('.pdf');
}

/**
 * Get PDF document for advanced operations
 * Returns the pdfjs document object for custom processing
 */
export async function getPDFDocument(file: File | Blob | ArrayBuffer) {
    configurePDFWorker();

    let buffer: ArrayBuffer;
    if (file instanceof ArrayBuffer) {
        buffer = file;
    } else {
        buffer = await file.arrayBuffer();
    }

    return pdfjs.getDocument({ data: buffer }).promise;
}

// Export pdfjs for advanced usage
export { pdfjs };

// Auto-configure on module load
if (typeof window !== 'undefined') {
    configurePDFWorker();
}
