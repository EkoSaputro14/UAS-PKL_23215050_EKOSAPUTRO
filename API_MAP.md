# API_MAP.md — Complete API Endpoint Inventory

**Generated:** 2026-06-17
**Total Endpoints:** 67

---

## AUTH ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| * | `/api/auth/[...nextauth]` | Public | NextAuth handler |
| POST | `/api/auth/register` | Public | User registration |

## USER ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET/PUT | `/api/user/profile` | Session | User profile CRUD |
| PUT | `/api/user/password` | Session | Change password |
| GET/DELETE | `/api/user/sessions` | Session | Session management |

## DASHBOARD ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/dashboard/stats` | Session | Dashboard KPIs |
| GET | `/api/dashboard/activity` | Session | Activity feed |
| GET | `/api/dashboard/cost` | Session | Cost summary |
| GET | `/api/dashboard/health` | Session | System health |
| GET | `/api/dashboard/top-documents` | Session | Popular docs |
| GET | `/api/dashboard/usage` | Session | Usage metrics |

## DOCUMENT ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET/POST | `/api/documents` | Session | List/create |
| GET/PUT/DELETE | `/api/documents/[id]` | Session | CRUD |
| POST | `/api/documents/bulk` | Session | Bulk ops |
| POST | `/api/upload` | Session | File upload |
| GET/POST | `/api/folders` | Session | Folder management |

## KNOWLEDGE ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET/POST | `/api/knowledge/documents` | Session | KB documents |
| GET | `/api/knowledge/documents/stats` | Session | Statistics |
| GET | `/api/knowledge/documents/[id]/chunks` | Session | Doc chunks |
| GET/POST | `/api/knowledge/chunks` | Session | Chunk list |
| GET | `/api/knowledge/chunks/[id]` | Session | Chunk detail |
| GET | `/api/knowledge/chunks/[id]/similar` | Session | Similar chunks |
| GET | `/api/knowledge/search` | Session | Vector search |
| GET | `/api/knowledge/sources` | Session | Source list |
| GET | `/api/knowledge/images` | Session | Image list |

## CHAT ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/chat` | Session | Send message |
| GET/POST | `/api/chat/sessions` | Session | Session CRUD |

## AI ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/ai/playground` | Session | Run prompt |
| POST | `/api/ai/playground/compare` | Session | Compare models |
| GET | `/api/ai/playground/history` | Session | History |
| GET/POST | `/api/ai/prompts` | Session | Template CRUD |
| GET/PUT/DELETE | `/api/ai/prompts/[id]` | Session | Template detail |
| GET/POST | `/api/ai/prompts/[id]/versions` | Session | Versions |
| POST | `/api/ai/prompts/[id]/revert` | Session | Revert version |
| POST | `/api/ai/prompts/[id]/test` | Session | Test prompt |

## ANALYTICS ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/analytics/chat` | Session | Chat metrics |
| GET | `/api/analytics/cost` | Session | Cost analytics |
| GET | `/api/analytics/usage` | Session | Usage analytics |
| GET | `/api/analytics/leads` | Session | Lead analytics |
| POST | `/api/analytics/events` | Session | Track event |
| GET | `/api/analytics/evaluation` | Session | Quality metrics |
| GET | `/api/analytics/retrieval` | Session | RAG metrics |
| GET | `/api/analytics/export` | Session | CSV export |

## WORKSPACE ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET/POST | `/api/workspace` | Session | Workspace CRUD |
| GET/POST | `/api/workspace/members` | Session | Members |
| PUT/DELETE | `/api/workspace/members/[id]` | Session | Member detail |
| GET/POST | `/api/workspace/invitations` | Session | Invitations |
| POST | `/api/workspace/invitations/[id]/resend` | Session | Resend |
| POST | `/api/workspace/invitations/[id]/revoke` | Session | Revoke |
| POST | `/api/invitations/accept/[token]` | Public | Accept |
| POST | `/api/workspace/leave` | Session | Leave |
| POST | `/api/workspace/delete` | Session | Delete |
| POST | `/api/workspace/transfer` | Session | Transfer |
| GET/PUT | `/api/workspace/billing` | Session | Billing |
| GET/PUT | `/api/workspace/subscription` | Session | Subscription |
| POST | `/api/workspace/switch` | Session | Switch |
| GET/PUT | `/api/workspace/api-keys` | Session | API keys |
| GET | `/api/workspace/activity` | Session | Activity log |

## BILLING ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/billing/checkout` | Session | Create checkout |
| POST | `/api/billing/webhook` | Stripe sig | Webhook |
| POST | `/api/billing/portal` | Session | Customer portal |

## MCP ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET/POST | `/api/mcp` | Session | Overview |
| POST | `/api/mcp/connect` | Session | Connect server |
| POST | `/api/mcp/call` | Session | Call tool |
| GET/POST | `/api/mcp/servers` | Session | Server CRUD |
| GET/PUT/DELETE | `/api/mcp/servers/[id]` | Session | Server detail |
| GET | `/api/mcp/tools` | Session | Available tools |

## WHATSAPP ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET/POST | `/api/whatsapp/config` | Session | Config |
| POST | `/api/whatsapp/config/test` | Session | Test |
| POST | `/api/whatsapp/webhook` | Signature | Webhook |
| GET/POST | `/api/whatsapp/conversations` | Session | Conversations |
| GET | `/api/whatsapp/conversations/[id]` | Session | Detail |
| GET/POST | `/api/whatsapp/conversations/[id]/messages` | Session | Messages |

## WIDGET ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/widget/chat` | Public | Widget chat |
| POST | `/api/widget/chat/stream` | Public | Streaming |
| GET | `/api/widget/config` | Public | Config |
| GET/POST | `/api/widget/conversations` | Public | Conversations |
| GET | `/api/widget/conversations/[id]/messages` | Public | Messages |
| POST | `/api/widget/analytics` | Public | Analytics |
| GET/POST | `/api/widgets` | Session | Widget CRUD |
| PUT | `/api/widgets/[id]` | Session | Widget update |

## PUBLIC API (API Key Auth)
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/v1/chat` | API Key | Chat |
| GET | `/api/v1/search` | API Key | Search |
| GET/POST | `/api/v1/documents` | API Key | Documents |
| GET/POST | `/api/v1/keys` | API Key | Key management |

## ADMIN ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET/POST | `/api/admin/settings` | Admin | System settings |
| GET | `/api/admin/models` | Admin | Available models |

## OTHER ENDPOINTS
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/health` | Public | Health check |
| GET/POST | `/api/notifications/settings` | Session | Notification prefs |
| GET | `/api/audit` | Session | Audit log |
| GET | `/api/operations/status` | Session | Status |
| POST | `/api/wizard/create` | Session | Setup wizard |
