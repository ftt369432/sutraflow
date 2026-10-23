import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Button } from '../ui/Button';
import { Download, RefreshCw, Table as TableIcon, Activity, PieChart as PieIcon, FileJson, Beaker } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SovereignLabVisualizer } from '../bio/SovereignLabVisualizer';
import { MarkdownMessage } from '../ai/MarkdownMessage';

export const isMermaidContent = (txt: string): boolean => {
  if (!txt) return false;
  if (txt.includes('```mermaid')) return true;
  return /^\s*(graph\s+(TD|TB|BT|RL|LR)|flowchart\s+(TD|TB|BT|RL|LR)|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)\b/m.test(txt);
};

// Initializing mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

interface SovereignVisualizerProps {
  content: string;
  type?: string;
  className?: string;
  onEdit?: (newContent: string) => void;
}

export const SovereignVisualizer: React.FC<SovereignVisualizerProps> = ({ 
  content, 
  type, 
  className,
  onEdit 
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'data' | 'raw'>('visual');
  const [error, setError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);

  // 🧠 URENO PRINCIPLE: Intelligent Parsing
  useEffect(() => {
    try {
      // Try to find JSON array for data grid
      const jsonMatch = content.match(/\[\s*\{\s*".+?"\s*:\s*.+?\s*\}\s*\]/g);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setParsedData(data);
        setError(null);
      } else {
        setParsedData(null);
      }

      // If it's real mermaid, render it
      if (isMermaidContent(content)) {
        renderMermaid();
      }
    } catch (err) {
      console.warn('⚠️ Visualizer: Parsing error', err);
      // Don't set error yet, it might just be markdown
    }
  }, [content]);

  const renderMermaid = async () => {
    if (!mermaidRef.current) return;
    try {
      const cleanContent = content
        .replace(/```mermaid/g, '')
        .replace(/```/g, '')
        .trim();
      
      const { svg } = await mermaid.render(`mermaid-${Date.now()}`, cleanContent);
      mermaidRef.current.innerHTML = svg;
    } catch (err) {
      console.error('❌ Mermaid rendering failed:', err);
      setError('Failed to render diagram. Check syntax.');
    }
  };

  // 📊 Chart Detection & Component Selection
  const renderChart = () => {
    if (!parsedData || parsedData.length === 0) return null;

    const keys = Object.keys(parsedData[0]);
    const numKeys = keys.filter(k => typeof parsedData[0][k] === 'number');
    const labelKey = keys.find(k => typeof parsedData[0][k] === 'string') || keys[0];

    if (numKeys.length === 0) return <p className="text-gray-400">No numerical data found for charting.</p>;

    return (
      <div className="h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={parsedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={labelKey} stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <Legend />
            {numKeys.map((key, i) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#10b981'} 
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderDataGrid = () => {
    if (!parsedData || parsedData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
          <FileJson className="w-12 h-12 mb-4 opacity-20" />
          <p>No structured data found. AI needs to provide a JSON array for Grid view.</p>
        </div>
      );
    }

    const headers = Object.keys(parsedData[0]);

    return (
      <div className="overflow-auto max-h-[600px] rounded-lg border border-gray-800 bg-gray-900/50">
        <Table>
          <TableHeader className="bg-gray-800/80 sticky top-0">
            <TableRow>
              {headers.map(h => (
                <TableHead key={h} className="text-blue-400 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parsedData.map((row, i) => (
              <TableRow key={i} className="hover:bg-white/5 border-gray-800">
                {headers.map(h => (
                  <TableCell key={h} className="text-gray-300 font-mono text-xs whitespace-nowrap">
                    {String(row[h])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#0a0a0b] text-white", className)}>
      {/* 🚀 Visualizer Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0f0f12]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">
              {type === 'simulation_lab' ? 'Sovereign Lab' : 'Sovereign Visualizer'}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              {type === 'simulation_lab' ? 'Molecular Simulation' : 'HQ Intelligence Output'}
            </p>
          </div>
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-gray-800">
          {type === 'simulation_lab' && (
             <Button 
               variant="ghost" 
               size="sm" 
               className={cn("px-3 h-8 text-xs gap-2 rounded-lg bg-emerald-600 text-white shadow-lg")}
             >
               <Beaker className="w-3.5 h-3.5" />
               Simulation
             </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("px-3 h-8 text-xs gap-2 rounded-lg", activeTab === 'visual' && "bg-blue-600 text-white shadow-lg")}
            onClick={() => setActiveTab('visual')}
          >
            <Activity className="w-3.5 h-3.5" />
            Graph View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("px-3 h-8 text-xs gap-2 rounded-lg", activeTab === 'data' && "bg-purple-600 text-white shadow-lg")}
            onClick={() => setActiveTab('data')}
          >
            <TableIcon className="w-3.5 h-3.5" />
             Grid Analysis
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("px-3 h-8 text-xs gap-2 rounded-lg", activeTab === 'raw' && "bg-gray-800 text-white shadow-lg")}
            onClick={() => setActiveTab('raw')}
          >
            <FileJson className="w-3.5 h-3.5" />
            Raw Data
          </Button>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-800" onClick={() => renderMermaid()}>
             <RefreshCw className="w-3.5 h-3.5" />
           </Button>
           <Button variant="outline" size="sm" className="h-8 gap-2 border-gray-800 text-gray-400">
             <Download className="w-3.5 h-3.5" />
             Export
           </Button>
        </div>
      </div>

      {/* 🔮 Dynamic Rendering Area */}
      <div className="flex-1 overflow-auto p-6 bg-[radial-gradient(circle_at_50%_0%,_#111115_0%,_#0a0a0b_100%)]">
        {type === 'simulation_lab' && parsedData ? (
           <SovereignLabVisualizer data={parsedData as any} />
        ) : (
          <>
            {activeTab === 'visual' && (
              <div className="h-full flex flex-col items-center w-full">
                 {/* If it has data, show a chart. If it has mermaid, show mermaid. */}
                 {parsedData && renderChart()}
                 {isMermaidContent(content) && <div ref={mermaidRef} className="w-full flex justify-center py-8" />}
                 {!parsedData && !isMermaidContent(content) && (
                   content && content.trim().length > 0 ? (
                     <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200">
                       <MarkdownMessage content={content} />
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center h-full text-gray-500 max-w-md text-center py-12">
                       <PieIcon className="w-16 h-16 mb-4 opacity-10" />
                       <h3 className="text-white font-medium mb-1">Waiting for Visual Data</h3>
                       <p className="text-sm">Ask the AI to "create a flowchart", "visualize this as a bar chart", or "generate a spreadsheet grid".</p>
                     </div>
                   )
                 )}
              </div>
            )}

            {activeTab === 'data' && renderDataGrid()}

            {activeTab === 'raw' && (
              <div className="h-full font-mono text-sm bg-black/40 p-4 rounded-lg border border-gray-800 text-blue-300">
                <pre className="whitespace-pre-wrap">{content}</pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* ⚠️ Error Banner */}
      {error && (
        <div className="p-2 px-4 bg-red-900/50 border-t border-red-500/50 text-red-200 text-xs flex justify-between items-center">
          <span>{error}</span>
          <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={() => setError(null)}>Dismiss</Button>
        </div>
      )}
    </div>
  );
};
