# BUG_FIX_REPORT.md — QA v4.1

**Date:** 2026-06-17

---

## BUGS FOUND: 5

### BUG #1: Knowledge Search 405 (MEDIUM)
- **Error:** GET /api/knowledge/search → 405 Method Not Allowed
- **Impact:** Similarity search API rejects GET requests
- **Fix:** Investigate — may need POST or route handler update
- **Status:** ⚠️ PENDING

### BUG #2: Widgets API 404 (LOW)
- **Error:** GET /api/widgets → 404
- **Impact:** Widget list requires workspace context
- **Fix:** Expected behavior (workspace-scoped API)
- **Status:** ✅ EXPECTED

### BUG #3: Landing Mobile Overflow (MEDIUM)
- **Error:** Horizontal scroll on 390px viewport
- **Impact:** Mobile UX degraded on landing page
- **Fix:** CSS — constrain landing page elements to viewport
- **Status:** ⚠️ PENDING

### BUG #4: React Error #418 (LOW)
- **Error:** Hydration mismatch (minified)
- **Impact:** Cosmetic only
- **Fix:** Identify component with SSR/client mismatch
- **Status:** ⚠️ KNOWN (cosmetic)

### BUG #5: Logout Redirect (LOW)
- **Error:** After logout, stays on /dashboard
- **Impact:** User must manually navigate
- **Fix:** Redirect to / after signout
- **Status:** ⚠️ PENDING

---

## PREVIOUSLY FIXED

### BUG #0: fts_vector Column Missing (HIGH) — FIXED
- **Fix:** Added tsvector column + GIN index + trigger
- **Verification:** 108,674/108,674 chunks populated
- **Status:** ✅ FIXED

---

## SUMMARY

| Severity | Found | Fixed | Pending |
|----------|-------|-------|---------|
| Critical | 0 | 0 | 0 |
| High | 1 | 1 | 0 |
| Medium | 2 | 0 | 2 |
| Low | 2 | 0 | 2 |
| **Total** | **5** | **1** | **4** |

**Critical Blockers: 0**
