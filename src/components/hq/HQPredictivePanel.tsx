import React from 'react';
import { Sparkles, CalendarPlus, Mail, FileText, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { PredictiveRecommendation } from '../../services/agents/OrchestrationManifest';


interface HQPredictivePanelProps {
    recommendations: PredictiveRecommendation[];
    onActionClick?: (action: string) => void;
}

export const HQPredictivePanel: React.FC<HQPredictivePanelProps> = ({ recommendations, onActionClick }) => {
    if (!recommendations || recommendations.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'appointment': return <CalendarPlus className="h-4 w-4" />;
            case 'email': return <Mail className="h-4 w-4" />;
            case 'document': return <FileText className="h-4 w-4" />;
            case 'optimization': return <Zap className="h-4 w-4" />;
            default: return <RefreshCw className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'appointment': return "bg-blue-100 text-blue-600 border-blue-200";
            case 'email': return "bg-purple-100 text-purple-600 border-purple-200";
            case 'document': return "bg-amber-100 text-amber-600 border-amber-200";
            case 'optimization': return "bg-emerald-100 text-emerald-600 border-emerald-200";
            default: return "bg-slate-100 text-slate-600 border-slate-200";
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-6 duration-700 delay-300">
            <div className="flex items-center gap-2 px-1">
                <div className="flex -space-x-1">
                    <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Forward Thinking Suggestions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec, idx) => (
                    <div 
                        key={idx}
                        className="group bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className={cn(
                            "absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] transition-all group-hover:scale-150 duration-700",
                            rec.type === 'appointment' ? "bg-blue-500" : 
                            rec.type === 'email' ? "bg-purple-500" : 
                            rec.type === 'document' ? "bg-amber-500" : "bg-emerald-500"
                        )} />

                        <div className="flex flex-col h-full relative z-10">
                            <div className="flex items-start justify-between mb-3">
                                <div className={cn("p-2 rounded-xl border shrink-0", getTypeColor(rec.type))}>
                                    {getIcon(rec.type)}
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full">
                                        <div className="h-1 w-1 bg-indigo-500 rounded-full" />
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{(rec.confidence * 100).toFixed(0)}% Certainty</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 mb-4 flex-1">
                                <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                    {rec.title}
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    {rec.description}
                                </p>
                            </div>

                            <Button 
                                variant="ghost" 
                                className="h-9 w-full bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl border border-slate-100 hover:border-indigo-200 text-[10px] font-bold uppercase tracking-tight gap-2 transition-all active:scale-[0.98]"
                                onClick={() => rec.action && onActionClick && onActionClick(rec.action)}
                            >
                                {rec.action ? (
                                    <>
                                        {rec.action.startsWith('Schedule') ? 'Confirm Appointment' : 
                                         rec.action.startsWith('Draft') ? 'Draft Now' : 'Execute Step'}
                                        <ArrowRight className="h-3 w-3" />
                                    </>
                                ) : 'View Details'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
