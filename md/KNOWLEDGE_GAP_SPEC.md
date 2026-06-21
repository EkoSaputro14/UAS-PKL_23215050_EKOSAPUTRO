# KNOWLEDGE_GAP_SPEC.md — MimoNotes Knowledge Gap Automation

**Date:** 2026-06-16
**Status:** Spec Complete — Ready for Implementation
**Goal:** Automatically detect, track, and alert when chatbot can't answer user questions.

---

## 1. Problem Statement

When users ask questions the chatbot can't answer (low confidence, no relevant documents), the interaction is silently lost. The admin doesn't know:
- What questions are being asked that the bot can't answer
- Which topics need new documents
- How often the bot fails to help users
- Which documents would fill the gaps

**Impact:** Customers pay for a chatbot that sometimes says "I don't know" without any visibility into WHY or how to fix it.

---

## 2. Current State

### What EXISTS

| Component | File | Status |
|-----------|------|--------|
| `shouldRefuse()` | `lib/rag/chain.ts:41` | ✅ Detects low-confidence queries |
| `classifyConfidence()` | `lib/rag/chain.ts:31` | ✅ Classifies: high/medium/low/refuse |
| `getConfidencePrefix()` | `lib/rag/chain.ts:62` | ✅ Adds caveat text for low confidence |
| `ConfidenceLevel` type | `lib/rag/chain.ts:28` | ✅ `high | medium | low | refuse` |
| RAG metrics header | `X-Retrieval-Metrics` | ✅ Returns similarity scores |

### What's MISSING

| Gap | Impact | Effort |
|-----|--------|--------|
| No gap logging | Failed queries are lost | 2h |
| No gap dashboard | Admin has no visibility | 3h |
| No gap alerts | Admin doesn't know about gaps | 2h |
| No gap suggestions | Admin doesn't know what to upload | 4h |
| No gap trends | Can't track improvement over time | 2h |

---

## 3. Architecture

### 3.1 Data Flow

```
User asks question
       │
       ▼
RAG Pipeline (existing)
       │
       ├── confidence = high/medium → normal response
       │
       └── confidence = low/refuse →
              │
              ├── 1. Log gap event (knowledge_gaps table)
              ├── 2. Generate response with caveat
              ├── 3. Track gap metric (analytics)
              └── 4. If threshold exceeded → notify admin

Admin Dashboard
       │
       ├── View gaps by topic/frequency/recency
       ├── See suggested documents to upload
       ├── Track gap rate over time
       └── Export gap report
```

### 3.2 Database Schema

```prisma
/// Knowledge gap events — when bot can't answer with confidence
model KnowledgeGap {
  id              String   @id @default(uuid())
  workspaceId     String   @map("workspace_id")
  
  /// The question that couldn't be answered
  question        String   @db.Text
  
  /// Confidence level: low | refuse
  confidenceLevel String   @map("confidence_level") @db.VarChar(20)
  
  /// Why: no_results | low_confidence
  reason          String   @db.VarChar(50)
  
  /// Max similarity score from retrieval
  maxSimilarity   Float?   @map("max_similarity")
  
  /// Top chunk content (if any) — for gap analysis
  topChunkContent String?  @map("top_chunk_content") @db.Text
  
  /// Source: widget | api | whatsapp | chat
  channel         String   @default("chat") @db.VarChar(20)
  
  /// Widget/conversation ID for tracing
  sourceId        String?  @map("source_id")
  
  /// Whether admin has reviewed this gap
  reviewed        Boolean  @default(false)
  
  /// Admin notes
  notes           String?  @db.Text
  
  /// Cluster/topic label (auto-generated or manual)
  topicLabel      String?  @map("topic_label") @db.VarChar(200)
  
  createdAt       DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])
  @@index([workspaceId, confidenceLevel])
  @@index([workspaceId, reviewed])
  @@map("knowledge_gaps")
}
```

### 3.3 Gap Detection Logic

```typescript
// In lib/rag/chain.ts — modify generateRAGResponse()
if (refusal.refuse) {
  // NEW: Log the gap
  await logKnowledgeGap({
    workspaceId,
    question,
    confidenceLevel: refusal.confidence,
    reason: refusal.reason || "unknown",
    maxSimilarity: similarChunks[0]?.similarity || 0,
    topChunkContent: similarChunks[0]?.content?.substring(0, 500),
    channel: options.channel || "chat",
    sourceId: options.sourceId,
  }).catch(err => console.error("[KnowledgeGap] Failed to log:", err));

  return {
    answer: getConfidencePrefix(refusal.confidence),
    sources: [],
    metrics,
    confidence: refusal.confidence,
    refused: true,
  };
}
```

### 3.4 Gap Clustering (V1: Keyword-based)

```typescript
// lib/knowledge-gap.ts
const TOPIC_PATTERNS: Record<string, string[]> = {
  pricing: ["harga", "biaya", "tarif", "cost", "price", "bayar", "berapa"],
  product: ["produk", "barang", "item", "fitur", "feature", "spesifikasi"],
  shipping: ["kirim", "ongkir", "pengiriman", "delivery", "shipping", "ekspedisi"],
  return: ["retur", "refund", "kembali", "tukar", "ganti"],
  support: ["bantuan", "help", "support", "masalah", "error", "bug"],
  account: ["akun", "login", "password", "daftar", "register"],
  schedule: ["jadwal", "jam", "buka", "tutup", "hari", "senin"],
};

function classifyTopic(question: string): string | null {
  const lower = question.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_PATTERNS)) {
    if (keywords.some(kw => lower.includes(kw))) return topic;
  }
  return null;
}
```

---

## 4. API Routes

### GET /api/knowledge/gaps
```typescript
// Paginated list of knowledge gaps
// Query params: page, perPage, reviewed, confidenceLevel, channel, from, to
{
  gaps: [{
    id: string,
    question: string,
    confidenceLevel: string,
    reason: string,
    maxSimilarity: number | null,
    channel: string,
    topicLabel: string | null,
    reviewed: boolean,
    notes: string | null,
    createdAt: string,
  }],
  total: number,
  page: number,
  totalPages: number,
  stats: {
    totalGaps: number,
    unreviewedGaps: number,
    gapRate: number,  // gaps / total queries %
    topTopics: [{ topic: string, count: number }],
  }
}
```

### PATCH /api/knowledge/gaps/[id]
```typescript
// Mark gap as reviewed, add notes, set topic label
{
  reviewed?: boolean,
  notes?: string,
  topicLabel?: string,
}
```

### POST /api/knowledge/gaps/analyze
```typescript
// Run gap analysis — cluster unreviewed gaps by topic
{
  analysis: [{
    topic: string,
    gapCount: number,
    sampleQuestions: string[],
    suggestedAction: string,  // e.g. "Upload document about pricing"
  }],
  summary: {
    totalUnreviewed: number,
    topGapTopics: string[],
    recommendedDocuments: string[],
  }
}
```

### GET /api/knowledge/gaps/export
```typescript
// CSV export of all gaps
```

---

## 5. UI Components

### Dashboard Widget: Gap Overview

```
┌─────────────────────────────────────┐
│  ⚠ Knowledge Gaps              [12] │
│  5 unreviewed · 2.3% gap rate       │
│                                     │
│  Top topics:                        │
│  ████████░░ pricing (8)             │
│  ██████░░░░ shipping (6)            │
│  ████░░░░░░ product (4)             │
│                                     │
│  [View All] [Export CSV]            │
└─────────────────────────────────────┘
```

### Settings Page: `/settings/knowledge-gaps`

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Gaps                                        [Export] │
│  Pertanyaan yang belum bisa dijawab oleh chatbot.              │
├─────────────────────────────────────────────────────────────────┤
│  [All] [Unreviewed] [High Priority] [By Topic]                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠ "Berapa harga produk X?"                              │   │
│  │   Confidence: refuse · Similarity: 0.12 · Widget · 2h ago│   │
│  │   Topic: pricing · [Mark Reviewed] [Add Notes]           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠ "Bagaimana cara retur barang?"                        │   │
│  │   Confidence: low · Similarity: 0.28 · WhatsApp · 5h ago │   │
│  │   Topic: return · [Mark Reviewed] [Add Notes]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Page 1 of 3 · [< Previous] [Next >]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Gap Analysis Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Gap Analysis                           [Run Analysis] [Export] │
│                                                                 │
│  ┌─ pricing ────────────────────────────────────────────────┐  │
│  │ 8 gaps · Last 7 days                                      │  │
│  │ Sample: "Berapa harga X?", "Biaya bulanan berapa?"        │  │
│  │ 💡 Suggestion: Upload document daftar harga               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ shipping ───────────────────────────────────────────────┐  │
│  │ 6 gaps · Last 7 days                                      │  │
│  │ Sample: "Ongkir ke Jakarta berapa?", "Pakai ekspedisi apa?"│ │
│  │ 💡 Suggestion: Upload document info pengiriman            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Notification Integration

### Auto-Alert Rules

```typescript
// lib/knowledge-gap-alerts.ts
const ALERT_THRESHOLDS = {
  gapRatePercent: 10,      // Alert if >10% of queries are gaps
  unreviewedCount: 20,     // Alert if >20 unreviewed gaps
  dailyGapCount: 50,       // Alert if >50 gaps in 24h
};

async function checkGapAlerts(workspaceId: string): Promise<void> {
  const stats = await getGapStats(workspaceId);
  
  if (stats.gapRate > ALERT_THRESHOLDS.gapRatePercent) {
    await sendNotification(workspaceId, "high_gap_rate", {
      gapRate: stats.gapRate,
      threshold: ALERT_THRESHOLDS.gapRatePercent,
    });
  }
  
  if (stats.unreviewedCount > ALERT_THRESHOLDS.unreviewedCount) {
    await sendNotification(workspaceId, "many_unreviewed_gaps", {
      count: stats.unreviewedCount,
      threshold: ALERT_THRESHOLDS.unreviewedCount,
    });
  }
}
```

### Notification Channels

| Channel | When | Priority |
|---------|------|----------|
| Dashboard badge | Always (unreviewed count) | Low |
| Email digest | Daily/weekly summary | Medium |
| Instant email | Gap rate >10% | High |
| Slack/webhook | Configured per workspace | Medium |

---

## 7. Analytics Integration

### New Metrics

```typescript
// Track gap events as analytics
await recordAnalyticsEvent("knowledge_gap", {
  confidenceLevel: "refuse",
  reason: "no_results",
  maxSimilarity: 0.12,
  channel: "widget",
  topic: "pricing",
});

// Dashboard metrics
{
  gapRate: 2.3,              // % of queries that are gaps
  gapTrend: "decreasing",    // improving over time
  topGapTopics: ["pricing", "shipping"],
  avgGapSimilarity: 0.18,    // how far off we are
  reviewRate: 65,            // % of gaps reviewed by admin
}
```

---

## 8. Implementation Estimate

| Task | Effort | Priority |
|------|--------|----------|
| Schema: `knowledge_gaps` table | 30min | P0 |
| `logKnowledgeGap()` function | 1h | P0 |
| Integrate into RAG chain | 30min | P0 |
| GET /api/knowledge/gaps | 1h | P0 |
| PATCH /api/knowledge/gaps/[id] | 30min | P0 |
| Gap dashboard widget | 1.5h | P0 |
| Gap list page (`/settings/knowledge-gaps`) | 2h | P0 |
| Gap topic clustering (keyword-based) | 1h | P1 |
| Gap analysis endpoint + page | 2h | P1 |
| Gap alerts (threshold-based) | 1.5h | P1 |
| Gap CSV export | 30min | P1 |
| Analytics integration | 1h | P1 |
| **Total V1 (P0 only)** | **~7h** | |
| **Total V1+ (P0+P1)** | **~12h** | |

---

## 9. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Gap detection rate | >95% | Compare logged gaps vs actual low-confidence responses |
| Admin review rate | >50% within 7d | reviewed / total gaps |
| Gap rate reduction | <5% within 30d | After uploading suggested documents |
| Time to fill gap | <48h | Time from gap logged to document uploaded |
| Customer satisfaction | >4.0/5.0 | Post-chat rating (future) |

---

*Spec by Hermes Agent — V1 ships with first paying customers. P0 = ~7h implementation.*
