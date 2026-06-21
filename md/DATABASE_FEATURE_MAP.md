# DATABASE_FEATURE_MAP.md — Database Feature Mapping

**Generated:** 2026-06-17
**Total Tables:** 36

---

## TABLE INVENTORY

### Core Tables
| Table | Purpose | RLS | Key Relations |
|-------|---------|-----|---------------|
| `users` | User accounts | Yes | → workspaces, documents, chat_sessions |
| `workspaces` | Multi-tenant workspaces | Yes | → members, settings, subscriptions |
| `workspace_members` | User-workspace-role | Yes | → users, workspaces |
| `workspace_settings` | Key-value config | Yes | → workspaces |
| `workspace_invitations` | Pending invites | Yes | → workspaces |
| `workspace_subscriptions` | Stripe subscriptions | Yes | → workspaces |
| `workspace_usage` | Resource usage tracking | Yes | → workspaces |
| `settings` | Global settings | No | Key-value store |

### Document & Knowledge Tables
| Table | Purpose | RLS | Key Relations |
|-------|---------|-----|---------------|
| `documents` | Document metadata | Yes | → users, workspaces |
| `document_chunks` | Text chunks + embeddings | Yes | → documents |
| `folders` | Document folders | Yes | → workspaces |

### Chat Tables
| Table | Purpose | RLS | Key Relations |
|-------|---------|-----|---------------|
| `chat_sessions` | Conversation sessions | Yes | → users, workspaces |
| `chat_messages` | Messages + sources | Yes | → chat_sessions |

### AI & Prompt Tables
| Table | Purpose | RLS | Key Relations |
|-------|---------|-----|---------------|
| `prompt_templates` | Prompt templates | Yes | → users |
| `prompt_versions` | Template versions | Yes | → prompt_templates |

### Billing Tables
| Table | Purpose | RLS | Key Relations |
|-------|---------|-----|---------------|
| `subscription_plans` | Plan definitions | No | Referenced by entitlements |
| `plan_features` | Feature flags per plan | No | → subscription_plans |
| `subscription_events` | Subscription audit | Yes | → workspaces |
| `invoices` | Stripe invoices | Yes | → workspaces |
| `invoice_line_items` | Invoice details | Yes | → invoices |
| `payments` | Payment records | Yes | → workspaces |
| `stripe_webhook_events` | Webhook dedup | No | Stripe event IDs |

### Widget Tables
| Table | Purpose | RLS | Key Relations |
|-------|---------|-----|---------------|
| `widgets` | Widget configs | Yes | → workspaces |
| `widget_conversations` | Widget chats | Yes | → widgets |
| `widget_messages` | Widget messages | Yes | → widget_conversations |

### WhatsApp Tables
| Table | Purpose | RLS | Key Relations |
|-------|---------|-----|---------------|
| `whatsapp_configs` | WhatsApp settings | Yes | → workspaces |
| `whatsapp_conversations` | WhatsApp chats | Yes | → whatsapp_configs |
| `whatsapp_messages` | WhatsApp messages | Yes | → whatsapp_conversations |

### Analytics & Monitoring
| Table | Purpose | RLS | Key Relations |
|-------|---------|-----|---------------|
| `analytics_events` | Event tracking | Yes | → users, workspaces |
| `api_keys` | API key storage | Yes | → workspaces |
| `api_usage_logs` | API request logs | Yes | → api_keys, workspaces |
| `audit_logs` | Action audit trail | Yes | → users, workspaces |
| `notification_configs` | Alert settings | Yes | → workspaces |
| `notification_logs` | Alert history | Yes | → notification_configs |
| `mcp_servers` | MCP server configs | Yes | → workspaces |

---

## FEATURE → TABLE MAPPING

### Authentication
```
Feature: Login/Register
→ users (password_hash, email)
→ chat_sessions (session restore)
```

### Document Upload
```
Feature: Upload PDF/DOCX/TXT/CSV
→ documents (metadata, status)
→ document_chunks (content, embeddings)
→ folders (organization)
→ analytics_events (tracking)
→ api_usage_logs (if API)
```

### Chat (RAG)
```
Feature: AI Chat with Knowledge Base
→ chat_sessions (conversation)
→ chat_messages (messages + sources)
→ document_chunks (vector search)
→ documents (source references)
→ analytics_events (tracking)
→ api_usage_logs (if API)
```

### Workspace Management
```
Feature: Multi-tenant Workspace
→ workspaces (core)
→ workspace_members (team)
→ workspace_settings (config)
→ workspace_invitations (invites)
→ workspace_subscriptions (billing)
→ workspace_usage (limits)
```

### Billing (Stripe)
```
Feature: Subscription Billing
→ workspace_subscriptions (current plan)
→ subscription_plans (plan definitions)
→ plan_features (feature flags)
→ invoices (billing history)
→ invoice_line_items (details)
→ payments (payment records)
→ stripe_webhook_events (dedup)
→ subscription_events (audit)
```

### Widget (Embed)
```
Feature: Embeddable Chat Widget
→ widgets (config)
→ widget_conversations (chats)
→ widget_messages (messages)
→ document_chunks (RAG search)
```

### WhatsApp
```
Feature: WhatsApp Integration
→ whatsapp_configs (settings)
→ whatsapp_conversations (chats)
→ whatsapp_messages (messages)
→ document_chunks (RAG search)
```

### MCP (Model Context Protocol)
```
Feature: MCP Server Integration
→ mcp_servers (configs)
→ api_usage_logs (tracking)
```

### API Keys
```
Feature: External API Access
→ api_keys (key storage)
→ api_usage_logs (request tracking)
→ workspace_usage (quota)
```

### Analytics
```
Feature: Usage Analytics
→ analytics_events (event stream)
→ api_usage_logs (API metrics)
→ chat_messages (chat metrics)
→ document_chunks (retrieval metrics)
```

### Audit
```
Feature: Audit Trail
→ audit_logs (action log)
→ subscription_events (billing audit)
→ stripe_webhook_events (webhook audit)
```

---

## WORKSPACE ISOLATION (RLS POLICIES)

All workspace-scoped tables have RLS policies:
- `workspace_id = current_setting('app.current_workspace_id')`
- Enforced at database level
- Middleware sets workspace context per request

### RLS-Protected Tables (24 tables)
All tables except: `_prisma_migrations`, `settings`, `subscription_plans`, `plan_features`, `stripe_webhook_events`

---

## EXTENSIONS
- `pgvector` — Vector similarity search
- `uuid-ossp` — UUID generation
- `pg_trgm` — Fuzzy text search
