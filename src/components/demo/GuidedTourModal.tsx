import React, { useState } from 'react';
import { BookOpen, ChevronRight, ChevronLeft, X, Sparkles, Shield, Cpu, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to GenieFlow AI Sovereign Platform",
      badge: "Overview",
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      content: "GenieFlow AI is a sovereign autonomous workspace that unifies chat, multi-canvas document synthesis, auto-tasking, and background agent swarms into a single privacy-first environment.",
      highlights: [
        "Local-First & Hybrid AI Routing (Google Gemini + Ollama)",
        "Multi-Canvas Side-by-Side Surgical Document Editing",
        "Algorithmic MemoryCompactor Token Optimization"
      ]
    },
    {
      title: "1. Sovereign HQ & Autonomous Agent Swarms",
      badge: "Swarms",
      icon: <Cpu className="w-6 h-6 text-indigo-400" />,
      content: "In Sovereign HQ, specialized agent swarms (Legal, Financial, Research, Engineering) run in parallel to execute multi-step goals without continuous human prompting.",
      highlights: [
        "Parallel task execution loop with telemetry tracking",
        "Deterministic state machine guards preventing agent drift",
        "Obfuscated stackable MCP (.gpack) plugin system"
      ]
    },
    {
      title: "2. Multi-Canvas Document Synthesis & Wikilinks",
      badge: "Canvas",
      icon: <FileText className="w-6 h-6 text-purple-400" />,
      content: "Move beyond single chat windows. GenieFlow AI generates structured documents in side-by-side canvases while constructing an Open Brain Wikilink knowledge graph.",
      highlights: [
        "Surgical line-by-line document patching",
        "Wikilink [[Concept]] auto-indexing",
        "Multi-format export (Markdown, PDF, DOCX)"
      ]
    },
    {
      title: "3. Auto-Calendar & Task Orchestration",
      badge: "Automation",
      icon: <Calendar className="w-6 h-6 text-green-400" />,
      content: "Chat conversations automatically generate structured tasks, subtasks, and calendar events. The malleable scheduler coordinates team availability and agent syncs.",
      highlights: [
        "Chat-to-Schedule intent extraction",
        "Granular subtask progress tracking",
        "Automated background agent sync events"
      ]
    },
    {
      title: "4. MemoryCompactor & Enterprise Security",
      badge: "Privacy & Speed",
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      content: "MemoryCompactor compresses conversation entropy by up to 64.2%, enabling lightning-fast responses over massive document repositories with strict local privacy controls.",
      highlights: [
        "64.2% token context compression ratio",
        "Zero-trust local database storage (Supabase + IndexedDB)",
        "End-to-end encrypted desktop runtime via Electron"
      ]
    }
  ];

  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            {activeStep.icon}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activeStep.badge}
              </span>
              <h3 className="text-lg font-bold text-white leading-tight mt-0.5">
                {activeStep.title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {activeStep.content}
          </p>

          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Highlights:</span>
            <ul className="space-y-1.5 mt-1">
              {activeStep.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all ${idx === currentStep ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/30"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-emerald-600/30"
              >
                Got It! Explore System
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
