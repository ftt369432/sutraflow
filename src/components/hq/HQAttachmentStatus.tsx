import React from 'react';
import { Folder, FileText, X, ChevronDown, Paperclip } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../ui/Popover';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface PinnedItem {
    id: string;
    type: 'file' | 'folder';
    name: string;
}

interface HQAttachmentStatusProps {
    items: PinnedItem[];
    onUnpin: (itemId: string) => void;
    onItemClick: (itemId: string) => void;
    className?: string;
}

export const HQAttachmentStatus: React.FC<HQAttachmentStatusProps> = ({
    items,
    onUnpin,
    onItemClick,
    className
}) => {
    if (items.length === 0) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className={cn(
                    "flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group relative",
                    className
                )}>
                    <Folder className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Badge
                        variant="secondary"
                        className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 bg-slate-800 text-white text-[8px] font-bold border-white flex items-center justify-center shadow-sm"
                    >
                        {items.length}
                    </Badge>
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100 backdrop-blur-xl z-[100]">
                <div className="px-3 py-2 border-b border-slate-50 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Attached Context</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 p-1">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl group/item transition-colors">
                            <div
                                className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                                onClick={() => onItemClick(item.id)}
                            >
                                {item.type === 'folder' ? (
                                    <Folder className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                ) : (
                                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                )}
                                <span className="text-[11px] font-bold text-slate-600 truncate">{item.name}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUnpin(item.id);
                                }}
                                className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};
