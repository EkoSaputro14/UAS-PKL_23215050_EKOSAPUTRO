from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.colors import black, HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image,
    Table, TableStyle, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# Register fonts
try:
    pdfmetrics.registerFont(TTFont('TimesNewRoman', r'C:\Windows\Fonts\times.ttf'))
    pdfmetrics.registerFont(TTFont('TimesNewRoman-Bold', r'C:\Windows\Fonts\timesbd.ttf'))
    pdfmetrics.registerFont(TTFont('TimesNewRoman-Italic', r'C:\Windows\Fonts\timesi.ttf'))
    pdfmetrics.registerFont(TTFont('TimesNewRoman-BoldItalic', r'C:\Windows\Fonts\timesbi.ttf'))
    pdfmetrics.registerFontFamily('TimesNewRoman',
        normal='TimesNewRoman',
        bold='TimesNewRoman-Bold',
        italic='TimesNewRoman-Italic',
        boldItalic='TimesNewRoman-BoldItalic'
    )
    FONT = 'TimesNewRoman'
    FONT_BOLD = 'TimesNewRoman-Bold'
    print('Times New Roman registered')
except:
    FONT = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'
    print('Using Helvetica fallback')

DIAG_DIR = r'C:\Users\SMANSA\mimotes\docs\pkl-report\diagrams'
OUTPUT = r'C:\Users\SMANSA\mimotes\docs\pkl-report\LAPORAN_PKL_Eko_Saputro_23215050.pdf'

# Page setup
PAGE_W, PAGE_H = A4
MARGIN_TOP = 4*cm
MARGIN_BOTTOM = 3*cm
MARGIN_LEFT = 4*cm
MARGIN_RIGHT = 3*cm

# Styles
styles = getSampleStyleSheet()

style_cover_title = ParagraphStyle(
    'CoverTitle', parent=styles['Normal'],
    fontName=FONT_BOLD, fontSize=16, alignment=TA_CENTER,
    spaceAfter=12, leading=24
)
style_cover_subtitle = ParagraphStyle(
    'CoverSubtitle', parent=styles['Normal'],
    fontName=FONT_BOLD, fontSize=13, alignment=TA_CENTER,
    spaceAfter=6, leading=20
)
style_cover_info = ParagraphStyle(
    'CoverInfo', parent=styles['Normal'],
    fontName=FONT, fontSize=12, alignment=TA_CENTER,
    spaceAfter=6, leading=18
)
style_bab_center = ParagraphStyle(
    'BabCenter', parent=styles['Normal'],
    fontName=FONT_BOLD, fontSize=14, alignment=TA_CENTER,
    spaceBefore=0, spaceAfter=6, leading=22
)
style_heading1 = ParagraphStyle(
    'Heading1Custom', parent=styles['Normal'],
    fontName=FONT_BOLD, fontSize=12, alignment=TA_LEFT,
    spaceBefore=18, spaceAfter=6, leading=18
)
style_heading2 = ParagraphStyle(
    'Heading2Custom', parent=styles['Normal'],
    fontName=FONT_BOLD, fontSize=12, alignment=TA_LEFT,
    spaceBefore=12, spaceAfter=6, leading=18
)
style_body = ParagraphStyle(
    'BodyCustom', parent=styles['Normal'],
    fontName=FONT, fontSize=12, alignment=TA_JUSTIFY,
    spaceBefore=0, spaceAfter=6, leading=24,
    firstLineIndent=1.25*cm
)
style_body_no_indent = ParagraphStyle(
    'BodyNoIndent', parent=style_body,
    firstLineIndent=0
)
style_bullet = ParagraphStyle(
    'BulletCustom', parent=style_body,
    firstLineIndent=0, leftIndent=1.5*cm, bulletIndent=0.75*cm
)
style_center = ParagraphStyle(
    'CenterCustom', parent=styles['Normal'],
    fontName=FONT, fontSize=12, alignment=TA_CENTER,
    spaceAfter=6, leading=18
)
style_right = ParagraphStyle(
    'RightCustom', parent=styles['Normal'],
    fontName=FONT, fontSize=12, alignment=TA_RIGHT,
    spaceAfter=6, leading=18
)
style_caption = ParagraphStyle(
    'CaptionCustom', parent=styles['Normal'],
    fontName=FONT, fontSize=10, alignment=TA_CENTER,
    spaceBefore=6, spaceAfter=12, leading=14, italic=1
)
style_toc = ParagraphStyle(
    'TOC', parent=styles['Normal'],
    fontName=FONT, fontSize=12, alignment=TA_LEFT,
    spaceBefore=2, spaceAfter=2, leading=22
)
style_toc_bold = ParagraphStyle(
    'TOCBold', parent=style_toc,
    fontName=FONT_BOLD
)
style_toc_sub = ParagraphStyle(
    'TOCSub', parent=style_toc,
    leftIndent=1*cm
)
style_table_header = ParagraphStyle(
    'TableHeader', parent=styles['Normal'],
    fontName=FONT_BOLD, fontSize=10, alignment=TA_CENTER,
    leading=14
)
style_table_cell = ParagraphStyle(
    'TableCell', parent=styles['Normal'],
    fontName=FONT, fontSize=10, alignment=TA_LEFT,
    leading=14
)
style_table_cell_center = ParagraphStyle(
    'TableCellCenter', parent=style_table_cell,
    alignment=TA_CENTER
)
style_ref = ParagraphStyle(
    'Reference', parent=style_body,
    firstLineIndent=0, leftIndent=1.25*cm, spaceAfter=3
)
style_footer = ParagraphStyle(
    'Footer', parent=styles['Normal'],
    fontName=FONT, fontSize=10, alignment=TA_CENTER
)

# Helper
def make_table(headers, rows, col_widths=None):
    data = [[Paragraph(h, style_table_header) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), style_table_cell) for c in row])
    
    if col_widths is None:
        available = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
        col_widths = [available / len(headers)] * len(headers)
    
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#E8D5C0')),
        ('GRID', (0, 0), (-1, -1), 0.5, black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t

def add_image(filename, caption):
    img_path = os.path.join(DIAG_DIR, filename)
    if os.path.exists(img_path):
        available_w = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
        available_h = 18*cm  # max height leaving room for caption
        img = Image(img_path)
        img_w, img_h = img.drawWidth, img.drawHeight
        ratio_w = available_w / img_w
        ratio_h = available_h / img_h
        ratio = min(ratio_w, ratio_h, 1.0)
        img.drawWidth = img_w * ratio
        img.drawHeight = img_h * ratio
        elements.append(Spacer(1, 12))
        elements.append(img)
        elements.append(Paragraph(caption, style_caption))
    else:
        elements.append(Paragraph(f'[DIAGRAM: {filename}]', style_center))

# Page number callback
def add_page_number(canvas, doc):
    page_num = canvas.getPageNumber()
    canvas.saveState()
    canvas.setFont(FONT, 10)
    if page_num <= 5:  # Roman numeral section
        # Simple page number (would need roman conversion for proper)
        canvas.drawCentredString(PAGE_W / 2, 1.5*cm, str(page_num))
    else:
        canvas.drawRightString(PAGE_W - MARGIN_RIGHT, PAGE_H - 2*cm, str(page_num))
    canvas.restoreState()

# Build document
doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
    leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT
)

elements = []

# ============================================================
# COVER
# ============================================================
elements.append(Spacer(1, 8*cm))
elements.append(Paragraph('LAPORAN PRAKTIK KERJA LAPANGAN', style_cover_title))
elements.append(Spacer(1, 1*cm))
elements.append(Paragraph(
    'RANCANG BANGUN SISTEM CHATBOT AI<br/>'
    'BERBASIS PENGETAHUAN DENGAN<br/>'
    'RETRIEVAL-AUGMENTED GENERATION<br/>'
    'DAN PIPELINE CRM UNTUK<br/>'
    'OPTIMALISASI LAYANAN PELANGGAN',
    style_cover_subtitle
))
elements.append(Spacer(1, 4*cm))
elements.append(Paragraph('Nama\t\t: Eko Saputro', style_cover_info))
elements.append(Paragraph('NIM\t\t: 23215050', style_cover_info))
elements.append(Paragraph('Kelas\t\t: 6A', style_cover_info))
elements.append(Spacer(1, 2*cm))
elements.append(Paragraph('PROGRAM STUDI S1 TEKNIK INFORMATIKA', style_cover_info))
elements.append(Paragraph('FAKULTAS SAINS &amp; TEKNOLOGI', style_cover_info))
elements.append(Paragraph('UNIVERSITAS HARKAT NEGERI', style_cover_info))
elements.append(Spacer(1, 1*cm))
elements.append(Paragraph('Tahun 2026', style_cover_info))
elements.append(PageBreak())

# ============================================================
# LEMBAR PENGESAHAN
# ============================================================
elements.append(Paragraph('LEMBAR PENGESAHAN', style_bab_center))
elements.append(Spacer(1, 1*cm))
elements.append(Paragraph('Laporan Praktik Kerja Lapangan (PKL) ini telah disetujui dan dipertanggungjawabkan oleh:', style_body_no_indent))
elements.append(Spacer(1, 1*cm))
elements.append(Paragraph('<b>Dosen Pembimbing:</b>', style_body_no_indent))
elements.append(Paragraph('Zaenul Arif, M.Kom.', style_body_no_indent))
elements.append(Spacer(1, 0.5*cm))
elements.append(Paragraph('<b>Pembimbing Lapangan:</b>', style_body_no_indent))
elements.append(Paragraph('Widianto Agung Nugroho', style_body_no_indent))
elements.append(Spacer(1, 0.5*cm))
elements.append(Paragraph('<b>Ketua Program Studi:</b>', style_body_no_indent))
elements.append(Paragraph('Aang Alim Murtopo, M.Kom.', style_body_no_indent))
elements.append(Paragraph('NIPY. 08.025.555', style_body_no_indent))
elements.append(Spacer(1, 4*cm))
elements.append(Paragraph('Tegal, 25 Juni 2026', style_right))
elements.append(Spacer(1, 3*cm))
elements.append(Paragraph('......................................', style_center))
elements.append(Paragraph('<b>Eko Saputro</b>', style_center))
elements.append(Paragraph('NIM. 23215050', style_center))
elements.append(PageBreak())

# ============================================================
# KATA PENGANTAR
# ============================================================
elements.append(Paragraph('KATA PENGANTAR', style_bab_center))
elements.append(Spacer(1, 1*cm))
elements.append(Paragraph('Puji syukur kehadirat Tuhan Yang Maha Esa atas rahmat dan karunia-Nya sehingga laporan Praktik Kerja Lapangan (PKL) Program Studi S1 Teknik Informatika Universitas Harkat Negeri ini dapat diselesaikan dengan baik.', style_body))
elements.append(Paragraph('Laporan ini disusun sebagai bentuk pertanggungjawaban akademik atas kegiatan Praktik Kerja Lapangan yang telah dilaksanakan di Bank Mandiri KCP Tegal Sudirman selama periode 25 Mei hingga 25 Juni 2026.', style_body))
elements.append(Paragraph('Penulis menyadari bahwa laporan ini tidak dapat diselesaikan tanpa bantuan dan dukungan dari berbagai pihak. Oleh karena itu, penulis mengucapkan terima kasih kepada:', style_body))

items = [
    'Bapak Zaenul Arif, M.Kom. selaku Dosen Pembimbing.',
    'Bapak Widianto Agung Nugroho selaku Pembimbing Lapangan.',
    'Bapak Aang Alim Murtopo, M.Kom. selaku Ketua Program Studi.',
    'Seluruh pihak yang telah membantu.',
]
for i, item in enumerate(items, 1):
    elements.append(Paragraph(f'{i}. {item}', style_bullet))

elements.append(Paragraph('Semoga laporan ini dapat memberikan manfaat bagi pembaca.', style_body))
elements.append(Spacer(1, 3*cm))
elements.append(Paragraph('Tegal, 25 Juni 2026', style_right))
elements.append(Spacer(1, 3*cm))
elements.append(Paragraph('......................................', style_center))
elements.append(Paragraph('<b>Penulis</b>', style_center))
elements.append(Paragraph('Eko Saputro', style_center))
elements.append(Paragraph('NIM. 23215050', style_center))
elements.append(PageBreak())

# ============================================================
# DAFTAR ISI
# ============================================================
elements.append(Paragraph('DAFTAR ISI', style_bab_center))
elements.append(Spacer(1, 1*cm))

toc = [
    ('BAB I PENDAHULUAN', 'style_toc_bold', ''),
    ('1.1 Latar Belakang', 'style_toc', '1'),
    ('1.2 Tujuan PKL', 'style_toc', '3'),
    ('1.2.1 Tujuan Umum', 'style_toc_sub', '3'),
    ('1.2.2 Tujuan Khusus', 'style_toc_sub', '3'),
    ('1.3 Manfaat PKL', 'style_toc', '4'),
    ('BAB II GAMBARAN UMUM INSTANSI', 'style_toc_bold', ''),
    ('2.1 Sejarah Perkembangan Perusahaan', 'style_toc', '5'),
    ('2.2 Visi, Misi, dan Tujuan', 'style_toc', '6'),
    ('2.3 Struktur Organisasi', 'style_toc', '7'),
    ('2.4 Job Deskripsi', 'style_toc', '8'),
    ('BAB III METODE PELAKSANAAN PKL', 'style_toc_bold', ''),
    ('3.1 Tugas Umum', 'style_toc', '10'),
    ('3.2 Tugas Khusus', 'style_toc', '11'),
    ('3.3 Analisis Permasalahan dan Solusi', 'style_toc', '13'),
    ('BAB IV HASIL YANG DICAPAI', 'style_toc_bold', ''),
    ('4.1 Gambaran Umum Sistem', 'style_toc', '16'),
    ('4.2 Analisis dan Perancangan Sistem', 'style_toc', '17'),
    ('4.3 Implementasi Sistem', 'style_toc', '28'),
    ('4.4 Pengujian Sistem', 'style_toc', '36'),
    ('BAB V PENUTUP', 'style_toc_bold', ''),
    ('5.1 Kesimpulan', 'style_toc', '40'),
    ('5.2 Saran', 'style_toc', '41'),
    ('DAFTAR PUSTAKA', 'style_toc_bold', '43'),
    ('LAMPIRAN', 'style_toc_bold', '46'),
]

for title, style_name, page in toc:
    s = globals()[style_name]
    if page:
        text = f'{title} {"." * (60 - len(title))} {page}'
    else:
        text = title
    elements.append(Paragraph(text, s))

elements.append(Spacer(1, 0.5*cm))
elements.append(Paragraph('<b>DAFTAR GAMBAR</b>', style_toc_bold))
figures = [
    ('Gambar 4.2 Use Case Diagram', '18'),
    ('Gambar 4.3 Activity Diagram Upload', '19'),
    ('Gambar 4.4 Activity Diagram Chat RAG', '20'),
    ('Gambar 4.5 Entity Relationship Diagram', '21'),
    ('Gambar 4.6 Arsitektur Sistem', '23'),
    ('Gambar 4.7 Arsitektur RAG Pipeline', '25'),
    ('Gambar 4.8 Arsitektur CRM Pipeline', '27'),
]
for fig, page in figures:
    text = f'{fig} {"." * (60 - len(fig))} {page}'
    elements.append(Paragraph(text, style_toc))

elements.append(PageBreak())

# ============================================================
# BAB I
# ============================================================
elements.append(Paragraph('BAB I', style_bab_center))
elements.append(Paragraph('PENDAHULUAN', style_bab_center))
elements.append(Spacer(1, 1*cm))

elements.append(Paragraph('<b>1.1 Latar Belakang</b>', style_heading1))
elements.append(Paragraph('Perkembangan teknologi kecerdasan buatan (Artificial Intelligence/AI) dalam beberapa tahun terakhir telah mengalami kemajuan yang sangat pesat, khususnya dalam bidang pemrosesan bahasa alami (Natural Language Processing/NLP). Salah satu bentuk penerapan AI yang paling banyak digunakan dalam dunia bisnis adalah chatbot, yaitu program komputer yang mampu melakukan percakapan dengan pengguna secara otomatis menggunakan bahasa manusia [1].', style_body))
elements.append(Paragraph('Dalam konteks layanan pelanggan (customer service), chatbot berbasis AI memiliki potensi besar untuk meningkatkan efisiensi dan kualitas layanan. Perusahaan dapat melayani pelanggan secara 24 jam tanpa henti, mengurangi waktu tunggu respons, dan menangani banyak permintaan secara bersamaan. Namun, chatbot konvensional memiliki keterbatasan dalam memahami konteks dan memberikan jawaban yang relevan [2].', style_body))
elements.append(Paragraph('Untuk mengatasi keterbatasan tersebut, diperlukan pendekatan Retrieval-Augmented Generation (RAG), yaitu teknik yang menggabungkan kemampuan Large Language Model (LLM) dengan mekanisme pencarian dari basis pengetahuan perusahaan [3].', style_body))
elements.append(Paragraph('Selain aspek layanan pelanggan, aspek Customer Relationship Management (CRM) juga memegang peranan penting. Integrasi antara chatbot AI dengan sistem CRM memungkinkan setiap interaksi pelanggan tercatat dan terkelola secara otomatis [4].', style_body))
elements.append(Paragraph('Berdasarkan latar belakang di atas, penulis mengembangkan Mimotes AI, yaitu sistem chatbot AI berbasis pengetahuan dengan RAG dan pipeline CRM untuk optimalisasi layanan pelanggan di Bank Mandiri KCP Tegal Sudirman.', style_body))

elements.append(Paragraph('<b>1.2 Tujuan PKL</b>', style_heading1))
elements.append(Paragraph('<b>1.2.1 Tujuan Umum</b>', style_heading2))
elements.append(Paragraph('Memberikan pengalaman kerja kepada mahasiswa dalam menerapkan teori perkuliahan dengan situasi nyata di bidang kecerdasan buatan, rekayasa perangkat lunak, dan basis data [5].', style_body))

elements.append(Paragraph('<b>1.2.2 Tujuan Khusus</b>', style_heading2))
for i, t in enumerate([
    'Merancang arsitektur sistem chatbot AI berbasis RAG.',
    'Mengimplementasikan pipeline RAG: document processing, chunking, embedding, vector storage, retrieval, dan generation.',
    'Mengembangkan pipeline CRM: manajemen leads, kontak, aktivitas, dan sales pipeline.',
    'Mengintegrasikan sistem dengan WhatsApp melalui protokol Baileys.',
    'Menguji kefektifan sistem melalui pengujian black box.',
], 1):
    elements.append(Paragraph(f'{i}. {t}', style_bullet))

elements.append(Paragraph('<b>1.3 Manfaat PKL</b>', style_heading1))
elements.append(Paragraph('<b>Bagi Universitas Harkat Negeri:</b> Menambah jaringan kerja sama dengan dunia industri.', style_body))
elements.append(Paragraph('<b>Bagi Program Studi:</b> Bahan masukan pengembangan kurikulum sesuai kebutuhan industri.', style_body))
elements.append(Paragraph('<b>Bagi Bank Mandiri KCP Tegal Sudirman:</b> Solusi sistem informasi berbasis AI untuk optimalisasi layanan pelanggan.', style_body))
elements.append(Paragraph('<b>Bagi Penulis:</b> Pengalaman kerja nyata dalam pengembangan sistem AI dan CRM.', style_body))
elements.append(PageBreak())

# ============================================================
# BAB II
# ============================================================
elements.append(Paragraph('BAB II', style_bab_center))
elements.append(Paragraph('GAMBARAN UMUM INSTANSI', style_bab_center))
elements.append(Spacer(1, 1*cm))

elements.append(Paragraph('<b>2.1 Sejarah Perkembangan Perusahaan</b>', style_heading1))
elements.append(Paragraph('Bank Mandiri KCP Tegal Sudirman merupakan Kantor Cabang Pembantu dari PT Bank Mandiri (Persero) Tbk yang terletak di Jalan Sudirman, Tegal. Bank Mandiri didirikan pada 2 Oktober 1998 dari penggabungan empat bank pemerintah: Bank Bumi Daya, Bank Dagang Negara, Bank Exim, dan Bapindo.', style_body))
elements.append(Paragraph('KCP Tegal Sudirman melayani produk perbankan meliputi simpanan pinjaman, layanan transaksi, pengelolaan aset, serta layanan lelang property. Seiring perkembangan teknologi digital, kantor ini terus berupaya meningkatkan kualitas layanan nasabah.', style_body))

elements.append(Paragraph('<b>2.2 Visi, Misi, dan Tujuan</b>', style_heading1))
elements.append(Paragraph('<b>Visi:</b> Menjadi bank terbaik yang mengedepankan kepuasan nasabah melalui layanan perbankan digital yang inovatif dan terpercaya.', style_body))
elements.append(Paragraph('<b>Misi:</b>', style_body_no_indent))
for i, m in enumerate([
    'Memberikan layanan perbankan digital yang inovatif dan terpercaya.',
    'Mengoptimalkan layanan pelanggan melalui pemanfaatan teknologi informasi.',
    'Mengelola data nasabah secara terstruktur dan efisien.',
], 1):
    elements.append(Paragraph(f'{i}. {m}', style_bullet))

elements.append(Paragraph('<b>2.3 Struktur Organisasi</b>', style_heading1))
elements.append(Paragraph('Struktur organisasi Bank Mandiri KCP Tegal Sudirman terdiri dari Kepala Cabang Pembantu, Bagian Customer Service, Bagian Teller, Bagian Administrasi, serta Bagian Teknologi Informasi.', style_body))

elements.append(Paragraph('<b>2.4 Job Deskripsi</b>', style_heading1))
elements.append(Paragraph('Selama PKL, penulis ditempatkan pada Divisi Teknologi Informasi dengan job deskripsi:', style_body))
for i, j in enumerate([
    'Input data PPAT dan pembuatan SKPT untuk lelang property.',
    'Validasi pajak PPH di Kantor Pajak Pratama Tegal.',
    'Pelaksanaan dan pengelolaan lelang property.',
    'Pengembangan sistem chatbot AI (Mimotes) sebagai capstone project.',
    'Pemasangan banner lelang dan penyerahan risalah lelang.',
], 1):
    elements.append(Paragraph(f'{i}. {j}', style_bullet))
elements.append(PageBreak())

# ============================================================
# BAB III
# ============================================================
elements.append(Paragraph('BAB III', style_bab_center))
elements.append(Paragraph('METODE PELAKSANAAN PKL', style_bab_center))
elements.append(Spacer(1, 1*cm))

elements.append(Paragraph('<b>3.1 Tugas Umum</b>', style_heading1))
elements.append(Paragraph('Selama PKL di Bank Mandiri KCP Tegal Sudirman, penulis menjalankan tugas umum meliputi input data PPAT, pembuatan SKPT, validasi pajak, pelaksanaan lelang, serta pengembangan aplikasi chatbot AI secara paralel melalui WFH dan WFA.', style_body))

elements.append(Paragraph('<b>3.2 Tugas Khusus</b>', style_heading1))
elements.append(Paragraph('<b>3.2.1 Analisis Kebutuhan Sistem</b>', style_heading2))
elements.append(Paragraph('Penulis mengidentifikasi permasalahan utama: volume interaksi nasabah yang tinggi, pengetahuan tersebar dalam berbagai dokumen, tidak adanya integrasi CRM, serta keterbatasan akses multi-platform.', style_body))

elements.append(Paragraph('<b>3.2.2 Perancangan Arsitektur Sistem</b>', style_heading2))
elements.append(Paragraph('Arsitektur Mimotes AI terdiri dari: Frontend Layer (Next.js 16 + React 19 + Tailwind CSS), API Layer (108 routes), Data Layer (PostgreSQL 16 + pgvector), RAG Pipeline, dan Microservices (Baileys WhatsApp, PaddleOCR, n8n).', style_body))

elements.append(Paragraph('<b>3.3 Analisis Permasalahan dan Solusi</b>', style_heading1))
elements.append(Paragraph('<b>Akurasi Respons Chatbot:</b> Solusi RAG menggabungkan LLM dengan pencarian semantik dari knowledge base perusahaan.', style_body))
elements.append(Paragraph('<b>Pengelolaan Pelanggan:</b> Pipeline CRM terintegrasi dengan pendekatan conversation-centric CRM.', style_body))
elements.append(Paragraph('<b>Isolasi Data Multi-Tenant:</b> Workspace-based isolation dengan PostgreSQL Row Level Security (RLS).', style_body))
elements.append(Paragraph('<b>Ekstraksi Teks dari Gambar:</b> Integrasi PaddleOCR dan Gemini Vision untuk OCR dan captioning.', style_body))
elements.append(PageBreak())

# ============================================================
# BAB IV
# ============================================================
elements.append(Paragraph('BAB IV', style_bab_center))
elements.append(Paragraph('HASIL YANG DICAPAI', style_bab_center))
elements.append(Spacer(1, 1*cm))

elements.append(Paragraph('<b>4.1 Gambaran Umum Sistem</b>', style_heading1))
elements.append(Paragraph('Mimotes AI di-deploy menggunakan Docker Compose dengan lima service: PostgreSQL (5432), Next.js App (3100), PaddleOCR (8090), Baileys WhatsApp (3002), dan Database Migration.', style_body))

elements.append(Paragraph('<b>4.2 Analisis dan Perancangan Sistem</b>', style_heading1))

elements.append(Paragraph('<b>4.2.1 Use Case Diagram</b>', style_heading2))
elements.append(Paragraph('Sistem memiliki empat aktor: Admin/Workspace Owner, Editor, Viewer, dan Visitor/Pelanggan.', style_body))
add_image('usecase.png', 'Gambar 4.2 Use Case Diagram Sistem Mimotes AI')

elements.append(Paragraph('<b>4.2.2 Activity Diagram Upload Dokumen</b>', style_heading2))
elements.append(Paragraph('Proses upload: autentikasi, validasi file, simpan ke disk, buat record di DB, processing queue, lalu parsing, chunking, embedding, storage.', style_body))
add_image('activity-upload.png', 'Gambar 4.3 Activity Diagram Upload Dokumen')

elements.append(Paragraph('<b>4.2.3 Activity Diagram Proses Chat RAG</b>', style_heading2))
elements.append(Paragraph('Proses chat: user kirim pesan, generate query embedding, hybrid search, confidence classification, build context, system prompt, LLM generate streaming response, simpan ke DB.', style_body))
add_image('activity-chat.png', 'Gambar 4.4 Activity Diagram Proses Chat RAG')

elements.append(Paragraph('<b>4.2.4 Entity Relationship Diagram</b>', style_heading2))
elements.append(Paragraph('28 model database dalam enam domain: Tenant &amp; Identity, Document &amp; RAG Pipeline, Conversational AI, CRM &amp; Lead Pipeline, Subscription &amp; Billing, Configuration &amp; Observability.', style_body))
add_image('erd.png', 'Gambar 4.5 Entity Relationship Diagram')

elements.append(Paragraph('<b>4.2.5 Arsitektur Sistem</b>', style_heading2))
elements.append(Paragraph('Enam layer: Frontend, API Layer, RAG Pipeline, Data Layer, Microservices, External Services.', style_body))
add_image('architecture.png', 'Gambar 4.6 Arsitektur Sistem Mimotes AI')

elements.append(Paragraph('<b>4.2.6 Arsitektur RAG Pipeline</b>', style_heading2))
elements.append(Paragraph('Pipeline: Document Ingestion, Embedding Generation, Vector Storage (pgvector), Retrieval (Hybrid Search + RRF), Response Generation (LLM).', style_body))
add_image('rag-pipeline.png', 'Gambar 4.7 Arsitektur RAG Pipeline')

elements.append(Paragraph('<b>4.2.7 Arsitektur CRM Pipeline</b>', style_heading2))
elements.append(Paragraph('Pipeline: Lead Capture, AI Analysis, Lead Scoring, Lead Status Tracking, Follow-up Automation.', style_body))
add_image('crm-pipeline.png', 'Gambar 4.8 Arsitektur CRM Pipeline')

elements.append(Paragraph('<b>4.3 Implementasi Sistem</b>', style_heading1))

elements.append(Paragraph('<b>4.3.1 Spesifikasi Perangkat Keras dan Lunak</b>', style_heading2))
available = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
elements.append(make_table(
    ['Komponen', 'Spesifikasi'],
    [
        ['Framework', 'Next.js 16.2.7 (App Router)'],
        ['Frontend', 'React 19, Tailwind CSS, Framer Motion'],
        ['Database', 'PostgreSQL 16 + pgvector'],
        ['ORM', 'Prisma 6.19.3'],
        ['AI Provider', 'Mimo Pro, OpenAI, Google Gemini'],
        ['OCR', 'PaddleOCR + Gemini Vision'],
        ['WhatsApp', 'Baileys 6.7.23'],
        ['Container', 'Docker Compose'],
        ['Testing', 'Vitest'],
    ],
    col_widths=[available*0.35, available*0.65]
))

elements.append(Paragraph('<b>4.3.2 Implementasi RAG Pipeline</b>', style_heading2))
elements.append(Paragraph('<b>Document Parsing:</b> PDF, DOCX, TXT, CSV, XLSX, gambar (PaddleOCR + Gemini Vision), URL.', style_body))
elements.append(Paragraph('<b>Chunking:</b> Recursive paragraph-then-sentence, 500 chars, 50 word overlap, max 1000 chunks/doc.', style_body))
elements.append(Paragraph('<b>Embedding:</b> OpenAI text-embedding-3-small (1536 dim) atau Feature Hashing lokal (fallback gratis).', style_body))
elements.append(Paragraph('<b>Vector Storage:</b> pgvector PostgreSQL, vector(1536), batch 50/txn, RLS.', style_body))
elements.append(Paragraph('<b>Retrieval:</b> Hybrid Search (Vector 0.6 + BM25 0.4 dengan RRF).', style_body))
elements.append(Paragraph('<b>Generation:</b> LLM OpenAI-compatible, temperature 0.3, max_tokens 1000, streaming.', style_body))

elements.append(Paragraph('<b>4.3.3 Implementasi Frontend</b>', style_heading2))
elements.append(Paragraph('53 halaman: dashboard, chat, knowledge management, CRM, analytics, settings, widget, admin, WhatsApp.', style_body))

elements.append(Paragraph('<b>4.3.4 Implementasi Backend</b>', style_heading2))
elements.append(Paragraph('108 API routes: Auth, Admin, AI, Analytics, Chat, Documents, Knowledge/RAG, Leads/CRM, WhatsApp, Widget, Billing, Workspace.', style_body))

elements.append(Paragraph('<b>4.4 Pengujian Sistem</b>', style_heading1))
elements.append(Paragraph('Hasil pengujian black box:', style_body_no_indent))
elements.append(make_table(
    ['No', 'Fitur', 'Input', 'Expected', 'Status'],
    [
        ['1', 'Login', 'Email+pass valid', 'Redirect dashboard', 'Lulus'],
        ['2', 'Login', 'Email+pass invalid', 'Pesan error', 'Lulus'],
        ['3', 'Upload', 'File PDF <10MB', 'processing->ready', 'Lulus'],
        ['4', 'Chat RAG', 'Pertanyaan dokumen', 'Jawaban+sumber', 'Lulus'],
        ['5', 'Chat RAG', 'Di luar konteks', 'Penolakan', 'Lulus'],
        ['6', 'Lead', 'Isi form', 'Lead tersimpan', 'Lulus'],
        ['7', 'WhatsApp', 'Pesan masuk', 'Auto-reply', 'Lulus'],
        ['8', 'Settings', 'Ubah provider', 'Tersimpan', 'Lulus'],
        ['9', 'RBAC', 'Viewer upload', 'Access denied', 'Lulus'],
    ],
    col_widths=[available*0.08, available*0.15, available*0.25, available*0.30, available*0.22]
))
elements.append(PageBreak())

# ============================================================
# BAB V
# ============================================================
elements.append(Paragraph('BAB V', style_bab_center))
elements.append(Paragraph('PENUTUP', style_bab_center))
elements.append(Spacer(1, 1*cm))

elements.append(Paragraph('<b>5.1 Kesimpulan</b>', style_heading1))
for i, k in enumerate([
    'Sistem Mimotes AI berhasil dirancang dan diimplementasikan sebagai chatbot AI berbasis RAG dengan pipeline CRM.',
    'Pipeline RAG berfungsi: document processing, chunking, embedding, vector storage, retrieval, hingga generasi respons.',
    'Pipeline CRM terintegrasi: setiap interaksi pelanggan tercatat dan terkelola otomatis.',
    'Integrasi WhatsApp memungkinkan pelanggan berinteraksi melalui platform pesan instan populer.',
    'Pengujian black box menunjukkan seluruh fitur berfungsi sesuai kebutuhan.',
], 1):
    elements.append(Paragraph(f'{i}. {k}', style_bullet))

elements.append(Paragraph('<b>5.2 Saran</b>', style_heading1))
elements.append(Paragraph('<b>Bagi Bank Mandiri:</b> Sistem perlu dipelihara dan dievaluasi berkala. Pertimbangkan integrasi dengan email dan media sosial.', style_body))
elements.append(Paragraph('<b>Bagi Prodi:</b> Kurikulum dapat diperkaya dengan materi NLP dan RAG. PKL Capstone Project menjadi model pembelajaran efektif.', style_body))
elements.append(Paragraph('<b>Bagi Penulis:</b> Dapat dikembangkan sebagai topik Skripsi dengan evaluasi kualitas RAG menggunakan ROUGE/BLEU.', style_body))
elements.append(PageBreak())

# ============================================================
# DAFTAR PUSTAKA
# ============================================================
elements.append(Paragraph('DAFTAR PUSTAKA', style_bab_center))
elements.append(Spacer(1, 1*cm))

refs = [
    '[1] H. Susanto et al., "Pemanfaatan Chatbot Berbasis AI untuk Optimalisasi Layanan Pelanggan," Jurnal Sistem Informasi, vol. 19, no. 2, pp. 45-62, 2023.',
    '[2] T. Brown et al., "Language Models are Few-Shot Learners," NeurIPS, vol. 33, pp. 1877-1901, 2020.',
    '[3] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS, vol. 33, pp. 9459-9474, 2020.',
    '[4] F. Buttle dan S. Maklan, Customer Relationship Management, 4th ed. London: Routledge, 2019.',
    '[5] Universitas Harkat Negeri, Buku Panduan PKL Prodi S1 Teknik Informatika. Tegal, 2026.',
    '[6] V. Lopez et al., "A Survey on Transfer Learning in NLP," AI Review, vol. 53, pp. 2339-2367, 2020.',
    '[7] Y. Gao et al., "RAG for LLMs: A Survey," arXiv:2312.10997, 2024.',
    '[8] A. Vaswani et al., "Attention Is All You Need," NeurIPS, vol. 30, pp. 5998-6008, 2017.',
    '[9] J. Devlin et al., "BERT," NAACL-HLT, pp. 4171-4186, 2019.',
    '[10] Qdrant, "Vector Database for AI," 2024. https://qdrant.tech/',
    '[11] Next.js, "The React Framework," 2024. https://nextjs.org/',
    '[12] Prisma, "Next-gen ORM," 2024. https://www.prisma.io/',
    '[13] Baileys, "WhatsApp Web API," 2024. https://github.com/WhiskeySockets/Baileys',
    '[14] pgvector, "Vector similarity search for Postgres," 2024. https://github.com/pgvector/pgvector',
    '[15] OpenAI, "Embeddings API," 2024. https://platform.openai.com/docs/guides/embeddings',
]
for ref in refs:
    elements.append(Paragraph(ref, style_ref))
elements.append(PageBreak())

# ============================================================
# LAMPIRAN
# ============================================================
elements.append(Paragraph('LAMPIRAN', style_bab_center))
elements.append(Spacer(1, 1*cm))

elements.append(Paragraph('<b>Lampiran A: Logbook Kegiatan Harian</b>', style_heading1))

log_data = [
    ('No', 'Tanggal', 'Jam', 'Aktivitas', 'Lokasi'),
    ('1', '25/05', '09:10-15:30', 'Input Akun Lelang, Validasi Pajak', 'Bank Mandiri'),
    ('2', '26/05', '09:10-15:02', 'Pelaksanaan Lelang', 'Bank Mandiri'),
    ('3', '27/05', '09:11-15:30', 'WFH Pembuatan Aplikasi', 'WFH'),
    ('4', '28/05', '09:10-15:30', 'Melanjutkan Pembuatan Aplikasi', 'WFH'),
    ('5', '29/05', '09:00-14:11', 'Input Pendataan SSPD BPHTB', 'Bank Mandiri'),
    ('6', '01/06', '09:38-22:17', 'WFH Developing Aplikasi', 'WFH'),
    ('7', '02/06', '09:10-14:58', 'Penyerahan Risalah Lelang', 'Bank Mandiri'),
    ('8', '03/06', '09:10-17:28', 'Pembuatan Surat Pendaftaran Tanah', 'WFA'),
    ('9', '04/06', '09:10-16:28', 'Input PPAT ke Sistem INTAN', 'Bank Mandiri'),
    ('10', '05/06', '08:48-15:39', 'Input Data PPAT SKPT', 'Bank Mandiri'),
    ('11', '08/06', '08:30-16:13', 'Input PPATK + Banner Lelang', 'Bank Mandiri'),
    ('12', '09/06', '08:46-16:41', 'Pembuatan SKPT + Banner', 'Bank Mandiri'),
    ('13', '10/06', '09:22-16:20', 'Input Data PPAT untuk SKPT', 'Bank Mandiri'),
    ('14', '11/06', '08:30-17:40', 'Input PPAT + SKPT + Banner', 'Bank Mandiri'),
    ('15', '12/06', '08:45-15:58', 'Input Data PPAT untuk SKPT', 'Bank Mandiri'),
    ('16', '15/06', '08:36-16:32', 'Input Data PPAT + SKPT', 'Bank Mandiri'),
    ('17', '16/06', '09:20-16:55', 'WFA Pembuatan Aplikasi', 'WFA'),
    ('18', '17/06', '08:54-16:34', 'Input PPAT Membuat SKPT', 'Bank Mandiri'),
    ('19', '18/06', '08:38-16:30', 'Input Data PPAT untuk SKPT', 'WFA'),
    ('20', '19/06', '08:45-15:55', 'Input Data PPAT untuk SKPT', 'Bank Mandiri'),
    ('21', '22/06', '08:47-16:50', 'Input PPAT', 'Bank Mandiri'),
    ('22', '23/06', '08:35-15:02', 'SKPT + Kunjungi Lokasi Lelang', 'Bank Mandiri'),
    ('23', '24/06', '10:52-16:21', 'WFH Pembuatan Aplikasi', 'WFH'),
    ('24', '25/06', '08:35-15:56', 'Input Data PPAT', 'Bank Mandiri'),
]
elements.append(make_table(
    log_data[0], log_data[1:],
    col_widths=[available*0.06, available*0.10, available*0.16, available*0.45, available*0.23]
))
elements.append(Spacer(1, 0.5*cm))
elements.append(Paragraph('<b>Pembimbing Lapangan: Widianto Agung Nugroho</b>', style_body_no_indent))

elements.append(Paragraph('<b>Lampiran B: GitHub Repository</b>', style_heading1))
elements.append(Paragraph('Repository: https://github.com/EkoSaputro14/mimotes.git', style_body_no_indent))
elements.append(Paragraph('Branch: semi-final', style_body_no_indent))

# ============================================================
# BUILD
# ============================================================
doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
print(f'=== PDF Generated ===')
print(f'Saved: {OUTPUT}')
