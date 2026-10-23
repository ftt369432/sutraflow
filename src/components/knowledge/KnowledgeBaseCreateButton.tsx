import { Plus, FolderPlus, FolderOpen, Upload, FileText, Brain, Bot, Edit, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/DropdownMenu';
import { useNavigate } from 'react-router-dom';

interface KnowledgeBaseCreateButtonProps {
  onUploadFiles: () => void;
  onCreateFolder: () => void;
  onCreateDocument?: () => void;
  onCreateNote?: () => void;
  onAssignToAssistant?: () => void;
  onAIProcess?: () => void;
  onSyncWorkspace?: () => void;
}

export function KnowledgeBaseCreateButton({ 
  onUploadFiles,
  onCreateFolder,
  onCreateDocument,
  onCreateNote,
  onAssignToAssistant,
  onAIProcess,
  onSyncWorkspace
}: KnowledgeBaseCreateButtonProps) {  
  const navigate = useNavigate();
  
  const handleNavigateToAIProcessingPage = () => {
    navigate('/knowledge/ai-processing');
  };
  
  return (
    <div className="flex space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            className="font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 min-w-[100px] sutra-silver-create shimmer-button-energy"
          >
            <div className="flex items-center justify-center w-6 h-6 bg-white/40 dark:bg-white/15 rounded-full shadow-2xs">
              <Plus className="h-4 w-4 text-slate-700 dark:text-slate-200" />
            </div>
            <span>Create</span>
            <svg className="w-4 h-4 ml-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 p-2 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg shadow-lg" align="end">

        {/* File Operations */}        <DropdownMenuItem 
          onClick={onUploadFiles}
          className="flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">Upload Documents</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Add files to knowledge base</div>
          </div>
        </DropdownMenuItem>

        {onCreateDocument && (          <DropdownMenuItem 
            onClick={onCreateDocument}
            className="flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">New Document</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Create a new document</div>
            </div>
          </DropdownMenuItem>
        )}        {onCreateNote && (
          <DropdownMenuItem 
            onClick={onCreateNote}
            className="flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Quick Note</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Create a text note</div>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem 
          onClick={onCreateFolder}
          className="flex items-center space-x-3 px-3 py-2.5 hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
            <FolderPlus className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">New Folder</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Organize your knowledge</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-2" />
        
        {/* AI Operations */}
        {onAssignToAssistant && (
          <DropdownMenuItem 
            onClick={onAssignToAssistant}
            className="flex items-center space-x-3 px-3 py-2.5 hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Assign to Assistant</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Link content to AI assistant</div>
            </div>
          </DropdownMenuItem>
        )}

        {onAIProcess && (
          <DropdownMenuItem 
            onClick={onAIProcess}
            className="flex items-center space-x-3 px-3 py-2.5 hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">AI Process Documents</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Generate vectors and analysis</div>
            </div>
          </DropdownMenuItem>
        )}

        {onSyncWorkspace && (
          <DropdownMenuItem 
            onClick={onSyncWorkspace}
            className="flex items-center space-x-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <FolderOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Unpack Workspace</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Sync local Antigravity files</div>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem 
          onClick={handleNavigateToAIProcessingPage}
          className="flex items-center space-x-3 px-3 py-2.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <ExternalLink className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">Open AI Processing Page</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Full document processing dashboard</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
    <Button 
      onClick={handleNavigateToAIProcessingPage}
      className="font-medium px-4 py-2 rounded-lg flex items-center space-x-2"
      variant="outline"
    >
      <ExternalLink className="h-4 w-4 mr-2" />
      <span>Open AI Processing Page</span>
    </Button>
    </div>
  );
}