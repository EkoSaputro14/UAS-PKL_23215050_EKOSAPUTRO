#!/usr/bin/env python3
"""
XML-level merge using unpack/edit/repack approach.
Preserves ALL template formatting by editing document.xml directly.
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
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
REL = 'http://schemas.openxmlformats.org/package/2006/relationships'

def w(tag): return f'{{{W}}}{tag}'
def a(tag): return f'{{{A}}}{tag}'
def wp(tag): return f'{{{WP}}}{tag}'
def rel(tag): return f'{{{REL}}}{tag}'

def get_text(elem):
    return ''.join(t.text or '' for t in elem.iter(w('t'))).strip()

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
        return sid in ('Heading1','Heading2','Heading3','Judul1','Judul2','Judul3')
    return sid in (f'Heading{level}', f'Judul{level}')

def classify_bab(text):
    fl = text.strip().split('\n')[0].strip()
    for kw in ['BAB V','BAB IV','BAB III','BAB II','BAB I']:
        if kw in fl:
            return kw.replace(' ','_').replace('.','')
    if 'DAFTAR PUSTAKA' in fl: return 'DAFTAR_PUSTAKA'
    if 'LAMPIRAN' in fl: return 'LAMPIRAN'
    return None

print("📄 Parsing XML...")
tpl_tree = etree.parse(os.path.join(TPL_DIR, 'word', 'document.xml'))
tpl_body = tpl_tree.getroot().find(w('body'))
src_tree = etree.parse(os.path.join(SRC_DIR, 'word', 'document.xml'))
src_body = src_tree.getroot().find(w('body'))

tpl_children = list(tpl_body)
src_children = list(src_body)

print(f"  Template: {len(tpl_children)} elements")
print(f"  Source: {len(src_children)} elements")

# === Find Daftar Isi in template ===
print("\n📝 Finding Daftar Isi...")
dai_idx = None
for i, child in enumerate(tpl_children):
    if child.tag == w('p') and is_heading(child, 1):
        if 'Daftar Isi' in get_text(child):
            dai_idx = i
            break
print(f"  Index: {dai_idx}")

# === Find BAB positions in source ===
print("\n📝 Finding source sections...")
src_babs = {}
for i, child in enumerate(src_children):
    if child.tag == w('p') and is_heading(child, 1):
        key = classify_bab(get_text(child))
        if key:
            src_babs[key] = i
print(f"  {src_babs}")

# === Find content start in source ===
src_start = src_babs.get('BAB_I', 0)
print(f"  Content starts at: {src_start}")

# === Clear template from Daftar Isi onwards ===
print("\n📝 Clearing template content...")
if dai_idx is not None:
    sectPr = tpl_body.find(w('sectPr'))
    to_remove = [c for c in tpl_children[dai_idx:] if c is not sectPr]
    for elem in to_remove:
        tpl_body.remove(elem)
    print(f"  Removed {len(to_remove)} elements")

# === Add Daftar Isi/Tabel/Gambar headings ===
print("\n📝 Adding Daftar headings...")

# Find the template's Heading1 style reference
# Look at existing heading paragraphs for the style ID
tpl_heading_style = 'Judul1'  # Default
for child in tpl_children[:dai_idx]:
    if child.tag == w('p'):
        sid = get_style_id(child)
        if sid in ('Heading1', 'Judul1'):
            tpl_heading_style = sid
            break

print(f"  Using style: {tpl_heading_style}")

for heading_text in ['Daftar Isi', 'Daftar  Tabel', 'Daftar Gambar']:
    p = etree.SubElement(tpl_body, w('p'))
    pPr = etree.SubElement(p, w('pPr'))
    pStyle = etree.SubElement(pPr, w('pStyle'))
    pStyle.set(w('val'), tpl_heading_style)
    r = etree.SubElement(p, w('r'))
    t = etree.SubElement(r, w('t'))
    t.text = heading_text

# === Copy source content ===
print("\n📝 Copying source content...")

# Build style mapping: source style → template style
style_map = {
    'Heading1': tpl_heading_style,
    'Heading 1': tpl_heading_style,
    'Heading2': 'Judul2',
    'Heading 2': 'Judul2',
    'Heading3': 'Judul3',
    'Heading 3': 'Judul3',
    'Normal': 'Normal',
    'Normal (Web)': 'Normal',
    'List Paragraph': 'ListParagraph',
}

added = 0
for src_child in src_children[src_start:]:
    if src_child.tag != w('p'):
        continue
    
    text = get_text(src_child)
    src_style = get_style_id(src_child)
    
    # Create new paragraph
    new_p = etree.SubElement(tpl_body, w('p'))
    
    # Copy paragraph properties with mapped style
    src_pPr = src_child.find(w('pPr'))
    if src_pPr is not None:
        new_pPr = copy.deepcopy(src_pPr)
        # Map style
        pStyle = new_pPr.find(w('pStyle'))
        if pStyle is not None:
            old_style = pStyle.get(w('val'), '')
            new_style = style_map.get(old_style, old_style)
            pStyle.set(w('val'), new_style)
        new_p.insert(0, new_pPr)
    
    # Copy runs
    for src_r in src_child.findall(w('r')):
        new_r = copy.deepcopy(src_r)
        new_p.append(new_r)
    
    added += 1

print(f"  Added {added} paragraphs")

# === Fix front matter ===
print("\n📝 Fixing front matter...")
for child in tpl_body:
    if child.tag != w('p'):
        continue
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

print("  ✅ Done")

# === Save XML ===
print("\n💾 Saving XML...")
tpl_tree.write(
    os.path.join(TPL_DIR, 'word', 'document.xml'),
    xml_declaration=True, encoding='UTF-8', standalone=True
)

# === Copy images ===
print("\n🖼️ Copying images...")
src_media = os.path.join(SRC_DIR, 'word', 'media')
tpl_media = os.path.join(TPL_DIR, 'word', 'media')
os.makedirs(tpl_media, exist_ok=True)

# Track which images we copy (for relationships)
copied_images = {}
if os.path.exists(src_media):
    for f in os.listdir(src_media):
        if f.endswith(('.png', '.jpg', '.jpeg', '.gif')):
            src_file = os.path.join(src_media, f)
            # Use same name to avoid conflicts
            dst_file = os.path.join(tpl_media, f)
            shutil.copy2(src_file, dst_file)
            copied_images[f] = f
            print(f"  ✅ {f}")

# === Update relationships ===
print("\n📝 Updating relationships...")
src_rels_path = os.path.join(SRC_DIR, 'word', '_rels', 'document.xml.rels')
tpl_rels_path = os.path.join(TPL_DIR, 'word', '_rels', 'document.xml.rels')

if os.path.exists(src_rels_path) and os.path.exists(tpl_rels_path):
    src_rels_tree = etree.parse(src_rels_path)
    tpl_rels_tree = etree.parse(tpl_rels_path)
    src_rels_root = src_rels_tree.getroot()
    tpl_rels_root = tpl_rels_tree.getroot()
    
    # Find max rId in template
    max_id = 0
    for rel_elem in tpl_rels_root:
        rid = rel_elem.get('Id', '')
        if rid.startswith('rId'):
            try:
                num = int(rid[3:])
                max_id = max(max_id, num)
            except ValueError:
                pass
    
    # Copy image relationships
    copied_rels = 0
    for rel_elem in src_rels_root:
        target = rel_elem.get('Target', '')
        rel_type = rel_elem.get('Type', '')
        
        # Only copy image relationships
        if 'image' not in rel_type.lower() and not target.startswith('media/'):
            continue
        
        # Check if target image was copied
        img_name = os.path.basename(target)
        if img_name not in copied_images:
            continue
        
        # Check if already exists
        exists = any(
            r.get('Target') == target 
            for r in tpl_rels_root
        )
        
        if not exists:
            max_id += 1
            new_rel = etree.SubElement(tpl_rels_root, rel('Relationship'))
            new_rel.set('Id', f'rId{max_id}')
            new_rel.set('Type', rel_type)
            new_rel.set('Target', target)
            copied_rels += 1
    
    tpl_rels_tree.write(tpl_rels_path, xml_declaration=True, encoding='UTF-8', standalone=True)
    print(f"  Copied {copied_rels} relationships")

# === Update [Content_Types].xml ===
print("\n📝 Updating Content Types...")
ct_path = os.path.join(TPL_DIR, '[Content_Types].xml')
if os.path.exists(ct_path):
    ct_tree = etree.parse(ct_path)
    ct_root = ct_tree.getroot()
    CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types'
    
    # Check what extensions are already registered
    existing = set()
    for elem in ct_root:
        ext = elem.get('Extension', '')
        if ext:
            existing.add(ext.lower())
    
    # Add missing image types
    for ext, ct in [('png', 'image/png'), ('jpg', 'image/jpeg'), ('jpeg', 'image/jpeg'), ('gif', 'image/gif')]:
        if ext not in existing:
            new_elem = etree.SubElement(ct_root, f'{{{CT_NS}}}Default')
            new_elem.set('Extension', ext)
            new_elem.set('ContentType', ct)
    
    ct_tree.write(ct_path, xml_declaration=True, encoding='UTF-8', standalone=True)
    print("  ✅ Done")

# === Repack ===
print("\n📦 Repacking...")
if os.path.exists(OUTPUT):
    os.remove(OUTPUT)

with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(TPL_DIR):
        for f in files:
            file_path = os.path.join(root, f)
            arc_name = os.path.relpath(file_path, TPL_DIR)
            zf.write(file_path, arc_name)

print(f"  ✅ {OUTPUT}")
print(f"  Size: {os.path.getsize(OUTPUT)/1024:.0f} KB")

# === Verify ===
print("\n📊 Verification...")
verify_tree = etree.parse(os.path.join(TPL_DIR, 'word', 'document.xml'))
verify_body = verify_tree.getroot().find(w('body'))

old_words = ['Sistem Pakar Deteksi Hama', 'Dinas Pertanian', 'Brebes', 'SIPATAN', 'Certainty Factor', 'CF Kombinasi']
found_old = []
for child in verify_body:
    if child.tag == w('p'):
        text = get_text(child)
        for word in old_words:
            if word in text:
                found_old.append(word)

print(f"  Old content: {found_old if found_old else '✅ Clean'}")

# Count headings
h1_count = sum(1 for c in verify_body if c.tag == w('p') and is_heading(c, 1))
print(f"  Heading 1 count: {h1_count}")

# Count total paragraphs
para_count = sum(1 for c in verify_body if c.tag == w('p'))
print(f"  Total paragraphs: {para_count}")
