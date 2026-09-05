import {
  SendWhatsAppRequest,
  WhatsAppMessageResult,
  WhatsAppProvider,
} from "../types";

/**
 * 100% Offline Mock WhatsApp Provider.
 * Requires NO external Meta credentials, Supabase, Vercel, or AI services.
 * Deterministic and fast for automated unit & integration testing.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly id = "mock" as const;

  async sendMessage(
    request: SendWhatsAppRequest,
    normalizedPhone: string
  ): Promise<WhatsAppMessageResult> {
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const messageId = `mock-wa-${timestamp}-${randomSuffix}`;

    const preview =
      typeof request.message === "string"
        ? request.message.slice(0, 100)
        : request.message.type === "text"
        ? request.message.body.slice(0, 100)
        : `[${request.message.type}]`;

    return {
      success: true,
      messageId,
      leadId: request.leadId,
      phone: normalizedPhone,
      businessName: request.businessName,
      provider: "mock",
      status: "SENT",
      sentAt: new Date().toISOString(),
      idempotencyKey: request.idempotencyKey,
      metadata: {
        mock: true,
        mode: "mock",
        channel: "whatsapp",
        preview,
        simulatedDeliverySec: 0.1,
      },
    };
  }

  async getMessageStatus(messageId: string): Promise<WhatsAppMessageResult> {
    return {
      success: true,
      messageId,
      leadId: "mock-lead",
      phone: "+919876543210",
      provider: "mock",
      status: "DELIVERED",
      sentAt: new Date(Date.now() - 5000).toISOString(),
      deliveredAt: new Date().toISOString(),
      metadata: { mock: true },
    };
  }
}
