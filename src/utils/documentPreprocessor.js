/**
 * Document Pre-processor Utility
 * 
 * This script serves as a safeguard in the document processing pipeline
 * to prevent binary content from being stored as text and corrupting embeddings.
 */

import fs from 'fs';
import path from 'path';
import { sanitizeDocumentContent, containsHighPctNonPrintable } from '../../test-document-similarity.js';

// Document processing safeguard function
export function preprocessDocumentContent(content, fileName = '') {
  if (!content) return { 
    content: '',
    isBinary: false,
    isValid: false,
    message: 'Empty content'
  };
  
  // Check if content appears to be binary
  const isBinary = containsHighPctNonPrintable(content);
  
  if (isBinary) {
    const errorMessage = `Binary content detected in document${fileName ? ` '${fileName}'` : ''}. Cannot process as text.`;
    console.warn(errorMessage);
    
    return {
      content: `ERROR: This appears to be binary content that was not properly extracted. The document requires reprocessing with proper text extraction.`,
      isBinary: true,
      isValid: false,
      message: errorMessage,
      needsReprocessing: true
    };
  }
  
  // Additional validation for extremely long content
  if (content.length > 10000000) { // 10MB text limit
    const warningMessage = `Document${fileName ? ` '${fileName}'` : ''} exceeds maximum recommended size.`;
    console.warn(warningMessage);
    
    return {
      content: content.substring(0, 10000000) + '\n\n[Content truncated due to excessive size]',
      isBinary: false,
      isValid: true,
      message: warningMessage,
      wasTruncated: true
    };
  }
  
  return {
    content,
    isBinary: false,
    isValid: true,
    message: 'Content is valid'
  };
}

/**
 * Safely process a document before storing in database or generating embeddings
 * 
 * @param {Object} document - The document object to process
 * @returns {Object} Processed document with validation info
 */
export function safelyProcessDocument(document) {
  if (!document || !document.content) {
    console.error('Invalid document object provided for processing');
    return {
      ...document,
      content: '',
      processingInfo: {
        isValid: false,
        message: 'Invalid document object'
      }
    };
  }
  
  const fileName = document.title || document.fileName || '';
  const result = preprocessDocumentContent(document.content, fileName);
  
  return {
    ...document,
    content: result.content,
    processingInfo: {
      isBinary: result.isBinary,
      isValid: result.isValid,
      needsReprocessing: result.needsReprocessing || false,
      wasTruncated: result.wasTruncated || false,
      message: result.message,
      processedAt: new Date().toISOString()
    }
  };
}

import { fileURLToPath } from 'url';

// Test the utility when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Document Pre-processor Utility Test');
  console.log('==================================');
  
  // Test with sample text
  const normalText = "This is normal text content that should pass validation.";
  console.log('\nTesting with normal text:');
  console.log(preprocessDocumentContent(normalText));
  
  // Test with binary content
  const binaryContent = "PK\u0003\u0004\u0014\u0000\u0006\u0000\b\u0000\u0000\u0000!\u0000\u0011[Content_Types].xml";
  console.log('\nTesting with binary content:');
  console.log(preprocessDocumentContent(binaryContent, 'test.docx'));
  
  // Test with a document object
  const testDocument = {
    id: 'test-doc-1',
    title: 'Test Binary Document',
    content: binaryContent
  };
  
  console.log('\nTesting document object processing:');
  console.log(JSON.stringify(safelyProcessDocument(testDocument), null, 2));
}

export default {
  preprocessDocumentContent,
  safelyProcessDocument
};
