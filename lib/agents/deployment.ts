/**
 * Deployment Agent
 * 
 * Deploys generated websites to dedicated GitHub repositories and Vercel projects.
 * One website = one GitHub repo = one Vercel project.
 * Does NOT deploy to the main VASAW AI project.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
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
    } else {
      githubRepo = await githubRequest<GitHubRepoResponse>("/user/repos", {
        method: "POST",
        body: JSON.stringify({
          name: repoName,
          description: `VASAW AI generated website for ${website.business_name}`,
          private: true,
          auto_init: false,
        }),
      });

      // Push website code to the repo
      commitHash = await pushWebsiteToGitHub(githubRepo.clone_url, websiteId);
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
            repo: `vasaw-ai/${repoName}`,
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
            repo: `vasaw-ai/${repoName}`,
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