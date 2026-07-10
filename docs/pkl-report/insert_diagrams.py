from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

doc = Document(r'C:\Users\SMANSA\mimotes\docs\pkl-report\LAPORAN_PKL_Eko_Saputro_23215050.docx')

diagrams = {
    '4.2.1 Use Case Diagram': ('usecase.png', 'Gambar 4.2 Use Case Diagram Sistem Mimotes AI'),
    '4.2.2 Entity Relationship Diagram': ('erd.png', 'Gambar 4.5 Entity Relationship Diagram'),
    '4.2.3 Arsitektur RAG Pipeline': ('rag-pipeline.png', 'Gambar 4.6 Arsitektur RAG Pipeline'),
    '4.2.4 Arsitektur CRM Pipeline': ('crm-pipeline.png', 'Gambar 4.7 Arsitektur CRM Pipeline'),
}

body = doc.element.body

# Build list of (paragraph_index, text) for all paragraphs
para_list = list(body.iterchildren(qn('w:p')))

for section_title, (filename, caption) in diagrams.items():
    # Find the paragraph containing the section title
    target_idx = None
    for i, p_elem in enumerate(para_list):
        text = ''.join(node.text for node in p_elem.iter() if node.text)
        if section_title in text:
            target_idx = i
            break
    
    if target_idx is None:
        print(f'NOT FOUND: {section_title}')
        continue
    
    # We need to insert AFTER this paragraph
    # Find the actual XML element
    target_p = para_list[target_idx]
    
    # Get the parent and find position
    parent = target_p.getparent()
    children = list(parent)
    pos = children.index(target_p)
    
    img_path = os.path.join(r'C:\Users\SMANSA\mimotes\docs\pkl-report\diagrams', filename)
    
    # Create new paragraph for image
    new_p = OxmlElement('w:p')
    new_pPr = OxmlElement('w:pPr')
    new_jc = OxmlElement('w:jc')
    new_jc.set(qn('w:val'), 'center')
    new_pPr.append(new_jc)
    new_p.append(new_pPr)
    
    # Add run with image
    new_r = OxmlElement('w:r')
    new_rPr = OxmlElement('w:rPr')
    new_r.append(new_rPr)
    
    if os.path.exists(img_path):
        # Add image
        from docx.image.image import Image
        img = Image(img_path)
        
        # Add inline element
       Drawing = OxmlElement('w:drawing')
        inline = OxmlElement('wp:inline')
        extent = OxmlElement('wp:extent')
        extent.set(qn('cx'), str(int(14 * 914400 / 2.54)))  # 14cm in EMU
        extent.set(qn('cy'), str(int(10 * 914400 / 2.54)))  # 10cm in EMU
        inline.append(extent)
        
        docPr = OxmlElement('wp:docPr')
        docPr.set(qn('id'), str(target_idx * 10))
        docPr.set(qn('name'), filename)
        inline.append(docPr)
        
        graphic = OxmlElement('a:graphic')
        graphicData = OxmlElement('a:graphicData')
        pic = OxmlElement('pic:pic')
        
        picPr = OxmlElement('pic:picPr')
        pic.append(picPr)
        
        blipFill = OxmlElement('pic:blipFill')
        blip = OxmlElement('a:blip')
        blip.set(qn('r:embed'), 'rId' + str(target_idx * 10 + 100))
        blipFill.append(blip)
        pic.append(blipFill)
        
        spPr = OxmlElement('pic:spPr')
        xfrm = OxmlElement('a:xfrm')
        off = OxmlElement('a:off')
        off.set(qn('x'), '0')
        off.set(qn('y'), '0')
        xfrm.append(off)
        ext = OxmlElement('a:ext')
        ext.set(qn('cx'), str(int(14 * 914400 / 2.54)))
        ext.set(qn('cy'), str(int(10 * 914400 / 2.54)))
        xfrm.append(ext)
        spPr.append(xfrm)
        pic.append(spPr)
        
        graphicData.append(pic)
        graphic.append(graphicData)
        Drawing.append(inline)
        inline.append(graphic)
        
        new_r.append(Drawing)
        print(f'Found: {section_title} at pos {pos}')
    else:
        print(f'FILE NOT FOUND: {img_path}')
        continue
    
    new_p.append(new_r)
    parent.insert(pos + 1, new_p)
    
    # Add caption paragraph
    cap_p = OxmlElement('w:p')
    cap_pPr = OxmlElement('w:pPr')
    cap_jc = OxmlElement('w:jc')
    cap_jc.set(qn('w:val'), 'center')
    cap_pPr.append(cap_jc)
    cap_p.append(cap_pPr)
    
    cap_r = OxmlElement('w:r')
    cap_rPr = OxmlElement('w:rPr')
    cap_i = OxmlElement('w:i')
    cap_rPr.append(cap_i)
    cap_fs = OxmlElement('w:sz')
    cap_fs.set(qn('w:val'), '20')  # 10pt
    cap_rPr.append(cap_fs)
    cap_r.append(cap_rPr)
    cap_t = OxmlElement('w:t')
    cap_t.text = caption
    cap_r.append(cap_t)
    cap_p.append(cap_r)
    parent.insert(pos + 2, cap_p)

doc.save(r'C:\Users\SMANSA\mimotes\docs\pkl-report\LAPORAN_PKL_Eko_Saputro_23215050.docx')
print('Saved with diagrams')
