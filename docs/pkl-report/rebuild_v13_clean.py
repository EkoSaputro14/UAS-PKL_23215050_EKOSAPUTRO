#!/usr/bin/env python3
"""
CLEAN REBUILD v13: Apply all fixes from v12 in correct order.

Fixes:
1. Section break before CONTENT BAB I (not TOC entry)
2. Roman numerals for front matter
3. Arabic numerals for main content (start=1)
4. Fix duplicate captions
5. Fix standalone comma
6. Fix capstone sentence
"""

import copy
import re
from lxml import etree
from docx import Document
from docx.oxml.ns import qn

INPUT = 'LAPORAN_PKL_v12_Final.docx'
OUTPUT = 'LAPORAN_PKL_v13_Roman.docx'


def main():
    print(f"📄 Loading: {INPUT}")
    doc = Document(INPUT)
    body = doc.element.body
    
    # Get all body children (not just paragraphs — includes tables, sectPr, etc.)
    children = list(body)
    print(f"  Body children: {len(children)}")
    
    # ===== STEP 1: Find the CONTENT "BAB I" heading =====
    # Content headings use Heading1 style, TOC entries use TOC1/TOC2/TOC3
    content_bab_i = None
    content_bab_i_idx = None
    
    for i, child in enumerate(children):
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag != 'p':
            continue
        
        pPr = child.find(qn('w:pPr'))
        if pPr is None:
            continue
        pStyle = pPr.find(qn('w:pStyle'))
        if pStyle is None:
            continue
        style = pStyle.get(qn('w:val'), '')
        
        # Content headings use Heading1, NOT TOC styles
        if style != 'Heading1':
            continue
        
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        if 'BAB I' in text and 'PENDAHULUAN' in text:
            content_bab_i = child
            content_bab_i_idx = i
            print(f"  ✅ Found CONTENT BAB I at index {i}: '{text[:50]}' (style={style})")
            break
    
    if content_bab_i is None:
        print("  ❌ Could not find content BAB I heading!")
        return
    
    # ===== STEP 2: Create section break paragraph =====
    sect_break = etree.SubElement(etree.Element('dummy'), qn('w:p'))
    pPr = etree.SubElement(sect_break, qn('w:pPr'))
    sectPr = etree.SubElement(pPr, qn('w:sectPr'))
    
    # Section type: nextPage
    sectType = etree.SubElement(sectPr, qn('w:type'))
    sectType.set(qn('w:val'), 'nextPage')
    
    # Page numbering: decimal, start at 1
    pgNum = etree.SubElement(sectPr, qn('w:pgNumType'))
    pgNum.set(qn('w:fmt'), 'decimal')
    pgNum.set(qn('w:start'), '1')
    
    # Copy page geometry from body sectPr
    body_sectPr = body.find(qn('w:sectPr'))
    if body_sectPr is not None:
        for child in body_sectPr:
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag not in ('pgNumType', 'type'):
                sectPr.insert(0, copy.deepcopy(child))
    
    # ===== STEP 3: Insert section break before CONTENT BAB I =====
    body.insert(content_bab_i_idx, sect_break)
    print(f"  ✅ Section break inserted at index {content_bab_i_idx}")
    
    # ===== STEP 4: Set front matter to Roman numerals =====
    body_sectPr = body.find(qn('w:sectPr'))
    if body_sectPr is not None:
        for existing in body_sectPr.findall(qn('w:pgNumType')):
            body_sectPr.remove(existing)
        pgNum_front = etree.SubElement(body_sectPr, qn('w:pgNumType'))
        pgNum_front.set(qn('w:fmt'), 'upperRoman')
        pgNum_front.set(qn('w:start'), '1')
        print("  ✅ Front matter: upperRoman, start=1")
    
    # ===== STEP 5: Fix duplicate captions =====
    caption_fixes = [
        (r'(Sistem Mimotes AI)\s+Sistem Mimotes AI', r'\1'),
        (r'(Upload Dokumen)\s+Dokumen', r'\1'),
        (r'(Arsitektur Sistem Mimotes AI)\s+Mimotes AI', r'\1'),
    ]
    for p in body.iter(qn('w:p')):
        text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
        if not (text.startswith('Gambar') or text.startswith('Tabel')):
            continue
        for pattern, replacement in caption_fixes:
            new_text = re.sub(pattern, replacement, text)
            if new_text != text:
                for run_elem in p.iter(qn('w:r')):
                    t = run_elem.find(qn('w:t'))
                    if t is not None and t.text:
                        for pat, rep in caption_fixes:
                            t.text = re.sub(pat, rep, t.text)
                print(f"  ✅ Fixed caption: '{text[:60]}'")
    
    # ===== STEP 6: Fix standalone comma =====
    for p in body.iter(qn('w:p')):
        text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
        if text == ',':
            for run_elem in p.iter(qn('w:r')):
                t = run_elem.find(qn('w:t'))
                if t is not None and t.text:
                    t.text = t.text.replace(',', '').strip()
            print("  ✅ Removed standalone comma")
    
    # ===== STEP 7: Fix capstone sentence =====
    for p in body.iter(qn('w:p')):
        for run_elem in p.iter(qn('w:r')):
            t = run_elem.find(qn('w:t'))
            if t is not None and t.text:
                if 'Pengembangan sistem chatbot AI' in t.text and 'capstone project' in t.text:
                    t.text = t.text.replace(
                        'Pengembangan sistem chatbot AI',
                        'Pengembangan prototipe sistem chatbot AI'
                    )
                    if 'untuk optimalisasi' in t.text:
                        t.text = t.text.replace(
                            'untuk optimalisasi',
                            'untuk mendukung optimalisasi'
                        )
                    print("  ✅ Fixed capstone sentence")
    
    # ===== SAVE =====
    doc.save(OUTPUT)
    print(f"\n💾 Saved: {OUTPUT}")
    
    # ===== VERIFY =====
    print("\n📊 Verification:")
    doc2 = Document(OUTPUT)
    body2 = doc2.element.body
    children2 = list(body2)
    
    # Find section breaks
    for i, child in enumerate(children2):
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'p':
            pPr = child.find(qn('w:pPr'))
            if pPr is not None:
                sectPr = pPr.find(qn('w:sectPr'))
                if sectPr is not None:
                    pgNum = sectPr.find(qn('w:pgNumType'))
                    fmt = pgNum.get(qn('w:fmt'), 'none') if pgNum is not None else 'none'
                    start = pgNum.get(qn('w:start'), 'auto') if pgNum is not None else 'auto'
                    next_text = ''
                    if i + 1 < len(children2):
                        next_text = ''.join(t.text or '' for t in children2[i+1].iter(qn('w:t'))).strip()[:40]
                    print(f"  Section break at idx {i}: fmt={fmt}, start={start}, next='{next_text}'")
        if tag == 'sectPr':
            pgNum = child.find(qn('w:pgNumType'))
            fmt = pgNum.get(qn('w:fmt'), 'none') if pgNum is not None else 'none'
            start = pgNum.get(qn('w:start'), 'auto') if pgNum is not None else 'auto'
            print(f"  Body-level sectPr at idx {i}: fmt={fmt}, start={start}")
    
    # Count headings in front matter vs content
    front_headings = []
    content_headings = []
    found_break = False
    for child in children2:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'p':
            pPr = child.find(qn('w:pPr'))
            if pPr is not None:
                sectPr = pPr.find(qn('w:sectPr'))
                if sectPr is not None:
                    found_break = True
                    continue
                pStyle = pPr.find(qn('w:pStyle'))
                if pStyle is not None and pStyle.get(qn('w:val'), '') == 'Heading1':
                    text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
                    if found_break:
                        content_headings.append(text)
                    else:
                        front_headings.append(text)
    
    print(f"\n  Front matter headings: {len(front_headings)}")
    for h in front_headings:
        print(f"    - {h}")
    print(f"  Content headings: {len(content_headings)}")
    for h in content_headings:
        print(f"    - {h}")


if __name__ == '__main__':
    main()
