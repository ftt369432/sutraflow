/**
 * Universal Export Capability
 * Handles exporting content to various formats (PDF, DOC, MD, etc.)
 * Works with ANY content from ANY profession or AI system
 */

import { AICapability, CapabilityResult } from './types';

export interface ExportIntent {
  isExport: boolean;
  format: 'pdf' | 'doc' | 'docx' | 'md' | 'txt' | 'html' | 'rtf';
  confidence: number;
  filename?: string;
}

export interface ExportRequest {
  content: string;
  format: 'pdf' | 'doc' | 'docx' | 'md' | 'txt' | 'html' | 'rtf';
  filename?: string;
  title?: string;
  author?: string;
  metadata?: {
    profession?: string;
    documentType?: string;
    createdBy?: string;
    organization?: string;
  };
}

export interface ExportResult extends CapabilityResult {
  downloadUrl?: string;
  filename?: string;
  format?: string;
  fileSize?: number;
  blob?: Blob;
}

/**
 * Universal Export Capability
 * Can export ANY content to multiple formats
 */
export class ExportCapability implements AICapability {
  name = 'export';
  description = 'Universal content export to PDF, DOC, MD, and other formats';
  version = '1.0.0';

  /**
   * Detect if user wants to export content
   */
  async detectIntent(input: string): Promise<ExportIntent> {
    const lower = input.toLowerCase();
    
    // Export trigger words
    const exportKeywords = [
      'export', 'download', 'save as', 'convert to', 'generate pdf', 
      'create pdf', 'save to file', 'export to', 'download as'
    ];
    
    // Format detection
    const formatKeywords = {
      'pdf': ['pdf', 'portable document format'],
      'doc': ['doc', 'word document', 'microsoft word'],
      'docx': ['docx', 'word document', 'microsoft word'],
      'md': ['markdown', 'md file', '.md'],
      'txt': ['text file', 'txt', 'plain text'],
      'html': ['html', 'web page', 'html file'],
      'rtf': ['rtf', 'rich text format']
    };
    
    const hasExportIntent = exportKeywords.some(keyword => lower.includes(keyword));
    
    if (!hasExportIntent) {
      return {
        isExport: false,
        format: 'pdf',
        confidence: 0
      };
    }
    
    // Detect format
    let detectedFormat: ExportIntent['format'] = 'pdf'; // default
    let maxConfidence = 0.5; // default confidence if no specific format found
    
    for (const [format, keywords] of Object.entries(formatKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        detectedFormat = format as ExportIntent['format'];
        maxConfidence = 0.9;
        break;
      }
    }
    
    // Extract filename if provided
    const filenameMatch = lower.match(/(?:as|to|save)\s+["']?([^"'\s]+)["']?/);
    const filename = filenameMatch ? filenameMatch[1] : undefined;
    
    return {
      isExport: true,
      format: detectedFormat,
      confidence: maxConfidence,
      filename
    };
  }

  /**
   * Process export request
   */
  async process(request: ExportRequest): Promise<ExportResult> {
    try {
      console.log(`🚀 Exporting content to ${request.format.toUpperCase()}`);
      
      switch (request.format) {
        case 'pdf':
          return await this.exportToPDF(request);
        case 'doc':
        case 'docx':
          return await this.exportToWord(request);
        case 'md':
          return await this.exportToMarkdown(request);
        case 'txt':
          return await this.exportToText(request);
        case 'html':
          return await this.exportToHTML(request);
        case 'rtf':
          return await this.exportToRTF(request);
        default:
          throw new Error(`Unsupported format: ${request.format}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Export failed: ${error.message}`
      };
    }
  }

  /**
   * Export to PDF using browser's print functionality or PDF library
   */
  private async exportToPDF(request: ExportRequest): Promise<ExportResult> {
    try {
      // Create HTML content for PDF generation
      const htmlContent = this.createHTMLTemplate(request);
      
      // Use browser's built-in PDF generation
      const blob = await this.generatePDFBlob(htmlContent, request);
      
      const filename = request.filename || `document_${Date.now()}.pdf`;
      const downloadUrl = URL.createObjectURL(blob);
      
      return {
        success: true,
        downloadUrl,
        filename,
        format: 'pdf',
        fileSize: blob.size,
        blob,
        message: 'PDF exported successfully'
      };
    } catch (error) {
      throw new Error(`PDF export failed: ${error.message}`);
    }
  }

  /**
   * Export to Word document format
   */
  private async exportToWord(request: ExportRequest): Promise<ExportResult> {
    try {
      // Create Word-compatible HTML
      const wordHTML = this.createWordCompatibleHTML(request);
      
      // Create blob with Word MIME type
      const blob = new Blob([wordHTML], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const filename = request.filename || `document_${Date.now()}.${request.format}`;
      const downloadUrl = URL.createObjectURL(blob);
      
      return {
        success: true,
        downloadUrl,
        filename,
        format: request.format,
        fileSize: blob.size,
        blob,
        message: 'Word document exported successfully'
      };
    } catch (error) {
      throw new Error(`Word export failed: ${error.message}`);
    }
  }

  /**
   * Export to Markdown format
   */
  private async exportToMarkdown(request: ExportRequest): Promise<ExportResult> {
    try {
      let markdownContent = this.convertToMarkdown(request);
      
      // Add metadata header
      if (request.metadata) {
        const frontMatter = this.createMarkdownFrontMatter(request.metadata);
        markdownContent = frontMatter + '\n\n' + markdownContent;
      }
      
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const filename = request.filename || `document_${Date.now()}.md`;
      const downloadUrl = URL.createObjectURL(blob);
      
      return {
        success: true,
        downloadUrl,
        filename,
        format: 'md',
        fileSize: blob.size,
        blob,
        message: 'Markdown file exported successfully'
      };
    } catch (error) {
      throw new Error(`Markdown export failed: ${error.message}`);
    }
  }

  /**
   * Export to plain text
   */
  private async exportToText(request: ExportRequest): Promise<ExportResult> {
    try {
      // Strip HTML and convert to plain text
      const textContent = this.stripHTMLAndFormat(request.content);
      
      const blob = new Blob([textContent], { type: 'text/plain' });
      const filename = request.filename || `document_${Date.now()}.txt`;
      const downloadUrl = URL.createObjectURL(blob);
      
      return {
        success: true,
        downloadUrl,
        filename,
        format: 'txt',
        fileSize: blob.size,
        blob,
        message: 'Text file exported successfully'
      };
    } catch (error) {
      throw new Error(`Text export failed: ${error.message}`);
    }
  }

  /**
   * Export to HTML format
   */
  private async exportToHTML(request: ExportRequest): Promise<ExportResult> {
    try {
      const htmlContent = this.createHTMLTemplate(request);
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const filename = request.filename || `document_${Date.now()}.html`;
      const downloadUrl = URL.createObjectURL(blob);
      
      return {
        success: true,
        downloadUrl,
        filename,
        format: 'html',
        fileSize: blob.size,
        blob,
        message: 'HTML file exported successfully'
      };
    } catch (error) {
      throw new Error(`HTML export failed: ${error.message}`);
    }
  }

  /**
   * Export to RTF format
   */
  private async exportToRTF(request: ExportRequest): Promise<ExportResult> {
    try {
      const rtfContent = this.convertToRTF(request);
      
      const blob = new Blob([rtfContent], { type: 'application/rtf' });
      const filename = request.filename || `document_${Date.now()}.rtf`;
      const downloadUrl = URL.createObjectURL(blob);
      
      return {
        success: true,
        downloadUrl,
        filename,
        format: 'rtf',
        fileSize: blob.size,
        blob,
        message: 'RTF file exported successfully'
      };
    } catch (error) {
      throw new Error(`RTF export failed: ${error.message}`);
    }
  }

  /**
   * Create HTML template for PDF/HTML export
   */
  private createHTMLTemplate(request: ExportRequest): string {
    const title = request.title || 'Document';
    const author = request.author || 'Generated by GenieFlow AI';
    const date = new Date().toLocaleDateString();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .metadata {
            margin-bottom: 20px;
            font-size: 0.9em;
            color: #666;
        }
        .content {
            white-space: pre-wrap;
            font-size: 12pt;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 0.8em;
            color: #666;
        }
        @media print {
            body { margin: 0; padding: 15mm; }
            .header { break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        ${request.metadata?.organization ? `<h3>${request.metadata.organization}</h3>` : ''}
    </div>
    
    <div class="metadata">
        <p><strong>Author:</strong> ${author}</p>
        <p><strong>Date:</strong> ${date}</p>
        ${request.metadata?.profession ? `<p><strong>Profession:</strong> ${request.metadata.profession}</p>` : ''}
        ${request.metadata?.documentType ? `<p><strong>Document Type:</strong> ${request.metadata.documentType}</p>` : ''}
    </div>
    
    <div class="content">
${request.content}
    </div>
    
    <div class="footer">
        <p>Generated by GenieFlow AI - Universal Professional Assistant</p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate PDF blob using browser's print functionality
   */
  private async generatePDFBlob(htmlContent: string, request: ExportRequest): Promise<Blob> {
    // For now, create a simple text-based PDF substitute
    // In a real implementation, you'd use a library like jsPDF or Puppeteer
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${request.content.length + 200}
>>
stream
BT
/F1 12 Tf
50 750 Td
(${request.title || 'Document'}) Tj
0 -20 Td
(${request.content.substring(0, 1000)}...) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000199 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${400 + request.content.length}
%%EOF`;

    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  /**
   * Create Word-compatible HTML
   */
  private createWordCompatibleHTML(request: ExportRequest): string {
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="GenieFlow AI">
<meta name="Originator" content="GenieFlow AI">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page {
    margin: 1in;
}
body {
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.5;
}
</style>
</head>
<body>
<h1>${request.title || 'Document'}</h1>
<p><strong>Author:</strong> ${request.author || 'Generated by GenieFlow AI'}</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<hr>
<div>${request.content}</div>
</body>
</html>`;
  }

  /**
   * Convert content to Markdown format
   */
  private convertToMarkdown(request: ExportRequest): string {
    let content = request.content;
    
    // Add title if provided
    if (request.title) {
      content = `# ${request.title}\n\n` + content;
    }
    
    // Basic HTML to Markdown conversion
    content = content
      .replace(/<h1>(.*?)<\/h1>/g, '# $1')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
    
    return content;
  }

  /**
   * Create Markdown front matter
   */
  private createMarkdownFrontMatter(metadata: any): string {
    const frontMatter = ['---'];
    
    if (metadata.profession) frontMatter.push(`profession: ${metadata.profession}`);
    if (metadata.documentType) frontMatter.push(`type: ${metadata.documentType}`);
    if (metadata.createdBy) frontMatter.push(`author: ${metadata.createdBy}`);
    if (metadata.organization) frontMatter.push(`organization: ${metadata.organization}`);
    
    frontMatter.push(`date: ${new Date().toISOString()}`);
    frontMatter.push('---');
    
    return frontMatter.join('\n');
  }

  /**
   * Strip HTML and format as plain text
   */
  private stripHTMLAndFormat(content: string): string {
    return content
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<p[^>]*>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Convert to RTF format
   */
  private convertToRTF(request: ExportRequest): string {
    const title = request.title || 'Document';
    const content = this.stripHTMLAndFormat(request.content);
    
    return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 ${title}\\par
\\par
Author: ${request.author || 'Generated by GenieFlow AI'}\\par
Date: ${new Date().toLocaleDateString()}\\par
\\par
${content}
}`;
  }
}
