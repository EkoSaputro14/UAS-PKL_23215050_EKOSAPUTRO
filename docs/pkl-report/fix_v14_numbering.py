#!/usr/bin/env python3
"""
Fix v14: Add Sequence Diagram section, renumber Heading3 sub-sections.
"""
from docx import Document
from docx.oxml.ns import qn

doc = Document('LAPORAN_PKL_v14_UML.docx')
body = doc.element.body

children = list(body)

# Find all Heading3 paragraphs in section 4.2
heading3_positions = []
for i, child in enumerate(children):
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        pPr = child.find(qn('w:pPr'))
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None and pStyle.get(qn('w:val'), '') == 'Heading3':
                text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
                if text.startswith('4.2.'):
                    heading3_positions.append((i, text, child))

print(f"Found {len(heading3_positions)} Heading3 sub-sections:")
for idx, text, _ in heading3_positions:
    print(f"  idx={idx}: {text}")

# Current structure:
# 4.2.3 Use Case Diagram
# 4.2.4 Activity Diagram Upload Dokumen
# 4.2.5 Activity Diagram Proses Chat RAG
# 4.2.6 Entity Relationship Diagram
# 4.2.7 Arsitektur Sistem
# 4.2.8 Arsitektur RAG Pipeline
# 4.2.9 Arsitektur CRM Pipeline (if exists)

# New structure (add Sequence Diagram at 4.2.6, shift rest):
# 4.2.3 Use Case Diagram
# 4.2.4 Activity Diagram Upload Dokumen
# 4.2.5 Activity Diagram Proses Chat RAG
# 4.2.6 Sequence Diagram Chat RAG  ← NEW
# 4.2.7 Entity Relationship Diagram
# 4.2.8 Arsitektur Sistem
# 4.2.9 Arsitektur RAG Pipeline
# 4.2.10 Arsitektur CRM Pipeline

# Renaming map
rename_map = {
    '4.2.6 Entity Relationship Diagram': '4.2.7 Entity Relationship Diagram',
    '4.2.7 Arsitektur Sistem': '4.2.8 Arsitektur Sistem',
    '4.2.8 Arsitektur RAG Pipeline': '4.2.9 Arsitektur RAG Pipeline',
    '4.2.9 Arsitektur CRM Pipeline': '4.2.10 Arsitektur CRM Pipeline',
}

# Apply renames
for idx, text, para in heading3_positions:
    if text in rename_map:
        new_text = rename_map[text]
        for run_elem in para.iter(qn('w:r')):
            t = run_elem.find(qn('w:t'))
            if t is not None:
                t.text = ''
        runs = list(para.iter(qn('w:r')))
        if runs:
            t = runs[0].find(qn('w:t'))
            if t is not None:
                t.text = new_text
                t.set(qn('xml:space'), 'preserve')
        print(f"  Renamed: {text} → {new_text}")

# Now insert Sequence Diagram section after Activity Chat (4.2.5)
# Find the content paragraph after 4.2.5 heading
activity_chat_idx = None
for idx, text, para in heading3_positions:
    if '4.2.5' in text:
        activity_chat_idx = idx
        break

if activity_chat_idx is not None:
    # Find the figure caption "Gambar 4.4" after the Activity Chat content
    fig_44_idx = None
    for i in range(activity_chat_idx + 1, len(children)):
        text = ''.join(t.text or '' for t in children[i].iter(qn('w:t'))).strip()
        if text.startswith('Gambar 4.4'):
            fig_44_idx = i
            break
    
    if fig_44_idx is not None:
        # Insert Sequence Diagram section after Gambar 4.4
        # Create heading
        seq_heading = children[activity_chat_idx].__class__(qn('w:p'))  # Won't work, use different approach
        
        # Actually, let's create the elements properly
        from lxml import etree
        
        # Create heading paragraph
        seq_p = etree.SubElement(etree.Element('dummy'), qn('w:p'))
        seq_pPr = etree.SubElement(seq_p, qn('w:pPr'))
        seq_pStyle = etree.SubElement(seq_pPr, qn('w:pStyle'))
        seq_pStyle.set(qn('w:val'), 'Heading3')
        seq_r = etree.SubElement(seq_p, qn('w:r'))
        seq_t = etree.SubElement(seq_r, qn('w:t'))
        seq_t.text = '4.2.6 Sequence Diagram Chat RAG'
        seq_t.set(qn('xml:space'), 'preserve')
        
        # Create description paragraph
        desc_p = etree.SubElement(etree.Element('dummy'), qn('w:p'))
        desc_r = etree.SubElement(desc_p, qn('w:r'))
        desc_t = etree.SubElement(desc_r, qn('w:t'))
        desc_t.text = (
            "Sequence diagram berikut menggambarkan alur interaksi antar komponen "
            "saat proses chat RAG berlangsung, mulai dari pengguna mengirim pesan "
            "hingga respons ditampilkan. Diagram ini menunjukkan partisipan User, "
            "Frontend, API Route, RAG Service, pgvector, LLM Provider, dan Database "
            "dengan urutan pesan yang terjadi secara real-time."
        )
        desc_t.set(qn('xml:space'), 'preserve')
        
        # Insert after fig_44_idx
        insert_pos = fig_44_idx + 1
        body.insert(insert_pos, desc_p)
        body.insert(insert_pos, seq_p)
        
        print(f"\n  Inserted Sequence Diagram section at idx {insert_pos}")

# ===== Also update the ERD description paragraph =====
# Find the ERD content paragraph
children = list(body)
for i, child in enumerate(children):
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        if '36 model database' in text:
            # Update figure references
            new_text = text
            # The figure references should already be updated by the previous script
            print(f"\n  ERD description paragraph found at idx {i}")
            break

# ===== Save =====
doc.save('LAPORAN_PKL_v14_UML.docx')
print(f"\n💾 Saved: LAPORAN_PKL_v14_UML.docx")

# ===== Verify =====
doc2 = Document('LAPORAN_PKL_v14_UML.docx')
body2 = doc2.element.body

print("\n📊 Verification - Heading3 sub-sections:")
for child in body2:
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        pPr = child.find(qn('w:pPr'))
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None and pStyle.get(qn('w:val'), '') == 'Heading3':
                text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
                if text.startswith('4.2.'):
                    print(f"  {text}")

print("\n📊 Verification - Figure captions:")
for child in body2:
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        if text.startswith('Gambar 4.'):
            print(f"  {text}")
