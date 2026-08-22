/**
 * Deployment Agent
 * 
 * Deploys generated websites to dedicated GitHub repositories and Vercel projects.
 * One website = one GitHub repo = one Vercel project.
 * Does NOT deploy to the main VASAW AI project.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";
import { createOrGetRepository, pushFiles, getAuthenticatedUser, scanForSecrets } from "@/lib/services/github-service";
import { createProject, createDeployment, waitForDeployment } from "@/lib/services/vercel-service";
import { generateWebsiteProject } from "@/lib/services/website-generator";
import * as fs from "fs";
import * as path from "path";

if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
if (!process.env.VERCEL_TOKEN) throw new Error("VERCEL_TOKEN not configured");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const GITHUB_API = "https://api.github.com";
const VERCEL_API = "https://api.vercel.com";

export interface DeploymentResult {
  deploymentId: string;
  websiteId: string;
  githubRepoUrl: string;
  vercelProjectUrl: string;
  liveUrl: string;
  commitHash: string;
  status: "deployed" | "failed";
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

interface VercelProjectResponse {
  id: string;
  name: string;
  framework: string;
  gitRepository: {
    type: string;
    repo: string;
  };
}

interface VercelDeploymentResponse {
  id: string;
  url: string;
  readyState: "READY" | "BUILDING" | "ERROR" | "CANCELED";
  meta: {
    githubCommitSha: string;
  };
}

// Template types from website-generator
interface TemplateSection {
  id: string;
  type: string;
  required: boolean;
  order: number;
}

interface TemplateType {
  id: string;
  name: string;
  description: string;
  pages: string[];
  sections: TemplateSection[];
}

// Restaurant template
const RESTAURANT_TEMPLATE: TemplateType = {
  id: "restaurant",
  name: "Restaurant",
  description: "Full-service restaurant with menu, reservations, and online ordering",
  pages: ["index", "contact"],
  sections: [
    { id: "hero", type: "hero", required: true, order: 1 },
    { id: "about", type: "about", required: true, order: 2 },
    { id: "menu", type: "menu", required: true, order: 3 },
    { id: "gallery", type: "gallery", required: false, order: 4 },
    { id: "testimonials", type: "testimonials", required: true, order: 5 },
    { id: "hours", type: "hours", required: true, order: 6 },
    { id: "contact", type: "contact", required: true, order: 7 },
  ],
};

interface WebsiteBuildInput {
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

interface GenerateWebsiteParams {
  templateId: string;
  template: TemplateType;
  businessData: WebsiteBuildInput;
  generatedContent: Record<string, unknown>;
  leadId: string;
}

async function collectFilesForDeploy(outputDir: string): Promise<Array<{ path: string; content: string | Uint8Array }>> {
  const files: Array<{ path: string; content: string | Uint8Array }> = [];
  const excludeDirs = ["node_modules", ".next", ".git", ".vercel", "out"];
  const excludeFiles = [".DS_Store", "tsconfig.tsbuildinfo"];

  function walk(dir: string, prefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(prefix, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (!excludeFiles.includes(entry.name)) {
        const content = fs.readFileSync(fullPath);
        files.push({ path: relPath, content });
      }
    }
  }

  walk(outputDir);
  return files;
}

function buildWebsiteBuildInput(website: any, lead: any): WebsiteBuildInput {
  const qualification = lead.qualification_json || {};
  const opportunity = lead.opportunity_json || {};
  
  return {
    businessName: website.business_name,
    category: website.category,
    location: website.location,
    phone: lead.phone,
    email: lead.email || undefined,
    website: lead.website || null,
    rating: lead.rating,
    reviews: lead.reviews,
    scraped: {
      address: lead.qualification_json?.address || website.location,
      phone: lead.phone,
      email: lead.email || undefined,
      rating: lead.rating,
      reviews: lead.reviews,
      category: lead.category,
      subCategory: lead.sub_category || undefined,
      hours: lead.hours || undefined,
      services: lead.services || [],
      source: lead.source || "Google Maps",
      scrapedAt: lead.scraped_at || new Date().toISOString(),
    },
    qualification: {
      hasWebsite: qualification.hasWebsite ?? false,
      websiteQuality: qualification.websiteQuality ?? 0,
      hasWhatsApp: qualification.hasWhatsApp ?? false,
      hasReviews: qualification.hasReviews ?? false,
      responseLikelihood: qualification.responseLikelihood ?? "medium",
      notes: qualification.notes ?? "",
    },
    opportunity: {
      score: opportunity.score ?? 0,
      priority: opportunity.priority ?? "medium",
      reasons: opportunity.reasons ?? [],
      estimatedValue: opportunity.estimatedValue ?? 0,
    },
  };
}

async function generateWebsiteProjectWrapper(
  websiteId: string,
  website: any,
  lead: any
): Promise<{ outputDir: string; previewUrl?: string }> {
  const businessData = buildWebsiteBuildInput(website, lead);
  const generatedContent = generateMockContent(RESTAURANT_TEMPLATE, businessData);
  
  return generateWebsiteProject({
    templateId: "restaurant",
    template: RESTAURANT_TEMPLATE,
    businessData,
    generatedContent,
    leadId: website.lead_id,
  });
}

function generateMockContent(template: TemplateType, businessData: WebsiteBuildInput): Record<string, unknown> {
  const content: Record<string, unknown> = {};

  for (const section of template.sections) {
    switch (section.type) {
      case "hero":
        content[section.id] = {
          headline: `${businessData.businessName} - ${businessData.category} in ${businessData.location}`,
          subheadline: businessData.qualification.notes || `Premium ${businessData.category.toLowerCase()} experience`,
          ctaText: "Contact Us",
          ctaLink: "/contact",
        };
        break;
      case "about":
        content[section.id] = {
          headline: `About ${businessData.businessName}`,
          body: `Located in ${businessData.location}, ${businessData.businessName} has been serving the community with ${businessData.rating}/5 stars from ${businessData.reviews} reviews. ${businessData.opportunity.reasons.join(". ")}.`,
        };
        break;
      case "services":
        content[section.id] = {
          headline: "Our Services",
          items: businessData.scraped.services.slice(0, 8).map((s) => ({ title: s, description: "" })),
        };
        break;
      case "menu":
        content[section.id] = {
          headline: "Menu",
          categories: [{ name: "Popular Items", items: businessData.scraped.services.slice(0, 6).map((s) => ({ name: s, price: null })) }],
        };
        break;
      case "gallery":
        content[section.id] = {
          headline: "Gallery",
          images: [],
        };
        break;
      case "testimonials":
        content[section.id] = {
          headline: "What Our Customers Say",
          items: [],
        };
        break;
      case "hours":
        content[section.id] = {
          headline: "Opening Hours",
          schedule: businessData.scraped.hours ? [{ days: "Mon-Sun", hours: businessData.scraped.hours }] : [],
        };
        break;
      case "team":
        content[section.id] = {
          headline: "Our Team",
          members: [],
        };
        break;
      case "contact":
        content[section.id] = {
          headline: "Contact Us",
          address: businessData.scraped.address,
          phone: businessData.phone,
          email: businessData.email,
          mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(businessData.scraped.address)}&output=embed`,
        };
        break;
      case "cta":
        content[section.id] = {
          headline: "Ready to Visit?",
          subheadline: "Get in touch or visit us today!",
          buttonText: "Call Now",
          buttonLink: `tel:${businessData.phone.replace(/\D/g, "")}`,
        };
        break;
    }
  }

  return content;
}

async function githubRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
  
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }
  return response.json();
}

async function vercelRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!VERCEL_TOKEN) throw new Error("VERCEL_TOKEN not configured");
  
  const response = await fetch(`${VERCEL_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Vercel API error ${response.status}: ${text}`);
  }
  return response.json();
}

export async function runDeploymentAgent(
  websiteId: string,
  options?: { jobId?: string }
): Promise<DeploymentResult> {
  const jobId = options?.jobId ?? (await createJob("deploy_website", {
    metadata: { websiteId },
  })).id;

  const steps = getStepsForJobType("deploy_website");
  let currentStepIndex = 0;

  const updateStep = async (step: string) => {
    await updateJob(jobId, { currentStep: step });
  };

  const admin = getSupabaseAdmin();

  try {
    // Fetch website and lead data
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

    // Step 1: Create GitHub repository
    await updateStep(steps[currentStepIndex++]);
    
    const repoName = `vasaw-${website.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${website.lead_id.slice(0, 8)}`;
    let githubRepo: GitHubRepoResponse;
    let commitHash = "";
    let githubOwner = "";

    if (isDryRun()) {
      console.log("[Deployment] DRY_RUN: Simulating GitHub repo creation:", repoName);
      githubRepo = {
        id: Date.now(),
        name: repoName,
        full_name: `vasaw-ai/${repoName}`,
        html_url: `https://github.com/vasaw-ai/${repoName}`,
        clone_url: `https://github.com/vasaw-ai/${repoName}.git`,
        default_branch: "main",
      };
      commitHash = "dry-run-commit-hash";
      githubOwner = "vasaw-ai";
    } else {
      // Get authenticated GitHub user
      const user = await getAuthenticatedUser(GITHUB_TOKEN);
      githubOwner = user.login!;

      // Create or get repository
      githubRepo = await createOrGetRepository(GITHUB_TOKEN, repoName, `VASAW AI generated website for ${website.business_name}`);
      
      // Generate website files and push to GitHub
      const { outputDir } = await generateWebsiteProjectWrapper(websiteId, website, lead);
      
      // Collect all files to push
      const files = await collectFilesForDeploy(outputDir);
      
      // Scan for secrets
      const secretScan = await scanForSecrets(files.map(f => ({ path: f.path, content: typeof f.content === 'string' ? f.content : new TextDecoder().decode(f.content) })));
      if (secretScan.hasSecrets) {
        throw new Error(`Secret scan failed: ${secretScan.secrets.map(s => `${s.file}:${s.line}`).join(", ")}`);
      }

      // Push files to GitHub
      const commit = await pushFiles(GITHUB_TOKEN, githubOwner, repoName, files, "Initial commit: VASAW AI generated website");
      commitHash = commit.sha;
      githubRepo.html_url = `https://github.com/${githubOwner}/${repoName}`;
    }

    // Step 2: Create Vercel project
    await updateStep(steps[currentStepIndex++]);

    let vercelProject: VercelProjectResponse;
    if (isDryRun()) {
      console.log("[Deployment] DRY_RUN: Simulating Vercel project creation");
      vercelProject = {
        id: `vercel-${Date.now()}`,
        name: repoName,
        framework: "nextjs",
        gitRepository: { type: "github", repo: `vasaw-ai/${repoName}` },
      };
    } else {
      vercelProject = await vercelRequest<VercelProjectResponse>("/v9/projects", {
        method: "POST",
        body: JSON.stringify({
          name: repoName,
          framework: "nextjs",
          gitRepository: {
            type: "github",
            repo: `${githubOwner}/${repoName}`,
          },
          teamId: VERCEL_TEAM_ID,
        }),
      });
    }

    // Step 3: Deploy to Vercel
    await updateStep(steps[currentStepIndex++]);

    let deployment: VercelDeploymentResponse;
    if (isDryRun()) {
      console.log("[Deployment] DRY_RUN: Simulating Vercel deployment");
      deployment = {
        id: `deployment-${Date.now()}`,
        url: `${repoName}.vercel.app`,
        readyState: "READY",
        meta: { githubCommitSha: commitHash },
      };
    } else {
      deployment = await vercelRequest<VercelDeploymentResponse>(`/v13/deployments`, {
        method: "POST",
        body: JSON.stringify({
          name: repoName,
          project: vercelProject.id,
          gitSource: {
            type: "github",
            repo: `${githubOwner}/${repoName}`,
            ref: "main",
            sha: commitHash,
          },
          teamId: VERCEL_TEAM_ID,
          target: "production",
        }),
      });

      // Wait for deployment to complete
      deployment = await waitForVercelDeployment(deployment.id);
    }

    // Step 4: Verify deployment
    await updateStep(steps[currentStepIndex++]);

    if (deployment.readyState !== "READY") {
      throw new Error(`Vercel deployment failed: ${deployment.readyState}`);
    }

    const liveUrl = `https://${deployment.url}`;
    const deploymentId = `dep-${websiteId}-${Date.now()}`;

    // Step 5: Record deployment
    await updateStep(steps[currentStepIndex++]);

    if (!isDryRun()) {
      await admin.from("deployments").insert({
        id: deploymentId,
        website_id: websiteId,
        lead_id: website.lead_id,
        business_name: website.business_name,
        status: "deployed",
        provider: "vercel",
        environment: "production",
        live_url: liveUrl,
        commit_hash: deployment.meta.githubCommitSha,
        duration_sec: 0,
        deployed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      await admin.from("websites").update({
        status: "deployed",
        live_url: liveUrl,
        repo_url: githubRepo.html_url,
        commit_hash: deployment.meta.githubCommitSha,
        updated_at: new Date().toISOString(),
      }).eq("id", websiteId);

      await admin.from("leads").update({
        deployment_status: "deployed",
        website_status: "deployed",
        updated_at: new Date().toISOString(),
      }).eq("id", website.lead_id);

      await admin.from("activities").insert({
        lead_id: website.lead_id,
        actor: "deployment-agent",
        type: "deployment",
        status: "success",
        title: "Website deployed",
        description: `${website.business_name} deployed to ${liveUrl}`,
      });
    }

    await completeJob(jobId);

    return {
      deploymentId,
      websiteId,
      githubRepoUrl: githubRepo.html_url,
      vercelProjectUrl: `https://vercel.com/${VERCEL_TEAM_ID ?? "personal"}/${vercelProject.name}`,
      liveUrl,
      commitHash: deployment.meta.githubCommitSha,
      status: "deployed",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    
    if (!isDryRun()) {
      const { data: website } = await admin
        .from("websites")
        .select("lead_id")
        .eq("id", websiteId)
        .single();
      
      if (website) {
        await admin.from("websites").update({
          status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("id", websiteId);

        await admin.from("leads").update({
          deployment_status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("id", website.lead_id);
      }
    }

    await failJob(jobId, errorMessage);
    throw err;
  }
}

async function pushWebsiteToGitHub(cloneUrl: string, websiteId: string): Promise<string> {
  // In real implementation:
  // 1. Clone the empty repo
  // 2. Copy built website files
  // 3. Commit and push
  // 4. Return commit hash
  
  // For now, simulate
  await new Promise((resolve) => setTimeout(resolve, 500));
  return `commit-${Date.now()}`;
}

async function waitForVercelDeployment(deploymentId: string, maxWaitMs = 300000): Promise<VercelDeploymentResponse> {
  const startTime = Date.now();
  const pollIntervalMs = 10000;

  while (Date.now() - startTime < maxWaitMs) {
    const deployment = await vercelRequest<VercelDeploymentResponse>(`/v13/deployments/${deploymentId}`);
    
    if (deployment.readyState === "READY" || deployment.readyState === "ERROR" || deployment.readyState === "CANCELED") {
      return deployment;
    }
    
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Vercel deployment timed out after ${maxWaitMs}ms`);
}

export async function createDeploymentJob(websiteId: string): Promise<string> {
  const job = await createJob("deploy_website", { metadata: { websiteId } });
  return job.id;
}

export async function getDeploymentStatus(deploymentId: string): Promise<{
  status: string;
  liveUrl?: string;
  error?: string;
}> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("deployments")
    .select("status, live_url, created_at")
    .eq("id", deploymentId)
    .single();

  if (error || !data) {
    return { status: "not_found" };
  }

  return {
    status: data.status,
    liveUrl: data.live_url,
  };
}