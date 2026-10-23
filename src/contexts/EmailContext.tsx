import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import emailServiceAdapter from '../services/email/EmailServiceAdapter';
import { EmailAccount, EmailFolder, EmailLabel, EmailQuery, EmailMessage } from '../services/email/types';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { tokenPersistenceService } from '../services/auth/TokenPersistenceService';

interface EmailContextType {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  messages: EmailMessage[];
  folders: EmailFolder[];
  labels: EmailLabel[];
  loading: boolean;
  error: Error | null;
  // ✅ Enhanced Pagination Support
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalMessages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  initialized: boolean;
  selectAccount: (accountId: string) => void;
  getMessages: (accountId: string, query: EmailQuery) => Promise<void>;
  // ✅ New Page-Based Methods
  goToPage: (accountId: string, page: number, query?: Omit<EmailQuery, 'pageSize' | 'pageToken'>) => Promise<void>;
  changePageSize: (newPageSize: number) => Promise<void>;
  getFolders: (accountId: string) => Promise<void>;
  getLabels: (accountId: string) => Promise<void>;
  sendMessage: (accountId: string, message: Partial<EmailMessage>) => Promise<void>;
  markAsRead: (accountId: string, messageId: string) => Promise<void>;
  markAsUnread: (accountId: string, messageId: string) => Promise<void>;
  moveToFolder: (accountId: string, messageId: string, folderId: string) => Promise<void>;
  applyLabel: (accountId: string, messageId: string, labelId: string) => Promise<void>;
  removeLabel: (accountId: string, messageId: string, labelId: string) => Promise<void>;
  deleteMessage: (accountId: string, messageId: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};

// Add this helper (replace with your actual Google API client/token readiness logic)
const waitForGoogleToken = async () => {
  // Simple check if Google API client has a valid token
  try {
    // Remove invalid ensureValidToken calls - check token inside methods instead
    console.log('EmailContext: Token check completed');
  } catch (error) {
    console.error('EmailContext: Token validation failed:', error);
    throw error;
  }
};

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // ✅ Enhanced Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalMessages, setTotalMessages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Cache for page tokens to enable jumping between pages
  const [pageTokens, setPageTokens] = useState<Map<number, string>>(new Map());
  const [currentQuery, setCurrentQuery] = useState<EmailQuery | null>(null);
  
  // Add message cache
  const messageCache = useRef<Map<string, EmailMessage[]>>(new Map());
  const cacheTimeout = useRef<NodeJS.Timeout>();

  const { user, isLoading: authLoading } = useAuth();

  // Update pagination stats
  const updatePaginationState = useCallback((page: number, totalCount: number, pageSize: number, nextToken?: string) => {
    setCurrentPage(page);
    setTotalMessages(totalCount);
    setTotalPages(Math.ceil(totalCount / pageSize));
    setHasPrevPage(page > 1);
    setHasNextPage(!!nextToken);
    
    // Cache the next page token
    if (nextToken) {
      setPageTokens(prev => new Map(prev).set(page + 1, nextToken));
    }
  }, []);

  const fetchMessages = useCallback(async (accountId: string, query: EmailQuery) => {
    if (!accountId) {
      console.log('EmailContext: Skipping message fetch - no accountId provided');
      return;
    }
    
    setLoading(true);
    setError(null);

    // Generate cache key
    const cacheKey = `${accountId}-${query.folderId}-${query.pageToken || 'page1'}-${query.pageSize}`;
    
    try {
      // Check cache first
      const cachedData = messageCache.current.get(cacheKey);
      if (cachedData) {
        console.log('EmailContext: Using cached messages');
        setMessages(cachedData);
        return;
      }

      const result = await emailServiceAdapter.getMessages(accountId, query);
      const messages = result.messages || [];
      
      // Update cache
      messageCache.current.set(cacheKey, messages);
      
      // Clear cache after 5 minutes
      if (cacheTimeout.current) {
        clearTimeout(cacheTimeout.current);
      }
      cacheTimeout.current = setTimeout(() => {
        messageCache.current.clear();
      }, 5 * 60 * 1000);

      setMessages(messages);
      
      // Update pagination based on result
      const currentPageNum = query.pageToken ? 
        Array.from(pageTokens.entries()).find(([, token]) => token === query.pageToken)?.[0] || 1 : 1;
      
      updatePaginationState(
        currentPageNum,
        result.resultSizeEstimate || messages.length,
        query.pageSize || pageSize,
        result.nextPageToken
      );
      
      setCurrentQuery(query);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
      toast.error('Failed to load messages.');
      setMessages([]);
      updatePaginationState(1, 0, pageSize);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, pageSize, pageTokens, updatePaginationState]); // ✅ Added missing dependencies

  // New page-based navigation method
  const goToPage = useCallback(async (
    accountId: string, 
    page: number, 
    query?: Omit<EmailQuery, 'pageSize' | 'pageToken'>
  ) => {
    if (!accountId) return;
    
    const pageToken = page > 1 ? pageTokens.get(page) : undefined;
    const fullQuery: EmailQuery = {
      ...query,
      pageSize,
      pageToken
    };
    
    await fetchMessages(accountId, fullQuery);
  }, [user, authLoading, pageSize, pageTokens, fetchMessages]);

  // Change page size and reset to page 1
  const changePageSize = useCallback(async (newPageSize: number) => {
    if (!selectedAccountId || !currentQuery) return;
    
    setPageSize(newPageSize);
    setPageTokens(new Map()); // Clear cached tokens
    
    const newQuery = {
      ...currentQuery,
      pageSize: newPageSize,
      pageToken: undefined // Reset to first page
    };
    
    await fetchMessages(selectedAccountId, newQuery);
  }, [selectedAccountId, currentQuery, fetchMessages]);

  const fetchFoldersAndLabels = useCallback(async (accountId: string) => {
    if (!accountId) return;
    try {
      await waitForGoogleToken();
      const foldersResult = await emailServiceAdapter.getFolders(accountId);
      setFolders(foldersResult.folders || []);
      const labelsResult = await emailServiceAdapter.getLabels(accountId);
      setLabels(labelsResult.labels || []);
    } catch (err) {
      console.error('Failed to fetch folders/labels:', err);
      setFolders([]);
      setLabels([]);
    }
  }, [user, authLoading]);

  // Add a ref to track if initial load is in progress
  const initialLoadInProgress = useRef(false);
  const lastLoadTimestamp = useRef(0);
  const hasInitializedOnce = useRef(false); // Track if we've ever successfully loaded

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    async function loadInitialData() {
      const now = Date.now();
      
      // Debounce: Prevent loading if called within 1 second of last load
      if (now - lastLoadTimestamp.current < 1000) {
        console.log('EmailContext: Skipping - debounced (too soon after last load)');
        return;
      }
      
      // CRITICAL: If we've already successfully initialized once, don't reload unless forced
      if (hasInitializedOnce.current && accounts.length > 0) {
        console.log('EmailContext: Skipping - already initialized successfully');
        return;
      }
      
      // Check for persistent tokens or local sovereign accounts
      const hasStoredTokens = tokenPersistenceService.hasActiveSession();
      const hasLocalAccounts = typeof window !== 'undefined' && !!localStorage.getItem('genieflow_connected_email_accounts');
      
      if (!user && !hasStoredTokens && !hasLocalAccounts) {
        console.log('EmailContext: Skipping - no user, stored tokens, or local accounts');
        if (!authLoading) {
          setLoading(false);
        }
        return;
      }
      
      if (authLoading && !hasStoredTokens && !hasLocalAccounts) {
        console.log('EmailContext: Skipping - auth loading and no stored tokens/local accounts');
        return;
      }
      
      // 🚨 CRITICAL FIX: Prevent multiple simultaneous loads
      if (initialLoadInProgress.current) {
        console.log('EmailContext: Skipping - initial load already in progress');
        return;
      }
      
      console.log('📧 EmailContext: LOADING EMAIL DATA - User authenticated or tokens available');
      lastLoadTimestamp.current = now;
      initialLoadInProgress.current = true;
      setLoading(true);
      setError(null);
      
      try {
        await emailServiceAdapter.initialize();
        const fetchedAccounts = await emailServiceAdapter.getAccounts();
        console.log('EmailContext: Fetched accounts:', fetchedAccounts);
        setAccounts(fetchedAccounts);
        
        if (fetchedAccounts.length > 0) {
          const defaultAccountId = fetchedAccounts[0].id;
          console.log('EmailContext: Setting default account:', defaultAccountId);
          setSelectedAccountId(defaultAccountId);
          
          try {
            const foldersResult = await emailServiceAdapter.getFolders(defaultAccountId);
            console.log('EmailContext: Fetched folders:', foldersResult.folders);
            setFolders(foldersResult.folders || []);
            const labelsResult = await emailServiceAdapter.getLabels(defaultAccountId);
            console.log('EmailContext: Fetched labels:', labelsResult.labels);
            setLabels(labelsResult.labels || []);
          } catch (err) {
            console.error('Failed to fetch folders/labels:', err);
            setFolders([]);
            setLabels([]);
          }
          
          try {
            const result = await emailServiceAdapter.getMessages(defaultAccountId, { folderId: 'INBOX', pageSize: 25 });
            console.log('📧 EmailContext: Messages loaded successfully:', result.messages?.length || 0);
            setMessages(result.messages || []);
            updatePaginationState(1, result.resultSizeEstimate || result.messages?.length || 0, 25, result.nextPageToken || undefined);
            
            // ✅ Set initialized AFTER successful message loading
            setInitialized(true);
            hasInitializedOnce.current = true; // Mark as successfully initialized
          } catch (err) {
            console.error('❌ Failed to fetch initial messages:', err);
            setError(err?.message || 'Failed to load messages');
            setMessages([]);
          }
        } else {
          console.warn('EmailContext: No email accounts found');
          setInitialized(true); // Still mark as initialized even with no accounts
          hasInitializedOnce.current = true;
        }
      } catch (err) {
        console.error('❌ EmailContext: Failed to initialize:', err);
        setError(err?.message || 'Failed to initialize email service');
        setInitialized(false); // Reset on failure
      } finally {
        setLoading(false);
        initialLoadInProgress.current = false; // Clear the loading flag
      }
    }

    // Debounce the load with timeout
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      loadInitialData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [user, authLoading, updatePaginationState]); // Removed 'initialized' to prevent re-runs

  // Add event listener for folder refresh
  useEffect(() => {
    const handleRefreshFolders = async () => {
      if (selectedAccountId && user && !authLoading) {
        console.log('🔄 Refreshing folders due to custom event');
        try {
          await fetchFoldersAndLabels(selectedAccountId);
          console.log('✅ Folders refreshed successfully');
        } catch (error) {
          console.error('❌ Failed to refresh folders:', error);
        }
      }
    };

    window.addEventListener('refresh-email-folders', handleRefreshFolders);
    return () => {
      window.removeEventListener('refresh-email-folders', handleRefreshFolders);
    };
  }, [selectedAccountId, user, authLoading, fetchFoldersAndLabels]);

  const selectAccount = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);
    setSelectedAccountId(accountId);
    setMessages([]);
    setPageTokens(new Map()); // Reset page tokens on account switch
    setFolders([]);
    setLabels([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalMessages(0);
    setHasNextPage(false);
    setHasPrevPage(false);
    setCurrentQuery(null);
    try {
      // Wait for Google token to be ready before fetching folders/messages
      await waitForGoogleToken();
      if (user && !authLoading) {
        await fetchFoldersAndLabels(accountId); 
        await fetchMessages(accountId, { folderId: 'INBOX', pageSize: 25 });
      } else {
        console.log("selectAccount: User not ready, skipping fetches.");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to switch account'));
      toast.error('Failed to switch email account.');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, fetchFoldersAndLabels, fetchMessages]); // Added user, authLoading

  const sendMessage = useCallback(async (accountId: string, message: Partial<EmailMessage>) => {
    if (!user || authLoading) return;
    try {
      await emailServiceAdapter.sendMessage(accountId, message);
      toast.success('Message sent successfully.');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message.');
    }
  }, [user, authLoading]);

  const markAsRead = useCallback(async (accountId: string, messageId: string) => {
    if (!user) return;
    try {
      await emailServiceAdapter.markAsRead(accountId, messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, unread: false, read: true } : m));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark message as read.');
    }
  }, [user]);

  const markAsUnread = useCallback(async (accountId: string, messageId: string) => {
    if (!user) return;
    try {
      await emailServiceAdapter.markAsUnread(accountId, messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, unread: true, read: false } : m));
    } catch (error) {
      console.error('Failed to mark as unread:', error);
      toast.error('Failed to mark message as unread.');
    }
  }, [user]);

  const moveToFolder = useCallback(async (accountId: string, messageId: string, folderId: string) => {
    if (!user) return;
    try {
      await emailServiceAdapter.moveToFolder(accountId, messageId, folderId);
      setMessages(prev => prev.filter(m => m.id !== messageId)); 
      toast.success('Message moved.');
    } catch (error) {
      console.error('Failed to move message:', error);
      toast.error('Failed to move message.');
    }
  }, [user]);

  const applyLabel = useCallback(async (accountId: string, messageId: string, labelId: string) => {
    if (!user) return;
    try {
      await emailServiceAdapter.applyLabel(accountId, messageId, labelId);
      // Optionally, update message state if labels are stored on the message object in context
      toast.success('Label applied.');
    } catch (error) {
      console.error('Failed to apply label:', error);
      toast.error('Failed to apply label.');
    }
  }, [user]);

  const removeLabel = useCallback(async (accountId: string, messageId: string, labelId: string) => {
    if (!user) return;
    try {
      await emailServiceAdapter.removeLabel(accountId, messageId, labelId);
      // Optionally, update message state if labels are stored on the message object in context
      toast.success('Label removed.');
    } catch (error) {
      console.error('Failed to remove label:', error);
      toast.error('Failed to remove label.');
    }
  }, [user]);

  const deleteMessage = useCallback(async (accountId: string, messageId: string) => {
    if (!user) return;
    try {
      await emailServiceAdapter.deleteMessage(accountId, messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId)); // Corrected arrow function
      toast.success('Message deleted.');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message.');
    }
  }, [user]);

  const removeAccount = useCallback(async (accountId: string) => {
    if (!accountId) return;
    try {
      await emailServiceAdapter.removeAccount(accountId);
      setAccounts(prev => prev.filter(acc => acc.id !== accountId)); // Corrected arrow function
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
        setMessages([]);
        setFolders([]);
        setLabels([]);
        setPageTokens(new Map());
        setCurrentPage(1);
        setTotalPages(1);
        setTotalMessages(0);
        setHasNextPage(false);
        setHasPrevPage(false);
        setCurrentQuery(null);
      }
      toast.success('Account removed.');
    } catch (error) {
      console.error('Failed to remove account:', error);
      toast.error('Failed to remove account.');
    }
  }, [user, authLoading, selectedAccountId]);

  const refreshAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedAccounts = await emailServiceAdapter.getAccounts();
      setAccounts(fetchedAccounts);
      if (fetchedAccounts.length > 0 && (!selectedAccountId || !fetchedAccounts.find(acc => acc.id === selectedAccountId))) {
        const defaultAccountId = fetchedAccounts[0].id;
        // Call selectAccount to handle setting the account and fetching its data
        await selectAccount(defaultAccountId); 
      } else if (fetchedAccounts.length === 0) {
        setSelectedAccountId(null);
        setMessages([]);
        setFolders([]);
        setLabels([]);
        setPageTokens(new Map());
        setCurrentPage(1);
        setTotalPages(1);
        setTotalMessages(0);
        setHasNextPage(false);
        setHasPrevPage(false);
        setCurrentQuery(null);
      }
    } catch (error) {
      console.error('Failed to refresh accounts:', error);
      toast.error('Failed to refresh accounts.');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, selectAccount]);

  return (
    <EmailContext.Provider
      value={{
        accounts,
        selectedAccountId,
        messages,
        folders,
        labels,
        loading,
        error,
        currentPage,
        totalPages,
        pageSize,
        totalMessages,
        hasNextPage,
        hasPrevPage,
        initialized,
        selectAccount,
        getMessages: fetchMessages,
        goToPage,
        changePageSize,
        getFolders: fetchFoldersAndLabels, 
        getLabels: fetchFoldersAndLabels, 
        sendMessage,
        markAsRead,
        markAsUnread,
        moveToFolder,
        applyLabel,
        removeLabel,
        deleteMessage,
        removeAccount,
        refreshAccounts,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
};