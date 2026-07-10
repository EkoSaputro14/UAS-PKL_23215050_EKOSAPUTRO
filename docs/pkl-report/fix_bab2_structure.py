#!/usr/bin/env python3
"""
Fix BAB II.2.3 (Struktur Organisasi) and BAB II.2.4 (Job Deskripsi)
Based on actual research of Bank Mandiri KCP organizational structure.
"""

from docx import Document
from docx.oxml.ns import qn
from lxml import etree
import re

INPUT = 'LAPORAN_PKL_v13_Roman.docx'
OUTPUT = 'LAPORAN_PKL_v13_Roman.docx'

doc = Document(INPUT)
body = doc.element.body

# Find the paragraphs for 2.3 and 2.4 content
# We need to find the Heading2 paragraphs and replace the content after them

# Strategy: Find the content paragraphs after "2.3 Struktur Organisasi" and "2.4 Job Deskripsi"
# and replace them

changes_made = 0

# Find all paragraphs
all_paras = []
for child in body:
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        pPr = child.find(qn('w:pPr'))
        style = ''
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None:
                style = pStyle.get(qn('w:val'), '')
        all_paras.append((child, text, style))

# Find indices of key paragraphs
idx_2_3_heading = None
idx_2_3_content = None
idx_2_4_heading = None
idx_2_4_content = None
idx_bab3 = None

for i, (para, text, style) in enumerate(all_paras):
    if style == 'Heading2' and '2.3' in text and 'Struktur Organisasi' in text:
        idx_2_3_heading = i
    elif style == 'Heading2' and '2.4' in text and 'Job Desk' in text:
        idx_2_4_heading = i
    elif style == 'Heading1' and 'BAB III' in text:
        idx_bab3 = i

print(f"Found 2.3 heading at index: {idx_2_3_heading}")
print(f"Found 2.4 heading at index: {idx_2_4_heading}")
print(f"Found BAB III at index: {idx_bab3}")

if idx_2_3_heading is None or idx_2_4_heading is None:
    print("ERROR: Could not find heading indices!")
    exit(1)

# Content of 2.3 is between idx_2_3_heading+1 and idx_2_4_heading-1
# Content of 2.4 is between idx_2_4_heading+1 and idx_bab3-1

# We need to replace the TEXT of the content paragraphs, not the paragraphs themselves
# because changing structure is complex

# ===== FIX 2.3: Struktur Organisasi =====
# Find the content paragraph after 2.3 heading
for i in range(idx_2_3_heading + 1, idx_2_4_heading):
    para, text, style = all_paras[i]
    if text and style != 'Heading2':
        # This is the content paragraph for 2.3
        # Replace the text in runs
        new_text = (
            "Struktur organisasi Bank Mandiri KCP Tegal Sudirman mengikuti pola organisasi "
            "garis staf yang berlaku di seluruh jaringan Kantor Cabang Pembantu (KCP) PT Bank "
            "Mandiri (Persero) Tbk. Berdasarkan struktur organisasi yang berlaku, KCP dipimpin "
            "oleh Kepala Cabang Pembantu (Branch Manager) yang bertanggung jawab penuh atas "
            "seluruh kegiatan operasional dan pencapaian target bisnis. Di bawah Kepala Cabang "
            "Pembantu, terdapat beberapa unit kerja utama, yaitu:\n\n"
            "1. Branch Operation Manager (BOM) — Bertanggung jawab terhadap kegiatan operasional "
            "harian meliputi pengawasan Customer Service, Teller, dan Security. Melakukan "
            "pemeriksaan laporan aktivitas harian, pembukaan rekening, pelaporan BI, verifikasi "
            "nasabah, dan pengelolaan likuiditas kas cabang.\n\n"
            "2. Customer Service (CS) — Memberikan pelayanan kepada nasabah meliputi pembukaan "
            "rekening, pendaftaran fasilitas perbankan (internet banking, SMS banking, kartu ATM), "
            "penanganan komplain nasabah, serta penyebarluasan informasi produk perbankan.\n\n"
            "3. Teller — Melakukan transaksi penerimaan setoran dan pembayaran dari/to nasabah, "
            "membuat register kas teller, serta memastikan kelengkapan bukti-bukti kas tunai.\n\n"
            "4. Micro Banking Manager (MBM) — Mengelola segmen bisnis mikro dan UMKM, meliputi "
            "analisis kredit, monitoring nasabah, serta pengembangan strategi bisnis mikro.\n\n"
            "5. Account Officer (AO) — Bertugas melakukan marketing produk perbankan, menjalin "
            "hubungan dengan nasabah, serta mengelola portofolio kredit.\n\n"
            "6. Bagian Kredit dan Lelang — Menangani proses pencairan kredit, admin kredit, "
            "pengelolaan jaminan, serta pelaksanaan lelang aset jaminan kredit bermasalah. "
            "Bagian ini juga berkoordinasi dengan Special Asset Management (SAM) di tingkat "
            "kantor wilayah untuk penanganan Non-Performing Loan (NPL).\n\n"
            "7. Bagian Administrasi — Mengelola pencatatan harian, penyusunan laporan keuangan, "
            "pengelolaan arsip, serta koordinasi administrasi umum cabang.\n\n"
            "8. Security — Menjamin keamanan kantor cabang dan nasabah selama jam operasional.\n\n"
            "Setiap unit kerja tersebut saling berkoordinasi untuk memastikan kegiatan operasional "
            "perbankan berjalan lancar, efisien, dan sesuai dengan standar operasional yang "
            "ditetapkan oleh PT Bank Mandiri (Persero) Tbk."
        )
        
        # Clear existing runs and set new text
        for run_elem in para.iter(qn('w:r')):
            t = run_elem.find(qn('w:t'))
            if t is not None:
                t.text = ''
        
        # Set the first run's text
        runs = list(para.iter(qn('w:r')))
        if runs:
            t = runs[0].find(qn('w:t'))
            if t is not None:
                t.text = new_text
                t.set(qn('xml:space'), 'preserve')
        
        changes_made += 1
        print(f"  ✅ Updated 2.3 Struktur Organisasi content")
        break

# ===== FIX 2.4: Job Deskripsi =====
# Find the content paragraph after 2.4 heading
for i in range(idx_2_4_heading + 1, idx_bab3):
    para, text, style = all_paras[i]
    if text and style != 'Heading2':
        # This is the content paragraph for 2.4
        new_text = (
            "Selama melaksanakan Praktik Kerja Lapangan di Bank Mandiri KCP Tegal Sudirman, "
            "penulis ditempatkan pada Bagian Kredit dan Lelang dengan job deskripsi sebagai "
            "berikut:\n\n"
            "1. Input data PPAT (Pejabat Pembuat Akta Tanah) dan pembuatan SKPT (Surat "
            "Keterangan Pendaftaran Tanah) untuk keperluan lelang property.\n\n"
            "2. Pelaksanaan dan pengelolaan lelang property, mulai dari persiapan dokumen, "
            "koordinasi dengan pelelang resmi, hingga penyerahan risalah lelang kepada pemenang "
            "lelang.\n\n"
            "3. Pemasangan banner lelang di lokasi property yang akan dilelang sesuai ketentuan "
            "peraturan perundang-undangan yang berlaku.\n\n"
            "4. Validasi pajak PPH (Pajak Penghasilan) terkait transaksi lelang di Kantor Pajak "
            "Pratama Tegal.\n\n"
            "5. Pengembangan prototipe sistem chatbot AI (Mimotes) sebagai capstone project untuk "
            "mendukung optimalisasi layanan pelanggan melalui pemanfaatan teknologi kecerdasan "
            "buatan.\n\n"
            "Logbook kegiatan harian selama PKL ditampilkan pada Lampiran A (Tabel 4.3)."
        )
        
        # Clear existing runs and set new text
        for run_elem in para.iter(qn('w:r')):
            t = run_elem.find(qn('w:t'))
            if t is not None:
                t.text = ''
        
        # Set the first run's text
        runs = list(para.iter(qn('w:r')))
        if runs:
            t = runs[0].find(qn('w:t'))
            if t is not None:
                t.text = new_text
                t.set(qn('xml:space'), 'preserve')
        
        changes_made += 1
        print(f"  ✅ Updated 2.4 Job Deskripsi content")
        break

print(f"\nTotal changes: {changes_made}")

doc.save(OUTPUT)
print(f"💾 Saved: {OUTPUT}")

# Verify
doc2 = Document(OUTPUT)
body2 = doc2.element.body
for child in body2:
    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter(qn('w:t'))).strip()
        pPr = child.find(qn('w:pPr'))
        style = ''
        if pPr is not None:
            pStyle = pPr.find(qn('w:pStyle'))
            if pStyle is not None:
                style = pStyle.get(qn('w:val'), '')
        
        if style == 'Heading2' and ('2.3' in text or '2.4' in text):
            print(f"\n=== [{style}] {text} ===")
        elif style == 'Heading1' and 'BAB III' in text:
            break
        elif text and style == '' and any(kw in text for kw in ['Struktur organisasi', 'Selama melaksanakan', 'Kepala Cabang Pembantu', 'Bagian Kredit']):
            print(f"  Preview: {text[:100]}...")
