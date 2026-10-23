import React from 'react';
import { ImplementationPlan, ManifestTask } from '../../services/agents/OrchestrationManifest';
import { CheckCircle2, Circle, FastForward, PlayCircle, Loader2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/Tooltip";

interface MissionTimelineProps {
    plan: ImplementationPlan;
    tasks: Record<string, ManifestTask>;
}

export const MissionTimeline: React.FC<MissionTimelineProps> = ({ plan, tasks }) => {
    if (!plan || !plan.steps || plan.steps.length === 0) return null;

    return (
        <div className="flex flex-col gap-6 py-6 px-4 bg-slate-50 border border-slate-100/50 rounded-3xl animate-in slide-in-from-left duration-700">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 border-b border-slate-200 pb-2">
                Mission Execution Timeline
            </h3>

            <div className="relative border-l-2 border-slate-200/50 ml-8 space-y-6">
                {plan.steps.map((step, idx) => {
                    const task = step.taskId ? tasks[step.taskId] : null;
                    const isCompleted = step.status === 'completed' || task?.status === 'completed';
                    const isInProgress = step.status === 'in-progress' || task?.status === 'in-progress';
                    
                    const stepIcon = isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 bg-white rounded-full shadow-sm" />
                    ) : isInProgress ? (
                        <Loader2 className="h-5 w-5 text-blue-500 bg-white rounded-full animate-spin shadow-sm" />
                    ) : (
                        <Circle className="h-5 w-5 text-slate-300 bg-white rounded-full shadow-sm" />
                    );

                    return (
                        <div key={idx} className="relative pl-8 group">
                            {/* Step Indicator */}
                            <div className="absolute -left-[11px] top-1">
                                {stepIcon}
                            </div>
                            
                            {/* Content */}
                            <div className={cn(
                                "flex flex-col gap-1 transition-all p-3 rounded-2xl border bg-white shadow-sm hover:shadow-md",
                                isCompleted ? "border-emerald-100" : isInProgress ? "border-blue-200 ring-2 ring-blue-50" : "border-slate-100 opacity-60 hover:opacity-100"
                            )}>
                                <div className="flex items-center justify-between">
                                    <h4 className={cn("text-xs font-bold tracking-tight", isCompleted ? "text-slate-700" : isInProgress ? "text-blue-700" : "text-slate-500")}>
                                        {step.title}
                                    </h4>
                                    
                                    {/* Reasoning Tooltip (Thoughts) */}
                                    {task && task.thoughts && task.thoughts.length > 0 && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-400 rounded-lg transition-colors border border-slate-200">
                                                        <Info className="h-3 w-3" />
                                                        View Reasoning
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[300px] p-4 bg-slate-900 text-slate-300 border-none shadow-2xl rounded-2xl break-words">
                                                    <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-premium">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Agent Thoughts</span>
                                                        {task.thoughts.map((thought, tIdx) => (
                                                            <div key={tIdx} className="flex flex-col gap-1 border-l-2 border-slate-700 pl-3">
                                                                <span className={cn(
                                                                    "text-[9px] font-bold uppercase tracking-widest",
                                                                    thought.step === 'think' ? "text-purple-400" :
                                                                    thought.step === 'research' ? "text-blue-400" :
                                                                    thought.step === 'act' ? "text-emerald-400" : "text-amber-400"
                                                                )}>{thought.step}</span>
                                                                <p className="text-xs leading-relaxed text-slate-300">
                                                                    {thought.content}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
