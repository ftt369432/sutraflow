interface DocumentSection {
  type: 'header' | 'statement_of_facts' | 'argument' | 'instruction' | 'citation' | 'conclusion';
  content: string;
  formatting: {
    isBold: boolean;
    isNumbered: boolean;
    indentLevel: number;
  };
}

interface DocumentStructure {
  title: string;
  sections: DocumentSection[];
  formatting: {
    hasStatementOfFacts: boolean;
    hasArguments: boolean;
    hasInstructions: boolean;
    hasCitations: boolean;
  };
}

export class DocumentStructureService {
  
  static analyzeDocumentStructure(content: string): DocumentStructure {
    console.log('🔍 STRUCTURE: Analyzing document structure');
    
    const sections = this.extractSections(content);
    const formatting = this.analyzeFormatting(sections);
    const title = this.extractTitle(content);
    
    console.log('📋 STRUCTURE: Found sections:', sections.length);
    console.log('📝 STRUCTURE: Formatting analysis:', formatting);
    
    return {
      title,
      sections,
      formatting
    };
  }
  
  private static extractSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      
      const section = this.classifySection(line, i, lines);
      if (section) {
        sections.push(section);
      }
    }
    
    return sections;
  }
  
  private static classifySection(line: string, index: number, allLines: string[]): DocumentSection | null {
    // Detect bold formatting patterns
    const isBold = this.detectBoldFormatting(line);
    
    // Detect numbered sections
    const isNumbered = this.detectNumberedSection(line);
    
    // Detect indentation
    const indentLevel = this.detectIndentLevel(line);
    
    // Classify section type
    const type = this.detectSectionType(line, index, allLines);
    
    if (type) {
      return {
        type,
        content: line,
        formatting: {
          isBold,
          isNumbered,
          indentLevel
        }
      };
    }
    
    return null;
  }
  
  private static detectBoldFormatting(line: string): boolean {
    // Detect markdown bold
    if (line.includes('**') || line.includes('__')) return true;
    
    // Detect ALL CAPS (common in legal docs)
    if (line === line.toUpperCase() && line.length > 5) return true;
    
    // Detect common bold patterns
    if (/^[A-Z\s]{3,}:/.test(line)) return true;
    
    return false;
  }
  
  private static detectNumberedSection(line: string): boolean {
    // Roman numerals
    if (/^[IVX]+\.\s/.test(line)) return true;
    
    // Numbers with periods
    if (/^\d+\.\s/.test(line)) return true;
    
    // Letters with periods
    if (/^[A-Z]\.\s/.test(line)) return true;
    
    return false;
  }
  
  private static detectIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? Math.floor(match[1].length / 4) : 0;
  }
  
  private static detectSectionType(line: string, index: number, allLines: string[]): DocumentSection['type'] | null {
    const lowerLine = line.toLowerCase();
    
    // Statement of Facts patterns
    if (this.matchesPatterns(lowerLine, [
      'statement of facts',
      'factual background',
      'background',
      'ii. factual',
      'facts'
    ])) {
      return 'statement_of_facts';
    }
    
    // Argument patterns
    if (this.matchesPatterns(lowerLine, [
      'argument',
      'legal argument',
      'analysis',
      'iii. argument',
      'contention',
      'legal basis'
    ])) {
      return 'argument';
    }
    
    // Instruction patterns
    if (this.matchesPatterns(lowerLine, [
      '[',
      'fill in',
      'insert',
      'provide',
      'state the',
      'explain why',
      'summarize'
    ])) {
      return 'instruction';
    }
    
    // Citation patterns
    if (this.matchesPatterns(line, [
      'v.',
      'cal.comp.cases',
      'cal.app.',
      'labor code',
      'wcab',
      '§'
    ])) {
      return 'citation';
    }
    
    // Header patterns
    if (this.matchesPatterns(lowerLine, [
      'workers\' compensation',
      'state of california',
      'petition',
      'response',
      'conclusion',
      'verification'
    ]) && this.detectBoldFormatting(line)) {
      return 'header';
    }
    
    return null;
  }
  
  private static matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }
  
  private static analyzeFormatting(sections: DocumentSection[]) {
    return {
      hasStatementOfFacts: sections.some(s => s.type === 'statement_of_facts'),
      hasArguments: sections.some(s => s.type === 'argument'),
      hasInstructions: sections.some(s => s.type === 'instruction'),
      hasCitations: sections.some(s => s.type === 'citation')
    };
  }
  
  private static extractTitle(content: string): string {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // Look for title in first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (this.detectBoldFormatting(line) && line.length > 10) {
        return line.replace(/\*\*/g, '').trim();
      }
    }
    
    return 'Legal Document';
  }
}

export type { DocumentStructure, DocumentSection };
