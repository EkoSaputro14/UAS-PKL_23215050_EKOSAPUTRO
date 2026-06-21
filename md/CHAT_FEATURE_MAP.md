# CHAT_FEATURE_MAP.md — Chat System Features

**Generated:** 2026-06-17

---

## CHAT INTERFACE

### Main Chat Page
- **Route:** `/chat`
- **Component:** `ChatWindow`
- **API:** `POST /api/chat`, `GET/POST /api/chat/sessions`
- **Auth:** Public (rate-limited) or Authenticated

### Chat Features
| Feature | Component | Description |
|---------|-----------|-------------|
| Message Input | `ChatWindow` | Textarea with send button |
| Message Display | `MessageBubble` | User/assistant messages |
| Session List | `SessionSidebar` | Left sidebar with conversations |
| Streaming | SSE | Real-time token streaming |
| Citations | `CitationMarker` | Inline [1][2] references |
| Source Cards | `SourceCard` | Clickable source references |
| Source Preview | `SourcePreview` | Modal with source content |
| Feedback | `FeedbackBar` | Thumbs up/down per message |
| New Chat | Button | Start fresh conversation |
| Delete Chat | Context menu | Remove conversation |

---

## RAG PIPELINE

### Flow
```
User Question
    ↓
Generate Query Embedding
    ↓
Search Similar Chunks (pgvector cosine)
    ↓
Build Context (top-K chunks)
    ↓
Construct Prompt (system + context + question)
    ↓
Stream via AI Provider
    ↓
Save Message + Sources
```

### Components
| Module | File | Purpose |
|--------|------|---------|
| Chain | `lib/rag/chain.ts` | generateRAGResponse, streamRAGResponse |
| Chunker | `lib/rag/chunker.ts` | Text → chunks |
| Embedder | `lib/rag/embedder.ts` | Text → vectors |
| VectorStore | `lib/rag/vectorstore.ts` | pgvector INSERT + search |
| Parser | `lib/rag/parser.ts` | File → text |

---

## AI PROVIDERS

### Supported Providers (`lib/ai-provider.ts`)
| Provider | Models | Type |
|----------|--------|------|
| Mimo Pro | Various | Default |
| OpenAI | GPT-4o, GPT-4, GPT-3.5 | API |
| LM Studio | Local models | Local |
| Ollama | Local models | Local |
| OpenRouter | 100+ models | Aggregator |
| Custom | Any OpenAI-compatible | API |

### Provider Configuration
- **Settings:** `/settings` (AI provider section)
- **API:** `POST /api/admin/settings`
- **Config Keys:**
  - `ai_provider` — Active provider
  - `ai_model` — Active model
  - `ai_api_key` — Provider API key
  - `ai_base_url` — Custom endpoint
  - `ai_temperature` — Generation temperature
  - `ai_max_tokens` — Max response tokens

---

## STREAMING

### Implementation
- **Module:** `lib/streaming.ts`
- **Method:** Server-Sent Events (SSE)
- **Flow:**
  1. Client sends `POST /api/chat`
  2. Server creates `ReadableStream`
  3. RAG chain streams tokens
  4. Client receives via `EventSource` or `fetch` reader

### Widget Streaming
- **API:** `POST /api/widget/chat/stream`
- Same SSE mechanism for embedded widgets

---

## CONVERSATIONS

### Session Management
- **API:** `GET/POST /api/chat/sessions`
- **Table:** `chat_sessions`, `chat_messages`
- **Features:**
  - Auto-title from first message
  - Session list with search
  - Delete session (cascade messages)
  - Message count per session

### Message Storage
- **Table:** `chat_messages`
- **Fields:** role, content, sources (JSONB), created_at
- **Sources:** Array of {document_id, chunk_id, content, score}

---

## WIDGET CHAT

### Embeddable Widget
- **Route:** Widget JS embed (external site)
- **API:** `/api/widget/*`
- **Features:**
  - Floating chat bubble
  - Customizable theme
  - Conversation persistence
  - Lead capture integration
  - Analytics tracking

### Widget Configuration
- **Settings:** `/settings/widget`
- **API:** `GET/POST /api/widgets`
- **Table:** `widgets`, `widget_conversations`, `widget_messages`

---

## WHATSAPP CHAT

### WhatsApp Integration
- **Route:** `/whatsapp`, `/whatsapp/conversations/[id]`
- **API:** `/api/whatsapp/*`
- **Features:**
  - Same RAG pipeline as web chat
  - Lead intent detection
  - Conversation history
  - Multi-conversation support

### WhatsApp Processing
- **Module:** `lib/whatsapp/processor.ts`
- **Flow:**
  1. Webhook receives message
  2. Verify signature (`lib/whatsapp/webhook.ts`)
  3. Process through RAG (`lib/whatsapp/processor.ts`)
  4. Check lead intent (`lib/lead-intent.ts`)
  5. Send reply via Meta API (`lib/whatsapp/client.ts`)
  6. Store in DB

---

## PUBLIC API CHAT

### External API
- **Route:** `/api/v1/chat`
- **Auth:** API Key (header)
- **Features:**
  - RAG-powered responses
  - Rate limiting per key
  - Usage tracking
  - Workspace-scoped knowledge
