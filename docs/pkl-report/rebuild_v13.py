#!/usr/bin/env python3
"""
FINAL REBUILD: Fix all remaining issues in v12 → v13

Issues found:
1. Roman numerals for front matter (DONE in v13, but needs TOC fix)
2. TOC page numbers off by 1 (due to section break before BAB I)
3. DAFTAR PUSTAKA and LAMPIRAN page numbers wrong in TOC
4. Duplicate caption text (3 images)
5. Comma standalone in Lembar Persetujuan
6. Capstone sentence fix
7. Empty paragraph before BAB I (from section break) needs to be invisible

This script rebuilds from v12, applies ALL fixes, and outputs v13.
"""

import copy
import re
from lxml import etree
from docx import Document
from docx.oxml.ns import qn

INPUT = 'LAPORAN_PKL_v12_Final.docx'
OUTPUT = 'LAPORAN_PKL_v13_Roman.docx'

nsmap_w = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'


def find_paragraph_by_text(body, search_text, exact=False):
    """Find a paragraph containing search text."""
    for p in body.iter(qn('w:p')):
        full_text = ''.join(t.text or '' for t in p.iter(qn('w:t')))
        if exact:
            if full_text.strip() == search_text:
                return p
        else:
            if search_text in full_text:
                return p
    return None


def fix_duplicate_captions(body):
    """Fix caption duplication (e.g. 'Use Case Diagram Sistem Mimotes AI Sistem Mimotes AI')"""
    count = 0
    for p in body.iter(qn('w:p')):
        # Check if this is a caption (starts with 'Gambar' or 'Tabel')
        full_text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
        if not (full_text.startswith('Gambar') or full_text.startswith('Tabel')):
            continue
        
        # Check for duplicate patterns
        # Pattern: "X Sistem Mimotes AI Sistem Mimotes AI" or "X Dokumen Dokumen"
        patterns = [
            (r'(Sistem Mimotes AI)\s+Sistem Mimotes AI', r'\1'),
            (r'(Upload Dokumen)\s+Dokumen', r'\1'),
            (r'(Arsitektur Sistem Mimotes AI)\s+Mimotes AI', r'\1'),
            (r'(Arsitektur RAG Pipeline)\s+RAG Pipeline', r'\1'),
            (r'(Arsitektur CRM Pipeline)\s+CRM Pipeline', r'\1'),
            (r'(Activity Diagram Proses Chat RAG)\s+Chat RAG', r'\1'),
            (r'(Entity Relationship Diagram \(ERD\))\s+ERD', r'\1'),
        ]
        
        for pattern, replacement in patterns:
            new_text = re.sub(pattern, replacement, full_text)
            if new_text != full_text:
                # Fix the runs
                for run_elem in p.iter(qn('w:r')):
                    t = run_elem.find(qn('w:t'))
                    if t is not None and t.text:
                        for pat, rep in patterns:
                            t.text = re.sub(pat, rep, t.text)
                count += 1
                print(f"  ✅ Fixed caption: '{full_text[:60]}' → '{new_text[:60]}'")
    
    return count


def fix_comma_standalone(body):
    """Fix standalone comma before dosen name in Lembar Persetujuan."""
    count = 0
    for p in body.iter(qn('w:p')):
        full_text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
        # Pattern: just "," on its own line
        if full_text == ',':
            # Check if it's near "Mengetahui" or "Dosen Pembimbing"
            # Remove the comma from runs
            for run_elem in p.iter(qn('w:r')):
                t = run_elem.find(qn('w:t'))
                if t is not None and t.text:
                    t.text = t.text.replace(',', '').strip()
            count += 1
            print(f"  ✅ Removed standalone comma")
    
    return count


def fix_capstone_sentence(body):
    """Fix capstone sentence to use 'prototipe' framing."""
    count = 0
    for p in body.iter(qn('w:p')):
        for run_elem in p.iter(qn('w:r')):
            t = run_elem.find(qn('w:t'))
            if t is not None and t.text:
                old = t.text
                # Fix the specific sentence
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
                    if t.text != old:
                        count += 1
                        print(f"  ✅ Fixed capstone sentence")
    
    return count


def fix_toc_page_numbers(body):
    """Fix TOC page numbers that are off by 1 (due to section break) and wrong entries."""
    count = 0
    
    # Map of entries that need page number corrections
    # These were calculated for pre-section-break layout
    corrections = {
        # DAFTAR PUSTAKA should be around page 20 (actual)
        # LAMPIRAN should be around page 22 (actual)
        # The section break added 1 page, so entries after BAB I shift by 1
        'BAB IPENDAHULUAN': 2,    # was 1, now +1 for section break
        'BAB I PENDAHULUAN': 2,
        'BAB II': 5,              # was 4, now +1
        'BAB III': 8,             # was 7, now +1
        'BAB IV': 11,             # was 10, now +1
        'BAB V': 19,              # was 18, now +1
        'Kesimpulan': 19,
        'Saran': 19,
        'DAFTAR PUSTAKA': 21,     # was 20, now +1
        'LAMPIRAN': 23,           # was 22, now +1
        'Lampiran A': 23,
        'Lampiran B': 23,
        'Lampiran C': 23,
    }
    
    for p in body.iter(qn('w:p')):
        full_text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
        
        # Check if this is a TOC entry
        pPr = p.find(qn('w:pPr'))
        if pPr is None:
            continue
        pStyle = pPr.find(qn('w:pStyle'))
        if pStyle is None:
            continue
        style = pStyle.get(qn('w:val'), '')
        if style not in ('TOC1', 'TOC2', 'TOC3'):
            continue
        
        # Find the page number at the end (after tab)
        for key, new_page in corrections.items():
            if key in full_text:
                # Extract current page number
                # Page number is usually the last number in the text
                nums = re.findall(r'(\d+)\s*$', full_text)
                if nums:
                    old_page = int(nums[0])
                    if old_page != new_page:
                        # Fix in runs
                        for run_elem in p.iter(qn('w:r')):
                            t = run_elem.find(qn('w:t'))
                            if t is not None and t.text:
                                # Replace the page number at the end
                                t.text = re.sub(r'\d+\s*$', str(new_page), t.text)
                        count += 1
                        print(f"  ✅ Fixed TOC page: '{full_text[:40]}' {old_page}→{new_page}")
                break
    
    return count


def make_section_break_paragraph(doc):
    """Create a paragraph with section break for front matter → main content transition."""
    # Create a new paragraph
    sect_break = etree.SubElement(etree.Element('dummy'), qn('w:p'))
    
    # Create pPr
    pPr = etree.SubElement(sect_break, qn('w:pPr'))
    
    # Create sectPr inside pPr — main content section
    sectPr = etree.SubElement(pPr, qn('w:sectPr'))
    
    # Section type: nextPage
    sectType = etree.SubElement(sectPr, qn('w:type'))
    sectType.set(qn('w:val'), 'nextPage')
    
    # Page numbering: decimal, start at 1
    pgNum = etree.SubElement(sectPr, qn('w:pgNumType'))
    pgNum.set(qn('w:fmt'), 'decimal')
    pgNum.set(qn('w:start'), '1')
    
    # Copy page geometry from body sectPr
    body_sectPr = doc.element.body.find(qn('w:sectPr'))
    if body_sectPr is not None:
        for child in body_sectPr:
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag not in ('pgNumType', 'type'):
                sectPr.insert(0, copy.deepcopy(child))
    
    return sect_break


def set_front_matter_roman(body):
    """Set body-level sectPr to Roman numerals for front matter."""
    body_sectPr = body.find(qn('w:sectPr'))
    if body_sectPr is None:
        return False
    
    # Remove existing pgNumType
    for existing in body_sectPr.findall(qn('w:pgNumType')):
        body_sectPr.remove(existing)
    
    # Set Roman numerals, start at 1 (i)
    pgNum = etree.SubElement(body_sectPr, qn('w:pgNumType'))
    pgNum.set(qn('w:fmt'), 'upperRoman')
    pgNum.set(qn('w:start'), '1')
    
    return True


def main():
    print(f"📄 Loading: {INPUT}")
    doc = Document(INPUT)
    body = doc.element.body
    
    # ===== STEP 1: Fix captions =====
    print("\n📝 Step 1: Fix duplicate captions")
    fix_duplicate_captions(body)
    
    # ===== STEP 2: Fix comma =====
    print("\n📝 Step 2: Fix standalone comma")
    fix_comma_standalone(body)
    
    # ===== STEP 3: Fix capstone sentence =====
    print("\n📝 Step 3: Fix capstone sentence")
    fix_capstone_sentence(body)
    
    # ===== STEP 4: Fix TOC page numbers =====
    print("\n📝 Step 4: Fix TOC page numbers")
    fix_toc_page_numbers(body)
    
    # ===== STEP 5: Add section break before BAB I =====
    print("\n📝 Step 5: Add section break before BAB I")
    
    # Find BAB I in the CLEAN content (with page numbers in text)
    bab_i_clean = None
    for p in body.iter(qn('w:p')):
        full_text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
        pPr = p.find(qn('w:pPr'))
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None and pStyle.get(qn('w:val'), '') == 'Heading1':
                if 'BAB I' in full_text and 'PENDAHULUAN' in full_text:
                    # Check if this is the TOC version (has page number at end) or content version
                    if not re.search(r'\d+$', full_text):
                        bab_i_clean = p
                        print(f"  Found content BAB I: '{full_text[:50]}'")
                        break
    
    if bab_i_clean is None:
        # Try finding the first Heading1 with "BAB I" that doesn't have a number suffix
        for p in body.iter(qn('w:p')):
            full_text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
            pPr = p.find(qn('w:pPr'))
            if pPr is not None:
                pStyle = pPr.find(qn('w:pStyle'))
                if pStyle is not None and pStyle.get(qn('w:val'), '') == 'Heading1':
                    if 'BAB I' in full_text:
                        bab_i_clean = p
                        print(f"  Found BAB I (fallback): '{full_text[:50]}'")
                        break
    
    if bab_i_clean is not None:
        # Create section break paragraph
        sect_break = make_section_break_paragraph(doc)
        
        # Find index of BAB I in body children
        bab_i_idx = None
        for i, child in enumerate(body):
            if child is bab_i_clean:
                bab_i_idx = i
                break
        
        if bab_i_idx is not None:
            # Insert section break before BAB I
            body.insert(bab_i_idx, sect_break)
            print(f"  ✅ Section break inserted at body index {bab_i_idx}")
        else:
            print("  ❌ Could not find BAB I in body children")
    else:
        print("  ❌ Could not find BAB I paragraph")
    
    # ===== STEP 6: Set front matter to Roman numerals =====
    print("\n📝 Step 6: Set front matter to Roman numerals")
    set_front_matter_roman(body)
    print("  ✅ Front matter: upperRoman, start=1")
    
    # ===== SAVE =====
    doc.save(OUTPUT)
    print(f"\n💾 Saved: {OUTPUT}")
    
    # ===== VERIFY =====
    print("\n📊 Verification:")
    doc2 = Document(OUTPUT)
    body2 = doc2.element.body
    
    sect_count = 0
    for i, child in enumerate(body2):
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'p':
            pPr = child.find(qn('w:pPr'))
            if pPr is not None:
                sectPr = pPr.find(qn('w:sectPr'))
                if sectPr is not None:
                    sect_count += 1
                    pgNum = sectPr.find(qn('w:pgNumType'))
                    fmt = pgNum.get(qn('w:fmt'), 'none') if pgNum is not None else 'none'
                    start = pgNum.get(qn('w:start'), 'auto') if pgNum is not None else 'auto'
                    next_p = body2[i + 1] if i + 1 < len(body2) else None
                    next_text = ''.join(t.text or '' for t in next_p.iter(qn('w:t'))).strip()[:40] if next_p is not None else ''
                    print(f"  Section {sect_count} (before '{next_text}'): fmt={fmt}, start={start}")
        if tag == 'sectPr':
            sect_count += 1
            pgNum = child.find(qn('w:pgNumType'))
            fmt = pgNum.get(qn('w:fmt'), 'none') if pgNum is not None else 'none'
            start = pgNum.get(qn('w:start'), 'auto') if pgNum is not None else 'auto'
            print(f"  Section {sect_count} (body-level/front matter): fmt={fmt}, start={start}")
    
    print(f"\n  Total sections: {sect_count}")
    
    # Count TOC entries
    toc_count = 0
    for p in body2.iter(qn('w:p')):
        pPr = p.find(qn('w:pPr'))
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None and pStyle.get(qn('w:val'), '') in ('TOC1', 'TOC2', 'TOC3'):
                toc_count += 1
    print(f"  TOC entries: {toc_count}")
    
    # Check for duplicate captions
    captions = []
    for p in body2.iter(qn('w:p')):
        text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
        if text.startswith('Gambar') or text.startswith('Tabel'):
            captions.append(text)
    
    # Check for duplicates
    seen = {}
    dupes = []
    for c in captions:
        if c in seen:
            dupes.append(c)
        seen[c] = True
    
    if dupes:
        print(f"\n  ⚠️  Duplicate captions found: {len(dupes)}")
        for d in dupes:
            print(f"    - {d[:60]}")
    else:
        print(f"\n  ✅ No duplicate captions ({len(captions)} unique)")


if __name__ == '__main__':
    main()
