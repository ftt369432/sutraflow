"""
SutraFlow Sovereign Agentic Obsidian & Memory Brain Vault MCP Server
Unified Multi-Harness Bridge for Antigravity, Claude Desktop, Cursor, and External Providers.

Transports Supported:
- SSE (Server-Sent Events) via http://<host>:<port>/sse (default: http://127.0.0.1:8000/sse)
- Streamable HTTP via http://<host>:<port>/mcp
- Stdio (standard in/out for local process execution)

Capabilities:
1. Agentic Obsidian Memory Vault:
   - query_brain_vault: Semantic/keyword retrieval across local markdown files, client facts, and case dockets.
   - save_brain_memory: Persist new structured markdown notes, facts, and tactical observations into the vault.
   - list_vault_clients: List all indexed clients and active case dossiers.
2. California Workers' Comp & Legal Cortex (30 Tools):
   - Labor Code & 8 CCR Concordance
   - PDRS Ratings, Life Pension, OMFS Medical-Legal
   - CCP Superior Court Litigation & Howell Damages
   - Pre-filing Anti-Sanction & Pleading Verification
3. Medical-Legal & Billing Calculations
4. Practice & Business Genesis Tooling
"""

import os
import sys
import json
import glob
import sqlite3
import argparse
from typing import Dict, Any, List, Optional
from mcp.server.mcpserver import MCPServer

# Initialize Unified Server
app = MCPServer(
    name="SutraFlow-Agentic-Obsidian-Vault",
    instructions=(
        "SutraFlow Agentic Obsidian & Legal Memory Vault. Provides grounded retrieval across "
        "local markdown case dossiers, persistent memory graphs, California Labor Code, 8 CCR regulations, "
        "medical-legal fee schedules, and anti-sanction pleading verification."
    )
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
_mcp_dir = os.path.dirname(__file__)
if _mcp_dir not in sys.path:
    sys.path.insert(0, _mcp_dir)

# Resolve Search Paths
VAULT_DIRS = [
    r"g:\My Drive\00 ALLEN",
    os.path.join(BASE_DIR, "knowledge"),
    os.path.join(BASE_DIR, "CLIENTS"),
    os.path.join(BASE_DIR, "AI_GENERATED_DOCS"),
    os.path.join(BASE_DIR, "01_RESEARCH"),
    r"E:\00 ALLEN"
]

CORTEX_DB_PATH = os.path.join(BASE_DIR, "infrastructure", "4090_training", "cortex_memory.db")
if not os.path.exists(CORTEX_DB_PATH):
    alt_db = os.path.join(BASE_DIR, "infrastructure", "cortex", "cortex_memory.db")
    if os.path.exists(alt_db):
        CORTEX_DB_PATH = alt_db

# -------------------------------------------------------------
# 1. Agentic Obsidian Vault Tools
# -------------------------------------------------------------

@app.tool()
def query_brain_vault(query: str, client_filter: str = "", max_results: int = 5) -> str:
    """
    Search the Agentic Obsidian Memory Vault across all markdown client fact sheets,
    research notes, precedent briefs, and legal knowledge bases.
    
    :param query: Keywords or concept to search for (e.g. 'impingement syndrome', 'penalty petition', 'MPN notice defect')
    :param client_filter: Optional client name to scope search (e.g. 'URENO', 'RAFOLS')
    :param max_results: Maximum matching snippets to return (default: 5)
    """
    results = []
    q_words = [w.lower() for w in query.split() if len(w) > 2]
    if not q_words:
        q_words = [query.lower()]

    # Collect Markdown Files
    target_files = []
    for d in VAULT_DIRS:
        if not os.path.exists(d):
            continue
        for root, _, files in os.walk(d):
            if client_filter and client_filter.lower() not in root.lower():
                continue
            for f in files:
                if f.endswith((".md", ".txt", ".json")):
                    target_files.append(os.path.join(root, f))
                    if len(target_files) >= 400:
                        break
            if len(target_files) >= 400:
                break

    for fpath in target_files:
        try:
            fname = os.path.basename(fpath)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            content_lower = content.lower()
            matches = sum(1 for w in q_words if w in content_lower)
            if matches > 0:
                score = matches
                if all(w in content_lower for w in q_words):
                    score += 5
                if client_filter and client_filter.lower() in fname.lower():
                    score += 10
                
                # Extract best window
                first_match = -1
                for w in q_words:
                    idx = content_lower.find(w)
                    if idx != -1:
                        first_match = idx
                        break
                
                start = max(0, first_match - 80) if first_match != -1 else 0
                snippet = content[start:start + 450].strip().replace("\n\n", "\n")
                results.append((score, fname, fpath, snippet))
        except Exception:
            continue

    results.sort(key=lambda x: x[0], reverse=True)
    if not results:
        return f"No records found in Agentic Obsidian Vault matching '{query}' (client filter: '{client_filter}')."

    out = [f"### 🧠 SutraFlow Agentic Obsidian Vault Matches for: '{query}' ({len(results[:max_results])} items)\n"]
    for idx, (sc, fname, path, snip) in enumerate(results[:max_results], 1):
        rel = os.path.relpath(path, BASE_DIR) if BASE_DIR in path else path
        out.append(f"**[{idx}] {fname}** (`{rel}`)\n```markdown\n{snip}...\n```\n")

    return "\n".join(out)

@app.tool()
def save_brain_memory(title: str, content: str, category: str = "notes", client_name: str = "") -> str:
    """
    Persist a verified fact, strategy observation, or legal synthesis into the Agentic Obsidian Vault.
    Saves directly as an indexed Markdown note accessible by any AI harness.
    
    :param title: Short title for the memory note
    :param content: Full text or markdown content of the insight/dossier
    :param category: Category folder (notes, case_strategy, medical_chronology, research)
    :param client_name: Optional client folder name to attach note to
    """
    clean_title = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in title.strip()).strip("_")
    if not clean_title:
        clean_title = "memory_note"

    if client_name:
        target_dir = os.path.join(BASE_DIR, "CLIENTS", client_name.upper())
    else:
        target_dir = os.path.join(BASE_DIR, "knowledge", category)

    os.makedirs(target_dir, exist_ok=True)
    out_file = os.path.join(target_dir, f"{clean_title}.md")

    timestamp = "2026-10-25"
    header = f"# {title}\n\n*Saved to SutraFlow Agentic Obsidian Vault: {timestamp} | Category: {category}*\n\n---\n\n"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(header + content.strip() + "\n")

    return f"Successfully saved to Agentic Obsidian Vault: `{os.path.relpath(out_file, BASE_DIR)}`"

@app.tool()
def list_vault_clients() -> str:
    """
    List all active client workspaces and case dossiers indexed in the Agentic Obsidian Vault.
    """
    client_dirs = []
    # Check G: Drive
    g_dir = r"g:\My Drive\00 ALLEN"
    if os.path.exists(g_dir):
        try:
            for item in os.listdir(g_dir):
                full = os.path.join(g_dir, item)
                if os.path.isdir(full):
                    client_dirs.append(f"- **{item}** (Google Drive: `g:\\My Drive\\00 ALLEN\\{item}`)")
        except Exception:
            pass

    # Check local CLIENTS
    local_clients = os.path.join(BASE_DIR, "CLIENTS")
    if os.path.exists(local_clients):
        for item in os.listdir(local_clients):
            full = os.path.join(local_clients, item)
            if os.path.isdir(full):
                client_dirs.append(f"- **{item}** (Local Workspace: `CLIENTS/{item}`)")

    if not client_dirs:
        return "No client directories currently indexed in vault."

    return "### 🗂️ SutraFlow Agentic Obsidian — Client Dossiers Index\n\n" + "\n".join(client_dirs[:40])

# -------------------------------------------------------------
# 2. Mount All Legal, Medical, and Finance Tools from Sub-Servers
# -------------------------------------------------------------
def _merge_tools_from(source_app, label=""):
    try:
        tools = source_app._tool_manager._tools
        for name, tool_obj in tools.items():
            if name not in app._tool_manager._tools:
                app.add_tool(tool_obj.fn, name=tool_obj.name, description=tool_obj.description)
        print(f"[*] Mounted {len(tools)} tools from {label}", file=sys.stderr)
    except Exception as e:
        print(f"[!] Warning: Could not import {label} tools: {e}", file=sys.stderr)

try:
    from src.mcp_servers.legal_mcp import app as legal_app
    _merge_tools_from(legal_app, "legal_mcp")
except Exception as e:
    print(f"[!] Warning: legal_mcp load error: {e}", file=sys.stderr)

try:
    from src.mcp_servers.medical_mcp import app as med_app
    _merge_tools_from(med_app, "medical_mcp")
except Exception as e:
    print(f"[!] Warning: medical_mcp load error: {e}", file=sys.stderr)

try:
    from src.mcp_servers.finance_mcp import app as fin_app
    _merge_tools_from(fin_app, "finance_mcp")
except Exception as e:
    print(f"[!] Warning: finance_mcp load error: {e}", file=sys.stderr)

try:
    from src.mcp_servers.genesis_mcp import app as gen_app
    _merge_tools_from(gen_app, "genesis_mcp")
except Exception as e:
    print(f"[!] Warning: genesis_mcp load error: {e}", file=sys.stderr)

# -------------------------------------------------------------
# 3. Server Startup & CLI Interface
# -------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SutraFlow Sovereign Agentic Obsidian MCP Server")
    parser.add_argument("--transport", choices=["stdio", "sse", "streamable-http"], default=os.environ.get("MCP_TRANSPORT", "sse"), help="Transport mode (default: sse)")
    parser.add_argument("--host", default=os.environ.get("MCP_HOST", "0.0.0.0"), help="Host address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=int(os.environ.get("MCP_PORT", "8000")), help="Network port (default: 8000)")
    args = parser.parse_args()

    total_tools = len(app._tool_manager._tools)
    print("=" * 60, file=sys.stderr)
    print(f"  🧠 SutraFlow Agentic Obsidian & Memory Vault MCP Server", file=sys.stderr)
    print(f"  Transport: {args.transport.upper()} | Interface: {args.host}:{args.port}", file=sys.stderr)
    print(f"  Available Tools: {total_tools} native tools registered", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    if args.transport == "sse":
        print(f"[*] SSE Endpoint live at: http://{args.host}:{args.port}/sse", file=sys.stderr)
        print(f"[*] Remote Tunnel Gateway: https://sutraflow.us/mcp", file=sys.stderr)
        app.run(transport="sse", host=args.host, port=args.port)
    elif args.transport == "streamable-http":
        print(f"[*] Streamable HTTP live at: http://{args.host}:{args.port}/mcp", file=sys.stderr)
        app.run(transport="streamable-http", host=args.host, port=args.port)
    else:
        app.run(transport="stdio")

