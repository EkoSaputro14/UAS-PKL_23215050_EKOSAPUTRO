"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  Upload,
  MessageSquare,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Copy,
  ExternalLink,
  Sparkles,
  CloudUpload,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface OnboardingData {
  businessName: string;
  businessType: string;
  businessDescription: string;
  businessWhatsApp: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  documentsUploaded: number;
  testCompleted: boolean;
  widgetId: string | null;
  widgetPublicKey: string | null;
}

// ============================================================
// Business Type Templates
// ============================================================

const BUSINESS_TEMPLATES: Record<string, { description: string; placeholder: string }> = {
  property: {
    description: "Kami adalah agen properti yang menyediakan rumah-rumah berkualitas dengan harga terjangkau di wilayah Tegal dan sekitarnya.",
    placeholder: "Ceritakan tentang bisnis properti Anda...",
  },
  rental: {
    description: "Kami menyediakan jasa rental mobil dengan berbagai pilihan kendaraan untuk keperluan bisnis maupun pribadi.",
    placeholder: "Ceritakan tentang bisnis rental Anda...",
  },
  klinik: {
    description: "Kami adalah klinik kecantikan yang menyediakan berbagai treatment wajah dan tubuh dengan teknologi terkini.",
    placeholder: "Ceritakan tentang klinik Anda...",
  },
  ecommerce: {
    description: "Kami menjual berbagai produk berkualitas dengan harga kompetitif dan pengiriman cepat.",
    placeholder: "Ceritakan tentang toko online Anda...",
  },
  general: {
    description: "",
    placeholder: "Ceritakan tentang bisnis Anda...",
  },
};

const BUSINESS_TYPES = [
  { value: "property", label: "🏠 Properti", desc: "Agen properti, developer" },
  { value: "rental", label: "🚗 Rental Mobil", desc: "Sewa kendaraan" },
  { value: "klinik", label: "💊 Klinik / Kecantikan", desc: "Klinik, salon, spa" },
  { value: "ecommerce", label: "🛒 E-commerce", desc: "Toko online, marketplace" },
  { value: "general", label: "📋 Bisnis Lainnya", desc: "Umum" },
];

// ============================================================
// Steps Config
// ============================================================

const STEPS = [
  { id: 1, title: "Info Bisnis", icon: Building2, desc: "Nama & jenis bisnis" },
  { id: 2, title: "Deskripsi", icon: FileText, desc: "Detail bisnis Anda" },
  { id: 3, title: "Dokumen", icon: Upload, desc: "Upload dokumen bisnis" },
  { id: 4, title: "Tes Chatbot", icon: MessageSquare, desc: "Coba chatbot Anda" },
  { id: 5, title: "Publish", icon: Rocket, desc: "Chatbot siap digunakan" },
];

// ============================================================
// Main Component
// ============================================================

export default function OnboardingWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    businessType: "general",
    businessDescription: "",
    businessWhatsApp: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    documentsUploaded: 0,
    testCompleted: false,
    widgetId: null,
    widgetPublicKey: null,
  });

  // Upload state
  const [uploadQueue, setUploadQueue] = useState<{ name: string; status: string; chunks?: number }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Test chat state
  const [testMessages, setTestMessages] = useState<{ role: string; content: string }[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  // ============================================================
  // Step Navigation
  // ============================================================

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1: return data.businessName.trim().length >= 2;
      case 2: return data.businessDescription.trim().length >= 10;
      case 3: return data.documentsUploaded > 0;
      case 4: return data.testCompleted;
      case 5: return data.widgetId !== null;
      default: return false;
    }
  }, [currentStep, data]);

  const saveStep = useCallback(async (step: number, stepData: Record<string, unknown>) => {
    try {
      await fetch("/api/onboarding/step", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data: stepData }),
      });
    } catch (err) {
      console.error("Failed to save step:", err);
    }
  }, []);

  const nextStep = useCallback(async () => {
    if (!canProceed()) return;

    // Save current step data
    if (currentStep === 1) {
      await saveStep(1, { businessName: data.businessName, businessType: data.businessType });
    } else if (currentStep === 2) {
      await saveStep(2, {
        businessDescription: data.businessDescription,
        businessWhatsApp: data.businessWhatsApp,
        businessPhone: data.businessPhone,
        businessEmail: data.businessEmail,
        businessAddress: data.businessAddress,
      });
    } else if (currentStep === 3) {
      // Create widget before test step so test chat works
      if (!data.widgetId) {
        setLoading(true);
        try {
          const res = await fetch("/api/onboarding/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessName: data.businessName,
              businessType: data.businessType,
              businessDescription: data.businessDescription,
              contactInfo: {
                whatsapp: data.businessWhatsApp,
                phone: data.businessPhone,
                email: data.businessEmail,
                address: data.businessAddress,
              },
            }),
          });
          const result = await res.json();
          if (res.ok) {
            setData((d) => ({
              ...d,
              widgetId: result.widget.id,
              widgetPublicKey: result.widget.publicKey,
            }));
            toast.success("Chatbot dibuat! Sekarang coba test chatbot Anda.");
          } else {
            toast.error(result.error || "Gagal membuat chatbot");
            setLoading(false);
            return;
          }
        } catch {
          toast.error("Error creating chatbot");
          setLoading(false);
          return;
        }
        setLoading(false);
      }
    }

    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, data, canProceed, saveStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // ============================================================
  // File Upload Handler
  // ============================================================

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    let totalChunks = 0;

    for (const file of fileArray) {
      setUploadQueue((prev) => [...prev, { name: file.name, status: "uploading" }]);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const result = await res.json();

        if (res.ok) {
          // Poll for completion
          const docId = result.id || result.documentId;
          const chunks = await pollDocumentReady(docId);
          totalChunks += chunks;
          setUploadQueue((prev) =>
            prev.map((q) => (q.name === file.name ? { ...q, status: "done", chunks } : q))
          );
        } else {
          setUploadQueue((prev) =>
            prev.map((q) => (q.name === file.name ? { ...q, status: "error" } : q))
          );
          toast.error(`Gagal upload ${file.name}: ${result.error}`);
        }
      } catch {
        setUploadQueue((prev) =>
          prev.map((q) => (q.name === file.name ? { ...q, status: "error" } : q))
        );
        toast.error(`Error uploading ${file.name}`);
      }
    }

    setData((d) => ({ ...d, documentsUploaded: d.documentsUploaded + fileArray.length }));
    await saveStep(3, { documentsUploaded: data.documentsUploaded + fileArray.length });
    setUploading(false);
    toast.success(`${fileArray.length} dokumen berhasil diupload!`);
  }, [data.documentsUploaded, saveStep]);

  const pollDocumentReady = async (docId: string): Promise<number> => {
    for (let i = 0; i < 150; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await fetch(`/api/knowledge/documents/${docId}`);
        if (res.ok) {
          const doc = await res.json();
          if (doc.status === "ready") return doc.chunkCount || 0;
          if (doc.status === "failed") throw new Error("Processing failed");
        }
      } catch { /* ignore */ }
    }
    return 0;
  };

  // ============================================================
  // Test Chat Handler
  // ============================================================

  const sendTestMessage = useCallback(async () => {
    if (!testInput.trim() || !data.widgetPublicKey) return;

    const userMsg = testInput.trim();
    setTestInput("");
    setTestMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setTestLoading(true);

    try {
      const res = await fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": window.location.origin },
        body: JSON.stringify({
          publicKey: data.widgetPublicKey,
          message: userMsg,
          visitorId: "onboarding-test",
        }),
      });
      const result = await res.json();
      setTestMessages((prev) => [...prev, { role: "assistant", content: result.message || "Error" }]);

      if (!data.testCompleted) {
        setData((d) => ({ ...d, testCompleted: true }));
        await saveStep(4, { testCompleted: true });
      }
    } catch {
      setTestMessages((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan." }]);
    }
    setTestLoading(false);
  }, [testInput, data.widgetPublicKey, data.testCompleted, saveStep]);

  // ============================================================
  // Complete Onboarding (Create Widget)
  // ============================================================

  const completeOnboarding = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: data.businessName,
          businessType: data.businessType,
          businessDescription: data.businessDescription,
          contactInfo: {
            whatsapp: data.businessWhatsApp,
            phone: data.businessPhone,
            email: data.businessEmail,
            address: data.businessAddress,
          },
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setData((d) => ({
          ...d,
          widgetId: result.widget.id,
          widgetPublicKey: result.widget.publicKey,
        }));
        toast.success("Chatbot berhasil dibuat!");
      } else {
        toast.error(result.error || "Gagal membuat chatbot");
      }
    } catch {
      toast.error("Error creating chatbot");
    }
    setLoading(false);
  }, [data]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Setup Chatbot Bisnis Anda</h1>
          </div>
          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full ${
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.id
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <step.icon className="size-4 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-0.5 mx-1 shrink-0 ${currentStep > step.id ? "bg-emerald-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Apa nama bisnis Anda?</h2>
              <p className="text-sm text-muted-foreground">Nama bisnis akan ditampilkan di chatbot Anda.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nama Bisnis *</label>
                <input
                  type="text"
                  value={data.businessName}
                  onChange={(e) => setData((d) => ({ ...d, businessName: e.target.value }))}
                  placeholder="Contoh: Tegal Property Center"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Jenis Bisnis</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setData((d) => ({
                          ...d,
                          businessType: type.value,
                          businessDescription: BUSINESS_TEMPLATES[type.value]?.description || d.businessDescription,
                        }));
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        data.businessType === type.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-lg">{type.label.split(" ")[0]}</span>
                      <div>
                        <div className="text-sm font-medium text-foreground">{type.label.split(" ").slice(1).join(" ")}</div>
                        <div className="text-xs text-muted-foreground">{type.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Description */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Ceritakan bisnis Anda</h2>
              <p className="text-sm text-muted-foreground">Informasi ini akan digunakan oleh AI untuk menjawab pertanyaan pelanggan.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi Bisnis *</label>
                <textarea
                  value={data.businessDescription}
                  onChange={(e) => setData((d) => ({ ...d, businessDescription: e.target.value }))}
                  placeholder={BUSINESS_TEMPLATES[data.businessType]?.placeholder || "Ceritakan tentang bisnis Anda..."}
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{data.businessDescription.length}/500 karakter</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp</label>
                  <input
                    type="text"
                    value={data.businessWhatsApp}
                    onChange={(e) => setData((d) => ({ ...d, businessWhatsApp: e.target.value }))}
                    placeholder="081234567890"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={data.businessEmail}
                    onChange={(e) => setData((d) => ({ ...d, businessEmail: e.target.value }))}
                    placeholder="info@bisnis.com"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Alamat</label>
                <input
                  type="text"
                  value={data.businessAddress}
                  onChange={(e) => setData((d) => ({ ...d, businessAddress: e.target.value }))}
                  placeholder="Jl. Contoh No. 123, Kota"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload Documents */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Upload dokumen bisnis</h2>
              <p className="text-sm text-muted-foreground">Upload daftar produk, harga, FAQ, atau brosur. AI akan menggunakan dokumen ini untuk menjawab pertanyaan pelanggan.</p>
            </div>

            <div
              className={`w-full min-h-[200px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${
                uploading ? "border-muted bg-muted/30" : "border-primary/30 bg-card hover:border-primary hover:bg-card/80"
              }`}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files);
              }}
            >
              <CloudUpload className="size-10 text-primary mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {uploading ? "Mengupload..." : "Drop file di sini atau klik untuk pilih"}
              </p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, CSV, XLSX, PNG, JPG</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
            </div>

            {/* Upload queue */}
            {uploadQueue.length > 0 && (
              <div className="space-y-2">
                {uploadQueue.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="text-sm text-foreground flex-1 truncate">{item.name}</span>
                    {item.status === "uploading" && <Loader2 className="size-4 animate-spin text-primary" />}
                    {item.status === "done" && (
                      <span className="text-xs text-emerald-600 font-medium">✓ {item.chunks} chunks</span>
                    )}
                    {item.status === "error" && <span className="text-xs text-destructive">Gagal</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Contoh dokumen:</strong><br />
                • Properti: daftar properti, brosur, price list<br />
                • Rental: daftar mobil, harga sewa, syarat & ketentuan<br />
                • Klinik: daftar treatment, harga, jam operasional
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Test Chatbot */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Coba chatbot Anda</h2>
              <p className="text-sm text-muted-foreground">Kirim pesan untuk menguji chatbot. AI akan menjawab berdasarkan dokumen yang sudah diupload.</p>
            </div>

            {/* Chat area */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="h-80 overflow-y-auto p-4 space-y-3 bg-background">
                {testMessages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <MessageSquare className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    Ketik pesan di bawah untuk menguji chatbot
                  </div>
                )}
                {testMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {testLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-3 bg-card">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendTestMessage()}
                    placeholder="Ketik pertahh test..."
                    className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    disabled={testLoading}
                  />
                  <button
                    onClick={sendTestMessage}
                    disabled={testLoading || !testInput.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {data.testCompleted && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">Chatbot berhasil merespons! Lanjutkan ke langkah terakhir.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Publish */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {data.widgetId ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="size-8 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">🎉 Chatbot Berhasil Dibuat!</h2>
                  <p className="text-sm text-muted-foreground">
                    {data.businessName} sudah siap melayani pelanggan.
                  </p>
                </div>

                {/* Embed Code */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Kode Embed</h3>
                  <div className="bg-muted rounded-lg p-3 font-mono text-xs text-foreground break-all">
                    {`<script src="https://mimotes.ekohomelab.online/widget.js" data-key="${data.widgetPublicKey}" data-theme="light"></script>`}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `<script src="https://mimotes.ekohomelab.online/widget.js" data-key="${data.widgetPublicKey}" data-theme="light"></script>`
                      );
                      toast.success("Kode embed disalin!");
                    }}
                    className="mt-3 w-full px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Copy className="size-4" /> Salin Kode Embed
                  </button>
                </div>

                {/* Widget URL */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Link Langsung</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://mimotes.ekohomelab.online/widget/${data.widgetPublicKey}`}
                      className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs text-foreground font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://mimotes.ekohomelab.online/widget/${data.widgetPublicKey}`);
                        toast.success("Link disalin!");
                      }}
                      className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <Copy className="size-4 text-foreground" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Ke Dashboard
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/widget")}
                    className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="size-4" /> Pengaturan Widget
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="size-4" /> Kembali
            </button>

            {currentStep === 3 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                Lanjut <ArrowRight className="size-4" />
              </button>
            ) : currentStep === 4 ? (
              <button
                onClick={() => setCurrentStep(5)}
                disabled={!canProceed()}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                Publish Chatbot <Rocket className="size-4" />
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                Lanjut <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
