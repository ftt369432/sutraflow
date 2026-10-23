import React, { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  Receipt, 
  Building2, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Lock, 
  Layers, 
  FileText, 
  Database, 
  RefreshCw, 
  Server, 
  Check, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/SEO';
import { useTheme } from '../contexts/ThemeContext';

export interface IndustrySolution {
  id: string;
  tabLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  heroPitch: string;
  painPoints: string[];
  capabilities: {
    title: string;
    description: string;
    statutoryRef?: string;
  }[];
  workflows: string[];
  deliverablePreview: {
    type: string;
    title: string;
    sampleLines: string[];
  };
}

export const INDUSTRY_SOLUTIONS: IndustrySolution[] = [
  {
    id: 'law-firms',
    tabLabel: 'Law Firms',
    badge: 'Applicant & Defense Counsel',
    title: 'Sovereign Litigation Engine for California Law Firms',
    subtitle: 'Zero-hallucination 28-line legal pleadings, automated deposition matrices, and deterministic rating calculations.',
    icon: <Scale className="w-5 h-5 text-blue-500" />,
    heroPitch: 'Empower your attorneys and hearing representatives with autonomous research clerks and drafting copilots that cite verbatim Labor Code provisions and court rules.',
    painPoints: [
      'Manual drafting of 28-line WCAB legal petitions consumes 4-8 billable attorney hours per file.',
      'Sifting through 600-page QME/AME records leaves critical clinical contradictions undiscovered before depositions.',
      'Sending sensitive claimant documents to public LLMs (ChatGPT, Claude) risks State Bar ethics and client confidentiality violations.'
    ],
    capabilities: [
      {
        title: 'Deterministic 28-Line Pleadings',
        description: 'Auto-compile Petitions for Penalties (LC § 5814), Depo Attorney Fee Petitions (LC § 5710), DOR Objections, and Settlement Adequacy briefs formatted to official California 28-line pleading standard.',
        statutoryRef: 'California Labor Code §§ 5814, 5710; 8 CCR § 10510'
      },
      {
        title: 'Deposition Cross-Exam Matrix',
        description: 'Drop doctor depositions, prior defense QMEs, and treating physician notes. The engine maps prior inconsistencies into an instant cross-examination grid with page/line citations.',
        statutoryRef: 'Evid. Code § 770; Labor Code § 5710'
      },
      {
        title: 'CVC Rating & Life Pension Math',
        description: 'Instant multi-body-part compounding using the official California Combined Values Chart formula A + B(1 - A) with commutation schedules and present-value life pension tables.',
        statutoryRef: 'Labor Code § 4658, § 4659'
      }
    ],
    workflows: [
      'LC § 5814 Penalty Petitions with Exact Accounting',
      'QME / AME Medical Chronology & Inconsistency Audit',
      'AOE / COE Trial Briefs & Witness Examination Outlines',
      'Compromise & Release (C&R) Adequacy Valuation Sheets'
    ],
    deliverablePreview: {
      type: 'California 28-Line Pleading',
      title: 'PETITION FOR PENALTIES UNDER LABOR CODE § 5814',
      sampleLines: [
        '1   LAW OFFICES OF J. H. STERLING, ESQ.',
        '2   State Bar No. 198421',
        '3   Attorneys for Applicant',
        '4   STATE OF CALIFORNIA',
        '5   WORKERS\' COMPENSATION APPEALS BOARD',
        '6   Applicant: JANE DOE          | CASE NO. ADJ12345678',
        '7   vs.                          | PETITION FOR PENALTIES',
        '8   ACME CORP; TRAVELERS INS     | UNDER LABOR CODE § 5814'
      ]
    }
  },
  {
    id: 'lien-claimants',
    tabLabel: 'Lien Claimants',
    badge: 'Medical Providers & Billing Reps',
    title: 'Aggressive Medical-Legal & Treatment Lien Litigation',
    subtitle: 'Enforce Labor Code § 4622 strict 60-day payment mandates with automatic 10% statutory penalties and 7% annual interest.',
    icon: <Receipt className="w-5 h-5 text-emerald-500" />,
    heroPitch: 'Transform unpaid medical-legal bills and contested treatment liens into automated, audit-proof recovery collections without increasing administrative headcount.',
    painPoints: [
      'Insurers and TPAs routinely stall medical-legal bills past the 60-day statutory window without paying § 4622 interest.',
      'Second Bill Review (SBR) and Independent Bill Review (IBR) filing deadlines are easily missed across hundreds of claims.',
      'Lien conferences require extensive preparation to rebut boilerplate defense EOB explanation of review objections.'
    ],
    capabilities: [
      {
        title: 'LC § 4622 Automated 60-Day Sentinel',
        description: 'Auto-track EOR receipt dates against statutory 60-day deadlines. Automatically compute 10% penalty plus 7% per annum interest from the 61st day onward.',
        statutoryRef: 'Labor Code § 4622(a)(1); 8 CCR § 10786'
      },
      {
        title: 'SBR & IBR Rapid Package Assembly',
        description: 'Ingest contested bills and EOBs to generate conforming Second Bill Review requests and DWC IBR petitions with OMFS statutory rate schedules.',
        statutoryRef: 'Labor Code § 4603.2; 8 CCR § 9792.5.5'
      },
      {
        title: 'Lien Conference Trial Briefs',
        description: 'Produce courtroom-ready Lien Trial Briefs with complete proof of service, verified itemized ledgers, and rebuttals to MPN defense defenses.',
        statutoryRef: '8 CCR § 10786; Labor Code § 4903'
      }
    ],
    workflows: [
      'Medical-Legal Billing Enforcement Ledgers (LC § 4622)',
      'Petition for Costs and Sanctions under 8 CCR § 10786',
      'Second Bill Review (SBR) Objection Packages',
      'OMFS Grounding & Rate Dispute Rebuttals'
    ],
    deliverablePreview: {
      type: 'Lien Claimant Legal Brief',
      title: 'PETITION FOR PAYMENT OF MEDICAL-LEGAL EXPENSES & PENALTIES',
      sampleLines: [
        '1   SPECTRUM MEDICAL GROUP / MEDLAND MEDICAL',
        '2   Authorized Lien Claimant Representative',
        '3   WORKERS\' COMPENSATION APPEALS BOARD',
        '4   IN RE: BILLING ENFORCEMENT UNDER LC § 4622',
        '5   Lien Claimant proved service of billing on 01/15/2026.',
        '6   Defendant failed to issue payment within 60 days.',
        '7   Statutory 10% penalty ($450.00) plus 7% interest accrued.'
      ]
    }
  },
  {
    id: 'medical-offices',
    tabLabel: 'Medical Clinics',
    badge: 'PTPs, QMEs & Health Networks',
    title: 'Clinical Document Intelligence for Medical Practices',
    subtitle: 'Digest 500-page historical medical records into structured chronological exhibit sheets and clinical anomaly summaries.',
    icon: <Building2 className="w-5 h-5 text-cyan-500" />,
    heroPitch: 'Enable Qualified Medical Evaluators and Primary Treating Physicians to review complex files in minutes while keeping patient PHI completely inside your walls.',
    painPoints: [
      'Doctors spend weekends reviewing redundant, unorganized 1,000-page medical record dumps prior to QME evaluations.',
      'Utilization Review (UR) denials arrive with short rebuttal windows, requiring manual MTUS / ACOEM clinical justification.',
      'High administrative burden to maintain compliance with DWC reporting rules and timelines.'
    ],
    capabilities: [
      {
        title: '500-Page Medical Chronology',
        description: 'Instantly ingest multi-facility PDFs, extract operative reports, diagnostic imaging (MRIs, X-rays), and generate date-stamped chronological exhibit tables.',
        statutoryRef: '8 CCR § 9785; Labor Code § 4061'
      },
      {
        title: 'MTUS / ODG Guideline Grounding',
        description: 'Cross-reference proposed surgical or therapeutic interventions against official California Medical Treatment Utilization Schedule (MTUS) evidence-based standards.',
        statutoryRef: 'Labor Code § 4604.5; 8 CCR § 9792.20'
      },
      {
        title: 'PTP Quarterly Progress Summaries',
        description: 'Auto-fill PR-2 and PR-4 reporting templates with objective findings, work status restrictions, and future medical care recommendations.',
        statutoryRef: 'DWC Form PR-2; Labor Code § 4060'
      }
    ],
    workflows: [
      'QME / AME Record Ingestion & Milestone Chronology',
      'UR Dubon Sentinel & MTUS Clinical Rebuttals',
      'PR-2 / PR-4 Form Pre-Filling & Diagnostic Indexing',
      'Impairment Rating Worksheets (AMA Guides 5th Edition)'
    ],
    deliverablePreview: {
      type: 'Medical Chronology Sheet',
      title: 'COMPREHENSIVE MEDICAL MILESTONE CHRONOLOGY',
      sampleLines: [
        'DATE        | PROVIDER       | CLINICAL EVENT / DIAGNOSIS',
        '03/12/2025  | Quest Imaging  | MRI Lumbar: L4-L5 4mm herniation',
        '05/18/2025  | Dr. Smith PTP  | Epidural injection recommended',
        '06/02/2025  | UR Reviewer    | Denied: Failure to meet MTUS PT criteria',
        '06/10/2025  | PTP Rebuttal   | MTUS Sec. 9792.24.1 Exception Cited'
      ]
    }
  },
  {
    id: 'tpa',
    tabLabel: 'TPAs & Claims',
    badge: 'Third Party Administrators & Carriers',
    title: 'Autonomous Claims Audit & Reserve Forecasting',
    subtitle: 'Instantly audit wage statements, TTD/PD rate schedules, subrogation credits, and compliance deadlines across massive caseloads.',
    icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
    heroPitch: 'Give claims adjusters and supervisory teams autonomous assistants that verify benefit rates, catch settlement discrepancies, and prevent costly Labor Code penalties.',
    painPoints: [
      'Adjusters handle 150+ claims each, leading to missed 14-day benefit notice deadlines and automated penalty exposure.',
      'Wage calculations across variable earnings, overtime, and second jobs require tedious manual auditing.',
      'Settlement evaluations risk over-reserving or rejecting viable compromises due to unanalyzed medical record volumes.'
    ],
    capabilities: [
      {
        title: 'Wage & TTD/PD Audit Sentinel',
        description: 'Auto-verify AWW (Average Weekly Wage) against California statutory maximum and minimum rates for the applicable injury year.',
        statutoryRef: 'Labor Code § 4453, § 4653'
      },
      {
        title: 'Subrogation & Third-Party Credit Math',
        description: 'Calculate employer credit thresholds under Labor Code § 3858 / § 3861 with attorney fee and litigation expense apportionment.',
        statutoryRef: 'Labor Code §§ 3856, 3861'
      },
      {
        title: 'Early Settlement Adequacy Check',
        description: 'Evaluate Compromise & Release packages against projected future medical costs and life expectancy commutation math.',
        statutoryRef: '8 CCR § 10700; Labor Code § 5001'
      }
    ],
    workflows: [
      'Statutory TTD / PD Maximum & Minimum Verification',
      'Settlement Reserve Commutation & Life Expectancy Tables',
      '14-Day Benefit Notice Audit & Penalty Prevention',
      'Third-Party Subrogation Credit Apportionment'
    ],
    deliverablePreview: {
      type: 'TPA Forensic Audit Report',
      title: 'BENEFIT AUDIT & PENALTY RISK EVALUATION',
      sampleLines: [
        'CLAIM: WC-2026-90412 | INJURY DATE: 04/10/2025',
        'STATED AWW: $1,420.00 | STATUTORY TTD RATE: $946.67/wk',
        'AUDIT FINDING: Overtime inclusion verified.',
        'PENALTY RISK: Zero delay detected. All 14-day notices timely.',
        'PROJECTED PD VALUE (34% WPI -> 42% PD): $54,180.00'
      ]
    }
  }
];

export function WorkersCompSolutionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'law-firms';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { isDark, toggleTheme } = useTheme();
  const deepDiveRef = useRef<HTMLElement>(null);

  const currentSolution = INDUSTRY_SOLUTIONS.find(s => s.id === activeTab) || INDUSTRY_SOLUTIONS[0];

  const handleTabChange = (id: string, shouldScroll = true) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
    if (shouldScroll && deepDiveRef.current) {
      const yOffset = -90;
      const y = deepDiveRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050510] text-gray-900 dark:text-slate-100 transition-colors">
      <SEO 
        title="California Workers' Comp Solutions | SutraFlow OS" 
        description="Responsible legal and clinical automation. Air-gapped, zero-PHI workflows for California law firms, medical providers, and claims administrators."
      />

      {/* Sticky Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
        <div className="container mx-auto max-w-7xl pointer-events-auto">
          <nav className="flex items-center justify-between px-6 py-3 rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform font-black text-sm">
                S
              </div>
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                SutraFlow <span className="text-blue-600">OS</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              <Link to="/solutions" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Universal Solutions</Link>
              <Link to="/solutions/ca-workers-comp" className="text-xs font-bold text-blue-600 dark:text-cyan-400 transition-colors uppercase tracking-widest">CA Workers' Comp</Link>
              <Link to="/mcp" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">MCP Cloud</Link>
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
                  Launch App
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative pt-24 pb-8 md:pt-32 md:pb-10 overflow-hidden border-b border-gray-200 dark:border-white/10">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Responsible Automation • Zero-PHI Egress</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-4">
              Tailored Intelligence for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500">
                California Workers' Comp
              </span>
            </h1>

            <p className="text-base md:text-lg text-gray-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              From solo applicant practitioners to multi-facility medical networks and TPAs—deploy pre-trained, vaulted agent swarms that respect your workflow without exposing sensitive claimant data.
            </p>
          </div>

          {/* Industry Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 p-1.5 max-w-2xl mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-xl">
            {INDUSTRY_SOLUTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id, true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.tabLabel}</span>
              </button>
            ))}
          </div>

          {/* Interactive Scroll / Jump Down Anchor */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => handleTabChange(activeTab, true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all cursor-pointer group shadow-sm hover:scale-105 active:scale-95"
            >
              <span>Explore {currentSolution.tabLabel} Workflows & 28-Line Preview</span>
              <ChevronDown className="w-4 h-4 animate-bounce text-blue-500" />
            </button>
          </div>
        </div>
      </section>

      {/* Active Tab Solution Deep-Dive */}
      <section ref={deepDiveRef} id="solution-content" className="py-12 md:py-16 container mx-auto px-4 max-w-7xl scroll-mt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSolution.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-16"
          >
            {/* Main Header & Pitch Card */}
            <div className="grid lg:grid-cols-12 gap-8 items-center rounded-3xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 p-8 md:p-12 shadow-xl backdrop-blur-xl">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                    {currentSolution.badge}
                  </div>
                  {/* In-Card Quick Tab Switcher */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-200/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs">
                    {INDUSTRY_SOLUTIONS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleTabChange(s.id, false)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          activeTab === s.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {s.tabLabel}
                      </button>
                    ))}
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  {currentSolution.title}
                </h2>
                <p className="text-base md:text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
                  {currentSolution.heroPitch}
                </p>

                {/* Pain Points Solved */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">
                    Legacy Pain Points Eliminated:
                  </h4>
                  <ul className="space-y-2">
                    {currentSolution.painPoints.map((pain, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-gray-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pain}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 flex flex-wrap gap-4">
                  <Link to="/login?register=true">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                      Deploy for {currentSolution.tabLabel}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/masterclass">
                    <Button variant="outline" size="lg" className="rounded-xl border-gray-300 dark:border-white/10">
                      View Masterclass Syllabus
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Deliverable Mockup */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-gray-900 border border-slate-800 p-6 text-slate-200 shadow-2xl font-mono text-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{currentSolution.deliverablePreview.type}</span>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-blue-400 mb-2">// {currentSolution.deliverablePreview.title}</p>
                    <div className="space-y-1 bg-black/40 p-4 rounded-xl text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                      {currentSolution.deliverablePreview.sampleLines.map((line, lIdx) => (
                        <p key={lIdx} className="whitespace-pre">{line}</p>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verbatim Statutory Grounding
                    </span>
                    <span>Deterministic 100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Capability Pillars */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold tracking-tight">Specialized Capabilities & Statutory Authorities</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {currentSolution.capabilities.map((cap, cIdx) => (
                  <div 
                    key={cIdx}
                    className="rounded-2xl p-6 bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-white/10 hover:border-blue-500/40 transition-all space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                      0{cIdx + 1}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{cap.title}</h4>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                      {cap.description}
                    </p>
                    {cap.statutoryRef && (
                      <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 pt-2 border-t border-gray-100 dark:border-white/5">
                        Authority: {cap.statutoryRef}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* 🛡️ AIR-GAP & SOVEREIGN INTEGRATION ARCHITECTURE */}
      <section id="air-gap" className="py-20 bg-gray-50 dark:bg-slate-900/40 border-y border-gray-200 dark:border-white/10">
        <div className="container mx-auto px-4 max-w-7xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Architectural Guarantee</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              What Is An "Air-Gapped" Sovereign Engine?
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
              Unlike consumer AI chatbots that transmit your files to external cloud servers, SutraFlow is engineered for strict legal and medical confidentiality.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">1. Local On-Premises RTX 4090 Engine</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                Large language models run directly on your firm's local GPU hardware (such as an NVIDIA GeForce RTX 4090 or private server). Full document indexing and drafting happen without network packets ever leaving your office.
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">2. Zero-PHI Egress Shield</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                Before any statutory lookup occurs, our automated sanitization shield strips claimant direct identifiers (SSNs, DOBs, Claim Numbers, and names). Legal precedents and math are solved without exposing patient data.
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">3. 100% Vaulted Local Storage</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                Your medical exhibit indexes, case briefs, and client notes remain encrypted on your designated local drives or private network shares. We never train public foundation models on your legal work product.
              </p>
            </div>
          </div>

          {/* 1-on-1 Headless Integration Callout */}
          <div className="rounded-3xl p-8 md:p-12 bg-gradient-to-r from-blue-900/30 via-slate-900/80 to-blue-900/30 border border-blue-500/30 shadow-2xl backdrop-blur-xl">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase">
                  <span>Seamless Practice Integration</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Keep Your Existing Practice Software. We Install a Headless Bridge.
                </h3>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  You don’t have to switch your case management system. Whether your office runs <strong>MerusCase, A1-Law, Filevine, DaisyBill, or Edexis</strong>, we configure a headless integration that connects directly to your existing folders and produces court-ready pleadings right inside your current workflow.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <Link to="/contact">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                    Schedule 1-on-1 Integration Call
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg" className="w-full rounded-xl border-white/20 text-white hover:bg-white/10">
                    Compare Enterprise Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 container mx-auto px-4 max-w-7xl text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Ready to Deploy Sovereign Intelligence?
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-slate-400">
            Join the forward-thinking enterprises, professional firms, and operators building on the SutraFlow OS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/login?register=true">
              <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-500/25">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/masterclass">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-xl border-gray-300 dark:border-white/10">
                Join Live Masterclass
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WorkersCompSolutionsPage;
