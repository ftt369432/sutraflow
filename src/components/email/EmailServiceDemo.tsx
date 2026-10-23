import React, { useState, useEffect } from 'react';
import { emailService } from '../../services/email';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { IMAPConfig } from '../../components/email/IMAPConfigForm';

export function EmailServiceDemo() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For IMAP connection
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [imapSecure, setImapSecure] = useState(true);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [provider, setProvider] = useState<'outlook' | 'yahoo' | 'aol' | 'custom'>('custom');
  
  useEffect(() => {
    // Load saved accounts on mount
    const loadAccounts = async () => {
      try {
        const savedAccounts = localStorage.getItem('email_accounts');
        if (savedAccounts) {
          setAccounts(JSON.parse(savedAccounts));
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load accounts:', err);
        setError('Failed to load accounts');
        setLoading(false);
      }
    };
    
    loadAccounts();
  }, []);
  
  const handleAddIMAPAccount = async () => {
    try {
      setLoading(true);
      
      const config: IMAPConfig = {
        email,
        password,
        imapHost,
        imapPort,
        imapSecure,
        smtpHost,
        smtpPort,
        smtpSecure,
        provider
      };
      
      const account = await emailService.addIMAPAccount(config);
      setAccounts([...accounts, account]);
      
      // Reset form
      setEmail('');
      setPassword('');
      setImapHost('');
      setSmtpHost('');
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to add IMAP account:', err);
      setError('Failed to add IMAP account');
      setLoading(false);
    }
  };
  
  const handleRemoveAccount = async (accountId: string) => {
    try {
      setLoading(true);
      await emailService.removeAccount(accountId);
      setAccounts(accounts.filter(acc => acc.id !== accountId));
      setLoading(false);
    } catch (err) {
      console.error('Failed to remove account:', err);
      setError('Failed to remove account');
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div>
              <p>EmailService instance is available.</p>
              <p>Connected accounts: {accounts.length}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Add IMAP Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddIMAPAccount(); }}>
            <div>
              <label className="block mb-1">Email Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'outlook' | 'yahoo' | 'aol' | 'custom')}
                className="w-full p-2 border rounded"
              >
                <option value="custom">Custom</option>
                <option value="outlook">Outlook</option>
                <option value="yahoo">Yahoo</option>
                <option value="aol">AOL</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-1">Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
              />
            </div>
            
            <div>
              <label className="block mb-1">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            
            {provider === 'custom' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">IMAP Server</label>
                    <Input 
                      value={imapHost} 
                      onChange={e => setImapHost(e.target.value)} 
                      placeholder="imap.example.com" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">IMAP Port</label>
                    <Input 
                      type="number" 
                      value={imapPort} 
                      onChange={e => setImapPort(parseInt(e.target.value))} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">SMTP Server</label>
                    <Input 
                      value={smtpHost} 
                      onChange={e => setSmtpHost(e.target.value)} 
                      placeholder="smtp.example.com" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">SMTP Port</label>
                    <Input 
                      type="number" 
                      value={smtpPort} 
                      onChange={e => setSmtpPort(parseInt(e.target.value))} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="imapSecure" 
                      checked={imapSecure} 
                      onChange={e => setImapSecure(e.target.checked)} 
                      className="mr-2" 
                    />
                    <label htmlFor="imapSecure">IMAP SSL/TLS</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="smtpSecure" 
                      checked={smtpSecure} 
                      onChange={e => setSmtpSecure(e.target.checked)} 
                      className="mr-2" 
                    />
                    <label htmlFor="smtpSecure">SMTP SSL/TLS</label>
                  </div>
                </div>
              </>
            )}
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p>No accounts connected.</p>
          ) : (
            <ul className="space-y-4">
              {accounts.map(account => (
                <li key={account.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{account.email}</p>
                    <p className="text-sm text-gray-500">Type: {account.type}</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRemoveAccount(account.id)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 