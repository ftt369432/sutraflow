import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { Activity, Beaker, ShieldAlert, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SimulationResult {
  therapyType: 'CRISPR' | 'ASO' | 'SmallMolecule' | 'GeneTherapy';
  targetGene: string;
  mutation: string;
  prediction: string;
  feasibilityScore: number;
  potentialRisks: string[];
  pathwayImpact: {
    node: string;
    impact: 'normalizing' | 'disrupting' | 'enhancing';
    description: string;
  }[];
  suggestedNextSteps: string[];
}

interface SovereignLabVisualizerProps {
  data: SimulationResult;
  className?: string;
}

export const SovereignLabVisualizer: React.FC<SovereignLabVisualizerProps> = ({ data, className }) => {
  const COLORS = {
    normalizing: '#10b981', // Emerald
    disrupting: '#ef4444',  // Red
    enhancing: '#3b82f6',   // Blue
  };

  const chartData = data.pathwayImpact.map(impact => ({
    name: impact.node,
    value: impact.impact === 'normalizing' ? 100 : impact.impact === 'enhancing' ? 80 : 40,
    impact: impact.impact,
    description: impact.description
  }));

  return (
    <div className={cn("flex flex-col h-full bg-[#0a0a0b] text-white p-6 overflow-auto", className)}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
            <Beaker className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sovereign Lab: Molecular Simulation</h1>
            <p className="text-xs uppercase tracking-widest text-emerald-500/70 font-bold">Predicted Interaction Result</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Target Entity</div>
          <div className="text-xl font-mono text-blue-400 font-bold">{data.targetGene}:{data.mutation}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Feasibility Gauge */}
        <div className="bg-[#0f0f12] border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">Feasibility Score</div>
          <div className="relative h-32 w-32">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                    data={[
                      { value: data.feasibilityScore },
                      { value: 100 - data.feasibilityScore }
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    startAngle={180}
                    endAngle={0}
                    dataKey="value"
                 >
                   <Cell fill="#10b981" />
                   <Cell fill="#1a1a1e" />
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                <span className="text-3xl font-bold">{data.feasibilityScore}%</span>
                <span className="text-[8px] text-emerald-500 font-bold uppercase">Confidence</span>
             </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center px-4">Based on current delivery systems and known off-targets.</p>
        </div>

        {/* Therapy Modality */}
        <div className="bg-[#0f0f12] border border-gray-800 rounded-3xl p-6 flex flex-col justify-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Applied Modality</div>
          <div className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            {data.therapyType}
          </div>
          <div className="space-y-2">
             <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '85%' }} />
             </div>
             <p className="text-[10px] text-gray-500 leading-relaxed">
               Simulation models the delivery of molecular payloads into cardiac and specialized neuronal tissue pathways.
             </p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
             <ShieldAlert className="w-4 h-4 text-red-500" />
             <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Bio-Hazard / Risk Factors</span>
          </div>
          <ul className="space-y-3">
            {data.potentialRisks.map((risk, i) => (
              <li key={i} className="text-[11px] flex gap-2 text-gray-300">
                <div className="h-1 w-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pathway Impact Chart */}
        <div className="bg-[#0f0f12] border border-gray-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              <Activity className="w-4 h-4 text-blue-400" />
              Pathway Normalization Map
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} width={80} />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.impact as keyof typeof COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictive Narrative */}
        <div className="flex flex-col gap-4">
           <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex-1">
             <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">Molecular Narrative</div>
             <p className="text-sm leading-relaxed text-gray-300 italic">
               "{data.prediction}"
             </p>
           </div>
           <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-4">Suggested Next Steps</div>
              <div className="space-y-2">
                {data.suggestedNextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs bg-black/20 p-2 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                    <span className="text-gray-200">{step}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
