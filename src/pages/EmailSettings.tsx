import React, { useState, useEffect } from 'react';
import { EmailAccountConnect } from '../components/email/EmailAccountConnect';
import { useEmail } from '../contexts/EmailContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { Switch } from '../components/ui/Switch';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Separator } from '../components/ui/Separator';
import { toast } from 'sonner';
import { Spinner } from '../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { Trash2Icon } from 'lucide-react';

interface EmailAccountWithProvider extends Record<string, any> {
  id: string;
  email: string;
  provider?: 'google' | 'imap';
  name?: string;
}

interface EmailPreferencesType {
  defaultSignatureId?: string;
  defaultReplySignatureId?: string;
  sendAndArchive: boolean;
  confirmBeforeSending: boolean;
  defaultFontFamily: string;
  defaultFontSize: number;
  defaultComposeFormat: 'plain' | 'rich';
  showSnippets: boolean;
  autoAdvance: 'newer' | 'older' | 'none';
  messageDisplay: 'default' | 'compact' | 'comfortable';
  inlineImages: boolean;
  starredPosition: 'left' | 'right';
  keyboard: { shortcuts: boolean };
  notifications: {
    desktop: boolean;
    sound: boolean;
    browserTab: boolean;
    priority: 'all' | 'important' | 'none';
  };
}

interface SignatureType {
  id: string;
  name: string;
  content: string;
  created: Date;
  lastModified: Date;
}

export default function EmailSettingsPage() {
  const navigate = useNavigate();
  const {
    accounts,
    selectedAccountId,
    selectAccount,
    removeAccount,
    loading: emailContextLoading,
  } = useEmail();
  const { user, isLoading: authLoading } = useAuth();

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("accounts");
  
  const initialPreferences: EmailPreferencesType = {
    sendAndArchive: false,
    confirmBeforeSending: true,
    defaultFontFamily: 'Arial',
    defaultFontSize: 14,
    defaultComposeFormat: 'rich',
    showSnippets: true,
    autoAdvance: 'newer',
    messageDisplay: 'default',
    inlineImages: true,
    starredPosition: 'left',
    keyboard: { shortcuts: true },
    notifications: {
      desktop: true,
      sound: true,
      browserTab: true,
      priority: 'important'
    }
  };
  const [preferences, setPreferences] = useState<EmailPreferencesType>(initialPreferences);
  
  const initialSignatures: SignatureType[] = [
    {
      id: 'default-signature',
      name: 'Default Signature',
      content: 'Best regards,\n[Your Name]',
      created: new Date(), 
      lastModified: new Date()
    }
  ];
  const [signatures, setSignatures] = useState<SignatureType[]>(initialSignatures);
  const [currentSignature, setCurrentSignature] = useState<SignatureType | null>(signatures.length > 0 ? signatures[0] : null);
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate, accounts, emailContextLoading]);

  useEffect(() => {
    if (selectedAccountId) {
      const storedPrefs = localStorage.getItem(`email_preferences_${selectedAccountId}`);
      if (storedPrefs) {
        try { setPreferences(JSON.parse(storedPrefs)); } 
        catch (e) { console.error('Failed to parse preferences:', e); setPreferences(initialPreferences); }
      }
      const storedSigs = localStorage.getItem(`email_signatures_${selectedAccountId}`);
      if (storedSigs) {
        try { 
          const parsedSigs: SignatureType[] = JSON.parse(storedSigs).map((sig: any) => ({ 
            ...sig, 
            created: new Date(sig.created), 
            lastModified: new Date(sig.lastModified) 
          }));
          setSignatures(parsedSigs); 
          if (parsedSigs.length > 0) {
            const defaultSigId = preferences.defaultSignatureId || parsedSigs[0].id;
            setCurrentSignature(parsedSigs.find(s => s.id === defaultSigId) || parsedSigs[0]);
          }
        } 
        catch (e) { console.error('Failed to parse signatures:', e); setSignatures(initialSignatures); }
      }
    }
  }, [selectedAccountId, preferences.defaultSignatureId]);

  const handleConnectionStart = () => { setConnectionStatus('connecting'); setConnectionErrorMessage(null); };
  const handleConnectionSuccess = () => { 
    setConnectionStatus('success'); 
    toast.success('Email account connected successfully!');
  };
  const handleConnectionError = (error: string) => { setConnectionStatus('error'); setConnectionErrorMessage(error); toast.error(error); };

  const handleRemoveAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to remove this account? This action cannot be undone.')) {
      await removeAccount(accountId);
    }
  };

  const handleAccountSelect = (accountId: string) => {
    selectAccount(accountId);
    setActiveTab('preferences');
  };

  const savePreferences = () => {
    if (!selectedAccountId) { toast.error("No account selected to save preferences."); return; }
    localStorage.setItem(`email_preferences_${selectedAccountId}`, JSON.stringify(preferences));
    toast.success('Preferences saved successfully');
  };

  const createNewSignature = () => {
    const newSignature: SignatureType = {
      id: `sig-${Date.now()}`,
      name: 'New Signature',
      content: '',
      created: new Date(),
      lastModified: new Date()
    };
    setSignatures(prev => [...prev, newSignature]);
    setCurrentSignature(newSignature);
    setIsEditingSignature(true);
  };

  const saveSignature = () => {
    if (!currentSignature || !selectedAccountId) return;
    const updatedSignatures = signatures.map(sig => 
      sig.id === currentSignature.id 
        ? {...currentSignature, lastModified: new Date()} 
        : sig
    );
    setSignatures(updatedSignatures);
    localStorage.setItem(`email_signatures_${selectedAccountId}`, JSON.stringify(updatedSignatures));
    setIsEditingSignature(false);
    toast.success('Signature saved successfully');
  };

  const deleteSignature = (id: string) => {
    if (!selectedAccountId) return;
    if (window.confirm('Are you sure you want to delete this signature?')) {
      const updatedSignatures = signatures.filter(sig => sig.id !== id);
      setSignatures(updatedSignatures);
      if (currentSignature?.id === id) {
        setCurrentSignature(updatedSignatures.length > 0 ? updatedSignatures[0] : null);
      }
      localStorage.setItem(`email_signatures_${selectedAccountId}`, JSON.stringify(updatedSignatures));
      toast.success('Signature deleted successfully');
    }
  };
  
  if (authLoading) {
    return <div className="p-8 text-center"><Spinner /></div>;
  }
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-muted-foreground mb-4">Please log in to access email settings.</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Email Settings</h1>
      
      <Tabs defaultValue="accounts" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="signatures">Signatures</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your connected email accounts or add a new one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailContextLoading && accounts.length === 0 && <Spinner />}
              {!emailContextLoading && accounts.length === 0 && (
                <p className="text-muted-foreground">No email accounts connected yet.</p>
              )}
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {accounts.map(account => {
                  const typedAccount = account as EmailAccountWithProvider;
                  return (
                    <Card key={typedAccount.id} className={`p-4 border ${selectedAccountId === typedAccount.id ? 'border-primary' : ''}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${selectedAccountId === typedAccount.id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <h3 className="font-medium break-all">{typedAccount.name || typedAccount.email}</h3>
                            <p className="text-sm text-muted-foreground">
                              Status: {typedAccount.connected ? <span className="text-green-600">Connected</span> : <span className="text-red-600">Disconnected</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                          {selectedAccountId !== typedAccount.id ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAccountSelect(typedAccount.id)}
                            >
                              Manage
                            </Button>
                          ) : (
                             <Button variant="default" size="sm" disabled>Selected</Button> 
                          )}
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAccount(typedAccount.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Connect New Account</CardTitle>
                <CardDescription>
                    Add a new Google or IMAP email account.
                    {connectionStatus === 'connecting' && <Spinner className="ml-2 inline" />}
                    {connectionErrorMessage && <p className="text-red-500 text-sm mt-2">{connectionErrorMessage}</p>}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <EmailAccountConnect
                onConnectionStart={handleConnectionStart}
                onConnectionSuccess={handleConnectionSuccess}
                onConnectionError={handleConnectionError}
                />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-6">
          {!selectedAccountId ? (
            <Card className="p-6 text-center">
                <CardTitle>No Account Selected</CardTitle>
                <CardDescription className="mt-2">Please select an account from the 'Accounts' tab to manage its preferences.</CardDescription>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>Display Settings for {accounts.find(a=>a.id === selectedAccountId)?.email}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="pref-defaultComposeFormat">Default compose format</Label>
                        <Select 
                          value={preferences.defaultComposeFormat}
                          onValueChange={(value: string) => 
                              setPreferences({...preferences, defaultComposeFormat: value as 'plain' | 'rich'})
                          }
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="plain">Plain text</SelectItem>
                            <SelectItem value="rich">Rich text (HTML)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="pref-defaultFontFamily">Default font</Label>
                        <Select 
                          value={preferences.defaultFontFamily}
                          onValueChange={(value) => 
                              setPreferences({...preferences, defaultFontFamily: value})
                          }
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="pref-defaultFontSize">Font size</Label>
                        <Select 
                          value={preferences.defaultFontSize.toString()}
                          onValueChange={(value) => 
                              setPreferences({...preferences, defaultFontSize: parseInt(value)})
                          }
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10pt</SelectItem>
                            <SelectItem value="12">12pt</SelectItem>
                            <SelectItem value="14">14pt</SelectItem>
                            <SelectItem value="16">16pt</SelectItem>
                            <SelectItem value="18">18pt</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="pref-messageDisplay">Message display density</Label>
                        <Select 
                          value={preferences.messageDisplay}
                          onValueChange={(value: string) => 
                              setPreferences({...preferences, messageDisplay: value as 'default' | 'compact' | 'comfortable'})
                          }
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select density" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="comfortable">Comfortable</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                        <Label htmlFor="pref-showSnippets" className="cursor-pointer">Show message snippets</Label>
                        <p className="text-sm text-muted-foreground">
                            Display a preview of the message content in the inbox
                        </p>
                        </div>
                        <Switch
                        id="pref-showSnippets"
                        checked={preferences.showSnippets}
                        onCheckedChange={(checked) => 
                            setPreferences({...preferences, showSnippets: checked})
                        }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                        <Label htmlFor="pref-inlineImages">Display inline images</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically display images in emails
                        </p>
                        </div>
                        <Switch
                        id="pref-inlineImages"
                        checked={preferences.inlineImages}
                        onCheckedChange={(checked) => 
                            setPreferences({...preferences, inlineImages: checked})
                        }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                        <Label htmlFor="pref-keyboardShortcuts">Keyboard shortcuts</Label>
                        <p className="text-sm text-muted-foreground">
                            Enable keyboard shortcuts for common actions
                        </p>
                        </div>
                        <Switch
                        id="pref-keyboardShortcuts"
                        checked={preferences.keyboard.shortcuts}
                        onCheckedChange={(checked) => 
                            setPreferences({
                            ...preferences, 
                            keyboard: { ...preferences.keyboard, shortcuts: checked }
                            })
                        }
                        />
                    </div>
                    </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Notification Settings for {accounts.find(a=>a.id === selectedAccountId)?.email}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                        <Label htmlFor="pref-desktopNotifications">Desktop notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive notifications for new emails
                        </p>
                        </div>
                        <Switch
                        id="pref-desktopNotifications"
                        checked={preferences.notifications.desktop}
                        onCheckedChange={(checked) => 
                            setPreferences({
                            ...preferences, 
                            notifications: { ...preferences.notifications, desktop: checked }
                            })
                        }
                        />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                        <Label htmlFor="pref-soundNotifications">Sound notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Play a sound when new emails arrive
                        </p>
                        </div>
                        <Switch
                        id="pref-soundNotifications"
                        checked={preferences.notifications.sound}
                        onCheckedChange={(checked) => 
                            setPreferences({
                            ...preferences, 
                            notifications: { ...preferences.notifications, sound: checked }
                            })
                        }
                        />
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        <Label htmlFor="pref-notificationPriority">Notification priority</Label>
                        <Select 
                          value={preferences.notifications.priority}
                          onValueChange={(value: string) => 
                              setPreferences({
                              ...preferences, 
                              notifications: { ...preferences.notifications, priority: value as 'all' | 'important' | 'none' }
                              })
                          }
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All messages</SelectItem>
                            <SelectItem value="important">Important only</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    </div>
                </CardContent>
              </Card>

              <div className="flex justify-end mt-6">
                <Button onClick={savePreferences} className="btn-genie-primary">
                  Save Preferences
                </Button>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="signatures" className="space-y-6">
          {!selectedAccountId ? (
             <Card className="p-6 text-center">
                <CardTitle>No Account Selected</CardTitle>
                <CardDescription className="mt-2">Please select an account from the 'Accounts' tab to manage its signatures.</CardDescription>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-xl font-semibold">Email Signatures for {accounts.find(a=>a.id === selectedAccountId)?.email}</h2>
                <Button onClick={createNewSignature} className="btn-genie-primary self-start sm:self-center">
                  Add New Signature
                </Button>
              </div>
              
              {signatures.length === 0 && !isEditingSignature ? (
                <Card className="p-6 text-center">
                    <CardTitle>No Signatures</CardTitle>
                    <CardDescription className="mt-2">You haven't created any signatures for this account yet. Click 'Add New Signature' to create one.</CardDescription>
                </Card>
              ) : (
                <div className="grid md:grid-cols-5 gap-6">
                    <div className="md:col-span-2">
                    <Card className="p-4 h-full">
                        <h3 className="font-medium mb-4 text-lg">My Signatures</h3>
                        <div className="space-y-2">
                        {signatures.map(signature => (
                            <div 
                            key={signature.id}
                            className={`p-3 rounded-md cursor-pointer flex justify-between items-center transition-colors ${ 
                                currentSignature?.id === signature.id && !isEditingSignature ? 'bg-primary/10 border border-primary text-primary' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => {
                                setCurrentSignature(signature);
                                setIsEditingSignature(false);
                            }}
                            >
                            <span className="truncate font-medium">{signature.name}</span>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); deleteSignature(signature.id); }}
                            >
                                <Trash2Icon className="h-4 w-4" />
                            </Button>
                            </div>
                        ))}
                        </div>
                    </Card>
                    </div>
                    
                    <div className="md:col-span-3">
                    <Card className="p-6 h-full">
                        {currentSignature ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                            <h3 className="font-medium text-lg">{isEditingSignature ? 'Edit Signature' : currentSignature.name}</h3>
                            {!isEditingSignature && (
                                <Button variant="outline" onClick={() => setIsEditingSignature(true)}>Edit</Button>
                            )}
                            </div>
                            
                            {isEditingSignature ? (
                            <div className="space-y-4">
                                <div>
                                <Label htmlFor="sig-name">Signature Name</Label>
                                <Input
                                    id="sig-name"
                                    value={currentSignature.name}
                                    onChange={(e) => setCurrentSignature(prev => prev ? {...prev, name: e.target.value} : null)}
                                />
                                </div>
                                <div>
                                <Label htmlFor="sig-content">Signature Content</Label>
                                <Textarea
                                    id="sig-content"
                                    value={currentSignature.content}
                                    onChange={(e) => setCurrentSignature(prev => prev ? {...prev, content: e.target.value} : null)}
                                    rows={8}
                                    placeholder="Enter your signature content here. HTML is supported."
                                />
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => {setIsEditingSignature(false); /* Revert changes or re-fetch current sig */ }}>Cancel</Button>
                                <Button onClick={saveSignature} className="btn-genie-primary">Save Signature</Button>
                                </div>
                            </div>
                            ) : (
                            <div className="space-y-4">
                                <div className="p-4 border rounded-md whitespace-pre-line bg-muted/30 min-h-[100px]" dangerouslySetInnerHTML={{ __html: currentSignature.content || '<em class="text-muted-foreground">No content</em>' }}>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                Last modified: {new Date(currentSignature.lastModified).toLocaleString()}
                                </p>
                                <div className="pt-2 flex gap-2">
                                <Button 
                                    variant="outline"
                                    onClick={() => {
                                    if (!selectedAccountId) return;
                                    setPreferences(prev => ({...prev, defaultSignatureId: currentSignature.id}));
                                    toast.success(`${currentSignature.name} set as default signature`);
                                    }}
                                    disabled={preferences.defaultSignatureId === currentSignature.id}
                                >
                                    {preferences.defaultSignatureId === currentSignature.id ? 'Default' : 'Set as Default'}
                                </Button>
                                </div>
                            </div>
                            )}
                        </div>
                        ) : (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                            <p className="text-muted-foreground">Select a signature to view or edit, or create a new one.</p>
                        </div>
                        )}
                    </Card>
                    </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 