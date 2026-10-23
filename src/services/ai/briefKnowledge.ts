/**
 * Brief Knowledge Pack — rhetorical persona + verified authority bank.
 *
 * Source of truth: the practitioner's own Amended Post-Trial Brief (Rivas, ADJ15701271).
 * Quotes below are copied verbatim from that filed brief. They are "attorney-verified as filed";
 * a human must still confirm against the official reporter before any new filing.
 *
 * The engine's Quote Guard strips any block quote the model produces that is not a substring
 * of this bank (Verbatim-Legal-Quotes-Only rule).
 */

export interface AuthorityEntry {
  id: string;
  cite: string;
  /** Verbatim quote text, or null when only a holding summary (paraphrase) is available. */
  quote: string | null;
  holding: string;
}

export const AUTHORITY_BANK: Record<string, AuthorityEntry> = {
  lc5502d3: {
    id: 'lc5502d3',
    cite: 'Lab. Code, § 5502(d)(3)',
    quote:
      'Discovery shall close on the date of the mandatory settlement conference. Evidence not disclosed or obtained thereafter, and not disclosed at the mandatory settlement conference, is not admissible in any proceeding, except for good cause shown and on a showing that the evidence was not available or could not have been discovered by the exercise of due diligence prior to the conference.',
    holding: 'Discovery closes at the MSC; undisclosed evidence is inadmissible absent good cause and due diligence.'
  },
  ccr10670: {
    id: 'ccr10670',
    cite: 'Cal. Code Regs., tit. 8, § 10670(b)',
    quote:
      'Evidence not listed on the pretrial conference statement shall not be admitted into evidence at trial, except upon a showing of good cause that the evidence was not available or could not have been discovered by the exercise of due diligence prior to the pretrial conference.',
    holding: 'Exhibits must be listed on the PTCS; unlisted evidence is excluded absent good cause.'
  },
  tuckerman: {
    id: 'tuckerman',
    cite: 'San Bernardino Community Hospital v. WCAB (Tuckerman) (1999) 74 Cal.App.4th 928, 936 [64 Cal.Comp.Cases 986]',
    quote:
      "The language of section 5502, subdivision (d)(3) is direct and mandatory... The Legislature clearly intended to close discovery at the mandatory settlement conference... This was designed to eliminate the 'trial by ambush' that previously characterized workers' compensation proceedings... If a party could simply withhold evidence in its possession and introduce it at trial without establishing due diligence, the statute would be rendered meaningless.",
    holding: 'Section 5502(d)(3) is mandatory; withheld evidence in a party’s possession is excluded absent due diligence.'
  },
  mcclanahan: {
    id: 'mcclanahan',
    cite: 'DPR Construction v. WCAB (McClanahan) (2025) 111 Cal.App.5th 1136, 1146',
    quote:
      'Strict adherence to disclosure rules is required to protect the constitutional due process rights of the parties. Due process requires notice and an opportunity to be heard, and a party cannot have a fair hearing when confronted with unserved, undisclosed records at or after trial. The admission of such unlisted records constitutes an abuse of discretion.',
    holding: 'Admitting undisclosed, unserved records violates due process and is an abuse of discretion.'
  },
  chavarria: {
    id: 'chavarria',
    cite: 'Chavarria v. Crews of California (2019) 2019 Cal. Wrk. Comp. P.D. LEXIS 534',
    quote:
      "the term 'a request for a medical evaluation' as used in section 4062.2, should be broadly interpreted, and the combination of an applicant filing a claim form, and an employer notifying the applicant that further discovery is needed is sufficient to meet that definition. Both parties have the right to perform discovery regarding the causation of applicant's injury while an employer determines whether to accept a claimed injury.",
    holding: 'A claim form plus an employer notice that further discovery is needed suffices; no denial is required before med-legal discovery.'
  },
  brower: {
    id: 'brower',
    cite: 'Brower v. David Jones Construction (2014) 79 Cal.Comp.Cases 550 (en banc)',
    quote: null,
    holding: 'A PTP evaluation is compensable as a medical-legal expense under Lab. Code § 4620 when incurred to prove a contested claim.'
  },
  youngLee: {
    id: 'youngLee',
    cite: 'Young Lee v. Military Deli and Bakery Services Inc., ADJ11273405',
    quote: 'A medical-legal evaluation performed by an employee’s treating physician is a medical-legal evaluation obtained pursuant to section 4060.',
    holding: 'A treating-physician evaluation can be a section 4060 med-legal evaluation.'
  },
  ccr10786e1: {
    id: 'ccr10786e1',
    cite: 'Cal. Code Regs., tit. 8, § 10786(e)(1)',
    quote:
      "A defendant shall be deemed to have waived all objections to a medical-legal provider's billing, other than compliance with Labor Code sections 4620 and 4621, if: (1) The provider submitted a properly documented billing to the defendant and, within 60 days thereafter, the defendant failed to serve an explanation of review (EOR) that complies with Labor Code section 4603.3 and any applicable regulations adopted by the Administrative Director",
    holding: 'Failure to serve a compliant EOR within 60 days waives all billing objections other than §§ 4620/4621 compliance.'
  },
  colamonico: {
    id: 'colamonico',
    cite: 'Colamonico v. Secure Transportation (2019) 84 Cal.Comp.Cases 1059 (en banc)',
    quote: null,
    holding: 'Lien claimant must show a contested claim and that the evaluation was reasonably incurred; thereafter untimely-EOR waiver applies.'
  },
  mccoy: {
    id: 'mccoy',
    cite: 'McCoy v. Industrial Acc. Com. (1966) 64 Cal.2d 82, 87 [31 Cal.Comp.Cases 93]',
    quote:
      'Notice of injury provides the employer with the opportunity to render medical assistance, and if he fails to avail himself of the opportunity promptly, he has neglected to provide treatment within the meaning of section 4600... In these circumstances, the employee is not required to give further opportunity to the employer or insurance carrier to tender the treatment the employee-selected physician proposes to undertake.',
    holding: 'Employer neglect to promptly provide care frees the employee to self-procure.'
  },
  knight: {
    id: 'knight',
    cite: 'Knight v. United Parcel Service (2006) 71 Cal.Comp.Cases 1423 (en banc)',
    quote: null,
    holding: 'Employer neglect forfeits MPN medical control; defendant liable for self-procured treatment.'
  },
  dubon2: {
    id: 'dubon2',
    cite: 'Dubon v. World Restoration, Inc. (2014) 79 Cal.Comp.Cases 1298 (Dubon II) (en banc)',
    quote: null,
    holding: 'Absent timely and valid Utilization Review, the Board (not UR/IMR) decides medical necessity on substantial evidence.'
  },
  ccr10786i1: {
    id: 'ccr10786i1',
    cite: 'Cal. Code Regs., tit. 8, § 10786(i)(1)',
    quote:
      "If the Workers' Compensation Appeals Board determines that, as a result of bad faith actions or tactics, a defendant failed to comply with the requirements, timelines and procedures set forth in Labor Code sections 4622, 4603.3 and 4603.6 and the related Rules of the Administrative Director, the defendant shall be liable for the medical-legal provider's reasonable attorney's fees and costs and for sanctions under Labor Code section 5813 and rule 10421. The amount of the attorney's fees, costs and sanctions payable shall be determined by the Workers' Compensation Appeals Board; however, for bad faith actions or tactics occurring on or after October 23, 2013, the monetary sanctions shall not be less than $500.00.",
    holding: 'Bad-faith non-compliance with §§ 4622/4603.3/4603.6 triggers fees, costs and sanctions of at least $500.'
  },
  lc4062_2: {
    id: 'lc4062_2',
    cite: 'Lab. Code, § 4062.2',
    quote:
      'Whenever a comprehensive medical evaluation is required to resolve any dispute arising out of an injury or a claimed injury... and the employee is represented by an attorney, the evaluator shall be obtained only through the procedures provided in this section.',
    holding: 'Governs representation and selection procedures for Panel Qualified Medical Evaluators.'
  },
  lc4062_3b: {
    id: 'lc4062_3b',
    cite: 'Lab. Code, § 4062.3(b)',
    quote:
      'Information that a party proposes to provide to the qualified medical evaluator selected from a panel shall be served on the opposing party 20 days before the information is provided to the evaluator. If the opposing party objects to consideration of nonmedical records within 10 days thereafter, the records shall not be provided to the evaluator.',
    holding: 'Mandatory 20-day advance service of proposed records to opposing counsel; nonmedical records must be withheld upon timely objection.'
  },
  ccr35k: {
    id: 'ccr35k',
    cite: 'Cal. Code Regs., tit. 8, § 35(k)',
    quote:
      'The Appeals Board shall retain jurisdiction in all cases to determine disputes arising from objections and whether ex parte contact in violation of Labor Code section 4062.3 or this section of Title 8 of the California Code of Regulations has occurred. If any party communicates with an evaluator in violation of Labor Code section 4062.3, the Medical Director shall provide the aggrieved party with a new panel in which to select a new QME or the aggrieved party may elect to proceed with the original evaluator.',
    holding: 'WCAB retains jurisdiction over ex parte contacts; aggrieved party is entitled to a replacement QME panel.'
  },
  ccr31_7: {
    id: 'ccr31_7',
    cite: 'Cal. Code Regs., tit. 8, § 31.7',
    quote:
      'Upon a showing of good cause that an evaluator in a different specialty is medically necessary to resolve a disputed medical issue, the Workers\' Compensation Appeals Board may order the Medical Director to issue an additional panel of qualified medical evaluators in the appropriate specialty.',
    holding: 'Good cause and medical necessity warrant an order for an additional QME panel in a distinct medical specialty.'
  },
  romero: {
    id: 'romero',
    cite: 'Romero v. Costco Wholesale (2007) 72 Cal.Comp.Cases 1184 (en banc)',
    quote: null,
    holding: 'A party is entitled to an evaluation by a QME in each specialty medically necessary to address disputed body parts and injuries.'
  },
  neri: {
    id: 'neri',
    cite: 'Neri Hernandez v. WCAB (2012) 77 Cal.Comp.Cases 792',
    quote: null,
    holding: 'Ex parte communication with a PQME or unauthorized submission of non-medical records requires issuance of a replacement panel.'
  },
  lc5710: {
    id: 'lc5710',
    cite: 'Lab. Code, § 5710(b)(4)',
    quote:
      'A reasonable allowance for attorney\'s fees for representation of the employee or the employee\'s dependents at the deposition, to be paid by the employer or the insurer.',
    holding: 'Mandates employer/carrier payment of applicant attorney fees for attending claimant deposition.'
  },
  lc5814: {
    id: 'lc5814',
    cite: 'Lab. Code, § 5814(a)',
    quote:
      'When payment of compensation has been unreasonably delayed or refused, either prior to or subsequent to the issuance of an award, the amount of the payment unreasonably delayed or refused shall be increased by up to 25 percent or up to ten thousand dollars ($10,000), whichever is less.',
    holding: 'Up to 25% penalty (capped at $10,000) for unreasonable delay or refusal of indemnity or medical compensation.'
  }
};

/** Synthetic In-Context Exemplar Snippets (Zero-PHI, strictly stylistic guidance) */
export const SYNTHETIC_SECTION_EXEMPLARS: Record<string, string> = {
  intro: `COMES NOW, Lien Claimant, HARBOR MEDICAL GROUP (hereinafter "Lien Claimant"), and respectfully submits this Post-Trial Brief pursuant to the order of the Workers' Compensation Administrative Law Judge. This brief addresses:
1. Objections to Defendant's Exhibits G through T, which were never listed on the Joint Pre-Trial Conference Statement and must be excluded under Labor Code § 5502(d)(3), 8 CCR § 10670, and the binding due process mandates of Tuckerman and McClanahan;
2. The full admissibility of Lien Claimant's Exhibits, establishing that Defendant's formal Delay Letter created a contested claim under Labor Code § 4620 and opened medical-legal discovery under Chavarria; and
3. Lien Claimant's substantive entitlement to full reimbursement plus statutory penalties, interest, and mandatory bad-faith costs under Labor Code §§ 4603.2, 4622, 5813, and 8 CCR § 10786.`,
  point1ab: `POINT I: DEFENDANT'S EXHIBITS MUST BE EXCLUDED FROM EVIDENCE UNDER LABOR CODE § 5502(d)(3) AND CONTROLLING DUE PROCESS PRECEDENT
Discovery closed on the date of the Mandatory Settlement Conference. Defendant made zero showing of good cause and zero showing of due diligence under Tuckerman. Every single withheld document existed and was in Defendant's direct possession years prior to the conference. Withholding records in one's own file and dumping them post-conference is the exact definition of lack of diligence.`
};

/** Rhetorical Persona for California Workers' Compensation & Civil Litigation Drafting */
export const RHETORICAL_PERSONA = `RHETORICAL STYLE & PERSONA:
- Tone: Firm, uncompromising, forensic, and rigorously anchored in California statutory and regulatory law.
- Never use conversational filler, greetings, or meta-commentary.
- Every factual proposition must cite specific record evidence.
- Every legal argument must cite controlling California Labor Code sections, CCR regulations, and binding WCAB en banc authorities.
- Format strictly adhering to California 28-line pleading standards with numbered headings, issue statements, and formal prayers.`;


