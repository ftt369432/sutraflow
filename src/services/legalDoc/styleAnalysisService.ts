import { supabase } from '../../lib/supabase';
import { WritingStyle } from './legalDocumentService';

export interface StyleCharacteristics {
  // Sentence structure
  averageSentenceLength: number;
  sentenceLengthVariation: number;
  complexSentenceRatio: number;
  
  // Vocabulary
  vocabularyDiversity: number;
  formalityScore: number;
  technicalTermFrequency: number;
  
  // Patterns
  passiveVoiceFrequency: number;
  firstPersonFrequency: number;
  thirdPersonFrequency: number;
  
  // Legal specific
  citationFrequency: number;
  legalPhraseFrequency: number;
  argumentStructure: {
    usesIRACMethod: boolean; // Issue, Rule, Analysis, Conclusion
    usesPARCMethod: boolean; // Problem, Analysis, Rule, Conclusion
  };
  
  // Additional metadata
  topWords: string[];
  topPhrases: string[];
  transitionPhrases: string[];
}

export interface StyleAnalysisOptions {
  minTextLength?: number;
  includeTopPhrases?: boolean;
  maxTopItems?: number;
}

export class StyleAnalysisService {
  private supabase;
  
  // Common legal phrases for analysis
  private static LEGAL_PHRASES = [
    "pursuant to", "in accordance with", "hereinafter", "aforementioned",
    "inter alia", "prima facie", "de facto", "de jure", "amicus curiae",
    "res judicata", "stare decisis", "sua sponte", "pro se", "ab initio",
    "as a matter of law", "beyond a reasonable doubt", "preponderance of the evidence",
    "clear and convincing evidence", "statute of limitations"
  ];
  
  // Common transition words
  private static TRANSITION_PHRASES = [
    "furthermore", "moreover", "however", "nevertheless", "consequently",
    "therefore", "thus", "accordingly", "in addition", "in contrast",
    "conversely", "similarly", "specifically", "for example", "in conclusion"
  ];
  
  constructor() {
    this.supabase = supabase;
  }
  
  /**
   * Analyzes text to determine writing style characteristics
   */
  async analyzeStyle(text: string, options: StyleAnalysisOptions = {}): Promise<StyleCharacteristics> {
    // Set default options
    const {
      minTextLength = 100,
      includeTopPhrases = true,
      maxTopItems = 10
    } = options;
    
    // Ensure text is long enough for meaningful analysis
    if (text.length < minTextLength) {
      throw new Error(`Text is too short for style analysis (${text.length} chars). Minimum is ${minTextLength} chars.`);
    }
    
    // Basic text cleanup
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
    
    // Split into sentences and words
    const sentences = this.splitIntoSentences(cleanText);
    const words = cleanText.split(/\s+/);
    
    // Calculate metrics
    const characteristics: StyleCharacteristics = {
      // Sentence metrics
      averageSentenceLength: this.calculateAverageSentenceLength(sentences),
      sentenceLengthVariation: this.calculateSentenceLengthVariation(sentences),
      complexSentenceRatio: this.calculateComplexSentenceRatio(sentences),
      
      // Vocabulary metrics
      vocabularyDiversity: this.calculateVocabularyDiversity(words),
      formalityScore: this.calculateFormalityScore(words, sentences),
      technicalTermFrequency: this.calculateTechnicalTermFrequency(words, sentences),
      
      // Pattern metrics
      passiveVoiceFrequency: this.calculatePassiveVoiceFrequency(sentences),
      firstPersonFrequency: this.calculatePersonFrequency(words, sentences, 1),
      thirdPersonFrequency: this.calculatePersonFrequency(words, sentences, 3),
      
      // Legal metrics
      citationFrequency: this.calculateCitationFrequency(text, sentences),
      legalPhraseFrequency: this.calculatePhraseFrequency(
        sentences,
        StyleAnalysisService.LEGAL_PHRASES
      ),
      argumentStructure: this.detectArgumentStructure(text),
      
      // Additional data
      topWords: this.getTopWords(words, maxTopItems),
      topPhrases: includeTopPhrases ? this.getTopPhrases(text, maxTopItems) : [],
      transitionPhrases: this.getMatchingPhrases(
        sentences,
        StyleAnalysisService.TRANSITION_PHRASES
      ),
    };
    
    return characteristics;
  }
  
  /**
   * Saves a writing style profile for a user
   */
  async saveStyleProfile(userId: string, name: string, sampleText: string): Promise<WritingStyle> {
    try {
      // Analyze the sample text
      const characteristics = await this.analyzeStyle(sampleText);
      
      // Create the style profile
      const styleProfile: WritingStyle = {
        user_id: userId,
        name,
        characteristics,
        sample_text: sampleText
      };
      
      // Save to database
      const { data, error } = await this.supabase
        .from('writing_styles')
        .insert(styleProfile)
        .select();
      
      if (error) throw new Error(error.message);
      return data[0];
    } catch (error) {
      console.error('Error saving style profile:', error);
      throw error;
    }
  }
  
  /**
   * Generates writing style guidelines for an AI to mimic a user's style
   */
  async generateStyleGuidelines(styleId: string): Promise<string> {
    try {
      // Get the style profile
      const { data: styleProfile, error } = await this.supabase
        .from('writing_styles')
        .select('*')
        .eq('id', styleId)
        .single();
      
      if (error) throw new Error(error.message);
      
      // Generate style guidance for AI prompt
      const characteristics = styleProfile.characteristics as StyleCharacteristics;
      
      let guidelines = `Please write in the following style:
      
1. Sentence Structure:
   - Aim for an average sentence length of ${Math.round(characteristics.averageSentenceLength)} words.
   - Use ${characteristics.complexSentenceRatio > 0.5 ? 'many' : 'few'} complex sentences with dependent clauses.
   - Vary sentence length ${characteristics.sentenceLengthVariation > 5 ? 'significantly' : 'slightly'}.

2. Vocabulary:
   - Use ${characteristics.formalityScore > 0.7 ? 'highly formal' : characteristics.formalityScore > 0.4 ? 'moderately formal' : 'casual'} language.
   - Include ${characteristics.technicalTermFrequency > 0.05 ? 'frequent' : 'occasional'} legal terminology.
   - Preferred terms: ${characteristics.topWords.join(', ')}.

3. Voice and Perspective:
   - Use ${characteristics.passiveVoiceFrequency > 0.3 ? 'passive voice often' : 'active voice primarily'}.
   - Write in ${characteristics.firstPersonFrequency > 0.1 ? 'first person' : characteristics.thirdPersonFrequency > 0.2 ? 'third person' : 'a balanced mix of perspectives'}.

4. Legal Style:
   - ${characteristics.citationFrequency > 0.01 ? 'Include frequent citations' : 'Use minimal citations'}.
   - ${characteristics.legalPhraseFrequency > 0.02 ? 'Use traditional legal phrases regularly' : 'Use plain language over legal jargon'}.
   - Structure arguments using ${characteristics.argumentStructure.usesIRACMethod ? 'IRAC method (Issue, Rule, Analysis, Conclusion)' : characteristics.argumentStructure.usesPARCMethod ? 'PARC method (Problem, Analysis, Rule, Conclusion)' : 'a flexible structure'}.

5. Transitions:
   - Preferred transition phrases: ${characteristics.transitionPhrases.length > 0 ? characteristics.transitionPhrases.join(', ') : 'varied transitions without specific patterns'}.
`;
      
      // Add sample text if available
      if (styleProfile.sample_text) {
        guidelines += `
6. Sample of Writing Style:
   "${styleProfile.sample_text.substring(0, 300)}${styleProfile.sample_text.length > 300 ? '...' : ''}"
`;
      }
      
      return guidelines;
    } catch (error) {
      console.error('Error generating style guidelines:', error);
      throw error;
    }
  }
  
  /**
   * Generates prompt for AI to mimic a writing style with specific content
   */
  async generateStyleMimicPrompt(styleId: string, contentRequest: string): Promise<string> {
    const styleGuidelines = await this.generateStyleGuidelines(styleId);
    
    return `
${styleGuidelines}

Content Request:
${contentRequest}

Please write a response that follows the style guidelines above while addressing the content request.
`;
  }
  
  /**
   * Retrieves writing styles for a user
   */
  async getWritingStyles(userId: string): Promise<WritingStyle[]> {
    try {
      const { data, error } = await this.supabase
        .from('writing_styles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw new Error(error.message);
      
      return data || [];
    } catch (error) {
      console.error('Error fetching writing styles:', error);
      return [];
    }
  }
  
  // ---- Helper Methods ----
  
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - can be improved
    return text
      .replace(/([.?!])\s+/g, '$1|')
      .split('|')
      .filter(s => s.trim().length > 0);
  }
  
  private calculateAverageSentenceLength(sentences: string[]): number {
    if (sentences.length === 0) return 0;
    
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).length;
    }, 0);
    
    return totalWords / sentences.length;
  }
  
  private calculateSentenceLengthVariation(sentences: string[]): number {
    if (sentences.length < 2) return 0;
    
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentences.length;
    
    // Calculate standard deviation
    const sumSquaredDiffs = sentenceLengths.reduce((sum, len) => {
      const diff = len - avgLength;
      return sum + (diff * diff);
    }, 0);
    
    return Math.sqrt(sumSquaredDiffs / sentences.length);
  }
  
  private calculateComplexSentenceRatio(sentences: string[]): number {
    if (sentences.length === 0) return 0;
    
    // Count sentences with dependent clauses (containing specific markers)
    const complexSentenceMarkers = [
      'which', 'that', 'because', 'although', 'though', 'while', 'whereas',
      'when', 'if', 'unless', 'until', 'since', 'as', 'after', 'before'
    ];
    
    const complexSentenceCount = sentences.filter(sentence => {
      return complexSentenceMarkers.some(marker => 
        new RegExp(`\\b${marker}\\b`, 'i').test(sentence)
      );
    }).length;
    
    return complexSentenceCount / sentences.length;
  }
  
  private calculateVocabularyDiversity(words: string[]): number {
    if (words.length === 0) return 0;
    
    // Type-Token Ratio (unique words / total words)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    return uniqueWords.size / words.length;
  }
  
  private calculateFormalityScore(words: string[], _sentences: string[]): number {
    // Simple formality score based on various markers
    
    const wordCount = words.length;
    if (wordCount === 0) return 0;
    
    // Indicators of formality
    const formalMarkers = [
      'pursuant', 'accordingly', 'therefore', 'thus', 'consequently',
      'furthermore', 'moreover', 'nevertheless', 'notwithstanding',
      'subsequently', 'regarding', 'concerning', 'additionally'
    ];
    
    // Indicators of informality
    const informalMarkers = [
      'really', 'very', 'so', 'pretty', 'kind of', 'sort of', 'just',
      'basically', 'actually', 'literally', 'like', 'stuff', 'things'
    ];
    
    // Count occurrences
    let formalCount = 0;
    let informalCount = 0;
    
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (formalMarkers.includes(lowerWord)) formalCount++;
      if (informalMarkers.includes(lowerWord)) informalCount++;
    });
    
    // Check for contractions (informal)
    const contractionCount = words.filter(w => /'\w+/.test(w)).length;
    
    // Calculate ratio of long words (formal)
    const longWordCount = words.filter(w => w.length > 7).length;
    const longWordRatio = longWordCount / wordCount;
    
    // Average word length (formal)
    const totalLetters = words.reduce((sum, word) => sum + word.length, 0);
    const avgWordLength = totalLetters / wordCount;
    
    // Calculate score (0 = informal, 1 = formal)
    const score = (
      (formalCount * 0.1) +
      (longWordRatio * 0.3) +
      (Math.min(avgWordLength / 8, 1) * 0.4) -
      (informalCount * 0.15) -
      (contractionCount / wordCount * 0.2)
    );
    
    return Math.max(0, Math.min(1, score + 0.5)); // Normalize to 0-1
  }
  
  private calculateTechnicalTermFrequency(words: string[], _sentences: string[]): number {
    if (words.length === 0) return 0;
    
    // Common legal technical terms
    const legalTerms = [
      'plaintiff', 'defendant', 'petitioner', 'respondent', 'appellant', 'appellee',
      'jurisdiction', 'statute', 'legislation', 'precedent', 'adjudicate',
      'jurisprudence', 'tort', 'breach', 'contract', 'remedy', 'damages',
      'injunction', 'liable', 'negligence', 'malpractice', 'felony', 'misdemeanor',
      'affidavit', 'deposition', 'testimony', 'evidence', 'hearsay', 'admissible',
      'pleading', 'motion', 'brief', 'judgment', 'verdict', 'settlement',
      'discovery', 'interrogatory', 'subpoena', 'warrant', 'indictment', 'acquittal'
    ];
    
    // Count occurrences
    let technicalTermCount = 0;
    
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (legalTerms.includes(lowerWord)) technicalTermCount++;
    });
    
    return technicalTermCount / words.length;
  }
  
  private calculatePassiveVoiceFrequency(sentences: string[]): number {
    if (sentences.length === 0) return 0;
    
    // Check for common passive voice patterns
    const passivePatterns = [
      /\b(?:is|are|was|were|be|been|being)\s+(\w+ed\b|written|made|done|said|known|given|found|seen|taken)/i,
      /\b(?:has|have|had)\s+been\s+(\w+ed\b|written|made|done|said|known|given|found|seen|taken)/i
    ];
    
    const passiveCount = sentences.filter(sentence => {
      return passivePatterns.some(pattern => pattern.test(sentence));
    }).length;
    
    return passiveCount / sentences.length;
  }
  
  private calculatePersonFrequency(words: string[], sentences: string[], person: number): number {
    if (sentences.length === 0) return 0;
    
    // Define pronouns by person
    const pronouns: Record<number, string[]> = {
      1: ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves'],
      2: ['you', 'your', 'yours', 'yourself', 'yourselves'],
      3: ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves']
    };
    
    const selectedPronouns = pronouns[person] || [];
    const pronounCount = words.filter(word => 
      selectedPronouns.includes(word.toLowerCase())
    ).length;
    
    return pronounCount / words.length;
  }
  
  private calculateCitationFrequency(text: string, sentences: string[]): number {
    if (sentences.length === 0) return 0;
    
    // Count potential legal citations
    // This is a simplified regex and could be improved
    const citationPatterns = [
      /\d+\s+U\.S\.\s+\d+/g, // Supreme Court
      /\d+\s+F\.\s*\d+d\s+\d+/g, // Federal Reporter
      /\d+\s+[A-Z][a-z]+\.\s+\d+/g, // State Reports
      /\b[A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+\b/g // Case names
    ];
    
    let citationCount = 0;
    citationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) citationCount += matches.length;
    });
    
    return citationCount / sentences.length;
  }
  
  private calculatePhraseFrequency(sentences: string[], phrases: string[]): number {
    if (sentences.length === 0 || phrases.length === 0) return 0;
    
    let phraseCount = 0;
    const lowerSentences = sentences.map(s => s.toLowerCase());
    
    phrases.forEach(phrase => {
      const lowerPhrase = phrase.toLowerCase();
      lowerSentences.forEach(sentence => {
        if (sentence.includes(lowerPhrase)) phraseCount++;
      });
    });
    
    return phraseCount / sentences.length;
  }
  
  private detectArgumentStructure(text: string): { usesIRACMethod: boolean, usesPARCMethod: boolean } {
    // IRAC = Issue, Rule, Analysis, Conclusion
    const iracPattern = new RegExp('issue.*?rule.*?analysis.*?conclusion', 'i');
    const iracSectionPattern = /\b(?:issue|rule|analysis|conclusion)(?:\s*:|\.|\))\s+/ig;
    
    // PARC = Problem, Analysis, Rule, Conclusion
    const parcPattern = new RegExp('problem.*?analysis.*?rule.*?conclusion', 'i');
    const parcSectionPattern = /\b(?:problem|analysis|rule|conclusion)(?:\s*:|\.|\))\s+/ig;
    
    // Check for the patterns
    const hasIracFlow = iracPattern.test(text);
    const hasIracSections = (text.match(iracSectionPattern) || []).length >= 3;
    
    const hasParcFlow = parcPattern.test(text);
    const hasParcSections = (text.match(parcSectionPattern) || []).length >= 3;
    
    return {
      usesIRACMethod: hasIracFlow || hasIracSections,
      usesPARCMethod: hasParcFlow || hasParcSections
    };
  }
  
  private getTopWords(words: string[], max: number): string[] {
    // Common words to exclude (stopwords)
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'to', 'of', 'in', 'for', 'with', 'on', 'at', 'by', 'from', 'as',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
    ]);
    
    // Count word frequencies
    const wordCounts: Record<string, number> = {};
    
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[.,;:?!)(]/g, '');
      if (cleanWord.length < 3 || stopwords.has(cleanWord)) return;
      
      wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
    });
    
    // Sort by frequency and return top words
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([word]) => word);
  }
  
  private getTopPhrases(text: string, max: number): string[] {
    // This is a simplified n-gram implementation
    // Extract 2-3 word phrases
    const phrases: Record<string, number> = {};
    
    // Common words to exclude from the start of phrases
    const excludeStart = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'by', 'to']);
    
    // Clean text and split into words
    const words = text
      .toLowerCase()
      .replace(/[.,;:?!)(]/g, '')
      .split(/\s+/);
    
    // Generate phrases
    for (let i = 0; i < words.length - 1; i++) {
      if (excludeStart.has(words[i])) continue;
      
      // 2-word phrases
      const phrase2 = `${words[i]} ${words[i+1]}`;
      phrases[phrase2] = (phrases[phrase2] || 0) + 1;
      
      // 3-word phrases
      if (i < words.length - 2) {
        const phrase3 = `${words[i]} ${words[i+1]} ${words[i+2]}`;
        phrases[phrase3] = (phrases[phrase3] || 0) + 1;
      }
    }
    
    // Sort by frequency and return top phrases
    return Object.entries(phrases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([phrase]) => phrase);
  }
  
  private getMatchingPhrases(sentences: string[], phraseList: string[]): string[] {
    // Find which phrases from the list appear in the text
    const foundPhrases = new Set<string>();
    
    const lowerSentences = sentences.map(s => s.toLowerCase());
    
    phraseList.forEach(phrase => {
      const lowerPhrase = phrase.toLowerCase();
      lowerSentences.forEach(sentence => {
        if (sentence.includes(lowerPhrase)) {
          foundPhrases.add(phrase);
        }
      });
    });
    
    return Array.from(foundPhrases);
  }
} 