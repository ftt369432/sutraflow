import React, { useState } from 'react';
import {
    Target,
    CheckCircle2,
    Zap,
    AlertTriangle,
    RefreshCw,
    Send,
    Brain
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { AIAgentOrchestrator } from '../../services/agents/AIAgentOrchestrator';

interface HQStrategyPanelProps {
    plan: any; // Type should be ImplementationPlan from manifest
    missionId: string;
}

export const HQStrategyPanel: React.FC<HQStrategyPanelProps> = ({ plan, missionId }) => {
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    if (!plan) return null;

    const orchestrator = AIAgentOrchestrator.getInstance();

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Plan Header */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Target className="h-24 w-24 text-indigo-600" />
                </div>

                <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                        <Target className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Strategic Goal</span>
                        <h2 className="text-lg font-bold text-slate-800 leading-tight">{plan.goal}</h2>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Strategy Execution</span>
                        <span className="text-sm font-bold text-indigo-600">{plan.progress}%</span>
                    </div>
                    <Progress value={plan.progress} className="h-2 bg-slate-100" />
                </div>
            </div>

            {/* Steps Breakdown */}
            <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Execution Phases</span>
                {plan.steps.map((step: any, idx: number) => (
                    <div
                        key={idx}
                        className={cn(
                            "p-4 rounded-2xl border transition-all flex gap-4 items-start",
                            step.status === 'completed' ? "bg-slate-50 border-slate-200 opacity-80" :
                                step.status === 'in-progress' ? "bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100" :
                                    "bg-white border-slate-100"
                        )}
                    >
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2",
                            step.status === 'completed' ? "bg-emerald-500 border-emerald-500" :
                                step.status === 'in-progress' ? "bg-indigo-600 border-indigo-600 animate-pulse" :
                                    "bg-white border-slate-200 text-slate-300 font-bold text-[10px]"
                        )}>
                            {step.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> :
                                step.status === 'in-progress' ? <Zap className="h-3 w-3 text-white" /> :
                                    idx + 1}
                        </div>

                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <h4 className={cn(
                                    "font-bold text-sm",
                                    step.status === 'completed' ? "text-slate-500 line-through" : "text-slate-800"
                                )}>
                                    {step.title}
                                </h4>
                                {step.assignedAgent && (
                                    <Badge variant="outline" className="text-[9px] h-4 bg-slate-50 border-slate-200 text-slate-500">
                                        {step.assignedAgent}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Risks */}
            {plan.risks && plan.risks.length > 0 && (
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Identified Risks</span>
                    </div>
                    <ul className="space-y-1">
                        {plan.risks.map((risk: string, i: number) => (
                            <li key={i} className="text-[11px] text-orange-700 font-medium flex gap-2">
                                <span className="text-orange-300">•</span> {risk}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 🎯 APPROVAL GATE */}
            {!plan.approved && (
                <div className="p-6 bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-300">
                    <div className="flex items-start gap-4 text-white mb-6">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Brain className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold">Approve Mission Strategy</h3>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                The Sovereign Agent has proposed this implementation plan. Review the steps and approve to authorize execution, or provide feedback to revise.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="flex-1 h-12 bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl shadow-lg shadow-black/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                            onClick={async () => {
                                console.log('✅ STRATEGY APPROVED: Resuming mission...');
                                if (missionId) {
                                    await orchestrator.approveStrategy(missionId, 'current-user');
                                }
                            }}
                        >
                            <Zap className="h-4 w-4 fill-current" />
                            Approve & Execute
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 font-bold rounded-xl backdrop-blur-sm"
                            onClick={() => setShowFeedback(!showFeedback)}
                        >
                            {showFeedback ? 'Cancel' : 'Provide Feedback'}
                        </Button>
                    </div>

                    {/* 💬 FEEDBACK INPUT */}
                    {showFeedback && (
                        <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Describe changes to the plan... (e.g., 'Add a step to verify the database backup', 'Remove the email notification step')"
                                className="w-full h-24 p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                            <Button
                                className="mt-3 w-full h-10 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                                disabled={!feedbackText.trim() || isSubmittingFeedback}
                                onClick={async () => {
                                    if (!feedbackText.trim() || !missionId) return;
                                    setIsSubmittingFeedback(true);
                                    try {
                                        console.log('💬 Submitting feedback:', feedbackText);
                                        await orchestrator.providePlanFeedback(missionId, feedbackText.trim(), 'current-user');
                                        setFeedbackText('');
                                        setShowFeedback(false);
                                    } catch (error) {
                                        console.error('❌ Feedback submission failed:', error);
                                    } finally {
                                        setIsSubmittingFeedback(false);
                                    }
                                }}
                            >
                                {isSubmittingFeedback ? (
                                    <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Revising Strategy...</>
                                ) : (
                                    <><Send className="h-4 w-4 mr-2" /> Submit Feedback</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
