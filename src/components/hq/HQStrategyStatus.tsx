import React, { useState } from 'react';
import { Target, ChevronDown, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../ui/Popover';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { OrchestrationPlan } from '../../services/agents/OrchestrationManifest';
import { AIAgentOrchestrator } from '../../services/agents/AIAgentOrchestrator';
import { useAuth } from '../../contexts/AuthContext';

interface HQStrategyStatusProps {
    missionId: string;
    plan: OrchestrationPlan;
    className?: string;
}

export const HQStrategyStatus: React.FC<HQStrategyStatusProps> = ({
    missionId,
    plan,
    className
}) => {
    const { user } = useAuth();
    const [isApproving, setIsApproving] = useState(false);

    if (!plan) return null;

    const handleApprove = async () => {
        if (!user) return;
        setIsApproving(true);
        try {
            const orchestrator = AIAgentOrchestrator.getInstance();
            await orchestrator.approvePlan(
                missionId, 
                user.id, 
                `orchestration_manifest_${missionId}`
            );
        } catch (error) {
            console.error('❌ Failed to approve plan:', error);
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className={cn(
                    "flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group relative",
                    plan.approved ? "border-emerald-200 bg-emerald-50/20" : (!plan.approved ? "border-amber-200 bg-amber-50/30 animate-pulse" : ""),
                    className
                )}>
                    <Target className={cn(
                        "h-5 w-5 transition-colors",
                        plan.approved ? "text-emerald-500" : "text-slate-400 group-hover:text-emerald-500"
                    )} />
                    {plan.approved && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <CheckCircle2 className="h-2 w-2 text-white" />
                        </div>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-80 p-0 rounded-2xl shadow-2xl border-slate-100 backdrop-blur-xl z-[100] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Strategic Plan</span>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Current Objective</span>
                        <h4 className="text-[13px] font-bold text-slate-800 leading-tight">{plan.goal}</h4>
                    </div>

                    <div className="space-y-2">
                        {plan.steps.slice(0, 5).map((step, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 border text-[8px] font-bold",
                                    step.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" :
                                        step.status === 'in-progress' ? "bg-blue-600 border-blue-600 text-white animate-pulse" :
                                            "bg-white border-slate-200 text-slate-400"
                                )}>
                                    {step.status === 'completed' ? <CheckCircle2 className="h-2.5 w-2.5" /> : i + 1}
                                </div>
                                <span className={cn(
                                    "text-[11px] font-medium leading-tight",
                                    step.status === 'completed' ? "text-slate-400 line-through" : "text-slate-600"
                                )}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    {!plan.approved && (
                        <Button 
                            onClick={handleApprove} 
                            disabled={isApproving}
                            className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs gap-2 shadow-lg"
                        >
                            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            {isApproving ? 'Resuming Swarm...' : 'Approve & Execute Strategy'}
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
