/**
 * 🎯 Canvas Services - Clean Architecture Exports
 * 
 * ELITE ENGINEERING: Single entry point for all canvas services
 * 
 * @author GenieFlow AI
 * @version 2.0.0
 */

// Import for internal use
import { getCanvasCreationService as _getCreator, type Canvas } from './CanvasCreationService';
import { getMultiDocumentDetector as _getDetector } from './MultiDocumentDetector';

// Core Services - Single Source of Truth
export {
    CanvasCreationService,
    getCanvasCreationService,
    type Canvas,
    type CanvasType,
    type CanvasMetadata,
    type CanvasCreationRequest,
    type CanvasCreationResult,
    type DocumentContent
} from './CanvasCreationService';

export {
    MultiDocumentDetector,
    getMultiDocumentDetector,
    type MultiDocumentDetectionResult,
    type DetectedDocument,
    type ConversationIntent
} from './MultiDocumentDetector';

export {
    TaskTitleGenerator,
    getTaskTitleGenerator,
    type TitleGenerationResult,
    type TitleContext
} from './TaskTitleGenerator';

// Re-export existing services that are still needed
export { UserIntentAnalyzer } from './UserIntentAnalyzer';

/**
 * 🚀 Quick Start - Create canvases from AI response
 * 
 * @example
 * ```typescript
 * import { createCanvasesFromAIResponse } from '@/services/canvas';
 * 
 * const canvases = await createCanvasesFromAIResponse(
 *   userRequest,
 *   aiResponse,
 *   conversationId
 * );
 * ```
 */
export async function createCanvasesFromAIResponse(
    userRequest: string,
    aiResponse: string,
    conversationId?: string
): Promise<Canvas[]> {
    // Use internal imports
    const detector = _getDetector();
    const creator = _getCreator();

    // Detect documents from both user request and AI response
    const detection = detector.detectMultiDocument(userRequest, aiResponse, conversationId);

    if (detection.isMultiDocument && detection.documents.length > 0) {
        // Create canvases from detected documents
        const result = await creator.createCanvases({
            documents: detection.documents.map(d => ({
                title: d.title,
                content: d.content,
                type: undefined // Let service infer
            })),
            conversationId
        });

        if (result.success) {
            detector.markIntentFulfilled(conversationId || '');
            return result.canvases;
        }
    }

    // Single document fallback
    const result = await creator.createCanvases({
        documents: [{
            title: 'Work Product',
            content: aiResponse
        }],
        conversationId
    });

    return result.canvases;
}
