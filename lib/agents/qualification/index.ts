import { Lead } from "@/lib/agents/scraping/types";
import { QualificationRequest, QualificationResponse, QualificationResult } from "./types";
import { getProvider } from "./providers";
import { calculateQualifications } from "./calculate";

export async function runQualificationAgent(request: QualificationRequest): Promise<QualificationResponse> {
  try {
    const provider = getProvider(request.mode);
    const results = await provider.qualify(request);

    return {
      success: true,
      agent: "qualification",
      mode: request.mode,
      count: results.length,
      results,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      agent: "qualification",
      mode: request.mode,
      count: 0,
      results: [],
      error: message,
    };
  }
}

export function qualifyLeadsSync(leads: Lead[]): QualificationResult[] {
  return calculateQualifications(leads);
}

export function validateRequest(body: unknown): { valid: boolean; request?: QualificationRequest; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (!b.leads || !Array.isArray(b.leads)) {
    return { valid: false, error: "leads is required and must be an array" };
  }

  if (b.leads.length === 0) {
    return { valid: false, error: "leads array cannot be empty" };
  }

  if (b.leads.length > 100) {
    return { valid: false, error: "leads array cannot exceed 100 items" };
  }

  for (let i = 0; i < b.leads.length; i++) {
    const lead = b.leads[i];
    if (!lead || typeof lead !== "object") {
      return { valid: false, error: `leads[${i}] must be an object` };
    }
    const l = lead as Record<string, unknown>;
    if (!l.id || typeof l.id !== "string") {
      return { valid: false, error: `leads[${i}].id is required and must be a string` };
    }
    if (!l.businessName || typeof l.businessName !== "string") {
      return { valid: false, error: `leads[${i}].businessName is required and must be a string` };
    }
  }

  const mode = b.mode === "ai" ? "ai" : "mock";

  return {
    valid: true,
    request: {
      leads: b.leads as Lead[],
      mode,
    },
  };
}