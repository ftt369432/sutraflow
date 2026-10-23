import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { subscriptionService } from './subscription/SubscriptionService';
import { extractPDFText, cleanDocumentTitle } from '../utils/documentUtils';
import { visualOCRService } from './ai/VisualOCRService';
import { PaidFeature } from './AIServiceRouter';
import { toast } from 'react-hot-toast';

export interface ProcessedFile {
    file: File;
    content: string;
    type: 'image' | 'pdf' | 'text';
    base64?: string;
    isOcr?: boolean;
}

/**
 * 📁 File Handling Service
 * Standardized logic for document ingestion and AI context preparation.
 */
export class FileHandlingService {
    private static instance: FileHandlingService;

    private constructor() { }

    public static getInstance(): FileHandlingService {
        if (!FileHandlingService.instance) {
            FileHandlingService.instance = new FileHandlingService();
        }
        return FileHandlingService.instance;
    }

    /**
     * Reads a file as base64 for vision/image analysis
     */
    public async readFileAsBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * The core processor for all ingested files.
     * Handles text extraction, OCR, and persistence.
     */
    public async processFile(file: File, assistantId?: string): Promise<ProcessedFile | null> {
        console.log(`[FileHandlingService] Processing: ${file.name} (${file.type})`);

        try {
            // 🖼️ HANDLE IMAGES
            if (file.type.startsWith('image/')) {
                const base64 = await this.readFileAsBase64(file);
                
                // TODO: Store images in KB if requested, currently just for chat context
                return {
                    file,
                    content: `[Image: ${file.name}]`,
                    type: 'image',
                    base64: base64.split(',')[1]
                };
            }

            // 📄 HANDLE PDFS
            if (file.type === 'application/pdf') {
                const cleanedText = await extractPDFText(file);
                
                const hasInsufficientText = 
                    cleanedText.includes('insufficient text content') || 
                    cleanedText.includes('Text extraction temporarily unavailable') ||
                    cleanedText.trim().length < 50;

                if (!hasInsufficientText) {
                    await this.persistToKnowledgeBase(file, cleanedText, assistantId, 'pdf');
                    return {
                        file,
                        content: cleanedText.trim(),
                        type: 'pdf'
                    };
                } else {
                    // 🚨 NO TEXT FOUND - DOCUMENT NEEDS OCR
                    console.warn(`[FileHandlingService] PDF needs OCR: ${file.name}`);
                    
                    const hasOCRAccess = subscriptionService.checkAccess(PaidFeature.OCR);
                    if (hasOCRAccess) {
                        try {
                            const ocrText = await visualOCRService.scanDocument(file);
                            await this.persistToKnowledgeBase(file, ocrText, assistantId, 'pdf');
                            return {
                                file,
                                content: ocrText,
                                type: 'pdf',
                                isOcr: true
                            };
                        } catch (ocrError) {
                            console.error("[FileHandlingService] Neural OCR failed:", ocrError);
                            return {
                                file,
                                content: `[OCR ERROR]: Could not process document images for ${file.name}.`,
                                type: 'pdf'
                            };
                        }
                    } else {
                        return {
                            file,
                            content: `[SYSTEM NOTIFICATION]: ${file.name} appears to be a scanned image. Standard extraction failed. OCR is a Pro feature.`,
                            type: 'pdf'
                        };
                    }
                }
            }

            // 📝 HANDLE TEXT / MARKDOWN
            if (file.type.includes('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                const text = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsText(file);
                });

                await this.persistToKnowledgeBase(file, text, assistantId, 'text');
                return {
                    file,
                    content: text,
                    type: 'text'
                };
            }

            console.warn(`[FileHandlingService] Unsupported file type: ${file.type}`);
            return null;

        } catch (error) {
            console.error(`[FileHandlingService] Error processing ${file.name}:`, error);
            toast.error(`Failed to process ${file.name}`);
            return null;
        }
    }

    /**
     * Persists the processed text to the Knowledge Base
     */
    private async persistToKnowledgeBase(file: File, content: string, assistantId?: string, type: 'pdf' | 'text' = 'text') {
        const kbStore = useKnowledgeBaseStore.getState();
        
        // Subscription check
        if (!subscriptionService.canAddDocument(kbStore.documents.length)) {
            console.warn(`[FileHandlingService] Subscription limit reached, skipping KB sync for ${file.name}`);
            return;
        }

        try {
            await kbStore.addDocument({
                title: cleanDocumentTitle(file.name),
                content: content,
                metadata: {
                    type: 'document',
                    tags: ['uploaded', type],
                    source: 'quick_action',
                    assistantId: assistantId
                },
                size_bytes: file.size
            });
            console.log(`[FileHandlingService] Persisted to KB: ${file.name}`);
            toast.success(`Added to Knowledge Base: ${file.name}`, { position: 'bottom-right' });
        } catch (kbError) {
            console.error("[FileHandlingService] KB persistence failed:", kbError);
        }
    }
}

export const fileHandlingService = FileHandlingService.getInstance();
