import React, { useState, useEffect } from 'react';
import { X, FileText, Edit, Save, Bot, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import { getAIService } from '../../services/ai/aiService';
import type { AIDocument } from '../../types/ai';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
  documentType?: 'document' | 'note';
}

const documentTypes = [
  { value: 'document', label: 'Document', icon: FileText, description: 'Full document with AI analysis' },
  { value: 'note', label: 'Quick Note', icon: Edit, description: 'Simple text note' },
  { value: 'research', label: 'Research Document', icon: Bot, description: 'AI-assisted research document' }
];

export function CreateDocumentModal({ 
  isOpen, 
  onClose, 
  currentFolderId,
  documentType = 'document'
}: CreateDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('none');
  const [tags, setTags] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const [folderWarning, setFolderWarning] = useState<string>('');

  const { addDocument, folders } = useKnowledgeBaseStore();
  const { assistants } = useAssistantStore();

  useEffect(() => {
    if (isOpen && !currentFolderId) {
      setFolderWarning("A folder must be selected to create a document. Please select or create a folder.");
    } else {
      setFolderWarning('');
    }
  }, [isOpen, currentFolderId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentFolderId) {
        if (!currentFolderId) {
            console.warn("CreateDocumentModal: handleSubmit called without currentFolderId.");
            setFolderWarning("A folder must be selected. Please close this dialog and select or create a folder.");
        }
        return;
    }
    
    setIsCreating(true);
    try {
      // Process tags
      const processedTags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Create the document
      const newDocument: Omit<AIDocument, 'id' | 'embedding'> = {
        title: title.trim(),
        content: content.trim() || `# ${title.trim()}\n\n_Start writing your content here..._`,
        type: selectedType,
        folderId: currentFolderId, // Ensure currentFolderId is used directly
        metadata: {
          source: 'manual_creation',
          title: title.trim(),
          author: 'user',
          date: new Date(),
          category: selectedType,
          tags: processedTags,
          size: content.length,
          created_by: 'knowledge_base_creator'
        }
      };

      // Add to knowledge base
      addDocument(newDocument);

      // If assistant is selected, link the folder to the assistant
      if (selectedAssistant && selectedAssistant !== 'none' && currentFolderId) {
        const assistant = useAssistantStore.getState().getAssistantById(selectedAssistant);
        const folder = useKnowledgeBaseStore.getState().folders.find(f => f.id === currentFolderId);
        if (assistant && folder) {
          useAssistantStore.getState().bulkLinkFolders(selectedAssistant, [
            ...(assistant.knowledgeBase || []).filter(kbFolder => kbFolder.id !== folder.id), // Keep existing unrelated folders
            { id: folder.id, name: folder.name } // Add/update the current folder
          ]);
        }
      }

      // Reset form and close
      setTitle('');
      setContent('');
      setTags('');
      setSelectedAssistant('none');
      onClose();
      
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAIAssist = async () => {
    if (!title.trim()) return;
    
    setIsAIAssisting(true);
    try {
      const isLegal = title.toLowerCase().includes('petition') || 
                      title.toLowerCase().includes('brief') || 
                      title.toLowerCase().includes('pleading') || 
                      title.toLowerCase().includes('demand') ||
                      title.toLowerCase().includes('motion');
      
      let prompt = '';
      let maxTokens = 2500;
      
      if (isLegal) {
        prompt = `You are an elite California Workers' Compensation (WCAB) attorney.
Draft a highly professional, comprehensive, and fully detailed ${selectedType} titled "${title}".
Your response must be a complete legal document draft, NOT a simple outline or list of sections.

Include the following sections with standard professional legal formatting:
1. ATTORNEY BLOCK PLACEHOLDERS: SBN, Law Firm, Address, Phone, Fax, Email, Attorney for Applicant.
2. WCAB CAPTION BLOCK: Applicant, Defendant, Insurer, and Case No: [[CASE_NUMBER]].
3. TITLE OF PETITION: Bold, centered, and fully capitalized.
4. INTRODUCTION: Specify applicant's petition for relief/penalties under the appropriate California Labor Code (e.g., LC § 5814 for delay, LC § 5813 for sanctions, LC § 5814.5 for attorney's fees).
5. STATEMENT OF FACTS: Paragraphs detailing date of injury, MPN treatment selection, and specific actions/delays.
6. LEGAL ARGUMENT:
   - Specific citations (e.g., Labor Code § 5814 delay of benefits, Labor Code § 4650, CCR § 10109 duties).
   - Case law references if applicable (e.g., County of San Joaquin v. WCAB).
7. PRAYER FOR RELIEF: Clearly requested remedies (e.g., 25% penalty on all delayed benefits, 10% interest under LC § 5800, attorney fees with itemized hours).
8. SIGNATURE BLOCK & VERIFICATION OF APPLICANT: standard California verification language.

Write the complete document in clean, readable Markdown.`;
      } else {
        prompt = `Write a comprehensive, fully detailed, and well-structured ${selectedType} titled "${title}".
Provide full body paragraphs, relevant sections, background details, and a clear conclusion. Do not write a simple outline, bullet points, or placeholder summary; write the complete actual content in clean, premium Markdown formatting.`;
      }

      const aiService = await getAIService();
      const response = await aiService.generateText(prompt, { maxTokens });
      
      if (response) {
        setContent(response);
      }
    } catch (error) {
      console.error('AI assistance failed:', error);
      alert('AI assistance failed. Please try again.');
    } finally {
      setIsAIAssisting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setTags('');
    setSelectedAssistant('none');
    onClose();
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const isSubmitDisabled = isCreating || !title.trim() || !currentFolderId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Document</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentFolder ? `in ${currentFolder.name}` : 'in Knowledge Base'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-auto">
            
            {folderWarning && (
              <div className="p-3 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg dark:bg-yellow-200 dark:text-yellow-800" role="alert">
                <span className="font-medium">Attention:</span> {folderWarning}
              </div>
            )}

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Type
              </label>
              <Select value={selectedType} onValueChange={(value: string) => setSelectedType(value as 'document' | 'note')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <Input
                id="document-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                className="w-full"
                autoFocus
                required
              />
            </div>

            {/* AI Assistant Selection */}
            <div>
              <label htmlFor="assistant-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link to Assistant (Optional)
              </label>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an assistant to link this document's folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none"><em>No Assistant Link</em></SelectItem>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentFolderId && selectedAssistant && selectedAssistant !== 'none' && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  The folder "{currentFolder?.name || 'Selected Folder'}" will be linked to the "{assistants.find(a => a.id === selectedAssistant)?.name || 'Selected Assistant'}" assistant.
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="document-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <Input
                id="document-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="research, important, draft"
                className="w-full"
              />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="document-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAIAssist}
                  disabled={!title.trim() || isAIAssisting}
                  className="flex items-center space-x-1"
                >
                  {isAIAssisting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      <span>AI Assist</span>
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="document-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your content here... You can use Markdown formatting."
                className="w-full h-64 resize-none"
                rows={12}
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="min-w-[150px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  <span>Create Document</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}