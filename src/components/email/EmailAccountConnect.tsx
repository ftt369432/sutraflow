import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEmail } from '../../contexts/EmailContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Play, 
  Settings, 
  Eye, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Lock,
  Server,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getEnv, updateEnvConfig } from '../../config/env';
import { EMAIL_PRESETS, detectEmailPreset, EmailProviderPreset } from '../../services/email/emailProviderPresets';
import { supabaseEmailService } from '../../services/email/supabaseEmailService';
import { IMAPService } from '../../services/email/IMAPService';

interface EmailAccountConnectProps {
  onConnectionStart?: () => void;
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
  isDialog?: boolean;
}

export function EmailAccountConnect({
  onConnectionStart,
  onConnectionSuccess,
  onConnectionError,
  isDialog = false
}: EmailAccountConnectProps) {
  const { user } = useAuth();
  const { refreshAccounts } = useEmail();
  const navigate = useNavigate();
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>('google');
  const [selectedPreset, setSelectedPreset] = useState<EmailProviderPreset>(EMAIL_PRESETS.google);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [autoDetected, setAutoDetected] = useState<boolean>(false);

  const [imapConfig, setImapConfig] = useState({
    email: '',
    password: '',
    imapHost: EMAIL_PRESETS.google.imapHost,
    imapPort: EMAIL_PRESETS.google.imapPort,
    smtpHost: EMAIL_PRESETS.google.smtpHost,
    smtpPort: EMAIL_PRESETS.google.smtpPort,
    useSSL: EMAIL_PRESETS.google.useSSL
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [envConfig, setEnvConfig] = useState(getEnv());

  useEffect(() => {
    setEnvConfig(getEnv());
  }, []);

  // Preset switch handler
  const applyPreset = (presetKey: string) => {
    const preset = EMAIL_PRESETS[presetKey] || EMAIL_PRESETS.custom;
    setSelectedPresetId(presetKey);
    setSelectedPreset(preset);
    
    setImapConfig(prev => ({
      ...prev,
      imapHost: preset.imapHost,
      imapPort: preset.imapPort,
      smtpHost: preset.smtpHost,
      smtpPort: preset.smtpPort,
      useSSL: preset.useSSL
    }));
  };

  // Smart auto-detection as user types email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    
    setImapConfig(prev => ({
      ...prev,
      email: emailValue
    }));

    if (emailValue.includes('@') && emailValue.split('@')[1]?.length > 2) {
      const detected = detectEmailPreset(emailValue);
      if (detected.id !== selectedPresetId) {
        setSelectedPresetId(detected.id);
        setSelectedPreset(detected);
        setAutoDetected(true);
        setImapConfig(prev => ({
          ...prev,
          email: emailValue,
          imapHost: detected.imapHost,
          imapPort: detected.imapPort,
          smtpHost: detected.smtpHost,
          smtpPort: detected.smtpPort,
          useSSL: detected.useSSL
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setImapConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDemoMode = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setConnectionStatus('connecting');
    
    onConnectionStart?.();
    
    try {
      updateEnvConfig({ useMock: true });
      setEnvConfig(getEnv());
      await refreshAccounts();
      
      setSuccess('Demo mode enabled! You can now see sample emails and test the system.');
      setConnectionStatus('success');
      setConnectedEmail(user?.email || 'demo@example.com');
      onConnectionSuccess?.();
      
      toast.success('Demo mode enabled - sample emails loaded!');
      
      if (!isDialog) {
        setTimeout(() => {
          navigate('/email');
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to enable demo mode';
      console.error('Demo mode error:', err);
      setError(errorMessage);
      setConnectionStatus('error');
      onConnectionError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setConnectionStatus('connecting');
    
    onConnectionStart?.();
    
    try {
      updateEnvConfig({ useMock: false });
      setEnvConfig(getEnv());
      
      // Auto-fill if host is still empty
      let finalImapHost = imapConfig.imapHost;
      let finalSmtpHost = imapConfig.smtpHost;
      if (!finalImapHost) {
        const fallback = detectEmailPreset(imapConfig.email);
        finalImapHost = fallback.imapHost;
        finalSmtpHost = fallback.smtpHost;
      }

      if (!imapConfig.email || !imapConfig.password || !finalImapHost) {
        throw new Error('Please enter both your email address and password/app password.');
      }

      // 1. Sanitize password (Google 16-digit App Passwords often copied with spaces e.g. "abcd efgh ijkl mnop")
      const cleanPassword = (finalImapHost.toLowerCase().includes('gmail') || finalImapHost.toLowerCase().includes('google'))
        ? imapConfig.password.replace(/\s+/g, '')
        : imapConfig.password.trim();

      // Test & verify connection with IMAP backend server
      const connectionConfig = {
        email: imapConfig.email.trim(),
        password: cleanPassword,
        imapHost: finalImapHost,
        imapPort: Number(imapConfig.imapPort) || 993,
        smtpHost: finalSmtpHost,
        smtpPort: Number(imapConfig.smtpPort) || 587,
        useSSL: imapConfig.useSSL !== false
      };

      const testService = new IMAPService();
      await testService.connect(connectionConfig);
      
      // 2. Save to Supabase if authenticated
      if (user?.id) {
        try {
          await supabaseEmailService.saveEmailAccount({
            userId: user.id,
            email: imapConfig.email.trim(),
            name: selectedPreset.name,
            provider: 'imap',
            password: cleanPassword,
            imapHost: finalImapHost,
            imapPort: Number(imapConfig.imapPort) || 993,
            smtpHost: finalSmtpHost,
            smtpPort: Number(imapConfig.smtpPort) || 587,
            useSSL: imapConfig.useSSL
          });
        } catch (dbErr) {
          console.warn('Supabase email account save fallback:', dbErr);
        }
      }

      // 3. Persist to local sovereign accounts registry (with password for offline IMAP)
      const localAccount = {
        id: uuidv4(),
        email: imapConfig.email.trim(),
        name: selectedPreset.name,
        provider: 'imap',
        connected: true,
        lastSynced: new Date(),
        imapHost: finalImapHost,
        imapPort: Number(imapConfig.imapPort) || 993,
        smtpHost: finalSmtpHost,
        smtpPort: Number(imapConfig.smtpPort) || 587,
        useSSL: imapConfig.useSSL,
        password: cleanPassword
      };

      try {
        const stored = localStorage.getItem('genieflow_connected_email_accounts');
        const list = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((a: any) => a.email.toLowerCase() !== imapConfig.email.toLowerCase());
        filtered.push(localAccount);
        localStorage.setItem('genieflow_connected_email_accounts', JSON.stringify(filtered));
      } catch (storageErr) {
        console.warn('localStorage save failed:', storageErr);
      }
      
      await refreshAccounts();
      
      setConnectedEmail(imapConfig.email);
      setSuccess(`${selectedPreset.name} account (${imapConfig.email}) configured & connected!`);
      setConnectionStatus('success');
      onConnectionSuccess?.();
      
      toast.success(`Connected ${imapConfig.email} successfully!`);
      
      if (!isDialog) {
        setTimeout(() => {
          navigate('/email');
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect email account';
      console.error('Email connection error:', err);
      setError(errorMessage);
      setConnectionStatus('error');
      onConnectionError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const containerClass = isDialog 
    ? "space-y-4" 
    : "container mx-auto py-6 px-4 max-w-4xl space-y-6";

  return (
    <div className={containerClass}>
      {!isDialog && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Mail className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-2xl font-bold">Connect Email Account</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={envConfig.useMock ? 'destructive' : 'default'}>
              {envConfig.useMock ? 'Demo Mode' : 'Live Mode'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/debug/email')}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Debug Panel
            </Button>
          </div>
        </div>
      )}

      {/* Status messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative flex items-start text-sm">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg relative flex items-start text-sm">
          <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Connect Card with 1-Click Service Presets */}
      <Card className="p-6 shadow-md border border-border">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Auto-Insert Mail Service Presets
            </h3>
            {autoDetected && (
              <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200">
                Auto-Detected from Email
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your service or simply type your email address below. All server ports, protocols, and security settings auto-insert instantly.
          </p>

          {/* Quick-Select Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {Object.values(EMAIL_PRESETS).map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                      : 'border-border hover:border-gray-400 hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <span className="text-xs">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The Simplified Form: Just Email & Password */}
        <form onSubmit={handleConnectAccount} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                value={imapConfig.email}
                onChange={handleEmailChange}
                placeholder="attorney@gmail.com or clerk@firm.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center justify-between">
                <span>Password / App Password</span>
                {selectedPreset.helpUrl && (
                  <a
                    href={selectedPreset.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 font-normal"
                  >
                    <span>Get App Password</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </label>
              <Input
                type="password"
                name="password"
                value={imapConfig.password}
                onChange={handleInputChange}
                placeholder="••••••••••••••••"
                required
                className="w-full"
              />
            </div>
          </div>

          {/* 🛡️ Step-by-Step Provider Access & Authorization Guide */}
          <div className="p-4 bg-muted/40 border border-border/80 rounded-xl space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-cyan-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    How to Allow Access for {selectedPreset.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">{selectedPreset.passwordHelp}</p>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-semibold ${
                selectedPreset.authType === 'app-password' 
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                {selectedPreset.authType === 'app-password' ? 'App Password Required' : 'Direct Mailbox Password'}
              </Badge>
            </div>

            {/* Steps List */}
            <div className="space-y-2 pt-1 border-t border-border/40">
              {selectedPreset.steps?.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 text-[10px] font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug text-foreground/90">{step}</span>
                </div>
              ))}
            </div>

            {/* Direct Security Portal Button */}
            {selectedPreset.helpUrl && (
              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Open {selectedPreset.name} security portal:</span>
                <a
                  href={selectedPreset.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 transition-colors shadow-xs"
                >
                  <span>{selectedPreset.helpUrlLabel || 'Open Security Portal'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Auto-Configured Settings Preview Chip */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/50 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-500" />
              <span className="font-medium text-foreground">IMAP:</span>
              <span className="font-mono text-muted-foreground">{imapConfig.imapHost || 'Pending'}:{imapConfig.imapPort} (SSL)</span>
              <span className="text-muted-foreground">|</span>
              <span className="font-medium text-foreground">SMTP:</span>
              <span className="font-mono text-muted-foreground">{imapConfig.smtpHost || 'Pending'}:{imapConfig.smtpPort}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              <span>{showAdvanced ? 'Hide Details' : 'Edit Server Details'}</span>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Collapsible Advanced Settings (Optional) */}
          {showAdvanced && (
            <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3 mt-2 animate-in fade-in duration-200">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Advanced Server & Port Settings</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">IMAP Host</label>
                  <Input
                    type="text"
                    name="imapHost"
                    value={imapConfig.imapHost}
                    onChange={handleInputChange}
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">IMAP Port</label>
                  <Input
                    type="number"
                    name="imapPort"
                    value={imapConfig.imapPort}
                    onChange={handleInputChange}
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">SMTP Host</label>
                  <Input
                    type="text"
                    name="smtpHost"
                    value={imapConfig.smtpHost}
                    onChange={handleInputChange}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">SMTP Port</label>
                  <Input
                    type="number"
                    name="smtpPort"
                    value={imapConfig.smtpPort}
                    onChange={handleInputChange}
                    className="w-full text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="useSSL"
                  name="useSSL"
                  checked={imapConfig.useSSL}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="useSSL" className="text-xs text-foreground font-medium">Enforce SSL/TLS Encryption</label>
              </div>
            </div>
          )}

          {/* Connect Button */}
          <div className="pt-2 flex gap-3">
            <Button 
              type="submit"
              disabled={isLoading || !imapConfig.email || !imapConfig.password}
              className="flex-1 btn-genie-primary"
              size="lg"
            >
              {isLoading && connectionStatus === 'connecting' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting {selectedPreset.name}...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Connected!
                </>
              ) : (
                <>Connect {selectedPreset.name}</>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Quick Demo Mode */}
      <Card className="p-4 border border-dashed border-primary/20 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Play className="h-5 w-5 text-primary" />
          <div>
            <h4 className="text-sm font-semibold">Need Instant Offline Preview?</h4>
            <p className="text-xs text-muted-foreground">Load test inbox with EAMS notices, legal orders, and sample emails.</p>
          </div>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleDemoMode}
          disabled={isLoading}
          className="gap-1.5"
        >
          <Eye className="h-4 w-4" />
          Load Demo Inbox
        </Button>
      </Card>
    </div>
  );
}