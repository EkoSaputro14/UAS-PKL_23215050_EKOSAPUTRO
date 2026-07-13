#!/usr/bin/env python3
"""
XML-level merge: Unpack → Edit document.xml → Repack.
Preserves ALL template formatting because we only edit text content.
"""
import os
import re
import copy
import shutil
import zipfile
from lxml import etree

TEMPLATE_DOCX = 'C:/Users/SMANSA/AppData/Local/hermes/cache/documents/doc_4ce6543a497c_LAPORAN PKL (1).docx'
SOURCE_DOCX = 'LAPORAN_PKL_v14_UML.docx'
OUTPUT_DOCX = 'LAPORAN_PKL_v15_Template.docx'

WORK = 'C:/Users/SMANSA/AppData/Local/Temp/docx_work'
TPL_DIR = os.path.join(WORK, 'template')
SRC_DIR = os.path.join(WORK, 'source')

# Namespaces
NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'wps': 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
}

NEW_TITLE = "RANCANG BANGUN SISTEM CHATBOT AI BERBASIS PENGETAHUAN DENGAN RETRIEVAL-AUGMENTED GENERATION DAN PIPELINE CRM UNTUK OPTIMALISASI LAYANAN PELANGGAN"
NEW_STUDENT = "Eko Saputro"
NEW_NIM = "23215050"
NEW_SUPERVISOR = "Widianto Agung Nugroho"
OLD_STUDENT = "Moh. Arif Prasetyo"
OLD_NIM = "23215043"

def get_text(elem):
    """Get all text from an element and its children."""
    return ''.join(elem.itertext()).strip()

def set_text(elem, new_text):
    """Set text in first w:t element, clearing others."""
    t_elems = list(elem.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'))
    if t_elems:
        t_elems[0].text = new_text
        t_elems[0].set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        for t in t_elems[1:]:
            t.text = ''

def get_style_id(para):
    """Get style ID from paragraph."""
    pPr = para.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
    if pPr is not None:
        pStyle = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pStyle')
        if pStyle is not None:
            return pStyle.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', '')
    return ''

def is_heading1(para):
    style = get_style_id(para)
    return style in ('Heading1', 'Judul1')

def classify_bab(text):
    first_line = text.strip().split('\n')[0].strip()
    if 'BAB V' in first_line: return 'BAB_V'
    if 'BAB IV' in first_line: return 'BAB_IV'
    if 'BAB III' in first_line: return 'BAB_III'
    if 'BAB II' in first_line: return 'BAB_II'
    if 'BAB I' in first_line: return 'BAB_I'
    if 'DAFTAR PUSTAKA' in first_line: return 'DAFTAR_PUSTAKA'
    if 'LAMPIRAN' in first_line: return 'LAMPIRAN'
    return None

print("📄 Step 1: Parse XML...")

# Parse template document.xml
tpl_tree = etree.parse(os.path.join(TPL_DIR, 'word', 'document.xml'))
tpl_root = tpl_tree.getroot()
tpl_body = tpl_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
tpl_paras = list(tpl_body)

# Parse source document.xml
src_tree = etree.parse(os.path.join(SRC_DIR, 'word', 'document.xml'))
src_root = src_tree.getroot()
src_body = src_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
src_paras = list(src_body)

print(f"  Template: {len(tpl_paras)} elements")
print(f"  Source: {len(src_paras)} elements")

# ===== Step 2: Find Daftar Isi position in template =====
print("\n📝 Step 2: Finding Daftar Isi...")

dai_idx = None
for i, para in enumerate(tpl_paras):
    if para.tag.endswith('}p'):
        text = get_text(para)
        if 'Daftar Isi' in text and is_heading1(para):
            dai_idx = i
            break

print(f"  Daftar Isi at element index: {dai_idx}")

# ===== Step 3: Find content boundaries in source =====
print("\n📝 Step 3: Finding source content...")

src_babs = {}
for i, para in enumerate(src_paras):
    if para.tag.endswith('}p') and is_heading1(para):
        text = get_text(para)
        key = classify_bab(text)
        if key:
            src_babs[key] = i

print(f"  Source BABs: {src_babs}")

# ===== Step 4: Replace template content =====
print("\n📝 Step 4: Replacing content...")

if dai_idx is not None:
    # Find sectPr (section properties) at end of body
    sectPr = tpl_body.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sectPr')
    
    # Remove everything from Daftar Isi onwards (except sectPr)
    to_remove = []
    for child in tpl_paras[dai_idx:]:
        if child is not sectPr:
            to_remove.append(child)
    
    for elem in to_remove:
        tpl_body.remove(elem)
    
    print(f"  Removed {len(to_remove)} elements from Daftar Isi onwards")
    
    # Now add source content from BAB I onwards
    if 'BAB_I' in src_babs:
        start_idx = src_babs['BAB_I']
        
        # Add Daftar Isi/Tabel/Gambar headings (empty for user to fill)
        for heading_text in ['Daftar Isi', 'Daftar  Tabel', 'Daftar Gambar']:
            new_p = etree.SubElement(tpl_body, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
            pPr = etree.SubElement(new_p, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
            pStyle = etree.SubElement(pPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pStyle')
            pStyle.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', 'Judul1')
            r = etree.SubElement(new_p, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r')
            t = etree.SubElement(r, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')
            t.text = heading_text
        
        # Copy source paragraphs from BAB I onwards
        added = 0
        for src_para in src_paras[start_idx:]:
            if not src_para.tag.endswith('}p'):
                continue
            
            text = get_text(src_para)
            style_id = get_style_id(src_para)
            
            # Skip empty paragraphs (but keep some structure)
            if not text and style_id not in ('Heading1', 'Heading2', 'Heading3', 'Judul1', 'Judul2', 'Judul3'):
                continue
            
            # Create new paragraph with same style
            new_p = etree.SubElement(tpl_body, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
            
            # Copy pPr (paragraph properties) for formatting
            pPr = src_para.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
            if pPr is not None:
                new_pPr = copy.deepcopy(pPr)
                new_p.insert(0, new_pPr)
            
            # Copy text runs
            for r in src_para.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
                new_r = copy.deepcopy(r)
                new_p.append(new_r)
            
            added += 1
        
        print(f"  Added {added} paragraphs from source")
    
    # ===== Step 5: Fix front matter text =====
    print("\n📝 Step 5: Fixing front matter...")
    
    for para in tpl_body:
        if not para.tag.endswith('}p'):
            continue
        text = get_text(para)
        
        if 'SISTEM PAKAR' in text:
            for t_elem in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                if t_elem.text and 'SISTEM PAKAR' in t_elem.text:
                    t_elem.text = t_elem.text.replace('SISTEM PAKAR DETEKSI HAMA DAN PENYAKIT PADI MENGGUNAKAN CERTAINTY', NEW_TITLE)
                    break
        
        for t_elem in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
            if t_elem.text:
                if OLD_STUDENT in t_elem.text:
                    t_elem.text = t_elem.text.replace(OLD_STUDENT, NEW_STUDENT)
                if OLD_NIM in t_elem.text:
                    t_elem.text = t_elem.text.replace(OLD_NIM, NEW_NIM)
                if 'Nama Dosen Pembimbing' in t_elem.text:
                    t_elem.text = t_elem.text.replace('Nama Dosen Pembimbing', NEW_SUPERVISOR)
                if 'NIPY.' in t_elem.text:
                    t_elem.text = t_elem.text.replace('NIPY.', '')
    
    print("  ✅ Done")

# ===== Step 6: Save modified XML =====
print("\n💾 Step 6: Saving...")

# Write back to template
tpl_tree.write(
    os.path.join(TPL_DIR, 'word', 'document.xml'),
    xml_declaration=True,
    encoding='UTF-8',
    standalone=True,
)

# ===== Step 7: Copy images from source =====
print("\n🖼️ Step 7: Copying images...")

src_media = os.path.join(SRC_DIR, 'word', 'media')
tpl_media = os.path.join(TPL_DIR, 'word', 'media')

if os.path.exists(src_media):
    os.makedirs(tpl_media, exist_ok=True)
    for f in os.listdir(src_media):
        src_file = os.path.join(src_media, f)
        dst_file = os.path.join(tpl_media, f)
        shutil.copy2(src_file, dst_file)
        print(f"  ✅ {f}")

# ===== Step 8: Update relationships for images =====
print("\n📝 Step 8: Updating relationships...")

src_rels = os.path.join(SRC_DIR, 'word', '_rels', 'document.xml.rels')
tpl_rels = os.path.join(TPL_DIR, 'word', '_rels', 'document.xml.rels')

if os.path.exists(src_rels):
    # Read source relationships
    src_rels_tree = etree.parse(src_rels)
    src_rels_root = src_rels_tree.getroot()
    
    # Find max rId in template
    tpl_rels_tree = etree.parse(tpl_rels)
    tpl_rels_root = tpl_rels_tree.getroot()
    
    max_id = 0
    for rel in tpl_rels_root:
        rid = rel.get('Id', '')
        if rid.startswith('rId'):
            try:
                num = int(rid[3:])
                max_id = max(max_id, num)
            except ValueError:
                pass
    
    # Copy image relationships from source
    copied = 0
    for rel in src_rels_root:
        target = rel.get('Target', '')
        rel_type = rel.get('Type', '')
        if 'image' in rel_type.lower() or target.startswith('media/'):
            max_id += 1
            new_id = f'rId{max_id}'
            
            # Check if already exists
            exists = any(
                r.get('Target') == target 
                for r in tpl_rels_root
            )
            
            if not exists:
                new_rel = etree.SubElement(tpl_rels_root, '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')
                new_rel.set('Id', new_id)
                new_rel.set('Type', rel_type)
                new_rel.set('Target', target)
                copied += 1
    
    tpl_rels_tree.write(tpl_rels, xml_declaration=True, encoding='UTF-8', standalone=True)
    print(f"  Copied {copied} relationships")

# ===== Step 9: Repack =====
print("\n📦 Step 9: Repacking...")

# Create output .docx (ZIP)
if os.path.exists(OUTPUT_DOCX):
    os.remove(OUTPUT_DOCX)

with zipfile.ZipFile(OUTPUT_DOCX, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(TPL_DIR):
        for f in files:
            file_path = os.path.join(root, f)
            arc_name = os.path.relpath(file_path, TPL_DIR)
            zf.write(file_path, arc_name)

print(f"  ✅ Created: {OUTPUT_DOCX}")
print(f"  Size: {os.path.getsize(OUTPUT_DOCX)/1024:.0f} KB")

# ===== Verify =====
print("\n📊 Verification...")
verify_tree = etree.parse(os.path.join(TPL_DIR, 'word', 'document.xml'))
verify_body = verify_tree.getroot().find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')

old_words = ['Sistem Pakar Deteksi Hama', 'Dinas Pertanian', 'Brebes', 'SIPATAN', 'Certainty Factor']
found_old = []
for para in verify_body:
    text = get_text(para)
    for w in old_words:
        if w in text:
            found_old.append(w)

print(f"  Old content: {found_old if found_old else '✅ Clean'}")

# Count headings
h1_count = sum(1 for p in verify_body if p.tag.endswith('}p') and is_heading1(p))
print(f"  Heading 1 count: {h1_count}")
