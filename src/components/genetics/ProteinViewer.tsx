import React, { useRef, useEffect, useState } from 'react';
import * as $3Dmol from '3dmol';
import { Button } from '../ui/Button';
import { Layers, Zap } from 'lucide-react';

interface ProteinViewerProps {
  pdbId: string;
}

export const ProteinViewer: React.FC<ProteinViewerProps> = ({ pdbId }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [highlighted, setHighlighted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeViewer: any = null;
    const initializeViewer = () => {
      if (!viewerRef.current) return;
      try {
        setLoading(true);
        const element = viewerRef.current;
        const config = { backgroundColor: '#030712' }; // Matches gray-950 in Tailwind
        
        activeViewer = $3Dmol.createViewer(element, config);
        
        // Fetch the structure using the download function from 3dmol
        // For LMNA, we typically visualize '1IFR'
        $3Dmol.download(`pdb:${pdbId}`, activeViewer, { defaultcolors: $3Dmol.rasmolElementColors }, () => {
          activeViewer.setStyle({}, { cartoon: { color: 'spectrum' } });
          activeViewer.zoomTo();
          activeViewer.render();
          setViewer(activeViewer);
          setLoading(false);
        });

      } catch (err) {
        console.error("Error initializing 3Dmol viewer:", err);
        setLoading(false);
      }
    };

    initializeViewer();

    return () => {
       if (activeViewer) activeViewer.clear();
    };
  }, [pdbId]);

  const toggleHighlight = () => {
    if (!viewer) return;
    
    if (!highlighted) {
      // Highlight mutation p.Gly608Gly, meaning we highlight residue 608
      viewer.setStyle({ resi: 608 }, { stick: { colorscheme: 'redCarbon', radius: 0.3 }, sphere: { radius: 0.5, color: 'red' } });
      viewer.addLabel("p.Gly608Gly", {
        position: { resi: 608 },
        backgroundColor: '#ef4444',
        fontColor: 'white',
      });
      // Also maybe color the rest of the protein dimly to make it pop
      viewer.setStyle({ not: { resi: 608 } }, { cartoon: { style: 'trace', color: 'lightgray', opacity: 0.5 } });
      viewer.zoomTo({ resi: 608 });
      setHighlighted(true);
    } else {
      // Reset the view
      viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
      viewer.removeAllLabels();
      viewer.zoomTo();
      setHighlighted(false);
    }
    viewer.render();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
         {loading ? (
             <span className="px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg text-xs font-mono text-emerald-400 animate-pulse">
                Initializing AlphaFold Simulation...
             </span>
         ) : (
            <span className="px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400">
                Structure: {pdbId.toUpperCase()} (LMNA)
            </span>
         )}
      </div>
      <div className="absolute top-4 right-4 z-10">
        <Button 
          onClick={toggleHighlight} 
          disabled={loading || !viewer}
          size="sm"
          className={`px-4 py-2 flex items-center gap-2 transition-all ${
             highlighted 
               ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
               : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30'
          }`}
        >
          {highlighted ? <Layers size={16} /> : <Zap size={16} />}
          {highlighted ? 'Reset Structure Explorer' : 'Highlight Target (p.Gly608Gly)'}
        </Button>
      </div>
      <div ref={viewerRef} className="flex-1 w-full relative min-h-[400px]"></div>
    </div>
  );
};
