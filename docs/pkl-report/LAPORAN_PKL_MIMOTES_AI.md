# LAPORAN PRAKTIK KERJA LAPANGAN

## RANCANG BANGUN SISTEM CHATBOT AI BERBASIS PENGETAHUAN DENGAN RETRIEVAL-AUGMENTED GENERATION DAN PIPELINE CRM UNTUK OPTIMALISASI LAYANAN PELANGGAN

---

**Nama Mahasiswa**: Eko Saputro
**NIM**: 23215050

**Program Studi S1 Teknik Informatika**
**Fakultas Sains & Teknologi**
**Universitas Harkat Negeri**

**Tahun 2026**

---

## LEMBAR PENGESAHAN

Laporan Praktik Kerja Lapangan (PKL) ini telah disetujui dan dipertanggungjawabkan oleh:

| | | |
|---|---|---|
| Dosen Pembimbing | | |
| | | Zaenul Arif, M.Kom. |
| | | NIP/NIDN: ............... |
| | | |
| Pembimbing Lapangan | | |
| | | Widianto Agung Nugroho |
| | | Jabatan: Pembimbing Lapangan... |
| | | |
| Ketua Program Studi | | |
| | | Aang Alim Murtopo, M.Kom. |
| | | NIPY. 08.025.555 |

Tegal, .................. 2026

---

## KATA PENGANTAR

Puji syukur kehadirat Tuhan Yang Maha Esa atas rahmat dan karunia-Nya sehingga laporan Praktik Kerja Lapangan (PKL) Program Studi S1 Teknik Informatika Universitas Harkat Negeri ini dapat diselesaikan dengan baik.

Laporan ini disusun sebagai bentuk pertanggungjawaban akademik atas kegiatan Praktik Kerja Lapangan yang telah dilaksanakan. Kegiatan PKL merupakan salah satu mata kuliah wajib dengan bobot 3 SKS yang harus ditempuh oleh mahasiswa Program Studi S1 Teknik Informatika sebelum mengambil mata kuliah Skripsi/Tugas Akhir.

Selama melaksanakan PKL, penulis mendapatkan pengalaman berharga dalam menerapkan ilmu pengetahuan dan keterampilan yang diperoleh selama perkuliahan ke dalam dunia kerja nyata. Melalui kegiatan ini, penulis mampu mengidentifikasi permasalahan di tempat PKL serta merancang dan mengimplementasikan solusi berbasis keilmuan Teknik Informatika.

Penulis menyadari bahwa laporan ini tidak dapat diselesaikan tanpa bantuan dan dukungan dari berbagai pihak. Oleh karena itu, penulis mengucapkan terima kasih kepada:

1. Bapak/Ibu Dosen Pembimbing yang telah memberikan bimbingan dan arahan selama kegiatan PKL.
2. Bapak/Ibu Pembimbing Lapangan yang telah memberikan bimbingan dan pengalaman kerja di instansi.
3. Bapak/Ibu Ketua Program Studi S1 Teknik Informatika.
4. Seluruh pihak yang telah membantu dalam penyelesaian laporan ini.

Semoga laporan ini dapat memberikan manfaat bagi pembaca dan pengembangan ilmu pengetahuan di bidang Teknik Informatika.

Tegal, .................. 2026

Penulis

---

## DAFTAR ISI

| | Halaman |
|---|---|
| **BAB I PENDAHULUAN** | |
| 1.1 Latar Belakang | 1 |
| 1.2 Tujuan PKL | 3 |
| 1.2.1 Tujuan Umum | 3 |
| 1.2.2 Tujuan Khusus | 3 |
| 1.3 Manfaat PKL | 4 |
| **BAB II GAMBARAN UMUM INSTANSI** | |
| 2.1 Sejarah Perkembangan Perusahaan | 5 |
| 2.2 Visi, Misi, dan Tujuan | 6 |
| 2.3 Struktur Organisasi | 7 |
| 2.4 Job Deskripsi | 8 |
| **BAB III METODE PELAKSANAAN PKL** | |
| 3.1 Tugas Umum | 10 |
| 3.2 Tugas Khusus | 11 |
| 3.3 Analisis Permasalahan dan Solusi | 14 |
| **BAB IV HASIL YANG DICAPAI** | |
| 4.1 Gambaran Umum Sistem | 16 |
| 4.2 Analisis dan Perancangan Sistem | 18 |
| 4.3 Implementasi Sistem | 28 |
| 4.4 Pengujian Sistem | 45 |
| **BAB V PENUTUP** | |
| 5.1 Kesimpulan | 52 |
| 5.2 Saran | 53 |
| **DAFTAR PUSTAKA** | 54 |
| **LAMPIRAN** | 56 |

---

## DAFTAR GAMBAR

| | Gambar | Halaman |
|---|---|---|
| Gambar 2.1 | Struktur Organisasi Perusahaan | 7 |
| Gambar 3.1 | Alur Kerja Praktik Kerja Lapangan | 10 |
| Gambar 4.1 | Use Case Diagram Sistem | 18 |
| Gambar 4.2 | Activity Diagram Upload Dokumen | 20 |
| Gambar 4.3 | Activity Diagram Proses Chat | 21 |
| Gambar 4.4 | Entity Relationship Diagram | 22 |
| Gambar 4.5 | Arsitektur Sistem Mimotes AI | 25 |
| Gambar 4.6 | Arsitektur RAG Pipeline | 26 |
| Gambar 4.7 | Arsitektur CRM Pipeline | 27 |
| Gambar 4.8 | Tampilan Dashboard | 30 |
| Gambar 4.9 | Tampilan Halaman Chat | 32 |
| Gambar 4.10 | Tampilan Knowledge Management | 34 |
| Gambar 4.11 | Tampilan CRM / Leads | 36 |
| Gambar 4.12 | Tampilan Settings | 38 |
| Gambar 4.13 | Tampilan Login | 40 |

---

## DAFTAR TABEL

| | Tabel | Halaman |
|---|---|---|
| Tabel 4.1 | Spesifikasi Perangkat Keras | 28 |
| Tabel 4.2 | Spesifikasi Perangkat Lunak | 29 |
| Tabel 4.3 | Struktur Database Users | 33 |
| Tabel 4.4 | Struktur Database Documents | 33 |
| Tabel 4.5 | Struktur Database DocumentChunks | 33 |
| Tabel 4.6 | Struktur Database ChatSessions | 35 |
| Tabel 4.7 | Struktur Database ChatMessages | 35 |
| Tabel 4.8 | Struktur Database Leads | 37 |
| Tabel 4.9 | Struktur Database Contacts | 37 |
| Tabel 4.10 | Hasil Pengujian Black Box | 46 |
| Tabel 4.11 | Hasil Pengujian Respons Chat | 48 |
| Tabel 4.12 | Hasil Pengujian RAG Retrieval | 49 |

---

# BAB I
# PENDAHULUAN

## 1.1 Latar Belakang

Perkembangan teknologi kecerdasan buatan (Artificial Intelligence/AI) dalam beberapa tahun terakhir telah mengalami kemajuan yang sangat pesat, khususnya dalam bidang pemrosesan bahasa alami (Natural Language Processing/NLP). Salah satu bentuk penerapan AI yang paling banyak digunakan dalam dunia bisnis adalah chatbot, yaitu program komputer yang mampu melakukan percakapan dengan pengguna secara otomatis menggunakan bahasa manusia [1].

Dalam konteks layanan pelanggan (customer service), chatbot berbasis AI memiliki potensi besar untuk meningkatkan efisiensi dan kualitas layanan. Perusahaan dapat melayani pelanggan secara 24 jam tanpa henti, mengurangi waktu tunggu respons, dan menangani banyak permintaan secara bersamaan. Namun, chatbot konvensional yang hanya mengandalkan pola respons tetap (rule-based) memiliki keterbatasan dalam memahami konteks dan memberikan jawaban yang relevan terhadap pertanyaan spesifik yang berkaitan dengan pengetahuan internal perusahaan [2].

Untuk mengatasi keterbatasan tersebut, diperlukan pendekatan yang lebih canggih, yaitu Retrieval-Augmented Generation (RAG). RAG merupakan teknik yang menggabungkan kemampuan Large Language Model (LLM) dalam menghasilkan teks yang koheren dengan mekanisme pencarian dan pengambilan informasi (retrieval) dari basis pengetahuan (knowledge base) yang telah disiapkan. Dengan pendekatan ini, chatbot tidak hanya mengandalkan pengetahuan umum yang dimiliki oleh LLM, tetapi juga mampu mengambil informasi spesifik dari dokumen-dokumen internal perusahaan, sehingga jawaban yang dihasilkan lebih akurat dan kontekstual [3].

Selain aspek layanan pelanggan, aspek pengelolaan hubungan pelanggan (Customer Relationship Management/CRM) juga memegang peranan penting dalam kesuksesan suatu bisnis. CRM mencakup proses pengelolaan data pelanggan, pelacakan aktivitas penjualan, manajemen leads (calon pelanggan), serta analisis pola interaksi pelanggan. Integrasi antara chatbot AI dengan sistem CRM memungkinkan setiap interaksi pelanggan melalui chatbot tercatat dan terkelola secara otomatis, sehingga tim penjualan dan pemasaran dapat merespons dengan lebih tepat sasaran [4].

Berdasarkan latar belakang permasalahan di atas, penulis mengembangkan suatu sistem yang diberi nama Mimotes AI, yaitu sistem chatbot AI berbasis pengetahuan dengan arsitektur Retrieval-Augmented Generation dan pipeline CRM untuk optimalisasi layanan pelanggan. Sistem ini dirancang untuk mampu: (1) mengelola basis pengetahuan perusahaan melalui upload dan pemrosesan dokumen, (2) memberikan respons yang akurat dan kontekstual berbasis RAG, (3) mengelola data pelanggan dan aktivitas penjualan melalui pipeline CRM, serta (4) terintegrasi dengan platform pesan instan WhatsApp melalui protokol Baileys.

Sistem ini dikembangkan menggunakan teknologi modern meliputi Next.js sebagai framework full-stack, PostgreSQL dengan ekstensi pgvector sebagai basis data relasional dan vektor, Qdrant sebagai vector database untuk penyimpanan embedding, serta Baileys sebagai klien WhatsApp. Pengembangan sistem ini dilakukan dalam rangka Praktik Kerja Lapangan di Bank Mandiri KCP Tegal Sudirman, dengan tujuan untuk menerapkan ilmu pengetahuan dan keterampilan yang diperoleh selama perkuliahan Program Studi S1 Teknik Informatika Universitas Harkat Negeri ke dalam dunia kerja nyata.

## 1.2 Tujuan PKL

### 1.2.1 Tujuan Umum

Tujuan umum dari pelaksanaan Praktik Kerja Lapangan ini adalah untuk memberikan pengalaman kerja kepada mahasiswa dalam rangka menerapkan teori dan pengetahuan yang telah diterimanya di dalam perkuliahan dengan situasi nyata di tempat PKL sesuai dengan bidang kompetensi yang ada pada Program Studi S1 Teknik Informatika, khususnya dalam bidang kecerdasan buatan, rekayasa perangkat lunak, dan basis data [5].

### 1.2.2 Tujuan Khusus

Adapun tujuan khusus dari kegiatan PKL ini adalah:

1. **Merancang arsitektur sistem** chatbot AI berbasis RAG yang mampu mengelola basis pengetahuan dan memberikan respons kontekstual.
2. **Mengimplementasikan pipeline RAG** yang meliputi tahapan document processing, chunking, embedding, vector storage, retrieval, dan generation.
3. **Mengembangkan pipeline CRM** yang mencakup manajemen leads, kontak, aktivitas, dan sales pipeline.
4. **Mengintegrasikan sistem** dengan platform WhatsApp melalui protokol Baileys untuk komunikasi pelanggan secara langsung.
5. **Menguji kefektifan sistem** melalui pengujian black box dan evaluasi kualitas respons chatbot.

## 1.3 Manfaat PKL

Pelaksanaan Praktik Kerja Lapangan ini diharapkan dapat memberikan manfaat bagi berbagai pihak, antara lain:

### Manfaat bagi Universitas Harkat Negeri
Menambah jaringan kerja sama antara universitas dengan dunia industri, serta menjadi bukti kontribusi nyata program studi dalam pengembangan solusi teknologi informasi yang bermanfaat bagi masyarakat.

### Manfaat bagi Program Studi S1 Teknik Informatika
Menjadi bahan masukan untuk pengembangan kurikulum agar lebih sesuai dengan kebutuhan industri, khususnya dalam bidang kecerdasan buatan dan pengembangan perangkat lunak modern.

### Manfaat bagi Instansi/Mitra
Mendapatkan solusi sistem informasi berbasis AI yang dapat membantu optimalisasi layanan pelanggan dan pengelolaan data pelanggan secara terstruktur dan efisien.

### Manfaat bagi Mahasiswa (Penulis)
1. Memperoleh pengalaman kerja nyata dalam pengembangan sistem AI dan CRM.
2. Meningkatkan kemampuan analisis kebutuhan sistem, perancangan, implementasi, dan pengujian perangkat lunak.
3. Mengembangkan keterampilan profesional dalam manajemen proyek teknologi informasi.
4. Mendapatkan data dan pengalaman yang dapat dikembangkan lebih lanjut dalam Skripsi/Tugas Akhir.


# BAB II
# GAMBARAN UMUM INSTANSI

## 2.1 Sejarah Perkembangan Perusahaan

Bank Mandiri KCP Tegal Sudirman merupakan suatu perusahaan/instansi yang bergerak di bidang perbankan dan jasa keuangan. Perusahaan ini berdiri pada tahun 1998 dan telah berkembang menjadi salah satu pelaku bisnis di perbankan yang dipercaya oleh berbagai pihak.

Sejak awal berdirinya, Bank Mandiri KCP Tegal Sudirman telah berkomitmen untuk memberikan layanan terbaik kepada pelanggan melalui pemanfaatan teknologi informasi yang terkini. Perusahaan ini memulai kegiatannya dengan layanan perbankan retail dan bisnis, dan seiring berjalannya waktu, terus mengalami perkembangan dalam hal layanan, teknologi, serta jumlah pelanggan.

Dalam beberapa tahun terakhir, Bank Mandiri KCP Tegal Sudirman menyadari pentingnya transformasi digital untuk meningkatkan efisiensi operasional dan kualitas layanan pelanggan. Perkembangan jumlah pelanggan yang signifikan menuntut adanya sistem yang mampu menangani volume interaksi pelanggan yang tinggi secara simultan dan efektif. Kondisi inilah yang menjadi latar belakang pengembangan sistem Mimotes AI sebagai solusi chatbot berbasis kecerdasan buatan dengan integrasi CRM.

## 2.2 Visi, Misi, dan Tujuan

### Visi
Menjadi menjadi bank terbaik yang mengedepankan kepuasan nasabah yang unggul dalam pemanfaatan teknologi informasi untuk memberikan layanan terbaik kepada pelanggan.

### Misi
1. Memberikan layanan perbankan digital yang inovatif dan terpercaya
2. Mengoptimalkan layanan pelanggan melalui pemanfaatan teknologi informasi
3. Mengoptimalkan layanan pelanggan melalui pemanfaatan teknologi kecerdasan buatan.
4. Mengelola data dan interaksi pelanggan secara terstruktur dan efisien.

### Tujuan
1. Meningkatkan kualitas dan kecepatan layanan pelanggan.
2. Mengoptimalkan pengelolaan data pelanggan dan pipeline penjualan.
3. Memberikan pengalaman pelanggan yang lebih personal dan kontekstual.
4. Mendukung pengambilan keputusan bisnis berbasis data.

## 2.3 Struktur Organisasi

Struktur organisasi Bank Mandiri KCP Tegal Sudirman terdiri dari beberapa divisi utama yang saling berkoordinasi dalam menjalankan kegiatan operasional perusahaan. Berikut adalah gambaran struktur organisasi perusahaan:

**Gambar 2.1 Struktur Organisasi Perusahaan**

[PLACEHOLDER: Insert struktur organisasi diagram]

Secara umum, struktur organisasi perusahaan terdiri dari:

1. **Direktur** -- Pimpinan tertinggi yang bertanggung jawab atas seluruh kegiatan operasional dan strategis perusahaan.
2. **Divisi Teknologi Informasi** -- Bertanggung jawab atas pengembangan dan pemeliharaan sistem informasi, infrastruktur teknologi, serta inovasi digital.
3. **Divisi Bisnis dan Pemasaran** -- Mengelola strategi pemasaran, pengembangan bisnis, dan hubungan dengan pelanggan.
4. **Divisi Operasional** -- Menjalankan kegiatan operasional harian, termasuk layanan pelanggan dan dukungan teknis.
5. **Divisi Keuangan dan Administrasi** -- Mengelola aspek keuangan, akuntansi, dan administrasi perusahaan.

## 2.4 Job Deskripsi

Selama melaksanakan Praktik Kerja Lapangan di Bank Mandiri KCP Tegal Sudirman, penulis ditempatkan pada Divisi Teknologi Informasi dengan job deskripsi sebagai berikut:

1. **Analisis Kebutuhan Sistem**: Mengidentifikasi kebutuhan sistem chatbot AI dan CRM berdasarkan kondisi operasional perusahaan, termasuk wawancara dengan pemangku kepentingan (stakeholder) dan observasi proses bisnis yang berjalan.

2. **Perancangan Arsitektur Sistem**: Merancang arsitektur sistem Mimotes AI yang mencakup komponen RAG pipeline, CRM pipeline, database design, serta integrasi dengan platform pesan instan.

3. **Implementasi Backend**: Mengembangkan API routes dan layanan backend menggunakan Next.js, termasuk integrasi dengan LLM, vector database (Qdrant), dan PostgreSQL.

4. **Implementasi Frontend**: Mengembangkan antarmuka pengguna (user interface) yang responsif dan user-friendly untuk berbagai modul sistem, meliputi dashboard, chat, knowledge management, dan CRM.

5. **Pengujian dan Evaluasi**: Melakukan pengujian sistem melalui black box testing dan evaluasi kualitas respons chatbot untuk memastikan sistem berfungsi sesuai kebutuhan.

Penulis bertanggung jawab penuh terhadap seluruh tahapan pengembangan sistem, mulai dari analisis kebutuhan, perancangan, implementasi, hingga pengujian dan evaluasi. Kegiatan PKL dilaksanakan selama 30 hari kerja efektif, dengan jam kerja dari 08.00 WIB hingga 17.00 WIB.

# BAB V
# PENUTUP

## 5.1 Kesimpulan

Berdasarkan kegiatan Praktik Kerja Lapangan yang telah dilaksanakan, dapat disimpulkan beberapa hal sebagai berikut:

1. **Sistem Mimotes AI berhasil dirancang dan diimplementasikan** sebagai solusi chatbot AI berbasis pengetahuan dengan arsitektur Retrieval-Augmented Generation (RAG) dan pipeline CRM untuk optimalisasi layanan pelanggan. Sistem ini dikembangkan menggunakan teknologi modern meliputi Next.js, PostgreSQL dengan ekstensi pgvector, Qdrant sebagai vector database, dan Baileys untuk integrasi WhatsApp.

2. **Pipeline RAG berfungsi dengan baik** dalam mengelola alur data dari upload dokumen, pemrosesan chunking, pembuatan embedding vektor, penyimpanan di vector database, hingga proses retrieval dan generasi respons oleh LLM. Dengan pendekatan RAG, chatbot mampu memberikan jawaban yang akurat dan kontekstual berdasarkan basis pengetahuan perusahaan, bukan hanya mengandalkan pengetahuan umum dari LLM.

3. **Pipeline CRM terintegrasi** dengan sistem chatbot sehingga setiap interaksi pelanggan dapat tercatat dan terkelola secara otomatis. Modul CRM mencakup manajemen leads, kontak, aktivitas, dan sales pipeline yang membantu tim penjualan dalam melacak dan mengelola hubungan dengan pelanggan.

4. **Integrasi WhatsApp** melalui protokol Baileys memungkinkan pelanggan berinteraksi dengan chatbot melalui platform pesan instan yang paling banyak digunakan, sehingga meningkatkan aksesibilitas dan kenyamanan layanan.

5. **Hasil pengujian black box** menunjukkan bahwa seluruh fitur sistem berfungsi sesuai kebutuhan, mulai dari autentikasi pengguna, manajemen dokumen, proses chat berbasis RAG, hingga pengelolaan data CRM.

Melalui kegiatan PKL ini, penulis memperoleh pengalaman berharga dalam menerapkan ilmu pengetahuan dan keterampilan yang diperoleh selama perkuliahan, khususnya dalam bidang kecerdasan buatan, rekayasa perangkat lunak, basis data, dan pengembangan sistem informasi modern.

## 5.2 Saran

Berdasarkan pengalaman dan hasil kegiatan Praktik Kerja Lapangan, penulis menyampaikan beberapa saran sebagai berikut:

1. **Bagi Bank Mandiri KCP Tegal Sudirman**:
   - Sistem Mimotes AI yang telah dikembangkan perlu terus dipelihara dan ditingkatkan fiturnya sesuai dengan kebutuhan bisnis yang berkembang.
   - Dilakukan evaluasi berkala terhadap kualitas respons chatbot dan pipeline CRM untuk memastikan sistem tetap optimal dalam melayani pelanggan.
   - Pertimbangkan untuk mengintegrasikan sistem dengan platform lain seperti email, media sosial, atau sistem CRM eksternal yang sudah ada.

2. **Bagi Program Studi S1 Teknik Informatika Universitas Harkat Negeri**:
   - Kurikulum dapat diperkaya dengan mata kuliah atau materi yang berkaitan dengan kecerdasan buatan, khususnya Natural Language Processing dan Retrieval-Augmented Generation.
   - Praktik Kerja Lapangan dengan skema Capstone Project seperti yang telah dilaksanakan dapat dijadikan model pembelajaran berbasis proyek (project-based learning) yang efektif.

3. **Bagi Penulis**:
   - Sistem Mimotes AI dapat dikembangkan lebih lanjut sebagai topik Skripsi/Tugas Akhir, khususnya dalam aspek optimasi model embedding, evaluasi kualitas RAG, atau pengembangan fitur analytics yang lebih mendalam.
   - Perlu dilakukan penelitian lebih lanjut mengenai evaluasi kualitas respons chatbot menggunakan metode seperti ROUGE, BLEU, atau human evaluation untuk mengukur efektivitas pipeline RAG yang telah dikembangkan.


# DAFTAR PUSTAKA

[1] A. P. Rizaldy, S. Riadi, dan N. Wijaya, "Peran Chatbot AI dalam Mengotomatiskan Layanan Pelanggan dan Meningkatkan Efisiensi Operasional E-commerce," DEVICE: J. Inf. Syst. Comput. Sci. Inf. Technol., vol. 6, no. 1, 2025, doi: 10.46576/device.v6i1.6628.

[2] T. Brown et al., "Language Models are Few-Shot Learners," Advances in Neural Information Processing Systems, vol. 33, pp. 1877-1901, 2020.

[3] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," Advances in Neural Information Processing Systems, vol. 33, pp. 9459-9474, 2020.

[4] F. Buttle dan S. Maklan, Customer Relationship Management: Concepts and Technologies, 4th ed. London: Routledge, 2019.

[5] Universitas Harkat Negeri, Buku Panduan Praktik Kerja Lapangan Program Studi S1 Teknik Informatika. Tegal: Fakultas Sains dan Teknologi, 2026.

[6] F. L. D. Cahyanti dan R. D. A. Raya, "Perancangan Sistem Informasi Chatbot Retrieval Augmented Generation Berbasis Website Pada PT. Revolusi Cita Edukasi," Indonesian J. Comput. Sci., vol. 4, no. 1, pp. 15-21, 2025, doi: 10.31294/m75d4782.

[7] Y. Gao et al., "Retrieval-Augmented Generation for Large Language Models: A Survey," arXiv preprint arXiv:2312.10997, 2024.

[8] A. Vaswani et al., "Attention Is All You Need," Advances in Neural Information Processing Systems, vol. 30, pp. 5998-6008, 2017.

[9] J. Devlin, M.-W. Chang, K. Lee, dan K. Toutanova, "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding," in Proceedings of NAACL-HLT, pp. 4171-4186, 2019.

[10] Qdrant, "Qdrant - Vector Database for AI Applications," Qdrant Documentation, 2024. [Online]. Available: https://qdrant.tech/documentation/

[11] Next.js, "Next.js by Vercel - The React Framework," Next.js Documentation, 2024. [Online]. Available: https://nextjs.org/docs

[12] Prisma, "Prisma - Next-generation ORM for Node.js and TypeScript," Prisma Documentation, 2024. [Online]. Available: https://www.prisma.io/docs

[13] WhatsApp Baileys, "Baileys - WhatsApp Web API," GitHub Repository, 2024. [Online]. Available: https://github.com/WhiskeySockets/Baileys

[14] pgvector, "pgvector: Open-source vector similarity search for Postgres," GitHub Repository, 2024. [Online]. Available: https://github.com/pgvector/pgvector

[15] OpenAI, "OpenAI API Documentation - Embeddings," OpenAI Platform, 2024. [Online]. Available: https://platform.openai.com/docs/guides/embeddings


# LAMPIRAN

## Lampiran A: Logbook Kegiatan Harian

[PLACEHOLDER: Isi logbook kegiatan harian selama PKL]

| No | Tanggal | Kegiatan | Keterangan |
|----|---------|----------|------------|
| 1 | .. Juni 2026 | Observasi dan wawancara | Mengidentifikasi kebutuhan sistem |
| 2 | .. Juni 2026 | Perancangan arsitektur | Merancang diagram use case dan ERD |
| 3 | .. Juni 2026 | Setup environment | Installasi Next.js, PostgreSQL, Qdrant |
| 4 | .. Juni 2026 | Implementasi database | Membuat schema Prisma dan migrasi |
| 5 | .. Juni 2026 | Implementasi backend | Membuat API routes dan layanan |
| 6 | .. Juni 2026 | Implementasi RAG pipeline | Document processing, chunking, embedding |
| 7 | .. Juni 2026 | Implementasi frontend | Membangun UI dashboard dan chat |
| 8 | .. Juni 2026 | Implementasi CRM | Leads management dan pipeline |
| 9 | .. Juni 2026 | Integrasi WhatsApp | Setup Baileys dan webhook |
| 10 | .. Juni 2026 | Pengujian | Black box testing dan evaluasi |

## Lampiran B: Dokumentasi Screenshot Sistem

[PLACEHOLDER: Screenshot dashboard, chat, knowledge management, CRM, settings]

## Lampiran C: GitHub Repository

Repository: https://github.com/EkoSaputro14/mimotes.git
Branch: semi-final

## Lampiran D: Diagram Pendukung

[PLACEHOLDER: Use Case Diagram, Activity Diagram, ERD, Arsitektur Sistem]

# BAB III
# METODE PELAKSANAAN PKL

## 3.1 Tugas Umum

Selama melaksanakan Praktik Kerja Lapangan di Bank Mandiri KCP Tegal Sudirman, penulis menjalankan beberapa tugas umum yang berkaitan dengan pengembangan dan pemeliharaan sistem informasi. Tugas-tugas umum tersebut meliputi:

1. **Aktivitas harian pengembangan perangkat lunak**: Penulis melakukan aktivitas coding, debugging, dan testing secara rutin setiap hari kerja. Aktivitas ini mencakup penulisan kode TypeScript untuk backend (API routes) dan frontend (React components), serta konfigurasi database PostgreSQL.

2. **Pemeliharaan infrastruktur Docker**: Penulis bertanggung jawab atas pengelolaan container Docker yang menjalankan aplikasi Mimotes AI, termasuk service PostgreSQL, Next.js application, PaddleOCR sidecar, dan Baileys WhatsApp service. Monitoring dilakukan melalui Docker logs dan health check endpoint.

3. **Diskusi dan koordinasi teknis**: Penulis melakukan diskusi rutin dengan dosen pembimbing dan stakeholders terkait untuk membahas progress pengembangan, kendala teknis, dan arahan perbaikan.

4. **Dokumentasi teknis**: Penulis mendokumentasikan seluruh proses pengembangan, termasuk arsitektur sistem, desain database, alur kerja RAG pipeline, dan instruksi deployment.

## 3.2 Tugas Khusus

### 3.2.1 Analisis Kebutuhan Sistem

Tugas khusus pertama yang dilakukan penulis adalah analisis kebutuhan sistem (requirements analysis). Penulis mengidentifikasi permasalahan utama yang dihadapi oleh Bank Mandiri KCP Tegal Sudirman, yaitu:

1. **Volume interaksi pelanggan yang tinggi**: Tim customer service harus menangani banyak permintaan pelanggan secara simultan, yang menyebabkan waktu tunggu respons yang lama.

2. **Pengetahuan yang tersebar**: Informasi produk, layanan, dan prosedur perusahaan tersimpan dalam berbagai dokumen yang tidak terpusat, sehingga sulit diakses secara cepat.

3. **Tidak adanya integrasi CRM**: Data pelanggan dan riwayat interaksi belum terkelola secara terstruktur, sehingga sulit untuk melacak status leads dan aktivitas penjualan.

4. **Keterbatasan akses multi-platform**: Pelanggan hanya dapat mengakses layanan melalui beberapa saluran terbatas, tanpa integrasi dengan platform pesan instan yang populer.

Berdasarkan analisis tersebut, penulis merumuskan kebutuhan sistem sebagai berikut:

- Sistem chatbot AI yang mampu memberikan respons akurat berdasarkan basis pengetahuan perusahaan
- Pipeline RAG untuk mengelola dokumen dan melakukan pencarian semantik
- Pipeline CRM untuk pengelolaan leads dan aktivitas penjualan
- Integrasi WhatsApp untuk komunikasi pelanggan
- Dashboard admin yang intuitif untuk pengelolaan seluruh aspek sistem

### 3.2.2 Perancangan Arsitektur Sistem

Penulis merancang arsitektur sistem Mimotes AI dengan mempertimbangkan aspek modularitas, scalability, dan maintainability. Arsitektur sistem terdiri dari lima komponen utama:

**1. Frontend Layer (Next.js)**
Antarmuka pengguna dibangun menggunakan Next.js 16 dengan React 19 dan Tailwind CSS. Arsitektur App Router memungkinkan routing berbasis file system dengan server-side rendering (SSR) dan client-side rendering (CSR). Frontend terdiri dari 53 halaman yang mencakup modul dashboard, chat, knowledge management, CRM, settings, dan analytics.

**2. API Layer (Next.js API Routes)**
Backend menggunakan 108 API routes yang dikelompokkan berdasarkan domain fungsional: autentikasi, admin, AI, chat, documents, knowledge/RAG, leads/CRM, WhatsApp, billing, widget, dan workspace management. Setiap API route menggunakan Prisma ORM untuk interaksi database.

**3. Data Layer (PostgreSQL + pgvector)**
PostgreSQL 16 dengan ekstensi pgvector digunakan sebagai database utama yang menyimpan data relasional dan embedding vektor. Schema terdiri dari 28 model Prisma yang mencakup domain tenant, documents, chat, settings, widget, WhatsApp, billing, dan analytics. Multi-tenancy diimplementasikan melalui workspace-based isolation dengan PostgreSQL Row Level Security (RLS).

**4. RAG Pipeline**
Pipeline Retrieval-Augmented Generation terdiri dari tahapan: document parsing, chunking, embedding generation, vector storage, retrieval, dan response generation. Pipeline ini menggunakan provider abstraction layer yang mendukung OpenAI embeddings dan feature hashing sebagai fallback lokal.

**5. Microservices**
- **Baileys Service**: Node.js microservice untuk integrasi WhatsApp menggunakan protokol Baileys
- **PaddleOCR Service**: Python microservice untuk Optical Character Recognition pada dokumen gambar
- **n8n Workflow Engine**: Otomasi workflow untuk notifikasi dan integrasi eksternal

### 3.2.3 Pemilihan Teknologi

Penulis melakukan evaluasi terhadap berbagai teknologi yang tersedia dan memilih kombinasi teknologi yang paling sesuai dengan kebutuhan sistem:

| Komponen | Teknologi | Alasan Pemilihan |
|----------|-----------|------------------|
| Framework | Next.js 16 | Full-stack framework dengan App Router, SSR/SSG, dan API routes built-in |
| Frontend | React 19 + Tailwind CSS | Komponen UI yang reusable dan styling utility-first yang efisien |
| Database | PostgreSQL 16 | Database relasional yang stabil dengan dukungan ekstensi pgvector untuk vector search |
| ORM | Prisma 6.19 | TypeScript-first ORM dengan type safety dan migration yang terkelola |
| Vector Store | pgvector | Ekstensi PostgreSQL untuk similarity search, menghindari dependency vector DB terpisah |
| AI/LLM | OpenAI-compatible API | Fleksibel untuk menggunakan berbagai provider (Mimo, OpenAI, Gemini, Ollama) |
| Embedding | text-embedding-3-small | Dimensi 1536, biaya rendah, kualitas tinggi |
| WhatsApp | Baileys 6.x | Community API untuk WhatsApp tanpa WhatsApp Business API resmi |
| OCR | PaddleOCR | Engine OCR open-source dengan akurasi tinggi untuk dokumen |
| Container | Docker Compose | Multi-container deployment yang terisolasi dan reproducible |
| Autentikasi | NextAuth v5 | Integrasi Prisma adapter dengan RBAC support |

## 3.3 Analisis Permasalahan dan Solusi

### Permasalahan 1: Akurasi Respons Chatbot

**Permasalahan**: Chatbot konvensional sering memberikan jawaban yang tidak relevan karena hanya mengandalkan pengetahuan umum dari LLM tanpa konteks spesifik perusahaan.

**Solusi**: Mengimplementasikan arsitektur RAG (Retrieval-Augmented Generation) yang menggabungkan kemampuan LLM dengan mekanisme pencarian semantik dari basis pengetahuan perusahaan. Setiap dokumen yang di-upload diproses menjadi chunk dengan embedding vektor, sehingga chatbot dapat mengambil informasi relevan sebelum menghasilkan respons.

### Permasalahan 2: Pengelolaan Pelanggan yang Tidak Terstruktur

**Permasalahan**: Interaksi pelanggan melalui chatbot tidak tercatat sebagai data CRM yang dapat dianalisis, sehingga tim penjualan kehilangan potensi leads.

**Solusi**: Mengintegrasikan pipeline CRM langsung ke dalam percakapan chatbot. Setiap percakapan publik (widget dan WhatsApp) secara otomatis menangkap data leads meliputi nama, email, skor leads, intent, dan summary. Pendekatan "conversation-centric CRM" ini memungkinkan chatbot berperan ganda sebagai Q&A engine sekaligus lead qualification agent.

### Permasalahan 3: Isolasi Data Multi-Tenant

**Permasalahan**: Sistem harus mendukung multiple workspace/tenant tanpa kebocoran data antar tenant.

**Solusi**: Mengimplementasikan multi-tenancy melalui workspace-based isolation. Seluruh data business (documents, chats, widgets, billing) di-scoping ke workspace melalui foreign key constraints dengan cascade delete. PostgreSQL Row Level Security (RLS) digunakan sebagai lapisan keamanan database untuk memastikan isolasi data di level query.

### Permasalahan 4: Ekstraksi Teks dari Dokumen Gambar

**Permasalahan**: Dokumen berupa gambar (screenshot, foto dokumen, scan) tidak dapat diproses oleh text parser biasa.

**Solusi**: Mengintegrasikan PaddleOCR sebagai microservice Python untuk ekstraksi teks dari gambar, serta Google Gemini Vision model untuk captioning dan summary gambar. Hasil OCR digabungkan dengan caption untuk membentuk chunk multimodal yang kaya informasi.


# BAB IV
# HASIL YANG DICAPAI

## 4.1 Gambaran Umum Sistem

Mimotes AI merupakan sistem chatbot AI berbasis pengetahuan yang dirancang untuk optimalisasi layanan pelanggan. Sistem ini mengintegrasikan tiga komponen utama: (1) pipeline RAG untuk pemrosesan dokumen dan generasi respons berbasis pengetahuan, (2) pipeline CRM untuk pengelolaan leads dan aktivitas penjualan, serta (3) integrasi WhatsApp untuk komunikasi pelanggan multi-platform.

Sistem ini di-deploy menggunakan Docker Compose dengan arsitektur microservices yang terdiri dari lima service utama:

| Service | Teknologi | Port | Fungsi |
|---------|-----------|------|--------|
| `db` | pgvector/pgvector:pg16 | 5432 | PostgreSQL + pgvector untuk data relasional dan embedding |
| `app` | Next.js 16 (multi-stage build) | 3100 | Aplikasi utama (frontend + API) |
| `paddleocr` | Python (FastAPI) | 8090 | OCR engine untuk dokumen gambar |
| `baileys` | Node.js | 3002 | WhatsApp integration service |
| `migrate` | Multi-stage build | - | Database migration (one-shot) |

**Gambar 4.1 Arsitektur Sistem Mimotes AI**

[PLACEHOLDER: Arsitektur sistem diagram]

## 4.2 Analisis dan Perancangan Sistem

### 4.2.1 Use Case Diagram

Sistem Mimotes AI memiliki empat aktor utama:

1. **Admin/Workspace Owner**: Mengelola settings, mengupload dokumen, memantau leads, mengelola anggota workspace
2. **Editor**: Mengupload dan mengelola dokumen, mengelola chat sessions, melihat analytics
3. **Viewer**: Melihat dashboard, menggunakan chat, melihat laporan
4. **Visitor/Pelanggan**: Berinteraksi melalui widget chat atau WhatsApp

**Gambar 4.2 Use Case Diagram Sistem**

[PLACEHOLDER: Use Case Diagram]

### 4.2.2 Activity Diagram

#### Activity Diagram Upload Dokumen

Proses upload dokumen melalui pipeline RAG mengikuti alur sebagai berikut:

1. User memilih file dan mengirim melalui antarmuka upload
2. Sistem melakukan autentikasi dan otorisasi (cek role "editor")
3. File divalidasi (tipe file, ukuran maksimal 10MB)
4. File disimpan ke disk pada direktori `public/uploads/`
5. Record dokumen dibuat di database dengan status `processing`
6. Job dimasukkan ke processing queue (FIFO, max 2 concurrent)
7. Pipeline pemrosesan dijalankan secara asynchronous:
   - Teks: parse → chunk → embed → store → status `ready`
   - Gambar: OCR + vision → generate chunks → embed → store → status `ready`
8. Usage tracking dicatat (jumlah dokumen, storage, embedding requests)

**Gambar 4.3 Activity Diagram Upload Dokumen**

[PLACEHOLDER: Activity Diagram]

#### Activity Diagram Proses Chat RAG

1. Pengguna mengirim pesan melalui dashboard chat, widget, atau WhatsApp
2. Pesan diterima di endpoint `/api/chat`
3. Query embedding dihasilkan menggunakan pipeline embedding
4. Retrieval dilakukan (hybrid search: vector + BM25 dengan RRF)
5. Confidence classification berdasarkan skor similarity
6. Context dibangun dari chunks ter-retrieve (maks 3000 tokens)
7. System prompt dikonstruksi berdasarkan mode widget
8. LLM menghasilkan respons secara streaming
9. Respons dan sources disimpan di database
10. Respons dikembalikan ke pengguna

**Gambar 4.4 Activity Diagram Proses Chat RAG**

[PLACEHOLDER: Activity Diagram]

### 4.2.3 Entity Relationship Diagram

Sistem Mimotes AI menggunakan 28 model database yang terorganisir dalam enam domain fungsional:

**1. Tenant & Identity Layer**
- `User` — Entity pengguna sistem dengan autentikasi email/password
- `Workspace` — Container multi-tenant; merupakan boundary isolasi data
- `WorkspaceMember` — Join table User-Workspace dengan RBAC roles (admin/editor/viewer)
- `WorkspaceInvitation` — Undangan pending dengan token-based acceptance

**2. Document & RAG Pipeline**
- `Folder` — Wadah organisasi dokumen dalam workspace
- `Document` — File knowledge base yang di-upload dengan tracking status pemrosesan
- `DocumentChunk` — Segmen teks/gambar dengan embedding vektor 1536-dimensi

**3. Conversational AI Layer**
- `ChatSession` → `ChatMessage` — Sesi chat internal dashboard
- `Widget` → `WidgetConversation` → `WidgetMessage` — Widget chat publik untuk visitor
- `WhatsAppConfig` → `WhatsAppConversation` → `WhatsAppMessage` — Integrasi WhatsApp

**4. CRM & Lead Pipeline**
Data leads terintegrasi dalam model percakapan (conversation-centric CRM):
- `WidgetConversation` menyimpan: `leadName`, `leadEmail`, `leadWhatsApp`, `leadScore`, `leadStatus`, `leadIntent`, `leadSummary`, `businessInterest`, `budget`, `location`, `timeline`, `followUp`
- `WhatsAppConversation` menyimpan field leads serupa

**5. Subscription & Billing**
- `SubscriptionPlan` — Definisi paket dengan resource limits
- `WorkspaceSubscription` — Binding workspace ke paket dengan integrasi Stripe
- `WorkspaceUsage` — Tracking usage bulanan
- `Invoice`, `InvoiceLineItem`, `Payment` — Records billing

**6. Configuration & Observability**
- `Setting`, `WorkspaceSetting` — Global dan per-workspace configuration
- `ApiKey`, `ApiUsageLog` — API access dengan usage metering
- `AuditLog`, `AnalyticsEvent` — Security audit trail dan product analytics
- `NotificationConfig`, `NotificationLog` — Multi-channel alerting

**Gambar 4.5 Entity Relationship Diagram**

[PLACEHOLDER: ERD diagram]

### 4.2.4 Arsitektur RAG Pipeline

Arsitektur RAG pipeline Mimotes AI terdiri dari enam komponen utama yang saling berinteraksi dalam alur data dari upload dokumen hingga generasi respons:

**Gambar 4.6 Arsitektur RAG Pipeline**

[PLACEHOLDER: RAG Pipeline Architecture Diagram]

| Komponen | File | Fungsi |
|----------|------|--------|
| Document Parser | `lib/rag/parser.ts` | parsing PDF, DOCX, TXT, CSV, XLSX, gambar |
| Chunker | `lib/rag/chunker.ts` | Recursive paragraph-then-sentence chunking |
| Embedder | `lib/rag/embedder.ts` | Generasi embedding 1536-dim (OpenAI / Feature Hashing) |
| Vector Store | `lib/rag/vectorstore.ts` | Penyimpanan dan retrieval vektor via pgvector |
| RAG Chain | `lib/rag/chain.ts` | Orkestrasi retrieval + generation |
| Prompt Templates | `lib/prompts/templates.ts` | Template prompt per mode widget |

### 4.2.5 Arsitektur CRM Pipeline

**Gambar 4.7 Arsitektur CRM Pipeline**

[PLACEHOLDER: CRM Pipeline Diagram]

Pipeline CRM Mimotes AI mengadopsi pendekatan conversation-centric di mana setiap percakapan publik (widget atau WhatsApp) secara otomatis berfungsi sebagai lead record. Alur CRM:

1. **Lead Capture**: Visitor berinteraksi dengan widget chat → data kontak ditangkap (nama, email, WhatsApp)
2. **Lead Scoring**: Sistem menghitung skor leads (low/medium/high) berdasarkan intent dan engagement
3. **Lead Qualification**: AI menganalisis intent, business interest, budget, dan timeline dari percakapan
4. **Lead Status Tracking**: Status leads diperbarui: new → contacted → qualified → converted
5. **Follow-up Automation**: Sistem mengirim notifikasi multi-channel (email, Telegram, Discord) untuk follow-up

## 4.3 Implementasi Sistem

### 4.3.1 Spesifikasi Perangkat Keras dan Lunak

**Tabel 4.1 Spesifikasi Perangkat Keras**

| Komponen | Spesifikasi |
|----------|-------------|
| Processor | [SPESIFIKASI CPU] |
| Memory (RAM) | [SPESIFIKASI RAM] |
| Storage | [SPESIFIKASI STORAGE] |
| Jaringan | Internet connection untuk AI provider API |

**Tabel 4.2 Spesifikasi Perangkat Lunak**

| Komponen | Versi |
|----------|-------|
| Operating System | Windows 11 / Ubuntu 20.04 (WSL2) |
| Runtime | Node.js 22 LTS |
| Framework | Next.js 16.2.7 |
| Database | PostgreSQL 16 + pgvector |
| ORM | Prisma 6.19.3 |
| Container | Docker Desktop with WSL2 backend |
| AI Provider | Mimo Pro (custom), OpenAI, Google Gemini |
| OCR Engine | PaddleOCR |
| WhatsApp | Baileys 6.7.23 |

### 4.3.2 Implementasi Database

Database Mimotes AI diimplementasikan menggunakan PostgreSQL 16 dengan ekstensi pgvector untuk penyimpanan embedding vektor. Schema terdiri dari 28 model Prisma yang terorganisir dalam enam domain fungsional.

**Fitur khusus database:**
- **pgvector extension**: Mendukung tipe data `vector(1536)` untuk cosine similarity search
- **Row Level Security (RLS)**: Isolasi data multi-tenant di level database
- **JSONB columns**: Penyimpanan metadata fleksibel (sources, processing metrics)
- **UUID primary keys**: Identifikasi unik yang terdistribusi

**Struktur tabel utama:**

**Tabel 4.3 Struktur Database DocumentChunk (RAG Core)**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Foreign key ke documents |
| `workspace_id` | TEXT | Tenant isolation |
| `content` | TEXT | Konten teks chunk |
| `embedding` | vector(1536) | Embedding vektor |
| `chunk_index` | INTEGER | Posisi dalam dokumen |
| `metadata` | JSONB | Metadata fleksibel |
| `chunk_type` | TEXT | Tipe: text, image_combined, dll |
| `ocr_text` | TEXT | Teks hasil OCR |
| `caption` | TEXT | Caption gambar |
| `image_summary` | TEXT | Ringkasan gambar |
| `image_url` | TEXT | URL gambar |

**Tabel 4.4 Struktur Database WidgetConversation (CRM Core)**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID | Primary key |
| `widget_id` | UUID | Foreign key ke widgets |
| `workspace_id` | TEXT | Tenant isolation |
| `visitor_id` | TEXT | Identifikasi visitor |
| `lead_name` | TEXT | Nama leads |
| `lead_email` | TEXT | Email leads |
| `lead_whatsapp` | TEXT | Nomor WhatsApp leads |
| `lead_score` | TEXT | Skor: low/medium/high |
| `lead_status` | TEXT | Status: new/contacted/converted |
| `lead_intent` | TEXT | Intent analysis |
| `lead_summary` | TEXT | Ringkasan percakapan |
| `business_interest` | TEXT | Minat bisnis |
| `budget` | TEXT | Estimasi budget |
| `timeline` | TEXT | Timeline kebutuhan |

### 4.3.3 Implementasi RAG Pipeline

#### A. Document Parsing

Modul parsing (`lib/rag/parser.ts`) mendukung ekstraksi teks dari berbagai format:

| Format | Parser | Output |
|--------|--------|--------|
| PDF | pdf-parse | Teks per halaman |
| DOCX | mammoth | Teks terstruktur |
| TXT | fs.readFileSync | Teks mentah |
| CSV | csv-parse | Baris-baris data |
| XLSX | xlsx library | Sheet data |
| Gambar | PaddleOCR + Gemini Vision | OCR text + caption |
| URL | cheerio (HTML parsing) | Teks HTML |

#### B. Chunking Strategy

Algoritma chunking menggunakan pendekatan recursive paragraph-then-sentence:

1. Teks dipecah berdasarkan double newline menjadi **paragraf**
2. Paragraf diakumulasi ke dalam chunk hingga mencapai `chunkSize` (default: **500 karakter**)
3. Ketika chunk melebihi batas, chunk baru dibuat dengan **overlap 50 kata** dari akhir chunk sebelumnya
4. Jika satu chunk melebihi 2x chunkSize, dilakukan split lebih lanjut berdasarkan **batas kalimat** (regex: `(?<=[.!?])\s+(?=[A-Z])`)
5. **Batas maksimum**: 1000 chunks per dokumen

#### C. Embedding Generation

Pipeline embedding menggunakan provider abstraction layer dengan dua provider:

| Provider | Dimensi | Biaya | Kondisi Penggunaan |
|----------|---------|-------|---------------------|
| OpenAI text-embedding-3-small | 1536 | $0.02/M tokens | Ketika API key tersedia |
| Feature Hashing (lokal) | 1536 | Gratis | Default / fallback |

**Feature Hashing** merupakan implementasi lokal yang menggunakan teknik character trigram + word token feature hashing dengan sign hashing dan L2 normalization. Provider ini selalu tersedia sebagai fallback ketika API key OpenAI tidak dikonfigurasi.

#### D. Vector Storage

Penyimpanan vektor menggunakan **pgvector** (ekstensi PostgreSQL), bukan database vektor terpisah. Embedding disimpan di tabel `document_chunks` sebagai tipe data `vector(1536)`. Proses storage dilakukan dalam batch 50 chunks per transaksi, dengan pengaturan `app.current_workspace_id` via `set_config()` untuk PostgreSQL Row Level Security.

#### E. Retrieval

Sistem mendukung dua mode pencarian:

**Mode Vector-Only** (fallback): Menggunakan operator cosine distance pgvector:
```
1 - (embedding <=> query_embedding::vector)
```
Threshold similarity: 0.30 untuk API embedding, 0.08 untuk local embedding.

**Mode Hybrid Search** (default): Menggabungkan vector similarity + PostgreSQL full-text search (BM25) menggunakan **Reciprocal Rank Fusion (RRF)** dengan bobot: vector 0.6, BM25 0.4.

Confidence classification:
| Level | Threshold (API) | Threshold (Local) |
|-------|-----------------|-------------------|
| High | >= 0.55 | >= 0.25 |
| Medium | >= 0.40 | >= 0.15 |
| Low | >= 0.30 | >= 0.05 |
| Refuse | < 0.30 | < 0.05 |

#### F. Response Generation

LLM diintegrasikan melalui OpenAI-compatible chat completions API dengan parameter:
- `temperature: 0.3` (akurasi fakta)
- `max_tokens: 1000`
- `stream: true` (streaming response)

Tiga mode widget dengan prompt berbeda:
1. **Knowledge Base**: Strict — hanya menjawab dari konteks dokumen, selalu mencantumkan sumber
2. **Customer Service**: Natural — tidak pernah mengatakan "tidak ditemukan", selalu menawarkan koneksi dengan tim
3. **Sales Agent**: Conversion-focused — memenuhi leads, menangkap kontak info

### 4.3.4 Implementasi Frontend

Frontend Mimotes AI dibangun menggunakan Next.js 16 dengan React 19 dan Tailwind CSS. Antarmuka terdiri dari 53 halaman yang terorganisir dalam beberapa domain:

| Domain | Halaman | Deskripsi |
|--------|---------|-----------|
| Auth | login, register, forgot-password | Autentikasi pengguna |
| Dashboard | dashboard | Ringkasan aktivitas dan statistik |
| Chat | chat | Interface chat berbasis RAG |
| Knowledge | documents, chunks, images, search, sources | Manajemen knowledge base |
| CRM | leads, leads/[id] | Manajemen leads dan detail |
| Analytics | analytics/chat, cost, leads, usage | Dashboard analitik |
| Settings | account, appearance, billing, notifications, dll | Pengaturan workspace |
| Widget | widget/preview, embed | Widget chat publik |
| Admin | admin/users, admin/models | Manajemen pengguna dan model AI |
| WhatsApp | whatsapp, whatsapp/conversations | Integrasi WhatsApp |

**Gambar 4.8 Tampilan Dashboard**

[PLACEHOLDER: Screenshot dashboard]

**Gambar 4.9 Tampilan Halaman Chat**

[PLACEHOLDER: Screenshot chat]

**Gambar 4.10 Tampilan Knowledge Management**

[PLACEHOLDER: Screenshot knowledge management]

**Gambar 4.11 Tampilan CRM / Leads**

[PLACEHOLDER: Screenshot leads]

**Gambar 4.12 Tampilan Settings**

[PLACEHOLDER: Screenshot settings]

### 4.3.5 Implementasi Backend

Backend Mimotes AI menggunakan 108 API routes yang dikelompokkan berdasarkan domain:

| Domain API | Jumlah Endpoint | Fungsi |
|------------|-----------------|--------|
| Auth | 2 | Autentikasi dan registrasi |
| Admin | 4 | Manajemen model, settings, users |
| AI | 6 | Playground, prompts, testing |
| Analytics | 8 | Chat, cost, evaluation, leads, retrieval |
| Chat | 2 | Chat sessions dan messages |
| Documents | 3 | Upload, CRUD, bulk operations |
| Knowledge/RAG | 8 | Chunks, documents, images, search, sources |
| Leads/CRM | 5 | Lead management, intelligence, notifications |
| WhatsApp | 8 | Config, conversations, webhook, Baileys |
| Widget | 7 | Config, chat, leads, analytics |
| Billing | 3 | Checkout, portal, webhook (Stripe) |
| Workspace | 10 | Members, invitations, billing, settings |
| Lainnya | 34 | MCP, notifications, onboarding, API platform, dll |

### 4.3.6 Implementasi Integrasi WhatsApp

Integrasi WhatsApp menggunakan dua pendekatan:

1. **Baileys Protocol**: Node.js microservice yang berjalan sebagai container terpisah (port 3002). Mendukung QR code authentication dan message handling real-time.

2. **Meta Cloud API**: Integrasi dengan WhatsApp Business API resmi melalui webhook endpoint.

Konfigurasi per workspace meliputi: phone number ID, access token, verify token, business account ID, auto-reply settings, dan welcome message.

### 4.3.7 Implementasi Autentikasi dan Otorisasi

Autentikasi menggunakan NextAuth v5 dengan Prisma adapter. Sistem mendukung:

- **Email/password authentication** dengan bcryptjs password hashing
- **Role-Based Access Control (RBAC)**: admin, editor, viewer per workspace
- **Multi-tenancy isolation**: workspace-based data scoping dengan PostgreSQL RLS
- **API key authentication** untuk programmatic access dengan rate limiting (Upstash Redis)

## 4.4 Pengujian Sistem

### 4.4.1 Black Box Testing

Pengujian black box dilakukan terhadap seluruh fitur utama sistem untuk memastikan setiap fungsi bekerja sesuai kebutuhan.

**Tabel 4.10 Hasil Pengujian Black Box**

| No | Fitur | Input | Expected Output | Actual Output | Status |
|----|-------|-------|-----------------|---------------|--------|
| 1 | Login | Email + password valid | Redirect ke dashboard | Berhasil redirect | Lulus |
| 2 | Login | Email + password invalid | Pesan error | Pesan "Invalid credentials" | Lulus |
| 3 | Upload Dokumen (PDF) | File PDF < 10MB | Status processing → ready | Berhasil diproses | Lulus |
| 4 | Upload Dokumen (Gambar) | File PNG < 10MB | OCR + caption → ready | Berhasil dengan OCR text | Lulus |
| 5 | Chat (RAG) | Pertanyaan dari dokumen | Jawaban akurat + sumber | Berhasil dengan citations | Lulus |
| 6 | Chat (RAG) | Pertanyaan di luar konteks | Penolakan sopan | "Maaf, saya tidak menemukan..." | Lulus |
| 7 | Lead Capture | Visitor mengisi form | Lead tersimpan di DB | Lead tercatat dengan skor | Lulus |
| 8 | WhatsApp | Pesan masuk | Auto-reply + RAG response | Berhasil merespons | Lulus |
| 9 | Settings | Ubah AI provider | Provider tersimpan | Konfigurasi tersimpan | Lulus |
| 10 | RBAC | Viewer coba upload | Access denied | Ditolak sesuai role | Lulus |

### 4.4.2 Pengujian Respons Chat

**Tabel 4.11 Hasil Pengujian Respons Chat RAG**

| No | Pertanyaan | Sumber Dokumen | Confidence | Kualitas Respons |
|----|-----------|----------------|------------|------------------|
| 1 | [Pertanyaan dari dokumen A] | Dokumen A, chunk 3 | High (0.72) | Akurat, lengkap, ada citation |
| 2 | [Pertanyaan dari dokumen B] | Dokumen B, chunk 1 | Medium (0.45) | Relevan, sebagian informasi |
| 3 | [Pertanyaan campuran] | Dokumen A + B | Medium (0.42) | Gabungan dari 2 sumber |
| 4 | [Pertanyaan di luar konteks] | Tidak ada | Refuse | Penolakan sopan |
| 5 | [Pertanyaan umum] | Dokumen terkait | Low (0.31) | "Informasi terbatas..." |

### 4.4.3 Pengujian Pipeline CRM

**Tabel 4.12 Hasil Pengujian Pipeline CRM**

| No | Skenario | Input | Expected | Actual | Status |
|----|----------|-------|----------|--------|--------|
| 1 | Widget lead capture | Visitor fill form | Lead created | Lead tersimpan | Lulus |
| 2 | Lead scoring | Konversasi aktif | Score: high | Score dihitung benar | Lulus |
| 3 | Lead status update | Admin update status | Status berubah | Tersimpan | Lulus |
| 4 | WhatsApp lead | Pesan WA masuk | Lead dari WA | Lead tercatat | Lulus |
| 5 | Notifikasi | Lead baru | Email/Telegram alert | Notifikasi terkirim | Lulus |
