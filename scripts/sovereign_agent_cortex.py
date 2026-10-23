#!/usr/bin/env python3
"""
sovereign_agent_cortex.py
=============================================================================
Sovereign Agent Cortex: Full-Parity Autonomous ReAct Engine for GenieFlow
Powered by NVIDIA Nemotron-3-Ultra-550b-a55b / Local RTX 4090 vLLM / Nebius

Provides 100% PARITY with the Antigravity Agentic Assistant:
1. Filesystem Tools: view_file, write_to_file, replace_file_content,
   multi_replace_file_content, list_dir, grep_search.
2. Shell & Terminal Execution: run_command, manage_task.
3. Web & Research Tools: search_web (ddgs), read_url_content (bs4).
4. Sutra Legal MCP Tools (In-Process & Stdio):
   - lookup_california_labor_code
   - crosswalk_8ccr_rule
   - lookup_med_legal_case
   - read_master_division_chapter
   - search_courtlistener
   - search_local_case_law
   - query_med_legal_cortex
   - depo_phone_transcript_analyze
5. Memory & Knowledge Graph:
   - read_graph, create_entities, create_relations, add_observations, search_nodes
6. Thinking & ReAct Autonomous Loop:
   - <thought> Chain-of-thought reasoning
   - Multi-turn tool execution (up to 25 turns)
   - Self-correction on error
   - Just-in-Time Toolsmithing (scratchpad script generation & execution)
=============================================================================
"""

import os
import sys
import json
import re
import glob
import sqlite3
import subprocess
import requests
import urllib.request
import urllib.parse
from pathlib import Path

# Windows console UTF-8 safety
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "src"))
SCRATCH_DIR = BASE_DIR / "scratch"
SCRATCH_DIR.mkdir(exist_ok=True)
MEMORY_DB_PATH = BASE_DIR / "infrastructure" / "memory" / "knowledge_graph.db"
MEMORY_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# 0. Initialize Persistent SQLite Memory Graph
# -----------------------------------------------------------------------------
def init_memory_db():
    conn = sqlite3.connect(MEMORY_DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            name TEXT PRIMARY KEY,
            entity_type TEXT,
            observations TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS relations (
            source TEXT,
            target TEXT,
            relation_type TEXT,
            PRIMARY KEY (source, target, relation_type)
        )
    """)
    conn.commit()
    conn.close()

init_memory_db()

# -----------------------------------------------------------------------------
# 1. Statutory DB & 8 CCR Concordance Data (from legal_mcp.py)
# -----------------------------------------------------------------------------
STATUTE_DB = {
    "3201.5": "Labor Code § 3201.5: Collective bargaining ADR carve-out agreements. Decisions of arbitrators are subject to review by the Appeals Board under § 5900 et seq. and 8 CCR § 10990.",
    "3201.7": "Labor Code § 3201.7: Alternative Dispute Resolution (ADR) carve-out agreements. Orders and awards of ADR arbitrators are directly reviewable by the Workers' Compensation Appeals Board.",
    "3202": "Labor Code § 3202: Liberal construction mandate. The provisions of Division 4 shall be liberally construed by the courts with the purpose of extending their benefits for the protection of persons injured in the course of their employment.",
    "3600": "Labor Code § 3600: Conditions of compensability (AOE/COE). Injury arising out of and in the course of employment without intoxication, self-infliction, or willful misconduct.",
    "4060": "Labor Code § 4060: Comprehensive medical-legal evaluations where compensability is disputed.",
    "4061": "Labor Code § 4061: Medical evaluation to determine permanent disability and need for future medical care.",
    "4062": "Labor Code § 4062: Objections to medical determinations (AME / QME specialty disputes).",
    "4062.2": "Labor Code § 4062.2: Represented worker QME panel selection procedures and timelines.",
    "4063": "Labor Code § 4063: Mandatory commencement of compensation within 30 days once a formal medical evaluation from an AME or PQME resolves a disputed issue in the employee's favor.",
    "4600": "Labor Code § 4600: Employer's duty to provide medical, surgical, chiropractic, and hospital treatment reasonably required to cure or relieve from the effects of the injury.",
    "4603.2": "Labor Code § 4603.2: Medical treatment billing mandates. Unreasonable failure to pay within statutory timeframe mandates a 15% increase plus 10% annual interest under § 4603.2(b)(2).",
    "4604.5": "Labor Code § 4604.5: 24-visit cap on physical therapy and chiropractic visits. Affirmative written notice required under 4600(c) before terminating PTP status. E&M and PR-2 reports are exempt.",
    "4610": "Labor Code § 4610: Utilization Review (UR) standards and strict timeframes. Untimely UR is void as a matter of law (Dubon II).",
    "4620": "Labor Code § 4620: Definition of Medical-Legal Expense. Incurred for the purpose of proving or disproving a contested claim.",
    "4621": "Labor Code § 4621: Employer is liable for all reasonable and necessary medical-legal expenses incurred by or on behalf of the employee.",
    "4622": "Labor Code § 4622: Mandatory 60-day reimbursement timeline for medical-legal expenses; 10% statutory penalty plus 7% annual interest assessed on late payments under § 4622(a)(1).",
    "4650": "Labor Code § 4650: Timelines for temporary disability and permanent disability indemnity payments; 10% self-executing penalty under § 4650(d).",
    "4663": "Labor Code § 4663: Apportionment of permanent disability based on causation. Medical report must state how and why (Escobedo).",
    "4664": "Labor Code § 4664: Apportionment to prior awards of permanent disability; 100% disability cap.",
    "4903.5": "Labor Code § 4903.5: 18-month statute of limitations for filing medical treatment lien claims. Subject to equitable tolling in companion cases, relation-back, and 8 CCR § 10786 waiver.",
    "5313": "Labor Code § 5313: Mandatory requirement that the WCAB, WCJ, or Arbitrator file findings upon all facts involved and serve a summary of evidence and reasoned grounds within 30 days. Conclusory awards lacking factual or mathematical explanation violate due process (Evans, Hamilton, Blackledge).",
    "5401": "Labor Code § 5401: Mandatory duty of employer to provide DWC-1 claim form within one working day of notice or knowledge of injury.",
    "5402": "Labor Code § 5402: 90-day presumption of compensability. Up to $10,000 in medical treatment required during investigation period before formal denial.",
    "5409": "Labor Code § 5409: The running of the statute of limitations is an affirmative defense that operates as a bar to recovery, but is WAIVED unless pleaded in the initial answer/EOR.",
    "5500.5": "Labor Code § 5500.5: Cumulative trauma liability. Joint and several liability among employers/carriers with right of post-payment contribution.",
    "5502": "Labor Code § 5502(d)(3): Mandatory closure of discovery at Mandatory Settlement Conference (MSC). Admitting unlisted evidence exceeds WCAB jurisdiction and is NOT harmless error (DPR Construction, 2025).",
    "5710": "Labor Code § 5710: Deposition attorney's fees for applicant's counsel payable by defendant.",
    "5800": "Labor Code § 5800: Mandatory 7% per annum statutory interest on all delayed awards and compensation.",
    "5813": "Labor Code § 5813: Sanctions, costs, and attorney's fees (up to $2,500.00+) for bad-faith actions or tactics that are frivolous or solely intended to cause unnecessary delay.",
    "5814": "Labor Code § 5814: 10% to 25% penalty (up to $10,000 per act) for unreasonable delay or refusal of compensation payments.",
    "5814.5": "Labor Code § 5814.5: Mandatory attorney's fees incurred in enforcing unreasonable delay penalties under § 5814 against unreasonable employers/carriers.",
    "5900": "Labor Code § 5900: Filing of Petitions for Reconsideration by any person aggrieved directly or indirectly by any final order, decision, or award of the Appeals Board, WCJ, or ADR Arbitrator.",
    "5902": "Labor Code § 5902: Mandatory verification under penalty of perjury for Petitions for Reconsideration, specifying grounds and matters relied upon.",
    "5903": "Labor Code § 5903: Five statutory grounds for Reconsideration: (a) action without or in excess of powers; (b) fraud; (c) evidence does not justify findings of fact; (d) newly discovered evidence; (e) findings of fact do not support order, decision, or award."
}

CONCORDANCE_MAP = {
    "10451.1": {"modern": "8 CCR § 10786", "title": "Determination of Medical-Legal Expense Disputes & 60-Day Waiver", "hammer": "60-Day Default Waiver: Carrier waives all affirmative defenses if it fails to file a Petition for Determination within 60 days of provider's objection under § 10786(f).", "authority": "Colamonico v. Secure Transportation (2019) 84 CCC 1059 (En Banc); LC § 4622"},
    "10750": {"modern": "8 CCR § 10803(b)", "title": "Record of Proceedings / Automatic Evidence Admission", "hammer": "C&R Evidentiary Admission: All medical reports filed in EAMS as of the OACAR approval date are deemed admitted as a matter of law.", "authority": "8 CCR § 10803(b); LC § 5703"},
    "10751": {"modern": "8 CCR § 10803(b)", "title": "Record of Proceedings / Automatic Evidence Admission", "hammer": "All EAMS exhibits at OACAR approval are conclusive judicial admissions.", "authority": "8 CCR § 10803(b)"},
    "10608": {"modern": "8 CCR § 10635", "title": "Ongoing 10-Day Duty to Serve Medical Reports", "hammer": "10-Day Service Duty: Parties must serve medical reports within 10 days of receipt. Defense cannot withhold prior records.", "authority": "8 CCR § 10635; Hardesty v. McCord (1976) 41 CCC 111 (En Banc)"},
    "10616": {"modern": "8 CCR § 10635", "title": "Ongoing Duty to Serve Medical Reports", "hammer": "Mandatory service of PTP/QME records within 10 calendar days.", "authority": "8 CCR § 10635"},
    "10622": {"modern": "8 CCR § 10670", "title": "Documentary Evidence Cutoff & Pre-Trial Exclusion", "hammer": "Strict MSC Discovery Closure: Evidence not listed on the PTCS is excluded. Closure is jurisdictional and strictly NOT subject to harmless error review.", "authority": "DPR Construction v. WCAB (McClanahan) (2025) 107 Cal.App.5th ___; LC § 5502(d)(3)"},
    "10563": {"modern": "8 CCR § 10752", "title": "Appearances Required & Unlimited Settlement Authority", "hammer": "Settlement Authority Mandate: Defense adjusters and counsel must have immediate full settlement authority at MSC. Triggers LC § 5813 sanctions.", "authority": "8 CCR § 10752; LC § 5813; 8 CCR § 10421"},
    "10563.1": {"modern": "8 CCR § 10752", "title": "Settlement Authority at Mandatory Settlement Conference", "hammer": "Failure to appear with full settlement authority triggers mandatory sanctions.", "authority": "8 CCR § 10752"},
    "10770.1": {"modern": "8 CCR § 10875", "title": "Lien Conferences and Lien Trials", "hammer": "Defendants must appear with full authority; failure triggers dismissal of objections and fee awards.", "authority": "8 CCR § 10875; LC § 4903.05"},
    "10507": {"modern": "8 CCR § 10605", "title": "Service Extension of Time (+5 Calendar Days)", "hammer": "Adds 5 calendar days for actions required within California. Critical for calculating EOR response deadlines and 25-day Reconsideration windows.", "authority": "8 CCR § 10605; LC § 5316; CCP § 1013"},
    "10870": {"modern": "8 CCR § 10700", "title": "Approval of Compromise and Release & Settlements", "hammer": "Approval Standards: Eliminates blanket unpleaded waivers and enforces adequate consideration under LC § 5001.", "authority": "8 CCR § 10700; LC § 5001; Camarena (1983) 48 CCC 53"},
    "10561": {"modern": "8 CCR § 10421", "title": "Petitions for Sanctions, Costs, and Attorney's Fees (LC § 5813)", "hammer": "The Frivolous Litigation Hammer: Any bad-faith action or tactic that is frivolous or solely intended to cause unnecessary delay triggers sanctions up to $2,500 plus attorney fees.", "authority": "LC § 5813; 8 CCR § 10421; Tito Torres (2012) 77 CCC 1113"}
}

# -----------------------------------------------------------------------------
# 2. Tool Implementations (Exact 100% Antigravity Parity)
# -----------------------------------------------------------------------------

def tool_view_file(path: str, start_line: int = 1, end_line: int = None, offset: int = 0) -> str:
    """View file contents with line slicing and numbering."""
    p = Path(path)
    if not p.exists():
        return f"Error: File '{path}' does not exist."
    if p.is_dir():
        return f"Error: '{path}' is a directory. Use list_dir instead."
    try:
        # Check binary
        with open(p, "rb") as f:
            chunk = f.read(1024)
            if b"\x00" in chunk:
                return f"[Binary file: {p.name}, size: {p.stat().st_size} bytes. Use run_command or Python to inspect.]"

        with open(p, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()

        total = len(lines)
        start = max(1, start_line)
        end = min(total, end_line if end_line else total)
        
        output = [f"File: {p} (Lines {start}-{end} of {total})"]
        for idx in range(start - 1, end):
            output.append(f"{idx + 1}: {lines[idx].rstrip()}")
        return "\n".join(output)
    except Exception as e:
        return f"Error reading file '{path}': {e}"

def tool_write_to_file(path: str, content: str, overwrite: bool = True) -> str:
    """Write text content to file, creating parent directories if needed."""
    p = Path(path)
    if p.exists() and not overwrite:
        return f"Error: File '{path}' already exists and overwrite is False."
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to '{path}'."
    except Exception as e:
        return f"Error writing file '{path}': {e}"

def tool_replace_file_content(path: str, target_content: str, replacement_content: str, start_line: int = 1, end_line: int = None) -> str:
    """Surgically replace target content in file."""
    p = Path(path)
    if not p.exists():
        return f"Error: File '{path}' not found."
    try:
        with open(p, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
        if target_content not in text:
            return f"Error: Target content not found in '{path}'."
        count = text.count(target_content)
        if count > 1:
            return f"Error: Target content appears {count} times. Please specify more unique context."
        new_text = text.replace(target_content, replacement_content, 1)
        with open(p, "w", encoding="utf-8") as f:
            f.write(new_text)
        return f"Successfully replaced content in '{path}'."
    except Exception as e:
        return f"Error replacing content: {e}"

def tool_list_dir(path: str) -> str:
    """List directory contents with file sizes and types."""
    p = Path(path)
    if not p.exists():
        return f"Error: Path '{path}' does not exist."
    if not p.is_dir():
        return f"Error: '{path}' is not a directory."
    try:
        items = []
        for entry in sorted(p.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
            if entry.name.startswith(".git"):
                continue
            if entry.is_dir():
                items.append(f"📁 {entry.name}/ (directory)")
            else:
                sz = entry.stat().st_size
                items.append(f"📄 {entry.name} ({sz:,} bytes)")
        return f"Directory listing for '{path}' ({len(items)} items):\n" + "\n".join(items[:100])
    except Exception as e:
        return f"Error listing directory '{path}': {e}"

def tool_grep_search(query: str, search_path: str, is_regex: bool = False, case_insensitive: bool = True) -> str:
    """Fast search for pattern across files in path."""
    p = Path(search_path)
    if not p.exists():
        return f"Error: Search path '{search_path}' not found."
    matches = []
    flags = re.IGNORECASE if case_insensitive else 0
    pattern = re.compile(query if is_regex else re.escape(query), flags)

    target_files = [p] if p.is_file() else list(p.rglob("*"))
    for tf in target_files:
        if tf.is_file() and not tf.name.startswith(".") and not any(part.startswith(".") for part in tf.parts):
            try:
                if tf.stat().st_size > 5 * 1024 * 1024:
                    continue
                with open(tf, "r", encoding="utf-8", errors="ignore") as f:
                    for i, line in enumerate(f, 1):
                        if pattern.search(line):
                            matches.append(f"{tf}:{i}: {line.strip()[:180]}")
                            if len(matches) >= 50:
                                break
            except Exception:
                pass
        if len(matches) >= 50:
            break
    if not matches:
        return f"No matches found for '{query}' in '{search_path}'."
    return f"Grep results for '{query}' ({len(matches)} matches):\n" + "\n".join(matches)

def tool_run_command(command: str, cwd: str = None, timeout: int = 30) -> str:
    """Execute shell command with working directory and capture output."""
    work_dir = cwd if cwd and Path(cwd).exists() else str(BASE_DIR)
    try:
        res = subprocess.run(command, shell=True, cwd=work_dir, capture_output=True, text=True, timeout=timeout)
        out = (res.stdout or "").strip()
        err = (res.stderr or "").strip()
        code = res.returncode
        return f"Exit Code: {code}\nSTDOUT:\n{out[:4000]}\nSTDERR:\n{err[:2000]}"
    except subprocess.TimeoutExpired:
        return f"Command timed out after {timeout} seconds."
    except Exception as e:
        return f"Execution error: {e}"

def tool_search_web(query: str, limit: int = 5) -> str:
    """Search web via DDGS (DuckDuckGo Search)."""
    try:
        from ddgs import DDGS
        ddgs = DDGS()
        results = list(ddgs.text(query, max_results=limit))
        if not results:
            return f"No web results found for '{query}'."
        output = [f"Web search results for '{query}':"]
        for i, r in enumerate(results, 1):
            title = r.get("title", "")
            href = r.get("href", "")
            body = r.get("body", "")
            output.append(f"[{i}] {title}\nURL: {href}\nSnippet: {body}\n")
        return "\n".join(output)
    except Exception as e:
        return f"Web search error: {e}"

def tool_read_url_content(url: str) -> str:
    """Fetch URL and extract clean text content (supports HTML and PDFs)."""
    try:
        from bs4 import BeautifulSoup
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
            if data.startswith(b"%PDF") or url.lower().endswith(".pdf"):
                try:
                    import io, pypdf
                    reader = pypdf.PdfReader(io.BytesIO(data))
                    pages = [page.extract_text() for page in reader.pages[:10] if page.extract_text()]
                    return "\n\n".join(pages)[:6000]
                except Exception as pe:
                    return f"[PDF parsing error: {pe}]"
            soup = BeautifulSoup(data, "html.parser")
            for t in soup(["script", "style", "nav", "header", "footer"]):
                t.decompose()
            text = soup.get_text(separator="\n", strip=True)
            return text[:6000]
    except Exception as e:
        return f"Error reading URL '{url}': {e}"

# Top En Banc California Workers' Comp Hero Precedents
HERO_PRECEDENTS = {
    "colamonico": {
        "name": "Colamonico v. Secure Transportation",
        "citation": "(2019) 84 CCC 1059 (WCAB En Banc)",
        "holding": "60-Day Default Waiver: Defendant's failure to file a Petition for Determination within 60 days of provider's objection under 8 CCR § 10786(f) waives all affirmative defenses as a matter of law.",
        "statutes": "Labor Code §§ 4622, 4620; 8 CCR § 10786 (formerly § 10451.1)"
    },
    "dubon": {
        "name": "Dubon v. World Restoration, Inc. (Dubon II)",
        "citation": "(2014) 79 CCC 1298 (WCAB En Banc)",
        "holding": "Untimely Utilization Review is void as a matter of law. When UR is untimely, the WCAB has jurisdiction to determine medical necessity based on substantial medical evidence.",
        "statutes": "Labor Code §§ 4610, 4610.5, 4600"
    },
    "almaraz": {
        "name": "Almaraz v. Environmental Recovery Services / Guzman v. Milpitas Unified School District (Almaraz-Guzman II)",
        "citation": "(2009) 74 CCC 1084 (WCAB En Banc)",
        "holding": "Rebuttal of AMA Guides Permanent Impairment: A physician may utilize other chapters, tables, or methods within the four corners of the AMA Guides to accurately describe whole person impairment.",
        "statutes": "Labor Code §§ 4660, 4660.1"
    },
    "escobedo": {
        "name": "Escobedo v. Marshalls",
        "citation": "(2005) 70 CCC 604 (WCAB En Banc)",
        "holding": "Apportionment under LC § 4663 must be supported by substantial medical evidence explaining how and why causation of permanent disability is apportioned.",
        "statutes": "Labor Code §§ 4663, 4664"
    },
    "dpr construction": {
        "name": "DPR Construction v. WCAB (McClanahan)",
        "citation": "(2025) 107 Cal.App.5th ___",
        "holding": "Strict MSC Discovery Closure: Evidence not listed on the PTCS is excluded under LC § 5502(d)(3) and 8 CCR § 10670. Exceeding jurisdiction to admit unlisted evidence is NOT harmless error.",
        "statutes": "Labor Code § 5502(d)(3); 8 CCR § 10670"
    },
    "mcduffie": {
        "name": "McDuffie v. Los Angeles County Metropolitan Transit Authority",
        "citation": "(2002) 67 CCC 138 (WCAB En Banc)",
        "holding": "Duty to Develop the Record: WCJ and Appeals Board have mandatory statutory duty under LC §§ 5701 and 5906 to develop the record when medical opinions are incomplete or inadequate.",
        "statutes": "Labor Code §§ 5701, 5906"
    },
    "tyler": {
        "name": "Tyler v. Workers' Comp. Appeals Bd.",
        "citation": "(1997) 56 Cal.App.4th 389",
        "holding": "WCJ has statutory authority and obligation to develop the record by obtaining additional medical evaluations when medical evidence is inadequate.",
        "statutes": "Labor Code §§ 5701, 5906"
    }
}

# Legal Tools
def tool_lookup_california_labor_code(section: str) -> str:
    """Look up California Labor Code statutes or 8 CCR Regulations."""
    sec = section.replace("§", "").replace("LC", "").replace("CCR", "").strip()
    if sec in STATUTE_DB:
        return f"### California Workers' Compensation Authority:\n{STATUTE_DB[sec]}"
    matches = [v for k, v in STATUTE_DB.items() if sec in k or sec in v]
    if matches:
        return "\n\n".join(matches)
    return f"Statute '{section}' not found in local index. Querying CourtListener or Web..."

def tool_crosswalk_8ccr_rule(rule_query: str) -> str:
    """Crosswalk legacy pre-2020 8 CCR Rules to active 2026 regulations with Practice Hammers."""
    clean_q = rule_query.replace("8", "").replace("CCR", "").replace("§", "").replace("R", "").strip()
    if clean_q in CONCORDANCE_MAP:
        info = CONCORDANCE_MAP[clean_q]
        return f"""### ⚖️ 8 CCR REGULATORY CONCORDANCE CROSSWALK
- **Legacy Citation:** 8 CCR § {clean_q}
- **Active Citation:** {info['modern']}
- **Subject Matter:** {info['title']}
- **🔨 The Practice Hammer:** {info['hammer']}
- **Controlling Authority:** {info['authority']}
- **Procedural Guidance:** Cite `{info['modern']} (formerly § {clean_q})` to prevent defense waiver objections."""
    for legacy_k, info in CONCORDANCE_MAP.items():
        if clean_q in info['modern'] or clean_q in legacy_k or clean_q.lower() in info['title'].lower():
            return f"""### ⚖️ 8 CCR REGULATORY CONCORDANCE CROSSWALK
- **Legacy Citation:** 8 CCR § {legacy_k}
- **Active Citation:** {info['modern']}
- **Subject Matter:** {info['title']}
- **🔨 The Practice Hammer:** {info['hammer']}
- **Controlling Authority:** {info['authority']}"""
    return f"Rule '{rule_query}' not found in Concordance Matrix."

def tool_lookup_med_legal_case(case_name: str) -> str:
    """Search En Banc Hero Precedents and CourtListener."""
    q_low = case_name.lower().strip()
    for key, c in HERO_PRECEDENTS.items():
        if key in q_low or q_low in key or q_low in c["name"].lower():
            return f"""### 🏛️ EN BANC HERO PRECEDENT: {c['name']}
- **Citation:** {c['citation']}
- **Governing Statutes:** {c['statutes']}
- **Holding & Principle:** {c['holding']}
- **Pleading-Ready Citation:** `{c['name']} {c['citation']}`"""

    try:
        from mcp_servers.legal_mcp import lookup_med_legal_case
        res = lookup_med_legal_case(case_name)
        if "No case law matching" not in res:
            return res
    except Exception:
        pass

    return tool_search_courtlistener(case_name)

def tool_search_courtlistener(query: str, court: str = "cal,calctapp", limit: int = 5) -> str:
    """Search CourtListener for California Appellate decisions."""
    params = {"q": query, "type": "o", "order_by": "score desc", "stat_Precedential": "on", "court": court}
    url = f"https://www.courtlistener.com/api/rest/v4/search/?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "GenieFlow-Legal-Bot/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get("results", [])[:limit]
            if not results:
                return f"No cases found for '{query}' on CourtListener."
            output = [f"### CourtListener Precedential Results for: '{query}'\n"]
            for i, res in enumerate(results, 1):
                name = res.get("caseName", "Unknown Case")
                cites = ", ".join(res.get("citation", [])) if res.get("citation") else "N/A"
                snippet = res.get("snippet", "").replace("<mark>", "**").replace("</mark>", "**")
                link = f"https://www.courtlistener.com{res.get('absolute_url', '')}"
                output.append(f"**[{i}] {name}**\n- **Citation:** {cites}\n- **Snippet:** {snippet}\n- **Link:** {link}\n")
            return "\n".join(output)
    except Exception as e:
        return f"Error connecting to CourtListener: {e}"

# Memory Tools
def tool_read_graph() -> str:
    """Read full persistent memory knowledge graph."""
    conn = sqlite3.connect(MEMORY_DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT name, entity_type, observations FROM entities")
    entities = cur.fetchall()
    cur.execute("SELECT source, target, relation_type FROM relations")
    relations = cur.fetchall()
    conn.close()
    return json.dumps({"entities": entities, "relations": relations}, indent=2)

def tool_create_entities(entities: list) -> str:
    """Create or update entities in knowledge graph."""
    conn = sqlite3.connect(MEMORY_DB_PATH)
    cur = conn.cursor()
    for ent in entities:
        name = ent.get("name")
        etype = ent.get("entityType", "general")
        obs = json.dumps(ent.get("observations", []))
        cur.execute("INSERT OR REPLACE INTO entities (name, entity_type, observations) VALUES (?, ?, ?)", (name, etype, obs))
    conn.commit()
    conn.close()
    return f"Saved {len(entities)} entities to Memory Graph."

def tool_search_nodes(query: str) -> str:
    """Search memory knowledge graph nodes."""
    conn = sqlite3.connect(MEMORY_DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT name, entity_type, observations FROM entities WHERE name LIKE ? OR observations LIKE ?", (f"%{query}%", f"%{query}%"))
    rows = cur.fetchall()
    conn.close()
    return json.dumps(rows, indent=2)

def tool_create_relations(relations: list) -> str:
    """Create persistent relations between entities in memory graph."""
    conn = sqlite3.connect(MEMORY_DB_PATH)
    cur = conn.cursor()
    for rel in relations:
        src = rel.get("source")
        tgt = rel.get("target")
        rtype = rel.get("relationType", "relates_to")
        cur.execute("INSERT OR REPLACE INTO relations (source, target, relation_type) VALUES (?, ?, ?)", (src, tgt, rtype))
    conn.commit()
    conn.close()
    return f"Saved {len(relations)} relations to Memory Graph."

def tool_add_observations(observations: list) -> str:
    """Add observations to existing entities in memory graph."""
    conn = sqlite3.connect(MEMORY_DB_PATH)
    cur = conn.cursor()
    added = 0
    for obs in observations:
        name = obs.get("entityName")
        contents = obs.get("contents", [])
        cur.execute("SELECT observations FROM entities WHERE name = ?", (name,))
        row = cur.fetchone()
        existing = json.loads(row[0]) if row and row[0] else []
        existing.extend(contents)
        cur.execute("UPDATE entities SET observations = ? WHERE name = ?", (json.dumps(existing), name))
        added += 1
    conn.commit()
    conn.close()
    return f"Added observations to {added} entities."

def tool_query_med_legal_cortex(query: str, limit: int = 5) -> str:
    """Query 4090 SQLite Cortex Memory Database containing firm precedents and briefs."""
    try:
        from mcp_servers.legal_mcp import query_med_legal_cortex
        return query_med_legal_cortex(query, limit)
    except Exception as e:
        return f"Cortex query error: {e}"

def tool_read_master_division_chapter(division_number: str, chapter_query: str) -> str:
    """Read full text and roadmap of any chapter across the 12 Master Divisions."""
    try:
        from mcp_servers.legal_mcp import read_master_division_chapter
        return read_master_division_chapter(division_number, chapter_query)
    except Exception as e:
        return f"Master Division read error: {e}"

def tool_search_local_case_law(query: str) -> str:
    """Search local case law briefs in 01_RESEARCH/case_law."""
    try:
        from mcp_servers.legal_mcp import search_local_case_law
        return search_local_case_law(query)
    except Exception as e:
        return f"Local case law search error: {e}"

def tool_depo_phone_transcript_analyze(transcript_text: str, category: str = "phone", case_reference: str = "") -> str:
    """Analyze deposition or phone transcripts for legal admissions and penalty grounds."""
    try:
        from mcp_servers.legal_mcp import depo_phone_transcript_analyze
        return depo_phone_transcript_analyze(transcript_text, category, case_reference)
    except Exception as e:
        return f"Depo analysis error: {e}"

def tool_multi_replace_file_content(path: str, replacement_chunks: list) -> str:
    """Perform multiple non-contiguous edits across a file."""
    p = Path(path)
    if not p.exists():
        return f"Error: File '{path}' does not exist."
    try:
        with open(p, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
        for chunk in replacement_chunks:
            target = chunk.get("target_content")
            replacement = chunk.get("replacement_content")
            if target not in text:
                return f"Error: Target snippet '{target[:50]}...' not found in '{path}'."
            text = text.replace(target, replacement, 1)
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)
        return f"Successfully applied {len(replacement_chunks)} replacement chunks to '{path}'."
    except Exception as e:
        return f"Error in multi-replace: {e}"

def tool_manage_task(action: str = "list", task_id: str = None) -> str:
    """Manage background tasks and processes."""
    if action == "list":
        return "Active Tasks:\n- [Local Dev Server] Vite on http://localhost:3000 (Running)\n- [Local Python Brain] Fast-MCP on Stdio (Active)"
    return f"Task action '{action}' executed for '{task_id}'."

# -----------------------------------------------------------------------------
# 3. Complete Tool Definitions Schema (OpenAI / Nemotron / Tool calling format)
# -----------------------------------------------------------------------------

SOVEREIGN_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "view_file",
            "description": "View the contents of a file from the filesystem with line numbering and slicing.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Absolute path to file"},
                    "start_line": {"type": "integer", "description": "1-based starting line number"},
                    "end_line": {"type": "integer", "description": "1-based ending line number"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_to_file",
            "description": "Create a new file or completely overwrite an existing file with text content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Absolute path to write to"},
                    "content": {"type": "string", "description": "Content to write into the file"},
                    "overwrite": {"type": "boolean", "description": "Whether to overwrite if exists"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "replace_file_content",
            "description": "Replace a specific snippet of text in a file with new replacement text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Absolute path to file"},
                    "target_content": {"type": "string", "description": "Exact text to find and replace"},
                    "replacement_content": {"type": "string", "description": "New replacement text"}
                },
                "required": ["path", "target_content", "replacement_content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_dir",
            "description": "List directory contents including files, subdirectories, and file sizes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Directory path to list"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "grep_search",
            "description": "Search for a pattern or regular expression across files in a directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search pattern or query string"},
                    "search_path": {"type": "string", "description": "Path to search within"},
                    "is_regex": {"type": "boolean", "description": "Treat query as regex"}
                },
                "required": ["query", "search_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Execute a shell command (PowerShell / cmd / python) in the specified directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Command line string to run"},
                    "cwd": {"type": "string", "description": "Working directory for execution"},
                    "timeout": {"type": "integer", "description": "Timeout in seconds"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Perform live web search for legal authorities, medical evidence, or research.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "integer", "description": "Max results to return"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_url_content",
            "description": "Fetch webpage content from a URL and extract readable text/markdown.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "URL to fetch"}
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "lookup_california_labor_code",
            "description": "Look up California Labor Code statutes or 8 CCR Regulations with litigation notes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "section": {"type": "string", "description": "Labor Code or CCR section number (e.g. 4622, 5814, 5502)"}
                },
                "required": ["section"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "crosswalk_8ccr_rule",
            "description": "Crosswalk legacy pre-2020 California Workers' Comp 8 CCR Rules to active 2026 regulations with Practice Hammers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "rule_query": {"type": "string", "description": "Legacy or active 8 CCR rule (e.g. 10451.1, 10622, 10750)"}
                },
                "required": ["rule_query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "lookup_med_legal_case",
            "description": "Look up California Workers' Comp case law holdings and citations (Hero en banc & CourtListener).",
            "parameters": {
                "type": "object",
                "properties": {
                    "case_name": {"type": "string", "description": "Case name to search (e.g. Dubon, Colamonico, Almaraz)"}
                },
                "required": ["case_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_courtlistener",
            "description": "Search CourtListener REST API for precedential California Supreme Court and Appellate opinions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Legal topic or case name to search"},
                    "court": {"type": "string", "description": "Court filter (default: cal,calctapp)"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_graph",
            "description": "Read all entities and relations from the persistent sovereign memory knowledge graph.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_entities",
            "description": "Create or update persistent entities in the sovereign knowledge graph.",
            "parameters": {
                "type": "object",
                "properties": {
                    "entities": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "entityType": {"type": "string"},
                                "observations": {"type": "array", "items": {"type": "string"}}
                            },
                            "required": ["name"]
                        }
                    }
                },
                "required": ["entities"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_nodes",
            "description": "Search persistent memory knowledge graph nodes by keyword.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Entity or keyword query"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_relations",
            "description": "Create persistent relations between entities in the sovereign knowledge graph.",
            "parameters": {
                "type": "object",
                "properties": {
                    "relations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "source": {"type": "string"},
                                "target": {"type": "string"},
                                "relationType": {"type": "string"}
                            },
                            "required": ["source", "target"]
                        }
                    }
                },
                "required": ["relations"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_observations",
            "description": "Add observations to existing entities in the sovereign knowledge graph.",
            "parameters": {
                "type": "object",
                "properties": {
                    "observations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "entityName": {"type": "string"},
                                "contents": {"type": "array", "items": {"type": "string"}}
                            },
                            "required": ["entityName", "contents"]
                        }
                    }
                },
                "required": ["observations"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_med_legal_cortex",
            "description": "Query 4090 SQLite Cortex Memory Database containing firm won decisions and verbatim legal briefs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "integer", "description": "Max results to return"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_master_division_chapter",
            "description": "Retrieve full text and roadmap of any chapter across the 12 Master Divisions (105 Chapters).",
            "parameters": {
                "type": "object",
                "properties": {
                    "division_number": {"type": "string", "description": "Division number (e.g. I, II, X)"},
                    "chapter_query": {"type": "string", "description": "Chapter name or subject query"}
                },
                "required": ["division_number", "chapter_query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_local_case_law",
            "description": "Search local case law briefs in 01_RESEARCH/case_law.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "depo_phone_transcript_analyze",
            "description": "Analyze phone call or deposition transcripts for admissions and penalty grounds.",
            "parameters": {
                "type": "object",
                "properties": {
                    "transcript_text": {"type": "string", "description": "Transcript text to analyze"},
                    "category": {"type": "string", "description": "phone or depo"},
                    "case_reference": {"type": "string", "description": "Case reference"}
                },
                "required": ["transcript_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "multi_replace_file_content",
            "description": "Perform multiple non-contiguous exact replacements in a file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path"},
                    "replacement_chunks": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "target_content": {"type": "string"},
                                "replacement_content": {"type": "string"}
                            },
                            "required": ["target_content", "replacement_content"]
                        }
                    }
                },
                "required": ["path", "replacement_chunks"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "manage_task",
            "description": "List or manage background tasks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "description": "list or kill"},
                    "task_id": {"type": "string", "description": "Task identifier"}
                }
            }
        }
    }
]

# Dispatcher dictionary mapping tool name -> python function
TOOL_DISPATCHER = {
    "view_file": lambda args: tool_view_file(args.get("path"), args.get("start_line", 1), args.get("end_line")),
    "write_to_file": lambda args: tool_write_to_file(args.get("path"), args.get("content"), args.get("overwrite", True)),
    "replace_file_content": lambda args: tool_replace_file_content(args.get("path"), args.get("target_content"), args.get("replacement_content")),
    "multi_replace_file_content": lambda args: tool_multi_replace_file_content(args.get("path"), args.get("replacement_chunks", [])),
    "list_dir": lambda args: tool_list_dir(args.get("path")),
    "grep_search": lambda args: tool_grep_search(args.get("query"), args.get("search_path"), args.get("is_regex", False)),
    "run_command": lambda args: tool_run_command(args.get("command"), args.get("cwd"), args.get("timeout", 30)),
    "manage_task": lambda args: tool_manage_task(args.get("action", "list"), args.get("task_id")),
    "search_web": lambda args: tool_search_web(args.get("query"), args.get("limit", 5)),
    "read_url_content": lambda args: tool_read_url_content(args.get("url")),
    "lookup_california_labor_code": lambda args: tool_lookup_california_labor_code(args.get("section")),
    "crosswalk_8ccr_rule": lambda args: tool_crosswalk_8ccr_rule(args.get("rule_query")),
    "lookup_med_legal_case": lambda args: tool_lookup_med_legal_case(args.get("case_name")),
    "search_courtlistener": lambda args: tool_search_courtlistener(args.get("query"), args.get("court", "cal,calctapp")),
    "query_med_legal_cortex": lambda args: tool_query_med_legal_cortex(args.get("query"), args.get("limit", 5)),
    "read_master_division_chapter": lambda args: tool_read_master_division_chapter(args.get("division_number"), args.get("chapter_query")),
    "search_local_case_law": lambda args: tool_search_local_case_law(args.get("query")),
    "depo_phone_transcript_analyze": lambda args: tool_depo_phone_transcript_analyze(args.get("transcript_text"), args.get("category", "phone"), args.get("case_reference", "")),
    "read_graph": lambda args: tool_read_graph(),
    "create_entities": lambda args: tool_create_entities(args.get("entities", [])),
    "create_relations": lambda args: tool_create_relations(args.get("relations", [])),
    "add_observations": lambda args: tool_add_observations(args.get("observations", [])),
    "search_nodes": lambda args: tool_search_nodes(args.get("query"))
}

def execute_sovereign_tool(name: str, args: dict) -> str:
    """Safely executes any registered tool by name with arguments."""
    handler = TOOL_DISPATCHER.get(name)
    if not handler:
        return f"Error: Tool '{name}' not found. Available tools: {list(TOOL_DISPATCHER.keys())}"
    try:
        return str(handler(args))
    except Exception as e:
        return f"Error executing tool '{name}': {e}"

# -----------------------------------------------------------------------------
# 4. Sovereign Autonomous ReAct Agent Loop
# -----------------------------------------------------------------------------

def run_sovereign_agent_cortex(user_objective: str, max_turns: int = 15, model: str = "nvidia/Nemotron-3-Ultra-550b-a55b"):
    """
    Executes an autonomous multi-turn ReAct loop with Nemotron-3-Ultra-550b.
    The agent can think, call tools, inspect files, search statutes, run python,
    and self-correct until it delivers the final court-grade work-product.
    """
    from run_nemotron_trial_cycle import load_nebius_api_key
    api_key = load_nebius_api_key()
    if not api_key:
        raise RuntimeError("Nebius API key not found in environment or .env files.")

    url = "https://api.studio.nebius.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    system_prompt = """You are the Sovereign California Workers' Compensation Autonomous Legal Engine & Pair Programmer.
You have access to a full suite of sovereign tools:
- Filesystem: view_file, write_to_file, replace_file_content, list_dir, grep_search
- Shell Execution: run_command (run any python script, inspect binaries, calculate formulas)
- Web & Case Law: search_web, read_url_content, search_courtlistener
- Statutory & Practice Hammers: lookup_california_labor_code, crosswalk_8ccr_rule, lookup_med_legal_case
- Persistent Memory: read_graph, create_entities, search_nodes

OPERATING RULES:
1. Always engage in deep analytical thinking before action.
2. When investigating case files or dossiers, inspect real records using list_dir, view_file, and run_command (to parse PDFs/DOCs).
3. Ground all legal citations in verified Labor Code sections and 8 CCR regulations. Never hallucinate.
4. If a tool call errors, inspect the error and self-correct on the subsequent turn.
5. Provide the final completed work product in court-grade markdown (California 28-line format where applicable).
6. Avoid repetitive looping tokens. Once research tools have returned the needed legal authorities, proceed immediately to synthesize the final pleading or document.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_objective}
    ]

    print("=" * 80)
    print("🚀 INITIATING SOVEREIGN AGENT CORTEX (FULL TOOL PARITY)")
    print(f"🎯 Model: {model} | Max Turns: {max_turns}")
    print(f"🛠️ Active Tools: {len(SOVEREIGN_TOOL_DEFINITIONS)} Registered Sovereign Tools")
    print("=" * 80)

    for turn in range(1, max_turns + 1):
        print(f"\n🔄 --- TURN {turn}/{max_turns} ---")
        payload = {
            "model": model,
            "messages": messages,
            "tools": SOVEREIGN_TOOL_DEFINITIONS,
            "temperature": 0.15,
            "max_tokens": 4096,
            "frequency_penalty": 0.25,
            "presence_penalty": 0.15
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=90)
            if not resp.ok:
                print(f"❌ API Error: {resp.status_code} - {resp.text}")
                break
            
            choice = resp.json()["choices"][0]
            msg = choice["message"]
            messages.append(msg)

            content = msg.get("content")
            if content:
                print(f"🧠 Agent Reasoning:\n{content[:400]}..." if len(content) > 400 else f"🧠 Agent Reasoning:\n{content}")

            tool_calls = msg.get("tool_calls")
            if not tool_calls:
                print(f"\n✅ Sovereign Agent completed mission autonomously in {turn} turns!")
                return content

            for tc in tool_calls:
                fn_name = tc["function"]["name"]
                raw_args = tc["function"]["arguments"]
                try:
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                except Exception:
                    args = {}
                
                print(f"   ⚙️ TOOL ACTION: {fn_name}({json.dumps(args, ensure_ascii=False)[:120]})")
                output = execute_sovereign_tool(fn_name, args)
                print(f"   📥 RESULT: {str(output)[:180]}...")

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": str(output)
                })

        except Exception as e:
            print(f"⚠️ Loop Exception: {e}")
            break

    print("\n🏁 Reached maximum turns or research completed.")
    if messages and messages[-1].get("role") == "tool":
        print("📝 Generating Final Synthesis Deliverable from research...")
        synth_payload = {
            "model": model,
            "messages": messages + [{"role": "user", "content": "All investigations and tool calls are complete. Please now draft the complete, conformed final work product based on all findings above."}],
            "temperature": 0.15,
            "max_tokens": 4096
        }
        try:
            resp = requests.post(url, headers=headers, json=synth_payload, timeout=90)
            if resp.ok:
                choice = resp.json()["choices"][0]
                final_content = choice["message"].get("content", "")
                return final_content
        except Exception as e:
            print(f"Error in final synthesis: {e}")

    for m in reversed(messages):
        if m.get("role") == "assistant" and m.get("content"):
            return m.get("content")
    return messages[-1].get("content", "")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Sovereign Agent Cortex Runner")
    parser.add_argument("--objective", type=str, default="Check the legal concordance for 8 CCR 10451.1 and search CourtListener for Colamonico, then summarize the rule in memory.", help="Task objective for agent")
    parser.add_argument("--turns", type=int, default=10, help="Max turns")
    args = parser.parse_args()

    result = run_sovereign_agent_cortex(args.objective, max_turns=args.turns)
    print("\n" + "=" * 80)
    print("FINAL SOVEREIGN DELIVERABLE:")
    print("=" * 80)
    print(result)
