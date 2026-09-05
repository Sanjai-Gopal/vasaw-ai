import {
  SendWhatsAppRequest,
  WhatsAppMessageResult,
  WhatsAppAgentResponse,
} from "./types";
import { validateWhatsAppRequest } from "./validator";
import { getWhatsAppProvider } from "./providers/base";
import {
  saveMessage,
  getMessages,
  updateLeadStatus,
  recordAgentRun,
} from "../storage";
import { getOutreachMode } from "../../config/modes";

export * from "./types";
export * from "./validator";
export * from "./providers/base";
export * from "./providers/mock";
export * from "./providers/meta";
export * from "./webhook";

/**
 * Sends a WhatsApp message to a qualified lead with validation, provider abstraction,
 * idempotency protection, and storage persistence via Storage Agent (Agent 3).
 */
export async function sendWhatsAppMessage(
  request: SendWhatsAppRequest
): Promise<WhatsAppMessageResult> {
  const startTime = Date.now();

  // 1. Validation
  const validation = validateWhatsAppRequest(request);
  if (!validation.valid || !validation.normalizedPhone || !validation.parsedMessage) {
    return {
      success: false,
      messageId: "",
      leadId: request.leadId || "",
      phone: request.phone || "",
      businessName: request.businessName,
      provider: request.mode || "mock",
      status: "FAILED",
      sentAt: new Date().toISOString(),
      error: validation.errors.join("; "),
    };
  }

  const normalizedPhone = validation.normalizedPhone;
  const messageBody =
    validation.parsedMessage.type === "text"
      ? validation.parsedMessage.body
      : validation.parsedMessage.type === "template"
      ? `[Template: ${validation.parsedMessage.templateName}]`
      : `[Media: ${validation.parsedMessage.url}]`;

  // 2. Idempotency Check: prevent duplicate sends
  try {
    if (request.idempotencyKey || request.leadId) {
      const existingMessages = await getMessages({
        leadId: request.leadId,
        direction: "outbound",
        limit: 10,
      });

      const duplicate = existingMessages.find((m) => {
        if (request.idempotencyKey && m.content.includes(request.idempotencyKey)) {
          return true;
        }
        // Match same lead and exact message content within recent 15 minutes
        const isSameContent = m.content === messageBody;
        const isRecent = (Date.now() - new Date(m.createdAt).getTime()) < 15 * 60 * 1000;
        return isSameContent && isRecent && m.status !== "failed";
      });

      if (duplicate) {
        return {
          success: true,
          messageId: duplicate.id,
          leadId: request.leadId,
          phone: normalizedPhone,
          businessName: request.businessName || duplicate.businessName,
          provider: request.mode || "mock",
          status: duplicate.status === "delivered" ? "DELIVERED" : duplicate.status === "read" ? "READ" : "SENT",
          sentAt: duplicate.sentAt || duplicate.createdAt,
          idempotencyKey: request.idempotencyKey,
          metadata: {
            idempotentReused: true,
            reusedMessageId: duplicate.id,
          },
        };
      }
    }
  } catch (err) {
    console.warn("[WhatsAppAgent] Idempotency lookup skipped:", err instanceof Error ? err.message : String(err));
  }

  // 3. Provider selection and outreach safety check
  const outreachMode = getOutreachMode();
  const providerType = request.mode || (outreachMode === "live" ? "meta" : "mock");

  if (outreachMode === "disabled" && request.mode === "meta") {
    // Safety guardrail: record message as prepared without making network call
    const prepResult: WhatsAppMessageResult = {
      success: true,
      messageId: `prep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      leadId: request.leadId,
      phone: normalizedPhone,
      businessName: request.businessName,
      provider: "meta",
      status: "PENDING",
      sentAt: new Date().toISOString(),
      metadata: {
        outreachMode: "disabled",
        safetyNotice: "OUTREACH_MODE is disabled. Message prepared without dispatching to Meta API.",
      },
    };

    try {
      await saveMessage({
        leadId: request.leadId,
        businessName: request.businessName || "WhatsApp Lead",
        direction: "outbound",
        channel: "whatsapp",
        content: messageBody,
        status: "prepared",
        sentAt: prepResult.sentAt,
      });
    } catch {
      // Non-blocking
    }

    return prepResult;
  }

  const provider = getWhatsAppProvider(providerType);
  const result = await provider.sendMessage(request, normalizedPhone);

  const durationSec = Math.max(0.1, (Date.now() - startTime) / 1000);

  // 4. Storage persistence via Agent 3
  try {
    if (result.success) {
      const saved = await saveMessage({
        leadId: request.leadId,
        businessName: request.businessName || "WhatsApp Lead",
        direction: "outbound",
        channel: "whatsapp",
        content: messageBody,
        status: "sent",
        sentAt: result.sentAt,
      });

      // Update lead outreach status to contacted
      if (request.leadId) {
        await updateLeadStatus({ leadId: request.leadId, status: "contacted" }).catch(() => {});
      }

      // Record agent run
      await recordAgentRun({
        agentId: "whatsapp",
        status: "success",
        success: true,
        durationMs: Math.round(durationSec * 1000),
        metadata: {
          leadId: request.leadId,
          phone: normalizedPhone,
          provider: result.provider,
          messageId: result.messageId,
          savedMessageId: saved.id,
        },
      }).catch(() => {});
    } else {
      // Record failed message in storage
      if (request.leadId) {
        await saveMessage({
          leadId: request.leadId,
          businessName: request.businessName || "WhatsApp Lead",
          direction: "outbound",
          channel: "whatsapp",
          content: messageBody,
          status: "failed",
          sentAt: result.sentAt,
        }).catch(() => {});

        await recordAgentRun({
          agentId: "whatsapp",
          status: "failed",
          success: false,
          durationMs: Math.round(durationSec * 1000),
          error: result.error || "Failed to send WhatsApp message",
          metadata: {
            leadId: request.leadId,
            phone: normalizedPhone,
            provider: result.provider,
          },
        }).catch(() => {});
      }
    }
  } catch (storageErr) {
    console.warn("[WhatsAppAgent] Storage integration warning:", storageErr instanceof Error ? storageErr.message : String(storageErr));
  }

  return result;
}

/**
 * Top-level Agent 6 invocation conforming to standardized agent execution pattern.
 */
export async function runWhatsAppAgent(
  request: SendWhatsAppRequest
): Promise<WhatsAppAgentResponse> {
  const result = await sendWhatsAppMessage(request);
  return {
    success: result.success,
    agent: "whatsapp",
    provider: result.provider,
    messageId: result.messageId,
    status: result.status,
    result,
    error: result.error || undefined,
  };
}
