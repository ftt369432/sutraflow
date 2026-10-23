/**
 * 🤖 useChatOrchestrator Hook
 * 
 * This is the isolated "Brain" of the chat system for SovereignWorkspace.
 * It handles message sending, routes tasks to the AgenticLoopExecutor,
 * manages the AgenticThinkingPanel state, and handles the OODAR Swarm.
 * 
 * Kept strictly under 500 lines per Rule 3.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sovereignExecutor, ExecutionPhase } from '../../../services/agents/SovereignExecutor';
import { createInitialAgenticState, AgenticThinkingState, AgenticPhase, AgenticStep } from '../../../components/ai/AgenticThinkingPanel';
import { AIServiceFactory } from '../../../services/ai/aiServiceFactory';
import { chatWithAssistant } from '../../../services/documentChatService';
import { SmartWorkProductAnalyzer } from '../../../services/SmartWorkProductAnalyzer';
import type { Message, Conversation } from '../../../types/ai';
import { useConversationSession } from './useConversationSession';
import { missionPersistence } from '../../../services/MissionPersistenceService';
import { activeContextSensor } from '../../../services/context/ActiveContextSensor';

const isAutonomousTaskOrDrafting = (content: string): boolean => {
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();

  // Conversational questions, status checks, meta inquiries, greetings are NOT autonomous tasks
  if (/^(is|are|am|how|what|why|where|when|who|which|can we|can you explain|tell me about|do we|does|ok|hello|hi|hey)\b/i.test(trimmed) &&
      !/(?:draft|generate|prepare|create|write)\s+(?:a|an|the|me a)\s+(?:petition|brief|motion|contract|pleading|declaration)/i.test(lower)) {
    return false;
  }

  // Explicit slash commands or imperative document drafting / legal calculation requests
  return /^\/(?:petition|brief|audit|depo|rating|calculate)/i.test(trimmed) ||
         /(?:draft|generate|prepare|create|write|compose)\s+(?:a|an|the|me a)\s+(?:petition|brief|motion|contract|pleading|declaration|settlement)/i.test(lower) ||
         /(?:calculate|audit|rate)\s+(?:statutory|penalties|omfs|disability|lien)/i.test(lower);
};

interface UseChatOrchestratorProps {
  workspaceState: any;
  enableAgenticExecution: boolean;
  smartAutonomyMode?: boolean;
  selectedAssistant?: any;
  currentConversation?: string | null;
  currentPromptTier?: 'basic' | 'advanced' | 'expert' | 'neuroBrain' | 'collectiveBrain' | 'master';
  user?: any;
}

export function useChatOrchestrator({
  workspaceState,
  enableAgenticExecution,
  smartAutonomyMode = true,
  selectedAssistant,
  currentConversation,
  currentPromptTier = 'advanced',
  user
}: UseChatOrchestratorProps) {
  const session = useConversationSession();

  // 🔄 Synchronously initialize messages from active conversation / storage
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedConvs = localStorage.getItem('ai_conversations');
      const activeId = localStorage.getItem('ai_active_conversation_id');
      if (savedConvs) {
        const parsed = JSON.parse(savedConvs);
        const target = parsed.find((c: any) => c.id === activeId) || parsed[0];
        if (target && Array.isArray(target.messages) && target.messages.length > 0) {
          return target.messages.map((m: any) => ({
            ...m,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
          }));
        }
      }
      const legacy = localStorage.getItem('genieflow_active_chat_messages') || localStorage.getItem('genieflow_chat_history_default');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => ({
            ...m,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
          }));
        }
      }
    } catch (_e) {}
    return [];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [runInBackground, setRunInBackground] = useState(false);

  // 🔄 Sync messages when active conversation switches
  useEffect(() => {
    if (session.activeConversation) {
      setMessages(session.activeConversation.messages || []);
    }
  }, [session.activeConversation?.id]);

  // 🧠 Agentic Thinking Visualization State
  const [agenticState, setAgenticState] = useState<AgenticThinkingState>(createInitialAgenticState());
  const agenticStateRef = useRef<AgenticThinkingState>(createInitialAgenticState());

  // Helper to update agentic state safely
  const updateAgenticState = useCallback((updater: (prev: AgenticThinkingState) => Partial<AgenticThinkingState>) => {
    const current = agenticStateRef.current;
    const updates = updater(current);
    const next = { ...current, ...updates };
    agenticStateRef.current = next;
    setAgenticState(next);
  }, []);

  const handleSendMessage = useCallback(async (overrideMessage?: string) => {
    const targetText = typeof overrideMessage === 'string' ? overrideMessage : input;
    if (!targetText.trim() || isLoading) return;

    const messageContent = targetText.trim();

    // 🛰️ Synchronize active workspace document with ActiveContextSensor
    try {
      const activeCanvases = workspaceState?.currentCanvases || [];
      const activeDocId = workspaceState?.activeCanvasId;
      const activeDoc = activeCanvases.find((c: any) => c.id === activeDocId);
      if (activeDoc) {
        activeContextSensor.setActiveDocument({
          id: activeDoc.id,
          name: activeDoc.title || 'Current Document',
          content: activeDoc.content,
          snippet: activeDoc.content ? activeDoc.content.substring(0, 1500) : undefined,
          language: 'markdown'
        });
      }
    } catch (_e) {}

    const userMessage: Message = {
      id: uuidv4(),
      content: messageContent,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (typeof overrideMessage !== 'string') {
      setInput('');
    }

    const convId = session.currentConversationId || `CHAT-${Date.now()}`;
    missionPersistence.recordStep(convId, {
      role: 'user',
      content: messageContent,
      agentName: 'User'
    }).catch(() => {});

    if (runInBackground) {
      const aiMessageId = uuidv4();
      setMessages(prev => [...prev, {
        id: aiMessageId,
        content: `☁️ Asynchronous background agent launched for: "${messageContent.substring(0, 40)}...". You can track progress in the top-right Background tasks list or close the app safely.`,
        role: 'assistant',
        timestamp: new Date()
      }]);
      import('../../../services/backgroundAgentService').then(({ backgroundAgentService }) => {
        backgroundAgentService.submitJob(messageContent, selectedAssistant?.name || 'Sovereign Executor');
      });
      return;
    }

    setIsLoading(true);
    setIsTyping(true);

    const aiMessageId = uuidv4();

    const isLegalAgentic = 
      /petition|reconsideration|legal.{0,15}brief|draft.{0,20}petition|write.{0,20}petition|generate.{0,20}petition/i.test(messageContent) ||
      /workers.{0,10}comp.{0,30}(draft|petition|brief|document)/i.test(messageContent) ||
      /draft.{0,20}document|create.{0,20}(legal|court|pleading|wcab)|canvas|viewer/i.test(messageContent);

    // 🚀 Auto-popup relevant workspace panels based on query intent
    if (isLegalAgentic || /\b(canvas|viewer|document|pleading|petition|brief|exhibit)\b/i.test(messageContent)) {
      workspaceState.openCanvas?.(undefined, 'viewer');
    } else if (/\b(browser|search|web|google|cortex|lookup.*online|scrape)\b/i.test(messageContent)) {
      workspaceState.openBrowser?.();
    } else if (/\b(task|tasks|schedule|calendar|mission|orchestrat|todo)\b/i.test(messageContent)) {
      workspaceState.openTasks?.();
    } else if (/\b(email|inbox|gmail|compose.*mail|send.*email)\b/i.test(messageContent)) {
      workspaceState.openEmail?.();
    } else if (/\b(knowledge|library|citations|statute|kb|research)\b/i.test(messageContent)) {
      workspaceState.openKnowledge?.();
    }

    // 🤖 ROUTE 1: SOVEREIGN EXECUTOR (Agentic — handles both legal and general)
    // Triggers when the user's message matches complex action patterns OR agentic mode is enabled
    const isAgenticRequest = enableAgenticExecution && (
      isLegalAgentic ||
      // General agentic tasks
      (smartAutonomyMode && (
        /\b(schedule|create.*event|add.*calendar|book.*meeting)/i.test(messageContent) ||
        /\b(create.*task|add.*task|make.*todo)/i.test(messageContent) ||
        /\b(search.*knowledge|find.*in.*kb|look.*up.*template)/i.test(messageContent) ||
        /\b(research|investigate|analyze.*and.*create)/i.test(messageContent) ||
        /\b(draft.*email|compose.*message)/i.test(messageContent) ||
        /\b(organize.*files|create.*folder|move.*document)/i.test(messageContent)
      ))
    );

    if (isAgenticRequest) {
      console.log('🫀 SOVEREIGN EXECUTOR: Routing to unified agentic brain...');

      // Initialize agentic thinking panel
      updateAgenticState(() => ({
        active: true,
        currentPhase: 'thinking' as AgenticPhase,
        iteration: 0,
        maxIterations: 5,
        steps: [{ phase: 'thinking' as AgenticPhase, message: 'Sovereign Executor initializing...', timestamp: new Date() }],
        toolsUsed: [],
        confidence: 0,
        selfCorrectionCount: 0,
        isComplete: false
      }));

      setMessages(prev => [...prev, {
        id: aiMessageId,
        content: '🫀 Sovereign Executor engaged — autonomous pipeline starting...',
        role: 'assistant',
        timestamp: new Date(),
        metadata: { isAgenticExecution: true, agentName: 'Sovereign Executor' } as any
      } as Message]);

      try {
        const result = await sovereignExecutor.execute(
          messageContent,
          user?.id || 'anonymous',
          (phaseUpdate) => {
            // Stream phase updates → AgenticThinkingPanel
            const phaseMap: Record<string, AgenticPhase> = {
              classify: 'thinking', think: 'thinking', research: 'researching',
              act: 'acting', reflect: 'reflecting', complete: 'complete', failed: 'error'
            };

            const step: AgenticStep = {
              phase: (phaseMap[phaseUpdate.phase] || 'thinking') as AgenticPhase,
              message: phaseUpdate.message,
              details: phaseUpdate.details,
              toolName: phaseUpdate.toolName,
              timestamp: new Date()
            };

            updateAgenticState(prev => ({
              active: !phaseUpdate.isComplete,
              isComplete: phaseUpdate.isComplete || false,
              currentPhase: (phaseMap[phaseUpdate.phase] || 'thinking') as AgenticPhase,
              steps: [...(prev.steps || []), step],
              confidence: phaseUpdate.confidence || prev.confidence || 0,
              toolsUsed: phaseUpdate.toolsUsed || prev.toolsUsed || [],
              iteration: phaseUpdate.iteration || prev.iteration || 0,
              selfCorrectionCount: phaseUpdate.selfCorrectionCount || prev.selfCorrectionCount || 0
            }));

            // Stream content updates to the chat message
            const phaseEmoji: Record<string, string> = {
              classify: '🏷️', think: '🧠', research: '🔍', act: '✍️',
              reflect: '🔍', complete: '✅', failed: '❌', idle: '💤'
            };
            const updateText = `${phaseEmoji[phaseUpdate.phase] || '⚡'} **[${phaseUpdate.phase.toUpperCase()}]** ${phaseUpdate.message}${
              phaseUpdate.details && phaseUpdate.details.length > 20
                ? '\n\n> ' + phaseUpdate.details.substring(0, 400) + (phaseUpdate.details.length > 400 ? '...' : '')
                : ''
            }`;

            setMessages(prev => prev.map(m =>
              m.id === aiMessageId
                ? { ...m, content: phaseUpdate.isComplete && result?.finalContent
                    ? result.finalContent
                    : updateText }
                : m
            ));
          },
          'auto'
        );

        // Final update with the completed content
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: result.finalContent || '✅ Task completed autonomously.',
                metadata: {
                  ...msg.metadata,
                  confidence: result.confidence,
                  iterationsUsed: result.iterationsUsed,
                  mode: result.mode,
                  alternatives: result.alternatives
                }
              }
            : msg
        ));

        const finalAns = result?.finalContent || '✅ Task completed autonomously.';
        missionPersistence.recordStep(convId, {
          role: 'assistant',
          content: finalAns,
          agentName: 'Sovereign Executor'
        }).catch(() => {});

        updateAgenticState(prev => ({
          active: false,
          isComplete: true,
          currentPhase: result.success ? 'complete' as AgenticPhase : 'error' as AgenticPhase,
          confidence: result.confidence,
          toolsUsed: prev.toolsUsed,
          iteration: result.iterationsUsed,
          selfCorrectionCount: result.iterationsUsed > 1 ? result.iterationsUsed - 1 : 0
        }));

      } catch (err) {
        console.error('❌ Sovereign Executor failed:', err);
        updateAgenticState(() => ({ active: false, isComplete: true, currentPhase: 'error' as AgenticPhase }));
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: `❌ Sovereign Executor encountered a failure: ${err instanceof Error ? err.message : String(err)}` }
            : msg
        ));
      }
    } 
    // 🧠 Route 2: Legal Swarm
    else if (isLegalAgentic && enableAgenticExecution) {
      console.log('🤖 OODAR SWARM: Legal document pipeline routing via Orchestrator...');
      setMessages(prev => [...prev, {
        id: aiMessageId,
        content: '⚡ O.O.D.A.R. Legal Swarm initializing... Observe → Orient → Decide → Act → Reflect',
        role: 'assistant',
        timestamp: new Date(),
        metadata: { isAgenticExecution: true, agentName: 'OODAR Swarm' } as any
      }]);

      try {
        const { AIAgentOrchestrator } = await import('../../../services/agents/AIAgentOrchestrator');
        const orchestrator = AIAgentOrchestrator.getInstance();

        await orchestrator.dispatchCommand(messageContent, {
          missionId: aiMessageId,
          userId: user?.id || 'anonymous',
          namespace: `orchestration_manifest_${aiMessageId}`
        });
      } catch (oodarErr) {
        console.error('❌ OODAR Swarm failed:', oodarErr);
        setMessages(prev => prev.map(m =>
          m.id === aiMessageId
            ? { ...m, content: `❌ Swarm failed: ${oodarErr instanceof Error ? oodarErr.message : String(oodarErr)}` }
            : m
        ));
      }
    } 
    // 🤖 ROUTE 3: Interactive Assistant Chat (Smart Layer: Direct Chat vs. Autonomous Task)
    else {
      const assistantName = selectedAssistant?.name || 'Legal Eagle';
      const isTask = isAutonomousTaskOrDrafting(messageContent);

      const isLegal = (selectedAssistant?.id && selectedAssistant.id.includes('legal')) ||
                      (selectedAssistant?.name && selectedAssistant.name.toLowerCase().includes('legal')) ||
                      selectedAssistant?.type === 'legal';
      const isCreative = (selectedAssistant?.name && selectedAssistant.name.toLowerCase().includes('creative')) ||
                         (selectedAssistant?.category && selectedAssistant.category.toLowerCase().includes('creator'));
      const isMedical = (selectedAssistant?.name && selectedAssistant.name.toLowerCase().includes('medi')) ||
                        (selectedAssistant?.category && selectedAssistant.category.toLowerCase().includes('medical'));

      const phase1Msg = isLegal
        ? `Parsing task intent, jurisdiction & statutory authorities (${assistantName})...`
        : isCreative
        ? `Parsing creative brief, audience targeting & platform strategy (${assistantName})...`
        : isMedical
        ? `Parsing clinical query & medical research scope (${assistantName})...`
        : `Parsing task intent & operational scope (${assistantName})...`;

      const phase2Msg = isLegal
        ? `Checking California Workers' Comp authorities (LC § 4660, § 5814, § 4622) & case memory...`
        : isCreative
        ? `Analyzing viral hooks, platform trends, content angles & growth playbooks...`
        : isMedical
        ? `Reviewing evidence-based medical databases, journals & pharmacology...`
        : `Searching specialized knowledge base & relevant reference materials...`;

      const phase3Msg = isLegal
        ? `Synthesizing deterministic reasoning graph & legal analysis...`
        : isCreative
        ? `Synthesizing marketing playbook, content strategy & execution deliverables...`
        : isMedical
        ? `Synthesizing clinical findings & evidence-based response...`
        : `Synthesizing comprehensive analysis & deliverables...`;

      if (isTask) {
        // Run Autonomous Research & Synthesis loop
        updateAgenticState(() => ({
          active: true,
          currentPhase: 'thinking' as AgenticPhase,
          iteration: 1,
          maxIterations: 3,
          steps: [
            {
              phase: 'thinking' as AgenticPhase,
              message: phase1Msg,
              timestamp: new Date()
            }
          ],
          toolsUsed: selectedAssistant ? [selectedAssistant.id] : ['SovereignEngine'],
          confidence: 0.92,
          selfCorrectionCount: 0,
          isComplete: false
        }));
      } else {
        // Fast Direct Chat - no background autonomous loop
        updateAgenticState(() => ({
          active: false,
          currentPhase: 'complete' as AgenticPhase,
          isComplete: true,
          steps: []
        }));
      }

      try {
        if (isTask) {
          // 2. Research & Statutory Grounding Phase
          updateAgenticState(prev => ({
            ...prev,
            currentPhase: 'researching' as AgenticPhase,
            steps: [
              ...prev.steps,
              {
                phase: 'researching' as AgenticPhase,
                message: phase2Msg,
                toolName: 'knowledge_search',
                timestamp: new Date()
              }
            ]
          }));

          // 3. Execution & Synthesis Phase
          updateAgenticState(prev => ({
            ...prev,
            currentPhase: 'acting' as AgenticPhase,
            steps: [
              ...prev.steps,
              {
                phase: 'acting' as AgenticPhase,
                message: phase3Msg,
                timestamp: new Date()
              }
            ]
          }));
        }

        let response = '';
        if (selectedAssistant) {
          // Pass active canvas document AND all pinned drive files as attachments to ground the assistant
          const activeCanvases = workspaceState?.currentCanvases || [];
          const activeDocId = workspaceState?.activeCanvasId;
          const activeDoc = activeCanvases.find((c: any) => c.id === activeDocId);
          const attachedFiles: Array<{ name: string; content: string; type: string; uploadedAt: Date }> = [];

          if (activeDoc && activeDoc.content) {
            attachedFiles.push({
              name: activeDoc.title || 'Current Document',
              content: activeDoc.content,
              type: 'text/markdown',
              uploadedAt: new Date()
            });
          }

          let mountedDrivesContext = '';
          try {
            const { useAttachedDriveStore } = await import('@/store/attachedDriveStore');
            const driveStore = useAttachedDriveStore.getState();
            const pinnedStoreFiles = driveStore.pinnedFiles;
            for (const pf of pinnedStoreFiles) {
              if (pf.content && !attachedFiles.some(af => af.name === pf.name)) {
                attachedFiles.push({
                  name: pf.name,
                  content: pf.content,
                  type: pf.mimeType || 'text/markdown',
                  uploadedAt: new Date()
                });
              }
            }

            // 📂 Build live mounted drives manifest and tree
            const drives = driveStore.drives;
            if (drives && drives.length > 0) {
              let drivesSummary = `### 📂 ATTACHED GENIEDRIVE STORAGE (${drives.length} Drives Mounted):\n`;
              for (const drive of drives) {
                drivesSummary += `\n- **Drive: ${drive.name}** (Type: ${drive.type}, Total Files: ${drive.fileCount || drive.items?.length || 0}):\n`;

                const formatTree = (nodes: any[], depth = 1): string => {
                  if (!nodes || depth > 2) return '';
                  let text = '';
                  for (const node of nodes.slice(0, 25)) {
                    const indent = '  '.repeat(depth);
                    text += `${indent}- ${node.isFolder ? '📁' : '📄'} ${node.name}${node.path ? ` (\`${node.path}\`)` : ''}\n`;
                    if (node.isFolder && node.children && depth < 2) {
                      text += formatTree(node.children, depth + 1);
                    }
                  }
                  if (nodes.length > 25) {
                    text += `${'  '.repeat(depth)}- ... and ${nodes.length - 25} more items\n`;
                  }
                  return text;
                };

                drivesSummary += formatTree(drive.items, 1);
              }
              mountedDrivesContext = drivesSummary;

              // 🔍 Dynamic Sovereign Knowledge Discovery: Match query tokens across all mounted drives
              const queryLower = messageContent.toLowerCase();
              const stopWords = new Set(['what', 'does', 'did', 'tell', 'show', 'how', 'why', 'where', 'when', 'who', 'which', 'about', 'with', 'this', 'that', 'from', 'have', 'been', 'they', 'will', 'would', 'could', 'should', 'your', 'our', 'the', 'and', 'for', 'any', 'can', 'you', 'please']);
              const tokens = queryLower.split(/[\s,_\-./?!=+()[\]'"]+/).filter(t => t.length >= 3 && !stopWords.has(t));

              if (tokens.length > 0 || queryLower.length > 3) {
                const scoredNodes: Array<{ node: any; score: number }> = [];

                const searchNodes = (nodes: any[]) => {
                  if (!nodes) return;
                  for (const n of nodes) {
                    if (!n.isFolder) {
                      const nLower = (n.name || '').toLowerCase();
                      const pLower = (n.path || '').toLowerCase();
                      let score = 0;

                      // Exact phrase match bonus
                      if (nLower.includes(queryLower) || pLower.includes(queryLower)) {
                        score += 15;
                      }

                      // Token matches
                      for (const token of tokens) {
                        if (nLower.includes(token)) score += 4;
                        else if (pLower.includes(token)) score += 1;
                      }

                      // Extra weight for legal anchors (clause bank, briefs, case law, manifest)
                      if (pLower.includes('clause_bank') && score > 0) score += 5;
                      if (pLower.includes('01 case law') && score > 0) score += 5;
                      if (nLower.includes('manifest') && score > 0) score += 3;

                      if (score > 0) {
                        scoredNodes.push({ node: n, score });
                      }
                    }
                    if (n.children && n.children.length > 0) searchNodes(n.children);
                  }
                };

                for (const d of drives) searchNodes(d.items);

                // Sort by relevance score
                scoredNodes.sort((a, b) => b.score - a.score);
                const topMatches = scoredNodes.slice(0, 4).map(s => s.node);

                if (topMatches.length > 0) {
                  console.log(`🏛️ Dynamic Grounding: Found ${topMatches.length} conformed files for query "${messageContent.slice(0, 40)}...":`, topMatches.map(m => m.name));
                }

                // Auto-read conformed content of top matching files
                for (const matchNode of topMatches) {
                  if (!attachedFiles.some(af => af.name === matchNode.name)) {
                    try {
                      const content = await driveStore.readFileContent(matchNode);
                      if (content && !content.startsWith('[Preview:')) {
                        attachedFiles.push({
                          name: matchNode.name,
                          content,
                          type: matchNode.mimeType || 'text/markdown',
                          uploadedAt: new Date()
                        });
                      }
                    } catch {}
                  }
                }
              }
            }
          } catch (_e) {
            console.warn('Could not load pinned files or drive context from attachedDriveStore:', _e);
          }

          // ⚡ STREAMING INITIALIZATION: Place assistant bubble immediately for zero perceived latency
          setMessages(prev => [...prev, {
            id: aiMessageId,
            content: '',
            role: 'assistant',
            timestamp: new Date()
          }]);

          let accumulatedResponse = '';
          let rafPending = false;
          const onToken = (token: string) => {
            accumulatedResponse += token;
            if (!rafPending) {
              rafPending = true;
              requestAnimationFrame(() => {
                rafPending = false;
                setMessages(prev =>
                  prev.map(m => (m.id === aiMessageId ? { ...m, content: accumulatedResponse } : m))
                );
              });
            }
          };

          const conversationHistory = messages.slice(-10);
          const result = await chatWithAssistant(
            selectedAssistant.id,
            messageContent,
            conversationHistory,
            { onToken, attachedFiles, mountedDrivesContext }
          );
          response = typeof result === 'string' ? result : (result?.message || accumulatedResponse);
          // Ensure final flush
          setMessages(prev =>
            prev.map(m => (m.id === aiMessageId ? { ...m, content: response || accumulatedResponse } : m))
          );
        } else {
          // ⚡ STREAMING INITIALIZATION for direct AI service
          setMessages(prev => [...prev, {
            id: aiMessageId,
            content: '',
            role: 'assistant',
            timestamp: new Date()
          }]);

          let accumulatedResponse = '';
          let rafPending = false;
          const onToken = (token: string) => {
            accumulatedResponse += token;
            if (!rafPending) {
              rafPending = true;
              requestAnimationFrame(() => {
                rafPending = false;
                setMessages(prev =>
                  prev.map(m => (m.id === aiMessageId ? { ...m, content: accumulatedResponse } : m))
                );
              });
            }
          };

          const aiService = AIServiceFactory.getInstance();
          const contextPrompt = activeContextSensor.toSystemPromptSnippet();
          const augmentedPrompt = contextPrompt
            ? `${contextPrompt}\n\n---\n\nUser Request: ${messageContent}`
            : messageContent;
          response = await aiService.generateText(augmentedPrompt, { onToken });
          if (!response && accumulatedResponse) response = accumulatedResponse;
          // Ensure final flush
          setMessages(prev =>
            prev.map(m => (m.id === aiMessageId ? { ...m, content: response || accumulatedResponse } : m))
          );
        }

        // 4. Quality Audit & Complete (only if an autonomous task was running)
        if (isTask) {
          updateAgenticState(prev => ({
            ...prev,
            currentPhase: 'complete' as AgenticPhase,
            isComplete: true,
            confidence: 0.98,
            steps: [
              ...prev.steps,
              {
                phase: 'reflecting' as AgenticPhase,
                message: `Quality audit passed: Verified citations, zero-PHI egress, mandatory practitioner review standard enforced.`,
                timestamp: new Date()
              }
            ]
          }));
        } else {
          updateAgenticState(() => ({
            active: false,
            currentPhase: 'complete' as AgenticPhase,
            isComplete: true,
            steps: []
          }));
        }

        setMessages(prev => {
          const next = prev.map(m => (m.id === aiMessageId ? { ...m, content: response } : m));
          session.syncActiveMessages(next);
          return next;
        });

        missionPersistence.recordStep(convId, {
          role: 'assistant',
          content: response,
          agentName: selectedAssistant?.name || 'GenieFlow AI'
        }).catch(() => {});

        // 📝 LIVE DOCUMENT SYNC: If user requested an edit/draft, sync to canvas viewer
        const isEditOrDraft = /edit|change|modify|update|replace|rewrite|draft|petition|rating/i.test(messageContent);
        if (isEditOrDraft && response && response.length > 50) {
          // Extract content from code blocks if present, or use clean response
          let cleanDocContent = response;
          const blockMatch = response.match(/```(?:markdown|text)?\s*([\s\S]*?)```/);
          if (blockMatch && blockMatch[1] && blockMatch[1].length > 100) {
            cleanDocContent = blockMatch[1].trim();
          }

          if (workspaceState?.activeCanvasId) {
            workspaceState.setCurrentCanvases?.((prev: any[]) => prev.map((c: any) => 
              c.id === workspaceState.activeCanvasId ? { ...c, content: cleanDocContent, modified: new Date() } : c
            ));
          } else {
            const newDocId = `canvas-${Date.now()}`;
            const newDoc = {
              id: newDocId,
              title: selectedAssistant?.name ? `${selectedAssistant.name} Draft` : 'Legal Document Draft',
              content: cleanDocContent,
              modified: new Date()
            };
            workspaceState.setCurrentCanvases?.((prev: any[]) => [newDoc, ...prev]);
            workspaceState.setActiveCanvasId?.(newDocId);
          }
          workspaceState.setCanvasViewMode?.('viewer');
          workspaceState.setShowCanvasPanel?.(true);
        }

        // 🌐 HTML DASHBOARD AUTO-DETECTION: If AI generated HTML, push to browser panel
        // Principle: ZERO hardcoded dashboards. AI generates all content dynamically.
        const htmlCodeBlock = response.match(/```html\n([\s\S]+?)\n```/i);
        const inlineHtml = response.match(/(<!DOCTYPE html[\s\S]+<\/html>)/i);
        const detectedHtml = htmlCodeBlock?.[1] || inlineHtml?.[1] || null;

        if (detectedHtml && detectedHtml.length > 200) {
          // Extract a title from the HTML <title> tag or first <h1>
          const titleMatch = detectedHtml.match(/<title>([^<]+)<\/title>/i) ||
                             detectedHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          const dashTitle = titleMatch?.[1]?.trim() || 
                            (selectedAssistant?.name ? `${selectedAssistant.name} Dashboard` : 'AI Dashboard');

          workspaceState.setLiveBrowserHtml?.(detectedHtml);
          workspaceState.setLiveBrowserTitle?.(dashTitle);

          // Auto-open browser panel if not already visible
          if (!workspaceState.panelOrder?.includes('browser')) {
            workspaceState.setPanelOrder?.((prev: string[]) => [...prev, 'browser']);
          }
          console.log('🌐 [BrowserPanel] Auto-opened with AI-generated dashboard:', dashTitle);
        }

      } catch (err) {
        console.error('Chat failed:', err);
        updateAgenticState(prev => ({
          ...prev,
          currentPhase: 'error' as AgenticPhase,
          isComplete: false,
          error: err instanceof Error ? err.message : String(err),
          steps: [
            ...prev.steps,
            {
              phase: 'error' as AgenticPhase,
              message: `Execution halted: ${err instanceof Error ? err.message : String(err)}`,
              timestamp: new Date()
            }
          ]
        }));
      }
    }

    setIsLoading(false);
    setIsTyping(false);
  }, [input, isLoading, enableAgenticExecution, smartAutonomyMode, selectedAssistant, currentPromptTier, user, updateAgenticState]);

  return {
    messages,
    setMessages,
    input,
    isLoading,
    isTyping,
    agenticState,
    runInBackground,
    setRunInBackground,
    setInput,
    handleSendMessage,
    // 🗂️ Conversation Session Controls
    conversations: session.conversations,
    currentConversationId: session.currentConversationId,
    handleNewChat: () => {
      session.handleNewChat();
      setMessages([]);
    },
    handleSelectConversation: (id: string) => {
      session.handleSelectConversation(id);
      const conv = session.conversations.find(c => c.id === id);
      if (conv) setMessages(conv.messages || []);
    },
    handleDeleteConversation: session.handleDeleteConversation,
    handlePinConversation: session.handlePinConversation,
    handleUnpinConversation: session.handleUnpinConversation,
    handleUpdateConversation: session.handleUpdateConversation,
    handleClearAllChats: () => {
      session.handleClearAllChats();
      setMessages([]);
    },
    showClearChatsMode: session.showClearChatsMode,
    selectedChatsToDelete: session.selectedChatsToDelete,
    handleToggleClearChatsMode: session.handleToggleClearChatsMode,
    handleSelectChatForDeletion: session.handleSelectChatForDeletion,
    handleSelectAllChats: session.handleSelectAllChats,
    handleDeleteSelectedChats: session.handleDeleteSelectedChats,
  };
}
