// Auto-inject avatar fix into the main app
// This will be automatically loaded and run

(function() {
  'use strict';
  
  // Inject the auto-fix script into the page
  const script = document.createElement('script');
  script.textContent = `
    // Auto Avatar Fix - Injected Version
    console.log('🔧 Auto-injecting avatar fix...');
    
    // Enhanced avatar upload handler
    function createAvatarHandler(assistantId) {
      return async function(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        
        console.log('📷 Processing avatar for assistant:', assistantId);
        
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
          loadingEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; z-index: 9999; font-family: system-ui;';
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
              console.log('✅ Saved via assistant store');
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
                console.log('✅ Saved via Supabase');
              }
            } catch (error) {
              console.warn('Supabase method failed:', error);
            }
          }
          
          // Update UI
          loadingEl.textContent = saved ? '✅ Avatar saved!' : '❌ Save failed';
          loadingEl.style.background = saved ? '#10b981' : '#ef4444';
          
          if (saved) {
            // Update avatar display immediately
            const avatarImages = document.querySelectorAll('img[alt*="Avatar"], img[src*="avatar"]');
            avatarImages.forEach(img => {
              if (img.src !== resizedImage) {
                img.src = resizedImage;
              }
            });
            
            // Refresh page after a delay
            setTimeout(() => location.reload(), 1000);
          }
          
          // Remove loading indicator
          setTimeout(() => loadingEl.remove(), 3000);
          
        } catch (error) {
          console.error('Avatar upload failed:', error);
          alert('Avatar upload failed: ' + error.message);
        }
      };
    }
    
    // Auto-attach to avatar inputs
    function autoAttachAvatarHandlers() {
      const avatarInputs = document.querySelectorAll('input[type="file"][accept*="image"]:not([data-auto-handled])');
      
      avatarInputs.forEach(input => {
        // Mark as handled
        input.dataset.autoHandled = 'true';
        
        // Try to get assistant ID from context
        let assistantId = null;
        
        // Method 1: Look for data attributes
        const configContainer = input.closest('[data-assistant-id]');
        if (configContainer) {
          assistantId = configContainer.dataset.assistantId;
        }
        
        // Method 2: Check selected assistant in store
        if (!assistantId) {
          try {
            const store = window.useAssistantStore?.getState?.();
            assistantId = store?.selectedAssistant?.id;
          } catch (e) {}
        }
        
        // Method 3: Look for assistant ID in URL or page context
        if (!assistantId) {
          const urlMatch = window.location.pathname.match(/assistants\/([^\/]+)/);
          if (urlMatch) assistantId = urlMatch[1];
        }
        
        if (assistantId) {
          input.addEventListener('change', createAvatarHandler(assistantId));
          console.log('🔧 Auto-attached avatar handler for:', assistantId);
        } else {
          // Fallback: prompt for assistant ID
          input.addEventListener('change', function(e) {
            const id = prompt('Enter Assistant ID for avatar:');
            if (id) {
              createAvatarHandler(id)(e);
            }
          });
          console.log('🔧 Auto-attached fallback avatar handler');
        }
      });
    }
    
    // Initial attachment
    if (document.readyState === 'complete') {
      autoAttachAvatarHandlers();
    } else {
      window.addEventListener('load', autoAttachAvatarHandlers);
    }
    
    // Watch for new avatar inputs
    const observer = new MutationObserver(autoAttachAvatarHandlers);
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('✅ Auto avatar fix initialized');
  `;
  
  // Inject into the page
  (document.head || document.documentElement).appendChild(script);
  
})();
