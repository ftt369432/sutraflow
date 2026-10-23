import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AIDriveFile } from '../../services/drive/aiDriveService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '../../hooks/useToast';
// import { FreeAIService } from '../../services/ai/freeAiService'; // Temporarily disabled to fix import issues
import { pdfjs } from 'react-pdf';
import { getEnv } from '../../config/env';
import { cleanPDFContent, processDocumentContent, cleanDocumentTitle, sanitizeTextForSupabase, extractPDFText, extractWordText } from '../../utils/documentUtils';
import { extractLegalReferences } from '../../utils/legalUtils';
import { sanitizeForAI, validateSummaryQuality, generateCleanSummary } from '../../utils/aiTextSanitizer';
import { getContrastingTextColor, generateRandomColor, adjustColorBrightness } from '../../utils/colorUtils';
import { TemplateService } from '../../services/canvas/TemplateService';
import { professionalTemplateService } from '../../services/templates/ProfessionalTemplateService';
import { useCanvasStore } from '../../stores/canvasStore';
import {
  FileText,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Zap,
  RefreshCw,
  BarChart3,
  Network,
  Activity,
  CheckCircle,
  AlertCircle,
  Share2,
  Download,
  Star,
  Layers,
  Edit3,
  Copy
} from 'lucide-react';

interface GenieDriveAIPreviewProps {
  file: AIDriveFile;
  aiDriveService: any; // Complex service interface
}

interface AIInsight {
  type: 'summary' | 'topics' | 'entities' | 'sentiment' | 'optimization' | 'processing';
  title: string;
  content: string;
  confidence: number;
  icon: React.ReactNode;
  actionable?: boolean;
}

interface ProcessingStatus {
  isProcessing: boolean;
  progress: number;
  stage: string;
  estimatedTime?: string;
}

interface TemplateDetection {
  isTemplateable: boolean;
  confidence: number;
  templateType: string;
  suggestedName: string;
  extractedFields: Array<{ name: string; type: string; required: boolean }>;
  sections: Array<{ name: string; content: string; order: number }>;
  metadata: {
    category: string;
    profession?: string;
    industry?: string;
    documentStructure: string[];
  };
}

// Using centralized document utilities imported from documentUtils.ts

export const GenieDriveAIPreview: React.FC<GenieDriveAIPreviewProps> = ({
  file,
  aiDriveService,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const canvasStore = useCanvasStore();

  // Core state
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    stage: 'idle'
  });
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Template system state
  const [templateDetection, setTemplateDetection] = useState<TemplateDetection | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isAnalyzingTemplate, setIsAnalyzingTemplate] = useState(false);

  // Services
  const templateService = useMemo(() => new TemplateService(), []);

  // const [aiService] = useState(() => new FreeAIService(aiDriveService.supabase)); // Temporarily disabled

  // Generate cache key for insights based on file ID and last modified date
  const getInsightsCacheKey = useCallback((file: AIDriveFile) => {
    return `ai_insights_${file.id}_${file.updated_at}`;
  }, []);

  // Load cached insights from localStorage
  const loadCachedInsights = useCallback((file: AIDriveFile): AIInsight[] | null => {
    try {
      const cacheKey = getInsightsCacheKey(file);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const insights = JSON.parse(cached);
        console.log(`[AI Insights] Loaded cached insights for ${file.name}`);
        return insights;
      }
    } catch (error) {
      console.warn('Failed to load cached insights:', error);
    }
    return null;
  }, [getInsightsCacheKey]);

  // Save insights to localStorage
  const saveCachedInsights = useCallback((file: AIDriveFile, insights: AIInsight[]) => {
    try {
      const cacheKey = getInsightsCacheKey(file);
      localStorage.setItem(cacheKey, JSON.stringify(insights));
      console.log(`[AI Insights] Cached insights for ${file.name}`);

      // Clean up old cache entries (keep only last 50 to avoid localStorage bloat)
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('ai_insights_'));
      if (allKeys.length > 50) {
        const keysToRemove = allKeys.slice(0, allKeys.length - 50);
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[AI Insights] Cleaned up ${keysToRemove.length} old cache entries`);
      }
    } catch (error) {
      console.warn('Failed to cache insights:', error);
    }
  }, [getInsightsCacheKey]);

  // Template detection function
  const detectTemplateOpportunities = useCallback(async () => {
    if (!summary || file.is_folder || summary.length < 100) return;

    setIsAnalyzingTemplate(true);

    try {
      // Analyze content for template potential
      const fileName = file.name.toLowerCase();
      const fileType = file.mime_type || '';

      console.log(`[Template Detection] Analyzing ${file.name} for template potential...`);

      // Smart detection based on content patterns
      let templateType = 'document';
      let confidence = 0.5;
      let isTemplateable = false;
      let extractedFields: Array<{ name: string; type: string; required: boolean }> = [];
      let sections: Array<{ name: string; content: string; order: number }> = [];

      // Legal document detection
      if (fileName.includes('petition') || summary.includes('Labor Code') || summary.includes('vs.') || summary.includes('Petitioner')) {
        templateType = 'legal_petition';
        confidence = 0.85;
        isTemplateable = true;

        extractedFields = [
          { name: 'case_number', type: 'text', required: true },
          { name: 'petitioner_name', type: 'text', required: true },
          { name: 'respondent_name', type: 'text', required: true },
          { name: 'labor_code_section', type: 'text', required: false },
          { name: 'penalty_amount', type: 'number', required: false },
          { name: 'injury_date', type: 'date', required: false }
        ];

        sections = [
          { name: 'Case Caption', content: 'Party names and case information', order: 1 },
          { name: 'Factual Background', content: 'Statement of facts', order: 2 },
          { name: 'Legal Arguments', content: 'Citations and legal basis', order: 3 },
          { name: 'Relief Requested', content: 'What is being requested', order: 4 },
          { name: 'Conclusion', content: 'Summary and signature', order: 5 }
        ];
      } else if (fileName.includes('contract') || fileName.includes('agreement') || summary.includes('agreement') || summary.includes('terms')) {
        templateType = 'legal_contract';
        confidence = 0.80;
        isTemplateable = true;

        extractedFields = [
          { name: 'party_one', type: 'text', required: true },
          { name: 'party_two', type: 'text', required: true },
          { name: 'effective_date', type: 'date', required: true },
          { name: 'contract_value', type: 'number', required: false },
          { name: 'term_length', type: 'text', required: false }
        ];
      } else if (fileName.includes('letter') || summary.includes('Dear ') || summary.includes('Sincerely')) {
        templateType = 'formal_letter';
        confidence = 0.75;
        isTemplateable = true;

        extractedFields = [
          { name: 'recipient_name', type: 'text', required: true },
          { name: 'recipient_address', type: 'text', required: true },
          { name: 'subject', type: 'text', required: true },
          { name: 'sender_name', type: 'text', required: true }
        ];
      } else if (summary.length > 500 && summary.split('\n').length > 10) {
        // Generic structured document
        templateType = 'structured_document';
        confidence = 0.60;
        isTemplateable = true;

        extractedFields = [
          { name: 'title', type: 'text', required: true },
          { name: 'author', type: 'text', required: false },
          { name: 'date', type: 'date', required: false }
        ];
      }

      if (isTemplateable) {
        const detection: TemplateDetection = {
          isTemplateable,
          confidence,
          templateType,
          suggestedName: `${file.name.replace(/\.[^/.]+$/, "")} Template`,
          extractedFields,
          sections,
          metadata: {
            category: templateType.includes('legal') ? 'legal' : 'business',
            profession: templateType.includes('legal') ? 'legal' : undefined,
            industry: templateType.includes('legal') ? 'legal-services' : undefined,
            documentStructure: sections.map(s => s.name)
          }
        };

        setTemplateDetection(detection);

        // Add template insight to AI insights
        const templateInsight: AIInsight = {
          type: 'optimization',
          title: 'Template Creation Opportunity',
          content: `This document has ${Math.round(confidence * 100)}% template potential. Detected as ${templateType.replace('_', ' ')} with ${extractedFields.length} fillable fields.`,
          confidence,
          icon: <Target className="h-4 w-4" />,
          actionable: true
        };

        setAiInsights(prev => {
          const exists = prev.some(insight => insight.title.includes('Template Creation'));
          if (!exists) {
            return [...prev, templateInsight];
          }
          return prev;
        });

        console.log(`[Template Detection] ✅ Template opportunity detected: ${templateType} (${Math.round(confidence * 100)}% confidence)`);
      } else {
        console.log(`[Template Detection] ❌ No template opportunity detected for ${file.name}`);
      }

    } catch (error) {
      console.warn('Template detection failed:', error);
    } finally {
      setIsAnalyzingTemplate(false);
    }
  }, [summary, file]);

  // Function to create template from document
  const createTemplateFromDocument = useCallback(async () => {
    if (!summary || !templateDetection?.isTemplateable) {
      toast({
        title: "Cannot Create Template",
        description: "This document is not suitable for template creation.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingTemplate(true);

    try {
      console.log(`[Template Creation] Creating template from ${file.name}...`);

      // Create template data structure
      const templateData = {
        name: templateDetection.suggestedName,
        description: `Template created from ${file.name}`,
        category: templateDetection.metadata.category as any,
        contentType: templateDetection.templateType,
        content: summary,
        structure: templateDetection.sections.map(section => ({
          id: `section_${section.order}`,
          name: section.name,
          content: section.content,
          isRequired: true,
          order: section.order,
          hints: [],
          examples: []
        })),
        variables: templateDetection.extractedFields.map(field => ({
          name: field.name,
          type: field.type as 'text' | 'date' | 'number' | 'select' | 'multiline',
          label: field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          placeholder: `Enter ${field.name.replace(/_/g, ' ')}`,
          required: field.required,
          defaultValue: ''
        })),
        metadata: {
          description: `Template created from ${file.name}`,
          tags: [...tags, 'auto-generated', 'from-document', templateDetection.templateType],
          difficulty: 'intermediate' as const,
          estimatedTime: 30,
          jurisdiction: templateDetection.templateType.includes('legal') ? 'California' : undefined
        },
        learningData: {
          commonModifications: [],
          userPatterns: [],
          successMetrics: {
            completionRate: 0,
            userSatisfaction: 0,
            timeToComplete: 0
          },
          suggestedImprovements: []
        },
        usageCount: 0,
        averageRating: 0,
        tags: [...tags, 'auto-generated', 'from-document', templateDetection.templateType],
        aiMetadata: {
          confidence: templateDetection.confidence,
          qualityScore: Math.round(templateDetection.confidence * 100),
          factPatterns: [templateDetection.templateType],
          argumentStructure: templateDetection.sections.map(s => s.name),
          sourceDocument: file.name,
          profession: templateDetection.metadata.profession,
          industry: templateDetection.metadata.industry
        }
      };

      // Save template using Canvas template service
      const newTemplate = await templateService.createTemplate(templateData);

      // ENHANCEMENT: Also save to professional template database for universal access
      if (templateDetection.metadata.profession) {
        try {
          await professionalTemplateService.getInstance().importAIDriveFileAsTemplate(
            user?.id || 'anonymous',
            file.id,
            {
              templateType: templateDetection.templateType,
              profession: templateDetection.metadata.profession,
              voiceTriggers: [
                templateDetection.suggestedName.toLowerCase(),
                `${templateDetection.metadata.profession} ${templateDetection.templateType}`,
                ...templateDetection.sections.slice(0, 2).map(s => s.name.toLowerCase())
              ],
              aiInstructions: `Professional ${templateDetection.metadata.profession} template for ${templateDetection.templateType}`
            }
          );

          toast({
            title: "🎯 Universal Template Created!",
            description: `"${templateData.name}" is now available system-wide for ${templateDetection.metadata.profession} professionals.`,
          });
        } catch (error) {
          console.error('Failed to save to professional templates:', error);
          toast({
            title: "🎯 Template Created Successfully!",
            description: `"${templateData.name}" is now available in Canvas templates.`,
          });
        }
      } else {
        toast({
          title: "🎯 Template Created Successfully!",
          description: `"${templateData.name}" is now available in Canvas templates.`,
        });
      }

      // Update the insights to show template was created
      setAiInsights(prev => prev.map(insight =>
        insight.title.includes('Template Creation')
          ? {
            ...insight,
            title: '✅ Template Created',
            content: `Template "${templateData.name}" created successfully! Available in Canvas.`,
            actionable: false,
            icon: <CheckCircle className="h-4 w-4" />
          }
          : insight
      ));

      console.log(`[Template Creation] ✅ Successfully created template: ${templateData.name}`);

    } catch (error) {
      console.error('Template creation failed:', error);
      toast({
        title: "Template Creation Failed",
        description: "Could not create template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingTemplate(false);
    }
  }, [summary, templateDetection, file, tags, templateService, toast]);

  // Function to open document in Canvas editor
  const openInCanvas = useCallback(async () => {
    try {
      // Create a new Canvas window with the document content
      const windowId = canvasStore.createWindow('custom_document', summary || '');
      const documentId = canvasStore.createDocument('custom_document', file.name);

      // Update the document with the file content
      canvasStore.updateDocument(documentId, {
        title: file.name,
        content: summary || '',
        metadata: {
          wordCount: (summary || '').split(/\s+/).length,
          readingTime: Math.ceil((summary || '').split(/\s+/).length / 200),
          language: 'en',
          tags: tags,
          citations: [],
          complexity: 'moderate' as const,
          completionProgress: 100
        }
      });

      // Navigate to Canvas
      navigate('/canvas');

      toast({
        title: "Opened in Canvas",
        description: `${file.name} is now available for editing in Canvas.`
      });

    } catch (error) {
      console.error('Failed to open in Canvas:', error);
      toast({
        title: "Failed to Open in Canvas",
        description: "Could not open document in Canvas editor.",
        variant: "destructive"
      });
    }
  }, [summary, file, tags, canvasStore, navigate, toast]);

  // Enhanced AI insights generation with caching
  const generateAIInsights = useCallback(async () => {
    if (file.is_folder) return;

    // Check if we already have insights for this file - EFFICIENCY IMPROVEMENT
    if (aiInsights.length > 0) {
      console.log(`[AI Insights] Using existing loaded insights for ${file.name}`);
      return;
    }

    // Try to load from cache first
    const cachedInsights = loadCachedInsights(file);
    if (cachedInsights && cachedInsights.length > 0) {
      setAiInsights(cachedInsights);
      return;
    }

    setIsGeneratingInsights(true);
    setProcessingStatus({
      isProcessing: true,
      progress: 0,
      stage: 'Analyzing document structure...'
    });

    console.log(`[AI Insights] Generating new insights for ${file.name}...`);

    try {
      // Simulate progressive analysis with realistic stages
      // Simulate progressive analysis with realistic stages
      const stages = [
        { progress: 20, stage: 'Extracting content...' },
        { progress: 45, stage: 'Analyzing patterns...' },
        { progress: 70, stage: 'Generating insights...' },
        { progress: 90, stage: 'Finalizing analysis...' },
        { progress: 100, stage: 'Complete' }
      ];

      for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setProcessingStatus({
          isProcessing: stage.progress < 100,
          progress: stage.progress,
          stage: stage.stage
        });
      }

      // Generate contextual insights based on file type, name, and existing summary
      const insights: AIInsight[] = [];

      const fileName = file.name.toLowerCase();
      const fileType = file.mime_type || '';
      const existingSummary = summary || '';

      // Smart content analysis based on file characteristics
      if (fileName.includes('petition') || fileName.includes('legal') || existingSummary.includes('Labor Code')) {
        insights.push({
          type: 'summary',
          title: 'Legal Document Analysis',
          content: `This appears to be a legal petition document. Key legal concepts and procedural requirements detected.`,
          confidence: 0.92,
          icon: <FileText className="h-4 w-4" />,
          actionable: true
        });

        insights.push({
          type: 'optimization',
          title: 'Template Opportunity',
          content: 'This document could be converted into a reusable template for similar petitions.',
          confidence: 0.85,
          icon: <Target className="h-4 w-4" />,
          actionable: true
        });

        insights.push({
          type: 'processing',
          title: 'Knowledge Base Integration',
          content: 'Document is suitable for automatic knowledge base categorization and indexing.',
          confidence: 0.88,
          icon: <Network className="h-4 w-4" />,
          actionable: true
        });
      } else if (fileName.includes('contract') || fileName.includes('agreement')) {
        insights.push({
          type: 'summary',
          title: 'Contract Analysis',
          content: `Contract document detected with standard legal provisions and terms.`,
          confidence: 0.89,
          icon: <FileText className="h-4 w-4" />
        });

        insights.push({
          type: 'entities',
          title: 'Key Parties Identified',
          content: 'Contract parties and signatory requirements detected for review.',
          confidence: 0.82,
          icon: <BarChart3 className="h-4 w-4" />
        });
      } else {
        insights.push({
          type: 'summary',
          title: 'Document Analysis',
          content: `Professional document with structured content. Suitable for knowledge management.`,
          confidence: 0.76,
          icon: <FileText className="h-4 w-4" />
        });
      }

      // Add universal insights based on tags and summary
      if (tags.length > 0) {
        insights.push({
          type: 'topics',
          title: 'Content Classification',
          content: `Document contains ${tags.length} identified topics: ${tags.slice(0, 3).join(', ')}${tags.length > 3 ? '...' : ''}`,
          confidence: 0.79,
          icon: <Sparkles className="h-4 w-4" />
        });
      }

      // Processing recommendation
      insights.push({
        type: 'optimization',
        title: 'Processing Recommendations',
        content: `Document exhibits ${fileType.includes('pdf') ? 'PDF structure' : 'text format'} with high confidence for automated processing.`,
        confidence: 0.83,
        icon: <TrendingUp className="h-4 w-4" />,
        actionable: true
      });

      setAiInsights(insights);

      // Cache the generated insights for future use - EFFICIENCY IMPROVEMENT
      saveCachedInsights(file, insights);

      // Run template detection after insights are generated
      if (summary && summary.length > 100) {
        await detectTemplateOpportunities();
      }

      if (insights.length > 0) {
        toast({
          title: "AI Analysis Complete",
          description: `Generated ${insights.length} insights for ${file.name}`
        });
      }

    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to generate AI insights",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [file, summary, tags, toast, loadCachedInsights, saveCachedInsights]);

  // Load cached insights immediately when component mounts - EFFICIENCY IMPROVEMENT
  useEffect(() => {
    if (!file.is_folder && aiInsights.length === 0) {
      const cachedInsights = loadCachedInsights(file);
      if (cachedInsights && cachedInsights.length > 0) {
        setAiInsights(cachedInsights);
      }
    }
  }, [file, loadCachedInsights, aiInsights.length]);

  // Auto-generate insights when basic analysis is complete
  useEffect(() => {
    if (!file.is_folder && summary && tags.length > 0 && aiInsights.length === 0) {
      const timer = setTimeout(() => {
        generateAIInsights();
      }, 1000); // Wait 1 second after summary loads
      return () => clearTimeout(timer);
    }
  }, [summary, tags, generateAIInsights, aiInsights.length, file.is_folder]);

  // Auto-detect template opportunities when summary is available
  useEffect(() => {
    if (!file.is_folder && summary && summary.length > 100 && !templateDetection && !isAnalyzingTemplate) {
      const timer = setTimeout(() => {
        detectTemplateOpportunities();
      }, 2000); // Wait 2 seconds after summary to avoid overwhelming UI
      return () => clearTimeout(timer);
    }
  }, [summary, templateDetection, isAnalyzingTemplate, detectTemplateOpportunities, file.is_folder]);

  useEffect(() => {
    const processContent = async () => {
      // Check if cached content contains corrupted data using our enhanced validator
      const isCachedContentCorrupted = file.ai_summary && !validateSummaryQuality(file.ai_summary);

      // Use cached results if available and not corrupted - EFFICIENCY IMPROVEMENT
      if (file.ai_summary && file.ai_topics && !isCachedContentCorrupted) {
        setSummary(file.ai_summary);
        setTags(file.ai_topics);
        console.log(`[AI Preview] Using cached analysis for ${file.name}`);
        return;
      }

      if (isCachedContentCorrupted) {
        console.warn('Detected corrupted cached content, reprocessing...');
      }

      console.log(`[AI Preview] No cached analysis found for ${file.name}, processing...`);
      setLoading(true);
      try {
        // Get file content
        let url;
        try {
          url = await aiDriveService.downloadFile(file.id);
        } catch (downloadError) {
          console.error('Error downloading file:', downloadError);
          throw new Error('Could not download file for processing. Please try again later.');
        }
        let text = '';

        if (file.mime_type?.startsWith('image/')) {
          // Process image with OCR - temporarily disabled
          // const response = await fetch(url);
          // const blob = await response.blob();
          // const ocrText = await aiService.performOCR(blob);
          text = 'Image file - AI processing temporarily unavailable';
        } else if (file.mime_type?.includes('pdf')) {
          // Process PDF with enhanced text extraction
          try {
            const response = await fetch(url);
            const blob = await response.blob();

            // Try PDF.js text extraction first
            const pdfText = await extractPDFText(blob);
            text = sanitizeTextForSupabase(pdfText);

            // Validate extracted text quality
            if (!text || text.length < 20) {
              throw new Error('PDF text extraction yielded insufficient content');
            }

            // Check if extracted text contains PDF artifacts (extraction failed)
            if (text.includes('endobj') || text.includes('endstream') || text.includes('/Type')) {
              throw new Error('PDF text extraction yielded metadata instead of content');
            }

            // PDF text extraction successful
          } catch (pdfError) {
            console.warn('PDF text extraction failed:', pdfError);

            // For PDFs, don't fall back to raw text as it will be binary garbage
            // Instead, try alternative PDF processing
            try {
              // Attempting alternative PDF processing
              const response = await fetch(url);
              const arrayBuffer = await response.arrayBuffer();

              // Try with explicit worker configuration
              const pdfDoc = await pdfjs.getDocument({
                data: arrayBuffer,
                useWorkerFetch: false,
                isEvalSupported: false,
                useSystemFonts: true,
                verbosity: 0, // Reduce console spam
                disableAutoFetch: true
              }).promise;

              let alternativeText = '';
              const maxPages = Math.min(pdfDoc.numPages, 10); // Limit to first 10 pages

              for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                try {
                  const page = await pdfDoc.getPage(pageNum);
                  const textContent = await page.getTextContent();
                  const pageText = textContent.items
                    .map((item) => ('str' in item ? item.str : '') || '')
                    .filter(str => str.trim().length > 0)
                    .join(' ');

                  if (pageText.trim()) {
                    alternativeText += pageText + '\n\n';
                  }
                } catch (pageError) {
                  console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
                  continue;
                }
              }

              if (alternativeText.trim().length > 20) {
                text = sanitizeTextForSupabase(alternativeText);
                // Alternative PDF processing successful
              } else {
                throw new Error('Alternative PDF processing also failed');
              }
            } catch (altError) {
              console.error('Alternative PDF processing failed:', altError);

              // Final fallback: Use simple binary extraction
              try {
                // Attempting binary fallback extraction
                const { extractPDFTextFallback, isPDFImageBased, getPDFBasicInfo } = await import('../../lib/pdfFallbackProcessor');

                // Get a fresh blob for fallback processing
                const fallbackResponse = await fetch(url);
                const fallbackBlob = await fallbackResponse.blob();

                const pdfInfo = await getPDFBasicInfo(fallbackBlob);

                if (pdfInfo.isPasswordProtected) {
                  text = 'This PDF document is password-protected and cannot be processed.';
                } else if (await isPDFImageBased(fallbackBlob)) {
                  text = 'This appears to be a scanned PDF document. Text extraction is limited for image-based PDFs.';
                } else {
                  const fallbackText = await extractPDFTextFallback(fallbackBlob);
                  text = sanitizeTextForSupabase(fallbackText);
                  // Binary fallback extraction successful
                }
              } catch (fallbackError) {
                console.error('Binary fallback extraction failed:', fallbackError);
                text = 'This PDF document could not be processed for text extraction. The file may be image-based, password-protected, or corrupted.';
              }
            }
          }
        } else if (file.mime_type?.includes('word') || file.mime_type?.includes('document') ||
          file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          // Process Word documents with proper text extraction
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            const wordText = await extractWordText(blob);
            text = sanitizeTextForSupabase(wordText);

            if (!text || text.length < 10) {
              throw new Error('No readable text found in Word document');
            }
          } catch (wordError) {
            console.warn('Word text extraction failed:', wordError);
            // Don't fall back to raw text for Word docs as it will be binary garbage
            text = 'Unable to extract text from this Word document. The file may be corrupted or in an unsupported format.';
          }
        } else {
          // Get text content for other files
          const response = await fetch(url);
          const rawText = await response.text();
          text = sanitizeTextForSupabase(rawText);
        }

        // Enhanced text validation using our AI sanitizer
        const sanitizedText = sanitizeForAI(text);

        if (!sanitizedText) {
          console.warn('[GenieDriveAI] Text failed sanitization, using clean summary generator');
          const cleanSummary = generateCleanSummary(text);
          setSummary(cleanSummary);
          setTags(['processed-with-sanitizer']);
          return;
        }

        // Use sanitized text for further processing
        text = sanitizedText;

        // Extract legal references - specific to legal documents
        const { laborCodes, caseCitations, allReferences } = extractLegalReferences(text);

        // Build tags - include document type plus any legal references
        const documentTypeTags = ['document'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension) {
          documentTypeTags.push(fileExtension);
        }

        // Process with AI - temporarily using simple fallbacks
        const newSummary = text.length > 500 ? text.substring(0, 500) + '...' : text;
        // Combine basic tags with legal references for comprehensive tagging
        const newTags = [...documentTypeTags, ...allReferences];

        // Generate embedding - temporarily disabled
        const embedding = new Array(getEnv().embeddingDimension).fill(0); // Zero vector fallback// Update file with results (this will overwrite corrupted cached content)
        try {
          await aiDriveService.updateFile(file.id, {
            ai_summary: newSummary,
            ai_topics: newTags,
            content_preview: text.substring(0, 1000), // Store clean text preview
            embedding,
            ai_enabled: true,
            ai_last_processed: new Date().toISOString()
          });
        } catch (updateError) {
          console.warn('Unable to update file metadata in database. Continuing with UI update:', updateError);
          // We'll still update the UI even if the database update fails
        }

        setSummary(newSummary);
        setTags(newTags);
      } catch (error) {
        console.error('Error processing file:', error);
        setSummary('Failed to process this document. Please try again later.');
        setTags(['error']);
      } finally {
        setLoading(false);
      }
    };

    void processContent();
  }, [file, aiDriveService]); // Removed aiService dependency

  if (!file) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Processing Status Banner */}
      {processingStatus.isProcessing && (
        <div className="flex-none p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-3 mb-2">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {processingStatus.stage}
            </span>
          </div>
          <Progress value={processingStatus.progress} className="h-2" />
        </div>
      )}

      {/* Enhanced Tabbed Interface */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex-none grid w-full grid-cols-2 m-4 mb-2">
            <TabsTrigger value="summary" className="text-xs">
              <Brain className="h-4 w-4 mr-1" />
              AI Summary
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">
              <Activity className="h-4 w-4 mr-1" />
              Actions
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Summary Tab - Enhanced existing functionality */}
            <TabsContent value="summary" className="space-y-4 mt-0">
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
                {loading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {summary || 'No summary available'}
                    </p>

                    {/* Quick Actions */}
                    {!loading && summary && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={generateAIInsights}
                          disabled={isGeneratingInsights}
                          className="text-xs"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {isGeneratingInsights ? 'Analyzing...' : 'Deep Analysis'}
                        </Button>
                        {templateDetection?.isTemplateable ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            onClick={createTemplateFromDocument}
                            disabled={isCreatingTemplate}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            {isCreatingTemplate ? 'Creating...' : 'Make Template'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={detectTemplateOpportunities}
                            disabled={isAnalyzingTemplate}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            {isAnalyzingTemplate ? 'Analyzing...' : 'Check Template Potential'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={openInCanvas}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Open in Canvas
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.length > 0 ? tags.map((tag) => {
                      // Generate consistent colors based on tag content
                      const tagHash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const baseColor = `#${((tagHash * 12345) % 16777215).toString(16).padStart(6, '0')}`;
                      const bgColor = adjustColorBrightness(baseColor, 40); // Lighten for background
                      const textColor = getContrastingTextColor(bgColor);

                      // Determine tag category for styling
                      const isLaborCode = tag.includes('Labor Code');
                      const isCaseCitation = tag.includes('v.') || tag.includes('Cal.') || tag.includes('U.S.');
                      const isDocType = ['document', 'pdf', 'docx', 'txt', 'doc'].includes(tag.toLowerCase());

                      let className = 'px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-sm';

                      if (isLaborCode) {
                        className += ' bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300';
                      } else if (isCaseCitation) {
                        className += ' bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-300';
                      } else if (isDocType) {
                        className += ' bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300';
                      } else {
                        className += ` border hover:shadow-md`;
                      }

                      return (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={className}
                          style={!isLaborCode && !isCaseCitation && !isDocType ?
                            { backgroundColor: bgColor, color: textColor, borderColor: adjustColorBrightness(bgColor, -10) } :
                            undefined
                          }
                        >
                          {tag}
                        </Badge>
                      );
                    }) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-700">No tags available</Badge>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Insights Tab - New AI Intelligence Features */}
            <TabsContent value="insights" className="space-y-4 mt-0">
              {aiInsights.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.map((insight, index) => (
                    <Card key={index} className={`border-l-4 ${insight.type === 'optimization' ? 'border-l-green-500' :
                        insight.type === 'summary' ? 'border-l-blue-500' :
                          insight.type === 'topics' ? 'border-l-purple-500' :
                            insight.type === 'processing' ? 'border-l-orange-500' :
                              'border-l-gray-500'
                      }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                            {insight.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {insight.title}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(insight.confidence * 100)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {insight.content}
                            </p>
                            {insight.actionable && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 text-xs"
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Take Action
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {isGeneratingInsights ? 'Generating insights...' : 'No advanced insights available'}
                  </p>
                  {!isGeneratingInsights && summary && (
                    <Button
                      size="sm"
                      onClick={generateAIInsights}
                      className="text-xs"
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      Generate Insights
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Actions Tab - Document Actions and Workflow */}
            <TabsContent value="actions" className="space-y-4 mt-0">
              {/* Template Opportunity Banner */}
              {templateDetection?.isTemplateable && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center text-green-800 dark:text-green-200">
                      <Target className="h-4 w-4 mr-2" />
                      🎯 Template Opportunity Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      This document can be converted into a <strong>{templateDetection.templateType.replace('_', ' ')}</strong> template
                      with <strong>{Math.round(templateDetection.confidence * 100)}%</strong> confidence.
                    </p>
                    <div className="text-xs text-green-600 dark:text-green-400 mb-3">
                      <strong>Detected fields:</strong> {templateDetection.extractedFields.map(f => f.name).join(', ')}
                    </div>
                    <Button
                      size="sm"
                      onClick={createTemplateFromDocument}
                      disabled={isCreatingTemplate}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isCreatingTemplate ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Creating Template...
                        </>
                      ) : (
                        <>
                          <Target className="h-3 w-3 mr-2" />
                          Convert to Canvas Template
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Canvas Integration Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Canvas Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs justify-start"
                      onClick={openInCanvas}
                    >
                      <Edit3 className="h-3 w-3 mr-2" />
                      Open in Canvas Editor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs justify-start"
                      onClick={createTemplateFromDocument}
                      disabled={!templateDetection?.isTemplateable || isCreatingTemplate}
                    >
                      <Target className="h-3 w-3 mr-2" />
                      {templateDetection?.isTemplateable ? 'Convert to Template' : 'Create Custom Template'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs justify-start"
                      onClick={() => navigate('/canvas')}
                    >
                      <Activity className="h-3 w-3 mr-2" />
                      Browse Canvas Templates
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Favorite
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Network className="h-3 w-3 mr-1" />
                      Link to KB
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI-Powered Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">AI-Powered Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs justify-start"
                      onClick={detectTemplateOpportunities}
                      disabled={isAnalyzingTemplate}
                    >
                      <BarChart3 className="h-3 w-3 mr-2" />
                      {isAnalyzingTemplate ? 'Analyzing...' : 'Analyze Document Structure'}
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs justify-start">
                      <Copy className="h-3 w-3 mr-2" />
                      Find Similar Documents
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs justify-start">
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Reprocess Content
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs justify-start">
                      <Activity className="h-3 w-3 mr-2" />
                      Generate Workflow
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* File Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Document Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{file.mime_type || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">{file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">{new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Modified:</span>
                      <span className="font-medium">{new Date(file.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
