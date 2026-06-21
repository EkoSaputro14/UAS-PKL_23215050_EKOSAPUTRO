/**
 * Unit Tests for Lead Name Detection
 * 
 * Run: node --import tsx lib/__tests__/lead-detect.test.ts
 * Or:  npx tsx lib/__tests__/lead-detect.test.ts
 */

import { detectLeadFromMessage, extractName, NOT_NAMES, INTENT_PHRASES } from "../lead-detect";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    const msg = detail ? ` — ${detail}` : "";
    failures.push(`${testName}${msg}`);
    console.log(`  ❌ ${testName}${msg}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, testName: string) {
  if (actual === expected) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    const msg = `expected=${JSON.stringify(expected)}, got=${JSON.stringify(actual)}`;
    failures.push(`${testName} — ${msg}`);
    console.log(`  ❌ ${testName} — ${msg}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Test Suite 1: False Positive Rejection (the bug)
// ─────────────────────────────────────────────────────────────
console.log("\n🔴 Suite 1: False Positive Rejection");

(() => {
  // THE BUG: "saya mau tanya rumah" should NOT produce a name
  const r1 = detectLeadFromMessage("saya mau tanya rumah");
  assertEqual(r1.name, undefined, '"saya mau tanya rumah" → name=null');

  // Similar patterns
  const r2 = detectLeadFromMessage("Saya mau tanya tentang harga");
  assertEqual(r2.name, undefined, '"Saya mau tanya tentang harga" → name=null');

  const r3 = detectLeadFromMessage("saya cari rumah di tegal");
  assertEqual(r3.name, undefined, '"saya cari rumah di tegal" → name=null');

  const r4 = detectLeadFromMessage("saya ingin beli mobil");
  assertEqual(r4.name, undefined, '"saya ingin beli mobil" → name=null');

  const r5 = detectLeadFromMessage("saya butuh bantuan");
  assertEqual(r5.name, undefined, '"saya butuh bantuan" → name=null');

  const r6 = detectLeadFromMessage("saya booking untuk besok");
  assertEqual(r6.name, undefined, '"saya booking untuk besok" → name=null');

  const r7 = detectLeadFromMessage("saya hubungi nanti ya");
  assertEqual(r7.name, undefined, '"saya hubungi nanti ya" → name=null');

  const r8 = detectLeadFromMessage("saya konsultasi dulu");
  assertEqual(r8.name, undefined, '"saya konsultasi dulu" → name=null');

  const r9 = detectLeadFromMessage("saya ada pertanyaan");
  assertEqual(r9.name, undefined, '"saya ada pertanyaan" → name=null');

  const r10 = detectLeadFromMessage("saya bisa tanya?");
  assertEqual(r10.name, undefined, '"saya bisa tanya?" → name=null');
})();

// ─────────────────────────────────────────────────────────────
// Test Suite 2: Valid Name Detection (should still work)
// ─────────────────────────────────────────────────────────────
console.log("\n🟢 Suite 2: Valid Name Detection");

(() => {
  const r1 = detectLeadFromMessage("nama saya Budi Santoso");
  assertEqual(r1.name, "Budi Santoso", '"nama saya Budi Santoso" → Budi Santoso');

  const r2 = detectLeadFromMessage("saya Rina");
  assertEqual(r2.name, "Rina", '"saya Rina" → Rina');

  const r3 = detectLeadFromMessage("perkenalkan saya Ahmad Fauzi");
  assertEqual(r3.name, "Ahmad Fauzi", '"perkenalkan saya Ahmad Fauzi" → Ahmad Fauzi');

  const r4 = detectLeadFromMessage("panggil saya Dewi");
  assertEqual(r4.name, "Dewi", '"panggil saya Dewi" → Dewi');

  const r5 = detectLeadFromMessage("my name is John Smith");
  assertEqual(r5.name, "John Smith", '"my name is John Smith" → John Smith');

  const r6 = detectLeadFromMessage("I'm Sarah");
  assertEqual(r6.name, "Sarah", '"I\'m Sarah" → Sarah');

  const r7 = detectLeadFromMessage("nama saya Andi Wijaya");
  assertEqual(r7.name, "Andi Wijaya", '"nama saya Andi Wijaya" → Andi Wijaya');
})();

// ─────────────────────────────────────────────────────────────
// Test Suite 3: Edge Cases
// ─────────────────────────────────────────────────────────────
console.log("\n🟡 Suite 3: Edge Cases");

(() => {
  // No name in message
  const r1 = detectLeadFromMessage("berapa harga rumah?");
  assertEqual(r1.name, undefined, '"berapa harga rumah?" → name=null');

  // Only WhatsApp, no name
  const r2 = detectLeadFromMessage("WA saya 081234567890");
  assert(r2.whatsapp !== undefined, "WhatsApp detected from WA message");
  assertEqual(r2.name, undefined, "No name from WA-only message");

  // Only email, no name
  const r3 = detectLeadFromMessage("email saya test@example.com");
  assert(r3.email !== undefined, "Email detected");
  assertEqual(r3.name, undefined, "No name from email-only message");

  // Mixed: name + contact
  const r4 = detectLeadFromMessage("nama saya Budi, WA 081234567890");
  assertEqual(r4.name, "Budi", "Name from mixed message");
  assert(r4.whatsapp !== undefined, "WhatsApp from mixed message");

  // "saya" followed by non-name word (lowercase)
  const r5 = detectLeadFromMessage("saya mau tanya");
  assertEqual(r5.name, undefined, '"saya mau tanya" (lowercase) → name=null');

  // Single character after "saya"
  const r6 = detectLeadFromMessage("saya A");
  assertEqual(r6.name, undefined, '"saya A" → name=null (too short)');
})();

// ─────────────────────────────────────────────────────────────
// Test Suite 4: NOT_NAMES completeness
// ─────────────────────────────────────────────────────────────
console.log("\n🔵 Suite 4: NOT_NAMES Set Coverage");

(() => {
  const requiredWords = [
    "Mau", "Tanya", "Cari", "Ingin", "Butuh", "Hubungi",
    "Beli", "Booking", "Konsultasi", "Perlu", "Ada", "Bisa",
    "Rumah", "Mobil", "Motor",
  ];
  
  for (const word of requiredWords) {
    assert(NOT_NAMES.has(word), `NOT_NAMES contains "${word}"`);
  }
})();

// ─────────────────────────────────────────────────────────────
// Test Suite 5: INTENT_PHRASES coverage
// ─────────────────────────────────────────────────────────────
console.log("\n🟣 Suite 5: INTENT_PHRASES Coverage");

(() => {
  const testPhrases = [
    "mau tanya", "cari rumah", "ingin beli", "butuh bantuan",
    "tanya harga", "booking untuk", "hubungi saya",
  ];
  
  for (const phrase of testPhrases) {
    const matched = INTENT_PHRASES.some(p => p.test(phrase));
    assert(matched, `INTENT_PHRASES matches "${phrase}"`);
  }
})();

// ─────────────────────────────────────────────────────────────
// Test Suite 6: Confidence Scoring
// ─────────────────────────────────────────────────────────────
console.log("\n🟠 Suite 6: Confidence Scoring");

(() => {
  const r1 = detectLeadFromMessage("nama saya Budi Santoso");
  assert(r1.nameConfidence !== undefined && r1.nameConfidence > 0.5, 
    `Multi-word name confidence > 0.5 (got ${r1.nameConfidence})`);

  const r2 = detectLeadFromMessage("saya Rina");
  assert(r2.nameConfidence !== undefined && r2.nameConfidence >= 0.3,
    `Single-word name confidence >= 0.3 (got ${r2.nameConfidence})`);
})();

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) {
    console.log(`  ❌ ${f}`);
  }
  process.exit(1);
} else {
  console.log("\n✅ ALL TESTS PASSED");
  process.exit(0);
}
