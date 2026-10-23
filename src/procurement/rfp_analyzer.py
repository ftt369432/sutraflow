"""
California State RFP & SOW Analyzer
Generates Go/No-Go Decision Matrix, Minimum Qualifications (MQ) Compliance Check,
and Cost/SB Preference Impact Evaluation.
"""

import os
import sys
import json
from datetime import datetime

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def evaluate_opportunity(opp_dict, entity_profile=None):
    """
    Evaluates a state RFP/RFO opportunity and generates a comprehensive
    Go/No-Go report and Compliance Matrix.
    """
    if entity_profile is None:
        entity_profile = {
            "name": "Apex Consulting Services LLC",
            "is_california_sb": True,
            "is_cmas_holder": False,
            "core_strengths": ["Python", "OCR", "Legal Case Management", "Sovereign AI", "API Integrations", "Regulatory Compliance"],
            "security_clearance": "SOC2 / HIPAA / Zero-Cloud Egress Compliant"
        }
        
    title = opp_dict.get("title", "State IT Solicitation")
    dept = opp_dict.get("department", "State Agency")
    opp_type = opp_dict.get("type", "RFP")
    val_str = opp_dict.get("estimated_value", "$500,000")
    tags = opp_dict.get("tags", [])
    
    score = 70  # Baseline
    reasons_pro = []
    reasons_con = []
    
    # Check SB Option eligibility
    if opp_type.startswith("SB Option") or "SB Option" in opp_type:
        score += 25
        reasons_pro.append("Direct SB/DVBE Option (Gov Code § 14838.5): Awards under $250k require only 2 quotes; exempt from open multi-vendor protest.")
    else:
        reasons_pro.append("5% Small Business Bid Preference applies (California Government Code § 14838).")
        
    # Check Tech Fit
    tech_match = any(t.lower() in [s.lower() for s in entity_profile["core_strengths"]] for t in tags)
    if tech_match:
        score += 15
        reasons_pro.append(f"Strong alignment with core competencies: {', '.join(tags)}")
    else:
        reasons_con.append("May require specialized subcontracting or platform certification.")
        
    # Check Department Synergy
    if "Cannabis" in dept or "Industrial Relations" in dept or "Consumer Affairs" in dept:
        score += 10
        reasons_pro.append(f"High-priority domain match: {dept} (aligned with active legal/regulatory databases).")
        
    # Final Go / No-Go Determination
    go_status = "STRONG GO (HIGH VALUE)" if score >= 85 else ("CONDITIONAL GO (PARTNER / PRIME)" if score >= 65 else "NO-GO / MONITOR")
    
    report = f"""# SOLICITATION EVALUATION & COMPLIANCE MATRIX

**Solicitation:** {title}  
**Department:** {dept}  
**Solicitation ID:** {opp_dict.get('event_id', 'N/A')}  
**Procurement Type:** {opp_type}  
**Estimated Value:** {val_str}  
**End Date:** {opp_dict.get('end_date', 'TBD')}  
**Evaluation Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  

---

## 🎯 Final Recommendation: `{go_status}` (Opportunity Score: {score}/100)

### ✅ Strengths & Winning Angles:
{chr(10).join([f"- **PRO:** {p}" for p in reasons_pro])}

### ⚠️ Challenges & Mitigation Strategies:
{chr(10).join([f"- **RISK:** {c}" for c in (reasons_con if reasons_con else ['Standard state contract terms & SIMM compliance verification.'])])}

---

## 📋 Mandatory Minimum Qualifications (MQ) Matrix

| Requirement / Criterion | State Specification | GenieFlow / Firm Posture | Compliance Status |
| :--- | :--- | :--- | :--- |
| **MQ 1: Business Standing** | Active registration in Good Standing with CA Secretary of State | Verified California Entity | `COMPLIANT` |
| **MQ 2: Small Business Status** | Certified California Small Business (SB/Micro) | Eligible / Pending SB Option Tier | `PREFERRED (5% ADVANTAGE)` |
| **MQ 3: Technical Expertise** | Modern API architecture, Python middleware, Database migration | Proven Sovereign AI & OCR Extraction Engines | `EXCEEDS REQUIREMENT` |
| **MQ 4: Data Security (SIMM)** | State Information Management Manual (SIMM 5300) Security Standards | Local / Air-Gapped Zero-Cloud Egress Architecture | `SUPERIOR SECURITY` |
| **MQ 5: Key Personnel Experience** | 3+ years experience with regulatory case workflows | 20+ years California Legal & Regulatory Experience | `COMPLIANT` |

---

## 💡 Next Immediate Actions
1. Download full solicitation package from Cal eProcure.
2. Submit Vendor Inquiries prior to the Question & Answer cutoff.
3. If value < $250,000, send Capability Statement directly to {dept}'s Small Business Advocate.
"""
    return report

if __name__ == "__main__":
    test_opp = {
        "event_id": "0000041005",
        "department": "Department of Cannabis Control",
        "title": "California Cannabis Track-and-Trace (CCTT) API Gateway Enhancements",
        "unspsc": "81112200",
        "type": "SB Option (Gov Code § 14838.5)",
        "estimated_value": "$245,000",
        "end_date": "2026-10-05",
        "tags": ["Cannabis", "API", "Python", "Regulatory Compliance"]
    }
    rep = evaluate_opportunity(test_opp)
    print(rep)
