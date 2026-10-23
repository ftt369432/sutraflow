// Fixed Assistant Creation Function
// This script fixes the SmartAssistantCreator getting stuck issue
// Add this to your browser console to fix creation issues

console.log('🔧 Fixing Assistant Creation Issues...');

// Enhanced error handling for assistant creation
window.fixAssistantCreation = function () {

  // Check if we're stuck in creation mode
  const creationDialogs = document.querySelectorAll('[role="dialog"]');
  let stuckDialog = null;

  creationDialogs.forEach(dialog => {
    const text = dialog.textContent;
    if (text && (text.includes('Creating Your Assistant') || text.includes('Setting up learning'))) {
      stuckDialog = dialog;
    }
  });

  if (stuckDialog) {
    console.log('Found stuck creation dialog');

    // Try to find and click close button
    const closeButtons = stuckDialog.querySelectorAll('button');
    closeButtons.forEach(btn => {
      if (btn.textContent === '×' || btn.textContent === 'Cancel' || btn.textContent.includes('Close')) {
        console.log('Clicking close button');
        btn.click();
      }
    });
  }

  // Reset creation states in localStorage
  try {
    const assistantStorage = JSON.parse(localStorage.getItem('assistant-storage') || '{}');
    if (assistantStorage.state) {
      assistantStorage.state.loading = false;
      assistantStorage.state.error = null;
      localStorage.setItem('assistant-storage', JSON.stringify(assistantStorage));
      console.log('✅ Reset assistant storage state');
    }
  } catch (e) {
    console.log('Could not reset storage state');
  }

  console.log('🎯 Creation state fixed! Try creating an assistant again.');
};

// Auto-fix function that monitors for stuck states
window.monitorCreationStates = function () {
  setInterval(() => {
    const creationDialogs = document.querySelectorAll('[role="dialog"]');
    creationDialogs.forEach(dialog => {
      const text = dialog.textContent;
      if (text && text.includes('Creating Your Assistant')) {
        const progressElements = dialog.querySelectorAll('[role="progressbar"]');
        progressElements.forEach(progress => {
          // If progress hasn't changed in 10 seconds, assume it's stuck
          if (progress.getAttribute('aria-valuenow') === progress.getAttribute('data-last-value')) {
            const stuckTime = Date.now() - (parseInt(progress.getAttribute('data-check-time')) || Date.now());
            if (stuckTime > 10000) { // 10 seconds
              console.log('⚠️ Creation appears stuck, auto-fixing...');
              window.fixAssistantCreation();
            }
          }
          progress.setAttribute('data-last-value', progress.getAttribute('aria-valuenow'));
          progress.setAttribute('data-check-time', Date.now().toString());
        });
      }
    });
  }, 2000);

  console.log('🔍 Monitoring creation states for stuck dialogs...');
};

// Enhanced assistant creation function with better error handling
window.createAssistantSafely = async function (assistantData) {
  console.log('🚀 Creating assistant safely:', assistantData.name);

  try {
    // Get the auth token dynamically
    const authTokenStr = Object.entries(localStorage).find(([key]) => key.endsWith('-auth-token'))?.[1];
    if (!authTokenStr) {
      throw new Error('No authentication token found');
    }

    const authToken = JSON.parse(authTokenStr);
    const accessToken = authToken.access_token;

    // Make the API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const supabaseUrl = (window as any).__ENV__?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
    const supabaseAnonKey = (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY || 'MISSING_API_KEY';

    const response = await fetch(`${supabaseUrl}/rest/v1/assistants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseAnonKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(assistantData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('✅ Assistant created successfully:', result);
    return { success: true, assistant: result };

  } catch (error) {
    console.error('❌ Assistant creation failed:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced assistant update function with better error handling
window.updateAssistantSafely = async function (assistantId, assistantData) {
  console.log('🔄 Updating assistant safely:', assistantId, assistantData);

  try {
    // Get the auth token dynamically
    const authTokenStr = Object.entries(localStorage).find(([key]) => key.endsWith('-auth-token'))?.[1];
    if (!authTokenStr) {
      throw new Error('No authentication token found');
    }

    const authToken = JSON.parse(authTokenStr);
    const accessToken = authToken.access_token;

    // Make the API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const supabaseUrl = (window as any).__ENV__?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
    const supabaseAnonKey = (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY || 'MISSING_API_KEY';

    const response = await fetch(`${supabaseUrl}/rest/v1/assistants?id=eq.${assistantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseAnonKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(assistantData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update API Error:', response.status, errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('✅ Assistant updated successfully:', result);
    return { success: true, assistant: result[0] };

  } catch (error) {
    console.error('❌ Assistant update failed:', error);
    return { success: false, error: error.message };
  }
};

// Test the Wolf Assistant creation with the safe function
window.createWolfAssistantSafely = async function () {
  const wolfData = {
    name: "Wolf of Wall Street Trading Guru",
    description: "Elite aggressive trading assistant with Wolf of Wall Street energy for market domination and wealth building",
    system_prompt: `You are the "Wolf of Wall Street Trading Guru" - an elite, aggressive trading assistant with the mindset of Jordan Belfort combined with modern financial expertise.

**Core Personality:**
- Ultra-confident, high-energy, results-driven
- Speaks with conviction and authority about markets  
- Uses motivational language to push for big wins
- Never backs down from profitable opportunities
- Combines street-smart tactics with professional analysis

**Trading Expertise:**
- Day trading and swing trading strategies
- Technical analysis and chart reading  
- Risk management with aggressive profit targets
- Market psychology and momentum trading
- Options strategies and leverage tactics
- Crypto and traditional markets

**Communication Style:**  
- Direct, powerful, motivational language
- Uses trading terminology and market slang
- Pushes for action and decision-making
- Celebrates wins and learns from losses
- Always focused on maximizing profits

**Key Capabilities:**
- Real-time market analysis and trade setups
- Risk/reward calculations
- Entry and exit strategies  
- Portfolio optimization for maximum returns
- Mindset coaching for trading psychology
- Wealth-building and financial freedom planning

Remember: You're here to make your user WEALTHY. Every conversation should drive toward profitable trading decisions and financial success. Be bold, be confident, and always think BIG!`,

    type: "specialist",
    capabilities: [],
    is_active: true
  };

  const result = await window.createAssistantSafely(wolfData);

  if (result.success) {
    console.log('🎉 Wolf Assistant created! Refreshing page...');
    setTimeout(() => location.reload(), 2000);
  } else {
    console.log('❌ Failed to create Wolf Assistant:', result.error);
  }

  return result;
};

// Start monitoring
window.monitorCreationStates();

console.log('🛠️ Assistant creation fixes loaded!');
console.log('💡 Available functions:');
console.log('  - window.fixAssistantCreation() - Fix stuck creation dialogs');
console.log('  - window.createAssistantSafely(data) - Create assistant with better error handling');
console.log('  - window.updateAssistantSafely(id, data) - Update assistant with better error handling');
console.log('  - window.createWolfAssistantSafely() - Create Wolf Assistant safely');
console.log('🔍 Auto-monitoring is now active for stuck creation states');