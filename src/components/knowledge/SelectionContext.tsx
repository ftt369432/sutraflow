/**
 * This file is a compatibility layer to redirect to EnhancedSelectionContext
 * This ensures existing components referencing the old SelectionContext still work
 */
import { 
  SelectionProvider as EnhancedSelectionProvider,
  useSelection as useEnhancedSelection 
} from './EnhancedSelectionContext';

// Re-export the provider and hook
export const SelectionProvider = EnhancedSelectionProvider;
export const useSelection = useEnhancedSelection;

// Adapter layer for compatibility with old code
export function useSelectionCompat() {
  const {
    selectedDocuments,
    selectedFolders,
    toggleSelectDocument,
    toggleSelectFolder,
    clearSelection,
    isDocumentSelected,
    isFolderSelected,
    selectAllDocuments,
    selectAllFolders
  } = useEnhancedSelection();
  
  // Convert arrays to Set for backward compatibility
  const selectedDocsSet = new Set(selectedDocuments);
  const selectedFoldersSet = new Set(selectedFolders);
  
  // Create adapter functions to match old API
  const toggleSelection = (id: string, type: 'document' | 'folder') => {
    if (type === 'document') {
      toggleSelectDocument(id);
    } else {
      toggleSelectFolder(id);
    }
  };
  
  const isSelected = (id: string, type: 'document' | 'folder') => {
    return type === 'document' ? isDocumentSelected(id) : isFolderSelected(id);
  };
  
  return {
    selectedDocuments: selectedDocsSet,
    selectedFolders: selectedFoldersSet,
    toggleSelection,
    clearSelection,
    isSelected,
    selectAllDocuments,
    selectAllFolders
  };
}

// This function is replaced by the re-export above