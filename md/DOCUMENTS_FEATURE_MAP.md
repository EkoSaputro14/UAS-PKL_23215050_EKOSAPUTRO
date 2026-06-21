# DOCUMENTS_FEATURE_MAP.md — Documents & Knowledge Base

**Generated:** 2026-06-17

---

## DOCUMENT UPLOAD

### Supported Formats
| Format | Parser | Features |
|--------|--------|----------|
| PDF | pdf-parse | Text extraction, page-by-page |
| DOCX | mammoth | Paragraph extraction |
| TXT | fs.readFile | Plain text |
| CSV | csv-parse | Column mapping |
| XLSX | xlsx | Sheet extraction |
| URL | cheerio | Web scraping |
| Images | PaddleOCR | OCR text extraction |

### Upload Flow
1. User selects files → `UploadForm` component
2. `POST /api/upload` → file saved to `/uploads/`
3. Background processing queue:
   - Parse content (`lib/rag/parser.ts`)
   - Sanitize text
   - Chunk text (`lib/rag/chunker.ts`)
   - Generate embeddings (`lib/rag/embedder.ts`)
   - Store chunks in pgvector (`lib/rag/vectorstore.ts`)
4. Status: `processing` → `ready` | `failed`

### Database Tables
- `documents` — Metadata (title, type, status, chunk_count)
- `document_chunks` — Content + embeddings (pgvector)

---

## DOCUMENT MANAGEMENT

### CRUD Operations
| Action | API | Notes |
|--------|-----|-------|
| List docs | `GET /api/documents` | Paginated, filtered |
| Get doc | `GET /api/documents/[id]` | With chunks |
| Update doc | `PUT /api/documents/[id]` | Title, metadata |
| Delete doc | `DELETE /api/documents/[id]` | Cascade delete chunks |
| Bulk ops | `POST /api/documents/bulk` | Multi-select actions |

### Components
- `DocumentList` — Table view with sort/filter
- `DocumentPreview` — Content preview modal
- `FolderSidebar` — Folder tree navigation
- `ActionSheet` — Bulk action bar

---

## FOLDER SYSTEM
- **API:** `GET/POST /api/folders`
- **Table:** `folders`
- **Features:**
  - Create/rename/delete folders
  - Move documents between folders
  - Nested folder hierarchy
  - Drag-and-drop support

---

## KNOWLEDGE BASE

### Document Explorer
- **Route:** `/knowledge/documents`
- **Component:** `DocumentExplorer`
- **API:** `GET /api/knowledge/documents`
- Browse all processed documents with stats

### Document Detail
- **Route:** `/knowledge/documents/[id]`
- **Component:** `document-detail-client.tsx`
- View document content, chunks, metadata

### Chunk Viewer
- **Route:** `/knowledge/chunks`
- **Component:** `ChunkViewer`
- **API:** `GET /api/knowledge/chunks`
- Browse individual text chunks
- View embeddings, metadata

### Similarity Search
- **Route:** `/knowledge/search`
- **Component:** `SimilaritySearch`
- **API:** `GET /api/knowledge/search`
- Vector search across all chunks
- Cosine similarity ranking

### Source Viewer
- **Route:** `/knowledge/sources`
- **Component:** `SourceViewer`
- **API:** `GET /api/knowledge/sources`

### Image Viewer
- **Route:** `/knowledge/images`
- **API:** `GET /api/knowledge/images`
- OCR-processed images

---

## OCR PIPELINE (PaddleOCR)

### Flow
1. Image upload → `POST /api/upload`
2. PaddleOCR container processes image
3. Text extracted → chunked → embedded
4. Original image stored for reference

### Container
- `mimotes-paddleocr-1` — Running on separate port
- Python + PaddleOCR library
- Supports: PNG, JPG, JPEG, BMP, TIFF

---

## PROCESSING QUEUE

- **Module:** `lib/processing-queue.ts`
- **Features:**
  - Async document processing
  - Status tracking (pending/processing/ready/failed)
  - Retry on failure
  - Progress updates via polling

---

## SEARCH SYSTEM

### Vector Search (pgvector)
- **Module:** `lib/rag/vectorstore.ts`
- **Method:** Cosine similarity
- **Index:** IVFFlat or HNSW
- **Dimensions:** 1536 (text-embedding-3-small) or adaptive

### Search API
- `GET /api/knowledge/search?q=...&limit=...`
- Returns ranked chunks with scores
