# 🔧 IMAGE HOTFIX REPORT — ECC Pipeline Fix

**Date**: June 18, 2026
**Status**: ✅ COMPLETE — All 3 phases verified
**Duration**: ~10 minutes implementation

---

## Executive Summary

Image upload pipeline was completely broken due to:
1. Docker network isolation (app container couldn't reach PaddleOCR)
2. Missing `fts_vector` column + trigger conflicts
3. Hard rejection of images with no OCR text

All 3 issues fixed. All image types now upload successfully.

---

## PHASE 1: Docker Networking ✅

### Problem
- `mimotes-app` container on **bridge network** (172.17.0.x)
- `mimotes-paddleocr-1` on **mimotes_default** (172.20.0.x)
- DNS resolution failed: `wget: bad address 'paddleocr:8090'`

### Fix
- Stopped standalone `mimotes-app` container
- Rebuilt via `docker compose up -d --build app`
- Both services now on `mimotes_default` network

### Verification
```
$ docker exec mimotes-app-1 wget -qO- http://paddleocr:8090/health
{"status":"ok","engine":"paddleocr","model_loaded":true}
```

**Key Insight**: The `docker-compose.yml` already had correct `PADDLEOCR_URL: http://paddleocr:8090` and both services share the default network. The problem was running `docker run` (standalone) instead of `docker compose`.

---

## PHASE 2: Image Upload Testing ✅

### Test Matrix

| # | Image Type | File | OCR Chars | Chunk Type | Status |
|---|-----------|------|-----------|------------|--------|
| 1 | Property Flyer | test-property-flyer.png | 165 chars | `image_ocr` | ✅ ready |
| 2 | Screenshot | test-screenshot.png | 125 chars | `image_ocr` | ✅ ready |
| 3 | Scanned Document | test-scanned-doc.png | 243 chars | `image_ocr` | ✅ ready |
| 4 | No-Text Image | test-no-text-image.png | 0 chars | `image_caption` | ✅ ready |

### OCR Results (via PaddleOCR from container)

**Property Flyer** (PaddleOCR):
```
RUMAH DIJUAL -CITRA RAYA
Tipe: 45/120
Harga: Rp850.000.000
3 Kamar Tidur, 2 Kamar Mandi
Garasi mobil, taman asri
Cluster premium dekat mall
Hubungi: 0812-3456-7890
Email: agent@properti.com
```

**Scanned Document** (PaddleOCR):
```
SURAT PERNYATAAN
Nomor: 001/SP/VI/2026
Nama: Budi Santoso
NIK: 3201234567890123
Alamat JL Merdeka No. 10
RT001/RW 005, Kel. Sukamaju
```

**Screenshot** (PaddleOCR):
```
Dashboard - Mimotes Admin
Total Documents 24
Active Users: 12
Total Chunks: 1,247
Storage Used: 2.4GB
Messages Today: 342
```

---

## PHASE 3: Metadata Fallback ✅

### Problem
```typescript
// OLD: Hard rejection
if (!hasOCR && !hasCaption) {
  // REJECT — image lost forever
  extractionMethod = "rejected";
}
```

### Fix — `lib/rag/image-processor.ts`
```typescript
// NEW: Metadata fallback
if (!hasOCR && !hasCaption) {
  extractionMethod = "metadata";
  caption = `Image uploaded on ${date}`;
  summary = `Image (${width}x${height} pixels). No text could be extracted.`;
}
```

### Fix — `generateImageChunks()`
```typescript
// Creates metadata chunk for no-text images
if (metadata.extraction_method === "metadata" && !hasOCR && !hasCaption) {
  chunks.push({
    content: caption || summary || "Image uploaded without extracted text",
    chunk_type: "image_caption",
    ocr_text: "",
    caption: caption || "Image metadata",
    image_summary: summary,
    image_url: imageUrl,
    metadata,
  });
}
```

### Verification — No-Text Image
```
[ImageProcessor] PaddleOCR: 0 blocks, 0 chars, confidence=0.00
[ImageProcessor] No OCR/caption for test-no-text-image.png. Using metadata fallback. Dimensions: 400x400
[Processing] 1 image chunks in 0ms
[Processing] IMAGE COMPLETE — 1 chunks, total 817ms
```

DB record:
```json
{
  "content": "Image uploaded on 2026-06-18",
  "chunk_type": "image_caption",
  "ocr_text": "",
  "caption": "Image uploaded on 2026-06-18",
  "image_summary": "Image (400x400 pixels). No text could be extracted.",
  "status": "ready"
}
```

---

## Bonus Fix: Upload Permission Error

### Problem
```
EACCES: permission denied, open '/app/public/uploads/...'
```

The `uploads_data` Docker volume was owned by `root:root` but the app runs as `nextjs` user.

### Fix
```bash
docker exec -u root mimotes-app-1 chown -R nextjs:nogroup /app/public/uploads/
```

---

## Database Fixes Applied (Pre-Hotfix)

1. **`fts_vector` column**: `ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS fts_vector tsvector;`
2. **Duplicate trigger cleanup**: Removed duplicate `trg_update_fts_vector` trigger

---

## Success Criteria Met

| Criterion | Before | After | Status |
|-----------|--------|-------|--------|
| Text images embed | ❌ EACCES / rejected | ✅ `image_ocr` chunks | ✅ |
| No-text images accepted | ❌ "Image rejected" | ✅ `image_caption` metadata chunk | ✅ |
| Image upload never fails | ❌ All image uploads failed | ✅ 4/4 successful | ✅ |
| PaddleOCR from Docker | ❌ DNS resolution failed | ✅ 200 OK, model loaded | ✅ |

---

## Non-Blocking Issue: Analytics FK Error

```
Error: insert or update on table "workspace_members" violates foreign key constraint
"workspace_members_user_id_fkey"
```

This occurs in `recordAnalyticsEvent()` and does NOT affect upload processing. The upload pipeline logs it but continues. Needs separate investigation.

---

## Files Modified

| File | Change |
|------|--------|
| `lib/rag/image-processor.ts` | Metadata fallback (replaces hard rejection) |
| `docker-compose.yml` | Already correct — `PADDLEOCR_URL: http://paddleocr:8090` |
| Docker container permissions | `chown -R nextjs:nogroup /app/public/uploads/` |

## Files NOT Modified (no rebuild needed)

- `app/api/upload/route.ts` — already has RLS transaction, handles `metadata` extraction type correctly
- `docker-entrypoint.sh` — already generates Prisma client at runtime

---

## Deployment Steps (for future reference)

```bash
# 1. Stop any standalone containers
docker stop mimotes-app

# 2. Rebuild and deploy via docker compose
cd ~/mimotes
DOCKER_BUILDKIT=0 docker compose up -d --build app

# 3. Fix upload permissions (after first start)
docker exec -u root mimotes-app-1 chown -R nextjs:nogroup /app/public/uploads/

# 4. Verify
docker exec mimotes-app-1 wget -qO- http://paddleocr:8090/health
curl -s http://localhost:3100/api/auth/session  # check session
```
