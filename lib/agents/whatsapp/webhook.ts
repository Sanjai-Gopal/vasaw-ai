import * as crypto from "crypto";
import {
  WebhookProcessResult,
  WebhookStatusEvent,
  WebhookInboundMessageEvent,
  WhatsAppMessageStatus,
} from "./types";
import { saveMessage, getMessages, updateMessageStatus } from "../storage";

/**
 * Handles GET verification request from Meta WhatsApp webhook.
 */
export function verifyWebhookChallenge(searchParams: URLSearchParams): {
  status: number;
  body: string | { error: string };
} {
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    "vasaw_verify_token";

  if (mode === "subscribe" && token && token === expectedToken && challenge) {
    return { status: 200, body: challenge };
  }

  return { status: 403, body: { error: "Forbidden: verification token mismatch or invalid mode" } };
}

/**
 * Verifies the X-Hub-Signature-256 header sent by Meta using the configured WHATSAPP_APP_SECRET.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader?: string | null,
  appSecret?: string
): boolean {
  const secret = appSecret ?? process.env.WHATSAPP_APP_SECRET;
  // If app secret is not configured, pass through (optional security in dev/test)
  if (!secret) return true;

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = signatureHeader.slice(7);
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody, "utf8").digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Parses raw Meta WhatsApp webhook JSON payload into normalized status and message events.
 */
export function parseWhatsAppWebhookPayload(payload: unknown): WebhookProcessResult[] {
  const results: WebhookProcessResult[] = [];
  if (!payload || typeof payload !== "object") {
    return [{ processed: false, eventType: "unknown", error: "Empty or malformed payload" }];
  }

  const root = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messaging_product?: string;
          statuses?: Array<{
            id: string;
            status: "sent" | "delivered" | "read" | "failed";
            timestamp: string | number;
            recipient_id: string;
            conversation?: { id: string };
            errors?: Array<{ code: number; title: string; message?: string }>;
          }>;
          messages?: Array<{
            id: string;
            from: string;
            timestamp: string | number;
            type: "text" | "interactive" | "button" | "image" | "audio" | "document";
            text?: { body: string };
            button?: { text: string; payload?: string };
            interactive?: { button_reply?: { id: string; title: string } };
          }>;
        };
      }>;
    }>;
  };

  if (!root.entry || !Array.isArray(root.entry)) {
    return [{ processed: false, eventType: "unknown", error: "Missing 'entry' array in webhook body" }];
  }

  for (const entry of root.entry) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value) continue;

      // 1. Process Status Updates
      if (value.statuses && Array.isArray(value.statuses)) {
        for (const statusObj of value.statuses) {
          const canonicalStatus: WhatsAppMessageStatus =
            statusObj.status === "delivered"
              ? "DELIVERED"
              : statusObj.status === "read"
              ? "READ"
              : statusObj.status === "failed"
              ? "FAILED"
              : "SENT";

          const statusEvent: WebhookStatusEvent = {
            messageId: statusObj.id,
            recipientId: statusObj.recipient_id,
            status: statusObj.status,
            timestamp: Number(statusObj.timestamp),
            conversationId: statusObj.conversation?.id,
            errors: statusObj.errors,
          };

          results.push({
            processed: true,
            eventType: "status",
            statusEvent,
            canonicalStatus,
          });
        }
      }

      // 2. Process Inbound Messages
      if (value.messages && Array.isArray(value.messages)) {
        for (const msgObj of value.messages) {
          const textBody =
            msgObj.text?.body ||
            msgObj.button?.text ||
            msgObj.interactive?.button_reply?.title ||
            undefined;

          const messageEvent: WebhookInboundMessageEvent = {
            messageId: msgObj.id,
            from: msgObj.from,
            timestamp: Number(msgObj.timestamp),
            type: msgObj.type || "unknown",
            text: textBody,
            buttonPayload: msgObj.button?.payload || msgObj.interactive?.button_reply?.id,
          };

          results.push({
            processed: true,
            eventType: "message",
            messageEvent,
          });
        }
      }
    }
  }

  if (results.length === 0) {
    results.push({ processed: false, eventType: "unknown", error: "No actionable status or message events found in payload" });
  }

  return results;
}

/**
 * Persists webhook events to database using Storage Agent (Agent 3).
 */
export async function handleWebhookEventStorage(event: WebhookProcessResult): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (event.eventType === "status" && event.statusEvent && event.canonicalStatus) {
      const dbStatus =
        event.canonicalStatus === "DELIVERED"
          ? "delivered"
          : event.canonicalStatus === "READ"
          ? "read"
          : event.canonicalStatus === "FAILED"
          ? "failed"
          : "sent";

      // Look up existing message
      const messages = await getMessages({ limit: 100 });
      const targetMessage = messages.find(
        (m) => m.id === event.statusEvent?.messageId || m.content.includes(event.statusEvent?.messageId || "")
      );

      if (targetMessage) {
        await updateMessageStatus({
          messageId: targetMessage.id,
          status: dbStatus,
        });
        return { success: true, messageId: targetMessage.id };
      }

      return { success: true, messageId: event.statusEvent.messageId };
    }

    if (event.eventType === "message" && event.messageEvent) {
      // Inbound reply
      const saved = await saveMessage({
        leadId: "inbound-lead",
        businessName: `WhatsApp User (+${event.messageEvent.from})`,
        direction: "inbound",
        channel: "whatsapp",
        content: event.messageEvent.text || `[Inbound ${event.messageEvent.type}]`,
        status: "delivered",
      });

      return { success: true, messageId: saved.id };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
