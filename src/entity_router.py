"""
GenieFlow AI - Sovereign Entity & Dual-Persona Context Router
Author: GenieFlow OS Core Engine
Version: 2.2.0

Automatically routes and configures pleadings, statutory research, and legal reasoning
between:
  1. Profile A: Law Offices of Arnulfo F. Gutierrez, Esq. (Applicant Attorney)
  2. Profile B: Lien Claimants: Medland Medical Tustin, Spectrum Medical Group, RMS Medical Group
"""

import json
import os
import re
from typing import Dict, Any, Optional, Tuple

PROFILE_PATH = os.path.join(os.path.dirname(__file__), "..", "firm_profile.json")

def load_profiles() -> Dict[str, Any]:
    if os.path.exists(PROFILE_PATH):
        with open(PROFILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def detect_entity(text: str) -> Tuple[str, Dict[str, Any]]:
    """
    Analyzes input text (prompt, memo, case file name, or caption)
    and returns (entity_id, profile_dict).
    Defaults to 'arnulfo_gutierrez' if context points to applicant matters,
    or matches specific lien claimant keywords.
    """
    profiles_data = load_profiles().get("profiles", {})
    lower_text = text.lower()
    
    # Check specific lien claimants first
    scores = {}
    for entity_id, profile in profiles_data.items():
        score = 0
        keywords = profile.get("detectionKeywords", [])
        for kw in keywords:
            # Word boundary matching where possible
            pattern = rf"\b{re.escape(kw.lower())}\b"
            matches = len(re.findall(pattern, lower_text))
            score += matches * 2
            if kw.lower() in lower_text:
                score += 1
        scores[entity_id] = score

    best_match = max(scores, key=scores.get) if scores else "arnulfo_gutierrez"
    if scores.get(best_match, 0) > 0:
        return best_match, profiles_data[best_match]
    
    # Default fallback
    return "arnulfo_gutierrez", profiles_data.get("arnulfo_gutierrez", {})

def generate_caption(
    entity_id: str,
    applicant_name: str,
    defendant_name: str,
    adj_number: str,
    pleading_title: str,
    wcab_venue: str = "LOS ANGELES"
) -> str:
    """
    Generates a California 28-Line conforming caption header for the specified entity.
    """
    profiles_data = load_profiles().get("profiles", {})
    profile = profiles_data.get(entity_id, {})
    
    if profile.get("type") == "applicant_attorney":
        header_lines = [
            profile.get("attorneyName", "ARNULFO F. GUTIERREZ, ESQ.") + f", SBN: {profile.get('barNumber', '212260')}",
            profile.get("displayName", "LAW OFFICES OF ARNULFO F. GUTIERREZ"),
            profile.get("address", {}).get("street", "1137 W. MISSION BLVD."),
            f"{profile.get('address', {}).get('city', 'POMONA')}, {profile.get('address', {}).get('state', 'CA')} {profile.get('address', {}).get('zip', '91766')}",
            f"TEL: {profile.get('contact', {}).get('phone', '909-469-9977')}; FAX: {profile.get('contact', {}).get('fax', '909-469-9907')}",
            "",
            f"ATTORNEYS FOR APPLICANT, {applicant_name.upper()}"
        ]
    else:
        # Lien claimant
        header_lines = [
            profile.get("displayName", "LIEN CLAIMANT").upper(),
            profile.get("address", {}).get("street", ""),
            f"{profile.get('address', {}).get('city', '')}, {profile.get('address', {}).get('state', '')} {profile.get('address', {}).get('zip', '')}".strip(),
            f"UAN: {profile.get('uan', '')}",
            f"TEL: {profile.get('contact', {}).get('phone', '')}",
            "",
            f"LIEN CLAIMANT: {profile.get('displayName', '').upper()}"
        ]

    caption = "\n".join([line for line in header_lines if line is not None]) + "\n\n"
    caption += "STATE OF CALIFORNIA\n"
    caption += "WORKERS' COMPENSATION APPEALS BOARD\n\n"
    caption += f"{applicant_name.upper()},\n"
    caption += "                 Applicant,\n"
    caption += "vs.                                         )  Case No. " + adj_number + "\n"
    caption += f"{defendant_name.upper()},\n"
    caption += "                 Defendants.                )  " + pleading_title.upper() + "\n"
    caption += "____________________________________________)\n"
    return caption

if __name__ == "__main__":
    import sys
    test_query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "File a petition for costs under Labor Code 4622 for Medland Medical"
    entity_id, profile = detect_entity(test_query)
    print("=" * 60)
    print(f"QUERY: {test_query}")
    print(f"DETECTED ENTITY: {profile.get('displayName')} ({entity_id})")
    print(f"ROLE: {profile.get('type')}")
    print(f"CAPACITY: {profile.get('representationCapacity')}")
    print("STATUTORY AUTHORITIES:")
    for auth in profile.get("statutoryFocus", []):
        print(f"  - {auth}")
    print("=" * 60)
