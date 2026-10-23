import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Upload, FileText, FolderPlus, Check, AlertCircle, Brain, Zap, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { getAIService } from '../../services/ai/aiService';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  folderId: string;
}

interface DocumentUploaderProps {
  isOpen?: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
  folderId?: string | null;
  initialFiles?: File[];
  onStorageError?: () => void;
}

export function DocumentUploader({ 
  isOpen = true,
  onClose, 
  currentFolderId, 
  folderId,
  initialFiles = [],
  onStorageError 
}: DocumentUploaderProps) {
  if (!isOpen) return null;

  const storeData = useKnowledgeBaseStore();
  const { 
    addDocument, 
    folders = [], 
    addFolder: storeAddFolder, 
    filesToUpload = [], 
    setFilesToUpload = () => {}, 
    initializeFromSupabase 
  } = storeData;
  const { user } = useAuth();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const effectiveFolderId = folderId ?? currentFolderId;
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    effectiveFolderId || folders.find(f => f.name === 'Default')?.id || null
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

  const handleDragEnter = useCallback((e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsDragActive(true); 
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsDragActive(false); 
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
  }, []);
  
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
      const folderId = crypto.randomUUID();
      const folderObject = {
        id: folderId,
        name: trimmedName,
        assistantIds: []
      };
      
      await storeAddFolder(folderObject);
      setSelectedFolderId(folderId);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder.');
      onStorageError?.();
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryFile = async (fileId: string) => {
    const fileToRetry = uploadFiles.find(f => f.id === fileId);
    if (!fileToRetry) return;

    // Reset the file status and retry
    setUploadFiles(prev => prev.map(f => f.id === fileId ? { 
      ...f, 
      status: 'pending', 
      progress: 0, 
      error: undefined 
    } : f));

    // Process the file again
    await processFile({ ...fileToRetry, status: 'pending', progress: 0 });
  };
  
  const readFileContent = async (file: File): Promise<string> => {
    // Handle PDF files with proper text extraction and safe timeout fallback
    if (file.type === 'application/pdf') {
      try {
        const extractPdf = async () => {
          const { pdfjs } = await import('react-pdf');
          if (pdfjs && !pdfjs.GlobalWorkerOptions?.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '4.8.69'}/build/pdf.worker.min.mjs`;
          }
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          
          let fullText = '';
          const maxPages = Math.min(pdfDoc.numPages, 40);
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n';
          }
          return fullText;
        };

        const timeout = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('PDF extraction timeout')), 4000)
        );

        let fullText = await Promise.race([extractPdf(), timeout]);
        
        // Sanitize the extracted text
        if (fullText) {
          fullText = fullText
            .replace(/\u0000/g, '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/\uFFFD/g, '')
            .trim();
        }
        
        if (fullText && fullText.length > 20) {
          return fullText;
        }
        return `[PDF Document: ${file.name}, Size: ${(file.size / 1024).toFixed(1)} KB]`;
      } catch (error) {
        console.warn(`[DocumentUploader] PDF parser fallback for ${file.name}:`, error);
        // Fallback to text reading or file metadata
        try {
          const rawText = await file.text();
          if (rawText && rawText.length > 50) return rawText.slice(0, 5000);
        } catch {}
        return `[PDF Document: ${file.name} - Extracted at upload (${(file.size / 1024).toFixed(1)} KB)]`;
      }
    }

    // Handle other file types with regular text reading
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target?.result as string;
        
        // Sanitize content to prevent Unicode errors in Supabase
        if (content) {
          const originalLength = content.length;
          content = content
            .replace(/\u0000/g, '') // Remove null characters
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove other control characters
            .replace(/\uFFFD/g, ''); // Remove replacement characters
          
          if (content.length !== originalLength) {
            console.log(`[DocumentUploader] Sanitized content for ${file.name}: removed ${originalLength - content.length} invalid characters`);
          }
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

      const metadata = { 
        source: 'upload', 
        title: file.name.replace(/\.[^/.]+$/, ''), 
        author: user?.email, 
        date: new Date(), 
        category: getFileCategory(file.type), 
        tags: [], 
        size: file.size 
      };
      
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing', progress: 50 } : f));

      let aiAnalysis: any = {};
      if (processingOptions.performAIAnalysis && content.length > 50) {
        try {
          const aiService = await getAIService();
          if (processingOptions.createSummary) {
            aiAnalysis.summary = await aiService.summarizeText(content, 200);
          }
          if (processingOptions.autoTag) {
            // Generate both topics and auto-tags
            aiAnalysis.topics = await aiService.extractTopics(content, 5);
            aiAnalysis.autoTags = await aiService.generateTags(content);
            console.log('Generated AI tags:', aiAnalysis.autoTags);
          }
          setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 70 } : f));
        } catch (error) {
          console.warn('AI analysis failed, continuing without it:', error);
        }
      }
      
      let embedding;
      if (processingOptions.generateEmbeddings && content.length > 10) {
        try {
          const aiService = await getAIService();
          embedding = await aiService.embedText(content);
          setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 90 } : f));
        } catch (error) {
          console.warn('Embedding generation failed, continuing without it:', error);
        }
      }

      const newDoc = {
        id: crypto.randomUUID(), // Generate proper UUID instead of doc_timestamp
        title: metadata.title,
        content,
        type: file.type,
        metadata: {
          ...metadata,
          ai_summary: aiAnalysis.summary,
          ai_topics: aiAnalysis.topics,
          ai_auto_tags: aiAnalysis.autoTags,
          // Merge auto tags with existing tags
          tags: [...(metadata.tags || []), ...(aiAnalysis.autoTags || [])]
        },
        folderId,
        userId: user!.id,
        embedding,
        // Set AI processing status fields
        ai_enabled: processingOptions.performAIAnalysis && (aiAnalysis.summary || aiAnalysis.keywords?.length > 0),
        ai_last_processed: processingOptions.performAIAnalysis ? new Date().toISOString() : undefined,
        ai_confidence: processingOptions.performAIAnalysis ? 0.8 : 0.0 // Default confidence score
      };

      await addDocument(newDoc as any);
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'complete', progress: 100 } : f));
    } catch (error: any) {
      console.error('Error processing file:', error);
      let errorMessage = 'Upload failed';
      
      // Provide specific error messages based on error type
      if (error.message?.includes('Unicode') || error.message?.includes('cannot be converted to text')) {
        errorMessage = 'File contains invalid characters. Please try a different file format.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('size') || error.message?.includes('too large')) {
        errorMessage = 'File is too large. Please try a smaller file.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: 'error', 
        error: errorMessage,
        progress: 0 
      } : f));
    }
  };

  const startUpload = async () => {
    if (!uploadFiles.length || isUploading) return;
    setIsUploading(true);
    await Promise.all(uploadFiles.filter(f => f.status === 'pending').map(file => processFile(file)));
    setIsUploading(false);
    setUploadFiles([]);
    onClose();
  };

  const pendingFilesCount = uploadFiles.filter(f => f.status === 'pending').length;
  
  // Refresh documents when upload completes
  const completeCount = uploadFiles.filter(f => f.status === 'complete').length;
  
  useEffect(() => {
    // If we have files that completed processing
    if (completeCount > 0 && !isUploading) {
      // Add a slight delay to ensure Supabase has time to process
      const timer = setTimeout(() => {
        // Refresh the document list from the database
        if (user?.id) {
          console.log('[DocumentUploader] Upload complete, refreshing document list');
          initializeFromSupabase().catch(console.error);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [completeCount, isUploading, user?.id, initializeFromSupabase]);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isUploading]);

  const hasCreatedDefaultFolder = useRef(false);
  useEffect(() => {
    const existing = folders.find(f => f.name === 'General Documents' || f.name === 'Default');
    if (existing) {
      if (!selectedFolderId) setSelectedFolderId(existing.id);
      return;
    }
    if (folders.length === 0 && !hasCreatedDefaultFolder.current) {
      hasCreatedDefaultFolder.current = true;
      const defaultId = 'folder_general_' + Date.now();
      const defaultFolder = {
        id: defaultId,
        name: 'General Documents',
        color: '#10b981',
        createdAt: new Date().toISOString()
      };
      if (storeAddFolder) {
        storeAddFolder(defaultFolder as any);
        setSelectedFolderId(defaultId);
      }
    } else if (!selectedFolderId && folders.length > 0) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, selectedFolderId, storeAddFolder]);

  // Handle initialFiles or files from store (drag and drop from main page)
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      handleFileSelection(initialFiles);
    } else if (filesToUpload && filesToUpload.length > 0) {
      console.log('Processing files from store:', filesToUpload);
      handleFileSelection(filesToUpload);
      setFilesToUpload([]); // Clear the store files
    }
  }, [initialFiles, filesToUpload, setFilesToUpload, handleFileSelection]);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          onClose();
        }
      }}
      onDragEnter={handleDragEnter} 
      onDragLeave={handleDragLeave} 
      onDragOver={handleDragOver} 
      onDrop={handleDrop}
    >
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-primary border-dashed">
          <div className="text-center p-8 bg-background rounded-lg shadow-2xl">
            <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">Drop files anywhere to upload</h3>
          </div>
        </div>
      )}

      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Upload Documents</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {pendingFilesCount > 0 ? `${pendingFilesCount} file(s) pending` : 'Ready to upload'}
            </span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <div 
              ref={dropZoneRef} 
              onClick={() => fileInputRef.current?.click()} 
              className={cn(
                "w-full p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
                isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary hover:bg-muted"
              )}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                Drag & Drop or <span className="text-primary">click to browse</span>
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Supports PDF, TXT, MD, DOCX, etc. Max 50MB.
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInputChange} 
                className="hidden" 
                multiple 
              />
            </div>

            {/* Upload Queue */}
            {uploadFiles.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Upload Queue ({uploadFiles.length})</h3>
                <div className="space-y-2">
                  {uploadFiles.map(uploadFile => (
                    <div key={uploadFile.id} className="flex items-center space-x-4 p-2 rounded-md bg-muted/50 hover:bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium truncate" title={uploadFile.file.name}>
                          {uploadFile.file.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {uploadFile.status === 'pending' && <span>Pending</span>}
                          {uploadFile.status === 'uploading' && (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          )}
                          {uploadFile.status === 'processing' && (
                            <>
                              <Brain className="h-4 w-4 animate-spin" />
                              <span>Processing AI...</span>
                            </>
                          )}
                          {uploadFile.status === 'complete' && (
                            <>
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Complete</span>
                            </>
                          )}
                          {uploadFile.status === 'error' && (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span>Failed</span>
                            </>
                          )}
                          {uploadFile.status !== 'error' && (
                            <>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 flex-grow">
                                <div 
                                  className="bg-primary h-1.5 rounded-full transition-all" 
                                  style={{ width: `${uploadFile.progress}%` }}
                                />
                              </div>
                              <span>{uploadFile.progress}%</span>
                            </>
                          )}
                        </div>
                        {uploadFile.error && (
                          <p className="text-red-500 text-xs mt-1">{uploadFile.error}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {uploadFile.status === 'error' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => retryFile(uploadFile.id)}
                            className="h-6 w-6 text-blue-500 hover:text-blue-700"
                            title="Retry upload"
                          >
                            <Zap className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => removeFile(uploadFile.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            )}
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Folder Selection */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Upload Settings</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="folder-select" className="text-sm font-medium">Upload to Folder</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <select 
                      id="folder-select" 
                      className="flex-grow p-2 border rounded-md bg-background" 
                      value={selectedFolderId || ''} 
                      onChange={(e) => setSelectedFolderId(e.target.value)} 
                      disabled={isUploading}
                    >
                      <option value="" disabled>Select a folder</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                  {folders.length === 0 && !isCreatingFolder && (
                    <p className="text-xs text-amber-600 mt-2">No folders found. Please create one.</p>
                  )}
                </div>

                {/* Create Folder */}
                <div>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="text" 
                      placeholder="New folder name..." 
                      value={newFolderName} 
                      onChange={(e) => setNewFolderName(e.target.value)} 
                      disabled={isCreatingFolder || isUploading} 
                      className="flex-grow" 
                    />
                    <Button 
                      onClick={createNewFolder} 
                      disabled={isCreatingFolder || isUploading || !newFolderName.trim()}
                    >
                      <FolderPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Processing Options */}
            <Card className="p-4">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
                <h3 className="text-lg font-medium">Advanced AI Processing</h3>
                <Zap className="h-5 w-5 text-primary" />
              </div>
              {showAdvanced && (
                <div className="mt-4 space-y-3">
                  {Object.entries(processingOptions).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label htmlFor={key} className="text-sm">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <input 
                        type="checkbox" 
                        id={key} 
                        checked={value} 
                        onChange={(e) => setProcessingOptions(prev => ({ ...prev, [key]: e.target.checked }))} 
                        className="toggle-checkbox" 
                        disabled={isUploading}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* 🚀 Sticky Bottom Action Bar — Always in view */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {uploadFiles.length > 0 ? (
              <span>Queue: <strong>{pendingFilesCount}</strong> pending of {uploadFiles.length} file(s)</span>
            ) : (
              <span>Select or drop files above to begin</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={startUpload}
              disabled={isUploading || pendingFilesCount === 0}
              className="px-6 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#10b981] hover:from-[#00a0c2] hover:to-[#0ea572] text-white shadow-md shadow-emerald-500/20 transition disabled:opacity-40 flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Upload...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload {pendingFilesCount} File(s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 