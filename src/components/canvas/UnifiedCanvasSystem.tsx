import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DocumentEditorLayout from './DocumentEditorLayout';
import EnhancedTabSystem from './EnhancedTabSystem';
import CanvasAIDriveIntegration, { CanvasSaveStatus } from './CanvasAIDriveIntegration';
import { CanvasDocumentBrowser } from './CanvasDocumentBrowser';
import { CanvasSaveDialog } from './CanvasSaveDialog';
import { QuickAccessDocuments } from './QuickAccessDocuments';
import DocumentHistoryPanel from './DocumentHistoryPanel';
import { FilePreviewer } from './FilePreviewer';
import { useCanvasAIDrive } from '../../hooks/canvas/useCanvasAIDrive';
import { CanvasDocument, Canvas } from '../../types/canvas';
import { useDocumentHistory } from '../../hooks/canvas/useDocumentHistory';
import CanvasEnhancementPanel from './CanvasEnhancementPanel';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Folder, Save, History, Undo2, Redo2, Cloud, X, Maximize, Minimize, Sparkles, ChevronUp, ChevronDown, Bot } from 'lucide-react';
import { ModeToggle } from '../mode';
import { useMode } from '../../contexts/ModeContext';
import { ActiveAgentsPanel } from '../ai/ActiveAgentsPanel';
// 🎯 WORK PRODUCT ONLY: Import analyzer for defensive stripping
import { SmartWorkProductAnalyzer } from '../../services/SmartWorkProductAnalyzer';
// 🔬 SURGICAL EDITING IMPORTS - Enhanced with Claude-style precision and smart targeting
import {
  performSurgicalEdit,
  performAdvancedSurgicalEdit,
  analyzeCanvasStructure,
  resolveDocumentTarget,
  analyzeWorkspaceDocuments
} from '../../utils/canvasDetection';
// 🧠 ADVANCED SURGICAL DOCUMENT EDITOR - True Claude-style precision editing
import {
  performSurgicalDocumentEdit,
  analyzeDocumentStructure,
  findInsertionPoint
} from '../../utils/surgicalDocumentEditor';
// 🔧 PATCH-BASED SURGICAL EDITING - Like how Claude edits files
import { documentPatchService, DocumentPatch } from '../../services/canvas/DocumentPatchService';
// 🧠 ORCHESTRATION MANIFEST - Task-Canvas linkage
import { getOrchestrationManifest } from '../../services/agents/OrchestrationManifest';
import { SovereignVisualizer } from './SovereignVisualizer';

// Note: Canvas interface is now imported from ../../types/canvas

interface UnifiedCanvasSystemProps {
  initialCanvases?: Canvas[];
  onCanvasChange?: (canvases: Canvas[]) => void;
  rightPanelContent?: React.ReactNode;
  selectedAssistant?: any; // Assistant information
  assistants?: any[]; // Available assistants
  neuralSettings?: any; // Neural AI settings
  enableAIDriveSync?: boolean; // 🔗 Enable AI Drive integration
  autoSaveInterval?: number; // 🔗 Auto-save interval in ms
  onClose?: () => void; // Close canvas panel function
  // 🚀 CHAT-TO-CANVAS INTEGRATION (Enhanced with Advanced Surgical Editing)
  pendingAction?: {
    type: 'create' | 'edit' | 'append' | 'surgical_edit' | 'advanced_surgical_edit';
    content: string;
    title: string;
    targetCanvasId?: string; // For surgical edits
    targetDocument?: string; // NEW: Natural language document targeting ("petition", "todo list")
    editInstruction?: {
      targetDescription: string; // "after Background section", "before Conclusion"
      action: 'insert' | 'replace' | 'append' | 'prepend';
      preserveFormatting?: boolean;
    };
    metadata?: any;
  };
  onActionProcessed?: () => void;
  chatIntegration?: any; // Chat integration context
  onDetach?: () => void; // 🖥️ Detach/Pop-Out functionality
}

const UnifiedCanvasSystem: React.FC<UnifiedCanvasSystemProps> = ({
  initialCanvases = [],
  onCanvasChange,
  rightPanelContent,
  selectedAssistant,
  assistants,
  neuralSettings,
  enableAIDriveSync = true, // 🔗 Default to enabled
  autoSaveInterval = 30000, // 🔗 30 second auto-save
  onClose, // Canvas panel close function
  // 🚀 CHAT-TO-CANVAS INTEGRATION
  pendingAction,
  onActionProcessed,
  chatIntegration,
  onDetach
}) => {
  // 🎨 MODE SYSTEM: Get current mode and feature flags
  const { currentMode, config, should } = useMode();

  const [canvases, setCanvases] = useState<Canvas[]>(() => {
    // 🔄 Load canvases from unified localStorage with fallback to legacy keys
    try {
      const savedV2 = localStorage.getItem('genieflow_canvas_state_v2');
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (parsed && Array.isArray(parsed.canvases)) {
          console.log('📂 Restored canvases from genieflow_canvas_state_v2:', parsed.canvases.length);
          return parsed.canvases.length > 0 ? parsed.canvases : initialCanvases;
        }
      }

      // Fallback to legacy key
      const savedLegacy = localStorage.getItem('genieflow_canvases');
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        console.log('📂 Restored canvases from legacy localStorage:', parsed.length);
        return parsed.length > 0 ? parsed : initialCanvases;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved canvases:', error);
    }
    return initialCanvases;
  });

  const [activeCanvasId, setActiveCanvasId] = useState<string>(() => {
    // 🔄 Load active canvas ID from unified localStorage with fallback
    try {
      const savedV2 = localStorage.getItem('genieflow_canvas_state_v2');
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (parsed && parsed.activeCanvasId) {
          console.log('📌 Restored active canvas ID from v2:', parsed.activeCanvasId);
          return parsed.activeCanvasId;
        }
      }

      const savedActiveId = localStorage.getItem('genieflow_active_canvas');
      if (savedActiveId) {
        console.log('📌 Restored active canvas ID from legacy:', savedActiveId);
        return savedActiveId;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load active canvas ID:', error);
    }
    return initialCanvases.length > 0 ? initialCanvases[0].id : '';
  });
  const [showDocumentBrowser, setShowDocumentBrowser] = useState(false); // 🔗 Document browser state
  const [showHistoryPanel, setShowHistoryPanel] = useState(false); // 📚 History panel state
  const [showAIDriveBrowser, setShowAIDriveBrowser] = useState(() => {
    // 🔄 Load drive browser state from localStorage
    try {
      const saved = localStorage.getItem('genieflow_show_drive_browser');
      return saved === 'true';
    } catch {
      return false;
    }
  }); // 🔗 AI Drive browser state - default closed for cleaner interface
  const [isFullscreen, setIsFullscreen] = useState(false); // 🖥️ Fullscreen mode state
  const [showEnhancementPanel, setShowEnhancementPanel] = useState(false); // ✨ Enhancement panel state
  const [showCanvasUI, setShowCanvasUI] = useState(true); // 🎨 Canvas UI visibility state (tabs, toolbar, editing tools)
  const [enhancementPanelPosition, setEnhancementPanelPosition] = useState({ x: 0, y: 0 }); // ✨ Panel position
  const [isEditLocked, setIsEditLocked] = useState(false); // 🔒 Prevent canvas ID changes during surgical edit
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false); // 💾 Save Dialog State
  const [previewFile, setPreviewFile] = useState<{ id: string, title: string, type: string, url?: string } | null>(null); // 👁️ File preview state
  const [showAgentsSidebar, setShowAgentsSidebar] = useState(() => {
    // 🔄 Load agents sidebar state from localStorage
    try {
      const saved = localStorage.getItem('genieflow_show_agents_sidebar');
      return saved === 'true';
    } catch {
      return false;
    }
  }); // 🤖 Agents sidebar state

  // 🔗 AI Drive integration
  const { saveCanvasToAIDrive, loadCanvasFromAIDrive, saveState } = useCanvasAIDrive();

  // 🔍 SELF-HEALING CANVAS LOOKUP: Try multiple methods to find target canvas
  const findCanvasWithSelfHealing = useCallback((
    targetCanvasId?: string,
    taskId?: string
  ): { canvas: Canvas | undefined; method: string } => {
    console.log('🔍 [Self-Healing] Starting lookup:', {
      targetCanvasId,
      taskId,
      availableIds: canvases.map(c => c.id),
      canvasCount: canvases.length
    });

    // Method 1: Direct ID lookup
    if (targetCanvasId) {
      const canvasById = canvases.find(c => c.id === targetCanvasId);
      if (canvasById) {
        console.log('✅ [Self-Healing] Found by direct ID');
        return { canvas: canvasById, method: 'direct-id' };
      } else {
        console.log('❌ [Self-Healing] Direct ID not found in canvases array');
      }
    }

    // Method 2: Task ID linkage lookup
    if (taskId) {
      const canvasByTaskId = canvases.find(c => c.metadata?.taskId === taskId);
      if (canvasByTaskId) {
        console.log('✅ [Self-Healing] Found by taskId');
        return { canvas: canvasByTaskId, method: 'task-id-linkage' };
      }
    }

    // Method 3: Active canvas fallback
    if (activeCanvasId) {
      const activeCanvas = canvases.find(c => c.id === activeCanvasId);
      if (activeCanvas) {
        console.log('⚠️ [Self-Healing] Using active canvas fallback');
        return { canvas: activeCanvas, method: 'active-canvas-fallback' };
      }
    }

    // Method 4: Most recent canvas fallback
    if (canvases.length > 0) {
      console.log('⚠️ [Self-Healing] Using most recent canvas fallback');
      return { canvas: canvases[canvases.length - 1], method: 'most-recent-fallback' };
    }

    console.log('❌ [Self-Healing] No canvas found!');
    return { canvas: undefined, method: 'not-found' };
  }, [canvases, activeCanvasId]);

  // 🎯 Get assistant's folder ID for linking canvases to knowledge base
  const getAssistantFolderId = useCallback(() => {
    if (!selectedAssistant?.knowledgeBase) return null;

    const firstFolder = selectedAssistant.knowledgeBase[0];
    const folderId = typeof firstFolder === 'string' ? firstFolder : firstFolder?.id;

    console.log('🎯 FOLDER LINK: Getting assistant folder ID:', {
      assistantName: selectedAssistant?.name,
      folderId
    });

    return folderId || null;
  }, [selectedAssistant]);

  // 📚 Document History integration for active canvas
  const activeCanvas = canvases.find(c => c.id === activeCanvasId);
  const {
    historyState,
    undo: historyUndo,
    redo: historyRedo,
    createSnapshot
  } = useDocumentHistory(
    activeCanvas?.content || '',
    activeCanvas?.title || 'Untitled'
  );

  // 💾 Persistence Effects - Save to unified localStorage when canvases or active ID change
  useEffect(() => {
    try {
      const stateToSave = {
        canvases: canvases.map(c => ({
          id: c.id,
          title: c.title,
          type: c.type,
          content: c.content, // V2 state in UnifiedCanvasSystem includes content for recovery
          created: c.created,
          modified: c.modified,
          metadata: c.metadata
        })),
        activeCanvasId,
        timestamp: new Date().toISOString(),
        version: '2.1'
      };

      localStorage.setItem('genieflow_canvas_state_v2', JSON.stringify(stateToSave));

      // Cleanup legacy keys to prevent confusion
      // localStorage.removeItem('genieflow_canvases');
      // localStorage.removeItem('genieflow_active_canvas');

      console.log('💾 Canvas state persisted to genieflow_canvas_state_v2');
    } catch (error) {
      console.error('❌ Failed to save canvas state:', error);
    }
  }, [canvases, activeCanvasId]);

  // 💾 Save sidebar states when they change
  useEffect(() => {
    localStorage.setItem('genieflow_show_drive_browser', showAIDriveBrowser.toString());
  }, [showAIDriveBrowser]);

  useEffect(() => {
    localStorage.setItem('genieflow_show_agents_sidebar', showAgentsSidebar.toString());
  }, [showAgentsSidebar]);

  // 🔄 Recovery Effect - Ensure active canvas ID is valid
  useEffect(() => {
    if (canvases.length > 0 && (!activeCanvasId || !canvases.find(c => c.id === activeCanvasId))) {
      const newActiveId = canvases[0].id;
      console.log('🔄 Recovering invalid active canvas ID:', activeCanvasId, '→', newActiveId);
      setActiveCanvasId(newActiveId);
    }
  }, [canvases, activeCanvasId]);

  // 📡 Listen for agentic canvas creation events and mount in the live editor
  useEffect(() => {
    const handleCanvasCreated = (e: any) => {
      const doc = e.detail;
      if (!doc || !doc.id) return;
      console.log('🎨 UnifiedCanvasSystem: Received genieflow:create-canvas event:', doc.title);
      setCanvases(prev => {
        const filtered = prev.filter(c => c.id !== doc.id);
        const newCanvas: Canvas = {
          id: doc.id,
          title: doc.title || 'Generated Legal Document',
          type: doc.type || 'document',
          content: doc.content || '',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          metadata: doc.metadata || {}
        };
        return [newCanvas, ...filtered];
      });
      setActiveCanvasId(doc.id);
    };

    window.addEventListener('genieflow:create-canvas', handleCanvasCreated as EventListener);
    return () => {
      window.removeEventListener('genieflow:create-canvas', handleCanvasCreated as EventListener);
    };
  }, []);

  // 🎨 AUTO-CREATE DEFAULT CANVAS - Create a default canvas if none exist on mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;

    if (canvases.length === 0) {
      console.log('🎨 [Auto-Create] No canvases found, creating default canvas');
      hasInitialized.current = true;

      const defaultCanvas: Canvas = {
        id: `canvas-${Date.now()}`,
        title: 'New Document',
        content: `# Welcome to Canvas\n\nThis is your workspace for creating and editing documents. You can:\n\n- **Ask the AI** to generate content and it will appear here\n- **Edit directly** by clicking on the text\n- **Create new documents** using the + button\n\nStart by asking the AI assistant a question!`,
        type: 'blank',
        created: new Date(),
        modified: new Date(),
        metadata: {
          source: 'auto-created'
        }
      };

      setCanvases([defaultCanvas]);
      setActiveCanvasId(defaultCanvas.id);
      console.log('✅ [Auto-Create] Default canvas created:', defaultCanvas.id);
    } else {
      hasInitialized.current = true;
    }
  }, [canvases.length]);

  // 🚀 URENO PRINCIPLE: Chat→Canvas Integration Processor
  useEffect(() => {
    if (!pendingAction) return;

    // 🎯 DEFENSIVE STRIPPING: Ensure only work product reaches canvas (final safety net)
    const cleanedContent = SmartWorkProductAnalyzer.extractWorkProductOnly(
      pendingAction.content,
      pendingAction.metadata?.userRequest
    );

    // Use cleaned content for all operations
    const actionWithCleanContent = {
      ...pendingAction,
      content: cleanedContent
    };

    console.log('🚀 [Chat→Canvas] Processing pending action:', {
      type: actionWithCleanContent.type,
      title: actionWithCleanContent.title,
      targetCanvasId: actionWithCleanContent.targetCanvasId,
      activeCanvasId,
      currentCanvasCount: canvases.length,
      contentCleaned: pendingAction.content.length !== cleanedContent.length
    });

    try {
      if (actionWithCleanContent.type === 'create') {
        // Handle canvas reuse or create new canvas
        if (actionWithCleanContent.targetCanvasId) {
          // Reuse existing canvas (replace content)
          console.log('🔄 [Canvas Reuse] Replacing content in existing canvas:', actionWithCleanContent.targetCanvasId);

          const updatedCanvases = canvases.map(canvas =>
            canvas.id === actionWithCleanContent.targetCanvasId
              ? {
                ...canvas,
                title: actionWithCleanContent.title,
                content: actionWithCleanContent.content,
                modified: new Date(),
                metadata: {
                  ...canvas.metadata,
                  ...actionWithCleanContent.metadata,
                  assistant: actionWithCleanContent.metadata?.assistant,
                  wordCount: actionWithCleanContent.content.split(' ').length,
                  lastSaved: new Date(),
                  version: (canvas.metadata?.version || 1) + 1
                }
              }
              : canvas
          );
          setCanvases(updatedCanvases);
          setActiveCanvasId(actionWithCleanContent.targetCanvasId);

          if (onCanvasChange) {
            console.log('🔔 [Canvas Reuse] Notifying parent of canvas update');
            onCanvasChange(updatedCanvases);
          }

          console.log('✅ [Canvas Reuse] Updated existing canvas with new content');

          // 🔗 Link task to canvas in manifest
          if (actionWithCleanContent.metadata?.taskId) {
            try {
              const manifest = getOrchestrationManifest();
              manifest.linkTaskToCanvas(actionWithCleanContent.metadata.taskId, actionWithCleanContent.targetCanvasId);
              console.log('🔗 [Manifest] Linked task to canvas:', actionWithCleanContent.metadata.taskId, '→', actionWithCleanContent.targetCanvasId);
            } catch (error) {
              console.warn('⚠️ [Manifest] Failed to link task to canvas:', error);
            }
          }
        } else {
          // Create new canvas
          const newCanvas: Canvas = {
            id: uuidv4(),
            title: actionWithCleanContent.title,
            content: actionWithCleanContent.content,
            type: 'blank',
            created: new Date(),
            modified: new Date(),
            metadata: {
              assistant: actionWithCleanContent.metadata?.assistant,
              wordCount: actionWithCleanContent.content.split(' ').length,
              lastSaved: new Date(),
              version: 1,
              taskId: actionWithCleanContent.metadata?.taskId, // 🔗 Preserve taskId
              ...actionWithCleanContent.metadata
            }
          };

          const updatedCanvases = [...canvases, newCanvas];
          setCanvases(updatedCanvases);
          setActiveCanvasId(newCanvas.id);

          // 🧠 Register canvas in manifest
          if (newCanvas.metadata?.taskId) {
            try {
              const manifest = getOrchestrationManifest();
              manifest.registerCanvas({
                id: newCanvas.id,
                title: newCanvas.title,
                type: newCanvas.type,
                contentLength: newCanvas.content.length,
                taskId: newCanvas.metadata.taskId,
                metadata: newCanvas.metadata
              });
              manifest.linkTaskToCanvas(newCanvas.metadata.taskId, newCanvas.id);
              console.log('🧠 [Manifest] Registered new canvas:', newCanvas.id, '→ Task:', newCanvas.metadata.taskId);
            } catch (error) {
              console.warn('⚠️ [Manifest] Failed to register canvas:', error);
            }
          }

          if (onCanvasChange) {
            console.log('🔔 [Chat→Canvas] Notifying parent of new canvas');
            onCanvasChange(updatedCanvases);
          }

          console.log('✅ [Chat→Canvas] New canvas created:', newCanvas.title);
        }

      } else if (actionWithCleanContent.type === 'append') {
        // Append to current active canvas
        if (activeCanvasId) {
          const updatedCanvases = canvases.map(canvas =>
            canvas.id === activeCanvasId
              ? {
                ...canvas,
                content: canvas.content + '\n\n' + actionWithCleanContent.content,
                modified: new Date(),
                metadata: {
                  ...canvas.metadata,
                  lastSaved: new Date(),
                  version: (canvas.metadata?.version || 1) + 1
                }
              }
              : canvas
          );
          setCanvases(updatedCanvases);

          if (onCanvasChange) {
            console.log('🔔 [Chat→Canvas] Notifying parent of append');
            onCanvasChange(updatedCanvases);
          }

          console.log('✅ [Chat→Canvas] Content appended to canvas:', activeCanvasId);
        } else {
          console.warn('⚠️ [Chat→Canvas] No active canvas to append to, creating new one');
          // Fallback: create new canvas if no active one
          const newCanvas: Canvas = {
            id: uuidv4(),
            title: actionWithCleanContent.title,
            content: actionWithCleanContent.content,
            type: 'blank',
            created: new Date(),
            modified: new Date(),
            metadata: actionWithCleanContent.metadata
          };
          setCanvases(prev => [...prev, newCanvas]);
          setActiveCanvasId(newCanvas.id);
        }
      } else if (actionWithCleanContent.type === 'surgical_edit') {
        // 🎯 PRECISION SURGICAL EDIT: Task-Canvas linkage with self-healing
        console.log('🔬 [Surgical Edit] Starting precision surgical edit:', {
          providedTargetId: actionWithCleanContent.targetCanvasId,
          taskId: actionWithCleanContent.metadata?.taskId,
          activeCanvasId,
          canvasCount: canvases.length,
          canvasIds: canvases.map(c => c.id), // 🔍 DEBUG: Show all canvas IDs
          isEditLocked,
          userRequest: actionWithCleanContent.metadata?.userRequest
        });

        // 🔒 LOCK: Prevent canvas ID changes during operation
        setIsEditLocked(true);

        // 🔍 SELF-HEALING LOOKUP: Try multiple methods to find target canvas
        const { canvas: targetCanvas, method } = findCanvasWithSelfHealing(
          actionWithCleanContent.targetCanvasId,
          actionWithCleanContent.metadata?.taskId
        );

        console.log('🔍 [Surgical Edit] Self-healing lookup result:', {
          foundCanvas: !!targetCanvas,
          method,
          targetTitle: targetCanvas?.title,
          providedId: actionWithCleanContent.targetCanvasId,
          matchedId: targetCanvas?.id
        });

        let targetCanvasId = targetCanvas?.id;

        // 🎯 ENHANCED: Natural language document targeting (if still not found)
        if (!targetCanvasId && actionWithCleanContent.targetDocument) {
          const resolvedCanvasId = resolveDocumentTarget(
            canvases.map(c => ({
              id: c.id,
              content: c.content,
              title: c.title,
              isActive: c.id === activeCanvasId,
              contentType: c.type,
              lastModified: c.modified
            })),
            actionWithCleanContent.targetDocument,
            activeCanvasId
          );
          if (resolvedCanvasId) {
            targetCanvasId = resolvedCanvasId;
            console.log('🎯 [Document Targeting] Resolved target:', actionWithCleanContent.targetDocument, '→', targetCanvasId);
          }
        }

        if (!targetCanvas || !targetCanvasId) {
          console.warn('⚠️ [Surgical Edit] Target canvas not found after self-healing!', {
            providedTargetId: actionWithCleanContent.targetCanvasId,
            taskId: actionWithCleanContent.metadata?.taskId,
            availableCanvases: canvases.map(c => ({
              id: c.id,
              title: c.title,
              taskId: c.metadata?.taskId
            }))
          });
          // ❌ LAST RESORT: Create new canvas with strong warning
          console.error('❌ [CRITICAL] Creating new canvas - surgical edit target lost!', {
            reason: 'Target canvas not found after exhaustive search',
            recommendation: 'Check Task-Canvas linkage system'
          });

          const newCanvas: Canvas = {
            id: uuidv4(),
            title: actionWithCleanContent.title || 'Document',
            content: actionWithCleanContent.content,
            type: 'blank',
            created: new Date(),
            modified: new Date(),
            metadata: {
              ...actionWithCleanContent.metadata,
              surgicalEdit: true,
              fallbackCreated: true,
              taskId: actionWithCleanContent.metadata?.taskId,  // 🔗 Preserve taskId!
              originalTargetId: actionWithCleanContent.targetCanvasId,
              healMethod: 'fallback-create'
            }
          };
          setCanvases(prev => [...prev, newCanvas]);
          setActiveCanvasId(newCanvas.id);
          setIsEditLocked(false);
        } else {
          // ✅ SUCCESS: Apply surgical edit with PATCH-BASED approach (like Claude)
          console.log('✅ [Surgical Edit] Target canvas found via:', method);
          console.log('🔬 [Surgical Edit] Using PATCH-BASED surgical editing:', {
            targetId: targetCanvasId,
            taskId: targetCanvas.metadata?.taskId,
            healMethod: method,
            currentContentLength: targetCanvas.content.length,
            aiResponseLength: actionWithCleanContent.content.length,
            userRequest: actionWithCleanContent.metadata?.userRequest
          });

          // 🔧 PATCH-BASED SURGICAL EDIT: Extract specific changes, don't replace whole doc
          const originalUserRequest = actionWithCleanContent.metadata?.userRequest || '';

          // Step 1: Extract patches from AI response
          const patches = documentPatchService.extractPatchesFromResponse(
            actionWithCleanContent.content,
            targetCanvas.content,
            originalUserRequest,
            targetCanvasId
          );

          console.log('🔧 [Surgical Edit] Patches extracted:', patches.length);

          let newContent: string;
          let operationType: string;

          if (patches.length > 0) {
            // Step 2: Apply patches to document
            const { finalContent, results, totalReplaced } = documentPatchService.applyPatches(
              targetCanvas.content,
              patches
            );

            if (totalReplaced > 0) {
              newContent = finalContent;
              operationType = `PATCH_BASED (${totalReplaced} replacements)`;

              // Step 3: Save version for undo/redo
              documentPatchService.createVersion(
                targetCanvasId,
                targetCanvas.content, // Save BEFORE content
                patches,
                `Applied ${patches.length} patches from: "${originalUserRequest.substring(0, 50)}..."`
              );

              console.log('✅ [Surgical Edit] Patches applied successfully:', {
                patchesApplied: results.filter(r => r.success).length,
                totalReplacements: totalReplaced
              });
            } else {
              // Patches extracted but none matched - try fuzzy matching
              console.warn('⚠️ [Surgical Edit] Patches extracted but none matched - trying fuzzy match...');

              // Try case-insensitive partial matching for each patch
              let fuzzyMatched = false;
              let tempContent = targetCanvas.content;

              for (const patch of patches) {
                if (patch.oldContent) {
                  // Try to find similar text (case-insensitive, partial match)
                  const searchLower = patch.oldContent.toLowerCase();
                  const contentLower = tempContent.toLowerCase();
                  const fuzzyIndex = contentLower.indexOf(searchLower);

                  if (fuzzyIndex !== -1) {
                    // Found a fuzzy match - replace it
                    const actualOldText = tempContent.substring(fuzzyIndex, fuzzyIndex + patch.oldContent.length);
                    tempContent = tempContent.substring(0, fuzzyIndex) + patch.newContent + tempContent.substring(fuzzyIndex + patch.oldContent.length);
                    fuzzyMatched = true;
                    console.log(`✅ [Surgical Edit] Fuzzy matched: "${actualOldText}" → "${patch.newContent}"`);
                  }
                }
              }

              if (fuzzyMatched) {
                newContent = tempContent;
                operationType = 'FUZZY_PATCH_MATCH';
              } else {
                // Still no match - look for explicit work product in AI response
                // Strip any explanation text and look for actual document content
                const workProductMatch = actionWithCleanContent.content.match(/```(?:markdown|text|md)?\s*([\s\S]+?)```/);
                const documentSection = workProductMatch ? workProductMatch[1].trim() : null;

                if (documentSection && documentSection.length > 50) {
                  // AI gave us a formatted document section - this IS the edit
                  // Find where it should go by looking for overlap
                  const firstLine = documentSection.split('\n')[0];
                  const overlapIndex = targetCanvas.content.indexOf(firstLine.substring(0, 30));

                  if (overlapIndex !== -1) {
                    // Found overlap - this is a section replacement
                    newContent = documentSection;
                    operationType = 'SECTION_REPLACEMENT';
                  } else {
                    // No overlap - AI regenerated, use as full replacement
                    newContent = documentSection;
                    operationType = 'FULL_DOC_REPLACE (from code block)';
                  }
                } else {
                  // Last resort: Keep original, don't append garbage
                  console.warn('⚠️ [Surgical Edit] Could not apply changes - keeping original');
                  newContent = targetCanvas.content;
                  operationType = 'NO_CHANGE (patches failed)';
                }
              }
            }
          } else {
            // No patches extracted - try alternative extraction methods
            console.warn('⚠️ [Surgical Edit] No patches extracted - trying alternative extraction...');

            // ALTERNATIVE 1: Look for "change X to Y" directly in AI response
            const changeMatches = actionWithCleanContent.content.matchAll(/(?:change|replace|update)\s+["']?(.+?)["']?\s+(?:to|with)\s+["']?(.+?)["']?/gi);
            let extractedPatches: Array<{ old: string, new: string }> = [];

            for (const match of changeMatches) {
              if (match[1] && match[2]) {
                extractedPatches.push({ old: match[1].trim(), new: match[2].trim() });
              }
            }

            if (extractedPatches.length > 0) {
              let tempContent = targetCanvas.content;
              let appliedCount = 0;

              for (const patch of extractedPatches) {
                // Try exact match first
                if (tempContent.includes(patch.old)) {
                  tempContent = tempContent.split(patch.old).join(patch.new);
                  appliedCount++;
                  console.log(`✅ [Alt Extract] Applied: "${patch.old}" → "${patch.new}"`);
                } else {
                  // Try case-insensitive
                  const regex = new RegExp(patch.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                  if (regex.test(tempContent)) {
                    tempContent = tempContent.replace(regex, patch.new);
                    appliedCount++;
                    console.log(`✅ [Alt Extract] Applied (case-insensitive): "${patch.old}" → "${patch.new}"`);
                  }
                }
              }

              if (appliedCount > 0) {
                newContent = tempContent;
                operationType = `ALT_EXTRACTION (${appliedCount} changes)`;
              } else {
                // Couldn't apply any - keep original
                newContent = targetCanvas.content;
                operationType = 'NO_CHANGE (alt extraction failed)';
              }
            } else {
              // ALTERNATIVE 2: Check if AI response IS the edited document
              const aiHasDocStructure = /^#|^\*\*[A-Z]|^[A-Z][A-Z]+:/m.test(actionWithCleanContent.content);
              const lengthRatio = actionWithCleanContent.content.length / targetCanvas.content.length;

              // Look for code blocks with document content
              const codeBlockMatch = actionWithCleanContent.content.match(/```(?:markdown|text|md)?\s*([\s\S]+?)```/);

              if (codeBlockMatch) {
                // Use code block content as the document
                newContent = codeBlockMatch[1].trim();
                operationType = 'FULL_DOC_REPLACE (from code block)';
              } else if (aiHasDocStructure && lengthRatio > 0.5 && lengthRatio < 2.0) {
                // AI regenerated with similar length - probably the edited version
                newContent = actionWithCleanContent.content;
                operationType = 'FULL_DOC_REPLACE (AI regenerated)';
              } else {
                // Can't determine intent - keep original document unchanged
                console.warn('⚠️ [Surgical Edit] Could not determine edit intent - keeping original');
                newContent = targetCanvas.content;
                operationType = 'NO_CHANGE (unclear intent)';
              }
            }
          }

          // Apply the updated content
          const oldVersion = targetCanvas.metadata?.version || 1;
          const newVersion = oldVersion + 1;

          const updatedCanvases = canvases.map(canvas => {
            if (canvas.id === targetCanvasId) {
              console.log('✨ [Surgical Edit] PATCH-BASED edit applied:', {
                operation: operationType,
                userRequest: originalUserRequest.substring(0, 50),
                oldLength: canvas.content.length,
                newLength: newContent.length
              });

              return {
                ...canvas,
                content: newContent,
                modified: new Date(),
                metadata: {
                  ...canvas.metadata,
                  taskId: canvas.metadata?.taskId || actionWithCleanContent.metadata?.taskId,
                  lastSaved: new Date(),
                  version: newVersion,
                  healMethod: method,
                  lastEditPrompt: actionWithCleanContent.metadata?.userRequest,
                  surgicalEdit: true,
                  lastOperationType: operationType
                }
              };
            }
            return canvas;
          });

          setCanvases(updatedCanvases);
          setActiveCanvasId(targetCanvasId);

          // 🔓 UNLOCK: Edit complete, allow canvas ID changes again
          setIsEditLocked(false);

          // 🔔 CRITICAL: Notify parent of canvas change
          if (onCanvasChange) {
            console.log('🔔 [Surgical Edit] Notifying parent of canvas change');
            onCanvasChange(updatedCanvases);
          }

          console.log('✅ [Surgical Edit] PATCH-BASED surgical edit completed successfully');
        }

      } else if (actionWithCleanContent.type === 'advanced_surgical_edit') {
        // 🧠 ADVANCED SURGICAL EDIT: Claude-style precision editing with smart document targeting
        const targetReference = actionWithCleanContent.targetDocument || actionWithCleanContent.targetCanvasId || activeCanvasId || '';

        if (targetReference && actionWithCleanContent.editInstruction) {
          console.log('🧠 [Advanced Surgical Edit] Targeting document:', targetReference);

          // Convert current canvas format to the surgical editor format
          const currentCanvases = canvases.map(canvas => ({
            id: canvas.id,
            content: canvas.content,
            isActive: canvas.id === activeCanvasId,
            title: canvas.title,
            contentType: canvas.type,
            lastModified: canvas.modified
          }));

          // Perform advanced surgical edit with smart targeting
          const editResult = performAdvancedSurgicalEdit(
            currentCanvases,
            targetReference, // This can now be "petition", "todo list", or canvas ID
            {
              action: actionWithCleanContent.editInstruction.action,
              targetDescription: actionWithCleanContent.editInstruction.targetDescription,
              content: actionWithCleanContent.content,
              preserveFormatting: actionWithCleanContent.editInstruction.preserveFormatting ?? true
            }
          );

          if (editResult.success) {
            // Apply the surgical edit results back to canvas state
            setCanvases(prev => prev.map(canvas => {
              const updatedCanvas = editResult.updatedCanvases.find(c => c.id === canvas.id);
              if (updatedCanvas) {
                return {
                  ...canvas,
                  content: updatedCanvas.content,
                  modified: updatedCanvas.lastModified,
                  metadata: {
                    ...canvas.metadata,
                    ...actionWithCleanContent.metadata,
                    lastSaved: new Date(),
                    version: (canvas.metadata?.version || 1) + 1,
                    surgicalEdit: true,
                    editType: 'advanced_surgical'
                  }
                };
              }
              return canvas;
            }));

            // Set the edited canvas as active
            if (editResult.targetDocumentInfo) {
              setActiveCanvasId(editResult.targetDocumentInfo.id);
              console.log('✅ [Advanced Surgical Edit] Successfully applied to:', editResult.targetDocumentInfo.title);
              console.log('📊 Content length changed:', `${editResult.targetDocumentInfo.originalLength} → ${editResult.targetDocumentInfo.newLength} characters`);
            }

            if (editResult.errors.length > 0) {
              console.warn('⚠️ [Advanced Surgical Edit] Warnings:', editResult.errors);
            }
          } else {
            console.error('❌ [Advanced Surgical Edit] Failed:', editResult.errors);
            // Fallback to basic surgical edit
            console.log('🔄 [Fallback] Attempting basic surgical edit...');

            // Try to resolve the target for fallback
            const resolvedId = resolveDocumentTarget(currentCanvases, targetReference, activeCanvasId);

            if (resolvedId) {
              setCanvases(prev => prev.map(canvas =>
                canvas.id === resolvedId
                  ? {
                    ...canvas,
                    content: canvas.content + '\n\n' + actionWithCleanContent.content,
                    modified: new Date(),
                    metadata: {
                      ...canvas.metadata,
                      ...actionWithCleanContent.metadata,
                      lastSaved: new Date(),
                      version: (canvas.metadata?.version || 1) + 1,
                      surgicalEdit: true,
                      editType: 'fallback'
                    }
                  }
                  : canvas
              ));
              setActiveCanvasId(resolvedId);
            }
          }
        } else {
          console.warn('⚠️ [Advanced Surgical Edit] Missing target document or edit instruction');
        }

      } else if (actionWithCleanContent.type === 'edit') {
        // 📝 REGULAR EDIT: Add content to existing canvas or create new one
        console.log('📝 [Regular Edit] Processing edit action');

        if (activeCanvasId && canvases.some(c => c.id === activeCanvasId)) {
          // Edit existing active canvas
          setCanvases(prev => prev.map(canvas =>
            canvas.id === activeCanvasId
              ? {
                ...canvas,
                content: canvas.content + '\n\n' + actionWithCleanContent.content,
                modified: new Date(),
                metadata: {
                  ...canvas.metadata,
                  ...actionWithCleanContent.metadata,
                  lastSaved: new Date(),
                  version: (canvas.metadata?.version || 1) + 1
                }
              }
              : canvas
          ));
        } else {
          // No active canvas, create new one
          console.log('📝 [Regular Edit] No active canvas, creating new one');
          const newCanvas: Canvas = {
            id: uuidv4(),
            title: actionWithCleanContent.title || `Auto-Generated - ${new Date().toLocaleDateString()}`,
            content: actionWithCleanContent.content,
            type: 'blank',
            created: new Date(),
            modified: new Date(),
            metadata: {
              ...actionWithCleanContent.metadata,
              version: 1,
              wordCount: actionWithCleanContent.content.split(' ').length
            }
          };

          setCanvases(prev => [...prev, newCanvas]);
          setActiveCanvasId(newCanvas.id);
        }
      }

      // Notify that action has been processed
      onActionProcessed?.();

    } catch (error) {
      console.error('❌ [Chat→Canvas] Error processing pending action:', error);
      onActionProcessed?.(); // Still call to clear the pending state
    }
  }, [pendingAction, activeCanvasId, canvases, onActionProcessed, selectedAssistant]);

  // Get active canvas (moved after history hook)
  // const activeCanvas = canvases.find(c => c.id === activeCanvasId); // Moved above

  // Create new canvas with template
  const createNewCanvas = useCallback((type: string = 'blank') => {
    const templateContent = getTemplateContent(type);

    // 🤖 ASSISTANT INTEGRATION: Include assistant info in canvas title
    const assistantSuffix = selectedAssistant ? ` (${selectedAssistant.name})` : '';
    const baseTitle = `${getTypeDisplayName(type)} ${canvases.length + 1}`;

    const newCanvas: Canvas = {
      id: uuidv4(),
      title: baseTitle + assistantSuffix,
      content: templateContent,
      type: type as Canvas['type'],
      created: new Date(),
      modified: new Date(),
      // 🔗 AI Drive integration fields
      aiDriveFileId: undefined,
      metadata: {
        assistant: selectedAssistant?.name,
        wordCount: 0,
        version: 1
      }
    };

    // 🎯 FIX: Add new canvas without overwriting, set as active
    const updatedCanvases = [...canvases, newCanvas];
    setCanvases(updatedCanvases);
    setActiveCanvasId(newCanvas.id);

    if (onCanvasChange) {
      onCanvasChange(updatedCanvases);
    }

    console.log(`🎨 CANVAS: Created new tab "${newCanvas.title}" (ID: ${newCanvas.id})`);
    console.log(`🤖 ASSISTANT: Using ${selectedAssistant?.name || 'General'} assistant`);
    console.log(`🧠 NEURAL: Settings active: ${neuralSettings?.preset || 'none'}`);
    console.log(`🎨 CANVAS: Total tabs: ${updatedCanvases.length}`);

    return newCanvas.id;
  }, [canvases, onCanvasChange, selectedAssistant, neuralSettings]);

  // 🔗 Load Canvas document from AI Drive
  const loadCanvasDocument = useCallback(async (document: CanvasDocument) => {
    console.log(`📂 Loading Canvas document: ${document.title}`);

    // Check if it's a markdown/text file or needs a previewer
    const extension = document.title.split('.').pop()?.toLowerCase();
    const isMarkdown = !extension || extension === 'md' || extension === 'txt';

    if (!isMarkdown) {
      console.log(`👁️ Switching to Preview Mode for ${extension} file`);
      setPreviewFile({
        id: document.id,
        title: document.title,
        type: document.type || extension,
        url: document.url // useCanvasAIDrive should provide this
      });
      setActiveCanvasId(''); // Distract from editor
      return;
    }

    setPreviewFile(null); // Clear preview mode

    const loadedCanvas: Canvas = {
      id: document.id,
      title: document.title,
      content: document.content,
      type: document.type,
      created: document.created,
      modified: document.modified,
      aiDriveFileId: document.aiDriveFileId,
      metadata: document.metadata
    };

    // Add to canvases and set as active
    const updatedCanvases = [...canvases, loadedCanvas];
    setCanvases(updatedCanvases);
    setActiveCanvasId(loadedCanvas.id);
    setShowDocumentBrowser(false);

    if (onCanvasChange) {
      onCanvasChange(updatedCanvases);
    }

    console.log(`✅ Canvas document loaded: ${document.title}`);
  }, [canvases, onCanvasChange]);

  // 🔗 Manual save Canvas to AI Drive
  const manualSaveCanvas = useCallback(async (canvasId: string) => {
    const canvas = canvases.find(c => c.id === canvasId);
    if (!canvas || !enableAIDriveSync) return;

    console.log(`💾 Manual save: ${canvas.title}`);
    const folderId = getAssistantFolderId();
    const fileId = await saveCanvasToAIDrive(canvas, folderId);

    if (fileId) {
      // Update canvas with AI Drive file ID
      const updatedCanvases = canvases.map(c =>
        c.id === canvasId
          ? { ...c, aiDriveFileId: fileId, metadata: { ...c.metadata, lastSaved: new Date() } }
          : c
      );
      setCanvases(updatedCanvases);

      if (onCanvasChange) {
        onCanvasChange(updatedCanvases);
      }
    }
  }, [canvases, enableAIDriveSync, saveCanvasToAIDrive, getAssistantFolderId, onCanvasChange]);

  // Close canvas
  const closeCanvas = useCallback((canvasId: string) => {
    const updatedCanvases = canvases.filter(c => c.id !== canvasId);
    setCanvases(updatedCanvases);

    // If closing active canvas, switch to another one
    if (activeCanvasId === canvasId) {
      const newActiveId = updatedCanvases.length > 0 ? updatedCanvases[0].id : '';
      setActiveCanvasId(newActiveId);
    }

    if (onCanvasChange) {
      onCanvasChange(updatedCanvases);
    }
  }, [canvases, activeCanvasId, onCanvasChange]);

  // Update canvas content with history integration
  const updateCanvasContent = useCallback((canvasId: string, content: string) => {
    console.log('🎨 CANVAS UPDATE: updateCanvasContent called', {
      canvasId,
      contentLength: content.length,
      activeCanvasId,
      totalCanvases: canvases.length
    });

    const updatedCanvases = canvases.map(c =>
      c.id === canvasId
        ? { ...c, content, modified: new Date() }
        : c
    );
    setCanvases(updatedCanvases);

    // 📚 Create history snapshot for active canvas
    if (canvasId === activeCanvasId) {
      const canvas = updatedCanvases.find(c => c.id === canvasId);
      if (canvas) {
        console.log('📚 HISTORY: Creating snapshot for canvas update');
        createSnapshot(content, canvas.title, 'minor', 'Content updated');
      }
    }

    if (onCanvasChange) {
      console.log('🔄 CANVAS: Notifying parent of canvas change');
      onCanvasChange(updatedCanvases);
    }
  }, [canvases, onCanvasChange, activeCanvasId, createSnapshot]);

  // Update canvas title  
  const updateCanvasTitle = useCallback((canvasId: string, title: string) => {
    const updatedCanvases = canvases.map(c =>
      c.id === canvasId
        ? { ...c, title, modified: new Date() }
        : c
    );
    setCanvases(updatedCanvases);

    if (onCanvasChange) {
      onCanvasChange(updatedCanvases);
    }
  }, [canvases, onCanvasChange]);

  // 📚 Handle undo with canvas restoration
  const handleUndo = useCallback(() => {
    const previousSnapshot = historyUndo();
    if (previousSnapshot && activeCanvas) {
      updateCanvasContent(activeCanvas.id, previousSnapshot.content);
      updateCanvasTitle(activeCanvas.id, previousSnapshot.title);
    }
  }, [historyUndo, activeCanvas, updateCanvasContent, updateCanvasTitle]);

  // 📚 Handle redo with canvas restoration  
  const handleRedo = useCallback(() => {
    const nextSnapshot = historyRedo();
    if (nextSnapshot && activeCanvas) {
      updateCanvasContent(activeCanvas.id, nextSnapshot.content);
      updateCanvasTitle(activeCanvas.id, nextSnapshot.title);
    }
  }, [historyRedo, activeCanvas, updateCanvasContent, updateCanvasTitle]);

  // 📚 Handle content restoration from history panel
  const handleHistoryRestore = useCallback((content: string, title: string) => {
    if (activeCanvas) {
      updateCanvasContent(activeCanvas.id, content);
      updateCanvasTitle(activeCanvas.id, title);
    }
  }, [activeCanvas, updateCanvasContent, updateCanvasTitle]);

  // 🔗 AI Drive handlers
  const handleAIDriveFileSelect = useCallback((file: any) => {
    loadCanvasDocument(file);
  }, [loadCanvasDocument]);

  const handleSaveToAIDrive = useCallback(async () => {
    if (!activeCanvas) return;

    // 🆕 If not saved yet, open the dialog
    if (!activeCanvas.aiDriveFileId) {
      setIsSaveDialogOpen(true);
      return;
    }

    try {
      console.log('💾 SAVE: Saving canvas to AI Drive...', activeCanvas.title);

      const result = await saveCanvasToAIDrive(activeCanvas);
      console.log('✅ SAVE SUCCESS: Canvas saved to AI Drive successfully');

      setCanvases(prev => prev.map(canvas =>
        canvas.id === activeCanvas.id
          ? { ...canvas, lastSaved: new Date(), metadata: { ...canvas.metadata, savedToAIDrive: true } }
          : canvas
      ));
    } catch (error) {
      console.error('❌ SAVE ERROR:', error);
      alert(`Save failed: ${error.message || 'Unknown error'}`);
    }
  }, [activeCanvas, saveCanvasToAIDrive, setCanvases]);

  const handleDialogSave = async (folderId: string, filename: string) => {
    if (!activeCanvas) return;

    try {
      console.log(`💾 DIALOG SAVE: Saving "${filename}" to folder ${folderId}`);
      const updatedCanvas = {
        ...activeCanvas,
        title: filename,
        modified: new Date(),
        isActive: true
      };

      // Save via service
      const fileId = await saveCanvasToAIDrive(updatedCanvas, folderId);

      if (!fileId) throw new Error('Failed to save file');

      // Update local state with new title and ID
      setCanvases(prev => prev.map(c =>
        c.id === activeCanvasId ? {
          ...c,
          title: filename,
          aiDriveFileId: fileId,
          metadata: { ...c.metadata, lastSaved: new Date(), savedToAIDrive: true }
        } : c
      ));

      console.log('✅ DIALOG SAVE: Success');
    } catch (error) {
      console.error('❌ DIALOG SAVE ERROR:', error);
      alert(`Save failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCanvasClose = useCallback((canvasId: string) => {
    const updatedCanvases = canvases.filter(c => c.id !== canvasId);
    setCanvases(updatedCanvases);

    // If closing active canvas, switch to first available
    if (canvasId === activeCanvasId && updatedCanvases.length > 0) {
      setActiveCanvasId(updatedCanvases[0].id);
    }

    if (onCanvasChange) {
      onCanvasChange(updatedCanvases);
    }
  }, [canvases, activeCanvasId, onCanvasChange]);

  const handleCanvasAdd = useCallback(() => {
    createNewCanvas();
  }, [createNewCanvas]);

  const handleTemplateSelect = useCallback((type: string) => {
    createNewCanvas(type);
  }, [createNewCanvas]);

  // 🖥️ FULLSCREEN HANDLERS
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    console.log(`🖥️ Canvas fullscreen ${!isFullscreen ? 'enabled' : 'disabled'}`);
  }, [isFullscreen]);

  // 🎨 CANVAS UI TOGGLE HANDLERS
  const toggleCanvasUI = useCallback(() => {
    setShowCanvasUI(prev => !prev);
    console.log(`🎨 Canvas UI ${!showCanvasUI ? 'shown' : 'hidden'} - tabs and editing tools ${!showCanvasUI ? 'visible' : 'collapsed'}`);
  }, [showCanvasUI]);

  // Handle fullscreen keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F11 or Ctrl+Shift+F for fullscreen toggle
      if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        toggleFullscreen();
      }
      // Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  // ✨ ENHANCEMENT PANEL HANDLERS
  const toggleEnhancementPanel = useCallback((event?: React.MouseEvent) => {
    if (event) {
      // Position panel near the button that triggered it
      const rect = event.currentTarget.getBoundingClientRect();
      setEnhancementPanelPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
    setShowEnhancementPanel(prev => !prev);
    console.log(`✨ Enhancement panel ${!showEnhancementPanel ? 'opened' : 'closed'}`);
  }, [showEnhancementPanel]);

  const handleApplyEnhancement = useCallback((enhancement: any) => {
    console.log('✨ Applying enhancement:', enhancement);
    // In real implementation, this would apply the enhancement to the active canvas
    if (activeCanvas) {
      // Mock enhancement application - replace with actual AI enhancement logic
      const updatedContent = activeCanvas.content + `\n<!-- Applied: ${enhancement.title} -->`;
      updateCanvasContent(activeCanvas.id, updatedContent);
      setShowEnhancementPanel(false);
    }
  }, [activeCanvas, updateCanvasContent]);

  // Get template content based on type with assistant integration
  function getTemplateContent(type: string): string {
    const assistantName = selectedAssistant?.name || 'GenieFlow AI Assistant';
    const date = new Date().toLocaleDateString();
    const neuralInfo = neuralSettings?.preset ? ` (Neural AI: ${neuralSettings.preset} mode)` : '';

    switch (type) {
      case 'legal':
        return `# Legal Document

## Case Information
- **Case Title**: 
- **Case Number**: 
- **Court**: 
- **Date**: ${date}
- **Prepared by**: ${assistantName}${neuralInfo}

## Document Content

[Begin your legal document here...]

---
*This document was created using ${assistantName}${neuralInfo}*`;

      case 'business':
        return `# Business Document

**Date**: ${date}
**Prepared by**: ${assistantName}${neuralInfo}
**Subject**: 

## Executive Summary

[Provide a brief overview of the document's purpose...]

## Main Content

[Begin your business document content here...]

---
*Document created with GenieFlow AI*`;

      case 'creative':
        return `# Research Report

**Research Topic**: 
**Date**: ${date}
**Researcher**: ${assistantName}${neuralInfo}

## Abstract

[Brief summary of the research...]

## Introduction

[Begin your research content here...]

## Methodology

## Results

## Conclusion

---
*Research document created with ${assistantName}${neuralInfo}*`;

      case 'medical':
        return `# Personal Letter

**Date**: ${date}
**Assistant**: ${assistantName}${neuralInfo}

Dear [Recipient],

[Begin your personal letter here...]

Best regards,
[Your Name]

---
*Letter created with ${assistantName}${neuralInfo}*`;

      default:
        return `# New Document

**Created**: ${date}
**Assistant**: ${assistantName}${neuralInfo}

[Start writing your document here...]

---
*Document created with ${assistantName}${neuralInfo}*`;
    }
  }

  function getTypeDisplayName(type: string): string {
    switch (type) {
      case 'legal': return 'Legal Document';
      case 'business': return 'Business Document';
      case 'creative': return 'Research Report';
      case 'medical': return 'Personal Letter';
      default: return 'Document';
    }
  }

  // Show document editor with tabs (always show full interface)
  return (
    <div className={`flex flex-col bg-white transition-all duration-300 ${isFullscreen
      ? 'fixed inset-0 z-50 h-screen w-screen'
      : 'h-full'
      }`}>
      {/* 💾 SAVE DIALOG */}
      <CanvasSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleDialogSave}
        initialFilename={activeCanvas?.title}
      />

      {/* Canvas Header - Clean and Simple */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        {/* Left - Canvas Title */}
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-semibold text-gray-900">Canvas</h1>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {canvases.length} Document{canvases.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Right - Controls */}
        <div className="flex items-center space-x-1">
          {/* MODE TOGGLE */}
          <ModeToggle />

          {/* Cloud/Save buttons */}
          <Button
            variant={showAIDriveBrowser ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAIDriveBrowser(!showAIDriveBrowser)}
            className={`p-1.5 ${showAIDriveBrowser ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:bg-blue-100'}`}
            title={showAIDriveBrowser ? "Hide Drive Documents" : "Show Drive Documents"}
          >
            <Cloud className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant={showAgentsSidebar ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAgentsSidebar(!showAgentsSidebar)}
            className={`p-1.5 ${showAgentsSidebar ? 'bg-purple-600 text-white hover:bg-purple-700' : 'hover:bg-purple-100'}`}
            title={showAgentsSidebar ? "Hide Agents Panel" : "Show Agents Panel"}
          >
            <Bot className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant={showHistoryPanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className={`p-1.5 ${showHistoryPanel ? 'bg-amber-600 text-white hover:bg-amber-700' : 'hover:bg-amber-100'}`}
            title={showHistoryPanel ? "Hide History" : "Show History"}
          >
            <History className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveToAIDrive}
            className="p-1.5 hover:bg-green-100"
            title={`Save "${activeCanvas?.title || 'document'}" to AI Drive`}
            disabled={!activeCanvas || saveState.isSaving}
          >
            {saveState.isSaving ? (
              <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
          </Button>

          {onDetach && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDetach}
              className="p-1.5 hover:bg-purple-100 text-purple-600"
              title="Pop Out Canvas (Detach to Window)"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          )}

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 text-gray-600"
              title="Close Canvas Panel (Ctrl+D)"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar removed - all controls now in main header */}

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* AI Drive Browser Sidebar - Only show when Canvas UI is visible */}
        {showCanvasUI && showAIDriveBrowser && (
          <div className="w-80 border-r border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-600" />
                    My Documents
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">Click any document to open in canvas</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIDriveBrowser(false)}
                  title="Hide document browser"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <CanvasDocumentBrowser
                onDocumentSelect={handleAIDriveFileSelect}
                onCreateNew={handleCanvasAdd}
                className="h-full"
                assistantInfo={selectedAssistant}
              />
            </div>
          </div>
        )}

        {/* Canvas content area */}
        <div className="flex-1 min-w-0">
          {/* Tab System - Only show when Canvas UI is visible */}
          {showCanvasUI && (
            <EnhancedTabSystem
              canvases={canvases}
              activeCanvasId={activeCanvasId}
              onCanvasSelect={(id) => {
                setActiveCanvasId(id);
                setPreviewFile(null); // Clear preview when switching to a markdown tab
              }}
              onCanvasClose={handleCanvasClose}
              onCanvasCreate={(type) => type ? createNewCanvas(type) : handleCanvasAdd()}
              onCanvasRename={(id, newTitle) => updateCanvasTitle(id, newTitle)}
              showTemplateSelector={canvases.length === 0 && !previewFile}
            />
          )}

          {/* Document Editor or File Previewer */}
          <div className="flex-1 overflow-hidden">
            {previewFile ? (
              <FilePreviewer
                file={previewFile}
                onClose={() => {
                  setPreviewFile(null);
                  if (canvases.length > 0) setActiveCanvasId(canvases[0].id);
                }}
              />
            ) : activeCanvas ? (
              activeCanvas.type === 'visualizer' || 
              activeCanvas.content.includes('```mermaid') || 
              activeCanvas.content.includes('graph ') ||
              activeCanvas.content.includes('sequenceDiagram') ||
              (activeCanvas.content.includes('[') && activeCanvas.content.includes('{') && activeCanvas.content.includes(':'))
              ? (
                <SovereignVisualizer 
                  content={activeCanvas.content} 
                  type={activeCanvas.type}
                  onEdit={(content) => updateCanvasContent(activeCanvas.id, content)}
                />
              ) : (
                <DocumentEditorLayout
                  documentTitle={activeCanvas.title}
                  onTitleChange={(title) => updateCanvasTitle(activeCanvas.id, title)}
                  documentContent={activeCanvas.content}
                  onContentChange={(content) => updateCanvasContent(activeCanvas.id, content)}
                  documentType={getTypeDisplayName(activeCanvas.type)}
                  lastModified={activeCanvas.modified}
                  rightPanelContent={null}
                />
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50">
                <Sparkles className="h-12 w-12 text-blue-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-400">Select a document to begin</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-xs">Use the Drive or create a new tab above</p>
              </div>
            )}
          </div>
        </div>

        {/* 🤖 AGENTS & HISTORY SIDEBAR - Collapsible Right Panel */}
        {showCanvasUI && (showAgentsSidebar || showHistoryPanel) && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 flex-shrink-0 flex flex-col overflow-hidden">
            {/* Panel Tabs or Header */}
            <div className="flex border-b border-gray-200 bg-white">
              <button
                onClick={() => { setShowAgentsSidebar(true); setShowHistoryPanel(false); }}
                className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${showAgentsSidebar && !showHistoryPanel ? 'border-purple-600 text-purple-600 bg-purple-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Bot className="w-3.5 h-3.5" />
                Active Agents
              </button>
              <button
                onClick={() => { setShowHistoryPanel(true); setShowAgentsSidebar(false); }}
                className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${showHistoryPanel ? 'border-amber-600 text-amber-600 bg-amber-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <History className="w-3.5 h-3.5" />
                History
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowAgentsSidebar(false); setShowHistoryPanel(false); }}
                className="px-2 hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Panel Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
              {showAgentsSidebar && !showHistoryPanel && (
                <div className="h-full">
                  <ActiveAgentsPanel onSelectAgent={(id) => console.log('Selected agent:', id)} />
                </div>
              )}

              {showHistoryPanel && (
                <DocumentHistoryPanel
                  content={activeCanvas?.content || ''}
                  title={activeCanvas?.title || ''}
                  onContentRestore={handleHistoryRestore}
                  onSnapshotCreate={(description) => createSnapshot(activeCanvas?.content || '', activeCanvas?.title || '', 'minor', description)}
                  showInSidebar={true}
                  className="h-full border-0 shadow-none bg-transparent"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhancement Panel - Only show when Canvas UI is visible */}
      {showCanvasUI && (
        <CanvasEnhancementPanel
          isVisible={showEnhancementPanel}
          onClose={() => setShowEnhancementPanel(false)}
          documentContent={activeCanvas?.content || ''}
          onApplyEnhancement={handleApplyEnhancement}
          position={enhancementPanelPosition}
        />
      )}
    </div>
  );
};

export default UnifiedCanvasSystem;
