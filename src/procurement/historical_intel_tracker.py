"""
Historical Contract Intelligence & PRA Request Generator
Tracks past/closed state software contracts (such as the Cannabis Program SOWs)
and generates formal California Public Records Act (PRA) requests.
"""

import os
import sys
import json
from datetime import datetime

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "01_RESEARCH", "competitor_intel")

HISTORICAL_AWARDS = [
    {
        "contract_id": "DCC-2021-0044",
        "title": "California Cannabis Track-and-Trace (CCTT) System - Metrc RFID Compliance",
        "department": "Department of Cannabis Control (formerly CDFA CalCannabis)",
        "awarded_vendor": "Franwell, Inc. / Metrc LLC",
        "contract_amount": "$24,800,000",
        "award_date": "2018-01-01",
        "initial_end_date": "2023-12-31",
        "extensions": "Extended through 2026 via DGS Non-Competitively Bid (NCB) justification",
        "next_recompete_window": "Q1 2027",
        "key_technologies": ["RFID Tracking", "REST API", "Supply Chain Compliance", "Cloud SaaS"],
        "notes": "Original track-and-trace seed-to-sale database. Subject to legislative scrutiny regarding API rate limits and third-party integrator access."
    },
    {
        "contract_id": "DCC-2022-0012",
        "title": "Cannabis Licensing System Integration & Cloud Migration (Accela)",
        "department": "Department of Cannabis Control",
        "awarded_vendor": "Carahsoft Technology Corp / Accela, Inc.",
        "contract_amount": "$8,450,000",
        "award_date": "2022-03-15",
        "initial_end_date": "2025-06-30",
        "extensions": "Current 2-year extension underway; Solicitation 0000039409 released to merge dual instances",
        "next_recompete_window": "Active RFP 0000039409",
        "key_technologies": ["Accela Civic Platform", "SaaS Licensing", "GIS Mapping", "Payment Gateway"],
        "notes": "State merged 3 legacy licensing bureaus (BCC, CalCannabis, CDPH-MCSB) into DCC, creating two separate Accela databases that require unification."
    },
    {
        "contract_id": "DIR-EAMS-MOD-01",
        "title": "Electronic Adjudication Management System (EAMS) Document Modernization",
        "department": "Department of Industrial Relations (DIR / DWC)",
        "awarded_vendor": "Deloitte Consulting LLP",
        "contract_amount": "$16,200,000",
        "award_date": "2020-11-01",
        "initial_end_date": "2025-10-31",
        "extensions": "Maintenance option through 2027",
        "next_recompete_window": "Mid 2026 - 2027",
        "key_technologies": ["EAMS", "Oracle Forms", "OCR", "Pleading Ingestion", "Court Calendaring"],
        "notes": "DWC's core workers' comp court platform. Frequent ongoing RFOs for Python, Java, and automated scanning enhancements."
    }
]

def generate_pra_request(contract_info, requester_name="GenieFlow Legal & Technology Division", requester_email="office@gutierrezlegal.com"):
    """Generates a formal California Public Records Act (PRA) request letter."""
    today = datetime.now().strftime("%B %d, %Y")
    letter = f"""# VIA ELECTRONIC TRANSMISSION - PUBLIC RECORDS ACT REQUEST

**Date:** {today}
**To:** Public Records Act Coordinator / Legal Affairs
**Agency:** {contract_info['department']}
**From:** {requester_name}
**Contact:** {requester_email}

**RE: CALIFORNIA PUBLIC RECORDS ACT REQUEST (Gov. Code § 7920.000 et seq.)**
**Contract / Solicitation Reference:** {contract_info['contract_id']} — {contract_info['title']}
**Awarded Vendor:** {contract_info['awarded_vendor']}

Dear Public Records Coordinator:

Pursuant to the California Public Records Act (California Government Code § 7920.000 et seq., formerly Gov. Code § 6250 et seq.) and Article I, Section 3(b) of the California Constitution, I hereby respectfully request access to and electronic copies of the following public records concerning the above-referenced contract:

1. **Executed Contract & Standard Agreement:** The fully executed California Standard Agreement (STD 213), including all exhibits, Statement of Work (Exhibit A), Budget/Cost Details (Exhibit B), General Terms and Conditions (GTC), and any executed Amendments or Change Orders.
2. **Winning Contractor's Technical Proposal:** The complete proposal submitted by {contract_info['awarded_vendor']}, including the technical narrative, solution architecture, and staffing plan (subject only to narrow redactions of legitimate trade secret source code, if any).
3. **Scoring & Evaluation Records:** The final consensus scoring sheets, evaluator notes, Cost Evaluation Worksheets, and Notice of Intent to Award.
4. **Current Status & Option Dates:** Any records confirming whether contract option years have been exercised and the revised final contract termination date.

Under California Government Code § 7922.535, you have ten (10) calendar days from receipt of this request to determine whether this request, in whole or in part, seeks copies of disclosable public records in your possession and notify the undersigned.

If any portion of the requested records is deemed exempt from disclosure, please provide the specific statutory exemption relied upon pursuant to Government Code § 7922.000, while releasing the remainder of the segregable records.

Please deliver all documents electronically in PDF format to `{requester_email}`. Thank you for your prompt assistance.

Respectfully submitted,

/s/ {requester_name}
Authorized Representative
"""
    return letter

def save_intel_reports():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    intel_json_path = os.path.join(OUTPUT_DIR, "historical_contracts.json")
    with open(intel_json_path, "w", encoding="utf-8") as f:
        json.dump({"contracts": HISTORICAL_AWARDS}, f, indent=2)
        
    for contract in HISTORICAL_AWARDS:
        cid = contract['contract_id'].replace("-", "_").replace(" ", "_")
        pra_text = generate_pra_request(contract)
        pra_file = os.path.join(OUTPUT_DIR, f"PRA_REQUEST_{cid}.md")
        with open(pra_file, "w", encoding="utf-8") as f:
            f.write(pra_text)
            
    print(f"[+] Successfully generated historical intelligence database: {intel_json_path}")
    print(f"[+] Created {len(HISTORICAL_AWARDS)} automated PRA request packages in {OUTPUT_DIR}")

if __name__ == "__main__":
    save_intel_reports()
