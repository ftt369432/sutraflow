import React, { createContext, useState, useContext, useCallback } from 'react';

interface SelectionSet extends Array<string> {
  size: number;
}

interface SelectionContextType {
  selectedFolders: SelectionSet;
  selectedDocuments: SelectionSet;
  selectFolder: (id: string) => void;
  unselectFolder: (id: string) => void;
  selectDocument: (id: string) => void;
  unselectDocument: (id: string) => void;
  clearSelection: () => void;
  toggleSelectFolder: (id: string) => void;
  toggleSelectDocument: (id: string) => void;
  selectAllFolders: (ids: string[]) => void;
  selectAllDocuments: (ids: string[]) => void;
  selectAll: (folderIds: string[], documentIds: string[]) => void;
  deselectAll: () => void;
  isDocumentSelected: (id: string) => boolean;
  isFolderSelected: (id: string) => boolean;
  hasSelection: boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Create Set-like arrays with size property
  const createSelectionSet = (arr: string[]): SelectionSet => {
    const copy = [...arr] as SelectionSet;
    copy.size = arr.length;
    return copy;
  };

  const selectFolder = useCallback((id: string) => {
    setSelectedFolders(prev => [...prev, id]);
  }, []);

  const unselectFolder = useCallback((id: string) => {
    setSelectedFolders(prev => prev.filter(folderId => folderId !== id));
  }, []);

  const selectDocument = useCallback((id: string) => {
    setSelectedDocuments(prev => [...prev, id]);
  }, []);

  const unselectDocument = useCallback((id: string) => {
    setSelectedDocuments(prev => prev.filter(docId => docId !== id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFolders([]);
    setSelectedDocuments([]);
  }, []);

  const toggleSelectFolder = useCallback((id: string) => {
    setSelectedFolders(prev => 
      prev.includes(id) ? prev.filter(folderId => folderId !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectDocument = useCallback((id: string) => {
    setSelectedDocuments(prev => 
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  }, []);

  const selectAllFolders = useCallback((ids: string[]) => {
    setSelectedFolders(ids);
  }, []);

  const selectAllDocuments = useCallback((ids: string[]) => {
    setSelectedDocuments(ids);
  }, []);

  const selectAll = useCallback((folderIds: string[], documentIds: string[]) => {
    setSelectedFolders(folderIds);
    setSelectedDocuments(documentIds);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedFolders([]);
    setSelectedDocuments([]);
  }, []);

  const isDocumentSelected = useCallback((id: string) => {
    return selectedDocuments.includes(id);
  }, [selectedDocuments]);

  const isFolderSelected = useCallback((id: string) => {
    return selectedFolders.includes(id);
  }, [selectedFolders]);

  const hasSelection = selectedFolders.length > 0 || selectedDocuments.length > 0;
  
  // Calculate total selection size for compatibility with old code
  const selectionSize = selectedFolders.length + selectedDocuments.length;

  return (
    <SelectionContext.Provider value={{
      selectedFolders: createSelectionSet(selectedFolders),
      selectedDocuments: createSelectionSet(selectedDocuments),
      selectFolder,
      unselectFolder,
      selectDocument,
      unselectDocument,
      clearSelection,
      toggleSelectFolder,
      toggleSelectDocument,
      selectAllFolders,
      selectAllDocuments,
      selectAll,
      deselectAll,
      isDocumentSelected,
      isFolderSelected,
      hasSelection
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
