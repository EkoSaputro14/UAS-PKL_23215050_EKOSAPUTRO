#!/usr/bin/env python3
"""
REBUILD TOTAL: Extract text from source, build document using template formatting.
Template specs:
  - A4 (11906x16838 DXA)
  - Margins: top=2268, bottom=1701, left=2268, right=1701
  - Body: Calibri 11pt, after=160, line=259
  - Heading 1 (Judul1): Calibri Light 16pt
  - Heading 2 (Judul2): Calibri Light 13pt
  - Heading 3 (Judul3): Calibri Light 12pt
"""
import os
import copy
import shutil
from lxml import etree

TPL = 'C:/Users/SMANSA/mimotes/docs/pkl-report/unpacked_tpl'
SRC = 'C:/Users/SMANSA/mimotes/docs/pkl-report/unpacked_src'

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'

# ===== CONTENT =====
NEW_TITLE = "RANCANG BANGUN SISTEM CHATBOT AI BERBASIS PENGETAHUAN DENGAN RETRIEVAL-AUGMENTED GENERATION DAN PIPELINE CRM UNTUK OPTIMALISASI LAYANAN PELANGGAN"
NEW_STUDENT = "Eko Saputro"
NEW_NIM = "23215050"
NEW_SUPERVISOR = "Widianto Agung Nugroho"
OLD_STUDENT = "Moh. Arif Prasetyo"
OLD_NIM = "23215043"

def w(t): return f'{{{W}}}{t}'
def txt(e): return ''.join(t.text or '' for t in e.iter(w('t'))).strip()
def sid(p):
    pp = p.find(w('pPr'))
    if pp is not None:
        ps = pp.find(w('pStyle'))
        if ps is not None: return ps.get(w('val'), '')
    return ''
def is_h(p, l=None):
    s = sid(p)
    if l is None: return 'Heading' in s or 'Judul' in s
    return s in (f'Heading{l}', f'Judul{l}')
def classify(t):
    fl = t.strip().split('\n')[0].strip()
    for kw in ['BAB V','BAB IV','BAB III','BAB II','BAB I']:
        if kw in fl: return kw.replace(' ','_')
    if 'DAFTAR PUSTAKA' in fl: return 'DAFTAR_PUSTAKA'
    if 'LAMPIRAN' in fl: return 'LAMPIRAN'
    return None

print("📄 Step 1: Parse source...")
src_tree = etree.parse(os.path.join(SRC, 'word', 'document.xml'))
src_body = src_tree.getroot().find(w('body'))
src_children = list(src_body)

# Find BAB positions
src_babs = {}
for i, c in enumerate(src_children):
    if c.tag == w('p') and is_h(c, 1):
        k = classify(txt(c))
        if k: src_babs[k] = i

src_start = src_babs.get('BAB_I', 0)
print(f"  Source: {len(src_children)} elements, content starts at {src_start}")

# ===== Extract structured content =====
print("\n📝 Step 2: Extract content...")
sections = {}
cur_key = None
cur_paras = []

for c in src_children[src_start:]:
    if c.tag != w('p'): continue
    text = txt(c)
    
    if is_h(c, 1):
        if cur_key: sections[cur_key] = cur_paras
        cur_paras = []
        cur_key = classify(text)
        continue
    
    if cur_key and text:
        if is_h(c, 2): ptype = 'h2'
        elif is_h(c, 3): ptype = 'h3'
        else: ptype = 'normal'
        
        # Check if it's a list item
        pp = c.find(w('pPr'))
        if pp is not None:
            numPr = pp.find(w('numPr'))
            if numPr is not None:
                ptype = 'list'
        
        # Check for bold/italic
        bold = False
        italic = False
        for r in c.findall(w('r')):
            rPr = r.find(w('rPr'))
            if rPr is not None:
                if rPr.find(w('b')) is not None: bold = True
                if rPr.find(w('i')) is not None: italic = True
        
        cur_paras.append({'text': text, 'type': ptype, 'bold': bold, 'italic': italic})

if cur_key: sections[cur_key] = cur_paras

for k, v in sections.items():
    print(f"  {k}: {len(v)} paragraphs")

# ===== Build document.xml =====
print("\n📝 Step 3: Build document.xml...")

tpl_tree = etree.parse(os.path.join(TPL, 'word', 'document.xml'))
tpl_body = tpl_tree.getroot().find(w('body'))

# Find Daftar Isi and clear everything after it
dai_idx = None
for i, c in enumerate(tpl_body):
    if c.tag == w('p') and is_h(c, 1) and 'Daftar Isi' in txt(c):
        dai_idx = i
        break

sectPr = tpl_body.find(w('sectPr'))
to_remove = [c for c in tpl_body if c is not sectPr and list(tpl_body).index(c) >= dai_idx]
for elem in to_remove:
    tpl_body.remove(elem)
print(f"  Cleared {len(to_remove)} elements from Daftar Isi")

def make_p(body, style_id):
    p = etree.SubElement(body, w('p'))
    pp = etree.SubElement(p, w('pPr'))
    ps = etree.SubElement(pp, w('pStyle'))
    ps.set(w('val'), style_id)
    return p

def add_text(body, style_id, text, bold=False, italic=False, center=False):
    p = make_p(body, style_id)
    if center:
        jc = etree.SubElement(p.find(w('pPr')), w('jc'))
        jc.set(w('val'), 'center')
    r = etree.SubElement(p, w('r'))
    rPr = etree.SubElement(r, w('rPr'))
    if bold: etree.SubElement(rPr, w('b'))
    if italic: etree.SubElement(rPr, w('i'))
    t = etree.SubElement(r, w('t'))
    t.text = text
    t.set(XML_SPACE, 'preserve')
    return p

# Add Daftar headings
for ht in ['Daftar Isi', 'Daftar  Tabel', 'Daftar Gambar']:
    add_text(tpl_body, 'Judul1', ht)

# Add content
heading_map = {
    'BAB_I': 'BAB I', 'BAB_II': 'BAB II', 'BAB_III': 'BAB III.',
    'BAB_IV': 'BAB IV', 'BAB_V': 'BAB V',
    'DAFTAR_PUSTAKA': 'DAFTAR PUSTAKA', 'LAMPIRAN': 'LAMPIRAN',
}

for key in ['BAB_I', 'BAB_II', 'BAB_III', 'BAB_IV', 'BAB_V', 'DAFTAR_PUSTAKA', 'LAMPIRAN']:
    if key not in sections: continue
    paras = sections[key]
    
    # Heading 1
    add_text(tpl_body, 'Judul1', heading_map[key])
    
    # PENDAHULUAN for BAB I
    if key == 'BAB_I':
        add_text(tpl_body, 'Normal', 'PENDAHULUAN', center=True)
    
    for p in paras:
        if p['type'] == 'h2':
            add_text(tpl_body, 'Judul2', p['text'], bold=p['bold'], italic=p['italic'])
        elif p['type'] == 'h3':
            add_text(tpl_body, 'Judul3', p['text'], bold=p['bold'], italic=p['italic'])
        elif p['type'] == 'list':
            # Use list style
            lp = make_p(tpl_body, 'DaftarParagraf')
            r = etree.SubElement(lp, w('r'))
            rPr = etree.SubElement(r, w('rPr'))
            if p['bold']: etree.SubElement(rPr, w('b'))
            if p['italic']: etree.SubElement(rPr, w('i'))
            t = etree.SubElement(r, w('t'))
            t.text = p['text']
            t.set(XML_SPACE, 'preserve')
        else:
            add_text(tpl_body, 'Normal', p['text'], bold=p['bold'], italic=p['italic'])

total_elements = len(list(tpl_body))
print(f"  Built {total_elements} elements")

# ===== Fix front matter =====
print("\n📝 Step 4: Fix front matter...")
for child in tpl_body:
    if child.tag != w('p'): continue
    for t_elem in child.iter(w('t')):
        if t_elem.text:
            if 'SISTEM PAKAR DETEKSI HAMA' in t_elem.text:
                t_elem.text = NEW_TITLE
            if OLD_STUDENT in t_elem.text:
                t_elem.text = t_elem.text.replace(OLD_STUDENT, NEW_STUDENT)
            if OLD_NIM in t_elem.text:
                t_elem.text = t_elem.text.replace(OLD_NIM, NEW_NIM)
            if 'Nama Dosen Pembimbing' in t_elem.text:
                t_elem.text = t_elem.text.replace('Nama Dosen Pembimbing', NEW_SUPERVISOR)
            if 'NIPY.' in t_elem.text:
                t_elem.text = t_elem.text.replace('NIPY.', '')

# ===== Handle images =====
print("\n🖼️ Step 5: Handle images...")

# Find images in source BAB IV
src_bab4 = src_babs.get('BAB_IV', 0)
src_bab5 = src_babs.get('BAB_V', len(src_children))

# Find image paragraphs and their captions
src_images = []
i = src_bab4
while i < src_bab5:
    c = src_children[i]
    if c.tag == w('p') and c.find(f'.//{w("drawing")}') is not None:
        # Next paragraph is caption
        caption = ''
        if i + 1 < src_bab5:
            next_c = src_children[i + 1]
            if next_c.tag == w('p'):
                caption = txt(next_c)
        src_images.append({
            'drawing': copy.deepcopy(c.find(f'.//{w("drawing")}')),
            'caption': caption,
        })
        i += 2  # Skip caption
    else:
        i += 1

print(f"  Found {len(src_images)} images")

# Load relationships for rId remapping
src_rels = etree.parse(os.path.join(SRC, 'word', '_rels', 'document.xml.rels'))
tpl_rels = etree.parse(os.path.join(TPL, 'word', '_rels', 'document.xml.rels'))
src_rels_root = src_rels.getroot()
tpl_rels_root = tpl_rels.getroot()

max_id = 0
for rel in tpl_rels_root:
    rid = rel.get('Id', '')
    if rid.startswith('rId'):
        try: max_id = max(max_id, int(rid[3:]))
        except: pass

rid_remap = {}
for rel in src_rels_root:
    src_rid = rel.get('Id', '')
    target = rel.get('Target', '')
    rel_type = rel.get('Type', '')
    if 'image' not in rel_type.lower() and not target.startswith('media/'):
        continue
    existing = None
    for tr in tpl_rels_root:
        if tr.get('Target') == target:
            existing = tr.get('Id')
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

print(f"  Remapped {len(rid_remap)} relationships")

# Copy images
src_media = os.path.join(SRC, 'word', 'media')
tpl_media = os.path.join(TPL, 'word', 'media')
os.makedirs(tpl_media, exist_ok=True)
if os.path.exists(src_media):
    for f in os.listdir(src_media):
        shutil.copy2(os.path.join(src_media, f), os.path.join(tpl_media, f))

# ===== Insert images into BAB IV =====
print("\n📝 Step 6: Insert images...")

# Find relevant heading positions in template
heading_positions = {}
for i, c in enumerate(tpl_body):
    if c.tag == w('p'):
        t = txt(c)
        for keyword in ['4.2.3 Use Case', '4.2.4 Activity Upload', '4.2.5 Activity Chat',
                        '4.2.6 Sequence', '4.2.7 Entity', '4.2.8 Arsitektur Sistem',
                        '4.2.9 Arsitektur RAG', '4.2.10 Arsitektur CRM',
                        '4.3 Implementasi', '4.6 Tampilan']:
            if keyword.lower() in t.lower() and keyword not in heading_positions:
                heading_positions[keyword] = i

# Map images to headings
image_heading_map = [
    ('Use Case', '4.2.3 Use Case'),
    ('Activity Diagram Upload', '4.2.4 Activity Upload'),
    ('Activity Diagram Proses Chat', '4.2.5 Activity Chat'),
    ('Sequence Diagram Chat RAG', '4.2.6 Sequence'),
    ('ERD Domain Identity', '4.2.7 Entity'),
    ('ERD Domain RAG', '4.2.7 Entity'),
    ('ERD Domain Chat', '4.2.7 Entity'),
    ('ERD Domain Billing', '4.2.7 Entity'),
    ('ERD Ringkasan', '4.2.7 Entity'),
    ('Arsitektur Sistem', '4.2.8 Arsitektur Sistem'),
    ('Arsitektur RAG', '4.2.9 Arsitektur RAG'),
    ('Arsitektur CRM', '4.2.10 Arsitektur CRM'),
]

# Insert images in reverse order
for img in reversed(src_images):
    cap = img['caption']
    drawing = img['drawing']
    
    # Find insert position
    insert_after = None
    for img_kw, hd_kw in image_heading_map:
        if img_kw.lower() in cap.lower() and hd_kw in heading_positions:
            insert_after = heading_positions[hd_kw]
            break
    
    if insert_after is None:
        # Find last heading in BAB IV area
        for kw in reversed(list(heading_positions.keys())):
            if heading_positions[kw] < len(list(tpl_body)):
                insert_after = heading_positions[kw]
                break
    
    if insert_after is None:
        continue
    
    # Remap rIds
    for blip in drawing.iter(f'{{{A_NS}}}blip'):
        embed = blip.get(f'{{{R_NS}}}embed')
        if embed and embed in rid_remap:
            blip.set(f'{{{R_NS}}}embed', rid_remap[embed])
    
    # Create image paragraph (centered)
    img_p = etree.Element(w('p'))
    img_pp = etree.SubElement(img_p, w('pPr'))
    img_jc = etree.SubElement(img_pp, w('jc'))
    img_jc.set(w('val'), 'center')
    img_r = etree.SubElement(img_p, w('r'))
    img_r.append(copy.deepcopy(drawing))
    
    # Create caption paragraph (centered, Normal style)
    cap_p = make_p(tpl_body, 'TabelGambar')
    cap_jc = etree.SubElement(cap_p.find(w('pPr')), w('jc'))
    cap_jc.set(w('val'), 'center')
    r = etree.SubElement(cap_p, w('r'))
    t = etree.SubElement(r, w('t'))
    t.text = cap
    
    # Insert
    insert_pos = insert_after + 1
    children = list(tpl_body)
    if insert_pos <= len(children):
        tpl_body.insert(insert_pos, img_p)
        tpl_body.insert(insert_pos + 1, cap_p)
    
    # Update heading positions (shifted by 2)
    for k in heading_positions:
        if heading_positions[k] >= insert_pos:
            heading_positions[k] += 2

print(f"  Inserted {len(src_images)} images")

# ===== Save =====
print("\n💾 Step 7: Save...")
tpl_tree.write(os.path.join(TPL, 'word', 'document.xml'), xml_declaration=True, encoding='UTF-8', standalone=True)
tpl_rels.write(os.path.join(TPL, 'word', '_rels', 'document.xml.rels'), xml_declaration=True, encoding='UTF-8', standalone=True)

print("\n✅ Edit complete!")
