import { useTaskStore } from '../../store/taskStore';
import { useCalendarStore } from '../../store/calendarStore';
import { useAgentStore } from '../../store/agentStore';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { DemoDataService } from './demoDataService';

export function autoSeedDemoData() {
  try {
    const demoData = DemoDataService.getDemoData();

    // 1. Initialize Demo Workspace LocalStorage
    DemoDataService.initializeDemoWorkspace();

    // 2. Populate Task Store with Auto-Tasking & Subtasks
    const taskStore = useTaskStore.getState();
    if (taskStore) {
      const comprehensiveTasks = [
        ...demoData.tasks,
        {
          id: 'task-104',
          title: 'Auto-Tasking: Enterprise Security & Access Matrix',
          description: 'Autonomous security agent assigned task: Audit Supabase RLS policies and JWT callback scopes.',
          status: 'in_progress',
          priority: 'high',
          dueDate: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
          category: 'Security',
          subtasks: [
            { id: 'sub-8', title: 'Verify CORS headers in netlify.toml', completed: true },
            { id: 'sub-9', title: 'Test Google OAuth 2.0 refresh token rotation', completed: true },
            { id: 'sub-10', title: 'Audit local storage encryption keys', completed: false }
          ],
          tags: ['Security', 'OAuth', 'AutoTask'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'task-105',
          title: 'Chat-to-Schedule: Executive AI Morning Routine',
          description: 'Automatically scheduled by Morning Routine Agent based on user chat intent.',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
          category: 'Automation',
          subtasks: [
            { id: 'sub-11', title: 'Synthesize overnight email digest via IMAP', completed: false },
            { id: 'sub-12', title: 'Generate daily action items in Task Grid', completed: false }
          ],
          tags: ['ChatToSchedule', 'MorningRoutine'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      comprehensiveTasks.forEach((task: any) => {
        if (!taskStore.tasks.some(t => t.id === task.id)) {
          taskStore.addTask(task);
        }
      });
    }

    // 3. Populate Calendar Store with Malleable Auto-Calendar Data
    const calendarStore = useCalendarStore.getState();
    if (calendarStore) {
      const comprehensiveEvents = [
        ...demoData.events,
        {
          id: 'event-203',
          title: 'AI Multi-Canvas Synthesis Session',
          description: 'Live interactive document creation with targeted surgical editing.',
          start: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
          end: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
          category: 'Canvas',
          color: '#8b5cf6',
          location: 'Interactive Document Canvas',
          attendees: ['creator@genieflowai.com', 'canvas-orchestrator@genieflowai.internal']
        },
        {
          id: 'event-204',
          title: 'LiveXP Hackathon Final Demo Review',
          description: 'Demonstration of GenieFlow AI Sovereign Autonomous Platform capabilities.',
          start: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
          end: new Date(Date.now() + 9 * 3600 * 1000).toISOString(),
          category: 'Review',
          color: '#10b981',
          location: 'Main Presentation Stage',
          attendees: ['judges@xprize.org']
        }
      ];

      comprehensiveEvents.forEach((event: any) => {
        if (!calendarStore.events.some(e => e.id === event.id)) {
          calendarStore.addEvent(event);
        }
      });
    }

    // 4. Populate Knowledge Base Store with Multi-Format Documents
    const kbStore = useKnowledgeBaseStore.getState();
    if (kbStore) {
      const comprehensiveDocs = [
        {
          id: 'doc-demo-1',
          title: 'XPRIZE Sovereign Autonomous System Architecture.md',
          content: `# XPRIZE Sovereign Autonomous System Architecture\n\n## 1. Executive Summary\nGenieFlow AI introduces the first local-first, multi-agent swarm architecture designed for enterprise document synthesis and zero-entropy memory compaction.\n\n## 2. Core Superpowers\n- **MemoryCompactor**: Algorithmic token reduction achieving 64.2% context savings.\n- **Multi-Canvas Orchestrator**: Side-by-side targeted document editing with Wikilink graph extraction.\n- **Sovereign HQ**: Autonomous parallel execution loop with local Ollama fallback.\n\n[[MemoryCompactor]] [[SovereignHQ]] [[MultiCanvas]]`,
          type: 'markdown',
          category: 'Architecture',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['XPRIZE', 'Architecture', 'Sovereign']
        },
        {
          id: 'doc-demo-2',
          title: 'Legal Case Swarm Analysis - Intellectual Property.pdf',
          content: `# Legal Case Analysis & Risk Compliance Audit\n\n## Overview\nAnalysis of Corporate IP Licensing Agreements and Labor Code Compliance.\n\n### Key Findings\n1. Clause 14.2: Indemnification terms aligned with standard commercial practice.\n2. Section 8.1: Non-compete scope bound by geographic jurisdiction.\n\n[[LegalSwarm]] [[ComplianceAudit]]`,
          type: 'pdf',
          category: 'Legal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['Legal', 'Compliance', 'Audit']
        },
        {
          id: 'doc-demo-3',
          title: 'Q4 Financial Modeling & Cloud API Savings.xlsx',
          content: `# Financial Cost Optimization & Token Economics\n\n- Baseline Cloud Token Expenditure: $14,200 / mo\n- Optimized with MemoryCompactor: $4,980 / mo\n- Total Cost Reduction: 64.9%\n\n[[FinancialOracle]] [[TokenEconomics]]`,
          type: 'excel',
          category: 'Finance',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['Finance', 'Savings', 'Analytics']
        }
      ];

      comprehensiveDocs.forEach((doc: any) => {
        if (kbStore.documents && !kbStore.documents.some((d: any) => d.id === doc.id)) {
          if (kbStore.addDocument) {
            Promise.resolve(kbStore.addDocument(doc)).catch((err) => {
              // Ignore unauthenticated initial load warning; documents are hydrated on demo user login
            });
          }
        }
      });
    }

    console.log('✨ All Capabilities & Demo Test Data (Calendar, Auto-Tasking, Swarms, Multi-Canvas Docs) injected!');
  } catch (error) {
    console.warn('Auto-seed execution note:', error);
  }
}
