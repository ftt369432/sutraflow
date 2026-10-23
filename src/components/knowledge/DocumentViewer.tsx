import React, { useState, useMemo } from 'react';
import { X, Save, Edit2, Tag as TagIcon, FileText, Copy, FileType, Eye, EyeOff, File } from 'lucide-react';
import { sanitizeHtml } from '../../lib/sanitizer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIDocument } from '../../types/ai';
import { TagSelector } from './TagSelector';
import { isPDFContent, processDocumentContent, cleanDocumentTitle } from '../../utils/documentUtils';
import { containsHighPctNonPrintable, isWordDocument } from '../../utils/wordDocumentUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';

interface DocumentViewerProps {
  document: AIDocument;
  onClose: () => void;
  isModal?: boolean;
  hideHeader?: boolean;
}

export function DocumentViewer({ document, onClose, isModal = false, hideHeader = false }: DocumentViewerProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [tags, setTags] = useState([
    ...new Set([
      ...(document.metadata?.tags || []),
      ...(document.metadata?.ai_auto_tags || [])
    ])
  ]);
  const [newTag, setNewTag] = useState('');  const [viewMode, setViewMode] = useState<'formatted' | 'raw' | 'readable' | 'ai' | 'legal' | 'docx'>('readable');
  const { updateDocument } = useKnowledgeBaseStore();

  // Detect document types
  const isPDF = useMemo(() => {
    return document.metadata?.category?.toLowerCase().includes('pdf') || 
           isPDFContent(document.content || '');
  }, [document]);
  
  // Detect if this is a Word document
  const isWordDoc = useMemo(() => {
    return document.metadata?.category?.toLowerCase().includes('docx') || 
           document.metadata?.category?.toLowerCase().includes('doc') ||
           document.title?.toLowerCase().endsWith('.docx') ||
           document.title?.toLowerCase().endsWith('.doc');
  }, [document]);

  // Enhanced content processing for different document types
  const processedContent = useMemo(() => {
    return processDocumentContent(content || '');
  }, [content]);
  const copyToClipboard = () => {
    const textToCopy = viewMode === 'raw' ? content : 
                      viewMode === 'formatted' ? processedContent.formatted : 
                      viewMode === 'legal' ? generateLegalView(false) :
                      processedContent.readable;
    navigator.clipboard.writeText(textToCopy);
  };
  
  // Generate specialized legal document formatting
  const generateLegalView = (includeHtml = true) => {
    // Check if this is likely a legal document
    const isLegalDocument = 
      document.metadata?.ai_auto_tags?.some(tag => 
        ['labor_code', 'case_law', 'ttd', 'penalties', 'wcab', 'petition', 'objection'].includes(tag)) ||
      document.title?.toLowerCase().includes('petition') ||
      document.title?.toLowerCase().includes('objection');
      
    if (!isLegalDocument) {
      return includeHtml ? 
        '<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-md"><p>This document does not appear to be a legal document. Please process with AI to detect legal content.</p></div>' :
        content;
    }
    
    // Create enhanced legal document formatting
    let legalContent = content;
    
    // Format case citations
    legalContent = legalContent.replace(/(\d+)\s+Cal\.\s*(\d+)\.?(\d+)?/g, 
      includeHtml ? '<span class="font-medium text-blue-800">$1 Cal. $2.$3</span>' : '$1 Cal. $2.$3');
      
    // Format section references
    legalContent = legalContent.replace(/Section\s+(\d+(\.\d+)?)/gi, 
      includeHtml ? '<span class="font-medium text-green-800">Section $1</span>' : 'Section $1');
      
    // Format paragraph structure
    if (includeHtml) {
      // Add proper paragraph formatting
      legalContent = legalContent
        .replace(/\n\n/g, '</p><p class="mb-4">')
        .replace(/^\s*WHEREFORE,([^.]+)\./gm, 
          '<p class="font-bold mt-4 mb-2">WHEREFORE,$1.</p>');
        
      // Style headers (all caps text likely to be headers)
      legalContent = legalContent.replace(/^([A-Z][A-Z\s]+[A-Z])(?:\s|:)/gm, 
        '<h3 class="text-lg font-bold mt-6 mb-2 text-gray-900">$1</h3>');
        
      // Format dates
      legalContent = legalContent.replace(/(\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b)/g, 
        '<span class="text-green-700">$1</span>');
      
      // Style signature blocks
      legalContent = legalContent.replace(/Respectfully submitted,([^.]*)(?=\n)/gi, 
        '<div class="mt-8 mb-4"><p class="italic">Respectfully submitted,</p><p class="font-semibold">$1</p></div>');
        
      // Wrap in container
      legalContent = `<div class="legal-document bg-stone-50 p-6 font-serif leading-relaxed">
        <p class="mb-4">${legalContent}</p>
      </div>`;
    }
    
    return legalContent;
  };

  const handleSave = () => {
    updateDocument(document.id, {
      title,
      content,
      metadata: {
        ...document.metadata,
        tags
      }
    });
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };  // Generate AI enhanced view
  const generateAIEnhancedView = () => {
    // Check if document has AI analysis (check both metadata and processing status)
    const hasAIAnalysis = document.metadata?.ai_summary || 
                         ((document as any).ai_enabled && (document as any).ai_last_processed);
    
    if (!hasAIAnalysis) {
      return '<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-md"><p>This document has not been fully processed by AI. Please use the AI Process feature to generate insights.</p></div>';
    }

    // Create enhanced view with AI-generated insights
    let enhancedView = '';

    // Add document summary if available
    if (document.metadata?.ai_summary) {
      enhancedView += `<div class="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
        <h3 class="text-base font-semibold text-blue-900 mb-2">Document Overview</h3>
        <p class="text-blue-800">${document.metadata.ai_summary}</p>
      </div>`;
    }

    // Add auto-detected legal tags if available
    if (document.metadata?.ai_auto_tags?.length) {
      const legalTags = document.metadata.ai_auto_tags.filter(tag => 
        ['labor_code', 'case_law', 'ttd', 'penalties', 'compensation', 
         'medical', 'wcab', 'insurance', 'petition', 'objection', 'appeal'].includes(tag));
         
      if (legalTags.length > 0) {
        enhancedView += `<div class="mt-3 mb-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Legal Categories</h4>
          <div class="flex flex-wrap gap-2">
            ${legalTags.map(tag => {
              const tagDisplayMap: Record<string, string> = {
                'labor_code': 'Labor Code',
                'case_law': 'Case Law',
                'ttd': 'TTD',
                'penalties': 'Penalties',
                'compensation': 'Compensation',
                'medical': 'Medical',
                'wcab': 'WCAB',
                'insurance': 'Insurance',
                'petition': 'Petition',
                'objection': 'Objection',
                'appeal': 'Appeal'
              };
              const displayName = tagDisplayMap[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
              return `<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">${displayName}</span>`;
            }).join('')}
          </div>
        </div>`;
      }
    }

    // Format the main content with smart highlights
    // Detect key entities and highlight them
    const processedText = content
      // Highlight entities mentioned in AI analysis
      .replace(new RegExp(`(${document.metadata?.ai_entities?.join('|')})`, 'gi'), 
        '<span class="bg-yellow-100 text-yellow-800 px-1 rounded">$1</span>')
      // Format paragraphs properly
      .replace(/\n\n/g, '</p><p>');

    // Create final enhanced view
    enhancedView += `<div class="prose prose-blue max-w-none">
      <div class="px-3 py-2 leading-relaxed">
        <p>${processedText}</p>
      </div>
    </div>`;

    // Add AI topics if available
    if (document.metadata?.ai_topics?.length) {
      enhancedView += `<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 class="text-sm font-semibold text-gray-900 mb-2">Key Topics</h3>
        <div class="flex flex-wrap gap-2">
          ${document.metadata.ai_topics.map(topic => 
            `<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">${topic}</span>`
          ).join('')}
        </div>
      </div>`;
    }

    return enhancedView;
  };

  // Use the imported containsHighPctNonPrintable function from wordDocumentUtils
  const isBinaryOrEncodedContent = (text: string): boolean => {
    return containsHighPctNonPrintable(text);
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full min-h-[400px] p-4 border rounded-lg resize-none font-mono text-sm bg-gray-50"
          placeholder="Document content..."
        />
      );
    }
    
    // Check if this is a Word document
    const isWordDoc = document.metadata?.category?.toLowerCase().includes('docx') || 
                     document.metadata?.category?.toLowerCase().includes('doc') ||
                     document.title?.toLowerCase().endsWith('.docx') ||
                     document.title?.toLowerCase().endsWith('.doc');
    
    // Check if content appears to be binary/encoded (can't be displayed properly)
    const hasBinaryContent = isBinaryOrEncodedContent(content || '');
                     
    // Determine content to render based on view mode and content type
    const contentToRender = (() => {
      // Always show raw content in raw mode regardless of binary status
      if (viewMode === 'raw') {
        return content;
      }
      
      // For binary content in any other view mode, always show the error message
      if (hasBinaryContent) {
        return `<div class="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 class="text-sm font-medium text-red-800 mb-2">Document Display Issue</h3>
          <p class="text-sm text-red-700">This document contains binary or encoded content that can't be properly displayed.</p>
          <p class="mt-2 text-xs text-red-600">To view this Word document properly, try one of the following:</p>
          <ul class="mt-1 list-disc pl-5 text-xs text-red-600">
            <li>Process the document with AI to extract readable text</li>
            <li>Use the "Raw" view mode to see the encoded content</li>
            <li>Re-upload the document or convert it to PDF before uploading</li>
          </ul>
          ${isWordDoc ? `
          <div class="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <p class="text-xs text-blue-700">
              <strong>Word Document Detected:</strong> This appears to be a Microsoft Word document (.docx/.doc) 
              with complex formatting that couldn't be properly displayed.
            </p>
          </div>` : ''}
        </div>`;
      }
      
      // For non-binary content, use the appropriate view mode
      switch(viewMode) {
        case 'formatted': 
          return processedContent.formatted;
        case 'ai': 
          return generateAIEnhancedView();
        case 'legal': 
          return generateLegalView();
        case 'readable':
        default:
          return processedContent.readable;
      }
    })();

    if (viewMode === 'readable') {
      const isMd = document.title?.toLowerCase().endsWith('.md') ||
                   document.metadata?.category?.toLowerCase().includes('markdown') ||
                   /^\s*#+\s|```|\|.*?\|/m.test(content || '');

      if (isMd) {
        let cleanMd = content || '';
        const thinkMatch = cleanMd.match(/<think>([\s\S]*?)<\/think>/i);
        const thoughtContent = thinkMatch ? thinkMatch[1].trim() : null;
        if (thinkMatch) {
          cleanMd = cleanMd.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
        }

        return (
          <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
            {thoughtContent && (
              <details className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300">
                <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200 mb-1 hover:text-indigo-500">
                  💭 Neural Reasoning Trace ({thoughtContent.length} chars)
                </summary>
                <div className="whitespace-pre-wrap mt-2 p-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs">
                  {thoughtContent}
                </div>
              </details>
            )}
            <div className="markdown-body leading-relaxed text-slate-900 dark:text-slate-100">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                      <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200 dark:divide-slate-700" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="bg-slate-100 dark:bg-slate-800 p-2.5 font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="p-2.5 border-b border-slate-100 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300" {...props} />
                  ),
                  code: ({ node, className, children, ...props }: any) => {
                    const isInline = !className && typeof children === 'string' && !children.includes('\n');
                    return isInline ? (
                      <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400 font-medium" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono my-3 border border-slate-800/80 leading-relaxed shadow-md">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  }
                }}
              >
                {cleanMd}
              </ReactMarkdown>
            </div>
          </div>
        );
      }
      // Detect if content matches legal document patterns
      const isLegalDocument = 
        document.metadata?.ai_auto_tags?.some(tag => ['labor_code', 'case_law', 'ttd', 'penalties', 'litigation'].includes(tag)) ||
        /case no|plaintiff|defendant|vs\.|v\.|court|judgment|opinion|labor code|pursuant to/i.test(contentToRender);
      
      // Enhance legal document formatting with better structure and term highlighting
      const legalFormatting = isLegalDocument ? contentToRender
        // Format case titles and headers
        .replace(/([A-Z][A-Z\s,.]+(?:\sv\.?\s[A-Z][A-Z\s,.]+)+)/g, '<h2 class="text-lg font-bold mt-4 mb-3 text-blue-900 pb-1">$1</h2>')
        // Highlight case citations
        .replace(/(\d+\s[A-Za-z.]+\s\d+\s\(\d{4}\))/g, '<span class="font-medium text-indigo-700">$1</span>')
        // Format section headers
        .replace(/(SECTION\s+\d+(?:\.\d+)*)/ig, '<h3 class="text-md font-semibold mt-3 mb-2 text-gray-900">$1</h3>')
        // Highlight legal references
        .replace(/(?:\d+\s)?U\.S\.C\.\s+§\s+\d+(?:\([a-z]\))?/g, '<span class="font-medium text-blue-700">$&</span>')
        .replace(/(Labor Code(?:\s+Section)?\s+\d+(?:\.\d+)*)/ig, '<span class="font-medium text-blue-700">$1</span>')
        .replace(/(Cal\.\s*(?:App\.|Rptr\.)\s*\d+)/g, '<span class="font-medium text-blue-700">$1</span>')
        // Format key legal terms
        .replace(/(TTD|temporary total disability)/gi, '<span class="font-semibold text-purple-700">$1</span>')
        .replace(/(penalties|penalty|fines|sanction)/gi, '<span class="font-semibold text-red-700">$1</span>')
        .replace(/(workers[\'']? compensation)/gi, '<span class="font-semibold text-emerald-700">$1</span>')
        .replace(/(ORDERED|JUDGEMENT|AFFIRMED|REVERSED|REMANDED)/g, '<span class="font-semibold text-blue-800 uppercase">$1</span>')
        // Format paragraphs properly
        .replace(/\n/g, '<br>')
        : contentToRender
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
          .replace(/##\s*(.*?)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2 text-gray-900 border-b pb-1">$1</h2>')
          .replace(/\n/g, '<br>');
      
      return (
        <div className={`prose prose-sm max-w-none ${isLegalDocument ? 'legal-document' : ''}`}>
          {isLegalDocument && (
            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Enhanced Legal Document View</h3>
              <p className="text-xs text-blue-700">This document has been identified as legal content and is formatted for better readability.</p>
            </div>
          )}
          
          {isPDF && (
            <div className="mb-4 px-3 py-2 bg-orange-50 border border-orange-100 rounded-md">
              <h3 className="text-sm font-medium text-orange-800 mb-1">PDF Document</h3>
              <p className="text-xs text-orange-700">This is OCR'd text from a PDF document. Some formatting may not be preserved.</p>
            </div>
          )}
          
          {/* Banner for Word documents */}
          {(document.metadata?.category?.toLowerCase().includes('docx') || 
            document.metadata?.category?.toLowerCase().includes('doc') ||
            document.title?.toLowerCase().endsWith('.docx') ||
            document.title?.toLowerCase().endsWith('.doc')) && (
            <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Word Document</h3>
              <p className="text-xs text-blue-700">Displaying extracted text content from Word document.</p>
            </div>
          )}
          
          <div 
            className="text-gray-800 leading-relaxed p-4 bg-white border border-gray-100 rounded-lg shadow-sm"
            style={{ 
              lineHeight: '1.8',
              fontFamily: isLegalDocument ? '"Georgia", "Times New Roman", serif' : 'system-ui, -apple-system, sans-serif'
            }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(legalFormatting)
            }}
          />
        </div>
      );
    }

    return (
      <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-4 rounded border overflow-x-auto">
        {contentToRender}
      </pre>
    );
  };

  // Side panel version
  if (!isModal) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        {/* Header - Only render if not hidden by parent container */}
        {!hideHeader && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="font-medium"
                    />
                  ) : (
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                        {cleanDocumentTitle(document.title || document.metadata?.title || 'Untitled Document')}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {document.metadata?.date ? new Date(document.metadata.date).toLocaleDateString() : 'Unknown date'}
                        {isPDF && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">PDF</span>}
                        {isWordDoc && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Word</span>}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="assistant"
                size="sm"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* View Mode Controls Toolbar */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">View:</span>            
            <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">              
              <button
                onClick={() => setViewMode('readable')}
                className={`px-3 py-1 text-xs font-medium ${
                  viewMode === 'readable' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Eye className="h-3 w-3 inline mr-1" />
                Readable
              </button>
              {document.metadata?.ai_processed_at && (
                <button
                  onClick={() => setViewMode('ai')}
                  className={`px-3 py-1 text-xs font-medium border-l border-slate-200 dark:border-slate-700 ${
                    viewMode === 'ai' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                    <path d="M12 2a4 4 0 0 0-4 4v12a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"></path>
                    <path d="M18 5a4 4 0 0 0-4 4v8a4 4 0 0 0 8 0V9a4 4 0 0 0-4-4Z"></path>
                    <path d="M6 9a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0v-4a4 4 0 0 0-4-4Z"></path>
                  </svg>
                  AI Enhanced
                </button>
              )}
              <button
                onClick={() => setViewMode('formatted')}
                className={`px-3 py-1 text-xs font-medium border-l border-slate-200 dark:border-slate-700 ${
                  viewMode === 'formatted' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileType className="h-3 w-3 inline mr-1" />
                Clean
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1 text-xs font-medium border-l border-slate-200 dark:border-slate-700 ${
                  viewMode === 'raw' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <EyeOff className="h-3 w-3 inline mr-1" />
                Raw
              </button>
              {/* Add "Process with AI" button for encoded/binary content */}
              {isBinaryOrEncodedContent(content || '') && (
                <button
                  onClick={() => {
                    // Call AI processing on this document with priority flag for binary content
                    const { updateDocument, aiProcessDocument } = useKnowledgeBaseStore.getState();
                    if (aiProcessDocument && document.id) {
                      // Add special processing flag for binary content
                      updateDocument(document.id, {
                        ...document,
                        metadata: {
                          ...document.metadata,
                          binary_content_detected: true,
                          needs_special_processing: true
                        }
                      });
                      
                      // Process with AI
                      aiProcessDocument(document.id).catch(err => 
                        console.error('Error processing document:', err)
                      );
                    }
                  }}
                  className="px-3 py-1 text-xs font-medium border-l border-slate-200 dark:border-slate-700 bg-green-100 text-green-800 hover:bg-green-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                    <path d="M12 2a4 4 0 0 0-4 4v12a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"></path>
                  </svg>
                  Process with AI
                </button>
              )}
            </div>
            
            <div className="flex space-x-1 ml-auto">            <Button
              variant="assistant"
              size="sm"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="assistant"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            {isEditing && (
              <Button 
                variant="assistant-primary" 
                size="sm" 
                onClick={handleSave}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isEditing && viewMode === 'readable' && processedContent.summary && 
           processedContent.readable.length > 250 && 
           processedContent.summary.trim() !== processedContent.readable.trim() && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Summary</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">{processedContent.summary}</p>
            </div>
          )}
          
          {renderContent()}
        </div>

      </div>
    );
  }

  // Modal version (existing code can be updated similarly)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Modal header and content similar to side panel */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {cleanDocumentTitle(document.title || document.metadata?.title || 'Document Viewer')}
          </h2>          <Button variant="assistant" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 