# SETTINGS_MAP.md — MimoNotes Settings Inventory

**Generated:** 2026-06-17
**Settings Pages:** 13

---

## SETTINGS NAVIGATION STRUCTURE

```
/settings
├── /settings/account        — Profile & Account
├── /settings/security       — Password & Sessions
├── /settings/notifications  — Alert Preferences
├── /settings/api-keys       — API Key Management
├── /settings/billing        — Stripe Billing & Plans
├── /settings/workspace      — Workspace Configuration
├── /settings/usage          — Usage Limits & Quotas
├── /settings/widget         — Widget Configuration
├── /settings/mcp            — MCP Server Settings
├── /settings/whatsapp       — WhatsApp Integration
├── /settings/leads          — Lead Capture Settings
└── /settings/audit          — Audit Log Viewer
```

---

## DETAILED SETTINGS BREAKDOWN

### 1. Account Settings (`/settings/account`)
- **Component:** `account-settings.tsx`
- **API:** `GET/PUT /api/user/profile`
- **Features:**
  - Display name
  - Email address
  - Avatar/Profile picture
  - Language preference (i18n)
  - Timezone
  - Theme (Light/Dark/System)

### 2. Security Settings (`/settings/security`)
- **Component:** `security-settings.tsx`
- **API:** `PUT /api/user/password`, `GET/DELETE /api/user/sessions`
- **Features:**
  - Change password (current + new)
  - Active sessions list
  - Revoke individual sessions
  - Revoke all other sessions
  - Session metadata (IP, device, last active)

### 3. Notification Settings (`/settings/notifications`)
- **Component:** `notification-settings.tsx`
- **API:** `GET/PUT /api/notifications/settings`
- **Features:**
  - Email notifications toggle
  - Chat completion alerts
  - Document processing alerts
  - Lead capture alerts
  - System alerts
  - Weekly digest

### 4. API Keys (`/settings/api-keys`)
- **Component:** `api-keys-settings.tsx`
- **API:** `GET/PUT /api/workspace/api-keys`
- **Features:**
  - Create API key
  - Key name & permissions
  - Key prefix display (masked)
  - Last used timestamp
  - Revoke key
  - Rate limit display

### 5. Billing (`/settings/billing`)
- **Component:** `billing-dashboard.tsx` (from workspace/)
- **API:** `POST /api/billing/checkout`, `POST /api/billing/portal`
- **Features:**
  - Current plan display (Free/Pro/Enterprise)
  - Plan comparison table
  - Upgrade/Downgrade buttons
  - Stripe customer portal link
  - Invoice history
  - Usage vs limits
  - Billing period toggle (Monthly/Yearly)

### 6. Workspace Settings (`/settings/workspace`)
- **Component:** `workspace-settings.tsx`
- **API:** `GET/POST /api/workspace`
- **Features:**
  - Workspace name
  - Workspace slug
  - Default AI provider
  - Default model
  - System prompt
  - Workspace description

### 7. Usage & Limits (`/settings/usage`)
- **Component:** `usage-overview.tsx` (from workspace/)
- **API:** `GET /api/dashboard/usage`
- **Features:**
  - Documents: used/limit
  - Storage: used/limit
  - Chat messages: used/limit
  - Chunks: used/limit
  - AI requests: used/limit
  - Embedding requests: used/limit
  - MCP executions: used/limit
  - Progress bars with color coding

### 8. Widget Settings (`/settings/widget`)
- **Component:** `widget-settings-form.tsx`
- **API:** `GET/POST /api/widgets`
- **Features:**
  - Widget name
  - Theme color
  - Position (bottom-right, bottom-left)
  - Welcome message
  - Placeholder text
  - Avatar URL
  - Allowed domains
  - Embed code snippet
  - Enable/disable toggle

### 9. MCP Settings (`/settings/mcp`)
- **Component:** `mcp-settings-form.tsx`
- **API:** `GET/POST /api/mcp/servers`
- **Features:**
  - Add MCP server (URL + transport)
  - Server list with status
  - Test connection
  - Available tools display
  - Enable/disable per server
  - Remove server

### 10. WhatsApp Settings (`/settings/whatsapp`)
- **Component:** `whatsapp-settings.tsx`
- **API:** `GET/POST /api/whatsapp/config`
- **Features:**
  - Phone number ID
  - Access token
  - Webhook verify token
  - Business account ID
  - Test connection button
  - Webhook URL display
  - Enable/disable toggle

### 11. Lead Settings (`/settings/leads`)
- **API:** `GET/PUT /api/analytics/leads`
- **Features:**
  - Lead scoring thresholds
  - Auto-capture toggle
  - Lead intent keywords
  - Notification on new lead
  - Export format (CSV)

### 12. Audit Log (`/settings/audit`)
- **Component:** `audit-log-viewer.tsx`
- **API:** `GET /api/audit`
- **Features:**
  - Action log table
  - Filter by action type
  - Filter by user
  - Filter by date range
  - IP address logging
  - Export to CSV

### 13. Settings Overview (`/settings`)
- **Component:** Settings page (root)
- **Features:**
  - Quick access cards to all settings
  - Search across settings
  - Settings categories:
    - Account & Security
    - Workspace & Team
    - AI & Integrations
    - Billing & Usage
    - Developer Tools

---

## SETTINGS DATA FLOW

```
User Action → Component → API Route → lib/ → Prisma → DB
                                    ↓
                              settings.ts (cache)
                                    ↓
                              30-second TTL cache
```

## PLAN-BASED SETTINGS VISIBILITY

| Setting | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Account | ✅ | ✅ | ✅ |
| Security | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| API Keys | ❌ | ✅ | ✅ |
| Billing | ✅ | ✅ | ✅ |
| Workspace | ✅ | ✅ | ✅ |
| Usage | ✅ | ✅ | ✅ |
| Widget | ❌ | ✅ | ✅ |
| MCP | ❌ | ✅ | ✅ |
| WhatsApp | ❌ | ✅ | ✅ |
| Leads | ❌ | ✅ | ✅ |
| Audit | ❌ | ❌ | ✅ |
