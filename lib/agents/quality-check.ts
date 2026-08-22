/**
 * Quality Checking Agent
 * 
 * Validates generated websites before deployment.
 * Checks: build success, TypeScript, required routes, business info, no placeholders, no secrets.
 * Supports up to 3 repair attempts.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface QualityCheckResult {
  websiteId: string;
  passed: boolean;
  checks: QualityCheck[];
  repairAttempt: number;
  errors: string[];
}

export interface QualityCheck {
  name: string;
  passed: boolean;
  details: string;
  severity: "error" | "warning" | "info";
}

const REQUIRED_ROUTES = ["/", "/contact"];
const REQUIRED_BUSINESS_FIELDS = ["businessName", "phone", "address", "category"];
const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /your content here/i,
  /add your/i,
  /insert/i,
  /\[.*\]/,
  /\{\{.*\}\}/,
  /TODO/i,
  /FIXME/i,
];

const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /private[_-]?key/i,
  /access[_-]?token/i,
  /bearer/i,
  /sk_[a-zA-Z0-9]{20,}/,
  /pk_[a-zA-Z0-9]{20,}/,
];

export interface WebsiteBuildInput {
  businessName: string;
  category: string;
  location: string;
  phone: string;
  email?: string;
  website: string | null;
  rating: number;
  reviews: number;
  scraped: {
    address: string;
    phone: string;
    email?: string;
    rating: number;
    reviews: number;
    category: string;
    subCategory?: string;
    hours?: string;
    services: string[];
    source: string;
    scrapedAt: string;
  };
  qualification: {
    hasWebsite: boolean;
    websiteQuality: number;
    hasWhatsApp: boolean;
    hasReviews: boolean;
    responseLikelihood: "high" | "medium" | "low";
    notes: string;
  };
  opportunity: {
    score: number;
    priority: "high" | "medium" | "low";
    reasons: string[];
    estimatedValue: number;
  };
}

export async function runQualityCheckAgent(
  websiteId: string,
  options?: { jobId?: string; repairAttempt?: number }
): Promise<QualityCheckResult> {
  const jobId = options?.jobId ?? (await createJob("quality_check", {
    metadata: { websiteId, repairAttempt: options?.repairAttempt ?? 0 },
  })).id;

  const steps = getStepsForJobType("quality_check");
  let currentStepIndex = 0;

  const updateStep = async (step: string) => {
    await updateJob(jobId, { currentStep: step });
  };

  const admin = getSupabaseAdmin();
  const repairAttempt = options?.repairAttempt ?? 0;

  try {
    // Fetch website data
    const { data: website, error: websiteError } = await admin
      .from("websites")
      .select("*")
      .eq("id", websiteId)
      .single();

    if (websiteError || !website) {
      throw new Error(`Website ${websiteId} not found`);
    }

    const { data: lead } = await admin
      .from("leads")
      .select("*")
      .eq("id", website.lead_id)
      .single();

    const checks: QualityCheck[] = [];
    const errors: string[] = [];

    // Find the generated website output directory
    const projectName = `${website.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${website.lead_id.slice(0, 8)}`;
    const outputDir = path.join("/tmp/vasaw-websites", projectName);

    // Check 1: Build succeeds
    await updateStep(steps[currentStepIndex++]);
    const buildCheck = await checkBuildSuccess(outputDir);
    checks.push(buildCheck);
    if (!buildCheck.passed) errors.push(buildCheck.details);

    // Check 2: TypeScript succeeds
    await updateStep(steps[currentStepIndex++]);
    const tsCheck = await checkTypeScript(outputDir);
    checks.push(tsCheck);
    if (!tsCheck.passed) errors.push(tsCheck.details);

    // Check 3: Required routes exist
    await updateStep(steps[currentStepIndex++]);
    const routesCheck = await checkRequiredRoutes(outputDir);
    checks.push(routesCheck);
    if (!routesCheck.passed) errors.push(routesCheck.details);

    // Check 4: Business information appears
    await updateStep(steps[currentStepIndex++]);
    const businessInfoCheck = await checkBusinessInfo(outputDir, lead, website);
    checks.push(businessInfoCheck);
    if (!businessInfoCheck.passed) errors.push(businessInfoCheck.details);

    // Check 5: No placeholder text
    await updateStep(steps[currentStepIndex++]);
    const placeholderCheck = await checkNoPlaceholders(outputDir);
    checks.push(placeholderCheck);
    if (!placeholderCheck.passed) errors.push(placeholderCheck.details);

    // Check 6: No secrets in generated project
    await updateStep(steps[currentStepIndex++]);
    const secretsCheck = await checkNoSecrets(outputDir);
    checks.push(secretsCheck);
    if (!secretsCheck.passed) errors.push(secretsCheck.details);

    const passed = errors.length === 0;
    const newStatus = passed ? "quality_passed" : "quality_failed";

    if (!isDryRun()) {
      await admin.from("websites").update({
        quality_status: passed ? "passed" : "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", websiteId);

      await admin.from("leads").update({
        quality_status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", website.lead_id);

      await admin.from("activities").insert({
        lead_id: website.lead_id,
        actor: "quality-check-agent",
        type: "website",
        status: passed ? "success" : "error",
        title: passed ? "Quality check passed" : "Quality check failed",
        description: `${checks.filter((c) => c.passed).length}/${checks.length} checks passed. ${errors.length > 0 ? "Errors: " + errors.join("; ") : "All checks passed."}`,
      });
    }

    await completeJob(jobId);

    return {
      websiteId,
      passed,
      checks,
      repairAttempt,
      errors,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJob(jobId, errorMessage);
    throw err;
  }
}

async function checkBuildSuccess(outputDir: string): Promise<QualityCheck> {
  if (isDryRun()) {
    return {
      name: "Build Success",
      passed: true,
      details: "DRY_RUN: Build simulated successfully",
      severity: "info",
    };
  }

  const outDir = path.join(outputDir, "out");
  const hasOutput = fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0;

  return {
    name: "Build Success",
    passed: hasOutput,
    details: hasOutput ? "Build output directory exists and has files" : "Build output directory missing or empty",
    severity: "error",
  };
}

async function checkTypeScript(outputDir: string): Promise<QualityCheck> {
  if (isDryRun()) {
    return {
      name: "TypeScript Check",
      passed: true,
      details: "DRY_RUN: TypeScript compilation simulated successfully",
      severity: "info",
    };
  }

  try {
    execSync("npx tsc --noEmit", { cwd: outputDir, stdio: "pipe", timeout: 120000 });
    return {
      name: "TypeScript Check",
      passed: true,
      details: "No TypeScript errors",
      severity: "info",
    };
  } catch (err) {
    const output = err instanceof Error ? err.message : String(err);
    return {
      name: "TypeScript Check",
      passed: false,
      details: `TypeScript errors: ${output.slice(0, 500)}`,
      severity: "error",
    };
  }
}

async function checkRequiredRoutes(outputDir: string): Promise<QualityCheck> {
  if (isDryRun()) {
    return {
      name: "Required Routes",
      passed: true,
      details: "DRY_RUN: Required routes verified",
      severity: "info",
    };
  }

  const outDir = path.join(outputDir, "out");
  const missingRoutes = REQUIRED_ROUTES.filter((route) => {
    if (route === "/") {
      const routePath = path.join(outDir, "index.html");
      return !fs.existsSync(routePath);
    }
    // For /contact, check both /contact.html and /contact/index.html
    const routePath1 = path.join(outDir, route + ".html");
    const routePath2 = path.join(outDir, route.replace(/^\//, "") + "/index.html");
    return !fs.existsSync(routePath1) && !fs.existsSync(routePath2);
  });

  return {
    name: "Required Routes",
    passed: missingRoutes.length === 0,
    details: missingRoutes.length === 0
      ? "All required routes present"
      : `Missing routes: ${missingRoutes.join(", ")}`,
    severity: "error",
  };
}

async function checkBusinessInfo(
  outputDir: string,
  lead: unknown,
  website: unknown
): Promise<QualityCheck> {
  if (isDryRun()) {
    return {
      name: "Business Information",
      passed: true,
      details: "DRY_RUN: Business info verified",
      severity: "info",
    };
  }

  // Check the generated HTML for business info
  const outDir = path.join(outputDir, "out");
  const indexPath = path.join(outDir, "index.html");
  
  if (!fs.existsSync(indexPath)) {
    return {
      name: "Business Information",
      passed: false,
      details: "index.html not found in build output",
      severity: "error",
    };
  }

  const html = fs.readFileSync(indexPath, "utf-8");
  const leadData = lead as Record<string, unknown>;
  const websiteData = website as Record<string, unknown>;

  const missingFields = REQUIRED_BUSINESS_FIELDS.filter((field) => {
    const value = leadData[field] ?? websiteData[field];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return true;
    }
    // Check if the value appears in the HTML
    const searchValue = typeof value === "string" ? value : String(value);
    return !html.includes(searchValue);
  });

  return {
    name: "Business Information",
    passed: missingFields.length === 0,
    details: missingFields.length === 0
      ? "All required business fields present in generated HTML"
      : `Missing fields in HTML: ${missingFields.join(", ")}`,
    severity: "error",
  };
}

async function checkNoPlaceholders(outputDir: string): Promise<QualityCheck> {
  if (isDryRun()) {
    return {
      name: "No Placeholder Text",
      passed: true,
      details: "DRY_RUN: No placeholders detected",
      severity: "info",
    };
  }

  const foundPlaceholders: Array<{ file: string; pattern: string; line: number }> = [];
  
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (![".next", "node_modules", ".git", "out", "public"].includes(entry.name)) {
          scanDir(fullPath);
        }
      } else if (/\.(tsx?|jsx?|css|html)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          for (const pattern of PLACEHOLDER_PATTERNS) {
            if (pattern.test(lines[i])) {
              foundPlaceholders.push({
                file: path.relative(outputDir, fullPath),
                pattern: pattern.source,
                line: i + 1,
              });
            }
          }
        }
      }
    }
  }

  scanDir(outputDir);

  return {
    name: "No Placeholder Text",
    passed: foundPlaceholders.length === 0,
    details: foundPlaceholders.length === 0
      ? "No placeholder text detected"
      : `Found placeholders: ${foundPlaceholders.map(p => `${p.file}:${p.line} (${p.pattern})`).join(", ")}`,
    severity: "error",
  };
}

async function checkNoBrokenLinks(outputDir: string): Promise<QualityCheck> {
  if (isDryRun()) {
    return {
      name: "No Broken Links",
      passed: true,
      details: "DRY_RUN: Link check simulated",
      severity: "info",
    };
  }

  // Basic check: ensure all internal links in HTML point to existing files
  const outDir = path.join(outputDir, "out");
  if (!fs.existsSync(outDir)) {
    return {
      name: "No Broken Links",
      passed: false,
      details: "Build output directory not found",
      severity: "error",
    };
  }

  const brokenLinks: string[] = [];
  
  function checkLinks(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkLinks(fullPath);
      } else if (entry.name.endsWith(".html")) {
        const html = fs.readFileSync(fullPath, "utf-8");
        // Find all href/src attributes
        const linkRegex = /(?:href|src)=["']([^"']+)["']/g;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
          const link = match[1];
          if (link.startsWith("/") && !link.startsWith("//")) {
            // Internal link - check if file exists
            const targetPath = path.join(outDir, link.replace(/^\//, "") + (link.endsWith(".html") ? "" : "/index.html"));
            const targetPath2 = path.join(outDir, link.replace(/^\//, "") + (link.endsWith(".html") ? "" : ".html"));
            if (!fs.existsSync(targetPath) && !fs.existsSync(targetPath2)) {
              brokenLinks.push(`${path.relative(outDir, fullPath)} -> ${link}`);
            }
          }
        }
      }
    }
  }

  checkLinks(outDir);

  return {
    name: "No Broken Links",
    passed: brokenLinks.length === 0,
    details: brokenLinks.length === 0
      ? "No broken internal links detected"
      : `Broken links: ${brokenLinks.join(", ")}`,
    severity: "error",
  };
}

async function checkResponsiveStructure(outputDir: string): Promise<QualityCheck> {
  if (isDryRun()) {
    return {
      name: "Responsive Structure",
      passed: true,
      details: "DRY_RUN: Responsive check simulated",
      severity: "info",
    };
  }

  const outDir = path.join(outputDir, "out");
  const indexPath = path.join(outDir, "index.html");
  
  if (!fs.existsSync(indexPath)) {
    return {
      name: "Responsive Structure",
      passed: false,
      details: "index.html not found",
      severity: "error",
    };
  }

  const html = fs.readFileSync(indexPath, "utf-8");
  const hasViewportMeta = /<meta[^>]*name=["']viewport["'][^>]*>/.test(html);
  const hasResponsiveCSS = fs.existsSync(path.join(outputDir, "tailwind.config.js")) || 
                           fs.existsSync(path.join(outputDir, "src/globals.css"));

  return {
    name: "Responsive Structure",
    passed: hasViewportMeta && hasResponsiveCSS,
    details: `Viewport meta: ${hasViewportMeta ? "present" : "missing"}; Responsive CSS config: ${hasResponsiveCSS ? "present" : "missing"}`,
    severity: "warning",
  };
}

async function checkNoSecrets(outputDir: string): Promise<QualityCheck> {
  if (isDryRun()) {
    return {
      name: "No Secrets",
      passed: true,
      details: "DRY_RUN: Secret scan simulated",
      severity: "info",
    };
  }

  const foundSecrets: Array<{ file: string; pattern: string; line: number }> = [];
  
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (![".next", "node_modules", ".git", "out", "public"].includes(entry.name)) {
          scanDir(fullPath);
        }
      } else if (/\.(tsx?|jsx?|json|env|css|html)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          for (const pattern of SECRET_PATTERNS) {
            if (pattern.test(lines[i])) {
              foundSecrets.push({
                file: path.relative(outputDir, fullPath),
                pattern: pattern.source,
                line: i + 1,
              });
            }
          }
        }
      }
    }
  }

  scanDir(outputDir);

  return {
    name: "No Secrets",
    passed: foundSecrets.length === 0,
    details: foundSecrets.length === 0
      ? "No secrets detected in generated project"
      : `Potential secrets found: ${foundSecrets.map(p => `${p.file}:${p.line} (${p.pattern})`).join(", ")}`,
    severity: "error",
  };
}

export async function repairWebsite(
  websiteId: string,
  errors: string[]
): Promise<{ success: boolean; message: string }> {
  if (isDryRun()) {
    console.log("[QualityCheck] DRY_RUN: Simulating repair for", websiteId);
    return { success: true, message: "Repair simulated successfully" };
  }

  // For now, just re-run the website builder with the same parameters
  // In a real implementation, this would analyze errors and apply fixes
  const admin = getSupabaseAdmin();
  
  const { data: website } = await admin
    .from("websites")
    .select("*")
    .eq("id", websiteId)
    .single();

  if (!website) {
    return { success: false, message: "Website not found" };
  }

  try {
    // Trigger a rebuild
    const { generateWebsiteProject } = await import("@/lib/services/website-generator");
    const projectName = `${website.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${website.lead_id.slice(0, 8)}`;
    const outputDir = path.join("/tmp/vasaw-websites", projectName);
    
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }

    await generateWebsiteProject({
      templateId: website.template.toLowerCase().replace(/\s+/g, "-"),
      template: getTemplate(website.template),
      businessData: mapWebsiteToBuildInput(website),
      generatedContent: website.generated_content as Record<string, unknown> ?? {},
      leadId: website.lead_id,
    });

    // Re-run quality check
    const result = await runQualityCheckAgent(websiteId, { repairAttempt: 1 });
    
    return { 
      success: result.passed, 
      message: result.passed ? "Repair successful - quality check passed" : `Repair attempted but quality check still fails: ${result.errors.join(", ")}` 
    };
  } catch (err) {
    return { 
      success: false, 
      message: `Repair failed: ${err instanceof Error ? err.message : "Unknown error"}` 
    };
  }
}

interface TemplateSection {
  id: string;
  type: string;
  required: boolean;
  order: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  pages: string[];
  sections: TemplateSection[];
}

function getTemplate(templateName: string): Template {
  const templates: Record<string, Template> = {
    "Restaurant Pro": {
      id: "restaurant",
      name: "Restaurant",
      description: "Full-service restaurant with menu, reservations, and online ordering",
      pages: ["index"],
      sections: [
        { id: "hero", type: "hero", required: true, order: 1 },
        { id: "about", type: "about", required: true, order: 2 },
        { id: "menu", type: "menu", required: true, order: 3 },
        { id: "gallery", type: "gallery", required: false, order: 4 },
        { id: "testimonials", type: "testimonials", required: true, order: 5 },
        { id: "hours", type: "hours", required: true, order: 6 },
        { id: "contact", type: "contact", required: true, order: 7 },
      ],
    },
    "Cafe Modern": {
      id: "cafe",
      name: "Cafe",
      description: "Coffee shop with menu, wifi, and ambiance focus",
      pages: ["index"],
      sections: [
        { id: "hero", type: "hero", required: true, order: 1 },
        { id: "about", type: "about", required: true, order: 2 },
        { id: "menu", type: "menu", required: true, order: 3 },
        { id: "gallery", type: "gallery", required: true, order: 4 },
        { id: "testimonials", type: "testimonials", required: true, order: 5 },
        { id: "hours", type: "hours", required: true, order: 6 },
        { id: "contact", type: "contact", required: true, order: 7 },
      ],
    },
  };
  return templates[templateName] || templates["Restaurant Pro"];
}

interface WebsiteRecord {
  business_name: string;
  category: string;
  location: string;
  phone: string;
  email: string | null;
  website: string | null;
  rating: number;
  reviews: number;
  address: string | null;
  sub_category: string | null;
  hours: string | null;
  services: string[] | null;
  source: string | null;
  scraped_at: string | null;
  template: string;
  qualification_json: Record<string, unknown>;
  opportunity_json: Record<string, unknown>;
  lead_id: string;
}

function mapWebsiteToBuildInput(website: WebsiteRecord): WebsiteBuildInput {
  const qualification = website.qualification_json as {
    hasWebsite?: boolean;
    websiteQuality?: number;
    hasWhatsApp?: boolean;
    hasReviews?: boolean;
    responseLikelihood?: "high" | "medium" | "low";
    notes?: string;
  } ?? {};
  
  const opportunity = website.opportunity_json as {
    score?: number;
    priority?: "high" | "medium" | "low";
    reasons?: string[];
    estimatedValue?: number;
  } ?? {};

  return {
    businessName: website.business_name,
    category: website.category,
    location: website.location,
    phone: website.phone,
    email: website.email ?? undefined,
    website: website.website,
    rating: website.rating,
    reviews: website.reviews,
    scraped: {
      address: website.address ?? "",
      phone: website.phone,
      email: website.email ?? undefined,
      rating: website.rating,
      reviews: website.reviews,
      category: website.category,
      subCategory: website.sub_category ?? undefined,
      hours: website.hours ?? undefined,
      services: website.services ?? [],
      source: website.source ?? "Google Maps",
      scrapedAt: website.scraped_at ?? new Date().toISOString(),
    },
    qualification: {
      hasWebsite: qualification.hasWebsite ?? false,
      websiteQuality: qualification.websiteQuality ?? 0,
      hasWhatsApp: qualification.hasWhatsApp ?? false,
      hasReviews: qualification.hasReviews ?? false,
      responseLikelihood: qualification.responseLikelihood ?? "low",
      notes: qualification.notes ?? "",
    },
    opportunity: {
      score: opportunity.score ?? 0,
      priority: opportunity.priority ?? "low",
      reasons: opportunity.reasons ?? [],
      estimatedValue: opportunity.estimatedValue ?? 0,
    },
  };
}

export async function createQualityCheckJob(websiteId: string): Promise<string> {
  const job = await createJob("quality_check", { metadata: { websiteId } });
  return job.id;
}