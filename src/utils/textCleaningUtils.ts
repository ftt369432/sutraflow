/**
 * Text Cleaning Utilities
 * 
 * Specialized functions for cleaning and normalizing text from various sources,
 * especially for handling issues with PDF extraction, OCR, and encoding problems.
 */

/**
 * Deeply cleans text from problematic encoding issues
 * Useful for OCR'd text and PDF extractions
 */
export const deepCleanText = (text: string): string => {
  if (!text) return '';

  return text
    // Remove common PDF and OCR artifacts
    .replace(/^%PDF.*?$/gm, '')                      // PDF header
    .replace(/^%%EOF.*?$/gm, '')                     // PDF footer
    .replace(/\\u[a-fA-F0-9]{4}/g, ' ')              // Unicode escape sequences like \u2019
    .replace(/\\x[a-fA-F0-9]{2}/g, ' ')              // Hex escape sequences like \x27
    .replace(/\\[tnrfvb"'\\]/g, ' ')                 // Basic escape sequences
    .replace(/\(cid:\d+\)/g, '')                     // CID font references
    .replace(/[\uFFFD\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '') // Control chars and replacement char
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{S}\n\r\t]/gu, ' ') // Keep only letters, numbers, punctuation, spaces, symbols
    
    // Fix common OCR errors
    .replace(/[''‛`]/g, "'")                        // Normalize apostrophes
    .replace(/[""‟]/g, '"')                          // Normalize quotes
    .replace(/[—–−‐‑‒]/g, '-')                      // Normalize hyphens/dashes
    .replace(/\s*\.\s+/g, '. ')                     // Fix spacing around periods
    .replace(/\s*,\s+/g, ', ')                      // Fix spacing around commas
    
    // Fix paragraph structure
    .replace(/(\r?\n){3,}/g, '\n\n')                // Max 2 consecutive newlines
    .replace(/[^\S\r\n]+/g, ' ')                    // Normalize multiple horizontal spaces (preserve newlines)
    .trim();
};

/**
 * Detects and fixes common OCR errors
 */
export const fixOCRErrors = (text: string): string => {
  return text
    // Common OCR errors with "l", "1", "I", "0", "O"
    .replace(/\bl(\b|(?=\d))/g, '1')                // Lone 'l' likely a '1'
    .replace(/(\d)l/g, '$11')                       // 'l' after digit likely a '1'
    .replace(/\b0\b(?!\.\d)/g, 'O')                 // Lone '0' likely a capital 'O'
    .replace(/\bI(\d+)\b/g, '1$1')                  // 'I' before digits likely a '1'
    
    // Fix broken words
    .replace(/(\w)-\s+(\w)/g, '$1$2')               // Remove hyphens from broken words
    
    // Fix spacing issues
    .replace(/(\w)\.([A-Z])/g, '$1. $2')            // Add space after periods that end sentences
    
    // Fix case problems (common in OCR)
    .replace(/([a-z])([A-Z])(?![A-Z])/g, '$1 $2')   // Add space between lowercase and single uppercase
    
    // Fix common abbreviations
    .replace(/(\b[A-Za-z])\.([A-Za-z])\./g, '$1.$2.'); // Fix spacing in abbreviations like U.S.
};

/**
 * Extract text blocks that are likely meaningful paragraphs
 * Good for finding useful content in noisy OCR results
 */
export const extractMeaningfulParagraphs = (text: string): string[] => {
  const paragraphs = text.split(/\n{2,}/);
  
  return paragraphs.filter(p => {
    const trimmed = p.trim();
    // Criteria for meaningful paragraphs:
    // - Reasonable length (not too short)
    // - Has multiple words
    // - Contains letters (not just numbers or symbols)
    // - Not just a page number or header/footer
    return trimmed.length > 30 && 
           trimmed.includes(' ') && 
           /[a-zA-Z]{2,}/.test(trimmed) &&
           !/^\d+$/.test(trimmed) &&
           !/^Page \d+$/.test(trimmed);
  });
};

/**
 * Improves paragraph breaks in poorly formatted text
 */
export const improveTextFormatting = (text: string): string => {
  return text
    // Fix line breaks that shouldn't be there
    .replace(/([a-z,;:])(?:\r?\n)([a-z])/g, '$1 $2')
    
    // Ensure proper paragraph breaks (double newline)
    .replace(/([.!?"])(\r?\n)([A-Z])/g, '$1\n\n$3')
    
    // Fix broken sentences
    .replace(/([a-z])\s*\n\s*([a-z])/g, '$1 $2')
    
    // Format list items better
    .replace(/^(\d+\.)\s*/gm, '\n$1 ')
    .replace(/^([•\-*])\s*/gm, '\n$1 ')
    
    // Format headings better (ALL CAPS likely headings)
    .replace(/^([A-Z][A-Z\s]{5,})$/gm, '\n\n$1\n')
    
    // Clean up extra spacing
    .replace(/[ \t]+/g, ' ')
    .replace(/(\r?\n)+/g, '\n\n')
    .trim();
};

/**
 * Converts text into a markdown format for better readability
 */
export const textToMarkdown = (text: string): string => {
  // First clean up the text
  const cleaned = deepCleanText(text);
  
  return cleaned
    // Format headings (ALL CAPS lines as headings)
    .replace(/^([A-Z][A-Z\s.]{5,})$/gm, '\n## $1\n')
    
    // Format subheadings (Title Case lines as subheadings)
    .replace(/^((?:[A-Z][a-z]+\s*){2,})$/gm, '\n### $1\n')
    
    // Format list items
    .replace(/^(\d+\.)\s+/gm, '1. ')
    .replace(/^[•\-*]\s+/gm, '- ')
    
    // Format paragraphs properly
    .replace(/\n{2,}/g, '\n\n')
    
    // Emphasize important terms
    .replace(/\b(IMPORTANT|NOTE|WARNING):/g, '**$1:**')
    
    // Format case citations and legal references
    .replace(/(\d+\s[A-Za-z.]+\s\d+\s\(\d{4}\))/g, '*$1*')
    .replace(/((?:Section|§)\s+\d+(\.\d+)*)/g, '**$1**')
    
    .trim();
};
