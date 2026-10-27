/**
 * 🏛️ syntheticDemoCase.ts
 * 
 * Fully de-identified synthetic Workers' Compensation case for Hackathon demos,
 * automated testing, and zero-PHI judge evaluations.
 * 
 * Free of any real claimant names, SSNs, dates of birth, or confidential claim files.
 */

import { ExtractedCaseMetadata } from '../../services/swarm/legal/LegalResearchSwarmAgent';

export const SYNTHETIC_DEMO_CASE: ExtractedCaseMetadata = {
  applicant: 'ALEX R. DEMO',
  defendant: 'ACME PACIFIC LOGISTICS / STATE WORKERS COMP FUND',
  adjNumber: 'ADJ9928174',
  injuryDate: '2023-08-14',
  mscDate: '2024-04-10',
  judgeName: 'Hon. Sarah Jenkins, WCJ',
  districtOffice: 'Santa Ana District Office (ANA)',
  billingBalance: '$14,750.00',
  disputedExhibits: [
    {
      identifier: 'Defense Exhibit "D"',
      description: 'Supplemental QME Report of Dr. Marcus Stone, M.D.',
      date: '2024-05-18',
      objectionBasis: 'Untimely post-MSC evidence served 38 days after Mandatory Settlement Conference discovery cutoff without showing of due diligence.',
      controllingAuthority: 'Labor Code § 5502(d)(3); Tuckerman v. St. Francis Hospital (1995) 60 CCC 533'
    },
    {
      identifier: 'Defense Exhibit "E"',
      description: 'Sub Rosa Video Surveillance Summary & Activity Logs',
      date: '2024-02-12',
      objectionBasis: 'Unlisted surprise evidence withheld at MSC; strict evidentiary bar under McClanahan en banc precedent.',
      controllingAuthority: 'McClanahan v. City of Anaheim (2012) 77 CCC 105 (Appeals Board En Banc)'
    },
    {
      identifier: 'Defense Exhibit "F"',
      description: 'Post-Closure Peer Utilization Review Analysis',
      date: '2024-06-02',
      objectionBasis: 'Untimely utilization review modification barred under LC § 4610 and Dubon II.',
      controllingAuthority: 'State Compensation Ins. Fund v. WCAB (Escobedo) (2005) 70 CCC 604'
    }
  ],
  penaltyTriggers: [
    {
      type: 'LC 4622',
      reason: 'Medical-Legal billing of $14,750.00 remained completely unpaid past statutory 60-day deadline without timely objection or EOR.',
      amount: '$1,475.00'
    },
    {
      type: 'LC 5813',
      reason: 'Frivolous post-MSC filing tactics forcing needless hearing litigation expenses.',
      amount: '$1,000.00'
    }
  ]
};

export const SYNTHETIC_DEMO_RECORD_TEXT = `
STATE OF CALIFORNIA - WORKERS' COMPENSATION APPEALS BOARD
CASE RECORD SUMMARY FOR EVALUATION & RATING

DOCKET: ADJ9928174
VENUE: Santa Ana District Office (ANA)
PRESIDING: Hon. Sarah Jenkins, Workers' Compensation Judge

PARTIES:
- Applicant: ALEX R. DEMO
- Employer / Carrier: ACME PACIFIC LOGISTICS / STATE WORKERS COMP FUND
- Date of Injury: August 14, 2023 (Specific injury to lumbar spine, bilateral knees, and psyche)
- Mandatory Settlement Conference (MSC) Date: April 10, 2024

PROCEDURAL TIMELINE & EVIDENCE DISPUTE:
1. On April 10, 2024, the parties appeared at the Mandatory Settlement Conference before Judge Jenkins. The Pre-Trial Conference Statement (PTCS) was formally executed and approved. Discovery closed pursuant to Labor Code § 5502(d)(3).
2. On May 18, 2024—thirty-eight days after MSC closure—Defendant served Defense Exhibit "D" (Supplemental Report of Dr. Marcus Stone, M.D.). No petition to reopen discovery or demonstration of unavailability was made.
3. On June 2, 2024, Defendant served Defense Exhibit "E" (Sub Rosa Surveillance logs) which were in Defendant's adjuster possession since February 12, 2024, but deliberately withheld from the PTCS exhibit list.
4. Medical Provider Spectrum Medical Group submitted complete medical-legal evaluations totaling $14,750.00 on January 15, 2024, with Proof of Service. Defendant neither paid nor provided an Explanation of Review (EOR) within 60 days.

CLAIMANT RELIEF SOUGHT:
- Total exclusion of Defense Exhibits "D", "E", and "F" under LC § 5502(d)(3), Tuckerman, and McClanahan.
- Award of outstanding principal medical-legal balance of $14,750.00.
- Mandatory 10% statutory penalty ($1,475.00) plus 7% per annum interest under Labor Code § 4622(a)(1).
- Costs and sanctions under Labor Code § 5813.
`.trim();

export const SYNTHETIC_DEMO_OBJECTIVE = `Draft a publication-ready California 28-line legal Post-Trial Brief excluding defense late exhibits under LC § 5502(d)(3) and enforcing statutory penalties under LC § 4622 in straight-writing prose with zero tables.`;
