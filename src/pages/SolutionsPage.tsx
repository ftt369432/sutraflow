import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Lock, 
  Layers, 
  Database, 
  Server, 
  ChevronRight, 
  HardDrive, 
  Sun, 
  Moon, 
  Scale, 
  Stethoscope, 
  Briefcase, 
  TrendingUp, 
  UserCheck, 
  ShieldAlert, 
  Sparkles, 
  Workflow, 
  Check, 
  Bot, 
  Brain, 
  GraduationCap, 
  Plug, 
  Wand2,
  FileText,
  LayoutGrid,
  Building2,
  Send,
  SlidersHorizontal,
  Mail,
  Phone,
  Landmark,
  FileCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/SEO';
import { useTheme } from '../contexts/ThemeContext';

export interface IndustryMatrixItem {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  flagship?: boolean;
  link?: string;
  highlights: string[];
  sampleWorkflow: string;
}

export const INDUSTRY_MATRIX: IndustryMatrixItem[] = [
  {
    id: 'ca-workers-comp',
    title: "California Workers' Comp (Flagship Precision Tool)",
    badge: 'Production Flagship',
    flagship: true,
    link: '/solutions/ca-workers-comp',
    icon: <Scale className="w-6 h-6 text-blue-500" />,
    description: 'A deterministic legal research clerk, statutory calculator, and 28-line pleading drafting tool for practitioners. If an AI architecture can reliably master California Workers\' Comp without hallucinating, it has the verifiable precision to handle any industry.',
    highlights: [
      'Deterministic research clerk & official 28-line pleading drafting tool',
      'Automated AME/QME medical cross-exam inconsistency matrices',
      'Deterministic Combined Values Chart (CVC) & Life Pension math',
      'Air-gapped client & medical records with zero cloud egress'
    ],
    sampleWorkflow: 'Ingest 400-page QME medical chart → Identify clinical contradictions → Auto-draft 28-line DOR Objection & Depo Matrix.'
  },
  {
    id: 'eprocurement-public-sector',
    title: 'Enterprise eProcurement & Public Sector Compliance',
    badge: 'Enterprise & Gov',
    icon: <Landmark className="w-6 h-6 text-amber-500" />,
    description: 'Automated RFP & solicitation parsing, Statement of Work (SOW) compliance validation, vendor bid reconciliation, and multi-department approval pipelines.',
    highlights: [
      'Automated parsing of 500+ page RFPs, IFBs, and public solicitations',
      'Statement of Work (SOW) deliverable & pricing ceiling cross-validation',
      'Small business (SB/DVBE) certification & regulatory compliance audits',
      'Audit-ready vendor scoring matrices and proposal synthesis'
    ],
    sampleWorkflow: 'Ingest 350-page state solicitation → Extract mandatory SOW requirements → Generate compliance matrix & bid review.'
  },
  {
    id: 'healthcare-clinical',
    title: 'Healthcare & Clinical Operations',
    badge: 'Clinical Grade',
    icon: <Stethoscope className="w-6 h-6 text-cyan-500" />,
    description: 'HIPAA-compliant document synthesis, clinical chronology extraction, medical records summarization, and local chart review without external cloud exposure.',
    highlights: [
      'Zero-PHI egress: patient charts processed 100% on local hardware',
      'Multi-provider chronology and longitudinal care synthesis',
      'ICD-10 / CPT billing code validation and audit checks',
      'Headless bridge into existing EHR and practice management systems'
    ],
    sampleWorkflow: 'Batch review treatment records → Generate SOAP note synthesis & billing audit matrix.'
  },
  {
    id: 'civil-corporate-legal',
    title: 'Civil Litigation & Corporate Legal',
    badge: 'Enterprise Legal',
    icon: <Briefcase className="w-6 h-6 text-indigo-500" />,
    description: 'High-stakes discovery analysis, deposition preparation grids, privilege log generation, and contract risk audits designed to eliminate manual doc review hours.',
    highlights: [
      'Automated deposition cross-examination matrices with page/line cites',
      'Privilege-shield automated redactions and audit logs',
      'Clause-by-clause contract discrepancy and risk detection',
      'Verbatim statutory citations with zero model hallucinations'
    ],
    sampleWorkflow: 'Ingest deposition transcripts + witness exhibits → Auto-build cross-examination attack vectors.'
  },
  {
    id: 'finance-ma',
    title: 'Finance, M&A & Private Equity',
    badge: 'Sovereign Finance',
    icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
    description: 'Air-gapped due diligence virtual data room (VDR) intelligence, financial covenant analysis, deal sheet extraction, and regulatory compliance validation.',
    highlights: [
      'Zero third-party cloud leakage of non-public material information (MNPI)',
      'Multi-year financial statement reconciliation and outlier detection',
      'Covenant and term-sheet automated compliance audits',
      'Instant extraction of EBITDA adjustments and debt schedules'
    ],
    sampleWorkflow: 'Drop 20 deal room PDFs → Reconcile EBITDA add-backs & compile red-flag executive brief.'
  },
  {
    id: 'everyday-solopreneur',
    title: 'Everyday Professionals & Solopreneurs',
    badge: 'Universal Productivity',
    icon: <UserCheck className="w-6 h-6 text-blue-400" />,
    description: 'Autonomous email triage, smart calendar scheduling, cross-canvas research, client intake parsing, and multi-app orchestration tailored to your daily work.',
    highlights: [
      'Live email classification and autonomous draft generation',
      'Conflict-free smart scheduling across calendars and time zones',
      'Multi-canvas visual workspace for simultaneous reasoning',
      'Turn repetitive manual tasks into 1-click autonomous workflows'
    ],
    sampleWorkflow: 'Incoming client email → Auto-extract details → Schedule meeting & draft onboarding brief.'
  }
];

export default function SolutionsPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState<'all' | 'flagship' | 'enterprise'>('all');

  // Contact / Integration Request Form State
  const [consultationName, setConsultationName] = useState('');
  const [consultationEmail, setConsultationEmail] = useState('');
  const [consultationCompany, setConsultationCompany] = useState('');
  const [consultationService, setConsultationService] = useState('full-integration');
  const [consultationDetails, setConsultationDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const filteredMatrix = INDUSTRY_MATRIX.filter(item => {
    if (activeFilter === 'flagship') return item.flagship;
    if (activeFilter === 'enterprise') return item.id !== 'everyday-solopreneur';
    return true;
  });

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#050510] text-gray-900 dark:text-slate-100 transition-colors">
      <SEO 
        title="Sutra OS Solutions | Universal Super Brain, SaaS & In-House Integration" 
        description="Autonomous intelligence for non-programmers. SaaS platform, custom on-site air-gapped hardware builds, in-house system integrations, and our California Workers' Comp flagship."
      />

      {/* Sticky Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
        <div className="container mx-auto max-w-7xl pointer-events-auto">
          <nav className="flex items-center justify-between px-6 py-3 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform font-black text-sm">
                S
              </div>
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                Sutra <span className="text-blue-600">OS</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-6">
              <Link to="/solutions" className="text-xs font-bold text-blue-600 dark:text-cyan-400 transition-colors uppercase tracking-widest">Universal Brain</Link>
              <Link to="/solutions/ca-workers-comp" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">CA Workers' Comp</Link>
              <a href="#saas-services" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">SaaS Platform</a>
              <a href="#bespoke-services" className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors uppercase tracking-widest">On-Site Integration</a>
              <Link to="/masterclass" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Masterclass</Link>
              <a href="#air-gap" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors uppercase tracking-widest">Air-Gap Vault</a>
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
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest px-6">
                  Launch Sutra
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section: Built For Non-Programmers */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/15 to-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Zero Coding Required · Universal Intelligence & Enterprise Integration
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-950 dark:text-white max-w-5xl mx-auto leading-[1.08] mb-6">
              You Don't Need to Be a Programmer to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500">
                Build a 10x Super Brain.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
              Sutra OS gives professionals, law firms, clinics, and enterprises sovereign autonomy. 
              Subscribe to our turnkey SaaS platform, deploy custom <strong>on-site air-gapped hardware</strong> built for your team, or let us integrate automated multi-agent workflows directly into your existing in-house systems.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#saas-services">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 py-6 text-sm font-black shadow-xl shadow-blue-500/25 flex items-center gap-2 group">
                  Explore SaaS Platform
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <a href="#bespoke-services">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-2xl px-8 py-6 text-sm font-bold border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-500" />
                  On-Site Hardware & In-House Integration
                </Button>
              </a>
              <Link to="/solutions/ca-workers-comp">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-2xl px-8 py-6 text-sm font-bold border-gray-300 dark:border-white/10 text-gray-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-500" />
                  CA Workers' Comp Flagship →
                </Button>
              </Link>
            </div>

            {/* Quick Proof Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-16 pt-10 border-t border-gray-200 dark:border-white/10 text-left">
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5">
                <div className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">Zero Coding</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Plain English prompts & visual workflows</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5">
                <div className="text-xl md:text-2xl font-black text-cyan-600 dark:text-cyan-400">MCP & Claude</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Works with Claude Desktop & Antigravity</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5">
                <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">On-Site Hardware</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Custom multi-GPU air-gapped node builds</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5">
                <div className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">In-House Integrations</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Connect your existing CRM, EHR, and DBs</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Flagship Proof-of-Concept Callout: California Workers' Comp (Robust Grid Layout) */}
      <section className="py-12 bg-gradient-to-r from-blue-900/10 via-cyan-900/10 to-blue-900/10 border-y border-blue-500/20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="p-8 md:p-10 rounded-3xl bg-blue-600/[0.03] dark:bg-blue-500/[0.05] border border-blue-500/20 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-6">
                <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30 shrink-0">
                  <Scale className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-cyan-400 uppercase tracking-widest mb-2">
                    ⭐ Flagship Precision Tool · The Ultimate Real-World Benchmark
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-3">
                    If It Can Master California Workers' Comp, It Can Master Anything You Throw At It.
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-slate-300 leading-relaxed">
                    Why is California Workers' Comp our production flagship? Because it is the most demanding, heavily codified, and adversarial testbed in legal tech: <strong>600-page medical-legal charts</strong>, <strong>verbatim Labor Code citations</strong>, <strong>strict California 28-line legal paper</strong>, and <strong>absolute zero tolerance for AI hallucinations</strong>.
                    <br className="hidden sm:inline" />
                    Our legal engine functions not as an attorney replacement, but as an attorney’s <strong>deterministic power tool</strong>—an autonomous research clerk, statutory calculator, and citation-verified drafter. If you are in legal practice, it is your competitive edge. If you operate an enterprise in another field, it is the living proof that our architecture handles your most critical compliance, audits, and workflows without fail.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-4 flex justify-start lg:justify-end">
                <Link to="/solutions/ca-workers-comp" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black px-8 py-6 shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 text-sm">
                    Explore CA Workers' Comp Engine
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: SaaS Platform Core Infrastructure */}
      <section id="saas-services" className="py-24 bg-gray-50/50 dark:bg-white/[0.01] border-b border-gray-200 dark:border-white/5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Workflow className="w-3.5 h-3.5" />
              SaaS Platform Capabilities
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
              The Turnkey Sovereign Operating System
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-slate-300">
              Run intelligence right inside your browser or desktop app with our subscription tools engineered for high-accuracy reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Genie Drive */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Genie Drive</h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                  A Neural Knowledge Engine with real-time vectoring and local indexing. Every document, brief, and spreadsheet becomes part of your agent's sovereign memory with zero external cloud egress.
                </p>
              </div>
              <div className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 pt-4 border-t border-gray-100 dark:border-white/5">
                ✓ Local Vectoring & Search
              </div>
            </div>

            {/* Intelligent Canvas */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Intelligent Canvas</h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                  The collaborative synthesis workspace. Where businesses share work, collaborate alongside autonomous agents, and edit production documents with surgical precision.
                </p>
              </div>
              <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 pt-4 border-t border-gray-100 dark:border-white/5">
                ✓ Multi-Document Synthesis
              </div>
            </div>

            {/* Mission Control HQ */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Mission Control HQ</h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                  Coordinate autonomous swarms. Set a business goal, and watch specialized agents plan, cross-reference evidence, and execute multi-stage pipelines with zero micromanagement.
                </p>
              </div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-4 border-t border-gray-100 dark:border-white/5">
                ✓ Autonomous Swarm Dispatch
              </div>
            </div>

            {/* Sovereign Skills */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Sovereign Skills</h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                  A library of "Motor Tools" for the AI Era. From live email triage and conflict-free calendar coordination to legal drafting and financial auditing, give your agents hands.
                </p>
              </div>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 pt-4 border-t border-gray-100 dark:border-white/5">
                ✓ Pre-Built Action Tools
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: On-Site Hardware, Bespoke Integration & Consulting (User's Service Offering) */}
      <section id="bespoke-services" className="py-24 bg-white dark:bg-[#050510] border-b border-gray-200 dark:border-white/5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Building2 className="w-3.5 h-3.5" />
              White-Glove In-House Deployment
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
              We Build Custom Hardware On-Site & Integrate Autonomous Intelligence Into Your Business.
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
              Software is only half the battle. If your firm handles sensitive client records, protected health information (PHI), or confidential financial ledgers, you cannot rely on public cloud providers. We personally design, construct, install, and integrate complete air-gapped sovereign setups directly at your facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Custom Hardware Builds */}
            <div className="p-8 rounded-3xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center mb-6">
                  <HardDrive className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                  On-Site Custom Hardware Builds & Setup
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
                  We spec, assemble, and deliver customized sovereign hardware nodes (NVIDIA RTX / CUDA acceleration rigs) directly to your physical facilities. We configure them on your internal LAN with true air-gapped isolation so all model processing runs in-house with zero external data egress.
                </p>
                <ul className="space-y-3 text-xs text-gray-700 dark:text-slate-300 mb-6">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Physical multi-GPU server construction, burn-in & on-premise installation</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Local vLLM, Unsloth, and Ollama model orchestration</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Zero packet leakage & physical network vaulting</li>
                </ul>
              </div>
            </div>

            {/* In-House Systems Integration */}
            <div className="p-8 rounded-3xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-6">
                  <Workflow className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                  In-House Systems & Legacy Integration
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
                  We don't force you to abandon your existing software. We connect our cognitive architecture headlessly into your firm’s current case management software, ERP (SAP, Oracle), CRM, EHR, network shared folders, and document databases via standardized Model Context Protocol (MCP) and custom REST bridges.
                </p>
                <ul className="space-y-3 text-xs text-gray-700 dark:text-slate-300 mb-6">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Non-invasive database and file share watch folders</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Headless bridges for legacy ERPs, CRMs, and legal DMS</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Automated compliance, redaction, and audit verification</li>
                </ul>
              </div>
            </div>

            {/* Enterprise eProcurement & Public Sector Compliance */}
            <div className="p-8 rounded-3xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
                  <Landmark className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                  Enterprise eProcurement & Public Sector Workflows
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
                  Tackle the heaviest public and commercial procurement workflows. Ingest massive solicitations, cross-examine Statement of Work (SOW) deliverables, verify vendor certifications, and audit pricing ceilings against statutory guidelines with line-item accuracy.
                </p>
                <ul className="space-y-3 text-xs text-gray-700 dark:text-slate-300 mb-6">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Automated parsing of 500+ page RFPs, IFBs, and public solicitations</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> SOW deliverable extraction & vendor bid scoring matrices</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Small business (SB/DVBE) validation & standard form reconciliation</li>
                </ul>
              </div>
            </div>

            {/* Bespoke Multi-Agent Swarms & Executive Governance */}
            <div className="p-8 rounded-3xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                  <FileCheck className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                  Bespoke Agentic Swarms & Governance
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
                  Move beyond single-turn chat prompts. We build specialized, multi-stage agent swarms mapped to your organization's exact standard operating procedures (SOPs) with strict human-in-the-loop review gates for director approvals.
                </p>
                <ul className="space-y-3 text-xs text-gray-700 dark:text-slate-300 mb-6">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Ingestion & OCR → Statutory Cross-Examination → Synthesis Swarms</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Verbatim citations and audit logs with zero model hallucinations</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Executive sign-off gates ensuring human leadership stays in control</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Consultation Request Form (Interactive Lead Funnel) */}
          <div className="max-w-3xl mx-auto p-8 md:p-12 rounded-3xl bg-gradient-to-br from-blue-900/20 via-slate-900/40 to-cyan-900/20 border border-blue-500/20 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                Request an In-House Integration Consultation
              </h3>
              <p className="text-sm text-slate-300 max-w-xl mx-auto">
                Ready to deploy sovereign intelligence, custom hardware, eProcurement intelligence, or automated workflows for your organization? Fill out this brief form and our team will review your requirements.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-lg font-black text-white mb-1">Consultation Request Received!</h4>
                <p className="text-xs text-slate-300">
                  We have received your requirements and will reach out promptly to discuss your on-site hardware or in-house workflow integration.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Your Name</label>
                    <input 
                      type="text"
                      required
                      value={consultationName}
                      onChange={(e) => setConsultationName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Business Email</label>
                    <input 
                      type="email"
                      required
                      value={consultationEmail}
                      onChange={(e) => setConsultationEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Company / Firm / Agency Name</label>
                    <input 
                      type="text"
                      required
                      value={consultationCompany}
                      onChange={(e) => setConsultationCompany(e.target.value)}
                      placeholder="Enterprise / Law Firm / Public Agency"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Primary Capability Needed</label>
                    <select 
                      value={consultationService}
                      onChange={(e) => setConsultationService(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full-integration">On-Site Hardware Build + Complete System Integration</option>
                      <option value="eprocurement">Enterprise eProcurement & Public Sector Compliance</option>
                      <option value="hardware-only">Custom Air-Gapped GPU Hardware Node Only (NVIDIA RTX / CUDA)</option>
                      <option value="workflow-only">Bespoke Multi-Agent Swarm Engineering (SOP Mapping)</option>
                      <option value="legal-tool">California Workers' Comp / Legal Precision Tool Setup</option>
                      <option value="masterclass-training">Team Masterclass & Executive Training</option>
                      <option value="saas-custom">SaaS Custom Enterprise Deployment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Brief Description of Goals or Systems</label>
                  <textarea 
                    rows={3}
                    value={consultationDetails}
                    onChange={(e) => setConsultationDetails(e.target.value)}
                    placeholder="Tell us what software you currently use (e.g. ERP, databases, case management, CRM) and the workflows you want automated..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl py-6 text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Integration Assessment Request
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: MCP Connection Hub (Antigravity & Claude) */}
      <section className="py-24 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-4xl mx-auto p-8 md:p-12 rounded-3xl bg-gradient-to-br from-blue-900/20 via-slate-900/40 to-cyan-900/20 border border-blue-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Plug className="w-3.5 h-3.5" />
                Model Context Protocol (MCP) Ecosystem
              </div>

              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
                Works With Google Antigravity & Claude Desktop Out of the Box.
              </h2>

              <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-8">
                You are not locked into one interface. Sutra provides standardized, high-speed <strong>Model Context Protocol (MCP)</strong> servers that turn Claude Desktop, Claude Coworker, or Google Antigravity into deterministic research clerks with access to your local files, statutory calculators, and automated drafting tools.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Bot className="w-6 h-6 text-cyan-400" />
                    <h4 className="text-lg font-black text-white">Claude Desktop / Coworker</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Paste our 1-line MCP config into Claude Desktop. Claude immediately gains deterministic calculators, local file indexing, and custom industry tools without sending your data to external APIs.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-6 h-6 text-blue-400" />
                    <h4 className="text-lg font-black text-white">Google Antigravity Agent</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pair-program and orchestrate high-level multi-agent missions in Antigravity. Run deep case analysis, background doc audits, and live memory graphs directly inside your IDE or desktop console.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/mcp">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black px-8 py-6 shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                    Explore MCP Cloud & Configs
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/masterclass">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 rounded-2xl font-bold px-8 py-6 flex items-center justify-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                    Learn How to Build Yours in the Masterclass
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: What is an Air-Gap? (Plain English Clarity) */}
      <section id="air-gap" className="py-24 bg-white dark:bg-[#050510]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              Air-Gap Architecture
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
              What Does "Air-Gapped Sovereign Intelligence" Actually Mean?
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-slate-300">
              Plain English: your proprietary documents, client records, and trade secrets never leave your room. Here is why true sovereign hardware matters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Runs on Your Own Hardware</h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Execute local Unsloth / vLLM / Ollama models directly on your NVIDIA RTX GPUs or dedicated local AI accelerators. Full processing power without reliance on third-party cloud status or rate limits.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Zero Cloud Egress</h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                When you analyze high-stakes documents, client files, or financial records, no bytes are transmitted to external servers. What happens on your machine stays on your machine.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No Training On Your Data</h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Public LLM vendors frequently update their terms to train future models on user prompts. With Sutra's sovereign engine, your intellectual property and confidential case memos are never scraped.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Zero-PHI Compliance Shield</h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Engineered for HIPAA, legal ethics rules, and enterprise data governance. Direct identifiers (SSNs, DOBs, claim numbers) are masked at the local kernel level before any operation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Industry Protocol Matrix */}
      <section id="industry-matrix" className="py-24 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-200 dark:border-white/5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Layers className="w-3.5 h-3.5" />
                Universal Industry Protocols
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                Sovereign Intelligence Across Sectors
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                All Industries
              </button>
              <button 
                onClick={() => setActiveFilter('flagship')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === 'flagship' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Flagship Engine
              </button>
              <button 
                onClick={() => setActiveFilter('enterprise')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === 'enterprise' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Enterprise Verticals
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMatrix.map(item => (
              <div 
                key={item.id}
                className={`p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                  item.flagship 
                    ? 'bg-gradient-to-b from-blue-900/10 via-slate-900/20 to-cyan-900/10 border-2 border-blue-500/40 shadow-xl' 
                    : 'bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      {item.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      item.flagship 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
                    {item.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Key Capabilities</div>
                    {item.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/5 mb-6">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">Sample Workflow</div>
                    <div className="text-xs text-gray-800 dark:text-slate-200 font-medium italic">
                      "{item.sampleWorkflow}"
                    </div>
                  </div>
                </div>

                <div>
                  {item.link ? (
                    <Link to={item.link}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black py-5 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                        Explore Flagship Engine
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <a href="#bespoke-services">
                      <Button variant="outline" className="w-full border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold py-5 flex items-center justify-center gap-2">
                        Inquire About Custom Protocol
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-[#050510] dark:to-slate-950 border-t border-gray-200 dark:border-white/10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-950 dark:text-white mb-6">
            Ready to Integrate Autonomous Intelligence Into Your Business?
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
            Subscribe to our turnkey SaaS platform, schedule an on-site hardware build, or join our live Saturday Masterclass to turn your team into a superpower.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#bespoke-services">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-10 py-6 text-sm font-black shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                <Building2 className="w-4 h-4" />
                Schedule In-House Integration
              </Button>
            </a>
            <Link to="/masterclass">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-2xl px-8 py-6 text-sm font-bold border-gray-300 dark:border-white/10 text-gray-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                Join Saturday Masterclass
              </Button>
            </Link>
            <Link to="/solutions/ca-workers-comp">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-2xl px-8 py-6 text-sm font-bold border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-cyan-300 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                Explore CA Workers' Comp →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Legal Notice */}
      <footer className="py-8 bg-gray-100 dark:bg-black/60 border-t border-gray-200 dark:border-white/5 text-center text-xs text-gray-500 dark:text-slate-400">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} Sutra OS / SutraFlow. All rights reserved. Sovereign Intelligence & Enterprise Protocols.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/solutions" className="hover:text-gray-900 dark:hover:text-white transition-colors">Universal Brain</Link>
            <Link to="/solutions/ca-workers-comp" className="hover:text-gray-900 dark:hover:text-white transition-colors">Workers' Comp (Flagship)</Link>
            <a href="#bespoke-services" className="hover:text-gray-900 dark:hover:text-white transition-colors">On-Site Setup</a>
            <Link to="/mcp" className="hover:text-gray-900 dark:hover:text-white transition-colors">MCP Sync</Link>
            <Link to="/masterclass" className="hover:text-gray-900 dark:hover:text-white transition-colors">Masterclass</Link>
            <Link to="/pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
