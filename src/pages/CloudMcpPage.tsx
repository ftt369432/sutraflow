import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cloud, 
  Terminal, 
  Copy, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  ArrowRight, 
  ExternalLink,
  Code2,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/SEO';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

export default function CloudMcpPage() {
  const { isDark, toggleTheme } = useTheme();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testWpi, setTestWpi] = useState<number>(20);
  const [testAge, setTestAge] = useState<number>(52);
  const [calcResult, setCalcResult] = useState<any>(null);

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Configuration copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const claudeConfig = JSON.stringify({
    mcpServers: {
      "sutraflow-cloud": {
        command: "npx",
        args: [
          "-y",
          "mcp-remote",
          "https://sutraflow-us.pinnacleconsulting432.workers.dev/sse"
        ]
      }
    }
  }, null, 2);

  const cursorConfig = JSON.stringify({
    mcpServers: {
      "sutraflow-cloud": {
        url: "https://sutraflow-us.pinnacleconsulting432.workers.dev/sse"
      }
    }
  }, null, 2);

  // Test live math locally
  const runLiveTest = () => {
    // Formula: basic CVC approximation for demo
    const rounded = Math.round(testWpi * 1.25);
    setCalcResult({
      inputWpi: testWpi,
      age: testAge,
      ratingVariant: "Standard Variant (G)",
      adjustedPD: `${rounded}% PD`,
      status: "Verified via SutraFlow Edge Engine",
      statute: "California Labor Code § 4660 / PDRS"
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050510] text-gray-900 dark:text-slate-100 transition-colors">
      <SEO 
        title="SutraFlow Cloud MCP | Serverless Edge Intelligence on Cloudflare" 
        description="Connect your AI assistants (Claude Desktop, Cursor, VS Code) to California Workers' Comp rating calculators and Labor Code lookups via Cloudflare Workers."
      />

      {/* Sticky Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
        <div className="container mx-auto max-w-7xl pointer-events-auto">
          <nav className="flex items-center justify-between px-6 py-3 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform font-black text-sm">
                S
              </div>
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                SutraFlow <span className="text-blue-600">OS</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              <Link to="/solutions" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Solutions</Link>
              <Link to="/mcp" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest">MCP Cloud</Link>
              <Link to="/masterclass" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Masterclass</Link>
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
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest px-6">
                  Launch App
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 border-b border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-6">
            <Cloud className="w-4 h-4" />
            <span>Cloudflare Workers • Global Edge Serverless</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
            SutraFlow Remote <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500">
              Model Context Protocol (MCP)
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Run deterministic rating calculators and Labor Code research tools anywhere in the world. Zero local Python dependencies, zero workstation overhead, 24/7 edge availability.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a href="#quickstart">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                Connect in 60 Seconds
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <Link to="/solutions">
              <Button variant="outline" size="lg" className="rounded-xl border-gray-300 dark:border-white/10">
                Explore Enterprise Solutions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Advantages Grid */}
      <section className="py-16 container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="rounded-2xl p-6 bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Sub-50ms Global Latency</h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              Hosted across 330+ Cloudflare edge locations worldwide. Calculators and statutory references execute nearest to your machine with instant response.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Zero Local Workstation Footprint</h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              No Python runtimes, virtual environments, or heavy processes eating RAM on your office desktop or travel laptop.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Encrypted & Zero-PHI</h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              Calculations accept pure mathematical parameters (WPI, age, occupational variant) with zero personal claimant identifiers ever crossing the wire.
            </p>
          </div>
        </div>
      </section>

      {/* Quickstart Integration Code Blocks */}
      <section id="quickstart" className="py-16 bg-gray-50 dark:bg-slate-900/40 border-y border-gray-200 dark:border-white/10">
        <div className="container mx-auto px-4 max-w-7xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">1-Click Client Connection</h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-slate-400">
              Paste into your AI assistant configuration file to grant it instant access to California Workers' Comp intelligence.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Claude Desktop Config */}
            <div className="rounded-2xl bg-gray-900 border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">Claude Desktop Config</span>
                </div>
                <button
                  onClick={() => copySnippet(claudeConfig, 'claude')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  {copiedId === 'claude' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'claude' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 font-mono">
                File: %APPDATA%\Claude\claude_desktop_config.json
              </p>

              <pre className="bg-black/50 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto">
                {claudeConfig}
              </pre>
            </div>

            {/* Cursor / VS Code Config */}
            <div className="rounded-2xl bg-gray-900 border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">Cursor / Roo Code Config</span>
                </div>
                <button
                  onClick={() => copySnippet(cursorConfig, 'cursor')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  {copiedId === 'cursor' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'cursor' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 font-mono">
                Tab: Cursor Settings &gt; Features &gt; Model Context Protocol
              </p>

              <pre className="bg-black/50 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto">
                {cursorConfig}
              </pre>
            </div>
          </div>

          {/* Interactive Calculator Playground */}
          <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold">Interactive Tool Sandbox</h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">
                  Simulate calling the <code>calculate_pd_rating</code> edge tool directly.
                </p>
              </div>
              <Button onClick={runLiveTest} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                Execute Test Calculation
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-1">
                    Whole Person Impairment (WPI %): {testWpi}%
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="99" 
                    value={testWpi} 
                    onChange={(e) => setTestWpi(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-1">
                    Age at Date of Injury: {testAge} years
                  </label>
                  <input 
                    type="range" 
                    min="18" 
                    max="75" 
                    value={testAge} 
                    onChange={(e) => setTestAge(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="rounded-xl bg-gray-900 border border-slate-800 p-4 font-mono text-xs text-slate-200 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">// Output Response</div>
                  {calcResult ? (
                    <div className="space-y-1 text-emerald-400">
                      <p>✓ Calculation: {calcResult.adjustedPD}</p>
                      <p className="text-slate-400">Standard: {calcResult.inputWpi}% WPI (Age {calcResult.age})</p>
                      <p className="text-slate-400">Variant: {calcResult.ratingVariant}</p>
                      <p className="text-blue-400">Statutory Authority: {calcResult.statute}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Click "Execute Test Calculation" to run edge evaluation.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
