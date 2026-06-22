"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Phone,
  QrCode,
  Copy,
  Send,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConnectionState =
  | "disconnected"
  | "connecting"
  | "qr_required"
  | "connected"
  | "error";

interface StatusResponse {
  connected: boolean;
  state: string;
  phoneNumber: string | null;
  pushName: string | null;
  webhookUrl: string | null;
  error?: string;
}

interface QRResponse {
  qr: string | null;
  connected: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusToState(status: StatusResponse): ConnectionState {
  if (status.connected) return "connected";
  if (status.state === "qr_required" || status.state === "qr") return "qr_required";
  if (status.state === "connecting") return "connecting";
  return "disconnected";
}

function stateConfig(state: ConnectionState) {
  switch (state) {
    case "connected":
      return {
        label: "Terhubung",
        icon: <CheckCircle className="h-4 w-4" />,
        variant: "default" as const,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      };
    case "qr_required":
      return {
        label: "Menunggu QR",
        icon: <QrCode className="h-4 w-4" />,
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      };
    case "connecting":
      return {
        label: "Menghubungkan...",
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        variant: "secondary" as const,
        className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      };
    case "error":
      return {
        label: "Error",
        icon: <XCircle className="h-4 w-4" />,
        variant: "destructive" as const,
        className: "",
      };
    default:
      return {
        label: "Terputus",
        icon: <WifiOff className="h-4 w-4" />,
        variant: "outline" as const,
        className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BaileysSettings() {
  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [pushName, setPushName] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // QR
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(20);
  const [qrLoading, setQrLoading] = useState(false);

  // Actions
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Test message
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Refs for intervals
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -----------------------------------------------------------------------
  // Fetch status
  // -----------------------------------------------------------------------
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/baileys/status");
      const data: StatusResponse = await res.json();
      const newState = statusToState(data);

      setConnectionState(newState);
      setPhoneNumber(data.phoneNumber);
      setPushName(data.pushName);
      setWebhookUrl(data.webhookUrl);
      setServiceError(data.error || null);
    } catch {
      setConnectionState("error");
      setServiceError("Gagal menghubungi server");
    }
  }, []);

  // -----------------------------------------------------------------------
  // Fetch QR
  // -----------------------------------------------------------------------
  const fetchQR = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/qr");
      const data: QRResponse = await res.json();
      if (data.qr) {
        setQrData(data.qr);
        setQrCountdown(20);
        startQRCountdown();
      } else if (data.connected) {
        // If connected while fetching QR, update status
        fetchStatus();
      }
    } catch {
      // QR fetch failed silently
    } finally {
      setQrLoading(false);
    }
  }, [fetchStatus]);

  // -----------------------------------------------------------------------
  // QR Countdown
  // -----------------------------------------------------------------------
  const startQRCountdown = useCallback(() => {
    if (qrCountdownRef.current) clearInterval(qrCountdownRef.current);
    setQrCountdown(20);
    qrCountdownRef.current = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          if (qrCountdownRef.current) clearInterval(qrCountdownRef.current);
          // Auto-refresh QR when countdown reaches 0
          fetchQR();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
  }, [fetchQR]);

  // -----------------------------------------------------------------------
  // Poll status every 5 seconds
  // -----------------------------------------------------------------------
  useEffect(() => {
    fetchStatus();
    statusIntervalRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [fetchStatus]);

  // -----------------------------------------------------------------------
  // When state becomes qr_required, fetch QR immediately
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (connectionState === "qr_required") {
      fetchQR();
      qrIntervalRef.current = setInterval(fetchQR, 15000);
    } else {
      // Cleanup QR intervals when no longer in qr_required
      if (qrIntervalRef.current) {
        clearInterval(qrIntervalRef.current);
        qrIntervalRef.current = null;
      }
      if (qrCountdownRef.current) {
        clearInterval(qrCountdownRef.current);
        qrCountdownRef.current = null;
      }
      setQrData(null);
      setQrCountdown(20);
    }

    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      if (qrCountdownRef.current) clearInterval(qrCountdownRef.current);
    };
  }, [connectionState, fetchQR]);

  // -----------------------------------------------------------------------
  // Cleanup all on unmount
  // -----------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      if (qrCountdownRef.current) clearInterval(qrCountdownRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Connect / Disconnect
  // -----------------------------------------------------------------------
  async function handleConnect() {
    setConnecting(true);
    try {
      await fetchStatus();
      // The status endpoint triggers connection if not connected
      toast.success("Memulai koneksi WhatsApp...");
    } catch {
      toast.error("Gagal memulai koneksi");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Putuskan koneksi WhatsApp? Anda perlu memindai QR lagi untuk menghubungkan kembali.")) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Koneksi WhatsApp diputuskan");
        setConnectionState("disconnected");
        setPhoneNumber(null);
        setPushName(null);
        setQrData(null);
      } else {
        toast.error("Gagal memutuskan koneksi");
      }
    } catch {
      toast.error("Gagal memutuskan koneksi");
    } finally {
      setDisconnecting(false);
    }
  }

  // -----------------------------------------------------------------------
  // Send test message
  // -----------------------------------------------------------------------
  async function handleSendTest() {
    if (!testPhone.trim()) {
      toast.error("Masukkan nomor telepon");
      return;
    }
    if (!testMessage.trim()) {
      toast.error("Masukkan pesan");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone.trim(), text: testMessage.trim() }),
      });

      if (res.ok) {
        toast.success("Pesan test berhasil dikirim!");
        setTestPhone("");
        setTestMessage("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengirim pesan test");
      }
    } catch {
      toast.error("Gagal mengirim pesan test");
    } finally {
      setSending(false);
    }
  }

  // -----------------------------------------------------------------------
  // Copy to clipboard
  // -----------------------------------------------------------------------
  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} berhasil disalin`);
    } catch {
      toast.error("Gagal menyalin ke clipboard");
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const status = stateConfig(connectionState);

  return (
    <div className="space-y-6">
      {/* ---- Connection Status Card ---- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Baileys WhatsApp Connection
              </CardTitle>
              <CardDescription>
                Koneksi WhatsApp menggunakan Baileys (unofficial API).
              </CardDescription>
            </div>
            <Badge variant={status.variant} className={status.className}>
              {status.icon}
              <span className="ml-1.5">{status.label}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Connected info */}
          {connectionState === "connected" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {phoneNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{phoneNumber}</span>
                </div>
              )}
              {pushName && (
                <div className="text-sm text-muted-foreground">
                  {pushName}
                </div>
              )}
            </div>
          )}

          {/* Service error */}
          {serviceError && connectionState === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive mt-2">
              <XCircle className="h-4 w-4" />
              <span>{serviceError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            {(connectionState === "disconnected" || connectionState === "error") && (
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4 mr-2" />
                )}
                Hubungkan WhatsApp
              </Button>
            )}
            {connectionState === "connected" && (
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <WifiOff className="h-4 w-4 mr-2" />
                )}
                Putuskan Koneksi
              </Button>
            )}
            {(connectionState === "connecting" || connectionState === "qr_required") && (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghubungkan...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- QR Code Display ---- */}
      {connectionState === "qr_required" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </CardTitle>
            <CardDescription>
              Buka WhatsApp di ponsel kamu, masuk ke <strong>Linked Devices</strong>, lalu pindai QR code ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {qrLoading && !qrData ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Memuat QR code...</span>
              </div>
            ) : qrData ? (
              <>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <img
                    src={qrData}
                    alt="WhatsApp QR Code"
                    className="h-56 w-56 sm:h-64 sm:w-64"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>QR expires dalam {qrCountdown}s</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                <QrCode className="h-8 w-8" />
                <span className="text-sm">QR code tidak tersedia</span>
                <Button variant="outline" size="sm" onClick={fetchQR}>
                  Muat Ulang QR
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---- Connected Success ---- */}
      {connectionState === "connected" && (
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  WhatsApp Terhubung
                </p>
                <p className="text-sm text-muted-foreground">
                  {phoneNumber && `${phoneNumber}`}
                  {pushName && ` — ${pushName}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Test Message Section ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Kirim Pesan Test
          </CardTitle>
          <CardDescription>
            Kirim pesan test untuk memastikan koneksi WhatsApp berfungsi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nomor Telepon</label>
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="6281234567890"
              disabled={connectionState !== "connected"}
            />
            <p className="text-xs text-muted-foreground">
              Format internasional tanpa tanda + (contoh: 6281234567890)
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pesan</label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Halo, ini pesan test dari Mimotes!"
              rows={3}
              disabled={connectionState !== "connected"}
            />
          </div>
          <Button
            onClick={handleSendTest}
            disabled={sending || connectionState !== "connected"}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Kirim Test
          </Button>
        </CardContent>
      </Card>

      {/* ---- Webhook Info ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            URL ini digunakan oleh Baileys service untuk mengirim pesan masuk ke Mimotes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted p-3 rounded-lg font-mono text-sm break-all">
              {webhookUrl || (
                <span className="text-muted-foreground italic">Belum tersedia</span>
              )}
            </div>
            {webhookUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                title="Salin URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ---- Info Card ---- */}
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            Informasi Penting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Risiko Banned:</strong>{" "}
            Menggunakan Baileys (unofficial WhatsApp API) berisiko memicu
            pemblokiran nomor oleh WhatsApp. Gunakan <strong>nomor cadangan</strong> dan
            hindari penggunaan intensif untuk mengurangi risiko.
          </p>
          <p>
            <strong className="text-foreground">Cara Kerja:</strong>{" "}
            Baileys menghubungkan ke WhatsApp seperti WhatsApp Web, menggunakan
            session ID yang tersimpan di server. Setelah terhubung, pesan masuk
            dikirim ke webhook Mimotes untuk diproses oleh AI chatbot.
          </p>
          <p>
            <strong className="text-foreground">Session Persistence:</strong>{" "}
            Data session tersimpan di server dan akan tetap aktif sampai diputus
            secara manual atau oleh WhatsApp.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
