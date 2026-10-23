import { getPDFDocument } from '../../lib/pdfService';
import { subscriptionService } from '../subscription/SubscriptionService';
import { PaidFeature } from '../AIServiceRouter';
import { toast } from 'react-hot-toast';

/**
 * 👁️ Visual OCR Service
 * 
 * Instead of traditional OCR, we render PDF pages directly to images
 * and send them to a Vision-capable AI model (Gemini Pro Vision) for analysis.
 * This provides superior accuracy for legal and medical documents.
 */
export class VisualOCRService {
    private static instance: VisualOCRService;

    private constructor() {}

    public static getInstance() {
        if (!VisualOCRService.instance) {
            VisualOCRService.instance = new VisualOCRService();
        }
        return VisualOCRService.instance;
    }

    /**
     * "Scan" a PDF document using Vision AI
     * Only available for PAID users.
     */
    public async scanDocument(blob: Blob, maxPages: number = 3): Promise<string> {
        // 🛡️ Gate Check
        if (!subscriptionService.checkAccess(PaidFeature.OCR)) {
            return "OCR processing is a Pro Creator feature. Please upgrade to analyze this document.";
        }

        try {
            console.log(`👁️ Visual OCR: Starting analysis of ${(blob as any).name || 'PDF Document'}...`);
            const toastId = toast.loading('🔍 Running Neural OCR...');
            
            const pdf = await getPDFDocument(blob);
            const numPages = Math.min(pdf.numPages, maxPages);
            const extractedPagesText: string[] = [];

            for (let i = 1; i <= numPages; i++) {
                toast.loading(`🔍 Processing page ${i}/${numPages}...`, { id: toastId });
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // High resolution for better OCR
                
                // Create a canvas to render the page
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) throw new Error('Could not create canvas context');

                await (page as any).render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                // Convert canvas to base64 image
                const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                
                // 🚀 Send to AI Vision
                // We'll use the main factory instance to handle retries and provider failover
                const { AIServiceFactory } = await import('./aiServiceFactory');
                const { getEnv } = await import('../../config/env');
                const env = getEnv();
                
                const ai = AIServiceFactory.getInstance(); 
                const visionModel = env.models.vision || 'gemini-1.5-flash';

                const result = await ai.generateText(
                    `TRANSCRIPTION_MODE: Extract all text and structure from this document page accurately. 
                     Include headers, footers, and table contents. 
                     If this is a legal form, maintain the field labels and values.`,
                    { 
                        image: base64Image, 
                        inline: true
                    }
                );

                extractedPagesText.push(`--- Page ${i} ---\n${result}`);
            }

            toast.success('✅ Neural OCR Complete', { id: toastId });
            
            let finalOutput = extractedPagesText.join('\n\n');
            if (pdf.numPages > maxPages) {
                finalOutput += `\n\n[Note: Only the first ${maxPages} pages were processed for OCR in this session.]`;
            }

            return finalOutput;
        } catch (error) {
            console.error('❌ Visual OCR Failed:', error);
            toast.error('Neural OCR failed. Falling back to basic processing.');
            return `OCR Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
}

export const visualOCRService = VisualOCRService.getInstance();
