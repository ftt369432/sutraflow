import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  FileText 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MasterclassSalesFunnel() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Applicant Attorney');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Persist lead registration in localStorage for attribution
    try {
      localStorage.setItem('sutra_masterclass_rsvp', JSON.stringify({
        email,
        role,
        timestamp: new Date().toISOString(),
        source: 'website_funnel'
      }));
    } catch {
      // Ignore local storage error
    }

    setIsSubmitted(true);
    setTimeout(() => {
      navigate(`/auth/signup?ref=masterclass&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`);
    }, 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-blue-950/80 to-slate-950 border border-blue-500/30 p-8 md:p-12 shadow-2xl relative overflow-hidden text-white">
      {/* Dynamic ambient backdrop */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top Badges & Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span>Sutra Sovereign Intelligence Academy</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wide">
              Live Every Saturday @ 10:00 AM PST
            </span>
          </div>
        </div>

        {/* Hero Pitch */}
        <div className="grid lg:grid-cols-12 gap-8 items-center mb-10">
          <div className="lg:col-span-7">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Build a Sovereign Super Brain & Agentics{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                On Your Own Hardware
              </span>
            </h2>
            <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-6">
              Learn step-by-step how to create autonomous agentic systems in any field. Run 100% on your own hardware (NVIDIA RTX / CUDA-enabled GPUs or local AI accelerators), completely air-gapped from public cloud, with easy 1-click model switching.
            </p>

            {/* Fast Stats Pill Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-lg">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-xl font-black text-blue-400">100%</p>
                <p className="text-[11px] text-slate-400 font-medium">Your Hardware</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-xl font-black text-cyan-400">Air-Gapped</p>
                <p className="text-[11px] text-slate-400 font-medium">Zero Cloud Egress</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-xl font-black text-emerald-400">1-Click</p>
                <p className="text-[11px] text-slate-400 font-medium">Local / Cloud Switch</p>
              </div>
            </div>
          </div>

          {/* Registration Funnel Box */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-900/90 border border-blue-500/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Reserve Free Live Seat</span>
                        <span className="text-[11px] font-semibold text-amber-400">Seats Limited to 150</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">Claim Your Saturday Workshop Pass</h4>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Your Professional Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Your Primary Domain / Focus</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="Enterprise / Business Operations">Enterprise / Business Operations</option>
                        <option value="California Workers' Comp Attorney / Rep">California Workers' Comp Attorney / Rep</option>
                        <option value="Medical Provider / Physician (PQME / AME)">Medical Provider / Physician (PQME / AME)</option>
                        <option value="Lien Claimant / Medical-Legal Specialist">Lien Claimant / Medical-Legal Specialist</option>
                        <option value="Insurance TPA / Claims Adjuster">Insurance TPA / Claims Adjuster</option>
                        <option value="Workflow Engineer / Protocol Developer">Workflow Engineer / Protocol Developer</option>
                        <option value="Solo Practitioner / Independent Consultant">Solo Practitioner / Independent Consultant</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#00b4d8] via-teal-500 to-[#10b981] hover:from-[#00a0c2] hover:to-[#0ea572] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 group"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Claim Free Masterclass Pass</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Instant calendar invite + full starter repository included.</span>
                    </p>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Seat Reserved!</h4>
                    <p className="text-xs text-slate-300">
                      We're redirecting you to your workshop dashboard and starter packet...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 3 Core Curriculum Deliverables */}
        <div className="grid md:grid-cols-3 gap-5 pt-8 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Autonomous Protocol Engineering</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Step-by-step methods to map complex human operations and domain knowledge into deterministic, self-executing agentic pipelines.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Run on Your Own Hardware</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deploy locally on your NVIDIA RTX / CUDA GPUs or Apple Silicon workstations. Zero data egress, completely air-gapped from public cloud.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">1-Click Local vs. Cloud Switching</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintain full flexibility. Run sovereign on your private GPU when dealing with confidential records, and easily switch to public AI when needed.
            </p>
          </div>
        </div>

        {/* Footer Syllabus link */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-4">
          <span>Need team/firm-wide CLE or private training?</span>
          <button
            onClick={() => navigate('/academy')}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 mt-2 sm:mt-0 transition-colors"
          >
            <span>Explore Full Academy & Archive Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
