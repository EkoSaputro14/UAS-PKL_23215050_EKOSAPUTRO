#!/usr/bin/env python3
"""
Clean up duplicate figure captions in v14.
Keep only the first 20 unique figure captions.
"""
from docx import Document
from docx.oxml.ns import qn

doc = Document('LAPORAN_PKL_v14_UML.docx')
body = doc.element.body

# Expected figures (20 total)
expected = [
    'Gambar 4.2 Use Case Diagram Sistem Mimotes AI',
    'Gambar 4.3 Activity Diagram Upload Dokumen',
    'Gambar 4.4 Activity Diagram Proses Chat RAG',
    'Gambar 4.5 Sequence Diagram Chat RAG',
    'Gambar 4.6 ERD Domain Identity & Workspace',
    'Gambar 4.7 ERD Domain RAG & Knowledge Base',
    'Gambar 4.8 ERD Domain Chat & CRM',
    'Gambar 4.9 ERD Domain Billing & Configuration',
    'Gambar 4.10 ERD Ringkasan — Seluruh Relasi',
    'Gambar 4.11 Arsitektur Sistem Mimotes AI',
    'Gambar 4.12 Arsitektur RAG Pipeline',
    'Gambar 4.13 Arsitektur CRM Pipeline',
    'Gambar 4.14 Halaman Login',
    'Gambar 4.15 Dashboard Admin',
    'Gambar 4.16 Upload Dokumen',
    'Gambar 4.17 Daftar Dokumen',
    'Gambar 4.18 Chat AI',
    'Gambar 4.19 Knowledge Search',
    'Gambar 4.20 Analytics Chat',
    'Gambar 4.21 Pengaturan AI Provider',
]

# Find all figure captions and their positions
children = list(body)
fig_positions = []
for i, child in enumerate(children):
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        if text.startswith('Gambar 4.'):
            fig_positions.append((i, text))

print(f"Found {len(fig_positions)} figure captions")

# Keep first 20, remove the rest
to_remove = []
seen = set()
for idx, text in fig_positions:
    if text in expected and text not in seen:
        seen.add(text)
    elif text.startswith('Gambar 4.'):
        # This is a duplicate or old caption
        to_remove.append(children[idx])
        print(f"  Removing duplicate: '{text[:60]}'")

print(f"Removing {len(to_remove)} duplicate captions")

for p in to_remove:
    body.remove(p)

doc.save('LAPORAN_PKL_v14_UML.docx')
print(f"\n💾 Saved: LAPORAN_PKL_v14_UML.docx")

# Verify
doc2 = Document('LAPORAN_PKL_v14_UML.docx')
body2 = doc2.element.body
figs = []
for child in body2:
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        if text.startswith('Gambar 4.'):
            figs.append(text)

print(f"\n📊 Final figure count: {len(figs)}")
for f in figs:
    print(f"  {f}")
