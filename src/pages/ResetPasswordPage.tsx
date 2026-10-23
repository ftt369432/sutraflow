import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRequestLink, setShowRequestLink] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse any error parameters from hash or query string
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(location.search);

    const error = hashParams.get('error') || queryParams.get('error');
    const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
    const errorCode = hashParams.get('error_code') || queryParams.get('error_code');

    if (error || errorCode) {
      if (errorCode === 'otp_expired' || error === 'access_denied') {
        setErrorMessage('Your password recovery link has expired. Please request a new one.');
      } else {
        setErrorMessage(errorDesc || 'An error occurred with your recovery link.');
      }
      setShowRequestLink(true);
    }

    // Check if session is already active from recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatusMessage('Recovery session verified. Please choose a strong new password.');
      }
    });
  }, [location]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      setStatusMessage('Your password has been successfully updated! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error('Password reset update error:', err);
      setErrorMessage(err.message || 'Failed to update password. Please request a new link.');
      setShowRequestLink(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setResendSuccess(true);
      setStatusMessage(`Password reset link sent to ${resendEmail}. Check your inbox.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send recovery email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b1a] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#111228]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Login
            </Link>
            <span className="text-xs text-slate-500 font-mono">GENIEFLOW SECURE</span>
          </div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
            <p className="text-sm text-slate-400 mt-1">
              {showRequestLink
                ? 'Request a new recovery link for your account'
                : 'Enter your new credentials below to restore account access'}
            </p>
          </div>

          {/* Feedback banners */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && !errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {!showRequestLink ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="bg-black/30 border-white/10 text-white placeholder-slate-500 pl-10 focus:border-indigo-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="bg-black/30 border-white/10 text-white placeholder-slate-500 pl-10 focus:border-indigo-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowRequestLink(true)}
                  className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  Need a new reset link instead? Click here
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSendNewLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Account Email
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="bg-black/30 border-white/10 text-white placeholder-slate-500 pl-10 focus:border-indigo-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !resendEmail || resendSuccess}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Sending Link...' : 'Email Reset Link'}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowRequestLink(false)}
                  className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  Have an active recovery token? Enter new password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;