/**
 * Word Document Processing Utilities
 * 
 * Specialized utilities for extracting and processing Word documents.
 * Enhanced with better error handling and multiple extraction methods.
 */

import { sanitizeTextForSupabase } from './documentUtils';

// Dynamic import for Buffer to ensure browser compatibility
async function getBuffer(): Promise<any> {
  try {
    const { Buffer } = await import('buffer');
    return Buffer;
  } catch (e) {
    // Fallback for browser environment
    return globalThis.Buffer || (globalThis as any).Buffer;
  }
}

/**
 * Enhanced DOCX extraction using multiple methods for better results
 * 
 * This function uses a multi-stage approach:
 * 1. First attempts raw text extraction (fast, works for simple documents)
 * 2. Falls back to HTML extraction if raw text fails (better for complex formatting)
 * 3. Provides detailed error messages if both methods fail
 * 
 * @param {ArrayBuffer | Buffer} buffer - The Word document as an ArrayBuffer or Buffer
 * @returns {Promise<string>} The extracted text content
 */
export async function enhancedDocxExtraction(buffer: ArrayBuffer | any): Promise<string> {
  try {
    // Import mammoth dynamically to ensure it's only loaded when needed
    const mammoth = await import('mammoth');
    
    // Get Buffer dynamically
    const Buffer = await getBuffer();
    
    // Ensure we have an ArrayBuffer for mammoth
    const arrayBuffer = buffer instanceof Buffer 
      ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      : buffer;
    
    // 1. First attempt: Extract raw text (fastest, most reliable for simple documents)
    const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
    let extractedText = rawTextResult.value || '';
    
    // Log any warnings for debugging
    if (rawTextResult.messages?.length > 0) {
      console.debug('Mammoth warnings (raw text):', rawTextResult.messages);
    }
    
    // 2. Check if raw text extraction yielded binary-like content
    const seemsBinary = containsHighPctNonPrintable(extractedText);
    
    // 3. If raw text is empty or seems like binary content, try HTML extraction
    if (!extractedText || extractedText.trim().length === 0 || seemsBinary) {
      console.debug('Raw text extraction failed or produced binary-like content, trying HTML extraction...');
      
      try {
        const htmlResult = await mammoth.convertToHtml({ 
          arrayBuffer
        } as any);
        
        // Process HTML to text
        if (htmlResult.value) {
          extractedText = convertHtmlToText(htmlResult.value);
          
          // Log any HTML extraction warnings
          if (htmlResult.messages?.length > 0) {
            console.debug('Mammoth warnings (HTML):', htmlResult.messages);
          }
        }
      } catch (htmlError) {
        console.error('HTML extraction also failed:', htmlError);
      }
    }
    
    // 4. If both methods fail, provide a clear error message
    if (!extractedText || extractedText.trim().length === 0) {
      console.warn('No text content could be extracted from Word document');
      return 'No text content could be extracted from this document. The file may be damaged, password-protected, or in an incompatible format.';
    }
    
    // Clean up extracted text and return
    return sanitizeTextForSupabase(extractedText);
  } catch (error: any) {
    console.error('Error parsing DOCX with Mammoth:', error);
    return `Error parsing Word document content: ${error.message || 'Unknown error'}`;
  }
}

/**
 * Detects if text appears to be binary/encoded content
 * 
 * Uses the improved detection algorithm with better thresholds.
 * 
 * @param {string} text - The text to check
 * @returns {boolean} True if the text appears to be binary/encoded
 */
export function containsHighPctNonPrintable(text: string): boolean {
  if (!text || text.length === 0) return false;
  
  // Count non-printable characters more accurately
  const nonPrintableChars = text.replace(/[\x20-\x7E\n\r\t\u00A0-\u00FF]/g, '').length;
  
  // If the text is very short, use a higher threshold
  if (text.length < 100) {
    return (nonPrintableChars / text.length) > 0.15; // 15% for short texts
  }
  
  // Standard threshold (20%) for normal-length texts
  return (nonPrintableChars / text.length) > 0.2;
}

/**
 * Converts HTML content to readable text
 * 
 * @param {string} html - The HTML content to convert
 * @returns {string} Plain text version of the HTML content
 */
function convertHtmlToText(html: string): string {
  return html
    // Replace block elements with newlines
    .replace(/<\/?(div|p|h\d|ul|ol|li|br|table|tr)[^>]*>/gi, '\n') 
    // Replace heading tags with emphasized text
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    // Keep formatting for some inline elements
    .replace(/<(b|strong)[^>]*>(.*?)<\/(b|strong)>/gi, '**$2**')
    .replace(/<(i|em)[^>]*>(.*?)<\/(i|em)>/gi, '*$2*')
    // Replace other inline elements
    .replace(/<\/?(span|a|u)[^>]*>/gi, '')  
    // Replace remaining HTML tags with spaces
    .replace(/<[^>]+>/g, ' ')  
    // Replace HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]+;/gi, ' ') 
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')    // Max 2 consecutive newlines
    .replace(/\s{2,}/g, ' ')       // Normalize spaces
    .trim();                        // Trim extra whitespace
}

/**
 * Gets file extension from file name
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Checks if a file is a Word document based on extension or type
 */
export function isWordDocument(fileName: string, fileType?: string): boolean {
  const ext = getFileExtension(fileName);
  return ext === 'docx' || ext === 'doc' || 
         (fileType && (
           fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
           fileType === 'application/msword'
         ));
}

export default {
  enhancedDocxExtraction,
  containsHighPctNonPrintable,
  isWordDocument,
  getFileExtension
};
