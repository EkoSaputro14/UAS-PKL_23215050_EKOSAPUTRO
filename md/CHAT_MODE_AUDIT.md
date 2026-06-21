# CHAT MODE AUDIT REPORT
**MimoNotes — Prompt Selection Flow Analysis**
**Date:** June 9, 2026

---

## EXECUTIVE SUMMARY

**Root Cause Found:** The prompt template system exists (`lib/prompts/templates.ts`) with 3 modes (KB, CS, Sales), but **NO entry point passes `promptContext` to the RAG pipeline**. Both `streamRAGResponse()` and the widget routes always use the hardcoded KB prompt.

**Impact:** Dashboard Chat, Widget Chat, and Embedded Widget all produce identical "Berdasarkan dokumen..." responses regardless of widget mode setting.

---

## CHAT ENTRY POINTS

### 1. Dashboard Chat (`/chat`)
- **API Route:** `app/api/chat/route.ts`
- **Component:** `components/chat/chat-window.tsx`
- **RAG Call:** `streamRAGResponse(message, 5, workspaceId)` — **NO promptContext**
- **Prompt Used:** Hardcoded KB prompt (line 287-297 in chain.ts)
- **Mode Selection:** None — always KB mode

### 2. Widget Chat (`/api/widget/chat`)
- **API Route:** `app/api/widget/chat/route.ts`
- **RAG Call:** `generateRAGResponse(message, 5, widget.workspaceId)` — **NO promptContext**
- **Prompt Used:** Falls back to legacy KB prompt (line 186-197 in chain.ts)
- **Mode Selection:** Widget has `mode` field in DB but **never read**

### 3. Widget Chat Stream (`/api/widget/chat/stream`)
- **API Route:** `app/api/widget/chat/stream/route.ts`
- **RAG Call:** `streamRAGResponse(message, 5, widget.workspaceId)` — **NO promptContext**
- **Prompt Used:** Hardcoded KB prompt (line 287-297 in chain.ts)
- **Mode Selection:** None — always KB mode

### 4. Embedded Widget (client-side)
- **Component:** Widget embed script (loaded via `<script>` tag)
- **API Calls:** Same as Widget Chat Stream above
- **Mode Selection:** Inherits from widget settings (but never propagated)

---

## PROMPT TEMPLATE SYSTEM

### Available Modes (`lib/prompts/templates.ts`)
| Mode | Type | Description |
|------|------|-------------|
| `knowledge_base` | `WidgetMode` | Strict KB-only answers, cites sources |
| `customer_service` | `WidgetMode` | Natural CS, never rejects, offers help |
| `sales_agent` | `WidgetMode` | Conversion-focused, lead capture |

### PromptContext Interface
```typescript
interface PromptContext {
  mode: WidgetMode;
  businessName: string;
  businessDescription: string;
  contactInfo: { whatsapp?, phone?, email?, address? };
  knowledgeContext: string;
  conversationHistory: string;
}
```

### buildSystemPrompt() — Works correctly
- `knowledge_base` → `buildKBPrompt()` — strict, cites sources
- `customer_service` → `buildCSPrompt()` — natural, never rejects
- `sales_agent` → `buildSalesPrompt()` — conversion-focused

---

## WHERE MODE IS STORED

### Widget Model (Prisma)
```prisma
model Widget {
  mode                String   @default("knowledge_base") @map("mode") @db.VarChar(30)
  businessName        String?  @map("business_name") @db.VarChar(200)
  businessDescription String?  @map("business_description") @db.Text
  businessWhatsApp    String?  @map("business_whatsapp") @db.VarChar(30)
  businessPhone       String?  @map("business_phone") @db.VarChar(30)
  businessEmail       String?  @map("business_email") @db.VarChar(200)
  businessAddress     String?  @map("business_address") @db.Text
}
```

### Widget Settings Form
- `widgetMode` state exists (line 50)
- Can be changed in settings UI
- Saved to DB correctly
- **BUT: Never read when generating responses**

---

## PROPAGATION CHAIN (BROKEN)

```
Widget Settings (DB)
  ↓ mode = "customer_service" ✅ saved
  ↓
Widget Chat API
  ↓ reads widget from DB ✅
  ↓ BUT never builds PromptContext ❌
  ↓
generateRAGResponse() / streamRAGResponse()
  ↓ promptContext = undefined ❌
  ↓
Legacy KB Prompt (hardcoded)
  ↓ "Anda adalah asisten AI yang HANYA menjawab berdasarkan konteks dokumen..."
  ↓
Response: "Berdasarkan dokumen..." ❌ ALWAYS KB MODE
```

---

## WHAT NEEDS TO BE FIXED

### Fix 1: `streamRAGResponse()` must accept `promptContext`
**File:** `lib/rag/chain.ts` (line 248)
- Add `promptContext?: PromptContext` parameter
- Use `buildSystemPrompt()` when provided
- Fall back to legacy KB prompt when omitted

### Fix 2: Widget Chat API must build PromptContext
**File:** `app/api/widget/chat/route.ts` (line 219)
- Read `widget.mode`, `widget.businessName`, etc.
- Build `PromptContext` from widget settings
- Pass to `generateRAGResponse()`

### Fix 3: Widget Chat Stream API must build PromptContext
**File:** `app/api/widget/chat/stream/route.ts` (line 151)
- Same as Fix 2 but for streaming endpoint
- Pass to `streamRAGResponse()`

### Fix 4: Dashboard Chat must support mode selection
**File:** `app/api/chat/route.ts` (line 103)
- Accept optional `mode` parameter from request body
- Build PromptContext with workspace settings
- Pass to `streamRAGResponse()`

### Fix 5: Dashboard Chat UI must show mode selector
**File:** `components/chat/chat-window.tsx`
- Add mode selector dropdown (KB / CS / Sales)
- Default to "customer_service" for new sessions
- Send mode in request body

---

## RESPONSE STYLE COMPARISON

### Current (All modes produce this):
> "Berdasarkan dokumen yang tersedia, informasi tentang harga rumah 100 juta adalah..."

### Expected Customer Service mode:
> "Halo! Terima kasih sudah bertanya. Untuk rumah dengan budget 100 juta, kami memiliki beberapa pilihan yang menarik. Mau saya bantu cari yang paling cocok dengan kebutuhan Anda?"

### Expected Sales Agent mode:
> "Budget 100 juta? Mantap! Kami ada beberapa unit yang masih available. Boleh tahu lokasi yang Anda inginkan? Saya bantu carikan yang paling pas."

---

## VERIFICATION CHECKLIST

| Entry Point | Mode Stored | Mode Read | PromptContext Built | Correct Prompt Used |
|-------------|------------|-----------|--------------------|--------------------|
| Dashboard Chat | N/A | ❌ | ❌ | ❌ KB only |
| Widget Chat | ✅ | ❌ | ❌ | ❌ KB only |
| Widget Stream | ✅ | ❌ | ❌ | ❌ KB only |
| Embedded Widget | ✅ | ❌ | ❌ | ❌ KB only |

**Score: 0/4 entry points working correctly**
