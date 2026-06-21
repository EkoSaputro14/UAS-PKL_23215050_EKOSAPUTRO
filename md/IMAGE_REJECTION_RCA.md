# IMAGE REJECTION ROOT CAUSE ANALYSIS — ECC Critical Image Pipeline Audit

> **Report Type:** Root Cause Analysis (RCA)  
> **Date:** 2026-06-18  
> **Severity:** Critical — 100% image rejection rate  
> **Impact:** All image uploads marked as failed, zero vector embeddings created

---

## Executive Summary

Every image uploaded to Mimotes is rejected by the image processing pipeline. The rejection occurs at `lib/rag/image-processor.ts` lines 262-270 when **both** OCR text extraction and AI captioning fail simultaneously. Two independent root causes have been identified:

1. **Vision Provider Not Configured** — No API key for vision model
2. **PaddleOCR Network Isolation** — Docker containers on different networks cannot communicate

---

## The Rejection Condition

### Source Code Location

**File:** `lib/rag/image-processor.ts`  
**Lines:** 262-270

```typescript
// Rejection condition (lines 262-270)
const hasOCR = ocrText.length > 10;       // OCR must have >10 chars
const hasCaption = caption.length > 0;     // Any non-empty caption

if (!hasOCR && !hasCaption) {
  console.log(
    `[ImageProcessor] REJECTED: No OCR text or caption for ${fileName}. ` +
    `Vision available: false, PaddleOCR: 0 chars. Image will NOT be embedded.`
  );
  return {
    chunks: [],
    metadata: {
      extraction_method: "rejected",
      ocr_available: false,
      caption_available: false
    }
  };
}
```

### Condition Truth Table

| OCR Text | Caption | hasOCR | hasCaption | Result |
|----------|---------|--------|------------|--------|
| 0 chars | empty | false | false | ❌ REJECTED |
| 0 chars | "A cat" | false | true | ✅ Accepted (caption chunk) |
| 15 chars | empty | true | false | ✅ Accepted (OCR chunk) |
| 15 chars | "A cat" | true | true | ✅ Accepted (combined chunk) |
| 5 chars | empty | false | false | ❌ REJECTED (< 10 char threshold) |

### Downstream Rejection Handler

**File:** `app/api/upload/route.ts`  
**Lines:** 405-422

```typescript
// Post-processing rejection handler
if (result.metadata.extraction_method === "rejected") {
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "failed",
      metadata: {
        ...existingMetadata,
        error: "Image rejected: no OCR text or caption",
        extraction_method: "rejected",
        rejection_reason: "No text content extractable"
      }
    }
  });
  
  return NextResponse.json({
    success: false,
    error: "Image rejected: no OCR text or caption",
    documentId
  }, { status: 422 });
}
```

---

## Root Cause #1: Vision Provider Not Configured

### Discovery

```
Evidence:
├─ Log output: "Vision available: false"
├─ DB query: SELECT key, value FROM settings WHERE key = 'vision_api_key'
│   └─ Result: (no rows)
├─ Default model: gpt-4o-mini (hardcoded in vision-provider.ts)
├─ But gpt-4o-mini requires OpenAI API key → not configured
└─ mimo-v2.5-pro (configured provider) may not support vision input
```

### How It Should Work

```
Vision Provider Flow:
1. Check DB for vision_api_key setting
2. If key exists:
   a. Send image as base64 to vision model
   b. Model performs: OCR + Caption + Summary
   c. Returns structured extraction result
   d. Pipeline proceeds with caption/summary
3. If no key:
   a. Falls back to next tier (PaddleOCR)
```

### Why It Fails

```
Configuration Chain:
├─ vision_api_key: NOT SET in DB
├─ Falls back to gpt-4o-mini default
├─ gpt-4o-mini requires OpenAI API key
├─ OpenAI API key: NOT SET in DB
└─ Result: Tier 1 completely unavailable
    └─ Vision available: false
```

### Impact Assessment

| Metric | Value |
|--------|-------|
| Tier 1 success rate | 0% (not configured) |
| Affected image types | ALL (but critical for non-text images) |
| Fix effort | Low — add API key to DB settings |
| Risk | Medium — API costs for vision calls |

---

## Root Cause #2: PaddleOCR Network Isolation

### Discovery

```
Evidence:
├─ Docker log: [ImageProcessor] PaddleOCR failed (3988ms): fetch failed
├─ Container networking:
│   ├─ App container (mimotes-app-1): 172.17.0.2 (bridge network)
│   ├─ PaddleOCR container (mimotes-paddleocr-1): 172.20.0.4 (mimotes_default)
│   └─ Networks: Different Docker networks
├─ DNS resolution test from app container:
│   └─ wget: bad address 'paddleocr:8090'
├─ Direct test from host:
│   └─ curl http://localhost:8090/health → {"status":"ok"} ✅
└─ Conclusion: Network isolation prevents inter-container communication
```

### Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│ HOST (Windows)                                               │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │ Bridge Network       │    │ mimotes_default Network     │  │
│  │ (172.17.0.0/16)     │    │ (172.20.0.0/16)            │  │
│  │                      │    │                              │  │
│  │ ┌──────────────────┐ │    │ ┌──────────────────────────┐│  │
│  │ │ mimotes-app-1    │ │    │ │ mimotes-paddleocr-1     ││  │
│  │ │ IP: 172.17.0.2   │ │ ✖ │ │ IP: 172.20.0.4          ││  │
│  │ │ (Next.js app)    │──────│ │ (PaddleOCR sidecar)     ││  │
│  │ └──────────────────┘ │    │ └──────────────────────────┘│  │
│  └─────────────────────┘    └─────────────────────────────┘  │
│                                                              │
│  ⚠️ CROSS-NETWORK DNS RESOLUTION FAILS                       │
│  ⚠️ wget: bad address 'paddleocr:8090'                       │
└─────────────────────────────────────────────────────────────┘
```

### Evidence from Docker Logs

```
[ImageProcessor] Attempting PaddleOCR at http://paddleocr:8090
[ImageProcessor] PaddleOCR failed (3988ms): fetch failed
```

- **3988ms** — This is the timeout duration before the fetch fails
- **fetch failed** — Node.js fetch cannot resolve the hostname across networks
- **No TCP connection** — DNS fails before any connection is attempted

### Why It Fails

```
Request Path:
1. App container receives image
2. processImage() calls Tier 2 (PaddleOCR)
3. HTTP request to http://paddleocr:8090
4. DNS lookup for "paddleocr" → FAILS
   ├─ App is on bridge network (172.17.0.x)
   ├─ PaddleOCR is on mimotes_default (172.20.0.x)
   ├─ Docker DNS only resolves within same network
   └─ Result: "bad address 'paddleocr:8090'"
5. Request fails after ~4s timeout
6. Tier 2 marked as unavailable
7. Falls to Tier 3: REJECT
```

### Impact Assessment

| Metric | Value |
|--------|-------|
| Tier 2 success rate | 0% (from container) |
| Direct API success rate | 100% (from host) |
| Affected image types | ALL text-containing images |
| Fix effort | Medium — Docker network reconfiguration |
| Risk | Low — just a config change |

---

## Combined Failure Cascade

```
Timeline of a Single Image Upload:

T+0ms     Image uploaded to POST /api/upload
T+1ms     File parsed, validated, saved
T+2ms     processImageDocument() called
T+3ms     processImage() begins 3-tier extraction

T+4ms     TIER 1: Vision Provider
          ├─ Check DB for vision_api_key → NOT FOUND
          ├─ Vision available: false
          └─ Tier 1: SKIPPED (0ms)

T+5ms     TIER 2: PaddleOCR
          ├─ HTTP POST to http://paddleocr:8090
          ├─ DNS lookup: "paddleocr" → FAIL
          ├─ Waiting for timeout...
T+3993ms  ├─ Timeout after 3988ms
          └─ Tier 2: FAILED (3988ms)

T+3994ms  TIER 3: REJECT
          ├─ hasOCR = false (0 chars)
          ├─ hasCaption = false (0 chars)
          ├─ !hasOCR && !hasCaption → TRUE
          ├─ Log: [ImageProcessor] REJECTED: No OCR text or caption...
          └─ Returns: { chunks: [], metadata: { extraction_method: "rejected" } }

T+3995ms  API Route Post-Processing
          ├─ extraction_method === "rejected"
          ├─ Document status → "failed"
          ├─ Error: "Image rejected: no OCR text or caption"
          └─ Response: 422 Unprocessable Entity

TOTAL TIME: ~4 seconds per image upload (wasted on timeout)
USER EXPERIENCE: Upload fails with generic error message
```

---

## Log Evidence Collection

### From Application Container

```
[ImageProcessor] Processing image: property-flyer.png
[ImageProcessor] Vision available: false (no API key configured)
[ImageProcessor] Attempting PaddleOCR at http://paddleocr:8090
[ImageProcessor] PaddleOCR failed (3988ms): fetch failed
[ImageProcessor] REJECTED: No OCR text or caption for property-flyer.png. Vision available: false, PaddleOCR: 0 chars. Image will NOT be embedded.
```

### From Docker Daemon

```
mimotes-paddleocr-1: Health check passed
mimotes-paddleocr-1: GET /health → 200 OK
mimotes-app-1: [ImageProcessor] PaddleOCR failed (3988ms): fetch failed
```

### PaddleOCR Container Logs (Direct Access)

```
INFO: PaddleOCR server started on port 8090
INFO: Health endpoint active
INFO: Model lazy-loading enabled (loads on first request)
```

---

## Fix Priority Matrix

| Fix | Root Cause | Effort | Impact | Priority |
|-----|-----------|--------|--------|----------|
| Fix Docker networking | PaddleOCR unreachable | Medium | High (enables OCR) | **P0** |
| Configure vision API key | No caption generation | Low | Medium (enables captions) | **P1** |
| Add fallback strategies | Non-text images rejected | High | Medium (improves coverage) | **P2** |

---

## Verification Plan

### After Fix #1 (Docker networking):
```bash
# From app container
docker exec mimotes-app-1 wget -qO- http://paddleocr:8090/health
# Expected: {"status":"ok","engine":"paddleocr","model_loaded":false}
```

### After Fix #2 (Vision API key):
```bash
# Check DB setting
psql -c "SELECT key, value FROM settings WHERE key = 'vision_api_key'"
# Expected: 1 row with valid API key

# Upload test image
curl -X POST http://localhost:3000/api/upload -F "file=@test.png"
# Expected: 200 OK with chunkCount > 0
```

---

## Conclusion

The image rejection is caused by **two independent failures** occurring simultaneously:

1. **Vision Provider**: No API key configured → Tier 1 unavailable
2. **PaddleOCR**: Network isolation → Tier 2 unreachable

**Both** tiers must be fixed for complete coverage:
- Fix #1 (networking) enables text-containing images (flyers, screenshots, documents)
- Fix #2 (vision) enables non-text images (product photos, plain photos)

**Minimum viable fix**: Fix Docker networking first — PaddleOCR works perfectly from host, it's just unreachable from the app container.

---

*Report generated for ECC Critical Image Pipeline Audit*  
*Previous: IMAGE_PIPELINE_TRACE.md | Next: IMAGE_UPLOAD_MATRIX.md*
