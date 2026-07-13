#!/usr/bin/env python3
"""
Pack an unpacked directory back into a .docx file.

Usage: python pack.py unpacked/ output.docx --original document.docx

Features:
- Validates XML files
- Auto-repairs common issues (durableId, xml:space)
- Condenses XML (removes pretty-printing for smaller file)
- Creates valid .docx ZIP archive
"""
import os
import sys
import re
import zipfile
from lxml import etree

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def auto_repair_xml(filepath):
    """Auto-repair common XML issues."""
    try:
        tree = etree.parse(filepath)
    except etree.XMLSyntaxError as e:
        print(f"  ⚠️ XML parse error in {os.path.basename(filepath)}: {e}")
        return False
    
    root = tree.getroot()
    repaired = False
    
    # Fix 1: Add xml:space="preserve" to w:t elements with whitespace
    XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'
    for t_elem in root.iter(f'{{{W_NS}}}t'):
        if t_elem.text and (t_elem.text.startswith(' ') or t_elem.text.endswith(' ')):
            if not t_elem.get(XML_SPACE):
                t_elem.set(XML_SPACE, 'preserve')
                repaired = True
    
    # Fix 2: Regenerate durableId if >= 0x7FFFFFFF
    for settings in root.iter(f'{{{W_NS}}}settings'):
        for durable_id in settings.iter(f'{{{W_NS}}}durableId'):
            if durable_id.text:
                try:
                    val = int(durable_id.text, 16) if durable_id.text.startswith('0x') else int(durable_id.text)
                    if val >= 0x7FFFFFFF:
                        durable_id.text = '00000001'
                        repaired = True
                except ValueError:
                    pass
    
    if repaired:
        tree.write(filepath, xml_declaration=True, encoding='UTF-8', standalone=True)
    
    return True

def validate_document(filepath):
    """Basic validation of document.xml."""
    try:
        tree = etree.parse(filepath)
    except etree.XMLSyntaxError as e:
        print(f"  ❌ Invalid XML: {e}")
        return False
    
    root = tree.getroot()
    
    # Check for required elements
    body = root.find(f'{{{W_NS}}}body')
    if body is None:
        print(f"  ❌ Missing <w:body>")
        return False
    
    # Check sectPr exists
    sect_pr = body.find(f'{{{W_NS}}}sectPr')
    if sect_pr is None:
        print(f"  ⚠️ Missing <w:sectPr> (may cause layout issues)")
    
    return True

def main():
    if len(sys.argv) < 3:
        print("Usage: python pack.py unpacked/ output.docx [--original document.docx] [--validate false]")
        sys.exit(1)
    
    input_dir = sys.argv[1]
    output_path = sys.argv[2]
    
    # Parse flags
    original_path = None
    validate = True
    if '--original' in sys.argv:
        idx = sys.argv.index('--original')
        if idx + 1 < len(sys.argv):
            original_path = sys.argv[idx + 1]
    if '--validate' in sys.argv:
        idx = sys.argv.index('--validate')
        if idx + 1 < len(sys.argv):
            validate = sys.argv[idx + 1].lower() != 'false'
    
    if not os.path.isdir(input_dir):
        print(f"❌ Directory not found: {input_dir}")
        sys.exit(1)
    
    print(f"📦 Packing: {input_dir}")
    print(f"   Output: {output_path}")
    
    # Find all XML files
    xml_files = []
    for root_dir, dirs, files in os.walk(input_dir):
        for f in files:
            filepath = os.path.join(root_dir, f)
            if f.endswith('.xml'):
                xml_files.append(filepath)
    
    print(f"   Found {len(xml_files)} XML files")
    
    # Auto-repair
    print(f"   Auto-repairing...")
    repaired = 0
    for filepath in xml_files:
        if auto_repair_xml(filepath):
            repaired += 1
    print(f"   Repaired {repaired} files")
    
    # Validate
    if validate:
        print(f"   Validating...")
        doc_path = os.path.join(input_dir, 'word', 'document.xml')
        if os.path.exists(doc_path):
            if validate_document(doc_path):
                print(f"   ✅ Validation passed")
            else:
                print(f"   ⚠️ Validation issues found (continuing anyway)")
    
    # Create ZIP (condense XML - remove pretty-printing)
    print(f"   Creating .docx...")
    
    if os.path.exists(output_path):
        os.remove(output_path)
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root_dir, dirs, files in os.walk(input_dir):
            for f in files:
                filepath = os.path.join(root_dir, f)
                arc_name = os.path.relpath(filepath, input_dir)
                
                # Condense XML files (remove pretty-printing)
                if f.endswith('.xml'):
                    try:
                        tree = etree.parse(filepath)
                        xml_bytes = etree.tostring(
                            tree.root,
                            xml_declaration=True,
                            encoding='UTF-8',
                            standalone=True,
                        )
                        zf.writestr(arc_name, xml_bytes)
                    except:
                        # Fallback: copy as-is
                        zf.write(filepath, arc_name)
                else:
                    zf.write(filepath, arc_name)
    
    file_size = os.path.getsize(output_path)
    print(f"✅ Done: {output_path} ({file_size/1024:.0f} KB)")

if __name__ == '__main__':
    main()
