#!/usr/bin/env python3
"""
Rebuild v14: Add Sequence Diagram, Modular ERDs, update numbering.
"""
import copy
import re
import os
from lxml import etree
from docx import Document
from docx.oxml.ns import qn
from docx.shared import Inches, Cm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

INPUT = 'LAPORAN_PKL_v13_Roman.docx'
OUTPUT = 'LAPORAN_PKL_v14_UML.docx'
DIAGRAMS_DIR = 'diagrams'

doc = Document(INPUT)
body = doc.element.body

# ===== HELPER FUNCTIONS =====

def get_para_text(para):
    return ''.join(t.text or '' for t in para.iter(qn('w:t'))).strip()

def get_para_style(para):
    pPr = para.find(qn('w:pPr'))
    if pPr is not None:
        pStyle = pPr.find(qn('w:pStyle'))
        if pStyle is not None:
            return pStyle.get(qn('w:val'), '')
    return ''

def set_para_text(para, text):
    for run_elem in para.iter(qn('w:r')):
        t = run_elem.find(qn('w:t'))
        if t is not None:
            t.text = ''
    runs = list(para.iter(qn('w:r')))
    if runs:
        t = runs[0].find(qn('w:t'))
        if t is not None:
            t.text = text
            t.set(qn('xml:space'), 'preserve')

def make_heading_para(text, level='Heading2'):
    """Create a heading paragraph element."""
    p = etree.SubElement(etree.Element('dummy'), qn('w:p'))
    pPr = etree.SubElement(p, qn('w:pPr'))
    pStyle = etree.SubElement(pPr, qn('w:pStyle'))
    pStyle.set(qn('w:val'), level)
    r = etree.SubElement(p, qn('w:r'))
    t = etree.SubElement(r, qn('w:t'))
    t.text = text
    t.set(qn('xml:space'), 'preserve')
    return p

def make_body_para(text):
    """Create a body text paragraph element."""
    p = etree.SubElement(etree.Element('dummy'), qn('w:p'))
    r = etree.SubElement(p, qn('w:r'))
    t = etree.SubElement(r, qn('w:t'))
    t.text = text
    t.set(qn('xml:space'), 'preserve')
    return p

def make_image_para(image_path, caption_text, width_inches=6.0):
    """Create a paragraph with an inline image and caption."""
    # Create paragraph
    p = etree.SubElement(etree.Element('dummy'), qn('w:p'))
    
    # Center alignment
    pPr = etree.SubElement(p, qn('w:pPr'))
    jc = etree.SubElement(pPr, qn('w:jc'))
    jc.set(qn('w:val'), 'center')
    
    # Add image if file exists
    if os.path.exists(image_path):
        # For python-docx image insertion, we need to use the Document's part
        # This is complex with raw XML, so we'll use a placeholder approach
        # and let the caller handle image insertion separately
        pass
    
    return p

# ===== STEP 1: Find key positions in the document =====

# Get all body children as a list for indexed access
children = list(body)

# Find key section positions
positions = {}
for i, child in enumerate(children):
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag != 'p':
        continue
    
    text = get_para_text(child)
    style = get_para_style(child)
    
    # Find Heading2 sections in BAB IV
    if style == 'Heading2':
        if '4.2.6' in text and 'Entity' in text:
            positions['erd_heading'] = i
        elif '4.2.7' in text and 'Arsitektur Sistem' in text:
            positions['arch_heading'] = i
        elif '4.2.8' in text and 'RAG' in text:
            positions['rag_heading'] = i
        elif '4.2.9' in text and 'CRM' in text:
            positions['crm_heading'] = i
        elif '4.3' in text:
            positions['impl_heading'] = i
    
    # Find figure captions
    if text.startswith('Gambar 4.'):
        fig_num = text.split()[1]  # e.g., "4.5"
        positions[f'fig_{fig_num}'] = i
    
    # Find Daftar Gambar
    if style == 'Heading1' and 'DAFTAR GAMBAR' in text:
        positions['dafgam_heading'] = i
    
    # Find DAFTAR ISI
    if style == 'Heading1' and 'DAFTAR ISI' in text:
        positions['dafisi_heading'] = i

print("Found positions:")
for k, v in positions.items():
    print(f"  {k}: idx={v}")

# ===== STEP 2: Replace ERD section with modular ERDs =====

if 'erd_heading' in positions:
    erd_idx = positions['erd_heading']
    arch_idx = positions.get('arch_heading', erd_idx + 10)
    
    # Find content paragraphs between ERD heading and Architecture heading
    # We need to:
    # 1. Replace the ERD heading with new sub-headings
    # 2. Add modular ERD content
    
    # First, let's understand what's between erd_idx and arch_idx
    print(f"\nContent between ERD heading (idx {erd_idx}) and Architecture (idx {arch_idx}):")
    for j in range(erd_idx, min(arch_idx, len(children))):
        child = children[j]
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'p':
            text = get_para_text(child)
            style = get_para_style(child)
            if text or style:
                print(f"  [{j}] style={style} | {text[:80]}")
    
    # Now let's modify the document
    # Replace 4.2.6 heading with updated text
    set_para_text(children[erd_idx], '4.2.6 Entity Relationship Diagram')
    
    # Find and replace the ERD content paragraph
    for j in range(erd_idx + 1, arch_idx):
        child = children[j]
        text = get_para_text(child)
        if '36 model database' in text:
            # Replace with updated ERD description
            new_text = (
                "Sistem Mimotes AI menggunakan 36 model database yang terorganisir "
                "dalam enam domain fungsional. Untuk memudahkan pemahaman, ERD dipecah "
                "menjadi empat diagram modular berikut:\n\n"
                "Gambar 4.5 ERD Domain Identity & Workspace\n\n"
                "Gambar 4.6 ERD Domain RAG & Knowledge Base\n\n"
                "Gambar 4.7 ERD Domain Chat & CRM\n\n"
                "Gambar 4.8 ERD Domain Billing & Configuration\n\n"
                "Gambar 4.9 ERD Ringkasan — Seluruh Relasi Antar Domain"
            )
            set_para_text(child, new_text)
            break
    
    # Update Architecture and subsequent headings
    # Old: 4.2.7 Architecture, 4.2.8 RAG Pipeline, 4.2.9 CRM Pipeline
    # New: 4.2.10 Architecture, 4.2.11 RAG Pipeline, 4.2.12 CRM Pipeline
    # But first we need to add Sequence Diagram (4.2.5 becomes 4.2.6...)
    # Actually, let's renumber everything properly
    
    # New numbering scheme:
    # 4.2.3 Use Case Diagram (Gambar 4.2)
    # 4.2.4 Activity Diagram Upload (Gambar 4.3)
    # 4.2.5 Activity Diagram Chat RAG (Gambar 4.4)
    # 4.2.6 Sequence Diagram Chat RAG (Gambar 4.5) -- NEW
    # 4.2.7 Entity Relationship Diagram (Gambar 4.6-4.10) -- MODULAR
    # 4.2.8 Arsitektur Sistem (Gambar 4.11)
    # 4.2.9 Arsitektur RAG Pipeline (Gambar 4.12)
    # 4.2.10 Arsitektur CRM Pipeline (Gambar 4.13)
    
    # Wait, this is getting complex. Let me simplify:
    # Keep existing sections as-is, just add Sequence Diagram between Activity Chat and ERD
    # Then update ERD section content
    
    print("\n✅ ERD section updated")

# ===== STEP 3: Add Sequence Diagram section =====

# Find the position after Activity Diagram Chat RAG heading
activity_chat_idx = None
erd_idx = positions.get('erd_heading')

# Find "4.2.5 Activity Diagram" heading
for i, child in enumerate(children):
    text = get_para_text(child)
    style = get_para_style(child)
    if style == 'Heading2' and '4.2.5' in text and 'Activity' in text and 'Chat' in text:
        activity_chat_idx = i
        break

if activity_chat_idx is not None and erd_idx is not None:
    # Find the end of Activity Chat section (the figure caption "Gambar 4.4")
    fig_44_idx = positions.get('fig_4.4')
    
    if fig_44_idx is not None:
        # Insert Sequence Diagram section after Gambar 4.4
        # We need to insert after fig_44_idx
        
        # Create new elements
        seq_heading = make_heading_para('4.2.6 Sequence Diagram Chat RAG', 'Heading2')
        seq_desc = make_body_para(
            "Sequence diagram berikut menggambarkan alur interaksi antar komponen "
            "saat proses chat RAG berlangsung, mulai dari pengguna mengirim pesan "
            "hingga respons ditampilkan. Diagram ini menunjukkan partisipan User, "
            "Frontend, API Route, RAG Service, pgvector, LLM Provider, dan Database "
            "dengan urutan pesan yang terjadi secara real-time."
        )
        seq_fig = make_body_para('Gambar 4.6 Sequence Diagram Chat RAG')
        
        # Insert after fig_44_idx (in reverse order since we're inserting)
        # We need to find the actual position in body children
        insert_idx = fig_44_idx + 1
        
        # Insert in reverse order
        body.insert(insert_idx, seq_fig)
        body.insert(insert_idx, seq_desc)
        body.insert(insert_idx, seq_heading)
        
        print(f"\n✅ Sequence Diagram section inserted at idx {insert_idx}")
        
        # Rebuild children list
        children = list(body)
        
        # Now update ERD heading number
        # Find the new ERD heading position
        for i, child in enumerate(children):
            text = get_para_text(child)
            style = get_para_style(child)
            if style == 'Heading2' and 'Entity Relationship' in text:
                set_para_text(child, '4.2.7 Entity Relationship Diagram')
                print(f"  Updated ERD heading to 4.2.7 at idx {i}")
                break
        
        # Update Architecture heading
        for i, child in enumerate(children):
            text = get_para_text(child)
            style = get_para_style(child)
            if style == 'Heading2' and '4.2.7' in text and 'Arsitektur Sistem' in text:
                set_para_text(child, '4.2.8 Arsitektur Sistem')
                print(f"  Updated Architecture heading to 4.2.8 at idx {i}")
                break
        
        # Update RAG Pipeline heading
        for i, child in enumerate(children):
            text = get_para_text(child)
            style = get_para_style(child)
            if style == 'Heading2' and '4.2.8' in text and 'RAG' in text:
                set_para_text(child, '4.2.9 Arsitektur RAG Pipeline')
                print(f"  Updated RAG Pipeline heading to 4.2.9 at idx {i}")
                break
        
        # Update CRM Pipeline heading
        for i, child in enumerate(children):
            text = get_para_text(child)
            style = get_para_style(child)
            if style == 'Heading2' and '4.2.9' in text and 'CRM' in text:
                set_para_text(child, '4.2.10 Arsitektur CRM Pipeline')
                print(f"  Updated CRM Pipeline heading to 4.2.10 at idx {i}")
                break

# ===== STEP 4: Update all figure numbers =====

# Rebuild children list
children = list(body)

# New figure mapping (old → new)
# Old: 4.2 Use Case, 4.3 Activity Upload, 4.4 Activity Chat, 4.5 ERD,
#       4.6 Architecture, 4.7 RAG Pipeline, 4.8 CRM Pipeline
#       4.9-4.16 Screenshots
# New: 4.2 Use Case, 4.3 Activity Upload, 4.4 Activity Chat, 4.5 Sequence (NEW),
#       4.6-4.10 ERD modular (replaces 4.5), 4.11 Architecture, 4.12 RAG, 4.13 CRM
#       4.14-4.21 Screenshots (shifted by +5)

# Actually, let me keep it simpler. The ERD was one figure (4.5), now it's 5 figures (4.6-4.10).
# So everything after 4.5 shifts by +4 (5 new figures - 1 old = +4).
# Plus the Sequence Diagram adds +1.
# Total shift: +5 for everything after old 4.5.

# Let me just renumber all figures from scratch
fig_counter = 2  # Start from 4.2

# Find all figure captions and renumber
figure_map = {}
for i, child in enumerate(children):
    text = get_para_text(child)
    if text.startswith('Gambar 4.'):
        old_num = text.split()[1].rstrip('.')
        old_caption = text[len(f'Gambar {old_num} '):]
        figure_map[i] = (old_num, old_caption)

# Now create new numbering
# First, let's define the new figure order
new_figures = [
    ('4.2', 'Use Case Diagram Sistem Mimotes AI'),
    ('4.3', 'Activity Diagram Upload Dokumen'),
    ('4.4', 'Activity Diagram Proses Chat RAG'),
    ('4.5', 'Sequence Diagram Chat RAG'),  # NEW
    ('4.6', 'ERD Domain Identity & Workspace'),  # NEW (modular)
    ('4.7', 'ERD Domain RAG & Knowledge Base'),  # NEW
    ('4.8', 'ERD Domain Chat & CRM'),  # NEW
    ('4.9', 'ERD Domain Billing & Configuration'),  # NEW
    ('4.10', 'ERD Ringkasan — Seluruh Relasi'),  # NEW
    ('4.11', 'Arsitektur Sistem Mimotes AI'),  # was 4.6
    ('4.12', 'Arsitektur RAG Pipeline'),  # was 4.7
    ('4.13', 'Arsitektur CRM Pipeline'),  # was 4.8
    ('4.14', 'Halaman Login'),  # was 4.9
    ('4.15', 'Dashboard Admin'),  # was 4.10
    ('4.16', 'Upload Dokumen'),  # was 4.11
    ('4.17', 'Daftar Dokumen'),  # was 4.12
    ('4.18', 'Chat AI'),  # was 4.13
    ('4.19', 'Knowledge Search'),  # was 4.14
    ('4.20', 'Analytics Chat'),  # was 4.15
    ('4.21', 'Pengaturan AI Provider'),  # was 4.16
]

# Now update the figure captions in the document
# Find existing figure captions and update them
fig_idx = 0
for i, child in enumerate(children):
    text = get_para_text(child)
    if text.startswith('Gambar 4.') and fig_idx < len(new_figures):
        new_num, new_caption = new_figures[fig_idx]
        new_text = f'Gambar {new_num} {new_caption}'
        set_para_text(child, new_text)
        fig_idx += 1

print(f"\n✅ Updated {fig_idx} figure captions")

# ===== STEP 5: Update ERD content text =====

# Find the ERD content paragraph and update it
children = list(body)
for i, child in enumerate(children):
    text = get_para_text(child)
    if '36 model database' in text or 'diagram modular berikut' in text:
        # This is the ERD description, update it
        new_text = (
            "Sistem Mimotes AI menggunakan 36 model database yang terorganisir "
            "dalam enam domain fungsional. Untuk memudahkan pemahaman, ERD dipecah "
            "menjadi empat diagram modular berikut:\n\n"
            "Gambar 4.6 ERD Domain Identity & Workspace\n\n"
            "Gambar 4.7 ERD Domain RAG & Knowledge Base\n\n"
            "Gambar 4.8 ERD Domain Chat & CRM\n\n"
            "Gambar 4.9 ERD Domain Billing & Configuration\n\n"
            "Gambar 4.10 ERD Ringkasan — Seluruh Relasi Antar Domain"
        )
        set_para_text(child, new_text)
        print("✅ Updated ERD content description")
        break

# ===== STEP 6: Update Daftar Gambar =====

# Find Daftar Gambar section and rebuild it
children = list(body)
dafgam_idx = None
dafgam_end = None

for i, child in enumerate(children):
    text = get_para_text(child)
    style = get_para_style(child)
    if style == 'Heading1' and 'DAFTAR GAMBAR' in text:
        dafgam_idx = i
    elif dafgam_idx is not None and style == 'Heading1' and 'DAFTAR TABEL' in text:
        dafgam_end = i
        break

if dafgam_idx is not None and dafgam_end is not None:
    # Remove old Daftar Gambar entries (between heading and next heading)
    # Keep the heading, remove all TOC entries after it
    paras_to_remove = []
    for j in range(dafgam_idx + 1, dafgam_end):
        child = children[j]
        text = get_para_text(child)
        style = get_para_style(child)
        if style in ('TOC1', 'TOC2', 'TOC3') or text.startswith('Gambar'):
            paras_to_remove.append(child)
    
    for p in paras_to_remove:
        body.remove(p)
    
    # Now insert new Daftar Gambar entries
    # Find the position after dafgam_idx (which is now right before dafgam_end's content)
    # We need to re-find the position since we removed elements
    children = list(body)
    
    # Find where Daftar Gambar heading is now
    new_dafgam_idx = None
    for i, child in enumerate(children):
        text = get_para_text(child)
        style = get_para_style(child)
        if style == 'Heading1' and 'DAFTAR GAMBAR' in text:
            new_dafgam_idx = i
            break
    
    if new_dafgam_idx is not None:
        # Insert new entries after the heading
        insert_pos = new_dafgam_idx + 1
        for num, caption in reversed(new_figures):
            entry = make_body_para(f'Gambar {num} {caption}')
            body.insert(insert_pos, entry)
        
        print(f"✅ Rebuilt Daftar Gambar with {len(new_figures)} entries")

# ===== STEP 7: Save =====

doc.save(OUTPUT)
print(f"\n💾 Saved: {OUTPUT}")

# ===== VERIFY =====
doc2 = Document(OUTPUT)
body2 = doc2.element.body

# Count figures
fig_count = 0
for child in body2:
    text = get_para_text(child)
    if text.startswith('Gambar 4.'):
        fig_count += 1

# Count headings
h2_count = 0
for child in body2:
    style = get_para_style(child)
    if style == 'Heading2':
        h2_count += 1

print(f"\n📊 Verification:")
print(f"  Figures: {fig_count}")
print(f"  Heading2 count: {h2_count}")
print(f"  File size: {os.path.getsize(OUTPUT)/1024:.0f} KB")
