import React from 'react';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    ChevronRight,
    ChevronDown,
    Brain,
    Search,
    Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ManifestTask, TaskStatus } from '../../services/agents/OrchestrationManifest';

interface HQWorkflowPanelProps {
    tasks: ManifestTask[];
    onTaskClick?: (taskId: string) => void;
    className?: string;
}

const StatusIcon = ({ status }: { status: TaskStatus }) => {
    switch (status) {
        case 'completed':
            return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
        case 'in-progress':
            return <Zap className="h-3.5 w-3.5 text-blue-500 animate-pulse" />;
        case 'blocked':
            return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
        case 'failed':
            return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
        default:
            return <Circle className="h-3.5 w-3.5 text-slate-300" />;
    }
};

const TaskNode: React.FC<{
    task: ManifestTask;
    allTasks: ManifestTask[];
    level: number;
    onTaskClick?: (taskId: string) => void;
}> = ({ task, allTasks, level, onTaskClick }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const childTasks = allTasks.filter(t => t.parentTaskId === task.id);
    const hasChildren = childTasks.length > 0;

    return (
        <div className="flex flex-col">
            <div
                className={cn(
                    "flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group",
                    level > 0 && "ml-4 border-l border-slate-100"
                )}
                onClick={() => onTaskClick?.(task.id)}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className={cn(
                        "p-0.5 hover:bg-slate-100 rounded transition-colors",
                        !hasChildren && "opacity-0 cursor-default"
                    )}
                >
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                </button>

                <StatusIcon status={task.status} />

                <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-700 truncate">{task.title}</span>
                    {task.assignedAgent && (
                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">{task.assignedAgent}</span>
                    )}
                </div>

                {task.progress !== undefined && task.progress > 0 && task.progress < 100 && (
                    <div className="ml-auto w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${task.progress}%` }} />
                    </div>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="flex flex-col">
                    {childTasks.map(child => (
                        <TaskNode
                            key={child.id}
                            task={child}
                            allTasks={allTasks}
                            level={level + 1}
                            onTaskClick={onTaskClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const HQWorkflowPanel: React.FC<HQWorkflowPanelProps> = ({ tasks, onTaskClick, className }) => {
    const rootTasks = tasks.filter(t => !t.parentTaskId);

    return (
        <div className={cn("space-y-1", className)}>
            <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workflow Hierarchy</h3>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {tasks.length} {tasks.length === 1 ? 'Step' : 'Steps'}
                </span>
            </div>

            <div className="space-y-0.5">
                {rootTasks.length > 0 ? (
                    rootTasks.map(task => (
                        <TaskNode
                            key={task.id}
                            task={task}
                            allTasks={tasks}
                            level={0}
                            onTaskClick={onTaskClick}
                        />
                    ))
                ) : (
                    <div className="px-3 py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Clock className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            No Workflows Active<br />
                            <span className="text-[8px] font-medium italic">Define objectives to begin</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
