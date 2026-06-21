# TEAM_FEATURE_MAP.md — Workspace & Team Features

**Generated:** 2026-06-17

---

## WORKSPACE SYSTEM

### Workspace CRUD
- **Create:** `/api/workspace` POST → `workspaces` table
- **Read:** `/api/workspace` GET
- **Update:** `/api/workspace` PUT (name, slug, settings)
- **Delete:** `/api/workspace/delete` POST (with confirmation)
- **Transfer:** `/api/workspace/transfer` POST (change owner)
- **Switch:** `/api/workspace/switch` POST (switch active workspace)

### Database Tables
- `workspaces` — Core workspace data
- `workspace_settings` — Key-value workspace config
- `workspace_subscriptions` — Stripe subscription link
- `workspace_usage` — Resource usage tracking

---

## MEMBER MANAGEMENT

### Roles (RBAC)
| Role | Level | Permissions |
|------|-------|-------------|
| **Owner** | 4 | Full control, delete workspace, transfer ownership |
| **Admin** | 3 | Manage members, settings, billing, documents |
| **Member** | 2 | Use chat, upload docs, view analytics |
| **Viewer** | 1 | Read-only access to chat and docs |

### Member Operations
| Action | API | Role Required |
|--------|-----|---------------|
| List members | `GET /api/workspace/members` | Any member |
| Add member | `POST /api/workspace/members` | Admin+ |
| Update role | `PUT /api/workspace/members/[id]` | Admin+ |
| Remove member | `DELETE /api/workspace/members/[id]` | Admin+ |
| Leave workspace | `POST /api/workspace/leave` | Any member |

### Database Tables
- `workspace_members` — User-workspace-role mapping

---

## INVITATION FLOW

### Flow
1. Admin clicks "Invite Member" → `InviteDialog` component
2. Enter email + select role → `POST /api/workspace/invitations`
3. System generates token, sends email
4. Recipient clicks link → `/invite/[token]`
5. If not registered → redirect to `/register`
6. Accept → `POST /api/invitations/accept/[token]`
7. User added to `workspace_members`

### Invitation Operations
| Action | API | Role Required |
|--------|-----|---------------|
| List invitations | `GET /api/workspace/invitations` | Admin+ |
| Create invitation | `POST /api/workspace/invitations` | Admin+ |
| Resend invitation | `POST /api/workspace/invitations/[id]/resend` | Admin+ |
| Revoke invitation | `POST /api/workspace/invitations/[id]/revoke` | Admin+ |
| Accept invitation | `POST /api/invitations/accept/[token]` | Public (token) |

### Database Tables
- `workspace_invitations` — Pending invitations

---

## PERMISSION MATRIX

| Resource | Owner | Admin | Member | Viewer |
|----------|-------|-------|--------|--------|
| Workspace settings | CRUD | R | - | - |
| Members | CRUD | CRUD | R | R |
| Invitations | CRUD | CRUD | - | - |
| Documents | CRUD | CRUD | CRU | R |
| Chat | CRUD | CRUD | CRUD | R |
| Analytics | R | R | R | R |
| Billing | CRUD | CRUD | R | R |
| API Keys | CRUD | CRUD | R | - |
| Audit Logs | R | R | - | - |
| Widget Config | CRUD | CRUD | R | - |
| MCP Config | CRUD | CRUD | R | - |

---

## WORKSPACE ISOLATION (RLS)

All queries are scoped to `workspace_id` via:
- `lib/middleware/tenant.ts` — Extracts workspace from session
- `lib/rbac.ts` — Checks role permissions
- Prisma `where: { workspaceId }` on all queries

### RLS-Protected Tables
- documents, document_chunks, chat_sessions, chat_messages
- widgets, widget_conversations, widget_messages
- whatsapp_configs, whatsapp_conversations, whatsapp_messages
- api_keys, api_usage_logs, audit_logs
- analytics_events, notification_configs
- workspace_members, workspace_invitations, workspace_settings
- workspace_subscriptions, workspace_usage

---

## ACTIVITY LOG

- **API:** `GET /api/workspace/activity`
- **Component:** `activity-log.tsx`
- **Tracks:**
  - Member added/removed
  - Role changed
  - Document uploaded/deleted
  - Settings changed
  - Billing events
  - Invitation sent/accepted/revoked
