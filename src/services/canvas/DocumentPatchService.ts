/**
 * 🔧 Document Patch Service
 * 
 * TRUE SURGICAL EDITING - Like how Claude edits files:
 * - Never replaces entire document
 * - Applies precise patches to specific locations
 * - Tracks all changes for undo/redo
 * - Persists to database for multi-document tracking
 * 
 * URENO Principle: Only touch what needs to change
 */

import { supabase } from '../../lib/supabaseClient';

// ========================================
// TYPES
// ========================================

export interface DocumentPatch {
  id: string;
  documentId: string;
  type: 'replace' | 'insert' | 'delete' | 'global_replace';

  // For replace/delete: what to find
  oldContent?: string;
  searchPattern?: string;  // Regex pattern

  // For insert: where to insert
  insertPosition?: 'before' | 'after' | 'start' | 'end';
  insertAnchor?: string;  // Text to insert before/after

  // The new content
  newContent: string;

  // Metadata
  reason: string;  // "Change Mark Jones to Markie Mark"
  confidence: number;  // 0-1, how sure we are this is correct

  // State
  applied: boolean;
  appliedAt?: Date;
  revertedAt?: Date;

  // For tracking
  createdAt: Date;
  createdBy: 'user' | 'ai';
}

export interface PatchResult {
  success: boolean;
  patch: DocumentPatch;
  matchCount: number;  // How many occurrences were found
  replacedCount: number;  // How many were actually replaced
  newContent: string;
  error?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  patches: DocumentPatch[];  // Patches applied in this version
  createdAt: Date;
  description: string;
}

// ========================================
// PATCH EXTRACTION FROM AI RESPONSE
// ========================================

export class DocumentPatchService {
  private static instance: DocumentPatchService;

  // In-memory cache of document versions (backed by DB)
  private documentVersions: Map<string, DocumentVersion[]> = new Map();

  // Pending patches waiting to be applied
  private pendingPatches: Map<string, DocumentPatch[]> = new Map();

  static getInstance(): DocumentPatchService {
    if (!DocumentPatchService.instance) {
      DocumentPatchService.instance = new DocumentPatchService();
    }
    return DocumentPatchService.instance;
  }

  /**
   * 🧠 EXTRACT PATCHES FROM AI RESPONSE
   * 
   * This is the KEY function - it parses AI response and extracts
   * specific changes to apply, NOT the whole document.
   */
  extractPatchesFromResponse(
    aiResponse: string,
    originalDocument: string,
    userRequest: string,
    documentId: string
  ): DocumentPatch[] {
    const patches: DocumentPatch[] = [];

    console.log('🔧 [PatchService] Extracting patches from AI response...');
    console.log('🔧 [PatchService] User request:', userRequest);

    // ===== PRIORITY 0: Simple "change X to Y" patterns (most common) =====
    // ===== PRIORITY 0: Simple "change X to Y" patterns (flexible) =====
    const simpleChangePatterns = [
      /change\s+(?:the\s+)?(?:text\s+|phrase\s+|word\s+)?["']?([\s\S]+?)["']?\s+to\s+["']?([\s\S]+?)["']?(?:\s|$)/i,
      /replace\s+(?:the\s+)?(?:text\s+|phrase\s+|word\s+)?["']?([\s\S]+?)["']?\s+with\s+["']?([\s\S]+?)["']?(?:\s|$)/i,
      /update\s+(?:the\s+)?(?:text\s+|phrase\s+|word\s+)?["']?([\s\S]+?)["']?\s+to\s+["']?([\s\S]+?)["']?(?:\s|$)/i,
      /(?:make|set)\s+(?:the\s+)?["']?([\s\S]+?)["']?\s+(?:to\s+)?["']?([\s\S]+?)["']?(?:\s|$)/i,
    ];

    for (const pattern of simpleChangePatterns) {
      const match = userRequest.match(pattern);
      if (match) {
        const oldText = match[1].trim();
        const newText = match[2].trim();

        // Skip very short matches (likely parsing errors)
        if (oldText.length < 2 || newText.length < 2) continue;

        // Check if old text exists in document (flexible whitespace check)
        const docNormalized = originalDocument.toLowerCase().replace(/\s+/g, ' ');
        const oldNormalized = oldText.toLowerCase().replace(/\s+/g, ' ');

        if (docNormalized.includes(oldNormalized)) {
          patches.push({
            id: `patch-${Date.now()}-direct`,
            documentId,
            type: 'global_replace',
            oldContent: oldText,
            newContent: newText,
            reason: userRequest,
            confidence: 0.98,
            applied: false,
            createdAt: new Date(),
            createdBy: 'ai'
          });
          console.log(`✅ [PatchService] Direct user change: "${oldText}" → "${newText}"`);
          break; // Only need one direct match
        }
      }
    }

    // ===== PRIORITY 1: Parse "**old** should be changed to **new**" format (robust) =====
    // Handle variations: "should be changed to", "change to", "replace with", etc.
    const changeRegex = /\*\*(.+?)\*\*\s+(?:should be changed to|changed to|replaced with|change to|replace with)\s+\*\*(.+?)\*\*/gi;
    const shouldBeChangedMatches = aiResponse.matchAll(changeRegex);

    for (const match of shouldBeChangedMatches) {
      const oldText = match[1].trim();
      const newText = match[2].trim();

      // Skip if already covered by direct change
      if (!patches.some(p => p.oldContent === oldText)) {
        patches.push({
          id: `patch-${Date.now()}-shouldbe-${patches.length}`,
          documentId,
          type: 'replace',
          oldContent: oldText,
          newContent: newText,
          reason: `AI suggested: change "${oldText}" to "${newText}"`,
          confidence: 0.85,
          applied: false,
          createdAt: new Date(),
          createdBy: 'ai'
        });
        console.log(`✅ [PatchService] "should be changed to" patch: "${oldText}" → "${newText}"`);
      }
    }

    // ===== PRIORITY 3: Parse [SECTION CHANGE] format =====
    if (aiResponse.includes('[SECTION CHANGE]')) {
      const lines = aiResponse.split('\n');

      for (const line of lines) {
        // Look for "Name: Value" update patterns
        const fieldUpdateMatch = line.match(/^\s*\*?\s*([\w\s]+):\s*(.+)/i);
        if (fieldUpdateMatch) {
          const fieldName = fieldUpdateMatch[1].trim();
          const newValue = fieldUpdateMatch[2].trim();

          // Find this field in original document
          const fieldPattern = new RegExp(`(${fieldName}:)\\s*[^\\n]*`, 'gi');
          if (fieldPattern.test(originalDocument)) {
            patches.push({
              id: `patch-${Date.now()}-field-${patches.length}`,
              documentId,
              type: 'replace',
              searchPattern: `(${fieldName}:)\\s*[^\\n]*`,
              newContent: `${fieldName}: ${newValue}`,
              reason: `Update ${fieldName} field`,
              confidence: 0.8,
              applied: false,
              createdAt: new Date(),
              createdBy: 'ai'
            });
          }
        }
      }
    }

    // ===== PRIORITY 4: Detect global name changes =====
    const nameChangePatterns = [
      /(?:new\s+)?(?:applicant\s+)?name[:\s]+["']?([A-Z][a-z]+\s+[A-Z][a-z]+)["']?/i,
      /(?:change|update|replace)\s+(?:the\s+)?name\s+to\s+["']?([A-Z][a-z]+\s+[A-Z][a-z]+)["']?/i,
    ];

    for (const pattern of nameChangePatterns) {
      const match = aiResponse.match(pattern);
      if (match) {
        const newName = match[1];

        // Find the OLD name in the document (look for "Name v." pattern in legal docs)
        const caseMatch = originalDocument.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)\s+v\.\s+/);
        const petitionerMatch = originalDocument.match(/PETITIONER[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);

        const oldName = caseMatch?.[1] || petitionerMatch?.[1];

        if (oldName && oldName !== newName) {
          // Check if not already patched
          if (!patches.some(p => p.type === 'global_replace' && p.oldContent === oldName)) {
            patches.push({
              id: `patch-${Date.now()}-globalname`,
              documentId,
              type: 'global_replace',
              oldContent: oldName,
              newContent: newName,
              reason: `Global name change: "${oldName}" → "${newName}"`,
              confidence: 0.9,
              applied: false,
              createdAt: new Date(),
              createdBy: 'ai'
            });
            console.log(`✅ [PatchService] Global name patch: "${oldName}" → "${newName}"`);
          }
        }
      }
    }

    console.log(`🔧 [PatchService] Extracted ${patches.length} patches from AI response`);
    return patches;
  }

  /**
   * 🎯 APPLY A SINGLE PATCH TO DOCUMENT
   * 
   * This is the surgical edit - only changes what the patch specifies
   */
  applyPatch(documentContent: string, patch: DocumentPatch): PatchResult {
    let newContent = documentContent;
    let matchCount = 0;
    let replacedCount = 0;

    try {
      switch (patch.type) {
        case 'global_replace':
          // Replace ALL occurrences
          if (patch.oldContent) {
            const regex = new RegExp(
              patch.oldContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi'
            );
            matchCount = (documentContent.match(regex) || []).length;
            newContent = documentContent.replace(regex, patch.newContent);
            replacedCount = matchCount;
          }
          break;

        case 'replace':
          // Replace using pattern or exact match
          if (patch.searchPattern) {
            const regex = new RegExp(patch.searchPattern, 'gi');
            matchCount = (documentContent.match(regex) || []).length;
            newContent = documentContent.replace(regex, patch.newContent);
            replacedCount = matchCount;
          } else if (patch.oldContent) {
            // Exact match replace (case-insensitive)
            const regex = new RegExp(
              patch.oldContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi'
            );
            matchCount = (documentContent.match(regex) || []).length;
            if (matchCount > 0) {
              newContent = documentContent.replace(regex, patch.newContent);
              replacedCount = matchCount;
            }
          }
          break;

        case 'insert':
          // Insert at specific position
          if (patch.insertAnchor && patch.insertPosition) {
            const anchorIndex = documentContent.indexOf(patch.insertAnchor);
            if (anchorIndex !== -1) {
              matchCount = 1;
              if (patch.insertPosition === 'before') {
                newContent = documentContent.slice(0, anchorIndex) +
                  patch.newContent + '\n' +
                  documentContent.slice(anchorIndex);
              } else if (patch.insertPosition === 'after') {
                const afterAnchor = anchorIndex + patch.insertAnchor.length;
                newContent = documentContent.slice(0, afterAnchor) +
                  '\n' + patch.newContent +
                  documentContent.slice(afterAnchor);
              }
              replacedCount = 1;
            }
          } else if (patch.insertPosition === 'start') {
            newContent = patch.newContent + '\n' + documentContent;
            replacedCount = 1;
          } else if (patch.insertPosition === 'end') {
            newContent = documentContent + '\n' + patch.newContent;
            replacedCount = 1;
          }
          break;

        case 'delete':
          if (patch.oldContent) {
            const regex = new RegExp(
              patch.oldContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi'
            );
            matchCount = (documentContent.match(regex) || []).length;
            newContent = documentContent.replace(regex, '');
            replacedCount = matchCount;
          }
          break;
      }

      // Mark patch as applied
      patch.applied = true;
      patch.appliedAt = new Date();

      console.log(`✅ [PatchService] Applied patch ${patch.id}:`, {
        type: patch.type,
        matchCount,
        replacedCount,
        reason: patch.reason
      });

      return {
        success: replacedCount > 0,
        patch,
        matchCount,
        replacedCount,
        newContent,
        error: replacedCount === 0 ? 'No matches found' : undefined
      };

    } catch (error) {
      console.error(`❌ [PatchService] Error applying patch:`, error);
      return {
        success: false,
        patch,
        matchCount: 0,
        replacedCount: 0,
        newContent: documentContent,
        error: String(error)
      };
    }
  }

  /**
   * 🔧 APPLY MULTIPLE PATCHES TO DOCUMENT
   * 
   * Applies patches in order, each building on the previous result
   */
  applyPatches(documentContent: string, patches: DocumentPatch[]): {
    finalContent: string;
    results: PatchResult[];
    totalReplaced: number;
  } {
    let currentContent = documentContent;
    const results: PatchResult[] = [];
    let totalReplaced = 0;

    // Sort patches by confidence (highest first)
    const sortedPatches = [...patches].sort((a, b) => b.confidence - a.confidence);

    for (const patch of sortedPatches) {
      const result = this.applyPatch(currentContent, patch);
      results.push(result);

      if (result.success) {
        currentContent = result.newContent;
        totalReplaced += result.replacedCount;
      }
    }

    console.log(`🔧 [PatchService] Applied ${results.filter(r => r.success).length}/${patches.length} patches, ${totalReplaced} total replacements`);

    return {
      finalContent: currentContent,
      results,
      totalReplaced
    };
  }

  /**
   * 📸 CREATE VERSION SNAPSHOT
   * 
   * Saves document state before/after patches for undo/redo
   */
  createVersion(
    documentId: string,
    content: string,
    patches: DocumentPatch[],
    description: string
  ): DocumentVersion {
    const versions = this.documentVersions.get(documentId) || [];
    const newVersion: DocumentVersion = {
      id: `ver-${Date.now()}`,
      documentId,
      version: versions.length + 1,
      content,
      patches,
      createdAt: new Date(),
      description
    };

    versions.push(newVersion);
    this.documentVersions.set(documentId, versions);

    // Persist to database (async, don't block)
    this.persistVersionToDatabase(newVersion).catch(console.error);

    console.log(`📸 [PatchService] Created version ${newVersion.version} for document ${documentId}`);
    return newVersion;
  }

  /**
   * 🔙 REVERT TO PREVIOUS VERSION
   */
  revertToVersion(documentId: string, versionId: string): DocumentVersion | null {
    const versions = this.documentVersions.get(documentId);
    if (!versions) return null;

    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) return null;

    console.log(`🔙 [PatchService] Reverted document ${documentId} to version ${targetVersion.version}`);
    return targetVersion;
  }

  /**
   * 📊 GET DOCUMENT HISTORY
   */
  getDocumentHistory(documentId: string): DocumentVersion[] {
    return this.documentVersions.get(documentId) || [];
  }

  /**
   * 💾 PERSIST TO DATABASE
   */
  private async persistVersionToDatabase(version: DocumentVersion): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_versions')
        .insert({
          id: version.id,
          document_id: version.documentId,
          version_number: version.version,
          content: version.content,
          patches: JSON.stringify(version.patches),
          description: version.description,
          created_at: version.createdAt.toISOString()
        });

      if (error) {
        // Table might not exist yet - that's OK for now
        console.warn('⚠️ [PatchService] Could not persist to DB (table may not exist):', error.message);
      } else {
        console.log(`💾 [PatchService] Version ${version.version} persisted to database`);
      }
    } catch (e) {
      console.warn('⚠️ [PatchService] DB persistence failed:', e);
    }
  }

  /**
   * 📥 LOAD HISTORY FROM DATABASE
   */
  async loadHistoryFromDatabase(documentId: string): Promise<DocumentVersion[]> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: true });

      if (error) throw error;

      const versions: DocumentVersion[] = (data || []).map(row => ({
        id: row.id,
        documentId: row.document_id,
        version: row.version_number,
        content: row.content,
        patches: JSON.parse(row.patches || '[]'),
        createdAt: new Date(row.created_at),
        description: row.description
      }));

      this.documentVersions.set(documentId, versions);
      console.log(`📥 [PatchService] Loaded ${versions.length} versions from database`);

      return versions;
    } catch (e) {
      console.warn('⚠️ [PatchService] Could not load from DB:', e);
      return [];
    }
  }
}

// Export singleton instance
export const documentPatchService = DocumentPatchService.getInstance();
