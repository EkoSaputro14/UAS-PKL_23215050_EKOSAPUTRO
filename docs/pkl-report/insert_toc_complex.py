"""
Insert proper Word TOC using complex field (fldChar begin/separate/end).
This is how Word actually creates TOC fields.
"""
from docx import Document
from docx.oxml.ns import qn
from lxml import etree

doc = Document('LAPORAN_PKL_v10_Styles.docx')

# Find DAFTAR ISI heading
for i, p in enumerate(doc.paragraphs):
    if p.style and p.style.style_id == 'Heading1' and 'DAFTAR ISI' in p.text:
        p_elem = p._p
        
        # Remove placeholder paragraphs after DAFTAR ISI
        next_elem = p_elem.getnext()
        while next_elem is not None:
            t_elems = next_elem.findall('.//' + qn('w:t'))
            text = ''.join(t.text or '' for t in t_elems)
            nxt = next_elem.getnext()
            if 'AKAN DIGENERATE' in text or 'Klik kanan' in text or 'Daftar Isi akan' in text:
                parent = next_elem.getparent()
                parent.remove(next_elem)
                next_elem = nxt
            else:
                break
        
        # Create proper TOC paragraph with complex field
        toc_p = etree.Element(qn('w:p'))
        p_elem.addnext(toc_p)
        
        # Add tab stops (right-aligned with dot leader) to paragraph properties
        pPr = etree.SubElement(toc_p, qn('w:pPr'))
        tabs = etree.SubElement(pPr, qn('w:tabs'))
        tab = etree.SubElement(tabs, qn('w:tab'))
        tab.set(qn('w:val'), 'right')
        tab.set(qn('w:leader'), 'dot')
        tab.set(qn('w:pos'), '8296')
        
        backslash = chr(92)
        instr_text = ' TOC ' + backslash + 'o "1-3" ' + backslash + 'h ' + backslash + 'z ' + backslash + 'u '
        
        # fldChar begin
        r_begin = etree.SubElement(toc_p, qn('w:r'))
        fldChar_begin = etree.SubElement(r_begin, qn('w:fldChar'))
        fldChar_begin.set(qn('w:fldCharType'), 'begin')
        
        # fldChar separate
        r_sep = etree.SubElement(toc_p, qn('w:r'))
        fldChar_sep = etree.SubElement(r_sep, qn('w:fldChar'))
        fldChar_sep.set(qn('w:fldCharType'), 'separate')
        
        # Instruction text (hidden)
        r_instr = etree.SubElement(toc_p, qn('w:r'))
        instr = etree.SubElement(r_instr, qn('w:instrText'))
        instr.set(qn('xml:space'), 'preserve')
        instr.text = ' TOC ' + backslash + 'o "1-3" ' + backslash + 'h ' + backslash + 'z ' + backslash + 'u '
        
        # Placeholder text (will be replaced when user clicks Update Field)
        r_placeholder = etree.SubElement(toc_p, qn('w:r'))
        t = etree.SubElement(r_placeholder, qn('w:t'))
        t.text = '[Klik kanan → Update Field → Update entire table]'
        t.set(qn('xml:space'), 'preserve')
        
        # fldChar end
        r_end = etree.SubElement(toc_p, qn('w:r'))
        fldChar_end = etree.SubElement(r_end, qn('w:fldChar'))
        fldChar_end.set(qn('w:fldCharType'), 'end')
        
        print('Complex TOC field inserted')
        break

doc.save('LAPORAN_PKL_v11_Styles_AutoTOC.docx')
print('Saved as LAPORAN_PKL_v11_Styles_AutoTOC.docx')
