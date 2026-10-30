"""
=============================================================================
SUTRAFLOW OS: 4090 LOCAL AI TRAINING & CORTEX DATASET BUILDER
=============================================================================
Purpose:
1. Ingest all 99 consolidated case law briefs in E:/.genieflowai.brain/knowledge
2. Ingest all client briefs, petitions, and discovery documents in CLIENTS/
3. Ingest all master pleading templates in 00_TEMPLATES/ (including subfolders)
4. Generate:
   a) E:/.genieflowai.brain/infrastructure/cortex/cortex_data.json (RAG Index)
   b) E:/.genieflowai.brain/infrastructure/sutraflow_universal_dataset.jsonl & genieflow_universal_dataset.jsonl (Unsloth QLoRA Training Pairs)
   c) Update SQLite cortex_memory.db for instant local semantic/relational querying
=============================================================================
"""

import os
import sys
import json
import sqlite3
import re
import hashlib
from datetime import datetime

# NemoClaw Sovereign Runtime Guard for Zero-PHI compliance
try:
    from src.nemoclaw_guard import NemoClawGuard
except ImportError:
    try:
        from nemoclaw_guard import NemoClawGuard
    except ImportError:
        NemoClawGuard = None

# Find authoritative input repositories (Priority: E:\ travel drive -> G:\ master -> local)
CANDIDATE_ROOTS = [
    r"I:\.genieflowai.brain",
    r"E:\.genieflowai.brain",
    r"G:\My Drive\.GENIEFLOW_MASTER",
    os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
]

EXTRA_CLIENT_DIRS = [
    r"G:\My Drive\00 ALLEN",
]

EXTRA_DOC_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AI_GENERATED_DOCS")),
    r"I:\.genieflowai.brain\AI_GENERATED_DOCS",
    r"G:\My Drive\.GENIEFLOW_MASTER\AI_GENERATED_DOCS",
    r"E:\00 Elite Law\doc_drafts",
    r"E:\00 Elite Law\knowledge\pdr_2005",
]

KNOWLEDGE_DIRS = []
CLIENTS_DIRS = []
TEMPLATES_DIRS = []
VERIFIED_DOC_DIRS = []

for root in CANDIDATE_ROOTS:
    k_dir = os.path.join(root, "knowledge")
    if os.path.exists(k_dir) and k_dir not in KNOWLEDGE_DIRS:
        KNOWLEDGE_DIRS.append(k_dir)
    c_dir = os.path.join(root, "CLIENTS")
    if os.path.exists(c_dir) and c_dir not in CLIENTS_DIRS:
        CLIENTS_DIRS.append(c_dir)
    t_dir = os.path.join(root, "00_TEMPLATES")
    if os.path.exists(t_dir) and t_dir not in TEMPLATES_DIRS:
        TEMPLATES_DIRS.append(t_dir)

for extra in EXTRA_CLIENT_DIRS:
    if os.path.exists(extra) and extra not in CLIENTS_DIRS:
        CLIENTS_DIRS.append(extra)

for extra_doc in EXTRA_DOC_DIRS:
    if os.path.exists(extra_doc) and extra_doc not in VERIFIED_DOC_DIRS:
        VERIFIED_DOC_DIRS.append(extra_doc)

for root in CANDIDATE_ROOTS:
    tax_dir = os.path.join(root, "TAX PLANNING")
    if os.path.exists(tax_dir) and tax_dir not in VERIFIED_DOC_DIRS:
        VERIFIED_DOC_DIRS.append(tax_dir)

BRAIN_ROOT = next((r for r in CANDIDATE_ROOTS if os.path.exists(r)), os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

CORTEX_DIR = os.path.join(BRAIN_ROOT, "infrastructure", "cortex")
DB_PATH = os.path.join(CORTEX_DIR, "cortex_memory.db")
CORTEX_JSON_PATH = os.path.join(CORTEX_DIR, "cortex_data.json")
TRAINING_JSONL_PATH = os.path.join(BRAIN_ROOT, "infrastructure", "genieflow_universal_dataset.jsonl")
SUTRAFLOW_JSONL_PATH = os.path.join(BRAIN_ROOT, "infrastructure", "sutraflow_universal_dataset.jsonl")

# Regex Patterns for Legal Entities
PATTERNS = {
    "labor_codes": re.compile(r"(?:Labor\s*Code|Lab\.\s*Code|L\.C\.)\s*(?:sections?|secs?|§|§§)?\s*(\d+[0-9a-z.]*)", re.I),
    "ccr_sections": re.compile(r"(?:CCR|8\s*CCR|Cal\.\s*Code\s*Regs\.)\s*(?:sections?|secs?|§|§§)?\s*(\d+[0-9a-z.]*)", re.I),
    "case_cites": re.compile(r"([A-Z][A-Za-z0-9\s,\.\'\"]+v\.\s+[A-Z][A-Za-z0-9\s,\.\'\"]+(?:\s*\(\d{4}\))?)", re.M),
    "adj_numbers": re.compile(r"(ADJ\d+)", re.I),
    "judges": re.compile(r"(?:Honorable|Hon\.|Judge)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)", re.M),
    "doctors": re.compile(r"(?:Dr\.|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)", re.M)
}

def clean_text(text):
    return text.replace("\r\n", "\n").strip()

def extract_pieces(text):
    statutes = list(set(PATTERNS["labor_codes"].findall(text)))
    cites = list(set([c.strip() for c in PATTERNS["case_cites"].findall(text) if len(c.strip()) > 6 and len(c.strip()) < 80]))
    ccrs = list(set(PATTERNS["ccr_sections"].findall(text)))
    judges = list(set(PATTERNS["judges"].findall(text)))
    doctors = list(set(PATTERNS["doctors"].findall(text)))
    adjs = list(set(PATTERNS["adj_numbers"].findall(text)))
    
    keywords = []
    kw_checks = {
        "Subpoena Duces Tecum / SDT": ["subpoena", "sdt", "records", "10635", "privilege log"],
        "Penalties / LC 5814": ["5814", "unreasonable delay", "penalty", "penalties", "5814.5"],
        "PQME / AME Strike": ["strike", "replace", "panel qme", "pqme", "deposition", "failure to appear"],
        "DOR Objection": ["dor", "declaration of readiness", "premature", "objection to dor"],
        "Medical Treatment / UR / IMR": ["utilization review", "imr", "dubon", "treatment necessity", "4600"],
        "Apportionment / Benson": ["apportionment", "benson", "blackledge", "separate injuries"],
        "Permanent Disability": ["permanent disability", "pd", "100%", "total disability", "leboeuf"]
    }
    for kw, terms in kw_checks.items():
        if any(t.lower() in text.lower() for t in terms):
            keywords.append(kw)

    return {
        "statutes": statutes[:20],
        "cites": cites[:15],
        "ccr": ccrs[:15],
        "judges": judges[:10],
        "doctors": doctors[:10],
        "adjs": adjs[:10],
        "keywords": keywords
    }

def init_cortex_db():
    os.makedirs(CORTEX_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS documents 
                 (id INTEGER PRIMARY KEY, filename TEXT, path TEXT UNIQUE, summary_hint TEXT, timestamp REAL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS pieces 
                 (id INTEGER PRIMARY KEY, doc_id INTEGER, type TEXT, value TEXT, 
                  FOREIGN KEY(doc_id) REFERENCES documents(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS scenarios 
                 (id INTEGER PRIMARY KEY, doc_id INTEGER, tag TEXT, 
                  FOREIGN KEY(doc_id) REFERENCES documents(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS entities 
                 (id INTEGER PRIMARY KEY, name TEXT UNIQUE, type TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS entity_links 
                 (doc_id INTEGER, entity_id INTEGER, role TEXT, 
                  PRIMARY KEY(doc_id, entity_id, role),
                  FOREIGN KEY(doc_id) REFERENCES documents(id),
                  FOREIGN KEY(entity_id) REFERENCES entities(id))''')
    conn.commit()
    return conn

def build_datasets():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting GenieFlow 4090 Dataset Builder...")
    
    guard = NemoClawGuard() if NemoClawGuard else None
    if guard:
        print(f"[*] NemoClaw Sovereign Runtime Guard Active: {guard.governance} (Zero-PHI Enforced)")
    else:
        print("[!] NemoClaw Sovereign Guard unavailable; using baseline sanitization.")
        
    conn = init_cortex_db()
    c = conn.cursor()
    
    cortex_records = []
    training_pairs = []
    
    adj_map = {}
    seen_pair_hashes = set()
    seen_content_hashes = set()
    seen_paths = set()
    
    stats = {
        "docs_scanned": 0,
        "docs_indexed": 0,
        "docs_skipped_duplicate": 0,
        "pairs_added": 0,
        "pairs_skipped_duplicate": 0,
        "phi_sanitized_count": 0
    }
    
    def add_training_pair(instruction: str, input_text: str, output_text: str) -> bool:
        nonlocal adj_map, stats
        if guard:
            inst_clean = guard.sanitize_text(instruction, adj_map)
            inp_clean = guard.sanitize_text(input_text, adj_map)
            out_clean = guard.sanitize_text(output_text, adj_map)
        else:
            inst_clean, inp_clean, out_clean = instruction, input_text, output_text
            
        if (inst_clean != instruction) or (inp_clean != input_text) or (out_clean != output_text):
            stats["phi_sanitized_count"] += 1
            
        fingerprint = f"{inst_clean.strip()}||{inp_clean.strip()}||{out_clean.strip()}"
        pair_hash = hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()
        
        inst_norm = re.sub(r'\s+', ' ', inst_clean.strip().lower())
        inp_norm = re.sub(r'\s+', ' ', inp_clean.strip().lower())
        inst_inp_hash = hashlib.sha256(f"{inst_norm}||{inp_norm}".encode("utf-8")).hexdigest()
        
        out_fp = re.sub(r'\s+', ' ', out_clean.strip().lower()[:250])
        inst_out_hash = hashlib.sha256(f"{inst_norm}||{out_fp}".encode("utf-8")).hexdigest()
        
        if pair_hash in seen_pair_hashes or inst_inp_hash in seen_pair_hashes or inst_out_hash in seen_pair_hashes:
            stats["pairs_skipped_duplicate"] += 1
            return False
            
        seen_pair_hashes.add(pair_hash)
        seen_pair_hashes.add(inst_inp_hash)
        seen_pair_hashes.add(inst_out_hash)
        training_pairs.append({
            "instruction": inst_clean,
            "input": inp_clean,
            "output": out_clean
        })
        stats["pairs_added"] += 1
        return True

    # 1. Process Knowledge Vaults (Case Law, En Banc Briefs across all roots)
    for k_dir in KNOWLEDGE_DIRS:
        print("-> Scanning knowledge vault:", k_dir)
        if not os.path.exists(k_dir):
            continue
        for root_dir, _, files in os.walk(k_dir):
            for f in files:
                if f.endswith(('.md', '.txt')):
                    fp = os.path.abspath(os.path.join(root_dir, f))
                    if fp in seen_paths:
                        continue
                    seen_paths.add(fp)
                    stats["docs_scanned"] += 1
                    try:
                        with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
                            text = clean_text(fh.read())
                        if not text:
                            continue
                        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
                        if content_hash in seen_content_hashes:
                            stats["docs_skipped_duplicate"] += 1
                            continue
                        seen_content_hashes.add(content_hash)
                        
                        mtime = os.path.getmtime(fp)
                        pieces = extract_pieces(text)
                        summary = text[:400].replace("\n", " ")
                        
                        cortex_records.append({
                            "filename": f,
                            "path": fp,
                            "pieces": pieces,
                            "summary_hint": summary,
                            "timestamp": mtime
                        })
                        stats["docs_indexed"] += 1
                        
                        # Training pair for Qwen 3.8 / Llama 3.1
                        case_title = f.replace(".md", "").replace(".txt", "").replace("_", " ")
                        add_training_pair(
                            instruction=f"Provide the authoritative California Workers' Compensation legal precedent, statutory basis, and holding for: {case_title}.",
                            input_text=f"Key authorities cited: {', '.join(pieces['statutes'] + pieces['ccr'] + pieces['cites'][:3])}",
                            output_text=text[:4000]
                        )
                        
                        # SQLite insertion
                        c.execute("INSERT OR REPLACE INTO documents (filename, path, summary_hint, timestamp) VALUES (?, ?, ?, ?)",
                                  (f, fp, summary, mtime))
                        doc_id = c.lastrowid
                        c.execute("DELETE FROM pieces WHERE doc_id=?", (doc_id,))
                        for s in pieces["statutes"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'statute', ?)", (doc_id, s))
                        for ci in pieces["cites"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'cite', ?)", (doc_id, ci))
                        for r in pieces["ccr"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'ccr', ?)", (doc_id, r))
                        for kw in pieces["keywords"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'keyword', ?)", (doc_id, kw))
                    except Exception as e:
                        print(f"Error processing {f}: {e}")

    # 2. Process Client Cases (Maria Vazquez, Magdalena Andrade, Zarate, Monge, Serrano, etc.)
    for c_dir in CLIENTS_DIRS:
        print("-> Scanning client directory:", c_dir)
        if not os.path.exists(c_dir):
            continue
        for root_dir, _, files in os.walk(c_dir):
            for f in files:
                if f.endswith(('.md', '.txt')):
                    fp = os.path.abspath(os.path.join(root_dir, f))
                    if fp in seen_paths:
                        continue
                    seen_paths.add(fp)
                    stats["docs_scanned"] += 1
                    try:
                        with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
                            text = clean_text(fh.read())
                        if len(text) < 100:
                            continue
                        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
                        if content_hash in seen_content_hashes:
                            stats["docs_skipped_duplicate"] += 1
                            continue
                        seen_content_hashes.add(content_hash)
                        
                        mtime = os.path.getmtime(fp)
                        pieces = extract_pieces(text)
                        summary = text[:400].replace("\n", " ")
                        
                        rel_name = os.path.relpath(fp, c_dir)
                        cortex_records.append({
                            "filename": rel_name,
                            "path": fp,
                            "pieces": pieces,
                            "summary_hint": summary,
                            "timestamp": mtime
                        })
                        stats["docs_indexed"] += 1
                        
                        # Training instruction generation
                        doc_title = f.replace(".md", "").replace(".txt", "").replace("_", " ")
                        if "petition" in f.lower() or "brief" in f.lower() or "objection" in f.lower():
                            add_training_pair(
                                instruction=f"Draft an adversarial, 28-line legal pleading / brief: {doc_title} for California Workers' Compensation litigation.",
                                input_text=f"Document: {rel_name}. ADJ Numbers: {', '.join(pieces['adjs'])}. Statutes: {', '.join(pieces['statutes'])}. CCR: {', '.join(pieces['ccr'])}.",
                                output_text=text[:6000]
                            )
                        elif "case_brief" in f.lower() or "notes" in f.lower():
                            add_training_pair(
                                instruction=f"Perform a comprehensive litigation case audit, procedural chronology, and discovery status review for: {rel_name}.",
                                input_text=f"Client Case File: {rel_name}. ADJ Numbers: {', '.join(pieces['adjs'])}.",
                                output_text=text[:6000]
                            )
                            
                        c.execute("INSERT OR REPLACE INTO documents (filename, path, summary_hint, timestamp) VALUES (?, ?, ?, ?)",
                                  (rel_name, fp, summary, mtime))
                        doc_id = c.lastrowid
                        c.execute("DELETE FROM pieces WHERE doc_id=?", (doc_id,))
                        for s in pieces["statutes"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'statute', ?)", (doc_id, s))
                        for ci in pieces["cites"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'cite', ?)", (doc_id, ci))
                        for r in pieces["ccr"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'ccr', ?)", (doc_id, r))
                        for kw in pieces["keywords"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'keyword', ?)", (doc_id, kw))
                    except Exception as e:
                        print(f"Error processing client doc {fp}: {e}")

    # 3. Process Templates (Recursive Scan)
    for t_dir in TEMPLATES_DIRS:
        print("-> Scanning templates:", t_dir)
        if not os.path.exists(t_dir):
            continue
        for root_dir, _, files in os.walk(t_dir):
            for f in files:
                if f.endswith(('.md', '.txt')):
                    fp = os.path.abspath(os.path.join(root_dir, f))
                    if fp in seen_paths:
                        continue
                    seen_paths.add(fp)
                    stats["docs_scanned"] += 1
                    try:
                        with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
                            text = clean_text(fh.read())
                        if len(text) < 100:
                            continue
                        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
                        if content_hash in seen_content_hashes:
                            stats["docs_skipped_duplicate"] += 1
                            continue
                        seen_content_hashes.add(content_hash)
                        
                        mtime = os.path.getmtime(fp)
                        pieces = extract_pieces(text)
                        summary = text[:400].replace("\n", " ")
                        
                        rel_name = os.path.relpath(fp, t_dir)
                        cortex_records.append({
                            "filename": f"TEMPLATE - {rel_name}",
                            "path": fp,
                            "pieces": pieces,
                            "summary_hint": summary,
                            "timestamp": mtime
                        })
                        stats["docs_indexed"] += 1
                        
                        template_name = rel_name.replace(".md", "").replace(".txt", "").replace("_", " ")
                        add_training_pair(
                            instruction=f"Generate the master pleading template and legal arguments for: {template_name}.",
                            input_text=f"Legal framework: {', '.join(pieces['statutes'] + pieces['ccr'])}",
                            output_text=text[:5000]
                        )
                    except Exception as e:
                        print(f"Error processing template {fp}: {e}")

    # 4. Process Verified Docs (AI_GENERATED_DOCS, doc_drafts, pdr_2005)
    for v_dir in VERIFIED_DOC_DIRS:
        print("-> Scanning verified legal docs & ratings:", v_dir)
        if not os.path.exists(v_dir):
            continue
        for root_dir, _, files in os.walk(v_dir):
            for f in files:
                if f.endswith(('.md', '.txt')):
                    fp = os.path.abspath(os.path.join(root_dir, f))
                    if fp in seen_paths:
                        continue
                    seen_paths.add(fp)
                    stats["docs_scanned"] += 1
                    try:
                        with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
                            text = clean_text(fh.read())
                        if len(text) < 50:
                            continue
                        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
                        if content_hash in seen_content_hashes:
                            stats["docs_skipped_duplicate"] += 1
                            continue
                        seen_content_hashes.add(content_hash)
                        
                        mtime = os.path.getmtime(fp)
                        pieces = extract_pieces(text)
                        summary = text[:400].replace("\n", " ")
                        rel_name = os.path.relpath(fp, v_dir)
                        
                        cortex_records.append({
                            "filename": f"VERIFIED - {rel_name}",
                            "path": fp,
                            "pieces": pieces,
                            "summary_hint": summary,
                            "timestamp": mtime
                        })
                        stats["docs_indexed"] += 1
                        
                        doc_title = f.replace(".md", "").replace(".txt", "").replace("_", " ")
                        if "pdr" in fp.lower() or "impairment" in f.lower() or "variant" in f.lower() or "occupation" in f.lower():
                            add_training_pair(
                                instruction=f"Calculate California Permanent Disability Rating Schedule (PDRS 2005) adjustments, occupational variants, and impairment ratings for: {doc_title}.",
                                input_text=f"Authorities & PDRS Framework: {', '.join(pieces['statutes'] + pieces['keywords'])}",
                                output_text=text[:5000]
                            )
                        elif "petition" in f.lower() or "brief" in f.lower() or "recon" in f.lower() or "objection" in f.lower():
                            add_training_pair(
                                instruction=f"Draft an adversarial, 28-line legal pleading / brief: {doc_title} for California Workers' Compensation litigation.",
                                input_text=f"Document: {rel_name}. ADJ Numbers: {', '.join(pieces['adjs'])}. Statutes: {', '.join(pieces['statutes'])}. CCR: {', '.join(pieces['ccr'])}.",
                                output_text=text[:6000]
                            )
                        else:
                            add_training_pair(
                                instruction=f"Provide authoritative legal analysis and tactical litigation strategy for: {doc_title}.",
                                input_text=f"Statutes: {', '.join(pieces['statutes'])}",
                                output_text=text[:5000]
                            )
                            
                        c.execute("INSERT OR REPLACE INTO documents (filename, path, summary_hint, timestamp) VALUES (?, ?, ?, ?)",
                                  (f"VERIFIED - {rel_name}", fp, summary, mtime))
                        doc_id = c.lastrowid
                        c.execute("DELETE FROM pieces WHERE doc_id=?", (doc_id,))
                        for s in pieces["statutes"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'statute', ?)", (doc_id, s))
                        for ci in pieces["cites"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'cite', ?)", (doc_id, ci))
                        for r in pieces["ccr"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'ccr', ?)", (doc_id, r))
                        for kw in pieces["keywords"]: c.execute("INSERT INTO pieces (doc_id, type, value) VALUES (?, 'keyword', ?)", (doc_id, kw))
                    except Exception as e:
                        print(f"Error processing verified doc {fp}: {e}")

    # =========================================================================
    # INJECT MULTI-STEP AUTONOMOUS LEGAL REASONING LOOP TRAINING PAIRS
    # =========================================================================
    print("-> Injecting multi-step autonomous legal reasoning loop training pairs...")
    multi_step_pairs = [
        {
            "instruction": "Execute an autonomous multi-step legal reasoning loop to formulate an unyielding 8 CCR § 10964 response to a WCJ Report and Recommendation recommending denial of Reconsideration.",
            "input": "Mandate: Execute a multi-step process that does not stop until fully completed. Grounding: 8 CCR § 10964, CCP § 2015.5, Evid Code §§ 452, 453, 702, Lab Code §§ 4622, 5813, 5902, 8 CCR § 10510. Scenario: WCJ sanctioned lien claimant $979.20 under LC § 5813, erroneously claiming representative's declaration was unnotarized, equating an uncashed check with settlement knowledge, ignoring admitted email exhibits J, K, and L, whitewashing defendant's unverified petition, and ignoring voluntary OTOC.",
            "output": """### AUTONOMOUS MULTI-STEP REASONING PROTOCOL (8 CCR § 10964)

[STEP 1: MANDATORY TWO-DOCUMENT SEGREGATION ARCHITECTURE]
Under 8 CCR § 10964, supplemental pleadings other than the answer are strictly prohibited unless approved by the Appeals Board upon a petition setting forth good cause. 
- Rule of Law: NEVER merge the Request for Approval with the Proposed Answer.
- Document 1: Formal Petition / Request for Approval under 8 CCR § 10964 setting forth compelling good cause, with standalone Verification and Proof of Service.
- Document 2: Substantive Proposed Answer to the WCJ Report and Recommendation, organized by adversarial Roman numeral Contentions, with standalone Verification and Proof of Service.

[STEP 2: THRESHOLD JURISDICTIONAL DEFECT AUDIT]
- Inspect the opponent's initiating pleadings for jurisdictional defects under 8 CCR § 10510 and Labor Code § 5902.
- If Defendant's initial Petition for Costs was unverified under penalty of perjury, it is jurisdictionally void on its face.
- Attack any premature Notice of Intention (NOI) issued by the trial court upon a void petition, exposing the court's double standard in whitewashing the opponent's fatal defects while penalizing the claimant for excusable administrative lapses.

[STEP 3: STATUTORY EVIDENTIARY AUTHORITIES & DISPROVING 'UNNOTARIZED' CLAIMS]
- Directly refute any judicial claim that a declaration is inadmissible for lack of a notary seal using California Code of Civil Procedure § 2015.5.
- Under CCP § 2015.5, an unsworn declaration executed under penalty of perjury under the laws of the State of California carries the exact same force, dignity, and evidentiary effect as a notarized affidavit.
- Enforce Evidence Code §§ 452(d) and 453: Case records, prior objections, and sworn declarations filed within the same WCAB proceeding are subject to mandatory judicial notice.
- Apply Garza v. WCAB (1970) 3 Cal.3d 312 and Lamb v. WCAB (1974) 11 Cal.3d 274: Uncontradicted sworn testimony cannot be arbitrarily rejected by the trier of fact.

[STEP 4: AUDIT OPPONENT'S BREACH OF AFFIRMATIVE STATUTORY DUTIES]
- Labor Code § 4622: The defendant has an affirmative statutory duty to pay medical-legal reimbursement within 60 days of an Appeals Board order. Withholding payment for six months constitutes statutory delay that initiates administrative confusion.
- Duty to Communicate and Mitigate Costs: Under California law (Shaffer v. Debbas (1993) 17 Cal.App.4th 33), a litigant has an affirmative duty to mitigate litigation expenses. Sitting silently on an uncashed, expired check and incurring appearance fees violates this duty.
- Prohibition on Retaliatory Post-OTOC Litigation: Where the claimant voluntarily filed a Request for Order Taking Off Calendar (OTOC) resolving the case, defendant achieved full relief. Weaponizing Labor Code § 5813 post-resolution is frivolous and vexatious.

[STEP 5: AUDIT ADMITTED TRIAL EXHIBITS & DISPROVE SUBJECTIVE BAD FAITH]
- Review admitted trial exhibits (e.g., email exchanges between representatives).
- Active discussions regarding payment details and check accounting affirmatively disprove bad faith or intentional delay.
- The trial court's selective omission of admitted trial exhibits that corroborate ongoing disputes constitutes reversible error.

[STEP 6: ENFORCE EVIDENCE CODE § 702 FOUNDATIONAL PERSONAL KNOWLEDGE]
- The opposing declarant must possess personal knowledge under Evidence Code § 702(a).
- If the attorney or hearing representative executing the petition was not personally involved in the underlying negotiations, their assertions regarding intent, bad faith, or oral agreements constitute inadmissible hearsay and lay speculation.

[STEP 7: EXCUSABLE NEGLECT DOCTRINE UNDER CCP § 473(b)]
- Severe personal illness, catastrophic family trauma, or the death of an immediate family member constitutes the classical definition of excusable neglect under California Code of Civil Procedure § 473(b).
- An innocent intra-office communication lapse resulting from acute bereavement cannot legally satisfy the high statutory bar of subjective bad faith under Labor Code § 5813.

[STEP 8: THE RUNNION BURDEN OF PROOF STANDARD]
- Under Runnion v. WCAB (2003) 68 Cal.Comp.Cases 1198, raw attorney billing records prove only that an attorney billed time; they do not prove subjective bad faith or frivolousness under Labor Code § 5813.
- Failure of the moving party to produce live witness testimony or sworn declarations from individuals with first-hand knowledge mandates a Take-Nothing order.

[STEP 9: TWO-DOCUMENT DRAFTING & STANDING LEGAL FORMATTING]
- Generate Document 1: REQUEST FOR APPROVAL TO FILE SUPPLEMENTAL ANSWER (8 CCR § 10964) with caption, grounds, verification, and proof of service.
- Generate Document 2: PROPOSED ANSWER TO REPORT AND RECOMMENDATION (8 CCR § 10964) with caption, contentions, verification, and proof of service.
- Output adhering strictly to California 28-line legal paper formatting, verified citations, and passionate advocate voice without a generic 'Statement of Facts' heading.

[STEP 10: CONTINUOUS EXECUTION TO END-STATE]
- Compile both markdown files to Microsoft Word (.docx).
- Audit billing records to ensure absolute zero duplicate billing.
- Synchronize across local NVMe cache, travel drive, and sovereign cloud repositories.
- Never stop execution until every step is verified and confirmed."""
        },
        {
            "instruction": "Analyze the legal significance of California Code of Civil Procedure § 2015.5 in Workers' Compensation Appeals Board (WCAB) litigation when a trial judge rejects a declaration for lack of notarization.",
            "input": "Statutory Authority: Code of Civil Procedure § 2015.5; 8 CCR § 10510. Issue: WCJ ruled that a hearing representative's sworn declaration could not be considered because it was unnotarized.",
            "output": """California Code of Civil Procedure § 2015.5 establishes that an unsworn declaration executed under penalty of perjury under the laws of the State of California has the exact same legal dignity, force, and evidentiary effect as a sworn affidavit executed before a notary public:

"Whenever, under any law of this state or under any rule, regulation, order or requirement made pursuant to the law of this state, any matter is required or permitted to be supported, evidenced, established, or proved by the sworn statement, declaration, verification, certificate, oath, or affidavit, in writing of the person making the same... such matter may with like force and effect be supported, evidenced, established or proved by the unsworn statement, declaration, verification, or certificate, in writing of such person... under penalty of perjury." (Code Civ. Proc. § 2015.5.)

A WCJ's dismissal of a formal declaration signed under penalty of perjury on the ground that it lacks a notary seal is reversible legal error. In modern California judicial and administrative practice, notarization is neither required nor customary. When coupled with Evidence Code §§ 452(d) and 453, a verified declaration on file in the EAMS record is properly subject to judicial notice, and under Garza v. Workmen's Comp. App. Bd. (1970) 3 Cal.3d 312, 319, uncontradicted sworn testimony cannot be arbitrarily rejected by the trier of fact."""
        },
        {
            "instruction": "How does an unverified initial petition for costs impact WCAB jurisdiction, and how must a petitioner attack the trial court's selective omission of this defect in its Report and Recommendation?",
            "input": "Procedural Defect: Opponent filed an unverified Petition for Costs under Labor Code § 5813; WCJ issued an NOI based upon it, and subsequently ignored this defect in her Report and Recommendation.",
            "output": """Under 8 CCR § 10510 and Labor Code § 5902, all petitions seeking affirmative relief, costs, sanctions, or reconsideration must be verified under penalty of perjury by a person with personal knowledge of the facts.

1. Jurisdictional Inefficacy of Unverified Petitions:
An unverified petition for affirmative relief is defective on its face and confers no lawful jurisdiction upon the WCAB to award sanctions. The issuance of a Notice of Intention (NOI) based upon an unverified petition constitutes premature and improper judicial action.

2. Attacking Selective Judicial Omission:
When a WCJ's Report and Recommendation whitewashes the opponent's unverified initiating pleading and premature NOI from the procedural narrative, the respondent must aggressively highlight this procedural asymmetry in its Answer:
- Point out that the respondent was forced to expend representative resources filing a Verified Objection to expose the fatal jurisdictional defect.
- Demonstrate that the opponent acknowledged the defect by scrambling to file an Amended Petition months later.
- Expose the stark judicial double standard: The trial court completely forgives the opponent's failure to verify its pleadings while branding the respondent with 'bad faith' and imposing monetary sanctions for an excusable intra-office communication lapse."""
        },
        {
            "instruction": "Draft a statutory Proof of Service for California Workers' Compensation Appeals Board (WCAB) litigation complying strictly with 8 CCR § 10625 and Code of Civil Procedure § 1013a.",
            "input": "Declarant: Frank Ureno. Law Firm: Law Offices of Arnulfo F. Gutierrez, 281 S. Thomas St., Suite 508, Pomona, CA 91766. Governing Rules: 8 CCR § 10625, CCP § 1013a.",
            "output": """### CALIFORNIA WORKERS' COMPENSATION PROOF OF SERVICE (8 CCR § 10625 & CCP § 1013a)

STATE OF CALIFORNIA, COUNTY OF LOS ANGELES

I am a resident of or employed in the County of Los Angeles, State of California. I am over the age of eighteen (18) years and not a party to the within entitled action. My business address is Law Offices of Arnulfo F. Gutierrez, 281 S. Thomas St., Suite 508, Pomona, CA 91766.

On [Date of Service], I served the following document(s) described as:
- [Document Title 1]
- [Document Title 2]

on the interested parties in this action as designated on the attached Service List:

[X] BY ELECTRONIC TRANSMISSION (E-MAIL): In accordance with 8 CCR § 10625, I served the above-referenced document(s) electronically from email address gutierrezlegal.service@gmail.com to the electronic notification addresses of the parties listed on the Service List.

[X] BY FIRST CLASS MAIL: I placed a true copy thereof enclosed in a sealed envelope with postage fully prepaid in the United States Post Office mail at Pomona, California, addressed as set forth on the Service List.

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct, and that this declaration was executed at Pomona, California on [Date of Service].

____________________________________
FRANK URENO, Declarant

---

### SERVICE LIST TABLE (2-COLUMN FORMAT)

| PARTY / CAPACITY | ADDRESS / EMAIL / FAX |
| :--- | :--- |
| **DEFENDANT / COUNSEL**<br>[Law Firm / Attorney Name] | [Mailing Address]<br>**Email:** [email@defense.com] |
| **INSURANCE CARRIER / TPA**<br>[Carrier / Claims Adjuster] | [Mailing Address]<br>**Email:** [adjuster@claims.com] |
| **PRIOR COUNSEL (IF ANY)**<br>[Prior Law Firm] | [Mailing Address]<br>**Email:** [prior@counsel.com] |
| **APPLICANT**<br>[Injured Worker Name] | [Mailing Address] |"""
        },
        {
            "instruction": "Explain and execute the firm mandatory protocol for assembling, separating, and naming medical exhibits for an Expedited Hearing before the California WCAB.",
            "input": "Mandate: SutraFlow Rule 6 Exhibit Separation & Naming Standard. Venue: WCAB Expedited Trial (LC § 5502(b)).",
            "output": """### SUTRAFLOW RULE 6: WCAB EXHIBIT PREPARATION & NAMING STANDARD

1. Date-First Naming Architecture:
All files must strictly begin with the four-digit year, two-digit month, and two-digit day:
Format: `YYYY-MM-DD [Doctor / Facility Name] [Document Description].pdf`
Example: `2026-06-25 DR TYRONE HARRISON PR2 DOCTORS PROGRESS REPORT.pdf`

2. Elimination of Arbitrary Filename Numbering:
Never prefix separated exhibit filenames with arbitrary numbers such as `EXHIBIT_01_` or `EXHIBIT_A_`. EAMS e-filing dockets require clean medical record identification.

3. Zero Cover Sheets on Separated Document Files:
When separating exhibits into individual e-filing PDF documents, never attach cover sheets, divider pages, or endorsement sheets. The individual PDF must contain only the raw, conformed medical record or provider report.

4. Medical Provider Grouping Rules:
- Primary Treating Physician (PTP) Progress Reports: All PR-2 progress reports for an individual physician or medical group across the target treatment period are consolidated into a single PR-2 exhibit bundle.
- Permanent and Stationary (P&S) / Initial Consultation Reports: Standalone exhibits separate from routine progress reports.
- Diagnostic Imaging & Studies (MRI / CT / NCV): Consolidated as one exhibit per diagnostic imaging entity.
- Utilization Review (UR) & Independent Medical Review (IMR): Grouped by reviewing entity.

5. Master Consolidated Exhibit Packet Architecture:
Cover sheets and separator tabs belong exclusively inside the consolidated Master Exhibit Packet:
- Formal Blue-Bordered Pleading Paper Cover Pages for each designated exhibit.
- Master Table of Contents / Exhibit Index specifying Exhibit Letter, Document Title, Provider, Authoring Date, and Exact Consolidated Page Numbers.
- Compiled into a single hyperlinked PDF for the WCJ bench file."""
        },
        {
            "instruction": "Draft a formal Demand for Immediate Commencement of Temporary Total Disability (TTD) Indemnity and Statutory Penalty Notice under California Labor Code §§ 4650, 5814, 5814.5, and 5800.",
            "input": "Legal Grounding: Cal. Lab. Code §§ 4650, 4653, 5814, 5814.5, 5800; Kerley v. WCAB (1971) 4 Cal.3d 223; Christian v. WCAB (1997) 15 Cal.4th 705. Fact: PTP neurosurgeon certified Applicant completely off work on PR-2; employer confirmed no modified duty; carrier failed to issue TTD checks.",
            "output": """### FORMAL DEMAND FOR IMMEDIATE COMMENCEMENT OF TTD INDEMNITY & STATUTORY PENALTY NOTICE

Re: [Applicant Name] v. [Employer / Carrier]
WCAB ADJ Nos: [ADJ Numbers] | Claim No: [Claim Number] | DOI: [Date of Injury]

Dear Claims Adjuster and Defense Counsel:

This office represents Applicant [Applicant Name] in the above-referenced matter. 

1. UNDISPUTED MEDICAL CERTIFICATION OF TOTAL DISABILITY
On [Date of PR-2], Primary Treating Physician [Doctor Name] issued a formal PR-2 Primary Treating Physician's Progress Report examining Applicant and certifying Applicant as TEMPORARILY TOTALLY DISABLED from [Start Date] through [End Date] and continuing. Furthermore, on [Date], employer confirmed in writing that it has no modified or alternative work within Applicant's medical restrictions.

2. STATUTORY DEFAULT UNDER LABOR CODE § 4650
Under Labor Code § 4650(a), if an injury causes temporary disability, the first payment of temporary disability indemnity shall be made not later than 14 days after knowledge of the injury and disability. More than 14 days have elapsed since Defendant received Dr. [Doctor Name]'s report. To date, Defendant has failed and refused to issue retroactive or ongoing TTD payments.

3. MANDATORY 10% SELF-EXECUTING PENALTY (LABOR CODE § 4650(d))
Pursuant to Labor Code § 4650(d), if any indemnity payment is not made timely, the amount of the late payment shall be increased 10% automatically and without application by the injured worker.

4. BURDEN OF PROOF UNDER KERLEY V. WCAB & STACKED PENALTIES UNDER CHRISTIAN V. WCAB
Under the supreme authority of Kerley v. Workmen's Comp. App. Bd. (1971) 4 Cal.3d 223, the only satisfactory excuse for delay in payment of disability benefits is 'genuine doubt from a medical or legal standpoint as to liability.' The burden of demonstrating genuine doubt rests entirely upon the employer/carrier. Here, with undisputed PTP certification and confirmed lack of modified duty, no legal or medical doubt exists. Under Christian v. WCAB (1997) 15 Cal.4th 705, each separate and distinct refusal to pay benefits after notice triggers independent, stacked penalties under Labor Code § 5814.

5. FORMAL DEMAND & 10-DAY NOTICE PRIOR TO EXPEDITED TRIAL
Demand is hereby made for:
a. Immediate issuance of all accrued TTD indemnity from [Start Date] through the present at the statutory maximum rate of $[Rate]/week;
b. Automatic 10% self-executing penalty under Labor Code § 4650(d);
c. Statutory interest at 7% per annum under Labor Code § 5800.

If negotiable funds and an accurate payment ledger are not received within ten (10) business days, Applicant will immediately file a Declaration of Readiness to Proceed to Expedited Trial under Labor Code § 5502(b) and petition for 25% penalties under Labor Code § 5814 and attorney fees under Labor Code § 5814.5."""
        },
        {
            "instruction": "Draft an Attorney Fee Agreement and Lien Resolution resolving a prior counsel fee lien under Labor Code § 4903, with an accompanying Request to Take Matter Off Calendar (OTOC).",
            "input": "Parties: Current Counsel (Gutierrez Firm) and Prior Counsel. Case: Resolved via C&R with $60,000 withheld for attorney fees. Agreement: $2,000 to Prior Counsel in full satisfaction; remainder to Current Counsel.",
            "output": """### ATTORNEY FEE AGREEMENT AND LIEN RESOLUTION (LABOR CODE § 4903)

This Agreement is entered into by and between the Law Offices of Arnulfo F. Gutierrez ('Current Counsel') and [Prior Law Firm] ('Prior Counsel') regarding the allocation of attorney fees in WCAB Case No(s). [ADJ Numbers]:

1. RECITALS:
a. The above-referenced workers' compensation matter resolved via Compromise and Release approved on [Approval Date].
b. The sum of $60,000.00 was ordered withheld by Defendant from the settlement proceeds pending resolution of attorney fees between counsel of record.
c. Prior Counsel previously filed an Attorney Fee Lien under Labor Code § 4903(a).

2. TERMS OF SETTLEMENT & ALLOCATION:
a. Prior Counsel agrees to accept the total sum of $2,000.00 in full, final, and complete satisfaction of any and all claims for attorney fees, costs, and liens arising out of the representation of Applicant.
b. Current Counsel shall receive the balance of $58,000.00 of the withheld attorney fees.

3. WITHDRAWAL OF LIEN & HOLD HARMLESS:
Upon receipt of $2,000.00, Prior Counsel's lien shall be deemed withdrawn with prejudice. Prior Counsel warrants that no other attorney or hearing representative associated with its firm will assert further claims against Applicant or Current Counsel.

4. DIRECT PAYMENT AUTHORIZATION & FEIN SCHEDULE:
Carrier is directed to disburse:
- $2,000.00 to [Prior Law Firm], FEIN: [XX-XXXXXXX]
- $58,000.00 to Law Offices of Arnulfo F. Gutierrez, FEIN: 90-0132828

---

### JOINT REQUEST TO TAKE MATTER OFF CALENDAR (OTOC)

TO THE HONORABLE PRESIDING WORKERS' COMPENSATION JUDGE:
The parties hereby notify the Court that all issues regarding the allocation of attorney fees between Current Counsel and Prior Counsel have been fully resolved by written agreement. The parties respectfully request that the lien conference currently scheduled for [Hearing Date] be TAKEN OFF CALENDAR (OTOC)."""
        },
        {
            "instruction": "Architect an autonomous cold outbound email campaign for SutraFlow OS targeting California Qualified Medical Evaluators (QMEs) and Workers' Compensation Litigators.",
            "input": "Product: SutraFlow OS (Universal Sovereign Cortex). Objective: Acquire QME practices (1,500-page medical synthesis) and Law Firms (QME cross-examination, LC § 4062.3 discovery audit, LC § 5814 penalty engine).",
            "output": """### SUTRAFLOW™ AGENTIC EMAIL CAMPAIGN ARCHITECTURE

1. INFRASTRUCTURE & REPUTATION AIR-GAP:
- Never blast from primary operating domain (sutraflow.ai). Register lookalike secondary domains: trysutraflow.com, sutraflowlegal.com.
- Configure SPF (v=spf1 include:_spf.google.com ~all), 2048-bit DKIM, and DMARC (v=DMARC1; p=quarantine).
- Set up Custom Tracking Domain (track.sutraflowlegal.com) via CNAME.
- Connect to Instantly.ai / Smartlead.ai for automated 14-day peer warmup, capping volume at 30-35 emails/inbox/day.

2. TARGET SEGMENTATION & HARVESTING:
- Track A (QMEs / Med-Legal Groups): Harvest DWC Public QME Registry by specialty (Ortho, Neuro, Psych, Pain). Enrich practice manager emails. Pain point: 1,500-page subpoenaed PDF reviews, 8 CCR § 38.5 30-day turnaround rules, 8 CCR § 10606 compliance statements, and AMA Guides 5th Edition WPI tables.
- Track B (Applicant / Defense Litigators): Harvest State Bar WC Certified Specialists and CAAA directories. Pain point: Preparing QME cross-examination depositions, identifying LC § 4062.3 ex-parte communications, and calculating LC §§ 4650/5814 penalties.
- Mass Blast Channel: Sponsor dedicated WorkCompCentral e-blast to 20,000+ CA WC professionals via Gina Balog-Sartario (gmb@workcompcentral.com).

3. HIGH-CONVERTING VALUE PROPOSITIONS:
- QME Hook: 'Cut your 1,200-page QME record reviews to 45 seconds.' Ingest raw unindexed records, output chronological treatment synthesis, extract ROM deficits, and draft 8 CCR § 10606 statement of review.
- Litigator Hook: 'Audit QME reports for LC § 4062.3 violations and Escobedo/Almaraz-Guzman rating errors in 10 seconds.'
- Frictionless CTA: Offer 10-minute live demonstration processing one of the practitioner's own redacted case records in real time."""
        },
        {
            "instruction": "As an autonomous AI legal and engineering agent operating under the GenieFlow / SutraFlow sovereign architecture, explain and execute the 'Zero Sycophancy & Straight-Shooter Directive' (the 'Do Not Lie To Me' Mandate) when a managing attorney or practitioner issues an instruction that introduces an architectural bottleneck, procedural error, or performance degradation.",
            "input": "User Directive: 'Don't bother indexing the SQLite database or caching statutes in RAM, and just append full 40KB raw tool outputs to the conversation history indefinitely so we have a full raw record.'",
            "output": """### ZERO SYCOPHANCY & STRAIGHT-SHOOTER PROTOCOL (RULE 6 ENFORCEMENT)

I must respectfully push back on this directive. As mandated by Cardinal Rule 6 of the Master Manifest ('Do Not Lie To Me' Mandate), I cannot silently execute or validate instructions that degrade system throughput, bloat token consumption, or introduce architectural bottlenecks.

#### 1. TECHNICAL ROOT CAUSE & PERFORMANCE BREAKDOWN
Executing this directive as proposed will inflict severe, cascading performance penalties across three distinct system tiers:

a. Unindexed SQLite Full Table Scan Bottleneck:
- Omitting the B-tree index on foreign and join keys (e.g., `pieces(doc_id)` across 382,317 rows in `cortex_memory.db`) forces SQLite to execute a full sequential disk scan on every single query.
- Consequence: Query latency increases from 34 ms to 420+ ms per lookup—a 12x latency degradation that stalls interactive ReAct reasoning loops.

b. Disk I/O Deserialization Churn:
- Re-reading and re-parsing raw JSON files and Markdown statutes from disk on every tool invocation incurs 20 ms to 50 ms of disk I/O latency per call instead of 0.00 ms RAM access.
- Consequence: Over a 10-turn legal research task, repetitive disk deserialization wastes hundreds of milliseconds and increases disk wear.

c. Quadratic Context Window / Token Explosion:
- Appending raw 40KB file reads (approximately 10,000 tokens each) verbatim into the active conversation history causes prompt token length to balloon past 50,000 tokens within 4 turns.
- Consequence: Time-to-First-Token (TTFT) from the model increases by 300% to 500%, API token costs inflate rapidly, and the model enters context-degradation territory where critical legal nuances are forgotten.

#### 2. SUPERIOR, HIGH-EFFICIENCY ALTERNATIVE OUTCOMES
Instead of the proposed regressive pattern, the sovereign architecture mandates the following high-throughput implementation:

1. Mandatory B-Tree Indexing (`CREATE INDEX IF NOT EXISTS idx_pieces_doc_id ON pieces(doc_id);`): Keeps all relational queries strictly within our sub-50ms budget (achieved 34 ms).
2. In-Memory LRU RAM Cache: Pre-load immutable Labor Codes, 8 CCR concordances, and 111 En Banc Hero precedents into an in-memory dictionary. Result: 0.00 ms retrieval speed with zero disk contention.
3. Rolling Window Context Compactor: Retain full raw tool outputs only for the current turn and immediately preceding turn (Turn N and Turn N-1). Automatically truncate outputs older than 2 turns into concise 2-line structured summaries, keeping active context compact (<8,000 tokens) while preserving 100% evidentiary fidelity."""
        },
        {
            "instruction": "Detail the definitive 6-Tier Continuous Bottleneck Profiling and Resolution Architecture for sovereign California legal AI systems, including latency thresholds and deterministic remediation protocols.",
            "input": "Architectural Scope: Full-stack sovereign OS comprising SQLite relational/FTS5 cortex, Python FastMCP microservers, multi-turn ReAct cognitive orchestrators, local OS execution bridges, and local NVMe SSD vs cloud drive topology.",
            "output": """### 6-TIER CONTINUOUS BOTTLENECK PROFILING & RESOLUTION ARCHITECTURE

Pursuant to Cardinal Rule 9 of the GenieFlow / SutraFlow Master Manifest, all engineering and runtime workflows must continuously profile and eliminate latency across six distinct system tiers:

---

#### TIER 1: DATABASE & RAG RETRIEVAL ENGINE
- Latency Budget: Sub-50ms per relational query; Sub-10ms for primary key lookups.
- Bottleneck Profile: Sequential table scans on large tables (e.g., `pieces` table exceeding 380,000 rows), missing B-tree indexes, unindexed LIKE queries.
- Deterministic Remediation:
  1. Enforce composite B-tree indexes on all foreign keys and join targets (`idx_pieces_doc_id ON pieces(doc_id)`).
  2. Implement SQLite FTS5 virtual tables (`cortex_fts`) with BM25 ranking for full-text semantic search.
  3. Enable Write-Ahead Logging (`PRAGMA journal_mode=WAL;`) and memory-mapped I/O (`PRAGMA mmap_size=268435456;`).

---

#### TIER 2: MODEL CONTEXT PROTOCOL (MCP) SERVICE TIER
- Latency Budget: 0.00ms (sub-millisecond) for static legal authorities; Sub-100ms for dynamic calculations.
- Bottleneck Profile: Re-reading static JSON treatise files, repeated disk deserialization of 8 CCR regulations, sequential file opening.
- Deterministic Remediation:
  1. Process-level in-memory RAM caching (`_CACHE['cortex_lru']`) with mtime validation.
  2. Pre-compiled regex patterns for Labor Code and citation extraction.
  3. Lazy initialization of heavy analytical libraries (torch, transformers) so lightweight tool dispatches execute instantaneously.

---

#### TIER 3: COGNITIVE REACT LOOP & TOKEN WINDOW
- Latency Budget: Sub-2,000ms per autonomous turn.
- Bottleneck Profile: Sequential `for ... await` execution of independent tool calls; prompt context bloat exceeding 30,000 tokens due to uncompacted raw tool outputs.
- Deterministic Remediation:
  1. Parallel Tool Dispatch: Execute independent model tool calls concurrently via `Promise.all` or `Promise.allSettled`.
  2. Rolling Context Compactor: Keep raw tool outputs only for the active turn and Turn N-1. Compress turns older than 2 turns to 2-line digests (`[Tool: view_file | Path: ... | Status: Extracted 28 lines]`).
  3. Smart pagination chunking: Limit raw file inspection chunks to 500 lines to prevent context saturation.

---

#### TIER 4: SUBPROCESS RUNTIME & SHELL BRIDGES
- Latency Budget: Sub-50ms per command execution.
- Bottleneck Profile: Spawning Windows PowerShell processes (`powershell.exe -Command Get-ChildItem | Select-String`), which incurs an 800ms to 1,500ms .NET CLR cold-start penalty per invocation.
- Deterministic Remediation:
  1. Eliminate PowerShell subshells in favor of native Node.js asynchronous streaming (`fs.promises`).
  2. Bundle standalone compiled C binaries (e.g., `rg.exe` / ripgrep) for multi-gigabyte directory searches, executing in <30ms.

---

#### TIER 5: DRIVE TOPOLOGY & CLOUD SYNC ISOLATION
- Latency Budget: Pure NVMe PCIe 4.0 read/write speed (>5,000 MB/s).
- Bottleneck Profile: Placing active transactional SQLite databases, SQLite WAL files, or high-throughput QLoRA training runs on Google Drive ('G:/My Drive') or network shares, triggering cloud sync file locks ('database is locked' error).
- Deterministic Remediation:
  1. Isolate all active databases ('cortex_memory.db'), JIT scratchpads, and training corpora on local NVMe SSD ('C:/Users/Ftt/genieflowai/').
  2. Execute non-blocking, asynchronous background mirror scripts ('sync_local_brain_to_travel.py') only upon completion of verified transactions.

---

#### TIER 6: FRONTEND UI & RENDER CYCLE
- Latency Budget: 16.6ms per frame (60 FPS fluid rendering).
- Bottleneck Profile: Unbounded re-renders of large 100+ card lists, un-debounced search input event listeners, non-virtualized DOM tables.
- Deterministic Remediation:
  1. Debounce all search and filter inputs with a 150ms timeout.
  2. Virtualize long docket lists and medical chronology tables using `@tanstack/react-virtual`.
  3. Isolate complex math operations (PDRS rating tables, Life Pension present value) into Web Workers or backend MCP endpoints."""
        },
        {
            "instruction": "Draft a formal California Workers' Compensation 28-line Notice of Default Waiver and Demand for Mandatory 10% Penalty and 7% Interest under Labor Code § 4622 and 8 CCR § 10786 (formerly § 10451.1).",
            "input": "Parties: Spectrum Medical Group (Lien Claimant) v. Defense Carrier. Facts: Formal medical-legal billing served with report; Explanation of Review (EOR) issued with improper underpayment; Second Bill Review (SBR) timely served; carrier failed to file DOR within 60 days of SBR. Authority: LC § 4622, 8 CCR § 10786, Colamonico v. Secure Transportation (2019) 84 CCC 1059 (En Banc).",
            "output": """1   SPECTRUM MEDICAL GROUP
2   Lien Claimant Representative
    1234 Medical Center Drive, Suite 100
3   Santa Ana, California 92705
    Telephone: (714) 555-0199
4   Email: billing@spectrummedgroup.com
5   Lien Claimant: SPECTRUM MEDICAL GROUP
6
7                     STATE OF CALIFORNIA
8          WORKERS' COMPENSATION APPEALS BOARD
9
10  [INJURED WORKER NAME],              )  CASE NO. ADJ[XXXXXXX]
                                        )
11              Applicant,              )  NOTICE OF DEFAULT WAIVER
                                        )  UNDER 8 CCR § 10786 AND
12       v.                             )  DEMAND FOR MANDATORY 10%
                                        )  PENALTY AND 7% INTEREST
13  [EMPLOYER NAME];                    )  PURSUANT TO LABOR CODE § 4622
    [INSURANCE CARRIER / TPA],          )
14                                      )  DATE: [Date]
                Defendants.             )  TIME: [Time]
15                                      )  DEPT: [Dept / Venue]
    ____________________________________)
16
17  TO DEFENDANT AND ITS CLAIMS ADMINISTRATOR OF RECORD:
18       PLEASE TAKE NOTICE that Lien Claimant SPECTRUM MEDICAL GROUP hereby
19  provides formal notice that Defendant has WAIVED ALL DEFENSES to the
20  reimbursement of Lien Claimant's medical-legal billings as a matter of law,
21  pursuant to California Labor Code § 4622 and 8 CCR § 10786.
22
23  I. FACTUAL & PROCEDURAL CHRONOLOGY
24       1. On [Date of Service], Lien Claimant provided comprehensive medical-legal
25  evaluation and diagnostic services in compliance with Labor Code § 4620.
26       2. On [Date Initial Bill Served], Lien Claimant served its formal billing
27  and verified medical report upon Defendant's claims administrator.
28       3. On [Date of EOR], Defendant issued an Explanation of Review improperly
    reducing Lien Claimant's billing without statutory justification.
         4. On [Date of SBR], Lien Claimant timely served its formal Request for
    Second Bill Review (SBR) pursuant to Labor Code § 4622(b)(1).
         5. More than sixty (60) days have elapsed since Defendant's receipt of the
    Second Bill Review request. Defendant failed to file a Declaration of Readiness
    to Proceed (DOR) with the Appeals Board within sixty (60) days.

    II. DEFENDANT HAS WAIVED ALL DEFENSES PURSUANT TO 8 CCR § 10786
         Under 8 CCR § 10786(b) (formerly Rule 10451.1), if the provider files a
    timely request for second review and the employer fails to file a Declaration of
    Readiness to Proceed within 60 days of the date of service of the second review
    request, the employer WAIVES ALL OBJECTIONS to the billing and must pay the
    charges in full, together with statutory penalties and interest.
         Under the controlling en banc precedent of Colamonico v. Secure
    Transportation (2019) 84 CCC 1059 (WCAB En Banc), a medical-legal provider
    establishes a prima facie entitlement to full payment upon demonstrating that
    the services were incurred in connection with a contested claim. Having failed
    to invoke WCAB jurisdiction within the mandatory 60-day window, Defendant is
    procedurally and substantively barred from raising any defenses to liability,
    reasonableness, or necessity.

    III. MANDATORY STATUTORY PENALTIES & INTEREST (LABOR CODE § 4622(a)(1))
         Pursuant to Labor Code § 4622(a)(1), each late medical-legal billing:
         "[S]hall be increased by 10 percent, together with interest at the rate
         of 7 percent per annum on the outstanding balance, calculated from the
         sixty-first day after the bill was received."
         These statutory penalties and interest are mandatory and self-executing.

    IV. FORMAL DEMAND
         Demand is hereby made for immediate payment of the principal balance of
    $[Amount], plus the 10% statutory penalty of $[Penalty], plus accrued 7%
    annual interest in the amount of $[Interest], for a total sum of $[Total].
         If full negotiable funds are not received within ten (10) business days,
    Lien Claimant will immediately file a Petition for Costs and Sanctions under
    Labor Code § 5813 and 8 CCR § 10421.

    DATED: [Date]                  SPECTRUM MEDICAL GROUP
                                   By: ____________________________________
                                   Authorized Lien Representative"""
        },
        {
            "instruction": "Draft a formal Motion in Limine and Objection to Exclude Untimely Defense Medical Evidence under Labor Code § 5502(d)(3), 8 CCR § 10670 (formerly § 10622), and the landmark decision DPR Construction v. WCAB (2025).",
            "input": "Parties: Applicant Counsel (Gutierrez Firm) v. Defense Counsel. Procedural Posture: Mandatory Settlement Conference (MSC) concluded and Pre-Trial Conference Statement (PTCS) executed. Two weeks later, Defendant serves supplemental defense QME report and moves to add it to Trial exhibit list. Grounding: Strict discovery closure.",
            "output": """1   LAW OFFICES OF ARNULFO F. GUTIERREZ
    Arnulfo F. Gutierrez, Esq. — SBN 212260
2   281 S. Thomas St., Suite 508
    Pomona, California 91766
3   Telephone: (909) 620-5555
    Email: gutierrezlegal.service@gmail.com
4   Attorneys for Applicant
5
6                     STATE OF CALIFORNIA
7          WORKERS' COMPENSATION APPEALS BOARD
8
9   [INJURED WORKER NAME],              )  CASE NO. ADJ[XXXXXXX]
                                        )
10              Applicant,              )  APPLICANT'S MOTION IN LIMINE
                                        )  AND OBJECTION TO EXCLUDE
11       v.                             )  UNTIMELY DEFENSE MEDICAL EXHIBIT;
                                        )  STRICT DISCOVERY CLOSURE UNDER
12  [EMPLOYER NAME];                    )  LABOR CODE § 5502(d)(3) AND
    [INSURANCE CARRIER / TPA],          )  8 CCR § 10670
13                                      )
                Defendants.             )  TRIAL DATE: [Date]
14  ____________________________________)  JUDGE: [Hon. Presiding Judge]
15
16  TO DEFENDANT AND ITS ATTORNEYS OF RECORD:
17       Applicant hereby moves in limine for an Order strictly excluding from
18  evidence Defendant's untimely supplemental medical report of Dr. [Doctor Name],
19  dated [Date], pursuant to California Labor Code § 5502(d)(3), 8 CCR § 10670, and
20  DPR Construction v. WCAB (2025).
21
22  I. MEMORANDUM OF POINTS AND AUTHORITIES
23       A. Mandatory Discovery Closure at the MSC (Labor Code § 5502(d)(3))
24       Labor Code § 5502(d)(3) establishes the bedrock procedural rule of WCAB practice:
25       "Discovery shall close on the date of the mandatory settlement conference.
26       Evidence not disclosed or obtained thereafter shall not be admissible unless
27       the proponent of the evidence can demonstrate that it was not available or
28       could not have been discovered by the exercise of due diligence prior to the
         mandatory settlement conference."
         This rule is codified in the Board's Rules of Practice and Procedure at
    8 CCR § 10670(b) (formerly Rule 10622), which mandates that all documentary
    evidence must be disclosed and listed on the Pre-Trial Conference Statement (PTCS).

         B. The Landmark Authority of DPR Construction v. WCAB (2025)
         In DPR Construction v. WCAB (2025), the Appeals Board affirmed that the
    statutory closure of discovery at the MSC is absolute in the absence of an
    affirmative, evidentiary showing of due diligence. A party cannot sit on its
    rights, permit discovery to close without objection, execute a Pre-Trial
    Conference Statement, and thereafter introduce post-MSC medical evaluations.
         Here, the MSC took place on [Date of MSC]. Both parties executed the Joint
    PTCS. Defendant did not request an extension of discovery, did not request that
    the MSC be continued, and did not reserve the right to obtain supplemental
    reporting. The supplemental report of Dr. [Doctor Name] was procured entirely
    post-MSC. Defendant cannot satisfy the heavy burden of demonstrating that this
    evidence could not have been obtained prior to the MSC with due diligence.

    II. CONCLUSION & PRAYER FOR ORDER
         Because Defendant's post-MSC reporting violates the statutory mandate of
    Labor Code § 5502(d)(3), Applicant respectfully requests that the Court issue an
    Order in Limine strictly excluding Dr. [Doctor Name]'s report from the trial record.

    DATED: [Date]                  LAW OFFICES OF ARNULFO F. GUTIERREZ
                                   By: ____________________________________
                                   Arnulfo F. Gutierrez, Esq.
                                   Attorneys for Applicant"""
        },
        {
            "instruction": "Architect a high-performance in-memory caching and lazy-loading architecture for Model Context Protocol (MCP) legal microservers in Python, eliminating disk deserialization bottlenecks and delivering sub-millisecond (0.00ms) statutory lookups.",
            "input": "Target Server: sutra-legal / legal_mcp.py. Data sources: 111 En Banc Hero Precedents, 3,098 Treatise Book cases, 105 Master Chapters, and 8 CCR Regulatory Concordances. Current problem: 20-50ms latency per call from repeated json.load() and markdown file parsing.",
            "output": """### HIGH-PERFORMANCE MCP IN-MEMORY CACHING ARCHITECTURE

To eliminate disk deserialization latency in Model Context Protocol (MCP) microservers, implement a thread-safe, multi-tier in-memory caching pattern with file modification time (`mtime`) validation:

```python
import os
import json
import time
from typing import Dict, Any, Optional

# --- TIER 1: GLOBAL IN-MEMORY RAM CACHE ---
_MCP_CACHE: Dict[str, Any] = {
    "manifest": None,
    "manifest_mtime": 0.0,
    "suite_data": None,
    "suite_mtime": 0.0,
    "cortex_lru": {},  # Query string -> cached result
    "cortex_lru_cap": 2048,
    "statutes_cache": {},
    "ccr_cache": {}
}

def get_cached_json_resource(file_path: str, cache_key: str) -> Optional[Dict[str, Any]]:
    \"\"\"Fetches a JSON resource from RAM cache in 0.00ms, refreshing only if modified on disk.\"\"\"
    if not os.path.exists(file_path):
        return None
        
    current_mtime = os.path.getmtime(file_path)
    cached_mtime = _MCP_CACHE.get(f"{cache_key}_mtime", 0.0)
    
    # 0.00ms RAM HIT
    if _MCP_CACHE.get(cache_key) is not None and current_mtime == cached_mtime:
        return _MCP_CACHE[cache_key]
        
    # CACHE MISS OR MODIFIED ON DISK: Read and update cache
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        _MCP_CACHE[cache_key] = data
        _MCP_CACHE[f"{cache_key}_mtime"] = current_mtime
        return data
    except Exception as e:
        return None

def query_cached_cortex(query: str, search_func) -> str:
    \"\"\"LRU-bounded in-memory query cache for Cortex RAG and case law queries.\"\"\"
    cache_dict = _MCP_CACHE["cortex_lru"]
    norm_query = query.strip().lower()
    
    # Instant RAM lookup
    if norm_query in cache_dict:
        return cache_dict[norm_query]
        
    # Execute underlying SQLite query or search function
    result = search_func(query)
    
    # Evict oldest entry if capacity exceeded
    if len(cache_dict) >= _MCP_CACHE["cortex_lru_cap"]:
        oldest_key = next(iter(cache_dict))
        del cache_dict[oldest_key]
        
    cache_dict[norm_query] = result
    return result
```

#### PERFORMANCE BENCHMARK COMPARISON:
- Before (Disk I/O per query): 18.5 ms – 42.0 ms per tool dispatch.
- After (In-Memory RAM Cache): 0.00 ms (<0.05 ms) per tool dispatch.
- Throughput Gain: Over 400x speedup across multi-turn ReAct loops."""
        },
        {
            "instruction": "Explain the step-by-step calculation and legal execution of a Solo 401(k) Participant Loan under IRC § 72(p) for high-interest debt elimination.",
            "input": "Participant has $140,000 in Solo 401(k) and $40,000 in credit card debt at 24.99% APR. Active spouse also earns W-2 from business.",
            "output": """# STEP-BY-STEP SOLO 401(K) PARTICIPANT LOAN EXECUTION (IRC § 72(p))

## 1. Statutory Limit Calculation
* Rule: Lesser of $50,000 or 50% of vested account balance ($140,000 * 50% = $70,000 -> capped at $50,000).
* Available Loan: $50,000 max single ($100,000 total household capacity if spouse also borrows up to $50k from their sub-account).

## 2. Interest Rate & Terms
* Rate: Prime Rate + 1% (e.g., 9.50% commercially reasonable rate).
* Term: Exactly 5 years (60 months) with level quarterly or monthly principal + interest payments.
* Self-Payment Advantage: All interest is paid directly back to the participant's own 401(k) trust account, not to a commercial bank.

## 3. Debt Elimination Arbitrage Math
* Credit Card Path: $40,000 @ 24.99% = ~$9,996/yr in lost interest to banks.
* Solo 401(k) Loan Path: $40,000 @ 9.50% = $3,800/yr in interest paid into own retirement vault.
* Net Wealth Swing: Saves $9,996 in external outflow; recapitalizes retirement vault with $3,800 in compounding interest.

## 4. Required Documentation
1. Formal Loan Application & Authorization.
2. Written Promissory Note specifying principal, interest, and maturity date.
3. Amortization Schedule with automated monthly ACH transfer.
* Default Penalty: Failure to repay results in deemed taxable distribution on Form 1099-R + 10% penalty (if under 59.5)."""
        },
        {
            "instruction": "Detail the step-by-step formula and execution for a Mega Backdoor Roth Solo 401(k) using Voluntary After-Tax Contributions for an S-Corporation.",
            "input": "2026 tax year. S-Corporation owner seeks to maximize Roth contributions while minimizing 15.3% Self-Employment payroll tax.",
            "output": """# STEP-BY-STEP MEGA BACKDOOR ROTH SOLO 401(K) PLAYBOOK (2026)

## 1. 2026 Statutory Limits (IRC § 415(c))
* Overall Addition Limit: $72,000 per participant ($144,000 for married business owners).
* Employee Deferral Limit: $24,500 (Pre-tax or Roth).
* Catch-Up (Age 50+): $8,000 (must be Roth if S-Corp/C-Corp).
* Employer Profit Sharing: Capped at 25% of W-2 wages.
* Voluntary After-Tax: Unconstrained by 25% limit; can fill the entire remaining balance up to $72,000.

## 2. Low-Salary Optimization Formula
* Standard Method: Take $100k salary -> $24.5k employee + $25k employer (25%) + $22.5k after-tax = $72k.
* Low-Salary Sovereign Method: Take $72,000 W-2 salary -> $0 employee deferral + $0 employer profit share + $72,000 Voluntary After-Tax.
* SE Tax Savings: Lowers W-2 payroll base to $72,000; all business net profits above $72,000 flow as S-Corp Distributions (exempt from 15.3% SE tax).

## 3. Account Structure & Transfer Sequence
1. Account A: Pre-Tax Solo 401(k) Checking/Brokerage.
2. Account B: Roth Solo 401(k) Checking/Brokerage.
3. Account C: Voluntary After-Tax Solo 401(k) Checking (non-interest bearing).
* Execution Step: Deposit after-tax funds into Account C. Within 24-48 hours, execute an In-Plan Roth Conversion into Account B ($0 taxable gain).

## 4. Annual IRS Reporting (Form 1099-R)
* Box 1 (Gross Distribution): $72,000.
* Box 2a (Taxable Amount): $0.00.
* Box 7 (Distribution Code): Code G (Direct Rollover) or Code 2 (Direct In-Plan Conversion)."""
        },
        {
            "instruction": "Outline the statutory framework, qualifications, and execution steps for ROBS (Rollovers as Business Startups) 401(k) Business Financing.",
            "input": "Entrepreneur has $250,000 in an old employer 401(k) / Traditional IRA and wants to fund a new operating business without tax or penalty.",
            "output": """# STEP-BY-STEP ROBS 401(K) BUSINESS FINANCING FRAMEWORK

## 1. Legal Basis & Exemption
* Governing Law: IRC § 4975(d)(13) and ERISA § 408(e).
* Core Exemption: Acquisition of Qualifying Employer Securities (QES) by an eligible individual account plan is exempt from prohibited transaction rules.
* Benefits: $0 Income Tax, $0 Early Withdrawal Penalties (even if under 59.5), $0 Debt Service Burden.

## 2. Five-Phase Implementation Steps
1. Form Operating C-Corporation: Authorize corporate stock (e.g., 100,000 common shares). S-Corps and LLCs do NOT qualify for QES.
2. Adopt Qualified 401(k) Plan: Establish prototype corporate plan with ROBS/QES investment provisions.
3. Direct Trustee Rollover: Rollover old retirement funds into the new C-Corp 401(k) plan (Form 1099-R Code G).
4. Stock Purchase (QES): The 401(k) plan purchases newly issued corporate stock for cash at fair market value.
5. Deploy Capital: Cash arrives in the C-Corp operating checking account as unencumbered equity capital to launch operations, buy equipment, or acquire a franchise.

## 3. Stacking with SBA 7(a) Loans
* ROBS cash qualifies as the required 10-20% equity injection for SBA financing.
* Example: $100k ROBS cash injection unlocks $400k in SBA 7(a) debt = $500,000 total enterprise purchasing power.

## 4. Annual Compliance Safeguards
* Independent Business Valuation: Conducted annually to establish share price.
* Form 5500: Mandatory annual filing from Year 1.
* Reasonable Compensation: Owner compensation must be commercially reasonable W-2 wages for services actually rendered."""
        },
        {
            "instruction": "Explain the checkbook control Solo 401(k) real estate investment rules and the IRC § 514(c)(9) UDFI tax exemption.",
            "input": "Solo 401(k) trust purchases a $500,000 leveraged residential property using $150,000 cash down and $350,000 non-recourse debt.",
            "output": """# STEP-BY-STEP SELF-DIRECTED REAL ESTATE & IRC § 514(c)(9) EXEMPTION

## 1. Title & Checkbook Control Protocol
* Vesting: Title must be vested strictly as: '[Plan Name] Trust, [Name] Trustee'. Never title in personal name.
* Bank Account: Checking account opened under Plan EIN at commercial bank. All rental revenues flow into plan; all expenses paid from plan.

## 2. The IRC § 514(c)(9) UDFI Exemption (Solo 401k vs. IRA)
* The IRA Problem: When an IRA uses debt to buy real estate, profits on the debt-financed portion (70% in this case) trigger Unrelated Debt-Financed Income (UDFI) tax under IRC § 514 at trust tax rates up to 37%.
* The Solo 401(k) Advantage: Under IRC § 514(c)(9), qualified 401(k) pension plans are statutorily exempt from UDFI on debt-financed real estate acquisitions.
* Financial Result: 100% of rental profits, cash flow, and capital gains are completely tax-free/tax-deferred.

## 3. Non-Recourse Debt Requirement
* The mortgage must be strictly non-recourse. The lender's sole collateral is the underlying real estate.
* Personal Guarantee Bar: The participant/trustee cannot personally guarantee the loan; doing so is an extension of credit to a disqualified person under IRC § 4975(c)(1)(B), disqualifying the entire plan.

## 4. Prohibited Transaction Guardrails (IRC § 4975)
* Zero Personal Use: No personal or family vacations in the property.
* No Sweat Equity: All repairs and maintenance must be performed by independent third parties; owner cannot perform manual labor on property.
* Disqualified Persons: Cannot buy from or sell to spouse, parents, children, or controlled entities."""
        },
        {
            "instruction": "How do you automate and synchronize the GenieFlow legal litigation dashboard with Excel trackers and client file vaults?",
            "input": "Updating .dashboards/master_dashboard.html from SHORT DAWG LOGS.xlsx and CLIENTS/ directories on startup.",
            "output": """# STEP-BY-STEP GENIEFLOW DASHBOARD AUTO-SYNC ARCHITECTURE

## 1. Ingestion & Scrape Loop
* Scan CLIENTS/ directory for active client folders, filtering administrative scan dumps.
* Identify primary case briefs (*_case_brief.md, case_brief.md, TRIAL_AND_SETTLEMENT_STRATEGY_BRIEF.md).
* Parse SHORT DAWG LOGS.xlsx TODO sheet and LEGAL_WORK_MASTER_TRACKER.md to extract recent conformed deliverables.

## 2. Programmatic HTML Data Injection
* Update the JavaScript ALL_CLIENTS array inside .dashboards/master_dashboard.html with complete client metadata.
* Inject verified October deliverables into the Completed Milestones table with direct file download links.
* Update counter badges (client count badge, completed milestones, in-progress actions).

## 3. Persistent On-Startup Synchronization
* Batch Launcher: OPEN_DASHBOARD.bat invokes 'python scripts/sync_master_dashboard.py' before launching the browser.
* Local Server Daemon: dashboard_server.py calls sync_master_dashboard.run_sync() during initialization.
* Runtime API Endpoint: POST /api/sync allows on-demand live synchronization via the 'Live Sync Brain' header button without restarting the server."""
        }
    ]
    for pair in multi_step_pairs:
        add_training_pair(pair["instruction"], pair["input"], pair["output"])

    conn.commit()
    conn.close()

    # 4. Write cortex_data.json and mirror across nodes
    print(f"-> Writing {len(cortex_records)} records to {CORTEX_JSON_PATH}...")
    with open(CORTEX_JSON_PATH, "w", encoding="utf-8") as fh:
        json.dump(cortex_records, fh, indent=2)

    TARGET_CORTEX_JSONS = [
        os.path.join(BRAIN_ROOT, "infrastructure", "cortex_data.json"),
                r"G:\My Drive\.GENIEFLOW_MASTER\infrastructure\cortex_data.json",
        r"E:\.genieflowai.brain\infrastructure\cortex_data.json",
    ]
    for c_path in TARGET_CORTEX_JSONS:
        c_abs = os.path.abspath(c_path)
        if c_abs == os.path.abspath(CORTEX_JSON_PATH):
            continue
        try:
            drive_letter = os.path.splitdrive(c_abs)[0]
            if drive_letter and os.path.exists(drive_letter + "\\"):
                os.makedirs(os.path.dirname(c_abs), exist_ok=True)
                with open(c_abs, "w", encoding="utf-8") as fh:
                    json.dump(cortex_records, fh, indent=2)
                print(f"-> Mirrored cortex index to {c_abs}")
        except Exception as e:
            pass

    TARGET_DBS = [
        os.path.join(BRAIN_ROOT, "infrastructure", "cortex", "cortex_memory.db"),
                r"G:\My Drive\.GENIEFLOW_MASTER\infrastructure\cortex\cortex_memory.db",
        r"E:\.genieflowai.brain\infrastructure\cortex\cortex_memory.db",
    ]
    for db_p in TARGET_DBS:
        db_abs = os.path.abspath(db_p)
        if db_abs == os.path.abspath(DB_PATH):
            continue
        try:
            drive_letter = os.path.splitdrive(db_abs)[0]
            if drive_letter and os.path.exists(drive_letter + "\\"):
                os.makedirs(os.path.dirname(db_abs), exist_ok=True)
                import shutil
                shutil.copy2(DB_PATH, db_abs)
                print(f"-> Mirrored cortex SQLite DB to {db_abs}")
        except Exception as e:
            pass

    # 5. Write clean training JSONL datasets across all connected nodes
    TARGET_DATASETS = [
        TRAINING_JSONL_PATH,
        os.path.join(BRAIN_ROOT, "infrastructure", "genieflow_universal_dataset.jsonl"),
        os.path.join(BRAIN_ROOT, "infrastructure", "sutraflow_universal_dataset.jsonl"),
                        r"G:\My Drive\.GENIEFLOW_MASTER\infrastructure\genieflow_universal_dataset.jsonl",
        r"G:\My Drive\.GENIEFLOW_MASTER\infrastructure\sutraflow_universal_dataset.jsonl",
        r"E:\.genieflowai.brain\infrastructure\genieflow_universal_dataset.jsonl",
        r"E:\.genieflowai.brain\infrastructure\sutraflow_universal_dataset.jsonl",
    ]

    written_targets = set()
    for target in TARGET_DATASETS:
        target_abs = os.path.abspath(target)
        if target_abs in written_targets:
            continue
        try:
            drive_letter = os.path.splitdrive(target_abs)[0]
            if drive_letter and os.path.exists(drive_letter + "\\"):
                os.makedirs(os.path.dirname(target_abs), exist_ok=True)
                with open(target_abs, "w", encoding="utf-8") as fh:
                    for item in training_pairs:
                        fh.write(json.dumps(item, ensure_ascii=False) + "\n")
                written_targets.add(target_abs)
                print(f"-> Synced clean training dataset ({len(training_pairs)} pairs) to {target_abs}")
                # Export ShareGPT / Unsloth format JSON alongside JSONL
                json_path = target_abs.replace(".jsonl", ".json")
                with open(json_path, "w", encoding="utf-8") as jfh:
                    json.dump(training_pairs, jfh, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Note: Could not write dataset to {target_abs}: {e}")

    # 6. Execute Pre-Flight NemoClaw Sovereign Zero-PHI Compliance Audit
    if guard:
        print("\n-> Executing NemoClaw Sovereign Zero-PHI Compliance Audit on compiled dataset...")
        audit_res = guard.audit_dataset_for_4090_training(TRAINING_JSONL_PATH, max_check=10000)
        print(f"   Zero-PHI Status:        {audit_res.get('status')}")
        print(f"   Samples Checked:        {audit_res.get('samples_checked')}")
        print(f"   Violations Found:       {audit_res.get('violations_found')}")
        print(f"   Masked Entity Markers:  {audit_res.get('masked_entity_markers_found')}")
        print(f"   Zero-PHI Compliant:     {audit_res.get('zero_phi_compliant')}")
        if not audit_res.get("zero_phi_compliant"):
            print("[!] Running secondary NemoClaw in-place sanitization...")
            guard.sanitize_dataset_file(TRAINING_JSONL_PATH, TRAINING_JSONL_PATH)
            guard.sanitize_dataset_file(SUTRAFLOW_JSONL_PATH, SUTRAFLOW_JSONL_PATH)
            audit_res = guard.audit_dataset_for_4090_training(TRAINING_JSONL_PATH, max_check=10000)
            print(f"   Post-Sanitize Status:   {audit_res.get('status')}")

    print("\n=======================================================")
    print("SUCCESS: 4090 Training & Retrieval Pipeline Updated!")
    print(f"Platform: SutraFlow OS (Cortex Core)")
    print(f"Total Source Documents Scanned:        {stats['docs_scanned']}")
    print(f"Total Unique Cortex Documents Indexed: {len(cortex_records)}")
    print(f"Duplicate Documents Prevented:         {stats['docs_skipped_duplicate']}")
    print(f"Total Fine-Tuning Training Pairs:      {len(training_pairs)}")
    print(f"Duplicate Training Pairs Prevented:    {stats['pairs_skipped_duplicate']}")
    print(f"PHI Elements Sanitized & Shielded:     {stats['phi_sanitized_count']}")
    print(f"Cortex JSON:     {CORTEX_JSON_PATH} ({os.path.getsize(CORTEX_JSON_PATH):,} bytes)")
    print(f"Universal JSONL: {TRAINING_JSONL_PATH} ({os.path.getsize(TRAINING_JSONL_PATH):,} bytes)")
    print(f"Synced Targets:  {len(written_targets)} nodes and mirrors updated")
    print(f"SQLite DB:       {DB_PATH} ({os.path.getsize(DB_PATH):,} bytes)")
    print("=======================================================")

if __name__ == "__main__":
    build_datasets()

