/**
 * useWorkbenchSessions.ts
 * 
 * Manages multi-session state, persistent local storage synchronization,
 * and parallel background task execution across workbench sessions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkbenchSession } from '../../components/workbench/WorkbenchSessionHistoryDrawer';
import { StudioMessage, ThoughtTraceStep } from '../../components/workbench/types';
import { DomainType, DomainProfile } from '../../services/ai/UniversalDomainOperator';
import { unwrapModelDeliverable } from '../../utils/deliverableUnwrapper';
import { buildSocraticOnboardingMessage } from '../../services/workbench/workbenchPromptBuilder';

export const INITIAL_DEMO_SESSIONS: WorkbenchSession[] = [
  {
    id: 'session-ramirez',
    title: 'Ramirez, Yolanda — WCJ Reconsideration Answer',
    caseNumber: 'ADJ20377197',
    domainType: 'legal',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
    messages: [
      {
        id: 'msg-ram-1',
        role: 'user',
        content: 'Draft Request for Approval to Answer WCJ Report under 8 CCR § 10964 for Yolanda Ramirez (ADJ20377197). WCJ conflated specific injury with cumulative trauma claim.',
        timestamp: '11:45 AM'
      },
      {
        id: 'msg-ram-2',
        role: 'assistant',
        content: 'Drafted 28-line legal pleading and complete 8 CCR § 10964 Request for Approval with verbatim statutory citations, factual chronology, and points & authorities.',
        timestamp: '11:46 AM',
        auditScore: 98
      }
    ],
    generatedOutput: `# REQUEST FOR APPROVAL TO ANSWER WCJ REPORT\n\n**Case No.:** ADJ20377197 **Applicant:** Yolanda Ramirez **Defendant:** Country Villa / Pacific Hospital Supply\n\n[Full 28-Line Pleading compiled in AI_GENERATED_DOCS/RAMIREZ_YOLANDA/]`,
    artifacts: [
      {
        id: 'doc-ram-1',
        title: 'Petition: 8 CCR § 10964',
        content: `# REQUEST FOR APPROVAL TO ANSWER WCJ REPORT\n\n**Case No.:** ADJ20377197 **Applicant:** Yolanda Ramirez **Defendant:** Country Villa / Pacific Hospital Supply\n\n[Full 28-Line Pleading compiled in AI_GENERATED_DOCS/RAMIREZ_YOLANDA/]`,
        timestamp: '11:46 AM'
      }
    ],
    activeArtifactId: 'doc-ram-1'
  }
];

export function useWorkbenchSessions(profiles: Record<DomainType, DomainProfile>) {
  // Master sessions list
  const [sessions, setSessions] = useState<WorkbenchSession[]>(() => {
    try {
      const stored = localStorage.getItem('sutraflow_workbench_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_e) {}
    return INITIAL_DEMO_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('sutraflow_workbench_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch (_e) {}
    return 'session-ramirez';
  });

  // Parallel session background execution registry
  const [runningSessionIds, setRunningSessionIds] = useState<Record<string, boolean>>({});

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || INITIAL_DEMO_SESSIONS[0];

  // Active session localized states
  const [activeDomainType, setActiveDomainType] = useState<DomainType>(activeSession.domainType || 'legal');
  const [messages, setMessages] = useState<StudioMessage[]>(() => activeSession.messages || []);
  const [generatedOutput, setGeneratedOutput] = useState<string>(() => {
    return activeSession.generatedOutput ? unwrapModelDeliverable(activeSession.generatedOutput).content : '';
  });
  const [sessionArtifacts, setSessionArtifacts] = useState<Array<{ id: string; title: string; content: string; timestamp: string; diskPath?: string }>>(() => {
    if (activeSession.artifacts && activeSession.artifacts.length > 0) return activeSession.artifacts;
    return [{ id: 'doc-primary', title: 'Deliverable', content: activeSession.generatedOutput || '', timestamp: 'Active' }];
  });
  const [activeArtifactId, setActiveArtifactId] = useState<string>(() => activeSession.activeArtifactId || 'doc-primary');
  const [liveThoughtSteps, setLiveThoughtSteps] = useState<ThoughtTraceStep[]>(() => activeSession.liveThoughtSteps || []);
  const [attachedFileName, setAttachedFileName] = useState<string>(activeSession.attachedFileName || '');
  const [evidenceText, setEvidenceText] = useState<string>(activeSession.evidenceText || '');
  const [notepadText, setNotepadText] = useState<string>(activeSession.notepadText || '');

  // Track active session changes and sync to master sessions
  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;

  // Debounced auto-save active session state to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === activeSessionId);
        if (idx === -1) return prev;
        const current = prev[idx];
        const updated: WorkbenchSession = {
          ...current,
          domainType: activeDomainType,
          messages,
          generatedOutput,
          liveThoughtSteps,
          attachedFileName,
          evidenceText,
          notepadText,
          artifacts: sessionArtifacts,
          activeArtifactId,
          updatedAt: Date.now()
        };
        const next = [...prev];
        next[idx] = updated;
        try {
          localStorage.setItem('sutraflow_workbench_sessions', JSON.stringify(next));
        } catch (_e) {}
        return next;
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeSessionId, messages, generatedOutput, activeDomainType, attachedFileName, evidenceText, notepadText, sessionArtifacts, activeArtifactId]);

  // Session switching handler
  const handleSelectSession = useCallback((sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    setActiveSessionId(sessionId);
    setActiveDomainType(target.domainType || 'legal');
    setMessages(target.messages || []);
    const cleanOutput = unwrapModelDeliverable(target.generatedOutput || '').content;
    setGeneratedOutput(cleanOutput);
    setLiveThoughtSteps(target.liveThoughtSteps || []);
    setAttachedFileName(target.attachedFileName || '');
    setEvidenceText(target.evidenceText || '');
    if (target.notepadText !== undefined) {
      setNotepadText(target.notepadText);
    }

    const restoredArtifacts = target.artifacts && target.artifacts.length > 0
      ? target.artifacts
      : [{ id: 'doc-primary', title: 'Deliverable', content: cleanOutput || '', timestamp: 'Active' }];
    setSessionArtifacts(restoredArtifacts);
    const restoredActiveId = target.activeArtifactId || restoredArtifacts[0]?.id || 'doc-primary';
    setActiveArtifactId(restoredActiveId);
  }, [sessions]);

  // Create new project session
  const handleCreateSession = useCallback((domainType: DomainType) => {
    const newId = `session-${Date.now()}`;
    const cleanEmptyArtifacts = [{ id: 'doc-primary', title: 'Deliverable', content: '', timestamp: 'Active' }];

    const domainLabels: Record<string, string> = {
      legal: 'Litigation Matter',
      medical: 'Clinical Audit Project',
      real_estate: 'Property Advisory Project',
      coding: 'Software Engineering Project',
      accounting: 'Forensic Accounting Audit',
      business_ops: 'Executive Operations Sprint',
      biotech: 'Life Sciences Study',
      architecture: 'Building Code Review',
      custom: 'Custom Practice Brain'
    };

    const isCustom = domainType === 'custom';
    const initMessage: StudioMessage = isCustom
      ? buildSocraticOnboardingMessage()
      : {
          id: `init-${Date.now()}`,
          role: 'assistant',
          content: `SutraFlow ${profiles[domainType]?.title || 'Copilot'} initialized for new project session. Attach source records or choose a high-impact workflow below to begin.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

    const newSession: WorkbenchSession = {
      id: newId,
      title: `New ${domainLabels[domainType] || 'Project'} (${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })})`,
      domainType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [initMessage],
      generatedOutput: '',
      liveThoughtSteps: [],
      artifacts: cleanEmptyArtifacts,
      activeArtifactId: 'doc-primary'
    };

    const nextSessions = [newSession, ...sessions];
    setSessions(nextSessions);
    setActiveSessionId(newId);
    setActiveDomainType(domainType);
    setMessages(newSession.messages);
    setGeneratedOutput('');
    setSessionArtifacts(cleanEmptyArtifacts);
    setActiveArtifactId('doc-primary');
    setLiveThoughtSteps([]);
    setAttachedFileName('');
    setEvidenceText('');
    setNotepadText('');

    try {
      localStorage.setItem('sutraflow_workbench_sessions', JSON.stringify(nextSessions));
    } catch (_e) {}

    return newId;
  }, [sessions, profiles]);

  // Parallel background task state manager
  const markSessionRunning = useCallback((sessionId: string, isRunning: boolean) => {
    setRunningSessionIds((prev) => {
      const next = { ...prev };
      if (isRunning) next[sessionId] = true;
      else delete next[sessionId];
      return next;
    });
  }, []);

  // Update session data whether active or running in background
  const updateSessionData = useCallback((sessionId: string, updater: (s: WorkbenchSession) => WorkbenchSession) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = updater(next[idx]);
      return next;
    });

    // If currently looking at this session, sync live state
    if (activeSessionIdRef.current === sessionId) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        const updated = updater(session);
        setMessages(updated.messages);
        setGeneratedOutput(updated.generatedOutput);
        if (updated.liveThoughtSteps) setLiveThoughtSteps(updated.liveThoughtSteps);
        if (updated.artifacts) setSessionArtifacts(updated.artifacts);
      }
    }
  }, [sessions]);

  return {
    sessions,
    setSessions,
    activeSessionId,
    activeSession,
    runningSessionIds,
    activeDomainType,
    setActiveDomainType,
    messages,
    setMessages,
    generatedOutput,
    setGeneratedOutput,
    sessionArtifacts,
    setSessionArtifacts,
    activeArtifactId,
    setActiveArtifactId,
    liveThoughtSteps,
    setLiveThoughtSteps,
    attachedFileName,
    setAttachedFileName,
    evidenceText,
    setEvidenceText,
    notepadText,
    setNotepadText,
    handleSelectSession,
    handleCreateSession,
    markSessionRunning,
    updateSessionData
  };
}
