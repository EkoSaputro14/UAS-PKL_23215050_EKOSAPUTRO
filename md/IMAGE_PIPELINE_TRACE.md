# IMAGE PIPELINE TRACE — ECC Critical Image Pipeline Audit

> **Report Type:** End-to-End Flow Trace  
> **Date:** 2026-06-18  
> **Status:** 🔴 Pipeline Broken — Image Ingestion Non-Functional  
> **Severity:** Critical (All image uploads fail)

---

## Executive Summary

The image processing pipeline in Mimotes follows a well-structured 3-tier extraction flow but is **currently non-functional** due to two independent root causes: Vision provider misconfiguration and Docker network isolation of PaddleOCR. Every image uploaded through the system is **rejected** — zero images have been successfully embedded into the vector store.

---

## Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         IMAGE UPLOAD PIPELINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Client Upload                                                   │
│     └─ POST /api/upload                                             │
│        └─ File: app/api/upload/route.ts (line 132)                  │
│                                                                     │
│  2. API Route Processing                                            │
│     └─ File: app/api/upload/route.ts (lines 132, 179, 250, 352+)   │
│        ├─ Parse multipart form data                                 │
│        ├─ Validate file type (image/* MIME detection)               │
│        ├─ Save to /uploads directory                                │
│        └─ Call processImageDocument()                               │
│                                                                     │
│  3. Document Processing                                             │
│     └─ processImageDocument()                                       │
│        └─ Calls processImage() — 3-tier extraction                  │
│                                                                     │
│  4. 3-Tier Extraction (lib/rag/image-processor.ts)                  │
│     ├─ TIER 1: Vision Model ────────────────── ❌ FAILED            │
│     │   ├─ VisionProvider interface (lib/rag/vision-provider.ts)    │
│     │   ├─ Default model: gpt-4o-mini                               │
│     │   ├─ Requires: vision_api_key in DB settings                  │
│     │   ├─ Output: OCR text + Caption + Summary                     │
│     │   └─ Status: NO API KEY CONFIGURED → Vision available: false  │
│     │                                                                │
│     ├─ TIER 2: PaddleOCR ────────────────────── ❌ FAILED           │
│     │   ├─ Sidecar API: http://paddleocr:8090                       │
│     │   ├─ Expected output: OCR text blocks                         │
│     │   ├─ Container IP: 172.20.0.4 (mimotes_default network)       │
│     │   ├─ App container: 172.17.0.2 (bridge network)               │
│     │   └─ Status: DNS RESOLUTION FAILS → fetch failed              │
│     │                                                                │
│     └─ TIER 3: REJECT ────────────────────────── ✅ (fallback)      │
│         ├─ Condition: no OCR text AND no caption                    │
│         └─ Result: 0 chunks created, document marked "failed"       │
│                                                                     │
│  5. Chunk Generation (generateImageChunks)                          │
│     ├─ Chunk types:                                                 │
│     │   ├─ image_combined — OCR + caption merged                    │
│     │   ├─ image_ocr     — pure OCR text only                       │
│     │   └─ image_caption — AI-generated caption only                │
│     ├─ Min OCR text: 10 characters for valid OCR                    │
│     └─ Status: NEVER REACHED (rejection at tier 3)                  │
│                                                                     │
│  6. Embedding Generation                                            │
│     └─ generateEmbeddings (API or local fallback)                   │
│        └─ Status: NEVER REACHED                                     │
│                                                                     │
│  7. Vector Store                                                    │
│     └─ storeChunks → pgvector (document_chunks table)               │
│        └─ Status: NEVER REACHED                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: API Route — `app/api/upload/route.ts`

**File:** `app/api/upload/route.ts`

| Line | Function | Description |
|------|----------|-------------|
| 132 | File parsing | Multipart form data extraction, file type detection |
| 179 | Validation | File type whitelist check, size limits |
| 250 | Processing | Calls `processImageDocument()` with file path |
| 352+ | Post-processing | Handles result, updates document status in DB |

### API Route Flow

```
POST /api/upload
├─ line 132: Parse multipart form → extract file buffer
├─ line 179: Validate MIME type → image/png, image/jpeg, etc.
├─ line 250: processImageDocument(filePath, documentId)
│   └─ Returns: { chunks[], metadata }
├─ line 405-422: Check extraction_method === "rejected"
│   └─ If rejected: update document status to "failed"
│   └─ Error: "Image rejected: no OCR text or caption"
└─ Return: { success, documentId, chunkCount }
```

---

## Stage 2: Image Processor — `lib/rag/image-processor.ts`

**File:** `lib/rag/image-processor.ts`

### 3-Tier Extraction Priority

#### TIER 1: Vision Model (`VisionProvider` interface)
**File:** `lib/rag/vision-provider.ts`

```
VisionProvider Interface:
├─ model: gpt-4o-mini (default)
├─ requires: vision_api_key in DB settings
├─ capabilities: OCR + Caption + Summary
├─ timeout: ~10-30s
└─ current status: ❌ NOT CONFIGURED
    ├─ No vision_api_key in database
    ├─ Falls back to gpt-4o-mini but no OpenAI key
    └─ mimo-v2.5-pro may not support vision
```

**How it works:**
1. Checks DB for `vision_api_key` setting
2. If found → sends image as base64 to vision model
3. Model performs OCR, generates caption, creates summary
4. Returns structured result with all three text types

**Current failure:** No API key configured → returns `Vision available: false`

#### TIER 2: PaddleOCR Sidecar
```
PaddleOCR Sidecar:
├─ Endpoint: http://paddleocr:8090
├─ Container: mimotes-paddleocr-1
├─ Network: mimotes_default (172.20.0.4)
├─ App network: bridge (172.17.0.2)
└─ current status: ❌ NETWORK ISOLATED
    ├─ DNS resolution fails: wget: bad address 'paddleocr:8090'
    ├─ Docker log evidence: [ImageProcessor] PaddleOCR failed (3988ms): fetch failed
    └─ PaddleOCR works perfectly when accessed from host
```

**How it works:**
1. Sends image to PaddleOCR sidecar via HTTP POST
2. PaddleOCR runs OCR using PaddlePaddle engine
3. Returns text blocks with bounding boxes and confidence
4. Processor combines blocks into single OCR text string
5. Requires minimum 10 characters to be considered valid OCR

**Current failure:** Network isolation — containers on different Docker networks

#### TIER 3: REJECT
```
REJECTION LOGIC:
├─ Condition: !hasOCR && !hasCaption
│   ├─ hasOCR = (ocrText.length > 10)
│   └─ hasCaption = (caption.length > 0)
├─ Log: [ImageProcessor] REJECTED: No OCR text or caption for ${fileName}.
│        Vision available: false, PaddleOCR: 0 chars. Image will NOT be embedded.
└─ Result: Returns metadata with extraction_method = "rejected"
```

---

## Stage 3: Chunk Generation — `generateImageChunks()`

**Status: NEVER REACHED** — Pipeline rejects at Tier 3 before chunk generation.

### Designed Chunk Types

| Chunk Type | Description | Content |
|------------|-------------|---------|
| `image_combined` | OCR + Caption merged | Full OCR text + AI caption combined |
| `image_ocr` | OCR text only | Raw OCR extracted text |
| `image_caption` | Caption only | AI-generated image description |

### Minimum Thresholds

| Parameter | Value | Description |
|-----------|-------|-------------|
| Min OCR text | 10 chars | OCR result must have >10 chars to be valid |
| Min caption | 1 char | Any non-empty caption is valid |
| Min confidence | 0.50 | PaddleOCR blocks below this are filtered |

---

## Stage 4: Embedding Generation

**Status: NEVER REACHED**

```
generateEmbeddings(chunks[])
├─ Provider: API-based (OpenAI, Mimo, etc.) or local fallback
├─ Model: text-embedding-ada-002 (1536 dimensions)
├─ Batch size: configurable
└─ Fallback: Local embedding if API fails
```

---

## Stage 5: Vector Store — `lib/rag/vectorstore.ts`

**Status: NEVER REACHED**

```
storeChunks(documentId, chunks[])
├─ Table: document_chunks (pgvector)
├─ Columns: id, document_id, content, embedding (vector_1536), chunk_index, metadata
├─ Index: ivfflat or hnsw for cosine similarity
└─ Method: INSERT ... VALUES with vector
```

---

## Blocker Summary

| Stage | Component | Status | Root Cause |
|-------|-----------|--------|------------|
| Tier 1 | Vision Provider | ❌ | No vision_api_key in DB, no OpenAI key |
| Tier 2 | PaddleOCR | ❌ | Docker network isolation (bridge vs mimotes_default) |
| Tier 3 | Rejection | ⚠️ | Both tiers fail → no extraction possible |
| Chunks | generateImageChunks | ❌ | Never reached (blocked by rejection) |
| Embeddings | generateEmbeddings | ❌ | Never reached |
| Store | storeChunks | ❌ | Never reached |

---

## Key Code References

| File | Lines | Purpose |
|------|-------|---------|
| `app/api/upload/route.ts` | 132 | File parsing entry point |
| `app/api/upload/route.ts` | 179 | File type validation |
| `app/api/upload/route.ts` | 250 | processImageDocument call |
| `app/api/upload/route.ts` | 352+ | Post-processing, DB status update |
| `app/api/upload/route.ts` | 405-422 | Rejection handling → mark as failed |
| `lib/rag/image-processor.ts` | 262-270 | Rejection condition: `!hasOCR && !hasCaption` |
| `lib/rag/image-processor.ts` | — | processImage 3-tier logic |
| `lib/rag/vision-provider.ts` | — | VisionProvider interface definition |

---

## Timeline of Failure

```
1. User uploads image → POST /api/upload
2. API route parses file (line 132) ✅
3. Validates file type (line 179) ✅
4. Calls processImageDocument() (line 250) ✅
5. TIER 1: Vision model check → no API key → SKIPPED ❌
6. TIER 2: PaddleOCR fetch → DNS resolution fails → SKIPPED ❌
7. TIER 3: !hasOCR && !hasCaption → REJECTED ⚠️
8. Log: [ImageProcessor] REJECTED: No OCR text or caption...
9. extraction_method === "rejected" (line 405) → document marked failed
10. User sees: "Image rejected: no OCR text or caption"
```

---

*Report generated for ECC Critical Image Pipeline Audit*  
*Next report: IMAGE_REJECTION_RCA.md — Root Cause Analysis*
