# MASTER_FEATURE_MATRIX.md — Complete Feature Map

**Generated:** 2026-06-17
**Application:** MimoNotes v1.0
**Status:** Pre-Beta QA

---

## FEATURE MATRIX

| # | Feature | Route(s) | API(s) | DB Tables | User Flow | Priority | QA Coverage |
|---|---------|----------|--------|-----------|-----------|----------|-------------|
| 1 | **Landing Page** | `/` | — | — | Public → CTA → Register | P0 | Full |
| 2 | **User Registration** | `/register` | `POST /api/auth/register` | `users` | Fill form → Create account → Dashboard | P0 | Full |
| 3 | **User Login** | `/login` | `POST /api/auth/[...nextauth]` | `users` | Enter creds → JWT → Dashboard | P0 | Full |
| 4 | **User Logout** | — | `POST /api/auth/signout` | — | Click logout → Clear session → Landing | P0 | Full |
| 5 | **Dashboard** | `/dashboard` | `/api/dashboard/*` | `analytics_events`, `chat_messages`, `documents` | Login → See KPIs, activity, health | P0 | Full |
| 6 | **AI Chat** | `/chat` | `POST /api/chat` | `chat_sessions`, `chat_messages`, `document_chunks` | Ask question → RAG → Streamed answer | P0 | Full |
| 7 | **Chat Sessions** | `/chat` | `/api/chat/sessions` | `chat_sessions` | Create/switch/delete conversations | P0 | Full |
| 8 | **Document Upload** | `/documents/upload` | `POST /api/upload` | `documents`, `document_chunks` | Select file → Parse → Chunk → Embed | P0 | Full |
| 9 | **Document List** | `/documents` | `GET /api/documents` | `documents` | Browse, filter, sort documents | P0 | Full |
| 10 | **Document Detail** | `/knowledge/documents/[id]` | `GET /api/knowledge/documents` | `documents`, `document_chunks` | View doc content and chunks | P1 | Full |
| 11 | **Folder System** | `/documents` | `/api/folders` | `folders` | Create folders, move docs | P1 | Partial |
| 12 | **Bulk Operations** | `/documents` | `POST /api/documents/bulk` | `documents` | Multi-select → Delete/Move | P1 | Partial |
| 13 | **Knowledge Chunks** | `/knowledge/chunks` | `/api/knowledge/chunks` | `document_chunks` | Browse all chunks | P1 | Partial |
| 14 | **Similarity Search** | `/knowledge/search` | `GET /api/knowledge/search` | `document_chunks` | Vector search → Ranked results | P1 | Full |
| 15 | **Source Viewer** | `/knowledge/sources` | `/api/knowledge/sources` | `document_chunks` | View source references | P2 | Partial |
| 16 | **Image/OCR** | `/knowledge/images` | `/api/knowledge/images` | `document_chunks` | OCR → Text extraction | P1 | Partial |
| 17 | **AI Playground** | `/ai/playground` | `/api/ai/playground` | `prompt_templates` | Test prompts → See output | P1 | Partial |
| 18 | **Model Comparison** | `/ai/playground` | `POST /api/ai/playground/compare` | — | Side-by-side model output | P2 | Partial |
| 19 | **Prompt Templates** | `/ai/prompts` | `/api/ai/prompts` | `prompt_templates`, `prompt_versions` | Create/edit/version prompts | P1 | Partial |
| 20 | **Analytics Overview** | `/analytics` | `/api/analytics/*` | `analytics_events` | View metrics dashboard | P1 | Partial |
| 21 | **Chat Analytics** | `/analytics/chat` | `GET /api/analytics/chat` | `analytics_events`, `chat_messages` | Chat volume, response time | P1 | Partial |
| 22 | **Cost Analytics** | `/analytics/cost` | `GET /api/analytics/cost` | `analytics_events` | Token usage, cost breakdown | P1 | Partial |
| 23 | **Usage Analytics** | `/analytics/usage` | `GET /api/analytics/usage` | `analytics_events`, `workspace_usage` | Resource utilization | P1 | Partial |
| 24 | **Lead Analytics** | `/analytics/leads` | `GET /api/analytics/leads` | `analytics_events` | Lead capture/conversion | P1 | Partial |
| 25 | **Account Settings** | `/settings/account` | `/api/user/profile` | `users` | Edit profile, name, email | P0 | Full |
| 26 | **Security Settings** | `/settings/security` | `/api/user/password`, `/api/user/sessions` | `users` | Change password, manage sessions | P0 | Full |
| 27 | **Notification Settings** | `/settings/notifications` | `/api/notifications/settings` | `notification_configs` | Toggle alert types | P1 | Partial |
| 28 | **API Keys** | `/settings/api-keys` | `/api/workspace/api-keys` | `api_keys` | Create/revoke API keys | P1 | Full |
| 29 | **Billing** | `/settings/billing` | `/api/billing/*` | `workspace_subscriptions`, `invoices` | Upgrade plan, view invoices | P0 | Full |
| 30 | **Workspace Settings** | `/settings/workspace` | `/api/workspace` | `workspaces`, `workspace_settings` | Edit workspace config | P0 | Full |
| 31 | **Usage & Limits** | `/settings/usage` | `/api/dashboard/usage` | `workspace_usage` | View quotas, usage bars | P1 | Full |
| 32 | **Widget Settings** | `/settings/widget` | `/api/widgets` | `widgets` | Configure embed widget | P1 | Partial |
| 33 | **MCP Settings** | `/settings/mcp` | `/api/mcp/servers` | `mcp_servers` | Add/manage MCP servers | P2 | Partial |
| 34 | **WhatsApp Settings** | `/settings/whatsapp` | `/api/whatsapp/config` | `whatsapp_configs` | Configure WhatsApp | P1 | Partial |
| 35 | **Lead Settings** | `/settings/leads` | `/api/analytics/leads` | `analytics_events` | Configure lead capture | P1 | Partial |
| 36 | **Audit Log** | `/settings/audit` | `GET /api/audit` | `audit_logs` | View action history | P2 | Partial |
| 37 | **Workspace Members** | `/settings/workspace` | `/api/workspace/members` | `workspace_members` | Add/remove/change roles | P0 | Full |
| 38 | **Invitations** | `/settings/workspace` | `/api/workspace/invitations` | `workspace_invitations` | Send/accept/revoke invites | P0 | Full |
| 39 | **Workspace Switch** | Top nav | `POST /api/workspace/switch` | `workspaces` | Switch active workspace | P1 | Partial |
| 40 | **Widget Chat** | External embed | `/api/widget/*` | `widgets`, `widget_conversations` | Embed on external site | P1 | Partial |
| 41 | **WhatsApp Chat** | `/whatsapp` | `/api/whatsapp/*` | `whatsapp_*` | WhatsApp conversations | P1 | Partial |
| 42 | **Public API** | `/api/v1/*` | `/api/v1/*` | `api_keys`, `api_usage_logs` | External API access | P1 | Partial |
| 43 | **Developer Portal** | `/developers` | — | — | API docs, key management | P1 | Partial |
| 44 | **Onboarding Wizard** | `/wizard` | `POST /api/wizard/create` | `workspaces` | First-time setup | P1 | Partial |
| 45 | **Command Palette** | Cmd+K | — | — | Quick navigation/search | P2 | Partial |
| 46 | **Theme Toggle** | Settings | — | — | Light/Dark/System mode | P1 | Full |
| 47 | **Mobile Responsive** | All | — | — | Responsive layouts | P0 | Full |
| 48 | **Rate Limiting** | All API | `lib/ratelimit.ts` | — | Prevent abuse | P1 | Partial |
| 49 | **RLS (Row Level Security)** | All | — | All workspace tables | Tenant isolation | P0 | Partial |
| 50 | **Email Notifications** | — | `lib/email/` | `notification_logs` | Send email alerts | P2 | Partial |

---

## SUMMARY

| Category | Count |
|----------|-------|
| **Total Features** | 50 |
| **P0 (Critical)** | 15 |
| **P1 (Important)** | 27 |
| **P2 (Nice-to-have)** | 8 |
| **Page Routes** | 48 |
| **API Endpoints** | 67 |
| **DB Tables** | 36 |
| **Components** | 150+ |

---

## QA PRIORITY ORDER

### Phase 1: P0 Critical (Must Pass)
1. Registration + Login + Logout
2. Dashboard loads correctly
3. AI Chat works (RAG pipeline)
4. Document upload + processing
5. Settings (Account, Security, Billing, Workspace)
6. Member management + Invitations
7. Mobile responsive
8. RLS tenant isolation

### Phase 2: P1 Important (Should Pass)
9. Knowledge base (chunks, search, sources)
10. AI Playground + Prompts
11. Analytics (chat, cost, usage, leads)
12. Widget + WhatsApp
13. API Keys + Public API
14. Notifications
15. Folder system
16. Onboarding wizard

### Phase 3: P2 Nice-to-have
17. Audit log
18. MCP settings
19. Model comparison
20. Command palette
21. Email notifications

---

## DOCUMENT CROSS-REFERENCE

| Document | Purpose |
|----------|---------|
| `ROUTE_MAP.md` | All 115 routes with auth/roles |
| `FEATURE_INVENTORY.md` | 150+ components + 40+ lib modules |
| `SETTINGS_MAP.md` | 13 settings pages detail |
| `TEAM_FEATURE_MAP.md` | Workspace, members, invitations |
| `DOCUMENTS_FEATURE_MAP.md` | Upload, OCR, chunking, search |
| `CHAT_FEATURE_MAP.md` | Chat, RAG, providers, streaming |
| `API_MAP.md` | 67 API endpoints |
| `DATABASE_FEATURE_MAP.md` | 36 tables with relations |
| `UI_DISCOVERY_REPORT.md` | Navigation, modals, empty states |
| `MASTER_FEATURE_MATRIX.md` | This file — master index |

---

**Next Step:** QA Testing using this feature matrix as the source of truth.
