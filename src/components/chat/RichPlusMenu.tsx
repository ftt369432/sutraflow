import React from 'react';
import {
    Plus,
    Upload,
    Camera,
    Zap,
    Mail,
    Folder,
    BookOpen,
    Brain,
    ChevronRight,
    MessageSquare,
    Target
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../ui/Popover';
import { cn } from '../../lib/utils';
import { emailSkill } from '../../cortex/skills/EmailSkill';
import { fileSkill } from '../../cortex/skills/FileSkill';
import { knowledgeSkill } from '../../cortex/skills/KnowledgeSkill';
import { heartbeat } from '../../cortex/Heartbeat';
import { useSkillStore } from '../../store/useSkillStore';

interface RichPlusMenuProps {
    onUploadClick?: () => void;
    onCameraClick?: () => void;
    className?: string;
    triggerClassName?: string;
}

export const RichPlusMenu: React.FC<RichPlusMenuProps> = ({
    onUploadClick,
    onCameraClick,
    triggerClassName
}) => {
    const { startSkill, completeSkill, failSkill } = useSkillStore();

    const handleExecuteSkill = async (skillType: 'email' | 'file' | 'knowledge') => {
        let logId = '';
        try {
            switch (skillType) {
                case 'email':
                    logId = startSkill('email_skill', 'Scanning inbox for urgent matters...');
                    const emails = await emailSkill.checkInbox();
                    completeSkill(logId, `Found ${emails.length} new messages.`, { emails });
                    break;
                case 'file':
                    logId = startSkill('file_skill', 'Reading workspace structure...');
                    const files = await fileSkill.listFiles('/');
                    completeSkill(logId, `Workspace has ${files.length} active resources.`, { files });
                    break;
                case 'knowledge':
                    logId = startSkill('knowledge_skill', 'Recalling relevant context...');
                    const memories = await knowledgeSkill.recall('general');
                    completeSkill(logId, `Context synchronization complete.`, { memories });
                    break;
            }
        } catch (error) {
            if (logId) failSkill(logId, 'Skill execution failed', error);
        }
    };

    const handleInternalMonologue = async () => {
        const logId = startSkill('internal_monologue', 'Waking Cortex core...');
        await heartbeat.forcePulse();
        completeSkill(logId, 'Heartbeat pulse successful. Observation loop active.');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-12 w-12 rounded-2xl bg-muted/30 hover:bg-muted shrink-0 shadow-sm border border-border/10 group transition-all duration-300",
                        triggerClassName
                    )}
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-2 rounded-2xl shadow-2xl border-border/20 backdrop-blur-xl z-[100]">
                <div className="space-y-1">
                    <div className="px-3 py-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contextual Actions</span>
                    </div>

                    <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl" onClick={onUploadClick}>
                        <Upload className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Upload Document</span>
                    </Button>

                    <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl" onClick={onCameraClick}>
                        <Camera className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium">Capture Image</span>
                    </Button>

                    <div className="h-px bg-border/10 my-1 mx-2" />

                    <div className="px-3 py-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Cortex Core</span>
                    </div>

                    {/* Skill Sub-items */}
                    <div className="space-y-0.5">
                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-lg group/skill" onClick={() => handleExecuteSkill('email')}>
                            <Mail className="h-4 w-4 text-purple-500 group-hover/skill:scale-110 transition-transform" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-xs font-bold">Email Sensor</span>
                                <span className="text-[9px] text-muted-foreground mt-0.5">Check Gmail Inbox</span>
                            </div>
                        </Button>

                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-lg group/skill" onClick={() => handleExecuteSkill('file')}>
                            <Folder className="h-4 w-4 text-amber-500 group-hover/skill:scale-110 transition-transform" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-xs font-bold">File System</span>
                                <span className="text-[9px] text-muted-foreground mt-0.5">Drive Access</span>
                            </div>
                        </Button>

                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-lg group/skill" onClick={() => handleExecuteSkill('knowledge')}>
                            <BookOpen className="h-4 w-4 text-rose-500 group-hover/skill:scale-110 transition-transform" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-xs font-bold">Recall Memory</span>
                                <span className="text-[9px] text-muted-foreground mt-0.5">Semantic Search</span>
                            </div>
                        </Button>
                    </div>

                    <div className="h-px bg-border/10 my-1 mx-2" />

                    {/* Telepathy / Internal Monologue */}
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-12 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 group/tele"
                        onClick={handleInternalMonologue}
                    >
                        <Zap className="h-4 w-4 text-primary animate-pulse" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-sm font-bold text-primary">Internal Monologue</span>
                            <span className="text-[10px] text-primary/60 mt-0.5 font-mono">Pulse Telepathy Loop</span>
                        </div>
                        <Target className="h-3 w-3 ml-auto opacity-0 group-hover/tele:opacity-100 transition-opacity" />
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
