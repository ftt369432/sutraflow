/**
 * Fallback PDF processor for when the main PDF.js worker fails
 * This provides alternative methods for extracting text from PDF files
 */

// Simple text extraction function without workers
export async function extractPDFTextFallback(file: File | Blob): Promise<string> {
  try {
    // Method 1: Try to read as binary and extract readable text
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Limit processing to prevent stack overflow on large files
    const maxSize = Math.min(uint8Array.length, 1024 * 1024); // Limit to 1MB
    const limitedArray = uint8Array.slice(0, maxSize);
    
    // Convert to string safely for smaller chunks
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < limitedArray.length; i += chunkSize) {
      const chunk = limitedArray.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Extract text between common PDF text markers (simpler regex)
    const textMatches = [];
    const textPattern = /\(([^)]{2,100})\)/g;
    let match;
    let matchCount = 0;
    
    while ((match = textPattern.exec(binaryString)) !== null && matchCount < 1000) {
      const text = match[1];
      if (text.length > 1 && /[a-zA-Z]/.test(text)) {
        textMatches.push(text);
        matchCount++;
      }
    }
    
    const extractedText = textMatches.join(' ');
    if (extractedText.length > 20) {
      return extractedText;
    }
    
    // Method 2: Simple text extraction from readable sections
    const readableChars = binaryString.match(/[a-zA-Z][a-zA-Z0-9\s.,!?;:'"()-]{5,50}/g) || [];
    const simpleText = readableChars.slice(0, 100).join(' '); // Limit results
    
    if (simpleText.length > 20) {
      return simpleText;
    }
    
    throw new Error('No readable text found in PDF');
    
  } catch (error) {
    console.error('Fallback PDF extraction failed:', error);
    throw new Error('Unable to extract text from PDF using fallback methods');
  }
}

/**
 * Check if PDF appears to be image-based (scanned document)
 */
export async function isPDFImageBased(file: File | Blob): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Limit processing to prevent stack overflow - only check first 50KB
    const maxSize = Math.min(uint8Array.length, 50 * 1024);
    const limitedArray = uint8Array.slice(0, maxSize);
    
    // Convert to string safely for smaller chunks
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < limitedArray.length; i += chunkSize) {
      const chunk = limitedArray.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Simple check for image vs text content
    const hasImages = binaryString.includes('/Image') || binaryString.includes('/DCTDecode');
    const hasText = binaryString.includes('/Font') || binaryString.includes('BT') || binaryString.includes('(');
    
    // If it has images but no obvious text markers, likely image-based
    return hasImages && !hasText;
  } catch {
    return false;
  }
}

/**
 * Get basic PDF info without full processing
 */
export async function getPDFBasicInfo(file: File | Blob): Promise<{ pageCount?: number; isPasswordProtected?: boolean; hasText?: boolean }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Limit processing to prevent stack overflow - only check first 100KB
    const maxSize = Math.min(uint8Array.length, 100 * 1024);
    const limitedArray = uint8Array.slice(0, maxSize);
    
    // Convert to string safely for smaller chunks
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < limitedArray.length; i += chunkSize) {
      const chunk = limitedArray.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Count pages by looking for page objects (simple count)
    const pageCount = (binaryString.match(/\/Type\s*\/Page[^s]/g) || []).length;
    
    // Check for password protection (simple includes check)
    const isPasswordProtected = binaryString.includes('/Encrypt') || 
                               binaryString.includes('/U ') || 
                               binaryString.includes('/O ');
    
    // Check for text content (simple check)
    const hasTextMarkers = binaryString.includes('(') || binaryString.includes('BT');
    
    return {
      pageCount: pageCount > 0 ? pageCount : undefined,
      isPasswordProtected,
      hasText: hasTextMarkers
    };
  } catch (error) {
    console.error('Failed to get PDF basic info:', error);
    return {};
  }
} 