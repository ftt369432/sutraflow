import { Task } from '../../types/tasks';
import { CalendarEvent } from '../../types/autoCalendar.types';
import { Agent } from '../../types/agent';
import { Team } from '../../types/team';

export interface DemoWorkspaceData {
  tasks: Task[];
  events: CalendarEvent[];
  agents: Agent[];
  teams: Team[];
  documentsCount: number;
}

export class DemoDataService {
  private static STORAGE_KEY = 'genieflow_demo_workspace_v1';

  public static getDemoData(): DemoWorkspaceData {
    return {
      tasks: [
        {
          id: 'task-101',
          title: 'XPRIZE Final Submission System Verification',
          description: 'Perform end-to-end verification of multi-canvas routing, memory compactor, and Gemini 2.0 Flash local fallback engine.',
          status: 'in_progress',
          priority: 'urgent',
          dueDate: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
          category: 'Hackathon',
          subtasks: [
            { id: 'sub-1', title: 'Verify Devpost Markdown & LaTeX math rendering', completed: true },
            { id: 'sub-2', title: 'Test 1-click Demo Workspace initialization', completed: true },
            { id: 'sub-3', title: 'Validate Gemini 2.0 Flash API fallback response', completed: false }
          ],
          tags: ['XPRIZE', 'Sovereign-HQ', 'Gemini'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'task-102',
          title: 'Legal Precedent Synthesis & Risk Audit',
          description: 'Deploy Legal Swarms to extract key clauses from corporate IP contracts and verify compliance.',
          status: 'completed',
          priority: 'high',
          dueDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          category: 'Legal',
          subtasks: [
            { id: 'sub-4', title: 'Extract Labor Code sections and indemnity clauses', completed: true },
            { id: 'sub-5', title: 'Generate executive summary PDF in GenieDrive', completed: true }
          ],
          tags: ['Legal-Swarm', 'Compliance', 'OpenBrain'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'task-103',
          title: 'Financial Revenue & Margin Forecast Q4',
          description: 'Run Financial Oracle agent on Q3 performance metrics and simulate cost optimization strategies.',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          category: 'Finance',
          subtasks: [
            { id: 'sub-6', title: 'Calculate Cloud API token savings using MemoryCompactor', completed: false },
            { id: 'sub-7', title: 'Export visual Lego-stack builder chart', completed: false }
          ],
          tags: ['Finance', 'Analytics', 'Sovereign'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      events: [
        {
          id: 'event-201',
          title: 'XPRIZE Submission Final Countdown',
          description: 'Final submission deadline review for GenieFlow AI Sovereign Autonomous Platform.',
          start: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          end: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
          category: 'Deadline',
          color: '#ef4444',
          location: 'GenieFlow Sovereign HQ',
          attendees: ['hackathon-judge@xprize.org', 'devpost-review@google.com']
        },
        {
          id: 'event-202',
          title: 'Autonomous Swarm Strategy Sync',
          description: 'Daily automated sync across Legal, Financial, and Engineering autonomous background agents.',
          start: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          end: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
          category: 'Agent Sync',
          color: '#3b82f6',
          location: 'Virtual Swarm Channel',
          attendees: ['legal-agent@genieflowai.internal', 'cortex-reflector@genieflowai.internal']
        }
      ],
      agents: [
        {
          id: 'agent-301',
          name: 'Legal Swarm Leader',
          type: 'legal',
          status: 'active',
          model: 'gemini-2.0-flash',
          systemPrompt: 'You are an elite legal analyst agent specializing in contract extraction and compliance.',
          capabilities: ['document-synthesis', 'wikilink-indexing', 'legal-audit'],
          metrics: { tasksCompleted: 42, successRate: 98.5 }
        },
        {
          id: 'agent-302',
          name: 'Cortex Memory Compactor',
          type: 'system',
          status: 'active',
          model: 'local-ollama-fallback',
          systemPrompt: 'You compress conversation history into high-density Wikilinks to optimize token usage.',
          capabilities: ['token-reduction', 'context-compaction', 'open-brain'],
          metrics: { tasksCompleted: 156, successRate: 99.9 }
        },
        {
          id: 'agent-303',
          name: 'Financial Oracle',
          type: 'finance',
          status: 'idle',
          model: 'gemini-2.0-flash',
          systemPrompt: 'You evaluate cloud infrastructure expenditure and perform revenue simulations.',
          capabilities: ['margin-analysis', 'cost-prediction', 'chart-generation'],
          metrics: { tasksCompleted: 28, successRate: 96.0 }
        }
      ],
      teams: [
        {
          id: 'team-401',
          name: 'Executive Sovereign HQ',
          description: 'Core leadership team supervising autonomous agent swarms and enterprise strategy.',
          ownerId: 'demo-user-id',
          members: [
            { userId: 'demo-user-id', role: 'owner', name: 'Demo Administrator' },
            { userId: 'agent-301', role: 'agent', name: 'Legal Swarm Leader' }
          ],
          createdAt: new Date().toISOString()
        }
      ],
      documentsCount: 14
    };
  }

  public static initializeDemoWorkspace(): void {
    const data = this.getDemoData();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem('genieflow_demo_mode_active', 'true');
    console.log('✅ Demo Workspace initialized with comprehensive sample data across Agents, Tasks, Calendar, and Knowledge Base.');
  }

  public static isDemoModeActive(): boolean {
    return localStorage.getItem('genieflow_demo_mode_active') === 'true';
  }
}
