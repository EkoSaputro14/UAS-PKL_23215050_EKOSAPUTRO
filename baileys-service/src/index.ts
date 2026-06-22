import express from "express";
import cors from "cors";
import * as QRCode from "qrcode";
import { BaileysManager } from "./baileys-manager.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.BAILEYS_PORT || "3002", 10);
const API_KEY = process.env.BAILEYS_API_KEY || "baileys-secret-key";
const manager = BaileysManager.getInstance();

// ============================================================
// Simple logger
// ============================================================
const log = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.log(`[Baileys Service] ${msg}`, data || ""),
  error: (msg: string, data?: Record<string, unknown>) =>
    console.error(`[Baileys Service] ${msg}`, data || ""),
  warn: (msg: string, data?: Record<string, unknown>) =>
    console.warn(`[Baileys Service] ${msg}`, data || ""),
};

// ============================================================
// API Key Authentication Middleware
// ============================================================
function requireApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const key = req.headers["x-api-key"] as string | undefined;
  if (key === API_KEY) {
    next();
  } else {
    res
      .status(401)
      .json({ error: "Unauthorized: invalid or missing x-api-key" });
  }
}

// ============================================================
// Routes
// ============================================================

// Health check — no auth required
app.get("/health", (_req, res) => {
  const status = manager.getStatus();
  res.json({
    status: "ok",
    connected: status.state === "connected",
    service: "mimotes-baileys",
  });
});

// Status — requires API key
app.get("/status", requireApiKey, (_req, res) => {
  const status = manager.getStatus();
  res.json({
    connected: status.state === "connected",
    state: status.state,
    phoneNumber: status.phoneNumber,
    pushName: status.pushName,
    webhookUrl: manager.getWebhook() || null,
  });
});

// QR Code — requires API key
app.get("/qr", requireApiKey, (_req, res) => {
  const status = manager.getStatus();

  if (status.state === "connected") {
    res.json({ qr: null, connected: true, phoneNumber: status.phoneNumber });
    return;
  }

  const qr = manager.getQR();
  if (qr) {
    // Baileys provides raw QR string; convert to PNG data URL
    QRCode.toDataURL(qr, { width: 256, margin: 2 })
      .then((dataUrl) => {
        res.json({ qr: dataUrl, connected: false });
      })
      .catch((err) => {
        log.error("QR generation error", { error: err.message });
        res.json({ qr: null, connected: false, error: "Failed to generate QR code" });
      });
  } else {
    res.json({
      qr: null,
      connected: false,
      message:
        "No QR code available. Service may be connecting or waiting for QR...",
    });
  }
});

// Send message — requires API key
app.post("/send", requireApiKey, async (req, res) => {
  try {
    const { phone, text } = req.body;

    if (!phone || !text) {
      res
        .status(400)
        .json({ error: "Missing required fields: phone, text" });
      return;
    }

    const messageId = await manager.sendMessage(phone, text);
    res.json({ success: true, messageId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send message";
    log.error("Send message error", { error: message });
    res.status(500).json({ error: message });
  }
});

// Logout — requires API key
app.post("/logout", requireApiKey, async (_req, res) => {
  try {
    await manager.logout(true);
    res.json({ success: true, message: "Logged out and session cleared" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to logout";
    res.status(500).json({ error: message });
  }
});

// Set webhook URL — requires API key
app.post("/webhook", requireApiKey, (req, res) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: "Missing required field: url" });
    return;
  }

  manager.setWebhook(url);
  res.json({ success: true, webhookUrl: url });
});

// ============================================================
// Startup
// ============================================================

async function startServer() {
  app.listen(PORT, () => {
    log.info(`Running on port ${PORT}`);
    log.info("API key auth: x-api-key header required on all routes except /health");
    log.info("Auto-connecting to WhatsApp...");
  });

  // Attempt initial connection
  try {
    await manager.connect();
  } catch (err) {
    log.error("Initial connection failed, will retry...", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Set webhook URL from environment
  const webhookUrl = process.env.BAILEYS_WEBHOOK_URL || "";
  if (webhookUrl) {
    manager.setWebhook(webhookUrl);
    log.info(`Webhook URL set: ${webhookUrl}`);
  }
}

startServer();
