import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link, 
  Paperclip, 
  Trash2, 
  Send,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';
import { useEmail } from '../../contexts/EmailContext';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { EmailDraft, EmailAccount } from '../../services/email/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Matching interfaces from EmailPage.tsx for clarity
interface ComposerReplyData {
  messageId: string;
  subject: string;
  to: string;
  body: string;
}

interface ComposerForwardData {
  messageId: string;
  subject: string;
  body: string;
}

interface ComposerReplyAllData {
  messageId: string;
  subject: string;
  to: string[];
  cc: string[];
  body: string;
}

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string | null;
  replyTo?: ComposerReplyData;
  forwardFrom?: ComposerForwardData;
  replyAllTo?: ComposerReplyAllData;
  draft?: EmailDraft;
  onSend?: (draft: EmailDraft) => void;
  onSaveDraft?: (draft: EmailDraft) => void;
}

function EmailComposerComponent({
  isOpen,
  onClose,
  accountId,
  replyTo,
  forwardFrom,
  replyAllTo,
  draft,
  onSend,
  onSaveDraft,
}: EmailComposerProps) {
  // console.log('[EmailComposer] Rendering FULL. isOpen:', isOpen, 'Props:', { accountId, replyTo, forwardFrom, replyAllTo, draft });
  // console.log('[EmailComposer] typeof onSend prop on render:', typeof onSend);
  // console.log('[EmailComposer] typeof onSaveDraft prop on render:', typeof onSaveDraft);

  // console.log('[EmailComposer] Before useEmail() call');
  const emailContextValue = useEmail();
  // console.log('[EmailComposer] Value returned by useEmail():', emailContextValue);

  const { selectedAccountId, accounts } = emailContextValue;
  // console.log('[EmailComposer] After destructuring. selectedAccountId:', selectedAccountId, 'accounts:', accounts);

  const getAccountEmail = useCallback(() => {
    if (accounts && Array.isArray(accounts)) {
      const account: EmailAccount | undefined = accounts.find(acc => acc.id === (accountId || selectedAccountId));
      return account?.email || 'fallback@example.com';
    } 
    console.error('[EmailComposer] Accounts not available or not an array');
    return 'error@example.com';
  }, [accounts, accountId, selectedAccountId]);
  
  const accountEmail = getAccountEmail();
  // console.log('[EmailComposer] accountEmail:', accountEmail);
  
  const [to, setTo] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  
  const [htmlMode, setHtmlMode] = useState<boolean>(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState<boolean>(false);
  const [showCc, setShowCc] = useState<boolean>(false);
  const [showBcc, setShowBcc] = useState<boolean>(false);
  const [recipientFieldsCollapsed, setRecipientFieldsCollapsed] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // console.log('[EmailComposer] useEffect triggered. isOpen:', isOpen, 'Dependencies:', { replyTo, forwardFrom, replyAllTo, draft });
    if (isOpen) {
      // console.log('[EmailComposer] useEffect - isOpen is true. Processing props.');
      if (replyAllTo) {
        // console.log('[EmailComposer] useEffect - replyAllTo data:', replyAllTo);
        setTo(replyAllTo.to.join(', '));
        setCc(replyAllTo.cc.join(', '));
        setSubject(replyAllTo.subject);
        setBody(replyAllTo.body);
        setShowCc(replyAllTo.cc.length > 0);
        setShowBcc(false);
      } else if (replyTo) {
        // console.log('[EmailComposer] useEffect - replyTo data:', replyTo);
        setTo(replyTo.to);
        setCc('');
        setSubject(replyTo.subject);
        setBody(replyTo.body);
        setShowCc(false);
        setShowBcc(false);
      } else if (forwardFrom) {
        // console.log('[EmailComposer] useEffect - forwardFrom data:', forwardFrom);
        setTo('');
        setCc('');
        setSubject(forwardFrom.subject);
        setBody(forwardFrom.body);
        setShowCc(false);
        setShowBcc(false);
      } else if (draft) {
        // console.log('[EmailComposer] useEffect - draft data:', draft);
        setTo((draft.to || []).join(', '));
        setCc((draft.cc || []).join(', '));
        setBcc((draft.bcc || []).join(', '));
        setSubject(draft.subject || '');
        setBody(draft.body || '');
        setShowCc(!!(draft.cc && draft.cc.length > 0));
        setShowBcc(!!(draft.bcc && draft.bcc.length > 0));
      } else {
        // console.log('[EmailComposer] useEffect - No specific action (new compose or cleared). Resetting fields.');
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        setShowCc(false);
        setShowBcc(false);
      }
      setAttachments([]);
      setAiSuggestion(null);
      // console.log('[EmailComposer] useEffect - Fields reset/populated.');
    } else {
      // console.log('[EmailComposer] useEffect - isOpen is false.');
    }
  }, [isOpen, replyTo, forwardFrom, replyAllTo, draft]);
  
  const applyFormatting = useCallback((command: string, value?: string) => {
    if (bodyTextareaRef.current) {
      document.execCommand(command, false, value);
      bodyTextareaRef.current.focus();
    }
  }, []);
  
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const validFiles = files.filter(file => file.size < 10 * 1024 * 1024);
      if (validFiles.length < files.length) {
        toast.warning('Some files were too large (max 10MB) and were not added.');
      }
      setAttachments(prev => [...prev, ...validFiles]);
    }
  }, [toast]);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = useCallback(async () => {
    setIsSending(true);
    setAiSuggestion(null);
    const draftToSend: EmailDraft = {
      id: draft?.id || uuidv4(),
      accountId: accountId || selectedAccountId || '',
      to: to.split(/[,;\s]+/).filter(Boolean),
      cc: cc.split(/[,;\s]+/).filter(Boolean),
      bcc: bcc.split(/[,;\s]+/).filter(Boolean),
      subject: subject,
      body: body,
      lastModified: new Date(),
    };
    
  console.log('[EmailComposer] Preparing to send:', draftToSend);
    if (onSend) {
      try {
        await onSend(draftToSend);
        toast.success('Email sent successfully!');
        onClose();
      } catch (error) {
        console.error('[EmailComposer] onSend failed:', error);
        toast.error('Failed to send email.');
      }
    } else {
      console.warn('[EmailComposer] onSend prop is missing!');
      toast.error('Send action not configured properly.');
      setTimeout(() => onClose(), 500);
    }
    setIsSending(false);
  }, [draft?.id, accountId, selectedAccountId, to, cc, bcc, subject, body, onSend, toast, onClose]);

  const handleSaveDraft = useCallback(async () => {
    const draftToSave: EmailDraft = {
      id: draft?.id || uuidv4(),
      accountId: accountId || selectedAccountId || '',
      to: to.split(/[,;\s]+/).filter(Boolean),
      cc: cc.split(/[,;\s]+/).filter(Boolean),
      bcc: bcc.split(/[,;\s]+/).filter(Boolean),
      subject: subject,
      body: body,
      lastModified: new Date(),
    };
    console.log('[EmailComposer] Preparing to save draft:', draftToSave);
    if (onSaveDraft) {
      try {
        await onSaveDraft(draftToSave);
        toast.success('Draft saved successfully!');
      } catch (error) {
        console.error('[EmailComposer] onSaveDraft failed:', error);
        toast.error('Failed to save draft.');
      }
    } else {
      console.warn('[EmailComposer] onSaveDraft prop is missing!');
      toast.error('Save draft action not configured.');
    }
  }, [draft?.id, accountId, selectedAccountId, to, cc, bcc, subject, body, onSaveDraft, toast]);

  const generateAiSuggestion = useCallback(async () => {
    setIsGeneratingSuggestion(true);
    setAiSuggestion(null);
    console.log('[EmailComposer] Generating AI suggestion...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAiSuggestion('Based on the content, here are some suggestions to improve your email.');
    setIsGeneratingSuggestion(false);
  }, []);

  const applyAiSuggestion = useCallback(() => {
    if (aiSuggestion) {
      setBody(prevBody => prevBody + '\n\n' + aiSuggestion);
      setAiSuggestion(null);
    }
  }, [aiSuggestion]);

  // Determine composer title dynamically
  const dialogTitle = useMemo(() => {
    if (replyTo) {
      return `Reply: ${replyTo.subject.substring(0,50)}...`;
    } else if (replyAllTo) {
      return `Reply All: ${replyAllTo.subject.substring(0,50)}...`;
    } else if (forwardFrom) {
      return `Forward: ${forwardFrom.subject.substring(0,50)}...`;
    } else if (draft?.subject) {
      return `Draft: ${draft.subject.substring(0,50)}...`;
    } else if (draft) {
      return 'Edit Draft';
    }
    return 'New Message';
  }, [replyTo, replyAllTo, forwardFrom, draft]);

  const handleDialogChange = useCallback((open: boolean) => {
    if (!open) {
      onClose();
    }
  }, [onClose]);

  // console.log('[EmailComposer] Before return statement FULL. Current state for render:', { to, subject, bodyLength: body.length });

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-4xl flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {draft ? 'Edit and send your saved email draft.' : 'Compose and send a new email.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 px-6 pt-4">
            {recipientFieldsCollapsed ? (
                <div className="flex items-center space-x-2 py-2 border-b border-t cursor-pointer mb-3" onClick={() => setRecipientFieldsCollapsed(false)}>
                    <Users className="h-4 w-4 mr-2 shrink-0 text-gray-500" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground truncate">
                            <span className="font-medium text-foreground">To:</span> {to || '[No recipients]'} 
                            {cc && <span className="ml-2"><span className="font-medium text-foreground">Cc:</span> {cc}</span>}
                        </div>
                        {subject && <div className="text-sm text-muted-foreground truncate"><span className="font-medium text-foreground">Subject:</span> {subject}</div>}
                        {!subject && <div className="text-sm text-muted-foreground italic">No subject</div>}
                    </div>
                    <ChevronDown className="h-5 w-5 ml-auto shrink-0 text-gray-500" />
                </div>
            ) : (
                <div className="border-b pb-3 space-y-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500 w-12 text-right shrink-0">From:</span>
                        <Input value={accountEmail} readOnly className="flex-1 min-w-0" />
                        <Button variant="ghost" size="icon" onClick={() => setRecipientFieldsCollapsed(true)} className="ml-auto shrink-0">
                            <ChevronUp className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500 w-12 text-right shrink-0">To:</span>
                        <Input placeholder="Recipients" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 min-w-0" />
                        <Button variant="ghost" size="sm" onClick={() => setShowCc(!showCc)} className="shrink-0">Cc</Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowBcc(!showBcc)} className="shrink-0">Bcc</Button>
                    </div>
                    {showCc && (
                        <div className="flex items-center space-x-2 pl-[56px]"> {/* 48px (w-12) + 8px (space-x-2) = 56px */}
                            <Input placeholder="Cc Recipients" value={cc} onChange={(e) => setCc(e.target.value)} className="flex-1 min-w-0" />
                        </div>
                    )}
                    {showBcc && (
                        <div className="flex items-center space-x-2 pl-[56px]">
                            <Input placeholder="Bcc Recipients" value={bcc} onChange={(e) => setBcc(e.target.value)} className="flex-1 min-w-0" />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500 w-12 text-right shrink-0">Subject:</span>
                        <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 min-w-0" />
                    </div>
                </div>
            )}

            <div className="border-t border-b py-2 px-0 flex items-center space-x-1 flex-wrap mt-3 mb-3">
                <Button variant="ghost" size="sm" onClick={() => applyFormatting('bold')}><Bold className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting('italic')}><Italic className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting('underline')}><Underline className="h-4 w-4" /></Button>
                <div className="border-l h-5 mx-1"></div>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                <div className="border-l h-5 mx-1"></div>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting('justifyLeft')}><AlignLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting('justifyCenter')}><AlignCenter className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting('justifyRight')}><AlignRight className="h-4 w-4" /></Button>
                <div className="border-l h-5 mx-1"></div>
                <Button variant="ghost" size="sm" onClick={handleFileSelect} disabled={isUploading}>
                    <Paperclip className="h-4 w-4" />
                </Button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    multiple 
                    style={{ display: 'none' }} 
                />
            </div>

            <Textarea 
                ref={bodyTextareaRef} 
                placeholder="Compose your email..." 
                className="flex-1 resize-none mt-3 mb-3" 
                value={body} 
                onChange={(e) => setBody(e.target.value)}
            />

            {attachments.length > 0 && (
                <div className="text-sm mb-3">
                    <h4 className="font-medium mb-1">Attachments:</h4>
                    <ul className="space-y-1">
                        {attachments.map((file, index) => (
                            <li key={index} className="flex items-center justify-between bg-muted/50 p-1 rounded">
                                <span className="truncate">{file.name} ({ (file.size / 1024).toFixed(1) } KB)</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeAttachment(index)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {isGeneratingSuggestion && ( <Spinner> Generating AI suggestion...</Spinner> )}
            {aiSuggestion && (
                <Card className="p-3 bg-blue-50 dark:bg-blue-900/30 mb-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">{aiSuggestion}</p>
                    <div className="mt-2 flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setAiSuggestion(null)}>Dismiss</Button>
                        <Button variant="default" size="sm" onClick={applyAiSuggestion}>Apply</Button>
                    </div>
                </Card>
            )}
        </div>

        <DialogFooter className="px-6 pb-4 border-t flex justify-between items-center">
             <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={generateAiSuggestion} disabled={isGeneratingSuggestion || isSending}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Assist
                </Button>
                <Button variant="outline" onClick={handleSaveDraft} disabled={isSending}>Save Draft</Button>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={onClose}>Discard</Button>
                <Button onClick={handleSendEmail} disabled={isSending || !to} className="btn-genie-primary">
                    {isSending ? <Spinner className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const EmailComposer = React.memo(EmailComposerComponent); 