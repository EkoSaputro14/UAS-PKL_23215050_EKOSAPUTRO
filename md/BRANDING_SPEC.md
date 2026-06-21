# BRANDING_SPEC.md — MimoNotes White Label Branding

**Date:** 2026-06-16
**Status:** Spec Complete — Ready for Implementation
**Feature:** `custom_branding` (entitlement: Pro + Enterprise)

---

## 1. Problem Statement

Enterprise customers want to present MimoNotes as THEIR chatbot, not a third-party tool. They need:
- Custom logo and colors
- Custom domain or subdomain
- Remove "Powered by MimoNotes" branding
- Custom welcome messages
- Custom email templates

Current state: `custom_branding` feature exists in entitlements but has ZERO implementation.

---

## 2. Scope — V1 (First Paying Customers)

### IN SCOPE (V1 — Ship with first paying customers)
| Feature | Description | Effort |
|---------|-------------|--------|
| Workspace Logo | Upload/custom URL logo displayed in chat widget + dashboard | 2h |
| Primary Color | Custom primary color for widget + dashboard accents | 1h |
| Welcome Message | Custom greeting per workspace (replaces default) | 1h |
| Remove Branding | Hide "Powered by MimoNotes" in widget | 30min |
| Custom Chat Title | Widget header text customization | 30min |

### OUT OF SCOPE (V2 — After first 10 paying customers)
| Feature | Description | Reason Deferred |
|---------|-------------|-----------------|
| Custom Domain | `chat.customer.com` via CNAME | Complex DNS + SSL setup |
| Custom Email Templates | Branded invitation/notification emails | Low priority for V1 |
| Custom CSS | Full CSS override for widget | Risk of breaking changes |
| Custom Favicon | Browser tab icon | Minor UX, low ROI |
| Multi-language | Per-workspace language setting | i18n is a larger project |

---

## 3. Database Schema

### Option A: WorkspaceSettings Extension (Recommended)

Add branding fields to existing `workspace_settings` table:

```sql
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS branding_logo_url TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS branding_primary_color VARCHAR(7);
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS branding_welcome_message TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS branding_chat_title VARCHAR(100);
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS branding_remove_footer BOOLEAN DEFAULT false;
```

**Why this option:** WorkspaceSetting already exists, has RLS, and is workspace-scoped. No new table needed.

### Option B: New Table (Not Recommended for V1)

```prisma
model WorkspaceBranding {
  id              String   @id @default(uuid())
  workspaceId     String   @unique @map("workspace_id")
  logoUrl         String?  @map("logo_url")
  primaryColor    String?  @map("primary_color") @db.VarChar(7)
  welcomeMessage  String?  @map("welcome_message")
  chatTitle       String?  @map("chat_title") @db.VarChar(100)
  removeFooter    Boolean  @default(false) @map("remove_footer")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  @@map("workspace_branding")
}
```

**Decision: Use Option A** — fewer migrations, reuses existing infrastructure.

---

## 4. API Routes

### GET /api/workspace/branding
```typescript
// Returns current branding settings for workspace
{
  logoUrl: string | null,
  primaryColor: string | null,  // hex, e.g. "#4F6BFF"
  welcomeMessage: string | null,
  chatTitle: string | null,
  removeFooter: boolean
}
```

### PATCH /api/workspace/branding
```typescript
// Update branding settings (requires custom_branding entitlement)
{
  logoUrl?: string,
  primaryColor?: string,  // validated hex color
  welcomeMessage?: string,  // max 500 chars
  chatTitle?: string,       // max 100 chars
  removeFooter?: boolean
}
```

### GET /api/widget/config (Modified)
```typescript
// Existing endpoint — add branding fields to response
{
  ...existingConfig,
  branding: {
    logoUrl: string | null,
    primaryColor: string | null,
    welcomeMessage: string | null,
    chatTitle: string | null,
    removeFooter: boolean
  }
}
```

---

## 5. UI Components

### Settings Page: `/settings/branding`

```
┌─────────────────────────────────────────────────┐
│  Branding                                    │
│  Sesuaikan tampilan chatbot untuk pelanggan. │
├─────────────────────────────────────────────────┤
│                                                 │
│  Logo Workspace                                 │
│  ┌─────────────┐  ┌─────────────────────────┐ │
│  │             │  │ https://...             │ │
│  │   Preview   │  │ [Upload] [Remove]       │ │
│  │             │  │                         │ │
│  └─────────────┘  └─────────────────────────┘ │
│                                                 │
│  Warna Primer                                   │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │
│  │ # │ │ # │ │ # │ │ # │ │ # │  [Custom hex] │
│  │4F6│ │8B5│ │10B│ │F59│ │EF4│               │
│  │BFF│ │CF6│ │981│ │E0B│ │444│               │
│  └───┘ └───┘ └───┘ └───┘ └───┘               │
│                                                 │
│  Judul Chat                                     │
│  ┌─────────────────────────────────────────┐   │
│  │ Customer Support                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Pesan Selamat Datang                           │
│  ┌─────────────────────────────────────────┐   │
│  │ Halo! Ada yang bisa saya bantu hari ini?│   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ☐ Hapus "Powered by MimoNotes"                │
│                                                 │
│  [Simpan Branding]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Widget Preview (Real-time)

Show a live preview of the widget with current branding settings applied. Updates as user types.

---

## 6. Widget Integration

### widget.js Changes

```javascript
// Current: hardcoded colors and branding
const DEFAULT_THEME = {
  primaryColor: "#3B82F6",
  backgroundColor: "#FFFFFF",
  // ...
};

// V1: merge workspace branding with defaults
function applyBranding(config) {
  if (config.branding) {
    if (config.branding.primaryColor) {
      document.documentElement.style.setProperty('--widget-primary', config.branding.primaryColor);
    }
    if (config.branding.logoUrl) {
      els.avatar.src = config.branding.logoUrl;
    }
    if (config.branding.chatTitle) {
      els.headerTitle.textContent = config.branding.chatTitle;
    }
    if (config.branding.welcomeMessage) {
      els.welcomeText.textContent = config.branding.welcomeMessage;
    }
    if (config.branding.removeFooter) {
      els.footer.style.display = 'none';
    }
  }
}
```

---

## 7. Security Considerations

| Risk | Mitigation |
|------|-----------|
| XSS via logoUrl | Validate URL format, only allow https:// |
| XSS via welcomeMessage | Sanitize HTML, use textContent only |
| Color injection | Validate hex format (#RRGGBB only) |
| Entitlement bypass | `requireFeature("custom_branding")` on PATCH |
| Cross-tenant branding leak | RLS on workspace_settings |

---

## 8. Implementation Estimate

| Task | Effort | Priority |
|------|--------|----------|
| Schema migration (5 columns) | 30min | P0 |
| API route (GET/PATCH) | 1h | P0 |
| Settings UI (form + preview) | 2h | P0 |
| Widget.js branding integration | 1h | P0 |
| Widget config endpoint update | 30min | P0 |
| Entitlement check | 15min | P0 |
| **Total V1** | **~5h** | |

---

*Spec by Hermes Agent — V1 ships with first paying customers.*
