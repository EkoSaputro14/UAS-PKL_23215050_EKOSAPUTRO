# LAPORAN AUDIT — Laporan PKL Mimotes AI
**Tanggal Audit:** 6 Juli 2026  
**Auditor:** Senior Academic Reviewer (AI-Assisted)  
**Dokumen:** LAPORAN_PKL_Eko_Saputro_23215050.docx  
**Judul:** Rancang Bangun Sistem Chatbot AI Berbasis Pengetahuan dengan RAG dan Pipeline CRM untuk Optimalisasi Layanan Pelanggan

---

## 1. RINGKASAN KUALITAS LAPORAN

| Aspek | Skor | Keterangan |
|-------|------|------------|
| Konsistensi Isi | 72/100 | Beberapa inkonsistensi angka dan nomor gambar/tabel |
| Kesesuaian Template | 65/100 | TOC masih bercampur template lama, daftar gambar/tabel belum sinkron |
| Kesesuaian Source Code | 80/100 | Klaim umum benar, tapi beberapa angka spesifik salah |
| Kesiapan Sidang | 70/100 | Perlu perbaikan sebelum sidang |
| **SKOR RATA-RATA** | **72/100** | **Perlu revisi** |

---

## 2. TEMUAN KRITIS (Harus diperbaiki sebelum sidang)

### KRIT-1: Angka Database Tidak Konsisten
- **Laporan:** "28 model database" (para 315)
- **Source Code:** **36 model** (`grep "^model " prisma/schema.prisma | wc -l` → 36)
- **Dampak:** Penguji akan langsung menanyakan ini. Angka 28 tidak ada di mana pun di codebase.
- **Revisi:** Ganti "28 model" → "36 model"

### KRIT-2: Jumlah API Routes Salah
- **Laporan:** "108 API routes" (para 319, 342)
- **Source Code:** **119 routes** (`find app/api -name "route.ts" | wc -l` → 119)
- **Dampak:** Penguji bisa hitung langsung. Kehilangan kredibilitas.
- **Revisi:** Ganti "108 routes" → "119 routes"

### KRIT-3: Jumlah Halaman Salah
- **Laporan:** "53 halaman" (para 340)
- **Source Code:** **52 pages** (`find app -name "page.tsx" | wc -l` → 52)
- **Dampak:** Minor tapi bisa ditanyakan.
- **Revisi:** Ganti "53 halaman" → "52 halaman"

### KRIT-4: Referensi [10] URL Salah
- **Laporan:** `[10] pgvector, "pgvector - Vector Database..." Available: https://qdrant.tech/documentation/`
- **Masalah:** Judul "pgvector" tapi URL mengarah ke **Qdrant** (database vektor berbeda). Ini error akademik serius.
- **Revisi:** Ganti URL ke `https://github.com/pgvector/pgvector` atau `https://neondatabase.github.io/pgvector/`

### KRIT-5: Referensi [9] Tidak Relevan
- **Laporan:** `[9] J. Devlin et al., "BERT: Pre-training..."` digunakan untuk mendukung klaim tentang temperature 0.3 di Mimotes AI.
- **Masalah:** Paper BERT tidak membahas temperature setting untuk chatbot RAG. Referensi tidak relevan.
- **Revisi:** Hapus referensi [9] atau ganti dengan referensi yang relevan (misal: OpenAI API docs untuk parameter inference)

### KRIT-6: Daftar Isi Tidak Sinkron dengan Isi
- **Laporan TOC menampilkan:** 5 sub-bab 5.x (5.1.1–5.1.6) yang merujuk ke sub-bab lama
- **Isi aktual BAB V:** Hanya 5.1 Kesimpulan dan 5.2 Saran (tanpa sub-bab 5.1.1 dst.)
- **Masalah:** TOC menampilkan struktur sub-bab yang tidak ada di isi. Ini menunjukkan TOC belum di-update.
- **Revisi:** Update TOC di Word → klik kanan → Update Field → Update entire table

### KRIT-7: Tabel Tidak Dirujuk di Teks
- **Laporan:** Tabel 4.3 (Logbook) dan Tabel 4.4 (Kontribusi) tidak dirujuk di dalam teks bab manapun.
- **Masalah:** Dalam penulisan akademik, setiap tabel HARUS dirujuk minimal sekali di teks.
- **Revisi:** Tambahkan rujukan seperti "Logbook kegiatan harian selama PKL ditampilkan pada Tabel 4.3"

### KRIT-8: Overlap Chunking Unit Salah
- **Laporan:** "overlap 50 kata" (para 334)
- **Source Code:** `overlap: number = 50` → ini dalam satuan **kata** (dari `words.slice(-overlap)`). **BENAR** — tidak perlu revisi.
- **Status:** ✅ Terverifikasi benar

---

## 3. TEMUAN MINOR (Perlu diperhatikan)

### MIN-1: Gambar Tidak Dirujuk di Teks
- **Gambar 4.5 (ERD):** Disebutkan di 4.2.6 tapi caption-nya "Gambar 4.5 Entity Relationship Diagram" — **tidak dirujuk dengan nomor yang konsisten** karena di Daftar Gambar tertulis "Gambar 4.5 Entity Relationship Diagram\t16" tapi caption di body "Gambar 4.5 Entity Relationship Diagram"
- **Status:** ✅ Konsisten (tidak ada masalah)

### MIN-2: Referensi [10] Dicantumkan Dua Kali
- Referensi [10] dan [14] keduanya merujuk ke pgvector tapi dengan URL berbeda:
  - [10]: `https://qdrant.tech/documentation/` (SALAH — ini URL Qdrant)
  - [14]: `https://github.com/pgvector/pgvector` (BENAR)
- **Revisi:** Hapus atau gabungkan. Pertahankan [14] yang benar.

### MIN-3: Lembar Persetujuan Tanggal Kosong
- **Laporan:** "Tegal, __________ 2026" — tanggal belum diisi.
- **Revisi:** Isi tanggal yang sesuai sebelum sidang.

### MIN-4: Lembar Pengesahan Tanggal Kosong
- Sama seperti MIN-3.

### MIN-5: Judul Cover vs Judul di Dokumen
- Cover: "RANCANG BANGUN SISTEM CHATBOT AI BERBASIS PENGETAHUAN DENGAN RETRIEVAL-AUGMENTED GENERATION DAN PIPELINE CRM"
- Lembar Persetujuan: "...PIPELINE CRM UNTUK OPTIMALISASI LAYANAN PELANGGAN"
- **Masalah:** Cover tidak memiliki frasa "UNTUK OPTIMALISASI LAYANAN PELANGGAN"
- **Revisi:** Pastikan judul konsisten di semua halaman

### MIN-6: Tabel 4.1 Spesifikasi Perangkat — Google Gemini Terdaftar
- Tabel menyebut "Google Gemini" sebagai AI Provider.
- **Source Code:** ✅ Benar — `google` provider ada di `lib/ai-provider.ts`
- **Status:** Terverifikasi

### MIN-7: Docker Services — PaddleOCR Disebutkan
- Laporan: "PaddleOCR (port 8090)"
- **Source Code:** ✅ Benar — ada di `docker-compose.yml` sebagai service `paddleocr`
- **Status:** Terverifikasi

### MIN-8: Baileys Port
- Laporan: "port 3002"
- **Source Code:** Perlu verifikasi — tidak ditemukan hardcode "3002" di `lib/whatsapp/client.ts`. Port mungkin diatur di docker-compose.
- **Status:** ⚠️ Belum ditemukan di source code, tapi mungkin di env variable

### MIN-9: Confidence Thresholds
- Laporan: "High (>= 0.55), Medium (>= 0.40), Low (>= 0.30), Refuse (< 0.30)"
- **Source Code:** ✅ Benar — sesuai `classifyConfidence()` di `lib/rag/chain.ts`
- **Status:** Terverifikasi

### MIN-10: Widget Modes
- Laporan: "Knowledge Base (strict, cite sources), Customer Service (natural, conversational), Sales Agent (conversion-focused)"
- **Source Code:** ✅ Benar — ada mode `knowledge_base`, `customer_service`, `sales_agent` di `lib/rag/chain.ts`
- **Status:** Terverifikasi

---

## 4. KLAIM YANG PERLU DIVERIFIKASI

| # | Klaim di Laporan | Status Source Code | Keterangan |
|---|---|---|---|
| 1 | 28 model database | ✅ **36 model** (SALAH) | Harus diperbaiki ke 36 |
| 2 | 108 API routes | ✅ **119 routes** (SALAH) | Harus diperbaiki ke 119 |
| 3 | 53 halaman | ✅ **52 pages** (SALAH) | Harus diperbaiki ke 52 |
| 4 | Next.js 16.2.7 | ✅ Terverifikasi | Benar |
| 5 | React 19 | ✅ Terverifikasi (19.2.4) | Benar |
| 6 | PostgreSQL 16 + pgvector | ✅ Terverifikasi | Benar |
| 7 | Prisma 6.19.3 | ✅ Terverifikasi | Benar |
| 8 | NextAuth v5 (beta) | ✅ Terverifikasi (5.0.0-beta.31) | Benar |
| 9 | PaddleOCR | ✅ Terverifikasi | Benar |
| 10 | Stripe billing | ✅ Terverifikasi (22.2.0) | Benar |
| 11 | WhatsApp Baileys 6.7.23 | ⚠️ Perlu verifikasi versi | Package.json tidak menampilkan versi Baileys |
| 12 | Multi-tenancy + RLS | ✅ Terverifikasi | workspace_id + set_config() |
| 13 | RBAC (admin/editor/viewer) | ✅ Terverifikasi | role field di WorkspaceMember |
| 14 | Hybrid Search (Vector 0.6 + BM25 0.4) | ✅ Terverifikasi | `vectorWeight = 0.6, bm25Weight = 0.4` |
| 15 | RRF (Reciprocal Rank Fusion) | ✅ Terverifikasi | ada di vectorstore.ts |
| 16 | Chunk size 500, overlap 50 | ✅ Terverifikasi | Benar |
| 17 | Max 1000 chunks per dokumen | ✅ Terverifikasi | `const MAX_CHUNKS = 1000` |
| 18 | Temperature 0.3 | ✅ Terverifikasi | Benar |
| 19 | Max tokens 1000 | ✅ Terverifikasi | Benar |
| 20 | Context 3000 tokens | ✅ Terverifikasi | `DEFAULT_MAX_CONTEXT_TOKENS = 3000` |
| 21 | 7 AI providers | ✅ Terverifikasi | openai, lmstudio, ollama, openrouter, custom, mimo, google |
| 22 | 1536 embedding dimensions | ✅ Terverifikasi | `EMBEDDING_DIMENSION = 1536` |
| 23 | Feature Hashing lokal | ✅ Terverifikasi | ada di embedding-providers/ |
| 24 | Docker Compose 5 services | ✅ Terverifikasi | app, db, migrate, paddleocr, baileys |
| 25 | Vitest testing | ⚠️ Package ada tapi tidak dicek test coverage | Perlu verifikasi |

---

## 5. DAFTAR REVISI WAJIB

| # | Lokasi | Masalah | Revisi |
|---|--------|---------|--------|
| 1 | Para 315, 342 | "28 model database" | → **36 model** |
| 2 | Para 319, 342 | "108 API routes" | → **119 routes** |
| 3 | Para 340 | "53 halaman" | → **52 halaman** |
| 4 | Referensi [10] | URL Qdrant untuk pgvector | → Hapus atau ganti URL |
| 5 | Referensi [9] | Paper BERT tidak relevan | → Hapus atau ganti |
| 6 | TOC | Struktur sub-bab belum sinkron | → Update TOC di Word |
| 7 | Tabel 4.3, 4.4 | Tidak dirujuk di teks | → Tambah rujukan di BAB IV |
| 8 | Cover | Judul tidak lengkap | → Tambah "UNTUK OPTIMALISASI LAYANAN PELANGGAN" |

---

## 6. DAFTAR REVISI OPSIONAL

| # | Lokasi | Masalah | Revisi |
|---|--------|---------|--------|
| 1 | Para 51 | Tanda tangan kosong (hanya ",") | → Isi nama atau hapus |
| 2 | Para 49, 68, 88 | Tanggal kosong "__________" | → Isi tanggal sidang |
| 3 | Para 133-141 | Sub-bab 5.x di TOC merujuk ke struktur lama | → Update atau hapus |
| 4 | Para 414 | "[Screenshot tampilan sistem akan ditambahkan...]" | → Hapus karena sudah ada di 4.6 |
| 5 | Para 97 | TOC memiliki duplikasi halaman ("vii\tvii") | → Bersihkan |
| 6 | Daftar Gambar | Hanya 5 gambar terdaftar, tapi ada 16 gambar di body | → Tambah 11 gambar lainnya |
| 7 | Daftar Tabel | Hanya 5 tabel terdaftar, tapi ada 3 tabel di body | → Sinkronkan |
| 8 | Para 283 | "lima service utama" → seharusnya 6 service | → Verifikasi |

---

## 7. SIMULASI PERTANYAAN SIDANG

### Kelompok: AI & Chatbot
1. **Apa perbedaan chatbot rule-based dengan chatbot berbasis AI?**  
   *Jawaban: Rule-based menggunakan pola respons tetap (if-then), sedangkan AI-powered menggunakan NLP/LLM untuk memahami konteks dan menghasilkan respons dinamis. Mimotes AI menggunakan LLM.*

2. **Mengapa memilih RAG dibandingkan fine-tuning LLM?**  
   *Jawaban: RAG lebih efisien secara biaya (tidak perlu retraining), data selalu up-to-date karena diambil dari knowledge base real-time, dan dapat menunjukkan sumber jawaban (explainability).*

3. **Apa yang terjadi jika pertanyaan pengguna tidak ada di knowledge base?**  
   *Jawaban: Confidence classification menolak menjawab (level "refuse") dan chatbot merespons bahwa informasi tidak tersedia dalam dokumen yang dimiliki.*

4. **Apa itu temperature 0.3 dan mengapa dipilih?**  
   *Jawaban: Temperature mengontrol kreativitas respons. 0.3 rendah → respons lebih deterministik dan akurat secara fakta, cocok untuk chatbot berbasis dokumen.*

### Kelompok: RAG Pipeline
5. **Jelaskan alur RAG dari upload dokumen hingga chatbot menjawab.**  
   *Jawaban: Upload → Parse (PDF/DOCX/TXT/gambar) → Sanitize → Chunk (500 chars, 50 overlap) → Embed (1536-dim) → Store (pgvector) → Query → Embed query → Hybrid Search (Vector+BM25) → Build context (3000 tokens) → LLM generates response → Save to DB.*

6. **Apa perbedaan Vector Search dan Hybrid Search?**  
   *Jawaban: Vector search hanya cosine similarity. Hybrid search menggabungkan Vector (0.6) + BM25 (0.4) dengan RRF → hasil lebih akurat, terutama untuk kata kunci spesifik.*

7. **Mengapa menggunakan RRF (Reciprocal Rank Fusion)?**  
   *Jawaban: RRF menggabungkan ranking dari dua metode pencarian berbeda tanpa perlu normalisasi skor. Skor RRF = 1/(k+rank) untuk setiap dokumen dari setiap metode.*

8. **Bagaimana chunking strategy Mimotes AI bekerja?**  
   *Jawaban: Paragraph-based splitting (max 500 chars), lalu sentence-based split jika paragraph terlalu besar. Overlap 50 kata antar chunk untuk menjaga kontinuitas konteks.*

9. **Apa yang dimaksud dengan "overlap" dalam chunking?**  
   *Jawaban: 50 kata terakhir dari chunk sebelumnya disertakan di awal chunk berikutnya. Ini mencegah kehilangan konteks di batas chunk.*

### Kelompok: Embedding & Vector Database
10. **Mengapa menggunakan pgvector dibandingkan dedicated vector DB seperti Qdrant/Pinecone?**  
    *Jawaban: pgvector memungkinkan satu database untuk data relasional DAN vektor, mengurangi kompleksitas infrastruktur. PostgreSQL sudah mature, mendukung ACID transactions, dan RLS untuk multi-tenancy.*

11. **Apa itu embedding dan mengapa berdimensi 1536?**  
    *Jawaban: Embedding adalah representasi vektor numerik dari teks. 1536 dimensi adalah output bawaan model text-embedding-3-small dari OpenAI, yang merupakan kompromi antara akurasi dan efisiensi komputasi.*

12. **Apa itu cosine similarity?**  
   *Jawaban: Mengukur kemiripan dua vektor berdasarkan sudut antar vektor (bukan panjang). Nilai 1 = identik, 0 = tidak mirip. Digunakan untuk menemukan chunks paling relevan.*

13. **Bagaimana fitur "Feature Hashing" sebagai fallback berfungsi?**  
   *Jawaban: Menggunakan character trigram hashing untuk menghasilkan vektor 1536-dim tanpa model ML. Gratis dan lokal, tapi kurang akurat dibanding neural embedding.*

14. **Apa threshold untuk menolak menjawab?**  
   *Jawaban: API embedding: refuse jika max similarity < 0.30. Local embedding: refuse jika < 0.08. Ini memastikan chatbot hanya menjawab berdasarkan dokumen yang benar-benar relevan.*

### Kelompok: PostgreSQL & Database
15. **Apa itu Row Level Security (RLS) dan bagaimana diterapkan?**  
   *Jawaban: RLS adalah fitur PostgreSQL yang membatasi akses data berdasarkan kondisi WHERE policy. Mimotes AI menggunakan `set_config('app.current_workspace_id', ...)` untuk memastikan setiap workspace hanya mengakses data miliknya.*

16. **Bagaimana mekanisme multi-tenancy di Mimotes AI?**  
   *Jawaban: Workspace-based isolation. Setiap data (documents, chunks, conversations) memiliki `workspace_id`. RLS policy memfilter query berdasarkan workspace_id dari session.*

17. **Apa keunggulan pgvector dibanding menyimpan embedding di file terpisah?**  
   *Jawaban: Transaksi ACID, integrasi langsung dengan SQL queries, tidak perlu sync antara DB dan file, mendukung index untuk performa.*

18. **Bagaimana performa pencarian vektor di pgvector?**  
   *Jawaban: Menggunakan index IVFFlat atau HNSW untuk nearest neighbor search. Cosine distance dihitung dengan operator `<=>`.*

### Kelompok: Next.js Architecture
19. **Apa itu App Router di Next.js 16?**  
   *Jawaban: Sistem routing berbasis folder di `app/`. Mendukung Server Components (default), Client Components ("use client"), dan API Routes. File-based routing dengan nested layouts.*

20. **Apa perbedaan Server Components dan Client Components?**  
   *Jawaban: Server Components berjalan di server, tidak mengirim JS ke client (lebih cepat). Client Components berjalan di browser, bisa interaktif (useState, onClick).*

21. **Mengapa menggunakan Prisma sebagai ORM?**  
   *Jawaban: Type safety untuk TypeScript, auto-generated client, migration system, dan mendukung raw SQL untuk operasi pgvector yang tidak didukung native.*

22. **Apa itu standalone output di Next.js?**  
   *Jawaban: Mode build yang menghasilkan folder standalone tanpa node_modules full → image Docker lebih kecil.*

### Kelompok: CRM & Integrasi
23. **Apa itu "conversation-centric CRM"?**  
   *Jawaban: Pendekatan di mana setiap percakapan chatbot otomatis berfungsi sebagai lead record. Tidak perlu form terpisah untuk lead capture.*

24. **Bagaimana lead scoring bekerja?**  
   *Jawaban: AI menganalisis percakapan untuk menentukan intent, interest, budget, timeline. Skor dihitung berdasarkan kombinasi faktor ini (low/medium/high).*

25. **Apa itu pipeline CRM yang dimaksud?**  
   *Jawaban: Lead Capture → AI Analysis → Lead Scoring → Status Tracking (new→contacted→qualified→converted) → Follow-up Automation.*

### Kelompok: Implementasi
26. **Mengapa menggunakan Docker Compose?**  
   *Jawaban: Microservices architecture. Setiap service (app, db, paddleocr, baileys) berjalan terisolasi, mudah di-scale, dan reproducible deployment.*

27. **Apa itu PaddleOCR dan mengapa dibutuhkan?**  
   *Jawaban: OCR engine untuk mengekstrak teks dari gambar/foto. Digunakan ketika user upload gambar berisi teks (screenshot, foto dokumen).*

28. **Bagaimana integrasi WhatsApp Baileys bekerja?**  
   *Jawaban: Baileys berjalan sebagai microservice terpisah, terhubung ke WhatsApp Web protocol. Ketika pesan masuk, diproses oleh RAG pipeline dan dikirim balik melalui Baileys.*

29. **Apa itu widget chat dan bagaimana cara kerjanya?**  
   *Jawaban: JavaScript snippet yang di-embed di website client. Visitor bisa chat langsung, data tersimpan di Mimotes AI sebagai leads. Mendukung 3 mode: KB, CS, Sales.*

### Kelompok: Pengujian
30. **Apa metode pengujian yang digunakan?**  
   *Jawaban: Black box testing — menguji input/output tanpa melihat kode internal. 10 skenario pengujian mencakup login, upload, chat, lead capture, WhatsApp, settings, dan RBAC.*

31. **Bagaimana cara menguji bahwa chatbot hanya menjawab dari dokumen?**  
   *Jawaban: Kirim pertanyaan yang TIDAK ada di dokumen → chatbot harus menolak menjawab dengan pesan "Informasi tersebut tidak tersedia dalam dokumen yang saya miliki."*

32. **Apa yang diuji pada pengujian RBAC?**  
   *Jawaban: User dengan role "Viewer" mencoba upload dokumen → sistem menolak dengan pesan "Access denied" karena role tidak memiliki permission upload.*

---

## 8. PENILAIAN AKHIR

| Aspek | Bobot | Skor | Nilai |
|-------|-------|------|-------|
| Konsistensi Isi | 25% | 72 | 18.0 |
| Kesesuaian Template | 20% | 65 | 13.0 |
| Kesesuaian Source Code | 25% | 80 | 20.0 |
| Kesiapan Sidang | 15% | 70 | 10.5 |
| Kualitas Referensi | 15% | 75 | 11.25 |
| **TOTAL** | **100%** | — | **72.75/100** |

### Kategori: **B (Perlu Revisi)**

**Rekomendasi:** Laporan ini memiliki fondasi konten yang kuat dengan fitur yang terverifikasi di source code. Namun, terdapat kesalahan angka kritis (28→36 model, 108→119 routes, 53→52 pages) dan referensi yang tidak valid yang harus diperbaiki SEBELUM sidang. Tanpa perbaikan ini, penguji akan kehilangan kepercayaan pada akurasi laporan secara keseluruhan.

---

*Audit ini dilakukan berdasarkan cross-reference antara isi laporan, source code (AGENTS.md + file aktual), dan standar penulisan akademik.*
