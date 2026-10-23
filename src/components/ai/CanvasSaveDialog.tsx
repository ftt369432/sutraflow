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
import { Folder, FileText, ChevronRight, FolderPlus, ArrowUp, Save, Loader2 } from 'lucide-react';
import { AIDriveService, AIDriveFile } from '../../services/drive/aiDriveService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CanvasSaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (folderId: string | null, filename: string) => Promise<void>;
    initialFilename: string;
    userId: string;
}

export function CanvasSaveDialog({
    isOpen,
    onClose,
    onSave,
    initialFilename,
    userId
}: CanvasSaveDialogProps) {
    const [currentPath, setCurrentPath] = useState<string | null>(null); // Folder ID, null is root
    const [pathBreadcrumbs, setPathBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'AI Drive' }]);
    const [items, setItems] = useState<AIDriveFile[]>([]);
    const [filename, setFilename] = useState(initialFilename);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [aiDriveService] = useState(() => new AIDriveService(supabase));

    useEffect(() => {
        if (isOpen) {
            loadItems(currentPath);
            setFilename(initialFilename);
        }
    }, [isOpen, currentPath]);

    const loadItems = async (folderId: string | null) => {
        setIsLoading(true);
        try {
            const files = await aiDriveService.listFiles(folderId);
            // Filter to show only folders and canvas/markdown/text files to reduce clutter, 
            // or show all. For a "Save" dialog, seeing folders is most important.
            setItems(files.sort((a, b) => {
                if (a.is_folder && !b.is_folder) return -1;
                if (!a.is_folder && b.is_folder) return 1;
                return a.name.localeCompare(b.name);
            }));
        } catch (error) {
            console.error('Error loading drive items:', error);
            toast.error('Failed to load folders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            setIsLoading(true);
            await aiDriveService.createFolder(newFolderName, currentPath);
            setNewFolderName('');
            setIsCreatingFolder(false);
            loadItems(currentPath); // Refresh
            toast.success('Folder created');
        } catch (error) {
            toast.error('Failed to create folder');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFolderClick = (folder: AIDriveFile) => {
        setCurrentPath(folder.id);
        setPathBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
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

    const handleSaveClick = async () => {
        if (!filename.trim()) {
            toast.error('Please enter a filename');
            return;
        }

        setIsLoading(true);
        try {
            await onSave(currentPath, filename);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save file');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Save to AI Drive</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Filename Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Filename</label>
                        <Input
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            placeholder="My Document"
                        />
                    </div>

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

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                            title="New Folder"
                        >
                            <FolderPlus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* New Folder Input */}
                    {isCreatingFolder && (
                        <div className="flex gap-2 items-center p-2 bg-muted/10 border-b">
                            <Folder className="h-4 w-4 text-blue-500" />
                            <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="New Folder Name"
                                className="h-7 text-sm"
                                autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={handleCreateFolder}>Create</Button>
                        </div>
                    )}

                    {/* Item List */}
                    <div className="h-[200px] overflow-y-auto border rounded-b-md p-1">
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
                                    className={`flex items-center gap-2 p-2 rounded-sm cursor-pointer hover:bg-accent text-sm group ${item.is_folder ? 'font-medium' : 'text-muted-foreground'}`}
                                    onClick={() => item.is_folder ? handleFolderClick(item) : setFilename(item.name.replace('.md', ''))}
                                >
                                    {item.is_folder ? (
                                        <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                                    ) : (
                                        <FileText className="h-4 w-4" />
                                    )}
                                    <span className="truncate flex-1">{item.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveClick} disabled={isLoading} className="gap-2">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
