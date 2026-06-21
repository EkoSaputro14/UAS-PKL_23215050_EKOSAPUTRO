# DESIGN SYSTEM REVIEW
**MimoNotes — Visual Consistency Audit**

**Date:** 2026-06-18
**Status:** REVIEWED

---

## 1. DESIGN TOKENS STATUS

### ✅ Well-Defined
| Token | Value | Status |
|-------|-------|--------|
| Primary | #4F6BFF (MiMo Blue) | ✅ Consistent |
| Accent | #8B5CF6 (Purple) | ✅ Consistent |
| Border Radius | 0.625rem | ✅ Consistent |
| Spacing Scale | 4px base | ✅ Defined |
| Typography Scale | 12 levels | ✅ Defined |
| Shadow System | 5 levels | ✅ Defined |
| Motion Tokens | 5 durations | ✅ Defined |

### 🟡 Needs Attention
| Issue | Current | Recommended |
|-------|---------|-------------|
| Font sizes in components | Mixed usage | Use scale tokens |
| Spacing in components | Ad-hoc values | Use spacing tokens |
| Border radius in components | Mixed | Use radius tokens |

---

## 2. TYPOGRAPHY AUDIT

### Current State
```css
--text-display: 2.25rem;  /* 36px */
--text-h1: 1.875rem;      /* 30px */
--text-h2: 1.5rem;        /* 24px */
--text-h3: 1.25rem;       /* 20px */
--text-h4: 1.125rem;      /* 18px */
--text-h5: 1rem;          /* 16px */
--text-h6: 0.875rem;      /* 14px */
--text-lg: 1.125rem;      /* 18px */
--text-base: 1rem;        /* 16px */
--text-sm: 0.875rem;      /* 14px */
--text-xs: 0.75rem;       /* 12px */
```

### Issues Found
| Page | Issue | Fix |
|------|-------|-----|
| Dashboard | H1 too large for dashboard | Use H3 for page titles |
| Leads | Table text inconsistent | Use text-sm consistently |
| Lead Detail | Intelligence labels inconsistent | Use text-xs for labels |

### Recommendation
```
Page Title:    text-xl font-semibold
Section Title: text-sm font-semibold uppercase tracking-wide
Body Text:     text-sm
Label:         text-xs text-muted-foreground
Caption:       text-xs text-muted-foreground
```

---

## 3. SPACING AUDIT

### Current State
Components use a mix of:
- Tailwind classes: `p-4`, `gap-6`, `mb-4`
- Custom CSS: `margin: 1.25rem`
- Inline styles: `style={{ padding: '16px' }}`

### Issues Found
| Page | Issue | Fix |
|------|-------|-----|
| Dashboard | Inconsistent card padding | Use p-4 or p-6 everywhere |
| Leads | Table cell padding varies | Use p-3 consistently |
| Lead Detail | Section gaps inconsistent | Use gap-6 between sections |

### Recommendation
```
Card padding:      p-4 (compact) or p-6 (spacious)
Section gap:       gap-6 (24px)
Item gap:          gap-4 (16px)
Inline gap:        gap-2 (8px)
Table cell:        p-3 (12px)
```

---

## 4. BORDER RADIUS AUDIT

### Current State
```css
--radius: 0.625rem;  /* 10px */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 14px;
```

### Issues Found
| Component | Current | Should Be |
|-----------|---------|-----------|
| Cards | rounded-lg | ✅ Correct |
| Buttons | rounded-md | ✅ Correct |
| Inputs | rounded-md | ✅ Correct |
| Badges | rounded-full | ✅ Correct |
| Some divs | rounded (no size) | Use rounded-lg |

---

## 5. COLOR USAGE AUDIT

### Primary (#4F6BFF)
- ✅ Used for primary buttons
- ✅ Used for links
- ✅ Used for active states
- 🟡 Some places use blue-500 instead

### Success (#10B981)
- ✅ Used for success badges
- ✅ Used for WhatsApp button
- 🟡 Inconsistent with green-500

### Warning (#F59E0B)
- ✅ Used for warning badges
- 🟡 Inconsistent with yellow-500

### Error (#EF4444)
- ✅ Used for destructive actions
- ✅ Used for error states

### Recommendation
Use semantic tokens consistently:
```css
/* Instead of */
className="bg-green-500"

/* Use */
className="bg-success"
```

---

## 6. SHADOW AUDIT

### Current State
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08);
```

### Issues Found
| Component | Current | Should Be |
|-----------|---------|-----------|
| Cards | shadow-sm | ✅ Correct |
| Dropdowns | shadow-md | ✅ Correct |
| Modals | shadow-lg | ✅ Correct |
| Some cards | No shadow | Add shadow-sm |

---

## 7. BUTTON HIERARCHY

### Current State
| Type | Style | Usage |
|------|-------|-------|
| Primary | bg-primary text-white | Main actions |
| Secondary | bg-secondary text-foreground | Secondary actions |
| Outline | border border-input | Tertiary actions |
| Ghost | hover:bg-accent | Minimal actions |
| Destructive | bg-destructive text-white | Delete actions |

### Issues Found
| Page | Issue | Fix |
|------|-------|-----|
| Lead Detail | WhatsApp button not prominent | Make it primary-style |
| Leads | "Lihat Detail" too subtle | Use outline button |
| Dashboard | Quick actions inconsistent | Standardize |

---

## 8. CONSISTENCY CHECKLIST

| Element | Consistent? | Notes |
|---------|-------------|-------|
| Card padding | 🟡 Mostly | Some use p-3, some p-4 |
| Button sizes | ✅ Yes | sm, default, lg |
| Input styling | ✅ Yes | Consistent |
| Badge styling | ✅ Yes | Consistent |
| Table styling | 🟡 Mostly | Header bg varies |
| Modal styling | ✅ Yes | Consistent |
| Tooltip styling | ✅ Yes | Consistent |

---

## 9. RECOMMENDATIONS

### Priority 1: Standardize Spacing
```css
/* Create utility classes */
.card-compact { padding: 12px; }
.card-default { padding: 16px; }
.card-spacious { padding: 24px; }
```

### Priority 2: Standardize Typography
```css
/* Page titles */
.page-title { font-size: 1.25rem; font-weight: 600; }

/* Section titles */
.section-title { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; }

/* Body text */
.body-text { font-size: 0.875rem; }

/* Labels */
.label { font-size: 0.75rem; color: var(--muted-foreground); }
```

### Priority 3: Standardize Colors
Use semantic tokens everywhere:
- `bg-primary` not `bg-blue-500`
- `bg-success` not `bg-green-500`
- `text-muted-foreground` not `text-gray-500`

---

**Status: REVIEW COMPLETE**
**Next: Phase 3 — Lead Dashboard Redesign**
