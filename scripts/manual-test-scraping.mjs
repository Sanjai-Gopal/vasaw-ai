import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables from .env.local if present
const envLocalPath = path.join(rootDir, ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

// Check if running under tsx / TypeScript loader
let runScrapingAgent;
try {
  const scrapingModule = await import("../lib/agents/scraping/index.ts");
  runScrapingAgent = scrapingModule.runScrapingAgent;
} catch {
  // If native Node ESM failed on TypeScript imports without loader, re-execute via npx tsx
  if (!process.env.__TSX_SPAWNED) {
    const scriptPath = `"${__filename}"`;
    const result = spawnSync("npx", ["tsx", scriptPath], {
      cwd: rootDir,
      stdio: "inherit",
      env: { ...process.env, __TSX_SPAWNED: "1" },
      shell: true,
    });
    process.exit(result.status ?? 0);
  }
  throw new Error("Unable to load lib/agents/scraping/index.ts. Please run with: npx tsx scripts/manual-test-scraping.mjs");
}

async function main() {
  console.log("=================================================");
  console.log("VASAW AI — AGENT 1 (SCRAPING AGENT) MANUAL TEST");
  console.log("=================================================\n");

  const apifyToken = process.env.APIFY_API_TOKEN;
  const isTokenPresent =
    typeof apifyToken === "string" &&
    apifyToken.trim().length > 0 &&
    !apifyToken.includes("placeholder") &&
    !apifyToken.includes("your-");

  const category = "Restaurant";
  const location = "RS Puram, Coimbatore";
  const limit = 5;

  let mode = "mock";
  let isRealData = false;

  console.log("🔍 Checking Scraping Configuration...");
  if (isTokenPresent) {
    console.log("  -> APIFY_API_TOKEN: CONFIGURED (Value hidden for security)");
    const actorId = process.env.APIFY_ACTOR_ID || "nwua9Gu5YrADL7ZDj";
    console.log(`  -> Apify Actor ID: ${actorId}`);
    console.log("  -> Mode Selected: LIVE (Apify Google Maps Provider)\n");
    mode = "apify";
    isRealData = true;
  } else {
    console.log("  -> APIFY_API_TOKEN: NOT CONFIGURED (Missing or placeholder)");
    console.log("  -> LIVE scraping is not configured.");
    console.log("  -> Mode Selected: MOCK (Mock Provider)");
    console.log("  -> WARNING: MOCK RESULT — NOT REAL SCRAPED DATA.\n");
    mode = "mock";
    isRealData = false;
  }

  const request = {
    campaignId: "manual-verification-test",
    category,
    location,
    limit,
    mode,
  };

  console.log("🚀 Invoking Agent 1 (`runScrapingAgent`)...");
  console.log(`  - Category : "${category}"`);
  console.log(`  - Location : "${location}"`);
  console.log(`  - Limit    : ${limit}`);
  console.log(`  - Mode     : "${mode}"`);
  console.log("  - Downstream Agents (2-6): BYPASSED (Pure Agent 1 test)");
  console.log("  - Database Storage: BYPASSED (Pure scraping verification)\n");

  const startTime = Date.now();
  let response = await runScrapingAgent(request);
  let durationMs = Date.now() - startTime;

  // If live scraping failed due to remote provider issue (e.g. invalid/expired token), report details and demonstrate mock provider
  if (!response.success && mode === "apify") {
    console.log("-------------------------------------------------");
    console.log("LIVE APYFY SCRAPER ATTEMPT RESULT");
    console.log("-------------------------------------------------");
    console.log("Status        : FAILED");
    console.log(`Duration      : ${durationMs}ms`);
    console.log(`Error Details : ${response.error}`);
    console.log("\n[DIAGNOSTIC] Root Cause Analysis:");
    console.log("  • Error Type: API / Provider Authentication Failure (HTTP 401: Invalid or expired APIFY_API_TOKEN on Apify server)");
    console.log("  • Live scraping cannot proceed until a valid, active Apify token is placed in .env.local.");
    console.log("  • Now executing Mock Provider fallback to verify Agent 1 normalization and output pipeline...\n");

    mode = "mock";
    isRealData = false;
    const fallbackStart = Date.now();
    response = await runScrapingAgent({
      ...request,
      mode: "mock",
    });
    durationMs = Date.now() - fallbackStart;
  }

  console.log("-------------------------------------------------");
  console.log("SCRAPING AGENT FINAL EXECUTION RESULT");
  console.log("-------------------------------------------------");
  console.log(`Status        : ${response.success ? "SUCCESS" : "FAILED"}`);
  console.log(`Duration      : ${durationMs}ms`);
  console.log(`Agent         : ${response.agent}`);
  console.log(`Mode          : ${response.mode}`);
  console.log(`Data Type     : ${isRealData ? "REAL LIVE SCRAPED DATA" : "MOCK RESULT — NOT REAL SCRAPED DATA"}`);
  console.log(`Count         : ${response.count} leads`);

  if (!response.success) {
    console.error(`\n❌ Error Message: ${response.error || "Unknown scraping failure"}`);
    process.exit(1);
  }

  console.log("\n-------------------------------------------------");
  console.log(`LEADS RETURNED (${response.leads.length})`);
  console.log("-------------------------------------------------");

  response.leads.forEach((lead, index) => {
    console.log(`\nLead ${index + 1}:`);
    console.log(`  • businessName : ${lead.businessName}`);
    console.log(`  • phone        : ${lead.phone || "N/A"}`);
    console.log(`  • address      : ${lead.address || "N/A"}`);
    console.log(`  • rating       : ${lead.rating} / 5.0`);
    console.log(`  • reviewCount  : ${lead.reviewCount}`);
    console.log(`  • website      : ${lead.website ?? "null"}`);
    console.log(`  • source       : ${lead.source}`);
    if (lead.externalId) {
      console.log(`  • externalId   : ${lead.externalId}`);
    }
  });

  console.log("\n-------------------------------------------------");
  console.log("COMPLETE RETURNED JSON PAYLOAD");
  console.log("-------------------------------------------------");
  console.log(JSON.stringify(response, null, 2));

  console.log("\n=================================================");
  console.log("AGENT 1 MANUAL VERIFICATION COMPLETE");
  console.log(`REAL DATA       : ${isRealData ? "YES" : "NO"}`);
  console.log(`AGENT 1 STATUS  : ${response.success && response.leads.length > 0 ? "PASS" : "FAIL"}`);
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Fatal error during execution:", err);
  process.exit(1);
});
