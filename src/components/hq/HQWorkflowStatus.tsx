import React from 'react';
import { List, ChevronDown, CheckCircle2, Zap, AlertCircle, Circle } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../ui/Popover';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { ManifestTask } from '../../services/agents/OrchestrationManifest';

interface HQWorkflowStatusProps {
    tasks: ManifestTask[];
    onTaskClick?: (taskId: string) => void;
    className?: string;
}

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'completed': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
        case 'in-progress': return <Zap className="h-3 w-3 text-blue-500 animate-pulse" />;
        case 'blocked': return <AlertCircle className="h-3 w-3 text-amber-500" />;
        case 'failed': return <AlertCircle className="h-3 w-3 text-red-500" />;
        default: return <Circle className="h-3 w-3 text-slate-300" />;
    }
};

export const HQWorkflowStatus: React.FC<HQWorkflowStatusProps> = ({
    tasks,
    onTaskClick,
    className
}) => {
    // Show a "0%" or "Planning" state instead of null if we want visibility
    const completedCount = tasks.length > 0 ? tasks.filter(t => t.status === 'completed').length : 0;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className={cn(
                    "flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group relative",
                    className
                )}>
                    <List className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <Badge
                        variant="secondary"
                        className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 bg-indigo-600 text-white text-[8px] font-bold border-white flex items-center justify-center shadow-sm"
                    >
                        {progress}%
                    </Badge>
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-80 p-0 rounded-2xl shadow-2xl border-slate-100 backdrop-blur-xl z-[100] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mission Progress</span>
                    <span className="text-[10px] font-bold text-indigo-600">{completedCount}/{tasks.length} Steps</span>
                </div>
                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {tasks.map(task => (
                        <div
                            key={task.id}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl group/item transition-colors cursor-pointer"
                            onClick={() => onTaskClick?.(task.id)}
                        >
                            <StatusIcon status={task.status} />
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-slate-700 truncate">{task.title}</span>
                                {task.assignedAgent && (
                                    <span className="text-[8px] text-slate-400 font-medium uppercase tracking-tighter">{task.assignedAgent}</span>
                                )}
                            </div>
                            {task.progress !== undefined && task.progress > 0 && task.progress < 100 && (
                                <span className="text-[9px] font-bold text-slate-400">{task.progress}%</span>
                            )}
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};
