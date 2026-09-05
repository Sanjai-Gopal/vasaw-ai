import { getAppIntegrationMode, getOutreachMode, validateModeCredentials } from "./modes";

export interface EnvironmentConfig {
  appMode: "mock" | "live";
  outreachMode: "disabled" | "mock" | "live";
  batchSize: number;
  supabase: {
    url: string | null;
    serviceKeyConfigured: boolean;
  };
  apify: {
    tokenConfigured: boolean;
    actorId: string;
  };
  vercel: {
    tokenConfigured: boolean;
    teamId: string | null;
    projectId: string | null;
  };
  googleSheets: {
    configured: boolean;
    spreadsheetId: string | null;
  };
  whatsapp: {
    configured: boolean;
    phoneNumberId: string | null;
    apiVersion: string;
  };
  ai: {
    nvidiaConfigured: boolean;
    groqConfigured: boolean;
    geminiConfigured: boolean;
  };
}

/**
 * Returns a sanitized configuration overview safe for debugging and status pages.
 * Never leaks secret keys or tokens.
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const batchSizeRaw = parseInt(process.env.CAMPAIGN_BATCH_SIZE || "10", 10);
  const batchSize = Number.isFinite(batchSizeRaw) && batchSizeRaw > 0 ? batchSizeRaw : 10;

  return {
    appMode: getAppIntegrationMode(),
    outreachMode: getOutreachMode(),
    batchSize,
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || null,
      serviceKeyConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY),
    },
    apify: {
      tokenConfigured: Boolean(process.env.APIFY_API_TOKEN),
      actorId: process.env.APIFY_ACTOR_ID || "nwua9Gu5YrADL7ZDj",
    },
    vercel: {
      tokenConfigured: Boolean(process.env.VERCEL_TOKEN),
      teamId: process.env.VERCEL_TEAM_ID || null,
      projectId: process.env.VERCEL_PROJECT_ID || null,
    },
    googleSheets: {
      configured: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || null,
    },
    whatsapp: {
      configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
      apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
    },
    ai: {
      nvidiaConfigured: Boolean(process.env.NVIDIA_API_KEY),
      groqConfigured: Boolean(process.env.GROQ_API_KEY),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    },
  };
}

export { validateModeCredentials };
