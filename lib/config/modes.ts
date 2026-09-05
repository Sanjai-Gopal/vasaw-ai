/**
 * VASAW AI — Operational & Safety Modes
 *
 * Provides centralized mode resolution and safety guardrails:
 * - APP_INTEGRATION_MODE: "mock" | "live" (default: "mock")
 * - OUTREACH_MODE: "disabled" | "mock" | "live" (default: "disabled")
 */

export type AppIntegrationMode = "mock" | "live";
export type OutreachMode = "disabled" | "mock" | "live";

/**
 * Returns the current application integration mode.
 * In "mock" mode, external API calls are simulated deterministically.
 * In "live" mode, real external providers (Apify, Vercel, Supabase, Google Sheets, Meta) are called.
 */
export function getAppIntegrationMode(): AppIntegrationMode {
  const envVal = (process.env.APP_INTEGRATION_MODE || "").toLowerCase();
  if (envVal === "live" || envVal === "production" || envVal === "real") {
    return "live";
  }
  return "mock";
}

export function isLiveMode(): boolean {
  return getAppIntegrationMode() === "live";
}

/**
 * Returns the current outreach safety mode.
 * - "disabled": Messages are prepared and saved in DB but NEVER sent over WhatsApp.
 * - "mock": Outreach is simulated and marked mock-sent.
 * - "live": Messages are dispatched to real recipients via Meta WhatsApp Cloud API.
 *
 * DEFAULT IS STRICTLY "disabled" TO PREVENT ACCIDENTAL REAL MESSAGING.
 */
export function getOutreachMode(): OutreachMode {
  const envVal = (process.env.OUTREACH_MODE || "").toLowerCase();
  if (envVal === "live") {
    return "live";
  }
  if (envVal === "mock") {
    return "mock";
  }
  return "disabled";
}

export function isOutreachPermitted(): boolean {
  return getOutreachMode() === "live";
}

export interface CredentialValidationResult {
  valid: boolean;
  mode: AppIntegrationMode;
  outreachMode: OutreachMode;
  missingRequired: string[];
  missingOptional: string[];
}

/**
 * Validates the presence of required credentials for the active mode.
 */
export function validateModeCredentials(mode = getAppIntegrationMode()): CredentialValidationResult {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const outreachMode = getOutreachMode();

  if (mode === "live") {
    // 1. Supabase (Required for persistent live mode)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
      missingRequired.push("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) {
      missingRequired.push("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY");
    }

    // 2. Apify Scraping (Required for live lead scraping)
    if (!process.env.APIFY_API_TOKEN) {
      missingRequired.push("APIFY_API_TOKEN");
    }

    // 3. Vercel Deployment (Required for live website hosting)
    if (!process.env.VERCEL_TOKEN) {
      missingRequired.push("VERCEL_TOKEN");
    }

    // 4. Google Sheets (Optional operational sync)
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      missingOptional.push("GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY (Google Sheets live sync)");
    }

    // 5. WhatsApp (Required if OUTREACH_MODE === "live")
    if (outreachMode === "live") {
      if (!process.env.WHATSAPP_ACCESS_TOKEN) {
        missingRequired.push("WHATSAPP_ACCESS_TOKEN (Required because OUTREACH_MODE=live)");
      }
      if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
        missingRequired.push("WHATSAPP_PHONE_NUMBER_ID (Required because OUTREACH_MODE=live)");
      }
    }
  }

  return {
    valid: missingRequired.length === 0,
    mode,
    outreachMode,
    missingRequired,
    missingOptional,
  };
}
