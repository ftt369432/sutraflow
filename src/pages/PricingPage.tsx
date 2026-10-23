import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { createSubscription } from '../services/payment/stripeService';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Layers, 
  HelpCircle, 
  ArrowRight,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { toast } from 'sonner';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  popular?: boolean;
  features: string[];
  ctaText: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Starter Community',
    description: 'Essential AI capabilities for individual researchers & solo practitioners.',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: 'price_free',
    stripePriceIdYearly: 'price_free',
    popular: false,
    ctaText: 'Get Started Free',
    features: [
      'Gemini 2.5 Flash assisted queries (50/day)',
      'Basic Sovereign Canvas single-document editor',
      'Unified file drop & text extraction',
      'Google Drive & Calendar sync (read-only)',
      'Community support & documentation'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Full sovereign agentic power with proactive scheduling and live intelligence.',
    priceMonthly: 29,
    priceYearly: 24,
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdYearly: 'price_pro_yearly',
    popular: true,
    ctaText: 'Upgrade to Pro',
    features: [
      'Unlimited high-speed AI queries',
      'Multi-Canvas split-pane editing & document drafting',
      'Full bi-directional Gmail, Calendar & Drive sync',
      'Cortex Neural Engine proactive task automation',
      'Voice control & speech-to-intent commands',
      '50 GB encrypted AI Drive cloud storage',
      'Standard email & chat support'
    ]
  },
  {
    id: 'team',
    name: 'Work Team',
    description: 'Collaborative autonomous swarms, multi-tenant workflows, and shared binders.',
    priceMonthly: 79,
    priceYearly: 63,
    stripePriceIdMonthly: 'price_team_monthly',
    stripePriceIdYearly: 'price_team_yearly',
    popular: false,
    ctaText: 'Deploy for Team',
    features: [
      'Everything in Professional for up to 5 seats',
      'Multi-Agent Swarm orchestration & delegation',
      'Automated transcript analysis & document synthesis',
      'Team shared workspaces, binders, and templates',
      'Audit logs, team role permissions, and access control',
      '250 GB shared high-performance storage',
      'Priority routing & dedicated support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Sovereign Enterprise',
    description: 'Custom on-premise RTX 4090 GPU acceleration with complete data sovereignty.',
    priceMonthly: 299,
    priceYearly: 239,
    stripePriceIdMonthly: 'price_enterprise_monthly',
    stripePriceIdYearly: 'price_enterprise_yearly',
    popular: false,
    ctaText: 'Contact Enterprise',
    features: [
      'Dedicated local RTX 4090 / vLLM offline inference',
      'Zero external data egress option (Air-gapped capable)',
      'Custom fine-tuned domain & corporate vector models',
      'Unlimited seats & multi-tenant custom domains',
      'HIPAA, SOC 2 Type II compliance & SLA guarantees',
      'Custom API connectors (Slack, Notion, CRM, Internal APIs)',
      '24/7 dedicated engineering concierge'
    ]
  }
];

const FAQS = [
  {
    q: 'What is SutraFlow Sovereign AI?',
    a: 'SutraFlow is a zero-latency agentic operating system combining multi-pane Canvas editing, multi-agent swarms, vector retrieval, and autonomous workflow automation under one unified sovereign architecture.'
  },
  {
    q: 'Can I switch between monthly and annual billing?',
    a: 'Yes! You can upgrade, downgrade, or switch billing intervals at any time. When switching to annual billing, you receive an immediate 20% discount on your ongoing subscription.'
  },
  {
    q: 'How does the local RTX 4090 Sovereign Stack work?',
    a: 'For enterprise installations requiring absolute privacy, SutraFlow can execute models locally on high-performance GPUs (RTX 4090 / workstation nodes) via Ollama and vLLM without any sensitive data or documents ever leaving your internal network.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, and bank transfers securely processed via Stripe.'
  }
];

export const PricingPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.priceMonthly === 0) {
      if (!user) {
        navigate('/login?register=true&plan=free');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    if (!user) {
      navigate(`/login?register=true&plan=${tier.id}&billing=${isYearly ? 'yearly' : 'monthly'}`);
      return;
    }

    // Authenticated user checkout flow
    setLoadingTier(tier.id);
    try {
      const priceId = isYearly ? tier.stripePriceIdYearly : tier.stripePriceIdMonthly;
      await createSubscription({
        priceId,
        successUrl: `${window.location.origin}/dashboard?payment=success&tier=${tier.id}`,
        cancelUrl: `${window.location.origin}/pricing?payment=cancelled`
      });
      toast.success('Initiating secure checkout...');
    } catch (err: any) {
      console.error('Subscription error:', err);
      toast.error('Unable to initiate checkout. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050510] text-gray-900 dark:text-slate-100 selection:bg-blue-500/30 overflow-x-hidden transition-colors">
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
              <Link to="/solutions" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Solutions</Link>
              <Link to="/mcp" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">MCP Cloud</Link>
              <Link to="/masterclass" className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-widest">Masterclass</Link>
              <Link to="/solutions#air-gap" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors uppercase tracking-widest">Air-Gap Vault</Link>
              <Link to="/pricing" className="text-xs font-bold text-blue-600 dark:text-cyan-400 transition-colors uppercase tracking-widest">Pricing</Link>
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
                  Join Free
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background ambient lighting in palette (Cyan & Blue) */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-96 right-10 w-[500px] h-[300px] bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-16">
          {/* Header Hero */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-cyan-400 border-blue-200 dark:border-cyan-500/30 px-3.5 py-1 text-xs uppercase tracking-wider font-bold">
              Clear, Predictable Pricing
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 dark:text-white">
              Choose Your Level of{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500">
                AI Sovereignty
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400">
              From solo practitioners to high-growth teams and sovereign enterprises. Zero hidden fees.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="pt-6 flex items-center justify-center gap-3">
              <span className={`text-sm font-semibold transition-colors ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="w-14 h-7 bg-gray-200 dark:bg-slate-800 rounded-full p-1 transition-colors relative border border-gray-300 dark:border-white/10 focus:outline-none"
                aria-label="Toggle annual or monthly billing"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-blue-600 dark:bg-cyan-400 shadow-md shadow-blue-500/30 transition-transform ${
                    isYearly ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                Annual Billing
                <span className="text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-full shadow-sm">
                  SAVE 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_TIERS.map((tier) => {
              const price = isYearly ? tier.priceYearly : tier.priceMonthly;
              const isLoading = loadingTier === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                    tier.popular
                      ? 'bg-gradient-to-b from-blue-50/80 via-white to-cyan-50/40 dark:from-[#0d122e] dark:to-[#070a1a] border-2 border-blue-500 dark:border-cyan-400/80 shadow-2xl shadow-blue-500/15 dark:shadow-cyan-500/20 md:-translate-y-2'
                      : 'bg-white dark:bg-[#0c0d1e]/80 border border-gray-200 dark:border-white/10 shadow-lg shadow-gray-200/50 dark:shadow-none hover:border-blue-400/50 dark:hover:border-cyan-500/30'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-blue-500/25">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
                      {tier.popular && <Sparkles className="w-5 h-5 text-cyan-500" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 min-h-[36px]">{tier.description}</p>

                    <div className="my-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">${price}</span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">/ month</span>
                      </div>
                      {isYearly && price > 0 && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Billed annually (${price * 12}/yr)
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                        Included Capabilities:
                      </span>
                      <ul className="space-y-2.5">
                        {tier.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-slate-300">
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8">
                    <Button
                      onClick={() => handleSelectPlan(tier)}
                      disabled={isLoading}
                      className={`w-full py-2.5 text-sm font-semibold rounded-xl transition ${
                        tier.popular
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      {isLoading ? 'Processing...' : tier.ctaText}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Existing subscriber notice */}
          {user && (
            <div className="text-center p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 max-w-xl mx-auto">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Already subscribed? You can review your invoices and update payment methods in{' '}
                <button
                  onClick={() => navigate('/plan-management')}
                  className="text-blue-600 dark:text-cyan-400 hover:underline font-semibold"
                >
                  Plan Management
                </button>
                .
              </span>
            </div>
          )}

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto pt-8 border-t border-gray-200 dark:border-white/10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Everything you need to know about our billing & sovereignty options</p>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white dark:bg-[#0c0d1e] border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left p-4 flex justify-between items-center text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 dark:text-slate-400 transition-transform ${
                        openFaq === i ? 'rotate-180 text-blue-600 dark:text-cyan-400' : ''
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-xs text-gray-600 dark:text-slate-400 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-10 bg-gray-100 dark:bg-slate-950 text-center text-xs text-gray-500 dark:text-slate-500 transition-colors">
        <p>© {new Date().getFullYear()} SutraFlow. Sovereign Intelligence Universal Engine.</p>
        <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-600">Air-gapped, zero-egress cognitive architecture for enterprise operations and sovereign automation.</p>
      </footer>
    </div>
  );
};

export default PricingPage;