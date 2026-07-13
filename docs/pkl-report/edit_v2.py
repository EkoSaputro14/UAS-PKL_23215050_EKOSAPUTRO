#!/usr/bin/env python3
"""
Edit v2: Only copy TEXT from source, keep TEMPLATE formatting.
This preserves fonts, sizes, spacing from the template.
"""
import os
import shutil
import copy
from lxml import etree

TPL_DIR = 'C:/Users/SMANSA/mimotes/docs/pkl-report/unpacked_tpl'
SRC_DIR = 'C:/Users/SMANSA/mimotes/docs/pkl-report/unpacked_src'

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'

NEW_TITLE = "RANCANG BANGUN SISTEM CHATBOT AI BERBASIS PENGETAHUAN DENGAN RETRIEVAL-AUGMENTED GENERATION DAN PIPELINE CRM UNTUK OPTIMALISASI LAYANAN PELANGGAN"
NEW_STUDENT = "Eko Saputro"
NEW_NIM = "23215050"
NEW_SUPERVISOR = "Widianto Agung Nugroho"
OLD_STUDENT = "Moh. Arif Prasetyo"
OLD_NIM = "23215043"

def w(tag): return f'{{{W}}}{tag}'
def get_text(elem): return ''.join(t.text or '' for t in elem.iter(w('t'))).strip()
def get_style_id(para):
    pPr = para.find(w('pPr'))
    if pPr is not None:
        pStyle = pPr.find(w('pStyle'))
        if pStyle is not None:
            return pStyle.get(w('val'), '')
    return ''

def is_heading(para, level=None):
    sid = get_style_id(para)
    if level is None:
        return 'Heading' in sid or 'Judul' in sid
    return sid in (f'Heading{level}', f'Judul{level}')

def classify_bab(text):
    fl = text.strip().split('\n')[0].strip()
    for kw in ['BAB V','BAB IV','BAB III','BAB II','BAB I']:
        if kw in fl: return kw.replace(' ','_')
    if 'DAFTAR PUSTAKA' in fl: return 'DAFTAR_PUSTAKA'
    if 'LAMPIRAN' in fl: return 'LAMPIRAN'
    return None

def clear_paragraph(para):
    """Remove all runs from paragraph, keeping only pPr."""
    for child in list(para):
        if child.tag != w('pPr'):
            para.remove(child)

def add_text_to_para(para, text, bold=False, italic=False):
    """Add text to paragraph using template's formatting."""
    r = etree.SubElement(para, w('r'))
    rPr = etree.SubElement(r, w('rPr'))
    if bold:
        etree.SubElement(rPr, w('b'))
    if italic:
        etree.SubElement(rPr, w('i'))
    t = etree.SubElement(r, w('t'))
    t.text = text
    t.set(XML_SPACE, 'preserve')

def make_para_with_style(body, style_id):
    """Create a new paragraph with a specific style."""
    p = etree.SubElement(body, w('p'))
    pPr = etree.SubElement(p, w('pPr'))
    pStyle = etree.SubElement(pPr, w('pStyle'))
    pStyle.set(w('val'), style_id)
    return p

print("📄 Step 1: Parse XML...")
tpl_path = os.path.join(TPL_DIR, 'word', 'document.xml')
tpl_tree = etree.parse(tpl_path)
tpl_body = tpl_tree.getroot().find(w('body'))

src_path = os.path.join(SRC_DIR, 'word', 'document.xml')
src_tree = etree.parse(src_path)
src_body = src_tree.getroot().find(w('body'))

# === Find Daftar Isi in template ===
dai_idx = None
for i, child in enumerate(tpl_body):
    if child.tag == w('p') and is_heading(child, 1) and 'Daftar Isi' in get_text(child):
        dai_idx = i
        break
print(f"  Daftar Isi at: {dai_idx}")

# === Find source sections ===
src_babs = {}
for i, child in enumerate(src_body):
    if child.tag == w('p') and is_heading(child, 1):
        key = classify_bab(get_text(child))
        if key: src_babs[key] = i

# Find content boundaries in source
src_start = src_babs.get('BAB_I', 0)
src_end = len(list(src_body))
print(f"  Source: {src_start} to {src_end}")

# === Find template heading style ===
tpl_h1_style = 'Judul1'
for child in list(tpl_body)[:dai_idx]:
    if child.tag == w('p'):
        sid = get_style_id(child)
        if sid in ('Heading1', 'Judul1'):
            tpl_h1_style = sid
            break

# Find template's Normal and list styles
tpl_normal = 'Normal'
tpl_list = 'ListParagraph'

print(f"  Template styles: H1={tpl_h1_style}, Normal={tpl_normal}")

# === Clear template from Daftar Isi ===
print("\n📝 Step 2: Clear template...")
sectPr = tpl_body.find(w('sectPr'))
to_remove = [c for c in tpl_body if c is not sectPr and list(tpl_body).index(c) >= dai_idx]
for elem in to_remove:
    tpl_body.remove(elem)
print(f"  Removed {len(to_remove)} elements")

# === Add Daftar headings ===
for heading_text in ['Daftar Isi', 'Daftar  Tabel', 'Daftar Gambar']:
    p = make_para_with_style(tpl_body, tpl_h1_style)
    add_text_to_para(p, heading_text)

# === Extract source content (text only) ===
print("\n📝 Step 3: Extract source text...")
src_children = list(src_body)

# Group source content by section
src_sections = {}
current_key = None
current_paras = []

for child in src_children[src_start:]:
    if child.tag != w('p'):
        continue
    
    text = get_text(child)
    sid = get_style_id(child)
    
    if is_heading(child, 1):
        if current_key:
            src_sections[current_key] = current_paras
        current_paras = []
        current_key = classify_bab(text)
        # Store heading text
        if current_key:
            current_paras.append({'text': text.split('\n')[0].strip(), 'type': 'heading1'})
        continue
    
    if current_key and text:
        # Determine paragraph type
        if is_heading(child, 2):
            para_type = 'heading2'
        elif is_heading(child, 3):
            para_type = 'heading3'
        elif 'List' in sid or 'list' in sid:
            para_type = 'list'
        else:
            para_type = 'normal'
        
        current_paras.append({'text': text, 'type': para_type})

if current_key:
    src_sections[current_key] = current_paras

for key, paras in src_sections.items():
    print(f"  {key}: {len(paras)} paragraphs")

# === Build document content ===
print("\n📝 Step 4: Build content...")

for section_key in ['BAB_I', 'BAB_II', 'BAB_III', 'BAB_IV', 'BAB_V', 'DAFTAR_PUSTAKA', 'LAMPIRAN']:
    if section_key not in src_sections:
        continue
    
    paras = src_sections[section_key]
    
    # Add heading 1
    heading_texts = {
        'BAB_I': 'BAB I', 'BAB_II': 'BAB II', 'BAB_III': 'BAB III.',
        'BAB_IV': 'BAB IV', 'BAB_V': 'BAB V',
        'DAFTAR_PUSTAKA': 'DAFTAR PUSTAKA', 'LAMPIRAN': 'LAMPIRAN',
    }
    p = make_para_with_style(tpl_body, tpl_h1_style)
    add_text_to_para(p, heading_texts[section_key])
    
    # Add PENDAHULUAN subheading for BAB I
    if section_key == 'BAB_I':
        p = make_para_with_style(tpl_body, tpl_normal)
        add_text_to_para(p, 'PENDAHULUAN')
    
    # Add content paragraphs
    for para_data in paras:
        if para_data['type'] == 'heading1':
            continue  # Already added
        
        if para_data['type'] == 'heading2':
            p = make_para_with_style(tpl_body, 'Judul2')
        elif para_data['type'] == 'heading3':
            p = make_para_with_style(tpl_body, 'Judul3')
        elif para_data['type'] == 'list':
            p = make_para_with_style(tpl_body, tpl_list)
        else:
            p = make_para_with_style(tpl_body, tpl_normal)
        
        add_text_to_para(p, para_data['text'])

print(f"  Built {len(list(tpl_body))} total elements")

# === Fix front matter ===
print("\n📝 Step 5: Fix front matter...")
for child in tpl_body:
    if child.tag != w('p'): continue
    for t_elem in child.iter(w('t')):
        if t_elem.text:
            if 'SISTEM PAKAR DETEKSI HAMA' in t_elem.text:
                t_elem.text = t_elem.text.replace('SISTEM PAKAR DETEKSI HAMA DAN PENYAKIT PADI MENGGUNAKAN CERTAINTY', NEW_TITLE)
            if OLD_STUDENT in t_elem.text:
                t_elem.text = t_elem.text.replace(OLD_STUDENT, NEW_STUDENT)
            if OLD_NIM in t_elem.text:
                t_elem.text = t_elem.text.replace(OLD_NIM, NEW_NIM)
            if 'Nama Dosen Pembimbing' in t_elem.text:
                t_elem.text = t_elem.text.replace('Nama Dosen Pembimbing', NEW_SUPERVISOR)
            if 'NIPY.' in t_elem.text:
                t_elem.text = t_elem.text.replace('NIPY.', '')

# === Handle images from source ===
print("\n🖼️ Step 6: Handle images...")

# Find image paragraphs in source BAB IV
src_bab4_start = src_babs.get('BAB_IV', 0)
src_bab5_start = src_babs.get('BAB_V', len(src_children))

# Find image positions in source
src_images = []
for i in range(src_bab4_start, src_bab5_start):
    child = src_children[i]
    if child.tag == w('p'):
        drawing = child.find(f'.//{w("drawing")}')
        if drawing is not None:
            # Get the caption (next paragraph)
            caption = ''
            if i + 1 < src_bab5_start:
                next_p = src_children[i + 1]
                if next_p.tag == w('p'):
                    caption = get_text(next_p)
            src_images.append({
                'drawing': copy.deepcopy(drawing),
                'caption': caption,
                'src_idx': i,
            })

print(f"  Found {len(src_images)} images in source")

# Load source relationships for rId remapping
src_rels_tree = etree.parse(os.path.join(SRC_DIR, 'word', '_rels', 'document.xml.rels'))
tpl_rels_tree = etree.parse(os.path.join(TPL_DIR, 'word', '_rels', 'document.xml.rels'))
src_rels_root = src_rels_tree.getroot()
tpl_rels_root = tpl_rels_tree.getroot()

# Find max rId
max_id = 0
for rel in tpl_rels_root:
    rid = rel.get('Id', '')
    if rid.startswith('rId'):
        try: max_id = max(max_id, int(rid[3:]))
        except: pass

# Build rId remap
rid_remap = {}
for rel in src_rels_root:
    src_rid = rel.get('Id', '')
    target = rel.get('Target', '')
    rel_type = rel.get('Type', '')
    
    if 'image' not in rel_type.lower() and not target.startswith('media/'):
        continue
    
    existing = None
    for tpl_rel in tpl_rels_root:
        if tpl_rel.get('Target') == target:
            existing = tpl_rel.get('Id')
            break
    
    if existing:
        rid_remap[src_rid] = existing
    else:
        max_id += 1
        new_rid = f'rId{max_id}'
        new_rel = etree.SubElement(tpl_rels_root, f'{{{etree.QName(tpl_rels_root).namespace}}}Relationship')
        new_rel.set('Id', new_rid)
        new_rel.set('Type', rel_type)
        new_rel.set('Target', target)
        rid_remap[src_rid] = new_rid

print(f"  Remapped {len(rid_remap)} image relationships")

# Copy images
src_media = os.path.join(SRC_DIR, 'word', 'media')
tpl_media = os.path.join(TPL_DIR, 'word', 'media')
os.makedirs(tpl_media, exist_ok=True)
if os.path.exists(src_media):
    for f in os.listdir(src_media):
        shutil.copy2(os.path.join(src_media, f), os.path.join(tpl_media, f))

# === Insert images into BAB IV ===
# Find BAB IV heading in template and insert images after relevant sub-headings
print("\n📝 Step 7: Insert images...")

# Find positions for image insertion
image_positions = {
    'Use Case Diagram': None,
    'Activity Diagram Upload': None,
    'Activity Diagram Proses Chat': None,
    'Sequence Diagram Chat RAG': None,
    'ERD Domain Identity': None,
    'ERD Domain RAG': None,
    'ERD Domain Chat': None,
    'ERD Domain Billing': None,
    'ERD Ringkasan': None,
    'Arsitektur Sistem': None,
    'Arsitektur RAG': None,
    'Arsitektur CRM': None,
}

# Find heading positions in template
for i, child in enumerate(tpl_body):
    if child.tag == w('p'):
        text = get_text(child)
        for key in image_positions:
            if key.lower() in text.lower() and image_positions[key] is None:
                image_positions[key] = i

# Insert images (in reverse order to avoid index shifting)
for img_data in reversed(src_images):
    caption = img_data['caption']
    drawing = img_data['drawing']
    
    # Find where to insert (after relevant heading)
    insert_after = None
    for key, pos in image_positions.items():
        if key.lower() in caption.lower() and pos is not None:
            insert_after = pos
            break
    
    if insert_after is None:
        # Insert after last known position
        insert_after = max(v for v in image_positions.values() if v is not None) if any(v is not None for v in image_positions.values()) else len(list(tpl_body)) - 1
    
    # Remap rIds in drawing
    for blip in drawing.iter(f'{{{A_NS}}}blip'):
        embed = blip.get(f'{{{R_NS}}}embed')
        if embed and embed in rid_remap:
            blip.set(f'{{{R_NS}}}embed', rid_remap[embed])
    
    # Create image paragraph
    img_para = etree.Element(w('p'))
    pPr = etree.SubElement(img_para, w('pPr'))
    jc = etree.SubElement(pPr, w('jc'))
    jc.set(w('val'), 'center')
    r = etree.SubElement(img_para, w('r'))
    r.append(copy.deepcopy(drawing))
    
    # Create caption paragraph
    cap_para = make_para_with_style(tpl_body, tpl_normal)
    cap_pPr = cap_para.find(w('pPr'))
    cap_jc = etree.SubElement(cap_pPr, w('jc'))
    cap_jc.set(w('val'), 'center')
    add_text_to_para(cap_para, caption)
    
    # Insert after heading
    insert_pos = insert_after + 1
    children = list(tpl_body)
    if insert_pos < len(children):
        tpl_body.insert(insert_pos, img_para)
        tpl_body.insert(insert_pos + 1, cap_para)
    else:
        tpl_body.append(img_para)
        tpl_body.append(cap_para)

print(f"  Inserted {len(src_images)} images with captions")

# === Save ===
print("\n💾 Step 8: Save...")
tpl_tree.write(tpl_path, xml_declaration=True, encoding='UTF-8', standalone=True)

# Save rels
tpl_rels_tree.write(
    os.path.join(TPL_DIR, 'word', '_rels', 'document.xml.rels'),
    xml_declaration=True, encoding='UTF-8', standalone=True
)

print("\n✅ Edit complete!")
