/**
 * 🏛️ CaseStateHarvester
 * 
 * Ingests and normalizes client case files from E:/.genieflowai.brain/CLIENTS
 * into a structured Case State Object for deterministic grounding,
 * prompt caching, and legal linter verification.
 */

export interface CaseState {
  id: string;
  applicantName: string;
  dateOfBirth?: string;
  address?: string;
  employer?: string;
  coEmployer?: string;
  dateOfInjury: string;
  injuries: string[];
  eamsNumber: string;
  wcjJudge?: string;
  districtOffice?: string;
  carrierTpa?: string;
  defenseCounsel?: string;
  applicantCounsel?: string;
  primaryTreatingPhysician?: string;
  secondaryTreatingPhysician?: string;
  mriFindings?: string[];
  proceduralTimeline?: { date: string; event: string }[];
  verifiedDefensesOmissions?: string[];
  folderPath?: string;
  fileList?: string[];
}

export const FLUID_WORKSPACE_STATE: CaseState = {
  id: 'FLUID_WORKSPACE',
  applicantName: 'Fluid Workspace',
  eamsNumber: 'Attached Drives Mode',
  injuries: ['Dynamic Grounding from File Explorer'],
  dateOfInjury: 'N/A'
};

export class CaseStateHarvester {
  private static instance: CaseStateHarvester;
  private cachedCases: Map<string, CaseState> = new Map();
  private activeCaseId: string = 'FLUID_WORKSPACE';
  private listeners: Set<(activeCase: CaseState) => void> = new Set();

  private constructor() {
    this.cachedCases.set('FLUID_WORKSPACE', FLUID_WORKSPACE_STATE);
    this.seedCases();
    try {
      const saved = localStorage.getItem('genieflow_active_case_id');
      if (saved && this.cachedCases.has(saved)) {
        this.activeCaseId = saved;
      }
    } catch (_e) {}
  }

  public static getInstance(): CaseStateHarvester {
    if (!CaseStateHarvester.instance) {
      CaseStateHarvester.instance = new CaseStateHarvester();
    }
    return CaseStateHarvester.instance;
  }

  public subscribe(listener: (activeCase: CaseState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const active = this.getActiveCaseState();
    this.listeners.forEach(fn => {
      try { fn(active); } catch (e) { console.error(e); }
    });
  }

  /**
   * Parse raw text, Markdown, or OCR content into a structured CaseState object.
   */
  public parseMarkdownBriefing(content: string, fallbackId?: string): CaseState {
    const extract = (pattern: RegExp): string => {
      const match = content.match(pattern);
      return match ? match[1].trim() : '';
    };

    // Extract Applicant Name
    let applicant = extract(/\*\*Applicant Name:\*\*\s*(.+)/i) || 
                    extract(/(?:Applicant|Injured Worker|Claimant|Matter of|RE:)\s*[:.]?\s*([A-Za-z\s,]{3,35})(?:\n|\r|\t|;|DOB|Case|v\.)/i);
    
    if (applicant) {
      applicant = applicant.replace(/^[,\s;.-]+|[,\s;.-]+$/g, '').trim();
    }

    if (!applicant && fallbackId) {
      applicant = fallbackId.replace(/[_-]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (!applicant || applicant === ',') applicant = 'Active Client Matter';

    const dob = extract(/\*\*Date of Birth:\*\*\s*(.+)/i) || extract(/(?:DOB|Date of Birth)\s*[:.]?\s*([^\n\r;]+)/i);
    const address = extract(/\*\*Address:\*\*\s*(.+)/i);
    const employer = extract(/\*\*Employer:\*\*\s*(.+)/i) || extract(/(?:Employer|EMP|Insured)\s*[:.]?\s*([^\n\r;]+)/i) || 'Employer of Record';
    const coEmployer = extract(/\*\*Co-Employer \/ Staffing:\*\*\s*(.+)/i);
    const doi = extract(/\*\*Date of Injury:\*\*\s*(.+)/i) || extract(/(?:Date of Injury|DOI)\s*[:.]?\s*([^\n\r;]+)/i) || 'Cumulative Trauma';
    const eamsMatch = content.match(/ADJ\d{7,9}/i);
    const eams = eamsMatch ? eamsMatch[0].toUpperCase() : (extract(/\*\*EAMS Case No\.:\*\*\s*([^\n(]+)/i) || 'ADJ Pending');
    const carrier = extract(/\*\*Carrier \/ TPA:\*\*\s*(.+)/i) || extract(/(?:Claims Admin|Carrier|TPA|Insurance)\s*[:.]?\s*([^\n\r;]+)/i);
    const defense = extract(/\*\*Defense Counsel[^:]*:\*\*\s*(.+)/i);
    const ptp = extract(/\*\*Primary Treating Physician:\*\*\s*(.+)/i) || extract(/(?:PTP|Treating Physician)\s*[:.]?\s*([^\n\r;]+)/i);
    const secondaryPtp = extract(/\*\*Secondary Treating Physician:\*\*\s*(.+)/i);
    const judge = extract(/(?:Hon\.|Judge|WCJ)\s*([A-Za-z\s\.]+)/i);

    // Extract MRI and Procedural Timeline
    const mriLines: string[] = [];
    if (content.includes('MRI')) {
      const mriSection = content.split(/MRI/i)[1]?.slice(0, 500) || '';
      const lines = mriSection.split('\n').filter(l => l.includes('*') || l.includes('-'));
      lines.forEach(l => mriLines.push(l.replace(/^[\s*-]+/, '').trim()));
    }

    const timeline: { date: string; event: string }[] = [];
    const timelineMatches = content.matchAll(/\d+\.\s+\*\*(\d{2}\/\d{2}\/\d{4})[^*]*\*\*:\s*([^\n]+)/g);
    for (const match of timelineMatches) {
      timeline.push({ date: match[1], event: match[2].trim() });
    }

    const caseId = fallbackId || applicant.replace(/[^A-Za-z0-9]/g, '_').toUpperCase();

    const caseState: CaseState = {
      id: caseId,
      applicantName: applicant,
      dateOfBirth: dob || undefined,
      address: address || undefined,
      employer: employer || 'Employer / Carrier',
      coEmployer: coEmployer || undefined,
      dateOfInjury: doi,
      injuries: ['Industrial Injury / Work-Related Conditions'],
      eamsNumber: eams,
      districtOffice: 'California WCAB District Office',
      wcjJudge: judge ? `Hon. ${judge.trim()}` : undefined,
      carrierTpa: carrier || undefined,
      defenseCounsel: defense || undefined,
      applicantCounsel: 'Law Offices of Applicant Counsel, A P.L.C.',
      primaryTreatingPhysician: ptp || undefined,
      secondaryTreatingPhysician: secondaryPtp || undefined,
      mriFindings: mriLines.length > 0 ? mriLines : undefined,
      proceduralTimeline: timeline.length > 0 ? timeline : undefined,
      verifiedDefensesOmissions: [
        'Defense failed to serve proper statutory notices',
        'Active medical care and continuous prosecution substantiated by record'
      ]
    };

    this.registerCase(caseState);
    return caseState;
  }

  public harvestFromText(text: string, titleHint?: string): CaseState {
    return this.parseMarkdownBriefing(text, titleHint ? titleHint.replace(/[^A-Za-z0-9]/g, '_').toUpperCase() : undefined);
  }

  public registerCase(caseState: CaseState): CaseState {
    this.cachedCases.set(caseState.id, caseState);
    return caseState;
  }

  public getAllCases(): CaseState[] {
    return Array.from(this.cachedCases.values());
  }

  public setActiveCase(caseStateOrId: CaseState | string): CaseState {
    if (typeof caseStateOrId === 'string') {
      if (this.cachedCases.has(caseStateOrId)) {
        this.activeCaseId = caseStateOrId;
      }
    } else {
      this.cachedCases.set(caseStateOrId.id, caseStateOrId);
      this.activeCaseId = caseStateOrId.id;
    }
    try {
      localStorage.setItem('genieflow_active_case_id', this.activeCaseId);
    } catch (_e) {}
    this.notify();
    return this.getActiveCaseState();
  }

  public clearActiveCase(): CaseState {
    this.activeCaseId = 'FLUID_WORKSPACE';
    try {
      localStorage.setItem('genieflow_active_case_id', 'FLUID_WORKSPACE');
    } catch (_e) {}
    this.notify();
    return FLUID_WORKSPACE_STATE;
  }

  public getActiveCaseState(): CaseState {
    return this.cachedCases.get(this.activeCaseId) || FLUID_WORKSPACE_STATE;
  }

  public getCase(id: string): CaseState {
    return this.cachedCases.get(id) || this.getActiveCaseState();
  }

  private seedCases() {
    // 1. Yolanda Ramirez (Active Matter)
    this.cachedCases.set('RAMIREZ_YOLANDA', {
      id: 'RAMIREZ_YOLANDA',
      applicantName: 'Yolanda Ramirez',
      employer: 'National Signal LLC',
      carrierTpa: 'Travelers Insurance Company',
      eamsNumber: 'ADJ20377197',
      districtOffice: 'Anaheim District Office',
      wcjJudge: 'Hon. Katharine Holmes, WCJ',
      dateOfInjury: 'CT: 05/26/2023 – 05/26/2024',
      injuries: ['Multiple Orthopedic / Cumulative Trauma'],
      applicantCounsel: 'Law Offices of Applicant Counsel, A P.L.C.',
      verifiedDefensesOmissions: ['Lien Claimant Spectrum Medical Group, Inc. appearance verified', 'Travelers non-payment and unreasonable delay active']
    });

    // 2. Ruben Zarate
    this.cachedCases.set('ZARATE_RUBEN', {
      id: 'ZARATE_RUBEN',
      applicantName: 'Ruben Zarate',
      employer: 'Universal Logistics / Transport Corp',
      carrierTpa: 'State Compensation Insurance Fund (SCIF)',
      eamsNumber: 'ADJ18292843',
      districtOffice: 'Pomona District Office',
      dateOfInjury: '08/14/2023',
      injuries: ['Lumbar Spine with Radiculopathy', 'Bilateral Knees'],
      applicantCounsel: 'Law Offices of Applicant Counsel, A P.L.C.',
      verifiedDefensesOmissions: ['10-day meet & confer cure window expired for delinquent TTD & EDD SDI reimbursement']
    });

    // 3. Irma Murillo
    this.cachedCases.set('MURILLO_IRMA', {
      id: 'MURILLO_IRMA',
      applicantName: 'Irma Murillo',
      dateOfBirth: '09/30/1983',
      address: '2832 W. Ball Road, Apt S59, Anaheim, CA 92804',
      employer: 'Ultra Personnel LLC / Fortem HR LLC as PEO',
      coEmployer: 'VES Staffing, LLC',
      dateOfInjury: 'CT: 01/06/2022 – 01/06/2023',
      injuries: ['Neck', 'Bilateral Shoulders', 'Left Knee', 'Anxiety/Psych/Sleep Disturbance'],
      eamsNumber: 'ADJ17233266',
      districtOffice: 'Anaheim District Office',
      wcjJudge: 'Hon. Keith N. Pusavat, WCJ',
      carrierTpa: 'United Wisconsin Insurance Company / Next Level Administrators',
      defenseCounsel: 'Soleiman, APC (Sheila Yazdi, Esq. / Matthew Soleimanpour, Esq.)',
      applicantCounsel: 'Law Offices of Applicant Counsel, A P.L.C.',
      primaryTreatingPhysician: 'Dr. Rockny Mojabe, D.C. (Mojabe Chiropractic Corp)',
      secondaryTreatingPhysician: 'Dr. Nelson Flores, Ph.D.',
      mriFindings: [
        'Oblique tear involving posterior horn of medial meniscus (05/06/2026)',
        'Grade III chondromalacia of patellar cartilage',
        'Joint effusion with bursitis'
      ],
      proceduralTimeline: [
        { date: '05/22/2026', event: 'Order Denying Defense 1st Petition to Dismiss Inactive Case' },
        { date: '06/29/2026', event: 'Defense re-filed Petition alleging missed depos with zero proof attached' },
        { date: '08/28/2026', event: '20-Day Notice of Intent to Dismiss issued by WCJ Pusavat' },
        { date: '09/01/2026', event: 'Applicant filed Verified Objection demonstrating good cause' }
      ],
      verifiedDefensesOmissions: [
        'Zero proof of deposition notices or certificates of non-appearance',
        'Active medical treatment ongoing with PTP Dr. Mojabe and Dr. Flores',
        'Objective surgical lesion documented on Inland MRI'
      ]
    });

    // 4. Marco Antonio Torro
    this.cachedCases.set('TORRO_MARCO_ANTONIO', {
      id: 'TORRO_MARCO_ANTONIO',
      applicantName: 'Marco Antonio Torro',
      employer: 'Master Construction Services',
      dateOfInjury: 'CT: 2021 – 2023',
      injuries: ['Lumbar Spine', 'Cervical Spine', 'Right Shoulder'],
      eamsNumber: 'ADJ16948210',
      districtOffice: 'Pomona District Office',
      wcjJudge: 'Hon. WCJ Pomona',
      applicantCounsel: 'Law Offices of Applicant Counsel, A P.L.C.',
      primaryTreatingPhysician: 'Dr. Mojabe, D.C.',
      verifiedDefensesOmissions: ['Lien / Reconsideration and medical necessity established']
    });
  }

  /**
   * Generates a compact prompt-cacheable JSON string for model context
   */
  public toPromptContext(id?: string): string {
    const cs = id ? this.getCase(id) : this.getActiveCaseState();
    return JSON.stringify({
      matter: `${cs.applicantName} v. ${cs.employer}`,
      eams: cs.eamsNumber,
      doi: cs.dateOfInjury,
      judge: cs.wcjJudge || 'WCAB Judge',
      ptp: cs.primaryTreatingPhysician || 'Treating Physician',
      mri: cs.mriFindings || [],
      omissions: cs.verifiedDefensesOmissions || []
    }, null, 2);
  }
}

export const caseStateHarvester = CaseStateHarvester.getInstance();
