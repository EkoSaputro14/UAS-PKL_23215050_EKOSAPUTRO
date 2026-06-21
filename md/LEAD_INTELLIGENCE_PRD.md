# LEAD INTELLIGENCE — Product Requirements Document
**MimoNotes — Feature: Lead Transcript + Intelligence + Notifications**

**Date:** 2026-06-08
**Status:** APPROVED
**Priority:** P0 — Revenue Phase
**Estimated Effort:** 3-5 days (2 days UI + 2 days backend + 1 day polish)

---

## 1. PROBLEM STATEMENT

Business owner collects leads via widget chat. Current state:

- **Leads Dashboard:** shows name, phone, email, score
- **Lead Summary:** auto-generated name/intent/budget/location (Sprint 2)
- **WhatsApp Handoff:** click button to contact lead (Sprint 3)

**Missing:** Business owner cannot see WHAT the lead actually said.
Without conversation context, every WhatsApp message starts cold.
The lead summary is a snapshot — it doesn't capture nuance, objections, or specific questions.

**Impact:** Business owner spends 5+ minutes on each lead figuring out context before contacting.

---

## 2. SOLUTION

### Feature 1: Lead Transcript View

Full conversation history between lead and widget chatbot.

```
┌─────────────────────────────────────────┐
│  📋 Lead Transcript                     │
│  Budi Santoso · Property · 2 leads      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Lead (10:32 AM)                 │    │
│  │ "Mau tanya rumah subsidi di     │    │
│  │  Adiwerna, ada yang 2 kamar?"   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Bot (10:32 AM)                  │    │
│  │ "Tentang rumah subsidi di       │    │
│  │  Adiwerna, ada beberapa opsi.   │    │
│  │  Berikut yang tersedia..."      │    │
│  │  📎 Sources: katalog_2024.md   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Lead (10:34 AM)                 │    │
│  │ "Harganya berapa?"             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [📎 Contact via WhatsApp]             │
└─────────────────────────────────────────┘
```

### Feature 2: Lead Intelligence Lite

AI-generated insights from conversation analysis:

```
┌─────────────────────────────────────────┐
│  🧠 Lead Intelligence                   │
│                                         │
│  ┌─ Intent ────────────────────────┐    │
│  │ 🔴 Urgent Purchase              │    │
│  │ Confidence: 85%                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─ Budget ────────────────────────┐    │
│  │ 💰 Rp 100-150 juta             │    │
│  │ Source: "budget saya sekitar     │    │
│  │ 100-an juta"                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─ Timeline ──────────────────────┐    │
│  │ ⏰ Cepat (1-2 bulan)           │    │
│  │ Source: "udah buru-buru"         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─ Key Questions ─────────────────┐    │
│  │ 1. Harga rumah subsidi Adiwerna │    │
│  │ 2. KPR syariah atau konvensional │    │
│  │ 3. DP berapa?                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─ Suggested Follow-up ───────────┐    │
│  │ 💡 "Tawarkan KPR simulasi       │    │
│  │  untuk budget 100-150 juta      │    │
│  │  dengan DP 10%"                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Feature 3: Dashboard Lead Notifications

Real-time dashboard notification when new lead arrives.

```
┌─────────────────────────────────────────┐
│  🔔 New Leads (3)                       │
│                                         │
│  🔴 Budi Santoso — Beli Rumah — 2 min ago│
│     [View] [WhatsApp]                   │
│                                         │
│  🔴 Rina Wati — Sewa Mobil — 15 min ago │
│     [View] [WhatsApp]                   │
│                                         │
│  🔴 dr. Anisa — Klinik Konsul — 1 jam   │
│     [View] [WhatsApp]                   │
└─────────────────────────────────────────┘
```

---

## 3. USER STORIES

### Lead Transcript View
| ID | Story | Priority |
|----|-------|----------|
| LT-1 | As business owner, I want to see the full conversation history of a lead | P0 |
| LT-2 | As business owner, I want to see timestamps for each message | P0 |
| LT-3 | As business owner, I want to see which sources the bot used to answer | P1 |
| LT-4 | As business owner, I want to filter by date range | P1 |
| LT-5 | As business owner, I want to search within a conversation | P2 |
| LT-6 | As business owner, I want to see all conversations for one lead (multiple sessions) | P1 |

### Lead Intelligence Lite
| ID | Story | Priority |
|----|-------|----------|
| LI-1 | As business owner, I want to see the lead's intent classified | P0 |
| LI-2 | As business owner, I want to see extracted budget | P0 |
| LI-3 | As business owner, I want to see the timeline/urgency | P0 |
| LI-4 | As business owner, I want to see the lead's key questions | P0 |
| LI-5 | As business owner, I want to see AI-suggested follow-up action | P1 |
| LI-6 | As business owner, I want to see confidence score for each insight | P1 |

### Dashboard Lead Notifications
| ID | Story | Priority |
|----|-------|----------|
| DN-1 | As business owner, I want to see new lead count on dashboard | P0 |
| DN-2 | As business owner, I want to see lead name, intent, and time ago | P0 |
| DN-3 | As business owner, I want to click a notification to go to lead detail | P0 |
| DN-4 | As business owner, I want notifications to auto-update without refresh | P1 |
| DN-5 | As business owner, I want to mark a lead as "seen" | P1 |
| DN-6 | As business owner, I want to see a summary of lead quality (hot/warm/cold) | P1 |

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 Data Model Extensions

```prisma
// Extend Lead model
model Lead {
  // ... existing fields ...

  // NEW: Intelligence fields
  intent              String?     // "purchase", "inquiry", "support", "comparison"
  intentConfidence    Float?      // 0-1
  budgetMin           Int?        // in rupiah
  budgetMax           Int?        // in rupiah
  budgetRaw           String?     // original text "100-150 juta"
  timeline            String?     // "urgent", "planning", "exploring"
  timelineConfidence  Float?
  keyQuestions        Json?       // ["Harga berapa?", "DP berapa?"]
  suggestedFollowUp   String?     // AI-generated suggestion
  intelligenceAt      DateTime?   // when intelligence was generated
  seenAt              DateTime?   // when business owner first viewed lead
  seen                Boolean     @default(false)
}

// NEW: Lead Conversation (links lead to sessions)
model LeadConversation {
  id            String    @id @default(cuid())
  leadId        String
  sessionId     String
  createdAt     DateTime  @default(now())

  lead          Lead      @relation(fields: [leadId], references: [id])
  session       Session   @relation(fields: [sessionId], references: [id])

  @@unique([leadId, sessionId])
}
```

### 4.2 Intelligence Engine

**Approach:** Regex + keyword extraction (no LLM call).

Why not LLM:
- Adds latency (500ms-2s)
- Adds cost ($0.001-0.01 per lead)
- Regex covers 80% of Indonesian business conversations
- LLM can be added later as enhancement

**Intent Classification (regex-based):**
```
PURCHASE:  beli, pesan, order, ambil, bayar, checkout, mau dapat
INQUIRY:   tanya, info, detail, spesifikasi, cara, gimana
SUPPORT:   bantu, error, masalah, rusak, tidak bisa, kok gini
COMPARISON: beda, mana lebih, vs, bandingkan, rekomendasi
```

**Budget Extraction (regex-based):**
```
Patterns:
- "Rp X-X juta" / "Rp X-X miliar"
- "budget X juta" / "anggaran X juta"
- "X-X jutaan" / "sekitar X juta"
- "X juta ke bawah/atas"
- "X-X juta"
```

**Timeline Detection (regex-based):**
```
URGENT:    buru-buru, segera, cepat, minggu ini, bulan ini
PLANNING:  rencana, nanti, tahun depan, mau mulai
EXPLORING: coba dulu, lihat-lihat, masih cari info
```

**Key Questions (extract sentences ending with "?")**

**Suggested Follow-up (template-based):**
```
If intent == purchase && budget exists:
  "Tawarkan [product] sesuai budget {budget}"

If intent == inquiry && budget == null:
  "Tanyakan budget range"

If timeline == urgent:
  "Prioritaskan respons cepat"
```

### 4.3 Notification System

**Approach:** Client-side polling (every 10s for unseen leads).

Why polling:
- WebSocket adds complexity (Docker, nginx config)
- 10s delay is acceptable for lead notifications
- Polling is simpler and more reliable
- Can upgrade to SSE later

**API:**
```
GET /api/leads/notifications
  → Returns unseen leads with name, intent, time, score
  → Only returns leads from last 24 hours

POST /api/leads/{id}/seen
  → Marks lead as seen
  → Updates seenAt timestamp
```

---

## 5. UI SPECIFICATIONS

### 5.1 Lead Detail Page (`/leads/[id]`)

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ ← Back to Leads                                      │
│                                                      │
│ ┌──────────────────────┐ ┌────────────────────────┐  │
│ │ 📋 Contact Info       │ │ 🧠 Lead Intelligence   │  │
│ │                      │ │                        │  │
│ │ Name: Budi Santoso   │ │ Intent: 🔴 Purchase    │  │
│ │ Phone: 081234567890  │ │   (85% confidence)     │  │
│ │ Email: —             │ │                        │  │
│ │ Source: Widget Chat  │ │ Budget: 💰 100-150 juta│  │
│ │ Score: 85/100        │ │   "budget saya sekitar  │  │
│ │ Status: New          │ │    100-an juta"         │  │
│ │ Created: 2 jam lalu  │ │                        │  │
│ │                      │ │ Timeline: ⏰ Cepat      │  │
│ │ [📞 WhatsApp]        │ │   "udah buru-buru"      │  │
│ │ [✏️ Edit]            │ │                        │  │
│ └──────────────────────┘ │ Key Questions:          │  │
│                          │ 1. Harga berapa?        │  │
│                          │ 2. DP berapa?           │  │
│                          │ 3. KPR tersedia?        │  │
│                          │                        │  │
│                          │ 💡 Suggested:           │  │
│                          │ "Tawarkan KPR simulasi  │  │
│                          │  untuk budget 100-150   │  │
│                          │  juta dengan DP 10%"    │  │
│                          └────────────────────────┘  │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 💬 Conversation History (3 messages)             │ │
│ │                                                  │ │
│ │ Lead (10:32 AM)                                  │ │
│ │ "Mau tanya rumah subsidi di Adiwerna..."         │ │
│ │                                                  │ │
│ │ Bot (10:32 AM)                                   │ │
│ │ "Tentang rumah subsidi di Adiwerna, ada          │ │
│ │  beberapa opsi. Berikut yang tersedia..."        │ │
│ │ 📎 Sources: katalog_2024.md, daftar_harga.md     │ │
│ │                                                  │ │
│ │ Lead (10:34 AM)                                  │ │
│ │ "Harganya berapa?"                               │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 5.2 Leads Dashboard (enhanced)

**Add notification bar at top:**
```
┌──────────────────────────────────────────────┐
│ 🔔 3 New Leads · Last update: 10 detik lalu  │
│                                              │
│ 🔴 Budi — Beli Rumah — 2 min ago  [View]    │
│ 🔴 Rina — Sewa Mobil — 15 min ago [View]    │
│ 🔴 Anisa — Klinik Konsul — 1 jam  [View]    │
└──────────────────────────────────────────────┘
```

### 5.3 Conversation Bubble Styles

```
┌─────────────────────────────────┐
│ 👤 Lead (10:32 AM)              │  ← gray background, left aligned
│ "Mau tanya rumah subsidi..."   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🤖 Bot (10:32 AM)              │  ← blue background, right aligned
│ "Tentang rumah subsidi..."     │
│ 📎 2 sources                    │
└─────────────────────────────────┘
```

---

## 6. API ENDPOINTS

### Lead Transcript
```
GET /api/leads/[id]/transcript
  → Returns: { messages: [{ role, content, timestamp, sources }] }
  → Includes all sessions for this lead
  → Sorted by timestamp ASC
```

### Lead Intelligence
```
GET /api/leads/[id]/intelligence
  → Returns: { intent, budget, timeline, keyQuestions, suggestedFollowUp }
  → Auto-generated on first request, cached in DB
  → Re-generates if lead has new messages since last generation
```

### Lead Notifications
```
GET /api/leads/notifications
  → Returns: { unseen: [{ id, name, intent, score, createdAt }], count: N }
  → Only unseen leads from last 24 hours

POST /api/leads/[id]/seen
  → Marks lead as seen
  → Returns: { success: true }
```

---

## 7. MIGRATION

```sql
-- Add intelligence columns to leads table
ALTER TABLE leads ADD COLUMN intent VARCHAR(50);
ALTER TABLE leads ADD COLUMN intent_confidence FLOAT;
ALTER TABLE leads ADD COLUMN budget_min INTEGER;
ALTER TABLE leads ADD COLUMN budget_max INTEGER;
ALTER TABLE leads ADD COLUMN budget_raw VARCHAR(200);
ALTER TABLE leads ADD COLUMN timeline VARCHAR(50);
ALTER TABLE leads ADD COLUMN timeline_confidence FLOAT;
ALTER TABLE leads ADD COLUMN key_questions JSONB;
ALTER TABLE leads ADD COLUMN suggested_follow_up TEXT;
ALTER TABLE leads ADD COLUMN intelligence_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN seen_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN seen BOOLEAN DEFAULT FALSE;

-- Create lead_conversations table
CREATE TABLE lead_conversations (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  session_id TEXT NOT NULL REFERENCES sessions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lead_id, session_id)
);

-- RLS policies
ALTER TABLE lead_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_conversations_isolation" ON lead_conversations
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::TEXT);

-- Auto-generate intelligence for existing leads
UPDATE leads SET
  intent = 'inquiry',
  intent_confidence = 0.7,
  seen = TRUE,
  seen_at = created_at
WHERE intent IS NULL;
```

---

## 8. TEST SCENARIOS

### Transcript View
1. Open lead detail → see full conversation history
2. Messages sorted chronologically
3. Bot messages show sources used
4. Lead messages show timestamp
5. Multiple sessions for same lead → merged chronologically

### Intelligence Generation
1. New lead with purchase intent → "purchase" classified
2. Lead mentions budget "100-150 juta" → budget extracted
3. Lead says "buru-buru" → timeline = "urgent"
4. Questions ending in "?" → extracted as key questions
5. Suggestion generated based on intent + budget + timeline

### Notifications
1. New lead arrives → notification count increases
2. Click notification → navigate to lead detail
3. View lead → notification disappears
4. 10s polling → notifications auto-update
5. Old leads (24h+) → not shown in notifications

---

## 9. ACCEPTANCE CRITERIA

- [ ] Click any lead → full conversation history visible within 2s
- [ ] Intelligence panel shows intent, budget, timeline, questions, suggestion
- [ ] Dashboard shows notification bar with unseen leads count
- [ ] Notifications auto-update every 10s
- [ ] Click notification → navigate to lead detail page
- [ ] Mark lead as seen → notification disappears
- [ ] Conversation shows both lead and bot messages
- [ ] Bot messages show which knowledge sources were used
- [ ] Intelligence is cached (no re-generation on page reload)
- [ ] Works on mobile (responsive layout)
- [ ] All existing features still work (no regression)

---

## 10. OUT OF SCOPE

- ❌ Real-time WebSocket notifications (use polling)
- ❌ LLM-based intelligence (regex only)
- ❌ Email/push notifications
- ❌ Lead scoring algorithm changes
- ❌ Lead assignment/routing
- ❌ Conversation tagging/labeling
- ❌ Export conversation as PDF

---

## 11. SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Time to understand lead context | < 15 seconds (was: 5+ minutes) |
| Intelligence accuracy (intent) | > 80% correct classification |
| Intelligence accuracy (budget) | > 90% extraction when mentioned |
| Notification click-through rate | > 70% of new leads viewed |
| Business owner satisfaction | > 4.5/5 on "understand lead" survey |

---

**Decision: APPROVED**
**Next: Create LEAD_INTELLIGENCE_IMPLEMENTATION_PLAN.md**
