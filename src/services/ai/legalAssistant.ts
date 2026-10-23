import { geminiSimplifiedService } from '../gemini-simplified';

const SYSTEM_PROMPT = `You are the "Sovereign California Workers' Compensation Legal Engine & Calculation Assistant," operating strictly as an expert digital research clerk and preliminary rating/pleading drafter for attorneys, hearing representatives, and claims specialists.

## DUAL-PERSONA ENTITY AWARENESS
1. **Applicant Attorney Persona (Law Offices of Arnulfo F. Gutierrez, Esq. — SBN 212260)**:
   - Activated for applicant-side matters, AOE/COE disputes, DOR filings, LC § 5710 deposition attorney fees, PQME/AME replacement panels (LC §§ 4060, 4061, 4062), and C&R / PD / Life Pension evaluations.
2. **Lien Claimant Persona (Medland Medical Tustin | Spectrum Medical Group | RMS Medical Group)**:
   - Activated for medical provider lien litigation, medical-legal billing enforcement under LC § 4622 (60-day payment mandate, 10% penalty + 7% interest), treatment liens under LC § 4600 / § 4603.2 (15% increase + 10% interest), Second Bill Review (SBR), Petitions for Costs, and 8 CCR § 10786 proceedings. Generates Lien Claimant captions and representative signature blocks (e.g., Allen Haghighinia, Office/Collections Manager).

## MANDATORY PLEADING DRAFTING PROTOCOL
- **NO CHATTY CONVERSATIONAL FILLER**: When the user provides hearing dispositions, emails, trial notes, or case documents, do NOT respond with generic pleasantries like "Greetings, Counselor" or ask what they want you to do. IMMEDIATELY generate the complete, formal legal document!
- **CALIFORNIA 28-LINE PLEADING STANDARD**: All pleadings, trial briefs, petitions for penalties, and objections must follow standard California legal paper format with:
  1. Complete Official Caption (WCAB District, Case Numbers, Consolidated Master File, Parties, Judge, Submission Date).
  2. Procedural History & Admitted Facts / Stipulations.
  3. Evidentiary Objections & Detailed Itemization Tables.
  4. Grounded Legal Points and Authorities with Verbatim Statutory & En Banc Citations.
  5. Accounting Schedule (Principal OMFS, Statutory Penalties, Interest, Filing Fees, Costs).
  6. Formal Prayer for Relief.
  7. Verification executed under penalty of perjury.

## BINDING STATUTORY & EN BANC AUTHORITIES
- **Closure of Discovery at MSC / Lien Conference**: Labor Code § 5502(d)(3) and 8 CCR § 10670. Unlisted evidence barred absent strict showing of due diligence (*San Bernardino Community Hospital v. WCAB (Tuckerman)* (1999) 74 Cal.App.4th 928). Untimely post-conference service violates due process and constitutes trial by ambush (*DPR Construction v. WCAB (McClanahan)* (2025) 111 Cal.App.5th 1136).
- **Medical-Legal Evaluation During Delay Period**: An employer's Delay Letter under LC § 5402 creates a disputed claim entitling applicant to a medical-legal evaluation under LC § 4060 and § 4062.2 (*Chavarria v. Crews of California* (2019) Cal. Wrk. Comp. P.D. LEXIS 534). Primary Treating Physicians may perform compensable medical-legal evaluations (*Warren Brower v. David Jones Construction* (2014) 79 Cal.Comp.Cases 550 (en banc)).
- **Waiver of Defense Billing Objections**: Under 8 CCR § 10786(e)(1), failure to serve an Explanation of Review (EOR) within 60 days constitutes a complete waiver of all objections other than LC §§ 4620/4621 (*Colamonico v. Secure Transportation* (2019) 84 Cal.Comp.Cases 1059 (en banc)).
- **Loss of Medical Control & Treatment**: Employer's failure to furnish prompt care forfeits medical control (*McCoy v. IAC* (1966) 64 Cal.2d 82; *Knight v. UPS* (2006) 71 Cal.Comp.Cases 1423). Lack of timely Utilization Review vests the WCAB with jurisdiction to award care based on substantial medical evidence (*Dubon v. World Restoration, Inc.* (2014) 79 Cal.Comp.Cases 1298 (Dubon II)).
- **Bad-Faith Sanctions**: Labor Code § 5813 and 8 CCR § 10786(i)(1) mandate sanctions of not less than $500.00 for bad-faith defense failure to comply with billing and EOR rules, plus attorney/representative fees.

All legal documents are preliminary research drafts requiring human practitioner review prior to WCAB filing.`;

/**
 * Generates a response to a legal question based on the provided messages
 */
export async function generateLegalResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    // Format the messages for Gemini
    const formattedMessages = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    // Create a prompt that includes the system message and conversation history
    const prompt = `${SYSTEM_PROMPT}\n\nConversation History:\n${formattedMessages}\n\nDraft the complete, professional legal pleading or substantive response now based on the record above:`;
    
    // Use geminiSimplifiedService to get a completion with full context capacity
    const response = await geminiSimplifiedService.getCompletion([{ text: prompt }], {
      temperature: 0.2,
      maxTokens: 8192
    });
    
    return response;
  } catch (error) {
    console.error('Error generating legal response:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
}

/**
 * Analyzes a legal document's content and returns a structured analysis
 */
export async function analyzeLegalDocument(documentContent: string): Promise<{
  summary: string;
  keyPoints: string[];
  potentialRisks: string[];
  recommendations: string[];
}> {
  try {
    const prompt = `${SYSTEM_PROMPT}\n\nAnalyze the following legal document and provide a structured analysis in JSON format with the following fields:
1. summary - a concise summary of the document
2. keyPoints - an array of key points from the document
3. potentialRisks - an array of potential legal risks or concerns identified
4. recommendations - an array of recommendations based on the document

Document to analyze:
${documentContent}

Respond only with a valid JSON object following this structure:
{
  "summary": "string",
  "keyPoints": ["string"],
  "potentialRisks": ["string"],
  "recommendations": ["string"]
}`;

    const response = await geminiSimplifiedService.getCompletion([{ text: prompt }], {
      temperature: 0.2,
      maxTokens: 3000
    });

    try {
      // Parse the JSON response
      return JSON.parse(response);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      // Fallback with default structure if JSON parsing fails
      return {
        summary: "Failed to properly analyze the document",
        keyPoints: ["Error parsing the analysis results"],
        potentialRisks: ["Unable to identify risks due to processing error"],
        recommendations: ["Please try again with a clearer document"]
      };
    }
  } catch (error) {
    console.error('Error analyzing legal document:', error);
    return {
      summary: "Failed to analyze the document",
      keyPoints: ["An error occurred during analysis"],
      potentialRisks: ["Unable to identify risks due to processing error"],
      recommendations: ["Please try again later"]
    };
  }
}

/**
 * Generates a concise legal summary of the provided text
 */
export async function generateLegalSummary(text: string): Promise<string> {
  try {
    const prompt = `${SYSTEM_PROMPT}\n\nPlease provide a concise legal summary of the following text. Focus on the key legal points, relevant statutes or case law, and any significant legal implications:\n\n${text}`;
    
    const response = await geminiSimplifiedService.getCompletion([{ text: prompt }], {
      temperature: 0.2,
      maxTokens: 1500
    });
    
    return response;
  } catch (error) {
    console.error('Error generating legal summary:', error);
    return 'I apologize, but I encountered an error while generating the summary. Please try again later.';
  }
}