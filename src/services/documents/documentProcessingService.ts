// Use centralized PDF service for consistent worker configuration
import { extractTextFromPDF as centralizedPDFExtract } from '../../lib/pdfService';
// import { Document, Packer, Paragraph } from 'docx'; // Removed unused import
import Tesseract from 'tesseract.js';

/**
 * Document Processing Service
 * 
 * Handles extraction of text and data from various document types.
 */
export class DocumentProcessingService {
  /**
   * Extract text from a PDF file
   */
  async extractTextFromPDF(file: File | Blob): Promise<string> {
    // Use centralized PDF service with proper worker config
    return centralizedPDFExtract(file);
  }

  /**
   * Extract text from a Word document
   * Enhanced with improved extraction using wordDocumentUtils
   */
  async extractTextFromWord(file: File | Blob): Promise<string> {
    try {
      // Import the enhanced Word document utilities
      const { enhancedDocxExtraction } = await import('../../utils/wordDocumentUtils');

      // Get the file content as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Use the enhanced extraction function
      const result = await enhancedDocxExtraction(arrayBuffer);

      return result;
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      return `Error extracting text from Word document: ${error.message || 'Unknown error'}. The file may be damaged or in an unsupported format.`;
    }
  }

  /**
   * Extract text from an image using OCR
   */
  async extractTextFromImage(file: File | Blob): Promise<string> {
    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        // { logger: m => console.log(m) } // Commented out logger
      );

      return result.data.text;
    } catch (error) {
      console.error('Error extracting text from image via OCR:', error);
      return 'Error performing OCR on image. The image may be low quality or contain no recognizable text.';
    }
  }

  // The parseDocx method has been replaced by the enhancedDocxExtraction function
  // in the wordDocumentUtils.ts file. We're now importing and using that function
  // in the extractTextFromWord method above.

  /**
   * Detect document type and extract text
   */
  async extractText(file: File): Promise<string> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.extractTextFromPDF(file);
    }

    // Word documents
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')) {
      return this.extractTextFromWord(file);
    }

    // Image files for OCR
    if (fileType.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].some(ext => fileName.endsWith(ext))) {
      return this.extractTextFromImage(file);
    }

    // Fallback for text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await file.text();
    }

    return 'Unsupported file type for text extraction';
  }
}

// Export a singleton instance
export const documentProcessingService = new DocumentProcessingService(); 