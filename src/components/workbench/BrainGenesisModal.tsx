import React, { useState } from 'react';
import { X, Sparkles, Upload, FileText, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { genesisBrainService, GenesisOutput } from '../../services/genesis/GenesisBrainService';
import { WorkflowItem } from './workflowData';
import { DomainProfile, DomainType } from './types';

interface BrainGenesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrainActivated: (profile: DomainProfile, workflow: WorkflowItem) => void;
}

const PRESET_DOMAINS = [
  { id: 'civil_pi', label: 'Civil & Personal Injury Law', icon: '⚖️', standards: 'California Civil Code, CCP, Insurance Code § 790.03', placeholder: 'e.g. Sterling & Sterling Injury Attorneys' },
  { id: 'general_contractor', label: 'General Contracting & Trades', icon: '👷', standards: 'CSLB Regulations, Mechanics Lien Law (Civil Code § 8000), OSHA', placeholder: 'e.g. Apex Commercial Builders Inc.' },
  { id: 'medical_clinic', label: 'Medical Practice & Billing', icon: '🩺', standards: 'HIPAA Security Rule, CMS Billing Guidelines, CPT / ICD-10 Compliance', placeholder: 'e.g. Coastal Orthopedic Specialists' },
  { id: 'tax_accounting', label: 'Tax Advisory & Accounting', icon: '📊', standards: 'Internal Revenue Code (IRC), GAAP Accounting, Treasury Regs', placeholder: 'e.g. Summit Wealth Advisory & Tax' },
  { id: 'real_estate', label: 'Real Estate & Property Management', icon: '🏠', standards: 'California DRE Standards, RESPA, Civil Code § 1946 (Tenancy)', placeholder: 'e.g. Horizon Commercial Realty' },
  { id: 'custom', label: 'Custom Enterprise / Agency', icon: '⚡', standards: 'General commercial contract principles and ethical trade rules', placeholder: 'e.g. Sovereign Operations Group' }
];

export const BrainGenesisModal: React.FC<BrainGenesisModalProps> = ({
  isOpen,
  onClose,
  onBrainActivated
}) => {
  const [selectedDomain, setSelectedDomain] = useState(PRESET_DOMAINS[0]);
  const [businessName, setBusinessName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('California');
  const [governingStandards, setGoverningStandards] = useState(PRESET_DOMAINS[0].standards);
  const [sampleText, setSampleText] = useState('');
  const [sampleFileName, setSampleFileName] = useState('');
  
  // Status states
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<GenesisOutput | null>(null);

  if (!isOpen) return null;

  const handleDomainSelect = (d: typeof PRESET_DOMAINS[0]) => {
    setSelectedDomain(d);
    setGoverningStandards(d.standards);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSampleFileName(file.name);
    try {
      const text = await file.text();
      setSampleText(text);
    } catch (_e) {
      setSampleText(`Uploaded sample file: ${file.name}`);
    }
  };

  const handleSynthesize = async () => {
    if (!businessName.trim()) {
      alert('Please enter a business or firm name.');
      return;
    }

    setIsSynthesizing(true);
    setProgressMsg('Deconstructing sample work product syntax...');

    try {
      setTimeout(() => setProgressMsg('Synthesizing BUSINESS.md operational scope...'), 1200);
      setTimeout(() => setProgressMsg('Configuring multi-agent personas in AGENTS.md...'), 2400);
      setTimeout(() => setProgressMsg('Compiling custom workflow playbook...'), 3600);

      const output = await genesisBrainService.synthesizeBrain({
        businessName,
        businessType: selectedDomain.label,
        sampleText,
        sampleFileName,
        governingStandards,
        jurisdiction
      });

      setResult(output);
      setCurrentStep(3);
    } catch (err: any) {
      alert(`Synthesis error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleLaunchSuperpower = () => {
    if (!result) return;

    const newProfile: DomainProfile = {
      type: 'custom' as DomainType,
      title: result.businessName,
      organization: result.businessName,
      icon: selectedDomain.icon || 'Briefcase',
      standards: governingStandards || 'Deterministic sovereign reasoning.',
      deliverableFormat: `${selectedDomain.label} Master Document`,
      actionStarters: [result.workflowItem.title, 'Run Compliance Audit', 'Draft Deliverable']
    };

    onBrainActivated(newProfile, result.workflowItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-lg">
              ✨
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Brain Genesis: Zero-Hardcoding Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Teach the sovereign engine your exact business, sample works, and governing laws.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentStep === 1 && (
            <>
              {/* Step 1: Industry / Domain Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2.5">
                  1. What type of business or practice are you?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_DOMAINS.map((d) => {
                    const isSelected = selectedDomain.id === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleDomainSelect(d)}
                        className={`flex flex-col items-start p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                        }`}
                      >
                        <span className="text-xl mb-1.5">{d.icon}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Name & Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Business / Practice Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={selectedDomain.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Primary Jurisdiction / Region
                  </label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g. California, Federal, Texas, Nationwide"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Step 2: Drop Sample Work */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  2. Drop a sample report, proposal, or past deliverable
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-500 transition">
                  <input
                    type="file"
                    id="sample-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt,.md"
                  />
                  <label htmlFor="sample-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-6 h-6 text-emerald-500 mb-2" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {sampleFileName ? `Selected: ${sampleFileName}` : 'Click to browse or drop sample file'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Supports PDF, DOCX, Markdown, Text</span>
                  </label>
                </div>
                <div className="mt-2">
                  <textarea
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                    placeholder="...or paste a representative excerpt or template here"
                    rows={3}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Step 3: Governing Standards */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  3. Governing statutes, codes, or trade regulations to anchor to
                </label>
                <input
                  type="text"
                  value={governingStandards}
                  onChange={(e) => setGoverningStandards(e.target.value)}
                  placeholder="e.g. Labor Code § 5814, Civil Code § 8000, HIPAA, IRC Section 1031"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* Loading / Synthesis View */}
          {isSynthesizing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Synthesizing Sovereign Brain Architecture
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  {progressMsg}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Success & Superpower Preview */}
          {currentStep === 3 && result && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    Sovereign Brain Synthesized for {result.businessName}!
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-400 mt-1">
                    Created foundational `.md` architecture with zero hardcoded constraints.
                  </div>
                </div>
              </div>

              {/* Artifacts Created */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Synthesized Brain DNA on Local Disk:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" /> BUSINESS.md
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-500" /> AGENTS.md
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" /> RULES.md
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" /> {result.workflowItem.title}
                  </div>
                </div>
              </div>

              {/* Superpower Highlight */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Unlocked Superpower Workflow:
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">{result.workflowItem.title}</span> — {result.workflowItem.description}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Cancel
          </Button>

          {currentStep === 1 && (
            <Button
              onClick={handleSynthesize}
              disabled={isSynthesizing || !businessName.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Synthesize Sovereign Brain
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              onClick={handleLaunchSuperpower}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer animate-bounce"
            >
              <Zap className="w-4 h-4" />
              Launch Superpower Playbook
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};
