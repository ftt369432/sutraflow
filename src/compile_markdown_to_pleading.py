import os
import sys
import re
import copy
import zipfile
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import docx

def update_docx_zip_file(docx_path, file_in_zip, new_content_bytes):
    tmp_path = docx_path + ".tmp.zip"
    with zipfile.ZipFile(docx_path, 'r') as zin:
        with zipfile.ZipFile(tmp_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if item.filename == file_in_zip:
                    zout.writestr(item, new_content_bytes)
                else:
                    zout.writestr(item, zin.read(item.filename))
    os.replace(tmp_path, docx_path)

def add_styled_run(p, text, bold=False, italic=False, underline=False, font_size=12, font_name='Times New Roman'):
    clean_text = text.replace('**', '').replace('*', '').replace('>', '')
    if not clean_text:
        return None
    run = p.add_run(clean_text)
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.bold = bold
    run.italic = italic
    run.underline = underline
    run.font.color.rgb = RGBColor(0, 0, 0)
    return run

def render_rich_paragraph(p, text, default_bold=False, default_italic=False, default_underline=False, font_size=12):
    cleaned_input = text.lstrip('>').strip()
    pattern = r'(\*\*[^*]+?\*\*|\*[^*]+?\*)'
    tokens = re.split(pattern, cleaned_input)
    
    for token in tokens:
        if not token:
            continue
        if token.startswith('**') and token.endswith('**') and len(token) >= 4:
            inner_text = token[2:-2]
            add_styled_run(p, inner_text, bold=True, italic=default_italic, underline=default_underline, font_size=font_size)
        elif token.startswith('*') and token.endswith('*') and len(token) >= 2:
            inner_text = token[1:-1]
            add_styled_run(p, inner_text, bold=default_bold, italic=True, underline=default_underline, font_size=font_size)
        else:
            add_styled_run(p, token, bold=default_bold, italic=default_italic, underline=default_underline, font_size=font_size)

def add_caption_para(cell, text, bold=False, font_size=10, empty_line_after=False):
    p = cell.add_paragraph() if len(cell.paragraphs[0].text) > 0 else cell.paragraphs[0]
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    add_styled_run(p, text, bold=bold, font_size=font_size)
    if empty_line_after:
        p_empty = cell.add_paragraph()
        p_empty.paragraph_format.line_spacing = 1.0
        p_empty.paragraph_format.space_after = Pt(0)
        p_empty.paragraph_format.space_before = Pt(0)

def add_signature_table(doc, date_text="Date: CURRENT DATE", firm_name="LAW OFFICES OF ARNULFO F. GUTIERREZ", attorney_name="ARNULFO GUTIERREZ ESQ", client_name=""):
    tbl = doc.add_table(rows=3, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths = [Inches(2.31), Inches(0.88), Inches(3.81)]
    for r in tbl.rows:
        for idx, w in enumerate(col_widths):
            r.cells[idx].width = w
            
    # Row 0
    p0 = tbl.cell(0, 0).paragraphs[0]
    p0.paragraph_format.line_spacing = 1.0
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(0)
    add_styled_run(p0, f"{date_text}\t", font_size=10)
    
    p0_2 = tbl.cell(0, 2).paragraphs[0]
    p0_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0_2.paragraph_format.line_spacing = 1.0
    p0_2.paragraph_format.space_before = Pt(0)
    p0_2.paragraph_format.space_after = Pt(0)
    add_styled_run(p0_2, firm_name, font_size=10)
    
    # Row 1
    p1_2 = tbl.cell(1, 2).paragraphs[0]
    p1_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1_2.paragraph_format.line_spacing = 1.0
    p1_2.paragraph_format.space_before = Pt(0)
    p1_2.paragraph_format.space_after = Pt(0)
    add_styled_run(p1_2, "         ___________________________________", font_size=10)
    
    # Row 2
    c2 = tbl.cell(2, 2)
    p2_0 = c2.paragraphs[0]
    p2_0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2_0.paragraph_format.line_spacing = 1.0
    p2_0.paragraph_format.space_before = Pt(0)
    p2_0.paragraph_format.space_after = Pt(0)
    add_styled_run(p2_0, attorney_name, bold=True, font_size=10)
    
    p2_1 = c2.add_paragraph()
    p2_1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2_1.paragraph_format.line_spacing = 1.0
    p2_1.paragraph_format.space_before = Pt(0)
    p2_1.paragraph_format.space_after = Pt(0)
    add_styled_run(p2_1, "Attorney for Applicant", font_size=10)
    
    if client_name:
        p2_2 = c2.add_paragraph()
        p2_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2_2.paragraph_format.line_spacing = 1.0
        p2_2.paragraph_format.space_before = Pt(0)
        p2_2.paragraph_format.space_after = Pt(0)
        add_styled_run(p2_2, client_name, font_size=10)
        
    return tbl

def add_order_caption_table(doc, client_name, plaintiff_label, defendants, defendant_label, case_nos, order_title):
    tbl = doc.add_table(rows=1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths = [Inches(3.44), Inches(0.19), Inches(3.38)]
    for r in tbl.rows:
        for idx, w in enumerate(col_widths):
            r.cells[idx].width = w
            
    c0 = tbl.cell(0, 0)
    add_caption_para(c0, f"{client_name},", bold=True, font_size=10)
    add_caption_para(c0, f"    {plaintiff_label},", bold=False, font_size=10, empty_line_after=True)
    add_caption_para(c0, "vs.", bold=False, font_size=10, empty_line_after=True)
    add_caption_para(c0, f"{defendants},", bold=True, font_size=10)
    add_caption_para(c0, f"    {defendant_label}.", bold=False, font_size=10)
    
    c1 = tbl.cell(0, 1)
    for _ in range(12):
        add_caption_para(c1, ")", bold=False, font_size=10)
        
    c2 = tbl.cell(0, 2)
    p_case = c2.paragraphs[0]
    p_case.paragraph_format.line_spacing = 1.0
    p_case.paragraph_format.space_before = Pt(0)
    p_case.paragraph_format.space_after = Pt(0)
    add_styled_run(p_case, "Case No:  ", bold=False, font_size=10)
    add_styled_run(p_case, case_nos, bold=True, font_size=10)
    
    c2.add_paragraph("")
    c2.add_paragraph("")
    p_tit = c2.add_paragraph()
    p_tit.paragraph_format.line_spacing = 1.0
    p_tit.paragraph_format.space_before = Pt(0)
    p_tit.paragraph_format.space_after = Pt(0)
    add_styled_run(p_tit, order_title, bold=True, font_size=10)
    
    return tbl

def parse_and_add_table(doc, table_lines):
    rows_data = []
    for line in table_lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith('| :---') or line_clean.startswith('|:---') or line_clean.startswith('|---'):
            continue
        if '|' in line_clean:
            parts = [p.strip() for p in line_clean.split('|')[1:-1]]
            if parts:
                rows_data.append(parts)
        else:
            parts = re.split(r'\s{2,}', line_clean)
            if len(parts) >= 2:
                rows_data.append(parts)
            
    if not rows_data:
        return
        
    num_cols = max(len(r) for r in rows_data)
    table = doc.add_table(rows=len(rows_data), cols=num_cols)
    try:
        table.style = 'Table Grid'
    except Exception:
        try:
            table.style = 'Normal Table'
        except Exception:
            pass
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    if num_cols == 6:
        col_widths = [Inches(1.0), Inches(2.7), Inches(0.6), Inches(0.6), Inches(0.8), Inches(0.8)]
    elif num_cols == 4:
        col_widths = [Inches(1.2), Inches(3.0), Inches(1.1), Inches(1.2)]
    elif num_cols == 5:
        col_widths = [Inches(1.0), Inches(2.5), Inches(1.0), Inches(1.0), Inches(1.0)]
    else:
        col_widths = [Inches(6.5 / num_cols)] * num_cols

    for row in table.rows:
        for idx, w in enumerate(col_widths[:len(row.cells)]):
            row.cells[idx].width = w
            
    for row_idx, data in enumerate(rows_data):
        row = table.rows[row_idx]
        is_header = (row_idx == 0)
        is_totals = data[0].upper().startswith("TOTAL")
        
        for c_idx, text in enumerate(data):
            if c_idx < len(row.cells):
                cell = row.cells[c_idx]
                cell.text = ""
                p = cell.paragraphs[0]
                p.paragraph_format.line_spacing = 1.0
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                
                if any(char in text for char in ['$', '%']) and not is_header:
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    
                clean_text = (
                    re.sub(r'<br\s*/?>|<br(?=[A-Za-z0-9(])', '\n', text)
                    .replace('**', '')
                    .replace('*', '')
                    .replace('>', '')
                    .strip()
                )
                run = p.add_run(clean_text)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(9.5)
                run.bold = is_header or is_totals or ('**' in text)

def compile_markdown_to_pleading(md_path, docx_path, template_path=None):
    if not template_path:
        template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "template.docx")
        
    if not os.path.exists(template_path):
        print(f"Error: Template file does not exist at {template_path}")
        sys.exit(1)
        
    print(f"Loading conformed pleading template: {template_path}")
    doc = Document(template_path)
    
    # Defaults
    client_name = "APPLICANT NAME"
    defendants = "DEFENDANT EMPLOYER;\nDEFENDANT CARRIER"
    case_nos = "ADJ NUMBER(S)"
    claim_no = None
    attorney_for = None
    court_name_1 = "WORKERS' COMPENSATION APPEALS BOARD"
    court_name_2 = "STATE OF CALIFORNIA"
    plaintiff_label = "Applicant"
    defendant_label = "Defendants"
    attorney_contact = None
    pleading_title = "PETITION FOR DISCOVERY ORDER; POINTS & AUTHORITIES AND PROPOSED ORDER"
    footer_text = None
    date_str = "CURRENT DATE"
    firm_name = "LAW OFFICES OF ARNULFO F. GUTIERREZ"
    attorney_name = "ARNULFO GUTIERREZ ESQ"
        
    # Read Markdown content
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()
        
    yaml_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', md_content, re.DOTALL)
    if yaml_match:
        try:
            yaml_text = yaml_match.group(1)
            for y_line in yaml_text.split('\n'):
                if ':' in y_line:
                    key, val = y_line.split(':', 1)
                    key = key.strip().lower()
                    val = val.strip().strip('"').strip("'").replace('\\n', '\n')
                    if key == 'client_name':
                        client_name = val
                    elif key == 'defendants':
                        defendants = val
                    elif key == 'case_nos':
                        case_nos = val
                    elif key == 'claim_no':
                        claim_no = val
                    elif key == 'pleading_title':
                        pleading_title = val
                    elif key == 'footer_text':
                        footer_text = val
                    elif key in ['attorney_for', 'representative_title']:
                        attorney_for = val
                    elif key == 'court_name_1':
                        court_name_1 = val
                    elif key == 'court_name_2':
                        court_name_2 = val
                    elif key == 'plaintiff_label':
                        plaintiff_label = val
                    elif key == 'defendant_label':
                        defendant_label = val
                    elif key in ['attorney_contact', 'representative_info']:
                        attorney_contact = val
                    elif key == 'attorney_name':
                        attorney_name = val
                    elif key == 'firm_name':
                        firm_name = val
                    elif key in ['date', 'executed_date']:
                        date_str = val
        except Exception as e:
            print(f"Error: Failed to parse YAML front matter: {e}")
            sys.exit(1)
            
    # 1. Attorney contact info in Paragraph 0
    p0 = doc.paragraphs[0]
    p0.text = ""
    p0.paragraph_format.line_spacing = 1.0
    p0.paragraph_format.space_after = Pt(0)
    p0.paragraph_format.space_before = Pt(0)
    try:
        p0.style = 'Attorney Name'
    except Exception:
        p0.style = 'Normal'
    p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
    
    if not attorney_contact:
        attorney_contact = (
            "ARNULFO F. GUTIERREZ, ESQ., SBN: 212260\n"
            "LAW OFFICES OF ARNULFO F. GUTIERREZ\n"
            "1137 W. MISSION BLVD.\n"
            "POMONA, CA 91766\n"
            "TEL: (909) 469-9977\n"
        )
    add_styled_run(p0, attorney_contact, font_size=10)
    
    # Paragraph 1: Attorney for Applicant
    p1 = doc.paragraphs[1]
    p1.text = ""
    p1.paragraph_format.line_spacing = 1.0
    p1.paragraph_format.space_after = Pt(0)
    p1.paragraph_format.space_before = Pt(4)
    try:
        p1.style = 'Firm Name'
    except Exception:
        p1.style = 'Normal'
    p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if not attorney_for:
        attorney_for = f"ATTORNEY FOR APPLICANT\n{client_name}"
    add_styled_run(p1, attorney_for, font_size=10)
    
    # Paragraph 2 & 3: Board and State
    p2 = doc.paragraphs[2]
    p2.text = ""
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.line_spacing = 1.0
    p2.paragraph_format.space_after = Pt(0)
    p2.paragraph_format.space_before = Pt(10)
    try:
        p2.style = 'Normal'
    except Exception:
        pass
    add_styled_run(p2, court_name_1, bold=True, font_size=12)
    
    p3 = doc.paragraphs[3]
    p3.text = ""
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.line_spacing = 1.0
    p3.paragraph_format.space_after = Pt(8)
    p3.paragraph_format.space_before = Pt(0)
    p3.style = 'Normal'
    add_styled_run(p3, court_name_2, bold=True, font_size=12)
    
    # 2. Fill Caption Table (Table 0)
    t0 = doc.tables[0]
    c0_0 = t0.cell(0, 0)
    for p in c0_0.paragraphs:
        p.text = ""
    add_caption_para(c0_0, f"{client_name},", bold=True, font_size=10)
    add_caption_para(c0_0, f"    {plaintiff_label},", bold=False, font_size=10, empty_line_after=True)
    add_caption_para(c0_0, "vs.", bold=False, font_size=10, empty_line_after=True)
    add_caption_para(c0_0, f"{defendants},", bold=True, font_size=10)
    add_caption_para(c0_0, f"    {defendant_label}.", bold=False, font_size=10)
    
    c0_1 = t0.cell(0, 1)
    while len(c0_1.paragraphs) < 15:
        c0_1.add_paragraph(")")
    for p in c0_1.paragraphs[:15]:
        p.text = ")"
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        for rn in p.runs:
            rn.font.name = "Times New Roman"
            rn.font.size = Pt(10)
            
    c0_2 = t0.cell(0, 2)
    for p in c0_2.paragraphs:
        p.text = ""
    case_line = f"Case No: {case_nos}"
    add_caption_para(c0_2, case_line, bold=True, font_size=9.5, empty_line_after=True)
    add_caption_para(c0_2, pleading_title, bold=True, font_size=9.0)
    
    # 3. Clear existing body elements after Table 0 (index 4)
    # Remove all paragraphs after paragraph 3
    p_to_delete = doc.paragraphs[4:]
    for p in p_to_delete:
        p._element.getparent().remove(p._element)
        
    # Remove all tables after Table 0
    while len(doc.tables) > 1:
        tbl = doc.tables[1]
        tbl._element.getparent().remove(tbl._element)
        
    # 4. Parse Markdown Body lines
    body_md = md_content[yaml_match.end():] if yaml_match else md_content
    raw_lines = body_md.split('\n')
    
    # Skip raw caption headers if duplicated in markdown body
    start_idx = 0
    for idx, line in enumerate(raw_lines[:80]):
        l_up = line.replace('**', '').replace('#', '').strip().upper()
        if (
            l_up.startswith("COMES NOW")
            or l_up.startswith("TO THE WORKERS")
            or l_up.startswith("TO THE HONORABLE")
            or l_up.startswith("STATEMENT OF FACTS")
            or l_up.startswith("FACTS")
            or l_up.startswith("INTRODUCTION")
            or (len(l_up) >= 2 and l_up[:2] == "1." and not l_up.startswith("1.0"))
        ):
            start_idx = idx
            break
    lines = raw_lines[start_idx:]
    
    # States for parsing
    current_section = "BODY" # BODY, ORDER, VERIFICATION, PROOF_OF_SERVICE
    table_accumulator = []
    in_table = False
    body_signed = False
    order_signed = False
    verification_signed = False
    pos_signed = False
    
    for line in lines:
        line_strip = line.strip()
        
        # Check table lines
        is_table_line = False
        if line_strip.startswith('|') and '|' in line_strip[1:]:
            is_table_line = True
        elif line_strip and in_table:
            parts = re.split(r'\s{2,}', line_strip)
            if len(parts) >= 2:
                is_table_line = True
                
        if is_table_line:
            in_table = True
            table_accumulator.append(line)
            continue
        elif in_table:
            parse_and_add_table(doc, table_accumulator)
            table_accumulator = []
            in_table = False
            
        if not line_strip or line_strip.startswith("---") or line_strip.startswith("***") or line_strip.startswith("```"):
            continue
            
        # Check Section transitions
        clean_hdr = line_strip.lstrip('#').replace('*', '').strip().upper()
        clean_hdr_no_bracket = clean_hdr.replace('[', '').replace(']', '')
        
        # Check transition to PROPOSED ORDER
        if (clean_hdr_no_bracket in ["PROPOSED ORDER", "ORDER"] or clean_hdr_no_bracket.startswith("PROPOSED ORDER")) and (line_strip.startswith('#') or line_strip.startswith('**')):
            current_section = "ORDER"
            # Add spacing and Court heading
            p_ord_sp = doc.add_paragraph()
            p_ord_sp.paragraph_format.line_spacing = Pt(24)
            p_ord1 = doc.add_paragraph()
            p_ord1.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_ord1.paragraph_format.line_spacing = 1.0
            p_ord1.paragraph_format.space_before = Pt(12)
            p_ord1.paragraph_format.space_after = Pt(2)
            add_styled_run(p_ord1, "BEFORE THE WORKERS COMPENSATION APPEALS BOARD", bold=True, font_size=11)
            
            p_ord2 = doc.add_paragraph()
            p_ord2.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_ord2.paragraph_format.line_spacing = 1.0
            p_ord2.paragraph_format.space_before = Pt(0)
            p_ord2.paragraph_format.space_after = Pt(8)
            add_styled_run(p_ord2, "STATE OF CALIFORNIA", bold=True, font_size=11)
            
            order_title = "ORDER TO COMPEL RELEASE OF DOCUMENTS"
            if "ORDER" in pleading_title.upper():
                order_title = "ORDER"
            add_order_caption_table(doc, client_name, plaintiff_label, defendants, defendant_label, case_nos, order_title)
            continue
            
        # If in ORDER section, skip duplicate raw caption lines
        if current_section == "ORDER":
            if any(term in clean_hdr for term in ["WORKERS' COMPENSATION", "STATE OF CALIFORNIA", "APPLICANT,", "VS.", "DEFENDANT", "CASE NO"]):
                continue
            if clean_hdr.startswith("ORDER COMPELLING") or clean_hdr.startswith("ORDER TO COMPEL"):
                continue
            
        # Check transition to VERIFICATION
        if clean_hdr == "VERIFICATION" and (line_strip.startswith('#') or line_strip.startswith('**')):
            current_section = "VERIFICATION"
            # Heading
            p_v_h = doc.add_paragraph()
            p_v_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_v_h.paragraph_format.line_spacing = Pt(24)
            p_v_h.paragraph_format.space_before = Pt(12)
            p_v_h.paragraph_format.space_after = Pt(4)
            add_styled_run(p_v_h, "VERIFICATION", bold=True, underline=True, font_size=12)
            
            # Venue block
            p_v1 = doc.add_paragraph()
            p_v1.paragraph_format.line_spacing = 1.0
            p_v1.paragraph_format.space_before = Pt(4)
            p_v1.paragraph_format.space_after = Pt(0)
            add_styled_run(p_v1, "STATE OF CALIFORNIA\t\t)", font_size=12)
            
            p_v2 = doc.add_paragraph()
            p_v2.paragraph_format.line_spacing = 1.0
            p_v2.paragraph_format.space_before = Pt(0)
            p_v2.paragraph_format.space_after = Pt(0)
            add_styled_run(p_v2, ") ss.", font_size=12)
            
            p_v3 = doc.add_paragraph()
            p_v3.paragraph_format.line_spacing = 1.0
            p_v3.paragraph_format.space_before = Pt(0)
            p_v3.paragraph_format.space_after = Pt(8)
            add_styled_run(p_v3, "COUNTY OF LOS ANGELES\t)", font_size=12)
            continue
            
        # Check transition to PROOF OF SERVICE
        if clean_hdr.startswith("PROOF OF SERVICE") and (line_strip.startswith('#') or line_strip.startswith('**')):
            current_section = "PROOF_OF_SERVICE"
            p_pos = doc.add_paragraph()
            p_pos.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_pos.paragraph_format.line_spacing = Pt(24)
            p_pos.paragraph_format.space_before = Pt(12)
            p_pos.paragraph_format.space_after = Pt(4)
            add_styled_run(p_pos, "PROOF OF SERVICE", bold=True, underline=True, font_size=12)
            continue
            
        is_lien_claimant = (
            "MEDLAND" in (attorney_contact or "").upper()
            or "MEDLAND" in (attorney_for or "").upper()
            or "LIEN CLAIMANT" in (attorney_for or "").upper()
            or "SPECTRUM" in (attorney_contact or "").upper()
        )
            
        # Check signature triggers in markdown
        if (line_strip.startswith("Respectfully submitted") or line_strip.startswith("Dated:")) and current_section == "BODY":
            if not body_signed:
                p_resp = doc.add_paragraph()
                p_resp.paragraph_format.line_spacing = Pt(24)
                p_resp.paragraph_format.space_before = Pt(8)
                p_resp.paragraph_format.space_after = Pt(4)
                add_styled_run(p_resp, "Respectfully submitted,", font_size=12)
                if is_lien_claimant:
                    p_dt = doc.add_paragraph()
                    p_dt.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_dt, f"Dated: {date_str}", font_size=11)
                    p_line = doc.add_paragraph()
                    p_line.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_line, "_________________________________________", font_size=11)
                    p_nm = doc.add_paragraph()
                    p_nm.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_nm, "Allen Haghighinia", font_size=11)
                    p_ti = doc.add_paragraph()
                    p_ti.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_ti, "Collections Manager", font_size=11)
                    p_co = doc.add_paragraph()
                    p_co.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_co, "MEDLAND MEDICAL TUSTIN", font_size=11)
                else:
                    add_signature_table(doc, date_text=f"Date: {date_str}", firm_name=firm_name, attorney_name=attorney_name, client_name=client_name)
                body_signed = True
            continue
            
        if current_section == "BODY" and body_signed and any(term in clean_hdr for term in ["LAW OFFICES", "ARNULFO", "ATTORNEY FOR", "APPLICANT", "______", "ALLEN HAGHIGHINIA", "COLLECTIONS MANAGER", "MEDLAND"]):
            continue
                
        if (line_strip.startswith("____________________") or "WORKERS' COMPENSATION" in clean_hdr or line_strip.startswith("Dated:")) and current_section == "ORDER":
            if not order_signed:
                # Emit Judge signature block
                p_j0 = doc.add_paragraph()
                p_j0.paragraph_format.line_spacing = 1.0
                p_j0.paragraph_format.space_before = Pt(12)
                p_j0.paragraph_format.space_after = Pt(0)
                add_styled_run(p_j0, "Dated: ___________________", font_size=11)
                
                p_j_sp = doc.add_paragraph()
                p_j_sp.paragraph_format.line_spacing = 1.0
                
                p_j1 = doc.add_paragraph()
                p_j1.paragraph_format.line_spacing = 1.0
                p_j1.paragraph_format.space_before = Pt(0)
                p_j1.paragraph_format.space_after = Pt(0)
                add_styled_run(p_j1, "_______________________________________", font_size=11)
                
                p_j2 = doc.add_paragraph()
                p_j2.paragraph_format.line_spacing = 1.0
                p_j2.paragraph_format.space_before = Pt(0)
                p_j2.paragraph_format.space_after = Pt(0)
                add_styled_run(p_j2, "WORKERS' COMPENSATION JUDGE", bold=True, font_size=10)
                
                p_j3 = doc.add_paragraph()
                p_j3.paragraph_format.line_spacing = 1.0
                p_j3.paragraph_format.space_before = Pt(0)
                p_j3.paragraph_format.space_after = Pt(0)
                add_styled_run(p_j3, "BY:", font_size=10)
                
                p_j4 = doc.add_paragraph()
                p_j4.paragraph_format.line_spacing = 1.0
                p_j4.paragraph_format.space_before = Pt(0)
                p_j4.paragraph_format.space_after = Pt(0)
                add_styled_run(p_j4, "DATE:", font_size=10)
                order_signed = True
            continue
            
        if (line_strip.startswith("____________________") or "ARNULFO" in clean_hdr or "ALLEN" in clean_hdr) and current_section == "VERIFICATION":
            if not verification_signed:
                if is_lien_claimant:
                    p_line = doc.add_paragraph()
                    p_line.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_line, "_________________________________________", font_size=11)
                    p_nm = doc.add_paragraph()
                    p_nm.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_nm, "Allen Haghighinia", font_size=11)
                    p_ti = doc.add_paragraph()
                    p_ti.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_ti, "Collections Manager", font_size=11)
                    p_co = doc.add_paragraph()
                    p_co.paragraph_format.line_spacing = Pt(24)
                    add_styled_run(p_co, "MEDLAND MEDICAL TUSTIN", font_size=11)
                else:
                    add_signature_table(doc, date_text="", firm_name="", attorney_name=attorney_name, client_name=client_name)
                verification_signed = True
            continue
            
        if current_section == "VERIFICATION" and verification_signed and any(term in clean_hdr for term in ["ARNULFO", "______", "ALLEN", "COLLECTIONS MANAGER", "MEDLAND"]):
            continue
            
        if (line_strip.startswith("____________________") or "DECLARANT" in clean_hdr) and current_section == "PROOF_OF_SERVICE":
            if not pos_signed:
                p_line = doc.add_paragraph()
                p_line.paragraph_format.line_spacing = Pt(24)
                add_styled_run(p_line, "_________________________________________", font_size=11)
                p_decl = doc.add_paragraph()
                p_decl.paragraph_format.line_spacing = Pt(24)
                add_styled_run(p_decl, "Declarant", font_size=11)
                pos_signed = True
            continue
            
        # Determine paragraph styling
        is_heading = (
            line_strip.startswith('#')
            or clean_hdr in [
                "FACTS", "STATEMENT OF FACTS", "STATEMENT OF VERIFIED FACTS",
                "ARGUMENT", "POINTS AND AUTHORITIES", "CONTENTIONS",
                "CONCLUSION", "PRAYER FOR RELIEF", "CONCLUSION & PRAYER FOR RELIEF"
            ]
        )
        
        is_numbered_list = bool(re.match(r'^\d+\.\s+', line_strip))
        is_sub_list = bool(re.match(r'^[a-z]\.\s+', line_strip))
        is_blockquote = line_strip.startswith('>')
        
        p = doc.add_paragraph()
        if is_heading:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = Pt(24) # 304800 dxa
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            clean_text = line_strip.lstrip('#').strip()
            render_rich_paragraph(p, clean_text, default_bold=True, default_underline=True, font_size=12)
        elif is_sub_list:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = Pt(24)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.left_indent = Inches(1.2)
            p.paragraph_format.first_line_indent = Inches(-0.4)
            # Use tab between bullet and text
            parts = re.split(r'^([a-z]\.)\s+', line_strip)
            if len(parts) >= 3:
                render_rich_paragraph(p, f"{parts[1]}\t{parts[2]}", font_size=12)
            else:
                render_rich_paragraph(p, line_strip, font_size=12)
        elif is_numbered_list:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = Pt(24)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.left_indent = Inches(0.8)
            p.paragraph_format.first_line_indent = Inches(-0.4)
            parts = re.split(r'^(\d+\.)\s+', line_strip)
            if len(parts) >= 3:
                render_rich_paragraph(p, f"{parts[1]}\t{parts[2]}", font_size=12)
            else:
                render_rich_paragraph(p, line_strip, font_size=12)
        elif is_blockquote:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = Pt(20)
            p.paragraph_format.left_indent = Inches(0.5)
            p.paragraph_format.right_indent = Inches(0.5)
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            clean_text = line_strip.lstrip('>').strip()
            render_rich_paragraph(p, clean_text, default_italic=True, font_size=11)
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = Pt(24)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            # First line indent 0.5 inches on regular body paragraphs
            p.paragraph_format.first_line_indent = Inches(0.5)
            render_rich_paragraph(p, line_strip, font_size=12)

    if in_table and table_accumulator:
        parse_and_add_table(doc, table_accumulator)
        
    # 5. Dynamically update running footer with correct pleading title
    if not footer_text:
        footer_text = pleading_title
    if len(footer_text) > 85:
        footer_text = footer_text[:85] + "..."
        
    for sec in doc.sections:
        for tbl in sec.footer.tables:
            for row in tbl.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        if any(k in p.text.upper() for k in ["WORKERS' COMPENSATION", "PETITION", "ORDER", "BRIEF"]):
                            p.text = ""
                            r = p.add_run(footer_text)
                            r.font.name = "Arial"
                            r.font.size = Pt(9)
                            
    # Save the output document
    doc.save(docx_path)
    print(f"Successfully compiled conformed 28-line legal paper to: {docx_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python compile_markdown_to_pleading.py <input_markdown_path> <output_docx_path> [template_docx_path]")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    template_path = sys.argv[3] if len(sys.argv) >= 4 else None
    
    compile_markdown_to_pleading(input_path, output_path, template_path)
