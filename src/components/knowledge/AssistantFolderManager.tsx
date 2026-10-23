import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Folder, 
  Plus, 
  Link2, 
  Unlink, 
  ChevronDown, 
  ChevronRight,
  Bot,
  FileText,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useTaskStore } from '../../store/taskStore';
import { useToast } from '../../hooks/useToast';
import type { AIAssistant, AIFolder } from '../../types/ai'; // Ensure AIFolder is imported

interface AssistantFolderManagerProps {
  onClose?: () => void;
  selectedItems?: {
    documents: string[];
    folders: string[];
  };
}

interface AssistantFolderMapping {
  assistantId: string;
  assistant: AIAssistant;
  linkedFolders: string[];
  linkedTasks: string[];
  documentCount: number;
  lastActivity: Date | null;
}

export function AssistantFolderManager({ onClose, selectedItems }: AssistantFolderManagerProps) {
  // ✅ ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const [isStable, setIsStable] = useState(false);
  const mountedRef = useRef(false);
  
  // Move all store hooks to the top
  const { assistants, linkFolderToAssistant, unlinkFolderFromAssistant, bulkLinkFolders, fetchAssistants } = useAssistantStore();
  const { folders, documents, addFolder } = useKnowledgeBaseStore();
  const { tasks } = useTaskStore();
  const { toast } = useToast();
  
  // Move all state hooks to the top
  const [expandedAssistants, setExpandedAssistants] = useState<Set<string>>(new Set());
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [preSelectedFolders] = useState<Set<string>>(new Set(selectedItems?.folders || []));
  const [preSelectedDocuments] = useState<Set<string>>(new Set(selectedItems?.documents || []));
  const [assistantMappings, setAssistantMappings] = useState<AssistantFolderMapping[]>([]);
  
  console.log('[DEBUG] 🚀 AssistantFolderManager component initializing');
  console.log('[DEBUG] 📂 AssistantFolderManager onClose is', onClose ? 'defined' : 'undefined');
  console.log('[DEBUG] 📄 AssistantFolderManager selectedItems:', selectedItems);
  
  // Single stabilized mount effect
  useEffect(() => {
    if (mountedRef.current) return; // Prevent duplicate mounts
    
    const stabilizationTimer = setTimeout(() => {
      setIsStable(true);
      mountedRef.current = true;
      console.log('[DEBUG] ✅ AssistantFolderManager stabilized and mounted');
    }, 100);
    
    return () => {
      clearTimeout(stabilizationTimer);
      mountedRef.current = false;
      setIsStable(false);
      console.log('[DEBUG] ❌ AssistantFolderManager destabilized and unmounted');
    };
  }, []);

  // Initialize with selected items
  useEffect(() => {
    if (selectedItems) {
      console.log(`[DEBUG] 📋 Using pre-selected items: ${selectedItems.documents.length} documents, ${selectedItems.folders.length} folders`);
      
      // If documents are selected but no folders, find their parent folders
      if (selectedItems.documents.length > 0 && selectedItems.folders.length === 0) {
        const folderIds = new Set<string>();
        selectedItems.documents.forEach(docId => {
          const doc = documents.find(d => d.id === docId);
          if (doc && doc.folderId) {
            folderIds.add(doc.folderId);
          }
        });
        // Update pre-selected folders if any were found
        if (folderIds.size > 0) {
          console.log(`[DEBUG] 📁 Auto-detected ${folderIds.size} parent folders for selected documents`);
        }
      }
    }
  }, [selectedItems, documents]);

  // Calculate assistant mappings whenever assistants, documents, or tasks change
  useEffect(() => {
    // Recalculate mappings whenever assistants, documents, or tasks change
    const mappings: AssistantFolderMapping[] = assistants.map(assistant => {
      // Use knowledgeBase as primary source, fall back to linkedFolders
      const linkedFolderIds = assistant.knowledgeBase?.map(f => f.id) || assistant.linkedFolders || [];
      const assistantDocs = documents.filter(doc => 
        doc.folderId && linkedFolderIds.includes(doc.folderId)
      );
      const linkedTasks = tasks.filter(task => 
        task.assignedAssistants?.includes(assistant.id)
      ).map(task => task.id);

      return {
        assistantId: assistant.id,
        assistant,
        linkedFolders: linkedFolderIds,
        linkedTasks,
        documentCount: assistantDocs.length,
        lastActivity: assistantDocs.length > 0 
          ? new Date(Math.max(...assistantDocs.map(doc => new Date(doc.metadata?.date || 0).getTime())))
          : null
      };
    });
    setAssistantMappings(mappings);
    // Debug log
    console.log('[DEBUG] Assistant mappings recalculated:', mappings);
  }, [assistants, documents, tasks]);

  // Data debugging effect - only when stable
  useEffect(() => {
    if (!isStable) return; // Only log when component is stable
    
    console.log(`[DEBUG] 📊 Available data: ${assistants.length} assistants, ${folders.length} folders`);
    
    // Detailed assistant data logging
    if (assistants.length > 0) {
      console.log('[DEBUG] 🤖 Assistant data:');
      assistants.forEach(assistant => {
        const knowledgeBaseCount = assistant.knowledgeBase?.length || 0;
        const linkedFoldersCount = assistant.linkedFolders?.length || 0;
        
        console.log(`[DEBUG]  - ${assistant.name} (${assistant.id}): knowledgeBase: ${knowledgeBaseCount}, linkedFolders: ${linkedFoldersCount}`);
        
        if (knowledgeBaseCount > 0) {
          console.log(`[DEBUG]    - knowledgeBase folders: ${JSON.stringify(assistant.knowledgeBase?.map(f => ({ id: f.id, name: f.name })))}`);
        }
        
        if (linkedFoldersCount > 0) {
          console.log(`[DEBUG]    - linkedFolders: ${JSON.stringify(assistant.linkedFolders)}`);
        }
      });
    }
    
    if (folders.length > 0) {
      console.log(`[DEBUG] 📁 Available folders: ${folders.map(f => `${f.name} (${f.id})`).join(', ')}`);
    }
  }, [isStable, assistants, folders]);
  
  // ✅ NOW SAFE TO HAVE CONDITIONAL RETURNS - ALL HOOKS ARE ABOVE
  if (!isStable) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Initializing assistant manager...</div>
      </div>
    );
  }

  // Log store data on initialization
  console.log(`[DEBUG] 📊 AssistantFolderManager loaded with: ${assistants.length} assistants, ${folders.length} folders`);

  const toggleAssistantExpansion = (assistantId: string) => {
    const newExpanded = new Set(expandedAssistants);
    if (newExpanded.has(assistantId)) {
      newExpanded.delete(assistantId);
    } else {
      newExpanded.add(assistantId);
    }
    setExpandedAssistants(newExpanded);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedAssistant) return;

    try {
      setIsProcessing({...isProcessing, create: true});
      
      // Create the folder
      const newFolder = await addFolder({
        name: newFolderName,
        parentId: null,
        assistantIds: selectedAssistant ? [selectedAssistant] : []
      });

      // Link it to the assistant if folder was created successfully
      if (newFolder && selectedAssistant) {
        try {
          await linkFolderToAssistant(selectedAssistant, newFolder.id);
          toast.success(`Successfully linked folder ${newFolder.name} to assistant ${selectedAssistant}`);
        } catch (error) {
          console.error('Error linking folder to assistant:', error);
          toast.error('Error linking folder to assistant');
        }
      }

      setNewFolderName('');
      setShowCreateFolder(false);
      setSelectedAssistant(null);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Error creating folder');
    } finally {
      setIsProcessing({...isProcessing, create: false});
    }
  };

  const handleLinkFolder = async (assistantId: string, folderIdToLink: string) => {
    // Create a unique processing key
    const processingKey = `link_${assistantId}_${folderIdToLink}`;
    console.log(`[DEBUG] 🔄 Starting folder linking process - assistantId: ${assistantId}, folderId: ${folderIdToLink}`);
    try {
      setIsProcessing({...isProcessing, [processingKey]: true});
      console.log(`[DEBUG] ⏳ Setting processing state for ${processingKey}`);
      
      // Get folder details for better logs
      const folder = folders.find(f => f.id === folderIdToLink);
      const assistant = assistants.find(a => a.id === assistantId);
      
      if (!folder) {
        console.error(`[DEBUG] ❌ Folder with ID ${folderIdToLink} not found in available folders!`);
        throw new Error(`Folder with ID ${folderIdToLink} not found`);
      }
      
      if (!assistant) {
        console.error(`[DEBUG] ❌ Assistant with ID ${assistantId} not found in available assistants!`);
        throw new Error(`Assistant with ID ${assistantId} not found`);
      }
      
      console.log(`[DEBUG] 📂 Linking folder "${folder.name}" (${folder.id}) to assistant "${assistant.name}" (${assistant.id})`);
      
      // Verify the store function is available
      if (!linkFolderToAssistant) {
        console.error('[DEBUG] ❌ linkFolderToAssistant function is undefined!');
        throw new Error('Store function linkFolderToAssistant is not available');
      }
      
      console.log('[DEBUG] 🔄 Calling linkFolderToAssistant from store...');
      
      // Add timeout to better track async operation (increased from 10 to 30 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Link folder operation timed out after 30 seconds')), 30000)
      );
      
      // Call the store function with a timeout
      await Promise.race([
        linkFolderToAssistant(assistantId, folderIdToLink),
        timeoutPromise
      ]);
      
      console.log(`[DEBUG] ✅ Successfully linked folder ${folder.name} to assistant ${assistant.name}`);
      
      // Robust refresh process to ensure UI state matches backend
      try {
        // First fetch updated assistants list with a short delay to ensure DB writes are complete
        await new Promise(resolve => setTimeout(resolve, 100));
        await fetchAssistants();
        console.log(`[DEBUG] 🔄 Assistants refreshed after folder linking`);
        // Second fetch ensures we have the latest data
        await fetchAssistants();
        // Force a third refresh to ensure we have absolutely current data
        await fetchAssistants();
        console.log(`[DEBUG] 🔍 Triple-checking assistant data after folder linking`);
      } catch (refreshError) {
        console.error(`[DEBUG] ⚠️ Failed to refresh assistants after linking:`, refreshError);
      }
      
      // Show success toast
      toast({
        title: "Folder linked to assistant",
        description: `"${folder.name}" has been linked to assistant "${assistant.name}"`,
        variant: "success",
      });
    } catch (error) {
      console.error(`[DEBUG] ❌ Error linking folder ${folderIdToLink} to assistant ${assistantId}:`, error);
      
      // More detailed error message based on error type
      let errorMessage = "An error occurred while linking the folder.";
      
      if (error instanceof Error) {
        if (error.message.includes("timed out")) {
          errorMessage = "The operation is taking longer than expected. The linking process will continue in the background.";
          
          // Continue the operation without the timeout - this will let it finish in the background
          linkFolderToAssistant(assistantId, folderIdToLink)
            .then(async () => {
              const linkedFolder = folders.find(f => f.id === folderIdToLink);
              console.log(`[DEBUG] ✅ Background linking completed for folder ${linkedFolder?.name} to assistant ${assistantId}`);
              
              // Refresh assistant data after background linking
              try {
                await fetchAssistants();
                console.log(`[DEBUG] ✅ Assistant data refreshed after background linking`);
              } catch (refreshErr) {
                console.error(`[DEBUG] ⚠️ Error refreshing assistant data after background linking:`, refreshErr);
              }
              
              toast({
                title: "Folder linked successfully",
                description: `The folder "${linkedFolder?.name}" has been linked to assistant in the background.`,
                variant: "success",
              });
            })
            .catch(err => {
              console.error(`[DEBUG] ❌ Background linking failed:`, err);
            });
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      // Show error toast
      toast({
        title: "Folder linking issue",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log(`[DEBUG] 🏁 Finished folder linking process - clearing processing state for ${processingKey}`);
      setIsProcessing({...isProcessing, [processingKey]: false});
    }
  };

  const handleUnlinkFolder = async (assistantId: string, folderIdToUnlink: string) => {
    // Create a unique processing key
    const processingKey = `unlink_${assistantId}_${folderIdToUnlink}`;
    console.log(`🔄 Starting folder unlinking process - assistantId: ${assistantId}, folderId: ${folderIdToUnlink}`);
    try {
      setIsProcessing({...isProcessing, [processingKey]: true});
      console.log(`⏳ Setting processing state for ${processingKey}`);
      
      // Get folder details for better logs
      const folder = folders.find(f => f.id === folderIdToUnlink);
      const assistant = assistants.find(a => a.id === assistantId);
      
      console.log(`📂 Unlinking folder "${folder?.name || folderIdToUnlink}" from assistant "${assistant?.name || assistantId}"`);
      
      // Add timeout to better track async operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Unlink folder operation timed out after 30 seconds')), 30000)
      );
      
      // Call the store function with a timeout
      await Promise.race([
        unlinkFolderFromAssistant(assistantId, folderIdToUnlink),
        timeoutPromise
      ]);
      
      console.log(`✅ Successfully unlinked folder ${folderIdToUnlink} from assistant ${assistantId}`);
      
      // Refresh assistant data after unlinking
      try {
        console.log(`🔄 Refreshing assistant data after unlinking...`);
        await fetchAssistants();
        console.log(`✅ Assistant data refreshed successfully`);
      } catch (refreshError) {
        console.error(`⚠️ Error refreshing assistant data:`, refreshError);
      }
      
      // Show success toast
      toast({
        title: "Folder unlinked from assistant",
        description: `"${folder?.name}" has been unlinked from assistant "${assistant?.name}"`,
        variant: "success",
      });
    } catch (error) {
      console.error(`❌ Error unlinking folder ${folderIdToUnlink} from assistant ${assistantId}:`, error);
      
      // Show error toast
      toast({
        title: "Failed to unlink folder",
        description: `An error occurred while unlinking the folder from the assistant. Please try again.`,
        variant: "destructive",
      });
    } finally {
      console.log(`🏁 Finished folder unlinking process - clearing processing state for ${processingKey}`);
      setIsProcessing({...isProcessing, [processingKey]: false});
    }
  };

  const getUnlinkedFolders = () => {
    // Gather all folder IDs linked to any assistant
    const allLinkedFolderIds = new Set<string>();
    assistants.forEach(assistant => {
      const linkedIds = assistant.knowledgeBase?.map(f => f.id) || assistant.linkedFolders || [];
      linkedIds.forEach(id => allLinkedFolderIds.add(id));
    });
    
    // Return folders not linked to any assistant
    return folders.filter(folder => !allLinkedFolderIds.has(folder.id));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assistant Knowledge Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage folder and task assignments for AI assistants
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Assistants
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {assistants.filter(a => a.isActive).length}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Folder className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Linked Folders
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {assistantMappings.reduce((acc, mapping) => acc + mapping.linkedFolders.length, 0)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Documents
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {documents.length}
            </p>
          </div>
        </div>

        {/* Create New Folder */}
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Create Assistant Folder
            </h3>
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowCreateFolder(!showCreateFolder)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
          
          {showCreateFolder && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <select
                  value={selectedAssistant || ''}
                  onChange={(e) => setSelectedAssistant(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  title="Select Assistant for new folder"
                  aria-label="Select Assistant for new folder"
                >
                  <option value="">Select Assistant</option>
                  {assistants.map(assistant => (
                    <option key={assistant.id} value={assistant.id}>
                      {assistant.name} ({assistant.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || !selectedAssistant || isProcessing.create}
                  size="sm"
                  variant="default"
                  isLoading={isProcessing.create}
                >
                  Create & Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                    setSelectedAssistant(null);
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Assistant Mappings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Assistant-Folder Relationships
          </h3>
          
          {assistantMappings.map(mapping => (
            <div
              key={mapping.assistantId}
              className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
            >
              {/* Assistant Header */}
              <div 
                className="p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => toggleAssistantExpansion(mapping.assistantId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {expandedAssistants.has(mapping.assistantId) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        mapping.assistant.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {mapping.assistant.name}
                      </span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                        {mapping.assistant.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Folder className="h-4 w-4" />
                      <span>{mapping.linkedFolders.length} folders</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{mapping.documentCount} docs</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{mapping.linkedTasks.length} tasks</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedAssistants.has(mapping.assistantId) && (
                <div className="p-4 space-y-4">
                  {/* Linked Folders */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Linked Folders ({mapping.linkedFolders.length})
                    </h4>
                    <div className="space-y-2">
                      {mapping.linkedFolders.map(folderId => {
                        const folder = folders.find(f => f.id === folderId);
                        if (!folder) return null;
                        const folderDocs = documents.filter(doc => doc.folderId === folderId);
                        const unlinkKey = `unlink_${mapping.assistantId}_${folderId}`;
                        const isUnlinking = isProcessing[unlinkKey];
                        
                        return (
                          <div
                            key={folderId}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <Folder className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {folder.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({folderDocs.length} docs)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnlinkFolder(mapping.assistantId, folderId)}
                              disabled={isUnlinking}
                              isLoading={isUnlinking}
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Folders to Link */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available Folders
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getUnlinkedFolders().map(folder => {
                        const linkKey = `link_${mapping.assistantId}_${folder.id}`;
                        const isLinking = isProcessing[linkKey];
                        
                        return (
                          <div
                            key={folder.id}
                            className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <Folder className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {folder.name}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleLinkFolder(mapping.assistantId, folder.id)}
                              disabled={isLinking}
                              isLoading={isLinking}
                            >
                              <Link2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assistant Description */}
                  {mapping.assistant.description && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {mapping.assistant.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Unlinked Folders Section */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Available Folders
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            {getUnlinkedFolders().length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No unlinked folders available.</p>
            ) : (
              getUnlinkedFolders().map(folder => (
                <div key={folder.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{folder.name}</span>
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleLinkFolder(e.target.value, folder.id);
                        e.target.value = ""; // Reset after linking
                      }
                    }}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                    defaultValue=""
                    title={`Link folder ${folder.name} to assistant`}
                    aria-label={`Link folder ${folder.name} to assistant`}
                  >
                    <option value="" disabled>Link to Assistant...</option>
                    {assistants.map(assistant => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                </div>
              )))
            }
          </div>
        </div>
      </div>
    </div>
  );
}