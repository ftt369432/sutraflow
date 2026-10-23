import React, { useState } from 'react';
import { Plus, FileText, Search, Clock, Folder } from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '../ui/DropdownMenu';
import { QuickAccessDocuments } from './QuickAccessDocuments';
import { useCanvasAIDrive, CanvasDocument } from '../../hooks/canvas/useCanvasAIDrive';
import { cn } from '../../lib/utils';

interface CanvasQuickActionsProps {
  onCreateNew: () => void;
  onBrowseDocuments: () => void;
  onDocumentSelect: (document: CanvasDocument) => void;
  className?: string;
}

export function CanvasQuickActions({
  onCreateNew,
  onBrowseDocuments,
  onDocumentSelect,
  className
}: CanvasQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          className="w-64 mb-2"
        >
          <div className="p-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Canvas Actions
            </div>
            
            <DropdownMenuItem
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <div className="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm font-medium">New Document</div>
                <div className="text-xs text-gray-500">Start a fresh canvas</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                onBrowseDocuments();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Browse All</div>
                <div className="text-xs text-gray-500">View all documents</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            {/* Embedded Quick Access */}
            <div className="pt-2">
              <QuickAccessDocuments
                onDocumentSelect={(doc) => {
                  onDocumentSelect(doc);
                  setIsOpen(false);
                }}
                className="w-full"
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}