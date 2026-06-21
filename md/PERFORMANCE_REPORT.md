# PERFORMANCE_REPORT.md — Load & Performance Analysis

**Date:** 2026-06-17
**Environment:** Docker (Production)

---

## CONTAINER PERFORMANCE (During QA Load)

| Container | CPU | Memory | Network I/O |
|-----------|-----|--------|-------------|
| mimotes-app-1 | 0.00% | 118.2 MB / 6 GB (1.92%) | 2.3 MB rx / 3.4 MB tx |
| mimotes-db-1 | 0.00% | 1.1 GB / 7.7 GB (14.72%) | 2.0 MB rx / 2.6 MB tx |
| mimotes-paddleocr-1 | — | — | Healthy |
| redis | — | — | Healthy |
| qdrant | — | — | Healthy |

---

## PAGE LOAD PERFORMANCE

| Category | Avg (ms) | Min (ms) | Max (ms) | Status |
|----------|----------|----------|----------|--------|
| Public Pages | 587 | 564 | 604 | ✅ Fast |
| Auth Flow | 2,158 | 570 | 3,745 | ✅ Normal |
| Dashboard | 821 | 821 | 821 | ✅ Fast |
| Chat (with AI) | 10,330 | 10,034 | 10,626 | ✅ Normal (streaming) |
| Documents | 639 | 594 | 696 | ✅ Fast |
| Knowledge Base | 622 | 591 | 696 | ✅ Fast |
| Settings | 612 | 582 | 658 | ✅ Fast |
| Analytics | 622 | 596 | 678 | ✅ Fast |
| AI Pages | 597 | 577 | 614 | ✅ Fast |

---

## DATABASE PERFORMANCE

| Metric | Value | Status |
|--------|-------|--------|
| Connection Latency | 6ms | ✅ Excellent |
| Total Documents | 135 | — |
| Total Chunks | 108,674 | — |
| FTS Coverage | 100% | ✅ |
| Embedding Coverage | 100% | ✅ |

---

## HEALTH CHECK RESULTS

```
Status: healthy
Uptime: 2,368 seconds
Database: healthy (6ms latency)
Email: healthy (Resend provider)
Config: 9/9 configured
Node: v20.20.2
Memory: 137 MB RSS, 57 MB heap used
```

---

## RECOMMENDATIONS

1. **Embedding Provider** — Configure OpenAI for production (currently using local fallback)
2. **Memory** — 118 MB app memory is healthy, no action needed
3. **Database** — 1.1 GB is normal for 108K chunks with pgvector
4. **Network** — Low I/O, no bottlenecks detected

---

**Overall Performance Rating: 9.0 / 10**
