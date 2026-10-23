import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Database, Zap } from 'lucide-react';
import { fileHandlingService } from '../../services/FileHandlingService';

export const GlobalDropZone: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [_dragCounter, setDragCounter] = useState(0);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev + 1);
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => {
            const next = prev - 1;
            if (next === 0) setIsDragging(false);
            return next;
        });
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }, []);

    const handleDrop = useCallback(async (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setDragCounter(0);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            console.log(`[GlobalDropZone] Dropped ${files.length} files`);
            
            // Process each file with the unified service
            for (let i = 0; i < files.length; i++) {
                await fileHandlingService.processFile(files[i]);
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    return (
        <AnimatePresence>
            {isDragging && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-12 pointer-events-none"
                >
                    <div className="absolute inset-x-8 inset-y-8 bg-blue-600/10 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-blue-500/50 flex flex-col items-center justify-center text-blue-600 animate-pulse">
                        <div className="h-40 w-40 bg-white/80 dark:bg-slate-900/80 rounded-[4rem] shadow-2xl flex flex-col items-center justify-center gap-6 border border-blue-200 dark:border-blue-800 backdrop-blur-xl">
                            <div className="relative">
                                <Upload className="h-16 w-16" />
                                <div className="absolute -top-2 -right-2 h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg">
                                    <Plus size={16} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 text-center">
                            <h2 className="text-4xl font-black tracking-tighter text-blue-900 dark:text-blue-100 mb-4 uppercase">
                                Deep Knowledge Ingestion
                            </h2>
                            <p className="text-blue-700 dark:text-blue-300 text-lg font-bold uppercase tracking-widest opacity-80 italic">
                                "Drop files anywhere to feed the Cortex..."
                            </p>
                        </div>
                        <div className="absolute bottom-16 flex gap-12 text-[10px] font-black text-blue-500/50 uppercase tracking-[0.3em]">
                            <span className="flex items-center gap-3"><FileText size={14} /> PDF Extraction</span>
                            <span className="flex items-center gap-3"><Zap size={14} /> Neural OCR</span>
                            <span className="flex items-center gap-3"><Database size={14} /> Persistent Memory</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const Plus: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
