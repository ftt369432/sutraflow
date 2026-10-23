// 🔄 Assistant Metadata Migration Script
// Updates existing assistants with proper tier metadata

import { supabase } from '../lib/supabaseClient';
import { defaultAssistants } from './assistantService';

/**
 * 🔄 Migrate Assistant Metadata
 * Updates existing assistants in database with proper tier and pricing metadata
 */
export const migrateAssistantMetadata = async (): Promise<{
  success: boolean;
  updated: number;
  errors: string[];
}> => {
  const results = {
    success: false,
    updated: 0,
    errors: [] as string[]
  };

  try {
    console.log('🔄 Starting assistant metadata migration...');

    // Get all existing assistants
    const { data: existingAssistants, error: fetchError } = await supabase
      .from('assistants')
      .select('id, name, metadata')
      .eq('is_active', true);

    if (fetchError) {
      results.errors.push(`Failed to fetch assistants: ${fetchError.message}`);
      return results;
    }

    if (!existingAssistants || existingAssistants.length === 0) {
      console.log('ℹ️ No assistants found to migrate');
      results.success = true;
      return results;
    }

    console.log(`📊 Found ${existingAssistants.length} assistants to check for migration`);

    // Update each assistant with proper metadata
    for (const assistant of existingAssistants) {
      try {
        // Find corresponding default assistant configuration
        const defaultConfig = defaultAssistants.find(def => def.name === assistant.name);
        
        if (!defaultConfig || !defaultConfig.metadata) {
          console.log(`⚠️ No metadata configuration found for ${assistant.name}, skipping`);
          continue;
        }

        // Check if assistant already has complete metadata
        const hasCompleteMetadata = assistant.metadata && 
          assistant.metadata.tier && 
          assistant.metadata.basePrice !== undefined &&
          assistant.metadata.category;

        if (hasCompleteMetadata) {
          console.log(`✅ ${assistant.name} already has complete metadata, skipping`);
          continue;
        }

        // Update with new metadata
        console.log(`🔄 Updating metadata for ${assistant.name}...`);
        
        const { error: updateError } = await supabase
          .from('assistants')
          .update({
            metadata: defaultConfig.metadata
          })
          .eq('id', assistant.id);

        if (updateError) {
          results.errors.push(`Failed to update ${assistant.name}: ${updateError.message}`);
          continue;
        }

        console.log(`✅ Successfully updated metadata for ${assistant.name}`);
        results.updated++;

      } catch (error) {
        const errorMsg = `Error updating ${assistant.name}: ${(error as Error).message}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    results.success = results.errors.length === 0 || results.updated > 0;
    
    console.log(`🎉 Migration complete! Updated ${results.updated} assistants`);
    if (results.errors.length > 0) {
      console.warn(`⚠️ ${results.errors.length} errors occurred:`, results.errors);
    }

    return results;

  } catch (error) {
    const errorMsg = `Migration failed: ${(error as Error).message}`;
    console.error(errorMsg);
    results.errors.push(errorMsg);
    return results;
  }
};

/**
 * 🎯 Validate Assistant Tier Configuration
 * Checks that all assistants have proper tier metadata
 */
export const validateAssistantTiers = async (): Promise<{
  valid: boolean;
  issues: string[];
  recommendations: string[];
}> => {
  const validation = {
    valid: true,
    issues: [] as string[],
    recommendations: [] as string[]
  };

  try {
    const { data: assistants, error } = await supabase
      .from('assistants')
      .select('id, name, metadata')
      .eq('is_active', true);

    if (error) {
      validation.issues.push(`Database error: ${error.message}`);
      validation.valid = false;
      return validation;
    }

    if (!assistants || assistants.length === 0) {
      validation.issues.push('No active assistants found');
      validation.valid = false;
      return validation;
    }

    // Check each assistant
    for (const assistant of assistants) {
      const metadata = assistant.metadata;
      
      // Check for required metadata fields
      if (!metadata) {
        validation.issues.push(`${assistant.name}: Missing metadata entirely`);
        validation.valid = false;
        continue;
      }

      if (!metadata.tier) {
        validation.issues.push(`${assistant.name}: Missing tier information`);
        validation.valid = false;
      }

      if (metadata.tier === 'premium' && metadata.basePrice === undefined) {
        validation.issues.push(`${assistant.name}: Premium tier missing basePrice`);
        validation.valid = false;
      }

      if (metadata.tier === 'premium' && metadata.addOnPrice === undefined) {
        validation.issues.push(`${assistant.name}: Premium tier missing addOnPrice`);
        validation.valid = false;
      }

      if (!metadata.category) {
        validation.issues.push(`${assistant.name}: Missing category`);
        validation.valid = false;
      }

      if (!metadata.features || !Array.isArray(metadata.features)) {
        validation.issues.push(`${assistant.name}: Missing or invalid features array`);
        validation.valid = false;
      }

      // Check for recommended fields
      if (!metadata.specializations) {
        validation.recommendations.push(`${assistant.name}: Consider adding specializations`);
      }
    }

    if (validation.issues.length === 0) {
      console.log('✅ All assistants have valid tier configuration');
    }

    return validation;

  } catch (error) {
    validation.issues.push(`Validation error: ${(error as Error).message}`);
    validation.valid = false;
    return validation;
  }
};

/**
 * 🚀 Initialize Assistant Tier System
 * One-time setup to ensure all assistants have proper metadata
 */
export const initializeAssistantTiers = async (): Promise<boolean> => {
  console.log('🚀 Initializing Assistant Tier System...');

  try {
    // Step 1: Validate current state
    console.log('📊 Step 1: Validating current assistant configuration...');
    const validation = await validateAssistantTiers();
    
    if (validation.valid) {
      console.log('✅ All assistants already properly configured!');
      return true;
    }

    console.log(`⚠️ Found ${validation.issues.length} configuration issues`);
    validation.issues.forEach(issue => console.log(`  - ${issue}`));

    // Step 2: Migrate metadata
    console.log('🔄 Step 2: Migrating assistant metadata...');
    const migration = await migrateAssistantMetadata();

    if (!migration.success) {
      console.error('❌ Migration failed:', migration.errors);
      return false;
    }

    console.log(`✅ Migration completed successfully! Updated ${migration.updated} assistants`);

    // Step 3: Final validation
    console.log('🔍 Step 3: Final validation...');
    const finalValidation = await validateAssistantTiers();
    
    if (finalValidation.valid) {
      console.log('🎉 Assistant tier system successfully initialized!');
      return true;
    } else {
      console.warn('⚠️ Some issues remain after migration:', finalValidation.issues);
      return false;
    }

  } catch (error) {
    console.error('❌ Failed to initialize assistant tier system:', error);
    return false;
  }
};

export default {
  migrateAssistantMetadata,
  validateAssistantTiers,
  initializeAssistantTiers
};