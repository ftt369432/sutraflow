import os
import subprocess

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

OUTPUT_DIRS = [
    r"c:\Users\Ftt\genieflowai\00_TEMPLATES\STATE_PROCUREMENT\PDFs",
    r"e:\00 APEX DOCS\PREFILLED_STATE_BID_PDFs",
    r"g:\My Drive\.GENIEFLOW_MASTER\STATE BID\APEX_PREFILLED_PDFs"
]

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)

CSS = """
<style>
  @page {
    size: letter portrait;
    margin: 0.5in;
  }
  body {
    font-family: 'Arial', sans-serif;
    color: #111;
    font-size: 10.5pt;
    line-height: 1.4;
    margin: 0;
    padding: 0;
  }
  .header-box {
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .state-title {
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 2px;
  }
  .form-title {
    font-size: 13pt;
    font-weight: bold;
    text-align: center;
    color: #0b2545;
  }
  .form-subtitle {
    font-size: 8.5pt;
    text-align: center;
    font-style: italic;
    color: #555;
  }
  .section-header {
    background-color: #133c55;
    color: #fff;
    padding: 4px 8px;
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 14px;
    margin-bottom: 6px;
    border-radius: 2px;
  }
  table.field-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
  }
  table.field-table th, table.field-table td {
    border: 1px solid #777;
    padding: 6px 8px;
    vertical-align: top;
  }
  table.field-table th {
    background-color: #f1f4f8;
    width: 32%;
    text-align: left;
    font-size: 9.5pt;
    font-weight: bold;
  }
  table.field-table td {
    background-color: #fff;
    font-size: 10pt;
  }
  .val {
    font-weight: bold;
    color: #002b5b;
  }
  .check-box {
    font-size: 12pt;
    font-weight: bold;
    color: #004b23;
  }
  .cert-box {
    border: 1.5px solid #222;
    padding: 10px;
    background-color: #fafbfc;
    margin-top: 12px;
  }
  .sig-block {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
  }
  .sig-line {
    border-top: 1px solid #000;
    margin-top: 25px;
    padding-top: 4px;
    font-size: 9pt;
  }
  .footer-note {
    font-size: 8pt;
    color: #666;
    margin-top: 18px;
    border-top: 1px solid #ccc;
    padding-top: 4px;
    text-align: center;
  }
</style>
"""

# ── 1. STD 204 PAYEE DATA RECORD ─────────────────────────────────────────────
html_std204 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">{CSS}</head>
<body>
  <div class="header-box">
    <div class="state-title">State of California — Department of General Services</div>
    <div class="form-title">PAYEE DATA RECORD (STD 204)</div>
    <div class="form-subtitle">Required in lieu of IRS W-9 when doing business with the State of California</div>
  </div>

  <div class="section-header">Section 1 — Payee Information</div>
  <table class="field-table">
    <tr>
      <th>Legal Business / Individual Name</th>
      <td colspan="3"><span class="val">APEX CONSULTING GROUP LLC</span></td>
    </tr>
    <tr>
      <th>Business Name / DBA</th>
      <td colspan="3"><span class="val">Apex Consulting Group LLC</span></td>
    </tr>
    <tr>
      <th>Attention / Authorized Agent</th>
      <td colspan="3"><span class="val">Frank Ureno, Sole Member / Managing Director</span></td>
    </tr>
    <tr>
      <th>Mailing Address</th>
      <td colspan="3"><span class="val">112 Harvard Ave North, Suite 368, Claremont, CA 91711</span></td>
    </tr>
    <tr>
      <th>Telephone</th>
      <td><span class="val">(909) 469-9977</span></td>
      <th style="width:15%;">Email</th>
      <td><span class="val">apexcg25@gmail.com</span></td>
    </tr>
  </table>

  <div class="section-header">Section 2 — Entity Type</div>
  <table class="field-table">
    <tr>
      <td style="width: 50%;">
        <span class="check-box">&#9746;</span> <b>LIMITED LIABILITY COMPANY (LLC)</b><br>
        &nbsp;&nbsp;&nbsp;&nbsp;&bull; Tax Classification: <span class="val">Single Member LLC (Disregarded Entity)</span><br>
        &nbsp;&nbsp;&nbsp;&nbsp;&bull; Sole Owner / Member: <span class="val">Frank Ureno</span>
      </td>
      <td style="width: 50%;">
        <span class="check-box">&#9744;</span> Corporation (Medical / Legal / Other)<br>
        <span class="check-box">&#9744;</span> Sole Proprietor / Individual<br>
        <span class="check-box">&#9744;</span> Partnership / Other
      </td>
    </tr>
  </table>

  <div class="section-header">Section 3 — Tax Identification Number (TIN) & State Registry</div>
  <table class="field-table">
    <tr>
      <th>Federal Employer ID Number (FEIN)</th>
      <td><span class="val" style="font-size:11.5pt;">35-2883235</span> (IRS Notice CP 575 G Verified)</td>
    </tr>
    <tr>
      <th>California Secretary of State (SOS) No.</th>
      <td><span class="val" style="font-size:11.5pt;">202565119359</span> (Filing Date: 01/03/2025)</td>
    </tr>
    <tr>
      <th>IRS Name Control Code</th>
      <td><span class="val">APEX</span></td>
    </tr>
  </table>

  <div class="section-header">Section 4 — Payee Residency Status</div>
  <table class="field-table">
    <tr>
      <td>
        <span class="check-box">&#9746;</span> <b>CALIFORNIA RESIDENT</b> — Qualified to do business in California or maintains a permanent place of business in California.<br>
        <i>Apex Consulting Group LLC is an active California domestic LLC headquartered in Claremont, California.</i>
      </td>
    </tr>
  </table>

  <div class="section-header">Section 5 — Certification & Signature</div>
  <div class="cert-box">
    I hereby certify under penalty of perjury under the laws of the State of California that the information provided on this document is true, correct, and complete.<br><br>
    <table style="width:100%; border:none; margin-top:8px;">
      <tr>
        <td style="border:none; width:50%;">
          <b>Authorized Signature:</b> <span class="val" style="font-family:'Courier New'; font-size:12pt;">/s/ Frank Ureno</span><br>
          <div class="sig-line"><b>Frank Ureno</b>, Sole Member / Managing Director</div>
        </td>
        <td style="border:none; width:25%;">
          <b>Date:</b> <span class="val">September 26, 2026</span><br>
          <div class="sig-line">Execution Date</div>
        </td>
        <td style="border:none; width:25%;">
          <b>Telephone:</b> <span class="val">(909) 469-9977</span><br>
          <div class="sig-line">Primary Contact</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="footer-note">State Form STD 204 (Rev. 03/2021) — Prepared by GenieFlow / Sutra OS State Bidding Engine</div>
</body>
</html>"""

# ── 2. GSPD-05-105 BIDDER DECLARATION ────────────────────────────────────────
html_gspd = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">{CSS}</head>
<body>
  <div class="header-box">
    <div class="state-title">State of California — Department of General Services</div>
    <div class="form-title">BIDDER DECLARATION (GSPD-05-105)</div>
    <div class="form-subtitle">Mandatory attachment for all State of California Solicitations & RFPs</div>
  </div>

  <div class="section-header">1. Prime Bidder Information</div>
  <table class="field-table">
    <tr>
      <th>Legal Business Name</th>
      <td colspan="3"><span class="val">Apex Consulting Group LLC</span></td>
    </tr>
    <tr>
      <th>Contact Person & Title</th>
      <td colspan="3"><span class="val">Frank Ureno, Managing Director / Principal</span></td>
    </tr>
    <tr>
      <th>Principal Office Address</th>
      <td colspan="3"><span class="val">112 Harvard Ave North, Suite 368, Claremont, CA 91711</span></td>
    </tr>
    <tr>
      <th>Telephone & Email</th>
      <td><span class="val">(909) 469-9977</span></td>
      <td colspan="2"><span class="val">apexcg25@gmail.com</span></td>
    </tr>
    <tr>
      <th>Federal Tax ID (FEIN)</th>
      <td><span class="val">35-2883235</span></td>
      <th>CA SOS Entity No.</th>
      <td><span class="val">202565119359</span></td>
    </tr>
  </table>

  <div class="section-header">2. Small Business & DVBE Status</div>
  <table class="field-table">
    <tr>
      <td>
        <b>1. Are you certified with California DGS OSDS as a Small Business (SB) or Microbusiness (MB)?</b><br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span class="check-box">&#9746;</span> <b>YES</b> — Microbusiness Tier (&lt; $5,000,000 gross annual revenue, &lt; 25 employees).<br><br>
        <b>2. Are you certified as a Disabled Veteran Business Enterprise (DVBE)?</b><br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span class="check-box">&#9744;</span> YES &nbsp;&nbsp;&nbsp;&nbsp;<span class="check-box">&#9746;</span> <b>NO</b><br><br>
        <b>3. Are you a non-small business claiming at least 25% Small Business preference?</b><br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span class="check-box">&#9744;</span> YES &nbsp;&nbsp;&nbsp;&nbsp;<span class="check-box">&#9746;</span> <b>NO</b> (Submitting as direct Small Business Prime).
      </td>
    </tr>
  </table>

  <div class="section-header">3. Subcontractor Commitments & Commercially Useful Function (CUF)</div>
  <table class="field-table">
    <tr>
      <td>
        <b>Will subcontractors be utilized to perform services for this contract?</b><br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span class="check-box">&#9746;</span> <b>NO SUBCONTRACTORS</b> — 100% of all software engineering, data extraction, consulting, and project management will be performed directly by Apex Consulting Group LLC internal personnel.<br><br>
        <b>Commercially Useful Function (CUF) Statement:</b><br>
        <i>Apex Consulting Group LLC executes a commercially useful function by directly performing, managing, and supervising all technical and analytical deliverables with dedicated staff, proprietary sovereign models, and internal infrastructure.</i>
      </td>
    </tr>
  </table>

  <div class="section-header">4. Bidder Attestation</div>
  <div class="cert-box">
    I declare under penalty of perjury under the laws of the State of California that the information provided on this form is true and correct.<br><br>
    <table style="width:100%; border:none;">
      <tr>
        <td style="border:none; width:55%;">
          <b>Signature:</b> <span class="val" style="font-family:'Courier New'; font-size:12pt;">/s/ Frank Ureno</span><br>
          <div class="sig-line"><b>Frank Ureno</b>, Managing Director / Sole Member</div>
        </td>
        <td style="border:none; width:45%;">
          <b>Date Executed:</b> <span class="val">September 26, 2026</span><br>
          <div class="sig-line">Executed at Claremont, Los Angeles County, CA</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="footer-note">State Form GSPD-05-105 — Pre-filled by GenieFlow / Sutra OS State Procurement System</div>
</body>
</html>"""

# ── 3. DARFUR CONTRACTING ACT CERTIFICATION ─────────────────────────────────
html_darfur = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">{CSS}</head>
<body>
  <div class="header-box">
    <div class="state-title">State of California</div>
    <div class="form-title">DARFUR CONTRACTING ACT CERTIFICATION</div>
    <div class="form-subtitle">Pursuant to California Public Contract Code Sections 10475 - 10481</div>
  </div>

  <div class="section-header">Vendor & Entity Identification</div>
  <table class="field-table">
    <tr>
      <th>Bidder / Vendor Legal Name</th>
      <td colspan="3"><span class="val">Apex Consulting Group LLC</span></td>
    </tr>
    <tr>
      <th>Federal Tax ID (FEIN)</th>
      <td><span class="val">35-2883235</span></td>
      <th>CA SOS Entity No.</th>
      <td><span class="val">202565119359</span></td>
    </tr>
    <tr>
      <th>Corporate Address</th>
      <td colspan="3"><span class="val">112 Harvard Ave North, Suite 368, Claremont, CA 91711</span></td>
    </tr>
  </table>

  <div class="section-header">Statutory Certification Selection</div>
  <div class="cert-box">
    Pursuant to Public Contract Code section 10478, if a bidder or proposer currently or within the previous three years has had business activities outside of the United States, it must certify that it is not a scrutinized company.<br><br>
    
    <span class="check-box">&#9746;</span> <b>OPTION 1 — CERTIFICATION (PCC § 10478(a)):</b><br>
    <b>We certify that Apex Consulting Group LLC does not currently have, and we have not had within the previous three years, business activities or other operations outside of the United States.</b><br>
    Therefore, we are not a scrutinized company and are fully eligible to contract with the State of California.<br><br>
    
    <span class="check-box">&#9744;</span> OPTION 2 — Business activities outside US exist, but company is not scrutinized under § 10476.<br>
    <span class="check-box">&#9744;</span> OPTION 3 — Scrutinized company with written permission from DGS (§ 10477(b)).
  </div>

  <div class="section-header">Attestation Under Penalty of Perjury</div>
  <div class="cert-box">
    I, the official named below, certify under penalty of perjury under the laws of the State of California that I am duly authorized to legally bind the prospective contractor to the clause listed above.<br><br>
    <table style="width:100%; border:none;">
      <tr>
        <td style="border:none; width:55%;">
          <b>Signature:</b> <span class="val" style="font-family:'Courier New'; font-size:12pt;">/s/ Frank Ureno</span><br>
          <div class="sig-line"><b>Frank Ureno</b>, Managing Director / Sole Member</div>
        </td>
        <td style="border:none; width:45%;">
          <b>Date:</b> <span class="val">September 26, 2026</span><br>
          <div class="sig-line">Claremont, California</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="footer-note">California Darfur Contracting Act Certification — Sutra OS Procurement Suite</div>
</body>
</html>"""

# ── 4. CALIFORNIA CIVIL RIGHTS LAWS CERTIFICATION ───────────────────────────
html_civil = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">{CSS}</head>
<body>
  <div class="header-box">
    <div class="state-title">State of California</div>
    <div class="form-title">CALIFORNIA CIVIL RIGHTS LAWS CERTIFICATION</div>
    <div class="form-subtitle">Pursuant to California Public Contract Code Section 2010 (Contracts $100,000 or More)</div>
  </div>

  <div class="section-header">Contractor Identification</div>
  <table class="field-table">
    <tr>
      <th>Legal Business Name</th>
      <td colspan="3"><span class="val">Apex Consulting Group LLC</span></td>
    </tr>
    <tr>
      <th>Federal Tax ID (FEIN)</th>
      <td><span class="val">35-2883235</span></td>
      <th>CA SOS Entity No.</th>
      <td><span class="val">202565119359</span></td>
    </tr>
    <tr>
      <th>Physical Headquarters</th>
      <td colspan="3"><span class="val">112 Harvard Ave North, Suite 368, Claremont, CA 91711</span></td>
    </tr>
  </table>

  <div class="section-header">Mandatory Statutory Certifications</div>
  <div class="cert-box" style="line-height:1.5;">
    Pursuant to Public Contract Code section 2010, I, the undersigned official, certify under penalty of perjury under the laws of the State of California that the following statements are true and correct:<br><br>
    <b>1. CALIFORNIA CIVIL RIGHTS LAWS:</b> Apex Consulting Group LLC is in full compliance with the <b>Unruh Civil Rights Act (Section 51 of the Civil Code)</b> and the <b>California Fair Employment and Housing Act (Section 12960 of the Government Code)</b>.<br><br>
    <b>2. EMPLOYER DISCRIMINATORY POLICIES:</b> For any contract of $100,000 or more with the State of California, any policy that we have against any sovereign nation, peoples, or nation recognized by the United States is not used to discriminate in violation of the Unruh Civil Rights Act or the California Fair Employment and Housing Act.
  </div>

  <div class="section-header">Execution & Signature</div>
  <div class="cert-box">
    <table style="width:100%; border:none;">
      <tr>
        <td style="border:none; width:55%;">
          <b>Authorized Officer:</b> <span class="val" style="font-family:'Courier New'; font-size:12pt;">/s/ Frank Ureno</span><br>
          <div class="sig-line"><b>Frank Ureno</b>, Managing Director / Sole Member</div>
        </td>
        <td style="border:none; width:45%;">
          <b>Date:</b> <span class="val">September 26, 2026</span><br>
          <div class="sig-line">Executed in Los Angeles County, California</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="footer-note">California Public Contract Code § 2010 Certification — Sutra OS Legal Tech</div>
</body>
</html>"""

# ── 5. SB OPTION CAPABILITY & QUOTE PROPOSAL ────────────────────────────────
html_sb = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">{CSS}</head>
<body>
  <div class="header-box">
    <div class="state-title">California Small Business (SB) Option Proposal</div>
    <div class="form-title">CAPABILITY STATEMENT & FIXED COST QUOTATION</div>
    <div class="form-subtitle">Executed under California Government Code § 14838.5 (Expedited 2-Quote Contracting Up to $249,999.00)</div>
  </div>

  <div class="section-header">Prime Contractor Credentials</div>
  <table class="field-table">
    <tr>
      <th>Prime Contractor</th>
      <td><span class="val">Apex Consulting Group LLC</span></td>
      <th>Authorized Agent</th>
      <td><span class="val">Frank Ureno, Managing Director</span></td>
    </tr>
    <tr>
      <th>Headquarters</th>
      <td colspan="3"><span class="val">112 Harvard Ave North, Suite 368, Claremont, CA 91711</span></td>
    </tr>
    <tr>
      <th>Tax ID (FEIN)</th>
      <td><span class="val">35-2883235</span></td>
      <th>CA SOS Entity No.</th>
      <td><span class="val">202565119359</span></td>
    </tr>
    <tr>
      <th>Target UNSPSC Codes</th>
      <td colspan="3"><b>43230000</b> (Software / AI Solutions) &bull; <b>80101507</b> (IT Consultation) &bull; <b>81111508</b> (Application Dev)</td>
    </tr>
  </table>

  <div class="section-header">Core Technology Capabilities</div>
  <div class="cert-box" style="font-size:9.5pt; line-height:1.45;">
    &bull; <b>Air-Gapped Sovereign AI & Document Ingestion:</b> High-speed OCR extraction and deterministic rules processing with 100% on-premise / state data residency.<br>
    &bull; <b>State System Modernization & Middleware:</b> Python/TypeScript microservices integrating legacy mainframes, Cal eProcure/CSCR feeds, and modern REST APIs.<br>
    &bull; <b>California Regulatory Compliance:</b> Built specifically for California administrative law, case law grounding, and automated court-grade document compilation.
  </div>

  <div class="section-header">Turnkey Cost Quotation (Gov. Code § 14838.5)</div>
  <table class="field-table" style="text-align:center;">
    <tr style="background:#eef2f7;">
      <th style="width:10%; text-align:center;">Phase</th>
      <th style="width:55%; text-align:left;">Deliverable Description</th>
      <th style="width:15%; text-align:center;">Basis</th>
      <th style="width:20%; text-align:right;">Deliverable Amount</th>
    </tr>
    <tr>
      <td><b>01</b></td>
      <td style="text-align:left;">System Architecture, Regulatory Schema & Integration Specification</td>
      <td>Milestone</td>
      <td style="text-align:right;" class="val">$35,000.00</td>
    </tr>
    <tr>
      <td><b>02</b></td>
      <td style="text-align:left;">Core Middleware, Deterministic OCR Pipelines & API Connectors</td>
      <td>Milestone</td>
      <td style="text-align:right;" class="val">$75,000.00</td>
    </tr>
    <tr>
      <td><b>03</b></td>
      <td style="text-align:left;">Security Hardening, Sandbox Verification & State UAT Deployment</td>
      <td>Milestone</td>
      <td style="text-align:right;" class="val">$50,000.00</td>
    </tr>
    <tr>
      <td><b>04</b></td>
      <td style="text-align:left;">Handover, Administrator Training & 90-Day Warranty Support</td>
      <td>Milestone</td>
      <td style="text-align:right;" class="val">$30,000.00</td>
    </tr>
    <tr style="background:#f1f8f3;">
      <td colspan="3" style="text-align:right; font-weight:bold; font-size:11pt;">Total Fixed Proposal (Under $250k SB Option Ceiling):</td>
      <td style="text-align:right; font-weight:bold; font-size:12pt; color:#004b23;">$190,000.00</td>
    </tr>
  </table>

  <div class="section-header">Attestation & Submission</div>
  <div class="cert-box">
    <table style="width:100%; border:none;">
      <tr>
        <td style="border:none; width:55%;">
          <b>Submitted By:</b> <span class="val" style="font-family:'Courier New'; font-size:12pt;">/s/ Frank Ureno</span><br>
          <div class="sig-line"><b>Frank Ureno</b>, Managing Director, Apex Consulting Group LLC</div>
        </td>
        <td style="border:none; width:45%;">
          <b>Contact:</b> (909) 469-9977 | apexcg25@gmail.com<br>
          <div class="sig-line">Executed at Claremont, California</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="footer-note">California SB Option Proposal Template — Prepared by Sutra OS Procurement Engine</div>
</body>
</html>"""

# ── 6. DIR/DWC EAMS MODERNIZATION SB PROPOSAL ──────────────────────────────
html_dwc = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">{CSS}</head>
<body>
  <div class="header-box">
    <div class="state-title">California Department of Industrial Relations (DIR) / DWC</div>
    <div class="form-title">EAMS MODERNIZATION & CLAIMS OCR INGESTION PROPOSAL</div>
    <div class="form-subtitle">California Small Business Fast-Track Pilot Proposal (Gov. Code § 14838.5 | RFP #17546 Alignment)</div>
  </div>

  <div class="section-header">Prime Contractor Credentials</div>
  <table class="field-table">
    <tr>
      <th>Prime Contractor</th>
      <td><span class="val">Apex Consulting Group LLC</span></td>
      <th>Lead Architect</th>
      <td><span class="val">Frank Ureno, Managing Director</span></td>
    </tr>
    <tr>
      <th>Address & Contact</th>
      <td colspan="3"><span class="val">112 Harvard Ave North #368, Claremont, CA 91711</span> &bull; (909) 469-9977 &bull; <span class="val">apexcg25@gmail.com</span></td>
    </tr>
    <tr>
      <th>Tax ID (FEIN) & SOS</th>
      <td>FEIN: <span class="val">35-2883235</span></td>
      <td colspan="2">CA SOS Entity: <span class="val">202565119359</span></td>
    </tr>
  </table>

  <div class="section-header">Baked-In System Capabilities (8 CCR § 10205 & WCAB Compliant)</div>
  <div class="cert-box" style="font-size:9.5pt; line-height:1.45;">
    &bull; <b>Zero-Clerk Neural Ingestion:</b> Automated classification of multi-page PDF filings, medical liens, QME reports, and petitions with automatic docketing into the Electronic Case Folder (ECF).<br>
    &bull; <b>Automated Metadata Extraction:</b> Instant extraction of ADJ Number, Injured Worker Name, Employer, Claims Administrator, Date of Injury, and Benefit Type.<br>
    &bull; <b>Air-Gapped PHI & HIPAA Shield:</b> On-premise execution guaranteeing that psychiatric records, medical-legal charts, and SSNs never leak to third-party public AI models.<br>
    &bull; <b>Statutory Protocol Adherence:</b> 100% compliance with 8 CCR § 10205 2D barcode/patch-code positioning and OCR-A font standards.
  </div>

  <div class="section-header">Turnkey Deliverable & Milestone Schedule</div>
  <table class="field-table" style="text-align:center;">
    <tr style="background:#eef2f7;">
      <th style="width:10%; text-align:center;">Milestone</th>
      <th style="width:55%; text-align:left;">Deliverable Scope</th>
      <th style="width:15%; text-align:center;">Timeline</th>
      <th style="width:20%; text-align:right;">Deliverable Amount</th>
    </tr>
    <tr>
      <td><b>M1</b></td>
      <td style="text-align:left;">EAMS OCR & ECF Ingestion Schema Specification & Test Dataset Pipeline</td>
      <td>30 Days</td>
      <td style="text-align:right;" class="val">$45,000.00</td>
    </tr>
    <tr>
      <td><b>M2</b></td>
      <td style="text-align:left;">Core Neural Extraction Engine & ADJ Docketing Automation Prototype</td>
      <td>45 Days</td>
      <td style="text-align:right;" class="val">$95,000.00</td>
    </tr>
    <tr>
      <td><b>M3</b></td>
      <td style="text-align:left;">District Office Pilot Deployment (Los Angeles & Oakland WCAB District Offices)</td>
      <td>45 Days</td>
      <td style="text-align:right;" class="val">$65,000.00</td>
    </tr>
    <tr>
      <td><b>M4</b></td>
      <td style="text-align:left;">Clerk Operations Training, Administrator Documentation & 90-Day Warranty</td>
      <td>30 Days</td>
      <td style="text-align:right;" class="val">$40,000.00</td>
    </tr>
    <tr style="background:#f1f8f3;">
      <td colspan="3" style="text-align:right; font-weight:bold; font-size:11pt;">Total Fixed Turnkey Price (Under $250k SB Option Ceiling):</td>
      <td style="text-align:right; font-weight:bold; font-size:12pt; color:#004b23;">$245,000.00</td>
    </tr>
  </table>

  <div class="section-header">Submission & Attestation</div>
  <div class="cert-box">
    <table style="width:100%; border:none;">
      <tr>
        <td style="border:none; width:55%;">
          <b>Submitted By:</b> <span class="val" style="font-family:'Courier New'; font-size:12pt;">/s/ Frank Ureno</span><br>
          <div class="sig-line"><b>Frank Ureno</b>, Managing Director, Apex Consulting Group LLC</div>
        </td>
        <td style="border:none; width:45%;">
          <b>Direct Contact:</b> (909) 469-9977 | apexcg25@gmail.com<br>
          <div class="sig-line">Executed at Claremont, California</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="footer-note">State Bidding Package RFP #17546 — Prepared by Sutra OS Procurement Engine</div>
</body>
</html>"""

# ── 7. DCC CANNABIS INTEGRATION SYSTEM PROPOSAL ─────────────────────────────
html_dcc = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">{CSS}</head>
<body>
  <div class="header-box">
    <div class="state-title">California Department of Cannabis Control (DCC)</div>
    <div class="form-title">CANNABIS INTEGRATION SYSTEM (CSI) MIDDLEWARE PROPOSAL</div>
    <div class="form-subtitle">Track-and-Trace API Integration & Automated Compliance Audit Engine (Gov. Code § 14838.5)</div>
  </div>

  <div class="section-header">Prime Contractor Credentials</div>
  <table class="field-table">
    <tr>
      <th>Prime Contractor</th>
      <td><span class="val">Apex Consulting Group LLC</span></td>
      <th>Lead Architect</th>
      <td><span class="val">Frank Ureno, Managing Director</span></td>
    </tr>
    <tr>
      <th>Address & Contact</th>
      <td colspan="3"><span class="val">112 Harvard Ave North #368, Claremont, CA 91711</span> &bull; (909) 469-9977 &bull; <span class="val">apexcg25@gmail.com</span></td>
    </tr>
    <tr>
      <th>Tax ID (FEIN) & SOS</th>
      <td>FEIN: <span class="val">35-2883235</span></td>
      <td colspan="2">CA SOS Entity: <span class="val">202565119359</span></td>
    </tr>
  </table>

  <div class="section-header">Baked-In System Capabilities (BPC § 26000 & 4 CCR § 15000 Compliant)</div>
  <div class="cert-box" style="font-size:9.5pt; line-height:1.45;">
    &bull; <b>Metrc Track-and-Trace API Ingestion:</b> High-volume ingestion and validation of state inventory manifests, package transfers, and lab testing Certificates of Analysis (COA).<br>
    &bull; <b>Automated Violation Auditing:</b> Deterministic rule verification detecting THC variance exceeding statutory limits, pesticide threshold breaches, and chain-of-custody transfer gaps.<br>
    &bull; <b>GIS & Licensing Buffer Validation:</b> Spatial boundary checks verifying sensitive use setbacks (schools, daycares) and local municipal license authorizations.<br>
    &bull; <b>Statewide Encrypted Audit Trails:</b> Immutable, air-gapped compliance logging fulfilling California state data governance mandates.
  </div>

  <div class="section-header">Turnkey Deliverable & Milestone Schedule</div>
  <table class="field-table" style="text-align:center;">
    <tr style="background:#eef2f7;">
      <th style="width:10%; text-align:center;">Milestone</th>
      <th style="width:55%; text-align:left;">Deliverable Scope</th>
      <th style="width:15%; text-align:center;">Timeline</th>
      <th style="width:20%; text-align:right;">Deliverable Amount</th>
    </tr>
    <tr>
      <td><b>M1</b></td>
      <td style="text-align:left;">Track-and-Trace Schema Modeling, API Ingestion & Data Dictionary Spec</td>
      <td>30 Days</td>
      <td style="text-align:right;" class="val">$35,000.00</td>
    </tr>
    <tr>
      <td><b>M2</b></td>
      <td style="text-align:left;">Compliance Rule Validation Engine & Automated Violation Trigger Pipeline</td>
      <td>45 Days</td>
      <td style="text-align:right;" class="val">$80,000.00</td>
    </tr>
    <tr>
      <td><b>M3</b></td>
      <td style="text-align:left;">DCC Inspector Dashboard & Licensing Enforcement Portal Integration</td>
      <td>45 Days</td>
      <td style="text-align:right;" class="val">$50,000.00</td>
    </tr>
    <tr>
      <td><b>M4</b></td>
      <td style="text-align:left;">State Acceptance Testing, Security Audit & Production Handover</td>
      <td>30 Days</td>
      <td style="text-align:right;" class="val">$30,000.00</td>
    </tr>
    <tr style="background:#f1f8f3;">
      <td colspan="3" style="text-align:right; font-weight:bold; font-size:11pt;">Total Fixed Turnkey Price (Under $250k SB Option Ceiling):</td>
      <td style="text-align:right; font-weight:bold; font-size:12pt; color:#004b23;">$195,000.00</td>
    </tr>
  </table>

  <div class="section-header">Submission & Attestation</div>
  <div class="cert-box">
    <table style="width:100%; border:none;">
      <tr>
        <td style="border:none; width:55%;">
          <b>Submitted By:</b> <span class="val" style="font-family:'Courier New'; font-size:12pt;">/s/ Frank Ureno</span><br>
          <div class="sig-line"><b>Frank Ureno</b>, Managing Director, Apex Consulting Group LLC</div>
        </td>
        <td style="border:none; width:45%;">
          <b>Direct Contact:</b> (909) 469-9977 | apexcg25@gmail.com<br>
          <div class="sig-line">Executed at Claremont, California</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="footer-note">California DCC Compliance Package — Prepared by Sutra OS Procurement Engine</div>
</body>
</html>"""

DOCS = [
    ("STD_204_Payee_Data_Record_Apex_Consulting.pdf", html_std204),
    ("GSPD_05_105_Bidder_Declaration_Apex_Consulting.pdf", html_gspd),
    ("Darfur_Contracting_Act_Certification_Apex_Consulting.pdf", html_darfur),
    ("California_Civil_Rights_Laws_Certification_Apex_Consulting.pdf", html_civil),
    ("California_SB_Option_Capability_Statement_and_Quote_Apex_Consulting.pdf", html_sb),
    ("DIR_DWC_EAMS_Modernization_SB_Option_Proposal_Apex.pdf", html_dwc),
    ("DCC_Cannabis_Integration_Middleware_SB_Option_Proposal_Apex.pdf", html_dcc),
]

temp_html = r"c:\Users\Ftt\genieflowai\scratch\temp_render.html"

print("Compiling Pre-filled State Procurement PDFs...")
for pdf_name, html_content in DOCS:
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    primary_pdf = os.path.join(OUTPUT_DIRS[0], pdf_name)
    cmd = [EDGE_PATH, "--headless", "--disable-gpu", f"--print-to-pdf={primary_pdf}", temp_html]
    subprocess.run(cmd, check=True)
    
    # Mirror to other drives
    for out_dir in OUTPUT_DIRS[1:]:
        target = os.path.join(out_dir, pdf_name)
        try:
            with open(primary_pdf, "rb") as sf, open(target, "wb") as df:
                df.write(sf.read())
        except Exception as e:
            print(f"Error mirroring to {target}: {e}")
            
    print(f"  [+] Generated: {pdf_name} ({os.path.getsize(primary_pdf)} bytes)")

if os.path.exists(temp_html):
    os.remove(temp_html)

print("\nAll 5 Official Pre-Filled State Procurement PDFs Generated Successfully!")
