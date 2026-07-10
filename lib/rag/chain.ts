import { getAIProvider, getAIModel } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, getEmbeddingSource } from "./embedder";
import {
  searchSimilarChunks,
  hybridSearch,
  isHybridSearchEnabled,
  buildAttributedContext,
  type SimilarChunk,
  type RetrievalMetrics,
  type RetrievalResult,
} from "./vectorstore";

// prompts/templates module removed — define PromptContext inline
export interface PromptContext {
  mode?: string;
  knowledgeContext?: string;
  conversationHistory?: string;
  [key: string]: unknown;
}

function buildSystemPrompt(ctx: PromptContext): string {
  return `You are a helpful AI assistant.${ctx.knowledgeContext ? `\n\nContext:\n${ctx.knowledgeContext}` : ""}`;
}

// Token estimation: ~4 chars per token (conservative for mixed languages)
const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_CONTEXT_TOKENS = 3000;

// ============================================================
// Confidence Classification & Refusal
// ============================================================

export type ConfidenceLevel = "high" | "medium" | "low" | "refuse";

/**
 * Classify confidence level based on max similarity score.
 *
 * Thresholds dynamically adjusted for embedding type:
 *   - API embeddings (OpenAI, etc.): range 0.50–0.95
 *   - Local feature-hashing: range 0.10–0.40 (much lower precision)
 */
export function classifyConfidence(maxSimilarity: number, useLocalEmbedding: boolean = false): ConfidenceLevel {
  if (useLocalEmbedding) {
    // Feature-hashing thresholds (lower range — local embeddings are less precise)
    if (maxSimilarity >= 0.25) return "high";
    if (maxSimilarity >= 0.15) return "medium";
    if (maxSimilarity >= 0.05) return "low";
    return "refuse";
  }
  // API embedding thresholds (original)
  if (maxSimilarity >= 0.55) return "high";
  if (maxSimilarity >= 0.40) return "medium";
  if (maxSimilarity >= 0.30) return "low";
  return "refuse";
}

/**
 * Decide whether to refuse answering based on retrieval results.
 */
export function shouldRefuse(
  chunks: Array<{ similarity: number }>,
  useLocalEmbedding: boolean = false
): { refuse: boolean; reason?: string; confidence: ConfidenceLevel } {
  if (chunks.length === 0) {
    return { refuse: true, reason: "no_results", confidence: "refuse" };
  }

  const maxSimilarity = Math.max(...chunks.map((c) => c.similarity));
  const confidence = classifyConfidence(maxSimilarity, useLocalEmbedding);

  if (confidence === "refuse") {
    return { refuse: true, reason: "low_confidence", confidence };
  }

  return { refuse: false, confidence };
}

/**
 * Get a response prefix based on confidence level.
 * Empty string for high confidence (no caveat needed).
 */
export function getConfidencePrefix(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "";
    case "medium":
      return "Berdasarkan dokumen yang tersedia, ";
    case "low":
      return "Informasi terbatas ditemukan dalam dokumen. Harap dicatat bahwa jawaban ini mungkin tidak lengkap dan memiliki keterbatasan: ";
    case "refuse":
      return "Maaf, saya tidak menemukan informasi yang cukup relevan dalam dokumen yang tersedia untuk menjawab pertanyaan Anda dengan percaya diri. Silakan coba pertanyaan lain atau upload dokumen yang lebih relevan.";
  }
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    documentTitle: string;
    content: string;
    similarity: number;
    chunkIndex: number;
    metadata: Record<string, unknown>;
  }>;
  metrics: RetrievalMetrics;
  /** Confidence level of the response */
  confidence?: ConfidenceLevel;
  /** Whether the response was refused */
  refused?: boolean;
  /** Reason for refusal */
  refusalReason?: string;
}

/**
 * Unified retrieval: uses hybrid search when enabled, vector-only otherwise.
 */
async function retrieveChunks(
  question: string,
  topK: number,
  minSimilarity: number
): Promise<{ chunks: SimilarChunk[]; metrics: RetrievalMetrics }> {
  const queryEmbedding = await generateEmbedding(question);
  const useHybrid = await isHybridSearchEnabled();
  const embeddingSource = await getEmbeddingSource();
  const useLocal = embeddingSource === "local";

  let result: RetrievalResult;
  if (useHybrid) {
    result = await hybridSearch({
      queryText: question,
      queryEmbedding,
      topK,
      minSimilarity,
    });
  } else {
    result = await searchSimilarChunks(queryEmbedding, topK, minSimilarity);
  }

  // Local embedding fallback: if search returned 0 chunks but workspace has documents,
  // return the most recent chunks anyway — feature hashing is too imprecise for cosine
  if (useLocal && result.chunks.length === 0) {
    console.log(`[RAG] Local embedding returned 0 chunks, falling back to recent chunks from workspace`);
    const rawFallback: Array<{
      id: string; content: string; document_id: string; document_title: string;
      similarity: number; chunk_index: number;
      metadata: Record<string, unknown>; chunk_type: string;
      ocr_text: string | null; caption: string | null;
      image_summary: string | null; image_url: string | null;
    }> = await prisma.$queryRaw`
      SELECT dc.id, dc.content, dc.document_id, d.title as document_title,
        0.0 as similarity, dc.chunk_index, dc.metadata,
        dc.chunk_type, dc.ocr_text, dc.caption, dc.image_summary, dc.image_url
      FROM document_chunks dc
      JOIN documents d ON d.id = dc.document_id
      WHERE dc.embedding IS NOT NULL
      ORDER BY dc.created_at DESC
      LIMIT ${topK}
    `;
    if (rawFallback.length > 0) {
      const fallbackChunks: SimilarChunk[] = rawFallback.map((r) => ({
        id: r.id,
        content: r.content,
        documentId: r.document_id,
        documentTitle: r.document_title || "Untitled",
        similarity: 0.0,
        chunkIndex: r.chunk_index,
        metadata: r.metadata,
        chunkType: r.chunk_type || "text",
        ocrText: r.ocr_text || undefined,
        caption: r.caption || undefined,
        imageSummary: r.image_summary || undefined,
        imageUrl: r.image_url || undefined,
      }));
      result = { chunks: fallbackChunks, metrics: result.metrics };
    }
  }

  return result;
}

/**
 * Generate a RAG response using the AI provider.
 *
 * @param promptContext - Optional. When provided, uses the prompt template system
 *   for mode-aware responses (CS mode, Sales mode, etc).
 *   When omitted, falls back to legacy KB-mode hardcoded prompt (backward compatible).
 */
export async function generateRAGResponse(
  question: string,
  topK: number = 5,
  minSimilarity?: number,
  maxContextTokens: number = DEFAULT_MAX_CONTEXT_TOKENS,
  promptContext?: PromptContext
): Promise<RAGResponse> {
  // Auto-detect embedding source and adjust threshold
  const embeddingSource = await getEmbeddingSource();
  const useLocal = embeddingSource === "local";
  const effectiveMinSimilarity = minSimilarity ?? (useLocal ? 0.08 : 0.30);

  const { chunks: similarChunks, metrics } = await retrieveChunks(
    question, topK, effectiveMinSimilarity
  );

  // Debug: log retrieval results
  console.log(`[RAG] Query: "${question.substring(0, 50)}" | Chunks: ${similarChunks.length} | MinSim: ${effectiveMinSimilarity} | Source: ${embeddingSource}`);
  if (similarChunks.length > 0) {
    const maxSim = Math.max(...similarChunks.map(c => c.similarity));
    console.log(`[RAG] MaxSim: ${maxSim.toFixed(4)} | Chunk: "${similarChunks[0].content.substring(0, 80)}..."`);
  }

  // Confidence-based refusal check (with local embedding awareness)
  const refusal = shouldRefuse(similarChunks, useLocal);

  // ── Mode handling ──
  const mode = promptContext?.mode || "knowledge_base";
  const isConversational = mode === "customer_service" || mode === "sales_agent";

  // For conversational modes (CS/Sales): always proceed even without chunks
  // For KB mode: refuse only if truly no results found
  if (refusal.refuse && !isConversational && refusal.reason === "no_results") {
    // KB mode with zero chunks — strict refusal
    return {
      answer: getConfidencePrefix(refusal.confidence),
      sources: [],
      metrics,
      confidence: refusal.confidence,
      refused: true,
      refusalReason: refusal.reason,
    };
  }

  // Build attributed context with source citations
  const { context } = buildAttributedContext(similarChunks, maxContextTokens);

  // Build system prompt
  let systemPrompt: string;
  if (promptContext) {
    // Use template system with full context
    systemPrompt = buildSystemPrompt({
      ...promptContext,
      knowledgeContext: context || "(Tidak ada konteks dokumen yang relevan)",
    });
  } else {
    // Legacy KB mode (backward compatible)
    const prefix = getConfidencePrefix(refusal.confidence);
    systemPrompt = `Anda adalah asisten AI yang HANYA menjawab berdasarkan konteks dokumen yang diberikan.

ATURAN KETAT:
1. HANYA gunakan informasi yang ada dalam konteks dokumen di bawah ini. JANGAN gunakan pengetahuan umum Anda.
2. Jika informasi yang diminta TIDAK ADA dalam konteks, jawab: "Informasi tersebut tidak tersedia dalam dokumen yang saya miliki."
3. JANGAN mengarang, menduga, atau mengisi kekosongan informasi dari pengetahuan umum.
4. SELALU kutip sumber dengan format [Document: nama_dokumen] untuk setiap fakta yang Anda sebutkan.
5. Jika hanya sebagian informasi yang tersedia, sampaikan HANYA bagian yang tersedia dan sebutkan keterbatasannya.

Konteks dari dokumen:
${context}`;
  }

  // Generate response using AI provider
  const openai = await getAIProvider();
  const model = await getAIModel();

  // Build messages array with conversation history
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history if available
  if (promptContext?.conversationHistory) {
    const lines = promptContext.conversationHistory.split("\n").filter(Boolean);
    for (const line of lines) {
      if (line.startsWith("User: ")) {
        messages.push({ role: "user", content: line.substring(6) });
      } else if (line.startsWith("Assistant: ")) {
        messages.push({ role: "assistant", content: line.substring(11) });
      }
    }
  }

  messages.push({ role: "user", content: question });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 1000,
  });

  const rawAnswer =
    completion.choices[0]?.message?.content ||
    "Maaf, terjadi kesalahan saat menghasilkan jawaban.";

  // For KB mode, prepend confidence prefix; for CS/Sales, no prefix
  const answer = !isConversational && refusal.confidence !== "high"
    ? `${getConfidencePrefix(refusal.confidence)}${rawAnswer}`
    : rawAnswer;

  return {
    answer,
    sources: similarChunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      content: chunk.content,
      similarity: chunk.similarity,
      chunkIndex: chunk.chunkIndex,
      metadata: chunk.metadata,
    })),
    metrics,
    confidence: refusal.confidence,
    refused: false,
  };
}

/**
 * Generate a streaming RAG response using the AI provider.
 */
export async function streamRAGResponse(
  question: string,
  topK: number = 5,
  minSimilarity?: number,
  maxContextTokens: number = DEFAULT_MAX_CONTEXT_TOKENS,
  promptContext?: PromptContext
) {
  // Auto-detect embedding source and adjust threshold
  const embeddingSource = await getEmbeddingSource();
  const useLocal = embeddingSource === "local";
  const effectiveMinSimilarity = minSimilarity ?? (useLocal ? 0.08 : 0.30);

  const { chunks: similarChunks, metrics } = await retrieveChunks(
    question, topK, effectiveMinSimilarity
  );

  // Debug: log retrieval results
  console.log(`[RAG-Stream] Query: "${question.substring(0, 50)}" | Chunks: ${similarChunks.length} | MinSim: ${effectiveMinSimilarity} | Source: ${embeddingSource}`);
  if (similarChunks.length > 0) {
    const maxSim = Math.max(...similarChunks.map(c => c.similarity));
    console.log(`[RAG-Stream] MaxSim: ${maxSim.toFixed(4)} | Chunk: "${similarChunks[0].content.substring(0, 80)}..."`);
  }

  // Confidence-based refusal check (with local embedding awareness)
  const refusal = shouldRefuse(similarChunks, useLocal);
  // ── Mode handling ──
  const mode = promptContext?.mode || "knowledge_base";
  const isConversational = mode === "customer_service" || mode === "sales_agent";

  // Refuse only if truly no results AND not conversational mode
  if (refusal.refuse && !isConversational && refusal.reason === "no_results") {
    // KB mode with zero chunks — strict refusal
    return {
      stream: null,
      sources: [],
      noContext: true,
      metrics,
      confidence: refusal.confidence,
      refused: true,
      refusalReason: refusal.reason,
      refusalMessage: getConfidencePrefix(refusal.confidence),
    };
  }

  // Build attributed context with source citations
  const { context } = buildAttributedContext(similarChunks, maxContextTokens);

  // Get confidence prefix for caveat
  const prefix = getConfidencePrefix(refusal.confidence);
  // Build system prompt
  let systemPrompt: string;
  if (promptContext) {
    // Use template system with full context
    systemPrompt = buildSystemPrompt({
      ...promptContext,
      knowledgeContext: context || "(Tidak ada konteks dokumen yang relevan)",
    });
  } else {
    // Legacy KB mode (backward compatible)
    systemPrompt = `Anda adalah asisten AI yang HANYA menjawab berdasarkan konteks dokumen yang diberikan.\n\nATURAN KETAT:\n1. HANYA gunakan informasi yang ada dalam konteks dokumen di bawah ini. JANGAN gunakan pengetahuan umum Anda.\n2. Jika informasi yang diminta TIDAK ADA dalam konteks, jawab: "Informasi tersebut tidak tersedia dalam dokumen yang saya miliki."\n3. JANGAN mengarang, menduga, atau mengisi kekosongan informasi dari pengetahuan umum.\n4. SELALU kutip sumber dengan format [Document: nama_dokumen] untuk setiap fakta yang Anda sebutkan.\n5. Jika hanya sebagian informasi yang tersedia, sampaikan HANYA bagian yang tersedia dan sebutkan keterbatasannya.\n\nKonteks dari dokumen:\n${context}`;
  }

  // Generate streaming response using AI provider
  const openai = await getAIProvider();
  const model = await getAIModel();

  // Build messages array with conversation history
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history if available
  if (promptContext?.conversationHistory) {
    const lines = promptContext.conversationHistory.split("\n").filter(Boolean);
    for (const line of lines) {
      if (line.startsWith("User: ")) {
        messages.push({ role: "user", content: line.substring(6) });
      } else if (line.startsWith("Assistant: ")) {
        messages.push({ role: "assistant", content: line.substring(11) });
      }
    }
  }

  // Add current question
  messages.push({ role: "user", content: question });

  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 1000,
    stream: true,
  });

  return {
    stream,
    sources: similarChunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      content: chunk.content,
      similarity: chunk.similarity,
      chunkIndex: chunk.chunkIndex,
      metadata: chunk.metadata,
    })),
    noContext: false,
    metrics,
    confidence: refusal.confidence,
    refused: false,
    confidencePrefix: !isConversational ? prefix : "",
  };
}
