import {
  TemplateType,
  WebsiteBuildInput,
  WebsiteBuildResult,
  WebsiteRequest,
  WebsiteResponse,
} from "./types";
import { getWebsiteProvider } from "./providers";
import { getTemplate, listTemplates, selectTemplate } from "./templates/registry";
import { getTheme } from "./themes";
import { validateWebsiteProject, validateWebsiteStatic, executeWebsiteBuild } from "./validator";

export * from "./types";
export {
  getTemplate,
  listTemplates,
  selectTemplate,
  getTheme,
  validateWebsiteProject,
  validateWebsiteStatic,
  executeWebsiteBuild,
};

export async function buildWebsite(input: WebsiteBuildInput): Promise<WebsiteBuildResult> {
  const provider = getWebsiteProvider(input.mode || "mock");
  return provider.build(input);
}

export async function runWebsiteAgent(request: WebsiteRequest): Promise<WebsiteResponse> {
  try {
    const mode = request.mode === "ai" ? "ai" : "mock";
    const result = await buildWebsite({
      lead: request.lead,
      qualification: request.qualification,
      mode,
      forceTemplate: request.forceTemplate,
      outputBaseDir: request.outputBaseDir,
    });

    return {
      success: result.buildStatus === "SUCCESS",
      agent: "website-building",
      mode,
      count: 1,
      result,
      error: result.buildStatus === "FAILED" ? result.buildErrors.join("; ") : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      agent: "website-building",
      mode: request.mode || "mock",
      count: 0,
      error: message,
    };
  }
}

export function validateRequest(body: unknown): {
  valid: boolean;
  request?: WebsiteRequest;
  error?: string;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body || typeof body !== "object") {
    errors.push("Request body must be a JSON object");
    return { valid: false, error: errors[0], errors };
  }

  const b = body as Record<string, unknown>;

  // Check lead
  if (!b.lead || typeof b.lead !== "object") {
    errors.push("Missing required field: lead");
    return { valid: false, error: errors[0], errors };
  }

  const lead = b.lead as Record<string, unknown>;
  if (!lead.id || typeof lead.id !== "string") {
    errors.push("Lead missing required 'id'");
  }
  if (!lead.businessName || typeof lead.businessName !== "string") {
    errors.push("Lead missing required 'businessName'");
  }

  // Check qualification
  if (!b.qualification || typeof b.qualification !== "object") {
    errors.push("Missing required field: qualification");
    return { valid: false, error: errors[0], errors };
  }

  const qual = b.qualification as Record<string, unknown>;
  if (typeof qual.score !== "number") {
    errors.push("qualification.score is required and must be a number");
  }
  if (!qual.priority || typeof qual.priority !== "string") {
    errors.push("qualification.priority is required and must be a string");
  }
  if (typeof qual.websiteOpportunity !== "boolean") {
    errors.push("qualification.websiteOpportunity is required and must be a boolean");
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join("; "), errors };
  }

  const mode = b.mode === "ai" ? "ai" : "mock";
  b.mode = mode;
  const forceTemplate = typeof b.forceTemplate === "string" ? (b.forceTemplate as TemplateType) : undefined;
  const outputBaseDir = typeof b.outputBaseDir === "string" ? b.outputBaseDir : undefined;

  return {
    valid: true,
    errors: [],
    request: {
      lead: b.lead as WebsiteRequest["lead"],
      qualification: b.qualification as WebsiteRequest["qualification"],
      mode,
      forceTemplate,
      outputBaseDir,
    },
  };
}
