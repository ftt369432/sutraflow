import { NotebookBlock, NotebookSection } from '../types/notebook';

export interface NotebookTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  type: 'business' | 'project' | 'education' | 'personal' | 'research' | 'creative' | 'legal';
  sections: TemplateSectionData[];
  metadata: {
    purpose?: 'business' | 'education' | 'personal' | 'research' | 'creative' | 'custom' | 'legal';
    layout?: 'standard' | 'kanban' | 'timeline' | 'mindmap' | 'document';
    features: {
      aiAssistance: boolean;
      taskIntegration: boolean;
      calendarIntegration: boolean;
      collaborationTools?: boolean;
      codeBlocks?: boolean;
      mathEquations?: boolean;
      drawingTools?: boolean;
      documentAttachment: boolean;
      timeTracking: boolean;
      clientPortal: boolean;
      billing: boolean;
      conflictChecking: boolean;
      tags?: boolean;
      tableOfContents?: boolean;
    };
    appearance?: {
      theme?: string;
      fontFamily?: string;
      compact?: boolean;
      color?: string;
      icon?: string;
    };
    icon?: string;
    customFields?: Record<string, string>;
  };
}

export interface TemplateSectionData {
  id: string;
  title: string;
  icon?: string;
  blocks: TemplateBlockData[];
}

export interface TemplateBlockData {
  id: string;
  type: 'text' | 'task' | 'calendar' | 'image' | 'file' | 'code' | 'math' | 'drawing';
  content: any;
  metadata?: any;
}

export const businessTemplates: NotebookTemplate[] = [
  {
    id: 'business-plan',
    name: 'Business Plan',
    description: 'A comprehensive template for creating a business plan, including executive summary, market analysis, and financial projections.',
    tags: ['business', 'planning', 'strategy'],
    type: 'business',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        icon: 'summary',
        blocks: [
          {
            id: 'executive-summary-text',
            type: 'text',
            content: '# Executive Summary\n\nProvide a high-level overview of your business plan. This section should be compelling and concise (1-2 pages).\n\n## Business Overview\n\n[Describe your business concept, vision, mission, and core values]\n\n## Value Proposition\n\n[Explain what makes your product or service unique and valuable to customers]\n\n## Objectives\n\n[List your key business objectives and goals]'
          },
          {
            id: 'executive-summary-task',
            type: 'task',
            content: 'Complete executive summary draft',
            metadata: {
              task: {
                priority: 'high',
                status: 'todo',
                dueDate: null
              }
            }
          }
        ]
      },
      {
        id: 'market-analysis',
        title: 'Market Analysis',
        icon: 'market',
        blocks: [
          {
            id: 'market-analysis-text',
            type: 'text',
            content: '# Market Analysis\n\n## Target Market\n\n[Define your target customer segments with demographics, behaviors, and needs]\n\n## Industry Analysis\n\n[Analyze industry trends, size, growth rate, and key players]\n\n## Competitive Analysis\n\n[Identify direct and indirect competitors, their strengths and weaknesses]\n\n## SWOT Analysis\n\n**Strengths**\n- [List internal strengths]\n\n**Weaknesses**\n- [List internal weaknesses]\n\n**Opportunities**\n- [List external opportunities]\n\n**Threats**\n- [List external threats]'
          },
          {
            id: 'market-analysis-task-1',
            type: 'task',
            content: 'Research competitor pricing and positioning',
            metadata: {
              task: {
                priority: 'medium',
                status: 'todo',
                dueDate: null
              }
            }
          },
          {
            id: 'market-analysis-task-2',
            type: 'task',
            content: 'Complete market size estimation',
            metadata: {
              task: {
                priority: 'high',
                status: 'todo',
                dueDate: null
              }
            }
          }
        ]
      },
      {
        id: 'marketing-strategy',
        title: 'Marketing Strategy',
        icon: 'marketing',
        blocks: [
          {
            id: 'marketing-strategy-text',
            type: 'text',
            content: '# Marketing Strategy\n\n## Positioning\n\n[Define how you want customers to perceive your brand]\n\n## Pricing Strategy\n\n[Explain your pricing model and rationale]\n\n## Promotion Strategy\n\n[Outline your advertising, PR, and promotional activities]\n\n## Distribution Strategy\n\n[Describe how customers will acquire your product/service]'
          },
          {
            id: 'marketing-strategy-calendar',
            type: 'calendar',
            content: 'Marketing launch timeline',
            metadata: {
              calendar: {
                title: 'Marketing Campaign Launch',
                description: 'Roll out promotional activities',
                startDate: null,
                endDate: null
              }
            }
          }
        ]
      },
      {
        id: 'financial-plan',
        title: 'Financial Plan',
        icon: 'financial',
        blocks: [
          {
            id: 'financial-plan-text',
            type: 'text',
            content: '# Financial Plan\n\n## Startup Costs\n\n[Detail all initial expenses needed to start the business]\n\n## Projected Profit & Loss\n\n[Forecast revenue and expenses for 3-5 years]\n\n## Cash Flow Projection\n\n[Project monthly cash inflows and outflows]\n\n## Break-even Analysis\n\n[Calculate when your business will become profitable]\n\n## Funding Requirements\n\n[Specify how much funding you need and how it will be used]'
          },
          {
            id: 'financial-plan-task',
            type: 'task',
            content: 'Create 3-year financial projections',
            metadata: {
              task: {
                priority: 'high',
                status: 'todo',
                dueDate: null
              }
            }
          }
        ]
      }
    ],
    metadata: {
      purpose: 'business',
      layout: 'standard',
      features: {
        aiAssistance: true,
        taskIntegration: true,
        calendarIntegration: true,
        collaborationTools: true,
        codeBlocks: false,
        mathEquations: true,
        drawingTools: false,
        documentAttachment: true,
        timeTracking: false,
        clientPortal: false,
        billing: false,
        conflictChecking: false,
        tags: true,
        tableOfContents: true
      },
      customFields: {
        industry: '',
        fundingStage: '',
        targetMarket: '',
        businessType: ''
      }
    }
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'A structured template for capturing effective meeting notes, action items, and decisions.',
    tags: ['business', 'meetings', 'collaboration'],
    type: 'business',
    sections: [
      {
        id: 'meeting-details',
        title: 'Meeting Details',
        icon: 'meeting',
        blocks: [
          {
            id: 'meeting-details-text',
            type: 'text',
            content: '# Meeting Information\n\n**Date:** [Date]\n**Time:** [Start time] - [End time]\n**Location:** [Physical location or virtual platform]\n**Meeting Type:** [Regular team meeting, project review, client meeting, etc.]\n\n## Attendees\n\n- [Name, Role]\n- [Name, Role]\n\n## Agenda\n\n1. [Agenda item 1]\n2. [Agenda item 2]\n3. [Agenda item 3]'
          },
          {
            id: 'meeting-details-calendar',
            type: 'calendar',
            content: 'Meeting schedule',
            metadata: {
              calendar: {
                title: 'Team Meeting',
                description: 'Regular team sync-up',
                startDate: null,
                endDate: null,
                recurring: true,
                recurrencePattern: 'weekly'
              }
            }
          }
        ]
      },
      {
        id: 'discussion-notes',
        title: 'Discussion Notes',
        icon: 'notes',
        blocks: [
          {
            id: 'discussion-notes-text',
            type: 'text',
            content: '# Discussion Notes\n\n## Topic 1: [Topic Title]\n\n[Key points discussed]\n\n### Decisions\n- [Decision 1]\n- [Decision 2]\n\n### Questions\n- [Question 1]\n- [Question 2]\n\n## Topic 2: [Topic Title]\n\n[Key points discussed]\n\n### Decisions\n- [Decision 1]\n- [Decision 2]\n\n### Questions\n- [Question 1]\n- [Question 2]'
          }
        ]
      },
      {
        id: 'action-items',
        title: 'Action Items',
        icon: 'tasks',
        blocks: [
          {
            id: 'action-items-text',
            type: 'text',
            content: '# Action Items\n\nCapture clear, assignable tasks with owners and due dates.'
          },
          {
            id: 'action-items-task-1',
            type: 'task',
            content: '[Task description]',
            metadata: {
              task: {
                priority: 'medium',
                status: 'todo',
                dueDate: null,
                assignee: ''
              }
            }
          },
          {
            id: 'action-items-task-2',
            type: 'task',
            content: '[Task description]',
            metadata: {
              task: {
                priority: 'medium',
                status: 'todo',
                dueDate: null,
                assignee: ''
              }
            }
          },
          {
            id: 'action-items-task-3',
            type: 'task',
            content: '[Task description]',
            metadata: {
              task: {
                priority: 'medium',
                status: 'todo',
                dueDate: null,
                assignee: ''
              }
            }
          }
        ]
      },
      {
        id: 'follow-up',
        title: 'Follow-up',
        icon: 'follow-up',
        blocks: [
          {
            id: 'follow-up-text',
            type: 'text',
            content: '# Follow-up\n\n## Next Meeting\n\n**Date:** [Date]\n**Time:** [Start time] - [End time]\n**Location:** [Physical location or virtual platform]\n\n## Preliminary Agenda\n\n1. [Agenda item 1]\n2. [Agenda item 2]'
          },
          {
            id: 'follow-up-calendar',
            type: 'calendar',
            content: 'Next meeting schedule',
            metadata: {
              calendar: {
                title: 'Follow-up Meeting',
                description: 'Continue discussion from today',
                startDate: null,
                endDate: null
              }
            }
          }
        ]
      }
    ],
    metadata: {
      purpose: 'business',
      layout: 'standard',
      features: {
        aiAssistance: true,
        taskIntegration: true,
        calendarIntegration: true,
        collaborationTools: true,
        codeBlocks: false,
        mathEquations: false,
        drawingTools: false,
        documentAttachment: true,
        timeTracking: false,
        clientPortal: false,
        billing: false,
        conflictChecking: false,
        tags: true,
        tableOfContents: false
      },
      customFields: {
        meetingType: '',
        department: '',
        frequency: '',
        requiredAttendees: ''
      }
    }
  }
];

export const projectTemplates: NotebookTemplate[] = [
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'A comprehensive template for planning and tracking a project, including goals, timeline, resources, and risks.',
    tags: ['project', 'planning', 'management'],
    type: 'project',
    sections: [
      {
        id: 'project-overview',
        title: 'Project Overview',
        icon: 'overview',
        blocks: [
          {
            id: 'project-overview-text',
            type: 'text',
            content: '# Project Overview\n\n## Project Name\n[Project name]\n\n## Project Description\n[Brief description of the project, its purpose, and expected outcomes]\n\n## Objectives\n- [Specific, measurable objective 1]\n- [Specific, measurable objective 2]\n- [Specific, measurable objective 3]\n\n## Scope\n\n### In Scope\n- [Item 1]\n- [Item 2]\n\n### Out of Scope\n- [Item 1]\n- [Item 2]\n\n## Stakeholders\n\n| Name | Role | Responsibilities | Contact Information |\n| ---- | ---- | ---------------- | ------------------- |\n| [Name] | [Role] | [Responsibilities] | [Contact] |\n| [Name] | [Role] | [Responsibilities] | [Contact] |'
          },
          {
            id: 'project-overview-task',
            type: 'task',
            content: 'Define project scope document',
            metadata: {
              task: {
                priority: 'high',
                status: 'todo',
                dueDate: null
              }
            }
          }
        ]
      },
      {
        id: 'timeline-milestones',
        title: 'Timeline & Milestones',
        icon: 'timeline',
        blocks: [
          {
            id: 'timeline-milestones-text',
            type: 'text',
            content: '# Timeline & Milestones\n\n## Project Timeline\n\n- **Start Date:** [Start date]\n- **End Date:** [End date]\n- **Duration:** [Duration]\n\n## Key Milestones\n\n| Milestone | Description | Deadline | Status |\n| --------- | ----------- | -------- | ------ |\n| [Milestone 1] | [Description] | [Date] | [Status] |\n| [Milestone 2] | [Description] | [Date] | [Status] |\n| [Milestone 3] | [Description] | [Date] | [Status] |'
          },
          {
            id: 'timeline-milestones-calendar',
            type: 'calendar',
            content: 'Project timeline',
            metadata: {
              calendar: {
                title: 'Project Timeline',
                description: 'Key project dates and milestones',
                startDate: null,
                endDate: null
              }
            }
          }
        ]
      },
      {
        id: 'tasks-assignments',
        title: 'Tasks & Assignments',
        icon: 'tasks',
        blocks: [
          {
            id: 'tasks-assignments-text',
            type: 'text',
            content: '# Tasks & Assignments\n\nBreak down the project into specific tasks, assign responsibilities, and track progress.'
          },
          {
            id: 'tasks-assignments-task-1',
            type: 'task',
            content: 'Task 1',
            metadata: {
              task: {
                priority: 'medium',
                status: 'todo',
                dueDate: null,
                assignee: '',
                estimatedHours: 0
              }
            }
          },
          {
            id: 'tasks-assignments-task-2',
            type: 'task',
            content: 'Task 2',
            metadata: {
              task: {
                priority: 'medium',
                status: 'todo',
                dueDate: null,
                assignee: '',
                estimatedHours: 0
              }
            }
          },
          {
            id: 'tasks-assignments-task-3',
            type: 'task',
            content: 'Task 3',
            metadata: {
              task: {
                priority: 'medium',
                status: 'todo',
                dueDate: null,
                assignee: '',
                estimatedHours: 0
              }
            }
          }
        ]
      },
      {
        id: 'resources-budget',
        title: 'Resources & Budget',
        icon: 'resources',
        blocks: [
          {
            id: 'resources-budget-text',
            type: 'text',
            content: '# Resources & Budget\n\n## Team Resources\n\n| Name | Role | Allocation | Time Period |\n| ---- | ---- | ---------- | ----------- |\n| [Name] | [Role] | [Allocation %] | [Start date - End date] |\n| [Name] | [Role] | [Allocation %] | [Start date - End date] |\n\n## Other Resources\n\n| Resource | Description | Quantity | Cost |\n| -------- | ----------- | -------- | ---- |\n| [Resource] | [Description] | [Quantity] | [$XXX] |\n| [Resource] | [Description] | [Quantity] | [$XXX] |\n\n## Budget Summary\n\n| Category | Allocated Budget | Actual Cost | Variance |\n| -------- | ---------------- | ----------- | -------- |\n| Personnel | [$XXX] | [$XXX] | [$XXX] |\n| Equipment | [$XXX] | [$XXX] | [$XXX] |\n| Software | [$XXX] | [$XXX] | [$XXX] |\n| Services | [$XXX] | [$XXX] | [$XXX] |\n| Other | [$XXX] | [$XXX] | [$XXX] |\n| **Total** | **[$XXX]** | **[$XXX]** | **[$XXX]** |'
          },
          {
            id: 'resources-budget-task',
            type: 'task',
            content: 'Finalize project budget',
            metadata: {
              task: {
                priority: 'high',
                status: 'todo',
                dueDate: null
              }
            }
          }
        ]
      },
      {
        id: 'risk-management',
        title: 'Risk Management',
        icon: 'risk',
        blocks: [
          {
            id: 'risk-management-text',
            type: 'text',
            content: '# Risk Management\n\n## Risk Register\n\n| Risk ID | Description | Probability | Impact | Severity | Mitigation Strategy | Owner | Status |\n| ------- | ----------- | ----------- | ------ | -------- | ------------------- | ----- | ------ |\n| R1 | [Description] | [High/Medium/Low] | [High/Medium/Low] | [H/M/L] | [Strategy] | [Name] | [Status] |\n| R2 | [Description] | [High/Medium/Low] | [High/Medium/Low] | [H/M/L] | [Strategy] | [Name] | [Status] |\n| R3 | [Description] | [High/Medium/Low] | [High/Medium/Low] | [H/M/L] | [Strategy] | [Name] | [Status] |'
          },
          {
            id: 'risk-management-task',
            type: 'task',
            content: 'Complete risk assessment',
            metadata: {
              task: {
                priority: 'high',
                status: 'todo',
                dueDate: null
              }
            }
          }
        ]
      },
      {
        id: 'status-reports',
        title: 'Status Reports',
        icon: 'status',
        blocks: [
          {
            id: 'status-reports-text',
            type: 'text',
            content: '# Status Reports\n\n## Status Report Template\n\n**Report Date:** [Date]\n\n### Overall Status\n[Green/Yellow/Red with brief explanation]\n\n### Key Accomplishments\n- [Accomplishment 1]\n- [Accomplishment 2]\n\n### Current Challenges\n- [Challenge 1]\n- [Challenge 2]\n\n### Upcoming Work\n- [Work item 1]\n- [Work item 2]\n\n### Decision Needed\n- [Decision 1]\n- [Decision 2]\n\n### Budget Status\n[Budget status summary]'
          },
          {
            id: 'status-reports-calendar',
            type: 'calendar',
            content: 'Status report schedule',
            metadata: {
              calendar: {
                title: 'Weekly Status Report',
                description: 'Regular project status reporting',
                startDate: null,
                endDate: null,
                recurring: true,
                recurrencePattern: 'weekly'
              }
            }
          }
        ]
      }
    ],
    metadata: {
      purpose: 'business',
      layout: 'standard',
      features: {
        aiAssistance: true,
        taskIntegration: true,
        calendarIntegration: true,
        collaborationTools: true,
        codeBlocks: false,
        mathEquations: false,
        drawingTools: true,
        documentAttachment: true,
        timeTracking: true,
        clientPortal: false,
        billing: false,
        conflictChecking: false,
        tags: true,
        tableOfContents: true
      },
      customFields: {
        projectType: '',
        priority: '',
        sponsor: '',
        budget: '',
        methodology: ''
      }
    }
  },
  {
    id: 'agile-sprint',
    name: 'Agile Sprint',
    description: 'A template for managing Agile sprints, including sprint planning, daily stand-ups, and retrospectives.',
    tags: ['project', 'agile', 'sprint'],
    type: 'project',
    sections: [
      {
        id: 'sprint-planning',
        title: 'Sprint Planning',
        icon: 'planning',
        blocks: [
          {
            id: 'sprint-planning-text',
            type: 'text',
            content: '# Sprint Planning\n\n## Sprint Details\n\n- **Sprint Number:** [Sprint #]\n- **Sprint Goal:** [Concise statement of what the team aims to achieve]\n- **Start Date:** [Start date]\n- **End Date:** [End date]\n- **Duration:** [Number of days/weeks]\n- **Team Capacity:** [Available person-days or story points]\n\n## Sprint Backlog\n\n| User Story/Task | Description | Story Points/Estimate | Priority | Assignee | Status |\n| --------------- | ----------- | --------------------- | -------- | -------- | ------ |\n| [ID] | [Description] | [Points] | [Priority] | [Name] | [Status] |\n| [ID] | [Description] | [Points] | [Priority] | [Name] | [Status] |\n| [ID] | [Description] | [Points] | [Priority] | [Name] | [Status] |'
          },
          {
            id: 'sprint-planning-task',
            type: 'task',
            content: 'Finalize sprint goals',
            metadata: {
              task: {
                priority: 'high',
                status: 'todo',
                dueDate: null
              }
            }
          },
          {
            id: 'sprint-planning-calendar',
            type: 'calendar',
            content: 'Sprint timeline',
            metadata: {
              calendar: {
                title: 'Sprint Period',
                description: 'Current sprint timeframe',
                startDate: null,
                endDate: null
              }
            }
          }
        ]
      },
      {
        id: 'daily-stand-ups',
        title: 'Daily Stand-ups',
        icon: 'stand-up',
        blocks: [
          {
            id: 'daily-stand-ups-text',
            type: 'text',
            content: '# Daily Stand-up Notes\n\n## Template for Each Day\n\n**Date:** [Date]\n\n### Team Updates\n\n| Team Member | Yesterday | Today | Blockers |\n| ----------- | --------- | ----- | -------- |\n| [Name] | [Tasks] | [Tasks] | [Blockers] |\n| [Name] | [Tasks] | [Tasks] | [Blockers] |\n| [Name] | [Tasks] | [Tasks] | [Blockers] |\n\n### Action Items from Stand-up\n\n- [Action item 1]\n- [Action item 2]'
          },
          {
            id: 'daily-stand-ups-calendar',
            type: 'calendar',
            content: 'Daily stand-up meeting',
            metadata: {
              calendar: {
                title: 'Daily Stand-up',
                description: 'Daily team sync meeting',
                startDate: null,
                endDate: null,
                recurring: true,
                recurrencePattern: 'daily',
                duration: 15
              }
            }
          }
        ]
      },
      {
        id: 'sprint-progress',
        title: 'Sprint Progress',
        icon: 'progress',
        blocks: [
          {
            id: 'sprint-progress-text',
            type: 'text',
            content: '# Sprint Progress\n\n## Burndown Chart\n\n[Insert burndown chart or link to it]\n\n## Sprint Status\n\n| Status | Count | Percentage |\n| ------ | ----- | ---------- |\n| Not Started | [Count] | [%] |\n| In Progress | [Count] | [%] |\n| Done | [Count] | [%] |\n| Total | [Total count] | 100% |'
          },
          {
            id: 'sprint-progress-task',
            type: 'task',
            content: 'Update sprint board with current status',
            metadata: {
              task: {
                priority: 'medium',
                status: 'todo',
                dueDate: null,
                recurring: true
              }
            }
          }
        ]
      },
      {
        id: 'sprint-review',
        title: 'Sprint Review',
        icon: 'review',
        blocks: [
          {
            id: 'sprint-review-text',
            type: 'text',
            content: '# Sprint Review\n\n**Date:** [Date]\n**Participants:** [Names and roles]\n\n## Demo Items\n\n| Item | Presenter | Notes |\n| ---- | --------- | ----- |\n| [Item 1] | [Name] | [Notes] |\n| [Item 2] | [Name] | [Notes] |\n\n## Completed User Stories/Tasks\n\n| User Story/Task | Description | Status | Notes |\n| --------------- | ----------- | ------ | ----- |\n| [ID] | [Description] | [Complete/Partial] | [Notes] |\n| [ID] | [Description] | [Complete/Partial] | [Notes] |\n\n## Feedback from Stakeholders\n\n- [Feedback 1]\n- [Feedback 2]\n\n## Action Items from Review\n\n- [Action item 1]\n- [Action item 2]'
          },
          {
            id: 'sprint-review-calendar',
            type: 'calendar',
            content: 'Sprint review meeting',
            metadata: {
              calendar: {
                title: 'Sprint Review',
                description: 'Demo and review of sprint accomplishments',
                startDate: null,
                endDate: null
              }
            }
          }
        ]
      },
      {
        id: 'sprint-retrospective',
        title: 'Sprint Retrospective',
        icon: 'retrospective',
        blocks: [
          {
            id: 'sprint-retrospective-text',
            type: 'text',
            content: '# Sprint Retrospective\n\n**Date:** [Date]\n**Participants:** [Names]\n\n## What Went Well\n\n- [Item 1]\n- [Item 2]\n\n## What Could Be Improved\n\n- [Item 1]\n- [Item 2]\n\n## Action Items for Next Sprint\n\n| Action Item | Owner | Due Date |\n| ----------- | ----- | -------- |\n| [Action item] | [Name] | [Date] |\n| [Action item] | [Name] | [Date] |'
          },
          {
            id: 'sprint-retrospective-task',
            type: 'task',
            content: 'Document retrospective action items',
            metadata: {
              task: {
                priority: 'high',
                status: 'todo',
                dueDate: null
              }
            }
          },
          {
            id: 'sprint-retrospective-calendar',
            type: 'calendar',
            content: 'Sprint retrospective meeting',
            metadata: {
              calendar: {
                title: 'Sprint Retrospective',
                description: 'Team discussion about process improvements',
                startDate: null,
                endDate: null
              }
            }
          }
        ]
      }
    ],
    metadata: {
      purpose: 'business',
      layout: 'kanban',
      features: {
        aiAssistance: true,
        taskIntegration: true,
        calendarIntegration: true,
        collaborationTools: true,
        codeBlocks: true,
        mathEquations: false,
        drawingTools: false,
        documentAttachment: true,
        timeTracking: true,
        clientPortal: false,
        billing: false,
        conflictChecking: false,
        tags: true,
        tableOfContents: true
      },
      customFields: {
        sprintNumber: '',
        velocity: '',
        team: '',
        startDate: '',
        endDate: ''
      }
    }
  }
];

export const legalTemplates: NotebookTemplate[] = [
  {
    id: 'legal-client-management',
    name: 'Legal Client Management',
    description: 'Comprehensive template for managing legal clients, cases, documents, and billing information',
    tags: ['legal', 'client management', 'case tracking', 'billing'],
    type: 'legal',
    sections: [
      {
        id: 'client-information',
        title: 'Client Information',
        icon: 'user',
        blocks: [
          {
            id: 'client-basic-details',
            type: 'text',
            content: '# Client Basic Details\n\n**Client Name:** \n**Client Type:** Individual/Corporation\n**Contact Person:** \n**Phone:** \n**Email:** \n**Address:** \n**Industry/Sector:** \n**Website:** ',
          },
          {
            id: 'client-identification',
            type: 'text',
            content: '# Client Identification\n\n**Tax ID/EIN:** \n**Corporate Registration Number:** \n**Identification Verified:** Yes/No\n**Verification Method:** \n**Verification Date:** ',
          },
          {
            id: 'client-relationship',
            type: 'text',
            content: '# Relationship Information\n\n**Client Since:** \n**Referred By:** \n**Relationship Manager:** \n**Client Classification:** VIP/Standard/etc.\n**Conflict Check Status:** Completed on [date] - No conflicts identified',
          },
          {
            id: 'client-notes',
            type: 'text',
            content: '# Additional Client Notes\n\nImportant information about this client, special handling instructions, or other relevant details.',
          },
        ],
      },
      {
        id: 'case-details',
        title: 'Case/Matter Details',
        icon: 'folder',
        blocks: [
          {
            id: 'matter-overview',
            type: 'text',
            content: '# Matter Overview\n\n**Matter/Case Number:** \n**Matter Title:** \n**Practice Area:** \n**Lead Attorney:** \n**Supporting Team:** \n**Open Date:** \n**Current Status:** Active/Pending/Closed\n**Opposing Counsel:** \n**Judge/Court:** \n**Jurisdiction:** ',
          },
          {
            id: 'key-facts',
            type: 'text',
            content: '# Key Facts & Case Summary\n\nBrief summary of the case, key facts, and legal issues involved.',
          },
          {
            id: 'matter-task-list',
            type: 'task',
            content: {
              title: "Case Action Items",
              tasks: [
                { id: "task-1", title: "File initial appearance", completed: false, dueDate: null, priority: "high" },
                { id: "task-2", title: "Request and review client documents", completed: false, dueDate: null, priority: "medium" },
                { id: "task-3", title: "Prepare preliminary case assessment", completed: false, dueDate: null, priority: "medium" },
                { id: "task-4", title: "Schedule client consultation", completed: false, dueDate: null, priority: "high" }
              ]
            }
          },
        ],
      },
      {
        id: 'timeline-deadlines',
        title: 'Timeline & Critical Dates',
        icon: 'calendar',
        blocks: [
          {
            id: 'key-dates',
            type: 'text',
            content: '# Key Dates\n\n**Case Filed:** \n**Service Date:** \n**Response Deadline:** \n**Discovery Deadline:** \n**Hearing/Trial Date:** \n**Statute of Limitations:** \n**Other Critical Deadlines:**',
          },
          {
            id: 'calendar-entries',
            type: 'task',
            content: {
              title: "Calendar Entries",
              tasks: [
                { id: "cal-1", title: "Client Meeting", completed: false, dueDate: null, priority: "medium" },
                { id: "cal-2", title: "Filing Deadline", completed: false, dueDate: null, priority: "high" },
                { id: "cal-3", title: "Court Appearance", completed: false, dueDate: null, priority: "high" },
                { id: "cal-4", title: "Document Production Due", completed: false, dueDate: null, priority: "medium" }
              ]
            }
          },
        ],
      },
      {
        id: 'document-management',
        title: 'Document Management',
        icon: 'file',
        blocks: [
          {
            id: 'key-documents',
            type: 'text',
            content: '# Key Documents\n\n**Engagement Letter:** [Status/Location]\n**Power of Attorney:** [Status/Location]\n**Pleadings:** [Status/Location]\n**Contracts/Agreements:** [Status/Location]\n**Correspondence:** [Status/Location]\n**Court Orders:** [Status/Location]',
          },
          {
            id: 'document-requests',
            type: 'task',
            content: {
              title: "Document Requests",
              tasks: [
                { id: "doc-1", title: "Request client identification", completed: false, dueDate: null, priority: "high" },
                { id: "doc-2", title: "Request corporate formation documents", completed: false, dueDate: null, priority: "medium" },
                { id: "doc-3", title: "Request relevant contracts", completed: false, dueDate: null, priority: "medium" },
                { id: "doc-4", title: "Request financial records", completed: false, dueDate: null, priority: "medium" }
              ]
            }
          },
          {
            id: 'production-details',
            type: 'text',
            content: '# Document Production Details\n\n**Discovery Requests Served:** [Date]\n**Responses Due:** [Date]\n**Production Format:** [Electronic/Physical]\n**Special Instructions:** [Details]',
          },
        ],
      },
      {
        id: 'billing-information',
        title: 'Billing Information',
        icon: 'dollar-sign',
        blocks: [
          {
            id: 'fee-arrangement',
            type: 'text',
            content: '# Fee Arrangement\n\n**Fee Structure:** Hourly/Flat Fee/Contingency/Retainer\n**Rate:** $\n**Retainer Amount:** $\n**Billing Frequency:** Monthly/Quarterly\n**Payment Terms:** \n**Trust Account Balance:** $',
          },
          {
            id: 'billing-summary',
            type: 'text',
            content: '# Billing Summary\n\n**Total Billed to Date:** $\n**Outstanding Balance:** $\n**Last Invoice Date:** \n**Last Payment Date:** \n**Payment History:** [Good/Inconsistent/Other]',
          },
          {
            id: 'time-entries',
            type: 'text',
            content: '# Recent Time Entries\n\n1. [Date] - [Timekeeper] - [Description] - [Hours] - [Amount]\n2. [Date] - [Timekeeper] - [Description] - [Hours] - [Amount]\n3. [Date] - [Timekeeper] - [Description] - [Hours] - [Amount]',
          },
        ],
      },
      {
        id: 'communication-log',
        title: 'Communication Log',
        icon: 'message-circle',
        blocks: [
          {
            id: 'client-communications',
            type: 'text',
            content: '# Client Communications\n\n**[Date/Time]** - [Communication Type] - [Summary] - [Follow-up Required?]\n**[Date/Time]** - [Communication Type] - [Summary] - [Follow-up Required?]\n**[Date/Time]** - [Communication Type] - [Summary] - [Follow-up Required?]',
          },
          {
            id: 'opposing-communications',
            type: 'text',
            content: '# Communications with Opposing Parties\n\n**[Date/Time]** - [Party] - [Communication Type] - [Summary] - [Response Required?]\n**[Date/Time]** - [Party] - [Communication Type] - [Summary] - [Response Required?]',
          },
          {
            id: 'court-communications',
            type: 'text',
            content: '# Court Communications\n\n**[Date/Time]** - [Court/Judge] - [Communication Type] - [Summary] - [Action Required?]\n**[Date/Time]** - [Court/Judge] - [Communication Type] - [Summary] - [Action Required?]',
          },
        ],
      },
      {
        id: 'research-strategy',
        title: 'Research & Strategy',
        icon: 'book',
        blocks: [
          {
            id: 'legal-research',
            type: 'text',
            content: '# Legal Research\n\n**Key Issues:**\n1. [Issue] - [Relevant Law/Precedent]\n2. [Issue] - [Relevant Law/Precedent]\n\n**Research Notes:**\n[Research findings and legal analysis]',
          },
          {
            id: 'case-strategy',
            type: 'text',
            content: '# Case Strategy\n\n**Overall Approach:**\n[Description of legal strategy]\n\n**Key Arguments:**\n1. [Argument]\n2. [Argument]\n\n**Anticipated Challenges:**\n1. [Challenge] - [Mitigation Strategy]\n2. [Challenge] - [Mitigation Strategy]',
          },
          {
            id: 'settlement-considerations',
            type: 'text',
            content: '# Settlement Considerations\n\n**Settlement Authority:** $\n**Target Settlement Range:** $\n**Client\'s Position on Settlement:** [Description]\n**Settlement Strategy:** [Description]\n**Alternative Dispute Resolution Options:** [Mediation/Arbitration/etc.]',
          },
        ],
      },
    ],
    metadata: {
      features: {
        aiAssistance: true,
        taskIntegration: true,
        calendarIntegration: true,
        documentAttachment: true,
        timeTracking: true,
        clientPortal: false,
        billing: true,
        conflictChecking: true
      },
      appearance: {
        color: "#4338ca",
        icon: "scale"
      },
      customFields: {
        practiceArea: "",
        responsibleAttorney: "",
        clientCategory: "",
        billingType: "",
        conflictCheckStatus: ""
      }
    }
  }
];

// Combined templates for easier access
export const allNotebookTemplates = [
  ...businessTemplates,
  ...projectTemplates,
  ...legalTemplates
];

/**
 * Creates a notebook from a template
 */
export function createNotebookFromTemplate(
  templateId: string,
  customizations?: {
    title?: string;
    description?: string;
    tags?: string[];
    metadata?: any;
  }
): { title: string; description: string; sections: any[]; tags: string[]; metadata: any } {
  // Find the template by ID
  const template = allNotebookTemplates.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error(`Template with ID ${templateId} not found`);
  }
  
  // Use customizations or template defaults
  const title = customizations?.title || template.name;
  const description = customizations?.description || template.description;
  const tags = customizations?.tags || template.tags || [];
  const metadata = customizations?.metadata || template.metadata || {};
  
  // Convert template sections to notebook sections
  const sections = template.sections.map(section => ({
    id: section.id,
    title: section.title,
    icon: section.icon || 'default',
    blocks: section.blocks.map(block => ({
      id: block.id,
      type: block.type,
      content: block.content,
      metadata: block.metadata || {}
    }))
  }));
  
  return {
    title,
    description,
    sections,
    tags,
    metadata
  };
} 