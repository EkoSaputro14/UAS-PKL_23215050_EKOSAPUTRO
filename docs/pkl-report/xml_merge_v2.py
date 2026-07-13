#!/usr/bin/env python3
"""
XML merge v2: Handle image relationships properly.
When copying paragraphs with drawings, remap rId references.
"""
import os
import copy
import shutil
import zipfile
from lxml import etree

WORK = 'C:/Users/SMANSA/AppData/Local/Temp/docx_merge'
TPL_DIR = os.path.join(WORK, 'tpl')
SRC_DIR = os.path.join(WORK, 'src')
OUTPUT = 'C:/Users/SMANSA/mimotes/docs/pkl-report/LAPORAN_PKL_v15_Template.docx'

NEW_TITLE = "RANCANG BANGUN SISTEM CHATBOT AI BERBASIS PENGETAHUAN DENGAN RETRIEVAL-AUGMENTED GENERATION DAN PIPELINE CRM UNTUK OPTIMALISASI LAYANAN PELANGGAN"
NEW_STUDENT = "Eko Saputro"
NEW_NIM = "23215050"
NEW_SUPERVISOR = "Widianto Agung Nugroho"
OLD_STUDENT = "Moh. Arif Prasetyo"
OLD_NIM = "23215043"

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'

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
tpl_tree = etree.parse(os.path.join(TPL_DIR, 'word', 'document.xml'))
tpl_body = tpl_tree.getroot().find(w('body'))
src_tree = etree.parse(os.path.join(SRC_DIR, 'word', 'document.xml'))
src_body = src_tree.getroot().find(w('body'))

# === Find Daftar Isi in template ===
dai_idx = None
for i, child in enumerate(tpl_body):
    if child.tag == w('p') and is_heading(child, 1) and 'Daftar Isi' in get_text(child):
        dai_idx = i
        break
print(f"  Daftar Isi at: {dai_idx}")

# === Find BAB positions in source ===
src_babs = {}
for i, child in enumerate(src_body):
    if child.tag == w('p') and is_heading(child, 1):
        key = classify_bab(get_text(child))
        if key: src_babs[key] = i

src_start = src_babs.get('BAB_I', 0)
print(f"  Source starts at: {src_start}")

# === Load source relationships ===
print("\n📝 Step 2: Load relationships...")
src_rels_tree = etree.parse(os.path.join(SRC_DIR, 'word', '_rels', 'document.xml.rels'))
src_rels_root = src_rels_tree.getroot()

# Build mapping: source rId → (type, target)
src_rel_map = {}
for rel in src_rels_root:
    rid = rel.get('Id', '')
    src_rel_map[rid] = {
        'type': rel.get('Type', ''),
        'target': rel.get('Target', ''),
    }

tpl_rels_tree = etree.parse(os.path.join(TPL_DIR, 'word', '_rels', 'document.xml.rels'))
tpl_rels_root = tpl_rels_tree.getroot()

# Find max rId in template
max_id = 0
for rel in tpl_rels_root:
    rid = rel.get('Id', '')
    if rid.startswith('rId'):
        try: max_id = max(max_id, int(rid[3:]))
        except: pass

# === Build rId remapping ===
print("  Building rId remap...")
rid_remap = {}

# First, copy ALL source relationships to template
for src_rid, info in src_rel_map.items():
    # Check if target already exists in template
    existing = None
    for tpl_rel in tpl_rels_root:
        if tpl_rel.get('Target') == info['target']:
            existing = tpl_rel.get('Id')
            break
    
    if existing:
        rid_remap[src_rid] = existing
    else:
        max_id += 1
        new_rid = f'rId{max_id}'
        new_rel = etree.SubElement(tpl_rels_root, f'{{{REL_NS}}}Relationship')
        new_rel.set('Id', new_rid)
        new_rel.set('Type', info['type'])
        new_rel.set('Target', info['target'])
        rid_remap[src_rid] = new_rid

print(f"  Remapped {len(rid_remap)} relationships")

# Save updated rels
tpl_rels_tree.write(
    os.path.join(TPL_DIR, 'word', '_rels', 'document.xml.rels'),
    xml_declaration=True, encoding='UTF-8', standalone=True
)

# === Clear template from Daftar Isi ===
print("\n📝 Step 3: Clear template...")
tpl_children = list(tpl_body)
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

# === Copy source content with rId remapping ===
print("\n📝 Step 4: Copy content...")

style_map = {
    'Heading1': tpl_heading_style, 'Heading 1': tpl_heading_style,
    'Heading2': 'Judul2', 'Heading 2': 'Judul2',
    'Heading3': 'Judul3', 'Heading 3': 'Judul3',
    'Normal': 'Normal', 'Normal (Web)': 'Normal', 'List Paragraph': 'ListParagraph',
}

def remap_rids(elem):
    """Recursively remap r:embed and r:id attributes."""
    # Check for r:embed in blip elements
    for blip in elem.iter(f'{{{A_NS}}}blip'):
        embed = blip.get(f'{{{R_NS}}}embed')
        if embed and embed in rid_remap:
            blip.set(f'{{{R_NS}}}embed', rid_remap[embed])
    
    # Check for r:id in hyperlink elements
    for hl in elem.iter(w('hyperlink')):
        rid = hl.get(f'{{{R_NS}}}id')
        if rid and rid in rid_remap:
            hl.set(f'{{{R_NS}}}id', rid_remap[rid])

added = 0
src_children = list(src_body)
for src_child in src_children[src_start:]:
    if src_child.tag != w('p'):
        continue
    
    # Deep copy
    new_p = copy.deepcopy(src_child)
    
    # Map style
    pPr = new_p.find(w('pPr'))
    if pPr is not None:
        pStyle = pPr.find(w('pStyle'))
        if pStyle is not None:
            old_style = pStyle.get(w('val'), '')
            new_style = style_map.get(old_style, old_style)
            pStyle.set(w('val'), new_style)
    
    # Remap rIds
    remap_rids(new_p)
    
    tpl_body.append(new_p)
    added += 1

print(f"  Added {added} paragraphs")

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

# === Copy images ===
print("\n🖼️ Step 6: Copy images...")
src_media = os.path.join(SRC_DIR, 'word', 'media')
tpl_media = os.path.join(TPL_DIR, 'word', 'media')
os.makedirs(tpl_media, exist_ok=True)

if os.path.exists(src_media):
    for f in os.listdir(src_media):
        shutil.copy2(os.path.join(src_media, f), os.path.join(tpl_media, f))
    print(f"  Copied {len(os.listdir(src_media))} images")

# === Save ===
print("\n💾 Step 7: Save...")
tpl_tree.write(
    os.path.join(TPL_DIR, 'word', 'document.xml'),
    xml_declaration=True, encoding='UTF-8', standalone=True
)

# === Repack ===
print("\n📦 Step 8: Repack...")
if os.path.exists(OUTPUT): os.remove(OUTPUT)

with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(TPL_DIR):
        for f in files:
            fp = os.path.join(root, f)
            zf.write(fp, os.path.relpath(fp, TPL_DIR))

print(f"  ✅ {OUTPUT}")
print(f"  Size: {os.path.getsize(OUTPUT)/1024:.0f} KB")

# === Verify ===
print("\n📊 Verify...")
v_tree = etree.parse(os.path.join(TPL_DIR, 'word', 'document.xml'))
v_body = v_tree.getroot().find(w('body'))

old_words = ['Sistem Pakar Deteksi Hama', 'Dinas Pertanian', 'Brebes', 'SIPATAN', 'Certainty Factor']
found = [w_ for w_ in old_words if any(w_ in get_text(c) for c in v_body if c.tag == w('p'))]
print(f"  Old content: {found if found else '✅ Clean'}")

# Count images
drawing_xpath = f'.//{{{W}}}drawing'
img_count = sum(1 for c in v_body if c.tag == w('p') and c.find(drawing_xpath) is not None)
print(f"  Images in document: {img_count}")

h1 = sum(1 for c in v_body if c.tag == w('p') and is_heading(c, 1))
print(f"  Heading 1: {h1}")
print(f"  Paragraphs: {sum(1 for c in v_body if c.tag == w('p'))}")
