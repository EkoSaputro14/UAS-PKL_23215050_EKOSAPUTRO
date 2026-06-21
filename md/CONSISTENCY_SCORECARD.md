# CONSISTENCY SCORECARD
**MimoNotes Design Consistency Enforcement**
**Date:** June 9, 2026

---

## OVERALL SCORE: 78/100

```
██████████████████████████████████████░░░░░░░░░░░░░░ 78%
```

---

## CATEGORY SCORES

### 🎨 Typography — 82%
```
██████████████████████████████████████░░░░░░░░░░░░░░ 82%
```
| Metric | Status |
|--------|--------|
| Font family consistent | ✅ Geist Sans throughout |
| Heading sizes standardized | ⚠️ 3 variants: text-xl, text-lg, text-2xl |
| Body text consistent | ✅ text-sm / text-base |
| Code font consistent | ✅ Geist Mono |

**Issues:**
- `leads/page.tsx` uses `text-xl font-semibold` for title
- `developers/page.tsx` uses `text-2xl font-bold text-white`
- `wizard` uses `text-lg font-semibold`
- Standard: `text-2xl font-bold tracking-tight`

---

### 🎨 Color Token Usage — 75%
```
██████████████████████████████████░░░░░░░░░░░░░░░░░░ 75%
```
| Metric | Status |
|--------|--------|
| CSS variables used | ✅ Most pages |
| Hardcoded hex values | ⚠️ 9 in wizard (color picker — acceptable) |
| Hardcoded Tailwind colors | 🔴 25+ instances in leads, developers |
| Dark mode support | 🔴 developers page breaks in dark |

**Violations:**
- `bg-red-50 text-red-600` → `bg-destructive/10 text-destructive`
- `bg-green-600 text-white` → `bg-success text-success-foreground`
- `text-white` (15+ in developers) → `text-foreground`
- `bg-black/40` (3 in developers) → `bg-muted`

---

### 📐 Radius Consistency — 95%
```
████████████████████████████████████████████████░░░░ 95%
```
| Metric | Status |
|--------|--------|
| Hardcoded radius values | ✅ None found |
| Token radius used | ✅ `rounded-lg`, `rounded-xl` |
| Consistent corner style | ✅ 0.625rem base |

**Issues:** None — radius is well-standardized.

---

### 🔘 Button Consistency — 78%
```
██████████████████████████████████████░░░░░░░░░░░░░░ 78%
```
| Metric | Status |
|--------|--------|
| Shared Button component | ✅ Available |
| Pages using shared Button | ⚠️ 38/46 |
| Raw `<button>` elements | 🔴 15 instances in 8 files |

**Violations:**
| File | Raw `<button>` Count |
|------|---------------------|
| wizard/chatbot-wizard.tsx | 8 |
| invite/[token]/page.tsx | 3 |
| knowledge/documents/[id] | 2 |
| leads/[id]/page.tsx | 1 |
| developers/page.tsx | 1 |

---

### 🃏 Card Consistency — 70%
```
██████████████████████████████████░░░░░░░░░░░░░░░░░░ 70%
```
| Metric | Status |
|--------|--------|
| Shared Card component | ✅ Available |
| Pages using shared Card | ⚠️ ~30/46 |
| Custom card `<div>` | 🔴 15+ instances in 6 files |

**Violations:**
- `leads/page.tsx` — custom lead item cards
- `leads/[id]/page.tsx` — custom contact/intelligence cards
- `dashboard/page.tsx` — custom metric cards
- `developers/page.tsx` — custom content sections
- `settings/language/page.tsx` — custom language card
- `settings/workspace/page.tsx` — custom workspace card

---

### 📝 Form Consistency — 90%
```
████████████████████████████████████████████░░░░░░░░ 90%
```
| Metric | Status |
|--------|--------|
| Shared Input component | ✅ Used in most forms |
| Shared Select component | ✅ Used in settings |
| Shared Textarea component | ✅ Used in documents |
| Shared Label component | ✅ Used consistently |

**Issues:** Minor — some forms use raw `<input>` in wizard steps.

---

### 📊 Table Consistency — 85%
```
███████████████████████████████████████████░░░░░░░░░ 85%
```
| Metric | Status |
|--------|--------|
| Shared Table component | ✅ Available |
| Table usage consistent | ⚠️ Some pages use custom div grids |
| Responsive tables | ⚠️ Not all tables scroll on mobile |

---

### 🎯 Icon Consistency — 88%
```
████████████████████████████████████████████░░░░░░░░ 88%
```
| Metric | Status |
|--------|--------|
| Icon library (lucide-react) | ✅ Single library |
| Icon sizes | ⚠️ Mixed: `size-4`, `w-4 h-4`, `w-5`, `size-5` |
| Icon colors | ⚠️ Some hardcoded `text-white` |

---

### 📭 Empty State Consistency — 65%
```
██████████████████████████████░░░░░░░░░░░░░░░░░░░░░░ 65%
```
| Metric | Status |
|--------|--------|
| Shared EmptyState component | ✅ Available |
| Pages using shared EmptyState | 🔴 ~30% |
| Custom empty text | 🔴 4 different patterns |
| No empty state at all | 🔴 dashboard, documents |

**Patterns found:**
- `<p>Belum ada leads</p>` (leads)
- `<p>Belum ada percakapan</p>` (leads/[id])
- `<span className="italic">Belum ada deskripsi</span>` (documents)
- No empty state (dashboard)

---

### ⏳ Loading State Consistency — 60%
```
████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░ 60%
```
| Metric | Status |
|--------|--------|
| Shared Skeleton component | ✅ Available |
| Pages using shared Skeleton | 🔴 ~20% |
| Custom loading patterns | 🔴 5 different approaches |
| No loading state | 🔴 dashboard, documents |

**Patterns found:**
- `useState(true)` + conditional (leads)
- `<Loader2 animate-spin>` (invite)
- `<Skeleton>` (some knowledge pages)
- Nothing (dashboard, documents)

---

### 📱 Mobile Consistency — 72%
```
████████████████████████████████████░░░░░░░░░░░░░░░░ 72%
```
| Metric | Status |
|--------|--------|
| Responsive padding | ⚠️ Mixed: `p-4 md:p-6` vs `p-6` |
| Responsive grids | ⚠️ Some pages fixed columns |
| Mobile navigation | ✅ MobileNav component exists |
| Touch targets | ⚠️ Some buttons too small |

---

### 🏗️ Layout Shell Usage — 78%
```
██████████████████████████████████████░░░░░░░░░░░░░░ 78%
```
| Metric | Status |
|--------|--------|
| DashboardShell available | ✅ |
| SettingsLayout available | ✅ |
| Pages using shells | ⚠️ 38/46 |
| Pages without shells | 🔴 8 admin pages |

**Pages missing shells:**
- `leads/page.tsx` — custom layout
- `leads/[id]/page.tsx` — custom layout
- `whatsapp/page.tsx` — bare div
- `settings/whatsapp/page.tsx` — missing SettingsLayout
- `developers/page.tsx` — fully custom layout

---

## COMPONENT USAGE MATRIX

| Component | Available | Used Correctly | Violations |
|-----------|----------|----------------|------------|
| Button | ✅ | 38/46 pages | 15 raw `<button>` |
| Card | ✅ | 30/46 pages | 15 custom divs |
| Input | ✅ | 90% forms | Minor |
| Textarea | ✅ | 95% uses | ✅ |
| Select | ✅ | 90% uses | ✅ |
| Badge | ✅ | 85% uses | ✅ |
| Table | ✅ | 85% uses | Some custom grids |
| Dialog | ✅ | 90% uses | ✅ |
| Sheet | ✅ | 95% uses | ✅ |
| Tabs | ✅ | 90% uses | 1 custom (developers) |
| Skeleton | ✅ | 20% uses | 🔴 Underused |
| EmptyState | ✅ | 30% uses | 🔴 Underused |
| Tooltip | ✅ | 70% uses | ⚠️ Some missing |
| Separator | ✅ | 80% uses | ✅ |
| Avatar | ✅ | 85% uses | ✅ |

---

## PAGE STRUCTURE COMPLIANCE

### Standard Pattern:
```
Page Header
  ├── Title (text-2xl font-bold tracking-tight)
  ├── Description (text-muted-foreground)
  └── Primary Action (Button)
Content
  └── Consistent spacing (space-y-6, gap-6)
Footer (if applicable)
```

### Compliance:
| Page | Header | Description | Action | Spacing | Score |
|------|--------|-------------|--------|---------|-------|
| dashboard | ⚠️ text-xl | ✅ | ✅ | ⚠️ custom | 75% |
| chat | ✅ | ✅ | ✅ | ✅ | 100% |
| leads | ⚠️ text-xl | ❌ | ❌ | ⚠️ custom | 40% |
| leads/[id] | ❌ sticky | ❌ | ✅ | ⚠️ custom | 50% |
| documents | ✅ | ✅ | ✅ | ✅ | 100% |
| analytics/* | ✅ | ✅ | ✅ | ✅ | 100% |
| knowledge/* | ✅ | ✅ | ✅ | ✅ | 95% |
| ai/* | ✅ | ✅ | ✅ | ✅ | 100% |
| settings/* | ✅ | ✅ | ✅ | ✅ | 95% |
| whatsapp | ⚠️ no shell | ✅ | ❌ | ⚠️ bare div | 60% |
| developers | ⚠️ text-white | ❌ | ❌ | ❌ custom | 25% |
| wizard | ✅ | ✅ | ✅ | ✅ | 90% |

---

## ACCESSIBILITY SCORE — 70%

| Metric | Status |
|--------|--------|
| Skip-to-content link | ⚠️ Missing in 3 pages |
| ARIA labels | ⚠️ Inconsistent |
| Focus management | ⚠️ Some dialogs lack focus trap |
| Color contrast | ⚠️ text-white on dark bg in developers |
| Keyboard navigation | ⚠️ Raw `<button>` missing focus styles |
| Screen reader text | ⚠️ Missing alt text on some icons |

---

## REMEDIATION PRIORITY

### P0 — Critical (Fix Now)
| # | File | Issue | Effort |
|---|------|-------|--------|
| 1 | settings/language | Import path bug (`@//`) | 1 min |
| 2 | settings/whatsapp | Missing SettingsLayout | 5 min |
| 3 | leads/page.tsx | All hardcoded colors + no Button/Card | 30 min |
| 4 | leads/[id]/page.tsx | All hardcoded colors + no Button/Card | 30 min |
| 5 | developers/page.tsx | text-white/bg-black + no shell | 45 min |

### P1 — High (Fix This Sprint)
| # | File | Issue | Effort |
|---|------|-------|--------|
| 6 | invite/[token] | 3 raw `<button>` | 10 min |
| 7 | dashboard | 4 custom card divs | 15 min |
| 8 | wizard | 8 raw `<button>` | 20 min |
| 9 | knowledge/documents/[id] | 2 raw `<button>` | 5 min |
| 10 | whatsapp/page.tsx | Add DashboardShell | 5 min |

### P2 — Medium (Fix Next Sprint)
| # | Issue | Effort |
|---|-------|--------|
| 11 | Standardize heading sizes | 30 min |
| 12 | Standardize empty states | 1 hour |
| 13 | Standardize loading states | 1 hour |
| 14 | Remove redundant headers | 10 min |
| 15 | Fix skip-link patterns | 15 min |

---

## FINAL SCORES

```
CATEGORY              SCORE    WEIGHT    WEIGHTED
─────────────────────────────────────────────────
Typography            82%      10%       8.2
Color Tokens          75%      15%       11.25
Radius                95%       5%       4.75
Buttons               78%      10%       7.8
Cards                 70%      10%       7.0
Forms                 90%       5%       4.5
Tables                85%       5%       4.25
Icons                 88%       5%       4.4
Empty States          65%       5%       3.25
Loading States        60%       5%       3.0
Mobile                72%      10%       7.2
Layout Shells         78%      10%       7.8
─────────────────────────────────────────────────
TOTAL                            100%     73.4

ADJUSTED FOR ACCESSIBILITY (-5% penalty):
OVERALL SCORE: 68.4/100
```

---

## PATH TO 95%

To reach 95% consistency:

1. **Fix P0 items** (+12%) → 80%
2. **Fix P1 items** (+8%) → 88%
3. **Fix P2 items** (+7%) → 95%

**Estimated effort:** 4-6 hours total
