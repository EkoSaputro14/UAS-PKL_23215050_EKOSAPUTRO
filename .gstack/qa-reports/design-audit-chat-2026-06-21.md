# MimoNotes Chat Frontend — Design Audit

**Date:** 2026-06-21
**Scope:** Chat page (`/chat`) + Landing page (`/`) + Dashboard (`/dashboard`)
**Method:** Playwright screenshots + DOM snapshot + source code analysis

---

## VERDICT: AI Slop Score — 6/10

**Bukan parah, tapi belum premium.** MimoNotes punya fondasi yang solid (shadcn/ui + Tailwind v4 + Geist font), tapi ada beberapa pola "AI slop" yang bikin tampilan terasa generik dan tidak berbeda dari 100 chatbot template lainnya.

---

## Apa yang Sudah Benar (Keep These)

1. **Font choice bagus** — Geist Sans + Geist Mono. Bukan Inter/Roboto default. Ini poin plus.
2. **Color system terstruktur** — Brand scale (MiMo Blue #4F6BFF), neutral scale, surface hierarchy. Tidak asal pick warna.
3. **Shadcn/ui primitives** — Konsisten, accessible, well-maintained. Foundation yang solid.
4. **Dark mode support** — Sudah ada CSS variables untuk light/dark. Good.
5. **Spacing scale** — 4px base, konsisten. Bukan arbitrary spacing.
6. **Markdown rendering** — Typography untuk chat responses sudah diperhatikan (line-height, code blocks, tables).

---

## Masalah Design (AI Slop Patterns)

### SLOP-1: Chat Layout — "Template ChatGPT Clone"
**Severity:** HIGH

Layout chat sekarang:
```
[Sidebar 280px] | [Chat Area flex-1] | [nothing]
```

Ini persis seperti ChatGPT, Claude, Gemini — semua AI chat template. Tidak ada yang membedakan MimoNotes dari kompetitor.

**Masalah spesifik:**
- Sidebar kiri terlalu lebar (280px) untuk chat history yang cuma text
- Tidak ada visual hierarchy dalam sidebar — semua session sama, tidak ada grouping by date
- Chat area terlalu banyak whitespace — messages kecil di tengah layar lebar
- Tidak ada identity — user tidak tahu ini "MimoNotes" atau "ChatGPT clone"

### SLOP-2: Welcome State — "Generic Empty State"
**Severity:** MEDIUM

Welcome screen sekarang:
```
🤖
Selamat datang di Mimotes
Ajukan pertanyaan dan AI akan menjawab berdasarkan dokumen yang tersedia.

[Apa saja dokumen yang tersedia?]
[Jelaskan isi dokumen utama]
[Buatkan ringkasan dari semua dokumen]
```

**Masalah:**
- Emoji 🤖 terlalu generik — semua chatbot AI pakai emoji yang sama
- Headline terlalu deskriptif, tidak memorable
- Suggested prompts terlalu panjang — harusnya 1-2 kata, bukan kalimat
- Tidak ada visual — empty state terasa kosong dan membosankan

### SLOP-3: Message Bubbles — "Flat & Featureless"
**Severity:** MEDIUM

User messages dan AI messages terlihat hampir sama:
- User: bubble biru dengan text putih
- AI: bubble putih/abu dengan text gelap
- Tidak ada avatar, tidak ada nama, tidak ada timestamp yang jelas
- Source citations ([1], [2]) kecil dan mudah terlewat

**Masalah:**
- Tidak ada visual distinction yang kuat antara user dan AI
- Source citations tidak menonjol — ini differentiator utama MimoNotes tapi tidak di-highlight
- Tidak ada loading indicator yang menarik saat AI streaming

### SLOP-4: Input Area — "Plain Textarea"
**Severity:** LOW

Input area sekarang:
```
[textarea dengan placeholder "Ketik pertanyaan Anda..."] [button kirim]
```

**Masalah:**
- Terlalu simple — tidak ada toolbar, tidak ada attachment button
- Tidak ada indikator mode (CS/KB/Sales) yang visible
- Send button disabled tanpa feedback — user tidak tahu kenapa

### SLOP-5: Session Sidebar — "List Without Hierarchy"
**Severity:** MEDIUM

Sidebar menampilkan semua sessions sebagai flat list:
```
Apa itu MimoNotes?          21 Jun 2026
ada rumah harga 100 jutaan? 21 Jun 2026
halo                        21 Jun 2026
Halo                        18 Jun 2026
...
```

**Masalah:**
- Tidak ada grouping by date (Hari Ini, Kemarin, Minggu Lalu, dst)
- Tidak ada search yang prominent
- Duplicate entries (banyak "Ada rumah 100 juta?" berulang)
- Tidak ada visual indicator untuk mode (CS/KB/Sales)

---

## Design Recommendations

### REC-1: Chat Layout — "Knowledge-First, Not Chat-First"

**Current:** Sidebar + Chat (ChatGPT clone)
**Proposed:** Centered chat + Floating source panel

```
┌─────────────────────────────────────────┐
│  Header: MimoNotes [Mode: CS ▼] [New]  │
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────────────┐             │
│         │  Chat Messages  │             │
│         │  (centered)     │             │
│         │                 │             │
│         │  [1] [2] [3]    │             │
│         └─────────────────┘             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Input area with mode indicator  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ Source 1 │ │ Source 2 │ │ Source │  │
│  │ Card     │ │ Card     │ │ 3      │  │
│  └──────────┘ └──────────┘ └────────┘  │
└─────────────────────────────────────────┘
```

**Why:**
- MimoNotes differentiator = source citations. Make them VISIBLE.
- Centered layout lebih fokus, tidak terfragmentasi
- Source cards di bawah chat = visual proof that AI punya data

### REC-2: Welcome State — "Product Hero, Not Empty State"

**Current:** Emoji + text + 3 buttons
**Proposed:** Visual demo + quick start

```
┌─────────────────────────────────────────┐
│                                         │
│         MimoNotes                       │
│         Tanya apa saja,                │
│         dapatkan jawaban               │
│         dari dokumen Anda.             │
│                                         │
│    ┌─────────────────────────────┐      │
│    │ 💬 "Apa isi dokumen ini?"   │      │
│    │ 📄 → [Source Card]          │      │
│    └─────────────────────────────┘      │
│                                         │
│    [Mulai Chat]                         │
│                                         │
│    Atau coba:                           │
│    • Ringkas dokumen ini               │
│    • Cari informasi tentang...          │
│    • Bandingkan data dari...            │
│                                         │
└─────────────────────────────────────────┘
```

**Why:**
- Visual preview = user langsung tahu apa yang bisa dilakukan
- Headline yang memorable, bukan deskripsi teknis
- Quick start suggestions lebih actionable

### REC-3: Message Bubbles — "Identity & Citations"

**Current:** Flat bubbles, minimal distinction
**Proposed:** Avatar + name + prominent citations

```
┌─────────────────────────────────────────┐
│ 👤 Anda                         14:30  │
│ ┌─────────────────────────────────┐     │
│ │ Apa isi dokumen PostgreSQL?     │     │
│ └─────────────────────────────────┘     │
│                                         │
│ 🤖 MimoNotes                    14:30  │
│ ┌─────────────────────────────────┐     │
│ │ PostgreSQL adalah sistem basis  │     │
│ │ data objek-relasional...        │     │
│ │                                 │     │
│ │ ┌─────┐ ┌─────┐ ┌─────┐       │     │
│ │ │ [1] │ │ [2] │ │ [3] │       │     │
│ │ │ PDF │ │ DOC │ │ TXT │       │     │
│ │ └─────┘ └─────┘ └─────┘       │     │
│ └─────────────────────────────────┘     │
│                                         │
│ [👍] [👎] [📋 Copy] [🔄 Regenerate]   │
└─────────────────────────────────────────┘
```

**Why:**
- Avatar + name = humanized, bukan anonymous bot
- Source cards = visual proof of RAG, bukan sekadar text [1]
- Action buttons = more engaging, feedback loop

### REC-4: Sidebar — "Smart Grouping"

**Current:** Flat list, no hierarchy
**Proposed:** Date groups + search + mode indicator

```
┌──────────────────────┐
│ 🔍 Search...         │
├──────────────────────┤
│ HARI INI             │
│ ┌──────────────────┐ │
│ │ 💬 Apa itu MN?  │ │
│ │ 📊 CS • 3 msgs  │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ 💬 Rumah 100jt   │ │
│ │ 📊 Sales • 5 msg │ │
│ └──────────────────┘ │
├──────────────────────┤
│ KEMARIN              │
│ ┌──────────────────┐ │
│ │ 💬 Halo          │ │
│ │ 📊 KB • 1 msg    │ │
│ └──────────────────┘ │
└──────────────────────┘
```

**Why:**
- Date groups = easier to find old conversations
- Mode indicator = user tahu context setiap chat
- Message count = preview tanpa buka

### REC-5: Input Area — "Rich Input"

**Current:** Plain textarea + send button
**Proposed:** Toolbar + mode switcher + attachment

```
┌─────────────────────────────────────────┐
│ [📎] [Mode: CS ▼]                       │
│ ┌─────────────────────────────────┐     │
│ │ Ketik pertanyaan Anda...        │     │
│ │                                 │     │
│ └─────────────────────────────────┘     │
│ [🎤] [📤]                          [→]  │
└─────────────────────────────────────────┘
```

**Why:**
- Mode switcher prominent = user tahu AI behavior
- Attachment button = future file upload support
- Voice button = accessibility + mobile UX

---

## Priority Matrix

| Rec | Impact | Effort | Priority |
|-----|--------|--------|----------|
| REC-3: Message Bubbles | HIGH | LOW | 🔴 Do First |
| REC-4: Sidebar Grouping | MEDIUM | LOW | 🟡 Do Second |
| REC-2: Welcome State | MEDIUM | LOW | 🟡 Do Third |
| REC-5: Input Area | LOW | LOW | 🟢 Do Later |
| REC-1: Chat Layout | HIGH | HIGH | 🔴 Plan For V2 |

---

## Color & Typography Recommendations

### Colors — Keep But Refine

Current brand (#4F6BFF) is good. But:

1. **Add semantic colors for chat:**
   - User bubble: `--brand-50` (light blue bg)
   - AI bubble: `--neutral-50` (light gray bg)
   - Source card: `--brand-100` border with `--brand-50` bg
   - Citation badge: `--brand-500` bg, white text

2. **Improve contrast:**
   - AI text on white bg: use `--neutral-800` not `--neutral-600`
   - Muted text: use `--neutral-400` for timestamps

### Typography — Add Hierarchy

Current: All text same size, different weights only.

Add:
- **Message body:** 15px, line-height 1.6
- **Timestamp:** 12px, `--neutral-400`
- **Source card title:** 13px, weight 600
- **Source card snippet:** 12px, `--neutral-500`
- **Citation badge:** 11px, weight 700

### Spacing — Tighten Chat

Current: Lots of whitespace between elements.

Tighten:
- Message gap: 16px → 12px
- Bubble padding: 16px → 12px horizontal, 10px vertical
- Source card gap: 8px
- Sidebar item padding: 12px → 10px

---

## Anti-AI-Slop Checklist

- [ ] Remove 🤖 emoji from welcome state
- [ ] Add avatar/icon for AI messages (not emoji)
- [ ] Make source citations VISUAL (cards, not just [1])
- [ ] Group sidebar by date
- [ ] Add mode indicator to chat header
- [ ] Tighten spacing — less whitespace, more content
- [ ] Add subtle animation on new messages (fade-in, not slide)
- [ ] Make send button always visible (not disabled state)
- [ ] Add timestamp to every message (not just header)
- [ ] Use brand color for AI accent, not generic blue

---

*Audit by gstack design-consultation adapted for Hermes Agent*
