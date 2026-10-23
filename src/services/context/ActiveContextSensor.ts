/**
 * 🛰️ ActiveContextSensor
 * 
 * Sovereign Ambient Telemetry & Working Context Sensor for GenieFlow AI.
 * Bridges the gap between the practitioner's active screen/document and the
 * autonomous AI agents (AgenticLoop, SovereignExecutor, useChatOrchestrator).
 */

export type LegalPersona = 'applicant_attorney' | 'lien_claimant';

export interface ActiveDocumentContext {
  id?: string;
  name: string;
  path?: string;
  content?: string;
  snippet?: string;
  lineRange?: { start: number; end: number };
  language?: string;
  lastModified?: number;
}

export interface ActiveSelectionContext {
  text: string;
  startLine?: number;
  endLine?: number;
}

export interface ActiveCaseContext {
  applicantName?: string;
  employer?: string;
  insuranceCarrier?: string;
  doi?: string; // Date of Injury
  eamsNumber?: string;
  wcabVenue?: string;
  aww?: number; // Average Weekly Wage
  pdRatingEstimated?: number;
}

export interface ActiveContextSnapshot {
  activeDocument: ActiveDocumentContext | null;
  activeSelection: ActiveSelectionContext | null;
  activePersona: LegalPersona;
  activeModelId: string;
  activeRoute: string;
  mountedDrives: string[];
  activeCase: ActiveCaseContext | null;
  timestamp: number;
}

type ContextChangeListener = (snapshot: ActiveContextSnapshot) => void;

class ActiveContextSensorService {
  private static instance: ActiveContextSensorService;

  private activeDocument: ActiveDocumentContext | null = null;
  private activeSelection: ActiveSelectionContext | null = null;
  private activePersona: LegalPersona = 'applicant_attorney';
  private activeModelId: string = 'local-gpu';
  private activeRoute: string = '/';
  private mountedDrives: string[] = ['G:\\My Drive', 'E:\\', 'C:\\'];
  private activeCase: ActiveCaseContext | null = null;

  private listeners: Set<ContextChangeListener> = new Set();

  private constructor() {
    this.hydrateFromStorage();
  }

  public static getInstance(): ActiveContextSensorService {
    if (!ActiveContextSensorService.instance) {
      ActiveContextSensorService.instance = new ActiveContextSensorService();
    }
    return ActiveContextSensorService.instance;
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const savedPersona = localStorage.getItem('genieflow_active_persona');
      if (savedPersona === 'applicant_attorney' || savedPersona === 'lien_claimant') {
        this.activePersona = savedPersona;
      }
      const savedModel = localStorage.getItem('genieflow_active_model');
      if (savedModel) {
        this.activeModelId = savedModel;
      }
    } catch (_e) {
      // safe fallback
    }
  }

  public subscribe(listener: ContextChangeListener): () => void {
    this.listeners.add(listener);
    // Initial emit
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach(listener => {
      try {
        listener(snap);
      } catch (err) {
        console.error('[ActiveContextSensor] Listener error:', err);
      }
    });
  }

  public getSnapshot(): ActiveContextSnapshot {
    return {
      activeDocument: this.activeDocument ? { ...this.activeDocument } : null,
      activeSelection: this.activeSelection ? { ...this.activeSelection } : null,
      activePersona: this.activePersona,
      activeModelId: this.activeModelId,
      activeRoute: this.activeRoute,
      mountedDrives: [...this.mountedDrives],
      activeCase: this.activeCase ? { ...this.activeCase } : null,
      timestamp: Date.now()
    };
  }

  public setActiveDocument(doc: ActiveDocumentContext | null): void {
    this.activeDocument = doc;
    this.notify();
  }

  public setActiveSelection(selection: ActiveSelectionContext | null): void {
    this.activeSelection = selection;
    this.notify();
  }

  public setActivePersona(persona: LegalPersona): void {
    this.activePersona = persona;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('genieflow_active_persona', persona);
      } catch (_e) {}
    }
    this.notify();
  }

  public setActiveModel(modelId: string): void {
    this.activeModelId = modelId;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('genieflow_active_model', modelId);
      } catch (_e) {}
    }
    this.notify();
  }

  public setActiveRoute(route: string): void {
    this.activeRoute = route;
    this.notify();
  }

  public setMountedDrives(drives: string[]): void {
    this.mountedDrives = drives;
    this.notify();
  }

  public setActiveCase(caseMeta: ActiveCaseContext | null): void {
    this.activeCase = caseMeta;
    this.notify();
  }

  /**
   * Generates a compact, highly dense prompt injection block for LLMs
   * so the AI operates with immediate environmental grounding.
   */
  public toSystemPromptSnippet(): string {
    const parts: string[] = [];
    parts.push(`### 🛰️ ACTIVE OPERATIONAL WORKSPACE CONTEXT`);
    parts.push(`- **Legal Persona**: ${this.activePersona === 'applicant_attorney' ? 'Applicant Attorney Persona (Conformed 28-Line Legal Captions)' : 'Lien Claimant Persona (Medland Medical / Spectrum / RMS)'}`);
    parts.push(`- **Active Route/Screen**: ${this.activeRoute}`);

    if (this.activeDocument) {
      parts.push(`- **Active Working Document**: ${this.activeDocument.name} (${this.activeDocument.path || 'Active Canvas'})`);
      if (this.activeDocument.lineRange) {
        parts.push(`  - Viewing Lines: ${this.activeDocument.lineRange.start} to ${this.activeDocument.lineRange.end}`);
      }
      if (this.activeDocument.snippet) {
        parts.push(`  - Document Excerpt:\n\`\`\`\n${this.activeDocument.snippet.trim()}\n\`\`\``);
      }
    }

    if (this.activeSelection && this.activeSelection.text.trim()) {
      parts.push(`- **Practitioner Highlighted Selection**:\n> "${this.activeSelection.text.trim()}"`);
    }

    if (this.activeCase) {
      parts.push(`- **Active Case Grounding**: ${this.activeCase.applicantName || 'Unknown Applicant'} | DOI: ${this.activeCase.doi || 'N/A'} | EAMS: ${this.activeCase.eamsNumber || 'N/A'} | Venue: ${this.activeCase.wcabVenue || 'Pomona WCAB'}`);
    }

    if (this.mountedDrives.length > 0) {
      parts.push(`- **Mounted Sovereign Drives**: ${this.mountedDrives.join(', ')}`);
    }

    return parts.join('\n');
  }
}

export const activeContextSensor = ActiveContextSensorService.getInstance();
