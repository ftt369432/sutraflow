/**
 * 📧 SOVEREIGN EMAIL & IMAP BACKEND ENGINE
 * 
 * Handles IMAP folder browsing, message fetching, UID pagination,
 * RFC822 parsing via mailparser, and SMTP dispatch via nodemailer.
 * Can be mounted directly inside Vite dev server (server.middlewares.use)
 * or run standalone.
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export interface StoredImapAccount {
  id: string;
  userId: string;
  email: string;
  name?: string;
  provider: 'imap';
  imapConfig: {
    host: string;
    port: number;
    useSSL: boolean;
  };
  smtpConfig: {
    host: string;
    port: number;
    useSSL: boolean;
  };
  credentials: {
    password?: string;
  };
  connected: boolean;
  lastSynced: Date;
  createdAt: Date;
}

// In-memory active accounts cache
const activeAccounts: Map<string, StoredImapAccount> = new Map();

/**
 * Helper to resolve IMAP account from memory or stateless base64 header
 */
function resolveAccount(req: Request): StoredImapAccount | null {
  const accountId = req.params.accountId;
  
  // 1. Check in-memory accounts map
  if (accountId && activeAccounts.has(accountId)) {
    return activeAccounts.get(accountId)!;
  }

  // 2. Check stateless header 'x-imap-config'
  const imapConfigHeader = req.headers['x-imap-config'] as string | undefined;
  if (imapConfigHeader) {
    try {
      const raw = JSON.parse(Buffer.from(imapConfigHeader, 'base64').toString('utf8'));
      const account: StoredImapAccount = {
        id: accountId || uuidv4(),
        userId: 'sovereign-user',
        email: raw.email,
        name: raw.name || raw.email,
        provider: 'imap',
        imapConfig: {
          host: raw.imapHost,
          port: Number(raw.imapPort) || 993,
          useSSL: raw.useSSL !== false
        },
        smtpConfig: {
          host: raw.smtpHost,
          port: Number(raw.smtpPort) || 587,
          useSSL: raw.useSSL !== false
        },
        credentials: {
          password: raw.password
        },
        connected: true,
        lastSynced: new Date(),
        createdAt: new Date()
      };
      // Cache for subsequent calls
      if (account.id) {
        activeAccounts.set(account.id, account);
      }
      return account;
    } catch (e) {
      console.error('[EmailBackend] Failed to parse x-imap-config header:', e);
    }
  }

  return null;
}

/**
 * Determine folder category/type
 */
function determineFolderType(name: string, attribs: string[] = []): 'system' | 'user' {
  const lower = name.toLowerCase();
  const lowerAttribs = attribs.map(a => a.toLowerCase());
  
  if (lower === 'inbox' || lowerAttribs.includes('\\inbox')) return 'system';
  if (lower.includes('sent') || lowerAttribs.includes('\\sent')) return 'system';
  if (lower.includes('draft') || lowerAttribs.includes('\\drafts')) return 'system';
  if (lower.includes('trash') || lower.includes('bin') || lowerAttribs.includes('\\trash')) return 'system';
  if (lower.includes('spam') || lower.includes('junk') || lowerAttribs.includes('\\junk')) return 'system';
  if (lower.includes('archive') || lowerAttribs.includes('\\all') || lowerAttribs.includes('\\archive')) return 'system';
  
  return 'user';
}

export function createEmailApp() {
  const app = express();
  
  // JSON Body Parser with 25MB limit for attachments
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // CORS middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-imap-config');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  /**
   * Health check / Diagnostic
   */
  app.get('/api/email/health', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      service: 'GenieFlow Sovereign Email & IMAP Service',
      activeAccountsCount: activeAccounts.size,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Sovereign File System API for browser / web mode
   */
  app.get('/api/fs/list', (req: Request, res: Response) => {
    try {
      let targetPath = (req.query.path as string) || '';
      if (!targetPath || targetPath === 'AI_GENERATED_DOCS') {
        targetPath = path.resolve(process.cwd(), 'AI_GENERATED_DOCS');
      }
      if (/^[a-zA-Z]:$/.test(targetPath)) {
        targetPath = `${targetPath}\\`;
      }
      if (!fs.existsSync(targetPath)) {
        return res.json({ success: false, error: 'Path not found', files: [] });
      }
      const stat = fs.statSync(targetPath);
      if (!stat.isDirectory()) {
        return res.json({ success: false, error: 'Not a directory', files: [] });
      }
      const entries = fs.readdirSync(targetPath, { withFileTypes: true });
      const files = entries.map(entry => {
        const fullPath = path.join(targetPath, entry.name);
        let size = 0;
        let lastModified = '';
        try {
          if (!entry.isDirectory()) {
            const fStat = fs.statSync(fullPath);
            size = fStat.size;
            lastModified = fStat.mtime.toISOString();
          }
        } catch (_e) {}
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size,
          lastModified
        };
      });
      res.json({ success: true, files });
    } catch (err: any) {
      res.json({ success: false, error: err.message, files: [] });
    }
  });

  app.get('/api/fs/read', (req: Request, res: Response) => {
    try {
      const targetPath = (req.query.path as string) || '';
      if (!targetPath || !fs.existsSync(targetPath)) {
        return res.json({ success: false, error: 'File not found' });
      }
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        return res.json({ success: false, error: 'Target is a directory' });
      }
      const content = fs.readFileSync(targetPath, 'utf8');
      res.json({ success: true, content });
    } catch (err: any) {
      res.json({ success: false, error: err.message });
    }
  });

  /**
   * Connect & Verify IMAP/SMTP Account
   */
  app.post('/api/email/connect', async (req: Request, res: Response) => {
    const { email, password, imapHost, imapPort, smtpHost, smtpPort, useSSL, name } = req.body;

    if (!email || !password || !imapHost) {
      return res.status(400).json({ error: 'Email address, password, and IMAP host are required.' });
    }

    // Google App Passwords are 16 characters often copied with spaces (e.g. "abcd efgh ijkl mnop")
    const cleanPassword = (imapHost.toLowerCase().includes('gmail') || imapHost.toLowerCase().includes('google'))
      ? password.replace(/\s+/g, '')
      : password.trim();

    console.log(`[EmailBackend] Testing IMAP connection for ${email} @ ${imapHost}:${imapPort || 993}`);

    try {
      // 1. Verify IMAP Credentials & Connection
      const portNum = Number(imapPort) || 993;
      const isSsl = useSSL !== false;

      const imap = new Imap({
        user: email,
        password: cleanPassword,
        host: imapHost,
        port: portNum,
        tls: isSsl,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 15000,
        connTimeout: 15000
      });

      await new Promise<void>((resolve, reject) => {
        let isDone = false;
        const cleanup = () => {
          if (!isDone) {
            isDone = true;
            try {
              if (imap.state && imap.state !== 'disconnected') {
                imap.end();
              }
            } catch (_) {}
          }
        };

        imap.once('ready', () => {
          console.log(`[EmailBackend] IMAP connection verified successfully for ${email}`);
          cleanup();
          resolve();
        });

        imap.once('error', (err: any) => {
          console.error(`[EmailBackend] IMAP connection error for ${email}:`, err);
          cleanup();
          let msg = err.message || 'IMAP connection failed';
          const errMsg = (err.message || '').toLowerCase();
          if (errMsg.includes('application-specific password required') || err.textCode === 'ALERT') {
            msg = 'Google requires a 16-character App Password (not your standard account password). Please generate one at https://myaccount.google.com/apppasswords and paste it here.';
          } else if (err.textCode === 'AUTHENTICATIONFAILED' || errMsg.includes('invalid credentials')) {
            if (imapHost.toLowerCase().includes('gmail') || imapHost.toLowerCase().includes('google')) {
              msg = 'Google authentication failed. Please generate a fresh 16-character App Password at https://myaccount.google.com/apppasswords (ensure 2-Step Verification is ON) and try again.';
            } else {
              msg = 'Authentication failed. Please verify your email and password.';
            }
          }
          reject(new Error(msg));
        });

        try {
          imap.connect();
        } catch (e: any) {
          cleanup();
          reject(new Error(e.message || 'Could not initiate IMAP connection'));
        }
      });

      // 2. Verify SMTP Connection (if SMTP host provided)
      if (smtpHost) {
        const smtpPortNum = Number(smtpPort) || 587;
        console.log(`[EmailBackend] Testing SMTP connection for ${email} @ ${smtpHost}:${smtpPortNum}`);
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPortNum,
            secure: smtpPortNum === 465,
            auth: { user: email, pass: cleanPassword },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 10000
          });
          await transporter.verify();
          console.log(`[EmailBackend] SMTP connection verified successfully for ${email}`);
        } catch (smtpErr: any) {
          console.warn(`[EmailBackend] SMTP verification warning (inbox will still work):`, smtpErr.message);
        }
      }

      // 3. Register Account in Cache
      const accountId = uuidv4();
      const account: StoredImapAccount = {
        id: accountId,
        userId: 'sovereign-user',
        email,
        name: name || email,
        provider: 'imap',
        imapConfig: {
          host: imapHost,
          port: portNum,
          useSSL: isSsl
        },
        smtpConfig: {
          host: smtpHost || `smtp.${email.split('@')[1]}`,
          port: Number(smtpPort) || 587,
          useSSL: isSsl
        },
        credentials: {
          password: cleanPassword
        },
        connected: true,
        lastSynced: new Date(),
        createdAt: new Date()
      };

      activeAccounts.set(accountId, account);

      return res.status(200).json({
        accountId,
        email,
        name: account.name,
        connected: true,
        provider: 'imap',
        message: 'IMAP connection established successfully.'
      });

    } catch (error: any) {
      console.error('[EmailBackend] Connection failed:', error.message);
      return res.status(400).json({
        error: error.message || 'Failed to connect to email server. Please check your credentials.'
      });
    }
  });

  /**
   * List Registered Accounts
   */
  app.get('/api/email/accounts', (_req: Request, res: Response) => {
    const list = Array.from(activeAccounts.values()).map(acc => ({
      id: acc.id,
      email: acc.email,
      name: acc.name,
      provider: acc.provider,
      connected: acc.connected,
      lastSynced: acc.lastSynced,
      imapConfig: acc.imapConfig,
      smtpConfig: acc.smtpConfig
    }));
    res.json({ accounts: list });
  });

  /**
   * Fetch Mailbox Folders
   */
  app.get('/api/email/:accountId/folders', async (req: Request, res: Response) => {
    const account = resolveAccount(req);
    if (!account) {
      return res.status(404).json({ error: 'Account not found or credentials missing.' });
    }

    console.log(`[EmailBackend] Fetching folders for ${account.email}`);

    try {
      const imap = new Imap({
        user: account.email,
        password: account.credentials.password,
        host: account.imapConfig.host,
        port: account.imapConfig.port,
        tls: account.imapConfig.useSSL,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 15000,
        connTimeout: 15000
      });

      const folders = await new Promise<any[]>((resolve, reject) => {
        let isDone = false;
        const cleanup = () => {
          if (!isDone) {
            isDone = true;
            try {
              if (imap.state && imap.state !== 'disconnected') {
                imap.end();
              }
            } catch (_) {}
          }
        };

        imap.once('ready', () => {
          imap.getBoxes((err, boxes) => {
            cleanup();
            if (err) return reject(err);

            const result: any[] = [];
            function traverse(boxesObj: Imap.MailBoxes, prefix = '') {
              for (const [name, box] of Object.entries(boxesObj)) {
                const folderPath = prefix ? `${prefix}${box.delimiter}${name}` : name;
                const isNoSelect = box.attribs?.some(a => a.toLowerCase() === '\\noselect');
                if (!isNoSelect) {
                  result.push({
                    id: folderPath,
                    name: name,
                    path: folderPath,
                    type: determineFolderType(name, box.attribs),
                    unreadCount: 0,
                    totalCount: 0
                  });
                }
                if (box.children) {
                  traverse(box.children, folderPath);
                }
              }
            }

            traverse(boxes);
            resolve(result);
          });
        });

        imap.once('error', (err: Error) => {
          cleanup();
          reject(err);
        });

        imap.connect();
      });

      // Ensure INBOX is at top of folder list
      folders.sort((a, b) => {
        if (a.name.toUpperCase() === 'INBOX') return -1;
        if (b.name.toUpperCase() === 'INBOX') return 1;
        return a.name.localeCompare(b.name);
      });

      res.json({ folders });

    } catch (error: any) {
      console.error('[EmailBackend] Error fetching folders:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch folders' });
    }
  });

  /**
   * Fetch Messages from Folder
   */
  app.get('/api/email/:accountId/messages', async (req: Request, res: Response) => {
    const account = resolveAccount(req);
    if (!account) {
      return res.status(404).json({ error: 'Account not found or credentials missing.' });
    }

    const { folderId = 'INBOX', limit = '25', pageToken } = req.query;
    const numLimit = Math.min(Math.max(parseInt(limit as string, 10) || 25, 1), 100);
    const offset = pageToken ? parseInt(pageToken as string, 10) || 0 : 0;

    console.log(`[EmailBackend] Fetching messages from '${folderId}' (limit: ${numLimit}, offset: ${offset}) for ${account.email}`);

    try {
      const imap = new Imap({
        user: account.email,
        password: account.credentials.password,
        host: account.imapConfig.host,
        port: account.imapConfig.port,
        tls: account.imapConfig.useSSL,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 20000,
        connTimeout: 20000
      });

      const { messages, nextPageToken, totalCount } = await new Promise<{
        messages: any[];
        nextPageToken: string | null;
        totalCount: number;
      }>((resolve, reject) => {
        let isDone = false;
        const cleanup = () => {
          if (!isDone) {
            isDone = true;
            try {
              if (imap.state && imap.state !== 'disconnected') {
                imap.end();
              }
            } catch (_) {}
          }
        };

        imap.once('ready', () => {
          imap.openBox(String(folderId), true, (err, box) => {
            if (err) {
              cleanup();
              return reject(err);
            }

            const total = box.messages?.total || 0;
            if (total === 0) {
              cleanup();
              return resolve({ messages: [], nextPageToken: null, totalCount: 0 });
            }

            imap.search(['ALL'], (searchErr, uids) => {
              if (searchErr) {
                cleanup();
                return reject(searchErr);
              }

              if (!uids || uids.length === 0) {
                cleanup();
                return resolve({ messages: [], nextPageToken: null, totalCount: 0 });
              }

              // Sort newest first
              uids.sort((a, b) => b - a);

              const pageUids = uids.slice(offset, offset + numLimit);
              if (pageUids.length === 0) {
                cleanup();
                return resolve({ messages: [], nextPageToken: null, totalCount: uids.length });
              }

              const fetchedMessages: any[] = [];
              const f = imap.fetch(pageUids, {
                bodies: ['HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE MESSAGE-ID)', 'TEXT', ''],
                struct: true
              });

              f.on('message', (msg) => {
                let headerBuffer = '';
                let rawBuffer = '';
                let msgAttributes: any = null;

                msg.on('body', (stream, info) => {
                  stream.on('data', (chunk) => {
                    if (info.which.includes('HEADER')) {
                      headerBuffer += chunk.toString('utf8');
                    } else {
                      rawBuffer += chunk.toString('utf8');
                    }
                  });
                });

                msg.once('attributes', (attrs) => {
                  msgAttributes = attrs;
                });

                msg.once('end', () => {
                  const uid = msgAttributes?.uid;
                  const flags = msgAttributes?.flags || [];
                  const isRead = flags.some((fl: string) => fl.toLowerCase() === '\\seen');
                  const isStarred = flags.some((fl: string) => fl.toLowerCase() === '\\flagged');

                  // Header parsing fallback
                  let parsedHeader: any = {};
                  try {
                    if (headerBuffer) {
                      parsedHeader = Imap.parseHeader(headerBuffer);
                    }
                  } catch (_) {}

                  const fallbackSubject = parsedHeader.subject ? parsedHeader.subject[0] : '(No Subject)';
                  const fallbackFrom = parsedHeader.from ? parsedHeader.from[0] : 'Unknown';
                  const fallbackTo = parsedHeader.to ? parsedHeader.to.join(', ') : '';
                  const fallbackDate = parsedHeader.date ? new Date(parsedHeader.date[0]).toISOString() : new Date().toISOString();

                  // Attempt full parse with mailparser
                  const parseContent = rawBuffer || headerBuffer;
                  const messagePromise = simpleParser(parseContent)
                    .then((parsed) => {
                      const snippet = (parsed.text || '').replace(/\s+/g, ' ').trim().slice(0, 150);
                      const bodyHtml = parsed.html || parsed.textAsHtml || '';
                      const bodyText = parsed.text || '';

                      return {
                        id: String(uid),
                        threadId: String(uid),
                        subject: parsed.subject || fallbackSubject,
                        from: parsed.from?.text || fallbackFrom,
                        to: parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map(t => t.text).join(', ') : parsed.to.text) : fallbackTo,
                        date: parsed.date ? parsed.date.toISOString() : fallbackDate,
                        snippet,
                        body: bodyHtml || bodyText || '(No Content)',
                        bodyHtml,
                        bodyText,
                        read: isRead,
                        starred: isStarred,
                        labels: isRead ? [] : ['UNREAD'],
                        attachments: (parsed.attachments || []).map((att) => ({
                          id: att.cid || att.filename || uuidv4(),
                          filename: att.filename || 'attachment',
                          contentType: att.contentType,
                          size: att.size
                        }))
                      };
                    })
                    .catch((parseErr) => {
                      console.warn(`[EmailBackend] mailparser error for message ${uid}:`, parseErr.message);
                      return {
                        id: String(uid),
                        threadId: String(uid),
                        subject: fallbackSubject,
                        from: fallbackFrom,
                        to: fallbackTo,
                        date: fallbackDate,
                        snippet: rawBuffer.slice(0, 150),
                        body: rawBuffer,
                        read: isRead,
                        starred: isStarred,
                        labels: isRead ? [] : ['UNREAD'],
                        attachments: []
                      };
                    });

                  fetchedMessages.push(messagePromise);
                });
              });

              f.once('error', (fetchErr) => {
                cleanup();
                reject(fetchErr);
              });

              f.once('end', async () => {
                cleanup();
                try {
                  const resolvedMessages = await Promise.all(fetchedMessages);
                  // Sort newest first
                  resolvedMessages.sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));

                  const hasMore = offset + pageUids.length < uids.length;
                  const token = hasMore ? String(offset + numLimit) : null;

                  resolve({
                    messages: resolvedMessages,
                    nextPageToken: token,
                    totalCount: uids.length
                  });
                } catch (resErr) {
                  reject(resErr);
                }
              });
            });
          });
        });

        imap.once('error', (err: Error) => {
          cleanup();
          reject(err);
        });

        imap.connect();
      });

      res.json({
        messages,
        nextPageToken,
        resultSizeEstimate: totalCount
      });

    } catch (error: any) {
      console.error('[EmailBackend] Error fetching messages:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch messages' });
    }
  });

  /**
   * Fetch Single Message Details
   */
  app.get('/api/email/:accountId/messages/:messageId', async (req: Request, res: Response) => {
    const account = resolveAccount(req);
    if (!account) {
      return res.status(404).json({ error: 'Account not found or credentials missing.' });
    }

    const { messageId } = req.params;
    const { folderId = 'INBOX' } = req.query;

    console.log(`[EmailBackend] Fetching single message UID ${messageId} from '${folderId}'`);

    try {
      const imap = new Imap({
        user: account.email,
        password: account.credentials.password,
        host: account.imapConfig.host,
        port: account.imapConfig.port,
        tls: account.imapConfig.useSSL,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 15000,
        connTimeout: 15000
      });

      const message = await new Promise<any>((resolve, reject) => {
        let isDone = false;
        const cleanup = () => {
          if (!isDone) {
            isDone = true;
            try {
              if (imap.state && imap.state !== 'disconnected') {
                imap.end();
              }
            } catch (_) {}
          }
        };

        imap.once('ready', () => {
          imap.openBox(String(folderId), true, (err) => {
            if (err) {
              cleanup();
              return reject(err);
            }

            const f = imap.fetch([parseInt(messageId, 10)], {
              bodies: [''],
              struct: true
            });

            let fullRaw = '';
            let msgAttributes: any = null;

            f.on('message', (msg) => {
              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  fullRaw += chunk.toString('utf8');
                });
              });
              msg.once('attributes', (attrs) => {
                msgAttributes = attrs;
              });
            });

            f.once('error', (fetchErr) => {
              cleanup();
              reject(fetchErr);
            });

            f.once('end', async () => {
              cleanup();
              if (!fullRaw) {
                return resolve(null);
              }

              try {
                const parsed = await simpleParser(fullRaw);
                const isRead = msgAttributes?.flags?.some((fl: string) => fl.toLowerCase() === '\\seen');
                const isStarred = msgAttributes?.flags?.some((fl: string) => fl.toLowerCase() === '\\flagged');

                resolve({
                  id: messageId,
                  threadId: messageId,
                  subject: parsed.subject || '(No Subject)',
                  from: parsed.from?.text || 'Unknown',
                  to: parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map(t => t.text).join(', ') : parsed.to.text) : '',
                  date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                  snippet: (parsed.text || '').replace(/\s+/g, ' ').trim().slice(0, 150),
                  body: parsed.html || parsed.textAsHtml || parsed.text || '',
                  bodyHtml: parsed.html || parsed.textAsHtml || '',
                  bodyText: parsed.text || '',
                  read: isRead,
                  starred: isStarred,
                  attachments: (parsed.attachments || []).map((att) => ({
                    id: att.cid || att.filename || uuidv4(),
                    filename: att.filename || 'attachment',
                    contentType: att.contentType,
                    size: att.size
                  }))
                });
              } catch (parseErr) {
                reject(parseErr);
              }
            });
          });
        });

        imap.once('error', (err: Error) => {
          cleanup();
          reject(err);
        });

        imap.connect();
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json({ message });

    } catch (error: any) {
      console.error('[EmailBackend] Error fetching message:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch message' });
    }
  });

  /**
   * Send Email via SMTP
   */
  app.post('/api/email/:accountId/send', async (req: Request, res: Response) => {
    const account = resolveAccount(req);
    if (!account) {
      return res.status(404).json({ error: 'Account not found or credentials missing.' });
    }

    const { to, cc, bcc, subject, body, text, attachments } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Recipient (to) and subject are required.' });
    }

    console.log(`[EmailBackend] Sending email from ${account.email} to ${to}`);

    try {
      const transporter = nodemailer.createTransport({
        host: account.smtpConfig.host,
        port: account.smtpConfig.port,
        secure: account.smtpConfig.port === 465,
        auth: {
          user: account.email,
          pass: account.credentials.password
        },
        tls: { rejectUnauthorized: false }
      });

      const info = await transporter.sendMail({
        from: `"${account.name || account.email}" <${account.email}>`,
        to,
        cc,
        bcc,
        subject,
        html: body,
        text: text || body?.replace(/<[^>]*>?/gm, ''),
        attachments: attachments || []
      });

      console.log(`[EmailBackend] Email sent successfully. MessageId: ${info.messageId}`);
      res.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
      console.error('[EmailBackend] Error sending email:', error);
      res.status(500).json({ error: error.message || 'Failed to send email' });
    }
  });

  /**
   * Mark Message as Read / Unread
   */
  app.post('/api/email/:accountId/messages/:messageId/read', async (req: Request, res: Response) => {
    const account = resolveAccount(req);
    if (!account) {
      return res.status(404).json({ error: 'Account not found or credentials missing.' });
    }

    const { messageId } = req.params;
    const { folderId = 'INBOX', isRead = true } = req.body;

    try {
      const imap = new Imap({
        user: account.email,
        password: account.credentials.password,
        host: account.imapConfig.host,
        port: account.imapConfig.port,
        tls: account.imapConfig.useSSL,
        tlsOptions: { rejectUnauthorized: false }
      });

      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox(String(folderId), false, (err) => { // false = read-write
            if (err) { imap.end(); return reject(err); }

            const uid = parseInt(messageId, 10);
            const flagAction = isRead ? imap.addFlags.bind(imap) : imap.delFlags.bind(imap);

            flagAction(uid, ['\\Seen'], (flagErr) => {
              imap.end();
              if (flagErr) return reject(flagErr);
              resolve();
            });
          });
        });

        imap.once('error', (err: Error) => reject(err));
        imap.connect();
      });

      res.json({ success: true, messageId, isRead });

    } catch (error: any) {
      console.error('[EmailBackend] Error updating read flag:', error);
      res.status(500).json({ error: error.message || 'Failed to update message flags' });
    }
  });

  /**
   * Delete Message
   */
  app.delete('/api/email/:accountId/messages/:messageId', async (req: Request, res: Response) => {
    const account = resolveAccount(req);
    if (!account) {
      return res.status(404).json({ error: 'Account not found or credentials missing.' });
    }

    const { messageId } = req.params;
    const { folderId = 'INBOX' } = req.query;

    try {
      const imap = new Imap({
        user: account.email,
        password: account.credentials.password,
        host: account.imapConfig.host,
        port: account.imapConfig.port,
        tls: account.imapConfig.useSSL,
        tlsOptions: { rejectUnauthorized: false }
      });

      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox(String(folderId), false, (err) => {
            if (err) { imap.end(); return reject(err); }

            const uid = parseInt(messageId, 10);
            imap.addFlags(uid, ['\\Deleted'], (flagErr) => {
              if (flagErr) { imap.end(); return reject(flagErr); }
              imap.expunge((expErr) => {
                imap.end();
                if (expErr) return reject(expErr);
                resolve();
              });
            });
          });
        });

        imap.once('error', (err: Error) => reject(err));
        imap.connect();
      });

      res.json({ success: true, messageId, message: 'Message deleted successfully.' });

    } catch (error: any) {
      console.error('[EmailBackend] Error deleting message:', error);
      res.status(500).json({ error: error.message || 'Failed to delete message' });
    }
  });

  /**
   * Remove Account
   */
  app.delete('/api/email/accounts/:accountId', (req: Request, res: Response) => {
    const { accountId } = req.params;
    activeAccounts.delete(accountId);
    res.json({ success: true, message: 'Account removed from active session.' });
  });

  return app;
}

export const emailApp = createEmailApp();
export default emailApp;
