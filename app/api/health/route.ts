import { NextResponse } from "next/server";
import { getAppIntegrationMode, getOutreachMode, validateModeCredentials } from "@/lib/config/modes";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { healthCheck as checkAIHealth } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const integrationMode = getAppIntegrationMode();
  const outreachMode = getOutreachMode();
  const credsCheck = validateModeCredentials();

  let storageStatus = "not_configured";
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("campaigns").select("id").limit(1);
    storageStatus = error ? `error: ${error.message}` : "connected";
  } catch (err) {
    storageStatus = `unavailable: ${err instanceof Error ? err.message : String(err)}`;
  }

  let aiStatus: unknown = {};
  try {
    aiStatus = await checkAIHealth();
  } catch (err) {
    aiStatus = { error: err instanceof Error ? err.message : String(err) };
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    responseTimeMs,
    environment: {
      integrationMode,
      outreachMode,
      credentialsValid: credsCheck.valid,
      missingRequired: credsCheck.missingRequired,
    },
    services: {
      storage: storageStatus,
      ai: aiStatus,
    },
    agents: [
      { id: "scraping", name: "Lead Scraper", status: "ready" },
      { id: "qualification", name: "AI Qualification", status: "ready" },
      { id: "storage", name: "Supabase Storage", status: "ready" },
      { id: "website-building", name: "Website Builder", status: "ready" },
      { id: "deployment", name: "Deployment Agent", status: "ready" },
      { id: "whatsapp", name: "WhatsApp Outreach", status: "ready" },
    ],
  });
}
