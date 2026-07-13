#!/usr/bin/env python3
"""
Edit unpacked document.xml: replace content from Daftar Isi onwards
with source content. Uses unpacked directories from skill workflow.
"""
import os
import copy
from lxml import etree

TPL_DIR = 'C:/Users/SMANSA/mimotes/docs/pkl-report/unpacked_tpl'
SRC_DIR = 'C:/Users/SMANSA/mimotes/docs/pkl-report/unpacked_src'

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'

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

print("📄 Step 1: Parse XML...")

# Parse template
tpl_path = os.path.join(TPL_DIR, 'word', 'document.xml')
tpl_tree = etree.parse(tpl_path)
tpl_body = tpl_tree.getroot().find(w('body'))

# Parse source
src_path = os.path.join(SRC_DIR, 'word', 'document.xml')
src_tree = etree.parse(src_path)
src_body = src_tree.getroot().find(w('body'))

tpl_children = list(tpl_body)
src_children = list(src_body)

print(f"  Template: {len(tpl_children)} elements")
print(f"  Source: {len(src_children)} elements")

# === Find Daftar Isi in template ===
dai_idx = None
for i, child in enumerate(tpl_children):
    if child.tag == w('p') and is_heading(child, 1) and 'Daftar Isi' in get_text(child):
        dai_idx = i
        break
print(f"  Daftar Isi at: {dai_idx}")

# === Find source content start ===
src_start = 0
for i, child in enumerate(src_children):
    if child.tag == w('p') and is_heading(child, 1):
        key = classify_bab(get_text(child))
        if key == 'BAB_I':
            src_start = i
            break
print(f"  Source starts at: {src_start}")

# === Clear template from Daftar Isi ===
print("\n📝 Step 2: Clear template...")
sectPr = tpl_body.find(w('sectPr'))
to_remove = [c for c in tpl_children[dai_idx:] if c is not sectPr]
for elem in to_remove:
    tpl_body.remove(elem)
print(f"  Removed {len(to_remove)} elements")

# === Add Daftar headings ===
tpl_heading_style = 'Judul1'
for child in list(tpl_body)[:dai_idx]:
    if child.tag == w('p'):
        sid = get_style_id(child)
        if sid in ('Heading1', 'Judul1'):
            tpl_heading_style = sid
            break

for heading_text in ['Daftar Isi', 'Daftar  Tabel', 'Daftar Gambar']:
    p = etree.SubElement(tpl_body, w('p'))
    pPr = etree.SubElement(p, w('pPr'))
    pStyle = etree.SubElement(pPr, w('pStyle'))
    pStyle.set(w('val'), tpl_heading_style)
    r = etree.SubElement(p, w('r'))
    t = etree.SubElement(r, w('t'))
    t.text = heading_text

# === Copy source content ===
print("\n📝 Step 3: Copy content...")

style_map = {
    'Heading1': tpl_heading_style, 'Heading 1': tpl_heading_style,
    'Heading2': 'Judul2', 'Heading 2': 'Judul2',
    'Heading3': 'Judul3', 'Heading 3': 'Judul3',
    'Normal': 'Normal', 'Normal (Web)': 'Normal', 'List Paragraph': 'ListParagraph',
}

# Load source relationships for rId remapping
src_rels_tree = etree.parse(os.path.join(SRC_DIR, 'word', '_rels', 'document.xml.rels'))
src_rels_root = src_rels_tree.getroot()
tpl_rels_tree = etree.parse(os.path.join(TPL_DIR, 'word', '_rels', 'document.xml.rels'))
tpl_rels_root = tpl_rels_tree.getroot()

# Find max rId in template
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

print(f"  Remapped {len(rid_remap)} relationships")

def remap_rids(elem):
    for blip in elem.iter(f'{{{A_NS}}}blip'):
        embed = blip.get(f'{{{R_NS}}}embed')
        if embed and embed in rid_remap:
            blip.set(f'{{{R_NS}}}embed', rid_remap[embed])
    for hl in elem.iter(w('hyperlink')):
        rid = hl.get(f'{{{R_NS}}}id')
        if rid and rid in rid_remap:
            hl.set(f'{{{R_NS}}}id', rid_remap[rid])

added = 0
for src_child in src_children[src_start:]:
    if src_child.tag != w('p'):
        continue
    
    new_p = copy.deepcopy(src_child)
    
    # Map style
    pPr = new_p.find(w('pPr'))
    if pPr is not None:
        pStyle = pPr.find(w('pStyle'))
        if pStyle is not None:
            old_style = pStyle.get(w('val'), '')
            pStyle.set(w('val'), style_map.get(old_style, old_style))
    
    remap_rids(new_p)
    tpl_body.append(new_p)
    added += 1

print(f"  Added {added} paragraphs")

# === Fix front matter ===
print("\n📝 Step 4: Fix front matter...")
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

# === Save ===
print("\n💾 Step 5: Save...")
tpl_tree.write(tpl_path, xml_declaration=True, encoding='UTF-8', standalone=True)

# Save updated rels
tpl_rels_tree.write(
    os.path.join(TPL_DIR, 'word', '_rels', 'document.xml.rels'),
    xml_declaration=True, encoding='UTF-8', standalone=True
)

# === Copy images ===
print("\n🖼️ Step 6: Copy images...")
import shutil
src_media = os.path.join(SRC_DIR, 'word', 'media')
tpl_media = os.path.join(TPL_DIR, 'word', 'media')
os.makedirs(tpl_media, exist_ok=True)

if os.path.exists(src_media):
    for f in os.listdir(src_media):
        shutil.copy2(os.path.join(src_media, f), os.path.join(tpl_media, f))
    print(f"  Copied {len(os.listdir(src_media))} images")

print("\n✅ Edit complete! Run pack.py next.")
