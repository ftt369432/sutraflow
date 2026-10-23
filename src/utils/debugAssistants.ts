import { supabase } from '../lib/supabaseClient';

/**
 * Debug utility to help diagnose authentication and database issues
 */
export const debugAssistants = async () => {
  console.group('🔍 Assistants Debug Information');
  
  try {
    // Check authentication
    console.log('1. Checking authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user?.email || 'Not authenticated');
    console.log('User ID:', user?.id || 'None');
    console.log('Auth Error:', userError || 'None');
    
    // Check session
    console.log('\n2. Checking session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session exists:', !!session);
    console.log('Session user:', session?.user?.email || 'None');
    console.log('Session Error:', sessionError || 'None');
    
    if (user) {
      // Test database access
      console.log('\n3. Testing database access...');
      
      // Try to select assistants
      const { data: assistants, error: selectError } = await supabase
        .from('assistants')
        .select('id, name, user_id, created_by, created_at')
        .limit(5);
      
      console.log('Select result:', assistants || 'Failed');
      console.log('Select error:', selectError || 'None');
      
      // Try to insert a test assistant (will rollback)
      console.log('\n4. Testing insert permissions...');
      const testAssistant = {
        name: 'Test Assistant (Debug)',
        description: 'This is a test assistant for debugging',
        system_prompt: 'Test prompt',
        is_active: true,
        model: 'gpt-3.5-turbo',
        tools: [],
        file_ids: [],
        metadata: {}
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('assistants')
        .insert([testAssistant])
        .select()
        .single();
      
      if (insertError) {
        console.log('Insert error:', insertError);
        console.log('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
      } else {
        console.log('Insert successful (will clean up):', insertData);
        
        // Clean up the test assistant
        if (insertData?.id) {
          await supabase.from('assistants').delete().eq('id', insertData.id);
          console.log('Test assistant cleaned up');
        }
      }
    } else {
      console.log('\n❌ User not authenticated - skipping database tests');
    }
    
    // Check environment variables
    console.log('\n5. Environment check...');
    console.log('Supabase URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
    console.log('Anon key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.groupEnd();
};

// Helper to run basic auth check
export const quickAuthCheck = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Quick auth check:', {
    authenticated: !!user,
    email: user?.email,
    error: error?.message
  });
  return { user, error };
}; 