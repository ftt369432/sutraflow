import React, { useState } from 'react';
import { X, Sparkles, Download, Check, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { WorkflowItem, saveCustomWorkflow } from './workflowData';

interface NewWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowCreated: (newWf: WorkflowItem) => void;
  activeDomainType?: string;
}

export const NewWorkflowModal: React.FC<NewWorkflowModalProps> = ({
  isOpen,
  onClose,
  onWorkflowCreated,
  activeDomainType = 'custom'
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('custom');
  const [icon, setIcon] = useState('zap');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !prompt.trim()) return;

    const id = `custom-${Date.now()}`;
    const newWf: WorkflowItem = {
      id,
      name: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: title.trim(),
      description: description.trim() || `User-created workflow: ${title.trim()}`,
      category,
      domain: activeDomainType,
      icon: icon || 'zap',
      prompt: prompt.trim(),
      isCustom: true
    };

    saveCustomWorkflow(newWf);
    setIsSaved(true);
    setTimeout(() => {
      onWorkflowCreated(newWf);
      onClose();
      setIsSaved(false);
      setTitle('');
      setDescription('');
      setPrompt('');
    }, 600);
  };

  const handleExportMarkdown = () => {
    if (!title.trim()) return;
    const mdContent = `---
name: ${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
description: ${description.trim() || title.trim()}
domain: ${activeDomainType}
category: ${category}
icon: ${icon}
created: ${new Date().toISOString().split('T')[0]}
---

# ${title.trim()}

## Directive & Prompt
${prompt.trim()}
`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Custom Workflow Pill</h3>
              <p className="text-[11px] text-slate-500">Auto-discovers as a 1-click button in your Workbench</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[70vh]">
          {/* Title & Icon */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Icon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none"
              >
                <option value="zap">Lightning (Fast Task)</option>
                <option value="scroll">Document / Brief</option>
                <option value="scale">Legal / Court</option>
                <option value="calc">Calculator / Rating</option>
                <option value="stethoscope">Medical Analysis</option>
                <option value="shield">Defense / Motion</option>
                <option value="dollar">Fee / Lien Audit</option>
                <option value="search">Investigation / Search</option>
                <option value="landmark">Formal 28-Line Pleading</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Workflow Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Petition for Contribution (LC § 5500.5)"
                className="w-full h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
            <div className="flex gap-1.5 flex-wrap">
              {(['petition', 'qme', 'trial', 'lien', 'audit', 'custom'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    category === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Short Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Enforce carrier joint and several liability with contribution rights"
              className="w-full h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>

          {/* Prompt Instructions */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Prompt Instructions (What the Swarm Executes)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Draft a California 28-line Petition for Contribution under Labor Code § 5500.5. Analyze cumulative trauma coverage periods and calculate proportionate shares..."
              rows={4}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportMarkdown}
            disabled={!title.trim()}
            className="text-[11px] gap-1.5 text-slate-600 dark:text-slate-400"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .md</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!title.trim() || !prompt.trim() || isSaved}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved!' : 'Save & Pin Button'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
