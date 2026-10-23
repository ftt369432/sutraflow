/**
 * 🎨 Canvas Detection Utilities
 * 
 * Centralized canvas detection and management logic
 * Follows main prompt principle: "Centralized Resource Strategy"
 */

import { 
  analyzeDocumentStructure, 
  findInsertionPoint, 
  performSurgicalDocumentEdit,
  type EditInstruction,
  type LocationSpecifier 
} from './surgicalDocumentEditor';

export interface CanvasItem {
  id: string;
  content: string;
  isActive: boolean;
  title: string;
  contentType: string;
  lastModified: Date;
  aiDriveFileId?: string;
  savedToAIDrive?: boolean;
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
 * ENHANCED: Task-based canvas creation + Surgical edit detection
 */
export function detectCanvasAction(
  canvases: CanvasItem[], 
  activeCanvasId: string | null,
  userRequest?: string,
  taskId?: string // NEW: Pass task ID to force new canvas per task
): CanvasDetectionResult {
  const existingCanvas = findExistingCanvas(canvases, activeCanvasId);
  
  // 🎯 CRITICAL: If this is a NEW TASK, check if it needs its own canvas
  if (taskId) {
    const taskCanvas = canvases.find(c => (c as any).metadata?.taskId === taskId || (c as any).taskId === taskId);
    if (!taskCanvas) {
      return {
        action: 'create',
        existingCanvas: null,
        reason: `New task ${taskId} requires new canvas (multi-doc mode)`
      };
    }
    // If task already has a canvas, update it
    return {
      action: 'update',
      existingCanvas: taskCanvas,
      reason: `Task ${taskId} updating its existing canvas`
    };
  }
  
  // 🔬 SURGICAL EDIT DETECTION: Check if this is a surgical edit request
  const isSurgicalEdit = userRequest && (
    /\b(change|modify|update|fix|correct|adjust|replace)\s+.+\s+to\s+/i.test(userRequest) ||
    /\bupdate\s+the\s+\w+/i.test(userRequest) ||
    /\b(adj|address|name|title|date|amount|number)\s+to\s+/i.test(userRequest) ||
    /\b(edit|modify|change|update|fix)\b.*\b(field|section|line|paragraph)\b/i.test(userRequest) ||
    /\b(in\s+my\s+style|apply.*style|use.*tone|format|restructure|rephrase|polish|improve)\b/i.test(userRequest)
  );
  
  if (!existingCanvas) {
    return {
      action: 'create',
      existingCanvas: null,
      reason: 'No existing canvas found'
    };
  }
  
  // 🎯 PRIORITY: Surgical edits should use existing canvas regardless of content length
  if (isSurgicalEdit) {
    return {
      action: 'update',
      existingCanvas,
      reason: `Surgical edit detected: "${userRequest?.substring(0, 50)}..." - will target existing canvas`
    };
  }
  
  // 🆕 NEW DOCUMENT DETECTION: Only create new canvas for explicit requests
  const isExplicitNewRequest = userRequest && (
    /\b(create|new|draft|generate|write|make)\s+(a\s+)?(new\s+)?(document|canvas|file|petition|letter|brief)\b/i.test(userRequest) ||
    /\bstart\s+(over|fresh|new|from\s+scratch)\b/i.test(userRequest)
  );
  
  // If existing canvas and not explicitly "new", prefer UPDATE (surgical edit)
  if (existingCanvas && userRequest && userRequest.length > 30 && !isExplicitNewRequest) {
    return {
      action: 'update',
      existingCanvas,
      reason: 'Applying changes to existing canvas (style/tone request or edit detected)'
    };
  }
  
  if (isExplicitNewRequest) {
    return {
      action: 'create',
      existingCanvas: null,
      reason: 'New document explicitly requested'
    };
  }
  
  // If canvas has substantial content (>50 chars), suggest update
  if (existingCanvas.content && existingCanvas.content.trim().length > 50) {
    return {
      action: 'update',
      existingCanvas,
      reason: `Existing canvas has ${existingCanvas.content.length} characters - will append new content`
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
 * ENHANCED: Append to content for edits, replace for new content
 */
export function performSurgicalEdit(
  canvases: CanvasItem[], 
  canvasId: string, 
  newContent: string,
  appendMode: boolean = true
): CanvasItem[] {
  return canvases.map(canvas => 
    canvas.id === canvasId 
      ? { 
          ...canvas, 
          content: appendMode && canvas.content.trim().length > 0 
            ? canvas.content + '\n\n' + newContent  // Append to existing content
            : newContent, // Replace if empty or appendMode is false
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
 * 🎯 Smart Document Targeting (Like Claude's File Targeting)
 * 
 * Resolves natural language document references to specific canvas IDs
 * "update the petition" → finds petition document ID
 * "add to todo list" → finds todo list document ID
 */
export function resolveDocumentTarget(
  canvases: CanvasItem[],
  targetDescription: string,
  activeCanvasId?: string | null
): string | null {
  const desc = targetDescription.toLowerCase().trim();
  
  // Direct ID targeting (if already specific)
  const directMatch = canvases.find(c => c.id === targetDescription);
  if (directMatch) {
    return directMatch.id;
  }
  
  // Title-based targeting (preferred method)
  const titleMatches = [
    'petition', 'motion', 'brief', 'contract', 'agreement',
    'todo', 'task', 'checklist', 
    'calendar', 'schedule', 'deadline',
    'summary', 'report', 'analysis',
    'letter', 'memo', 'email'
  ];
  
  for (const keyword of titleMatches) {
    if (desc.includes(keyword)) {
      // Find canvas with matching title
      const titleMatch = canvases.find(canvas => 
        canvas.title.toLowerCase().includes(keyword)
      );
      
      if (titleMatch) {
        console.log(`🎯 Document targeting: "${targetDescription}" → "${titleMatch.title}" (${titleMatch.id})`);
        return titleMatch.id;
      }
    }
  }
  
  // Content-type targeting (fallback)
  const contentTypeMap: Record<string, string> = {
    'petition': 'Legal Document',
    'motion': 'Legal Document', 
    'brief': 'Legal Document',
    'contract': 'Legal Document',
    'todo': 'Document',
    'task': 'Document',
    'calendar': 'Document',
    'schedule': 'Document'
  };
  
  for (const [keyword, contentType] of Object.entries(contentTypeMap)) {
    if (desc.includes(keyword)) {
      const typeMatch = canvases.find(canvas => 
        canvas.contentType === contentType
      );
      
      if (typeMatch) {
        console.log(`🎯 Content type targeting: "${targetDescription}" → "${typeMatch.title}" (${typeMatch.id})`);
        return typeMatch.id;
      }
    }
  }
  
  // Active canvas fallback
  if (activeCanvasId) {
    const activeCanvas = canvases.find(c => c.id === activeCanvasId);
    if (activeCanvas) {
      console.log(`🎯 Fallback to active canvas: "${activeCanvas.title}" (${activeCanvas.id})`);
      return activeCanvas.id;
    }
  }
  
  // No match found
  console.warn(`⚠️ Could not resolve document target: "${targetDescription}"`);
  return null;
}

/**
 * 📊 Multi-Document Workspace Analysis
 * 
 * Provides overview of all documents in workspace for better targeting
 */
export function analyzeWorkspaceDocuments(canvases: CanvasItem[]): {
  totalDocuments: number;
  documentTypes: Record<string, number>;
  activeDocument: CanvasItem | null;
  documentSummaries: Array<{
    id: string;
    title: string;
    type: string;
    wordCount: number;
    lastModified: Date;
    isActive: boolean;
  }>;
} {
  const activeDocument = canvases.find(c => c.isActive) || null;
  const documentTypes: Record<string, number> = {};
  
  const documentSummaries = canvases.map(canvas => {
    const type = canvas.contentType || 'Document';
    documentTypes[type] = (documentTypes[type] || 0) + 1;
    
    return {
      id: canvas.id,
      title: canvas.title,
      type,
      wordCount: canvas.content.split(/\s+/).length,
      lastModified: canvas.lastModified,
      isActive: canvas.isActive
    };
  });
  
  return {
    totalDocuments: canvases.length,
    documentTypes,
    activeDocument,
    documentSummaries
  };
}
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
 * 🧠 Advanced Surgical Edit - Claude-style Precision Editing with Smart Targeting
 * 
 * Uses semantic analysis to find exact insertion points and edit documents
 * like Claude edits code files - with precision and understanding
 * 
 * Enhanced with smart document targeting:
 * - "update the petition" → finds and edits petition document
 * - "add to calendar" → finds and edits calendar document
 * - "modify todo list" → finds and edits todo list document
 */
export function performAdvancedSurgicalEdit(
  canvases: CanvasItem[], 
  targetReference: string, // Can be canvasId OR description like "petition", "todo list"
  editRequest: {
    action: 'insert' | 'replace' | 'append' | 'prepend';
    targetDescription: string; // "after Background section", "before Conclusion", etc.
    content: string;
    preserveFormatting?: boolean;
  }
): {
  success: boolean;
  updatedCanvases: CanvasItem[];
  changesSummary: string;
  errors: string[];
  targetDocumentInfo?: {
    id: string;
    title: string;
    originalLength: number;
    newLength: number;
  };
} {
  // Smart document targeting - resolve reference to actual canvas ID
  const resolvedCanvasId = resolveDocumentTarget(canvases, targetReference);
  
  if (!resolvedCanvasId) {
    return {
      success: false,
      updatedCanvases: canvases,
      changesSummary: 'Document not found',
      errors: [`Could not find document matching: "${targetReference}"`]
    };
  }
  
  const targetCanvas = canvases.find(c => c.id === resolvedCanvasId);
  
  if (!targetCanvas) {
    return {
      success: false,
      updatedCanvases: canvases,
      changesSummary: 'Canvas not found',
      errors: ['Resolved canvas ID not found in workspace']
    };
  }

  console.log(`🎯 Targeting document: "${targetCanvas.title}" (${targetCanvas.id})`);
  console.log(`📄 Original content length: ${targetCanvas.content.length} characters`);

  // Parse the target description into a LocationSpecifier
  const locationSpec = parseTargetDescription(editRequest.targetDescription);
  
  const editInstruction: EditInstruction = {
    action: editRequest.action,
    targetLocation: locationSpec,
    content: editRequest.content,
    preserveFormatting: editRequest.preserveFormatting ?? true,
    validateAfter: true
  };

  // Perform surgical edit
  const editResult = performSurgicalDocumentEdit(targetCanvas.content, editInstruction);
  
  if (editResult.success) {
    const updatedCanvases = canvases.map(canvas => 
      canvas.id === resolvedCanvasId 
        ? { 
            ...canvas, 
            content: editResult.newContent,
            lastModified: new Date()
          }
        : canvas // Leave other canvases unchanged
    );

    const targetDocumentInfo = {
      id: targetCanvas.id,
      title: targetCanvas.title,
      originalLength: targetCanvas.content.length,
      newLength: editResult.newContent.length
    };

    // Log the surgical edit
    console.log(`🧠 Advanced Surgical Edit Applied:`);
    console.log(`   📄 Document: "${targetCanvas.title}"`);
    console.log(`   ✂️ Action: ${editRequest.action}`);
    console.log(`   🎯 Target: ${editRequest.targetDescription}`);
    console.log(`   📊 Result: ${editResult.changesSummary}`);
    console.log(`   📏 Length: ${targetDocumentInfo.originalLength} → ${targetDocumentInfo.newLength} chars`);
    
    if (editResult.errors.length > 0) {
      console.log(`   ⚠️ Warnings: ${editResult.errors.join(', ')}`);
    }
    
    return {
      success: true,
      updatedCanvases,
      changesSummary: editResult.changesSummary,
      errors: editResult.errors,
      targetDocumentInfo
    };
  } else {
    console.error(`❌ Surgical Edit Failed:`, editResult.errors);
    
    return {
      success: false,
      updatedCanvases: canvases,
      changesSummary: 'Edit operation failed',
      errors: editResult.errors
    };
  }
}

/**
 * 🎯 Parse Target Description
 * 
 * Converts natural language target descriptions into LocationSpecifier objects
 */
function parseTargetDescription(description: string): LocationSpecifier {
  const desc = description.toLowerCase().trim();
  
  // Semantic section targeting
  if (desc.includes('after') && (desc.includes('section') || desc.includes('heading'))) {
    const sectionMatch = desc.match(/after\s+(?:the\s+)?['"]?([^'"]+)['"]?\s+(?:section|heading)/);
    if (sectionMatch) {
      return { type: 'semantic', afterSection: sectionMatch[1].trim() };
    }
  }
  
  if (desc.includes('before') && (desc.includes('section') || desc.includes('heading'))) {
    const sectionMatch = desc.match(/before\s+(?:the\s+)?['"]?([^'"]+)['"]?\s+(?:section|heading)/);
    if (sectionMatch) {
      return { type: 'semantic', beforeSection: sectionMatch[1].trim() };
    }
  }
  
  // Pattern-based targeting
  if (desc.includes('after') && desc.includes('paragraph')) {
    const paragraphMatch = desc.match(/after\s+(?:the\s+)?paragraph\s+(?:that\s+)?(?:ends with|containing)\s+['"]?([^'"]+)['"]?/);
    if (paragraphMatch) {
      return { type: 'pattern', afterPattern: paragraphMatch[1].trim() };
    }
  }
  
  // Line number targeting
  const lineMatch = desc.match(/(?:at\s+)?line\s+(\d+)/);
  if (lineMatch) {
    return { type: 'position', lineNumber: parseInt(lineMatch[1]) };
  }
  
  // Default to end of document
  if (desc.includes('end') || desc.includes('bottom')) {
    return { type: 'semantic', afterSection: 'Conclusion' };
  }
  
  // Fallback: try to use the description as a section name
  return { type: 'semantic', afterSection: description };
}

/**
 * 📊 Analyze Canvas Document Structure
 * 
 * Provides insight into document structure for better editing decisions
 */
export function analyzeCanvasStructure(canvas: CanvasItem): {
  outline: string[];
  sections: number;
  wordCount: number;
  insertionOpportunities: Array<{
    description: string;
    confidence: number;
    location: string;
  }>;
} {
  const analysis = analyzeDocumentStructure(canvas.content);
  
  return {
    outline: analysis.outline,
    sections: analysis.sections.length,
    wordCount: canvas.content.split(/\s+/).length,
    insertionOpportunities: analysis.insertionPoints.map(point => ({
      description: `Insert ${point.type} at ${point.location}`,
      confidence: point.confidence,
      location: point.context
    }))
  };
}
export function generateCanvasTitle(content: string, fallback: string = 'New Document'): string {
  // Extract only work product content, ignore conversational markers
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Skip conversational lines and find actual document title
  for (const line of lines) {
    const cleanLine = line.replace(/^#+\s*/, '').trim();
    
    // Skip conversation indicators
    if (cleanLine.toLowerCase().includes('okay, i understand') ||
        cleanLine.toLowerCase().includes('you need assistance') ||
        cleanLine.toLowerCase().includes('here\'s') ||
        cleanLine.toLowerCase().includes('i\'ll help') ||
        cleanLine.toLowerCase().includes('let me') ||
        cleanLine.includes('**Document Type:**') ||
        cleanLine.includes('**Generated:**')) {
      continue;
    }
    
    // Look for actual document title (3-60 chars, no periods, not lowercase)
    if (cleanLine.length >= 3 && cleanLine.length <= 60 && 
        !cleanLine.includes('.') && 
        !cleanLine.startsWith('*') &&
        /[A-Z]/.test(cleanLine)) {
      return cleanLine;
    }
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

/**
 * Enhanced multi-canvas detection with "two canvases" support
 */
export function detectMultipleTasks(userInput: string, aiResponse: string): Array<{
  title: string;
  content: string;
  type: string;
  priority: string;
}> {
  const input = userInput.toLowerCase();
  const response = aiResponse || '';
  
  // Specific multi-canvas patterns (more permissive)
  const multiCanvasPatterns = [
    /two\s+(canvases?|documents?)/i,
    /create\s+(two|2)\s+(documents?|canvases?)/i,
    /separate\s+(documents?|canvases?)/i,
    /multiple\s+(documents?|canvases?)/i,
    /different\s+(documents?|canvases?)/i,
    // More permissive patterns
    /(two|2)\s+canvases?/i,
    /i\s+need\s+(two|2)/i,
    /seperate\s+canvas/i,  // Common misspelling
    /and\s+a\s+(petition|motion|letter|document)/i, // "letter and a petition"
    /here\s+is\s+the\s+format.*seperate\s+canvas/i  // User's specific request pattern
  ];
  
  // Check if user explicitly requested multiple canvases
  const hasMultiCanvasRequest = multiCanvasPatterns.some(pattern => pattern.test(userInput));
  
  if (hasMultiCanvasRequest) {
    console.log('🎯 Multi-canvas request detected:', userInput.substring(0, 100));
    
    // Extract document types mentioned
    const documentTypes = ['petition', 'motion', 'brief', 'contract', 'letter', 'memo', 'report'];
    const mentionedTypes = documentTypes.filter(type => input.includes(type));
    
    // If specific types mentioned, create separate canvases for each
    if (mentionedTypes.length >= 2) {
      return mentionedTypes.slice(0, 2).map((type, index) => ({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Document ${index + 1}`,
        content: `# ${type.charAt(0).toUpperCase() + type.slice(1)} Document\n\n[Document content will be generated here]\n\n${response}`,
        type: type,
        priority: index === 0 ? 'high' : 'medium'
      }));
    }
    
    // Default: Create two generic documents
    return [
      {
        title: 'Document 1',
        content: `# Document 1\n\n${response.substring(0, Math.floor(response.length / 2))}`,
        type: 'document',
        priority: 'high'
      },
      {
        title: 'Document 2', 
        content: `# Document 2\n\n${response.substring(Math.floor(response.length / 2))}`,
        type: 'document',
        priority: 'medium'
      }
    ];
  }
  
  return [];
}
