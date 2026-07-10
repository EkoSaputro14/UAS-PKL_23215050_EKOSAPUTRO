#!/usr/bin/env python3
"""
Quick fix: Correct the TOC page number for BAB III and verify all entries.
This patches the v13 output without full rebuild.
"""

from docx import Document
from docx.oxml.ns import qn
import re

doc = Document('LAPORAN_PKL_v13_Roman.docx')
body = doc.element.body

# Correct TOC page numbers — use longest match first
corrections = {
    'BAB I PENDAHULUAN': 2,
    'BAB IPENDAHULUAN': 2,
    'BAB II GAMBARAN': 5,
    'BAB IIGAMBARAN': 5,
    'BAB III METODE': 8,        # Fixed: was incorrectly set to 5
    'BAB IIIMETODE': 8,
    'BAB IV HASIL': 11,
    'BAB IVHASIL': 11,
    'BAB V PENUTUP': 19,
    'BAB VPENUTUP': 19,
    '5.1 Kesimpulan': 19,
    '5.2 Saran': 19,
    'DAFTAR PUSTAKA': 21,
    'LAMPIRAN': 23,
    'Lampiran A:': 23,
    'Lampiran B:': 23,
    'Lampiran C:': 23,
}

# Sort by key length descending (longest first) to avoid substring matching
sorted_corrections = sorted(corrections.items(), key=lambda x: len(x[0]), reverse=True)

count = 0
for p in body.iter(qn('w:p')):
    full_text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
    
    pPr = p.find(qn('w:pPr'))
    if pPr is None:
        continue
    pStyle = pPr.find(qn('w:pStyle'))
    if pStyle is None:
        continue
    style = pStyle.get(qn('w:val'), '')
    if style not in ('TOC1', 'TOC2', 'TOC3'):
        continue
    
    for key, new_page in sorted_corrections:
        if key in full_text:
            nums = re.findall(r'(\d+)\s*$', full_text)
            if nums:
                old_page = int(nums[0])
                if old_page != new_page:
                    for run_elem in p.iter(qn('w:r')):
                        t = run_elem.find(qn('w:t'))
                        if t is not None and t.text:
                            t.text = re.sub(r'\d+\s*$', str(new_page), t.text)
                    count += 1
                    print(f"Fixed: '{full_text[:50]}' {old_page}→{new_page}")
            break

doc.save('LAPORAN_PKL_v13_Roman.docx')
print(f"\nTotal fixes: {count}")

# Verify all TOC entries
print("\n📋 Final TOC entries:")
doc2 = Document('LAPORAN_PKL_v13_Roman.docx')
for p in doc2.element.body.iter(qn('w:p')):
    pPr = p.find(qn('w:pPr'))
    if pPr is not None:
        pStyle = pPr.find(qn('w:pStyle'))
        if pStyle is not None:
            style = pStyle.get(qn('w:val'), '')
            if style in ('TOC1', 'TOC2', 'TOC3'):
                text = ''.join(t.text or '' for t in p.iter(qn('w:t'))).strip()
                prefix = '  ' if style == 'TOC2' else '    ' if style == 'TOC3' else ''
                print(f"{prefix}{text}")
