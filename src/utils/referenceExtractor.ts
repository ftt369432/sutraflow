/**
 * General purpose reference extraction system
 * Provides a flexible framework for extracting references across multiple domains
 */

import { extractLegalReferences } from './legalUtils';
import { extractMedicalReferences } from './medicalUtils';

/**
 * Reference domain types supported by the extractor
 */
export enum ReferenceDomain {
  LEGAL = 'legal',
  MEDICAL = 'medical',
  GENERAL = 'general',
  BUSINESS = 'business',
  PSYCHOLOGY = 'psychology',
  ACADEMIC = 'academic'
}

/**
 * Configuration for a reference extraction domain
 */
export interface ReferenceExtractorConfig {
  enabled: boolean;
  /**
   * Pattern types to include in extraction
   * For example, in legal domain: ['labor', 'ccp', 'case', 'civil']
   */
  includePatterns?: string[];
  /**
   * Additional regular expressions to apply in this domain
   */
  additionalPatterns?: RegExp[];
  /**
   * Optional formatter functions for specific reference types
   */
  formatters?: Record<string, (match: RegExpMatchArray) => string>;
}

/**
 * Options for extracting references
 */
export interface ReferenceExtractionOptions {
  /**
   * Domains to include in extraction
   */
  domains?: ReferenceDomain[];
  /**
   * Domain-specific configurations
   */
  domainConfigs?: Partial<Record<ReferenceDomain, ReferenceExtractorConfig>>;
  /**
   * Whether to format the references according to domain-specific rules
   */
  formatReferences?: boolean;
  /**
   * Whether to remove duplicates across domains
   */
  removeDuplicates?: boolean;
}

/**
 * Result of reference extraction
 */
export interface ReferenceExtractionResult {
  /**
   * All references found across all domains
   */
  allReferences: string[];
  /**
   * References organized by domain
   */
  domainReferences: Record<string, string[]>;
  /**
   * References organized by specific types within domains
   */
  typeReferences: Record<string, string[]>;
  /**
   * Metadata about the extraction process
   */
  metadata: {
    domainsProcessed: string[];
    totalReferencesFound: number;
    processingTimeMs: number;
  };
}

/**
 * Interface for pattern collections
 */
interface PatternCollection {
  [key: string]: RegExp;
}

/**
 * Domain-specific academic reference patterns
 * Includes citations, DOIs, books, etc.
 */
const academicPatterns: PatternCollection = {
  // APA style citations - Author(s), year, title
  citations: /\b(?:[A-Z][a-z]+(?:,?\s+(?:et\s+al\.|\&|and)\s+[A-Z][a-z]+)?),?\s+\((\d{4})\)\.?\s+([^.]+)\./gi,
  // DOI references
  doi: /\bDOI:?\s*(10\.\d{4,}\/[A-Z0-9./-]+)(?:[.,)]|$)/gi,
  // ISBN references
  isbn: /\bISBN(?:-1[03])?:?\s*(\d{3}-?\d{1,5}-?\d{1,7}-?\d{1,7}-?\d{1})/gi,
  // arXiv references
  arxiv: /\barXiv:(\d{4}\.\d{4,5}(?:v\d+)?)/gi,
};

/**
 * Domain-specific business reference patterns
 * Includes frameworks, models, methodologies, etc.
 */
const businessPatterns: PatternCollection = {
  // Business frameworks
  frameworks: /\b(SWOT|PESTEL|Porter's Five Forces|BCG Matrix|Balanced Scorecard|VRIO|McKinsey 7S|Ansoff Matrix|OKR|KPI|SMART goals|4Ps|Marketing Mix|Blue Ocean Strategy|Lean Canvas|Business Model Canvas)\b/gi,
  // Business books
  books: /\b(?:["']([^"']+)["']\s+by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)|([A-Z][a-z]+\s+[A-Z][a-z]+)'s\s+book\s+["']([^"']+)["'])/gi,
  // Management theories
  theories: /\b(Theory [XYZ]|Maslow's Hierarchy|Herzberg's Two Factor|McClelland's Needs Theory|Vroom's Expectancy Theory|Lean|Six Sigma|Agile|Scrum|Kaizen|TQM)\b/gi,
  // Business coaching models
  coaching: /\b(GROW model|CLEAR model|OSKAR model|CIGAR model|FUEL model|TGROW model|WOOP framework|360-degree feedback|Situational Leadership|Emotional Intelligence|EQ|Coaching Pyramid)\b/gi,
  // Business thought leaders
  leaders: /\b(Peter Drucker|Jim Collins|Stephen Covey|Simon Sinek|Tony Robbins|Dale Carnegie|Michael Porter|Marshall Goldsmith|Patrick Lencioni|Seth Godin|Gary Vaynerchuk|Adam Grant)['']?s?\s+(?:principles|model|approach|framework|concept|method|philosophy)\b/gi
};

/**
 * Domain-specific psychology reference patterns
 * Includes DSM codes, therapeutic modalities, etc.
 */
const psychologyPatterns: PatternCollection = {
  // DSM-5 diagnoses
  dsm: /\b(DSM-5|DSM-IV|DSM-III)\s+(?:code\s+)?([0-9]{3}\.[0-9]{1,2})\b/gi,
  // Therapeutic approaches
  therapy: /\b(CBT|DBT|ACT|EMDR|Psychoanalysis|Gestalt|Humanistic|Person-Centered|Solution-Focused|Narrative|Family Systems|Mindfulness-Based Cognitive Therapy|MBCT|Motivational Interviewing|MI|Existential|Cognitive Processing Therapy|CPT|Prolonged Exposure|PE)\s+(?:therapy|approach|treatment|intervention|technique)?\b/gi,
  // Psychological assessments
  assessments: /\b(MMPI|WAIS|WISC|Beck Depression Inventory|PHQ-9|GAD-7|SCID|Rorschach|Hamilton Anxiety Scale|HAM-A|Hamilton Depression Rating Scale|HAM-D|Mini-Mental State Examination|MMSE|MCMI|PAI|Vineland|SCL-90-R)\b/gi,
  // Life coaching concepts
  coaching: /\b(Growth Mindset|Fixed Mindset|Flow State|Self-Efficacy|Ikigai|Wheel of Life|Values Assessment|SMART Goals|PERMA Model|Internal Family Systems|IFS|NLP|Neuro-Linguistic Programming|Transtheoretical Model|Stages of Change)\b/gi,
  // Therapy theorists
  theorists: /\b(Freud|Jung|Adler|Rogers|Beck|Ellis|Perls|Erikson|Piaget|Skinner|Bandura|Maslow|Frankl|Yalom|Linehan|Hayes)['']?s?\s+(?:theory|approach|perspective|concept|technique|model)\b/gi
};

/**
 * General reference patterns that may appear in any domain
 */
const generalPatterns: PatternCollection = {
  // Books with title and author
  books: /\b(?:the\s+book\s+)?["']([^"']{5,}?)["']\s+(?:by|written\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi,
  // URLs - simplified pattern
  urls: /\bhttps?:\/\/(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,})(?:\/[^\s]*)?/gi,
  // Common acronyms with explanations
  acronyms: /\b([A-Z]{2,5})\s+\(([a-zA-Z\s]+(?:\s+[a-zA-Z]+){2,})\)\b/g,
  // Organizations and institutions
  organizations: /\b(?:at|by|from|with)\s+(?:the\s+)?((?:[A-Z][a-zA-Z']*\s*){2,}(?:University|Institute|Association|Organization|Foundation|Society|Committee|Agency|Commission|Department|College|School))\b/gi,
};

/**
 * Extract generic references from text using regular expressions
 */
function extractGenericReferences(
  text: string,
  patterns: PatternCollection,
  formatters?: Record<string, (match: RegExpMatchArray) => string>
): Record<string, string[]> {
  if (!text) return {};
  
  const results: Record<string, string[]> = {};
  
  Object.entries(patterns).forEach(([type, pattern]) => {
    const matches = new Set<string>();
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      if (formatters && formatters[type]) {
        matches.add(formatters[type](match));
      } else {
        // Default formatting based on the match
        if (match[1]) {
          matches.add(match[0]);
        }
      }
    }
    
    if (matches.size > 0) {
      results[type] = Array.from(matches);
    }
  });
  
  return results;
}

/**
 * Default formatters for reference types
 */
const defaultFormatters = {
  academic: {
    doi: (match: RegExpMatchArray) => `DOI: ${match[1]}`,
    isbn: (match: RegExpMatchArray) => `ISBN: ${match[1]}`,
    arxiv: (match: RegExpMatchArray) => `arXiv: ${match[1]}`,
  },
  business: {
    frameworks: (match: RegExpMatchArray) => `${match[1]} Framework`,
    books: (match: RegExpMatchArray) => {
      if (match[1] && match[2]) {
        return `"${match[1]}" by ${match[2]}`;
      } else if (match[3] && match[4]) {
        return `"${match[4]}" by ${match[3]}`;
      }
      return match[0];
    },
  },
  psychology: {
    dsm: (match: RegExpMatchArray) => `${match[1]} ${match[2]}`,
    therapy: (match: RegExpMatchArray) => `${match[1]} Therapy`,
  },
  general: {
    books: (match: RegExpMatchArray) => `"${match[1]}" by ${match[2]}`,
    organizations: (match: RegExpMatchArray) => match[1],
  }
};

/**
 * Extract academic references from text
 */
function extractAcademicReferences(
  text: string,
  config?: ReferenceExtractorConfig
): Record<string, string[]> {
  const patterns = { ...academicPatterns } as PatternCollection;
  const formatters = config?.formatters || defaultFormatters.academic;
  
  // Add any additional patterns from config
  if (config?.additionalPatterns) {
    config.additionalPatterns.forEach((pattern, idx) => {
      const key = `additional_${idx}`;
      patterns[key] = pattern;
    });
  }
  
  return extractGenericReferences(text, patterns, formatters);
}

/**
 * Extract business references from text
 */
function extractBusinessReferences(
  text: string,
  config?: ReferenceExtractorConfig
): Record<string, string[]> {
  const patterns = { ...businessPatterns } as PatternCollection;
  const formatters = config?.formatters || defaultFormatters.business;
  
  // Add any additional patterns from config
  if (config?.additionalPatterns) {
    config.additionalPatterns.forEach((pattern, idx) => {
      const key = `additional_${idx}`;
      patterns[key] = pattern;
    });
  }
  
  return extractGenericReferences(text, patterns, formatters);
}

/**
 * Extract psychology references from text
 */
function extractPsychologyReferences(
  text: string,
  config?: ReferenceExtractorConfig
): Record<string, string[]> {
  const patterns = { ...psychologyPatterns } as PatternCollection;
  const formatters = config?.formatters || defaultFormatters.psychology;
  
  // Add any additional patterns from config
  if (config?.additionalPatterns) {
    config.additionalPatterns.forEach((pattern, idx) => {
      const key = `additional_${idx}`;
      patterns[key] = pattern;
    });
  }
  
  return extractGenericReferences(text, patterns, formatters);
}

/**
 * Extract general references from text
 */
function extractGeneralReferences(
  text: string,
  config?: ReferenceExtractorConfig
): Record<string, string[]> {
  const patterns = { ...generalPatterns } as PatternCollection;
  const formatters = config?.formatters || defaultFormatters.general;
  
  // Add any additional patterns from config
  if (config?.additionalPatterns) {
    config.additionalPatterns.forEach((pattern, idx) => {
      const key = `additional_${idx}`;
      patterns[key] = pattern;
    });
  }
  
  return extractGenericReferences(text, patterns, formatters);
}

/**
 * Main function to extract references from text across multiple domains
 */
export function extractReferences(
  text: string,
  options: ReferenceExtractionOptions = {}
): ReferenceExtractionResult {
  if (!text) {
    return {
      allReferences: [],
      domainReferences: {},
      typeReferences: {},
      metadata: {
        domainsProcessed: [],
        totalReferencesFound: 0,
        processingTimeMs: 0
      }
    };
  }
  
  const startTime = Date.now();
  const domains = options.domains || Object.values(ReferenceDomain);
  const domainConfigs = options.domainConfigs || {};
  
  const domainReferences: Record<string, string[]> = {};
  const typeReferences: Record<string, string[]> = {};
  const allReferencesSet = new Set<string>();
  
  // Process each domain
  domains.forEach(domain => {
    const config = domainConfigs[domain] || { enabled: true };
    
    if (!config.enabled) return;
    
    let references: Record<string, string[]> = {};
    
    switch (domain) {
      case ReferenceDomain.LEGAL:
        const legalResult = extractLegalReferences(text);
        domainReferences[domain] = legalResult.allReferences;
        
        // Add each specific type to typeReferences
        Object.entries(legalResult).forEach(([key, value]) => {
          if (key !== 'allReferences') {
            typeReferences[key] = value;
          }
        });
        break;
        
      case ReferenceDomain.MEDICAL:
        const medicalResult = extractMedicalReferences(text);
        domainReferences[domain] = medicalResult.allReferences;
        
        // Add each specific type to typeReferences
        Object.entries(medicalResult).forEach(([key, value]) => {
          if (key !== 'allReferences') {
            typeReferences[key] = value;
          }
        });
        break;
        
      case ReferenceDomain.ACADEMIC:
        references = extractAcademicReferences(text, config);
        domainReferences[domain] = Object.values(references).flat();
        Object.entries(references).forEach(([key, value]) => {
          typeReferences[`academic_${key}`] = value;
        });
        break;
        
      case ReferenceDomain.BUSINESS:
        references = extractBusinessReferences(text, config);
        domainReferences[domain] = Object.values(references).flat();
        Object.entries(references).forEach(([key, value]) => {
          typeReferences[`business_${key}`] = value;
        });
        break;
        
      case ReferenceDomain.PSYCHOLOGY:
        references = extractPsychologyReferences(text, config);
        domainReferences[domain] = Object.values(references).flat();
        Object.entries(references).forEach(([key, value]) => {
          typeReferences[`psychology_${key}`] = value;
        });
        break;
        
      case ReferenceDomain.GENERAL:
        references = extractGeneralReferences(text, config);
        domainReferences[domain] = Object.values(references).flat();
        Object.entries(references).forEach(([key, value]) => {
          typeReferences[`general_${key}`] = value;
        });
        break;
    }
    
    // Add domain references to the overall set
    if (domainReferences[domain]) {
      domainReferences[domain].forEach(ref => allReferencesSet.add(ref));
    }
  });
  
  // Convert to array
  let allReferences = Array.from(allReferencesSet);
  
  // Sort references for consistent ordering
  allReferences.sort();
  
  // Calculate metadata
  const processingTimeMs = Date.now() - startTime;
  const domainsProcessed = Object.keys(domainReferences);
  const totalReferencesFound = allReferences.length;
  
  return {
    allReferences,
    domainReferences,
    typeReferences,
    metadata: {
      domainsProcessed,
      totalReferencesFound,
      processingTimeMs
    }
  };
}

/**
 * Helper method to extract references with a specific domain focus
 */
export function extractDomainSpecificReferences(
  text: string,
  domain: ReferenceDomain,
  config?: ReferenceExtractorConfig
): string[] {
  const options: ReferenceExtractionOptions = {
    domains: [domain],
    domainConfigs: config ? { [domain]: config } : undefined
  };
  
  const result = extractReferences(text, options);
  return result.allReferences;
}

/**
 * Get a list of all supported reference domains
 */
export function getSupportedDomains(): string[] {
  return Object.values(ReferenceDomain);
}

/**
 * Get a list of supported reference types for a specific domain
 */
export function getSupportedReferenceTypes(domain: ReferenceDomain): string[] {
  switch (domain) {
    case ReferenceDomain.LEGAL:
      return ['laborCodes', 'ccrCitations', 'caseCitations', 'civilCodeCitations', 'ccpCitations', 'evidenceCodeCitations'];
    case ReferenceDomain.MEDICAL:
      return ['icd10Codes', 'cptCodes', 'medications', 'journalCitations', 'hcpcsCodes'];
    case ReferenceDomain.ACADEMIC:
      return Object.keys(academicPatterns);
    case ReferenceDomain.BUSINESS:
      return Object.keys(businessPatterns);
    case ReferenceDomain.PSYCHOLOGY:
      return Object.keys(psychologyPatterns);
    case ReferenceDomain.GENERAL:
      return Object.keys(generalPatterns);
    default:
      return [];
  }
}

/**
 * Extract business coaching references from text
 * Useful for business coach assistants
 */
export function extractBusinessCoachingReferences(text: string): ReferenceExtractionResult {
  return extractReferences(text, {
    domains: [ReferenceDomain.BUSINESS, ReferenceDomain.GENERAL, ReferenceDomain.ACADEMIC],
    domainConfigs: {
      [ReferenceDomain.BUSINESS]: {
        enabled: true,
        includePatterns: ['frameworks', 'books', 'theories', 'coaching', 'leaders']
      },
      [ReferenceDomain.ACADEMIC]: { enabled: true },
      [ReferenceDomain.GENERAL]: { enabled: true },
      [ReferenceDomain.LEGAL]: { enabled: false },
      [ReferenceDomain.MEDICAL]: { enabled: false },
      [ReferenceDomain.PSYCHOLOGY]: { enabled: false }
    }
  });
}

/**
 * Extract therapy and life coaching references from text
 * Useful for therapist and life coach assistants
 */
export function extractTherapyReferences(text: string): ReferenceExtractionResult {
  return extractReferences(text, {
    domains: [ReferenceDomain.PSYCHOLOGY, ReferenceDomain.GENERAL, ReferenceDomain.ACADEMIC],
    domainConfigs: {
      [ReferenceDomain.PSYCHOLOGY]: {
        enabled: true,
        includePatterns: ['dsm', 'therapy', 'assessments', 'coaching', 'theorists']
      },
      [ReferenceDomain.ACADEMIC]: { enabled: true },
      [ReferenceDomain.GENERAL]: { enabled: true },
      [ReferenceDomain.LEGAL]: { enabled: false },
      [ReferenceDomain.MEDICAL]: { enabled: false },
      [ReferenceDomain.BUSINESS]: { enabled: false }
    }
  });
}
