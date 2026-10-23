/**
 * Universal File Operations Capability
 * Handles file upload, processing, analysis, and management
 * Works with ANY file type for ANY profession
 */

import { AICapability, CapabilityResult } from './types';

export interface FileOperationIntent {
  isFileOperation: boolean;
  operation: 'upload' | 'analyze' | 'process' | 'convert' | 'extract' | 'summarize';
  fileType?: 'pdf' | 'doc' | 'image' | 'audio' | 'video' | 'text' | 'spreadsheet';
  confidence: number;
}

export interface FileOperationRequest {
  operation: string;
  files?: File[];
  fileUrls?: string[];
  analysisType?: 'content' | 'structure' | 'metadata' | 'summary' | 'keywords';
  outputFormat?: 'text' | 'json' | 'markdown' | 'html';
  profession?: string;
}

export interface FileOperationResult extends CapabilityResult {
  processedFiles?: Array<{
    filename: string;
    fileType: string;
    size: number;
    content?: string;
    analysis?: any;
    extractedData?: any;
    summary?: string;
  }>;
  totalFiles?: number;
  suggestions?: string[];
}

/**
 * Universal File Operations Capability
 * Handles all file-related operations for any profession
 */
export class FileOperationCapability implements AICapability {
  name = 'file-operations';
  description = 'Universal file upload, analysis, and processing for all file types';
  version = '1.0.0';

  /**
   * Detect if user wants to perform file operations
   */
  async detectIntent(input: string): Promise<FileOperationIntent> {
    const lower = input.toLowerCase();
    
    // File operation triggers
    const fileKeywords = [
      'upload file', 'analyze file', 'process file', 'read file', 'parse file',
      'extract from', 'summarize file', 'convert file', 'file analysis',
      'drag and drop', 'upload document', 'process document'
    ];
    
    // Operation detection
    const operationKeywords = {
      'upload': ['upload', 'add file', 'attach', 'drop file'],
      'analyze': ['analyze', 'examine', 'review', 'study'],
      'process': ['process', 'handle', 'work with'],
      'convert': ['convert', 'transform', 'change format'],
      'extract': ['extract', 'pull out', 'get text', 'get data'],
      'summarize': ['summarize', 'summary', 'brief', 'overview']
    };
    
    // File type detection
    const fileTypeKeywords = {
      'pdf': ['pdf', 'portable document'],
      'doc': ['doc', 'docx', 'word document'],
      'image': ['image', 'jpg', 'png', 'jpeg', 'gif', 'photo'],
      'audio': ['audio', 'mp3', 'wav', 'sound', 'recording'],
      'video': ['video', 'mp4', 'avi', 'movie', 'recording'],
      'text': ['text file', 'txt', 'plain text'],
      'spreadsheet': ['excel', 'csv', 'spreadsheet', 'xls', 'xlsx']
    };
    
    const hasFileIntent = fileKeywords.some(keyword => lower.includes(keyword));
    
    if (!hasFileIntent) {
      return {
        isFileOperation: false,
        operation: 'upload',
        confidence: 0
      };
    }
    
    // Detect operation
    let detectedOperation: FileOperationIntent['operation'] = 'upload';
    for (const [operation, keywords] of Object.entries(operationKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        detectedOperation = operation as FileOperationIntent['operation'];
        break;
      }
    }
    
    // Detect file type
    let detectedFileType: FileOperationIntent['fileType'] | undefined;
    for (const [fileType, keywords] of Object.entries(fileTypeKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        detectedFileType = fileType as FileOperationIntent['fileType'];
        break;
      }
    }
    
    return {
      isFileOperation: true,
      operation: detectedOperation,
      fileType: detectedFileType,
      confidence: 0.8
    };
  }

  /**
   * Process file operation request
   */
  async process(request: FileOperationRequest): Promise<FileOperationResult> {
    try {
      console.log(`📁 Processing file operation: ${request.operation}`);
      
      switch (request.operation) {
        case 'upload':
          return await this.handleFileUpload(request);
        case 'analyze':
          return await this.analyzeFiles(request);
        case 'extract':
          return await this.extractFileContent(request);
        case 'summarize':
          return await this.summarizeFiles(request);
        case 'convert':
          return await this.convertFiles(request);
        default:
          return await this.processFiles(request);
      }
    } catch (error) {
      return {
        success: false,
        message: `File operation failed: ${error.message}`
      };
    }
  }

  /**
   * Handle file upload
   */
  private async handleFileUpload(request: FileOperationRequest): Promise<FileOperationResult> {
    const files = request.files || [];
    const processedFiles = [];
    
    for (const file of files) {
      try {
        const fileInfo = {
          filename: file.name,
          fileType: this.getFileType(file.name),
          size: file.size,
          content: await this.readFileContent(file),
          analysis: await this.performBasicAnalysis(file, request.profession)
        };
        
        processedFiles.push(fileInfo);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    return {
      success: true,
      processedFiles,
      totalFiles: files.length,
      suggestions: this.getUploadSuggestions(request.profession),
      message: `Successfully uploaded ${processedFiles.length} files`
    };
  }

  /**
   * Analyze files
   */
  private async analyzeFiles(request: FileOperationRequest): Promise<FileOperationResult> {
    const files = request.files || [];
    const processedFiles = [];
    
    for (const file of files) {
      const analysis = await this.performDetailedAnalysis(file, request);
      
      processedFiles.push({
        filename: file.name,
        fileType: this.getFileType(file.name),
        size: file.size,
        analysis,
        summary: analysis.summary
      });
    }
    
    return {
      success: true,
      processedFiles,
      totalFiles: files.length,
      suggestions: this.getAnalysisSuggestions(request.profession),
      message: 'File analysis completed'
    };
  }

  /**
   * Extract content from files
   */
  private async extractFileContent(request: FileOperationRequest): Promise<FileOperationResult> {
    const files = request.files || [];
    const processedFiles = [];
    
    for (const file of files) {
      const content = await this.readFileContent(file);
      const extractedData = await this.extractStructuredData(content, request.profession);
      
      processedFiles.push({
        filename: file.name,
        fileType: this.getFileType(file.name),
        size: file.size,
        content,
        extractedData
      });
    }
    
    return {
      success: true,
      processedFiles,
      totalFiles: files.length,
      suggestions: this.getExtractionSuggestions(request.profession),
      message: 'Content extraction completed'
    };
  }

  /**
   * Summarize files
   */
  private async summarizeFiles(request: FileOperationRequest): Promise<FileOperationResult> {
    const files = request.files || [];
    const processedFiles = [];
    
    for (const file of files) {
      const content = await this.readFileContent(file);
      const summary = await this.generateSummary(content, request.profession);
      
      processedFiles.push({
        filename: file.name,
        fileType: this.getFileType(file.name),
        size: file.size,
        summary
      });
    }
    
    return {
      success: true,
      processedFiles,
      totalFiles: files.length,
      suggestions: this.getSummarySuggestions(request.profession),
      message: 'File summarization completed'
    };
  }

  /**
   * Convert files to different formats
   */
  private async convertFiles(request: FileOperationRequest): Promise<FileOperationResult> {
    const files = request.files || [];
    const processedFiles = [];
    
    for (const file of files) {
      const convertedContent = await this.convertFileFormat(file, request.outputFormat || 'text');
      
      processedFiles.push({
        filename: file.name,
        fileType: this.getFileType(file.name),
        size: file.size,
        content: convertedContent
      });
    }
    
    return {
      success: true,
      processedFiles,
      totalFiles: files.length,
      suggestions: ['Download converted files', 'Try different output formats'],
      message: 'File conversion completed'
    };
  }

  /**
   * General file processing
   */
  private async processFiles(request: FileOperationRequest): Promise<FileOperationResult> {
    return await this.handleFileUpload(request);
  }

  /**
   * Read file content based on file type
   */
  private async readFileContent(file: File): Promise<string> {
    const fileType = this.getFileType(file.name);
    
    switch (fileType) {
      case 'text':
        return await file.text();
      case 'pdf':
        return await this.extractPDFText(file);
      case 'doc':
        return await this.extractDocText(file);
      case 'image':
        return await this.extractImageText(file);
      default:
        return await file.text();
    }
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    const typeMap: Record<string, string> = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'doc',
      'txt': 'text',
      'md': 'text',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp3': 'audio',
      'wav': 'audio',
      'mp4': 'video',
      'avi': 'video',
      'xls': 'spreadsheet',
      'xlsx': 'spreadsheet',
      'csv': 'spreadsheet'
    };
    
    return typeMap[extension || ''] || 'unknown';
  }

  /**
   * Extract text from PDF
   */
  private async extractPDFText(file: File): Promise<string> {
    // Implementation would use PDF.js or similar library
    return `PDF content extraction for ${file.name} (placeholder implementation)`;
  }

  /**
   * Extract text from Word documents
   */
  private async extractDocText(file: File): Promise<string> {
    // Implementation would use mammoth.js or similar library
    return `Word document content extraction for ${file.name} (placeholder implementation)`;
  }

  /**
   * Extract text from images using OCR
   */
  private async extractImageText(file: File): Promise<string> {
    // Implementation would use Tesseract.js or similar OCR library
    return `OCR text extraction for ${file.name} (placeholder implementation)`;
  }

  /**
   * Perform basic file analysis
   */
  private async performBasicAnalysis(file: File, profession?: string): Promise<any> {
    return {
      fileSize: file.size,
      fileType: this.getFileType(file.name),
      lastModified: new Date(file.lastModified),
      profession: profession || 'general',
      readableSize: this.formatFileSize(file.size)
    };
  }

  /**
   * Perform detailed file analysis
   */
  private async performDetailedAnalysis(file: File, request: FileOperationRequest): Promise<any> {
    const content = await this.readFileContent(file);
    
    return {
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      summary: content.substring(0, 200) + '...',
      keywords: this.extractKeywords(content),
      sentiment: 'neutral', // Would use sentiment analysis
      complexity: this.analyzeComplexity(content),
      profession: request.profession || 'general'
    };
  }

  /**
   * Extract structured data based on profession
   */
  private async extractStructuredData(content: string, profession?: string): Promise<any> {
    // Profession-specific data extraction
    const extractors = {
      'legal': () => this.extractLegalData(content),
      'medical': () => this.extractMedicalData(content),
      'business': () => this.extractBusinessData(content),
      'financial': () => this.extractFinancialData(content)
    };
    
    const extractor = extractors[profession as keyof typeof extractors];
    return extractor ? extractor() : this.extractGenericData(content);
  }

  /**
   * Generate profession-aware summary
   */
  private async generateSummary(content: string, profession?: string): Promise<string> {
    // Simple summarization - in production would use AI summarization
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ') + '.';
    
    return `${profession || 'General'} document summary: ${summary}`;
  }

  /**
   * Convert file to different format
   */
  private async convertFileFormat(file: File, outputFormat: string): Promise<string> {
    const content = await this.readFileContent(file);
    
    switch (outputFormat) {
      case 'markdown':
        return this.convertToMarkdown(content);
      case 'html':
        return this.convertToHTML(content);
      case 'json':
        return JSON.stringify({ content, metadata: { filename: file.name } }, null, 2);
      default:
        return content;
    }
  }

  // Helper methods for data extraction
  private extractLegalData(content: string): any {
    return {
      caseNumbers: content.match(/Case No[.:]?\s*([A-Z0-9-]+)/gi) || [],
      dates: content.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [],
      parties: content.match(/([A-Z][a-z]+ [A-Z][a-z]+) v[s]?[.]? ([A-Z][a-z]+ [A-Z][a-z]+)/g) || []
    };
  }

  private extractMedicalData(content: string): any {
    return {
      patientIds: content.match(/Patient ID[:]?\s*([A-Z0-9-]+)/gi) || [],
      diagnoses: content.match(/Diagnosis[:]?\s*([^.]+)/gi) || [],
      medications: content.match(/Medication[:]?\s*([^.]+)/gi) || []
    };
  }

  private extractBusinessData(content: string): any {
    return {
      companyNames: content.match(/[A-Z][a-z]+ (?:Inc|LLC|Corp|Company)/g) || [],
      amounts: content.match(/\$[\d,]+(?:\.\d{2})?/g) || [],
      dates: content.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || []
    };
  }

  private extractFinancialData(content: string): any {
    return {
      amounts: content.match(/\$[\d,]+(?:\.\d{2})?/g) || [],
      accounts: content.match(/Account[:]?\s*([A-Z0-9-]+)/gi) || [],
      transactions: content.match(/Transaction[:]?\s*([^.]+)/gi) || []
    };
  }

  private extractGenericData(content: string): any {
    return {
      emails: content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
      phones: content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [],
      urls: content.match(/https?:\/\/[^\s]+/g) || []
    };
  }

  // Helper methods
  private extractKeywords(content: string): string[] {
    return content
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 10);
  }

  private analyzeComplexity(content: string): 'simple' | 'medium' | 'complex' {
    const avgWordsPerSentence = content.split(/[.!?]+/).reduce((acc, sentence) => {
      return acc + sentence.split(/\s+/).length;
    }, 0) / content.split(/[.!?]+/).length;
    
    if (avgWordsPerSentence < 10) return 'simple';
    if (avgWordsPerSentence < 20) return 'medium';
    return 'complex';
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private convertToMarkdown(content: string): string {
    return `# Document Content\n\n${content}`;
  }

  private convertToHTML(content: string): string {
    return `<html><body><h1>Document Content</h1><p>${content.replace(/\n/g, '<br>')}</p></body></html>`;
  }

  // Suggestion methods
  private getUploadSuggestions(profession?: string): string[] {
    const base = ['Analyze uploaded files', 'Extract key information', 'Generate summaries'];
    
    if (profession === 'legal') {
      base.push('Extract case information', 'Find legal precedents');
    } else if (profession === 'medical') {
      base.push('Extract patient data', 'Analyze medical terminology');
    }
    
    return base;
  }

  private getAnalysisSuggestions(profession?: string): string[] {
    return [
      'Export analysis results',
      'Generate detailed report',
      'Compare with other files',
      'Extract specific data points'
    ];
  }

  private getExtractionSuggestions(profession?: string): string[] {
    return [
      'Export extracted data as JSON',
      'Create structured document',
      'Generate data summary',
      'Validate extracted information'
    ];
  }

  private getSummarySuggestions(profession?: string): string[] {
    return [
      'Generate detailed summary',
      'Create executive summary',
      'Extract key points',
      'Compare summaries across files'
    ];
  }
}
