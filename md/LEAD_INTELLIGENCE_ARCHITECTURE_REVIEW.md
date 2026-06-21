# LEAD INTELLIGENCE — Architecture Review
**MimoNotes — Schema Simplification + Transcript Analysis**

**Date:** 2026-06-08
**Status:** APPROVED (simplified)
**Reviewer:** ECC Review Mode

---

## 1. SCHEMA ANALYSIS

### Current State

**There is NO separate Lead model.**

Leads are `WidgetConversation` records with lead fields populated:

```
WidgetConversation
├── leadName         (String?)
├── leadEmail        (String?)
├── leadWhatsApp     (String?)
├── leadScore        (String: low/medium/high)
├── leadStatus       (String: new/contacted/converted)
├── leadIntent       (String?)
├── leadSummary      (Text?)
├── businessInterest (String?)
├── budget           (String?)
├── location         (String?)
└── messages         (WidgetMessage[])
    ├── id
    ├── role (user/assistant)
    ├── content
    ├── createdAt
    └── ...
```

### Transcript Already Exists

```typescript
// Get conversation transcript — NO new table needed
const conversation = await prisma.widgetConversation.findUnique({
  where: { id: leadId },
  include: {
    messages: {
      orderBy: { createdAt: 'asc' }
    }
  }
});
// → conversation.messages = full transcript
```

### LeadConversation Table: NOT NEEDED

| Original PRD | Architecture Review |
|--------------|---------------------|
| Create `LeadConversation` junction table | ❌ REMOVE — `WidgetConversation.messages` already provides this |
| Join Lead → Session → ChatMessage | ❌ REMOVE — messages are directly on conversation |
| Multiple sessions per lead | ❌ N/A — widget conversations are per-session already |

**Decision: Do NOT create LeadConversation table.**

---

## 2. SIMPLIFIED SCHEMA

### Required Additions Only

```prisma
// Add to WidgetConversation model (4 new columns only)
model WidgetConversation {
  // ... existing fields ...

  // NEW: Notification tracking
  seen      Boolean   @default(false)
  seenAt    DateTime? @map("seen_at")

  // NEW: Intelligence (Phase C)
  timeline  String?   @db.VarChar(50)     // "urgent", "planning", "exploring"
  followUp  String?   @map("follow_up") @db.Text  // AI-suggested action
}
```

### Schema Comparison

| Original PRD | Simplified | Status |
|--------------|------------|--------|
| `intent` | `leadIntent` (exists) | ✅ Already exists |
| `intentConfidence` | REMOVE | ❌ Not needed for MVP |
| `budgetMin` | REMOVE | ❌ `budget` field already stores text |
| `budgetMax` | REMOVE | ❌ `budget` field already stores text |
| `budgetRaw` | `budget` (exists) | ✅ Already exists |
| `timeline` | ADD | ✅ New (4 values) |
| `timelineConfidence` | REMOVE | ❌ Regex is deterministic |
| `keyQuestions` | REMOVE | ❌ Can extract from transcript on demand |
| `suggestedFollowUp` | `followUp` | ✅ New (simplified) |
| `intelligenceAt` | REMOVE | ❌ Not caching in MVP |
| `seen` | ADD | ✅ New |
| `seenAt` | ADD | ✅ New |

### Final Migration

```sql
-- Add 4 columns to widget_conversations
ALTER TABLE widget_conversations ADD COLUMN seen BOOLEAN DEFAULT FALSE;
ALTER TABLE widget_conversations ADD COLUMN seen_at TIMESTAMP;
ALTER TABLE widget_conversations ADD COLUMN timeline VARCHAR(50);
ALTER TABLE widget_conversations ADD COLUMN follow_up TEXT;

-- Index for notification queries
CREATE INDEX idx_widget_conversations_seen
  ON widget_conversations(workspace_id, seen, started_at)
  WHERE seen = FALSE;
```

---

## 3. TRANSCRIPT VIEW ARCHITECTURE

### Data Flow

```
Lead Detail Page (/leads/[id])
  │
  ├── Fetch WidgetConversation (with lead fields)
  │
  ├── Fetch WidgetMessage[] (via .messages relation)
  │   └── Already sorted by createdAt ASC
  │
  └── Display:
      ├── Contact Panel (name, phone, email, score)
      ├── Summary Panel (summary, budget, location, intent)
      └── Transcript Panel (message bubbles)
```

### API Endpoint

```typescript
// GET /api/leads/[id]/transcript
// Returns: conversation + messages + intelligence

const conversation = await prisma.widgetConversation.findUnique({
  where: { id },
  include: {
    messages: {
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      }
    },
    widget: {
      select: { name: true }
    }
  }
});

return {
  conversation: {
    id, leadName, leadEmail, leadWhatsApp,
    leadScore, leadStatus, leadIntent,
    leadSummary, budget, location,
    startedAt, widgetName
  },
  messages: conversation.messages,
  messageCount: conversation.messages.length
};
```

---

## 4. NOTIFICATION ARCHITECTURE

### Data Flow

```
Dashboard (/leads)
  │
  ├── Fetch unseen leads (seen = false, last 24h)
  │   └── SELECT * FROM widget_conversations
  │       WHERE workspace_id = ?
  │       AND seen = FALSE
  │       AND started_at > NOW() - INTERVAL '24 hours'
  │       ORDER BY started_at DESC
  │       LIMIT 10
  │
  └── Display: Notification Bar
      ├── Count badge
      ├── Lead list (name, intent, time ago)
      └── Click → /leads/[id] → mark as seen
```

### API Endpoints

```typescript
// GET /api/leads/notifications
const unseen = await prisma.widgetConversation.findMany({
  where: {
    workspaceId,
    seen: false,
    startedAt: { gte: subHours(new Date(), 24) }
  },
  orderBy: { startedAt: 'desc' },
  take: 10,
  select: {
    id, leadName, leadIntent, leadScore, startedAt
  }
});

// POST /api/leads/[id]/seen
await prisma.widgetConversation.update({
  where: { id },
  data: { seen: true, seenAt: new Date() }
});
```

---

## 5. INTELLIGENCE ENGINE ARCHITECTURE

### Phase C: Regex-Based Intelligence

```typescript
// lib/lead-intelligence.ts

export function classifyIntent(text: string): string {
  const lower = text.toLowerCase();
  if (/beli|pesan|order|ambil|bayar|checkout/.test(lower)) return 'purchase';
  if (/tanya|info|detail|spesifikasi|cara|gimana/.test(lower)) return 'inquiry';
  if (/bantu|error|masalah|rusak|tidak bisa/.test(lower)) return 'support';
  if (/beda|mana lebih|vs|bandingkan|rekomendasi/.test(lower)) return 'comparison';
  return 'inquiry'; // default
}

export function extractBudget(text: string): string | null {
  const patterns = [
    /(?:budget|anggaran)\s*(?:sekitar\s*)?(\d[\d.,]*)\s*(juta|miliar)/i,
    /(\d[\d.,]*)\s*[-–]\s*(\d[\d.,]*)\s*(juta|miliar)/i,
    /(?:sekitar|kurang lebih)\s*(\d[\d.,]*)\s*(juta|miliar)/i,
    /(\d[\d.,]*)\s*(juta|miliar)\s*(?:ke\s*(?:bawah|atas))/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

export function detectTimeline(text: string): string {
  const lower = text.toLowerCase();
  if (/buru.?buru|segera|cepat|minggu ini|bulan ini/.test(lower)) return 'urgent';
  if (/rencana|nanti|tahun depan|mau mulai/.test(lower)) return 'planning';
  if (/coba dulu|lihat.?lihat|masih cari/.test(lower)) return 'exploring';
  return 'unknown';
}

export function generateFollowUp(
  intent: string,
  budget: string | null,
  timeline: string
): string {
  if (timeline === 'urgent') return 'Prioritaskan respons cepat — lead sedang buru-buru.';
  if (intent === 'purchase' && budget) return `Tawarkan produk sesuai budget ${budget}.`;
  if (intent === 'inquiry' && !budget) return 'Tanyakan budget range untuk rekomendasi yang tepat.';
  if (intent === 'support') return 'Tangani masalah dengan prioritas tinggi.';
  return 'Follow up dengan penawaran yang relevan.';
}
```

---

## 6. IMPLEMENTATION PHASES

### Phase A: Transcript View (Day 1-2)
1. Add `seen`, `seenAt` columns to WidgetConversation
2. Create `/leads/[id]` detail page
3. Create `/api/leads/[id]/transcript` API
4. Create transcript component with message bubbles
5. Test with existing leads

### Phase B: Notification Bar (Day 3)
1. Create `/api/leads/notifications` API
2. Create `/api/leads/[id]/seen` API
3. Create notification bar component
4. Add polling (10s interval)
5. Integrate with leads dashboard

### Phase C: Intelligence Lite (Day 4-5)
1. Add `timeline`, `followUp` columns
2. Create `/lib/lead-intelligence.ts`
3. Create `/api/leads/[id]/intelligence` API
4. Create intelligence panel component
5. Auto-generate on lead creation

---

## 7. COMPARISON: ORIGINAL vs SIMPLIFIED

| Metric | Original PRD | Simplified | Improvement |
|--------|--------------|------------|-------------|
| New tables | 1 (LeadConversation) | 0 | -100% complexity |
| New columns | 12 | 4 | -67% migration |
| New API endpoints | 4 | 4 | Same |
| New components | 4 | 4 | Same |
| Implementation time | 3-5 days | 2-3 days | -40% effort |
| Intelligence accuracy | LLM-based | Regex-based | Faster, cheaper |
| Caching | DB cache (first request) | DB cache (first request) | Aligned — cached in DB |

---

## 8. RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Regex intelligence inaccurate | Medium | Low | Templates cover 80%; LLM enhancement later |
| Notification polling DB load | Low | Low | Indexed query; 10s interval acceptable |
| `seen` column performance | Low | Low | Partial index on `WHERE seen = FALSE` |
| Existing data migration | Low | Low | `ALTER TABLE ADD COLUMN` with defaults |

---

## 9. ACCEPTANCE CRITERIA

### Transcript View
- [ ] Click lead → full conversation visible within 2s
- [ ] Messages sorted chronologically (ASC)
- [ ] Bot messages show timestamp
- [ ] Lead messages show timestamp
- [ ] Works for widget conversations

### Notifications
- [ ] New lead → notification count increases
- [ ] Click notification → navigate to lead detail
- [ ] View lead → notification disappears
- [ ] 10s polling → auto-update

### Intelligence
- [ ] Intent classified (4 categories)
- [ ] Budget extracted when mentioned
- [ ] Timeline detected (urgent/planning/exploring)
- [ ] Follow-up suggestion generated

### Regression
- [ ] Existing leads dashboard still works
- [ ] WhatsApp handoff still works
- [ ] Lead scoring still works

---

## 10. DECISIONS

| Decision | Choice | Reason |
|----------|--------|--------|
| LeadConversation table | ❌ NOT NEEDED | WidgetConversation already has messages |
| Intelligence engine | Regex-based | No LLM cost, <50ms, covers 80% |
| Notification delivery | Client-side polling | Simpler than WebSocket, 10s acceptable |
| Caching strategy | DB cache (first request) | Generated on first GET, saved to DB. Subsequent requests read from DB. Re-generates when `timeline` and `followUp` are both NULL (new lead). |
| Schema additions | 4 columns only | Minimal migration risk |

---

**Status: APPROVED**
**Next: Begin Phase A — Transcript View**
