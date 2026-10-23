// Auto-fix script for AI chat references
// This will automatically run when the Knowledge Base loads

export const autoFixDocumentLinks = () => {
  console.log('🔧 Auto-fix: Starting document linking process...');
  
  // Wait for stores to be available
  const checkAndFix = () => {
    try {
      const knowledgeStore = window?.useKnowledgeBaseStore?.getState?.();
      
      if (!knowledgeStore) {
        console.log('⏳ Auto-fix: Waiting for Knowledge Base store...');
        setTimeout(checkAndFix, 1000);
        return;
      }

      const docs = knowledgeStore.documents || [];
      const assistants = knowledgeStore.assistants || [];
      
      console.log(`📊 Auto-fix: Found ${docs.length} documents and ${assistants.length} assistants`);
      
      // Find Legal Eagle assistant
      const legalEagle = assistants.find(a => 
        a.name.includes('Legal') || 
        a.id === '6060b777-66f1-42c9-aa5c-80c91145a9c8'
      );
      
      if (!legalEagle) {
        console.log('❌ Auto-fix: Legal Eagle assistant not found');
        return;
      }
      
      console.log(`✅ Auto-fix: Found Legal Eagle assistant: ${legalEagle.name}`);
      
      // Link ALL documents to Legal Eagle for comprehensive coverage
      let linkedCount = 0;
      const updatedDocs = docs.map(doc => {
        if (!doc.assistantIds?.includes(legalEagle.id)) {
          linkedCount++;
          return {
            ...doc,
            assistantIds: [...(doc.assistantIds || []), legalEagle.id]
          };
        }
        return doc;
      });
      
      if (linkedCount > 0) {
        knowledgeStore.setDocuments(updatedDocs);
        console.log(`🎉 Auto-fix: Successfully linked ${linkedCount} documents to Legal Eagle!`);
        console.log('📋 Auto-fix: AI chat references should now appear at the bottom of responses');
        
        // Also update localStorage to persist the fix
        localStorage.setItem('DOCUMENT_LINKS_FIXED', 'true');
        localStorage.setItem('LAST_FIX_DATE', new Date().toISOString());
      } else {
        console.log('ℹ️ Auto-fix: All documents already linked to Legal Eagle');
      }
      
    } catch (error) {
      console.error('❌ Auto-fix error:', error);
      setTimeout(checkAndFix, 2000); // Retry after 2 seconds
    }
  };
  
  // Start the auto-fix process
  setTimeout(checkAndFix, 500);
};

// Auto-run when this module loads
if (typeof window !== 'undefined') {
  // Run immediately
  autoFixDocumentLinks();
  
  // Also run when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoFixDocumentLinks);
  }
  
  // Run when Knowledge Base store becomes available
  const watchForStore = () => {
    if (window?.useKnowledgeBaseStore) {
      autoFixDocumentLinks();
    } else {
      setTimeout(watchForStore, 500);
    }
  };
  watchForStore();
}
