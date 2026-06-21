/**
 * Lead Auto-Detection from Chat Messages
 * 
 * Extracts WhatsApp numbers, phone numbers, emails, and names
 * from visitor messages in real-time. Optimized for Indonesian context.
 */

// ── WhatsApp/Phone Patterns (Indonesia) ──
// +62 812-3456-7890, 081234567890, 6281234567890, 0812 3456 7890
const WHATSAPP_PATTERNS = [
  /\+62[\s\-]?8[1-9][\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{0,4}/g,
  /(?<!\d)08[1-9]\d{7,11}(?!\d)/g,
  /(?<!\d)628[1-9]\d{7,11}(?!\d)/g,
  // wa.me links
  /wa\.me\/(\+?62\d{8,13})/gi,
  // WhatsApp intent: "WA saya di...", "hubungi saya di..."
  /(?:wa|whatsapp|hubungi|telp|telepon|sms)[\s:]+(\+?6?2?[\s\-]?8[1-9][\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{0,4})/gi,
];

// ── Email Pattern ──
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// ── Name Patterns (Indonesian context) ──
// "nama saya Budi", "saya Budi", "panggil saya Rina", "perkenalkan saya Ahmad"
const NAME_PATTERNS = [
  /(?:nama\s+(?:saya|aku|gue)\s+(?:adalah\s+)?([A-Z][a-zA-ZÀ-ÿ]+(?:\s+[A-Z][a-zA-ZÀ-ÿ]+)?))/i,
  /(?:saya\s+(?:adalah\s+)?([A-Z][a-zA-ZÀ-ÿ]+(?:\s+[A-Z][a-zA-ZÀ-ÿ]+)?))/i,
  /(?:panggil\s+(?:saya|aku)\s+([A-Z][a-zA-ZÀ-ÿ]+))/i,
  /(?:perkenalkan,?\s+(?:nama\s+)?(?:saya\s+)?([A-Z][a-zA-ZÀ-ÿ]+(?:\s+[A-Z][a-zA-ZÀ-ÿ]+)?))/i,
  /(?:my name is\s+([A-Z][a-zA-ZÀ-ÿ]+(?:\s+[A-Z][a-zA-ZÀ-ÿ]+)?))/i,
  /(?:i(?:'m| am)\s+([A-Z][a-zA-ZÀ-ÿ]+(?:\s+[A-Z][a-zA-ZÀ-ÿ]+)?))/i,
];

// ── Indonesian common words that are NOT names ──
// Checked PER WORD — any word matching this set rejects the entire name
const NOT_NAMES = new Set([
  // Pronouns
  "Saya", "Aku", "Gue", "Kami", "Kita", "Bapak", "Ibu", "Pak", "Bu",
  "Mas", "Mbak", "Kak", "Admin", "Staff", "Owner", "Manager",
  // Verbs / intent words
  "Mau", "Ingin", "Tanya", "Cari", "Butuh", "Perlu", "Ada", "Ini", "Itu",
  "Bisa", "Boleh", "Tolong", "Mohon", "Terima", "Kasih",
  "Beli", "Booking", "Konsultasi", "Hubungi", "Jual", "Sewa",
  "Lihat", "Dapat", "Pakai", "Gunakan", "Ambil", "Datang",
  "Tahu", "Kenal", "Dengar", "Lihat", "Coba", "Mulai",
  // Adjectives / adverbs
  "Baru", "Lama", "Besar", "Kecil", "Bagus", "Jelek", "Murah", "Mahal",
  "Juga", "Sudah", "Belum", "Masih", "Akan", "Sedang", "Lagi",
  // Question words
  "Apa", "Siapa", "Dimana", "Kapan", "Mengapa", "Kenapa", "Bagaimana",
  "Berapa", "Mana", "Gimana",
  // Common greetings / fillers
  "Ya", "Tidak", "Baik", "Oke", "OK", "Halo", "Hai", "Hi", "Hello",
  "Selamat", "Pagi", "Siang", "Sore", "Malam", "Terima",
  // Location / context words
  "Rumah", "Apartemen", "Tanah", "Gedung", "Kantor", "Toko", "Mobil",
  "Motor", "HP", "Laptop", "Komputer",
  // Common non-name words
  "Test", "Example", "Demo", "Sample", "User", "Nama",
]);

// ── Intent phrases that should NEVER be names ──
// If the captured "name" matches any of these patterns, reject it
const INTENT_PHRASES = [
  /^mau\s/i,
  /^tanya\s/i,
  /^cari\s/i,
  /^ingin\s/i,
  /^butuh\s/i,
  /^beli\s/i,
  /^booking\s/i,
  /^hubungi\s/i,
  /^konsultasi\s/i,
  /^jual\s/i,
  /^sewa\s/i,
  /^ada\s/i,
  /^bisa\s/i,
  /^perlu\s/i,
  /^harga\s/i,
  /^berapa\s/i,
  /^dimana\s/i,
  /^bagaimana\s/i,
  /^apakah\s/i,
  /^sudah\s/i,
  /^belum\s/i,
  /^mau\s+tanya/i,
  /^cari\s+rumah/i,
  /^cari\s+mobil/i,
  /^tanya\s+harga/i,
  /^tanya\s+soal/i,
  /^butuh\s+bantuan/i,
  /^ingin\s+tahu/i,
  /^ingin\s+beli/i,
];

export interface DetectedLead {
  whatsapp?: string;
  phone?: string;
  email?: string;
  name?: string;
  nameConfidence?: number; // 0-1, higher = more confident
}

/**
 * Normalize Indonesian phone number to +62 format.
 */
function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/[\s\-\.]/g, "");
  if (cleaned.startsWith("08")) {
    cleaned = "+62" + cleaned.slice(1);
  } else if (cleaned.startsWith("628")) {
    cleaned = "+" + cleaned;
  } else if (cleaned.startsWith("62") && !cleaned.startsWith("+62")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

/**
 * Validate Indonesian phone number (8-15 digits after +62).
 */
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Extract WhatsApp/phone numbers from message text.
 */
function extractWhatsApp(text: string): string[] {
  const found: string[] = [];
  
  for (const pattern of WHATSAPP_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1] || match[0];
      const normalized = normalizePhone(raw);
      if (isValidPhone(normalized) && !found.includes(normalized)) {
        found.push(normalized);
      }
    }
  }
  
  return found;
}

/**
 * Extract email addresses from message text.
 */
function extractEmail(text: string): string[] {
  const matches = text.match(EMAIL_PATTERN) || [];
  // Filter out common false positives
  return matches.filter(email => {
    const domain = email.split("@")[1].toLowerCase();
    // Must have reasonable TLD
    return domain.length >= 3 && !domain.endsWith(".");
  });
}

/**
 * Calculate confidence score for a detected name.
 * Higher score = more likely a real name.
 * 
 * Factors:
 * - Single word names: lower confidence (0.4)
 * - Multi-word names: higher confidence (0.7)
 * - Contains stopword: 0
 * - Matches intent phrase: 0
 * - Very short (<3 chars): 0.2
 * - Proper capitalization in original: +0.1
 */
function calculateNameConfidence(
  name: string,
  originalMatch: string,
  words: string[]
): number {
  let score = 0.5; // base

  // Multi-word names are more likely real
  if (words.length >= 2) score += 0.2;
  
  // Very short single-word names are suspicious
  if (name.length <= 3 && words.length === 1) score -= 0.3;

  // Check if original text had proper capitalization (not from regex /i flag)
  const firstChar = originalMatch.charAt(0);
  if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Extract name from message text (Indonesian + English patterns).
 * Returns the name string and confidence score, or undefined if no valid name found.
 */
function extractName(text: string): { name: string; confidence: number } | undefined {
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const rawName = match[1].trim();
      
      // Split into individual words for per-word validation
      const words = rawName.split(/\s+/).filter(w => w.length > 0);
      
      // ── Check 1: Any word in NOT_NAMES → reject entire name ──
      const hasStopWord = words.some(word => {
        const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        return NOT_NAMES.has(capitalized);
      });
      if (hasStopWord) continue; // try next pattern
      
      // ── Check 2: Raw name matches an intent phrase → reject ──
      const lowerName = rawName.toLowerCase();
      const isIntentPhrase = INTENT_PHRASES.some(pattern => pattern.test(lowerName));
      if (isIntentPhrase) continue;
      
      // ── Check 3: Length validation ──
      if (rawName.length < 2 || rawName.length > 50) continue;
      
      // ── Check 4: Must contain at least one alphabetic char ──
      if (!/[a-zA-ZÀ-ÿ]/.test(rawName)) continue;
      
      // ── Check 5: Reject if name is just repeated characters ──
      if (/^(.)\1+$/.test(rawName.replace(/\s/g, ""))) continue;
      
      // All checks passed — format the name
      const formattedName = words.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(" ");
      
      // Calculate confidence
      const confidence = calculateNameConfidence(formattedName, rawName, words);
      
      // Only return if confidence is above minimum threshold
      if (confidence < 0.3) continue;
      
      return { name: formattedName, confidence };
    }
  }
  return undefined;
}

/**
 * Main detection function: extract all available contact info from a message.
 * Returns only NEW data not already present in existing lead info.
 */
export function detectLeadFromMessage(
  message: string,
  existing?: { whatsapp?: string | null; email?: string | null; name?: string | null }
): DetectedLead {
  const result: DetectedLead = {};
  
  // Extract WhatsApp/phone
  if (!existing?.whatsapp) {
    const phones = extractWhatsApp(message);
    if (phones.length > 0) {
      result.whatsapp = phones[0];
      // If it looks like WhatsApp (mobile number), also set as phone
      result.phone = phones[0];
    }
  }
  
  // Extract email
  if (!existing?.email) {
    const emails = extractEmail(message);
    if (emails.length > 0) {
      result.email = emails[0].toLowerCase();
    }
  }
  
  // Extract name
  if (!existing?.name) {
    const nameResult = extractName(message);
    if (nameResult) {
      result.name = nameResult.name;
      result.nameConfidence = nameResult.confidence;
    }
  }
  
  return result;
}

/**
 * Check if a detected lead has any useful data.
 */
export function hasLeadData(lead: DetectedLead): boolean {
  return !!(lead.whatsapp || lead.email || lead.name);
}

/**
 * Merge detected lead data with existing data (only fill gaps).
 */
export function mergeLeadData(
  existing: { name?: string | null; email?: string | null; whatsapp?: string | null },
  detected: DetectedLead
): { name?: string; email?: string; whatsapp?: string; hasChanges: boolean } {
  const merged: { name?: string; email?: string; whatsapp?: string; hasChanges: boolean } = {
    hasChanges: false,
  };
  
  if (!existing.name && detected.name) {
    merged.name = detected.name;
    merged.hasChanges = true;
  }
  if (!existing.email && detected.email) {
    merged.email = detected.email;
    merged.hasChanges = true;
  }
  if (!existing.whatsapp && detected.whatsapp) {
    merged.whatsapp = detected.whatsapp;
    merged.hasChanges = true;
  }
  
  return merged;
}

// ── Exported for testing ──
export { extractName, NOT_NAMES, INTENT_PHRASES, calculateNameConfidence };
// name fix 1781735332
