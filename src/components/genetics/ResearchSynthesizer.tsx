import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, BookOpen, BrainCircuit } from 'lucide-react';
import { BioRAGService, BioLiteratureRecord } from '../../services/bio/BioRAGService';

interface ResearchSynthesizerProps {
  geneSymbol: string;
  folderIds?: string[];
}

export const ResearchSynthesizer: React.FC<ResearchSynthesizerProps> = ({ geneSymbol, folderIds }) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<BioLiteratureRecord[]>([]);
  const [synthesis, setSynthesis] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchLiterature = async () => {
      setLoading(true);
      try {
        const literature = await BioRAGService.queryLiteratureVectorDB(geneSymbol, "Therapy targets", folderIds);
        if (!isMounted) return;
        setRecords(literature);
        
        const summary = await BioRAGService.synthesizeFindings(geneSymbol, literature);
        if (!isMounted) return;
        setSynthesis(summary);
      } catch (e) {
        console.error("Failed to fetch literature via RAG", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiterature();
    return () => { isMounted = false; };
  }, [geneSymbol, folderIds]);

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-gray-950 p-4 rounded-lg border border-slate-200 dark:border-gray-800 font-mono text-xs text-slate-500 dark:text-gray-400 h-48 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 dark:opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative flex flex-col items-center gap-3">
          <BrainCircuit className="text-emerald-500 animate-pulse" size={24} />
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            RAG Agent traversing Vector DB (Pinecone) for {geneSymbol} literature...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full relative z-10">
      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
        <h4 className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold mb-2 text-sm">
          <Zap size={16} /> Autonomous Insights
        </h4>
        <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">{synthesis}</p>
      </div>

      <div className="flex-1 overflow-auto pr-2">
        <h4 className="flex items-center gap-2 text-slate-500 dark:text-gray-400 font-medium mb-3 text-xs uppercase tracking-wider">
          <BookOpen size={14} /> Embedded Source Vectors
        </h4>
        <div className="flex flex-col gap-3">
          {records.map((record, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={record.id} 
              className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-slate-200 dark:border-gray-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs text-emerald-600 dark:text-emerald-500 font-mono bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">{record.id}</span>
                <span className="text-xs text-slate-500 dark:text-gray-500">Score: {record.relevanceScore.toFixed(2)}</span>
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-gray-200 mb-1 leading-tight">{record.title}</p>
              <p className="text-xs text-slate-500 dark:text-gray-500">{record.authors.join(', ')} ({record.year}) - {record.journal}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
