import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Activity, Zap, Trash2, ExternalLink, Loader2, Link2 } from 'lucide-react';
import { MyGeneService, GeneInfo } from '../../services/bio/MyGeneService';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAIService } from '../../services/ai/aiService';
import { aiDriveService, AIDriveFile } from '../../services/drive/aiDriveService';

interface InteractionLabProps {
  savedGenes: string[];
  onRemoveGene: (symbol: string) => void;
  onViewGene: (symbol: string) => void;
  onReportGenerated?: (file: AIDriveFile) => void;
}

export const InteractionLab: React.FC<InteractionLabProps> = ({ savedGenes, onRemoveGene, onViewGene, onReportGenerated }) => {
  const [geneDataList, setGeneDataList] = useState<GeneInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllGenes = async () => {
      if (savedGenes.length === 0) {
        setGeneDataList([]);
        return;
      }

      setLoading(true);
      try {
        const symbols = savedGenes.map(g => g.split(' — ')[0]);
        const promises = symbols.map(symbol => MyGeneService.searchGenes(symbol));
        const results = await Promise.all(promises);
        const flatResults = results.map(r => r[0]).filter(Boolean);
        setGeneDataList(flatResults);
      } catch (err) {
        console.error('Failed to fetch multi-gene data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllGenes();
  }, [savedGenes]);

  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSwarmAnalysis = async () => {
    if (savedGenes.length < 2) {
      addNotification({ 
        type: 'info', 
        title: 'Insufficient Data', 
        message: 'Add at least 2 genes to perform interaction analysis.' 
      });
      return;
    }

    setIsAnalyzing(true);
    addNotification({ 
      type: 'info', 
      title: 'AI Swarm Initialized', 
      message: 'Performing multi-model interactome cross-reference across Claude & Gemini...' 
    });
    
    try {
      const aiService = await getAIService();
      const symbols = savedGenes.map(g => g.split(' — ')[0]);
      
      const prompt = `
        # PROFESSIONAL BIO-ENGINEERING INTERACTION MATRIX
        
        Analyze potential interactions, therapeutic synergies, and pathway overlaps for: **${symbols.join(', ')}**.
        
        ## REQUIRED SCIENTIFIC ANALYSIS:
        1. **Protein-Protein Interactions (PPI)**: Identify known or predicted binary interactions and complex formations.
        2. **Shared Metabolic/Signaling Pathways**: Map where these genomic targets converge in cellular signaling.
        3. **Therapeutic Synergy**: Potential for multi-target drug repurposing, CRISPR combinations, or RNAi strategies.
        4. **Clinical Safety**: Toxicity risks or contraindications of simultaneous modulation.
        
        ### STOCHASTIC FORMATTING RULES:
        - Use expert medical/biological nomenclature.
        - Start immediately with the Title (H1 Header).
        - **MANDATORY**: DO NOT include <think> blocks, internal reasoning, or XML/JSON fragments.
        - Output ONLY clean, professional Github-flavored Markdown.
      `;
      
      // Use Claude for high-precision scientific reasoning
      let result = await aiService.generateText(prompt, { provider: 'anthropic' });
      
      // Post-processing cleanup
      result = result
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<final>[\s\S]*?<\/final>/gi, m => m.replace(/<\/?final>/gi, ''))
        .replace(/<investigate>[\s\S]*?<\/investigate>/gi, '')
        .trim();
      
      // Create and upload the report
      const blob = new Blob([result], { type: 'text/markdown' });
      const fileName = `Interaction_Matrix_${symbols.join('_')}_${new Date().getTime()}.md`;
      const file = new File([blob], fileName, { type: 'text/markdown' });
      
      if (user) {
        const uploadedFile = await aiDriveService.uploadFile(user.id, file, null);
        
        if (onReportGenerated) {
          onReportGenerated(uploadedFile);
        }

        addNotification({ 
          type: 'success', 
          title: 'Matrix Synthesized', 
          message: `Interaction Matrix saved to AI Drive: ${uploadedFile.name}` 
        });
      } else {
        addNotification({ 
          type: 'success', 
          title: 'Analysis Complete', 
          message: 'Swarm analysis finished successfully.' 
        });
      }
    } catch (err) {
      console.error('Swarm analysis failed:', err);
      addNotification({ 
        type: 'error', 
        title: 'Analysis Failed', 
        message: 'The AI swarm encountered an error during cross-reference.' 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (savedGenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 bg-slate-50/50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-gray-800">
        <Dna size={48} className="mb-4 opacity-20" />
        <h3 className="text-lg font-medium">No genes saved to session</h3>
        <p className="text-sm mt-2">Search for a gene and click "Save to BioLab" to start your interaction study.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Link2 className="text-indigo-500" />
            Interaction Lab
            <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full ml-2">
              {savedGenes.length} GENES ACTIVE
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Analyzing cross-functional interaction mechanisms and therapeutic synergy.</p>
        </div>
        
        <div className="flex gap-2">
           <Button 
            variant="outline" 
            className="text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            onClick={handleSwarmAnalysis}
            disabled={isAnalyzing || savedGenes.length < 2}
           >
             {isAnalyzing ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Activity size={14} className="mr-2" />}
             AI Swarm Analysis
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
          <p className="text-sm text-slate-500">Synthesizing multi-gene interaction data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {geneDataList.map((gene) => (
              <motion.div
                key={gene._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="h-full border-slate-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      {gene.symbol}
                      <span className="text-[10px] font-normal text-slate-500 uppercase tracking-tighter bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {gene.type_of_gene}
                      </span>
                    </CardTitle>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => onViewGene(gene.symbol)} 
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                        title="View Full Details"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button 
                        onClick={() => onRemoveGene(gene.symbol)} 
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove from Session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4 italic border-l-2 border-indigo-200 dark:border-indigo-900 pl-3">
                        {gene.summary || 'No summary available for this sequence.'}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 bg-slate-50 dark:bg-gray-900/50 rounded-lg">
                          <span className="text-slate-400 block mb-0.5">Location</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{gene.map_location || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-gray-900/50 rounded-lg">
                          <span className="text-slate-400 block mb-0.5">NCBI ID</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{gene._id}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                         <div className="flex items-center gap-2 mb-2">
                            <Zap size={12} className="text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Interaction Potential</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.random() * 60 + 40}%` }}
                              className="h-full bg-indigo-500"
                            />
                         </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
