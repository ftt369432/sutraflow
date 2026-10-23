"""
GenieFlow Med-Legal Master Suite: Content Manifest Builder
Compiles the modular markdown content tree into a unified JSON manifest.
Enforces Rule 1 (Zero Stubs) & Rule 3 (Modularity) from SutraFlow Constitution.
"""

import os
import sys
import json
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, "content")
MANIFEST_PATH = os.path.join(CONTENT_DIR, "manifest.json")

def parse_markdown_frontmatter(content):
    frontmatter = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_fm = parts[1].strip()
            body = parts[2].strip()
            for line in raw_fm.split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    frontmatter[k.strip()] = v.strip().strip('"').strip("'")
    return frontmatter, body

def build_manifest():
    manifest = {
        "version": "2026.2",
        "last_updated": "2026-10-09",
        "divisions": [],
        "cases": [],
        "rules": [],
        "traps": []
    }

    # 1. Divisions
    div_dir = os.path.join(CONTENT_DIR, "divisions")
    if os.path.exists(div_dir):
        for f in sorted(os.listdir(div_dir)):
            if f.endswith(".md"):
                fp = os.path.join(div_dir, f)
                with open(fp, "r", encoding="utf-8") as fh:
                    txt = fh.read()
                fm, body = parse_markdown_frontmatter(txt)
                manifest["divisions"].append({
                    "filename": f,
                    "title": fm.get("title", f),
                    "division": fm.get("division", ""),
                    "chapters": fm.get("chapters_covered", ""),
                    "line_count": len(txt.split("\n"))
                })

    # 2. Cases
    cases_dir = os.path.join(CONTENT_DIR, "cases")
    if os.path.exists(cases_dir):
        for f in sorted(os.listdir(cases_dir)):
            if f.endswith(".md"):
                fp = os.path.join(cases_dir, f)
                with open(fp, "r", encoding="utf-8") as fh:
                    txt = fh.read()
                fm, body = parse_markdown_frontmatter(txt)
                # Extract quote
                q_match = re.search(r'> ([\s\S]*?)$', body)
                quote = q_match.group(1).strip() if q_match else ""
                # Extract holding
                h_match = re.search(r'## 🏛️ Holding & Principle\s*([\s\S]*?)(?=##|\Z)', body)
                holding = h_match.group(1).strip() if h_match else ""
                manifest["cases"].append({
                    "filename": f,
                    "name": fm.get("title", f),
                    "citation": fm.get("citation", ""),
                    "court": fm.get("court", ""),
                    "year": fm.get("year", ""),
                    "category": fm.get("category", ""),
                    "authority": fm.get("authority", ""),
                    "holding": holding,
                    "quote": quote
                })

    # 3. Rules
    rules_dir = os.path.join(CONTENT_DIR, "rules")
    if os.path.exists(rules_dir):
        for f in sorted(os.listdir(rules_dir)):
            if f.endswith(".md"):
                fp = os.path.join(rules_dir, f)
                with open(fp, "r", encoding="utf-8") as fh:
                    txt = fh.read()
                fm, body = parse_markdown_frontmatter(txt)
                hammer_match = re.search(r'## 🔨 The Practice Hammer\s*([\s\S]*?)(?=##|\Z)', body)
                hammer = hammer_match.group(1).strip() if hammer_match else ""
                manifest["rules"].append({
                    "filename": f,
                    "title": fm.get("title", f),
                    "new_rule": fm.get("new_rule", ""),
                    "old_rule": fm.get("old_rule", ""),
                    "authority": fm.get("authority", ""),
                    "hammer": hammer
                })

    # 4. Traps
    traps_dir = os.path.join(CONTENT_DIR, "traps")
    if os.path.exists(traps_dir):
        for f in sorted(os.listdir(traps_dir)):
            if f.endswith(".md"):
                fp = os.path.join(traps_dir, f)
                with open(fp, "r", encoding="utf-8") as fh:
                    txt = fh.read()
                fm, body = parse_markdown_frontmatter(txt)
                blunder_match = re.search(r'## 🚫 Common Defense Blunder\s*([\s\S]*?)(?=##|\Z)', body)
                blunder = blunder_match.group(1).strip() if blunder_match else ""
                remedy_match = re.search(r'## 🎯 Affirmative Remedy & Sanctions\s*([\s\S]*?)(?=##|\Z)', body)
                remedy = remedy_match.group(1).strip() if remedy_match else ""
                roadmap_match = re.search(r'## 🗺️ Step-by-Step Tactical Roadmap\s*([\s\S]*?)(?=##|\Z)', body)
                roadmap = roadmap_match.group(1).strip() if roadmap_match else ""
                manifest["traps"].append({
                    "filename": f,
                    "name": fm.get("title", f),
                    "code": fm.get("code", ""),
                    "case": fm.get("controlling_case", ""),
                    "blunder": blunder,
                    "remedy": remedy,
                    "roadmap": roadmap
                })

    with open(MANIFEST_PATH, "w", encoding="utf-8") as out:
        json.dump(manifest, out, indent=2)

    print(f"✅ Manifest compiled cleanly to: {MANIFEST_PATH}")
    print(f"   - Divisions: {len(manifest['divisions'])}")
    print(f"   - Cases:     {len(manifest['cases'])}")
    print(f"   - Rules:     {len(manifest['rules'])}")
    print(f"   - Traps:     {len(manifest['traps'])}")

if __name__ == "__main__":
    build_manifest()
