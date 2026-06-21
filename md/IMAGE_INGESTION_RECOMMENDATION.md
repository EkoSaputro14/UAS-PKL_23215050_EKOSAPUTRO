# IMAGE INGESTION RECOMMENDATION — ECC Critical Image Pipeline Audit

> **Report Type:** Product Decision & Technical Recommendations  
> **Date:** 2026-06-18  
> **Decision Required:** Should images without extractable text be accepted?  
> **Recommendation:** YES — with layered fallback strategies

---

## Executive Summary

The current image pipeline rejects **all images** that produce neither OCR text nor AI caption. This is a binary pass/fail design that fails 100% of the time due to configuration issues (network isolation + missing API key). More critically, even when fixed, it will reject all non-text images (product photos, plain photos, diagrams) which represent a significant portion of real-world image uploads.

**Recommendation:** Adopt a graduated acceptance strategy with multiple fallback layers, ensuring no image is ever silently rejected.

---

## Current State Analysis

### Rejection Logic

```
Current Pipeline:
├─ Input: Image upload
├─ Tier 1: Vision Provider → ❌ Not configured
├─ Tier 2: PaddleOCR → ❌ Network isolated
├─ Tier 3: REJECT → ⚠️ Always triggered
├─ Result: 100% rejection rate
└─ User sees: "Image rejected: no OCR text or caption"
```

### The Problem

| Scenario | Current Behavior | Desired Behavior |
|----------|------------------|------------------|
| Text image + working OCR | ✅ Embed chunks | ✅ Embed chunks |
| Text image + broken OCR | ❌ REJECT | ⚠️ Fallback to placeholder |
| No-text image + vision | ✅ Embed caption | ✅ Embed caption |
| No-text image + no vision | ❌ REJECT | ⚠️ Accept with metadata |
| Any image + any failure | ❌ REJECT | ✅ Always accept |

### Why REJECTION Is Wrong

1. **User uploaded it intentionally** — rejecting their upload damages trust
2. **Metadata is still valuable** — filename, date, type, dimensions
3. **Future OCR may improve** — re-processing pipeline can extract later
4. **Search by filename** — even metadata-only chunks enable basic search
5. **Zero is worse than something** — a placeholder chunk beats no chunk

---

## Recommendation: Graduated Acceptance Strategy

### Decision: YES — Accept all images

**Every image uploaded should create at least one chunk.** The chunk content varies by extraction success:

```
Priority Chain (highest to lowest):
├─ 1. Combined (OCR + Caption)     → Best quality
├─ 2. OCR-only                     → Good for text images
├─ 3. Caption-only                 → Good for no-text images  
├─ 4. Metadata-only                → Minimum viable
└─ 5. Placeholder                  → Last resort (NEVER reject)
```

---

## Fix #1: Configure Vision Provider (Priority: HIGH)

### What

Add a vision-capable API key to the database settings to enable Tier 1 extraction.

### Why

- Generates captions for no-text images (product photos, plain photos)
- Provides AI-powered OCR as backup to PaddleOCR
- Enables summary generation for rich metadata

### Implementation

#### Option A: Add OpenAI API Key (Recommended)

```sql
-- Add OpenAI API key for vision support
INSERT INTO settings (key, value) 
VALUES ('vision_api_key', 'sk-your-openai-api-key-here');

-- Optional: Override default vision model
INSERT INTO settings (key, value) 
VALUES ('vision_model', 'gpt-4o-mini');
```

#### Option B: Use Mimo Provider (If Supported)

```sql
-- Check if mimo-v2.5-pro supports vision input
-- If yes, configure vision to use same provider
INSERT INTO settings (key, value) 
VALUES ('vision_api_key', 'your-mimo-api-key');
INSERT INTO settings (key, value) 
VALUES ('vision_provider', 'mimo');
```

### Expected Outcome

```
Before: Vision available: false
After:  Vision available: true

Impact: Non-text images now get AI-generated captions
        Product photos → "A product photograph showing..."
        Plain photos → "A photograph of..."
```

### Cost Estimate

| Volume | Model | Cost per Image | Monthly (1000 imgs) |
|--------|-------|----------------|---------------------|
| Low | gpt-4o-mini | ~$0.003 | ~$3 |
| Medium | gpt-4o | ~$0.01 | ~$10 |
| High | gpt-4o | ~$0.01 | ~$100 (10K imgs) |

---

## Fix #2: Fix Docker Networking (Priority: CRITICAL)

### What

Connect the Next.js app container to the same Docker network as PaddleOCR.

### Why

- PaddleOCR works perfectly from the host
- Network isolation is the only barrier to OCR extraction
- Fixes 3/5 image categories immediately (text-containing images)

### Implementation

#### Option A: Connect App to PaddleOCR Network (Recommended)

```yaml
# docker-compose.yml
services:
  app:
    networks:
      - default          # Existing bridge network
      - mimotes_default  # Add PaddleOCR network
  
networks:
  mimotes_default:
    external: true       # Join existing network
```

#### Option B: Use Host Network Mode

```yaml
# docker-compose.yml
services:
  app:
    extra_hosts:
      - "paddleocr:host.docker.internal"
```

#### Option C: Use IP Address (Quick Fix)

```bash
# In image-processor.ts, change:
const PADDLEOCR_URL = 'http://paddleocr:8090';
// To:
const PADDLEOCR_URL = 'http://172.20.0.4:8090';
```

### Expected Outcome

```
Before: [ImageProcessor] PaddleOCR failed (3988ms): fetch failed
After:  [ImageProcessor] PaddleOCR: 122 chars extracted (6 blocks, 0.98 conf)

Impact: Text-containing images now processed successfully
        Property flyers, screenshots, documents → OCR chunks
```

### Effort & Risk

| Metric | Value |
|--------|-------|
| Effort | Low-Medium (config change) |
| Risk | Low (no code changes) |
| Downtime | 0 (rolling update) |
| Rollback | Easy (revert config) |

---

## Fix #3: Fallback Strategies for No-Text Images (Priority: MEDIUM)

### What

When both OCR and Vision fail (or are unavailable), accept the image with reduced metadata instead of rejecting.

### Why

- Zero rejection policy improves user experience
- Metadata still enables search and organization
- Future re-processing can upgrade chunks

### Fallback Strategy A: Metadata-Only Chunk

**Trigger:** OCR empty + Caption empty + Vision unavailable

```
Chunk Content:
┌─────────────────────────────────────────────────┐
│ Image: property-flyer.png                        │
│ Type: image/png                                  │
│ Size: 245.7 KB                                   │
│ Dimensions: 1200 x 800 px                        │
│ Uploaded: 2026-06-18T10:30:00Z                   │
│ Document ID: abc-123-def-456                      │
│                                                  │
│ [No text content extracted. OCR and captioning   │
│  services were unavailable at upload time.]       │
└─────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// In image-processor.ts — after Tier 3 rejection
if (!hasOCR && !hasCaption) {
  // NEW: Create metadata-only chunk instead of rejecting
  const metadataChunk = {
    content: `Image: ${fileName}\nType: ${mimeType}\nSize: ${fileSize}\n` +
             `Dimensions: ${width}x${height}\n` +
             `Uploaded: ${new Date().toISOString()}\n` +
             `[No text content extracted]`,
    type: 'image_metadata',
    chunk_index: 0,
    metadata: {
      extraction_method: 'metadata_only',
      ocr_available: false,
      caption_available: false,
      original_error: 'No OCR text or caption available'
    }
  };
  
  return {
    chunks: [metadataChunk],
    metadata: { extraction_method: 'metadata_only' }
  };
}
```

### Fallback Strategy B: AI-Generated Caption from Main Model

**Trigger:** Vision unavailable, use main AI provider

```
Flow:
1. Send image to main AI provider (Mimo/OpenAI) with caption request
2. AI generates description: "A product photograph showing a blue widget..."
3. Caption becomes chunk content
4. Chunk type: image_caption
```

**Implementation:**

```typescript
// In image-processor.ts — fallback after Tier 1 fails
async function generateCaptionWithMainModel(imageBase64: string): Promise<string> {
  const aiProvider = await getAIProvider(); // Use configured main provider
  
  const response = await aiProvider.chat({
    model: aiProvider.model, // e.g., mimo-v2.5-pro
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image in detail for search indexing.' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
      ]
    }],
    max_tokens: 200
  });
  
  return response.choices[0].message.content;
}
```

**Note:** This requires the main AI provider to support vision input. Verify mimo-v2.5-pro capabilities.

### Fallback Strategy C: Placeholder Chunk

**Trigger:** All extraction methods fail, no fallback possible

```
Chunk Content:
"Image uploaded on 2026-06-18 at 10:30 UTC. 
 File: property-flyer.png (245.7 KB, image/png).
 No text content could be extracted from this image."
```

**Implementation:**

```typescript
// Last resort — always creates at least one chunk
function createPlaceholderChunk(fileName: string, metadata: ImageMetadata): ImageChunk {
  return {
    content: `Image uploaded on ${new Date().toISOString()}. ` +
             `File: ${fileName} (${formatSize(metadata.size)}, ${metadata.mimeType}). ` +
             `No text content could be extracted from this image.`,
    type: 'image_placeholder',
    chunk_index: 0,
    metadata: {
      extraction_method: 'placeholder',
      filename: fileName,
      file_size: metadata.size,
      mime_type: metadata.mimeType
    }
  };
}
```

---

## Implementation Priority Roadmap

### Phase 1: Critical Fix (Day 1) — Docker Networking

```
Goal: Enable OCR for text-containing images
Effort: 2-4 hours
Impact: Unblocks 3/5 image categories (60%)

Steps:
1. Modify docker-compose.yml to connect app to mimotes_default network
2. Rebuild and restart containers
3. Test with property-flyer.png → expect 6 blocks, 0.98 conf
4. Verify from app container: wget http://paddleocr:8090/health
```

### Phase 2: Vision Configuration (Day 2) — API Key Setup

```
Goal: Enable captioning for non-text images
Effort: 1-2 hours
Impact: Unblocks remaining 2/5 image categories (40%)

Steps:
1. Add vision_api_key to database settings
2. Set vision_model to gpt-4o-mini (or preferred model)
3. Test with product-photo.png → expect AI caption
4. Verify Vision available: true in logs
```

### Phase 3: Fallback Strategies (Day 3-5) — Zero Rejection

```
Goal: Never reject any image upload
Effort: 8-16 hours
Impact: 100% image acceptance rate

Steps:
1. Implement metadata-only fallback (Strategy A)
2. Implement AI caption fallback (Strategy B)  
3. Implement placeholder chunk (Strategy C)
4. Remove rejection code path entirely
5. Add re-processing queue for failed images
6. Test all image categories
```

### Phase 4: Production Hardening (Week 2)

```
Goal: Production-ready image pipeline
Effort: 16-24 hours
Impact: Reliability, monitoring, cost optimization

Steps:
1. Add image processing queue (Bull/BullMQ)
2. Implement retry logic with exponential backoff
3. Add metrics dashboard (processing time, success rate)
4. Optimize PaddleOCR settings (batch size, confidence threshold)
5. Add image deduplication (hash-based)
6. Implement chunk versioning for re-processing
```

---

## Minimum Viable Fix (MVP)

### What to Do First

**Fix Docker networking.** This is the fastest, highest-impact fix.

```bash
# Quick test — connect app to PaddleOCR network
docker network connect mimotes_default mimotes-app-1

# Verify
docker exec mimotes-app-1 wget -qO- http://paddleocr:8090/health
# Expected: {"status":"ok","engine":"paddleocr","model_loaded":false}

# Upload test image
curl -X POST http://localhost:3000/api/upload -F "file=@test-image.png"
# Expected: 200 OK with chunkCount > 0
```

### Expected Impact

| Before MVP | After MVP |
|------------|-----------|
| 0% images embedded | 60% images embedded (text images) |
| 100% rejection rate | 40% rejection rate (non-text only) |
| 4s timeout per upload | <500ms per upload |
| User sees error | User sees success (for text images) |

---

## Cost-Benefit Analysis

### Fix 1: Docker Networking

| Metric | Value |
|--------|-------|
| Effort | 2-4 hours |
| Cost | $0 |
| Impact | 60% image acceptance |
| ROI | **Highest** — free fix, big impact |

### Fix 2: Vision API Key

| Metric | Value |
|--------|-------|
| Effort | 1-2 hours |
| Cost | ~$3-10/month |
| Impact | +40% image acceptance |
| ROI | **High** — small cost, completes coverage |

### Fix 3: Fallback Strategies

| Metric | Value |
|--------|-------|
| Effort | 8-16 hours |
| Cost | $0 (code changes only) |
| Impact | 100% image acceptance |
| ROI | **Medium** — more effort, but eliminates rejection |

### Combined ROI

```
Total Effort: 11-22 hours
Total Cost: ~$3-10/month (API calls)
Result: 100% image acceptance, zero rejections
Payback: Immediate (user satisfaction + data completeness)
```

---

## Risk Assessment

### Risk: Accepting Low-Quality Chunks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Metadata chunks dilute search results | Medium | Low | Filter by chunk_type in search |
| Placeholder chunks pollute vector store | Low | Low | Mark as low_priority in metadata |
| Cost overrun from vision API calls | Low | Medium | Set monthly budget limits |

### Risk: Implementation Failures

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Docker network change breaks other services | Low | High | Test in staging first |
| Vision API key leaks | Low | High | Use env vars, not DB |
| Fallback logic introduces bugs | Medium | Medium | Unit tests for each fallback |

---

## Success Metrics

### After Phase 1 (Docker Fix)

```
Target: 60% image acceptance rate
Metric: chunkCount > 0 for text-containing images
Test: Upload 5 text images → expect 5 successes
```

### After Phase 2 (Vision Config)

```
Target: 100% image acceptance rate
Metric: chunkCount > 0 for all image types
Test: Upload 10 diverse images → expect 10 successes
```

### After Phase 3 (Fallbacks)

```
Target: Zero rejections, ever
Metric: rejection_count == 0
Test: Upload 100 images (including invalid) → expect 0 rejections
```

---

## Decision Log

| Decision | Rationale | Made By | Date |
|----------|-----------|---------|------|
| Accept all images | Zero rejection improves UX | ECC Audit | 2026-06-18 |
| Fix networking first | Highest ROI, lowest effort | ECC Audit | 2026-06-18 |
| Vision API as P1 | Enables full coverage | ECC Audit | 2026-06-18 |
| Metadata chunks as minimum | Better than nothing | ECC Audit | 2026-06-18 |

---

## Appendix: Code Changes Required

### Change 1: Remove Rejection Path

```typescript
// lib/rag/image-processor.ts — REMOVE lines 262-270
// Replace with fallback logic (Strategy A, B, or C)
```

### Change 2: Update API Route Handler

```typescript
// app/api/upload/route.ts — lines 405-422
// Change: if (extraction_method === "rejected") → mark failed
// To: Always mark as "ready" (or "processed")
```

### Change 3: Add Metadata Chunk Generator

```typescript
// lib/rag/image-processor.ts — NEW function
function createMetadataChunk(fileName: string, metadata: ImageMetadata): ImageChunk
```

### Change 4: Add AI Caption Fallback

```typescript
// lib/rag/image-processor.ts — NEW function
async function generateCaptionFallback(imageBase64: string): Promise<string>
```

---

## Conclusion

The image pipeline should **never reject an image**. The current binary pass/fail design is too brittle. A graduated acceptance strategy with multiple fallback layers ensures:

1. **Every image gets at least one chunk** (metadata or placeholder)
2. **Text images get rich OCR chunks** (after network fix)
3. **Non-text images get AI captions** (after vision config)
4. **User trust is maintained** (no silent failures)

**Immediate action:** Fix Docker networking (2 hours) → Unblocks 60% of images.  
**Next step:** Configure Vision API (1 hour) → Unblocks remaining 40%.  
**Long-term:** Implement fallback strategies → Eliminates rejection entirely.

---

*Report generated for ECC Critical Image Pipeline Audit*  
*Previous: OCR_HEALTH_REPORT.md | End of audit report series*
