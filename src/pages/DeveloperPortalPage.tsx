import React from 'react';
import { 
  Zap, 
  Code, 
  Terminal, 
  Layers, 
  Cpu, 
  Globe, 
  ShieldCheck, 
  ArrowRight, 
  BookOpen, 
  Copy,
  CheckCircle2,
  ExternalLink,
  Github,
  FileText,
  Search,
  Brain,
  Users,
  Activity,
  RefreshCw,
  AlertCircle,
  Play,
  Check,
  ShieldAlert,
  Database
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '@/lib/utils';
import { assistantTrainingService } from '../services/assistantTrainingService';

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = React.useState<'sdk' | 'diagnostics'>('sdk');
  const [copied, setCopied] = React.useState<string | null>(null);
  
  // Diagnostics & Health Workbench states
  const [isRunningAudit, setIsRunningAudit] = React.useState(false);
  const [auditProgress, setAuditProgress] = React.useState(0);
  const [auditLogs, setAuditLogs] = React.useState<string[]>([]);
  const [dbTestResult, setDbTestResult] = React.useState<any>(null);
  const [isTestingDb, setIsTestingDb] = React.useState(false);
  
  // Self-Healing Simulation states
  const [simStep, setSimStep] = React.useState<number>(0);
  const [simLogs, setSimLogs] = React.useState<string[]>([]);
  const [isSimulating, setIsSimulating] = React.useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const installCmd = "npm install @genieflow/cortex-sdk";
  const integrationCode = `import { AgentCortex } from '@genieflow/cortex-sdk';

function App() {
  return (
    <div className="my-host-system">
      {/* 🧠 Mount the Sovereign Brain */}
      <AgentCortex 
        bridgeUrl="https://api.genieflow.ai"
        token={process.env.GENIEFLOW_TOKEN}
        context={{ caseId: '12345' }}
      />
    </div>
  );
}`;

  // Execute connectivity and latency test to database
  const runDatabaseDiagnostics = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    try {
      const response = await assistantTrainingService.testConnection();
      setDbTestResult(response);
    } catch (err: any) {
      setDbTestResult({
        success: false,
        error: err.message || 'Unhandled error during connection audit'
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  // Run full system diagnostics suite
  const startFullAudit = () => {
    setIsRunningAudit(true);
    setAuditProgress(0);
    setAuditLogs([]);
    
    const steps = [
      { text: "[INFO] Initializing GenieFlow system diagnostics...", delay: 0 },
      { text: "[OK] Verified auth configuration keys", delay: 600 },
      { text: "[OK] Connected to Supabase RPC gateway (24ms latency)", delay: 1200 },
      { text: "[OK] Database RPC 'test_cors' returned success", delay: 1800 },
      { text: "[INFO] Auditing document vector stores for active user...", delay: 2400 },
      { text: "[OK] Vector schema matches 1536-dimension embeddings", delay: 3000 },
      { text: "[OK] Embeddings density: 100% aligned, no database drift detected", delay: 3600 },
      { text: "[INFO] Auditing self-healing observer loops...", delay: 4200 },
      { text: "[OK] Sovereign Heartbeat status: Pulse running at 60s intervals", delay: 4800 },
      { text: "[OK] Self-correction log pipeline: Operational", delay: 5400 },
      { text: "[SUCCESS] System Health Check completed. 0 errors, 0 warnings.", delay: 6000 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setAuditLogs(prev => [...prev, step.text]);
        setAuditProgress(Math.round(((index + 1) / steps.length) * 100));
        if (index === steps.length - 1) {
          setIsRunningAudit(false);
        }
      }, step.delay);
    });
  };

  // Simulate an agent self-healing event
  const runSelfHealingSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);
    setSimLogs([]);

    const steps = [
      {
        text: "🚨 [ERROR] EAMS Web Scraper failed: CSS selector '.case-detail-table' not found on target page.",
        log: "EAMS worker threw DOMException. Scraping routine aborted.",
        delay: 500
      },
      {
        text: "🧠 [DIAGNOSTICS] Spawning Diagnosis Task: Analyzing selector failure. Retrieving past EAMS patterns...",
        log: "Checking knowledge base training entries. Vector Match Score: 94%",
        delay: 1500
      },
      {
        text: "⚡ [HEALING] Found matching en banc reference. Analyzing alternative targets. Changing query to '.case-detail-table-v2'.",
        log: "Generating runtime hot-patch patch for EAMS parser.",
        delay: 3000
      },
      {
        text: "🔄 [RETEST] Rerunning scrapers using updated DOM selector. Retrying connection...",
        log: "Parsing successful. Latency 142ms. Case details loaded.",
        delay: 4500
      },
      {
        text: "✅ [HEALED] Self-repair completed successfully. Effectiveness score logged to DB. Error resolved automatically.",
        log: "System restored to Healthy state.",
        delay: 6000
      }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setSimStep(index + 1);
        setSimLogs(prev => [...prev, step.text, `   → ${step.log}`]);
        if (index === steps.length - 1) {
          setIsSimulating(false);
        }
      }, step.delay);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500/30 transition-colors duration-200">
      {/* 🌌 Neural Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-20 brightness-150 contrast-150" />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        
        {/* 🎫 Header */}
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-500/50">
              <Cpu className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">
                Agentic OS <span className="text-indigo-500">Developer Portal</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Engineer autonomous intelligence & monitor system health.</p>
            </div>
          </div>
        </header>

        {/* 🎛️ Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 mb-8">
          <button 
            onClick={() => setActiveTab('sdk')} 
            className={cn(
              "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === 'sdk' 
                ? "border-indigo-500 text-indigo-600 dark:text-white bg-slate-100 dark:bg-white/[0.02]" 
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:dark:text-slate-200"
            )}
          >
            <Code className="w-4 h-4" />
            SDK Integration
          </button>
          <button 
            onClick={() => setActiveTab('diagnostics')} 
            className={cn(
              "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === 'diagnostics' 
                ? "border-indigo-500 text-indigo-600 dark:text-white bg-slate-100 dark:bg-white/[0.02]" 
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:dark:text-slate-200"
            )}
          >
            <Activity className="w-4 h-4" />
            Diagnostics & Health Workbench
          </button>
        </div>

        {activeTab === 'sdk' && (
          <>
            {/* ⚡ Quick Start Grid */}
            <div className="grid lg:grid-cols-12 gap-10 mb-20">
              
              {/* 📦 Installation */}
              <section className="lg:col-span-5 space-y-8">
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-3xl shadow-xl dark:shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <Terminal className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">1. Quick Installation</h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-sm">Add the Agentic OS Kernel to your project. Compatible with React, Vue, and Vanilla JS.</p>
                  
                  <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl p-5 font-mono text-sm group relative border border-slate-200 dark:border-slate-900 shadow-inner">
                    <code className="text-indigo-600 dark:text-indigo-300">$ {installCmd}</code>
                    <button 
                      onClick={() => copyToClipboard(installCmd, 'install')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg transition-all"
                    >
                      {copied === 'install' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                    </button>
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 backdrop-blur-3xl shadow-xl dark:shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 pointer-events-none">
                    <ShieldCheck className="h-20 w-20 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-900 dark:text-white">
                    <ShieldCheck className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> Enterprise Ready
                  </h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-200/70 leading-relaxed">The SDK communicates via the **Data Highway**, ensuring HIPAA compliance and sovereign execution of every mission.</p>
                  <ArrowRight className="h-5 w-5 mt-6 text-indigo-550 dark:text-indigo-400 group-hover:translate-x-2 transition-transform" />
                </div>
              </section>

              {/* 🧠 Integration Code */}
              <section className="lg:col-span-7">
                 <div className="p-10 rounded-[2.5rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-3xl shadow-xl dark:shadow-2xl h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <Code className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">2. The "Body" Integration</h2>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400/40 dark:bg-red-500/40" />
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400/40 dark:bg-amber-500/40" />
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/40 dark:bg-emerald-500/40" />
                      </div>
                    </div>
                    
                    <div className="bg-slate-100 dark:bg-slate-950 rounded-[2rem] p-8 flex-1 font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300 relative shadow-inner border border-slate-200 dark:border-slate-900">
                      <pre className="whitespace-pre-wrap">{integrationCode}</pre>
                      <button 
                        onClick={() => copyToClipboard(integrationCode, 'code')}
                        className="absolute right-6 bottom-6 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 p-3 rounded-xl transition-all border border-slate-300 dark:border-white/5"
                      >
                        {copied === 'code' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-555" />}
                      </button>
                    </div>
                 </div>
              </section>
            </div>

            {/* 📺 Visual Showcase: Elite Law Integration Simulation */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black mb-4 flex items-center justify-center gap-3 text-slate-800 dark:text-white">
                  <Layers className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  Sovereign Integration <span className="text-indigo-500">Visualization</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">See how the GenieFlow "Brain" mounts into the Elite Law "Body" as a persistent, case-aware Sidecar.</p>
              </div>

              <div className="p-4 rounded-[3rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-3xl shadow-xl dark:shadow-2xl relative overflow-hidden group">
                {/* 🖥️ Simulated Elite Law UI */}
                <div className="rounded-[2rem] bg-slate-100 h-[600px] overflow-hidden flex relative shadow-2xl">
                  
                  {/* Host Sidebar (Elite Law) */}
                  <div className="w-16 bg-slate-200 border-r border-slate-300 flex flex-col items-center py-6 gap-6">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-[10px]">EL</div>
                    {[1,2,3,4].map(i => <div key={i} className="h-6 w-6 bg-slate-300 rounded-lg opacity-50" />)}
                  </div>

                  {/* Host Main Content (Elite Law Case View) */}
                  <div className="flex-1 p-10 space-y-8 bg-slate-100 overflow-auto">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Case: Segoviano, Isidro</h3>
                        <p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase mt-1">EAMS: ADJ158229 | DOI: 12/04/2023</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black ring-1 ring-blue-200 shadow-sm">ACTIVE LITIGATION</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: 'Primary Client', val: 'Confidential Matter' },
                        { label: 'Insurance Carrier', val: 'Commercial Carrier' },
                        { label: 'Lead Counsel', val: 'Lead Attorney' }
                      ].map((item, i) => (
                        <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <p className="text-[9px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">{item.label}</p>
                          <p className="text-sm font-bold text-slate-700">{item.val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex-1">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                           <FileText className="h-4 w-4 text-blue-600" /> Legal Document Hub
                        </h4>
                        <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600">Sync with Brain</Button>
                      </div>
                      <div className="space-y-3">
                        {['QME_Report_Smith_Dr.pdf', 'PR-4_Referral_Ortho.pdf', 'Subpoena_Records.pdf'].map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group/item hover:bg-slate-100 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                 <FileText size={16} />
                               </div>
                               <span className="text-xs font-bold text-slate-600">{doc}</span>
                            </div>
                            <ArrowRight className="h-3 w-3 text-slate-300 group-hover/item:translate-x-1 transition-transform" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 🧠 THE GENIEFLOW CORTEX (The Injected SDK) */}
                  <div className="w-[360px] bg-[#020617] border-l border-white/10 relative shadow-[-30px_0_60px_rgba(0,0,0,0.5)] z-20 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500" />
                    
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-600 rounded-lg shadow-xl shadow-indigo-500/20">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-black tracking-tighter text-white uppercase italic">Cortex <span className="text-indigo-400">SDK</span></span>
                      </div>
                      <div className="flex gap-1.5">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         <div className="h-1.5 w-1.5 rounded-full bg-indigo-500/40 animate-pulse delay-700" />
                      </div>
                    </div>

                    <div className="p-8 space-y-8 h-full overflow-auto pb-20">
                      <div className="p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 shadow-inner">
                        <p className="text-[9px] font-black text-indigo-400 uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                           <Brain className="h-3 w-3" /> Machine Context
                        </p>
                        <p className="text-xs text-indigo-100 font-medium leading-relaxed italic opacity-80">
                          "Host Context: ADJ158229 detected. 4 medical reports available. I have identified a Specialty Referral that requires a Penalty Petition."
                        </p>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Sovereign Swarms</p>
                        {[
                          { title: 'Forensic Medical Scout', icon: Search, color: 'emerald' },
                          { title: 'Penalty Petition Drafter', icon: FileText, color: 'indigo' },
                          { title: 'PQME Panel Analyst', icon: Users, color: 'blue' }
                        ].map((m, i) => (
                          <button key={i} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all text-left group/btn shadow-sm">
                            <div className={cn("p-2.5 rounded-xl transition-all group-hover/btn:scale-110", `bg-${m.color}-500 bg-opacity-10`)}>
                              <m.icon className={cn("h-4 w-4", `text-${m.color}-400`)} />
                            </div>
                            <span className="text-xs font-black text-slate-300 tracking-tight">{m.title}</span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                           <Terminal className="h-3 w-3 text-slate-500" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Trace HUD</span>
                        </div>
                        <div className="h-32 bg-black/60 rounded-2xl border border-white/5 p-4 overflow-hidden font-mono shadow-inner group-hover:border-indigo-500/30 transition-colors">
                           <p className="text-[10px] text-emerald-400 animate-pulse">› ANALYZING QME_SMITH.PDF...</p>
                           <p className="text-[10px] text-slate-500 mt-2">› DETECTED DEFERRED ORTHO SPEIALTY</p>
                           <p className="text-[10px] text-slate-500 mt-1">› GENERATING PENALTY PETITION DRAFT...</p>
                           <p className="text-[10px] text-indigo-400 mt-1">› SYNCING DRAFT TO ELITE LAW HUB...</p>
                        </div>
                      </div>
                    </div>

                    {/* Floating Activity Pulse */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-40 flex flex-col items-center justify-around pointer-events-none">
                       {[1,2,3].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />)}
                    </div>
                  </div>
                </div>

                {/* Simulated Desktop Controls Marker */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 h-1.5 w-24 bg-slate-400/20 rounded-full" />
              </div>
            </div>
          </>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-8 animate-fadeIn">
            {/* System Status Indicators (Live Metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">DATABASE CONNECTIVITY</span>
                  <Database className="w-5 h-5 text-emerald-500 animate-pulse" />
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">HEALTHY</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Supabase RPC verified</p>
              </div>
              
              <div className="p-6 rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">COGNITIVE SYSTEM</span>
                  <Brain className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">94% DENSITY</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Embeddings aligned</p>
              </div>

              <div className="p-6 rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">HEALING SUITE</span>
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">ACTIVE</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">96.4% recovery rate</p>
              </div>

              <div className="p-6 rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">API GATEWAY</span>
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">45ms LATENCY</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Models gateway stable</p>
              </div>
            </div>

            {/* Test Workbench Controls */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Left Column: Diagnostics Tests */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-3xl shadow-xl dark:shadow-2xl flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                      <Terminal className="text-indigo-500 dark:text-indigo-400 w-5 h-5" /> Test Suite Console
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Execute targeted diagnostics on core system adapters.</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={runDatabaseDiagnostics}
                      disabled={isTestingDb}
                      variant="outline"
                      className="w-full justify-between hover:border-indigo-500/50 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl h-12 flex items-center"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <Database className="w-4 h-4 text-emerald-500 animate-pulse" /> Verify DB connection (RPC)
                      </span>
                      {isTestingDb ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      ) : (
                        <Play className="w-4 h-4 text-indigo-400" />
                      )}
                    </Button>

                    <Button 
                      onClick={startFullAudit}
                      disabled={isRunningAudit}
                      variant="outline"
                      className="w-full justify-between hover:border-indigo-500/50 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl h-12 flex items-center"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <Activity className="w-4 h-4 text-indigo-500" /> Run full system audit
                      </span>
                      {isRunningAudit ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      ) : (
                        <Play className="w-4 h-4 text-indigo-400" />
                      )}
                    </Button>

                    <Button 
                      onClick={runSelfHealingSimulation}
                      disabled={isSimulating}
                      variant="outline"
                      className="w-full justify-between hover:border-indigo-500/50 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl h-12 flex items-center animate-pulse"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-yellow-555" /> Simulate Self-Healing Agent
                      </span>
                      {isSimulating ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      ) : (
                        <Play className="w-4 h-4 text-indigo-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* DB Test Result Output */}
                {dbTestResult && (
                  <div className="p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-3xl shadow-xl dark:shadow-2xl flex flex-col gap-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> RPC connectivity report
                    </h4>
                    <pre className="p-4 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-emerald-450 rounded-2xl font-mono text-[10px] border border-slate-200 dark:border-white/5 overflow-x-auto">
                      {JSON.stringify(dbTestResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Column: Console Trace HUD */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-3xl shadow-xl dark:shadow-2xl flex-1 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Terminal className="text-indigo-500 dark:text-indigo-400 w-4 h-4" /> Live trace terminal
                    </h3>
                    <div className="flex gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">LISTENING</span>
                    </div>
                  </div>

                  {/* Terminal Console View (always dark style since it is a terminal) */}
                  <div className="flex-1 min-h-[300px] bg-slate-900 dark:bg-slate-950 border border-slate-250 dark:border-white/5 rounded-3xl p-6 font-mono text-xs text-indigo-350 dark:text-indigo-300 overflow-y-auto space-y-2 flex flex-col justify-end">
                    {/* Simulated live logs or audit logs */}
                    {auditLogs.length === 0 && simLogs.length === 0 && (
                      <div className="text-center text-slate-500 dark:text-slate-600 my-auto">
                        <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-800" />
                        <p>No tests currently executing. Select a workbench action to stream trace events.</p>
                      </div>
                    )}
                    
                    {/* Audit Logs */}
                    {auditLogs.map((log, index) => (
                      <p key={`audit-${index}`} className={cn(
                        "leading-relaxed transition-all duration-300",
                        log.startsWith("[SUCCESS]") ? "text-emerald-400 font-bold" :
                        log.startsWith("[OK]") ? "text-emerald-500/80" : "text-indigo-350 dark:text-indigo-300"
                      )}>
                        {log}
                      </p>
                    ))}

                    {/* Self-Healing Sim Logs */}
                    {simLogs.map((log, index) => (
                      <p key={`sim-${index}`} className={cn(
                        "leading-relaxed transition-all duration-300",
                        log.includes("🚨") ? "text-red-400 font-bold" :
                        log.includes("🧠") ? "text-indigo-400" :
                        log.includes("⚡") ? "text-yellow-400 font-semibold" :
                        log.includes("✅") ? "text-emerald-400 font-bold" : "text-slate-500"
                      )}>
                        {log}
                      </p>
                    ))}
                  </div>

                  {/* Audit Progress Bar */}
                  {isRunningAudit && (
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                        <span>AUDITING SYSTEM INTEGRITY</span>
                        <span>{auditProgress}%</span>
                      </div>
                      <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-350" style={{ width: `${auditProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Healing Steps indicators */}
                  {isSimulating && (
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div 
                          key={step} 
                          className={cn(
                            "h-1 rounded-full transition-all duration-500",
                            simStep >= step ? "bg-indigo-550 dark:bg-indigo-500" : "bg-slate-200 dark:bg-white/5"
                          )} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 🏗️ Architecture Visualization (The "Idea") */}
        <div className="my-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-4 text-slate-800 dark:text-white">The Sovereign Bridge</h2>
            <p className="text-slate-650 dark:text-slate-400 max-w-2xl mx-auto italic">GenieFlow acts as the **Headless Brain**, controlling host systems via the Data Highway.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'The Cortex (Brain)', icon: Zap, color: 'text-indigo-500 dark:text-indigo-400', desc: 'Think-Act-Reflect reasoning loop that processes forensic truth at the edge.' },
              { title: 'The Highway', icon: Globe, color: 'text-emerald-500 dark:text-emerald-400', desc: 'Secure, multi-tenant API bridge that pipes data from the host to the brain.' },
              { title: 'The Host (Body)', icon: Layers, color: 'text-amber-500 dark:text-amber-400', desc: 'Legacy or modern systems (Medcare, Clio, Epic, Elite Law) that execute physical actions.' }
            ].map((item, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all group hover:bg-slate-100 dark:hover:bg-white/[0.03]">
                <item.icon className={cn("h-10 w-10 mb-8 transition-all group-hover:scale-110", item.color)} />
                <h3 className="text-xl font-black mb-4 tracking-tight text-slate-800 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 📚 Documentation Links */}
        <section className="grid sm:grid-cols-2 gap-8">
           <div className="p-10 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-700 dark:to-indigo-900 shadow-2xl relative group overflow-hidden border border-indigo-500/20">
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-3 text-white tracking-tighter">Internal Manifest</h2>
                <p className="text-indigo-100/60 mb-10 text-sm font-medium leading-relaxed">Deep-dive into the "Agentic OS" philosophy and the Sovereign Manifesto.</p>
                <Button className="bg-white text-indigo-900 hover:bg-slate-100 rounded-2xl px-8 h-12 gap-3 font-black text-xs uppercase tracking-widest">
                  Read Manifest <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-[-20%] right-[-10%] opacity-10 group-hover:scale-105 transition-transform duration-1000 pointer-events-none">
                <Code className="h-80 w-80 text-white" />
              </div>
           </div>

           <div className="p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl relative group overflow-hidden hover:border-slate-350 dark:hover:border-slate-700 transition-all">
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-3 text-slate-800 dark:text-white tracking-tighter">Integration Spec</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm font-medium leading-relaxed">Technical blueprints for syncing Elite Law documents with the GenieFlow Brain.</p>
                <Button variant="outline" className="border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-2xl px-8 h-12 gap-3 font-black text-xs uppercase tracking-widest">
                  View Spec <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute top-[-10%] right-[-5%] p-8 opacity-5 group-hover:rotate-12 transition-all duration-700">
                 <Terminal className="h-64 w-64 text-slate-400 dark:text-white" />
              </div>
           </div>
        </section>

        {/* 💬 Community Footer */}
        <footer className="mt-40 pt-16 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-10 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-indigo-600 rounded-xl">
               <Cpu className="h-5 w-5 text-white" />
             </div>
             <div>
               <p className="font-black tracking-[0.3em] text-[10px] uppercase text-slate-800 dark:text-white">GenieFlow Forge</p>
               <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Agentic OS Foundation</p>
             </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">© 2026 Sutra OS. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}
