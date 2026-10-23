/**
 * Chat Commands Hook
 * 
 * Detects and executes chat commands for document operations.
 * Enables natural language commands like "open my petition document".
 */

import { useCallback } from 'react';
import { useConversationDocumentStore } from '../stores/conversationDocumentStore';

export interface ChatCommand {
  type: 'open-ai-drive-file' | 'open-document' | 'list-documents' | 'close-document' | 'create-document';
  fileName?: string;
  documentId?: string;
  documentType?: string;
  originalMessage: string;
  confidence: number;
}

export const useChatCommands = () => {
  const { getDocumentsForConversation, getAllDocuments } = useConversationDocumentStore();

  const detectChatCommand = useCallback((message: string, conversationId?: string): ChatCommand | null => {
    const lowerMessage = message.toLowerCase();

    // Command: Open file from AI Drive
    if (lowerMessage.includes('open file') || 
        lowerMessage.includes('load file') ||
        lowerMessage.includes('edit document') ||
        lowerMessage.includes('open document from') ||
        lowerMessage.includes('load from ai drive') ||
        lowerMessage.includes('browse files')) {
      
      // Extract quoted file name
      const fileNameMatch = message.match(/"([^"]+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : null;
      
      return {
        type: 'open-ai-drive-file',
        fileName,
        originalMessage: message,
        confidence: 0.9
      };
    }

    // Command: Open existing document from conversation
    if (lowerMessage.includes('open my') || 
        lowerMessage.includes('edit my') ||
        lowerMessage.includes('show my') ||
        lowerMessage.includes('continue working on')) {
      
      // Extract document type or name
      const documentTypes = ['petition', 'letter', 'document', 'plan', 'brief', 'motion', 'contract'];
      const foundType = documentTypes.find(type => lowerMessage.includes(type));
      
      // Look for specific document name in quotes
      const nameMatch = message.match(/"([^"]+)"/);
      const documentName = nameMatch ? nameMatch[1] : null;
      
      return {
        type: 'open-document',
        fileName: documentName,
        documentType: foundType,
        originalMessage: message,
        confidence: 0.85
      };
    }

    // Command: List documents
    if (lowerMessage.includes('list my documents') ||
        lowerMessage.includes('show my documents') ||
        lowerMessage.includes('what documents') ||
        lowerMessage.includes('my files')) {
      
      return {
        type: 'list-documents',
        originalMessage: message,
        confidence: 0.9
      };
    }

    // Command: Close document
    if (lowerMessage.includes('close document') ||
        lowerMessage.includes('close the') ||
        lowerMessage.includes('close file')) {
      
      const nameMatch = message.match(/"([^"]+)"/);
      const fileName = nameMatch ? nameMatch[1] : null;
      
      return {
        type: 'close-document',
        fileName,
        originalMessage: message,
        confidence: 0.8
      };
    }

    // Command: Create new document
    if (lowerMessage.includes('create new') ||
        lowerMessage.includes('new document') ||
        lowerMessage.includes('start a new') ||
        lowerMessage.includes('draft a new')) {
      
      const documentTypes = ['petition', 'letter', 'document', 'plan', 'brief', 'motion', 'contract'];
      const foundType = documentTypes.find(type => lowerMessage.includes(type));
      
      return {
        type: 'create-document',
        documentType: foundType || 'document',
        originalMessage: message,
        confidence: 0.85
      };
    }

    return null;
  }, []);

  const executeCommand = useCallback(async (
    command: ChatCommand, 
    handlers: {
      onOpenAIDriveFile?: () => void;
      onOpenDocument?: (documentId: string) => void;
      onListDocuments?: () => string;
      onCloseDocument?: (documentId: string) => void;
      onCreateDocument?: (type: string) => void;
    },
    conversationId?: string
  ): Promise<string | null> => {
    
    console.log('🎯 Executing chat command:', command);

    switch (command.type) {
      case 'open-ai-drive-file':
        if (handlers.onOpenAIDriveFile) {
          handlers.onOpenAIDriveFile();
          return `Opening AI Drive file browser${command.fileName ? ` to find "${command.fileName}"` : ''}...`;
        }
        break;

      case 'open-document':
        if (conversationId) {
          const conversationDocs = getDocumentsForConversation(conversationId);
          let targetDoc = null;

          if (command.fileName) {
            // Find by exact name match
            targetDoc = conversationDocs.find(doc => 
              doc.documentTitle.toLowerCase().includes(command.fileName!.toLowerCase())
            );
          } else if (command.documentType) {
            // Find by document type
            targetDoc = conversationDocs.find(doc => 
              doc.documentType.toLowerCase().includes(command.documentType!.toLowerCase()) ||
              doc.documentTitle.toLowerCase().includes(command.documentType!.toLowerCase())
            );
          }

          if (targetDoc) {
            if (handlers.onOpenDocument) {
              handlers.onOpenDocument(targetDoc.documentId);
              return `Opening "${targetDoc.documentTitle}"...`;
            }
          } else {
            return `I couldn't find a ${command.documentType || 'document'} in this conversation. Would you like me to open the AI Drive file browser to search for it?`;
          }
        }
        break;

      case 'list-documents':
        if (conversationId) {
          const conversationDocs = getDocumentsForConversation(conversationId);
          if (conversationDocs.length === 0) {
            return "You don't have any documents in this conversation yet.";
          }
          
          const docList = conversationDocs
            .map((doc, index) => `${index + 1}. **${doc.documentTitle}** (${doc.documentType})`)
            .join('\n');
          
          return `Here are your documents in this conversation:\n\n${docList}\n\nSay "open [document name]" to edit any of these documents.`;
        } else {
          const allDocs = getAllDocuments();
          if (allDocs.length === 0) {
            return "You don't have any documents yet.";
          }
          
          const docList = allDocs
            .slice(0, 10) // Limit to recent 10
            .map((doc, index) => `${index + 1}. **${doc.documentTitle}** (${doc.documentType})`)
            .join('\n');
          
          return `Here are your recent documents:\n\n${docList}\n\n${allDocs.length > 10 ? `...and ${allDocs.length - 10} more.` : ''}\n\nSay "open [document name]" to edit any document.`;
        }
        break;

      case 'close-document':
        // Implementation would depend on current canvas state
        if (handlers.onCloseDocument && command.fileName) {
          // Find document ID by name and close it
          // This would need integration with canvas state
        }
        return `Closing document${command.fileName ? ` "${command.fileName}"` : ''}...`;

      case 'create-document':
        if (handlers.onCreateDocument) {
          handlers.onCreateDocument(command.documentType || 'document');
          return `Creating new ${command.documentType || 'document'}...`;
        }
        break;
    }

    return null;
  }, [getDocumentsForConversation, getAllDocuments]);

  return {
    detectChatCommand,
    executeCommand
  };
};

export default useChatCommands;