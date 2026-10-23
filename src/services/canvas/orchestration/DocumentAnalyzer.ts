/**
 * Document Analyzer
 * 
 * Content analysis and classification for Canvas routing decisions.
 * Analyzes AI responses to determine document type, structure, and metadata.
 */

export interface DocumentAnalysis {
  type: string;
  title: string;
  profession: string;
  isDocument: boolean;
  confidence: number;
  indicators: string[];
  jurisdiction?: string;
  caseNumber?: string;
  metadata: {
    wordCount: number;
    hasStructure: boolean;
    hasLegalTerms: boolean;
    hasBusinessTerms: boolean;
    hasMedicalTerms: boolean;
    documentQuality: 'high' | 'medium' | 'low';
  };
}

export class DocumentAnalyzer {

  /**
   * Main content analysis method
   */
  async analyzeContent(content: string): Promise<DocumentAnalysis> {
    console.log('🔍 DocumentAnalyzer: Analyzing content', {
      length: content.length,
      firstLine: content.split('\n')[0]?.substring(0, 100)
    });

    const analysis: DocumentAnalysis = {
      type: 'document',
      title: 'Untitled Document',
      profession: 'general',
      isDocument: false,
      confidence: 0,
      indicators: [],
      metadata: {
        wordCount: this.countWords(content),
        hasStructure: this.hasDocumentStructure(content),
        hasLegalTerms: this.hasLegalTerminology(content),
        hasBusinessTerms: this.hasBusinessTerminology(content),
        hasMedicalTerms: this.hasMedicalTerminology(content),
        documentQuality: 'low'
      }
    };

    // Analyze document type and indicators
    this.analyzeDocumentType(content, analysis);
    
    // Extract title
    const extractedTitle = this.extractTitle(content, analysis.type);
    // 🔧 SCHMIDT FIX: Ensure title is always a string
    analysis.title = typeof extractedTitle === 'string' ? extractedTitle : 'Untitled Document';
    
    console.log('🔍 DocumentAnalyzer: Title extraction results', {
      detectedType: analysis.type,
      extractedTitle: analysis.title,
      extractedTitleType: typeof analysis.title,
      confidence: analysis.confidence,
      indicators: analysis.indicators
    });
    
    // Determine profession
    analysis.profession = this.determineProfession(analysis.metadata);
    
    // Extract metadata
    this.extractMetadata(content, analysis);
    
    // Calculate overall confidence and document quality
    this.calculateConfidence(analysis);
    
    console.log('🔍 Document analysis complete:', {
      type: analysis.type,
      title: analysis.title,
      profession: analysis.profession,
      confidence: analysis.confidence,
      isDocument: analysis.isDocument
    });

    return analysis;
  }

  /**
   * Analyzes document type based on content indicators
   */
  private analyzeDocumentType(content: string, analysis: DocumentAnalysis): void {
    const upperContent = content.toUpperCase();

    // Legal document indicators
    const legalIndicators = [
      { pattern: 'PETITION FOR', type: 'petition', weight: 10 },
      { pattern: 'MOTION TO', type: 'motion', weight: 10 },
      { pattern: 'BRIEF IN SUPPORT', type: 'brief', weight: 10 },
      { pattern: 'WORKERS\' COMPENSATION APPEALS BOARD', type: 'petition', weight: 8 },
      { pattern: 'STATE OF CALIFORNIA', type: 'petition', weight: 6 },
      { pattern: 'COMES NOW', type: 'petition', weight: 8 },
      { pattern: 'WHEREFORE', type: 'petition', weight: 8 },
      { pattern: 'CASE NUMBER', type: 'legal_document', weight: 6 },
      { pattern: 'FINDINGS OF FACT', type: 'order', weight: 9 },
      { pattern: 'ORDER TO', type: 'order', weight: 8 },
      { pattern: 'NOTICE OF', type: 'notice', weight: 7 }
    ];

    // Business document indicators
    const businessIndicators = [
      { pattern: 'BUSINESS PROPOSAL', type: 'proposal', weight: 10 },
      { pattern: 'PROJECT PROPOSAL', type: 'proposal', weight: 10 },
      { pattern: 'STATEMENT OF WORK', type: 'contract', weight: 9 },
      { pattern: 'CONTRACT AGREEMENT', type: 'contract', weight: 10 },
      { pattern: 'MEMORANDUM OF UNDERSTANDING', type: 'contract', weight: 9 },
      { pattern: 'EXECUTIVE SUMMARY', type: 'report', weight: 8 },
      { pattern: 'SCOPE OF WORK', type: 'proposal', weight: 7 },
      { pattern: 'DELIVERABLES', type: 'proposal', weight: 6 }
    ];

    // Medical document indicators
    const medicalIndicators = [
      { pattern: 'MEDICAL REPORT', type: 'report', weight: 10 },
      { pattern: 'TREATMENT PLAN', type: 'plan', weight: 9 },
      { pattern: 'PATIENT SUMMARY', type: 'summary', weight: 8 },
      { pattern: 'CLINICAL NOTES', type: 'notes', weight: 8 },
      { pattern: 'DISCHARGE SUMMARY', type: 'summary', weight: 9 },
      { pattern: 'DIAGNOSIS', type: 'report', weight: 7 },
      { pattern: 'PRESCRIPTION', type: 'prescription', weight: 8 }
    ];

    const allIndicators = [...legalIndicators, ...businessIndicators, ...medicalIndicators];
    let maxWeight = 0;
    let bestType = 'document';

    // Find matching indicators and calculate weights
    for (const indicator of allIndicators) {
      if (upperContent.includes(indicator.pattern)) {
        analysis.indicators.push(indicator.pattern);
        if (indicator.weight > maxWeight) {
          maxWeight = indicator.weight;
          bestType = indicator.type;
        }
      }
    }

    analysis.type = bestType;
  }

  /**
   * Extracts document title
   */
  private extractTitle(content: string, documentType: string): string {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('🔍 TITLE EXTRACTION: Analyzing content for title extraction');
    console.log('🔍 TITLE EXTRACTION: Document type:', documentType);
    console.log('🔍 TITLE EXTRACTION: First 5 lines:', lines.slice(0, 5));
    
    // 🎯 ENHANCED TITLE EXTRACTION - Look for specific patterns first
    const titlePatterns = [
      // Legal document with employer in parentheses - All Roman numerals
      /^\*\*([IVX]+)\.\s*(.+?)\s*\(Employer:\s*([^)]+)\)\s*:\*\*$/,
      /^([IVX]+)\.\s*(.+?)\s*\(Employer:\s*([^)]+)\)\s*:?$/,
      
      // Roman numeral headers (I. II. III.)
      /^\*\*I\.\s*(.+?)\*\*$/,
      /^I\.\s*(.+)$/,
      
      // Markdown headers
      /^#\s*(.+)$/,
      
      // Bold markdown titles
      /^\*\*(.+?)\*\*$/ ,
      
      // Document headers with employer context
      /^(.+(?:Plan|Petition|Letter|Motion|Brief|Contract|Report).*(?:Employer|Case|Action).*)$/i,
      
      // General plan/case titles
      /^(.+(?:General|Opening)\s*(?:Plan|Case|Action).*)$/i,
      
      // Workers' compensation specific
      /^(.+Workers?\s*Compensation.*)$/i,
      
      // Client-specific titles
      /^(.+(?:Opening|Case|Action|Workers|Compensation|Treatment).*)$/i,
      
      // Name-based titles
      /^(.+(?:for|to|regarding)\s+[A-Z][a-z]+\s+[A-Z][a-z]+.*)$/i
    ];
    
    // Try pattern matching first
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      
      console.log(`🔍 TITLE EXTRACTION: Testing line ${i}:`, line);
      
      // Skip metadata lines
      if (line.includes('Document Type:') || line.includes('Generated:') || 
          line.includes('Date:') || line.includes('Case:') || line.includes('**To:**')) {
        continue;
      }
      
      // Test against patterns
      for (const pattern of titlePatterns) {
        const match = line.match(pattern);
        if (match && match.length >= 2) {
          // Handle different capture group structures
          let title: string;
          let employer: string | null = null;
          
          if (match.length >= 4 && match[3]) {
          // Pattern with Roman numeral: [full, roman, title, employer]
            title = match[2].trim();
            employer = match[3].trim();
          } else if (match.length >= 3 && match[2]) {
            // Pattern with employer: [full, title, employer]
            title = match[1].trim();
            employer = match[2].trim();
          } else {
            // Simple pattern: [full, title]
            title = match[1].trim();
          }
          
          // Clean up extracted title
          title = title.replace(/\*\*/g, ''); // Remove markdown
          title = title.replace(/\(Employer:.*?\)/g, ''); // Remove employer parenthetical
          title = title.trim();
          
          // If we extracted an employer name, create a better title
          if (employer) {
            // Convert "General Plan of Action for a New California Workers' Compensation Case" + "Jackass"
            // to "Workers' Comp Case Plan - Jackass"
            if (title.toLowerCase().includes('workers') && title.toLowerCase().includes('compensation')) {
              title = `Workers' Comp Case Plan - ${employer}`;
            } else if (title.toLowerCase().includes('medical')) {
              title = `Medical Records Analysis - ${employer}`;
            } else if (title.toLowerCase().includes('communication')) {
              title = `Communication Plan - ${employer}`;
            } else if (title.toLowerCase().includes('plan')) {
              title = `${title} - ${employer} Case`;
            } else {
              title = `${title} - ${employer}`;
            }
          }
          
          if (title.length >= 10 && title.length <= 150) {
            console.log('✅ TITLE EXTRACTION: Found pattern-based title:', title, employer ? `(Employer: ${employer})` : '');
            return title;
          }  
        }
      }
      
      // Look for substantial lines that could be titles
      if (line.length >= 10 && line.length <= 150 && 
          !line.includes(':') && !line.startsWith('*') && 
          line.split(' ').length >= 3) {
        console.log('✅ TITLE EXTRACTION: Found substantial title:', line);
        return line;
      }
    }

    // 🎯 ENHANCED FALLBACK - Create more specific titles based on content analysis
    const contentAnalysis = this.analyzeContentForTitle(content, documentType);
    if (contentAnalysis) {
      console.log('✅ TITLE EXTRACTION: Using content analysis title:', contentAnalysis);
      return contentAnalysis;
    }

    // Final fallback to document type-based title
    const typeMap: { [key: string]: string } = {
      'petition': 'Workers\' Compensation Petition',
      'motion': 'Legal Motion Document',
      'brief': 'Legal Brief Document',
      'proposal': 'Business Proposal Document',
      'contract': 'Contract Agreement',
      'report': 'Professional Report',
      'plan': 'Case Action Plan',
      'letter': 'Professional Letter'
    };

    const fallbackTitle = typeMap[documentType] || 'Professional Document';
    console.log('⚠️ TITLE EXTRACTION: Using fallback title:', fallbackTitle);
    return fallbackTitle;
  }

  /**
   * 🎯 ENHANCED: Analyze content to create more specific titles
   */
  private analyzeContentForTitle(content: string, documentType: string): string | null {
    console.log('🔍 CONTENT ANALYSIS: Analyzing for title extraction, document type:', documentType);
    console.log('🔍 CONTENT ANALYSIS: Content preview:', content.substring(0, 200));
    
    // 🎯 ENHANCED PATTERNS: Look for employer names and case contexts
    const employerMatches = content.match(/(?:employer[:\s]+|employer\s*\(\s*)([A-Za-z][A-Za-z\s]*?)(?:\)|[:\s])/gi);
    const applicantMatches = content.match(/(?:applicant[:\s]+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi);
    const caseMatches = content.match(/(workers?\s*compensation|treatment|case\s*plan|opening\s*case|plan\s*of\s*action)/gi);
    
    console.log('🔍 CONTENT ANALYSIS: Found matches:', {
      employerMatches,
      applicantMatches, 
      caseMatches
    });
    
    // Extract clean names
    let employerName = null;
    let applicantName = null;
    
    if (employerMatches && employerMatches[0]) {
      employerName = employerMatches[0]
        .replace(/employer[:\s]*\(?/gi, '')
        .replace(/\).*$/, '')
        .trim();
      console.log('🏢 EMPLOYER EXTRACTED:', employerName);
    }
    
    if (applicantMatches && applicantMatches[0]) {
      applicantName = applicantMatches[0]
        .replace(/applicant[:\s]*/gi, '')
        .trim();
      console.log('👤 APPLICANT EXTRACTED:', applicantName);
    }
    
    // 🎯 CREATE SMART TITLES based on document type and extracted info
    if (documentType === 'plan' && (employerName || applicantName)) {
      if (employerName && applicantName) {
        return `Workers' Comp Case Plan - ${applicantName} vs ${employerName}`;
      } else if (employerName) {
        return `Workers' Comp Case Plan - ${employerName} Case`;
      } else if (applicantName) {
        return `Workers' Comp Case Plan - ${applicantName}`;
      }
    }
    
    if (documentType === 'petition' && (employerName || applicantName)) {
      if (employerName && applicantName) {
        return `Petition - ${applicantName} vs ${employerName}`;
      } else if (employerName) {
        return `Workers' Comp Petition - ${employerName}`;
      } else if (applicantName) {
        return `Workers' Comp Petition - ${applicantName}`;
      }
    }
    
    if (documentType === 'letter' && (employerName || applicantName)) {
      const target = applicantName || employerName;
      return `Treatment Letter - ${target}`;
    }
    
    // Look for employer/applicant names
    const applicantMatch = content.match(/applicant[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
    const employerMatch = content.match(/employer[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    
    if (applicantMatch && documentType === 'petition') {
      return `Workers' Compensation Case - ${applicantMatch[1]}`;
    }
    
    return null;
  }

  /**
   * Determines profession based on content analysis
   */
  private determineProfession(metadata: any): string {
    if (metadata.hasLegalTerms) return 'legal';
    if (metadata.hasMedicalTerms) return 'medical';
    if (metadata.hasBusinessTerms) return 'business';
    return 'general';
  }

  /**
   * Extracts metadata like case numbers, jurisdiction, etc.
   */
  private extractMetadata(content: string, analysis: DocumentAnalysis): void {
    // Extract case number
    const caseNumberMatch = content.match(/Case\s+(?:Number|No\.?)\s*:?\s*([A-Z0-9-]+)/i);
    if (caseNumberMatch) {
      analysis.caseNumber = caseNumberMatch[1];
    }

    // Extract jurisdiction
    const jurisdictionMatch = content.match(/State\s+of\s+(\w+)/i);
    if (jurisdictionMatch) {
      analysis.jurisdiction = jurisdictionMatch[1];
    }
  }

  /**
   * Calculates confidence score and document quality
   */
  private calculateConfidence(analysis: DocumentAnalysis): void {
    let confidence = 0;

    // Base confidence from indicators
    confidence += analysis.indicators.length * 0.15;

    // Bonus for document structure
    if (analysis.metadata.hasStructure) {
      confidence += 0.25;
    }

    // Bonus for substantial length
    if (analysis.metadata.wordCount > 200) {
      confidence += 0.20;
    }

    // Bonus for professional terminology
    if (analysis.metadata.hasLegalTerms || 
        analysis.metadata.hasBusinessTerms || 
        analysis.metadata.hasMedicalTerms) {
      confidence += 0.15;
    }

    // Cap at 1.0
    analysis.confidence = Math.min(confidence, 1.0);

    // Determine if this is a document
    analysis.isDocument = analysis.confidence > 0.6 && analysis.metadata.wordCount > 100;

    // Determine document quality
    if (analysis.confidence > 0.8 && analysis.metadata.hasStructure) {
      analysis.metadata.documentQuality = 'high';
    } else if (analysis.confidence > 0.6) {
      analysis.metadata.documentQuality = 'medium';
    } else {
      analysis.metadata.documentQuality = 'low';
    }
  }

  /**
   * Helper methods for content analysis
   */
  private countWords(content: string): number {
    return content.trim().split(/\s+/).length;
  }

  private hasDocumentStructure(content: string): boolean {
    const structurePatterns = [
      /\*\*[IVX]+\./,    // Roman numeral sections
      /\*\*\d+\./,       // Numbered sections
      /\n[A-Z]\./,       // Letter subsections
      /\n\d+\./,         // Numbered subsections
      /Dated:/,          // Signature line
      /Signature:/,      // Signature line
      /WHEREFORE/,       // Legal conclusion
      /Respectfully/     // Professional closing
    ];

    return structurePatterns.some(pattern => pattern.test(content));
  }

  private hasLegalTerminology(content: string): boolean {
    const legalTerms = [
      'plaintiff', 'defendant', 'petitioner', 'respondent', 'applicant',
      'whereas', 'wherefore', 'heretofore', 'jurisdiction', 'venue',
      'cause of action', 'relief', 'damages', 'injunction', 'pursuant',
      'labor code', 'workers compensation', 'appeals board', 'wcab'
    ];

    const lowerContent = content.toLowerCase();
    return legalTerms.some(term => lowerContent.includes(term));
  }

  private hasBusinessTerminology(content: string): boolean {
    const businessTerms = [
      'deliverables', 'scope of work', 'timeline', 'budget', 'proposal',
      'contract', 'agreement', 'terms and conditions', 'payment terms',
      'intellectual property', 'confidentiality', 'non-disclosure',
      'project management', 'stakeholder', 'roi', 'kpi'
    ];

    const lowerContent = content.toLowerCase();
    return businessTerms.some(term => lowerContent.includes(term));
  }

  private hasMedicalTerminology(content: string): boolean {
    const medicalTerms = [
      'diagnosis', 'treatment', 'patient', 'medical', 'clinical',
      'therapy', 'medication', 'prescription', 'symptoms', 'prognosis',
      'examination', 'assessment', 'chronic', 'acute', 'condition',
      'healthcare', 'physician', 'doctor', 'nurse', 'hospital'
    ];

    const lowerContent = content.toLowerCase();
    return medicalTerms.some(term => lowerContent.includes(term));
  }
}
