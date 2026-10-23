import React from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useConsolidatedState } from '../../hooks/useConsolidatedState';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../ui/Popover';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Bot, ChevronDown, Check, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PersonaSelector() {
    const { assistants } = useAssistantStore();
    const { chatState, updateChatState } = useConsolidatedState();
    const { selectedAssistant } = chatState;
    const [open, setOpen] = React.useState(false);

    // Group assistants by category (optional, but good for organization)
    const groupedAssistants = React.useMemo(() => {
        const groups: Record<string, typeof assistants> = {
            'Legal': [],
            'Medical': [],
            'Business': [],
            'General': []
        };

        assistants.forEach(a => {
            // Basic heuristic for categorization if metadata is missing
            const category = (a.metadata?.category ||
                (a.name.includes('Legal') ? 'Legal' :
                    a.name.includes('Medical') ? 'Medical' :
                        a.name.includes('Business') ? 'Business' : 'General')) as string;

            if (groups[category]) {
                groups[category].push(a);
            } else {
                groups['General'].push(a);
            }
        });

        return groups;
    }, [assistants]);

    const handleSelect = (assistant: typeof assistants[0]) => {
        updateChatState({ selectedAssistant: assistant });
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[240px] justify-between border-dashed border-border/60 hover:border-primary/50"
                >
                    <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-5 w-5">
                            {selectedAssistant?.avatar ? (
                                <AvatarImage src={selectedAssistant.avatar} />
                            ) : (
                                <AvatarFallback className="bg-primary/10">
                                    <Bot className="h-3 w-3 text-primary" />
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <span className="truncate">
                            {selectedAssistant?.name || "Select Persona..."}
                        </span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <div className="p-2 border-b bg-muted/20">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">
                        Active Persona
                    </h4>
                    {selectedAssistant ? (
                        <div className="flex items-start gap-3 p-2 bg-background rounded-md border">
                            <Avatar className="h-8 w-8 mt-1">
                                {selectedAssistant.avatar ? (
                                    <AvatarImage src={selectedAssistant.avatar} />
                                ) : (
                                    <AvatarFallback className="bg-primary/10">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none mb-1">
                                    {selectedAssistant.name}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {selectedAssistant.description}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground p-2">No active persona</p>
                    )}
                </div>

                <div className="max-h-[300px] overflow-y-auto p-1">
                    {Object.entries(groupedAssistants).map(([category, items]) => (
                        items.length > 0 && (
                            <div key={category} className="mb-2">
                                <h5 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    {category}
                                </h5>
                                {items.map((assistant) => (
                                    <div
                                        key={assistant.id}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer hover:bg-accent transition-colors",
                                            selectedAssistant?.id === assistant.id && "bg-accent/50"
                                        )}
                                        onClick={() => handleSelect(assistant)}
                                    >
                                        <Avatar className="h-6 w-6">
                                            {assistant.avatar ? (
                                                <AvatarImage src={assistant.avatar} />
                                            ) : (
                                                <AvatarFallback>
                                                    <User className="h-3 w-3" />
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {assistant.name}
                                            </p>
                                        </div>
                                        {selectedAssistant?.id === assistant.id && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ))}
                    {assistants.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No personas found. Create one in the Assistant Creator.
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
