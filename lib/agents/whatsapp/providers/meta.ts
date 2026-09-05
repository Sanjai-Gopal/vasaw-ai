import {
  SendWhatsAppRequest,
  WhatsAppMessagePayload,
  WhatsAppMessageResult,
  WhatsAppProvider,
} from "../types";
import {
  sanitizeWhatsAppError,
  withWhatsAppRetry,
} from "./base";

import { getOutreachMode } from "@/lib/config/modes";

export interface MetaConfig {
  accessToken?: string;
  phoneNumberId?: string;
  apiVersion?: string;
}

export class MetaWhatsAppProvider implements WhatsAppProvider {
  readonly id = "meta" as const;
  private readonly accessToken?: string;
  private readonly phoneNumberId?: string;
  private readonly apiVersion: string;
  private readonly isExplicitConfig: boolean;

  constructor(config?: MetaConfig) {
    this.isExplicitConfig = Boolean(config?.accessToken || config?.phoneNumberId);
    this.accessToken = config?.accessToken ?? process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = config?.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiVersion = config?.apiVersion ?? process.env.WHATSAPP_API_VERSION ?? "v21.0";
  }

  hasCredentials(): boolean {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  async sendMessage(
    request: SendWhatsAppRequest,
    normalizedPhone: string
  ): Promise<WhatsAppMessageResult> {
    const outreachMode = getOutreachMode();

    if (!this.isExplicitConfig && request.mode !== "meta") {
      if (outreachMode === "disabled") {
        return {
          success: true,
          messageId: `prep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          leadId: request.leadId,
          phone: normalizedPhone,
          businessName: request.businessName,
          provider: "meta",
          status: "PENDING",
          sentAt: new Date().toISOString(),
          metadata: { outreachMode: "disabled" },
        };
      }

      if (outreachMode === "mock") {
        return {
          success: true,
          messageId: `mock-wa-${Date.now()}`,
          leadId: request.leadId,
          phone: normalizedPhone,
          businessName: request.businessName,
          provider: "meta",
          status: "SENT",
          sentAt: new Date().toISOString(),
          metadata: { outreachMode: "mock" },
        };
      }
    }

    if (!this.hasCredentials()) {
      return {
        success: false,
        messageId: "",
        leadId: request.leadId,
        phone: normalizedPhone,
        businessName: request.businessName,
        provider: "meta",
        status: "FAILED",
        sentAt: new Date().toISOString(),
        error: "Meta WhatsApp Cloud API credentials missing: WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required on the server.",
      };
    }

    // Meta WhatsApp Cloud API requires recipient phone number digits WITHOUT the '+' prefix
    const recipientDigits = normalizedPhone.replace(/^\+/, "");
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const payload = this.buildMetaPayload(request.message, recipientDigits);

    try {
      const response = await withWhatsAppRetry(async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          const metaError = (errorBody as { error?: { message?: string; code?: number; type?: string } }).error;
          const status = res.status;

          const error = new Error(
            metaError?.message || `Meta WhatsApp API error: HTTP ${status} ${res.statusText}`
          );
          (error as unknown as { statusCode: number }).statusCode = status;
          throw error;
        }

        return res.json();
      });

      // Expected response: { messaging_product: "whatsapp", contacts: [{ input: "...", wa_id: "..." }], messages: [{ id: "wamid.HBg..." }] }
      const metaMessageId =
        (response as { messages?: Array<{ id: string }> })?.messages?.[0]?.id ||
        `meta-wa-${Date.now().toString(36)}`;

      return {
        success: true,
        messageId: metaMessageId,
        leadId: request.leadId,
        phone: normalizedPhone,
        businessName: request.businessName,
        provider: "meta",
        status: "SENT",
        sentAt: new Date().toISOString(),
        idempotencyKey: request.idempotencyKey,
        metadata: {
          mode: "meta",
          metaMessageId,
          phoneNumberId: this.phoneNumberId,
          apiVersion: this.apiVersion,
        },
      };
    } catch (err: unknown) {
      const sanitized = sanitizeWhatsAppError(err);
      return {
        success: false,
        messageId: "",
        leadId: request.leadId,
        phone: normalizedPhone,
        businessName: request.businessName,
        provider: "meta",
        status: "FAILED",
        sentAt: new Date().toISOString(),
        error: sanitized,
      };
    }
  }

  async getMessageStatus(messageId: string): Promise<WhatsAppMessageResult> {
    return {
      success: true,
      messageId,
      leadId: "",
      phone: "",
      provider: "meta",
      status: "SENT",
      sentAt: new Date().toISOString(),
      metadata: { note: "Status updates are pushed via webhook" },
    };
  }

  private buildMetaPayload(
    message: WhatsAppMessagePayload | string,
    recipientDigits: string
  ): Record<string, unknown> {
    if (typeof message === "string") {
      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientDigits,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      };
    }

    if (message.type === "text") {
      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientDigits,
        type: "text",
        text: {
          preview_url: Boolean(message.previewUrl),
          body: message.body,
        },
      };
    }

    if (message.type === "template") {
      const components: Array<Record<string, unknown>> = [];
      if (message.parameters && message.parameters.length > 0) {
        components.push({
          type: "body",
          parameters: message.parameters.map((param) => {
            if (param.type === "image" && param.image) {
              return { type: "image", image: { link: param.image.link } };
            }
            if (param.type === "document" && param.document) {
              return { type: "document", document: { link: param.document.link, filename: param.document.filename } };
            }
            return { type: "text", text: param.text || "" };
          }),
        });
      }

      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientDigits,
        type: "template",
        template: {
          name: message.templateName,
          language: {
            code: message.languageCode,
          },
          components: components.length > 0 ? components : undefined,
        },
      };
    }

    if (message.type === "media") {
      const mediaObject: Record<string, string> = {
        link: message.url,
      };
      if (message.caption) {
        mediaObject.caption = message.caption;
      }
      if (message.filename && message.mediaType === "document") {
        mediaObject.filename = message.filename;
      }

      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientDigits,
        type: message.mediaType,
        [message.mediaType]: mediaObject,
      };
    }

    throw new Error(`Unsupported message payload type: ${(message as { type?: unknown }).type}`);
  }
}
