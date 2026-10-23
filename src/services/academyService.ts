/**
 * GenieFlow Academy & Live Coaching Service
 * Manages video curriculum, live masterclass scheduling, and demo practice case packets.
 */

export interface AcademyLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl: string;
  thumbnailUrl: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  chapters: { title: string; time: string }[];
  practicePacket?: {
    caseName: string;
    description: string;
    workflowCommand: string;
    sampleFilePath?: string;
  };
}

export interface AcademyModule {
  id: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  lessons: AcademyLesson[];
}

export interface LiveMasterclass {
  id: string;
  title: string;
  instructor: string;
  role: string;
  date: string;
  timePST: string;
  description: string;
  roomName: string;
  status: 'upcoming' | 'live' | 'completed';
  recordingUrl?: string;
  attendeeCount: number;
}

export class AcademyService {
  private static instance: AcademyService;

  public static getInstance(): AcademyService {
    if (!AcademyService.instance) {
      AcademyService.instance = new AcademyService();
    }
    return AcademyService.instance;
  }

  /**
   * Returns the complete curriculum modules
   */
  public getCurriculum(): AcademyModule[] {
    return [
      {
        id: 'mod-1',
        number: 1,
        title: 'GenieFlow Sovereign OS Foundations',
        tagline: 'Zero-PHI GPU Inference, Multi-Panel Workspace & Google Drive Sync',
        description: 'Master the desktop environment, local RTX 4090 Ollama setup, and file linking.',
        icon: 'Cpu',
        lessons: [
          {
            id: 'les-101',
            moduleId: 'mod-1',
            title: '1.1 Sovereign Desktop Setup & Local RTX 4090 Inference',
            description: 'Learn how to run local Qwen 2.5 / Llama 3 models on your RTX 4090 GPU for 100% HIPAA/Zero-PHI privacy.',
            durationMinutes: 12,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
            difficulty: 'Beginner',
            tags: ['RTX 4090', 'Zero-PHI', 'Desktop OS'],
            chapters: [
              { title: 'Introduction to Sovereign AI', time: '0:00' },
              { title: 'Connecting Local Ollama (Port 11434)', time: '3:15' },
              { title: 'Sovereign Multi-Panel Layout Navigation', time: '7:40' },
            ],
            practicePacket: {
              caseName: 'Local GPU Test Diagnostic',
              description: 'Run diagnostic healthcheck against local Ollama inference server.',
              workflowCommand: 'Run GPU Diagnostic',
            },
          },
          {
            id: 'les-102',
            moduleId: 'mod-1',
            title: '1.2 Progressive Disclosure & Dynamic Multi-Panel Mastery',
            description: 'How to use the Canvas, Browser, Tasks, and Email panels side-by-side with automatic pop-ups.',
            durationMinutes: 15,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
            difficulty: 'Beginner',
            tags: ['UI/UX', 'Canvas', 'Multi-Panel'],
            chapters: [
              { title: 'Dynamic Panel Orchestration', time: '0:00' },
              { title: 'Auto-Popup Panel Triggers', time: '4:20' },
              { title: 'Document Splitting & 28-Line Mode', time: '9:00' },
            ],
          },
        ],
      },
      {
        id: 'mod-2',
        number: 2,
        title: '500-Page Medical Ingestion & 7-Column Chronology',
        tagline: 'Transform massive medical records into cross-examination weapons',
        description: 'Auto-extract doctor findings, whole person impairment (WPI), work restrictions, and AOE/COE causation.',
        icon: 'FileText',
        lessons: [
          {
            id: 'les-201',
            moduleId: 'mod-2',
            title: '2.1 Rapid Medical PDF Ingestion & OCR Structuring',
            description: 'Extract treatment reports, QME evaluations, and diagnostic imaging into structured markdown tables.',
            durationMinutes: 18,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
            difficulty: 'Intermediate',
            tags: ['Medical Records', 'OCR', 'QME Chronology'],
            chapters: [
              { title: 'Dropping 500-Page Medical Packets', time: '0:00' },
              { title: '7-Column Chronology Matrix Generation', time: '6:30' },
              { title: 'Highlighting Apportionment Deficiencies', time: '12:10' },
            ],
            practicePacket: {
              caseName: 'Ramirez, Yolanda (ADJ20377197)',
              description: 'Ingest sample Ortho QME and PTP PR-4 report to auto-build 7-column chronology.',
              workflowCommand: '/analyze-medical-pdf',
            },
          },
        ],
      },
      {
        id: 'mod-3',
        number: 3,
        title: 'The $10,000 Penalty Audit & 28-Line Pleading Engine',
        tagline: 'Labor Code § 5814 & § 4622 Late Payment Enforcement',
        description: 'Audit delayed medical mileage, TTD, and treatment bills to generate formal WCAB petitions.',
        icon: 'Scale',
        lessons: [
          {
            id: 'les-301',
            moduleId: 'mod-3',
            title: '3.1 Forensic Late Payment Auditing (LC § 5814 / § 4622)',
            description: 'Run automatic 60-day and 30-day statutory delay audits across payment ledgers and EORs.',
            durationMinutes: 20,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
            difficulty: 'Advanced',
            tags: ['LC § 5814', 'LC § 4622', 'Penalties', '28-Line Pleading'],
            chapters: [
              { title: 'Statutory Grounding & Penalty Rules', time: '0:00' },
              { title: 'Ledger Delay Mathematical Calculation', time: '7:15' },
              { title: 'Drafting 28-Line Legal Petition for Penalties', time: '14:00' },
            ],
            practicePacket: {
              caseName: 'Mileage & TTD Audit Packet',
              description: 'Calculate 25% penalty up to $10,000 under LC § 5814.',
              workflowCommand: '/penalty-petition-drafting',
            },
          },
        ],
      },
      {
        id: 'mod-4',
        number: 4,
        title: 'Live Deposition Prep & Cross-Examination HUD',
        tagline: 'Real-time transcript analysis and impeachment questions',
        description: 'Prepare cross-examination outlines and take real-time notes with auto-citation during hearings.',
        icon: 'Mic',
        lessons: [
          {
            id: 'les-401',
            moduleId: 'mod-4',
            title: '4.1 Deposition HUD & Live Note-Taking Dashboard',
            description: 'Generate real-time questions, contradict prior medical records, and auto-flag inconsistencies.',
            durationMinutes: 16,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80',
            difficulty: 'Intermediate',
            tags: ['Depo Prep', 'Live HUD', 'Cross-Exam'],
            chapters: [
              { title: 'Ingesting Notice of Deposition', time: '0:00' },
              { title: 'Building the Impeachment Matrix', time: '5:45' },
              { title: 'Using the Live Note-Taking HUD', time: '11:20' },
            ],
            practicePacket: {
              caseName: 'Applicant Deposition Prep Outline',
              description: 'Generate complete cross-examination matrix against prior industrial injury history.',
              workflowCommand: '/depo-prep',
            },
          },
        ],
      },
      {
        id: 'mod-5',
        number: 5,
        title: 'Creator Economy: Monetizing Gpacks in the Store',
        tagline: 'Publish proprietary legal workflows for recurring monthly revenue',
        description: 'Package your legal prompt chains and statutory rules into monetizable Gpacks on the Assistant Store.',
        icon: 'Crown',
        lessons: [
          {
            id: 'les-501',
            moduleId: 'mod-5',
            title: '5.1 Packaging, Pricing & Publishing Gpack Workflows',
            description: 'Author your own Gpack in the Creator Board and earn 70% revenue share per claim execution or subscription.',
            durationMinutes: 14,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
            difficulty: 'Advanced',
            tags: ['Gpacks', 'Marketplace', 'Creator Revenue'],
            chapters: [
              { title: 'Gpack Anatomy (SKILL.md & Toolchains)', time: '0:00' },
              { title: 'Configuring Pricing (Per-Claim vs Monthly)', time: '6:10' },
              { title: 'Publishing to the Store & Revenue Splits', time: '10:30' },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Returns live weekend masterclass sessions
   */
  public getLiveSessions(): LiveMasterclass[] {
    return [
      {
        id: 'live-sat-01',
        title: 'Live Masterclass: Winning $10K Penalty Petitions with Zero Hallucination',
        instructor: 'Senior WCAB Hearing Representative',
        role: 'California Workers\' Comp Practice Lead',
        date: 'Saturday, Upcoming Weekend',
        timePST: '10:00 AM - 11:30 AM PST',
        description: 'Live hands-on workshop building 28-line LC § 5814 petitions from real claims files and auditing carrier delay defenses in real-time.',
        roomName: 'academy-live-penalties',
        status: 'upcoming',
        attendeeCount: 142,
      },
      {
        id: 'live-sun-02',
        title: 'Sunday Open Office Hours: Setting Up Local RTX 4090 & Custom Gpacks',
        instructor: 'GenieFlow Systems Architect',
        role: 'AI Infrastructure Specialist',
        date: 'Sunday, Upcoming Weekend',
        timePST: '1:00 PM - 2:30 PM PST',
        description: 'Live Q&A, troubleshooting Ollama / local model setups, optimizing GPU inference speeds, and building custom firm workflows.',
        roomName: 'academy-live-gpu-gpack',
        status: 'upcoming',
        attendeeCount: 98,
      },
    ];
  }

  /**
   * Returns recorded past masterclasses
   */
  public getPastRecordings(): LiveMasterclass[] {
    return [
      {
        id: 'rec-01',
        title: 'QME Chronology Deep Dive: Auditing 800-Page Medical Packets',
        instructor: 'Lead Medical-Legal Specialist',
        role: 'WCAB Litigation Specialist',
        date: 'Last Weekend',
        timePST: 'Recorded Live',
        description: 'Step-by-step walkthrough extracting WPI ratings and rebuttal arguments against flawed defense panel QME evaluations.',
        roomName: 'rec-medical-deep-dive',
        status: 'completed',
        recordingUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        attendeeCount: 285,
      },
    ];
  }
}

export const academyService = AcademyService.getInstance();
