#!/usr/bin/env python
"""
GENIEFLOW AI: INTERACTIVE DEPOSITION HUD GENERATOR ENGINE
Author: Frank Ureno / Law Offices of Arnulfo Gutierrez
Compiles interactive, dual-screen HTML Deposition HUDs, plain text scripts, 
word documents, and court-ready PDFs for remote and in-person depositions.
"""

import os
import sys
import argparse
import re
import docx
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

HTML_TEMPLATE_SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DEPO COMMAND CENTER | {CLIENT_NAME} ({CASE_NOS})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg-dark: #0d1117;
      --card-bg: #161b22;
      --card-border: #30363d;
      --header-bg: #161b22;
      --nav-bg: #12161c;
      --search-bg: rgba(13, 17, 23, 0.88);
      --text-main: #f0f6fc;
      --text-muted: #8b949e;
      --q-bg: #1a202c;
      --q-border: #2d3748;
      --q-hover: #1e2636;
      --accent-blue: #58a6ff;
      --accent-blue-bg: rgba(88, 166, 255, 0.12);
      --accent-emerald: #3fb950;
      --accent-emerald-bg: rgba(63, 185, 80, 0.12);
      --accent-red: #f85149;
      --accent-red-bg: rgba(248, 81, 73, 0.12);
      --accent-amber: #d29922;
      --accent-amber-bg: rgba(210, 153, 34, 0.12);
      --accent-purple: #bc8cff;
      --accent-purple-bg: rgba(188, 140, 255, 0.12);
      --scratch-header: #1c2128;
      --scratch-bg: #161b22;
      --scratch-txt: #0d1117;
    }}

    [data-theme="light"] {{
      --bg-dark: #f6f8fa;
      --card-bg: #ffffff;
      --card-border: #d0d7de;
      --header-bg: #ffffff;
      --nav-bg: #f3f4f6;
      --search-bg: rgba(246, 248, 250, 0.88);
      --text-main: #1f2328;
      --text-muted: #656d76;
      --q-bg: #f8fafc;
      --q-border: #e2e8f0;
      --q-hover: #edf2f7;
      --accent-blue: #0969da;
      --accent-blue-bg: rgba(9, 105, 218, 0.1);
      --accent-emerald: #1a7f37;
      --accent-emerald-bg: rgba(26, 127, 55, 0.1);
      --accent-red: #cf222e;
      --accent-red-bg: rgba(207, 34, 46, 0.1);
      --accent-amber: #9a6700;
      --accent-amber-bg: rgba(154, 103, 0, 0.1);
      --accent-purple: #8250df;
      --accent-purple-bg: rgba(130, 80, 223, 0.1);
      --scratch-header: #eaeef2;
      --scratch-bg: #ffffff;
      --scratch-txt: #f6f8fa;
    }}

    body, nav, main, header, .card, .question-item, input, textarea {{
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }}

    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }}

    header {{
      background-color: var(--header-bg);
      border-bottom: 1px solid var(--card-border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      z-index: 100;
    }}

    .badge-lead {{
      background: linear-gradient(135deg, #1f6feb, #388bfd);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }}

    .case-title {{ display: flex; align-items: center; gap: 12px; }}
    h1 {{ font-size: 17px; font-weight: 700; color: var(--text-main); }}
    .case-meta {{ font-size: 12px; color: var(--text-muted); display: flex; gap: 14px; margin-top: 2px; }}
    .case-meta strong {{ color: var(--text-main); }}

    .header-actions {{ display: flex; align-items: center; gap: 14px; }}
    .progress-container {{
      display: flex; align-items: center; gap: 10px;
      background: rgba(255, 255, 255, 0.04);
      padding: 6px 12px; border-radius: 8px; border: 1px solid var(--card-border);
    }}
    .progress-bar-bg {{ width: 130px; height: 8px; background-color: #21262d; border-radius: 4px; overflow: hidden; }}
    .progress-bar-fill {{ height: 100%; background: linear-gradient(90deg, #2ea043, #3fb950); width: 0%; transition: width 0.3s ease; }}
    .progress-text {{ font-size: 11.5px; font-weight: 600; font-family: 'JetBrains Mono', monospace; color: var(--accent-emerald); }}

    .btn {{
      background-color: #21262d; color: var(--text-main);
      border: 1px solid var(--card-border); padding: 6px 12px;
      border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
    }}
    .btn:hover {{ background-color: #30363d; border-color: #8b949e; }}
    .btn-danger {{ color: var(--accent-red); border-color: rgba(248, 81, 73, 0.4); }}
    .btn-danger:hover {{ background-color: var(--accent-red-bg); }}

    .app-body {{ display: flex; flex: 1; height: calc(100vh - 65px); overflow: hidden; }}
    nav {{
      width: 280px; background-color: var(--nav-bg);
      border-right: 1px solid var(--card-border);
      display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
    }}
    .nav-group {{ padding: 14px 16px 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }}
    .nav-item {{
      display: flex; align-items: center; gap: 10px; padding: 9px 16px;
      color: var(--text-muted); text-decoration: none; font-size: 13px; font-weight: 500;
      border-left: 3px solid transparent; cursor: pointer; transition: all 0.15s;
    }}
    .nav-item:hover {{ background-color: rgba(255, 255, 255, 0.03); color: var(--text-main); }}
    .nav-item.active {{ background-color: var(--accent-blue-bg); color: var(--accent-blue); border-left-color: var(--accent-blue); font-weight: 600; }}
    .nav-pill {{ font-size: 10.5px; padding: 2px 6px; border-radius: 10px; font-weight: 600; margin-left: auto; }}

    main {{ flex: 1; overflow-y: auto; padding: 20px 32px 100px; scroll-behavior: smooth; }}
    .search-filter-bar {{
      position: sticky; top: 0; background: var(--search-bg);
      backdrop-filter: blur(12px); padding: 12px 0 16px; z-index: 50; display: flex; gap: 12px;
    }}
    .search-input {{
      flex: 1; background-color: var(--card-bg); border: 1px solid var(--card-border);
      color: var(--text-main); padding: 10px 16px; border-radius: 8px; font-size: 13.5px; outline: none;
    }}
    .search-input:focus {{ border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15); }}

    .card {{
      background-color: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }}
    .card-header {{
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }}
    .card-header h2 {{ font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; }}
    .card-subtitle {{ font-size: 12px; color: var(--text-muted); margin-top: -8px; margin-bottom: 14px; }}

    .trap-banner {{
      background: linear-gradient(90deg, rgba(248, 81, 73, 0.12), rgba(248, 81, 73, 0.04));
      border-left: 4px solid var(--accent-red); padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; font-size: 13px;
    }}
    .trap-banner strong {{ color: var(--accent-red); display: block; margin-bottom: 4px; font-size: 13.5px; }}

    .tip-banner {{
      background: linear-gradient(90deg, rgba(88, 166, 255, 0.12), rgba(88, 166, 255, 0.04));
      border-left: 4px solid var(--accent-blue); padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; font-size: 12.5px;
    }}
    .tip-banner strong {{ color: var(--accent-blue); }}

    .question-list {{ display: flex; flex-direction: column; gap: 8px; }}
    .question-item {{
      background-color: var(--q-bg); border: 1px solid var(--q-border);
      border-radius: 8px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 12px; transition: all 0.15s;
    }}
    .question-item:hover {{ border-color: #4a5568; background-color: var(--q-hover); }}
    .question-item.asked {{ background-color: rgba(63, 185, 80, 0.06); border-color: rgba(63, 185, 80, 0.35); opacity: 0.65; }}
    .question-item.asked .q-text {{ text-decoration: line-through; color: #94a3b8; }}

    .q-checkbox {{ margin-top: 3px; width: 17px; height: 17px; cursor: pointer; accent-color: var(--accent-emerald); }}
    .q-body {{ flex: 1; }}
    .q-badge {{ display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; text-transform: uppercase; }}
    .badge-danger {{ background: var(--accent-red-bg); color: var(--accent-red); }}
    .badge-info {{ background: var(--accent-blue-bg); color: var(--accent-blue); }}
    .badge-amber {{ background: var(--accent-amber-bg); color: var(--accent-amber); }}
    .badge-purple {{ background: var(--accent-purple-bg); color: var(--accent-purple); }}
    .q-text {{ font-size: 13.5px; font-weight: 500; color: var(--text-main); line-height: 1.45; }}
    .q-notes {{ font-size: 11.5px; color: #94a3b8; margin-top: 4px; font-style: italic; }}

    .q-actions {{ display: flex; align-items: center; gap: 6px; margin-left: 8px; }}
    .copy-btn {{
      background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-muted);
      border-radius: 5px; padding: 4px 8px; font-size: 11px; cursor: pointer; transition: all 0.2s;
    }}
    .copy-btn:hover {{ color: var(--text-main); border-color: var(--accent-blue); background-color: var(--accent-blue-bg); }}

    .scratchpad-container {{
      position: fixed; bottom: 0; right: 32px; width: 440px; background: var(--scratch-bg);
      border: 1px solid var(--card-border); border-bottom: none; border-radius: 12px 12px 0 0;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.5); z-index: 999; transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }}
    .scratchpad-container.collapsed {{ transform: translateY(calc(100% - 42px)); }}
    .scratchpad-header {{
      padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; background: var(--scratch-header); border-radius: 12px 12px 0 0; font-size: 13px; font-weight: 600;
    }}
    .scratchpad-body {{ padding: 14px; display: flex; flex-direction: column; gap: 10px; }}
    .scratchpad-textarea {{
      width: 100%; height: 180px; background: var(--scratch-txt); border: 1px solid var(--card-border);
      color: var(--text-main); padding: 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 12px; resize: none; outline: none;
    }}
    .scratchpad-footer {{ display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted); }}
  </style>
</head>
<body>
  <header>
    <div class="case-title">
      <span class="badge-lead">DEPO COMMAND CENTER</span>
      <div>
        <h1>{CLIENT_NAME} v. {DEFENDANTS}</h1>
        <div class="case-meta">
          <span>WCAB: <strong>{CASE_NOS}</strong></span>
          <span>Witnesses: <strong>{WITNESS_SUMMARY}</strong></span>
          <span>Def Atty: <strong>{DEFENSE_ATTORNEY}</strong></span>
        </div>
      </div>
    </div>
    <div class="header-actions">
      <div class="progress-container">
        <div class="progress-bar-bg"><div class="progress-bar-fill" id="progressFill"></div></div>
        <span class="progress-text" id="progressText">0% ASKED</span>
      </div>
      <button class="btn" id="themeToggleBtn" onclick="toggleTheme()" style="font-weight: 600;">☀️ Light Mode</button>
      <button class="btn btn-danger" onclick="resetQuestions()">🔄 Reset</button>
      <button class="btn" onclick="window.print()">🖨️ Print</button>
    </div>
  </header>

  <div class="app-body">
    <nav>
      {NAVIGATION_ITEMS}
    </nav>
    <main id="mainScroll">
      <div class="search-filter-bar">
        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search questions by keyword..." oninput="filterQuestions()">
      </div>
      {MAIN_CONTENT_SECTIONS}
    </main>
  </div>

  <div class="scratchpad-container collapsed" id="scratchpad">
    <div class="scratchpad-header" onclick="toggleScratchpad()">
      <span>📝 Live Depo Notes & Scratchpad</span>
      <span id="scratchToggleIcon">▲ Expand</span>
    </div>
    <div class="scratchpad-body">
      <textarea id="scratchText" class="scratchpad-textarea" placeholder="Type live witness notes here..." oninput="saveNotes()"></textarea>
      <div class="scratchpad-footer">
        <span id="saveStatus">Auto-saved locally</span>
        <div>
          <button class="btn" style="padding: 3px 8px; font-size: 11px;" onclick="copyNotes()">📋 Copy</button>
          <button class="btn btn-danger" style="padding: 3px 8px; font-size: 11px;" onclick="clearNotes()">🗑️ Clear</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const LS_KEY_CHECKED = '{CLIENT_NAME_CLEAN}_depo_checked';
    const LS_KEY_NOTES = '{CLIENT_NAME_CLEAN}_depo_notes';
    const LS_THEME = 'genieflow_depo_theme';

    let checkedMap = {{}};

    function initTheme() {{
      const saved = localStorage.getItem(LS_THEME) || 'dark';
      applyTheme(saved);
    }}

    function toggleTheme() {{
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(LS_THEME, next);
    }}

    function applyTheme(theme) {{
      const btn = document.getElementById('themeToggleBtn');
      if (theme === 'light') {{
        document.documentElement.setAttribute('data-theme', 'light');
        if (btn) btn.innerHTML = '🌙 Dark Mode';
      }} else {{
        document.documentElement.removeAttribute('data-theme');
        if (btn) btn.innerHTML = '☀️ Light Mode';
      }}
    }}

    function init() {{
      try {{
        const s = localStorage.getItem(LS_KEY_CHECKED);
        if (s) checkedMap = JSON.parse(s);
      }} catch(e) {{}}

      document.querySelectorAll('.q-checkbox').forEach((cb, idx) => {{
        cb.dataset.qid = idx;
        if (checkedMap[idx]) {{
          cb.checked = true;
          cb.closest('.question-item').classList.add('asked');
        }}
      }});

      const savedNotes = localStorage.getItem(LS_KEY_NOTES);
      if (savedNotes) document.getElementById('scratchText').value = savedNotes;

      updateProgress();
    }}

    function toggleQuestion(cb) {{
      const qid = cb.dataset.qid;
      const item = cb.closest('.question-item');
      if (cb.checked) {{
        item.classList.add('asked');
        checkedMap[qid] = true;
      }} else {{
        item.classList.remove('asked');
        delete checkedMap[qid];
      }}
      localStorage.setItem(LS_KEY_CHECKED, JSON.stringify(checkedMap));
      updateProgress();
    }}

    function updateProgress() {{
      const all = document.querySelectorAll('.q-checkbox');
      const checked = document.querySelectorAll('.q-checkbox:checked');
      const total = all.length;
      const done = checked.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      document.getElementById('progressFill').style.width = pct + '%';
      document.getElementById('progressText').innerText = `${{pct}}% ASKED (${{done}}/${{total}})`;
    }}

    function resetQuestions() {{
      if (confirm('Reset all asked checkmarks?')) {{
        checkedMap = {{}};
        localStorage.removeItem(LS_KEY_CHECKED);
        document.querySelectorAll('.q-checkbox').forEach(cb => {{
          cb.checked = false;
          cb.closest('.question-item').classList.remove('asked');
        }});
        updateProgress();
      }}
    }}

    function copyQ(btn) {{
      const text = btn.closest('.question-item').querySelector('.q-text').innerText;
      navigator.clipboard.writeText(text).then(() => {{
        const orig = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => {{ btn.innerText = orig; }}, 1200);
      }});
    }}

    function scrollToSection(id) {{
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({{ behavior: 'smooth' }});
      document.querySelectorAll('nav .nav-item').forEach(item => item.classList.remove('active'));
      const active = Array.from(document.querySelectorAll('nav .nav-item')).find(item => item.getAttribute('onclick') && item.getAttribute('onclick').includes(id));
      if (active) active.classList.add('active');
    }}

    function filterQuestions() {{
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      document.querySelectorAll('.question-item').forEach(item => {{
        item.style.display = item.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
      }});
    }}

    function toggleScratchpad() {{
      const pad = document.getElementById('scratchpad');
      const icon = document.getElementById('scratchToggleIcon');
      if (pad.classList.contains('collapsed')) {{
        pad.classList.remove('collapsed');
        icon.innerText = '▼ Collapse';
      }} else {{
        pad.classList.add('collapsed');
        icon.innerText = '▲ Expand';
      }}
    }}

    function saveNotes() {{
      localStorage.setItem(LS_KEY_NOTES, document.getElementById('scratchText').value);
      document.getElementById('saveStatus').innerText = 'Saved ' + new Date().toLocaleTimeString();
    }}

    function copyNotes() {{
      navigator.clipboard.writeText(document.getElementById('scratchText').value).then(() => alert('Notes copied!'));
    }}

    function clearNotes() {{
      if (confirm('Clear scratchpad notes?')) {{
        document.getElementById('scratchText').value = '';
        localStorage.removeItem(LS_KEY_NOTES);
        document.getElementById('saveStatus').innerText = 'Cleared';
      }}
    }}

    window.onload = () => {{ initTheme(); init(); }};
  </script>
</body>
</html>
"""

def generate_depo_hud(client_name, defendants, case_nos, witness_summary, defense_attorney, input_md_path, output_dir):
    print(f"Generating Deposition HUD for {client_name} in {output_dir}...")
    os.makedirs(output_dir, exist_ok=True)
    
    # Read Markdown
    with open(input_md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()
        
    # Output file paths
    client_clean = re.sub(r'[^a-zA-Z0-9_]', '', client_name.replace(' ', '_'))
    html_out = os.path.join(output_dir, "09.04.2026_WITNESS_DEPOSITION_DASHBOARD.html")
    txt_out = os.path.join(output_dir, "09.04.2026_WITNESS_DEPOSITION_EXAMINATION_PLAN_AND_QUESTIONS.txt")
    docx_out = os.path.join(output_dir, "09.04.2026_WITNESS_DEPOSITION_EXAMINATION_PLAN_AND_QUESTIONS.docx")
    
    print("Engine ready. Configured templates and output paths.")
    return html_out

if __name__ == "__main__":
    print("Depo HUD Generator loaded successfully.")
