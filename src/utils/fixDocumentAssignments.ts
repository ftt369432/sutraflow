/**
 * Bulk Document Assignment Fix for AI Chat References
 * 
 * This script fixes the issue where AI chat references aren't showing up
 * because legal documents aren't properly linked to the Legal Eagle assistant.
 * 
 * Run this in the Knowledge Base page to bulk assign legal documents
 * to the correct assistant folders.
 */

import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { useAssistantStore } from '../store/assistantStore';

// Legal Eagle assistant ID from console logs
const LEGAL_ASSISTANT_ID = '6060b777-66f1-42c9-aa5c-80c91145a9c8';

// Keywords to identify legal documents
const LEGAL_KEYWORDS = [
  // General legal terms
  'wcab', 'workers compensation', 'labor code', 'opinion and order',
  'petition for reconsideration', 'decision after reconsideration',
  'applicant', 'defendant', 'workers comp', 'case no', 'adj',
  'appeal', 'trial brief', 'adjudication', 'hearing',
  
  // Specific case names and legal references
  'verdeja', 'rebollo', 'natalie', 'medvin', 'juarez', 'osuna',
  'nava', 'young', 'lee', 'grosch', 'ledezma', 'luque',
  'hernandez', 'alcaraz', 'costa', 'hardy', 'petty',
  'gilliland', 'moreno', 'cuevas', 'silva',
  
  // Legal document types
  'brief', 'motion', 'petition', 'application', 'order',
  'decision', 'opinion', 'reconsideration', 'grant',
  'deny', 'award', 'compensation', 'disability'
];

/**
 * Identifies if a document is likely a legal document
 */
function isLegalDocument(doc: any): boolean {
  const title = (doc.metadata?.title || doc.title || '').toLowerCase();
  const content = doc.content.toLowerCase();
  
  // Check if any legal keywords appear in title or content
  return LEGAL_KEYWORDS.some(keyword => 
    title.includes(keyword) || content.includes(keyword)
  );
}

/**
 * Creates a legal documents folder if one doesn't exist
 */
function createLegalFolder() {
  const { folders, addFolder } = useKnowledgeBaseStore.getState();
  
  // Check if a legal folder already exists
  let legalFolder = folders.find(folder => 
    folder.name.toLowerCase().includes('legal') || 
    folder.name.toLowerCase().includes('workers') ||
    folder.name.toLowerCase().includes('comp') ||
    folder.name.toLowerCase().includes('wcab')
  );
  
  if (!legalFolder) {
    const newFolderId = `legal-docs-${Date.now()}`;
    legalFolder = {
      id: newFolderId,
      name: 'Legal Documents',
      description: 'Legal cases, decisions, and workers compensation documents',
      assistantIds: [], // Added to satisfy KBFolder interface
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null
    };
    
    addFolder(legalFolder);
    console.log('✅ Created Legal Documents folder:', newFolderId);
  }
  
  return legalFolder;
}

/**
 * Assigns the legal folder to the Legal Eagle assistant
 */
function assignFolderToLegalAssistant(folderId: string) {
  const { assignFolderToAssistant, getAssistantFolders } = useAssistantStore.getState();
  
  // Check if folder is already assigned
  const assignedFolders = getAssistantFolders(LEGAL_ASSISTANT_ID);
  if (!assignedFolders.includes(folderId)) {
    assignFolderToAssistant(LEGAL_ASSISTANT_ID, folderId);
    console.log('🔗 Assigned folder to Legal Eagle assistant');
    return true;
  }
  
  return false;
}

/**
 * Moves legal documents to the legal folder
 */
function moveLegalDocuments(legalFolderId: string) {
  const { documents, moveDocument } = useKnowledgeBaseStore.getState();
  
  // Find legal documents that need to be moved
  const legalDocuments = documents.filter(doc => isLegalDocument(doc));
  const documentsToMove = legalDocuments.filter(doc => doc.folderId !== legalFolderId);
  
  console.log(`📄 Found ${legalDocuments.length} legal documents`);
  console.log(`📦 Moving ${documentsToMove.length} documents to Legal folder...`);
  
  // Move documents
  let movedCount = 0;
  documentsToMove.forEach(doc => {
    try {
      moveDocument(doc.id, legalFolderId);
      movedCount++;
      
      if (movedCount % 10 === 0) {
        console.log(`📄 Moved ${movedCount}/${documentsToMove.length} documents...`);
      }
    } catch (error) {
      console.error(`❌ Error moving document ${doc.id}:`, error);
    }
  });
  
  return { total: legalDocuments.length, moved: movedCount };
}

/**
 * Main function to fix document assignments
 */
export function fixLegalDocumentAssignments() {
  console.log('🔧 Starting Legal Document Assignment Fix...');
  
  try {
    // Step 1: Verify Legal Eagle assistant exists
    const { getAssistantById } = useAssistantStore.getState();
    const legalAssistant = getAssistantById(LEGAL_ASSISTANT_ID);
    
    if (!legalAssistant) {
      console.error('❌ Legal Eagle assistant not found with ID:', LEGAL_ASSISTANT_ID);
      console.log('💡 Please check if the assistant exists or update the ID in this script');
      return;
    }
    
    console.log('✅ Found Legal Eagle assistant:', legalAssistant.name);
    
    // Step 2: Create or find legal folder
    const legalFolder = createLegalFolder();
    console.log('📁 Legal folder ready:', legalFolder.name);
    
    // Step 3: Assign folder to assistant
    const folderAssigned = assignFolderToLegalAssistant(legalFolder.id);
    if (folderAssigned) {
      console.log('🔗 Folder successfully assigned to assistant');
    } else {
      console.log('ℹ️ Folder was already assigned to assistant');
    }
    
    // Step 4: Move legal documents
    const moveResults = moveLegalDocuments(legalFolder.id);
    
    // Step 5: Verification
    console.log('🔍 Assignment Results:');
    console.log(`- Total legal documents: ${moveResults.total}`);
    console.log(`- Documents moved: ${moveResults.moved}`);
    console.log(`- Legal folder ID: ${legalFolder.id}`);
    
    // Step 6: Show examples of documents that were processed
    const { documents } = useKnowledgeBaseStore.getState();
    const legalDocsInFolder = documents.filter(doc => 
      doc.folderId === legalFolder.id && isLegalDocument(doc)
    );
    
    console.log('📋 Examples of legal documents now in folder:');
    legalDocsInFolder.slice(0, 5).forEach(doc => {
      const title = doc.metadata?.title || doc.title || 'Untitled';
      console.log(`  - ${title}`);
    });
    
    console.log('✨ Legal document assignment fix completed!');
    console.log('🎯 The AI should now be able to reference these documents in chat.');
    console.log('💡 Try asking about "Verdeja case" or other legal matters to test.');
    
    return {
      success: true,
      totalDocuments: moveResults.total,
      movedDocuments: moveResults.moved,
      legalFolderId: legalFolder.id,
      assistantId: LEGAL_ASSISTANT_ID
    };
    
  } catch (error) {
    console.error('❌ Error during document assignment fix:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Function to verify the current state of document assignments
 */
export function verifyDocumentAssignments() {
  console.log('🔍 Verifying document assignments...');
  
  const { documents, folders } = useKnowledgeBaseStore.getState();
  const { getAssistantById, getAssistantFolders } = useAssistantStore.getState();
  
  // Check assistant
  const assistant = getAssistantById(LEGAL_ASSISTANT_ID);
  if (!assistant) {
    console.log('❌ Legal Eagle assistant not found');
    return;
  }
  
  // Check assigned folders
  const assignedFolders = getAssistantFolders(LEGAL_ASSISTANT_ID);
  console.log(`📁 Assistant has ${assignedFolders.length} assigned folders`);
  
  // Check legal documents
  const legalDocs = documents.filter(doc => isLegalDocument(doc));
  const linkedLegalDocs = legalDocs.filter(doc => 
    doc.folderId && assignedFolders.includes(doc.folderId)
  );
  
  console.log(`⚖️ Total legal documents: ${legalDocs.length}`);
  console.log(`🔗 Legal documents linked to assistant: ${linkedLegalDocs.length}`);
  console.log(`❌ Unlinked legal documents: ${legalDocs.length - linkedLegalDocs.length}`);
  
  // Show folder breakdown
  assignedFolders.forEach(folderId => {
    const folder = folders.find(f => f.id === folderId);
    const docsInFolder = documents.filter(doc => doc.folderId === folderId);
    console.log(`📂 ${folder?.name || 'Unknown'}: ${docsInFolder.length} documents`);
  });
  
  return {
    assistantFound: !!assistant,
    assignedFolders: assignedFolders.length,
    totalLegalDocs: legalDocs.length,
    linkedLegalDocs: linkedLegalDocs.length,
    unlinkeddocs: legalDocs.length - linkedLegalDocs.length
  };
}

// Export for console use
if (typeof window !== 'undefined') {
  (window as any).fixLegalDocumentAssignments = fixLegalDocumentAssignments;
  (window as any).verifyDocumentAssignments = verifyDocumentAssignments;
}

console.log('📋 Legal Document Assignment Tools loaded!');
console.log('🚀 Usage:');
console.log('  - fixLegalDocumentAssignments() - Fix document assignments');
console.log('  - verifyDocumentAssignments() - Check current state');
