#!/usr/bin/env python3
"""Verify section breaks and page numbering in the document."""

from docx import Document
from docx.oxml.ns import qn
from lxml import etree

w = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

doc = Document('LAPORAN_PKL_v13_Roman.docx')
body = doc.element.body

# Count all sectPr elements
all_sectPrs = []
for i, child in enumerate(body):
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        pPr = child.find(qn('w:pPr'))
        if pPr is not None:
            sectPr = pPr.find(qn('w:sectPr'))
            if sectPr is not None:
                # Get text of this paragraph
                full_text = ''.join(t.text or '' for t in child.iter(qn('w:t')))
                all_sectPrs.append(('paragraph', i, sectPr, full_text.strip()[:50]))
    
    if tag == 'sectPr':
        all_sectPrs.append(('body', i, child, 'BODY-LEVEL'))

print(f"Total sectPr found: {len(all_sectPrs)}")
for loc, idx, sp, text in all_sectPrs:
    pgNum = sp.find(qn('w:pgNumType'))
    sectType = sp.find(qn('w:type'))
    fmt = pgNum.get(qn('w:fmt'), 'none') if pgNum is not None else 'none'
    start = pgNum.get(qn('w:start'), 'auto') if pgNum is not None else 'auto'
    stype = sectType.get(qn('w:val'), 'none') if sectType is not None else 'none'
    print(f"  [{loc}] idx={idx}: fmt={fmt}, start={start}, type={stype}")
    print(f"    text: '{text}'")
