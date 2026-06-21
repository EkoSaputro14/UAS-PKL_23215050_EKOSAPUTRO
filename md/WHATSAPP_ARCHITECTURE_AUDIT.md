# WhatsApp Integration V1 — Architecture Audit

**Date:** 2026-06-16
**Status:** Architecture Complete — Ready for Implementation
**Scope:** Meta Cloud API integration for MimoNotes AI Chatbot Platform

---

## 1. Executive Summary

WhatsApp Integration V1 connects MimoNotes to the WhatsApp Business Platform (Cloud API), enabling businesses to receive and respond to WhatsApp messages through the same AI-powered RAG pipeline used by the web widget and API platform.

**Key Design Decision:** WhatsApp conversations reuse the existing `WidgetConversation` model (extended with a `channel` discriminator) rather than creating a separate conversation model. This ensures shared knowledge base, shared lead capture, shared analytics, and shared lead scoring with zero duplication.

---

## 2. Architecture Overview

### 2.1 System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        WhatsApp Users                           │
│                   (Customers / Leads)                           │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS (Meta Cloud API)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Meta Cloud API                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Webhook      │  │ Send API     │  │ Media Download API   │  │
│  │ (incoming)   │  │ (outgoing)   │  │ (images/docs/audio)  │  │
│  └──────┬───────┘  └──────▲───────┘  └──────────┬───────────┘  │
└─────────┼────────────────┼──────────────────────┼──────────────┘
          │                │                      │
          ▼                │                      │
┌──────────────────────────┼──────────────────────┼──────────────┐
│                   MimoNotes App (Next.js)        │              │
│                          │                      │              │
│  ┌───────────────────────┴──────────────────────┴────────────┐ │
│  │              WhatsApp Webhook Handler                      │ │
│  │  POST /api/whatsapp/webhook                               │ │
│  │  - Signature verification (HMAC-SHA256)                   │ │
│  │  - Message type routing (text/image/doc/audio)            │ │
│  │  - Status update processing                               │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                      │
│  ┌───────────────────────▼───────────────────────────────────┐ │
│  │              Message Processor                             │ │
│  │  lib/whatsapp/processor.ts                                │ │
│  │  - Resolve workspace from phone_number_id                 │ │
│  │  - Find/create conversation (by waId + workspace)         │ │
│  │  - Save incoming message                                  │ │
│  │  - Run RAG pipeline (shared with widget)                  │ │
│  │  - Detect intent + calculate lead score                   │ │
│  │  - Save AI response + send via Meta API                   │ │
│  │  - Track analytics + usage                                │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                      │
│  ┌───────────────────────▼───────────────────────────────────┐ │
│  │              Shared Systems (Existing)                     │ │
│  │  ┌────────────┐ ┌────────────┐ ┌───────────────────────┐  │ │
│  │  │ RAG Chain  │ │ Lead       │ │ Analytics + Usage     │  │ │
│  │  │ (knowledge │ │ Intent +   │ │ (trackChatMessage,    │  │ │
│  │  │  base)     │ │ Scoring    │ │  recordAnalyticsEvent)│  │ │
│  │  └────────────┘ └────────────┘ └───────────────────────┘  │ │
│  │  ┌────────────┐ ┌────────────┐ ┌───────────────────────┐  │ │
│  │  │ Audit Log  │ │ Entitle-   │ │ Notifications         │  │ │
│  │  │ (logAudit) │ │ ments      │ │ (sendLeadNotification)│  │ │
│  │  └────────────┘ └────────────┘ └───────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                          │                                      │
│  ┌───────────────────────▼───────────────────────────────────┐ │
│  │              Database (PostgreSQL + pgvector)              │ │
│  │  ┌────────────────────┐ ┌────────────────────────────────┐│ │
│  │  │ whatsapp_configs   │ │ whatsapp_conversations         ││ │
│  │  │ (workspace-level   │ │ (extends lead model with       ││ │
│  │  │  API credentials)  │ │  waId, channel='whatsapp')     ││ │
│  │  └────────────────────┘ └────────────────────────────────┘│ │
│  │  ┌────────────────────┐ ┌────────────────────────────────┐│ │
│  │  │ whatsapp_messages  │ │ WidgetConversation (extended)  ││ │
│  │  │ (message store)    │ │ (shared lead capture)          ││ │
│  │  └────────────────────┘ └────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — Incoming Message

```
1. User sends WhatsApp message
2. Meta delivers to POST /api/whatsapp/webhook
3. Verify HMAC-SHA256 signature
4. Parse webhook payload → extract phone_number_id, from, message
5. Lookup whatsapp_config by phone_number_id → get workspaceId + accessToken
6. Find or create whatsapp_conversation by (waId, workspaceId)
7. Save incoming message to whatsapp_messages
8. If text: run RAG pipeline (streamRAGResponse)
9. If image: download via Media API → OCR → process
10. If document: download → parse → process
11. Detect intent from user message
12. Calculate lead score
13. Save AI response to whatsapp_messages
14. Send response via Meta Send API
15. Track: trackChatMessage(), recordAnalyticsEvent(), logAudit()
```

### 2.3 Data Flow — Outgoing Message (Manual Reply)

```
1. Admin opens WhatsApp conversation in dashboard
2. Types manual reply
3. POST /api/whatsapp/conversations/[id]/messages
4. Save message to whatsapp_messages
5. Send via Meta Send API
6. Track analytics
```

---

## 3. Database Schema

### 3.1 New Models

```prisma
/// WhatsApp Business API configuration per workspace
model WhatsAppConfig {
  id              String   @id @default(uuid())
  workspaceId     String   @unique @map("workspace_id")
  phoneNumberId   String   @map("phone_number_id") @db.VarChar(50)
  accessToken     String   @map("access_token") @db.Text
  verifyToken     String   @map("verify_token") @db.VarChar(200)
  businessAccountId String? @map("business_account_id") @db.VarChar(50)
  phoneNumber     String?  @map("phone_number") @db.VarChar(30)
  displayName     String?  @map("display_name") @db.VarChar(200)
  isEnabled       Boolean  @default(true) @map("is_enabled")
  welcomeMessage  String?  @map("welcome_message") @db.Text
  offlineMessage  String?  @map("offline_message") @db.Text
  autoReply       Boolean  @default(true) @map("auto_reply")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  conversations WhatsAppConversation[]
  messages      WhatsAppMessage[]

  @@map("whatsapp_configs")
}

/// WhatsApp conversations with customers
model WhatsAppConversation {
  id              String   @id @default(uuid())
  workspaceId     String   @map("workspace_id")
  configId        String   @map("config_id")
  waId            String   @map("wa_id") @db.VarChar(30)  // WhatsApp user ID (phone number)
  contactName     String?  @map("contact_name") @db.VarChar(200)
  
  // Lead capture fields (shared with widget pattern)
  leadName        String?  @map("lead_name") @db.VarChar(200)
  leadEmail       String?  @map("lead_email") @db.VarChar(300)
  leadWhatsApp    String?  @map("lead_whatsapp") @db.VarChar(30)
  leadData        Json?    @map("lead_data")
  leadScore       String?  @default("low") @map("lead_score") @db.VarChar(20)
  leadStatus      String?  @default("new") @map("lead_status") @db.VarChar(20)
  leadIntent      String?  @map("lead_intent") @db.VarChar(30)
  
  messageCount    Int      @default(0) @map("message_count")
  lastMessageAt   DateTime? @map("last_message_at")
  lastMessagePreview String? @map("last_message_preview") @db.VarChar(200)
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  workspace  Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  config     WhatsAppConfig    @relation(fields: [configId], references: [id], onDelete: Cascade)
  messages   WhatsAppMessage[]

  @@unique([workspaceId, waId])
  @@map("whatsapp_conversations")
}

/// WhatsApp messages (both incoming and outgoing)
model WhatsAppMessage {
  id              String   @id @default(uuid())
  conversationId  String   @map("conversation_id")
  workspaceId     String   @map("workspace_id")
  
  // Message content
  role            String   @db.VarChar(20)  // "user" | "assistant" | "system"
  content         String   @db.Text
  messageType     String   @default("text") @map("message_type") @db.VarChar(20)  // text|image|document|audio|video|sticker
  mediaUrl        String?  @map("media_url") @db.Text
  mediaId         String?  @map("media_id") @db.VarChar(100)
  mimeType        String?  @map("mime_type") @db.VarChar(100)
  
  // Meta API tracking
  metaMessageId   String?  @map("meta_message_id") @db.VarChar(100)  // WhatsApp message ID from Meta
  deliveryStatus  String?  @default("sent") @map("delivery_status") @db.VarChar(20)  // sent|delivered|read|failed
  
  // RAG metadata
  sources         Json?    // Document sources used in response
  
  createdAt       DateTime @default(now()) @map("created_at")

  conversation WhatsAppConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  workspace    Workspace            @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
  @@index([metaMessageId])
  @@map("whatsapp_messages")
}
```

### 3.2 Schema Changes to Existing Models

```prisma
// Add to Workspace model:
whatsappConfigs     WhatsAppConfig[]
whatsappConversations WhatsAppConversation[]
whatsappMessages    WhatsAppMessage[]
```

### 3.3 RLS Policies

```sql
-- whatsapp_configs: workspace-scoped
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_configs_tenant_isolation ON whatsapp_configs
  USING (workspace_id = current_setting('app.current_workspace_id'));

-- whatsapp_conversations: workspace-scoped
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_conversations_tenant_isolation ON whatsapp_conversations
  USING (workspace_id = current_setting('app.current_workspace_id'));

-- whatsapp_messages: DISABLED (accessed through conversation FK)
-- Same pattern as widget_messages — no direct RLS needed
ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;
```

---

## 4. API Routes

### 4.1 Webhook (Public — No Auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/whatsapp/webhook` | Webhook verification (Meta challenge) |
| `POST` | `/api/whatsapp/webhook` | Incoming message handler |

### 4.2 Admin API (Session Auth + Workspace Scoped)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/whatsapp/config` | Get WhatsApp config for workspace |
| `POST` | `/api/whatsapp/config` | Create/update WhatsApp config |
| `DELETE` | `/api/whatsapp/config` | Delete WhatsApp config |
| `POST` | `/api/whatsapp/config/test` | Test connection to Meta API |
| `GET` | `/api/whatsapp/conversations` | List conversations (paginated) |
| `GET` | `/api/whatsapp/conversations/[id]` | Get conversation detail |
| `GET` | `/api/whatsapp/conversations/[id]/messages` | Get messages |
| `POST` | `/api/whatsapp/conversations/[id]/messages` | Send manual reply |
| `PATCH` | `/api/whatsapp/conversations/[id]` | Update lead status/score |

### 4.3 API Routes (API Key Auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/whatsapp/conversations` | List conversations |
| `GET` | `/api/v1/whatsapp/conversations/[id]/messages` | Get messages |
| `POST` | `/api/v1/whatsapp/send` | Send message to a WhatsApp user |

---

## 5. Library Files

### 5.1 `lib/whatsapp/client.ts` — Meta Cloud API Client

```typescript
// Functions:
sendTextMessage(accessToken, phoneNumberId, to, text): Promise<SendResult>
sendImageMessage(accessToken, phoneNumberId, to, imageUrl, caption?): Promise<SendResult>
sendDocumentMessage(accessToken, phoneNumberId, to, documentUrl, filename, caption?): Promise<SendResult>
sendTemplateMessage(accessToken, phoneNumberId, to, templateName, language, components?): Promise<SendResult>
downloadMedia(accessToken, mediaId): Promise<{ buffer: Buffer, mimeType: string }>
markAsRead(accessToken, phoneNumberId, messageId): Promise<void>
getPhoneNumberInfo(accessToken, phoneNumberId): Promise<PhoneInfo>
```

### 5.2 `lib/whatsapp/processor.ts` — Message Processing Pipeline

```typescript
// Functions:
processIncomingMessage(payload: WebhookPayload): Promise<void>
handleTextMessage(config: WhatsAppConfig, conversation: WhatsAppConversation, message: TextMessage): Promise<void>
handleImageMessage(config: WhatsAppConfig, conversation: WhatsAppConversation, message: ImageMessage): Promise<void>
handleDocumentMessage(config: WhatsAppConfig, conversation: WhatsAppConversation, message: DocumentMessage): Promise<void>
sendAIResponse(config: WhatsAppConfig, conversationId: string, response: string, sources?: Source[]): Promise<void>
```

### 5.3 `lib/whatsapp/webhook.ts` — Webhook Utilities

```typescript
// Functions:
verifyWebhookSignature(body: string, signature: string, appSecret: string): boolean
parseWebhookPayload(body: any): WebhookPayload | null
extractMessageType(value: any): MessageType
handleStatusUpdate(payload: WebhookPayload): Promise<void>  // delivery receipts
```

### 5.4 `lib/whatsapp/leads.ts` — Lead Integration

```typescript
// Functions:
extractLeadFromWhatsApp(contactName: string, waId: string): Partial<LeadData>
updateWhatsAppLead(conversationId: string, leadData: LeadData): Promise<void>
getWhatsAppLeads(workspaceId: string, filters?: LeadFilters): Promise<PaginatedLeads>
exportWhatsAppLeads(workspaceId: string): Promise<string>  // CSV
```

---

## 6. Shared Systems Integration

### 6.1 Knowledge Base (RAG Pipeline)

WhatsApp messages flow through the same RAG pipeline as widget chat:

```typescript
// In lib/whatsapp/processor.ts
import { streamRAGResponse } from "@/lib/rag/chain";

const result = await streamRAGResponse(
  userMessage,
  conversation.workspaceId,
  { maxSources: 3, similarityThreshold: 0.30 }
);
```

### 6.2 Lead Capture

WhatsApp conversations use the same lead model as widget conversations:

```typescript
// Lead data is automatically extracted from WhatsApp contact info
const leadData = extractLeadFromWhatsApp(contactName, waId);
// → { name: contactName, whatsapp: waId }

// Lead intent detection uses existing lib/lead-intent.ts
const intent = detectIntent(userMessage);  // harga|beli|booking|demo|hubungi
const score = calculateLeadScore(hasLead, intent, messageCount);
```

### 6.3 Analytics

WhatsApp interactions tracked via existing analytics system:

```typescript
import { recordAnalyticsEvent } from "@/lib/analytics";
import { trackChatMessage } from "@/lib/usage";

// Record chat event
await recordAnalyticsEvent(workspaceId, "whatsapp_chat", {
  conversationId,
  messageCount,
  leadScore,
  channel: "whatsapp",
});

// Track usage for billing
await trackChatMessage(workspaceId);
```

### 6.4 Audit Logging

```typescript
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

await logAudit({
  workspaceId,
  actorId: "system",
  actorType: "system",
  action: "whatsapp.message_received",
  resourceType: "whatsapp_conversation",
  resourceId: conversationId,
  metadata: { from: waId, messageType },
});
```

### 6.5 Entitlements

WhatsApp integration gated by `whatsapp_integration` feature:

```typescript
import { requireFeature } from "@/lib/entitlements";

// In API routes
await requireFeature("whatsapp_integration");
```

Feature added to `PlanFeature` table:
- Free: not available
- Pro: available (1 phone number)
- Enterprise: available (unlimited phone numbers)

---

## 7. Security Architecture

### 7.1 Webhook Signature Verification

Every incoming webhook request is verified against HMAC-SHA256:

```typescript
const signature = request.headers.get("x-hub-signature-256");
const expectedSignature = "sha256=" + crypto
  .createHmac("sha256", appSecret)
  .update(rawBody)
  .digest("hex");

if (!crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
)) {
  return new Response("Invalid signature", { status: 401 });
}
```

### 7.2 Access Token Storage

- Stored in `whatsapp_configs.access_token` (database-level)
- Encrypted at rest using AES-256-GCM (same as API keys in `lib/api-keys.ts`)
- Never exposed in API responses (excluded via Prisma `select`)
- Never logged in audit logs or analytics

### 7.3 Rate Limiting

- Webhook endpoint: 100 requests/minute per phone_number_id
- Manual reply endpoint: 30 messages/minute per workspace
- API endpoint: uses existing workspace rate limits

### 7.4 Tenant Isolation

- Webhook handler resolves workspace from phone_number_id (not from session)
- All queries scoped to workspace_id
- RLS enforced on whatsapp_configs and whatsapp_conversations
- whatsapp_messages accessed through conversation FK (no direct access)

---

## 8. UI Components

### 8.1 Settings Page: `/settings/whatsapp`

- **Connection Status** — Connected/Disconnected badge
- **Phone Number** — Display name + number
- **Configuration Form** — Phone Number ID, Access Token, Verify Token
- **Test Connection** — Button to verify API credentials
- **Auto-Reply Toggle** — Enable/disable AI auto-reply
- **Welcome Message** — Custom greeting for new conversations
- **Offline Message** — Response when AI is disabled

### 8.2 Dashboard: WhatsApp Conversations

- **Conversation List** — Searchable, filterable by lead status/score
- **Chat View** — Full conversation history with manual reply
- **Lead Info Panel** — Name, phone, email, score, status
- **Quick Actions** — Update status, assign, export

### 8.3 Settings Navigation

Added "WhatsApp" item to settings-nav.tsx (12th item):
```
Akun | AI Settings | Workspace | Keamanan | Notifikasi | API Keys | MCP | Widget | Leads | WhatsApp | Billing | Audit Logs
```

---

## 9. Deployment Architecture

### 9.1 Environment Variables

```env
# WhatsApp Business Platform
WHATSAPP_APP_SECRET=your_app_secret        # For webhook signature verification
WHATSAPP_VERIFY_TOKEN=your_verify_token    # For webhook verification challenge
```

### 9.2 Meta App Configuration

1. Create Meta App at developers.facebook.com
2. Add WhatsApp product
3. Configure webhook URL: `https://mimotes.ekohomelab.online/api/whatsapp/webhook`
4. Subscribe to messages, message_deliveries, message_reads
5. Generate permanent access token
6. Register phone number

### 9.3 Cloudflare Tunnel

WhatsApp webhook requires HTTPS. Existing Cloudflare tunnel handles this:
```
mimotes.ekohomelab.online → Cloudflare Tunnel → localhost:3100
```

---

## 10. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Meta API rate limits (80 msg/sec) | Medium | Queue-based sending with backoff |
| Access token expiration | High | Token refresh monitoring + alert |
| Webhook downtime during deployment | Medium | Meta retries for 24h + status page |
| Message ordering guarantees | Low | Meta delivers in order per conversation |
| Large media files (100MB limit) | Low | Stream download + size validation |
| Cross-tenant message leak | Critical | phone_number_id → workspace resolution + RLS |
| Token exposure in logs | High | Secret redaction + audit log filtering |

---

## 11. Estimated Implementation

| Component | Files | Lines | Complexity |
|-----------|-------|-------|------------|
| Database schema + migration | 2 | ~150 | Low |
| WhatsApp client library | 1 | ~300 | Medium |
| Message processor | 1 | ~400 | High |
| Webhook handler | 1 | ~200 | Medium |
| Webhook utilities | 1 | ~100 | Low |
| Lead integration | 1 | ~100 | Low |
| API routes (admin) | 4 | ~400 | Medium |
| API routes (webhook) | 1 | ~200 | Medium |
| UI settings page | 2 | ~500 | Medium |
| UI conversation view | 3 | ~600 | High |
| Entitlements | 1 | ~30 | Low |
| Audit logging | Integrated | ~50 | Low |
| **Total** | **~18** | **~3,030** | |

---

*Architecture by Hermes Agent — Ready for implementation delegation.*
