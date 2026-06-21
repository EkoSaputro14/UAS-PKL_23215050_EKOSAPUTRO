# WhatsApp Integration V1 — Implementation Plan

## Overview
Implement WhatsApp Business Platform (Cloud API) integration for MimoNotes.
Shared knowledge base, lead capture, analytics, and lead scoring with existing systems.

## Files to Create

### Phase 1: Database Schema
- [ ] `prisma/schema.prisma` — Add WhatsAppConfig, WhatsAppConversation, WhatsAppMessage models
- [ ] `prisma/migrations/006_add_whatsapp.sql` — Migration SQL + RLS policies

### Phase 2: Library Files
- [ ] `lib/whatsapp/client.ts` — Meta Cloud API client (send text/image/doc, download media, mark as read)
- [ ] `lib/whatsapp/webhook.ts` — Signature verification + payload parsing
- [ ] `lib/whatsapp/processor.ts` — Message processing pipeline (incoming → RAG → respond)
- [ ] `lib/whatsapp/leads.ts` — Lead integration (extract, update, query, export)

### Phase 3: API Routes
- [ ] `app/api/whatsapp/webhook/route.ts` — GET (verify) + POST (incoming messages)
- [ ] `app/api/whatsapp/config/route.ts` — GET/POST/DELETE workspace WhatsApp config
- [ ] `app/api/whatsapp/config/test/route.ts` — POST test connection
- [ ] `app/api/whatsapp/conversations/route.ts` — GET list conversations
- [ ] `app/api/whatsapp/conversations/[id]/route.ts` — GET detail + PATCH update lead
- [ ] `app/api/whatsapp/conversations/[id]/messages/route.ts` — GET messages + POST send reply

### Phase 4: UI Components
- [ ] `components/whatsapp/whatsapp-settings.tsx` — Config form + test connection
- [ ] `components/whatsapp/conversation-list.tsx` — Conversation list with filters
- [ ] `components/whatsapp/chat-view.tsx` — Chat view with manual reply
- [ ] `app/(admin)/settings/whatsapp/page.tsx` — Settings page
- [ ] `app/(admin)/whatsapp/page.tsx` — WhatsApp dashboard page
- [ ] `app/(admin)/whatsapp/conversations/[id]/page.tsx` — Conversation detail page

### Phase 5: Integration
- [ ] `app/(admin)/settings/layout.tsx` — Add "WhatsApp" to settings nav
- [ ] `components/layout/app-sidebar.tsx` — Add "WhatsApp" nav item
- [ ] `lib/entitlements.ts` — Add `whatsapp_integration` feature
- [ ] `prisma/seed-entitlements.ts` — Seed WhatsApp feature for pro/enterprise

## Key Integration Points

### Shared RAG Pipeline
```typescript
import { streamRAGResponse } from "@/lib/rag/chain";
// Same as widget: streamRAGResponse(message, workspaceId, options)
```

### Shared Lead Capture
```typescript
import { detectIntent, calculateLeadScore } from "@/lib/lead-intent";
// Same intent detection: harga, beli, booking, demo, hubungi
// Same scoring: low | medium | high
```

### Shared Analytics
```typescript
import { recordAnalyticsEvent } from "@/lib/analytics";
import { trackChatMessage } from "@/lib/usage";
// recordAnalyticsEvent(workspaceId, "whatsapp_chat", { ... })
// trackChatMessage(workspaceId)
```

### Shared Audit
```typescript
import { logAudit } from "@/lib/audit";
// logAudit({ workspaceId, action: "whatsapp.message_received", ... })
```

## Security Requirements
1. HMAC-SHA256 webhook signature verification (crypto.timingSafeEqual)
2. Access token encryption at rest (AES-256-GCM)
3. Token never in API responses (Prisma select exclusion)
4. Rate limiting on webhook (100/min per phone_number_id)
5. Tenant isolation via phone_number_id → workspace resolution

## Build & Verify
1. `npx prisma db push` — Apply schema changes
2. `npx prisma generate` — Regenerate client
3. `npm run build` — Production build (zero TypeScript errors)
4. Manual test: configure WhatsApp → send message → verify RAG response
