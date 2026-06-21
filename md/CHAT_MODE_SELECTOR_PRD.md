# CHAT MODE SELECTOR — PRD
**MimoNotes — Mode-Aware Chat System**
**Date:** June 9, 2026

---

## PROBLEM STATEMENT

Dashboard Chat always behaves like Knowledge Base mode. Responses start with "Berdasarkan dokumen..." even when the widget is configured for Customer Service or Sales mode. Owners cannot test what end users will experience.

---

## GOAL

Enable owners to select and test chat modes in Dashboard, producing identical behavior to what widget visitors see.

---

## CHAT MODES

### 1. Knowledge Base (Default for legacy)
- **Behavior:** Strict RAG, cites sources, refuses when no context
- **Response Style:** "Berdasarkan dokumen yang tersedia..."
- **Use Case:** Internal knowledge base, documentation

### 2. Customer Service (Default for new sessions)
- **Behavior:** Natural conversation, never rejects, offers help
- **Response Style:** "Halo! Terima kasih sudah bertanya..."
- **Use Case:** Customer support, FAQ handling

### 3. Sales Agent
- **Behavior:** Conversion-focused, qualifies leads, captures contacts
- **Response Style:** "Budget 100 juta? Mantap! Kami ada beberapa..."
- **Use Case:** Sales inquiries, lead generation

---

## USER STORY

**As a** workspace owner,
**I want to** select a chat mode in Dashboard Chat and test it,
**So that** I can verify the chatbot behaves exactly as end users will experience in the widget.

---

## ACCEPTANCE CRITERIA

### AC-1: Mode Selector UI
- [ ] Dashboard Chat shows a mode selector dropdown/toggle
- [ ] Options: Knowledge Base | Customer Service | Sales Agent
- [ ] Default for new sessions: Customer Service
- [ ] Mode persists within the session
- [ ] Visual indicator shows current mode

### AC-2: Mode Propagation
- [ ] Selected mode is sent in chat API request body
- [ ] API builds PromptContext from mode + workspace settings
- [ ] RAG pipeline uses correct prompt template
- [ ] Response style matches selected mode

### AC-3: Widget Consistency
- [ ] Dashboard Chat in CS mode produces identical responses to Widget in CS mode
- [ ] Dashboard Chat in Sales mode produces identical responses to Widget in Sales mode
- [ ] Dashboard Chat in KB mode produces identical responses to Widget in KB mode

### AC-4: Mode Indicator
- [ ] Chat header shows current mode with icon
- [ ] Mode can be changed mid-session
- [ ] Changing mode does not lose conversation history

---

## TECHNICAL DESIGN

### API Changes

#### POST /api/chat
```typescript
// Request body (add mode field)
{
  message: string;
  sessionId?: string;
  mode?: "knowledge_base" | "customer_service" | "sales_agent"; // NEW
}

// Response headers (add mode confirmation)
{
  "X-Mode": "customer_service";
}
```

### RAG Pipeline Changes

#### streamRAGResponse() — Add promptContext parameter
```typescript
export async function streamRAGResponse(
  question: string,
  topK: number = 5,
  workspaceId: string,
  minSimilarity?: number,
  maxContextTokens: number = DEFAULT_MAX_CONTEXT_TOKENS,
  promptContext?: PromptContext  // NEW
) {
  // ... existing retrieval logic ...
  
  // Build system prompt
  let systemPrompt: string;
  if (promptContext) {
    systemPrompt = buildSystemPrompt({
      ...promptContext,
      knowledgeContext: context || "(Tidak ada konteks dokumen yang relevan)",
    });
  } else {
    // Legacy KB mode (backward compatible)
    systemPrompt = `Anda adalah asisten AI yang HANYA menjawab...`;
  }
  
  // ... rest of streaming logic ...
}
```

### Widget API Changes

#### POST /api/widget/chat
```typescript
// Build PromptContext from widget settings
const promptContext: PromptContext = {
  mode: widget.mode as WidgetMode,
  businessName: widget.businessName || "",
  businessDescription: widget.businessDescription || "",
  contactInfo: {
    whatsapp: widget.businessWhatsApp,
    phone: widget.businessPhone,
    email: widget.businessEmail,
    address: widget.businessAddress,
  },
  knowledgeContext: context,
  conversationHistory: "",
};

const ragResult = await generateRAGResponse(
  message, 5, widget.workspaceId,
  undefined, undefined,
  promptContext  // NEW
);
```

### Dashboard Chat Changes

#### components/chat/chat-window.tsx
```typescript
// Add mode state
const [chatMode, setChatMode] = useState<"knowledge_base" | "customer_service" | "sales_agent">(
  "customer_service"  // Default for new sessions
);

// Send mode in request
const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: input,
    sessionId,
    mode: chatMode,  // NEW
  }),
});
```

#### Chat Header UI
```tsx
<div className="flex items-center gap-2">
  <Select value={chatMode} onValueChange={setChatMode}>
    <SelectTrigger className="w-[180px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="knowledge_base">
        <BookOpen className="w-4 h-4" /> Knowledge Base
      </SelectItem>
      <SelectItem value="customer_service">
        <HeadphonesIcon className="w-4 h-4" /> Customer Service
      </SelectItem>
      <SelectItem value="sales_agent">
        <TrendingUp className="w-4 h-4" /> Sales Agent
      </SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## DATABASE CHANGES

None required. Widget model already has:
- `mode` field (default: "knowledge_base")
- `businessName`, `businessDescription`
- `businessWhatsApp`, `businessPhone`, `businessEmail`, `businessAddress`

---

## MIGRATION PLAN

1. **Phase 1:** Fix `streamRAGResponse()` to accept promptContext
2. **Phase 2:** Fix Widget Chat API to build PromptContext
3. **Phase 3:** Fix Widget Stream API to build PromptContext
4. **Phase 4:** Add mode parameter to Dashboard Chat API
5. **Phase 5:** Add mode selector UI to Dashboard Chat
6. **Phase 6:** Playwright validation tests

---

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Dashboard Chat mode selection works | 100% |
| Widget mode propagation works | 100% |
| Response style consistency | 100% |
| No regression in KB mode | 100% |
| Playwright tests pass | 3/3 modes |

---

## OUT OF SCOPE

- Per-session mode override in widget (mode is per-widget, not per-session)
- Mode-specific conversation history (future enhancement)
- A/B testing between modes
- Mode analytics dashboard
