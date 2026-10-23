import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Scale, Building, Zap, FileText, 
  CheckCircle2, Shield, BrainCircuit, Globe, LineChart, Network,
  Database
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';

interface AgentConfig {
  id: string;
  name: string;
  themeColor: string;
  bgGradient: string;
  icon: React.ReactNode;
  hero: {
    title: string;
    subtitle: string;
    description: string;
  };
  features: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  capabilities: string[];
  externalUrl?: string;
}

const agentConfigs: Record<string, AgentConfig> = {
  legal: {
    id: 'legal',
    name: 'Elite Law',
    themeColor: 'emerald',
    bgGradient: 'from-emerald-900/20 to-emerald-900/5',
    icon: <Scale className="h-16 w-16 text-emerald-500" />,
    hero: {
      title: 'Autonomous Legal Orchestrator',
      subtitle: 'Premium Workers\' Comp & Litigation Intelligence',
      description: 'The industry-standard agentic OS for legal professionals. Deploy surgical document sanitization, automated case briefing, and deeply researched legal strategies at warp speed.'
    },
    features: [
      {
        title: 'Surgical Fact Extraction',
        description: 'Instant analysis of massive medical dumps and legal fact patterns.',
        icon: <BrainCircuit className="h-6 w-6 text-emerald-500" />
      },
      {
        title: 'Elite Redaction',
        description: '100% HIPAA and court compliant redactions with zero manual overhead.',
        icon: <Shield className="h-6 w-6 text-emerald-500" />
      },
      {
        title: 'Deposition God-Mode',
        description: 'Auto-generate critical Q&A based on thousands of pages of opponent filings.',
        icon: <FileText className="h-6 w-6 text-emerald-500" />
      }
    ],
    capabilities: [
      'Automated Pleading Drafts',
      'Medical Record Chronologies',
      'Rules of Court Cross-Referencing',
      'Opposing Counsel Sentiment'
    ],
    externalUrl: 'https://medcare-system.netlify.app' // User mentioned it has its own netlify
  },
  trading: {
    id: 'trading',
    name: 'Wolf of Wall Street',
    themeColor: 'blue',
    bgGradient: 'from-blue-900/20 to-blue-900/5',
    icon: <Zap className="h-16 w-16 text-blue-500" />,
    hero: {
      title: 'Market Dominance Engine',
      subtitle: 'Sovereign Trading & Quantitative Intelligence',
      description: 'Execute split-second market analysis and risk management. discover alpha with sovereign polygon-fetcher and real-time sentiment analysis.'
    },
    features: [
      {
        title: 'Alpha Discovery',
        description: 'Real-time quantitative modeling and trend detection.',
        icon: <LineChart className="h-6 w-6 text-blue-500" />
      },
      {
        title: 'Risk Analysis',
        description: 'Dynamic portfolio stress testing against global macro events.',
        icon: <Shield className="h-6 w-6 text-blue-500" />
      },
      {
          title: 'Polygon God-Mode',
          description: 'Direct cloud intelligence feed for market data.',
          icon: <Database className="h-6 w-6 text-blue-500" />
      }
    ],
    capabilities: [
      'Real-time Data Fetching',
      'Sentiment Analysis on News',
      'Autonomous Trade Sizing',
      'Regulatory Compliance Engine'
    ]
  },
  medical: {
    id: 'medical',
    name: 'Medical Specialist',
    themeColor: 'teal',
    bgGradient: 'from-teal-900/20 to-teal-900/5',
    icon: <Building className="h-16 w-16 text-teal-500" />,
    hero: {
      title: 'Autonomous Report Intelligence',
      subtitle: 'Specialized Medical Record Parsing & Summarization',
      description: 'Transform unorganized medical dumps into structured, queryable clinical databases. Expert-grade Dx summarization and anomaly detection.'
    },
    features: [
      {
        title: 'Dx Summarization',
        description: 'Extract and summarize diagnosis codes and clinical findings.',
        icon: <CheckCircle2 className="h-6 w-6 text-teal-500" />
      },
      {
        title: 'Record Chronology',
        description: 'Automatically link names, dates, and findings across thousands of pages.',
        icon: <Network className="h-6 w-6 text-teal-500" />
      },
      {
        title: 'Compliance Guard',
        description: 'Continuous monitoring of medical data handling and privacy.',
        icon: <Shield className="h-6 w-6 text-teal-500" />
      }
    ],
    capabilities: [
      'Handwriting OCR Nexus',
      'Entity Linking (Medical)',
      'Bulk Record Sanitization',
      'Anomaly Detection'
    ]
  },
  research: {
    id: 'research',
    name: 'Research Specialist',
    themeColor: 'cyan',
    bgGradient: 'from-cyan-900/20 to-blue-900/5',
    icon: <BrainCircuit className="h-16 w-16 text-cyan-500" />,
    hero: {
      title: 'Sovereign Knowledge Engine',
      subtitle: 'Real-time Web Intelligence & Data Synthesis',
      description: 'Acquire and synthesize deep knowledge instantly. Custom web search and cross-platform orchestration for comprehensive research briefs.'
    },
    features: [
      {
        title: 'Autonomous Search',
        description: 'Deep web probing for niche and real-time data acquisition.',
        icon: <Globe className="h-6 w-6 text-cyan-500" />
      },
      {
        title: 'Data Synthesis',
        description: 'Convert scattered information into structured research briefs.',
        icon: <FileText className="h-6 w-6 text-cyan-500" />
      },
      {
        title: 'Knowledge Nexus',
        description: 'Link external research with your private sovereign context.',
        icon: <Network className="h-6 w-6 text-cyan-500" />
      }
    ],
    capabilities: [
        'Real-time News Discovery',
        'Academic Data Extraction',
        'Competitive Intelligence',
        'Multi-stage Orchestration'
    ]
  },
  docufy: {
    id: 'docufy',
    name: 'Docufy',
    themeColor: 'blue',
    bgGradient: 'from-blue-900/20 to-slate-900/5',
    icon: <FileText className="h-16 w-16 text-blue-500" />,
    hero: {
      title: 'Autonomous Document Intelligence',
      subtitle: '100% AI Processed Extraction',
      description: 'Transform unorganized massive PDF dumps into structured, queryable databases. The ultimate legal and medical document processor.'
    },
    features: [
      {
        title: 'OCR Nexus',
        description: 'Flawless extraction from handwritten notes and low-res scans.',
        icon: <CheckCircle2 className="h-6 w-6 text-blue-500" />
      },
      {
        title: 'Contextual Vectoring',
        description: 'Documents are instantly embedded into your private knowledge base.',
        icon: <BrainCircuit className="h-6 w-6 text-blue-500" />
      },
      {
        title: 'Entity Resolution',
        description: 'Automatically link names, dates, and companies across thousands of pages.',
        icon: <Network className="h-6 w-6 text-blue-500" />
      }
    ],
    capabilities: [
      'Bates Stamping & Pagination',
      'Anomaly Detection in Contracts',
      'Bulk Medical Record Chronologies',
      'Automated Table Extraction'
    ]
  }
};

export function AgentLandingPage() {
  const { agentId } = useParams<{ agentId: string }>();
  
  // If agent doesn't exist, redirect to home
  if (!agentId || !agentConfigs[agentId]) {
    return <Navigate to="/" replace />;
  }

  const config = agentConfigs[agentId];

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-hidden relative">
      <SEO 
        title={`${config.name} | GenieFlow AI`}
        description={config.hero.description}
      />
      
      {/* Background Gradients */}
      <div className={cn("absolute inset-0 bg-gradient-to-br -z-10", config.bgGradient)} />
      <div className={cn(
        "absolute top-0 right-0 w-[800px] h-[800px] blur-[150px] opacity-20 -z-10 rounded-full mix-blend-screen",
        config.themeColor === 'emerald' ? 'bg-emerald-600' :
        config.themeColor === 'teal' ? 'bg-teal-600' :
        config.themeColor === 'orange' ? 'bg-orange-600' :
        config.themeColor === 'cyan' ? 'bg-cyan-600' :
        'bg-blue-600'
      )} />

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className={cn(
              "p-6 rounded-3xl bg-white/5 border backdrop-blur-xl shadow-2xl",
              config.themeColor === 'emerald' ? 'border-emerald-500/20 shadow-emerald-500/10' :
              config.themeColor === 'teal' ? 'border-teal-500/20 shadow-teal-500/10' :
              config.themeColor === 'orange' ? 'border-orange-500/20 shadow-orange-500/10' :
              config.themeColor === 'cyan' ? 'border-cyan-500/20 shadow-cyan-500/10' :
              'border-blue-500/20 shadow-blue-500/10'
            )}>
              {config.icon}
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tight"
          >
            {config.name}
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn(
              "text-2xl md:text-3xl font-medium mb-8 bg-clip-text text-transparent",
              config.themeColor === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-200' :
              config.themeColor === 'teal' ? 'bg-gradient-to-r from-teal-400 to-teal-200' :
              config.themeColor === 'orange' ? 'bg-gradient-to-r from-orange-400 to-orange-200' :
              config.themeColor === 'cyan' ? 'bg-gradient-to-r from-cyan-400 to-blue-200' :
              'bg-gradient-to-r from-blue-400 to-cyan-200'
            )}
          >
            {config.hero.title}
            <br />
            <span className="text-gray-400 text-xl md:text-2xl">{config.hero.subtitle}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            {config.hero.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            {config.externalUrl ? (
              <a href={config.externalUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className={cn(
                  "h-16 px-10 text-xl text-white rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95",
                  config.themeColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' :
                  config.themeColor === 'teal' ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20' :
                  config.themeColor === 'orange' ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20' :
                  config.themeColor === 'cyan' ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20' :
                  'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                )}>
                  Launch {config.name}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            ) : (
              <Link to="/login?origin=launch">
                <Button size="lg" className={cn(
                  "h-16 px-10 text-xl text-white rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95",
                  config.themeColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' :
                  config.themeColor === 'teal' ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20' :
                  config.themeColor === 'orange' ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20' :
                  config.themeColor === 'cyan' ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20' :
                  'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                )}>
                  Enter {config.name}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            )}
            <Link to="/">
              <Button size="lg" variant="outline" className="h-16 px-10 text-xl border-white/10 hover:bg-white/5 text-white rounded-2xl backdrop-blur-sm">
                Back to Network
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20 border-t border-white/5">
        <div className="grid md:grid-cols-3 gap-8">
          {config.features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/5"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                config.themeColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                config.themeColor === 'teal' ? 'bg-teal-500/10 text-teal-500' :
                config.themeColor === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                config.themeColor === 'cyan' ? 'bg-cyan-500/10 text-cyan-500' :
                'bg-blue-500/10 text-blue-500'
              )}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Capabilities List */}
      <div className="container mx-auto px-4 pb-32">
        <div className="p-12 rounded-[40px] bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-2xl">
          <h3 className="text-2xl font-bold mb-8 text-center">Orchestrator Capabilities</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.capabilities.map((cap, i) => (
              <div key={i} className="flex items-start">
                <CheckCircle2 className={cn(
                  "h-6 w-6 mr-3 shrink-0", 
                  config.themeColor === 'emerald' ? 'text-emerald-500' :
                  config.themeColor === 'teal' ? 'text-teal-500' :
                  config.themeColor === 'orange' ? 'text-orange-500' :
                  config.themeColor === 'cyan' ? 'text-cyan-500' :
                  'text-blue-500'
                )} />
                <span className="text-gray-300">{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
