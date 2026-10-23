import React, { useState } from 'react';
import { useSmartTemplateStore, SmartTemplate } from '../../store/smartTemplateStore';
import { useConsolidatedState } from '../../hooks/useConsolidatedState';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea'; // Corrected path
import {
    Wand2,
    Plus,
    Search,
    FileText,
    Trash2,
    Edit,
    Play,
    ArrowLeft,
    Sparkles,
    Layout,
    Layers,
    FolderSync,
    Zap,
    Pin,
    PinOff,
    GripVertical
} from 'lucide-react';
import { cn } from '../../lib/utils'; // Adjust path if needed
import { LegalAgent } from '../../services/agents/LegalAgent';
import { toast } from 'sonner';

interface SmartTemplateSelectorProps {
    onTemplateSelected?: (content: string) => void;
    onPinTemplate?: (template: SmartTemplate) => void;
}

export function SmartTemplateSelector({ onTemplateSelected, onPinTemplate }: SmartTemplateSelectorProps) {
    const { templates, addTemplate, removeTemplate, incrementUsage, extractVariables } = useSmartTemplateStore();
    const { updateChatState } = useConsolidatedState();

    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'list' | 'execute' | 'create' | 'import'>('list');
    const [activeTemplate, setActiveTemplate] = useState<SmartTemplate | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Execution State
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});

    // Creation State
    const [newTemplateContent, setNewTemplateContent] = useState('');
    const [newTemplateName, setNewTemplateName] = useState('');
    const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

    // Import State
    const [rawImportText, setRawImportText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleTemplateClick = (template: SmartTemplate) => {
        setActiveTemplate(template);
        // Initialize empty values
        const initialValues: Record<string, string> = {};
        template.variables.forEach(v => initialValues[v] = '');
        setVariableValues(initialValues);
        setView('execute');
    };

    const handleExecute = () => {
        if (!activeTemplate) return;

        let finalContent = activeTemplate.content;

        // Replace {{Variable}} and [Variable]
        Object.entries(variableValues).forEach(([key, value]) => {
            // Replace {{Key}}
            finalContent = finalContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
            // Replace [Key]
            finalContent = finalContent.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
        });

        incrementUsage(activeTemplate.id);

        // Either call prop or directly set input
        if (onTemplateSelected) {
            onTemplateSelected(finalContent);
        } else {
            updateChatState({ input: finalContent });
        }

        setIsOpen(false);
        resetState();
    };

    const handleCreate = () => {
        if (!newTemplateName || !newTemplateContent) return;

        addTemplate({
            name: newTemplateName,
            content: newTemplateContent,
            category: 'Other'
        });

        setView('list');
        resetState();
    };

    const handleCreateInputChange = (content: string) => {
        setNewTemplateContent(content);
        // Only extract if we haven't just imported (which sets them already)
        // But manual editing should still update it. 
        // Simple regex-based extraction for manual edits:
        const matches = content.match(/\{\{([^}]+)\}\}|\[([^\]]+)\]/g) || [];
        const vars = matches.map(m => m.replace(/^\{\{|\}\}$|^\[|\]$/g, ''));
        setDetectedVariables(Array.from(new Set(vars)));
    };

    const handleImportTokenize = async () => {
        if (!rawImportText) return;
        setIsProcessing(true);
        try {
            // Instantiate a fresh agent for this specific task
            // Ideally we use a shared instance or the active one, but this ensures availability
            const agent = new LegalAgent();
            const result = await agent.sanitizeAndTokenize(rawImportText);

            setNewTemplateContent(result.content);
            setDetectedVariables(result.variables);
            setNewTemplateName("Imported Template"); // User can rename

            toast.success("Text successfully tokenized!");
            setView('create');
        } catch (error) {
            console.error(error);
            toast.error("Failed to tokenize text");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetState = () => {
        setView('list');
        setActiveTemplate(null);
        setVariableValues({});
        setNewTemplateContent('');
        setNewTemplateName('');
        setDetectedVariables([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <span className="hidden sm:inline font-bold">Smart Templates</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header Area */}
                <div className="p-8 pb-6 border-b bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-background">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                                    {view === 'list' && <><Layers className="h-6 w-6 text-indigo-500" /> Templates Library</>}
                                    {view === 'execute' && <><Play className="h-6 w-6 text-indigo-500" /> Execute Template</>}
                                    {view === 'create' && <><Plus className="h-6 w-6 text-indigo-500" /> Create Template</>}
                                    {view === 'import' && <><Sparkles className="h-6 w-6 text-purple-500" /> Magic Import</>}
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    {view === 'list' ? 'Power your workflow with intelligent document patterns' :
                                        view === 'execute' ? `Filling variables for ${activeTemplate?.name}` :
                                            view === 'create' ? 'Define a new reusable pattern with automatic tokens' :
                                                'Convert raw text into an intelligent template using AI'}
                                </p>
                            </DialogTitle>
                            {view === 'list' && (
                                <div className="flex gap-3">
                                    <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => setView('import')}>
                                        <Sparkles className="h-4 w-4 mr-2" /> Magic Import
                                    </Button>
                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200" onClick={() => setView('create')}>
                                        <Plus className="h-4 w-4 mr-2" /> New Template
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* VIEW: LIST */}
                    {view === 'list' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search templates..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-3">
                                {filteredTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        className="flex items-start justify-between p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md"
                                        onClick={() => handleTemplateClick(template)}
                                    >
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-indigo-500" />
                                                    {template.name}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                    template.category === 'Legal' ? "bg-red-50 text-red-600 border border-red-100" :
                                                        template.category === 'Business' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                                            "bg-slate-50 text-slate-600 border border-slate-100"
                                                )}>
                                                    {template.category}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {template.content.substring(0, 150)}...
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {template.variables.map(v => (
                                                    <span key={v} className="text-[10px] font-bold bg-white/80 dark:bg-black/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-100/50 dark:border-indigo-800 shadow-sm">
                                                        {v}
                                                    </span>
                                                ))}
                                                {template.variables.length === 0 && (
                                                    <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md border border-slate-100">Static Text</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            <button
                                                className="p-2 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeTemplate(template.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {filteredTemplates.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No templates found. Create one to get started.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VIEW: EXECUTE */}
                    {view === 'execute' && activeTemplate && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl space-y-6 border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Layers className="h-4 w-4 text-indigo-500" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Variable Injection</span>
                                </div>
                                {activeTemplate.variables.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8 bg-white dark:bg-black/20 rounded-xl border border-dashed">
                                        No variables detected. Ready to insert.
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {activeTemplate.variables.map((variable) => (
                                            <div key={variable} className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                                    {variable}
                                                </label>
                                                <Input
                                                    value={variableValues[variable] || ''}
                                                    onChange={(e) => setVariableValues(prev => ({
                                                        ...prev,
                                                        [variable]: e.target.value
                                                    }))}
                                                    placeholder={`Type ${variable.toLowerCase()}...`}
                                                    className="rounded-xl border-slate-100 focus:ring-indigo-500/20 h-11"
                                                    autoFocus={activeTemplate.variables[0] === variable}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-2">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Preview</label>
                                </div>
                                <div className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/10 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto shadow-inner">
                                    {/* Live Preview */}
                                    {(() => {
                                        let content = activeTemplate.content;
                                        Object.entries(variableValues).forEach(([k, v]) => {
                                            if (!v) return;
                                            content = content.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
                                            content = content.replace(new RegExp(`\\[${k}\\]`, 'g'), v);
                                        });
                                        return content;
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW: CREATE */}
                    {view === 'create' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Pattern Display Name</label>
                                    <Input
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder="e.g. Legal Clause A"
                                        className="rounded-xl border-slate-100 h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Domain / Category</label>
                                    <select
                                        className="w-full h-11 rounded-xl border border-slate-100 bg-white px-3 text-sm focus:ring-indigo-500/20"
                                        defaultValue="Other"
                                    >
                                        <option value="Legal">Legal</option>
                                        <option value="Business">Business</option>
                                        <option value="Other">General</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Pattern Content Specification</label>
                                <div className="p-1.5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 text-[10px] font-medium text-indigo-700 flex items-center gap-2">
                                    <div className="bg-white dark:bg-black/20 px-2 py-0.5 rounded shadow-sm border border-indigo-200/50 text-indigo-600">Pro Tip</div>
                                    Use {"{{Variable}}"} or [Variable] to create intelligent placeholders
                                </div>
                                <Textarea
                                    value={newTemplateContent}
                                    onChange={(e) => handleCreateInputChange(e.target.value)}
                                    className="min-h-[250px] font-mono text-sm rounded-2xl border-slate-100 focus:ring-indigo-500/20 p-6 leading-relaxed"
                                    placeholder="Enter your document pattern here..."
                                />
                            </div>

                            {detectedVariables.length > 0 && (
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 rounded-2xl">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Zap className="h-3 w-3 text-indigo-500" />
                                        Automatic Tokens Detected:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {detectedVariables.map(v => (
                                            <span key={v} className="text-[10px] font-bold bg-white dark:bg-black/20 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-lg shadow-sm border border-indigo-100/50">
                                                {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEW: IMPORT */}
                    {view === 'import' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-purple-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles className="h-6 w-6" />
                                    <h3 className="font-bold text-lg">AI Surgical Tokenizer</h3>
                                </div>
                                <p className="text-sm text-purple-100 leading-relaxed">
                                    Paste raw text (letters, contracts, emails) below. Our engine will identify specific facts (names, dates, amounts) and transform it into a reusable template with standard markers.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Paste Raw Source Text</label>
                                <Textarea
                                    value={rawImportText}
                                    onChange={(e) => setRawImportText(e.target.value)}
                                    className="min-h-[300px] font-mono text-sm rounded-2xl border-slate-100 focus:ring-purple-500/20 p-6 leading-relaxed"
                                    placeholder="PASTE CONTENT HERE..."
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-4 border-t bg-muted/10">
                    <div className="flex justify-between items-center w-full">
                        {view !== 'list' ? (
                            <Button variant="ghost" onClick={() => setView('list')}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        <div className="flex gap-2">
                            {view === 'list' && (
                                <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
                            )}

                            {view === 'execute' && (
                                <Button onClick={handleExecute} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Play className="h-4 w-4" /> Insert Template
                                </Button>
                            )}

                            {view === 'create' && (
                                <Button onClick={handleCreate} disabled={!newTemplateName || !newTemplateContent}>
                                    Save Template
                                </Button>
                            )}

                            {view === 'import' && (
                                <Button
                                    onClick={handleImportTokenize}
                                    disabled={!rawImportText || isProcessing}
                                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                                >
                                    {isProcessing ? (
                                        <>Processing...</>
                                    ) : (
                                        <><Wand2 className="h-4 w-4" /> Tokenize</>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
