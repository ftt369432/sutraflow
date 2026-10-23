import React, { useState } from 'react';

export interface IMAPConfig {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  provider?: 'outlook' | 'yahoo' | 'aol' | 'custom';
}

interface IMAPConfigFormProps {
  onSubmit: (config: IMAPConfig) => void;
  onCancel: () => void;
  defaultProvider?: IMAPConfig['provider'];
}

const PRESET_CONFIGS = {
  outlook: {
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: true
  },
  yahoo: {
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    smtpSecure: true
  },
  aol: {
    imapHost: 'imap.aol.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.aol.com',
    smtpPort: 587,
    smtpSecure: true
  }
};

export function IMAPConfigForm({ onSubmit, onCancel, defaultProvider }: IMAPConfigFormProps) {
  const [config, setConfig] = useState<IMAPConfig>(() => {
    const provider = defaultProvider || 'custom';
    const presetConfig = provider !== 'custom' ? PRESET_CONFIGS[provider] : {};
    return {
      email: '',
      password: '',
      imapHost: '',
      imapPort: 993,
      imapSecure: true,
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: true,
      provider,
      ...presetConfig
    };
  });

  const handleProviderChange = (provider: IMAPConfig['provider']) => {
    if (provider && provider !== 'custom') {
      const presetConfig = PRESET_CONFIGS[provider];
      setConfig(prev => ({
        ...prev,
        ...presetConfig,
        provider
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        provider: 'custom'
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Provider
        </label>
        <select
          value={config.provider}
          onChange={(e) => handleProviderChange(e.target.value as IMAPConfig['provider'])}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="custom">Custom</option>
          <option value="outlook">Outlook</option>
          <option value="yahoo">Yahoo</option>
          <option value="aol">AOL</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address
        </label>
        <input
          type="email"
          required
          value={config.email}
          onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
          {config.provider === 'outlook' && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (App Password required if 2FA is enabled)
            </span>
          )}
        </label>
        <input
          type="password"
          required
          value={config.password}
          onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {config.provider === 'custom' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                IMAP Server
              </label>
              <input
                type="text"
                required
                value={config.imapHost}
                onChange={(e) => setConfig(prev => ({ ...prev, imapHost: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                IMAP Port
              </label>
              <input
                type="number"
                required
                value={config.imapPort}
                onChange={(e) => setConfig(prev => ({ ...prev, imapPort: parseInt(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                SMTP Server
              </label>
              <input
                type="text"
                required
                value={config.smtpHost}
                onChange={(e) => setConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                SMTP Port
              </label>
              <input
                type="number"
                required
                value={config.smtpPort}
                onChange={(e) => setConfig(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="imapSecure"
                checked={config.imapSecure}
                onChange={(e) => setConfig(prev => ({ ...prev, imapSecure: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="imapSecure" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                IMAP SSL/TLS
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={config.smtpSecure}
                onChange={(e) => setConfig(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="smtpSecure" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                SMTP SSL/TLS
              </label>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Account
        </button>
      </div>
    </form>
  );
} 