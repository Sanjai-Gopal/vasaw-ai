import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";
import { createOrGetRepository, pushFiles, scanForSecrets, getAuthenticatedUser } from "@/lib/services/github-service";
import { createProject, createDeployment, waitForDeployment, deployFromFiles } from "@/lib/services/vercel-service";
import { generateWebsiteProject } from "@/lib/services/website-generator";
import * as fs from "fs";
import * as path from "path";

export interface DeploymentResult {
  deploymentId: string;
  websiteId: string;
  githubRepoUrl: string | null;
  vercelProjectId: string;
  liveUrl: string;
  commitHash: string;
  status: "deployed" | "failed";
}

export async function runDeploymentAgent(
  websiteId: string,
  options?: { jobId?: string; forceRedeploy?: boolean }
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

    // Step 1: Create/verify GitHub repository (if token available)
    await updateStep(steps[currentStepIndex++]);
    
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const repoName = `vasaw-${website.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${website.lead_id.slice(0, 8)}`;
    let githubRepoUrl: string | null = null;
    let githubOwner: string | null = null;
    let commitHash = "direct-deploy";

    if (GITHUB_TOKEN && !isDryRun()) {
      try {
        const user = await getAuthenticatedUser(GITHUB_TOKEN);
        githubOwner = user.login;
        const githubRepo = await createOrGetRepository(GITHUB_TOKEN, repoName, `VASAW AI generated website for ${website.business_name}`);
        githubRepoUrl = githubRepo.html_url;
        
        // We'll push files after generating the website
        // commitHash will be obtained from the push
      } catch (err) {
        console.warn("[Deployment] GitHub repo creation failed, falling back to direct deploy:", err);
        githubRepoUrl = null;
        githubOwner = null;
      }
    }

    // Step 2: Generate website project
    await updateStep(steps[currentStepIndex++]);

    const { outputDir } = await generateWebsiteProject({
      templateId: website.template.toLowerCase().replace(/\s+/g, "-"),
      template: getTemplate(website.template),
      businessData: mapWebsiteToBuildInput(website),
      generatedContent: website.generated_content as Record<string, unknown> ?? {},
      leadId: website.lead_id,
    });

    // Step 3: Push to GitHub (if repo was created)
    if (GITHUB_TOKEN && githubRepoUrl && githubOwner && !isDryRun()) {
      await updateStep(steps[currentStepIndex++]);
      
      // Collect all files to push
      const files = collectFilesForDeploy(outputDir);
      
      // Scan for secrets
      const secretScan = await scanForSecrets(files.map(f => ({ path: f.path, content: typeof f.content === 'string' ? f.content : new TextDecoder().decode(f.content) })));
      if (secretScan.hasSecrets) {
        throw new Error(`Secret scan failed: ${secretScan.secrets.map(s => `${s.file}:${s.line}`).join(", ")}`);
      }

      const commit = await pushFiles(GITHUB_TOKEN, githubOwner, repoName, files, "Initial commit: VASAW AI generated website");
      commitHash = commit.sha;
    }

    // Step 4: Create/verify Vercel project
    await updateStep(steps[currentStepIndex++]);

    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN not configured");
    }

    let vercelProject;
    if (isDryRun()) {
      vercelProject = { id: `vercel-${Date.now()}`, name: repoName, framework: "nextjs" };
    } else {
      if (githubRepoUrl && githubOwner) {
        // GitHub-connected deployment
        vercelProject = await createProject(VERCEL_TOKEN, {
          name: repoName,
          framework: "nextjs",
          gitRepository: {
            type: "github",
            repo: `${githubOwner}/${repoName}`,
          },
          teamId: VERCEL_TEAM_ID,
        });
      } else {
        // Direct file deployment
        vercelProject = await createProject(VERCEL_TOKEN, {
          name: repoName,
          framework: "nextjs",
          teamId: VERCEL_TEAM_ID,
        });
      }
    }

    // Step 5: Deploy to Vercel
    await updateStep(steps[currentStepIndex++]);

    let deployment;
    if (isDryRun()) {
      deployment = {
        id: `deployment-${Date.now()}`,
        url: `${repoName}.vercel.app`,
        readyState: "READY",
        meta: { githubCommitSha: commitHash },
        createdAt: Date.now(),
      };
    } else {
      if (githubRepoUrl && githubOwner) {
        deployment = await createDeployment(VERCEL_TOKEN, {
          name: repoName,
          projectId: vercelProject.id,
          gitSource: {
            type: "github",
            repo: `${githubOwner}/${repoName}`,
            ref: "main",
            sha: commitHash,
          },
          target: "production",
          teamId: VERCEL_TEAM_ID,
        });
      } else {
        // Direct file deployment
        const files = collectFilesForDeploy(outputDir);
        deployment = await deployFromFiles(VERCEL_TOKEN, vercelProject.id, files, {
          teamId: VERCEL_TEAM_ID,
          target: "production",
        });
      }
    }

    // Step 6: Wait for deployment to complete
    await updateStep(steps[currentStepIndex++]);

    if (!isDryRun()) {
      deployment = await waitForDeployment(VERCEL_TOKEN, deployment.id, {
        teamId: VERCEL_TEAM_ID,
        maxWaitMs: 300000,
      });
    }

    // Step 7: Verify deployment
    await updateStep(steps[currentStepIndex++]);

    if (deployment.readyState !== "READY") {
      throw new Error(`Vercel deployment failed: ${deployment.readyState}`);
    }

    const liveUrl = `https://${deployment.url}`;

    // Verify live URL
    const verifyResponse = await fetch(liveUrl);
    if (!verifyResponse.ok) {
      throw new Error(`Live URL verification failed: ${verifyResponse.status}`);
    }
    const html = await verifyResponse.text();
    if (!html.includes(website.business_name)) {
      throw new Error("Business name not found in deployed page");
    }

    // Step 8: Record deployment
    await updateStep(steps[currentStepIndex++]);

    if (!isDryRun()) {
      const deploymentId = `dep-${websiteId}-${Date.now()}`;
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
        duration_sec: 0, // Will be calculated
        deployed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      await admin.from("websites").update({
        status: "deployed",
        live_url: liveUrl,
        repo_url: githubRepoUrl,
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
      deploymentId: `dep-${websiteId}-${Date.now()}`,
      websiteId,
      githubRepoUrl,
      vercelProjectId: vercelProject.id,
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
  qualification_json: Record<string, unknown>;
  opportunity_json: Record<string, unknown>;
}

function mapWebsiteToBuildInput(website: WebsiteRecord): import("./website-generator").WebsiteBuildInput {
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

function collectFilesForDeploy(outputDir: string): Array<{ path: string; content: string | Uint8Array }> {
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