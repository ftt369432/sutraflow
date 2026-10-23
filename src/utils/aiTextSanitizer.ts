/**
 * Advanced Text Sanitization for AI Processing
 * 
 * Comprehensive text cleaning to prevent gibberish, binary content, and corrupted
 * text from reaching AI systems for summary generation.
 */

/**
 * Sanitizes text content before sending to AI services
 * Returns clean text or null if content is too corrupted to process
 */
export const sanitizeForAI = (text: string): string | null => {
  if (!text || text.trim().length === 0) return null;

  // Step 1: Basic cleaning
  let cleaned = text
    // Remove null characters and control chars
    .replace(/\u0000/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    // Remove replacement characters
    .replace(/\uFFFD/g, ' ')
    // Remove PDF artifacts
    .replace(/endobj|endstream|\/Type\/Font|\/Length\s*\d+/g, ' ')
    // Remove binary-looking patterns
    .replace(/[^\x20-\x7E\s\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]{3,}/g, ' ')
    .trim();

  // Step 2: Quality validation
  const qualityScore = assessTextQuality(cleaned);
  
  if (qualityScore < 0.3) {
    console.warn('[AI Sanitizer] Text quality too low for AI processing:', qualityScore);
    return null;
  }

  // Step 3: Content validation
  if (cleaned.length < 20) {
    console.warn('[AI Sanitizer] Text too short for meaningful AI processing');
    return null;
  }

  if (cleaned.length > 50000) {
    // Truncate very long content for AI processing
    cleaned = cleaned.substring(0, 50000) + '...[Content truncated for AI processing]';
  }

  // Step 4: Final cleaning pass
  return cleaned
    .replace(/\s{3,}/g, '  ') // Normalize excessive spaces
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
    .trim();
};

/**
 * Assesses the quality of text content
 * Returns a score from 0 (terrible) to 1 (excellent)
 */
export const assessTextQuality = (text: string): number => {
  if (!text) return 0;

  let score = 1.0;
  
  // Check readable character ratio
  const readableChars = (text.match(/[a-zA-Z0-9\s.,;:!?'"()\-]/g) || []).length;
  const readableRatio = readableChars / text.length;
  
  if (readableRatio < 0.5) score -= 0.4;
  else if (readableRatio < 0.7) score -= 0.2;
  
  // Check for excessive non-printable characters
  const nonPrintableCount = (text.match(/[^\x20-\x7E\s\u00A0-\u00FF]/g) || []).length;
  const nonPrintableRatio = nonPrintableCount / text.length;
  
  if (nonPrintableRatio > 0.1) score -= 0.3;
  else if (nonPrintableRatio > 0.05) score -= 0.15;
  
  // Check for word-like patterns
  const words = text.match(/\b[a-zA-Z]{2,}\b/g) || [];
  const wordCount = words.length;
  const avgWordLength = wordCount > 0 ? words.join('').length / wordCount : 0;
  
  if (wordCount < 5) score -= 0.3;
  if (avgWordLength < 3 || avgWordLength > 15) score -= 0.2;
  
  // Check for excessive repetition
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;
  
  if (repetitionRatio < 0.3) score -= 0.2;
  
  // Check for PDF/binary artifacts
  if (text.includes('endobj') || text.includes('endstream')) score -= 0.4;
  if (text.match(/\/Type\/\w+|\/Length\s*\d+/)) score -= 0.3;
  
  return Math.max(0, Math.min(1, score));
};

/**
 * Validates summary content to ensure it's not corrupted
 */
export const validateSummaryQuality = (summary: string): boolean => {
  if (!summary || summary.length < 10) return false;
  
  // Check for binary artifacts in summary
  if (summary.includes('endobj') || summary.includes('endstream')) return false;
  if (summary.includes('\u0000') || summary.match(/[^\x20-\x7E\s\u00A0-\u00FF]{2,}/)) return false;
  
  // Check for meaningful content
  const words = (summary.match(/\b[a-zA-Z]{3,}\b/g) || []).length;
  const sentences = (summary.match(/[.!?]+/g) || []).length;
  
  return words >= 5 && sentences >= 1;
};

/**
 * Enhanced summary generation with quality validation
 */
export const generateCleanSummary = (content: string): string => {
  const sanitized = sanitizeForAI(content);
  
  if (!sanitized) {
    return "Document content could not be processed - appears to contain binary or corrupted data.";
  }
  
  // Generate basic summary from first few sentences
  const sentences = sanitized.match(/[^.!?]*[.!?]+/g) || [];
  const firstThreeSentences = sentences.slice(0, 3).join(' ').trim();
  
  if (firstThreeSentences.length > 20) {
    const summary = firstThreeSentences.length > 200 
      ? firstThreeSentences.substring(0, 197) + '...'
      : firstThreeSentences;
    
    if (validateSummaryQuality(summary)) {
      return summary;
    }
  }
  
  // Fallback: extract key information
  const words = (sanitized.match(/\b[a-zA-Z]{4,}\b/g) || []).slice(0, 20);
  return words.length > 5 
    ? `Document contains information about: ${words.slice(0, 10).join(', ')}.`
    : "Document content available but summary could not be generated reliably.";
};