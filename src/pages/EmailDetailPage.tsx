import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Reply, ReplyAll, Forward, Archive, Trash2, Star, MoreVertical, Download, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useEmail } from '../contexts/EmailContext';
import { EmailMessage } from '../services/email/types';
import emailServiceAdapter from '../services/email/EmailServiceAdapter';
import { toast } from 'sonner';
import { sanitizeHtml } from '../lib/sanitizer';

const EmailDetailPage = () => {
  const { accountId, folderId, messageId } = useParams<{
    accountId: string;
    folderId: string;
    messageId: string;
  }>();
  
  const navigate = useNavigate();
  const { messages, markAsRead, markAsUnread, moveToFolder, deleteMessage } = useEmail();
  
  const [email, setEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFullContent, setIsLoadingFullContent] = useState(false);

  const decodedAccountId = accountId ? decodeURIComponent(accountId) : '';
  const decodedFolderId = folderId ? decodeURIComponent(folderId) : 'INBOX';
  const decodedMessageId = messageId ? decodeURIComponent(messageId) : '';

  useEffect(() => {
    // Check if this was an accidental folder route collision (e.g. /email/folder/:accountId/[Gmail]/Sent Mail)
    const knownFolders = ['Sent Mail', 'Trash', 'Drafts', 'Spam', 'Starred', 'All Mail', 'Important', 'Inbox', 'INBOX'];
    if (
      decodedFolderId.toLowerCase() === '[gmail]' ||
      decodedFolderId.toLowerCase() === 'gmail' ||
      knownFolders.includes(decodedMessageId)
    ) {
      const fullFolder = decodedFolderId.toLowerCase().includes('gmail')
        ? `[Gmail]/${decodedMessageId}`
        : decodedMessageId;
      console.log('🔄 EmailDetailPage: Detected folder route instead of message, redirecting to folder:', fullFolder);
      navigate(`/email/folder/${decodedAccountId}/${encodeURIComponent(fullFolder)}`, { replace: true });
      return;
    }

    const loadEmail = async () => {
      if (!decodedAccountId || !decodedMessageId) {
        console.log('❌ EmailDetailPage: Missing required parameters', { decodedAccountId, decodedMessageId });
        setError('Invalid email parameters');
        setLoading(false);
        return;
      }

      console.log('📧 EmailDetailPage: Loading email with params:', { accountId: decodedAccountId, messageId: decodedMessageId });

      try {
        setLoading(true);
        // 1. Check current messages list from context
        const foundEmail = messages.find(m => m.id === decodedMessageId || m.id === messageId);
        
        console.log('📧 EmailDetailPage: Found email in messages list:', !!foundEmail);
        
        if (foundEmail) {
          console.log('✅ EmailDetailPage: Using email from messages list:', foundEmail.subject);
          setEmail(foundEmail);
          try {
            localStorage.setItem(`genieflow_cached_email_${foundEmail.id}`, JSON.stringify(foundEmail));
          } catch {}
          
          // If email body is empty or very short, fetch full content in background
          if (!foundEmail.body || foundEmail.body.length < 50) {
            console.log('📧 EmailDetailPage: Email body is short, attempting full content fetch...');
            setIsLoadingFullContent(true);
            
            try {
              const fullEmailResult = await emailServiceAdapter.getMessage(decodedAccountId, decodedMessageId);
              if (fullEmailResult?.message) {
                setEmail(fullEmailResult.message);
                try {
                  localStorage.setItem(`genieflow_cached_email_${decodedMessageId}`, JSON.stringify(fullEmailResult.message));
                } catch {}
              }
            } catch (fetchError) {
              console.warn('⚠️ EmailDetailPage: Could not fetch full email content:', fetchError);
            } finally {
              setIsLoadingFullContent(false);
            }
          }
        } else {
          // 2. Check localStorage cache
          let cached: EmailMessage | null = null;
          try {
            const raw = localStorage.getItem(`genieflow_cached_email_${decodedMessageId}`);
            if (raw) cached = JSON.parse(raw);
          } catch {}

          if (cached) {
            console.log('✅ EmailDetailPage: Loaded email from local cache:', cached.subject);
            setEmail(cached);
          } else {
            // 3. Try to fetch from emailServiceAdapter
            console.log('📧 EmailDetailPage: Email not in list or cache, fetching from service...');
            try {
              const emailResponse = await emailServiceAdapter.getMessage(decodedAccountId, decodedMessageId);
              if (emailResponse?.message) {
                console.log('✅ EmailDetailPage: Got email from service:', emailResponse.message.subject);
                setEmail(emailResponse.message);
                try {
                  localStorage.setItem(`genieflow_cached_email_${decodedMessageId}`, JSON.stringify(emailResponse.message));
                } catch {}
              } else {
                setError('Email message not found or could not be loaded.');
              }
            } catch (fetchError: any) {
              console.warn('⚠️ EmailDetailPage: Could not fetch email:', fetchError);
              setError('Email message not found or could not be loaded.');
            }
          }
        }
      } catch (err) {
        console.error('❌ EmailDetailPage: Error loading email:', err);
        setError('Failed to load email');
      } finally {
        setLoading(false);
      }
    };

    loadEmail();
  }, [decodedAccountId, decodedFolderId, decodedMessageId, messageId, messages, navigate]);

  const handleBack = () => {
    navigate(`/email/folder/${decodedAccountId}/${encodeURIComponent(decodedFolderId || 'INBOX')}`);
  };

  const handleReply = () => {
    if (!email) return;
    console.log('Reply to email:', email.id);
    navigate(`/email/folder/${decodedAccountId}/${encodeURIComponent(decodedFolderId || 'INBOX')}`, {
      state: {
        compose: true,
        replyTo: {
          messageId: email.id,
          subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
          to: email.from,
          body: `\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.body || ''}`
        }
      }
    });
  };

  const handleReplyAll = () => {
    if (!email) return;
    console.log('Reply all to email:', email.id);
    const allRecipients = [email.from, ...(Array.isArray(email.to) ? email.to : [email.to])];
    navigate(`/email/folder/${decodedAccountId}/${encodeURIComponent(decodedFolderId || 'INBOX')}`, {
      state: {
        compose: true,
        replyAllTo: {
          messageId: email.id,
          subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
          to: allRecipients,
          cc: email.cc || [],
          body: `\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.body || ''}`
        }
      }
    });
  };

  const handleForward = () => {
    if (!email) return;
    console.log('Forward email:', email.id);
    navigate(`/email/folder/${decodedAccountId}/${encodeURIComponent(decodedFolderId || 'INBOX')}`, {
      state: {
        compose: true,
        forwardFrom: {
          messageId: email.id,
          subject: email.subject.startsWith('Fwd: ') ? email.subject : `Fwd: ${email.subject}`,
          body: `\n\n--- Forwarded Message ---\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.body || ''}`
        }
      }
    });
  };

  const handleArchive = async () => {
    if (!email || !accountId) return;
    try {
      console.log('Archive email:', email.id);
      await moveToFolder(accountId, email.id, 'ALL_MAIL');
      toast.success('Email archived');
      handleBack();
    } catch (error) {
      console.error('Failed to archive email:', error);
      toast.error('Failed to archive email');
    }
  };

  const handleDelete = async () => {
    if (!email || !accountId) return;
    try {
      console.log('Delete email:', email.id);
      await deleteMessage(accountId, email.id);
      toast.success('Email deleted');
      handleBack();
    } catch (error) {
      console.error('Failed to delete email:', error);
      toast.error('Failed to delete email');
    }
  };

  const handleStar = async () => {
    if (!email || !accountId) return;
    try {
      console.log('Toggle star for email:', email.id);
      // For now, just update local state since we don't have star functionality in context
      setEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
      toast.success(email.starred ? 'Star removed' : 'Email starred');
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast.error('Failed to update star');
    }
  };

  const handleMarkAsRead = async () => {
    if (!email || !accountId) return;
    try {
      if (email.read) {
        await markAsUnread(accountId, email.id);
        setEmail(prev => prev ? { ...prev, read: false } : null);
        toast.success('Marked as unread');
      } else {
        await markAsRead(accountId, email.id);
        setEmail(prev => prev ? { ...prev, read: true } : null);
        toast.success('Marked as read');
      }
    } catch (error) {
      console.error('Failed to mark as read/unread:', error);
      toast.error('Failed to update read status');
    }
  };

  // Helper function to render email body
  const renderEmailBody = (body: string, bodyMimeType?: string) => {
    if (!body) return <p className="text-muted-foreground">No content available</p>;
    
    if (bodyMimeType === 'text/html' || body.includes('<html') || body.includes('<div') || body.includes('<p')) {
      // BASIC XSS PROTECTION: Remove script tags
      // NOTE: For production, we strongly recommend using a robust library like DOMPurify
      const sanitizedBody = sanitizeHtml(body);

      return (
        <div 
          className="prose max-w-none email-body-content"
          dangerouslySetInnerHTML={{ __html: sanitizedBody }}
        />
      );
    } else {
      return (
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {body}
        </p>
      );
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Loading email...</span>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">Email Not Found</h2>
        <p className="text-muted-foreground mb-4">{error || 'The requested email could not be loaded.'}</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold truncate">{email.subject}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReply}>
            <Reply className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReplyAll}>
            <ReplyAll className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleForward}>
            <Forward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleMarkAsRead}>
            {email.read ? 'Mark Unread' : 'Mark Read'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleStar}>
            <Star className={`h-4 w-4 ${email.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleArchive}>
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Email Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">{email.subject}</h1>
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{email.from}</span>
                  {!email.read && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Unread
                    </span>
                  )}
                  {email.starred && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                </div>
                {email.cc && email.cc.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    CC: {email.cc.join(', ')}
                  </div>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {new Date(email.date).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Attachments ({email.attachments.length})</h3>
              <div className="grid grid-cols-1 gap-2">
                {email.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{attachment.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {attachment.contentType} • {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : 'Size unknown'}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading Full Content */}
          {isLoadingFullContent && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Spinner className="h-4 w-4" />
              <span className="text-sm">Loading full email content...</span>
            </div>
          )}

          {/* Email Body */}
          <div className="mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              {renderEmailBody(email.body || email.snippet || '', email.bodyMimeType)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6 pt-6 border-t">
            <Button onClick={handleReply} className="btn-genie-primary">
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
            <Button variant="outline" onClick={handleReplyAll}>
              <ReplyAll className="h-4 w-4 mr-2" />
              Reply All
            </Button>
            <Button variant="outline" onClick={handleForward}>
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDetailPage; 