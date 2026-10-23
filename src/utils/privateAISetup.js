/**
 * 🏠 Private Nano Hub - Quick Setup Helper
 * 
 * This script helps you easily configure your Private Nano Hub
 * Run this in your browser console on GenieFlow web app
 */

// Step 1: Set your API key from Nano Hub
function setupPrivateAI(apiKey) {
  if (!apiKey || !apiKey.startsWith('gf_')) {
    console.error('❌ Invalid API key. Must start with "gf_"');
    const hubUrl = process.env.VITE_NANO_HUB_URL || 'http://localhost:8080';
    console.log(`📝 Get your key from: ${hubUrl}/login`);
    return false;
  }
  
  localStorage.setItem('genieflow_api_key', apiKey);
  console.log('✅ Private AI API key saved!');
  console.log('🔄 Reload the page to activate');
  return true;
}

// Step 2: Test the connection
async function testPrivateAI() {
  try {
    const apiKey = localStorage.getItem('genieflow_api_key');
    
    if (!apiKey) {
      console.error('❌ No API key found');
      console.log('Run: setupPrivateAI("your_key_here")');
      return;
    }
    
    console.log('🧪 Testing connection to Nano Hub...');
    
    const hubUrl = process.env.VITE_NANO_HUB_URL || 'http://localhost:8080';
    const response = await fetch(`${hubUrl}/api/symphony/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        message: 'Say hello',
        model: 'deepseek-r1:1.5b'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Connection successful!');
    console.log('🤖 Nano Hub Response:', data.response);
    console.log('📊 Model used:', data.model);
    
    return data;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n📋 Troubleshooting:');
    const hubUrl = process.env.VITE_NANO_HUB_URL || 'http://localhost:8080';
    console.log(`1. Is Nano Hub running? Check: ${hubUrl}`);
    console.log('2. Are you on the same network (192.168.1.x)?');
    console.log('3. Is your API key valid?');
  }
}

// Step 3: Query with your Supabase documents
async function queryWithDocs(question, maxDocs = 3) {
  try {
    const apiKey = localStorage.getItem('genieflow_api_key');
    
    if (!apiKey) {
      console.error('❌ No API key found');
      return;
    }
    
    // Get documents from your Knowledge Base store
    const store = window.__KNOWLEDGE_BASE_STORE__ || 
                  JSON.parse(localStorage.getItem('knowledge-base-store') || '{}');
    
    const documents = store.state?.documents || [];
    
    if (documents.length === 0) {
      console.warn('⚠️  No documents found in Knowledge Base');
      console.log('📁 Upload some documents first in GenieFlow');
      return;
    }
    
    console.log(`📚 Found ${documents.length} documents in Knowledge Base`);
    console.log(`🔎 Using ${Math.min(maxDocs, documents.length)} documents for context`);
    
    const docsToUse = documents.slice(0, maxDocs).map(d => ({
      title: d.title,
      content: d.content?.substring(0, 2000) // First 2000 chars
    }));
    
    console.log('🤖 Asking Nano Hub:', question);
    
    const hubUrl = process.env.VITE_NANO_HUB_URL || 'http://localhost:8080';
    const response = await fetch(`${hubUrl}/api/knowledge/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        query: question,
        documents: docsToUse
      })
    });
    
    const data = await response.json();
    
    console.log('✅ Analysis complete!');
    console.log('📄 Answer:', data.response);
    
    return data.response;
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  }
}

// Step 4: Check status
function getPrivateAIStatus() {
  const apiKey = localStorage.getItem('genieflow_api_key');
  const hubUrl = process.env.VITE_NANO_HUB_URL || 'http://localhost:8080';
  
  console.log('🏠 Private Nano Hub Status:');
  console.log('━'.repeat(50));
  console.log('📍 Hub URL:', hubUrl);
  console.log('🔑 API Key:', apiKey ? '✅ Configured' : '❌ Not set');
  console.log('🌐 Network:', navigator.onLine ? '✅ Online' : '❌ Offline');
  console.log('━'.repeat(50));
  
  if (!apiKey) {
    console.log('\n📝 Next steps:');
    console.log(`1. Get API key: ${hubUrl}/login`);
    console.log('2. Run: setupPrivateAI("your_key_here")');
    console.log('3. Run: testPrivateAI()');
  } else {
    console.log('\n✅ Ready to use!');
    console.log('Test with: testPrivateAI()');
    console.log('Query docs: queryWithDocs("your question")');
  }
}

// Step 5: Remove private AI (if needed)
function removePrivateAI() {
  localStorage.removeItem('genieflow_api_key');
  console.log('✅ Private AI key removed');
  console.log('Your app will continue using Gemini/Groq');
}

// Export helper functions to window for easy console access
if (typeof window !== 'undefined') {
  window.PrivateAI = {
    setup: setupPrivateAI,
    test: testPrivateAI,
    queryDocs: queryWithDocs,
    status: getPrivateAIStatus,
    remove: removePrivateAI
  };
  
  console.log('🏠 Private Nano Hub helpers loaded!');
  console.log('━'.repeat(50));
  console.log('Available commands:');
  console.log('  PrivateAI.setup("your_api_key")  - Configure API key');
  console.log('  PrivateAI.test()                 - Test connection');
  console.log('  PrivateAI.queryDocs("question")  - Query your documents');
  console.log('  PrivateAI.status()               - Check configuration');
  console.log('  PrivateAI.remove()               - Remove API key');
  console.log('━'.repeat(50));
}

// If running in Node/build environment, export normally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setupPrivateAI,
    testPrivateAI,
    queryWithDocs,
    getPrivateAIStatus,
    removePrivateAI
  };
}
