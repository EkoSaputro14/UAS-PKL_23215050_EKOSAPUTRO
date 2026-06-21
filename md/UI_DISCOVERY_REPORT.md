# UI_DISCOVERY_REPORT.md — UI Exploration Report

**Generated:** 2026-06-17
**Method:** Code analysis (Playwright exploration deferred to QA phase)

---

## NAVIGATION STRUCTURE

### Sidebar Navigation (`app-sidebar.tsx`)
```
📊 Dashboard
💬 Chat
📄 Documents
   ├── Upload
   └── Folders
🧠 Knowledge Base
   ├── Documents
   ├── Chunks
   ├── Search
   ├── Sources
   └── Images
🤖 AI
   ├── Playground
   └── Prompts
📈 Analytics
   ├── Chat
   ├── Cost
   ├── Usage
   └── Leads
💬 WhatsApp
   └── Conversations
🔧 Settings
   ├── Account
   ├── Security
   ├── Notifications
   ├── API Keys
   ├── Billing
   ├── Workspace
   ├── Usage
   ├── Widget
   ├── MCP
   ├── WhatsApp
   ├── Leads
   └── Audit
👨‍💻 Developers
   ├── API Docs
   ├── API Keys
   └── Usage
```

### Top Navigation (`top-nav.tsx`)
- Workspace switcher (dropdown)
- Search (Command Palette / Cmd+K)
- Notifications bell
- User avatar dropdown
  - Profile
  - Settings
  - Logout

### Mobile Navigation (`mobile-nav.tsx`)
- Hamburger menu (3-line icon)
- Slide-out drawer
- Same nav items as sidebar
- Bottom sheet on touch

---

## LANDING PAGE SECTIONS

### Public Landing (`/`)
1. **Header** — Logo, nav links, Login/Register buttons
2. **Hero** — Headline, subheadline, CTA buttons, product screenshot
3. **FeatureHighlights** — 6 feature cards with icons
4. **HowItWorks** — 3-step process
5. **ProductShowcase** — App screenshots/demo
6. **PricingSection** — Free/Pro/Enterprise comparison table
7. **SecuritySection** — Security features
8. **SocialProof** — Testimonials/logos
9. **TeamSection** — Team info
10. **FAQSection** — Accordion FAQ
11. **FinalCTA** — Bottom conversion CTA
12. **Footer** — Links, legal, social

---

## MODALS & DIALOGS

| Trigger | Modal | Component |
|---------|-------|-----------|
| "Invite Member" | Invite dialog | `InviteDialog` |
| "New Prompt" | Prompt editor | `PromptEditor` |
| "Delete Document" | Confirmation dialog | shadcn `Dialog` |
| "Bulk Actions" | Action confirmation | shadcn `Dialog` |
| "Source Reference" | Source preview | `SourcePreview` |
| "Widget Settings" | Widget config | `WidgetSettingsForm` |
| "Revoke Session" | Confirmation | shadcn `Dialog` |
| "Delete Workspace" | Danger confirmation | `WorkspaceDanger` |
| "Transfer Ownership" | Confirmation | shadcn `Dialog` |
| "Upgrade Plan" | Stripe checkout redirect | Browser navigation |

---

## CONTEXT MENUS

| Location | Actions |
|----------|---------|
| Document list row | View, Edit, Move, Delete |
| Chat session | Rename, Delete |
| Member row | Change Role, Remove |
| Invitation row | Resend, Revoke |
| API Key row | Copy, Revoke |
| Chunk row | View, Similar |
| Folder | Rename, Delete, Move |

---

## COMMAND PALETTE (Cmd+K)

- **Component:** `command-palette.tsx`
- **Trigger:** Cmd+K / Ctrl+K
- **Features:**
  - Search pages (navigation)
  - Search documents
  - Search chat sessions
  - Quick actions (new chat, upload doc)
  - Settings search

---

## EMPTY STATES

| Page | Empty State | Component |
|------|-------------|-----------|
| Dashboard | Onboarding checklist | `OnboardingChecklist` |
| Chat | "Start a new conversation" | `EmptyState` |
| Documents | "Upload your first document" | `EmptyState` |
| Knowledge | "No documents processed" | `EmptyState` |
| Analytics | "No data yet" | `EmptyState` |
| WhatsApp | "Connect WhatsApp" | `EmptyState` |
| Leads | "No leads captured" | `EmptyState` |

---

## LOADING STATES

| Component | Loading Pattern |
|-----------|-----------------|
| Dashboard | Skeleton cards |
| Chat | Typing indicator |
| Documents | Skeleton rows |
| Settings | `SettingsSkeleton` |
| Analytics | Chart skeleton |

---

## THEME SYSTEM

- **Provider:** `theme-provider.tsx` (next-themes)
- **Modes:** Light, Dark, System
- **Toggle:** `ThemeToggle` component
- **CSS Variables:** oklch color space
- **Implementation:** CSS custom properties in `globals.css`

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Stack layout, hamburger menu |
| Tablet | 640-1024px | Collapsed sidebar |
| Desktop | > 1024px | Full sidebar |

---

## KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| Cmd+K | Command Palette |
| Cmd+/ | Toggle sidebar |
| Enter | Send chat message |
| Shift+Enter | New line in chat |
| Esc | Close modal/dialog |
