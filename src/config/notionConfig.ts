/**
 * 🔗 Notion Integration Configuration
 * 
 * Configure your live Notion integration with GenieFlow AI.
 * Replace the placeholder values with your actual Notion credentials.
 */

// STEP 1: Replace this with your actual Notion API key
// You can either set it here directly or use environment variables
const NOTION_API_KEY = process.env.REACT_APP_NOTION_API_KEY || 'PASTE_YOUR_TOKEN_HERE';

// STEP 2: Add your database IDs (get from Notion URL)
const NOTION_DATABASES = {
  // Example: 'projects': '32-character-database-id-from-notion-url'
  'test_database': 'YOUR_DATABASE_ID_HERE',
  'projects': 'YOUR_PROJECTS_DATABASE_ID_HERE', 
  'notes': 'YOUR_NOTES_DATABASE_ID_HERE'
};

// STEP 3: Configure integration settings
export const LIVE_NOTION_CONFIG = {
  apiKey: NOTION_API_KEY,
  version: '2022-06-28',
  databases: NOTION_DATABASES,
  
  // Feature toggles
  features: {
    aiContentGeneration: true,
    autoPageCreation: true,
    dataSync: true,
    templateSystem: true
  },
  
  // Default page templates
  templates: {
    meeting_notes: {
      title_template: 'Meeting Notes - {date}',
      default_properties: {
        'Type': 'Meeting',
        'Status': 'Active',
        'Date': new Date().toISOString().split('T')[0]
      }
    },
    project_plan: {
      title_template: 'Project: {name}',
      default_properties: {
        'Type': 'Project',
        'Status': 'Planning',
        'Priority': 'Medium'
      }
    }
  }
};

/**
 * Quick setup function for your Notion integration
 */
export async function setupNotionIntegration() {
  console.log('🔗 Setting up live Notion integration...');
  
  if (NOTION_API_KEY === 'secret_YOUR_NOTION_INTEGRATION_TOKEN_HERE') {
    throw new Error('Please replace NOTION_API_KEY with your actual API token from Notion');
  }
  
  try {
    const { createNotionService } = await import('../services/integrations/NotionService');
    
    // Create Notion service with your credentials
    const notionService = createNotionService({
      apiKey: NOTION_API_KEY,
      version: '2022-06-28'
    });
    
    // Test connection
    const connected = await notionService.initialize();
    
    if (connected) {
      console.log('✅ Notion integration successful!');
      
      // Test basic functionality
      await testNotionFeatures(notionService);
      
      return { success: true, service: notionService };
    } else {
      throw new Error('Failed to connect to Notion API');
    }
    
  } catch (error) {
    console.error('❌ Notion setup failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test Notion integration features
 */
async function testNotionFeatures(notionService: any) {
  console.log('🧪 Testing Notion features...');
  
  try {
    // Test 1: Get databases
    const databases = await notionService.getDatabases();
    console.log(`📊 Found ${databases.length} accessible databases`);
    
    // Test 2: Search functionality
    const searchResults = await notionService.search('test');
    console.log(`🔍 Search returned ${searchResults.length} results`);
    
    // Test 3: Create a test page (optional)
    if (confirm('Create a test page in Notion to verify integration?')) {
      const testPage = await notionService.createPage({
        title: 'GenieFlow AI Test Page',
        content: [
          { type: 'heading_1', content: 'Integration Test' },
          { type: 'paragraph', content: 'This page was created by GenieFlow AI!' },
          { type: 'paragraph', content: `Created on: ${new Date().toISOString()}` }
        ]
      });
      
      console.log(`✅ Test page created: ${testPage.url}`);
    }
    
  } catch (error) {
    console.warn('⚠️ Some features may need database permissions:', error.message);
  }
}

// Export for use in main application
export default LIVE_NOTION_CONFIG;