import React from 'react';
import {
    CheckCircle2,
    ShieldCheck,
    FileText,
    MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Walkthrough } from '../../services/agents/OrchestrationManifest';

interface HQWalkthroughPanelProps {
    walkthrough: Walkthrough;
    className?: string;
}

export const HQWalkthroughPanel: React.FC<HQWalkthroughPanelProps> = ({ walkthrough, className }) => {
    if (!walkthrough) return null;

    return (
        <div className={cn("space-y-6 animate-in slide-in-from-bottom-4 duration-500", className)}>
            {/* Walkthrough Header */}
            <div className="bg-gradient-to-br from-emerald-50/50 to-white p-5 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldCheck className="h-24 w-24 text-emerald-600" />
                </div>

                <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Mission Accomplished</span>
                        <h2 className="text-lg font-bold text-slate-800 leading-tight">{walkthrough.title}</h2>
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {walkthrough.summary}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Verified at {new Date(walkthrough.completedAt).toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Verification Steps */}
            <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Proof of Work</span>
                {walkthrough.steps.map((step, idx) => (
                    <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex gap-4 items-start group hover:border-emerald-100 transition-colors"
                    >
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>

                        <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-sm text-slate-800">
                                {step.description}
                            </h4>

                            {/* Evidence / Artifacts */}
                            {step.evidence && step.evidence.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {step.evidence.map((ev, i) => (
                                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                            {ev.type === 'file' ? <FileText className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                            {ev.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
