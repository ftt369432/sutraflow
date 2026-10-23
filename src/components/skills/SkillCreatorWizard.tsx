import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Play, 
  Code, 
  Info, 
  List, 
  Terminal, 
  CheckCircle, 
  X, 
  Plus, 
  Trash2, 
  FileText,
  RotateCcw,
  Zap,
  Globe,
  Mail,
  Shield,
  FileCheck
} from 'lucide-react';
import { skillRegistry } from '../../cortex/SkillRegistry';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SkillParam {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

interface SkillStep {
  id: string;
  tool: string;
  description: string;
}

const PRESETS = [
  {
    title: 'Legal Pleading Compiler',
    description: 'Compile legal pleadings from templates and medical summaries.',
    icon: Shield,
    prompt: 'Read PQME medical summaries, extract main diagnostic findings (WPI), verify citations under California Labor Code section 4063, and compile a formal Petition for Penalties using the firm’s pleading template.',
    name: 'Legal Pleading Compiler',
    slug: 'legal-pleading-compiler',
    params: [
      { name: 'summaryPath', type: 'string', description: 'Path to PQME medical summary text file', required: true },
      { name: 'caseName', type: 'string', description: 'Name of the case (e.g. John Doe)', required: true },
      { name: 'wpiValue', type: 'number', description: 'Whole Person Impairment rating percentage', required: false }
    ],
    steps: [
      { id: '1', tool: 'fs.read_file', description: 'Load the medical summary text file' },
      { id: '2', tool: 'cortex.llm_analyze', description: 'Extract diagnosis codes, dates, and LC citation validity' },
      { id: '3', tool: 'pleading.compile', description: 'Format and output DOCX/PDF pleading papers' }
    ]
  },
  {
    title: 'EAMS Portal Web Scraper',
    description: 'Scrape EAMS case status and download public filing history.',
    icon: Globe,
    prompt: 'Navigate to California DWC EAMS public search portal, input the ADJ case number, scrape the case event logs, identify upcoming hearing dates, and download recently filed PDF exhibits.',
    name: 'EAMS Portal Web Scraper',
    slug: 'eams-portal-scraper',
    params: [
      { name: 'adjNumber', type: 'string', description: 'EAMS ADJ case reference identifier', required: true },
      { name: 'targetFolder', type: 'string', description: 'Directory to download exhibit PDFs to', required: true }
    ],
    steps: [
      { id: '1', tool: 'browser.navigate', description: 'Open EAMS search portal landing page' },
      { id: '2', tool: 'browser.fill_form', description: 'Input case number and submit search' },
      { id: '3', tool: 'browser.download_files', description: 'Gather links to PDF exhibits and save to folder' }
    ]
  },
  {
    title: 'Email Compliance Monitor',
    description: 'Process incoming emails for urgent legal notifications.',
    icon: Mail,
    prompt: 'Check IMAP folder for incoming emails from defense counsel or insurance adjusters containing "DOR", "Special Notice", or "Settlement offer". Parse attachments and flag urgent issues to active dashboard.',
    name: 'Email Compliance Monitor',
    slug: 'email-compliance-monitor',
    params: [
      { name: 'imapFolder', type: 'string', description: 'Folder name in mail system to scan', required: true },
      { name: 'urgencyThreshold', type: 'number', description: 'Scale 1-10 of keywords to trigger urgent alert', required: false }
    ],
    steps: [
      { id: '1', tool: 'email.fetch_recent', description: 'Scan last 50 emails in folder' },
      { id: '2', tool: 'cortex.sentiment', description: 'Grade email urgency and verify legal files' },
      { id: '3', tool: 'dashboard.push_notification', description: 'Pop up dynamic notification if critical' }
    ]
  }
];

export const SkillCreatorWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1: Intention
  const [intention, setIntention] = useState('');
  
  // Step 2: Basic Info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [category, setCategory] = useState('automation');

  // Step 4: Parameters
  const [params, setParams] = useState<SkillParam[]>([]);
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<'string' | 'number' | 'boolean'>('string');
  const [newParamDesc, setNewParamDesc] = useState('');
  const [newParamRequired, setNewParamRequired] = useState(true);

  // Step 5: Step Orchestration
  const [executionSteps, setExecutionSteps] = useState<SkillStep[]>([
    { id: '1', tool: 'fs.read_file', description: 'Read input configuration and files' },
    { id: '2', tool: 'cortex.llm_analyze', description: 'Process content with intelligent assistant' }
  ]);
  const [newStepTool, setNewStepTool] = useState('');
  const [newStepDesc, setNewStepDesc] = useState('');

  // Step 3 & 7: MD Code Output
  const [markdownContent, setMarkdownContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 6: Test drive
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (step <= 2) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [name, step]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setIntention(preset.prompt);
    setName(preset.name);
    setSlug(preset.slug);
    setDescription(preset.description);
    setParams(preset.params as SkillParam[]);
    setExecutionSteps(preset.steps);
    toast.success(`Preset "${preset.title}" loaded successfully`);
  };

  const handleSuggestSchema = () => {
    if (!intention) {
      toast.error('Please describe what your skill should do first.');
      return;
    }
    setIsGenerating(true);
    setStep(3);
    
    // Simulate LLM construction of SKILL.md
    setTimeout(() => {
      // Set default name and description if not yet filled
      if (!name) setName(slugToTitle(slug || 'custom-agentic-skill'));
      if (!description) setDescription(`Custom skill generated from: "${intention.slice(0, 60)}..."`);
      
      const yamlFrontmatter = `---
name: "${name || 'Custom Agentic Skill'}"
id: "${slug || 'custom-agentic-skill'}"
version: "${version}"
category: "${category}"
description: "${description || 'Skill created via AI Creator Wizard.'}"
parameters:
${params.map(p => `  - name: "${p.name}"\n    type: "${p.type}"\n    description: "${p.description}"\n    required: ${p.required}`).join('\n')}
---

# ${name || 'Custom Agentic Skill'}

This Sovereign Skill was custom compiled via the AI-Guided Skill Creator.

## Objective
${intention}

## Execution Steps
${executionSteps.map((s, idx) => `${idx + 1}. **${s.tool}**: ${s.description}`).join('\n')}

## Expected Output
A fully structured result schema detailing processed metrics, artifacts generated, and operations completed.
`;
      setMarkdownContent(yamlFrontmatter);
      setIsGenerating(false);
      toast.success('AI successfully drafted conformed SKILL.md schema!');
    }, 1500);
  };

  const slugToTitle = (s: string) => {
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const addParameter = () => {
    if (!newParamName) {
      toast.error('Parameter name is required');
      return;
    }
    const cleanName = newParamName.replace(/[^a-zA-Z0-9_]+/g, '');
    if (params.some(p => p.name === cleanName)) {
      toast.error('Parameter with this name already exists');
      return;
    }
    setParams([...params, {
      name: cleanName,
      type: newParamType,
      description: newParamDesc || 'No description provided.',
      required: newParamRequired
    }]);
    setNewParamName('');
    setNewParamDesc('');
    toast.success(`Parameter "${cleanName}" added`);
  };

  const removeParameter = (index: number) => {
    setParams(params.filter((_, idx) => idx !== index));
  };

  const addExecutionStep = () => {
    if (!newStepTool) {
      toast.error('Step tool name/identifier is required');
      return;
    }
    setExecutionSteps([...executionSteps, {
      id: Date.now().toString(),
      tool: newStepTool,
      description: newStepDesc || 'Process input using tool'
    }]);
    setNewStepTool('');
    setNewStepDesc('');
    toast.success('Execution step appended');
  };

  const removeExecutionStep = (id: string) => {
    setExecutionSteps(executionSteps.filter(s => s.id !== id));
  };

  // Recompile markdown when moving forward to step 7
  const compileFinalMarkdown = () => {
    const yamlFrontmatter = `---
name: "${name || 'Custom Agentic Skill'}"
id: "${slug || 'custom-agentic-skill'}"
version: "${version}"
category: "${category}"
description: "${description || 'Skill created via AI Creator Wizard.'}"
parameters:
${params.length > 0 ? params.map(p => `  - name: "${p.name}"\n    type: "${p.type}"\n    description: "${p.description}"\n    required: ${p.required}`).join('\n') : '  []'}
---

# ${name || 'Custom Agentic Skill'}

This Sovereign Skill was custom compiled via the AI-Guided Skill Creator.

## Objective
${intention || 'Direct execution of custom actions.'}

## Execution Steps
${executionSteps.map((s, idx) => `${idx + 1}. **${s.tool}**: ${s.description}`).join('\n')}

## Detailed Instructions
This skill integrates local system capabilities (Earth layer) and LLM analysis (Cortex layer) to perform operations.
Modify these instructions to fine-tune agent behavior.
`;
    setMarkdownContent(yamlFrontmatter);
  };

  const runTestDrive = () => {
    setIsTesting(true);
    setTestSuccess(null);
    setTestLogs([]);

    const log = (msg: string, delay: number) => {
      setTimeout(() => {
        setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
      }, delay);
    };

    log(`🚀 Initiating sandbox mock test for skill: "${slug}"...`, 100);
    log(`🔧 Checking requirements: Electron Earth bridge online...`, 500);
    
    // Log variables
    params.forEach((p, idx) => {
      const val = testValues[p.name] || (p.required ? 'MISSING' : 'DEFAULT');
      log(`👉 Parameter [${p.name}]: ${val}`, 800 + idx * 200);
    });

    const startExecutionDelay = 1000 + params.length * 200;
    log(`⚡ Starting step-by-step execution simulation...`, startExecutionDelay);

    executionSteps.forEach((s, idx) => {
      const stepDelay = startExecutionDelay + 500 + idx * 800;
      log(`⚙️ Executing step ${idx + 1}/${executionSteps.length} [${s.tool}]: ${s.description}`, stepDelay);
      log(`   └─ Status: COMPLETED (mock response generated)`, stepDelay + 400);
    });

    const finishDelay = startExecutionDelay + 500 + executionSteps.length * 800 + 400;
    setTimeout(() => {
      setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Sandbox simulation successful. Code integrity conformed.`]);
      setTestSuccess(true);
      setIsTesting(false);
      toast.success('Skill test drive passed verification!');
    }, finishDelay);
  };

  const handleSaveAndRegister = async () => {
    if (!slug) {
      toast.error('Skill ID/slug is required to register');
      return;
    }
    const success = await skillRegistry.saveCustomSkill(slug, markdownContent);
    if (success) {
      toast.success('Sovereign Skill successfully registered to skills_library!');
      navigate('/cortex');
    } else {
      toast.error('Failed to write skill file. Check console/logs.');
    }
  };

  const stepsList = [
    { id: 1, name: 'Intention & Templates' },
    { id: 2, name: 'Basic Info' },
    { id: 3, name: 'AI Generation' },
    { id: 4, name: 'Parameters' },
    { id: 5, name: 'Orchestration' },
    { id: 6, name: 'Sandbox Test' },
    { id: 7, name: 'Save & Registry' }
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#0a0a0f] to-[#040406] border border-white/10 rounded-2xl shadow-2xl shadow-purple-950/20 backdrop-blur-md">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">AI Skill Creator Wizard</h1>
            <p className="text-slate-400 text-xs mt-0.5">Author custom capabilities in natural language for the GenieFlow cortex</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/cortex')}
          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all text-xs flex items-center gap-1.5"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>

      {/* Progress & Sidebar Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 border-r border-white/10 pr-4 space-y-2">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Wizard Progress</div>
          {stepsList.map(s => (
            <div 
              key={s.id} 
              className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold transition-all ${
                step === s.id 
                  ? 'bg-purple-600/10 border border-purple-500/30 text-white shadow-inner shadow-purple-500/5'
                  : step > s.id 
                    ? 'text-emerald-400 border border-transparent'
                    : 'text-slate-500 border border-transparent'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === s.id 
                  ? 'bg-purple-500 text-white'
                  : step > s.id 
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-slate-500'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              <span>{s.name}</span>
            </div>
          ))}
        </div>

        {/* Wizard Main Pane */}
        <div className="md:col-span-3 flex flex-col justify-between min-h-[500px]">
          
          <div className="flex-1 pb-8">
            {/* Step 1: Intention & Presets */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">What should this Skill do?</h3>
                  <p className="text-slate-400 text-xs">Describe the natural language intention of your custom capability. The cortex will compile it into conforming schemas.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {PRESETS.map((p, idx) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => applyPreset(p)}
                        className="flex flex-col text-left p-4 bg-white/3 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5 rounded-xl transition-all"
                      >
                        <div className="p-2 rounded-lg bg-white/5 mb-3 w-fit">
                          <Icon className="w-4 h-4 text-purple-400" />
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1">{p.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-3">{p.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Intention Description</label>
                  <textarea 
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    placeholder="e.g., Pull legal filing PDFs from EAMS, rename them with date prefix, and compile a summary memo."
                    className="w-full h-40 p-4 bg-slate-950 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-650 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Configure Basic Metadata</h3>
                  <p className="text-slate-400 text-xs">Define key identifier tags that will be displayed in the system settings and the agent store.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-350">Skill Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Legal Pleading Compiler" 
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-350">Unique ID (Slug)</label>
                    <input 
                      type="text" 
                      value={slug} 
                      onChange={(e) => setSlug(e.target.value)} 
                      placeholder="legal-pleading-compiler" 
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-355">Short Description</label>
                  <input 
                    type="text" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Compiles conforming pleading papers and files them to system directories." 
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-355">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="automation">Automation</option>
                      <option value="scraping">Web Scraping</option>
                      <option value="analysis">Data Analysis</option>
                      <option value="legal">Legal & Compliance</option>
                      <option value="communication">Email & Slack</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-355">Version</label>
                    <input 
                      type="text" 
                      value={version} 
                      onChange={(e) => setVersion(e.target.value)} 
                      placeholder="1.0.0" 
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: AI Schema Draft Generation */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Conformed SKILL.md Frontmatter</h3>
                  <p className="text-slate-400 text-xs">Review the conforming markdown generated by the AI system. You can directly edit the code below.</p>
                </div>

                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-80 bg-white/3 border border-white/10 rounded-xl">
                    <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                      <div className="absolute inset-0 rounded-full border border-purple-500/20 border-t-purple-500 animate-spin" />
                      <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-purple-400 font-bold tracking-wide animate-pulse">Drafting conforming skill schema...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      value={markdownContent}
                      onChange={(e) => setMarkdownContent(e.target.value)}
                      className="w-full h-80 p-4 bg-slate-950 border border-white/10 rounded-xl font-mono text-xs text-green-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 leading-relaxed"
                    />
                    <div className="flex justify-between items-center bg-white/3 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Info className="w-4 h-4 text-purple-400" />
                        <span>Ensure the YAML tags at the top are not deleted or corrupted.</span>
                      </div>
                      <button 
                        onClick={handleSuggestSchema}
                        className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Draft
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Parameters & Inputs */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Parameters & Variables</h3>
                  <p className="text-slate-400 text-xs">Add dynamic variables that this skill will accept when called by a workflow or agent.</p>
                </div>

                {/* Add Param Form */}
                <div className="p-4 bg-white/3 border border-white/10 rounded-xl space-y-4">
                  <div className="text-xs font-bold text-purple-400">Add Parameter</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newParamName}
                      onChange={(e) => setNewParamName(e.target.value)}
                      placeholder="paramName (e.g. wpiValue)"
                      className="p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <select
                      value={newParamType}
                      onChange={(e) => setNewParamType(e.target.value as any)}
                      className="p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="string">String (Text)</option>
                      <option value="number">Number (Float/Int)</option>
                      <option value="boolean">Boolean (True/False)</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newParamRequired}
                          onChange={(e) => setNewParamRequired(e.target.checked)}
                          className="rounded border-white/10 bg-slate-950 text-purple-600 focus:ring-purple-500"
                        />
                        Required
                      </label>
                      <button
                        onClick={addParameter}
                        className="ml-auto flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newParamDesc}
                    onChange={(e) => setNewParamDesc(e.target.value)}
                    placeholder="Short description of what this variable represents..."
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Parameters List */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">Active Parameters ({params.length})</div>
                  {params.length === 0 ? (
                    <p className="text-slate-500 text-xs italic p-4 text-center border border-dashed border-white/10 rounded-xl">No arguments defined. This skill is static.</p>
                  ) : (
                    <div className="grid gap-3">
                      {params.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white font-mono">{p.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-semibold">{p.type}</span>
                              {p.required && <span className="text-[10px] text-purple-400 font-bold">Required</span>}
                            </div>
                            <p className="text-[11px] text-slate-450">{p.description}</p>
                          </div>
                          <button
                            onClick={() => removeParameter(idx)}
                            className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Orchestration Steps */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Step Orchestration</h3>
                  <p className="text-slate-400 text-xs">Define the sequence of tasks this skill will perform. Each step invokes a capability or tool.</p>
                </div>

                {/* Add Step Form */}
                <div className="p-4 bg-white/3 border border-white/10 rounded-xl space-y-4">
                  <div className="text-xs font-bold text-purple-400">Append Execution Step</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newStepTool}
                      onChange={(e) => setNewStepTool(e.target.value)}
                      placeholder="Tool or Action (e.g. fs.write_file)"
                      className="p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={addExecutionStep}
                      className="ml-auto flex items-center gap-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-all w-fit"
                    >
                      <Plus className="w-3.5 h-3.5" /> Append Step
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newStepDesc}
                    onChange={(e) => setNewStepDesc(e.target.value)}
                    placeholder="Brief description of what this step achieves..."
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300">Execution Steps ({executionSteps.length})</div>
                  {executionSteps.length === 0 ? (
                    <p className="text-slate-500 text-xs italic p-4 text-center border border-dashed border-white/10 rounded-xl">No steps added. Provide steps to define behavior.</p>
                  ) : (
                    <div className="space-y-2">
                      {executionSteps.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-4 p-3 bg-white/3 border border-white/5 rounded-xl">
                          <div className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-white font-mono">{s.tool}</span>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{s.description}</p>
                          </div>
                          <button
                            onClick={() => removeExecutionStep(s.id)}
                            className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Sandbox Simulator */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Sandbox Test Drive</h3>
                  <p className="text-slate-400 text-xs">Simulate executing this skill inside the Cortex sandbox container before saving it to disk.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Test inputs */}
                  <div className="md:col-span-1 space-y-4 bg-white/3 border border-white/10 p-4 rounded-xl">
                    <div className="text-xs font-bold text-white">Input Arguments</div>
                    {params.length === 0 ? (
                      <p className="text-slate-500 text-xs italic">No inputs required for this skill.</p>
                    ) : (
                      params.map(p => (
                        <div key={p.name} className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400 font-mono">{p.name}</label>
                          <input
                            type="text"
                            placeholder={p.description || `Enter value`}
                            value={testValues[p.name] || ''}
                            onChange={(e) => setTestValues({ ...testValues, [p.name]: e.target.value })}
                            className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white text-xs focus:border-purple-500"
                          />
                        </div>
                      ))
                    )}
                    <button
                      onClick={runTestDrive}
                      disabled={isTesting}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      {isTesting ? 'Running Simulation...' : 'Run Test Drive'}
                    </button>
                  </div>

                  {/* Execution Log console */}
                  <div className="md:col-span-2 flex flex-col h-80 bg-slate-950 border border-white/15 rounded-xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/3">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">SANDBOX TERMINAL OUTPUT</span>
                      {testSuccess !== null && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          testSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          <CheckCircle className="w-3 h-3" /> {testSuccess ? 'PASSED' : 'FAILED'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] text-green-400 space-y-1.5 scrollbar-thin select-none leading-relaxed">
                      {testLogs.length === 0 ? (
                        <p className="text-slate-500 italic">Console idle. Populate inputs and hit "Run Test Drive" to execute workflow.</p>
                      ) : (
                        testLogs.map((log, idx) => (
                          <div key={idx} className={log.includes('✅') || log.includes('passed') ? 'text-emerald-300 font-bold' : log.includes('🚀') ? 'text-purple-400 font-bold' : 'text-slate-350'}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Markdown Preview & Save */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Review & Register Capability</h3>
                  <p className="text-slate-400 text-xs">Verify the final conforming `SKILL.md` schema content before writing it to the `skills_library/` filesystem.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/3 p-3.5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">Target file path:</span>
                        <code className="block text-[10px] text-slate-400 font-mono mt-0.5">skills_library/{slug}/SKILL.md</code>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">
                      Ready to Save
                    </div>
                  </div>

                  <textarea
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    className="w-full h-80 p-4 bg-slate-950 border border-white/10 rounded-xl font-mono text-xs text-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-6">
            <button
              onClick={() => {
                if (step > 1) setStep(step - 1);
              }}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2 border border-white/10 hover:bg-white/5 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {step < 7 ? (
              <button
                onClick={() => {
                  if (step === 1) {
                    if (!intention) {
                      toast.error('Please describe what your skill should do.');
                      return;
                    }
                    setStep(2);
                  } else if (step === 2) {
                    if (!name || !slug) {
                      toast.error('Name and ID/Slug are required.');
                      return;
                    }
                    handleSuggestSchema();
                  } else if (step === 6) {
                    compileFinalMarkdown();
                    setStep(7);
                  } else {
                    setStep(step + 1);
                  }
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-102"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSaveAndRegister}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-purple-600/20"
              >
                <Save className="w-4 h-4" /> Save & Register Custom Skill
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
