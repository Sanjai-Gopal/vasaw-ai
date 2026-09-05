export type WhatsAppMessageStatus = "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export type WhatsAppProviderType = "mock" | "meta";

export interface TextMessagePayload {
  type: "text";
  body: string;
  previewUrl?: boolean;
}

export interface TemplateParameter {
  type: "text" | "image" | "document" | "video";
  text?: string;
  image?: { link: string };
  document?: { link: string; filename?: string };
}

export interface TemplateMessagePayload {
  type: "template";
  templateName: string;
  languageCode: string;
  parameters?: TemplateParameter[];
}

export interface MediaMessagePayload {
  type: "media";
  mediaType: "image" | "document" | "video" | "audio";
  url: string;
  caption?: string;
  filename?: string;
}

export type WhatsAppMessagePayload = TextMessagePayload | TemplateMessagePayload | MediaMessagePayload;

export interface SendWhatsAppRequest {
  leadId: string;
  phone: string;
  businessName?: string;
  message: WhatsAppMessagePayload | string;
  mode?: WhatsAppProviderType;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId: string;
  leadId: string;
  phone: string;
  businessName?: string;
  provider: WhatsAppProviderType;
  status: WhatsAppMessageStatus;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  error?: string | null;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppAgentResponse {
  success: boolean;
  agent: "whatsapp";
  provider: WhatsAppProviderType;
  messageId?: string;
  status?: WhatsAppMessageStatus;
  result?: WhatsAppMessageResult;
  error?: string;
}

export interface WhatsAppProvider {
  readonly id: WhatsAppProviderType;
  sendMessage(request: SendWhatsAppRequest, normalizedPhone: string): Promise<WhatsAppMessageResult>;
  getMessageStatus(messageId: string): Promise<WhatsAppMessageResult>;
}

export interface WebhookStatusEvent {
  messageId: string;
  recipientId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: number;
  conversationId?: string;
  errors?: Array<{ code: number; title: string; message?: string }>;
}

export interface WebhookInboundMessageEvent {
  messageId: string;
  from: string;
  timestamp: number;
  type: "text" | "interactive" | "button" | "image" | "audio" | "document" | "unknown";
  text?: string;
  buttonPayload?: string;
}

export interface WebhookProcessResult {
  processed: boolean;
  eventType: "status" | "message" | "unknown";
  statusEvent?: WebhookStatusEvent;
  messageEvent?: WebhookInboundMessageEvent;
  canonicalStatus?: WhatsAppMessageStatus;
  updatedMessageId?: string;
  error?: string;
}
