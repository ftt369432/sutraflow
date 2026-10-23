// Load polyfills FIRST to fix browser compatibility issues
import './polyfills.ts';

// Configure PDF worker FIRST before any other imports
import './lib/pdfWorkerSetup.ts';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/globals.css';
import './styles/grid-layout.css';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SupabaseProvider } from './providers/SupabaseProvider';
import { ThemeProvider, EmailProvider } from './contexts';
import { services } from './services/core/initializeServices';
import { AuthProvider } from './contexts/AuthContext';
import { TooltipProvider } from "./components/ui/Tooltip";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase'; // Fixed import path
import { initializeAIService } from './services/ai/aiService'; // Import initializeAIService
import { autoInitializeKnowledgeBase } from './services/knowledgeBaseInitService'; // Import knowledge base init
import { autoSeedDemoData } from './services/demo/autoSeedDemoData';


// Initialize AI Service with Supabase client
initializeAIService(supabase);

// Inject comprehensive demo test data (Calendar, Auto-tasking, Subtasks, Swarms, Docs)
autoSeedDemoData();

// Initialize Knowledge Base in background
autoInitializeKnowledgeBase().catch(error => {
  console.warn('[Main] Knowledge base initialization deferred:', error);
});

// Define and export ServicesContext here
export const ServicesContext = React.createContext(services);

// Create root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Create root
const root = ReactDOM.createRoot(rootElement);

// Suppress development warnings for better performance
const suppressedWarnings = [
  'React Router Future Flag Warning',
  'Cannot update a component',
  'setState() call inside',
  'PDF worker',
  'PDF text extraction',
  'Setting up fake worker',
  'Word document extraction',
  'GlobalWorkerOptions',
  'No Supabase provider token',
  'No access token available',
  'Google API Client initialized'
];

const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const message = String(args[0] || '');
  if (suppressedWarnings.some(warning => message.includes(warning))) return;
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const message = String(args[0] || '');
  const suppressedErrors = [
    ...suppressedWarnings,
    'Failed to fetch dynamically imported module',
    'Mammoth extraction failed',
    'Could not find the body element',
    'PDF Error Boundary',
    'API version',
    'Worker version',
    'UnknownErrorException',
    'pdf.worker',
    'idpiframe_initialization_failed',
    'EmailService: Failed to fetch'
  ];
  if (suppressedErrors.some(error => message.includes(error))) return;
  originalError.apply(console, args);
};

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Render app
root.render(
  // Disabled React.StrictMode to prevent duplicate chat bubbles in production
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SupabaseProvider>
        <ServicesContext.Provider value={services}>
          <AuthProvider>
            <EmailProvider>
              <DndProvider backend={HTML5Backend}>
                <TooltipProvider>
                  <HelmetProvider>
                    <App />
                    <Toaster />
                  </HelmetProvider>
                </TooltipProvider>
              </DndProvider>
            </EmailProvider>
          </AuthProvider>
        </ServicesContext.Provider>
      </SupabaseProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// GLOBAL AUTO-FIX: Link documents to Legal Eagle assistant
// This runs after the app initializes to ensure AI chat references work
// DISABLED AUTO-FIX TO PREVENT INFINITE LOOPS
/*
setTimeout(() => {
  const globalAutoFix = () => {
    try {
      // @ts-ignore - Access global store
      const knowledgeStore = window?.useKnowledgeBaseStore?.getState?.();
      
      if (!knowledgeStore) {
        console.log('🔄 Global auto-fix: Knowledge Base store not ready, will retry...');
        return false;
      }

      const docs = knowledgeStore.documents || [];
      const assistants = knowledgeStore.assistants || [];
      
      if (docs.length === 0 || assistants.length === 0) {
        console.log('🔄 Global auto-fix: Data not loaded yet, will retry...');
        return false;
      }

      // Find Legal Eagle assistant
      const legalEagle = assistants.find((a: any) => 
        a.name.includes('Legal') || 
        a.id === '6060b777-66f1-42c9-aa5c-80c91145a9c8'
      );
      
      if (!legalEagle) {
        console.log('❌ Global auto-fix: Legal Eagle assistant not found');
        return true; // Stop retrying
      }
      
      // Link ALL documents to Legal Eagle
      let linkedCount = 0;
      docs.forEach((doc: any) => {
        if (!doc.assistantIds?.includes(legalEagle.id)) {
          linkedCount++;
          doc.assistantIds = [...(doc.assistantIds || []), legalEagle.id];
        }
      });
      
      if (linkedCount > 0) {
        // Use the store's setDocuments method properly
        knowledgeStore.setDocuments([...docs]);
        console.log(`🎉 GLOBAL AUTO-FIX SUCCESS: Linked ${linkedCount} documents to Legal Eagle!`);
        console.log('📋 AI chat references should now appear at the bottom of responses');
        localStorage.setItem('GLOBAL_DOCUMENT_LINKS_FIXED', 'true');
      } else {
        console.log('ℹ️ Global auto-fix: All documents already linked');
        localStorage.setItem('GLOBAL_DOCUMENT_LINKS_FIXED', 'true');
      }
      
      return true; // Success, stop retrying
      
    } catch (error) {
      console.error('❌ Global auto-fix error:', error);
      return false; // Retry
    }
  };

  // Retry logic
  const maxRetries = 10;
  let retryCount = 0;
  
  const retryFix = () => {
    if (localStorage.getItem('GLOBAL_DOCUMENT_LINKS_FIXED') === 'true') {
      console.log('📋 Global auto-fix: Already completed this session');
      return;
    }
    
    const success = globalAutoFix();
    
    if (!success && retryCount < maxRetries) {
      retryCount++;
      console.log(`🔄 Global auto-fix: Retry ${retryCount}/${maxRetries} in 2 seconds...`);
      setTimeout(retryFix, 2000);
    }
  };
  
  retryFix();
}, 3000); // Start after 3 seconds to ensure app is loaded
*/

// ========================================
// AUTOMATED AVATAR FIX
// ========================================
setTimeout(() => {
  console.log('🤖 Initializing automated avatar fix...');

  // Enhanced avatar upload handler
  function createAvatarHandler(assistantId) {
    return async function (event) {
      const file = event.target.files?.[0];
      if (!file) return;

      console.log('📷 Auto-processing avatar for assistant:', assistantId);

      // Validate
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large. Please use a smaller image.');
        return;
      }

      try {
        // Create loading indicator
        const loadingEl = document.createElement('div');
        loadingEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; z-index: 9999; font-family: system-ui; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        loadingEl.textContent = '🔄 Uploading avatar...';
        document.body.appendChild(loadingEl);

        // Resize image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const resizedImage = await new Promise((resolve, reject) => {
          img.onload = () => {
            const maxSize = 150;
            let { width, height } = img;

            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file);
        });

        // Save via multiple methods
        let saved = false;

        // Method 1: Try assistant store
        try {
          const store = window.useAssistantStore?.getState?.();
          if (store?.updateAssistant) {
            await store.updateAssistant(assistantId, { avatar: resizedImage });
            await store.fetchAssistants();
            saved = true;
            console.log('✅ Avatar saved via assistant store');
          }
        } catch (error) {
          console.warn('Store method failed:', error);
        }

        // Method 2: Try direct Supabase
        if (!saved && window.supabase) {
          try {
            const { error } = await window.supabase
              .from('assistants')
              .update({ avatar: resizedImage })
              .eq('id', assistantId);

            if (!error) {
              saved = true;
              console.log('✅ Avatar saved via Supabase');
            }
          } catch (error) {
            console.warn('Supabase method failed:', error);
          }
        }

        // Update UI
        loadingEl.textContent = saved ? '✅ Avatar saved successfully!' : '❌ Save failed';
        loadingEl.style.background = saved ? '#10b981' : '#ef4444';

        if (saved) {
          // Update avatar display immediately
          const avatarImages = document.querySelectorAll('img[alt*="Avatar"], img[src*="avatar"], img[alt*="assistant"]');
          avatarImages.forEach(imgElement => {
            const img = imgElement as HTMLImageElement;
            const newSrc = resizedImage as string;
            if (img.src !== newSrc) {
              img.src = newSrc;
            }
          });

          // Refresh page after a delay to show the saved avatar
          setTimeout(() => {
            console.log('🔄 Auto-refreshing to show new avatar...');
            location.reload();
          }, 1500);
        }

        // Remove loading indicator
        setTimeout(() => loadingEl.remove(), 3000);

      } catch (error) {
        console.error('❌ Avatar upload failed:', error);
        alert('Avatar upload failed: ' + error.message);
      }
    };
  }

  // Auto-attach to avatar inputs
  function autoAttachAvatarHandlers() {
    const avatarInputs = document.querySelectorAll('input[type="file"][accept*="image"]:not([data-auto-handled])');

    // Only process if there are actual inputs to handle
    if (avatarInputs.length === 0) {
      return;
    }

    avatarInputs.forEach(inputElement => {
      const input = inputElement as HTMLInputElement;
      // Mark as handled
      input.dataset.autoHandled = 'true';

      // Try to get assistant ID from context
      let assistantId = null;

      // Method 1: Look for data attributes
      const configContainer = input.closest('[data-assistant-id]') as HTMLElement;
      if (configContainer) {
        assistantId = configContainer.dataset.assistantId;
      }

      // Method 2: Check selected assistant in store
      if (!assistantId) {
        try {
          const store = window.useAssistantStore?.getState?.();
          assistantId = store?.selectedAssistant?.id;
        } catch (e) { }
      }

      // Method 3: Look for assistant ID in URL or page context
      if (!assistantId) {
        const urlMatch = window.location.pathname.match(/assistants\/([^/]+)/);
        if (urlMatch) assistantId = urlMatch[1];
      }

      if (assistantId) {
        input.addEventListener('change', createAvatarHandler(assistantId));
        console.log('🔧 Auto-attached avatar handler for assistant:', assistantId);
      } else {
        // Fallback: prompt for assistant ID
        input.addEventListener('change', function (e) {
          const id = prompt('Enter Assistant ID for avatar upload:');
          if (id) {
            createAvatarHandler(id)(e);
          }
        });
        console.log('🔧 Auto-attached fallback avatar handler');
      }
    });

    console.log(`✅ Auto-processed ${avatarInputs.length} avatar inputs`);
  }

  // Initial attachment
  if (document.readyState === 'complete') {
    autoAttachAvatarHandlers();
  } else {
    window.addEventListener('load', autoAttachAvatarHandlers);
  }

  // Debounced version of autoAttachAvatarHandlers to prevent spam
  let debounceTimer = null;
  const debouncedAutoAttach = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(autoAttachAvatarHandlers, 500); // Wait 500ms after last mutation
  };

  // Watch for new avatar inputs (when navigating to different pages)
  const observer = new MutationObserver((mutations) => {
    // Only trigger if there are actual relevant changes
    const hasRelevantChanges = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          return element.matches('input[type="file"][accept*="image"]') ||
            element.querySelector('input[type="file"][accept*="image"]') !== null;
        }
        return false;
      });
    });

    if (hasRelevantChanges) {
      debouncedAutoAttach();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  console.log('✅ Automated avatar fix initialized successfully!');

}, 4000); // Start after 4 seconds to ensure everything is loaded
