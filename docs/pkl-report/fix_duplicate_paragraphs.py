#!/usr/bin/env python3
"""
Remove duplicate paragraphs in section 2.4 (Job Deskripsi).
The old content paragraphs are still present after the new content.
"""

from docx import Document
from docx.oxml.ns import qn

doc = Document('LAPORAN_PKL_v13_Roman.docx')
body = doc.element.body

# Find the old content paragraphs that need to be removed
# These are the paragraphs after "Logbook kegiatan" that contain old text
old_texts = [
    "Input data PPAT (Pejabat Pembuat Akta Tanah) dan pembuatan SKPT (Surat Keterangan Pendaftaran Tanah) untuk keperluan lelang property.",
    "Validasi pajak PPH di Kantor Pajak Pratama Tegal.",
    "Pelaksanaan dan pengelolaan lelang property.",
    "Pengembangan prototipe sistem chatbot AI (Mimotes) sebagai capstone project untuk mendukung optimalisasi layanan pelanggan.",
    "Pemasangan banner lelang di lokasi dan penyerahan risalah lelang.",
]

# Find paragraphs to remove
paras_to_remove = []
for child in list(body):
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        for old_text in old_texts:
            if text == old_text:
                paras_to_remove.append(child)
                break

print(f"Found {len(paras_to_remove)} duplicate paragraphs to remove")

# Remove them
for para in paras_to_remove:
    body.remove(para)
    text = ''.join(t.text or '' for t in para.iter(qn('w:t'))).strip()[:60]
    print(f"  Removed: '{text}'")

doc.save('LAPORAN_PKL_v13_Roman.docx')
print(f"\n💾 Saved: LAPORAN_PKL_v13_Roman.docx")

# Verify
doc2 = Document('LAPORAN_PKL_v13_Roman.docx')
body2 = doc2.element.body
in_section = None
for child in body2:
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        pPr = child.find(qn('w:pPr'))
        style = ''
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None:
                style = pStyle.get(qn('w:val'), '')
        
        if style == 'Heading2' and '2.4' in text:
            in_section = '2.4'
            print(f'\n=== [{style}] {text} ===')
            continue
        if style == 'Heading1' and 'BAB III' in text:
            break
        if in_section and text:
            print(f'  {text[:100]}')
