import React, { useState, useEffect } from 'react';
import { FileText, FileImage, File, AlertCircle, Loader2, Download, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FilePreviewerProps {
    file: {
        id: string;
        title: string;
        type: string;
        content?: string;
        url?: string;
        aiDriveFileId?: string;
    };
    onClose?: () => void;
}

export const FilePreviewer: React.FC<FilePreviewerProps> = ({ file, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [docxHtml, setDocxHtml] = useState<string | null>(null);

    const fileType = file.title.split('.').pop()?.toLowerCase() || '';

    useEffect(() => {
        async function loadFile() {
            setLoading(true);
            setError(null);
            try {
                if (fileType === 'docx' && file.url) {
                    const response = await fetch(file.url);
                    const arrayBuffer = await response.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setDocxHtml(result.value);
                }
                // PDF and Images are handled by components directly via URL
                setLoading(false);
            } catch (err) {
                console.error('Error loading file preview:', err);
                setError('Failed to load file preview. Please try downloading the file instead.');
                setLoading(false);
            }
        }

        loadFile();
    }, [file.url, fileType]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    function changePage(offset: number) {
        setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1));
    }

    const renderContent = () => {
        if (loading && !docxHtml) {
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-sm text-gray-500">Preparing preview...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Unavailable</h3>
                    <p className="text-sm text-gray-500 mb-6">{error}</p>
                    <Button variant="outline" onClick={() => window.open(file.url, '_blank')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Original File
                    </Button>
                </div>
            );
        }

        switch (fileType) {
            case 'pdf':
                return (
                    <div className="flex flex-col items-center bg-gray-100 p-4 min-h-full overflow-auto">
                        <div className="bg-white shadow-lg rounded-sm mb-4">
                            <Document
                                file={file.url}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex items-center justify-center p-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                                    </div>
                                }
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    renderAnnotationLayer={true}
                                    renderTextLayer={true}
                                />
                            </Document>
                        </div>
                        {numPages && (
                            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-md fixed bottom-8">
                                <Button variant="ghost" size="sm" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>Previous</Button>
                                <span className="text-sm font-medium">Page {pageNumber} of {numPages}</span>
                                <Button variant="ghost" size="sm" onClick={() => changePage(1)} disabled={pageNumber >= numPages}>Next</Button>
                                <Separator orientation="vertical" className="h-4" />
                                <Button variant="ghost" size="sm" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => setScale(s => Math.min(2.5, s + 0.2))}><ZoomIn className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </div>
                );

            case 'docx':
                return (
                    <div className="p-12 max-w-4xl mx-auto bg-white shadow-sm min-h-full prose prose-blue">
                        <div dangerouslySetInnerHTML={{ __html: docxHtml || '' }} />
                    </div>
                );

            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return (
                    <div className="flex items-center justify-center h-full bg-gray-50 p-8">
                        <img
                            src={file.url}
                            alt={file.title}
                            className="max-w-full max-h-full shadow-2xl rounded-lg object-contain"
                        />
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                        <File className="h-20 w-20 text-gray-200 mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Preview Available</h3>
                        <p className="text-gray-500 max-w-sm mb-8">
                            We don't support previewing .{fileType} files directly yet, but you can still access it in the drive.
                        </p>
                        <Button onClick={() => window.open(file.url, '_blank')}>
                            Open in New Tab
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* Navbar for Previewer */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        {fileType === 'pdf' ? <FileText className="h-5 w-5 text-red-500" /> :
                            fileType === 'docx' ? <FileText className="h-5 w-5 text-blue-600" /> :
                                ['png', 'jpg', 'jpeg'].includes(fileType) ? <FileImage className="h-5 w-5 text-purple-500" /> :
                                    <File className="h-5 w-5 text-gray-500" />}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 leading-tight">{file.title}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] uppercase px-1 h-4">{fileType}</Badge>
                            <span className="text-[10px] text-gray-400">Viewing Mode</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(file.url, '_blank')}>
                        <Download className="h-4 w-4 mr-2" />
                        Original
                    </Button>
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
};

function Separator({ orientation, className }: { orientation: string, className: string }) {
    return <div className={`${orientation === 'vertical' ? 'w-px' : 'h-px'} bg-gray-200 ${className}`} />;
}

function X({ className }: { className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    );
}
