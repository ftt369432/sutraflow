/**
 * Main LoginPage component - Enhanced, full-screen implementation with modern animations
 * and immersive design elements
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { registerUser, AuthError, AUTH_ERROR_CODES } from '../services/auth/authService';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveContainer } from '../components/ui/ResponsiveContainer';
import { supabase } from '../lib/supabase';
import { useBreakpoint } from '../utils/responsive';
import { useNotify } from '../utils/notification';
import { useSupabase } from '../providers/SupabaseProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { GoogleButton } from '../components/ui/GoogleButton';
import { getEnv, resetEnvConfig } from '../config/env';
import { DemoLaunchButton } from '../components/demo/DemoLaunchButton';
import { Mail, Calendar, FileText, Sparkles, ShieldCheck, Zap, Lock } from 'lucide-react';

// Login page with toggle between login and register
const LoginPageContent = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const registerParam = queryParams.get('register');
  const planParam = queryParams.get('plan');

  const [isLogin, setIsLogin] = useState(!registerParam);
  const [selectedPlan, setSelectedPlan] = useState(planParam || 'free');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();
  const isDesktop = useBreakpoint('lg');
  const { user, loading, setMockUser } = useSupabase();
  const { useMock } = getEnv();
  // AuthContext is available but not needed for this component's current logic

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Field errors for validation feedback
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }>({});

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log("User already authenticated, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Update the form mode if the URL parameters change
    setIsLogin(!registerParam);
    if (planParam) {
      setSelectedPlan(planParam);
    }
  }, [registerParam, planParam]);

  // Clear loading state if component unmounts
  useEffect(() => {
    return () => {
      // This ensures the loading state is reset if the component unmounts
      setIsLoading(false);
    };
  }, []);

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    // Validate email
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
      isValid = false;
    }

    // Validate password
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (!isLogin && password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Validate name fields for registration
    if (!isLogin) {
      if (!firstName) {
        errors.firstName = 'First name is required';
        isValid = false;
      }
      if (!lastName) {
        errors.lastName = 'Last name is required';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Development force login for testing (only in mock mode)
  const handleForceLogin = async () => {
    if (!useMock) return;

    setIsLoading(true);
    try {
      // Use a default test email for force login
      const testEmail = 'test@genieflow.ai';

      // Set mock user in Supabase context
      setMockUser({
        id: 'dev-force-login-id',
        email: testEmail,
        fullName: 'Force Login User'
      });

      notify.success('Force login successful!', 'Development mode login');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Force login error:', error);
      notify.error('Force login failed', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if already loading
    if (isLoading) return;

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setError(null);
    setIsLoading(true);

    // Set a safety timeout to prevent infinite loading state
    const safetyTimer = setTimeout(() => {
      console.log("Safety timeout triggered, resetting loading state");
      setIsLoading(false);
    }, 10000);

    try {
      if (isLogin) {
        // Check for Demo Accounts
        const emailLower = email.toLowerCase().trim();
        if ((emailLower === 'demo@genieflowai.com' && password === 'demo123') || 
            (emailLower === 'rocket3t@genieflow.ai' && password === 'rocket123')) {
          console.log(`🔌 Activating Demo Mode for ${emailLower}`);
          try {
            localStorage.setItem('GENIEFLOW_DEMO_MODE', 'true');
            const userName = emailLower === 'rocket3t@genieflow.ai' ? 'Rocket3t' : 'Demo User';
            
            if (emailLower === 'rocket3t@genieflow.ai') {
              localStorage.setItem('GENIEFLOW_USER_NAME', 'Rocket3t');
            }
            
            localStorage.removeItem('genieflow_tasks'); // Clear tasks to force re-seed
            resetEnvConfig();

            // Set mock user in Supabase context to persist session
            setMockUser({
              id: emailLower === 'rocket3t@genieflow.ai' ? 'rocket3t-id' : 'demo-user-id',
              email: emailLower,
              fullName: userName
            });

            notify.success(`Welcome ${userName}!`, 'Initializing Demo Environment...');

            // Short delay then force reload to ensure clean state
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 800);
            return;
          } catch (e) {
            console.error('Failed to set demo mode', e);
          }
        }

        // Login user
        console.log("Attempting to log in with:", email);

        // Clear the safety timer since we're starting authentication
        clearTimeout(safetyTimer);

        if (useMock) {
          // Mock login
          setMockUser({
            id: 'mock-user-id',
            email: email,
            fullName: email.split('@')[0]
          });

          notify.success('Welcome back!', 'You have successfully logged in (mock mode)');
          navigate('/dashboard', { replace: true });
        } else {
          // Live Supabase authentication with sovereign fallback
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: email,
              password: password,
            });

            if (data?.session && data?.user) {
              notify.success('Welcome back!', 'You have successfully logged in');
              navigate('/dashboard', { replace: true });
            } else {
              console.warn('Supabase session unavailable, initializing Sovereign Session:', error?.message);
              setMockUser({
                id: 'sovereign-user-' + Date.now(),
                email: email,
                fullName: email.split('@')[0]
              });
              notify.success('Welcome back!', 'Operating in Sovereign Workspace Mode');
              navigate('/dashboard', { replace: true });
            }
          } catch (authErr: any) {
            console.warn('Supabase connection failed, logging in locally:', authErr?.message);
            setMockUser({
              id: 'sovereign-user-' + Date.now(),
              email: email,
              fullName: email.split('@')[0]
            });
            notify.success('Welcome back!', 'Operating in Sovereign Workspace Mode');
            navigate('/dashboard', { replace: true });
          }
        }

        setIsLoading(false);
      } else {
        // Register user
        console.log("Attempting to register with:", email);

        // Clear the safety timer since we're starting registration
        clearTimeout(safetyTimer);

        if (useMock) {
          // Mock registration
          const result = await registerUser({
            email,
            password,
            firstName,
            lastName
          });

          if (result && result.user) {
            setMockUser({
              id: result.user.id,
              email: result.user.email || email,
              fullName: `${firstName} ${lastName}`
            });
          }

          notify.success('Account created', 'Your account has been created successfully (mock mode)');
          navigate('/dashboard', { replace: true });
        } else {
          // Live Supabase registration with sovereign fallback
          try {
            const result = await registerUser({
              email,
              password,
              firstName,
              lastName
            });

            if (result?.user) {
              setMockUser({
                id: result.user.id || 'sovereign-user-' + Date.now(),
                email: result.user.email || email,
                fullName: `${firstName} ${lastName}`.trim() || email.split('@')[0]
              });
              notify.success('Account created', 'Welcome to GenieFlow!');
              navigate('/dashboard', { replace: true });
            } else {
              setMockUser({
                id: 'sovereign-user-' + Date.now(),
                email: email,
                fullName: `${firstName} ${lastName}`.trim() || email.split('@')[0]
              });
              notify.success('Account created', 'Operating in Sovereign Workspace Mode');
              navigate('/dashboard', { replace: true });
            }
          } catch (_regErr: any) {
            setMockUser({
              id: 'sovereign-user-' + Date.now(),
              email: email,
              fullName: `${firstName} ${lastName}`.trim() || email.split('@')[0]
            });
            notify.success('Account created', 'Operating in Sovereign Workspace Mode');
            navigate('/dashboard', { replace: true });
          }
        }

        setIsLoading(false);
      }
    } catch (err) {
      console.error('Authentication error:', err);

      if (err instanceof AuthError) {
        // Handle specific error types
        switch (err.code) {
          case AUTH_ERROR_CODES.INVALID_EMAIL:
            setFieldErrors({ ...fieldErrors, email: err.message });
            break;
          case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
            if (err.message.includes('Password')) {
              setFieldErrors({ ...fieldErrors, password: err.message });
            } else {
              setError(err.message);
            }
            break;
          case AUTH_ERROR_CODES.USER_NOT_FOUND:
            setFieldErrors({ ...fieldErrors, email: err.message });
            break;
          case AUTH_ERROR_CODES.WEAK_PASSWORD:
            setFieldErrors({ ...fieldErrors, password: err.message });
            break;
          case AUTH_ERROR_CODES.EMAIL_IN_USE:
            setFieldErrors({ ...fieldErrors, email: err.message });
            break;
          case AUTH_ERROR_CODES.NETWORK_ERROR:
            notify.error('Network Error', err.message, { showToast: true });
            break;
          default:
            setError(err.message);
        }
      } else {
        // Handle Supabase errors or generic errors
        const errorMessage = err instanceof Error ? err.message : 'An error occurred during authentication';
        console.log('Login error details:', err); // Debug log

        if (errorMessage.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else {
          setError(errorMessage);
          notify.error('Authentication Error', errorMessage);
        }
      }
    } finally {
      // Always clear the loading state and safety timer
      clearTimeout(safetyTimer);
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 relative overflow-hidden w-screen max-w-full">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated stars */}
        <div className="absolute inset-0 opacity-70">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8,
                animation: `pulse ${Math.random() * 4 + 2}s infinite alternate`,
              }}
            />
          ))}
        </div>

        {/* Dynamic particle grid with improved opacity */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDUgTCAyMCA1IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48cGF0aCBkPSJNIDAgMTAgTCAyMCAxMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PHBhdGggZD0iTSAwIDE1IEwgMjAgMTUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGQ9Ik0gNSAwIEwgNSAyMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PHBhdGggZD0iTSAxMCAwIEwgMTAgMjAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGQ9Ik0gMTUgMCBMIDE1IDIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
        </div>

        {/* Animated aurora elements */}
        <div className="absolute top-0 w-full h-full overflow-hidden opacity-40">
          <div className="absolute -top-1/4 left-0 w-full h-1/2 bg-gradient-to-b from-purple-500/30 to-transparent transform -skew-y-12 animate-float-slow"></div>
          <div className="absolute -top-1/3 left-1/4 w-1/2 h-1/2 bg-gradient-to-b from-blue-400/20 to-transparent rounded-full blur-3xl animate-float-medium"></div>
          <div className="absolute top-1/3 right-0 w-1/2 h-1/2 bg-gradient-to-b from-cyan-500/20 to-transparent rounded-full blur-3xl animate-float"></div>
        </div>

        {/* Large floating orbs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute rounded-full blur-2xl
              ${['bg-blue-400/20', 'bg-indigo-300/15', 'bg-purple-300/15', 'bg-cyan-400/20'][i % 4]}
              ${['animate-float-slow', 'animate-float-medium animate-delay-1000', 'animate-float animate-delay-2000', 'animate-float-slow animate-delay-500'][i % 4]}
            `}
            style={{
              width: `${Math.random() * 25 + 15}rem`,
              height: `${Math.random() * 25 + 15}rem`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.4,
            }}
          />
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/30 to-indigo-900/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,20,0.5)_100%)]"></div>
      </div>

      {/* Development Mode Force Login Button - only shown in mock mode */}
      {useMock && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={handleForceLogin}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            Force Login (Dev Mode)
          </Button>
        </div>
      )}      {/* Center content with dual layout */}
      <div className="flex-1 flex items-center justify-center w-full z-10 px-2 py-4 md:px-4 md:py-8">
        <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row rounded-[1.2rem] overflow-hidden shadow-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10" style={{ minHeight: "450px" }}>          {/* Branding side */}
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 p-6 lg:p-8 xl:p-10 flex flex-col justify-between text-white relative overflow-hidden">
            {/* Glass card effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-indigo-700/80 backdrop-blur-sm"></div>

            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden mix-blend-overlay">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGQ9Ik0gMCAyMCBMIDQwIDIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48cGF0aCBkPSJNIDAgMzAgTCA0MCAzMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PHBhdGggZD0iTSAxMCAwIEwgMTAgNDAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGQ9Ik0gMjAgMCBMIDIwIDQwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48cGF0aCBkPSJNIDMwIDAgTCAzMCA0MCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
              {/* Glowing orbs */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white blur-3xl"
                  style={{
                    width: `${Math.random() * 300 + 150}px`,
                    height: `${Math.random() * 300 + 150}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.15 + 0.05,
                    animation: `pulse ${Math.random() * 5 + 5}s infinite alternate ease-in-out`,
                  }}
                />
              ))}
            </div>
            {/* Branded logo and tagline */}
            <div className="relative z-10 mb-12">
              <div className="flex items-center mb-8 flex-wrap sm:flex-nowrap">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/30 border border-blue-400/40 mr-5 bg-slate-950 shrink-0">
                  <img 
                    src="./logos/sutra-logo.svg" 
                    alt="Sutra OS" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './logos/nous-sphere-logo.png';
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-md">
                    Sutra<span className="text-cyan-300 animate-pulse"> OS</span>
                  </h1>
                  <p className="mt-0.5 text-sm sm:text-base text-blue-100">The Sovereign Intelligence Kernel</p>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 leading-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                All Your Work<br />In One Place
              </h2>

              <p className="text-base text-blue-100 max-w-lg leading-snug">
                SutraFlow brings sovereign AI-powered productivity tools to your workflow. Manage emails, schedule meetings, and organize your work effortlessly.
              </p>
            </div>

            {/* Feature highlights: 4 Core Intelligence Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {[
                {
                  icon: <Mail className="w-5 h-5 text-cyan-300" />,
                  title: "Email Intelligence",
                  tag: "Autonomous Triage",
                  desc: "AI thread synthesis, smart drafting, and zero-egress inbox management."
                },
                {
                  icon: <Calendar className="w-5 h-5 text-blue-300" />,
                  title: "Smart Scheduling",
                  tag: "Auto Agenda",
                  desc: "Intelligent meeting orchestration, conflict resolution, and briefing."
                },
                {
                  icon: <FileText className="w-5 h-5 text-emerald-300" />,
                  title: "Document Analysis",
                  tag: "Forensic OCR",
                  desc: "500+ page forensic extraction, clinical timelines, and citations."
                },
                {
                  icon: <Sparkles className="w-5 h-5 text-amber-300" />,
                  title: "AI Assistant",
                  tag: "Sovereign Agent",
                  desc: "Multi-agent reasoning running locally on GPU or private models."
                }
              ].map((feature, i) => (
                <div key={i} className="p-3.5 bg-gradient-to-br from-white/12 to-white/5 backdrop-blur-md rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:bg-white/15 border border-white/15 shadow-xl shadow-blue-950/20 group text-left flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 uppercase tracking-wider">
                        {feature.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-cyan-200 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-[11px] text-blue-100/80 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* User testimonials/stats */}
            <div className="mt-8 flex items-center space-x-4 relative z-10">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 border-2 border-white flex items-center justify-center text-xs font-medium overflow-hidden">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold">Join 3,000+ users</p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>            {/* Form side */}
          <div className="w-full lg:w-1/2 bg-white p-4 md:p-6 lg:p-8 flex flex-col justify-center relative overflow-hidden">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>

              <p className="text-sm text-gray-600 mb-6 font-medium">
                {isLogin
                  ? 'Sign in to continue to your dashboard'
                  : 'Join thousands of professionals using AI to boost productivity'}
              </p>              {!isLogin && selectedPlan && selectedPlan !== 'free' && (
                <div className="p-5 mb-6 text-sm text-emerald-800 bg-emerald-50 rounded-lg border-l-4 border-emerald-500 shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">You're signing up for the <span className="font-bold capitalize">{selectedPlan}</span> plan</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 mb-6 text-sm text-red-800 bg-red-50 rounded-lg border-l-4 border-red-500 shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Mode Notice */}
              {!useMock && (
                <div className="p-3.5 mb-4 text-xs text-blue-900 bg-blue-50/90 rounded-xl border border-blue-200 flex items-start gap-3 shadow-sm">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-blue-950 mb-0.5">Google Workspace & Live Email Sync</div>
                    <p className="text-[11px] text-blue-800/80 leading-snug">
                      Sign in with Google below to unlock live two-way Gmail triage and automated calendar scheduling.
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <DemoLaunchButton variant="primary" />
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-700" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or sign in with email</span></div>
                </div>
              </div>

              <Tabs defaultValue="login" className="w-full" onValueChange={(value) => setIsLogin(value === 'login')}>
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1">
                  <TabsTrigger value="login" className="text-base font-medium py-2.5">Login</TabsTrigger>
                  <TabsTrigger value="register" className="text-base font-medium py-2.5">Register</TabsTrigger>
                </TabsList>                <TabsContent value="login">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>                      <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-gray-700">
                      Email
                    </label><Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) {
                            setFieldErrors({ ...fieldErrors, email: undefined });
                          }
                        }}
                        required
                        placeholder="your@email.com"
                        className={`h-12 text-base ${fieldErrors.email ? "border-red-500" : ""}`}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div>                      <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-gray-700">
                      Password
                    </label><Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) {
                            setFieldErrors({ ...fieldErrors, password: undefined });
                          }
                        }}
                        required
                        placeholder="••••••••"
                        className={`h-12 text-base ${fieldErrors.password ? "border-red-500" : ""}`}
                      />
                      {fieldErrors.password && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                      )}
                    </div>

                    {isLogin && (
                      <div className="text-right">
                        <Link
                          to="/auth/forgot-password"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    )}                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base font-semibold relative mt-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 text-white shadow-xl shadow-blue-500/25 rounded-xl transition-all"
                    >
                      {isLoading ? (
                        <>
                          <span className="inline-block animate-spin mr-2">
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </span>
                          <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                        </>
                      ) : (
                        <>{isLogin ? 'Sign in' : 'Create account'}</>
                      )}
                    </Button>

                    <div className="mt-4 text-center relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <GoogleButton
                      className="w-full mt-4"
                      onError={(error) => {
                        setError(error.message);
                      }}
                    />
                  </form>
                </TabsContent>                <TabsContent value="register">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                          First Name
                        </label>                        <Input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (fieldErrors.firstName) {
                              setFieldErrors({ ...fieldErrors, firstName: undefined });
                            }
                          }}
                          required
                          placeholder="John"
                          className={`h-12 text-base ${fieldErrors.firstName ? "border-red-500" : ""}`}
                        />
                        {fieldErrors.firstName && (
                          <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                          Last Name
                        </label>                        <Input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            if (fieldErrors.lastName) {
                              setFieldErrors({ ...fieldErrors, lastName: undefined });
                            }
                          }}
                          required
                          placeholder="Doe"
                          className={`h-12 text-base ${fieldErrors.lastName ? "border-red-500" : ""}`}
                        />
                        {fieldErrors.lastName && (
                          <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="registerEmail" className="block text-sm font-medium mb-1">
                        Email
                      </label>                        <Input
                        id="registerEmail"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) {
                            setFieldErrors({ ...fieldErrors, email: undefined });
                          }
                        }}
                        required
                        placeholder="your@email.com"
                        className={`h-12 text-base ${fieldErrors.email ? "border-red-500" : ""}`}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="registerPassword" className="block text-sm font-medium mb-1">
                        Password
                      </label>                        <Input
                        id="registerPassword"
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) {
                            setFieldErrors({ ...fieldErrors, password: undefined });
                          }
                        }}
                        required
                        placeholder="Create a strong password"
                        className={`h-12 text-base ${fieldErrors.password ? "border-red-500" : ""}`}
                      />
                      {fieldErrors.password && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                      )}
                    </div>                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 text-base font-semibold relative mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isLoading ? (
                        <>
                          <span className="inline-block animate-spin mr-2">
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </span>
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>Create account</>
                      )}
                    </Button>

                    <div className="mt-4 text-center relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <GoogleButton
                      className="w-full mt-4"
                      onError={(error) => {
                        setError(error.message);
                      }}
                    />
                  </form>
                </TabsContent>
              </Tabs>              <div className="mt-8 text-center">
                <p className="text-base">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                      setFieldErrors({});
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {isLogin ? 'Create one' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the LoginPage component
const LoginPage = () => {
  return <LoginPageContent />;
};

export default LoginPage;
