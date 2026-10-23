import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Star, Check, Scale, Bot,
  Sparkles, Building, Database, Zap, FileText, LayoutGrid,
  BrainCircuit, Menu, X, Rocket, Sun, Moon, DollarSign, Download
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { SalesFunnelWizard } from '../components/marketing/SalesFunnelWizard';
import { MasterclassSalesFunnel } from '../components/marketing/MasterclassSalesFunnel';

// Core Agent Pillars - From User Snapshots
const agents = [
  {
    name: 'Elite Law',
    subTitle: 'LEGAL',
    description: 'Autonomous Legal Orchestration & Litigation Intelligence. Surgical redactions and case briefing at warp speed.',
    icon: <Scale className="h-6 w-6" />,
    color: 'emerald',
    link: '/agents/legal',
  },
  {
    name: 'Wolf of Wall Street',
    subTitle: 'TRADING',
    description: 'Sovereign Market Intelligence & Dominance. Quantitative modeling and alpha discovery via Polygon God-Mode.',
    icon: <Zap className="h-6 w-6" />,
    color: 'blue',
    link: '/agents/trading',
  },
  {
    name: 'Medical Specialist',
    subTitle: 'HEALTH',
    description: 'Autonomous Medical Record Intelligence. Expert-grade Dx summarization and clinical anomaly detection.',
    icon: <Building className="h-6 w-6" />,
    color: 'teal',
    link: '/agents/medical',
  },
  {
    name: 'Research Specialist',
    subTitle: 'KNOWLEDGE',
    description: 'Real-time Knowledge Acquisition & Synthesis. Deep web probing and multi-stage research orchestration.',
    icon: <BrainCircuit className="h-6 w-6" />,
    color: 'cyan',
    link: '/agents/research',
  },
  {
    name: 'Docufy',
    subTitle: 'EXTRACTION',
    description: 'Autonomous Document Intelligence. 100% AI-Processed extraction for massive legal and medical dumps.',
    icon: <FileText className="h-6 w-6" />,
    color: 'sky',
    link: '/agents/docufy',
  },
];

// Core platform capabilities from snapshots
const coreCapabilities = [
  {
    name: 'Genie Drive',
    description: 'A Neural Knowledge Engine with real-time vectoring. Every document you upload becomes part of your agent\'s sovereign memory for precise reasoning.',
    icon: <Database className="h-6 w-6" />
  },
  {
    name: 'Mission Control HQ',
    description: 'Coordinate autonomous swarms. Set a goal, and watch your agents plan, research, and execute multi-stage missions with zero manual intervention.',
    icon: <Zap className="h-6 w-6" />
  },
  {
    name: 'Intelligent Canvas',
    description: 'The collaborative synthesis workspace. Where businesses share work, collaborate with autonomous agents, and edit with surgical precision.',
    icon: <FileText className="h-6 w-6" />
  },
  {
    name: 'Sovereign Skills',
    description: 'A library of "Motor Tools" for the AI Era. From browsing the live web to fetching market data, your agents possess the hands to get work done.',
    icon: <LayoutGrid className="h-6 w-6" />
  }
];

// Testimonials
const testimonials = [
  {
    quote: "SutraFlow has completely transformed how I manage my law practice. I save at least 15 hours every week on administrative tasks.",
    author: "Sarah Johnson",
    title: "Attorney at Law",
    avatar: "./images/avatar-female-1.svg"
  },
  {
    quote: "The email management features alone are worth the subscription. The AI accurately categorizes everything and the suggested responses are spot-on.",
    author: "Mark Chen",
    title: "Marketing Director",
    avatar: "./images/avatar-male-1.svg"
  },
  {
    quote: "As a healthcare professional, I need tools that are both efficient and compliant. SutraFlow delivers on both fronts with impressive accuracy.",
    author: "Dr. Priya Patel",
    title: "Family Physician",
    avatar: "./images/avatar-female-2.svg"
  }
];

// Pricing teaser with Token-Based Economy
const pricingTeaser = [
  {
    name: "Starter",
    price: "$0",
    description: "Sovereign foundation for individuals",
    features: [
      "50,000 Monthly Tokens (Gemini)",
      "Basic document hosting (1GB)",
      "Limited high-value search",
      "Standard email management",
      "Intelligent Canvas (Single Mode)"
    ],
    cta: "Get Started",
    ctaLink: "/signup",
    popular: false
  },
  {
    name: "Pro Creator",
    price: "$29",
    period: "per user/mo",
    description: "Build & List for the Collective",
    features: [
      "2,500,000 Monthly Tokens (Gemini)",
      "Creator Hub License (List & Sell)",
      "100GB Document Hosting",
      "Unlimited Web Search & Skills",
      "80/20 Creator Revenue Split",
      "Priority API access"
    ],
    cta: "Launch Creator Hub",
    ctaLink: "/signup?plan=pro",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored swarms for organizations",
    features: [
      "Custom Token Provisioning",
      "Private Model Fine-Tuning",
      "On-Premise Document Hosting",
      "Dedicated Infrastructure Port",
      "Full Marketplace Audit Rights"
    ],
    cta: "Consult Architect",
    ctaLink: "/contact",
    popular: false
  }
];
export function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-[#050510] selection:bg-blue-500/30">
      <SEO />
      
      {/* 💎 Glassy Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
        <div className="container mx-auto max-w-7xl pointer-events-auto">
          <nav className="flex items-center justify-between px-6 py-3 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform font-black text-sm">
                S
              </div>
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">SutraFlow <span className="text-blue-600">OS</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              <Link to="/solutions" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Solutions</Link>
              <Link to="/mcp" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">MCP Cloud</Link>
              <Link to="/masterclass" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest flex items-center gap-1">Masterclass</Link>
              <Link to="/solutions#air-gap" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors uppercase tracking-widest">Air-Gap Vault</Link>
              <Link to="/pricing" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Pricing</Link>
              <a href="/release/GenieFlow Agentic OS Setup 0.1.0.exe" download="GenieFlow Agentic OS Setup 0.1.0.exe" className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Desktop</a>
            </div>

            <div className="flex items-center gap-4">
              {/* 🌗 Theme Switcher */}
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-all hover:scale-110 active:scale-95"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <Link to="/login" className="hidden sm:block text-xs font-bold text-gray-600 dark:text-white hover:text-blue-400 transition-colors uppercase tracking-widest">Sign In</Link>
              <Link to="/login?register=true">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest px-6">
                  Launch App
                </Button>
              </Link>
              <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 pt-24 px-4 bg-[#050510]/95 backdrop-blur-3xl md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
                <Link to="/solutions" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-gray-900 dark:text-white py-4 border-b border-gray-100 dark:border-white/5">Solutions</Link>
                <Link to="/mcp" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-gray-900 dark:text-white py-4 border-b border-gray-100 dark:border-white/5">MCP Cloud</Link>
                <Link to="/masterclass" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-blue-500 py-4 border-b border-gray-100 dark:border-white/5">Masterclass</Link>
                <Link to="/solutions#air-gap" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-emerald-500 py-4 border-b border-gray-100 dark:border-white/5">Air-Gap Vault</Link>
                <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-gray-900 dark:text-white py-4 border-b border-gray-100 dark:border-white/5">Pricing</Link>
                <Link to="/login?register=true" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-blue-500 py-4">Launch Agentic OS</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gray-50 dark:bg-[#050510] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-[120px] rounded-full -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-center mb-8">
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase">
                    <Sparkles className="h-3 w-3 mr-2" />
                    Agentic AI Suite
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-black leading-tight mb-8 text-center text-gray-900 dark:text-white">
                  Universal Agentic <br/>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-500 dark:from-gray-400 dark:via-gray-100 dark:to-gray-500">
                    Operating System
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto text-center leading-relaxed">
                  Deploy specialized intelligence swarms to orchestrate complex enterprise workflows autonomously.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link to="/login?register=true">
                    <Button size="lg" className="h-16 px-10 text-xl bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                      Launch Agentic OS
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                  </Link>
                  <a href="/release/GenieFlow Agentic OS Setup 0.1.0.exe" download="GenieFlow Agentic OS Setup 0.1.0.exe">
                    <Button size="lg" variant="outline" className="h-16 px-10 text-xl border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white rounded-2xl backdrop-blur-sm hover:scale-105 active:scale-95 transition-all">
                      Download Desktop
                      <Download className="ml-3 h-6 w-6 text-blue-500" />
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                  <img 
                    src="./images/dashboard-preview.svg" 
                    alt="GenieFlow AI Dashboard" 
                    className="w-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = './images/dashboard-placeholder.svg';
                    }}
                  />
                </div>
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
                  Smart AI
                </div>
                <div className="absolute bottom-4 -left-4 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                  Time-saving
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery / Sales Funnel Section */}
      <section id="orchestration" className="py-20 relative overflow-hidden bg-gray-50 dark:bg-[#050510]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Find Your <span className="text-blue-500">Agentic Advantage</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our autonomous agents are specialized for high-stakes industries. Select your domain to discover your tailored OS.
            </p>
          </div>
          <SalesFunnelWizard />
        </div>
      </section>

      {/* 🎓 Live Masterclass Banner */}
      <section className="py-16 relative overflow-hidden bg-slate-900/90 border-y border-white/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-950 border border-blue-500/30 shadow-2xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
                <span>Live Every Saturday @ 10:00 AM PST</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                Mastering California WCAB Automation & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">Local Zero-PHI AI</span>
              </h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Join 150+ California workers' comp attorneys, hearing reps, and claims administrators in our interactive live workshop. Build sovereign litigation engines on your own hardware.
              </p>
            </div>
            <div className="shrink-0">
              <Link to="/masterclass">
                <Button className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 text-sm uppercase tracking-wider">
                  Reserve Workshop Pass
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Collective Intelligence Section */}
      <section className="py-24 bg-white dark:bg-[#08081a] relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase mb-8">
                Autonomous Collective
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 leading-tight">
                Agents That Don't Just Chat. <br/>
                <span className="text-blue-600 dark:text-blue-400">They Coordinate.</span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-6 group">
                  <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-500/10">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Neural Task Assignment</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Goals are automatically decomposed into sub-tasks and routed to the specialized agent best equipped for the mission.</p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-500/10">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cross-Domain Synthesis</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Medical records meet legal strategies. Market data meets risk models. The collective shares context across industry lines.</p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-500/10">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Automated Follow-Through</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Missions don't stop until the proof of work is achieved. Agents autonomously research, draft, and finalize artifacts.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
                <div className="aspect-square relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full animate-pulse" />
                    <div className="relative z-10 grid grid-cols-2 gap-8">
                        {[Bot, Scale, Zap, Database].map((Icon, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="h-32 w-32 md:h-40 md:w-40 rounded-[2.5rem] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl group hover:border-blue-500/50 transition-all"
                            >
                                <Icon className="h-10 w-10 md:h-12 md:w-12 text-gray-400 group-hover:text-blue-400 transition-colors" />
                            </motion.div>
                        ))}
                        {/* Connecting Lines */}
                        <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
                            <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Benefits Section (Bento Grid) */}
      <section id="benefits" className="py-24 bg-white dark:bg-gray-950 min-h-screen flex items-center">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black tracking-widest uppercase mb-6">
                Core Infrastructure
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight dark:text-white">Built for <span className="text-blue-600">Autonomous Speed</span></h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
              Discover how SutraFlow can transform your daily workflow with these powerful features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Featured Bento Item */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-8 group relative overflow-hidden rounded-[3rem] bg-gray-50 dark:bg-[#0a0a14] border border-gray-200 dark:border-white/5 p-12 transition-all hover:border-blue-500/30"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="h-16 w-16 rounded-3xl bg-blue-600/20 flex items-center justify-center text-blue-500 mb-8 border border-blue-500/20">
                        <Zap className="h-8 w-8" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">{coreCapabilities[1].name}</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">{coreCapabilities[1].description}</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity">
                    <Rocket className="h-64 w-64 text-blue-500" />
                </div>
            </motion.div>

            {/* Square Bento Item */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 group relative overflow-hidden rounded-[3rem] bg-gray-50 dark:bg-[#0a0a14] border border-gray-200 dark:border-white/5 p-10 transition-all hover:border-blue-500/30"
            >
                <div className="h-12 w-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
                    <Database className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{coreCapabilities[0].name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{coreCapabilities[0].description}</p>
            </motion.div>

            {/* Square Bento Item */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 group relative overflow-hidden rounded-[3rem] bg-gray-50 dark:bg-[#0a0a14] border border-gray-200 dark:border-white/5 p-10 transition-all hover:border-blue-500/30"
            >
                <div className="h-12 w-12 rounded-2xl bg-cyan-600/20 flex items-center justify-center text-cyan-500 mb-6 border border-cyan-500/20">
                    <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{coreCapabilities[2].name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{coreCapabilities[2].description}</p>
            </motion.div>

             {/* Featured Horizontal Bento Item */}
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-8 group relative overflow-hidden rounded-[3rem] bg-gray-50 dark:bg-[#0a0a14] border border-gray-200 dark:border-white/5 p-12 transition-all hover:border-blue-500/30"
            >
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{coreCapabilities[3].name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{coreCapabilities[3].description}</p>
                    </div>
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Industry Solutions Section */}
      <section id="solutions" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950 min-h-screen flex items-center">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Tailored Industry Solutions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Specialized AI modules designed for your profession's unique requirements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <Link to={agent.link} className="block h-full">
                  <div className="h-full p-8 rounded-[40px] bg-white dark:bg-[#11111a]/80 backdrop-blur-2xl border border-gray-200 dark:border-white/5 transition-all duration-500 group-hover:bg-gray-50 dark:group-hover:bg-[#1a1a2e]/90 group-hover:border-blue-500/30 group-hover:translate-y-[-8px] shadow-2xl">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-xl",
                      agent.color === 'blue' ? "bg-blue-600 shadow-blue-500/20" :
                      agent.color === 'emerald' ? "bg-emerald-600 shadow-emerald-500/20" :
                      agent.color === 'teal' ? "bg-teal-600 shadow-teal-500/20" :
                      agent.color === 'orange' ? "bg-orange-600 shadow-orange-500/20" :
                      "bg-cyan-600 shadow-cyan-500/20"
                    )}>
                      {agent.icon}
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase flex items-center">
                        {agent.subTitle}
                        <div className={cn(
                          "w-1 h-1 rounded-full ml-auto",
                          agent.color === 'blue' ? "bg-blue-500" :
                          agent.color === 'emerald' ? "bg-emerald-500" :
                          agent.color === 'teal' ? "bg-teal-500" :
                          agent.color === 'orange' ? "bg-orange-500" :
                          "bg-cyan-500"
                        )} />
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">{agent.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">What Our Users Say</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their workflow with SutraFlow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full mr-4 object-cover" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = './images/default-avatar.svg';
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.author}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section id="pricing" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your needs with our straightforward pricing options
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTeaser.map((plan, index) => (
                <motion.div
                key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                className={cn(
                  "flex flex-col p-6 rounded-xl border-2 bg-white dark:bg-gray-900 relative",
                  plan.popular ? "border-blue-500 dark:border-blue-400" : "border-gray-200 dark:border-gray-700"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>}
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to={plan.name === "Free" ? "/login?register=true" : plan.name === "Pro" ? "/login?register=true&plan=pro" : plan.ctaLink} 
                  className={cn(
                    "text-center py-2 px-4 rounded-lg font-medium",
                    plan.popular 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  )}
                >
                  {plan.cta}
                </Link>
                </motion.div>
              ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/pricing" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium">
              View all pricing details <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* The Creator Marketplace - NEW ECONOMY */}
      <section className="py-24 bg-white dark:bg-[#050510] border-t border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 relative order-2 lg:order-1">
                <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="relative z-10 p-12 rounded-[3.5rem] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-3xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-14 w-14 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/20">
                            <DollarSign className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Marketplace Economy</div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">70/30 Creator Split</div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Build Specialized Swarms</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Design agents for niche industries (Workers' Comp Law, Medical Liens, Claims Auditing) using our low-code orchestration system.</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">List on the Global Registry</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Publish your agents to the Sutra store. Every usage credit spent on your agent yields a direct 70% payout to your creator wallet.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black tracking-widest uppercase mb-6">
                    Creator Hub
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-8 leading-tight">
                    Don't Just Use.<br/>
                    <span className="text-orange-600 dark:text-orange-500">Become a Provider.</span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                    SutraFlow is a sovereign intelligence platform. We provide the infrastructure, the document hosting, and the token management—you provide the domain-specific souls.
                </p>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300 font-bold italic">Monetize your workflow expertise</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300 font-bold italic">Automatic token management for end-users</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300 font-bold italic">Participate in the Collective's 30% platform pool</span>
                    </div>
                </div>
                <div className="mt-12">
                     <Link to="/assistant-store">
                        <Button size="lg" className="bg-orange-600 hover:bg-orange-500 text-white rounded-2xl px-10 font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20">
                            Launch Creator Hub
                        </Button>
                     </Link>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-700 via-blue-600 to-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have increased their productivity with SutraFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login?register=true">
              <Button size="lg" variant="default" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 font-bold">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/solutions">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10 font-bold">
                Explore Solutions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}