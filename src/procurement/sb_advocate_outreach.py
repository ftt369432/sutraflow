"""
California Small Business (SB) Advocate Directory & Direct Contract Outreach Generator
Implements California Government Code § 14838.5 (SB/DVBE Option for contracts up to $249,999)
"""

import os
import sys
import json
from datetime import datetime

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "01_RESEARCH", "advocate_outreach")

ADVOCATES = [
    {
        "department": "Department of Cannabis Control (DCC)",
        "advocate_name": "Small Business & DVBE Advocate",
        "email": "SB.DVBE@cannabis.ca.gov",
        "phone": "(844) 612-2322",
        "address": "2920 Kilgore Road, Rancho Cordova, CA 95670",
        "focus_areas": ["Licensing Integration", "Track-and-Trace APIs", "Compliance Analytics", "Custom Database Tools"]
    },
    {
        "department": "Department of Industrial Relations (DIR / DWC)",
        "advocate_name": "DIR Small Business Liaison",
        "email": "DIRAdvocate@dir.ca.gov",
        "phone": "(510) 286-7000",
        "address": "1515 Clay Street, 17th Floor, Oakland, CA 94612",
        "focus_areas": ["Workers' Comp (EAMS)", "Court Record Modernization", "Document OCR", "Labor Enforcement Analytics"]
    },
    {
        "department": "California Department of Technology (CDT)",
        "advocate_name": "CDT Vendor Relations & SB Advocate",
        "email": "SBDVBEAdvocate@state.ca.gov",
        "phone": "(916) 431-5555",
        "address": "10860 Gold Center Drive, Rancho Cordova, CA 95670",
        "focus_areas": ["Statewide Cloud Architecture", "Generative AI Governance", "Cybersecurity", "IT MSA & CMAS"]
    },
    {
        "department": "Department of Consumer Affairs (DCA)",
        "advocate_name": "DCA Small Business Advocate",
        "email": "SmallBusinessAdvocate@dca.ca.gov",
        "phone": "(916) 574-7290",
        "address": "1625 North Market Blvd, Sacramento, CA 95834",
        "focus_areas": ["Board & Bureau Licensing", "Enforcement Case Management", "Public Portals"]
    },
    {
        "department": "Department of General Services (DGS) Procurement Division",
        "advocate_name": "Office of Small Business & DVBE Services (OSDS)",
        "email": "OSDSHelp@dgs.ca.gov",
        "phone": "(916) 375-4940",
        "address": "707 3rd Street, 1st Floor, West Sacramento, CA 95605",
        "focus_areas": ["Cal eProcure Management", "CMAS Contracts", "Statewide Leveraged Purchasing"]
    }
]

def generate_outreach_letter(advocate_info, company_name="Apex Consulting Group LLC", contact_name="Frank Ureno", contact_email="apexcg25@gmail.com", phone="(909) 469-9977"):
    today = datetime.now().strftime("%B %d, %Y")
    dept = advocate_info["department"]
    email = advocate_info["email"]
    focus = ", ".join(advocate_info["focus_areas"])
    
    letter = f"""# DIRECT OUTREACH: CALIFORNIA SB/DVBE OPTION INQUIRY
**Date:** {today}  
**To:** {advocate_info['advocate_name']}, {dept}  
**Email:** `{email}`  
**From:** {contact_name} ({company_name})  
**Contact:** `{contact_email}` | {phone}  
**Subject:** Capabilities Introduction & SB Option Contracting Pool (Gov. Code § 14838.5) — {dept}  

---

Dear {advocate_info['advocate_name']}:

I am writing to introduce **{company_name}** as a California-based technology and regulatory legal solutions provider, and to request inclusion in your department's informal solicitation pool under the **California Small Business Option (California Government Code § 14838.5)**.

### Why Partner Under the SB Option (Gov. Code § 14838.5)?
As you know, California law authorizes {dept} to award Information Technology goods, software, and services contracts valued between **$5,000 and $249,999.00 directly to certified California Small Businesses** with only two (2) price quotes, without going through a full public RFP. This allows your team to rapidly modernize systems and fulfill state-mandated 25% Small Business spending goals.

### Our Core Technology & Domain Competencies:
1. **Specialized Regulatory Software & Middleware:** High-reliability Python and REST API development for licensing, supply chain auditing, and case tracking ({focus}).
2. **Deterministic Document & Legal AI:** Zero-cloud egress, air-gapped document intelligence, automated OCR extraction for complex regulatory records, and court-grade formatting.
3. **California Regulatory Grounding:** Deep native expertise in California administrative law, statutory compliance, and data governance.

### Request for Next Steps:
Could you please:
1. Confirm the process for adding our entity to {dept}'s informal vendor roster for upcoming IT/software needs under $250,000?
2. Inform us if your buyers are currently seeking quotes for any software enhancements, API integration, or data pipeline tasks?

We welcome the opportunity to submit our formal Capability Statement and schedule a brief 15-minute briefing with your procurement officers.

Sincerely,

**/s/ {contact_name}**  
Managing Director / Principal Counsel  
{company_name}  
`{contact_email}`  
"""
    return letter

def export_all_outreach():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for adv in ADVOCATES:
        slug = adv["department"].split("(")[0].strip().replace(" ", "_")
        letter = generate_outreach_letter(adv)
        out_path = os.path.join(OUTPUT_DIR, f"OUTREACH_{slug}.md")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(letter)
            
    print(f"[+] Successfully exported {len(ADVOCATES)} targeted SB advocate outreach packages to:")
    print(f"    {OUTPUT_DIR}")

if __name__ == "__main__":
    export_all_outreach()
