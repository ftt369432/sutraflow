import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const initialEmail = queryParams.get('email') || '';
  const initialType = (queryParams.get('type') || 'signup') as 'signup' | 'recovery' | 'magiclink';

  const [email, setEmail] = useState(initialEmail);
  const [otpType, setOtpType] = useState<'signup' | 'recovery' | 'magiclink'>(initialType);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus first digit on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Handle pasting a full code
    if (value.length > 1) {
      const sanitized = value.replace(/\D/g, '').slice(0, 6);
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = sanitized[i] || '';
      }
      setDigits(newDigits);
      const nextFocus = Math.min(sanitized.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const char = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = digits.join('');
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Please provide the email address associated with the code.');
      return;
    }

    if (token.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      // Execute real Supabase OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: otpType,
      });

      if (error) throw error;

      setSuccessMessage('Code verified successfully! Finalizing your session...');

      setTimeout(() => {
        if (otpType === 'recovery') {
          navigate('/reset-password', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 1500);
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setErrorMessage(err.message || 'Invalid or expired code. Please verify or resend.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) return;

    setResending(true);
    setErrorMessage(null);
    try {
      if (otpType === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resend({
          type: otpType === 'signup' ? 'signup' : 'magiclink',
          email,
        });
        if (error) throw error;
      }

      setSuccessMessage('A fresh verification code has been dispatched to your email.');
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('OTP resend error:', err);
      setErrorMessage(err.message || 'Failed to resend code. Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b1a] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#111228]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Login
            </Link>
            <span className="text-xs text-slate-500 font-mono">SUPABASE MFA</span>
          </div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Verification Code</h1>
            <p className="text-sm text-slate-400 mt-1">
              Enter the 6-digit confirmation code dispatched to your email
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && !errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Recipient Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="bg-black/30 border-white/10 text-white placeholder-slate-500 pl-10 focus:border-indigo-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  6-Digit OTP
                </label>
                <span className="text-[11px] text-slate-500">Auto-validates on completion</span>
              </div>
              <div className="flex justify-between gap-2">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || digits.join('').length !== 6 || !email}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20"
            >
              {loading ? 'Verifying Code...' : 'Verify & Continue'}
            </Button>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
              <span>Didn't receive a code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resending || !email}
                className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;