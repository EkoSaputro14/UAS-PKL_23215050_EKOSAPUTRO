# LEAD INTELLIGENCE — Implementation Plan
**MimoNotes — Sprint: Lead Transcript + Intelligence + Notifications**

**Date:** 2026-06-08
**PRD:** LEAD_INTELLIGENCE_PRD.md
**Estimated Effort:** 3-5 days
**Status:** READY TO START

---

## OVERVIEW

Three features to help business owners understand and act on leads faster:

1. **Lead Transcript View** — Full conversation history (2 days)
2. **Lead Intelligence Lite** — AI-generated insights via regex (2 days)
3. **Dashboard Lead Notifications** — Real-time notification bar (1 day)

---

## SPRINT BREAKDOWN

### Day 1-2: Lead Transcript View

#### Task 1.1: Database Schema Extension (30 min)
**Files:** `prisma/schema.prisma`
- Add `intent`, `intentConfidence`, `budgetMin`, `budgetMax`, `budgetRaw` to Lead model
- Add `timeline`, `timelineConfidence`, `keyQuestions`, `suggestedFollowUp` to Lead model
- Add `intelligenceAt`, `seenAt`, `seen` to Lead model
- Create `LeadConversation` model (links Lead ↔ Session)
- Run `npx prisma db push`
- Apply RLS migration

#### Task 1.2: Lead Transcript API (1 hr)
**Files:** `app/api/leads/[id]/transcript/route.ts`
- GET endpoint returning all messages for a lead
- Join through `LeadConversation` → `Session` → `ChatMessage`
- Return: `{ messages: [{ role, content, timestamp, sources }] }`
- Sorted by timestamp ASC
- Handle missing lead (404)
- Use `prisma.$transaction` for RLS

#### Task 1.3: Intelligence Engine (2 hr)
**Files:** `lib/lead-intelligence.ts`
- `classifyIntent(text: string): { intent: string, confidence: number }`
  - Regex patterns for purchase/inquiry/support/comparison
  - Indonesian keyword matching
  - Confidence scoring based on pattern strength
- `extractBudget(text: string): { min: number, max: number, raw: string } | null`
  - Regex for "Rp X juta", "budget X juta", "X-X jutaan", etc.
  - Handle edge cases: "sekitar", "ke bawah", "ke atas"
- `detectTimeline(text: string): { timeline: string, confidence: number }`
  - Regex for urgent/planning/exploring
  - "buru-buru", "cepat", "segera" → urgent
  - "rencana", "nanti", "tahun depan" → planning
- `extractKeyQuestions(text: string): string[]`
  - Split by newlines, filter sentences ending with "?"
  - Limit to top 5 questions
- `generateFollowUp(intent, budget, timeline): string`
  - Template-based suggestions
  - Purchase + budget → "Tawarkan produk sesuai budget X"
  - Inquiry + no budget → "Tanyakan budget range"
  - Urgent → "Prioritaskan respons cepat"
- `generateIntelligence(leadId: string): Promise<void>`
  - Main entry point
  - Fetch all messages for lead
  - Run all extractors
  - Save to database

#### Task 1.4: Lead Detail Page (2 hr)
**Files:** `app/(admin)/leads/[id]/page.tsx`
- New page route: `/leads/[id]`
- Fetch lead data + transcript + intelligence
- Two-column layout (Contact | Intelligence) → stack on mobile
- Conversation history with styled bubbles
- Bot messages show sources
- Lead messages show timestamp
- WhatsApp button
- Back button to leads list

#### Task 1.5: Lead Transcript Component (1.5 hr)
**Files:** `components/leads/lead-transcript.tsx`
- Renders conversation history
- Message bubbles: lead (gray, left), bot (blue, right)
- Timestamps for each message
- Source cards for bot messages
- Auto-scroll to bottom
- Empty state: "No conversation history"

#### Task 1.6: Lead Intelligence Component (1.5 hr)
**Files:** `components/leads/lead-intelligence.tsx`
- Renders intelligence panel
- Intent with confidence badge
- Budget with extracted value
- Timeline with urgency indicator
- Key questions list
- Suggested follow-up card
- Loading state while generating
- Error state with retry button

---

### Day 3-4: Intelligence API + Integration

#### Task 2.1: Intelligence API (1 hr)
**Files:** `app/api/leads/[id]/intelligence/route.ts`
- GET endpoint returning intelligence
- Auto-generate on first request
- Cache in database (don't re-generate unless new messages)
- Re-generate if `lead.updatedAt > lead.intelligenceAt`

#### Task 2.2: Auto-Generate Intelligence (1 hr)
**Files:** `app/api/widget/chat/route.ts`
- After saving chat message, trigger intelligence generation
- Only if lead has 3+ messages (enough context)
- Background task (don't block response)
- Use `Promise.allSettled` to handle failures

#### Task 2.3: Lead Summary Enhancement (1 hr)
**Files:** `lib/leads.ts`
- Update `getLeadById` to include intelligence fields
- Update `getLeads` to include key intelligence in list
- Add `generateAllIntelligence` batch function

#### Task 2.4: Migration for Existing Leads (30 min)
**Files:** `migrations/008_add_lead_intelligence.sql`
- ALTER TABLE leads ADD COLUMN intent VARCHAR(50)
- ALTER TABLE leads ADD COLUMN intent_confidence FLOAT
- ALTER TABLE leads ADD COLUMN budget_min INTEGER
- ALTER TABLE leads ADD COLUMN budget_max INTEGER
- ALTER TABLE leads ADD COLUMN budget_raw VARCHAR(200)
- ALTER TABLE leads ADD COLUMN timeline VARCHAR(50)
- ALTER TABLE leads ADD COLUMN timeline_confidence FLOAT
- ALTER TABLE leads ADD COLUMN key_questions JSONB
- ALTER TABLE leads ADD COLUMN suggested_follow_up TEXT
- ALTER TABLE leads ADD COLUMN intelligence_at TIMESTAMP
- ALTER TABLE leads ADD COLUMN seen_at TIMESTAMP
- ALTER TABLE leads ADD COLUMN seen BOOLEAN DEFAULT FALSE
- CREATE TABLE lead_conversations
- RLS policies for lead_conversations
- Backfill existing leads with basic intelligence

#### Task 2.5: Intelligence Unit Tests (1 hr)
**Files:** `lib/__tests__/lead-intelligence.test.ts`
- Test intent classification: purchase, inquiry, support, comparison
- Test budget extraction: "100-150 juta", "budget 50 juta", "sekitar 200 juta"
- Test timeline detection: urgent, planning, exploring
- Test key questions: "Harga berapa?" → extracted
- Test follow-up generation: intent + budget → suggestion
- Edge cases: empty text, no matches, multiple intents

---

### Day 5: Dashboard Notifications + Polish

#### Task 3.1: Notifications API (1 hr)
**Files:** `app/api/leads/notifications/route.ts`
- GET endpoint returning unseen leads
- Filter: `seen = false AND createdAt > NOW() - 24 hours`
- Return: `{ unseen: [...], count: N }`
- Sorted by createdAt DESC (newest first)
- Limit to 10 most recent

#### Task 3.2: Mark as Seen API (30 min)
**Files:** `app/api/leads/[id]/seen/route.ts`
- POST endpoint marking lead as seen
- Update `seen = true` and `seenAt = NOW()`
- Return: `{ success: true }`

#### Task 3.3: Notification Bar Component (1 hr)
**Files:** `components/leads/notification-bar.tsx`
- Renders at top of leads dashboard
- Shows unseen lead count with badge
- Lists each unseen lead with name, intent, time ago
- Click → navigate to `/leads/[id]`
- Auto-polls every 10 seconds
- Shows "Updated X seconds ago" timestamp
- Collapsible on mobile

#### Task 3.4: Leads Dashboard Integration (1 hr)
**Files:** `app/(admin)/leads/page.tsx`
- Add notification bar at top
- Add "New" badge to lead rows with `seen = false`
- Add click handler to mark as seen
- Integrate with existing lead list

#### Task 3.5: Lead List Enhancement (1 hr)
**Files:** `components/leads/lead-list.tsx` (new)
- Extract lead list into reusable component
- Add "New" badge for unseen leads
- Add intelligence summary in lead cards
- Add click to navigate to detail page
- Mobile-responsive card layout

#### Task 3.6: Docker Build + E2E Test (1.5 hr)
**Files:** `Dockerfile`, E2E test script
- Rebuild Docker image with all changes
- Run full E2E test:
  1. Widget chat → create lead
  2. Open leads dashboard → notification shows
  3. Click lead → see transcript
  4. Intelligence panel shows insights
  5. Click WhatsApp → opens correctly
  6. Mark as seen → notification disappears
- Record Playwright videos
- Generate reports

---

## FILE MANIFEST

### New Files
```
lib/lead-intelligence.ts                    (NEW — intelligence engine)
lib/__tests__/lead-intelligence.test.ts     (NEW — unit tests)
app/api/leads/[id]/transcript/route.ts      (NEW — transcript API)
app/api/leads/[id]/intelligence/route.ts    (NEW — intelligence API)
app/api/leads/[id]/seen/route.ts            (NEW — mark seen API)
app/api/leads/notifications/route.ts        (NEW — notifications API)
app/(admin)/leads/[id]/page.tsx             (NEW — lead detail page)
components/leads/lead-transcript.tsx        (NEW — transcript component)
components/leads/lead-intelligence.tsx      (NEW — intelligence component)
components/leads/notification-bar.tsx       (NEW — notification bar)
components/leads/lead-list.tsx              (NEW — lead list component)
migrations/008_add_lead_intelligence.sql    (NEW — DB migration)
```

### Modified Files
```
prisma/schema.prisma                        (ADD: Lead intelligence fields + LeadConversation)
lib/leads.ts                                (MODIFY: include intelligence in queries)
app/api/widget/chat/route.ts                (MODIFY: trigger intelligence generation)
app/(admin)/leads/page.tsx                  (MODIFY: add notification bar)
components/layout/app-sidebar.tsx           (MODIFY: add Lead Detail nav if needed)
```

### Reports
```
LEAD_INTELLIGENCE_IMPLEMENTATION_REPORT.md  (NEW — implementation summary)
LEAD_INTELLIGENCE_E2E_REPORT.md             (NEW — E2E test results)
```

---

## DEPENDENCIES

| Dependency | Purpose | Status |
|------------|---------|--------|
| Lead Capture MVP | Sprint 1 — already complete | ✅ |
| WhatsApp Handoff MVP | Sprint 2 — already complete | ✅ |
| Leads Dashboard | Sprint 1 — already complete | ✅ |
| Widget Chat API | Sprint 3 — already complete | ✅ |

No new dependencies required. Uses:
- Prisma (existing)
- PostgreSQL (existing)
- Next.js App Router (existing)
- Tailwind CSS (existing)

---

## RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Regex intelligence inaccurate | Medium | Medium | Templates cover 80% of conversations; LLM enhancement later |
| Notification polling causes DB load | Low | Low | Only query unseen + last 24h; add index |
| LeadConversation duplicates | Low | Low | UNIQUE constraint on (leadId, sessionId) |
| Intelligence generation slow | Low | Low | Regex is fast (<50ms); cache in DB |
| Docker build cache issues | High | Medium | Use `docker system prune -af` before rebuild |

---

## ACCEPTANCE CHECKLIST

### Transcript View
- [ ] Click any lead → full conversation history visible within 2s
- [ ] Messages sorted chronologically (ASC)
- [ ] Bot messages show sources used
- [ ] Lead messages show timestamp
- [ ] Multiple sessions for same lead → merged chronologically
- [ ] Empty state: "No conversation history"

### Intelligence
- [ ] Intent classified (purchase/inquiry/support/comparison)
- [ ] Budget extracted when mentioned in conversation
- [ ] Timeline detected (urgent/planning/exploring)
- [ ] Key questions extracted (sentences ending with "?")
- [ ] Follow-up suggestion generated based on insights
- [ ] Intelligence cached (no re-generation on page reload)
- [ ] Intelligence regenerated when new messages arrive

### Notifications
- [ ] New lead → notification count increases
- [ ] Click notification → navigate to lead detail page
- [ ] View lead → notification disappears
- [ ] 10s polling → notifications auto-update
- [ ] Old leads (>24h) → not shown in notifications
- [ ] Mobile responsive

### Regression
- [ ] Existing leads dashboard still works
- [ ] WhatsApp handoff still works
- [ ] Lead scoring still works
- [ ] Widget chat still works
- [ ] Onboarding wizard still works

---

## SUCCESS METRICS

| Metric | Before | After |
|--------|--------|-------|
| Time to understand lead | 5+ minutes | < 15 seconds |
| Lead intelligence accuracy | 0% (manual) | > 80% (automated) |
| New lead view rate | Unknown | > 70% |
| Business owner satisfaction | Unknown | > 4.5/5 |

---

## REPORTS TO GENERATE

1. **LEAD_INTELLIGENCE_IMPLEMENTATION_REPORT.md**
   - What was built
   - Files created/modified
   - DB migration applied
   - Intelligence accuracy metrics
   - Docker build status

2. **LEAD_INTELLIGENCE_E2E_REPORT.md**
   - E2E test results
   - Playwright video evidence
   - Acceptance criteria verification
   - Performance metrics

---

**Decision: READY TO START**
**Next: Execute Task 1.1 — Database Schema Extension**
