import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Cpu, 
  FileText, 
  Calendar, 
  Users, 
  Award, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight,
  Sun,
  Moon,
  Lock,
  Zap,
  Server,
  Mail,
  Send,
  MessageSquare,
  Scale,
  Stethoscope,
  Receipt,
  Briefcase
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/SEO';
import { MasterclassSalesFunnel } from '../components/marketing/MasterclassSalesFunnel';
import { toast } from 'sonner';

// Universal Super Brain Syllabus
const universalCurriculum = [
  {
    step: 'PHASE 01',
    title: 'Setting Up Your Local Hardware & Air-Gap Vault',
    desc: 'Configure your own workstation (NVIDIA RTX / CUDA-enabled GPUs or Apple Silicon). Establish true air-gapping with zero data egress, or configure 1-click seamless toggling between local private models and frontier cloud AI.',
    icon: <Server className="w-5 h-5 text-blue-400" />,
    bullets: [
      'NVIDIA CUDA & Ollama / vLLM local acceleration setup',
      'Physical air-gap network rules: eliminating cloud data leaks',
      '1-Click toggle: run confidential files on GPU, public tasks on cloud'
    ]
  },
  {
    step: 'PHASE 02',
    title: 'Deconstructing Domain Knowledge into Agentic Protocols',
    desc: 'How to take any human workflow—contracts, financial models, clinical charts, or logistics—and map it into deterministic multi-agent step-by-step pipelines.',
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    bullets: [
      'Extracting rules, formulas, and verification guardrails',
      'Designing specialized persona prompts with zero hallucination',
      'Encoding repeatable protocols into distributable .gpack bundles'
    ]
  },
  {
    step: 'PHASE 03',
    title: 'Headless Integration With Your Existing Tools',
    desc: 'Deploy your super brain without replacing your current software. Learn how Sutra connects headlessly to existing databases, CRMs, email, and internal drives.',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    bullets: [
      'Headless API & Model Context Protocol (MCP) bridges',
      'Bi-directional synchronization with local files and calendars',
      'Multi-Canvas split-pane verification before taking action'
    ]
  },
  {
    step: 'PHASE 04',
    title: 'Monetize & License Your Workflow Protocols',
    desc: 'Turn your proprietary expertise into a digital franchise. Package your customized agentic protocols and license them to peers or enterprise clients.',
    icon: <Award className="w-5 h-5 text-sky-400" />,
    bullets: [
      'Setting up creator licensing models (per-claim or monthly)',
      'Publishing to the Sovereign Assistant Store with encrypted keys',
      'Generating recurring licensing revenue from your domain knowledge'
    ]
  }
];

// Specialized Schedule: California Workers' Comp Automation
const workersCompSchedule = [
  {
    time: '10:00 AM – 11:00 AM PST',
    track: 'APPLICANT & DEFENSE COUNSEL',
    icon: <Scale className="w-5 h-5 text-blue-400" />,
    title: 'Deterministic 28-Line Pleadings & Penalty Petitions',
    desc: 'Automating petitions under California Labor Code §§ 5814 (unreasonable delay penalties), 5710 (deposition attorney fees), DOR objections, and conforming petitions under 8 CCR § 10964 with exact citations.',
    deliverable: 'Downloadable 28-line legal pleading templates & prompt formulas.'
  },
  {
    time: '11:15 AM – 12:15 PM PST',
    track: 'MEDICAL-LEGAL PHYSICIANS (PQME / AME)',
    icon: <Stethoscope className="w-5 h-5 text-cyan-400" />,
    title: 'Forensic 500-Page Medical Record Ingestion & Chronology',
    desc: 'Ingesting massive treatment packets, extracting clinical contradictions between treating physicians and QMEs, and cross-referencing AMA Guides 5th Edition Chapters 15 & 16.',
    deliverable: 'Automated 1-click chronological exhibit sheet compiler.'
  },
  {
    time: '12:45 PM – 01:45 PM PST',
    track: 'LIEN CLAIMANTS & BILLING TEAMS',
    icon: <Receipt className="w-5 h-5 text-emerald-400" />,
    title: 'LC § 4622 60-Day Enforcement, 10% Penalties & 7% Interest',
    desc: 'Executing Second Bill Reviews (SBR), Independent Bill Review (IBR), Petitions for Costs, and 8 CCR § 10786 lien litigation enforcement on unpaid medical-legal bills.',
    deliverable: 'Automated statutory interest & penalty calculation matrix.'
  },
  {
    time: '02:00 PM – 03:00 PM PST',
    track: 'TPAS & CLAIMS ADMINISTRATORS',
    icon: <Briefcase className="w-5 h-5 text-sky-400" />,
    title: 'CVC Rating Compounding & Actuarial Life Pension Buyouts',
    desc: 'Evaluating multi-body-part permanent disability compounding using the official Combined Values Chart formula A + B(1 - A) and present-value life pension commutation tables under LC § 4659.',
    deliverable: 'Actuarial settlement adequacy brief compiler.'
  }
];

const faqs = [
  {
    q: 'Do I need my own NVIDIA graphics card or local hardware to run sovereign AI?',
    a: 'For 100% on-premise air-gapped execution where data never leaves your building, an NVIDIA GPU with CUDA support (e.g., RTX 3090, RTX 4090, or professional RTX workstation) or Apple Silicon is used. However, you can also run SutraFlow with private cloud models or switch between local and cloud with a single click.'
  },
  {
    q: 'Can I apply these workflows to industries other than law?',
    a: 'Absolutely! The morning workshop teaches the universal architecture to build an autonomous super brain in ANY industry—including healthcare, commercial real estate, logistics, e-commerce, and accounting. The afternoon track demonstrates how that architecture was applied to California Workers\' Comp as the flagship vertical.'
  },
  {
    q: 'Can I suggest a workflow to be built live on the stream?',
    a: 'Yes! We encourage attendees to email us their specific manual workflows, spreadsheets, or document bottlenecks before Saturday. We pick real attendee use cases and build the automated protocol live during the workshop.'
  },
  {
    q: 'Does this replace our current case management or ERP software?',
    a: 'No. SutraFlow is designed to be completely headless. It connects alongside your existing tools (MerusCase, Filevine, A1-Law, Salesforce, EMRs, etc.) without requiring you to migrate data or disrupt your team\'s daily habits.'
  }
];

export default function MasterclassPage() {
  const { isDark, toggleTheme } = useTheme();
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionEmail, setSuggestionEmail] = useState('');
  const [suggestionWorkflow, setSuggestionWorkflow] = useState('');
  const [isSuggestionSent, setIsSuggestionSent] = useState(false);

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionWorkflow) return;

    try {
      localStorage.setItem('sutra_workshop_suggestion', JSON.stringify({
        name: suggestionName,
        email: suggestionEmail,
        workflow: suggestionWorkflow,
        date: new Date().toISOString()
      }));
    } catch {
      // Ignore local storage error
    }

    setIsSuggestionSent(true);
    toast.success('Suggestion received! Thank you for helping shape upcoming workshop builds.');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050510] text-gray-900 dark:text-slate-100 selection:bg-blue-500/30 overflow-x-hidden transition-colors">
      <SEO 
        title="Live Masterclass | Build a Sovereign Super Brain On Your Own Hardware"
        description="Learn step-by-step how to build autonomous agentic workflows on your own hardware, air-gap confidential data, and master California Workers' Comp automation."
      />

      {/* Sticky Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
        <div className="container mx-auto max-w-7xl pointer-events-auto">
          <nav className="flex items-center justify-between px-6 py-3 rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 bg-gradient-to-r from-[#00b4d8] to-[#10b981] rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform font-black text-sm">
                S
              </div>
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                SutraFlow <span className="text-emerald-500">OS</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              <Link to="/solutions" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Solutions</Link>
              <Link to="/mcp" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">MCP Cloud</Link>
              <Link to="/masterclass" className="text-xs font-bold text-blue-600 dark:text-cyan-400 transition-colors uppercase tracking-widest flex items-center gap-1">Masterclass</Link>
              <Link to="/solutions#air-gap" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors uppercase tracking-widest">Air-Gap Vault</Link>
              <Link to="/pricing" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Pricing</Link>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:text-blue-500 transition-all hover:scale-110 active:scale-95"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <Link to="/login" className="hidden sm:block text-xs font-bold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-widest">
                Sign In
              </Link>
              <Link to="/login?register=true">
                <button className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#10b981] hover:from-[#00a0c2] hover:to-[#0ea572] text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all transform hover:scale-[1.02] cursor-pointer">
                  Join Free
                </button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="pt-28 pb-20">
        {/* Interactive Registration Hero Funnel */}
        <section className="px-4 py-8">
          <MasterclassSalesFunnel />
        </section>

        {/* SECTION 1: Universal Super Brain Curriculum */}
        <section className="container mx-auto max-w-6xl px-4 py-16">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Award className="w-3.5 h-3.5" />
              <span>Universal Agentic Framework</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              How to Create a Super Brain in Any Field
            </h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm md:text-base mt-3 leading-relaxed">
              I will teach you step-by-step how to break down complex professional knowledge, encode deterministic protocols, run on your own hardware with zero leaks, and switch easily between private and public AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {universalCurriculum.map((mod, i) => (
              <div 
                key={i}
                className="rounded-3xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 p-7 hover:border-blue-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/15 flex items-center justify-center border border-blue-500/25">
                    {mod.icon}
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-cyan-400 uppercase tracking-widest">
                    {mod.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-500 dark:group-hover:text-cyan-300 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-5 leading-relaxed">
                  {mod.desc}
                </p>
                <ul className="space-y-2.5 pt-4 border-t border-gray-200 dark:border-white/5">
                  {mod.bullets.map((b, bi) => (
                    <li key={bi} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Suggestion & Topic Request Box */}
        <section className="container mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border border-blue-500/30 p-8 md:p-12 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10 text-center space-y-4 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Live Audience Build Requests</span>
              </div>
              <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                Have a Workflow You Want Built Live?
              </h3>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Email me your suggestions and tell me what you want to see automated. Every Saturday, I take real workflows submitted by attendees and build the agentic super brain live on stream.
              </p>
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
              {!isSuggestionSent ? (
                <form onSubmit={handleSuggestionSubmit} className="space-y-4 bg-slate-900/80 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Your Name</label>
                      <input 
                        type="text" 
                        value={suggestionName}
                        onChange={(e) => setSuggestionName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Your Email</label>
                      <input 
                        type="email" 
                        required
                        value={suggestionEmail}
                        onChange={(e) => setSuggestionEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">What workflow or problem would you like to see built?</label>
                    <textarea 
                      required
                      rows={3}
                      value={suggestionWorkflow}
                      onChange={(e) => setSuggestionWorkflow(e.target.value)}
                      placeholder="e.g., Automating medical lien reconciliations under LC § 4622, or parsing complex commercial real estate lease agreements..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Workflow Suggestion</span>
                    </button>
                    <a 
                      href="mailto:contact@sutraflow.us?subject=Masterclass%20Workflow%20Build%20Suggestion"
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Or email me directly at contact@sutraflow.us</span>
                    </a>
                  </div>
                </form>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Suggestion Received!</h4>
                  <p className="text-xs text-slate-300">
                    We'll review your suggested workflow. Keep an eye on Saturday's live stream agenda!
                  </p>
                  <button 
                    onClick={() => setIsSuggestionSent(false)} 
                    className="text-xs text-cyan-400 hover:underline pt-2 block mx-auto"
                  >
                    Submit another suggestion
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: California Workers' Comp Automation Masterclass Schedule */}
        <section className="container mx-auto max-w-6xl px-4 py-16">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Calendar className="w-3.5 h-3.5" />
              <span>Flagship Industry Intensive</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Mastering California Workers' Comp Automation
            </h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm md:text-base mt-3 leading-relaxed">
              A comprehensive Saturday masterclass schedule covering end-to-end workflows between Law Firms, Medical-Legal Evaluators (PQME/AME), Lien Claimants, and TPAs.
            </p>
          </div>

          <div className="space-y-5">
            {workersCompSchedule.map((item, idx) => (
              <div 
                key={idx}
                className="rounded-3xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-cyan-500/40 transition-all group"
              >
                <div className="flex items-start gap-4 max-w-3xl">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0 border border-blue-500/25">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <span className="text-xs font-black text-blue-600 dark:text-cyan-400 tracking-wider">
                        {item.time}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
                        {item.track}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-500 dark:group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-3">
                      {item.desc}
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Takeaway: {item.deliverable}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <a href="#register">
                    <Button variant="outline" className="w-full md:w-auto text-xs font-bold rounded-xl border-gray-300 dark:border-white/20">
                      Save My Spot
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise Air-Gap Guarantee Banner */}
        <section className="container mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-900/40 via-slate-900/90 to-slate-950 border border-blue-500/30 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Cloud / Air-Gap Guarantee</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Run On Your Own Hardware with 1-Click Cloud Switching
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Whether you run an NVIDIA RTX GPU on-premise for 100% confidential files, or toggle to secure private cloud models for speed, you remain in complete sovereign control of your intelligence.
              </p>
            </div>
            <div className="shrink-0">
              <Link to="/solutions#air-gap">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-wider">
                  Explore Air-Gap Specs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto max-w-4xl px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 p-6 hover:border-blue-500/30 transition-all"
              >
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {faq.q}
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-10 bg-gray-100 dark:bg-slate-950 text-center text-xs text-gray-500 dark:text-slate-500 transition-colors">
        <p>© {new Date().getFullYear()} SutraFlow. Sovereign Intelligence Universal Engine.</p>
        <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-600">Air-gapped, zero-egress cognitive architecture for enterprise operations and sovereign automation.</p>
      </footer>
    </div>
  );
}
