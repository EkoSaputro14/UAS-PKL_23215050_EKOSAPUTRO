/**
 * Lead Intelligence Engine (Lite)
 *
 * Regex-based intelligence extraction from conversation text.
 * No LLM calls — fast (<50ms) and free.
 */

// ============================================================
// INTENT CLASSIFICATION
// ============================================================

const INTENT_PATTERNS: Record<string, RegExp> = {
  purchase: /beli|pesan|order|ambil|bayar|checkout|mau dapat|mau beli|ingin beli|reservasi/i,
  inquiry: /tanya|info|detail|spesifikasi|cara|gimana|bagaimana|berapa|ada gak|ada nggak/i,
  support: /bantu|help|error|masalah|rusak|tidak bisa|gak bisa|gabisa|eror|bug|crash|down/i,
  comparison: /beda|mana lebih|vs|bandingkan|rekomendasi|saran|perbandingan|alternatif/i,
};

/**
 * Classify intent from a conversation transcript.
 * Returns one of: purchase, inquiry, support, comparison
 */
export function classifyIntent(transcript: string): string {
  const lower = transcript.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    const matches = lower.match(new RegExp(pattern.source, "gi"));
    scores[intent] = matches ? matches.length : 0;
  }

  // Return highest scoring intent, default to inquiry
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  if (sorted[0][1] > 0) return sorted[0][0];
  return "inquiry";
}

// ============================================================
// BUDGET EXTRACTION
// ============================================================

const BUDGET_PATTERNS: RegExp[] = [
  // "budget 100-150 juta" / "anggaran 50 juta"
  /(?:budget|anggaran|dana|biaya)\s*(?:sekitar\s*|kurang\s*lebih\s*|kira-kira\s*)?(\d[\d.,]*)\s*[-–]?\s*(\d[\d.,]*)?\s*(juta|miliar|ribu)/i,
  // "Rp 100-150 juta" / "Rp50 juta"
  /rp\.?\s*(\d[\d.,]*)\s*[-–]?\s*(\d[\d.,]*)?\s*(juta|miliar|ribu)/i,
  // "100-150 jutaan"
  /(\d[\d.,]*)\s*[-–]\s*(\d[\d.,]*)\s*(jutaan|miliaran)/i,
  // "sekitar 200 juta" / "kurang lebih 500 juta"
  /(?:sekitar|kurang\s*lebih|kira-kira|around)\s*(\d[\d.,]*)\s*(juta|miliar|ribu)/i,
  // "50 juta ke bawah" / "100 juta ke atas"
  /(\d[\d.,]*)\s*(juta|miliar|ribu)\s*ke\s*(bawah|atas)/i,
  // "50 juta" / "300 miliar" (standalone)
  /(?<!\d)(\d[\d.,]*)\s*(juta|miliar|ribu)(?!\s*(?:[-–]|\d))/i,
];

/**
 * Extract budget from conversation text.
 * Returns formatted budget string or null.
 */
export function extractBudget(transcript: string): string | null {
  for (const pattern of BUDGET_PATTERNS) {
    const match = transcript.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
}

// ============================================================
// TIMELINE DETECTION
// ============================================================

const TIMELINE_PATTERNS: Record<string, RegExp> = {
  urgent: /buru.?buru|segera|cepat|mendesak|urgent|minggu ini|bulan ini|hari ini|langsung|gak sabar|udah ga sabar/i,
  planning: /rencana|nanti|tahun depan|bulan depan|minggu depan|mau mulai|kalau\s*udah|insya.?allah|plan/i,
  exploring: /coba dulu|lihat.?lihat|masih cari|masih browsing|baru lihat|baru cek|sekadar tanya|iseng/i,
};

/**
 * Detect timeline/urgency from conversation text.
 * Returns one of: urgent, planning, exploring, unknown
 */
export function detectTimeline(transcript: string): string {
  const lower = transcript.toLowerCase();
  for (const [timeline, pattern] of Object.entries(TIMELINE_PATTERNS)) {
    if (pattern.test(lower)) return timeline;
  }
  return "unknown";
}

// ============================================================
// KEY QUESTIONS EXTRACTION
// ============================================================

/**
 * Extract key questions from conversation (sentences ending with ?).
 * Returns top 5 questions.
 */
export function extractKeyQuestions(transcript: string): string[] {
  // Split by newlines and periods
  const sentences = transcript
    .split(/[\n.]+/)
    .map((s) => s.trim())
    .filter((s) => s.endsWith("?") && s.length > 5 && s.length < 200);

  // Deduplicate and limit
  const unique = Array.from(new Set(sentences));
  return unique.slice(0, 5);
}

// ============================================================
// FOLLOW-UP SUGGESTION
// ============================================================

/**
 * Generate follow-up suggestion based on intelligence.
 */
export function generateFollowUp(
  intent: string,
  budget: string | null,
  timeline: string
): string {
  if (timeline === "urgent") {
    return "Prioritaskan respons cepat — lead sedang buru-buru. Hubungi segera.";
  }

  if (intent === "purchase" && budget) {
    return `Tawarkan produk/rekomen sesuai budget ${budget}. Sertakan opsi cicilan jika ada.`;
  }

  if (intent === "purchase" && !budget) {
    return "Tanyakan budget range untuk rekomendasi yang tepat.";
  }

  if (intent === "inquiry" && !budget) {
    return "Jawab pertanyaan, lalu tanyakan budget untuk rekomendasi lebih spesifik.";
  }

  if (intent === "support") {
    return "Tangani masalah dengan prioritas tinggi. Tawarkan solusi alternatif jika perlu.";
  }

  if (intent === "comparison") {
    return "Buatkan perbandingan antar opsi. Highlight kelebihan produk yang direkomendasikan.";
  }

  if (timeline === "planning") {
    return "Kirim informasi detail via WhatsApp. Follow up dalam 1-2 minggu.";
  }

  if (timeline === "exploring") {
    return "Kirim brosur/katalog. Ajak untuk demo atau kunjungan.";
  }

  return "Follow up dengan penawaran yang relevan.";
}

// ============================================================
// MAIN: GENERATE INTELLIGENCE
// ============================================================

export interface LeadIntelligence {
  intent: string;
  budget: string | null;
  timeline: string;
  followUp: string;
  keyQuestions: string[];
}

/**
 * Generate full intelligence from conversation transcript.
 */
export function generateIntelligence(transcript: string): LeadIntelligence {
  const intent = classifyIntent(transcript);
  const budget = extractBudget(transcript);
  const timeline = detectTimeline(transcript);
  const keyQuestions = extractKeyQuestions(transcript);
  const followUp = generateFollowUp(intent, budget, timeline);

  return {
    intent,
    budget,
    timeline,
    followUp,
    keyQuestions,
  };
}
