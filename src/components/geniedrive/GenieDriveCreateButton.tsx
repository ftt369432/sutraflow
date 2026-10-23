import React from 'react';
import { Plus, FolderPlus, Upload, FileText, MessageSquare, Link } from 'lucide-react';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/DropdownMenu';

interface GenieDriveCreateButtonProps {
  onCreateFolder: () => void;
  onUploadFiles: () => void;
  onOpenAIChat?: () => void;
  onLinkToKnowledgeBase?: () => void;
}

export function GenieDriveCreateButton({ 
  onCreateFolder, 
  onUploadFiles,
  onOpenAIChat,
  onLinkToKnowledgeBase
}: GenieDriveCreateButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white border border-primary/20 shadow-sm hover:shadow-md transition-all duration-200 font-medium px-4 py-2 rounded-lg flex items-center space-x-2 min-w-[100px]"
          variant="default"
        >
          <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <span>Create</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuItem 
          onClick={onUploadFiles}
          className="flex items-center space-x-3 px-3 py-2.5 hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
            <Upload className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">Upload Files</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Add documents and files</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onCreateFolder}
          className="flex items-center space-x-3 px-3 py-2.5 hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
            <FolderPlus className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">New Folder</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Organize your files</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-2" />
        
        {onOpenAIChat && (
          <DropdownMenuItem 
            onClick={onOpenAIChat}
            className="flex items-center space-x-3 px-3 py-2.5 hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">AI Chat</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Start an AI conversation</div>
            </div>
          </DropdownMenuItem>
        )}
        
        {onLinkToKnowledgeBase && (
          <DropdownMenuItem 
            onClick={onLinkToKnowledgeBase}
            className="flex items-center space-x-3 px-3 py-2.5 hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
              <Link className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Link to Knowledge Base</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Connect files to AI assistants</div>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 