import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Folder, FileText, ChevronRight, ArrowUp, FolderOpen, Loader2 } from 'lucide-react';
import { AIDriveService, AIDriveFile } from '../../services/drive/aiDriveService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CanvasOpenDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onOpen: (fileId: string, filename: string, content: string) => Promise<void>;
    userId: string;
}

export function CanvasOpenDialog({
    isOpen,
    onClose,
    onOpen,
    userId
}: CanvasOpenDialogProps) {
    const [currentPath, setCurrentPath] = useState<string | null>(null); // Folder ID, null is root
    const [pathBreadcrumbs, setPathBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'AI Drive' }]);
    const [items, setItems] = useState<AIDriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<AIDriveFile | null>(null);
    const [aiDriveService] = useState(() => new AIDriveService(supabase));

    useEffect(() => {
        if (isOpen) {
            loadItems(currentPath);
            setSelectedFile(null);
        }
    }, [isOpen, currentPath]);

    const loadItems = async (folderId: string | null) => {
        setIsLoading(true);
        try {
            const files = await aiDriveService.listFiles(folderId);
            setItems(files.sort((a, b) => {
                if (a.is_folder && !b.is_folder) return -1;
                if (!a.is_folder && b.is_folder) return 1;
                return a.name.localeCompare(b.name);
            }));
        } catch (error) {
            console.error('Error loading drive items:', error);
            toast.error('Failed to load files');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFolderClick = (folder: AIDriveFile) => {
        setCurrentPath(folder.id);
        setPathBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
        setSelectedFile(null);
    };

    const handleBreadcrumbClick = (index: number) => {
        const target = pathBreadcrumbs[index];
        setCurrentPath(target.id);
        setPathBreadcrumbs(prev => prev.slice(0, index + 1));
    };

    const handleUpLevel = () => {
        if (pathBreadcrumbs.length > 1) {
            handleBreadcrumbClick(pathBreadcrumbs.length - 2);
        }
    };

    const handleFileSelect = (file: AIDriveFile) => {
        if (file.is_folder) return;
        setSelectedFile(file);
    };

    const handleFileDoubleClick = (file: AIDriveFile) => {
        if (file.is_folder) {
            handleFolderClick(file);
        } else {
            handleOpenClick(file);
        }
    };

    const handleOpenClick = async (fileToOpen: AIDriveFile | null = selectedFile) => {
        if (!fileToOpen) return;

        setIsLoading(true);
        try {
            // We need to fetch the content. AIDriveService has download or we might need a direct get if it is text.
            // Assuming for now we can get content via a service method or checking if it's cached.
            // The `canvasAIDriveService` uses `aiDriveService.loadCanvasDocument` which checks storage.
            // Let's rely on the passed `onOpen` to handle the heavy lifting, but we might need to READ it here if onOpen expects content.
            // However, `AssistantCanvasIntegration` expects `onOpen(fileId, filename, content)`.
            // So we must fetch content here.

            let content = '';
            if (fileToOpen.storage_path) {
                const { data, error } = await supabase.storage
                    .from('ai-drive')
                    .download(fileToOpen.storage_path);
                if (error) throw error;
                content = await data.text();
            } else {
                // Fallback if no storage path (shouldn't happen for valid files)
                content = '';
            }

            await onOpen(fileToOpen.id, fileToOpen.name.replace('.md', ''), content);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to open file');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Open from AI Drive</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Folder Navigation Header */}
                    <div className="flex items-center justify-between bg-muted/30 p-2 rounded-t-md border-b">
                        <div className="flex items-center gap-1 text-sm overflow-hidden whitespace-nowrap">
                            {pathBreadcrumbs.length > 1 && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" onClick={handleUpLevel}>
                                    <ArrowUp className="h-3 w-3" />
                                </Button>
                            )}
                            {pathBreadcrumbs.map((crumb, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                    <span
                                        className={`cursor-pointer hover:underline ${i === pathBreadcrumbs.length - 1 ? 'font-semibold' : ''}`}
                                        onClick={() => handleBreadcrumbClick(i)}
                                    >
                                        {crumb.name}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Item List */}
                    <div className="h-[300px] overflow-y-auto border rounded-b-md p-1">
                        {isLoading && !items.length ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                                Empty folder
                            </div>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-2 p-2 rounded-sm cursor-pointer border border-transparent 
                    ${item.id === selectedFile?.id ? 'bg-primary/10 border-primary/20' : 'hover:bg-accent'} 
                    group transition-all`}
                                    onClick={() => handleFileSelect(item)}
                                    onDoubleClick={() => handleFileDoubleClick(item)}
                                >
                                    {item.is_folder ? (
                                        <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className={`truncate flex-1 text-sm ${item.is_folder ? 'font-medium' : ''}`}>
                                        {item.name}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={() => handleOpenClick()}
                        disabled={isLoading || !selectedFile}
                        className="gap-2"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                        Open
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
