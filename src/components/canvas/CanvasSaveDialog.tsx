
import React, { useState, useEffect } from 'react';
import {
    Folder,
    FileText,
    ChevronUp,
    Plus,
    Save,
    Loader2,
    Search,
    FolderPlus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { canvasAIDriveService } from '../../services/canvas/CanvasAIDriveService';
import { AIDriveFile } from '../../services/drive/aiDriveService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface CanvasSaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (folderId: string, filename: string) => Promise<void>;
    initialFilename?: string;
}

export function CanvasSaveDialog({
    isOpen,
    onClose,
    onSave,
    initialFilename = 'Untitled Document'
}: CanvasSaveDialogProps) {
    const { user } = useAuth();
    const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);
    const [pathHistory, setPathHistory] = useState<{ id: string | undefined, name: string }[]>([{ id: undefined, name: 'Root' }]);
    const [files, setFiles] = useState<AIDriveFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [filename, setFilename] = useState(initialFilename);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load files when path changes
    useEffect(() => {
        if (isOpen && user?.id) {
            loadFiles(currentPath);
        }
    }, [isOpen, currentPath, user?.id]);

    // Update filename when initialFilename changes
    useEffect(() => {
        if (initialFilename) {
            setFilename(initialFilename);
        }
    }, [initialFilename]);

    const loadFiles = async (folderId?: string) => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const result = await canvasAIDriveService.listDirectory(user.id, folderId);
            setFiles(result);
        } catch (error) {
            console.error('Failed to load files:', error);
            toast.error('Failed to load directory contents');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!user?.id || !newFolderName.trim()) return;

        try {
            await canvasAIDriveService.createFolder(user.id, newFolderName, currentPath);
            toast.success(`Folder "${newFolderName}" created`);
            setNewFolderName('');
            setIsCreatingFolder(false);
            loadFiles(currentPath); // Refresh
        } catch (error) {
            console.error('Failed to create folder:', error);
            toast.error('Failed to create folder');
        }
    };

    const handleNavigate = (folder: AIDriveFile) => {
        if (!folder.is_folder) return;
        setCurrentPath(folder.id);
        setPathHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
    };

    const handleNavigateUp = () => {
        if (pathHistory.length <= 1) return;
        const newHistory = [...pathHistory];
        newHistory.pop(); // Remove current
        const parent = newHistory[newHistory.length - 1];
        setCurrentPath(parent.id);
        setPathHistory(newHistory);
    };

    const handleSaveClick = async () => {
        if (!filename.trim()) {
            toast.error('Please enter a filename');
            return;
        }

        setIsSaving(true);
        try {
            // Ensure specific folder ID is passed (undefined means root)
            await onSave(currentPath || '', filename);
            onClose();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save document');
        } finally {
            setIsSaving(false);
        }
    };

    const sortedFiles = [...files].sort((a, b) => {
        // Folders first
        if (a.is_folder && !b.is_folder) return -1;
        if (!a.is_folder && b.is_folder) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Save className="h-5 w-5 text-indigo-600" />
                        Save to AI Drive
                    </DialogTitle>
                </DialogHeader>

                {/* Toolbar & Breadcrumbs */}
                <div className="flex items-center justify-between p-2 bg-muted/30 border-b px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNavigateUp}
                            disabled={pathHistory.length <= 1}
                            className="h-8 w-8"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                        <span className="font-medium truncate max-w-[200px]">
                            {pathHistory[pathHistory.length - 1].name}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isCreatingFolder ? (
                            <div className="flex items-center gap-1 animate-in slide-in-from-right fade-in duration-200">
                                <Input
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="h-8 w-32"
                                    placeholder="Folder name"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                                <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName}>
                                    Create
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsCreatingFolder(false)}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsCreatingFolder(true)}>
                                <FolderPlus className="h-4 w-4 mr-1" />
                                New Folder
                            </Button>
                        )}
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            {sortedFiles.map(file => (
                                <div
                                    key={file.id}
                                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${file.is_folder ? 'text-foreground' : 'text-muted-foreground'
                                        }`}
                                    onClick={() => file.is_folder && handleNavigate(file)}
                                >
                                    {file.is_folder ? (
                                        <Folder className="h-5 w-5 text-indigo-400 fill-indigo-400/20" />
                                    ) : (
                                        <FileText className="h-5 w-5 text-slate-400" />
                                    )}
                                    <span className="text-sm truncate flex-1">{file.name}</span>
                                    {!file.is_folder && <span className="text-xs text-muted-foreground">
                                        {new Date(file.updated_at).toLocaleDateString()}
                                    </span>}
                                </div>
                            ))}
                            {sortedFiles.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    Empty folder
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer: Filename & Save Action */}
                <div className="p-4 border-t bg-muted/10">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground ml-1 mb-1 block">Filename</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    placeholder="My Document"
                                    className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground">.md</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-2 h-full pt-5">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleSaveClick} disabled={isSaving || !filename}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save
                            </Button>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
