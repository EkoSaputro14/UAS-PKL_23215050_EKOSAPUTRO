"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Phone, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppConfig {
  id: string;
  phoneNumberId: string;
  phoneNumber: string | null;
  displayName: string | null;
  isEnabled: boolean;
  welcomeMessage: string | null;
  offlineMessage: string | null;
  autoReply: boolean;
  businessAccountId: string | null;
}

export function WhatsAppSettings() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown");

  // Form state
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [offlineMessage, setOfflineMessage] = useState("");
  const [autoReply, setAutoReply] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch("/api/whatsapp/config");
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          setPhoneNumberId(data.config.phoneNumberId || "");
          setBusinessAccountId(data.config.businessAccountId || "");
          setPhoneNumber(data.config.phoneNumber || "");
          setDisplayName(data.config.displayName || "");
          setWelcomeMessage(data.config.welcomeMessage || "");
          setOfflineMessage(data.config.offlineMessage || "");
          setAutoReply(data.config.autoReply);
          setConnectionStatus("connected");
        }
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!phoneNumberId || !accessToken || !verifyToken) {
      toast.error("Phone Number ID, Access Token, dan Verify Token wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId,
          accessToken,
          verifyToken,
          appSecret: appSecret || undefined,
          businessAccountId: businessAccountId || undefined,
          phoneNumber: phoneNumber || undefined,
          displayName: displayName || undefined,
          welcomeMessage: welcomeMessage || undefined,
          offlineMessage: offlineMessage || undefined,
          autoReply,
        }),
      });

      if (res.ok) {
        toast.success("Konfigurasi WhatsApp berhasil disimpan");
        loadConfig();
      } else {
        const err = await res.json();
        toast.error(err.error?.message || "Gagal menyimpan konfigurasi");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/whatsapp/config/test", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus("connected");
        setPhoneNumber(data.phone.displayPhoneNumber);
        setDisplayName(data.phone.verifiedName);
        toast.success(`Terhubung! ${data.phone.verifiedName} (${data.phone.displayPhoneNumber})`);
      } else {
        setConnectionStatus("error");
        const err = await res.json();
        toast.error(err.error?.message || "Koneksi gagal");
      }
    } catch (error) {
      setConnectionStatus("error");
      toast.error("Gagal menguji koneksi");
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Hapus konfigurasi WhatsApp? Semua percakapan akan tetap tersimpan.")) return;

    try {
      const res = await fetch("/api/whatsapp/config", { method: "DELETE" });
      if (res.ok) {
        setConfig(null);
        setPhoneNumberId("");
        setAccessToken("");
        setVerifyToken("");
        setConnectionStatus("unknown");
        toast.success("Konfigurasi WhatsApp berhasil dihapus");
      } else {
        toast.error("Gagal menghapus konfigurasi");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="size-5" />
                WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Hubungkan WhatsApp Business API untuk menerima dan mengirim pesan otomatis.
              </CardDescription>
            </div>
            <Badge variant={connectionStatus === "connected" ? "default" : connectionStatus === "error" ? "destructive" : "secondary"}>
              {connectionStatus === "connected" ? (
                <><CheckCircle className="size-3 mr-1" /> Terhubung</>
              ) : connectionStatus === "error" ? (
                <><XCircle className="size-3 mr-1" /> Error</>
              ) : (
                "Belum Dikonfigurasi"
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi API</CardTitle>
          <CardDescription>Masukkan kredensial dari Meta Business Manager.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number ID *</label>
              <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="123456789012345" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Account ID</label>
              <Input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} placeholder="123456789012345" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Access Token *</label>
            <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="EAAxxxxxxx..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verify Token *</label>
              <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder="your_custom_verify_token" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">App Secret</label>
              <Input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder="opsional, untuk verifikasi webhook" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              Simpan Konfigurasi
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing || !config}>
              {testing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Phone className="size-4 mr-2" />}
              Test Koneksi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phone Info (if connected) */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Nomor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">Nomor Telepon</span>
                <p className="font-medium">{phoneNumber || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Nama Tampilan</span>
                <p className="font-medium">{displayName || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Reply Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Balasan</CardTitle>
          <CardDescription>Konfigurasi pesan otomatis dan balasan offline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Balasan Otomatis (AI)</span>
              <p className="text-xs text-muted-foreground">AI akan membalas pesan secara otomatis menggunakan knowledge base.</p>
            </div>
            <Switch checked={autoReply} onCheckedChange={setAutoReply} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pesan Selamat Datang</label>
            <Textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Halo! Ada yang bisa saya bantu?" rows={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pesan Offline</label>
            <Textarea value={offlineMessage} onChange={(e) => setOfflineMessage(e.target.value)} placeholder="Maaf, kami sedang tidak tersedia. Silakan tinggalkan pesan." rows={3} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              Simpan Pengaturan
            </Button>
            {config && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4 mr-2" />
                Hapus Konfigurasi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>Masukkan URL ini di Meta Business Manager.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
            {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/whatsapp/webhook
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Verify Token: <code>{verifyToken || "(belum diatur)"}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
