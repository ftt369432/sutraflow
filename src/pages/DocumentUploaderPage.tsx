import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, FolderPlus, Folder, Check, AlertCircle, Brain, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { getAIService } from '../services/ai/aiService';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  folderId: string;
}

export default function DocumentUploaderPage() {
  const navigate = useNavigate();
  const { addDocument, folders, addFolder: storeAddFolder, filesToUpload, setFilesToUpload } = useKnowledgeBaseStore();
  const { user } = useAuth();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    folders.find(f => f.name === 'Default')?.id || null
  );

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [processingOptions, setProcessingOptions] = useState({
    generateEmbeddings: true,
    performAIAnalysis: true,
    autoTag: true,
    createSummary: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleGoBack = () => navigate('/knowledge');

  const handleFileSelection = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf', 'text/plain', 'text/markdown',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv', 'application/json', 'text/html', 'application/rtf'
      ];
      const maxSize = 50 * 1024 * 1024; // 50MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (!selectedFolderId && folders.length > 0) {
      alert("Please select or create a folder before adding files.");
      return;
    }

    const newUploadFilesData: UploadFile[] = validFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
      folderId: selectedFolderId!,
    }));

    setUploadFiles(prev => [...prev, ...newUploadFilesData]);

    if (validFiles.length !== files.length) {
      alert(`${files.length - validFiles.length} file(s) were skipped due to type or size constraints.`);
    }
  }, [selectedFolderId, folders]);

  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  }, [handleFileSelection]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelection(files);
  };
  
  const createNewFolder = async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName || !user) return;
    setIsCreatingFolder(true);
    try {
      const newFolder = await storeAddFolder({ name: trimmedName, userId: user.id });
      if (newFolder) {
        setSelectedFolderId(newFolder.id);
      }
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };
  
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target?.result as string;
        
        // Sanitize content to prevent Unicode errors in Supabase
        if (content) {
          content = content
            .replace(/\u0000/g, '') // Remove null characters
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove other control characters
            .replace(/\uFFFD/g, ''); // Remove replacement characters
        }
        
        resolve(content);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const getFileCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    return 'document';
  };

  const processFile = async (uploadFile: UploadFile): Promise<void> => {
    const { file, id, folderId } = uploadFile;
    setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'uploading', progress: 10 } : f));
    try {
      const content = await readFileContent(file);
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 30 } : f));

      const metadata = { source: 'upload', title: file.name.replace(/\.[^/.]+$/, ''), author: user?.email, date: new Date(), category: getFileCategory(file.type), tags: [], size: file.size };
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing', progress: 50 } : f));

      let aiAnalysis: any = {};
      if (processingOptions.performAIAnalysis && content.length > 50) {
          const aiService = await getAIService();
          if(processingOptions.createSummary) aiAnalysis.summary = await aiService.summarizeText(content, 200);
          if(processingOptions.autoTag) aiAnalysis.keywords = await aiService.extractTopics(content, 5);
          setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 70 } : f));
      }
      
      let embedding;
      if (processingOptions.generateEmbeddings && content.length > 10) {
          const aiService = await getAIService();
          embedding = await aiService.embedText(content);
          setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 90 } : f));
      }

      const newDoc = { id: crypto.randomUUID(), title: metadata.title, content, type: file.type, metadata: { ...metadata, ai_summary: aiAnalysis.summary, ai_keywords: aiAnalysis.keywords }, folderId, userId: user!.id, embedding };
      await addDocument(newDoc as any);
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'complete', progress: 100 } : f));
    } catch (error: any) {
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: error.message } : f));
    }
  };

  const startUpload = async () => {
    if (!uploadFiles.length || isUploading) return;
    setIsUploading(true);
    await Promise.all(uploadFiles.filter(f => f.status === 'pending').map(file => processFile(file)));
    setIsUploading(false);
    alert('All files processed!');
    setUploadFiles([]);
    navigate('/knowledge');
  };

  const pendingFilesCount = uploadFiles.filter(f => f.status === 'pending').length;

  useEffect(() => {
    if (filesToUpload.length > 0) {
      const newUploads: UploadFile[] = filesToUpload.map(file => ({
        file,
        id: `${file.name}-${file.size}-${Date.now()}`,
        status: 'pending',
        progress: 0,
        folderId: selectedFolderId || (folders.length > 0 ? folders[0].id : ''),
      }));
      setUploadFiles(prevFiles => [...prevFiles, ...newUploads]);
      setFilesToUpload([]);
    }
  }, [filesToUpload, setFilesToUpload, selectedFolderId, folders]);
  
  useEffect(() => {
    if (!selectedFolderId && folders.length > 0) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, selectedFolderId]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-foreground" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-primary border-dashed"><div className="text-center p-8 bg-background rounded-lg shadow-2xl"><Upload className="h-16 w-16 mx-auto mb-4 text-primary" /><h3 className="text-2xl font-bold mb-2">Drop files anywhere to upload</h3></div></div>
      )}
      <header className="flex items-center p-4 border-b bg-background shrink-0"><Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-4"><ArrowLeft className="h-6 w-6" /></Button><h1 className="text-xl font-bold">Upload Documents</h1><span className="ml-auto text-sm text-muted-foreground">{pendingFilesCount > 0 ? `${pendingFilesCount} file(s) pending` : 'Ready to upload'}</span></header>
      <main className="flex-grow overflow-auto p-4 md:p-6 lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div ref={dropZoneRef} onClick={() => fileInputRef.current?.click()} className="w-full p-8 text-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted transition-colors duration-200"><Upload className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-medium">Drag & Drop or <span className="text-primary">click to browse</span></h3><p className="mt-1 text-sm text-muted-foreground">Supports PDF, TXT, MD, DOCX, etc. Max 50MB.</p><input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" multiple /></div>
          {uploadFiles.length > 0 && (
            <Card className="p-4"><h3 className="text-lg font-medium mb-4">Upload Queue ({uploadFiles.length})</h3><div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {uploadFiles.map(uploadFile => (
                  <div key={uploadFile.id} className="flex items-center space-x-4 p-2 rounded-md bg-background hover:bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-grow min-w-0"><p className="text-sm font-medium truncate" title={uploadFile.file.name}>{uploadFile.file.name}</p><div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {uploadFile.status === 'pending' && <span className="text-gray-500">Pending</span>}
                        {uploadFile.status === 'uploading' && <><Loader2 className="h-4 w-4 animate-spin" /><span>Uploading...</span></>}
                        {uploadFile.status === 'processing' && <><Brain className="h-4 w-4 animate-spin" /><span>Processing AI...</span></>}
                        {uploadFile.status === 'complete' && <><Check className="h-4 w-4 text-green-500" /><span>Complete</span></>}
                        {uploadFile.status === 'error' && <><AlertCircle className="h-4 w-4 text-red-500" /><span>Error</span></>}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 flex-grow"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${uploadFile.progress}%` }}></div></div><span>{uploadFile.progress}%</span>
                      </div>{uploadFile.error && <p className="text-red-500 text-xs mt-1">{uploadFile.error}</p>}</div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(uploadFile.id)}><X className="h-4 w-4" /></Button>
                  </div>))}</div></Card>)}</div>
        <div className="lg:col-span-1 space-y-6 mt-6 lg:mt-0">
          <Card className="p-4"><h3 className="text-lg font-medium mb-4">Upload Settings</h3><div className="space-y-4">
              <div><label htmlFor="folder-select" className="text-sm font-medium">Upload to Folder</label><div className="flex items-center space-x-2 mt-1">
                  <select id="folder-select" className="flex-grow p-2 border rounded-md bg-background" value={selectedFolderId || ''} onChange={(e) => setSelectedFolderId(e.target.value)} disabled={isUploading}>
                    <option value="" disabled>Select a folder</option>
                    {folders.map(folder => (<option key={folder.id} value={folder.id}>{folder.name}</option>))}
                  </select></div>
                {folders.length === 0 && !isCreatingFolder && <p className="text-xs text-amber-600 mt-2">No folders found. Please create one.</p>}</div>
              <div><div className="flex items-center space-x-2"><Input type="text" placeholder="New folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} disabled={isCreatingFolder || isUploading} className="flex-grow" /><Button onClick={createNewFolder} disabled={isCreatingFolder || isUploading || !newFolderName.trim()}><FolderPlus className="h-4 w-4" /></Button></div></div></div></Card>
          <Card className="p-4"><div className="flex justify-between items-center cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}><h3 className="text-lg font-medium">Advanced AI Processing</h3><Zap className="h-5 w-5 text-primary" /></div>
            {showAdvanced && (<div className="mt-4 space-y-3">
              {Object.entries(processingOptions).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between"><label htmlFor={key} className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label><input type="checkbox" id={key} checked={value} onChange={(e) => setProcessingOptions(prev => ({ ...prev, [key]: e.target.checked }))} className="toggle-checkbox" disabled={isUploading}/></div>))}
            </div>)}</Card>
          <Button onClick={startUpload} disabled={isUploading || pendingFilesCount === 0} className="w-full" size="lg">{isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : `Upload ${pendingFilesCount} File(s)`}</Button></div></main></div>);
} 