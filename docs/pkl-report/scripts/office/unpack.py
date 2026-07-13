#!/usr/bin/env python3
"""
Unpack a .docx file into a directory for XML editing.

Usage: python unpack.py document.docx unpacked/

Features:
- Extracts all files from the .docx ZIP archive
- Pretty-prints XML files for human editing
- Merges adjacent runs with identical formatting (reduces noise)
- Converts smart quotes to XML entities (&#x201C; etc.) so they survive editing
"""
import os
import sys
import re
import zipfile
from lxml import etree

# Smart quote mapping
SMART_QUOTES = {
    '\u2018': '&#x2018;',  # left single
    '\u2019': '&#x2019;',  # right single / apostrophe
    '\u201C': '&#x201C;',  # left double
    '\u201D': '&#x201D;',  # right double
    '\u2013': '&#x2013;',  # en dash
    '\u2014': '&#x2014;',  # em dash
    '\u2026': '&#x2026;',  # ellipsis
}

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def escape_smart_quotes(text):
    """Replace smart quotes with XML entities."""
    for char, entity in SMART_QUOTES.items():
        text = text.replace(char, entity)
    return text

def merge_adjacent_runs(para):
    """Merge adjacent runs with identical formatting."""
    runs = list(para.findall(f'{{{W_NS}}}r'))
    if len(runs) < 2:
        return
    
    i = 0
    while i < len(runs) - 1:
        r1 = runs[i]
        r2 = runs[i + 1]
        
        # Compare rPr (run properties)
        rpr1 = r1.find(f'{{{W_NS}}}rPr')
        rpr2 = r2.find(f'{{{W_NS}}}rPr')
        
        rpr1_xml = etree.tostring(rpr1, encoding='unicode') if rpr1 is not None else ''
        rpr2_xml = etree.tostring(rpr2, encoding='unicode') if rpr2 is not None else ''
        
        if rpr1_xml == rpr2_xml:
            # Merge: append text from r2 to r1
            t1_list = r1.findall(f'{{{W_NS}}}t')
            t2_list = r2.findall(f'{{{W_NS}}}t')
            
            if t1_list and t2_list:
                t1 = t1_list[-1]
                t2 = t2_list[0]
                
                # Preserve space attribute
                XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'
                space = t2.get(XML_SPACE)
                if space:
                    t1.set(XML_SPACE, space)
                
                t1.text = (t1.text or '') + (t2.text or '')
                
                # Remove r2
                para.remove(r2)
                runs.pop(i + 1)
        else:
            i += 1

def process_xml_file(filepath):
    """Pretty-print, merge runs, and escape smart quotes in an XML file."""
    try:
        tree = etree.parse(filepath)
    except etree.XMLSyntaxError:
        print(f"  ⚠️ Not valid XML, skipping: {os.path.basename(filepath)}")
        return False
    
    root = tree.getroot()
    
    # Merge adjacent runs in all paragraphs (word/document.xml)
    if filepath.endswith('document.xml'):
        for para in root.iter(f'{{{W_NS}}}p'):
            merge_adjacent_runs(para)
    
    # Escape smart quotes in all w:t elements
    for t_elem in root.iter(f'{{{W_NS}}}t'):
        if t_elem.text:
            t_elem.text = escape_smart_quotes(t_elem.text)
    for t_elem in root.iter(f'{{{W_NS}}}delText'):
        if t_elem.text:
            t_elem.text = escape_smart_quotes(t_elem.text)
    
    # Write back with pretty-printing
    tree.write(
        filepath,
        xml_declaration=True,
        encoding='UTF-8',
        standalone=True,
        pretty_print=True,
    )
    return True

def main():
    if len(sys.argv) < 3:
        print("Usage: python unpack.py document.docx unpacked/")
        print("       python unpack.py document.docx unpacked/ --merge-runs false")
        sys.exit(1)
    
    docx_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    # Parse --merge-runs flag
    merge_runs = True
    if '--merge-runs' in sys.argv:
        idx = sys.argv.index('--merge-runs')
        if idx + 1 < len(sys.argv):
            merge_runs = sys.argv[idx + 1].lower() != 'false'
    
    if not os.path.exists(docx_path):
        print(f"❌ File not found: {docx_path}")
        sys.exit(1)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"📦 Unpacking: {docx_path}")
    print(f"   Output: {output_dir}")
    
    # Extract ZIP
    with zipfile.ZipFile(docx_path, 'r') as zf:
        zf.extractall(output_dir)
    
    # Count files
    xml_files = []
    for root, dirs, files in os.walk(output_dir):
        for f in files:
            if f.endswith('.xml'):
                xml_files.append(os.path.join(root, f))
    
    print(f"   Extracted {len(xml_files)} XML files")
    
    # Process XML files
    if merge_runs:
        print(f"   Merging adjacent runs + escaping smart quotes...")
        processed = 0
        for filepath in xml_files:
            if process_xml_file(filepath):
                processed += 1
        print(f"   Processed {processed} XML files")
    
    print(f"✅ Done: {output_dir}")

if __name__ == '__main__':
    main()
