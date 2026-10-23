import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Sparkles, Wand2, Activity, Play } from 'lucide-react';
import { Button } from '../ui/Button';

interface MoleculeProposal {
  id: string;
  name: string;
  smiles: string;
  predictedAffinity: number;
  toxicityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'GENERATED' | 'SIMULATING' | 'VALIDATED';
}

export const MoleculeGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposals, setProposals] = useState<MoleculeProposal[]>([
    {
      id: 'MOL-001A',
      name: 'GenieBio-Candidate-Alpha',
      smiles: 'CC1=C(C=C(C=C1)Cl)C2=NC3=CC=CC=C3N2CC4=CC=C(C=C4)F',
      predictedAffinity: -10.2,
      toxicityRisk: 'LOW',
      status: 'VALIDATED'
    }
  ]);

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Simulate diffusion model generation time
    setTimeout(() => {
      const newMol: MoleculeProposal = {
        id: `MOL-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        name: `GenieBio-Candidate-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C...[Generative SMILES String]',
        predictedAffinity: -(Math.random() * 4 + 8).toFixed(2) as unknown as number,
        toxicityRisk: Math.random() > 0.8 ? 'MEDIUM' : 'LOW',
        status: 'GENERATED'
      };
      
      setProposals(prev => [newMol, ...prev]);
      setIsGenerating(false);
    }, 3000);
  };

  const runSimulation = (id: string) => {
    setProposals(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'SIMULATING' } : p
    ));
    
    setTimeout(() => {
      setProposals(prev => prev.map(p => 
        p.id === id ? { ...p, status: 'VALIDATED' } : p
      ));
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full max-w-4xl mx-auto">
      
      <div className="bg-white dark:bg-gray-900 border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-emerald-500 dark:text-emerald-400" size={20} />
            Generative Molecular AI (Digital Twin)
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Autonomous generation of novel small molecules designed to fit the mutated target pocket.</p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2"><Activity className="animate-pulse" size={16} /> Designing...</span>
          ) : (
            <span className="flex items-center gap-2"><Wand2 size={16} /> Generate Novel Molecule</span>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid gap-4 w-full">
          <AnimatePresence>
            {proposals.map((mol, idx) => (
              <motion.div 
                key={mol.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group shadow-sm"
              >
                {/* Background decorative element */}
                <div className="absolute -right-10 -bottom-10 text-slate-200 dark:text-gray-800 opacity-50 group-hover:opacity-100 transition-opacity">
                  <Beaker size={120} />
                </div>

                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <h4 className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mb-1">{mol.name}</h4>
                    <p className="text-xs font-mono text-slate-600 dark:text-gray-500 bg-slate-50 dark:bg-gray-950 px-2 py-1 rounded border border-slate-100 dark:border-gray-800 break-all max-w-lg">
                      {mol.smiles}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {mol.status === 'GENERATED' && (
                      <Button onClick={() => runSimulation(mol.id)} variant="outline" size="sm" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                        <Play size={14} className="mr-1.5" /> Run In Silico Trial
                      </Button>
                    )}
                    {mol.status === 'SIMULATING' && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs rounded border border-indigo-500/20 font-medium">
                        <Activity className="animate-spin" size={14} /> Running Simulation...
                      </div>
                    )}
                    {mol.status === 'VALIDATED' && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20 font-medium">
                        <Sparkles size={14} /> Simulation Completed
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 relative z-10 pt-2 border-t border-slate-100 dark:border-gray-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1">Binding Affinity (ΔG)</p>
                    <p className="text-slate-800 dark:text-gray-200 font-mono text-sm">{mol.predictedAffinity} kcal/mol</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1">Toxicity Risk (ADMET)</p>
                    <p className={`font-medium text-sm ${mol.toxicityRisk === 'LOW' ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {mol.toxicityRisk}
                    </p>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button variant="ghost" size="sm" disabled={mol.status !== 'VALIDATED'} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white">
                      Export to LIMS
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
