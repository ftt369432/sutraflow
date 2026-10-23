"""
Sutra Medical & Doctor Advocacy MCP Server
Unified Stdio MCP Server for Medical-Legal Fee Schedules, MTUS Guidelines, and ICD-10 Diagnostics
"""

import os
import sys
from mcp.server.mcpserver import MCPServer

app = MCPServer(name="Sutra-Medical-Hub")

MED_LEGAL_BASE_RATES = {
    "ML201": {"desc": "Comprehensive Initial Medical-Legal Evaluation", "base": 2015.00, "current": 2216.50},
    "ML202": {"desc": "Follow-up / Supplemental Medical-Legal Evaluation", "base": 1315.00, "current": 1446.50},
    "ML203": {"desc": "Comprehensive Medical-Legal Evaluation by AME", "base": 3022.50, "current": 3324.75},
    "ML204": {"desc": "Follow-up Medical-Legal Evaluation by AME", "base": 1972.50, "current": 2169.75},
    "MLPRR": {"desc": "Record Review in Excess of 200 Pages (per page)", "base": 3.00, "current": 3.30}
}

ICD10_DB = {
    "S33.5XXA": "Sprain of ligaments of lumbar spine, initial encounter",
    "M47.896": "Other spondylosis, lumbar region (Lumbar Spondylosis)",
    "M43.17": "Spondylolisthesis, lumbosacral region",
    "M54.16": "Radiculopathy, lumbar region",
    "M99.85": "Other biomechanical lesions of pelvic region",
    "M75.101": "Unspecified rotator cuff tear or rupture of right shoulder",
    "M75.102": "Unspecified rotator cuff tear or rupture of left shoulder",
    "M25.561": "Pain in right knee",
    "M25.562": "Pain in left knee",
    "M23.22": "Derangement of meniscus due to old tear or injury, right knee",
    "M23.23": "Derangement of meniscus due to old tear or injury, left knee"
}

@app.tool()
def calculate_omfs_med_legal(code: str, record_pages_over_200: int = 0, is_late_60_days: bool = True) -> str:
    """Calculate official California DWC Medical-Legal Fee Schedule reimbursement with 10% penalty and 7% interest."""
    code_upper = code.upper().strip()
    if code_upper not in MED_LEGAL_BASE_RATES:
        return f"Invalid code '{code}'. Supported codes: {', '.join(MED_LEGAL_BASE_RATES.keys())}"
    info = MED_LEGAL_BASE_RATES[code_upper]
    base_fee = info["current"]
    record_review_fee = record_pages_over_200 * MED_LEGAL_BASE_RATES["MLPRR"]["current"]
    principal_total = base_fee + record_review_fee
    penalty = principal_total * 0.10 if is_late_60_days else 0.0
    interest = principal_total * 0.07 if is_late_60_days else 0.0
    grand_total = principal_total + penalty + interest
    return f"""### 🏥 California Medical-Legal Accounting (8 CCR § 9795 & LC § 4622):
- **Service:** {code_upper} - {info['desc']}
- **Base Fee Allowed:** ${base_fee:,.2f}
- **Record Review ({record_pages_over_200} pages > 200 @ $3.30/page):** ${record_review_fee:,.2f}
- **Total Principal Allowed:** ${principal_total:,.2f}
- **Labor Code § 4622 10% Mandatory Penalty:** ${penalty:,.2f}
- **Labor Code § 4622 7% Per Annum Interest:** ${interest:,.2f}
- **TOTAL CONFORMED REIMBURSEMENT DEMAND:** **${grand_total:,.2f}**
"""

@app.tool()
def lookup_icd10_code(term_or_code: str) -> str:
    """Look up ICD-10 diagnostic codes for California Workers' Compensation orthopedic & spinal injuries."""
    query = term_or_code.upper().strip()
    matches = {k: v for k, v in ICD10_DB.items() if query in k or query.lower() in v.lower()}
    if not matches:
        return f"No ICD-10 codes found matching '{term_or_code}'."
    out = ["### ICD-10 Diagnostic Match:"]
    for c, desc in matches.items():
        out.append(f"- **{c}:** {desc}")
    return "\n".join(out)

if __name__ == "__main__":
    app.run()
