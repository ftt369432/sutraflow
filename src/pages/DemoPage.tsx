import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Zap,
  Brain,
  ArrowRight,
  Play,
  CheckCircle2,
  Shield,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { UniversalMultiCanvasDemo } from '../components/demo/UniversalMultiCanvasDemo';
import { WorkflowSystemDemo } from '../components/demo/WorkflowSystemDemo';
import { VectorSearchDemo } from '../components/demo/VectorSearchDemo';

export default function DemoPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<'canvas' | 'workflow' | 'vector'>('canvas');

  const steps = [
    {
      id: 'canvas',
      title: 'Universal Multi-Canvas',
      subtitle: 'Industry-specific cross-functional workspaces',
      icon: Layers,
      color: 'text-blue-500',
    },
    {
      id: 'workflow',
      title: 'Autonomous Workflows',
      subtitle: 'Calendar, email, and task orchestration',
      icon: Zap,
      color: 'text-purple-500',
    },
    {
      id: 'vector',
      title: 'Neural Vector Search',
      subtitle: 'Hybrid semantic retrieval & knowledge graph',
      icon: Brain,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30">
      {/* Header Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                GenieFlow Interactive Sandbox
              </h1>
              <p className="text-xs text-slate-400">
                Experience enterprise autonomous agency and multi-canvas workflows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/pricing')}
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              View Pricing
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/login?register=true')}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
            >
              Start Free Trial <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Stepper Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id as any)}
                  className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                    isActive
                      ? 'bg-slate-800/80 border-blue-500/50 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/30 border-slate-800 hover:bg-slate-850/50 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isActive ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-200 truncate">
                        {step.title}
                      </span>
                      {isActive && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                          Active Demo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{step.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {activeStep === 'canvas' && (
          <div className="space-y-6">
            <Card className="bg-slate-900/60 border-slate-800 text-slate-200">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Layers className="h-5 w-5 text-blue-400" />
                  Universal Multi-Canvas Orchestrator
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Switch between Legal, Medical, Finance, and Engineering profiles. GenieFlow dynamically
                  structures sub-canvases, tools, and vector context accordingly.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <UniversalMultiCanvasDemo />
              </CardContent>
            </Card>
          </div>
        )}

        {activeStep === 'workflow' && (
          <div className="space-y-6">
            <Card className="bg-slate-900/60 border-slate-800 text-slate-200">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Zap className="h-5 w-5 text-purple-400" />
                  Autonomous Email & Calendar Workflow System
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Observe automatic parsing of hearing notices, deposition transcripts, and deadline
                  scheduling with duplicate detection and reminder workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <WorkflowSystemDemo />
              </CardContent>
            </Card>
          </div>
        )}

        {activeStep === 'vector' && (
          <div className="space-y-6">
            <Card className="bg-slate-900/60 border-slate-800 text-slate-200">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Brain className="h-5 w-5 text-emerald-400" />
                  Neural Vector Search & Knowledge Discovery
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Execute natural-language semantic searches over multi-modal exhibits, statutory authorities,
                  and client case archives.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <VectorSearchDemo />
              </CardContent>
            </Card>
          </div>
        )}

        {/* CTA Footer Bar */}
        <div className="mt-12 p-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Shield className="h-5 w-5 text-blue-400" /> Ready to deploy autonomous workflows?
            </h3>
            <p className="text-sm text-slate-400">
              Get started with 10 free agent runs and instant cloud deployment.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/login?register=true')}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
            >
              Create Free Account <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}