/**
 * 🧠 Surgical Document Editor
 * 
 * Advanced document editing system that works like Claude's code editing:
 * - Analyzes document structure semantically
 * - Finds precise insertion points using context
 * - Performs surgical edits without disturbing document flow
 * - Maintains document integrity with validation
 */

export interface EditInstruction {
  action: 'insert' | 'replace' | 'append' | 'prepend';
  targetLocation: LocationSpecifier;
  content: string;
  preserveFormatting: boolean;
  validateAfter: boolean;
}

export interface LocationSpecifier {
  type: 'semantic' | 'pattern' | 'position';
  
  // Semantic targeting (preferred)
  beforeSection?: string;  // "Insert before the 'Conclusion' section"
  afterSection?: string;   // "Insert after 'Background' section" 
  inSection?: string;      // "Insert within 'Methods' section"
  
  // Pattern matching
  beforePattern?: string;  // "Insert before line containing 'Furthermore'"
  afterPattern?: string;   // "Insert after paragraph ending with 'litigation.'"
  replacePattern?: string; // "Replace text matching this pattern"
  
  // Position fallback
  lineNumber?: number;
  characterPosition?: number;
  
  // Context validation
  requiredContext?: string; // Must find this context to proceed
  avoidContext?: string;    // Don't insert if this context is present
}

export interface DocumentSection {
  id: string;
  type: 'title' | 'heading' | 'subheading' | 'paragraph' | 'list' | 'table' | 'code' | 'quote';
  level?: number;
  content: string;
  startPos: number;
  endPos: number;
  context: {
    before: string;
    after: string;
  };
  metadata: {
    wordCount: number;
    sentenceCount: number;
    keyTerms: string[];
  };
}

/**
 * 🔍 Advanced Document Structure Analysis
 * 
 * Analyzes document like Claude analyzes code files:
 * - Understands semantic structure
 * - Maps relationships between sections
 * - Identifies insertion opportunities
 */
export function analyzeDocumentStructure(content: string): {
  sections: DocumentSection[];
  outline: string[];
  insertionPoints: Array<{
    location: string;
    type: string;
    confidence: number;
    context: string;
  }>;
} {
  const lines = content.split('\n');
  const sections: DocumentSection[] = [];
  const outline: string[] = [];
  let position = 0;

  // Pattern recognition for document elements
  const patterns = {
    title: /^#{1}\s+(.+)$|^([A-Z\s]{3,})$|^(.+)\n={3,}$/,
    heading: /^#{2,3}\s+(.+)$/,
    subheading: /^#{4,6}\s+(.+)$|^\*\*(.+)\*\*$/,
    listItem: /^[-*+]\s+(.+)$|^\d+\.\s+(.+)$/,
    quote: /^>\s+(.+)$/,
    table: /^\|.*\|$/,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      position += line.length + 1;
      continue;
    }

    // Detect section types
    let sectionType: DocumentSection['type'] = 'paragraph';
    let level = 1;
    let content = trimmed;

    // Check patterns
    for (const [type, pattern] of Object.entries(patterns)) {
      const match = trimmed.match(pattern);
      if (match) {
        sectionType = type as DocumentSection['type'];
        if (type.includes('heading')) {
          level = (trimmed.match(/^#+/) || ['#'])[0].length;
        }
        content = match[1] || match[2] || match[3] || trimmed;
        break;
      }
    }

    // Get context
    const contextBefore = lines.slice(Math.max(0, i - 2), i).join('\n');
    const contextAfter = lines.slice(i + 1, Math.min(lines.length, i + 3)).join('\n');

    const section: DocumentSection = {
      id: `section-${sections.length}`,
      type: sectionType,
      level,
      content,
      startPos: position,
      endPos: position + line.length,
      context: {
        before: contextBefore,
        after: contextAfter
      },
      metadata: {
        wordCount: content.split(/\s+/).length,
        sentenceCount: (content.match(/[.!?]+/g) || []).length,
        keyTerms: extractKeyTerms(content)
      }
    };

    sections.push(section);

    // Build outline
    if (sectionType === 'title' || sectionType === 'heading' || sectionType === 'subheading') {
      const indent = '  '.repeat(Math.max(0, level - 1));
      outline.push(`${indent}- ${content}`);
    }

    position += line.length + 1;
  }

  // Identify insertion points
  const insertionPoints = findInsertionOpportunities(sections);

  return { sections, outline, insertionPoints };
}

/**
 * 🎯 Semantic Location Finding
 * 
 * Finds exact insertion point using semantic understanding
 * Similar to how Claude finds the right location in code
 */
export function findInsertionPoint(
  content: string,
  location: LocationSpecifier
): { position: number; confidence: number; context: string } | null {
  
  const structure = analyzeDocumentStructure(content);
  const { sections } = structure;
  
  // Semantic targeting (preferred approach)
  if (location.beforeSection) {
    const targetSection = sections.find(s => 
      s.content.toLowerCase().includes(location.beforeSection!.toLowerCase()) &&
      (s.type === 'title' || s.type === 'heading')
    );
    
    if (targetSection) {
      return {
        position: targetSection.startPos,
        confidence: 0.95,
        context: `Before section: "${targetSection.content}"`
      };
    }
  }
  
  if (location.afterSection) {
    const targetSection = sections.find(s => 
      s.content.toLowerCase().includes(location.afterSection!.toLowerCase()) &&
      (s.type === 'title' || s.type === 'heading')
    );
    
    if (targetSection) {
      // Find end of this section (start of next section or end of document)
      const nextSectionIndex = sections.findIndex(s => s.startPos > targetSection.endPos && 
        (s.type === 'title' || s.type === 'heading'));
      const endPos = nextSectionIndex >= 0 ? sections[nextSectionIndex].startPos : content.length;
      
      return {
        position: endPos,
        confidence: 0.9,
        context: `After section: "${targetSection.content}"`
      };
    }
  }

  // Pattern matching fallback
  if (location.afterPattern) {
    const regex = new RegExp(location.afterPattern, 'gi');
    const match = regex.exec(content);
    if (match) {
      return {
        position: match.index + match[0].length,
        confidence: 0.8,
        context: `After pattern: "${match[0]}"`
      };
    }
  }

  // Position fallback
  if (location.lineNumber) {
    const lines = content.split('\n');
    if (location.lineNumber <= lines.length) {
      const position = lines.slice(0, location.lineNumber - 1).join('\n').length + 1;
      return {
        position,
        confidence: 0.6,
        context: `Line ${location.lineNumber}`
      };
    }
  }

  return null;
}

/**
 * ✂️ Surgical Edit Execution
 * 
 * Performs the edit with validation and integrity checks
 */
export function performSurgicalDocumentEdit(
  originalContent: string,
  instruction: EditInstruction
): {
  success: boolean;
  newContent: string;
  applied: boolean;
  errors: string[];
  changesSummary: string;
} {
  const errors: string[] = [];
  
  try {
    // Find insertion point
    const insertionResult = findInsertionPoint(originalContent, instruction.targetLocation);
    
    if (!insertionResult) {
      return {
        success: false,
        newContent: originalContent,
        applied: false,
        errors: ['Could not find target location for edit'],
        changesSummary: 'No changes applied'
      };
    }

    if (insertionResult.confidence < 0.7) {
      errors.push(`Low confidence (${insertionResult.confidence}) in location detection`);
    }

    // Validate context if required
    if (instruction.targetLocation.requiredContext) {
      const contextRegex = new RegExp(instruction.targetLocation.requiredContext, 'i');
      if (!contextRegex.test(originalContent)) {
        return {
          success: false,
          newContent: originalContent,
          applied: false,
          errors: ['Required context not found in document'],
          changesSummary: 'Edit blocked by context validation'
        };
      }
    }

    // Prepare content for insertion
    let contentToInsert = instruction.content;
    if (instruction.preserveFormatting) {
      contentToInsert = preserveDocumentFormatting(contentToInsert, originalContent, insertionResult.position);
    }

    // Perform the edit
    let newContent: string;
    const { position } = insertionResult;

    switch (instruction.action) {
      case 'insert':
        newContent = originalContent.slice(0, position) + 
                    '\n\n' + contentToInsert + '\n\n' + 
                    originalContent.slice(position);
        break;

      case 'append':
        newContent = originalContent + '\n\n' + contentToInsert;
        break;

      case 'prepend':
        newContent = contentToInsert + '\n\n' + originalContent;
        break;

      case 'replace':
        if (instruction.targetLocation.replacePattern) {
          const regex = new RegExp(instruction.targetLocation.replacePattern, 'gi');
          newContent = originalContent.replace(regex, contentToInsert);
        } else {
          errors.push('Replace action requires replacePattern');
          return {
            success: false,
            newContent: originalContent,
            applied: false,
            errors,
            changesSummary: 'Replace action failed'
          };
        }
        break;

      default:
        errors.push(`Unknown action: ${instruction.action}`);
        return {
          success: false,
          newContent: originalContent,
          applied: false,
          errors,
          changesSummary: 'Unknown action'
        };
    }

    // Validate result if requested
    if (instruction.validateAfter) {
      const validationErrors = validateDocumentIntegrity(originalContent, newContent);
      errors.push(...validationErrors);
    }

    const changesSummary = `${instruction.action} operation at ${insertionResult.context}: ${contentToInsert.length} characters added`;

    return {
      success: true,
      newContent,
      applied: true,
      errors,
      changesSummary
    };

  } catch (error) {
    return {
      success: false,
      newContent: originalContent,
      applied: false,
      errors: [`Surgical edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      changesSummary: 'Edit operation failed'
    };
  }
}

// Helper functions

function extractKeyTerms(content: string): string[] {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const wordCount: Record<string, number> = {};
  words.forEach(word => wordCount[word] = (wordCount[word] || 0) + 1);
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

function findInsertionOpportunities(sections: DocumentSection[]): Array<{
  location: string;
  type: string;
  confidence: number;
  context: string;
}> {
  const opportunities: Array<{
    location: string;
    type: string;
    confidence: number;
    context: string;
  }> = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    if (section.type === 'heading') {
      opportunities.push({
        location: `before-${section.id}`,
        type: 'section-start',
        confidence: 0.9,
        context: `Before section: "${section.content}"`
      });
    }

    if (section.type === 'paragraph' && section.metadata.wordCount > 50) {
      opportunities.push({
        location: `after-${section.id}`,
        type: 'paragraph-end',
        confidence: 0.7,
        context: `After paragraph ending: "${section.content.slice(-50)}..."`
      });
    }
  }

  return opportunities;
}

function preserveDocumentFormatting(content: string, document: string, position: number): string {
  // Detect indentation and formatting style from surrounding context
  const lines = document.split('\n');
  let insertionLine = 0;
  let charCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (charCount >= position) {
      insertionLine = i;
      break;
    }
    charCount += lines[i].length + 1;
  }

  // Apply consistent formatting based on context
  // This is a simplified version - you could make this much more sophisticated
  return content;
}

function validateDocumentIntegrity(original: string, modified: string): string[] {
  const errors: string[] = [];
  
  // Check for basic structural integrity
  const originalSections = analyzeDocumentStructure(original);
  const modifiedSections = analyzeDocumentStructure(modified);
  
  // Ensure we didn't accidentally break the document structure
  if (modifiedSections.sections.length < originalSections.sections.length - 2) {
    errors.push('Document structure appears to have been damaged');
  }

  // Check for duplicate content
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  let duplicateCount = 0;
  for (const line of originalLines) {
    if (line.trim() && modifiedLines.filter(l => l.trim() === line.trim()).length > 2) {
      duplicateCount++;
    }
  }
  
  if (duplicateCount > 3) {
    errors.push(`Possible duplicate content detected (${duplicateCount} duplicated lines)`);
  }

  return errors;
}