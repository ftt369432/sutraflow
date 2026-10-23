import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Button } from '@/components/ui/Button';
import { AIAssistant, AIDocument } from '@/types/ai';
// Assuming GenieDriveKnowledgeBaseService is for managing the KB structure, not direct linking here.
// import { GenieDriveKnowledgeBaseService } from '@/services/genieDriveKnowledgeBaseService'; 
import { useKnowledgeBaseStore } from '@/store/knowledgeBaseStore';
import { useAssistantStore } from '@/store/assistantStore'; // Import useAssistantStore
import { PlusCircle, Trash2, FolderOpen } from 'lucide-react'; // Added FolderOpen

interface KnowledgeTabContentProps {
  assistant: AIAssistant;
}

const KnowledgeTabContent: React.FC<KnowledgeTabContentProps> = ({ assistant }) => {
  // const [linkedDocuments, setLinkedDocuments] = useState<AIDocument[]>([]); // Replaced by useMemo
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  // const knowledgeBaseService = GenieDriveKnowledgeBaseService.getInstance(); // Likely not needed for just displaying
  
  const allDocuments = useKnowledgeBaseStore(state => state.documents);
  const allFolders = useKnowledgeBaseStore(state => state.folders); // Get all folders
  const getAssistantFolderIds = useAssistantStore(state => state.getAssistantFolders); // Get the function to retrieve linked folder IDs

  const linkedDocuments = useMemo(() => {
    if (!assistant) return [];
    const assistantFolderIds = getAssistantFolderIds(assistant.id);
    if (!assistantFolderIds || assistantFolderIds.length === 0) return [];

    return allDocuments.filter(doc => doc.folderId && assistantFolderIds.includes(doc.folderId));
  }, [assistant, getAssistantFolderIds, allDocuments]);

  const linkedFolderNames = useMemo(() => {
    if (!assistant) return 'None';
    const assistantFolderIds = getAssistantFolderIds(assistant.id);
    if (!assistantFolderIds || assistantFolderIds.length === 0) return 'None';
    
    const names = assistantFolderIds.map(folderId => {
      const folder = allFolders.find(f => f.id === folderId);
      return folder ? folder.name : 'Unknown Folder';
    }).join(', ');
    return names || 'None';
  }, [assistant, getAssistantFolderIds, allFolders]);


  // useEffect(() => {
  //   // Previous logic for fetching/filtering linked documents is now handled by useMemo
  //   // This useEffect might still be needed if linking/unlinking triggers a re-fetch from a service
  //   // For now, assuming the stores are up-to-date.
  //   console.log(`Knowledge for ${assistant.name}: ${linkedDocuments.length} documents from folders: ${linkedFolderNames}`);
  // }, [assistant.name, linkedDocuments, linkedFolderNames]);

  const handleLinkNewSource = () => {
    setIsLinkingModalOpen(true);
    console.warn('Open AI Drive content picker for assistant:', assistant.name);
    // This should ideally open a modal that uses components from the main Knowledge Base page
    // or a dedicated file/folder picker that can interact with useKnowledgeBaseStore and useAssistantStore
    // to link folders to the assistant.
  };

  const handleUnlinkSource = async (documentId: string) => {
    // This function would typically unlink a document. 
    // However, the current setup links FOLDERS to assistants, not individual documents directly.
    // So, unlinking should happen at the folder level, perhaps in a different UI.
    // For now, this function is a placeholder if direct document unlinking becomes a feature.
    console.warn('Attempting to unlink document (not standard flow):', documentId, 'from assistant:', assistant.name);
    // To implement actual unlinking of a document (if it were directly linked):
    // 1. Call a service: await knowledgeBaseService.unlinkDocumentFromAssistant(documentId, assistant.id);
    // 2. Update local state or trigger store refresh.
    // setLinkedDocuments(prev => prev.filter(doc => doc.id !== documentId));
    alert("Unlinking individual documents is not supported. Manage folder links in the main Knowledge Base section.");
  };
  
  const handleManageFolderLinks = () => {
    // This function could navigate the user to the main Knowledge Base page
    // or open a modal similar to the one in the screenshot for managing folder-assistant links.
    // For now, it will just log.
    console.warn('User wants to manage folder links for assistant:', assistant.id);
    alert("To manage folder links, please go to the main &quot;Knowledge Base&quot; section from the left sidebar and use the &quot;Manage folder and task assignments for AI assistants&quot; feature.");
    // Example: router.push('/knowledge-base?assistant_id=' + assistant.id);
  };


  return (
    <div className="space-y-4 p-1"> {/* Reduced padding slightly */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium">Linked Knowledge</h3>
        <Button onClick={handleManageFolderLinks} variant="outline" size="xs" className="text-xs">
          <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
          Manage Links
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground mb-2">
        <p>Assistant: {assistant.name}</p>
        <p>Linked Folders: <span className="font-medium text-foreground">{linkedFolderNames}</span></p>
      </div>

      {linkedDocuments.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No documents found in the linked folders for this assistant.
          Use &quot;Manage Links&quot; to associate knowledge base folders with this assistant.
        </p>
      )}

      {linkedDocuments.length > 0 && (
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1"> {/* Added max-h and overflow */}
          {linkedDocuments.map((doc) => (
            <div key={doc.id} className="p-2 bg-muted/50 rounded-md border border-transparent hover:border-primary/20">
              <p className="font-medium text-xs truncate" title={doc.title}>{doc.title}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {doc.type}
                </p>
                {/* 
                  Unlinking individual documents is not the primary flow if linking is by folder.
                  The Trash2 button is commented out. Unlinking should be managed at the folder level.
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUnlinkSource(doc.id)} title="Unlink this document (not recommended)">
                  <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                </Button> 
                */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for linking new sources - Placeholder, as linking is folder-based */}
      {isLinkingModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-5 rounded-lg shadow-xl w-full max-w-lg">
            <h4 className="text-lg font-semibold mb-3">Link Knowledge Base Folders</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              To link knowledge to &quot;{assistant.name}&quot;, please go to the main &quot;Knowledge Base&quot; section (from the left sidebar).
              There, you can create folders, upload documents, and then use the management tools to assign those folders to this assistant.
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              This panel primarily shows the content already linked.
            </p>
            {/* Placeholder for AI Drive file/folder picker - this would be complex */}
            {/* <div className="h-64 border border-dashed rounded-md flex items-center justify-center my-4">
              <p className="text-muted-foreground">Folder Picker Placeholder</p>
            </div> */}
            <div className="mt-5 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsLinkingModalOpen(false)}>Close</Button>
              {/* <Button onClick={() => {
                // Actual linking logic would go here
                setIsLinkingModalOpen(false);
                console.log('Simulate linking content...');
              }}>
                Link Selected
              </Button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeTabContent;
