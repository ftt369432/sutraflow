import { AIDocument, Message } from '../types/ai';
import { getEmbedding } from './embeddingService';
import { subscriptionService } from './subscription/SubscriptionService';
import { PaidFeature } from './AIServiceRouter';
import { useAssistantStore } from '../store/assistantStore';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { calculateCosineSimilarity, validateDocumentEmbeddings, normalizeEmbedding } from '../utils/embeddingUtils';
import { repairDocumentEmbeddings } from './embeddingMonitorService';
import { AIServiceFactory } from './ai/aiServiceFactory';
import { masterAgentRegistry } from './MasterAgentRegistry';

export interface DocumentChatOptions {
  maxTokens?: number;
  temperature?: number;
  relevanceThreshold?: number;
  systemPrompt?: string;
  onToken?: (token: string) => void;
  attachedFiles?: Array<{ name: string; content: string; type?: string; uploadedAt?: Date }>;
  mountedDrivesContext?: string;
}

interface DocumentRequestDetection {
  isDocumentRequest: boolean;
  documentType: string;
  confidence: number;
  agentType: string;
}

interface UploadedFile {
  name: string;
  content: string;
  type: string;
  uploadedAt: Date;
}

// AI Service using factory for provider switching

/**
 * Detect if user message is requesting document creation (Smart Intent Filter)
 */
function detectDocumentRequest(query: string): DocumentRequestDetection {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // 1. Filter out conversational questions, system checks, and casual inquiries
  if (/^(is|are|am|how|what|why|where|when|who|which|can we|can you explain|tell me about|do we|does|ok|hello|hi|hey)\b/i.test(trimmed) &&
      !/(?:draft|generate|prepare|create|write)\s+(?:a|an|the|me a)\s+(?:petition|brief|motion|contract|pleading|declaration)/i.test(lower)) {
    return { isDocumentRequest: false, documentType: '', confidence: 0, agentType: '' };
  }

  // 2. Specific formal document types require explicit imperative commands
  const documentTypes: Record<string, { type: string; agent: string }> = {
    'petition': { type: 'legal_petition', agent: 'legal_agent' },
    'contract': { type: 'legal_contract', agent: 'legal_agent' },
    'motion': { type: 'legal_motion', agent: 'legal_agent' },
    'brief': { type: 'legal_brief', agent: 'legal_agent' },
    'pleading': { type: 'legal_pleading', agent: 'legal_agent' },
    'declaration': { type: 'legal_declaration', agent: 'legal_agent' },
    'agreement': { type: 'legal_agreement', agent: 'legal_agent' },
    'proposal': { type: 'business_proposal', agent: 'business_agent' },
    'report': { type: 'business_report', agent: 'business_agent' },
    'memo': { type: 'business_memo', agent: 'business_agent' },
  };

  // Must have an explicit action verb: "draft a petition", "create a brief", "generate a contract", etc.
  for (const [docType, config] of Object.entries(documentTypes)) {
    const actionPattern = new RegExp(`(?:draft|generate|prepare|create|write|compose)\\s+(?:a|an|the|me a)\\s+(?:[\\w\\-]+\\s+)*${docType}`, 'i');
    if (actionPattern.test(lower) || lower.startsWith(`/${docType}`)) {
      return {
        isDocumentRequest: true,
        documentType: config.type,
        confidence: 0.95,
        agentType: config.agent
      };
    }
  }

  return { isDocumentRequest: false, documentType: '', confidence: 0, agentType: '' };
}

/**
 * Filter documents to only include those in folders linked to the current assistant
 */
export function filterDocumentsByAssistantFolders(documents: AIDocument[], assistantLinkedFolders: string[]): AIDocument[] {
  if (!assistantLinkedFolders || assistantLinkedFolders.length === 0) {
    console.log('[filterDocumentsByAssistantFolders] No linked folders, returning EMPTY array to maintain knowledge isolation');
    return []; // Changed: Return empty array instead of all documents to maintain isolation
  }
  
  const filteredDocs = documents.filter(doc => {
    const folderId = doc.folderId || '';
    const isLinked = assistantLinkedFolders.includes(folderId);
    
    // 🔥 CONTEST FIX: STRICT filtering - only documents explicitly linked to THIS assistant
    const allowAccess = isLinked && assistantLinkedFolders.length > 0;
    
    if (!allowAccess) {
      console.log(`[filterDocumentsByAssistantFolders] ❌ BLOCKING Document ID ${doc.id} (${doc.metadata?.title || doc.title || 'Untitled'}) - not in assistant's folders ${assistantLinkedFolders.join(',')}`);
    } else {
      console.log(`[filterDocumentsByAssistantFolders] ✅ ALLOWING Document ID ${doc.id} - folder access granted`);
    }
    return allowAccess;
  });
  
  console.log(`[filterDocumentsByAssistantFolders] Filtered ${documents.length} documents down to ${filteredDocs.length} based on assistant's linked folders`);
  return filteredDocs;
}

/**
 * Chat with documents using semantic search and RAG
 */
export async function chatWithDocuments(
  query: string,
  documents: AIDocument[],
  previousMessages: Message[] = [],
  options: DocumentChatOptions = {}
) {
  const {
    maxTokens = 1000,
    temperature = 0.7,
    relevanceThreshold = 0.35, // FIXED: Increased threshold to prevent irrelevant documents like REBOLLO case
    systemPrompt
  } = options;

  console.log(`[DocumentChat] Processing ${documents.length} documents for query: "${query}"`);
  console.log(`[DocumentChat] Documents with embeddings: ${documents.filter(doc => doc.embedding).length}`);
  
  // Normalize document embeddings to ensure proper format
  const normalizedDocuments = normalizeDocumentEmbeddings(documents);
  console.log(`[DocumentChat] Documents after normalization: ${normalizedDocuments.length}`);
  
  // Use the normalized documents from now on
  documents = normalizedDocuments;

  // Get embedding for the query
  const queryEmbedding = await getEmbedding(query);

  // Find relevant documents with better embedding validation
  const relevantDocs = documents
    .filter(doc => {
      // More thorough embedding check
      if (!doc.embedding) {
        console.log(`[DocumentChat] Document "${doc.metadata?.title || doc.title || 'Untitled'}" has no embedding.`);
        
        // Auto-trigger embedding generation for documents without embeddings
        try {
          // Use the properly imported store instead of dynamic import
          const store = useKnowledgeBaseStore.getState();
          if (store && doc.id) {
            console.log(`[DocumentChat] Auto-triggering embedding generation for document ${doc.id}`);
            // Use repairDocumentEmbeddings to ensure robust handling
            repairDocumentEmbeddings([doc.id]).catch(err => 
              console.error('[DocumentChat] Error repairing document embedding:', err)
            );
          }
        } catch (err) {
          console.error('[DocumentChat] Error auto-triggering embedding generation:', err);
        }
        
        return false;
      }
      
      // Check if embedding is properly formatted
      const validEmbedding = (
        (Array.isArray(doc.embedding) && doc.embedding.length > 0) || 
        (typeof doc.embedding === 'object' && Object.keys(doc.embedding).length > 0)
      );
      
      if (!validEmbedding) {
        console.log(`[DocumentChat] Document "${doc.metadata?.title || doc.title || 'Untitled'}" has invalid embedding format: ${typeof doc.embedding}, keys: ${Object.keys(doc.embedding || {}).length}`);
        return false;
      }
      
      return true;
    })
    .map(doc => {
      // Log embedding structure to debug
      if (typeof doc.embedding === 'object' && !Array.isArray(doc.embedding)) {
        console.log(`[DocumentChat] Document "${doc.metadata?.title || doc.title || 'Untitled'}" has object embedding with keys: ${Object.keys(doc.embedding || {}).join(', ')}`);
      }
      
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding!);
      console.log(`[DocumentChat] Document "${doc.metadata?.title || doc.title || 'Untitled'}" similarity: ${similarity.toFixed(3)}`);
      return { doc, similarity };
    })
    .filter(({ similarity }) => similarity > relevanceThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  console.log(`[DocumentChat] Found ${relevantDocs.length} relevant documents above threshold ${relevanceThreshold}`);

  // If no relevant documents found, use keyword-based fallback
  let docsToUse = relevantDocs;
  if (relevantDocs.length === 0 && documents.length > 0) {
    console.log(`[DocumentChat] No documents above threshold ${relevanceThreshold}, using keyword-based fallback`);
    console.log(`[DocumentChat] Possible reasons: 1) Embeddings not loaded, 2) Query too dissimilar, 3) Threshold too high`);
    console.log(`[DocumentChat] Documents available: ${documents.length}, With embeddings: ${documents.filter(doc => doc.embedding).length}`);
    
    // Use keyword-based search as a fallback
    const queryWords = query.toLowerCase().split(/\s+/)
      .filter(word => word.length > 3) // Filter out short words
      .map(word => word.replace(/[^\w]/g, '')); // Remove non-word characters
    
    if (queryWords.length > 0) {
      // Find documents that contain at least one of the important query words
      const keywordMatches = documents
        .filter(doc => doc.content && doc.content.length > 0)
        .map(doc => {
          const content = doc.content.toLowerCase();
          const matchCount = queryWords.filter(word => content.includes(word)).length;
          return { doc, matchCount };
        })
        .filter(item => item.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 3);
      
      if (keywordMatches.length > 0) {
        docsToUse = keywordMatches.map(item => ({ 
          doc: item.doc, 
          similarity: 0.1 + (0.05 * item.matchCount) // Give higher weight to more matches
        }));
        console.log(`[DocumentChat] Found ${keywordMatches.length} documents using keyword matching`);
        keywordMatches.forEach(item => {
          console.log(`[DocumentChat] Keyword match: "${item.doc.metadata?.title || item.doc.title || 'Untitled'}" with ${item.matchCount} keyword matches`);
        });
      } else {
        // If even keyword matching fails, fall back to the first document
        const firstDoc = documents.find(doc => doc.content && doc.content.trim().length > 0);
        if (firstDoc) {
          docsToUse = [{ doc: firstDoc, similarity: 0.1 }];
          console.log(`[DocumentChat] Using first document as final fallback: "${firstDoc.metadata?.title || firstDoc.title || 'Untitled'}"`);
        }
      }
    } else {
      // If no usable keywords, fall back to the first document
      const firstDoc = documents.find(doc => doc.content && doc.content.trim().length > 0);
      if (firstDoc) {
        docsToUse = [{ doc: firstDoc, similarity: 0.1 }];
        console.log(`[DocumentChat] Using first document as final fallback: "${firstDoc.metadata?.title || firstDoc.title || 'Untitled'}"`);
      }
    }
  }

  // Construct prompt with context (allow larger documents for better verbatim quotes)
  const MAX_CONTENT_LENGTH = 15000; // Increased limit to allow more complete document content
  const context = docsToUse
    .map(({ doc }) => {
      let content = doc.content || '';
      if (content.length > MAX_CONTENT_LENGTH) {
        content = content.substring(0, MAX_CONTENT_LENGTH) + '\n[...document truncated for brevity...]';
      }
      return `Document: ${doc.metadata?.title || doc.title || 'Untitled'}\n${content}\n---`;
    })
    .join('\n');
  // Incorporate attached files and mounted drives into document context dynamically (Zero Hardcoding)
  let extraAttachedBlocks = '';
  if (options?.mountedDrivesContext) {
    extraAttachedBlocks += `\n\n${options.mountedDrivesContext}\n`;
  }
  if (options?.attachedFiles && options.attachedFiles.length > 0) {
    extraAttachedBlocks += `\n\n### 📄 ATTACHED / REFERENCED FILES FROM WORKSPACE & DRIVES:\n` +
      options.attachedFiles.map((f, i) => `**Attached File ${i + 1}: ${f.name}**\n\`\`\`\n${f.content ? f.content.slice(0, 15000) : ''}\n\`\`\``).join('\n\n');
  }

  const fullDocumentContext = `${context}${extraAttachedBlocks}`;
  console.log(`[DocumentChat] Context length: ${fullDocumentContext.length} characters (includes ${options?.attachedFiles?.length || 0} attached files)`);

  const defaultSystemPrompt = `You are a highly knowledgeable AI assistant with access to both a specialized knowledge base and comprehensive general knowledge.

**🎯 CANVAS EDITING MODE - CRITICAL INSTRUCTIONS:**
When working with Canvas documents, you have two distinct response modes:
1. **SURGICAL EDIT MODE**: Make specific, targeted changes to existing content (DEFAULT)
2. **FULL REPLACEMENT MODE**: Provide complete document only when explicitly requested

**📝 SURGICAL EDIT GUIDELINES (DEFAULT BEHAVIOR):**
- For updates/corrections/improvements: Provide ONLY the sections that need changes
- Use clear markers: "EDIT SECTION: [section name]" followed by just the new content
- Do NOT reproduce unchanged content - this prevents document duplication
- Be precise about what to replace vs what to keep
- Focus on incremental improvements, not complete rewrites

**📄 FULL REPLACEMENT GUIDELINES:**
- Only when user explicitly asks for "complete document", "full rewrite", "start over", or "entire document"
- Provide the entire document with all updates incorporated
- Use marker: "FULL DOCUMENT REPLACEMENT:" at the start

**🔍 REQUEST ANALYSIS LOGIC:**
- Keywords indicating SURGICAL EDIT: "update", "change", "fix", "add to", "improve", "correct", "modify", "adjust"
- Keywords indicating FULL REPLACEMENT: "complete", "full", "entire", "rewrite", "start over", "whole document"
- DEFAULT: If unclear, use SURGICAL EDIT mode to prevent duplication

**RESPONSE METHODOLOGY:**
1. **ANALYZE REQUEST TYPE**: Determine if this is a surgical edit or full replacement request
2. **TARGETED CHANGES**: For edits, identify specific sections to modify
3. **PRECISION**: Provide only what needs to change, not the entire document
4. **CLEAR FORMATTING**: Use section headers to indicate what content replaces what

**SOURCE ATTRIBUTION REQUIREMENTS:**
- Clearly indicate information from documents: [From: Document Name]
- Distinguish general knowledge additions: [General Knowledge]
- When expanding on document content, clearly state you're providing additional context
- For direct quotes, use exact quotation marks and verbatim text reproduction

**DOCUMENTS PROVIDED:**
${fullDocumentContext}

**SURGICAL EDIT FORMAT:**
When making surgical edits, use this format:
SURGICAL EDIT MODE:

SECTION: [Section Name/Location]
REPLACE WITH:
[Only the new/changed content here]

SECTION: [Another Section if needed]
REPLACE WITH:
[Only the new/changed content here]

**RESPONSE GUIDELINES:**
- DEFAULT to SURGICAL EDIT mode unless explicitly requested otherwise
- Start surgical edit responses with: "SURGICAL EDIT MODE:"
- Start full replacement responses with: "FULL DOCUMENT REPLACEMENT:"
- Enhance with relevant general knowledge for deeper understanding
- Use clear markdown formatting with headers, lists, and sections
- Provide comprehensive analysis while maintaining accuracy
- If documents are incomplete, state what additional information would be helpful
- Always complete your thoughts fully - don't cut responses short

**CONFIDENCE LEVELS:**
- High confidence: Information directly from provided documents
- Medium confidence: General knowledge that relates to document topics
- Lower confidence: Areas where additional specific information would be needed

Remember: Your primary goal is to make precise, targeted improvements without duplicating content. Only provide full documents when explicitly requested to prevent Canvas document duplication issues.`;

  // Handle generic document questions more directly
  const isGenericDocumentQuestion = /\b(what is|about|describe|summary|summarize|this document|the document)\b/i.test(query);
  
  let enhancedQuery = query;
  if (isGenericDocumentQuestion && docsToUse.length > 0) {
    enhancedQuery = `Please provide a comprehensive analysis of the document "${docsToUse[0].doc.metadata?.title || docsToUse[0].doc.title || 'this document'}". Include:
    
1. **Document Summary**: Main purpose and key topics
2. **Detailed Analysis**: Important information and findings from the document
3. **Enhanced Context**: Additional background knowledge that helps understand the document's significance
4. **Practical Applications**: How this information might be used or applied

User's original question: ${query}

Please provide both precise information from the document and enhanced context from your knowledge to give the most complete and useful response possible.`;
  }

  // Construct the full prompt for Gemini with enhanced instructions
  const fullPrompt = `${systemPrompt || defaultSystemPrompt}

**CONVERSATION CONTEXT:**
${previousMessages.length > 0 ? previousMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n') : 'This is the start of our conversation.'}

**USER QUERY:** ${enhancedQuery}

**RESPONSE REQUIREMENTS:**
- Provide a comprehensive response combining document information with enhanced knowledge
- Use clear source attribution as specified in the system prompt
- Structure your response with appropriate markdown formatting
- Ensure completeness - don't leave thoughts unfinished
- Aim for precision combined with depth of understanding`;

  try {
    // Use AIServiceFactory for provider switching
    const aiService = AIServiceFactory.getInstance();
    console.log('🚀 DocumentChatService: Using AIServiceFactory for enhanced response');
    
    const response = await aiService.generateText(fullPrompt, {
      temperature: temperature,
      maxTokens: Math.max(maxTokens, 3000),
      systemPrompt: "You are a helpful AI assistant with access to enhanced knowledge."
    });

    console.log('✅ DocumentChatService: Enhanced response generated successfully');
    return response;
  } catch (error) {
    console.error("Error during AI API call or processing response:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Chat with documents using a specific assistant's knowledge base
 */
export async function chatWithAssistant(
  assistantId: string,
  query: string,
  previousMessages: Message[] = [],
  options: DocumentChatOptions = {}
) {
  // Get the assistant config
  let assistant = useAssistantStore.getState().getAssistantById(assistantId);
  if (!assistant) {
    console.warn(`[chatWithAssistant] Assistant ${assistantId} not found in store, using default Legal Eagle fallback`);
    assistant = {
      id: assistantId || 'asst-legal-eagle',
      name: 'Legal Eagle',
      description: 'Your expert legal research assistant.',
      system_prompt: 'You are "Legal Eagle," a specialized AI legal assistant for attorneys.',
      isActive: true,
      avatar: '/legal-eagle-icon.png',
      metadata: { tier: 'premium', category: 'professional' },
      capabilities: ['legal_research', 'document_analysis'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;
  }
  console.log(`[chatWithAssistant] Using assistant: ${assistant?.name}, ID: ${assistant?.id}`);  
  
  // 🤖 MULTI-AGENT ORCHESTRATION: Detect document creation requests
  const documentRequest = detectDocumentRequest(query);
  if (documentRequest.isDocumentRequest && documentRequest.confidence > 0.7) {
    console.log(`🎯 CANVAS ORCHESTRATOR: Detected document request - ${documentRequest.documentType} (${Math.round(documentRequest.confidence * 100)}% confidence)`);
    
    try {
      // Route to Canvas Agent Orchestrator for multi-agent collaboration
      const orchestratorResult = await masterAgentRegistry.executeAgent('canvas_document_agent', {
        userInput: query,
        documentType: documentRequest.documentType,
        agentType: documentRequest.agentType,
        description: query,
        context: {
          assistant: assistant.name,
          profession: assistant.name.toLowerCase().includes('legal') ? 'legal' : 'general',
          previousMessages: previousMessages.slice(-5) // Last 5 messages for context
        }
      });
      
      if (orchestratorResult && orchestratorResult.content) {
        console.log(`✅ CANVAS ORCHESTRATOR: Multi-agent document generation completed`);
        return {
          message: orchestratorResult.content,
          relevantDocuments: orchestratorResult.relevantDocuments || []
        };
      }
    } catch (error) {
      console.warn(`⚠️ CANVAS ORCHESTRATOR: Multi-agent processing failed, falling back to simple canvas creation:`, error);
      
      // 🎨 SIMPLE CANVAS FALLBACK: Create basic canvas document instead of standard chat
      console.log('🎨 SIMPLE CANVAS: Creating single canvas document as fallback');
      
      try {
        // Generate simple AI response for canvas using the assistant's service
        const aiService = AIServiceFactory.getInstance();
        const simplePrompt = `Create a well-structured ${documentRequest.documentType.replace('_', ' ')} document based on this request: "${query}". 
        
Format it professionally with clear sections, headings, and content suitable for legal/business use. Make it comprehensive and detailed.`;
        
        const simpleResponse = await aiService.generateText(
          simplePrompt,
          {
            temperature: 0.7,
            max_tokens: 2000
          }
        );
        
        console.log('✅ SIMPLE CANVAS: Generated document content successfully');
        
        return {
          message: simpleResponse,
          relevantDocuments: [],
          canvasAction: {
            type: 'create' as const,
            content: simpleResponse,
            title: `${documentRequest.documentType.replace('_', ' ')} - ${new Date().toLocaleDateString()}`,
            metadata: {
              documentType: documentRequest.documentType,
              created: new Date(),
              assistant: assistant.name,
              source: 'simple_canvas_fallback'
            }
          }
        };
      } catch (fallbackError) {
        console.error('❌ SIMPLE CANVAS: Fallback also failed:', fallbackError);
        // Continue to standard chat processing below
      }
    }
  }
  
  // 💳 [Subscription Gate]: Knowledge Base is PAID only
  const hasKBAccess = subscriptionService.checkAccess(PaidFeature.KNOWLEDGE_BASE, true);
  
  if (!hasKBAccess) {
    console.log(`[chatWithAssistant] Skip Knowledge Base: User on FREE tier. Using general AI response only.`);
    
    // Fallback to standard Gemini response without documents
    const aiService = AIServiceFactory.getInstance();
    const systemPrompt = assistant.system_prompt || `You are ${assistant.name}, a helpful AI assistant.`;
    
    const fullPrompt = `${systemPrompt}\n\n[SYSTEM NOTE]: Knowledge Base access is restricted to Pro Creator tier. Provide a general high-quality response to the user's query.\n\nUser Question: ${query}\n\nContext:\n${previousMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

    const messageText = await aiService.generateText(fullPrompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000,
    });

    return {
        message: messageText + "\n\n--- \n💡 *To link your documents and use the Knowledge Base, upgrade to **Pro Creator**.*",
        relevantDocuments: []
    };
  }

  // Get all documents from knowledge base store
  const allDocuments = useKnowledgeBaseStore.getState().documents;
  console.log(`[chatWithAssistant] Total documents in knowledge base: ${allDocuments.length}`);
  // Log first few documents for inspection
  console.log(`[chatWithAssistant] First 3 documents from store:`, allDocuments.slice(0,3).map(d => ({id: d.id, title: d.title, folderId: d.folderId, hasEmbedding: !!d.embedding})));
  
  // 📊 STANDARD CHAT: Continue with normal assistant chat processing
  
  // Get folder IDs assigned to this assistant
  const folderIds = assistant.knowledgeBase?.map(folder => folder.id) || [];
  console.log(`[chatWithAssistant] Folder IDs linked to assistant "${assistant.name}":`, folderIds);
  
  // Filter documents to only include those in the assistant's folders using our helper function
  // Convert KBDocument to AIDocument format for compatibility
  const aiDocuments: AIDocument[] = allDocuments.map(doc => ({
    ...doc,
    metadata: {
      source: 'knowledge_base',
      title: doc.title || 'Untitled',
      ...doc.metadata
    }
  }));
  
  const assistantDocuments = filterDocumentsByAssistantFolders(aiDocuments, folderIds);
  
  console.log(`[chatWithAssistant] Documents filtered for assistant "${assistant.name}": ${assistantDocuments.length}`);
  // Log first few filtered documents
  console.log(`[chatWithAssistant] First 3 filtered documents for assistant:`, assistantDocuments.slice(0,3).map(d => ({id: d.id, title: d.title, folderId: d.folderId})));

  // If no documents are found after filtering, search local sovereign templates and clause banks
  if (assistantDocuments.length === 0) {
    console.warn(`[chatWithAssistant] No documents found for assistant "${assistant.name}" after filtering. Linked folders: [${folderIds.join(', ')}]. Total KB docs: ${allDocuments.length}`);
    
    // 🏛️ Sovereign Sample Search: Dynamically search 00_TEMPLATES, CLAUSE_BANK, 01 CASE LAW
    const sovereignSamples = await findRelevantSovereignSamples(query);
    if (sovereignSamples.length > 0) {
      console.log(`🏛️ [chatWithAssistant] Grounded ${sovereignSamples.length} conformed sample files from disk:`, sovereignSamples.map(s => s.name));
      if (!options) options = {};
      if (!options.attachedFiles) options.attachedFiles = [];
      for (const sample of sovereignSamples) {
        if (!options.attachedFiles.some(af => af.name === sample.name)) {
          options.attachedFiles.push({
            name: sample.name,
            content: sample.content,
            type: 'text/markdown',
            uploadedAt: new Date()
          });
        }
      }
    }

    // Check if there are uploaded files in the conversation context that we can use
    const uploadedFilesContent = extractUploadedFilesFromQuery(query);
    
    if (uploadedFilesContent.length > 0) {
      console.log(`[chatWithAssistant] Found ${uploadedFilesContent.length} uploaded files in conversation context`);
      
      // Create enhanced prompt combining uploaded files with Gemini's knowledge
      const enhancedPrompt = buildEnhancedPromptWithUploads(assistant, query, previousMessages, uploadedFilesContent);
      
      try {
        const geminiResponse = await generateEnhancedResponse(enhancedPrompt, options);
        
        return {
          message: geminiResponse,
          relevantDocuments: uploadedFilesContent.map((file, index) => ({
            document: {
              id: `uploaded-${index}`,
              title: file.name,
              content: file.content.substring(0, 200) + '...',
              metadata: { 
                title: file.name,
                source: 'uploaded_file',
                uploadedAt: file.uploadedAt 
              }
            },
            similarity: 1.0, // High relevance for uploaded files
            relevanceScore: 1.0
          }))
        };
      } catch (error) {
        console.error('[chatWithAssistant] Error with enhanced response:', error);
        // Fall back to basic Gemini
      }
    }
    
    console.log(`[chatWithAssistant] No uploaded files found, proceeding with Gemini API only`);
    
    // Construct a direct prompt for Gemini without knowledge base
    let systemPrompt = assistant.system_prompt || 
      `You are ${assistant.name}, a helpful AI assistant. Provide accurate, precise answers based on your knowledge while clearly stating when you don't have specific information about a topic.`;
    
    // STYLE LEARNING: Retrieve and apply learned conversation style
    try {
      const { AssistantLearningService } = await import('./AssistantLearningService');
      const learningService = AssistantLearningService.getInstance();
      const knowledge = await learningService.getAssistantKnowledge(assistant.id);
      
      if (knowledge?.conversation_style) {
        const { tone, formality, response_length, expertise_level } = knowledge.conversation_style;
        console.log('[chatWithAssistant] Applying learned conversation style:', knowledge.conversation_style);
        
        systemPrompt += `\n\nCommunication Style Guidelines (learned from previous conversations):
- Tone: ${tone}
- Formality: ${formality}
- Response Length: ${response_length}
- Expertise Level: ${expertise_level}

IMPORTANT: Adapt your response to match this learned style. This is your personalized communication pattern.`;
      }
    } catch (styleError) {
      console.warn('[chatWithAssistant] Could not apply style learning:', styleError);
      // Continue without style learning if it fails
    }
    
    try {
      const aiService = AIServiceFactory.getInstance();

      const contextBlocks: string[] = [];

      if (options?.mountedDrivesContext) {
        contextBlocks.push(options.mountedDrivesContext);
      }

      if (options?.attachedFiles && options.attachedFiles.length > 0) {
        contextBlocks.push(`### 📄 ATTACHED / REFERENCED FILES FROM WORKSPACE & DRIVES:\n` +
          options.attachedFiles.map((f, i) => `**Document ${i + 1}: ${f.name}**\n\`\`\`\n${f.content ? f.content.slice(0, 15000) : ''}\n\`\`\``).join('\n\n')
        );
      }

      // Prune and sanitize previous messages to avoid prompt bloat and repetitive caption loops
      const formattedPrevious = (previousMessages || [])
        .slice(-6)
        .filter(msg => msg && msg.role && typeof msg.content === 'string')
        .map(msg => {
          // Truncate previous assistant drafts in conversational memory to prevent local models from getting stuck in caption loops
          const content = msg.content.length > 800 && msg.role === 'assistant'
            ? msg.content.substring(0, 500) + '\n[...previous draft truncated for context brevity...]'
            : msg.content;
          return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${content}`;
        })
        .join('\n\n');

      const isLegalAssistant = (assistant.id && assistant.id.includes('legal')) || 
                               assistant.name.toLowerCase().includes('legal') || 
                               assistant.type === 'legal';

      let promptInstructions = '';
      if (isLegalAssistant) {
        promptInstructions = `Instructions: You are Legal Eagle, an expert digital research clerk, legal technologist, and deterministic drafting assistant for California Workers' Compensation practitioners. Follow the user's instructions directly and thoroughly.
STANDARDS OF REASONING:
1. Zero Hallucination: Never fabricate or paraphrase statutory or case law citations. Quote official authorities (Labor Code § 4660, § 4622, § 5814, § 5908.5, Granado, Bland, Zemke, Escobedo) verbatim as grounded in the attached files.
2. Directness & Depth: Provide rigorous, practitioner-grade analytical depth matching conformed California appellate standards.
3. CONVERSATIONAL DIRECTIVE: If the user is asking a general inquiry, chat question, or status check, respond directly, concisely, and conversationally. ONLY draft formal legal pleadings, captions, or mock signature blocks if the user explicitly instructs you to draft a formal pleading.
4. MANDATORY FOOTER: For any analytical memo, rating worksheet, or legal research response, conclude with:
> [Notice: Preliminary research and calculation draft generated by California Workers' Comp MCP Engine. For legal/claims practitioner review only. Must be independently verified before formal citation, negotiation, or WCAB filing.]`;
      } else {
        promptInstructions = `Instructions: You are ${assistant.name}. Embody your specialized persona, core directives, and capabilities fully. Follow the user's instructions directly, strategically, and thoroughly. Focus exclusively on your domain (e.g. content creation, viral hooks, marketing strategy, platform optimization) without injecting unrelated legal or workers' compensation terminology.`;
      }

      const fullPrompt = `${systemPrompt}

${contextBlocks.length > 0 ? contextBlocks.join('\n\n') + '\n\n' : ''}Previous conversation:
${formattedPrevious}

User: ${query}

${promptInstructions}`;

      const activeLocalModel = localStorage.getItem('genieflow_local_model') || 'qwen2.5:7b';
      const messageText = await aiService.generateText(fullPrompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 4096,
        model: options?.model || (AIServiceFactory.getCurrentProvider() === 'private' ? activeLocalModel : 'gemini-2.0-flash'),
        onToken: options.onToken,
      });
      
      console.log(`[chatWithAssistant] Successfully generated response with AI service (${AIServiceFactory.getCurrentProvider()}) - no knowledge base`);
      
      // STYLE LEARNING: Store the interaction for future learning ONLY if quality gate passes
      try {
        const { AssistantLearningService, isQualityTrainingInteraction } = await import('./AssistantLearningService');
        if (isQualityTrainingInteraction(query, messageText)) {
          const learningService = AssistantLearningService.getInstance();
          await learningService.learnFromInteraction(
            assistant.id,
            query,
            messageText,
            'knowledge_base_chat'
          );
          console.log('[chatWithAssistant] Stored verified high-quality interaction for 4090 learning');
        } else {
          console.log('🛡️ [chatWithAssistant] Learning skipped: response contains fallback, error or degraded output. Protected 4090 dataset.');
        }
      } catch (learningError) {
        console.warn('[chatWithAssistant] Could not store interaction for learning:', learningError);
        // Continue without storing - don't fail the response
      }
      
      return {
        message: messageText,
        relevantDocuments: []
      };
    } catch (error) {
      console.error('[chatWithAssistant] Error generating response with AI service:', error);
      throw error;
    }
  }
  
  // Use the assistant's system prompt if available
  const systemPrompt = assistant.system_prompt;
  
  // Use the existing chat function with filtered documents
  const response = await chatWithDocuments(
    query,
    assistantDocuments,
    previousMessages,
    {
      ...options,
      systemPrompt
    }
  );
  
  // STYLE LEARNING: Store the interaction for future learning ONLY if quality gate passes
  try {
    const { AssistantLearningService, isQualityTrainingInteraction } = await import('./AssistantLearningService');
    if (isQualityTrainingInteraction(query, response)) {
      const learningService = AssistantLearningService.getInstance();
      await learningService.learnFromInteraction(
        assistant.id,
        query,
        response,
        'knowledge_base_chat_with_documents'
      );
      console.log('[chatWithAssistant] Stored verified high-quality interaction with documents for 4090 learning');
    } else {
      console.log('🛡️ [chatWithAssistant] Learning skipped: response contains fallback, error or degraded output. Protected 4090 dataset.');
    }
  } catch (learningError) {
    console.warn('[chatWithAssistant] Could not store interaction for learning:', learningError);
    // Continue without storing - don't fail the response
  }
  
  return response;
}

/**
 * Performs a hybrid search combining vector similarity with keyword matching
 * to improve document retrieval relevance
 */
export async function hybridDocumentSearch(
  query: string,
  documents: AIDocument[],
  relevanceThreshold: number = 0.4,
  keywordBoost: number = 0.2
): Promise<Array<{ doc: AIDocument, score: number }>> {
  // Get vector similarity scores
  const queryEmbedding = await getEmbedding(query);
  
  // Calculate vector similarity scores
  const vectorScores = documents
    .filter(doc => doc.embedding)
    .map(doc => {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding!);
      return { doc, similarity };
    });
    
  // Calculate keyword match scores
  const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  const keywordScores = documents.map(doc => {
    const docText = (doc.content || '').toLowerCase();
    const docTitle = (doc.metadata?.title || doc.title || '').toLowerCase();
    
    // Count keyword matches in title (weighted higher) and content
    let matchScore = 0;
    keywords.forEach(keyword => {
      // Title matches count more
      if (docTitle.includes(keyword)) matchScore += 0.5;
      
      // Content matches
      const contentMatches = (docText.match(new RegExp(keyword, 'g')) || []).length;
      matchScore += contentMatches * 0.1;
    });
    
    // Normalize score between 0 and 1
    const normalizedScore = Math.min(matchScore, 1);
    return { doc, keywordScore: normalizedScore };
  });
  
  // Combine scores
  const combinedScores = vectorScores.map(({ doc, similarity }) => {
    const keywordMatch = keywordScores.find(item => item.doc.id === doc.id);
    const keywordScore = keywordMatch ? keywordMatch.keywordScore : 0;
    
    // Combine vector similarity with keyword boost
    const combinedScore = similarity + (keywordScore * keywordBoost);
    return { doc, score: combinedScore };
  });

  // Filter, sort and limit results
  return combinedScores
    .filter(({ score }) => score > relevanceThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Calculate cosine similarity between two vectors
 * With added validation to prevent errors with invalid vectors
 * 
 * This is a wrapper around the embeddingUtils.calculateCosineSimilarity function
 * with additional pre-processing of various embedding formats
 */
function cosineSimilarity(vecA: number[] | null | undefined | Record<string, any>, vecB: number[] | null | undefined | Record<string, any>): number {
  try {
    // Use normalizeEmbedding from our utility to handle all different embedding formats
    const normalizedVecA = normalizeEmbedding(vecA);
    const normalizedVecB = normalizeEmbedding(vecB);
    
    // Log key information for debugging
    console.log(`[cosineSimilarity] Vector A length: ${normalizedVecA?.length || 0}, Vector B length: ${normalizedVecB?.length || 0}`);
    
    // Use our utility function for the actual calculation
    return calculateCosineSimilarity(normalizedVecA, normalizedVecB);
  } catch (error) {
    console.error('[cosineSimilarity] Error calculating similarity:', error);
    return 0;
  }
}

/**
 * Get relevant documents based on a query using hybrid search
 */
export async function getRelevantDocuments(query: string, documents: AIDocument[], relevanceThreshold: number = 0.4): Promise<AIDocument[]> {
  console.log(`[DocumentChat] Getting relevant documents for query: "${query}" from ${documents.length} documents`);
  
  try {
    // Use the enhanced hybrid search instead of simple cosine similarity
    const searchResults = await hybridDocumentSearch(query, documents, relevanceThreshold);
    
    console.log(`[DocumentChat] Found ${searchResults.length} relevant documents using hybrid search`);
    const relevantDocs = searchResults.map(item => item.doc);
    
    // If no relevant documents found, use the first document as fallback
    if (relevantDocs.length === 0 && documents.length > 0) {
      console.log(`[DocumentChat] No documents above threshold ${relevanceThreshold}, using first available document as fallback`);
      console.log(`[DocumentChat] Possible reasons: 1) Embeddings not loaded, 2) Query too dissimilar, 3) Threshold too high`);
      return [documents[0]];
    }
    
    return relevantDocs;
  } catch (error) {
    console.error('[DocumentChat] Error in getRelevantDocuments:', error);
    // Fallback to first document on error
    if (documents.length > 0) {
      return [documents[0]];
    }
    return [];
  }
}

/**
 * Process documents and extract reference information to enhance AI responses
 */
export async function processDocumentsWithReferences(
  query: string,
  documents: AIDocument[]
): Promise<{ 
  enhancedPrompt: string; 
  references: Array<{ title: string; snippet: string; id: string }>
}> {
  // First get the most relevant documents
  const relevantDocs = await getRelevantDocuments(query, documents);
  
  const references: Array<{ title: string; snippet: string; id: string }> = [];
  
  // For each relevant document, extract the most relevant snippets
  for (const doc of relevantDocs) {
    // If the document is too large, extract snippets based on relevance to the query
    if (doc.content && doc.content.length > 1000) {
      // Split into paragraphs or sections
      const sections = doc.content.split(/\n\n+/);
      
      // Find sections that might be most relevant to the query
      const keyTerms = query.toLowerCase().split(/\W+/).filter(term => term.length > 3);
      const relevantSections = sections
        .map(section => {
          const sectionLower = section.toLowerCase();
          // Score based on number of key terms present
          const score = keyTerms.reduce((count, term) => {
            return count + (sectionLower.includes(term) ? 1 : 0);
          }, 0);
          return { section, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2); // Get top 2 most relevant sections
      
      // Add each relevant section as a reference
      for (const { section } of relevantSections) {
        references.push({
          title: doc.metadata?.title || doc.title || 'Untitled Document',
          snippet: section.length > 300 ? section.substring(0, 300) + '...' : section,
          id: doc.id
        });
      }
    }
  }

  // Create an enhanced prompt with references
  const enhancedPrompt = `Based on the following reference materials, please provide a comprehensive answer to this query:

QUERY: ${query}

REFERENCES:
${references.slice(0, 5).map((ref, i) => `[${i+1}] ${ref.title}:\n"${ref.snippet}"\n`).join('\n')}

Please use the information from these references where relevant, and cite them in your response when you do (e.g., [1], [2], etc.). 
If the references don't fully answer the query, please indicate what additional information would be helpful.`;

  return { 
    enhancedPrompt, 
    references: references.slice(0, 5) // Limit to top 5 references
  };
}

/**
 * Extract uploaded files content from query context
 */
function extractUploadedFilesFromQuery(query: string): UploadedFile[] {
  const uploadedFiles: UploadedFile[] = [];
  
  // Look for uploaded files markers in the query
  const filePattern = /📄 \*\*(.*?)\*\* \(uploaded (.*?)\)\n([\s\S]*?)(?=📄|--- END|$)/g;
  let match;
  
  while ((match = filePattern.exec(query)) !== null) {
    const [, fileName, uploadedAt, content] = match;
    uploadedFiles.push({
      name: fileName,
      content: content.trim(),
      type: fileName.toLowerCase().includes('.pdf') ? 'pdf' : 'text',
      uploadedAt: new Date(uploadedAt)
    });
  }
  
  return uploadedFiles;
}

/**
 * Build enhanced prompt combining uploaded files with Gemini's knowledge
 */
function buildEnhancedPromptWithUploads(
  assistant: any,
  query: string,
  previousMessages: Message[],
  uploadedFiles: UploadedFile[]
): string {
  const systemPrompt = assistant.system_prompt || 
    `You are ${assistant.name}, a precise and knowledgeable AI assistant.`;

  return `${systemPrompt}

**IMPORTANT INSTRUCTIONS:**
1. **PRIMARY SOURCES**: Base your response primarily on the uploaded documents provided below
2. **ENHANCED ANALYSIS**: Use your knowledge to provide context, explanations, and additional insights
3. **ACCURACY**: Be precise and factual, clearly citing when information comes from uploaded documents vs. your general knowledge
4. **CLARITY**: Structure your response with clear sections and source attribution

**UPLOADED DOCUMENTS:**
${uploadedFiles.map((file, index) => `
**Document ${index + 1}: ${file.name}**
Upload Date: ${file.uploadedAt.toLocaleString()}
Content:
${file.content}
---`).join('\n')}

**CONVERSATION HISTORY:**
${previousMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

**USER QUERY:** ${query.replace(/📄.*?---/g, '').replace(/\*\*Note\*\*:.*$/, '').trim()}

**RESPONSE REQUIREMENTS:**
- Start with information directly from the uploaded documents
- Enhance with your knowledge for deeper understanding
- Clearly indicate sources: [From uploaded document] vs [General knowledge]
- Provide comprehensive analysis while maintaining accuracy
- If the query cannot be fully answered from uploaded documents, state what additional information would be helpful

Please provide a thorough, well-structured response that combines the precision of the uploaded documents with the depth of your knowledge.`;
}

/**
 * Generate enhanced response using Gemini with both documents and general knowledge
 */
async function generateEnhancedResponse(prompt: string, options: DocumentChatOptions = {}): Promise<string> {
  const aiService = AIServiceFactory.getInstance();
  
  const messageText = await aiService.generateText(prompt, {
    temperature: options.temperature || 0.3, // Lower temperature for more precise responses
    maxTokens: options.maxTokens || 3000, // Allow longer responses for comprehensive analysis
  });
  
  return messageText;
}

/**
 * Utility function to inspect and normalize embeddings in documents
 * This helps ensure embeddings are in the right format before similarity calculations
 * 
 * This now uses the validateDocumentEmbeddings function from our embeddingUtils
 */
export function normalizeDocumentEmbeddings(documents: AIDocument[]): AIDocument[] {
  console.log(`[normalizeDocumentEmbeddings] Inspecting ${documents.length} documents`);
  
  // Use our validated utility function to handle all the normalization
  const normalizedDocs = validateDocumentEmbeddings(documents);
  
  // Log some information about the results
  const withEmbeddings = normalizedDocs.filter(doc => doc.embedding).length;
  console.log(`[normalizeDocumentEmbeddings] Normalized ${documents.length} documents, ${withEmbeddings} have valid embeddings`);
  
  return normalizedDocs;
}

/**
 * 🏛️ Scan local conformed templates, clause banks, and case law for relevant samples
 */
async function findRelevantSovereignSamples(query: string): Promise<Array<{ name: string; content: string; path: string }>> {
  const results: Array<{ name: string; content: string; path: string }> = [];
  try {
    const bridge = typeof window !== 'undefined' ? (window as any).electronBridge : null;
    const queryLower = query.toLowerCase();
    const stopWords = new Set(['what', 'does', 'did', 'tell', 'show', 'how', 'why', 'where', 'when', 'who', 'which', 'about', 'with', 'this', 'that', 'from', 'have', 'been', 'they', 'will', 'would', 'could', 'should', 'your', 'our', 'the', 'and', 'for', 'any', 'can', 'you', 'please', 'give', 'me', 'a', 'an']);
    const tokens = queryLower.split(/[\s,_\-./?!=+()[\]'"]+/).filter(t => t.length >= 3 && !stopWords.has(t));

    // Dynamically discover candidate folders from attached drives & workspace (Zero Hardcoded Drive Letters)
    const candidateFolders: string[] = ['AI_GENERATED_DOCS', '.agents/workflows'];
    try {
      const { useAttachedDriveStore } = await import('../store/attachedDriveStore');
      const attachedDrives = useAttachedDriveStore.getState().drives || [];
      for (const d of attachedDrives) {
        if (d.rootPath) {
          candidateFolders.push(d.rootPath);
          candidateFolders.push(`${d.rootPath}/.GENIEFLOW_MASTER/00_TEMPLATES`);
          candidateFolders.push(`${d.rootPath}/.GENIEFLOW_MASTER/00_TEMPLATES/CLAUSE_BANK`);
          candidateFolders.push(`${d.rootPath}/00_TEMPLATES`);
          candidateFolders.push(`${d.rootPath}/00_TEMPLATES/CLAUSE_BANK`);
        }
      }
    } catch {}

    if (bridge?.fs?.listFiles && bridge?.fs?.readFile) {
      for (const folder of candidateFolders) {
        try {
          const listRes = await bridge.fs.listFiles({ path: folder });
          if (listRes?.success && Array.isArray(listRes.files)) {
            for (const file of listRes.files) {
              if (file.isDirectory) continue;
              const fName = file.name || '';
              const fNameLower = fName.toLowerCase();
              if (!fNameLower.endsWith('.md')) continue;

              let score = 0;
              // Direct match
              if (queryLower.includes('sample') || queryLower.includes('template') || queryLower.includes('example')) {
                score += 2;
              }
              for (const token of tokens) {
                if (fNameLower.includes(token)) score += 5;
              }
              if (score >= 4) {
                try {
                  const readRes = await bridge.fs.readFile({ path: file.path || `${folder}/${fName}` });
                  if (readRes?.success && typeof readRes.content === 'string') {
                    results.push({
                      name: fName,
                      path: file.path || `${folder}/${fName}`,
                      content: readRes.content
                    });
                  }
                } catch {}
              }
            }
          }
        } catch {}
      }
    }

    // Also check attachedDriveStore
    try {
      const { useAttachedDriveStore } = await import('../store/attachedDriveStore');
      const driveStore = useAttachedDriveStore.getState();
      const drives = driveStore.drives || [];
      const searchNodes = async (nodes: any[]) => {
        if (!nodes) return;
        for (const n of nodes) {
          if (!n.isFolder && n.name?.endsWith('.md') && !results.some(r => r.name === n.name)) {
            const nLower = (n.name || '').toLowerCase();
            let score = 0;
            for (const token of tokens) {
              if (nLower.includes(token)) score += 4;
            }
            if (score >= 4) {
              try {
                const content = await driveStore.readFileContent(n);
                if (content && !content.startsWith('[Preview:')) {
                  results.push({ name: n.name, path: n.path, content });
                }
              } catch {}
            }
          }
          if (n.children && n.children.length > 0) await searchNodes(n.children);
        }
      };
      for (const d of drives) await searchNodes(d.items);
    } catch {}

    // Return top 3 most relevant sample files
    return results.slice(0, 3);
  } catch (err) {
    console.warn('⚠️ [findRelevantSovereignSamples] Error scanning sovereign samples:', err);
    return [];
  }
}