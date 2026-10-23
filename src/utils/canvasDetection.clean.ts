/**
 * 🎨 Canvas Detection Utilities
 * 
 * Centralized canvas detection and management logic
 * Follows main prompt principle: "Centralized Resource Strategy"
 */

export interface CanvasItem {
  id: string;
  content: string;
  isActive?: boolean;
  title?: string;
  contentType?: string;
  lastModified?: Date;
}

export interface CanvasDetectionResult {
  action: 'create' | 'update' | 'use_existing';
  existingCanvas: CanvasItem | null;
  reason: string;
}

/**
 * Find existing canvas by active status or ID
 */
export function findExistingCanvas(
  canvases: CanvasItem[], 
  activeCanvasId: string | null
): CanvasItem | null {
  // First try to find active canvas
  const activeCanvas = canvases.find(c => c.isActive);
  if (activeCanvas) {
    return activeCanvas;
  }
  
  // Fallback to canvas by ID
  if (activeCanvasId) {
    const canvasById = canvases.find(c => c.id === activeCanvasId);
    if (canvasById) {
      return canvasById;
    }
  }
  
  return null;
}

/**
 * Detect what action should be taken with canvas
 */
export function detectCanvasAction(
  canvases: CanvasItem[], 
  activeCanvasId: string | null
): CanvasDetectionResult {
  const existingCanvas = findExistingCanvas(canvases, activeCanvasId);
  
  if (!existingCanvas) {
    return {
      action: 'create',
      existingCanvas: null,
      reason: 'No existing canvas found'
    };
  }
  
  // If canvas has substantial content, update it
  if (existingCanvas.content && existingCanvas.content.length > 100) {
    return {
      action: 'update',
      existingCanvas,
      reason: `Existing canvas has ${existingCanvas.content.length} characters`
    };
  }
  
  // If canvas exists but is empty/minimal, use it
  return {
    action: 'use_existing',
    existingCanvas,
    reason: 'Existing canvas is empty or minimal'
  };
}

/**
 * Perform surgical edit on canvas content
 */
export function performSurgicalEdit(
  canvases: CanvasItem[], 
  canvasId: string, 
  newContent: string
): CanvasItem[] {
  return canvases.map(canvas => 
    canvas.id === canvasId 
      ? { 
          ...canvas, 
          content: canvas.content + '\n\n' + newContent,
          lastModified: new Date()
        }
      : canvas
  );
}

/**
 * Consistent logging for canvas detection
 */
export function logCanvasDetection(
  action: 'create' | 'update' | 'use_existing',
  existingCanvas: CanvasItem | null,
  context: string
): void {
  const actionEmoji = {
    'create': '📄',
    'update': '🔧', 
    'use_existing': '🔄'
  };
  
  const actionText = {
    'create': 'Creating new canvas',
    'update': 'Updating existing canvas',
    'use_existing': 'Using existing canvas'
  };
  
  const emoji = actionEmoji[action];
  const text = actionText[action];
  const details = existingCanvas 
    ? `(${existingCanvas.content.length} chars existing)`
    : '(no existing content found)';
  
  console.log(`${emoji} ${context}: ${text} ${details}`);
}

/**
 * Extract document type from content or request
 */
export function detectDocumentType(content: string): string {
  const lowerContent = content.toLowerCase();
  
  // Legal documents
  if (lowerContent.includes('petition') || lowerContent.includes('motion')) {
    return 'Legal Document';
  }
  
  // Business documents
  if (lowerContent.includes('business plan') || lowerContent.includes('proposal')) {
    return 'Business Document';
  }
  
  // Technical documents
  if (lowerContent.includes('specification') || lowerContent.includes('requirements')) {
    return 'Technical Document';
  }
  
  // Default
  return 'Document';
}

/**
 * Check if content looks like a complete document
 */
export function isCompleteDocument(content: string): boolean {
  // Basic heuristics for document completeness
  const hasTitle = /^#\s|^[A-Z\s]{3,}$/m.test(content);
  const hasStructure = content.includes('\n\n') && content.length > 200;
  const hasConclusion = /conclusion|summary|end|final/i.test(content);
  
  return hasTitle && hasStructure && (hasConclusion || content.length > 1000);
}

/**
 * Generate appropriate canvas title from content
 */
export function generateCanvasTitle(content: string, fallback: string = 'New Document'): string {
  // Try to extract title from first line
  const firstLine = content.split('\n')[0].trim();
  
  // Remove markdown heading symbols
  const cleanTitle = firstLine.replace(/^#+\s*/, '').trim();
  
  // If first line looks like a title
  if (cleanTitle.length > 3 && cleanTitle.length < 80 && !cleanTitle.includes('.')) {
    return cleanTitle;
  }
  
  // Extract from content patterns
  const titlePatterns = [
    /title:\s*(.+)/i,
    /subject:\s*(.+)/i,
    /re:\s*(.+)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return fallback;
}
