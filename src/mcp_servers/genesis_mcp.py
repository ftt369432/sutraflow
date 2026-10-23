"""
Sovereign Brain Genesis MCP Server
Universal Brain Bootstrapping Protocol for Any Business or Practice (2026 Sovereign Edition)

Enables any business, firm, or practice to:
1. Deconstruct sample work products (reports, briefs, proposals, contracts, invoices).
2. Research & bind governing statutes, regulations, or trade standards.
3. Autonomously synthesize foundational markdown architecture:
   - BUSINESS.md: Operational scope, services, pricing, rate sheets.
   - AGENTS.md: Dual/multi-persona standing orders, roles, guardrails.
   - RULES.md: Formatting, zero-hallucination standard, local storage compliance.
   - WORKFLOWS: Custom executable playbooks in .agents/workflows/.
"""

import os
import sys
import json
import re
from typing import Dict, Any, List
from mcp.server.mcpserver import MCPServer

app = MCPServer(name="Brain-Genesis-Hub")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

DOMAIN_ARCHETYPES = {
    "legal_personal_injury": {
        "title": "Personal Injury Litigation Practice",
        "description": "Plaintiff civil personal injury, motor vehicle collisions, premise liability, and insurance settlement demands.",
        "sample_workflows": ["Policy-Limits Settlement Demand", "Medical Chronology & Billing Audit", "Deposition Cross-Examination Matrix"],
        "governing_standards": ["California Civil Code", "California Code of Civil Procedure (CCP)", "Insurance Code § 790.03 (Bad Faith)"]
    },
    "legal_workers_comp": {
        "title": "California Workers' Compensation Practice",
        "description": "Applicant representation, AOE/COE disputes, QME panels, and lien litigation.",
        "sample_workflows": ["Petition for Penalties (§ 5814 / § 4622)", "QME Advocacy Letter & Exhibits", "Trial Brief Compilation"],
        "governing_standards": ["California Labor Code", "8 CCR Regulations", "WCAB En Banc Decisions"]
    },
    "general_contracting": {
        "title": "General Contracting & Construction Trades",
        "description": "Commercial/residential construction, subcontracts, change orders, mechanics liens, and trade estimates.",
        "sample_workflows": ["Subcontractor Scope & Change Order Review", "Preliminary Notice & Mechanics Lien Demand", "AIA Document Bid Estimation"],
        "governing_standards": ["California Business & Professions Code (CSLB)", "Civil Code § 8000 et seq. (Mechanics Liens)", "OSHA 1926 Safety Standards"]
    },
    "medical_clinic_billing": {
        "title": "Medical Practice & Specialized Clinic",
        "description": "Clinical documentation, billing compliance, denial appeals, and patient care management.",
        "sample_workflows": ["Billing Denial Appeal & Second Review (SBR)", "Operative Report Synthesis", "HIPAA Compliance & Records Audit"],
        "governing_standards": ["HIPAA Privacy & Security Rules", "CMS / Medicare Guidelines", "CPT / ICD-10 Coding Compliance"]
    },
    "tax_accounting": {
        "title": "Tax Advisory & Corporate Accounting",
        "description": "Tax planning, fractional CFO services, corporate entity structuring, and audit representation.",
        "sample_workflows": ["Corporate Entity Restructuring Memo", "IRS Notice 1431 Response & Penalty Abatement", "Quarterly Financial Analysis & KPI Deck"],
        "governing_standards": ["Internal Revenue Code (IRC)", "Treasury Regulations", "GAAP Accounting Standards"]
    },
    "real_estate_brokerage": {
        "title": "Real Estate Brokerage & Property Management",
        "description": "Commercial & residential transactions, lease drafting, 1031 exchanges, and eviction compliance.",
        "sample_workflows": ["Commercial Lease Clause Audit", "1031 Exchange Identification Memo", "Notice to Quit & Eviction Defense Protocol"],
        "governing_standards": ["California Real Estate Law (DRE)", "Civil Code § 1946 / § 1947", "RESPA Compliance"]
    }
}

@app.tool()
def genesis_list_archetypes() -> str:
    """List available domain archetypes that can be used to bootstrap a sovereign business brain."""
    return json.dumps(DOMAIN_ARCHETYPES, indent=2)

@app.tool()
def genesis_analyze_sample_document(sample_text: str, business_type: str = "custom") -> str:
    """
    Deconstructs a sample work product (brief, invoice, estimate, proposal, report).
    Extracts headings, structure, terminology, variable tokens, and formatting standards.
    """
    if not sample_text or len(sample_text.strip()) < 40:
        return json.dumps({
            "error": "Sample text too brief for semantic analysis. Please provide a substantive work product (100+ words)."
        })

    lines = [l.strip() for l in sample_text.splitlines() if l.strip()]
    
    # Extract likely headings (# or ALL CAPS or Roman Numerals)
    headings = []
    for line in lines:
        if line.startswith("#") or re.match(r"^[I|V|X]+\.\s+[A-Z]", line) or (line.isupper() and len(line) > 4 and len(line) < 60):
            headings.append(line.lstrip("#").strip())

    # Detect placeholder tokens e.g. [CLIENT NAME], {{date}}, $0.00
    variables = list(set(re.findall(r"\[[A-Z0-9_\s]{2,40}\]|\{\{[a-zA-Z0-9_]+\}\}", sample_text)))

    # Detect legal or regulatory citations
    citations = list(set(re.findall(r"(?:§\s*\d+(?:\.\d+)?|Section\s+\d+|[A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+|Code\s+§\s*\d+)", sample_text)))

    analysis = {
        "business_type": business_type,
        "document_length_chars": len(sample_text),
        "total_lines": len(lines),
        "detected_headings": headings[:15],
        "extracted_variables": variables[:10],
        "governing_citations_found": citations[:10],
        "structural_style": "Numbered 28-line legal paper" if re.search(r"^\s*\d{1,2}\s+", sample_text, re.MULTILINE) else "Executive Sectioned Report",
        "recommended_workflow_name": f"Compile {headings[0] if headings else 'Standard Deliverable'}"
    }

    return json.dumps(analysis, indent=2)

@app.tool()
def genesis_bootstrap_business_brain(
    business_type: str,
    business_name: str,
    sample_text: str = "",
    jurisdiction: str = "California",
    target_dir: str = ""
) -> str:
    """
    Autonomously compiles the core Sovereign Markdown architecture for any business:
    - BUSINESS.md: Entity profile, scope, services, fee schedule
    - AGENTS.md: Dual/multi-persona standing orders and guardrails
    - RULES.md: Standing directives, zero-hallucination compliance
    - .agents/workflows/<primary_workflow>.md: Custom repeatable playbook
    """
    clean_biz = business_name.strip() or "Sovereign Enterprise"
    clean_type = business_type.strip() or "General Business"
    
    # Determine output directory
    out_dir = target_dir.strip() if target_dir else os.path.join(BASE_DIR, "AI_GENERATED_DOCS", "BRAIN_GENESIS")
    os.makedirs(out_dir, exist_ok=True)

    # 1. Generate BUSINESS.md
    business_md = f"""# 🏢 BUSINESS IDENTITY & OPERATIONAL SCOPE: {clean_biz.upper()}

**Entity Name:** {clean_biz}  
**Primary Domain:** {clean_type}  
**Primary Jurisdiction:** {jurisdiction}  
**Operational Mode:** Sovereign Autonomous Workspace  

---

## 1. Core Services & Deliverables
- Automated document drafting & client deliverable generation
- Compliance audits & statutory verification under {jurisdiction} standards
- Multi-channel intake processing & record organization

## 2. Operating Standards & Fee Structure
- Retainer & billing rates customized per project scope
- Local-first file architecture (zero third-party cloud data egress)
- Rapid turnaround with human practitioner sign-off mandate
"""

    # 2. Generate AGENTS.md
    agents_md = f"""# 🤖 Standing Multi-Agent Roles: {clean_biz}

## 1. Primary Operating Personas
- **Senior Specialist Persona ({clean_biz})**:
  Activated for core deliverables, complex drafting, client advisory briefs, and technical analysis.
  Tone: Authoritative, precise, practitioner-grade, zero-fluff.

- **Intake & Compliance Auditor Persona**:
  Activated for document intake, variable validation, regulatory checks, and defect prevention.
  Tone: Objective, forensic, detail-oriented.

## 2. Guardrails & Compliance Mandates
- **No Unlicensed Practice:** All outputs are preliminary working drafts requiring human practitioner review.
- **Zero Fabrication:** Never hallucinate statutory citations, contract terms, or financial formulas.
- **Local Storage First:** All client records and drafts are stored strictly on local mounted drives.
"""

    # 3. Generate RULES.md
    rules_md = f"""# 📜 Standing Operating Rules & Guardrails: {clean_biz}

1. **Deterministic Reasoning:** Ground every calculation, claim, and deliverable in verified local documents.
2. **Clean Markdown Format:** All working documents must be created and preserved in Markdown (.md) before compilation.
3. **Straight-Shooter Protocol:** Never provide false validation or sycophancy. Flag procedural flaws and efficiency bottlenecks immediately.
4. **Acquisition-Grade Hygiene:** Keep source trees free of secrets, credentials, and untracked build pollutants.
"""

    # 4. Generate Workflow Playbook
    workflow_slug = re.sub(r"[^a-z0-9]+", "_", clean_type.lower()).strip("_")
    workflow_md = f"""---
name: {workflow_slug}_master_workflow
description: Standard operational deliverable workflow for {clean_biz} ({clean_type})
---

# 🚀 Master Workflow: {clean_biz} Deliverable Compilation

## Phase 1: Intake & Evidence Discovery
1. Mount client folder or drop source evidence (.pdf, .docx, .md).
2. Run forensic extraction on key dates, parties, and core disputed facts.

## Phase 2: Analysis & Regulatory Crosswalk
1. Verify applicable governing rules under {jurisdiction} standards.
2. Cross-reference source data against {clean_biz} operational rules.

## Phase 3: Deliverable Generation
1. Synthesize structured deliverable in Markdown format into `AI_GENERATED_DOCS/`.
2. Present side-by-side canvas for practitioner review and approval.
"""

    # Write files
    paths = {
        "BUSINESS.md": os.path.join(out_dir, "BUSINESS.md"),
        "AGENTS.md": os.path.join(out_dir, "AGENTS.md"),
        "RULES.md": os.path.join(out_dir, "RULES.md"),
        f"workflow_{workflow_slug}.md": os.path.join(out_dir, f"workflow_{workflow_slug}.md")
    }

    with open(paths["BUSINESS.md"], "w", encoding="utf-8") as f:
        f.write(business_md)
    with open(paths["AGENTS.md"], "w", encoding="utf-8") as f:
        f.write(agents_md)
    with open(paths["RULES.md"], "w", encoding="utf-8") as f:
        f.write(rules_md)
    with open(paths[f"workflow_{workflow_slug}.md"], "w", encoding="utf-8") as f:
        f.write(workflow_md)

    # Also register in .agents/workflows if directory exists
    agents_wf_dir = os.path.join(BASE_DIR, ".agents", "workflows")
    if os.path.exists(agents_wf_dir):
        dest_wf = os.path.join(agents_wf_dir, f"{workflow_slug}.md")
        with open(dest_wf, "w", encoding="utf-8") as f:
            f.write(workflow_md)
        paths["registered_workflow"] = dest_wf

    return json.dumps({
        "status": "success",
        "business_name": clean_biz,
        "business_type": clean_type,
        "created_files": paths,
        "summary": f"Successfully bootstrapped Sovereign Brain for {clean_biz}. Created BUSINESS.md, AGENTS.md, RULES.md, and workflow playbook."
    }, indent=2)

if __name__ == "__main__":
    app.run()
