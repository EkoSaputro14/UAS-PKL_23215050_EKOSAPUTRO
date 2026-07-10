"""
Insert proper TOC field code - save to new file.
"""
from docx import Document
from docx.oxml.ns import qn
from lxml import etree

doc = Document('LAPORAN_PKL_v10_Styles.docx')

for i, p in enumerate(doc.paragraphs):
    if p.style and p.style.style_id == 'Heading1' and 'DAFTAR ISI' in p.text:
        p_elem = p._p
        
        # Remove placeholder paragraphs after DAFTAR ISI
        next_elem = p_elem.getnext()
        while next_elem is not None:
            t_elems = next_elem.findall('.//' + qn('w:t'))
            text = ''.join(t.text or '' for t in t_elems)
            nxt = next_elem.getnext()
            if 'AKAN DIGENERATE' in text or 'Klik kanan' in text:
                parent = next_elem.getparent()
                parent.remove(next_elem)
                next_elem = nxt
            else:
                break
        
        # Insert TOC field code
        toc_p = etree.Element(qn('w:p'))
        p_elem.addnext(toc_p)
        
        backslash = chr(92)
        instr = ' TOC ' + backslash + 'o "1-3" ' + backslash + 'h ' + backslash + 'z ' + backslash + 'u '
        fld = etree.SubElement(toc_p, qn('w:fldSimple'))
        fld.set(qn('w:instr'), instr)
        
        r = etree.SubElement(fld, qn('w:r'))
        t = etree.SubElement(r, qn('w:t'))
        t.text = '[Daftar Isi akan muncul setelah Update Field]'
        t.set(qn('xml:space'), 'preserve')
        
        print('TOC field code inserted')
        break

# Save to DIFFERENT filename
doc.save('LAPORAN_PKL_v11_Styles_AutoTOC.docx')
print('Saved as LAPORAN_PKL_v11_Styles_AutoTOC.docx')
