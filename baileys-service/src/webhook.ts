import pino from "pino";

const logger = pino({ name: "webhook" });

export interface WebhookMessage {
  phone: string;
  text: string;
  timestamp: number;
  from: string;
  workspaceId?: string;
}

/**
 * Forward an incoming WhatsApp message to the configured webhook URL.
 * Retries once on failure.
 */
export async function forwardToWebhook(
  webhookUrl: string,
  message: WebhookMessage
): Promise<boolean> {
  const maxRetries = 2; // first attempt + 1 retry
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "unknown");
        throw new Error(
          `Webhook responded with ${response.status}: ${body}`
        );
      }

      logger.info(
        {
          phone: message.phone,
          webhookUrl,
          attempt,
        },
        "Webhook forwarded successfully"
      );
      return true;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(
        {
          phone: message.phone,
          webhookUrl,
          attempt,
          error: lastError.message,
        },
        `Webhook attempt ${attempt}/${maxRetries} failed`
      );
    }
  }

  logger.error(
    {
      phone: message.phone,
      webhookUrl,
      error: lastError?.message,
    },
    "Webhook forwarding failed after all retries"
  );
  return false;
}
