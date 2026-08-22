require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secretKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const CAMPAIGN_ID = "dceb2ac8-473d-40df-b8b3-baef9d11acaf";

const QUALIFICATION_PROMPT = `You are a business qualification analyst for VASAW AI. 
Your task is to evaluate a local business lead and determine if they are a good candidate for website building services.

Evaluate ONLY the data provided. Do NOT invent or assume:
- Financial information
- Owner interviews or private business data
- Search volume or ad spend
- Information not explicitly in the data

Score factors to consider:
1. Website existence (no website = high opportunity)
2. Website quality (if exists, is it outdated/poor?)
3. Rating (4.5+ = strong reputation)
4. Review count (100+ = established, 50-99 = growing, <50 = new)
5. Social presence (WhatsApp, Instagram, Facebook)
6. Category (restaurant, salon, gym, clinic = high website need)
7. Online visibility (reviews, ratings, photos)
8. Website opportunity (does the business type benefit from a website?)

Output structured JSON only:
{
  "score": 0-100,
  "priority": "high" | "medium" | "low",
  "websiteOpportunity": boolean,
  "reason": "One sentence summary",
  "confidence": 0.0-1.0,
  "factors": ["factor1", "factor2", ...]
}`;

async function qualifyLead(lead) {
  const businessData = {
    businessName: lead.business_name,
    category: lead.category,
    location: lead.location,
    rating: lead.rating,
    reviews: lead.reviews,
    website: lead.website,
    phone: lead.phone,
    email: lead.email,
    scraped: lead.qualification_json,
  };

  const { routeRequest } = await import("./lib/ai/index.ts");

  const response = await routeRequest({
    messages: [
      { role: "system", content: QUALIFICATION_PROMPT },
      { role: "user", content: JSON.stringify(businessData, null, 2) },
    ],
    task: "reasoning",
    temperature: 0.3,
    maxTokens: 1024,
  });

  if (!response.response.success || !response.response.content) {
    throw new Error(`AI qualification failed: ${response.response.errorMessage}`);
  }

  try {
    return JSON.parse(response.response.content);
  } catch {
    throw new Error("Failed to parse AI qualification response");
  }
}

async function main() {
  try {
    console.log("=== REAL AI QUALIFICATION ===\n");

    console.log("Campaign:", CAMPAIGN_ID);

    // Fetch scraped leads
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("campaign_id", CAMPAIGN_ID)
      .eq("status", "scraped");

    if (leadsError) throw leadsError;

    console.log(`Found ${leads.length} scraped leads to qualify\n`);

    let qualified = 0;
    let rejected = 0;
    let errors = 0;

    for (const lead of leads) {
      try {
        console.log(`Qualifying: ${lead.business_name}...`);

        const qualification = await qualifyLead(lead);

        // Validate result
        if (
          typeof qualification.score !== "number" ||
          !["high", "medium", "low"].includes(qualification.priority) ||
          typeof qualification.websiteOpportunity !== "boolean"
        ) {
          throw new Error("Invalid qualification result structure");
        }

        const newStatus = qualification.score >= 50 && qualification.websiteOpportunity ? "qualified" : "rejected";

        // Update lead
        await supabase
          .from("leads")
          .update({
            status: newStatus,
            ai_score: qualification.score,
            priority: qualification.priority,
            ai_score_json: qualification,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lead.id);

        // Log activity
        await supabase.from("activities").insert({
          lead_id: lead.id,
          campaign_id: CAMPAIGN_ID,
          actor: "checking-agent",
          type: "lead",
          status: newStatus === "qualified" ? "success" : "info",
          title: newStatus === "qualified" ? "Lead qualified" : "Lead rejected",
          description: `Score: ${qualification.score}/100, Priority: ${qualification.priority}, Reason: ${qualification.reason}`,
        });

        console.log(`  → ${newStatus.toUpperCase()} (score: ${qualification.score}, priority: ${qualification.priority})`);
        console.log(`  Reason: ${qualification.reason}`);
        console.log(`  Factors: ${qualification.factors.join(", ")}`);

        if (newStatus === "qualified") qualified++;
        else rejected++;

      } catch (err) {
        console.error(`  ❌ Error qualifying ${lead.business_name}:`, err.message);
        errors++;
      }
    }

    // Update campaign progress
    await supabase
      .from("campaigns")
      .update({
        leads_qualified: qualified,
        progress: 60,
        updated_at: new Date().toISOString(),
      })
      .eq("id", CAMPAIGN_ID);

    console.log("\n=== QUALIFICATION COMPLETE ===");
    console.log(`Qualified: ${qualified}`);
    console.log(`Rejected: ${rejected}`);
    console.log(`Errors: ${errors}`);

  } catch (err) {
    console.error("❌ Qualification failed:", err.message);
    process.exit(1);
  }
}

main();