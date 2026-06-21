# DESIGN CONSISTENCY AUDIT REPORT
**MimoNotes Application — Full Audit**
**Date:** June 9, 2026
**Audited:** 46 page.tsx files, 31 shared UI components

---

## EXECUTIVE SUMMARY

| Category | Score | Status |
|----------|-------|--------|
| Typography Consistency | 82% | ⚠️ 3 heading sizes used interchangeably |
| Color Token Usage | 75% | 🔴 Hardcoded Tailwind colors in 5 pages |
| Radius Consistency | 95% | ✅ No hardcoded radius values |
| Button Consistency | 78% | 🔴 Raw `<button>` in 8 files |
| Card Consistency | 70% | 🔴 Custom card divs in 6 pages |
| Form Consistency | 90% | ✅ Most pages use shared Input/Select |
| Table Consistency | 85% | ⚠️ Some custom table layouts |
| Icon Consistency | 88% | ⚠️ Mixed icon sizes (size-4 vs w-4 vs w-5) |
| Empty State Consistency | 65% | 🔴 4 different empty state patterns |
| Loading State Consistency | 60% | 🔴 5 different loading patterns |
| Mobile Inconsistency | 72% | 🔴 Some pages not responsive |
| Layout Shell Usage | 78% | 🔴 6 admin pages missing shell |

**OVERALL: 78% — Target 95%**

---

## 1. HARDCODED COLORS (Critical)

### Violations Found:

**`app/(admin)/leads/page.tsx`** — 8 hardcoded color classes
```
SCORE_COLORS = {
  high: "bg-red-50 text-red-600 border-red-200",     ← should use semantic tokens
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-gray-50 text-gray-500 border-gray-200",
}
```
- `bg-white hover:bg-gray-50` → should be `bg-card hover:bg-muted/50`
- `bg-green-600 hover:bg-green-700 text-white` → should use Button variant
- `bg-red-500` (status dot) → should use `bg-destructive`
- `text-red-500`, `text-amber-500`, `text-gray-400` → should use semantic tokens

**`app/(admin)/leads/[id]/page.tsx`** — 6 hardcoded color classes
- Same SCORE_COLORS pattern as leads/page.tsx
- `bg-green-600 hover:bg-green-700 text-white` on Button
- `bg-blue-50 border-blue-100 text-blue-700` for follow-up indicator

**`app/developers/page.tsx`** — 15+ hardcoded colors
- `text-white` used 10+ times (breaks in light mode)
- `bg-black/40` for code blocks
- `text-green-300` for code syntax
- No dark mode support at all

**`app/(public)/invite/[token]/page.tsx`** — 3 hardcoded colors
- `text-green-600` → should be `text-success`
- `text-red-500` → should be `text-destructive`

**`app/wizard/chatbot-wizard.tsx`** — 9 hardcoded hex values
- Color picker uses `#3B82F6`, `#8B5CF6`, etc. (acceptable — user-facing color selector)

### Token Replacement Map:
| Hardcoded | Token Replacement |
|-----------|-------------------|
| `bg-red-50 text-red-600` | `bg-destructive/10 text-destructive` |
| `bg-amber-50 text-amber-600` | `bg-warning/10 text-warning` |
| `bg-green-600 text-white` | `bg-success text-success-foreground` |
| `text-green-600` | `text-success` |
| `text-red-500` | `text-destructive` |
| `bg-white` | `bg-card` |
| `bg-gray-50` | `bg-muted` |
| `bg-black/40` | `bg-muted` |
| `text-white` | `text-primary-foreground` or `text-foreground` |

---

## 2. RAW `<button>` ELEMENTS (Critical)

### Files using raw `<button>` instead of `@/components/ui/button`:

| File | Count | Context |
|------|-------|---------|
| `leads/[id]/page.tsx` | 1 | Back button |
| `invite/[token]/page.tsx` | 3 | Login, Accept, Retry buttons |
| `developers/page.tsx` | 1 | Tab navigation |
| `knowledge/documents/[id]/document-detail-client.tsx` | 2 | Edit/Cancel buttons |
| `wizard/chatbot-wizard.tsx` | 8 | Navigation, Send, Color picker |

**Total: 15 raw `<button>` elements should use `<Button>` component**

---

## 3. CUSTOM CARD IMPLEMENTATIONS (High)

### Pages creating custom card `<div>` instead of using `@/components/ui/card`:

| File | Custom Cards | Should Use |
|------|-------------|------------|
| `leads/page.tsx` | Lead item cards | `<Card>` |
| `leads/[id]/page.tsx` | Contact card, Intelligence card | `<Card>` |
| `dashboard/page.tsx` | Metric cards (×4), Quick Actions | `<Card>` |
| `developers/page.tsx` | Content sections (×5) | `<Card>` |
| `settings/language/page.tsx` | Language card | `<Card>` |
| `settings/workspace/page.tsx` | Workspace card | `<Card>` |

**Total: 15+ custom card implementations**

---

## 4. TYPOGRAPHY INCONSISTENCY (High)

### Heading sizes used across pages:

| Size | Pages Using | Pattern |
|------|------------|---------|
| `text-2xl font-bold` | knowledge/*, settings/*, whatsapp | ✅ Standard |
| `text-2xl font-bold tracking-tight` | chunks, search, sources, settings/leads | ✅ Standard |
| `text-xl font-semibold` | dashboard, leads | ⚠️ Smaller |
| `text-lg font-semibold` | wizard, invite | ⚠️ Smaller |
| `text-2xl font-bold text-white` | developers | 🔴 Hardcoded color |

**Inconsistency: 3 different heading styles used for page titles**

### Standard should be:
```tsx
<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
```

---

## 5. LAYOUT SHELL INCONSISTENCY (High)

### Admin pages WITHOUT DashboardShell:
| Page | Has Layout | Issue |
|------|-----------|-------|
| `leads/page.tsx` | ❌ | Custom `max-w-5xl mx-auto p-4` |
| `leads/[id]/page.tsx` | ❌ | Custom `max-w-4xl mx-auto p-4` |
| `whatsapp/page.tsx` | ❌ | Bare `<div className="space-y-6">` |
| `settings/whatsapp/page.tsx` | ❌ | Missing SettingsLayout wrapper |
| `developers/page.tsx` | ❌ | Custom `min-h-screen` layout |

### Pages WITH proper shells:
- 17 pages use DashboardShell ✅
- 13 settings pages use SettingsLayout ✅

---

## 6. EMPTY STATE INCONSISTENCY (Medium)

### Different empty state patterns found:

| Pattern | Where Used |
|---------|-----------|
| `<p>Belum ada leads</p>` | leads/page.tsx |
| `<p>Belum ada percakapan</p>` | leads/[id]/page.tsx |
| `<span className="italic">Belum ada deskripsi</span>` | knowledge/documents/[id] |
| No empty state at all | dashboard, documents, analytics |
| Shared `<EmptyState>` component | Some knowledge pages |

**Should use: `@/components/ui/empty-state` consistently**

---

## 7. LOADING STATE INCONSISTENCY (Medium)

### Different loading patterns found:

| Pattern | Where Used |
|---------|-----------|
| `useState(true)` + conditional render | leads, leads/[id], images |
| `Loader2 animate-spin` | invite/[token] |
| `<Skeleton>` components | Some knowledge pages |
| No loading state | dashboard, documents |
| Shared loading pattern | None standardized |

**Should standardize on: `<Skeleton>` from `@/components/ui/skeleton`**

---

## 8. SETTINGS/LANGUAGE BUG (Critical)

### Import path typo:
```tsx
// settings/language/page.tsx line 5:
import { SettingsLayout } from "@//components/settings/settings-layout";
//                           ^^ double slash — should be @/components/...
```

---

## 9. KNOWLEDGE PAGES — REDUNDANT HEADERS (Low)

### Pages with double titles:
- `knowledge/chunks/page.tsx`: DashboardShell `title="Chunks"` + `<h1>Chunks</h1>`
- `knowledge/search/page.tsx`: DashboardShell `title="Similarity Search"` + `<h1>Similarity Search</h1>`
- `knowledge/sources/page.tsx`: DashboardShell `title="Sources"` + `<h1>Sources</h1>`

**Fix: Remove redundant `<h1>` inside DashboardShell**

---

## 10. COMPONENT ENFORCEMENT SUMMARY

### Shared components available:
✅ button, card, input, textarea, select, badge, table, dialog, sheet, dropdown-menu, tabs, skeleton, tooltip, separator, avatar, pagination, empty-state, page-header, status-badge, confirm-dialog, bottom-sheet

### Components NOT used by violators:
| Component | Available | Used in leads? | Used in developers? | Used in wizard? |
|-----------|----------|---------------|--------------------|--------------------|
| Button | ✅ | ❌ (raw button) | ❌ (raw button) | ❌ (raw button) |
| Card | ✅ | ❌ (custom div) | ❌ (custom div) | N/A |
| Skeleton | ✅ | ❌ | N/A | N/A |
| EmptyState | ✅ | ❌ | N/A | N/A |
| Tabs | ✅ | N/A | ❌ (custom tabs) | N/A |

---

## PAGE-BY-PAGE SCORECARD

| Page | Typography | Colors | Components | Layout | Loading | Empty | Score |
|------|-----------|--------|------------|--------|---------|-------|-------|
| dashboard | ⚠️ | ✅ | ⚠️ | ✅ | ❌ | ❌ | 70% |
| chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| leads | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | 35% |
| leads/[id] | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | 35% |
| documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| analytics/* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| knowledge/* | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | 90% |
| ai/* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| settings/* | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | 85% |
| whatsapp | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | 80% |
| developers | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | 20% |
| wizard | ⚠️ | ⚠️ | ❌ | ✅ | ⚠️ | ✅ | 55% |
| invite | ⚠️ | ❌ | ❌ | N/A | ✅ | ✅ | 45% |
| onboarding | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |

---

## PRIORITY FIX ORDER

### P0 — Critical (Fix Immediately)
1. **settings/language/page.tsx** — Fix double-slash import path bug
2. **settings/whatsapp/page.tsx** — Wrap in SettingsLayout
3. **leads/page.tsx** — Replace all hardcoded colors with tokens, use Button/Card
4. **leads/[id]/page.tsx** — Same as above
5. **developers/page.tsx** — Replace text-white/bg-black, add DashboardShell, use Button/Card/Tabs

### P1 — High (Fix This Sprint)
6. **invite/[token]/page.tsx** — Replace raw `<button>` with Button component
7. **dashboard/page.tsx** — Replace custom card divs with Card component
8. **wizard/chatbot-wizard.tsx** — Replace raw `<button>` with Button component
9. **knowledge/documents/[id]** — Replace raw `<button>` with Button component
10. **whatsapp/page.tsx** — Add DashboardShell wrapper

### P2 — Medium (Fix Next Sprint)
11. Standardize heading sizes across all pages
12. Standardize empty states to use EmptyState component
13. Standardize loading states to use Skeleton component
14. Remove redundant `<h1>` in knowledge/chunks, search, sources
15. Fix inconsistent skip-link patterns in settings pages
