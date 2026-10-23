import { supabase } from '../supabase/supabaseClient';

export class DatabaseService {
  private static initialized = false;

  /**
   * Initialize all required database tables for Teams functionality
   */
  static async initializeTables(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🔧 DatabaseService: Initializing database tables...');

      // Check if teams table exists
      await this.ensureTeamsTable();

      // Check if pages table exists  
      await this.ensurePagesTable();

      // Check if team_members table exists
      await this.ensureTeamMembersTable();

      // Check if messages table exists
      await this.ensureMessagesTable();

      // Check if canvases table exists
      await this.ensureCanvasesTable();

      // Check agentic tables (Wiring them up tight)
      await this.ensureAgenticTables();

      this.initialized = true;
      console.log('✅ DatabaseService: All tables initialized successfully');

    } catch (error) {
      console.error('❌ DatabaseService: Failed to initialize tables:', error);
      // Don't throw - allow app to continue with limited functionality
    }
  }

  private static async ensureTeamsTable(): Promise<void> {
    try {
      // Test if teams table exists by trying to select from it
      const { data, error } = await supabase
        .from('teams')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('📝 Creating teams table...');
        // Table doesn't exist, but we can't create it via client
        // This would normally be handled by migrations
        console.warn('Teams table needs to be created via Supabase migrations');
      }
    } catch (error) {
      console.error('Error checking teams table:', error);
    }
  }

  private static async ensurePagesTable(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.warn('Pages table needs to be created via Supabase migrations');
      }
    } catch (error) {
      console.error('Error checking pages table:', error);
    }
  }

  private static async ensureTeamMembersTable(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.warn('Team members table needs to be created via Supabase migrations');
      }
    } catch (error) {
      console.error('Error checking team_members table:', error);
    }
  }

  private static async ensureMessagesTable(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.warn('Messages table needs to be created via Supabase migrations');
        console.log('💡 Run: npx supabase db push to apply migrations');
      } else {
        console.log('✅ Messages table exists and is accessible');
      }
    } catch (error) {
      console.error('Error checking messages table:', error);
    }
  }

  private static async ensureCanvasesTable(): Promise<void> {
    try {
      const { error } = await supabase
        .from('canvases')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.warn('Canvases table needs to be created via Supabase migrations');
        console.log('💡 Run: npx supabase db push to apply migrations');
      } else if (!error) {
        console.log('✅ Canvases table exists and is accessible');
      }
    } catch (error) {
      console.error('Error checking canvases table:', error);
    }
  }

  private static async ensureAgenticTables(): Promise<void> {
    const tables = [
      'assistants',
      'folders',
      'linked_accounts',
      'ai_drive_files',
      'master_tasks',
      'document_templates',
      'kb_documents',
      'orchestration_manifests',
      'canvases'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error && (error.code === 'PGRST116' || error.message.includes('not find'))) {
          console.warn(`⚠️ Brain System: Table "${table}" is missing. Running in limited mode.`);
        } else if (!error) {
          console.log(`✅ Brain System: Table "${table}" exists and is accessible`);
        }
      } catch (err) {
        console.error(`Error checking agentic table ${table}:`, err);
      }
    }
  }

  /**
   * Reset initialization state (useful for testing)
   */
  static resetInitialization(): void {
    this.initialized = false;
  }

  /**
   * Check database connection
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * Get database schema info for debugging
   */
  static async getSchemaInfo(): Promise<any> {
    try {
      // This would require admin privileges, so just return basic info
      return {
        connected: await this.checkConnection(),
        initialized: this.initialized,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting schema info:', error);
      return { error: error.message };
    }
  }
}