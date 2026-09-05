import { SendWhatsAppRequest, WhatsAppMessagePayload } from "./types";

export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export interface RequestValidationResult {
  valid: boolean;
  errors: string[];
  normalizedPhone?: string;
  parsedMessage?: WhatsAppMessagePayload;
}

/**
 * Normalizes phone numbers into E.164 international format (+[country code][number])
 * Default fallback country code is +91 (India) for 10-digit numbers common in VASAW local leads.
 */
export function normalizePhoneNumber(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { valid: false, error: "Phone number is required and must be a non-empty string" };
  }

  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return { valid: false, error: "Phone number cannot be empty" };
  }

  // Remove whitespace, hyphens, parentheses, dots
  let cleaned = trimmed.replace(/[\s\-().]/g, "");

  // Handle international prefix 00 -> +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // Check if starts with +
  if (cleaned.startsWith("+")) {
    const digitsOnly = cleaned.slice(1);
    if (!/^\d+$/.test(digitsOnly)) {
      return { valid: false, error: `Invalid characters in phone number: ${rawPhone}` };
    }
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return { valid: false, error: `Phone number digits length (${digitsOnly.length}) must be between 7 and 15 digits (E.164 standard)` };
    }
    return { valid: true, normalized: `+${digitsOnly}` };
  }

  // Digits only check
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: `Invalid non-numeric phone number: ${rawPhone}` };
  }

  // If 10 digits (e.g. 9876543210) -> assume standard Indian country code +91
  if (cleaned.length === 10) {
    return { valid: true, normalized: `+91${cleaned}` };
  }

  // If 11 digits starting with 0 (e.g. 09876543210) -> strip 0 and prepend +91
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return { valid: true, normalized: `+91${cleaned.slice(1)}` };
  }

  // If 12 digits starting with 91 (e.g. 919876543210) -> prepend +
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return { valid: true, normalized: `+${cleaned}` };
  }

  // If 11 digits starting with 1 (e.g. 14155552671 US) -> prepend +
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return { valid: true, normalized: `+${cleaned}` };
  }

  // If between 7 and 15 digits without prefix
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return { valid: true, normalized: `+${cleaned}` };
  }

  return {
    valid: false,
    error: `Phone number length (${cleaned.length}) is invalid for E.164 specification`,
  };
}

/**
 * Validates a SendWhatsAppRequest and normalizes phone and message payload.
 */
export function validateWhatsAppRequest(request: SendWhatsAppRequest): RequestValidationResult {
  const errors: string[] = [];

  // 1. Lead ID validation
  if (!request.leadId || typeof request.leadId !== "string" || request.leadId.trim() === "") {
    errors.push("Missing or invalid 'leadId': must be a non-empty string");
  }

  // 2. Phone validation
  let normalizedPhone: string | undefined;
  if (!request.phone) {
    errors.push("Missing 'phone': a recipient phone number is required");
  } else {
    const phoneResult = normalizePhoneNumber(request.phone);
    if (!phoneResult.valid || !phoneResult.normalized) {
      errors.push(phoneResult.error || `Invalid recipient phone number: ${request.phone}`);
    } else {
      normalizedPhone = phoneResult.normalized;
    }
  }

  // 3. Message validation
  let parsedMessage: WhatsAppMessagePayload | undefined;
  if (!request.message) {
    errors.push("Missing 'message': message content or payload is required");
  } else if (typeof request.message === "string") {
    const body = request.message.trim();
    if (body.length === 0) {
      errors.push("Message body cannot be empty");
    } else if (body.length > 4096) {
      errors.push(`Message body exceeds maximum WhatsApp text limit of 4096 characters (length: ${body.length})`);
    } else {
      parsedMessage = { type: "text", body };
    }
  } else if (typeof request.message === "object") {
    const msg = request.message;
    if (msg.type === "text") {
      if (!msg.body || typeof msg.body !== "string" || msg.body.trim().length === 0) {
        errors.push("Text message 'body' must be a non-empty string");
      } else if (msg.body.length > 4096) {
        errors.push(`Text message 'body' exceeds 4096 characters (length: ${msg.body.length})`);
      } else {
        parsedMessage = { type: "text", body: msg.body.trim(), previewUrl: msg.previewUrl };
      }
    } else if (msg.type === "template") {
      if (!msg.templateName || typeof msg.templateName !== "string" || msg.templateName.trim().length === 0) {
        errors.push("Template message 'templateName' must be a non-empty string");
      }
      if (!msg.languageCode || typeof msg.languageCode !== "string" || msg.languageCode.trim().length === 0) {
        errors.push("Template message 'languageCode' must be a non-empty string (e.g. 'en_US', 'ta')");
      }
      if (!errors.some(e => e.includes("Template message"))) {
        parsedMessage = msg;
      }
    } else if (msg.type === "media") {
      if (!msg.url || typeof msg.url !== "string" || !/^https?:\/\//i.test(msg.url)) {
        errors.push("Media message 'url' must be a valid HTTP/HTTPS URL");
      }
      if (!["image", "document", "video", "audio"].includes(msg.mediaType)) {
        errors.push(`Media message 'mediaType' must be one of: 'image', 'document', 'video', 'audio'`);
      }
      if (!errors.some(e => e.includes("Media message"))) {
        parsedMessage = msg;
      }
    } else {
      errors.push(`Unsupported message type: ${(msg as { type?: unknown }).type}`);
    }
  } else {
    errors.push("Invalid 'message' format: must be a string or a WhatsAppMessagePayload object");
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedPhone,
    parsedMessage,
  };
}
