#!/usr/bin/env python3
"""
Insert Sequence Diagram section after Activity Chat content paragraph.
"""
from lxml import etree
from docx import Document
from docx.oxml.ns import qn

doc = Document('LAPORAN_PKL_v14_UML.docx')
body = doc.element.body
children = list(body)

# Find 4.2.5 heading
activity_chat_idx = None
for i, child in enumerate(children):
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        pPr = child.find(qn('w:pPr'))
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None and pStyle.get(qn('w:val'), '') == 'Heading3':
                text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
                if '4.2.5' in text and 'Activity' in text:
                    activity_chat_idx = i
                    break

print(f"Activity Chat heading at idx: {activity_chat_idx}")

if activity_chat_idx is not None:
    # Find the content paragraph after 4.2.5 (the description text)
    content_idx = None
    for i in range(activity_chat_idx + 1, len(children)):
        child = children[i]
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'p':
            text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
            pPr = child.find(qn('w:pPr'))
            style = ''
            if pPr is not None:
                pStyle = pPr.find(qn('w:pStyle'))
                if pStyle is not None:
                    style = pStyle.get(qn('w:val'), '')
            
            # Skip empty paragraphs
            if not text:
                continue
            
            # If it's another heading, we've gone too far
            if style == 'Heading3':
                break
            
            # This is the content paragraph
            content_idx = i
            break
    
    print(f"Activity Chat content at idx: {content_idx}")
    
    if content_idx is not None:
        # Now find the next Heading3 (4.2.7 ERD) to know where we are
        next_heading_idx = None
        for i in range(content_idx + 1, len(children)):
            child = children[i]
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag == 'p':
                pPr = child.find(qn('w:pPr'))
                if pPr is not None:
                    pStyle = pPr.find(qn('w:pStyle'))
                    if pStyle is not None and pStyle.get(qn('w:val'), '') == 'Heading3':
                        next_heading_idx = i
                        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
                        print(f"Next heading at idx {i}: {text}")
                        break
        
        if next_heading_idx is not None:
            # Insert Sequence Diagram section between content_idx and next_heading_idx
            # Create heading
            seq_p = etree.Element(qn('w:p'))
            seq_pPr = etree.SubElement(seq_p, qn('w:pPr'))
            seq_pStyle = etree.SubElement(seq_pPr, qn('w:pStyle'))
            seq_pStyle.set(qn('w:val'), 'Heading3')
            seq_r = etree.SubElement(seq_p, qn('w:r'))
            seq_t = etree.SubElement(seq_r, qn('w:t'))
            seq_t.text = '4.2.6 Sequence Diagram Chat RAG'
            seq_t.set(qn('xml:space'), 'preserve')
            
            # Create description
            desc_p = etree.Element(qn('w:p'))
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
            
            # Insert before next_heading_idx
            body.insert(next_heading_idx, desc_p)
            body.insert(next_heading_idx, seq_p)
            
            print(f"  ✅ Inserted Sequence Diagram section before idx {next_heading_idx}")

# ===== Save =====
doc.save('LAPORAN_PKL_v14_UML.docx')
print(f"\n💾 Saved: LAPORAN_PKL_v14_UML.docx")

# ===== Verify =====
doc2 = Document('LAPORAN_PKL_v14_UML.docx')
body2 = doc2.element.body

print("\n📊 Final Heading3 sub-sections:")
for child in body2:
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        pPr = child.find(qn('w:pPr'))
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None and pStyle.get(qn('w:val'), '') == 'Heading3':
                text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
                if text.startswith('4.'):
                    print(f"  {text}")
