#!/usr/bin/env python3
"""
Fix page numbers: Roman numerals for front matter, Arabic for main content.

Standard PKL convention:
- Cover = no page number  
- Preliminary pages (Persetujuan → Daftar Lampiran) = Roman: i, ii, iii...
- BAB I → DAFTAR PUSTAKA = Arabic: 1, 2, 3...
- LAMPIRAN = Arabic continuing from main content

Approach:
- Insert a NEW paragraph with sectPr (section break) BEFORE BAB I
- This creates two sections: front matter (roman) + main content (arabic)
"""

import copy
from lxml import etree
from docx import Document
from docx.oxml.ns import qn

INPUT = 'LAPORAN_PKL_v12_Final.docx'
OUTPUT = 'LAPORAN_PKL_v13_Roman.docx'

nsmap = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def find_body_child_index(body, para_elem):
    """Find the index of a paragraph element in body's children."""
    for i, child in enumerate(body):
        if child is para_elem:
            return i
    return -1


def main():
    print(f"📄 Loading: {INPUT}")
    doc = Document(INPUT)
    body = doc.element.body
    
    # Get all paragraphs
    paragraphs = list(body.iter(qn('w:p')))
    
    # Find BAB I paragraph
    bab_i_para = None
    for p in paragraphs:
        full_text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip().upper()
        if 'BAB I' in full_text and ('PENDAHULUAN' in full_text or 'PENDAHULU' in full_text):
            bab_i_para = p
            original_text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
            print(f"✅ Found BAB I: '{original_text[:60]}'")
            break
    
    if bab_i_para is None:
        print("❌ Could not find BAB I!")
        return
    
    # ===== STEP 1: Create a section break paragraph before BAB I =====
    
    # Create new paragraph element for the section break
    sect_break_para = etree.SubElement(etree.Element('dummy'), qn('w:p'))
    
    # Create pPr for this paragraph
    pPr = etree.SubElement(sect_break_para, qn('w:pPr'))
    
    # Create sectPr inside pPr — this is the "main content" section
    sectPr = etree.SubElement(pPr, qn('w:sectPr'))
    
    # Section type: nextPage (clear page break before BAB I)
    sectType = etree.SubElement(sectPr, qn('w:type'))
    sectType.set(qn('w:val'), 'nextPage')
    
    # Page numbering for main content: decimal, start at 1
    pgNumType_main = etree.SubElement(sectPr, qn('w:pgNumType'))
    pgNumType_main.set(qn('w:fmt'), 'decimal')
    pgNumType_main.set(qn('w:start'), '1')
    
    # Copy page size and margin properties from body sectPr
    body_sectPr = body.find(qn('w:sectPr'))
    if body_sectPr is not None:
        for child in body_sectPr:
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag not in ('pgNumType', 'type'):  # Don't copy pgNumType or type
                sectPr.insert(0, copy.deepcopy(child))
    
    # ===== STEP 2: Configure front matter section (body-level sectPr) =====
    
    if body_sectPr is not None:
        # Remove existing pgNumType from body sectPr
        for existing in body_sectPr.findall(qn('w:pgNumType')):
            body_sectPr.remove(existing)
        
        # Set Roman numeral for front matter
        pgNumType_front = etree.SubElement(body_sectPr, qn('w:pgNumType'))
        pgNumType_front.set(qn('w:fmt'), 'upperRoman')
        pgNumType_front.set(qn('w:start'), '1')
    
    # ===== STEP 3: Insert the section break paragraph before BAB I =====
    
    # We need to insert before BAB I in the body's direct children
    # But body's children can be <w:p>, <w:sectPr>, <w:tbl>, etc.
    # We need to find the right position
    
    # Find BAB I's position in body children
    bab_i_idx = None
    for i, child in enumerate(body):
        if child is bab_i_para:
            bab_i_idx = i
            break
    
    if bab_i_idx is None:
        print("❌ Could not find BAB I in body children!")
        return
    
    print(f"📄 Inserting section break at body child index {bab_i_idx}")
    
    # Insert the section break paragraph before BAB I
    body.insert(bab_i_idx, sect_break_para)
    
    # ===== STEP 4: Hide the section break paragraph =====
    # The section break paragraph will be visible as an empty paragraph
    # We need to make it invisible (no text, no spacing, hidden)
    
    # Actually, let's just make it a minimal paragraph with no content
    # Word will handle it as a section break marker
    
    # ===== SAVE =====
    doc.save(OUTPUT)
    print(f"💾 Saved: {OUTPUT}")
    
    # ===== VERIFY =====
    print("\n📊 Verification:")
    doc2 = Document(OUTPUT)
    body2 = doc2.element.body
    
    sect_count = 0
    for i, child in enumerate(body2):
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        
        # Check paragraph-level sectPr
        if tag == 'p':
            pPr2 = child.find(qn('w:pPr'))
            if pPr2 is not None:
                sectPr2 = pPr2.find(qn('w:sectPr'))
                if sectPr2 is not None:
                    sect_count += 1
                    pgNum2 = sectPr2.find(qn('w:pgNumType'))
                    fmt2 = pgNum2.get(qn('w:fmt'), 'none') if pgNum2 is not None else 'none'
                    start2 = pgNum2.get(qn('w:start'), 'auto') if pgNum2 is not None else 'auto'
                    stype2_el = sectPr2.find(qn('w:type'))
                    stype2 = stype2_el.get(qn('w:val'), 'none') if stype2_el is not None else 'none'
                    
                    # Get text of the next paragraph (BAB I)
                    if i + 1 < len(body2):
                        next_p = body2[i + 1]
                        next_text = ''.join(t.text or '' for t in next_p.iter(qn('w:t'))).strip()[:40]
                    else:
                        next_text = ''
                    
                    print(f"  Section {sect_count} (before '{next_text}'): fmt={fmt2}, start={start2}, break={stype2}")
        
        # Check body-level sectPr
        if tag == 'sectPr':
            sect_count += 1
            pgNum3 = child.find(qn('w:pgNumType'))
            fmt3 = pgNum3.get(qn('w:fmt'), 'none') if pgNum3 is not None else 'none'
            start3 = pgNum3.get(qn('w:start'), 'auto') if pgNum3 is not None else 'auto'
            print(f"  Section {sect_count} (body-level/front matter): fmt={fmt3}, start={start3}")
    
    print(f"\n  Total sections: {sect_count}")
    
    # Also check total paragraphs to make sure we didn't lose any
    total_paras = len(list(body2.iter(qn('w:p'))))
    print(f"  Total paragraphs: {total_paras}")


if __name__ == '__main__':
    main()
