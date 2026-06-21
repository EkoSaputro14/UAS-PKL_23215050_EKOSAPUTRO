# ROUTE_MAP.md — MimoNotes Route Inventory

**Generated:** 2026-06-17
**Total Routes:** 48 pages + 67 API endpoints

---

## PUBLIC ROUTES (No Auth)

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Landing page (hero, pricing, features) | Public |
| `/login` | User login form | Public |
| `/register` | User registration form | Public |
| `/invite/[token]` | Accept workspace invitation | Public |
| `/chat` | Public chat (rate-limited) | Public |
| `/api/health` | Health check endpoint | Public |
| `/api/auth/[...nextauth]` | NextAuth handler (login/logout/session) | Public |
| `/api/auth/register` | User registration API | Public |
| `/api/widget/chat` | Widget chat API (public embed) | Public |
| `/api/widget/chat/stream` | Widget chat streaming | Public |
| `/api/widget/config` | Widget config (public) | Public |
| `/api/widget/conversations` | Widget conversations (public) | Public |
| `/api/widget/conversations/[id]/messages` | Widget messages | Public |
| `/api/widget/analytics` | Widget analytics collection | Public |
| `/api/whatsapp/webhook` | WhatsApp webhook receiver | Public |
| `/api/v1/chat` | Public API chat (API key auth) | API Key |
| `/api/v1/search` | Public API search (API key auth) | API Key |
| `/api/v1/documents` | Public API documents (API key auth) | API Key |
| `/api/v1/keys` | API key management | API Key |

---

## AUTHENTICATED ROUTES (Login Required)

| Route | Purpose | Role |
|-------|---------|------|
| `/dashboard` | Main workspace dashboard | User |
| `/chat` | AI chat with RAG | User |
| `/documents` | Document list (admin legacy) | User |
| `/documents/upload` | Document upload (admin legacy) | User |
| `/knowledge` | Knowledge base overview | User |
| `/knowledge/documents` | Document explorer | User |
| `/knowledge/documents/[id]` | Document detail view | User |
| `/knowledge/chunks` | Chunk viewer | User |
| `/knowledge/search` | Similarity search | User |
| `/knowledge/sources` | Source viewer | User |
| `/knowledge/images` | Image/document viewer | User |
| `/ai` | AI overview | User |
| `/ai/playground` | AI Playground (test prompts) | User |
| `/ai/prompts` | Prompt template list | User |
| `/ai/prompts/new` | Create new prompt | User |
| `/ai/prompts/[id]` | Edit prompt template | User |
| `/analytics` | Analytics overview | User |
| `/analytics/chat` | Chat analytics | User |
| `/analytics/cost` | Cost analytics | User |
| `/analytics/usage` | Usage analytics | User |
| `/analytics/leads` | Lead analytics | User |
| `/developers` | Developer portal (API keys, docs) | User |
| `/wizard` | Onboarding wizard | User |

---

## SETTINGS ROUTES (Authenticated)

| Route | Purpose | Role |
|-------|---------|------|
| `/settings` | Settings overview | User |
| `/settings/account` | Profile & account settings | User |
| `/settings/security` | Password, 2FA, sessions | User |
| `/settings/notifications` | Notification preferences | User |
| `/settings/api-keys` | API key management | User |
| `/settings/billing` | Stripe billing & subscription | User |
| `/settings/workspace` | Workspace settings | User |
| `/settings/usage` | Usage limits & quotas | User |
| `/settings/widget` | Widget configuration | User |
| `/settings/mcp` | MCP server settings | User |
| `/settings/whatsapp` | WhatsApp integration | User |
| `/settings/leads` | Lead capture settings | User |
| `/settings/audit` | Audit log viewer | User |

---

## WHATSAPP ROUTES (Authenticated)

| Route | Purpose | Role |
|-------|---------|------|
| `/whatsapp` | WhatsApp conversation list | User |
| `/whatsapp/conversations/[id]` | WhatsApp chat view | User |

---

## API ROUTES (Backend Endpoints)

### Auth & User
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/auth/register` | User registration |
| GET/PUT | `/api/user/profile` | User profile CRUD |
| PUT | `/api/user/password` | Change password |
| GET/DELETE | `/api/user/sessions` | Session management |

### Dashboard
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/activity` | Recent activity feed |
| GET | `/api/dashboard/cost` | Cost summary |
| GET | `/api/dashboard/health` | System health check |
| GET | `/api/dashboard/top-documents` | Top documents |
| GET | `/api/dashboard/usage` | Usage metrics |

### Documents & Knowledge
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/documents` | List/create documents |
| GET/PUT/DELETE | `/api/documents/[id]` | Document CRUD |
| POST | `/api/documents/bulk` | Bulk operations |
| POST | `/api/upload` | File upload |
| GET/POST | `/api/folders` | Folder management |
| GET/POST | `/api/knowledge/documents` | Knowledge docs |
| GET | `/api/knowledge/documents/stats` | Doc statistics |
| GET | `/api/knowledge/documents/[id]/chunks` | Doc chunks |
| GET/POST | `/api/knowledge/chunks` | Chunk list |
| GET | `/api/knowledge/chunks/[id]` | Chunk detail |
| GET | `/api/knowledge/chunks/[id]/similar` | Similar chunks |
| GET | `/api/knowledge/search` | Similarity search |
| GET | `/api/knowledge/sources` | Source list |
| GET | `/api/knowledge/images` | Image list |

### Chat
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/chat` | Send chat message (RAG) |
| GET/POST | `/api/chat/sessions` | Chat session CRUD |

### AI & Prompts
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ai/playground` | Playground execution |
| POST | `/api/ai/playground/compare` | Model comparison |
| GET | `/api/ai/playground/history` | Playground history |
| GET/POST | `/api/ai/prompts` | Prompt CRUD |
| GET/PUT/DELETE | `/api/ai/prompts/[id]` | Prompt detail |
| GET/POST | `/api/ai/prompts/[id]/versions` | Version management |
| POST | `/api/ai/prompts/[id]/revert` | Version revert |
| POST | `/api/ai/prompts/[id]/test` | Prompt testing |

### Analytics
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/analytics/chat` | Chat analytics |
| GET | `/api/analytics/cost` | Cost analytics |
| GET | `/api/analytics/usage` | Usage analytics |
| GET | `/api/analytics/leads` | Lead analytics |
| POST | `/api/analytics/events` | Event tracking |
| GET | `/api/analytics/evaluation` | Evaluation metrics |
| GET | `/api/analytics/retrieval` | Retrieval metrics |
| GET | `/api/analytics/export` | CSV export |

### Workspace & Team
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/workspace` | Workspace CRUD |
| GET/POST | `/api/workspace/members` | Member management |
| PUT/DELETE | `/api/workspace/members/[id]` | Member update/remove |
| GET/POST | `/api/workspace/invitations` | Invitation CRUD |
| POST | `/api/workspace/invitations/[id]/resend` | Resend invite |
| POST | `/api/workspace/invitations/[id]/revoke` | Revoke invite |
| POST | `/api/invitations/accept/[token]` | Accept invitation |
| POST | `/api/workspace/leave` | Leave workspace |
| POST | `/api/workspace/delete` | Delete workspace |
| POST | `/api/workspace/transfer` | Transfer ownership |
| GET/PUT | `/api/workspace/billing` | Workspace billing |
| GET/PUT | `/api/workspace/subscription` | Subscription management |
| POST | `/api/workspace/switch` | Switch workspace |
| GET/PUT | `/api/workspace/api-keys` | Workspace API keys |
| GET | `/api/workspace/activity` | Activity log |

### Billing (Stripe)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/billing/checkout` | Create checkout session |
| POST | `/api/billing/webhook` | Stripe webhook handler |
| POST | `/api/billing/portal` | Customer portal |

### MCP
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/mcp` | MCP overview |
| POST | `/api/mcp/connect` | Connect MCP server |
| POST | `/api/mcp/call` | Call MCP tool |
| GET/POST | `/api/mcp/servers` | Server CRUD |
| GET/PUT/DELETE | `/api/mcp/servers/[id]` | Server detail |
| GET | `/api/mcp/tools` | Available tools |

### WhatsApp
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/whatsapp/config` | WhatsApp config |
| POST | `/api/whatsapp/config/test` | Test connection |
| POST | `/api/whatsapp/webhook` | Webhook receiver |
| GET/POST | `/api/whatsapp/conversations` | Conversation list |
| GET | `/api/whatsapp/conversations/[id]` | Conversation detail |
| GET/POST | `/api/whatsapp/conversations/[id]/messages` | Messages |

### Widgets
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/widgets` | Widget CRUD |
| PUT | `/api/widgets/[id]` | Widget update |

### Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/admin/settings` | System settings |
| GET | `/api/admin/models` | Available models |

### Other
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/notifications/settings` | Notification prefs |
| GET | `/api/audit` | Audit log |
| GET | `/api/operations/status` | Operations status |
| POST | `/api/wizard/create` | Wizard setup |

---

**Total: 48 page routes + 67 API endpoints = 115 routes**
