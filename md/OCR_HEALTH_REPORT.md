# OCR HEALTH REPORT — ECC Critical Image Pipeline Audit

> **Report Type:** Service Health Assessment  
> **Date:** 2026-06-18  
> **Service:** PaddleOCR Sidecar Container  
> **Status:** 🟡 Container Healthy, Network Isolated

---

## Executive Summary

The PaddleOCR sidecar container (`mimotes-paddleocr-1`) is **running and healthy** from the Docker host perspective. Health checks pass, the API responds correctly, and OCR processing works when accessed directly from the host. However, the container is **unreachable from the Next.js application container** due to Docker network isolation.

**Container Health:** ✅ Healthy  
**API Functionality:** ✅ Working (from host)  
**Network Accessibility:** ❌ Isolated (from app container)  
**Overall:** ⚠️ Operational but unreachable by dependent service

---

## Container Status

### Container Information

| Property | Value |
|----------|-------|
| Container Name | `mimotes-paddleocr-1` |
| Image | PaddleOCR sidecar (custom) |
| Status | Running |
| Uptime | 4+ hours |
| Health Status | **healthy** |
| Restart Count | 0 |

### Resource Allocation

| Resource | Current Usage | Limit |
|----------|--------------|-------|
| CPU | Low (idle) | Unbounded |
| Memory | ~200MB (model unloaded) | 2GB |
| Network | Minimal (health checks only) | Shared |

---

## Health Endpoint

### Request

```
GET http://localhost:8090/health
```

### Response

```json
{
  "status": "ok",
  "engine": "paddleocr",
  "model_loaded": false
}
```

### Health Check Analysis

| Field | Value | Meaning |
|-------|-------|---------|
| `status` | `"ok"` | Service is operational |
| `engine` | `"paddleocr"` | Correct engine identified |
| `model_loaded` | `false` | **Lazy loading** — model loads on first real request |

### Model Loading Behavior

```
Model Loading Flow:
├─ Initial state: model_loaded = false
├─ On first OCR request:
│   ├─ Model loads into memory (~200-500MB)
│   ├─ First request takes 2-5s (cold start)
│   ├─ Subsequent requests <500ms (warm)
│   └─ model_loaded → true (stays loaded)
└─ Memory: Released only on container restart
```

**Note:** The `model_loaded: false` state is **expected behavior** — PaddleOCR uses lazy loading. The model loads automatically on the first real OCR request.

---

## Network Configuration

### Container Network Details

| Property | Value |
|----------|-------|
| Network Name | `mimotes_default` |
| Container IP | `172.20.0.4` |
| Port Mapping | `0.0.0.0:8090 → 8090/tcp` |
| Protocol | TCP (HTTP) |

### Network Topology

```
┌──────────────────────────────────────────────────────────┐
│ Docker Host                                               │
│                                                           │
│  Network: bridge (172.17.0.0/16)                          │
│  ┌─────────────────────┐                                  │
│  │ mimotes-app-1       │                                  │
│  │ IP: 172.17.0.2      │                                  │
│  │ Next.js Application │                                  │
│  └─────────┬───────────┘                                  │
│            │ ❌ Cannot reach paddleocr:8090                │
│            │ DNS: "bad address"                            │
│            │                                               │
│  Network: mimotes_default (172.20.0.0/16)                 │
│  ┌─────────────────────┐                                  │
│  │ mimotes-paddleocr-1 │                                  │
│  │ IP: 172.20.0.4      │                                  │
│  │ PaddleOCR Sidecar   │                                  │
│  │ Port: 8090          │                                  │
│  └─────────────────────┘                                  │
│                                                           │
│  Port Mapping: 0.0.0.0:8090 → 172.20.0.4:8090            │
│  (Accessible from host via localhost:8090)                 │
└──────────────────────────────────────────────────────────┘
```

---

## API Test Results

### Direct Access (From Host) — ✅ PASS

```
Test: curl -s http://localhost:8090/health
Result: {"status":"ok","engine":"paddleocr","model_loaded":false}
Status: 200 OK
Time: ~50ms
```

```
Test: OCR Processing (property-flyer.png)
Result: 6 text blocks, 122 characters, 0.98 confidence
Status: 200 OK
Time: 405ms
```

### From App Container — ❌ FAIL

```
Test: wget -qO- http://paddleocr:8090/health (from mimotes-app-1)
Result: wget: bad address 'paddleocr:8090'
Status: DNS resolution failure
Time: ~3988ms (timeout)
```

```
Test: Node.js fetch() to http://paddleocr:8090/ocr
Result: fetch failed
Status: Network error
Time: 3988ms (timeout)
Log: [ImageProcessor] PaddleOCR failed (3988ms): fetch failed
```

---

## Docker Logs Analysis

### PaddleOCR Container Logs

```
[INFO] PaddleOCR sidecar server started on port 8090
[INFO] Health endpoint active at /health
[INFO] OCR endpoint active at /ocr
[INFO] Lazy loading enabled — model loads on first request
[INFO] Health check: GET /health → 200 OK (repeated)
```

**Observation:** Only health check requests appear in logs. No OCR processing requests from the app container — confirming network isolation.

### Application Container Logs

```
[ImageProcessor] Processing image: test-image.png
[ImageProcessor] Vision available: false (no API key configured)
[ImageProcessor] Attempting PaddleOCR at http://paddleocr:8090
[ImageProcessor] PaddleOCR failed (3988ms): fetch failed
[ImageProcessor] REJECTED: No OCR text or caption for test-image.png.
                  Vision available: false, PaddleOCR: 0 chars.
                  Image will NOT be embedded.
```

**Key Observations:**
1. PaddleOCR attempt logged with 3988ms timeout
2. `fetch failed` confirms network-level failure (not application error)
3. Vision unavailable noted alongside PaddleOCR failure
4. Rejection occurs immediately after timeout

---

## Error Analysis

### Error #1: Network Isolation (Primary)

```
Error: DNS resolution failure
Symptom: "wget: bad address 'paddleocr:8090'" / "fetch failed"
Cause: App container (bridge network) cannot resolve PaddleOCR hostname
Impact: 100% of OCR requests fail
Timeout: 3988ms
```

### Error #2: Tiny Image Edge Case (Minor)

```
Error: 'NoneType' object has no attribute 'shape'
Symptom: Exception when processing 1x1 pixel image
Cause: PaddleOCR cannot process images smaller than minimum dimensions
Impact: Edge case — only affects tiny/degenerate images
Severity: Low (expected behavior for invalid input)
```

**Note:** This error is expected and handled — 1x1 pixel images are not valid input for OCR processing.

---

## Port Mapping Verification

### Docker Port Configuration

```yaml
# docker-compose.yml (PaddleOCR service)
services:
  paddleocr:
    ports:
      - "0.0.0.0:8090:8090"  # Host:Container
    networks:
      - mimotes_default
```

### Port Accessibility Matrix

| Source | Target | Port | Status | Method |
|--------|--------|------|--------|--------|
| Host | PaddleOCR | 8090 | ✅ Accessible | localhost:8090 |
| App Container | PaddleOCR | 8090 | ❌ Unreachable | paddleocr:8090 (DNS fail) |
| Other containers | PaddleOCR | 8090 | ❓ Unknown | Not tested |

---

## Lazy Loading Behavior

### Current State

```
model_loaded: false
├─ No model in memory
├─ Health checks pass (no model needed)
├─ First OCR request triggers load
└─ Memory usage: ~200MB (server) vs ~500MB (with model)
```

### Expected Behavior After Fix

```
1. First OCR request → Model loads (2-5s cold start)
2. model_loaded → true
3. Subsequent requests → <500ms (warm)
4. Model stays loaded until container restart
5. Memory: ~500MB with model loaded
```

---

## Security Considerations

| Aspect | Status |
|--------|--------|
| Port Binding | `0.0.0.0:8090` — **exposed on all interfaces** |
| Authentication | **None** — no auth on OCR endpoint |
| Rate Limiting | **None** — unlimited requests |
| TLS | **None** — HTTP only |

**Recommendation:** PaddleOCR is currently accessible from any network interface without authentication. After fixing networking, consider:
1. Binding to `127.0.0.1:8090` (localhost only)
2. Adding API key authentication
3. Rate limiting for production use

---

## Monitoring Recommendations

### Health Check Configuration

```yaml
# Recommended docker-compose healthcheck
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8090/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

### Key Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Response Time | >1s | >5s |
| Error Rate | >1% | >10% |
| Memory Usage | >1GB | >2GB |
| model_loaded | false (after first request) | false (if should be loaded) |

---

## Recovery Procedures

### Scenario 1: Container Down

```bash
# Restart PaddleOCR container
docker restart mimotes-paddleocr-1

# Verify health
curl http://localhost:8090/health
# Expected: {"status":"ok","engine":"paddleocr","model_loaded":false}
```

### Scenario 2: Network Isolation (Current Issue)

```bash
# Option A: Connect app to PaddleOCR network
docker network connect mimotes_default mimotes-app-1

# Option B: Recreate app container with correct network
docker-compose up -d --force-recreate app
```

### Scenario 3: Model Load Failure

```bash
# Check container logs
docker logs mimotes-paddleocr-1 --tail 50

# Full restart to reload model
docker-compose restart paddleocr

# Force rebuild if corrupted
docker-compose up -d --build paddleocr
```

---

## Health Score

```
╔══════════════════════════════════════════════════════════╗
║              PaddleOCR Health Score                       ║
╠══════════════════════════════════════════════════════════╣
║ Container Running:     ✅ Yes (4+ hours)                  ║
║ Health Endpoint:       ✅ Responding                      ║
║ API Functionality:     ✅ Working (from host)            ║
║ Model Status:          ✅ Lazy-loaded (expected)          ║
║ Port Mapping:          ✅ Correctly configured            ║
║ Network Accessibility: ❌ Isolated from app container     ║
║ Error Rate:            ❌ 100% from app (network)         ║
║                                                                     ║
║ OVERALL: 🟡 DEGRADED — Service healthy but unreachable              ║
╚══════════════════════════════════════════════════════════╝
```

---

## Conclusion

PaddleOCR is **fully operational** as a standalone service. The container is healthy, the API responds correctly, and OCR processing produces accurate results. The single point of failure is **Docker network isolation** — the app container and PaddleOCR container are on different Docker networks and cannot communicate.

**Minimum Viable Fix:** Connect the app container to the `mimotes_default` Docker network, or add PaddleOCR to the bridge network.

---

*Report generated for ECC Critical Image Pipeline Audit*  
*Previous: IMAGE_UPLOAD_MATRIX.md | Next: IMAGE_INGESTION_RECOMMENDATION.md*
