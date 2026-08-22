const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const SUPABASE_URL = "https://vumaeodrcxylyrtgpeep.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bWFlb2RyY3h5bHlydGdwZWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIyNjA2OCwiZXhwIjoyMTAyODAyMDY4fQ.tT03G0mSemGQBUH8c6VjXNxFqgFuS0VA9fZdo9Yg_sA";
const VERCEL_TOKEN = "vcp_7Ir1fK3jPx5aHbJMOI3MHoQWH3pwWVKVYW6TNRFXBrLF91e2Kn3hRxVh";
const VERCEL_TEAM_ID = null;

const VERCEL_API = "https://api.vercel.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const LEAD_ID = "d7bd7a69-6cae-42de-80d8-5b519e7f38ce";
const BUSINESS_NAME = "Ganga Restaurant - Indian Restaurants in Coimbatore";
const PROJECT_DIR = "C:\\Users\\Gogul raj A\\vasaw-ai\\generated-websites\\ganga-restaurant-indian-restaurants-in-coimbatore-d7bd7a69";
const PROJECT_NAME = "vasaw-ganga-restaurant-coimbatore";

async function vercelRequest(endpoint, options = {}) {
  const response = await fetch(`${VERCEL_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Vercel API error ${response.status}: ${text}`);
  }
  return response.json();
}

function getFilesToDeploy(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const excludeDirs = ['node_modules', '.next', '.git', '.vercel', 'out'];
  const excludeFiles = ['.DS_Store', 'tsconfig.tsbuildinfo'];
  
  for (const entry of entries) {
    if (excludeDirs.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesToDeploy(fullPath));
    } else if (!excludeFiles.includes(entry.name)) {
      const relativePath = path.relative(PROJECT_DIR, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath);
      files.push({ path: relativePath, content });
    }
  }
  return files;
}

async function createVercelDeployment(projectId, files) {
  // Create a deployment with file uploads
  const formData = new FormData();
  
  // Add files
  for (const file of files) {
    const blob = new Blob([file.content]);
    formData.append('files[]', blob, file.path);
  }
  
  // Deployment configuration
  formData.append('deployment', JSON.stringify({
    name: PROJECT_NAME,
    project: projectId,
    target: 'production',
  }));
  
  const response = await fetch(`${VERCEL_API}/v13/deployments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Vercel deployment creation failed ${response.status}: ${text}`);
  }
  
  return response.json();
}

async function waitForVercelDeployment(deploymentId, maxWaitMs = 300000) {
  const startTime = Date.now();
  const pollIntervalMs = 10000;

  while (Date.now() - startTime < maxWaitMs) {
    const deployment = await vercelRequest(`/v13/deployments/${deploymentId}`);
    
    console.log(`Deployment status: ${deployment.readyState}`);
    
    if (deployment.readyState === "READY" || deployment.readyState === "ERROR" || deployment.readyState === "CANCELED") {
      return deployment;
    }
    
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Vercel deployment timed out after ${maxWaitMs}ms`);
}

async function main() {
  const startTime = Date.now();
  console.log("=== VASAW AI Deployment (Direct to Vercel) ===");
  console.log("Lead:", LEAD_ID);
  console.log("Business:", BUSINESS_NAME);
  console.log("Project:", PROJECT_DIR);
  
  try {
    // 1. Create website record in Supabase
    console.log("\n--- Creating website record ---");
    const websiteId = crypto.randomUUID();
    const { error: websiteError } = await supabase.from("websites").insert({
      id: websiteId,
      lead_id: LEAD_ID,
      business_name: BUSINESS_NAME,
      category: "Restaurant",
      location: "Coimbatore",
      status: "built",
      template: "Restaurant Pro",
      pages: 1,
      sections: 7,
      build_progress: 100,
      created_at: new Date().toISOString(),
      built_at: new Date().toISOString(),
    });
    
    if (websiteError) throw new Error(`Failed to create website: ${websiteError.message}`);
    console.log("Website created:", websiteId);
    
    // Update lead status
    await supabase.from("leads").update({
      website_status: "built",
      deployment_status: "deploying",
      updated_at: new Date().toISOString(),
    }).eq("id", LEAD_ID);
    
    // 2. Create Vercel project
    console.log("\n--- Creating Vercel project ---");
    const vercelProject = await vercelRequest("/v9/projects", {
      method: "POST",
      body: JSON.stringify({
        name: PROJECT_NAME,
        framework: "nextjs",
      }),
    });
    console.log("Vercel project created:", vercelProject.id);
    
    // 3. Get files to deploy
    console.log("\n--- Preparing files for deployment ---");
    const files = getFilesToDeploy(PROJECT_DIR);
    console.log(`Files to deploy: ${files.length}`);
    
    // 4. Deploy to Vercel (direct file upload)
    console.log("\n--- Deploying to Vercel ---");
    const deployment = await createVercelDeployment(vercelProject.id, files);
    console.log("Deployment created:", deployment.id);
    
    // 5. Wait for deployment
    console.log("\n--- Waiting for deployment ---");
    const finalDeployment = await waitForVercelDeployment(deployment.id);
    
    if (finalDeployment.readyState !== "READY") {
      throw new Error(`Vercel deployment failed: ${finalDeployment.readyState}`);
    }
    
    const liveUrl = `https://${finalDeployment.url}`;
    console.log("Deployment successful! Live URL:", liveUrl);
    
    // 6. Verify live URL
    console.log("\n--- Verifying live URL ---");
    const verifyResponse = await fetch(liveUrl);
    if (!verifyResponse.ok) {
      throw new Error(`Live URL verification failed: ${verifyResponse.status}`);
    }
    const html = await verifyResponse.text();
    if (!html.includes(BUSINESS_NAME)) {
      throw new Error("Business name not found in deployed page");
    }
    console.log("Live URL verified successfully!");
    
    // 7. Record deployment in Supabase
    console.log("\n--- Recording deployment ---");
    const deploymentId = `dep-${websiteId}-${Date.now()}`;
    await supabase.from("deployments").insert({
      id: deploymentId,
      website_id: websiteId,
      lead_id: LEAD_ID,
      business_name: BUSINESS_NAME,
      status: "deployed",
      provider: "vercel",
      environment: "production",
      live_url: liveUrl,
      commit_hash: finalDeployment.meta?.githubCommitSha || "direct-deploy",
      duration_sec: Math.floor((Date.now() - startTime) / 1000),
      deployed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    
    await supabase.from("websites").update({
      status: "deployed",
      live_url: liveUrl,
      repo_url: null, // No GitHub repo
      commit_hash: "direct-deploy",
      updated_at: new Date().toISOString(),
    }).eq("id", websiteId);
    
    await supabase.from("leads").update({
      deployment_status: "deployed",
      website_status: "deployed",
      updated_at: new Date().toISOString(),
    }).eq("id", LEAD_ID);
    
    await supabase.from("activities").insert({
      lead_id: LEAD_ID,
      actor: "deployment-agent",
      type: "deployment",
      status: "success",
      title: "Website deployed",
      description: `${BUSINESS_NAME} deployed to ${liveUrl}`,
    });
    
    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("Website ID:", websiteId);
    console.log("Vercel Project:", vercelProject.id);
    console.log("Live URL:", liveUrl);
    console.log("Deployment ID:", deploymentId);
    console.log("Duration:", Math.floor((Date.now() - startTime) / 1000), "seconds");
    
  } catch (err) {
    console.error("Deployment failed:", err.message);
    
    // Update lead status to failed
    await supabase.from("leads").update({
      deployment_status: "failed",
      updated_at: new Date().toISOString(),
    }).eq("id", LEAD_ID);
    
    process.exit(1);
  }
}

main();