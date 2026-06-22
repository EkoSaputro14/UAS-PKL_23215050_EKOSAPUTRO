import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidUser,
  jidNormalizedUser,
  type WASocket,
  type BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import { forwardToWebhook, type WebhookMessage } from "./webhook.js";
import { unlink, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const logger = pino({ name: "baileys-manager" });

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "qr_required"
  | "connected";

interface ManagerStatus {
  state: ConnectionState;
  phoneNumber: string | null;
  pushName: string | null;
}

export class BaileysManager {
  private static instance: BaileysManager;

  private sock: WASocket | null = null;
  private state: ConnectionState = "disconnected";
  private phoneNumber: string | null = null;
  private pushName: string | null = null;
  private qrCode: string | null = null;
  private webhookUrl: string = "";
  private authDir: string;
  private isConnecting: boolean = false;

  private constructor() {
    this.authDir = process.env.BAILEYS_AUTH_DIR || "/app/data/auth_info";
  }

  static getInstance(): BaileysManager {
    if (!BaileysManager.instance) {
      BaileysManager.instance = new BaileysManager();
    }
    return BaileysManager.instance;
  }

  /**
   * Set the webhook URL for incoming messages.
   */
  setWebhook(url: string): void {
    this.webhookUrl = url;
    logger.info({ url }, "Webhook URL updated");
  }

  getWebhook(): string {
    return this.webhookUrl;
  }

  getQR(): string | null {
    return this.qrCode;
  }

  getStatus(): ManagerStatus {
    return {
      state: this.state,
      phoneNumber: this.phoneNumber,
      pushName: this.pushName,
    };
  }

  getSocket(): WASocket | null {
    return this.sock;
  }

  /**
   * Initiate connection to WhatsApp.
   */
  async connect(): Promise<void> {
    if (this.isConnecting) {
      logger.warn("Already connecting, skipping");
      return;
    }

    this.isConnecting = true;
    this.state = "connecting";

    try {
      const { version } = await fetchLatestBaileysVersion();
      logger.info({ version }, "Using Baileys version");

      const { state: authState, saveCreds } =
        await useMultiFileAuthState(this.authDir);

      this.sock = makeWASocket({
        version,
        auth: {
          creds: authState.creds,
          keys: authState.keys,
        },
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        // Reconnection settings
        retryRequestDelayMs: 1000,
        connectTimeoutMs: 60000,
        browser: ["Mimotes Bot", "Chrome", "4.0.0"],
        // Mark online on connect
        markOnlineOnConnect: true,
      });

      this.setupEventHandlers(this.sock, saveCreds);
    } catch (err) {
      logger.error({ err }, "Failed to connect");
      this.state = "disconnected";
      this.isConnecting = false;
    }
  }

  private setupEventHandlers(
    sock: WASocket,
    saveCreds: () => Promise<void>
  ): void {
    // Handle credential updates
    sock.ev.on("creds.update", saveCreds);

    // Handle connection state changes
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.state = "qr_required";
        this.qrCode = qr;
        logger.info("QR code received — scan with WhatsApp");
      }

      if (connection === "close") {
        const statusCode =
          (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        logger.info(
          { statusCode, shouldReconnect },
          "Connection closed"
        );

        this.sock = null;
        this.qrCode = null;
        this.isConnecting = false;

        if (shouldReconnect) {
          // Reconnect after a delay
          this.state = "connecting";
          setTimeout(() => this.connect(), 5000);
        } else {
          this.state = "disconnected";
          this.phoneNumber = null;
          this.pushName = null;
          logger.info("Logged out permanently");
        }
      }

      if (connection === "open") {
        this.state = "connected";
        this.qrCode = null;
        this.isConnecting = false;

        // Extract phone number and push name
        const me = sock.user;
        if (me) {
          this.phoneNumber = me.id.split(":")[0];
          this.pushName = me.name || null;
        }

        logger.info(
          { phoneNumber: this.phoneNumber, pushName: this.pushName },
          "Connected to WhatsApp"
        );
      }
    });

    // Handle incoming messages
    sock.ev.on("messages.upsert", async (messageUpdate) => {
      const { messages, type } = messageUpdate;

      if (type !== "notify") return;

      for (const msg of messages) {
        // Skip own messages
        if (msg.key.fromMe) continue;

        // Skip non-user messages (groups, status, etc.)
        if (!isJidUser(msg.key.remoteJid || "")) continue;

        const phone = jidNormalizedUser(msg.key.remoteJid || "").replace(
          "@s.whatsapp.net",
          ""
        );
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          "";
        const from =
          msg.pushName || msg.key.remoteJid?.split("@")[0] || "Unknown";
        const timestamp = msg.messageTimestamp
          ? typeof msg.messageTimestamp === "number"
            ? msg.messageTimestamp
            : Number(msg.messageTimestamp)
          : Math.floor(Date.now() / 1000);

        if (!text.trim()) continue; // Skip empty/non-text messages

        logger.info(
          { phone, from, textLength: text.length },
          "Incoming message"
        );

        // Forward to webhook
        if (this.webhookUrl) {
          const webhookMsg: WebhookMessage = {
            phone,
            text: text.trim(),
            timestamp,
            from,
          };

          // Fire and forget — don't block message processing
          forwardToWebhook(this.webhookUrl, webhookMsg).catch((err) => {
            logger.error({ err, phone }, "Webhook forwarding error");
          });
        }
      }
    });

    logger.info("Event handlers registered");
  }

  /**
   * Send a text message to a phone number.
   */
  async sendMessage(phone: string, text: string): Promise<string | null> {
    if (!this.sock || this.state !== "connected") {
      throw new Error("Not connected to WhatsApp");
    }

    // Normalize phone number
    const jid = `${phone.replace(/[^0-9]/g, "")}@s.whatsapp.net`;

    const result = await this.sock.sendMessage(jid, { text });
    const messageId = result?.key?.id || null;

    logger.info(
      { phone, messageId, textLength: text.length },
      "Message sent"
    );

    return messageId;
  }

  /**
   * Disconnect and optionally clear session data.
   */
  async logout(clearSession: boolean = true): Promise<void> {
    try {
      if (this.sock) {
        this.sock.end(undefined);
        this.sock = null;
      }

      this.state = "disconnected";
      this.phoneNumber = null;
      this.pushName = null;
      this.qrCode = null;
      this.isConnecting = false;

      if (clearSession && existsSync(this.authDir)) {
        await rm(this.authDir, { recursive: true, force: true });
        logger.info("Session data cleared");
      }

      logger.info("Logged out successfully");
    } catch (err) {
      logger.error({ err }, "Error during logout");
      throw err;
    }
  }
}
