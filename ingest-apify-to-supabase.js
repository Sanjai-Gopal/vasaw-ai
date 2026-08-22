require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const { ApifyClient } = require("apify-client");

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apifyToken = process.env.APIFY_API_TOKEN;
const apifyActorId = process.env.APIFY_ACTOR_ID;

if (!url || !secretKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}
if (!apifyToken || !apifyActorId) {
  console.error("❌ Missing Apify credentials");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const apify = new ApifyClient({ token: apifyToken });

// Use the already verified dataset from user's instructions
const VERIFIED_RUN_ID = "hFxummKBC8un9wjAO";
const VERIFIED_DATASET_ID = "9glAE8H5htfaW7krw";

const CAMPAIGN = {
  name: "Coimbatore Restaurant Test",
  category: "Restaurant",
  location: "Coimbatore",
  lead_target: 5,
  minimum_rating: 4.0,
  minimum_reviews: 25,
  website_opportunity_requirement: true,
  social_presence_requirement: false,
  automation_mode: "manual",
  status: "active",
};

function normalizePhone(phone) {
  return phone?.replace(/\D/g, "") || "";
}

function normalizeWebsite(website) {
  if (!website) return null;
  return website.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
}

function normalizeName(name) {
  return name?.toLowerCase().trim() || "";
}

function extractServices(additionalInfo) {
  const services = [];
  if (!additionalInfo) return services;
  for (const [key, value] of Object.entries(additionalInfo)) {
    if (value === true) {
      services.push(key);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item === true) {
          services.push(key);
        } else if (typeof item === "object" && item !== null) {
          const trueKey = Object.keys(item).find(k => item[k] === true);
          if (trueKey) services.push(trueKey);
        }
      }
    } else if (typeof value === "object" && value !== null) {
      const trueKey = Object.keys(value).find(k => value[k] === true);
      if (trueKey) services.push(trueKey);
    }
  }
  return services;
}

function normalizeApifyRecord(record, campaignId, apifyRunId, apifyDatasetId) {
  const phone = record.phoneUnformatted || record.phone || null;
  const website = record.website || null;
  const rating = record.totalScore || 0;
  const reviews = record.reviewsCount || 0;
  const hasWebsite = !!website;
  const websiteQuality = hasWebsite ? 50 : 0;
  const hasWhatsApp = !!phone;
  const hasReviews = reviews > 0;

  let responseLikelihood = "low";
  if (reviews >= 100 && rating >= 4.5) responseLikelihood = "high";
  else if (reviews >= 50 && rating >= 4.0) responseLikelihood = "medium";

  const reasons = [];
  if (!hasWebsite) reasons.push("No website despite online presence");
  if (reviews >= 100) reasons.push("High review volume indicates strong reputation");
  if (rating >= 4.5) reasons.push("Excellent customer rating");
  if (reviews < 50 && rating >= 4.0) reasons.push("Strong rating with room to grow review base");

  const baseScore = Math.round(rating * 10 + Math.min(reviews / 10, 20) + (hasWebsite ? 10 : 20));
  const score = Math.max(0, Math.min(100, baseScore));
  const priority = score >= 75 ? "high" : score >= 50 ? "medium" : "low";

  const openingHoursStr = record.openingHours
    ?.map((oh) => `${oh.day}: ${oh.hours}`)
    .join("; ") || "";

  const services = extractServices(record.additionalInfo);

  const locationParts = [record.street, record.city, record.state, record.postalCode, record.countryCode]
    .filter(Boolean)
    .join(", ");

  const normalizedPhone = normalizePhone(phone);
  const normalizedWebsite = normalizeWebsite(website);
  const normalizedBusinessName = normalizeName(record.title);
  const normalizedAddress = normalizeName(locationParts);

  return {
    businessName: record.title,
    category: record.categoryName,
    location: record.city,
    rating,
    reviews,
    website,
    phone: phone || "",
    email: null,
    aiScore: score,
    priority,
    status: "scraped",
    scraped: {
      address: locationParts,
      phone: phone || "",
      email: null,
      rating,
      reviews,
      category: record.categoryName,
      subCategory: record.categories.join(", ") || "",
      hours: openingHoursStr,
      services,
      source: "Google Maps",
      scrapedAt: record.scrapedAt,
    },
    qualification: {
      hasWebsite,
      websiteQuality,
      hasWhatsApp,
      hasReviews,
      responseLikelihood,
      notes: `Business identified from Google Maps with ${reviews} reviews, rating ${rating}/5`,
    },
    opportunity: {
      score,
      priority,
      reasons,
      estimatedValue: Math.max(5000, Math.min(50000, rating * 5000 + reviews * 100)),
    },
    _dedupe: {
      placeId: record.placeId,
      normalizedPhone,
      normalizedWebsite,
      normalizedName: normalizedBusinessName,
      normalizedAddress,
    },
    _source: {
      apifyRunId,
      apifyDatasetId,
      sourceRecordId: record.placeId ? `gmaps-${record.placeId}` : `gmaps-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      rawData: record,
    },
  };
}

function toSupabaseLead(lead, campaignId) {
  return {
    campaign_id: campaignId,
    business_name: lead.businessName,
    category: lead.category,
    location: lead.location,
    rating: lead.rating,
    reviews: lead.reviews,
    phone: lead.phone,
    email: lead.email,
    website: lead.website,
    ai_score: lead.aiScore,
    priority: lead.priority,
    status: lead.status,
    source: lead.scraped.source,
    source_record_id: lead._source.sourceRecordId,
    apify_run_id: lead._source.apifyRunId,
    apify_dataset_id: lead._source.apifyDatasetId,
    ai_score_json: {
      score: lead.opportunity.score,
      priority: lead.opportunity.priority,
      websiteOpportunity: !lead.website,
      confidence: 0.8,
      factors: lead.opportunity.reasons,
      reason: lead.opportunity.reasons.join("; "),
    },
    qualification_json: {
      hasWebsite: lead.qualification.hasWebsite,
      websiteQuality: lead.qualification.websiteQuality,
      hasWhatsApp: lead.qualification.hasWhatsApp,
      hasReviews: lead.qualification.hasReviews,
      responseLikelihood: lead.qualification.responseLikelihood,
      notes: lead.qualification.notes,
    },
    opportunity_json: {
      score: lead.opportunity.score,
      priority: lead.opportunity.priority,
      websiteOpportunity: !lead.website,
      confidence: 0.8,
      factors: lead.opportunity.reasons,
      reason: lead.opportunity.reasons.join("; "),
    },
    website_status: "not_started",
    quality_status: "not_started",
    deployment_status: "not_started",
    outreach_status: "not_ready",
    updated_at: new Date().toISOString(),
  };
}

async function createCampaign() {
  console.log("Creating/fetching test campaign...");
  const { data, error } = await supabase
    .from("campaigns")
    .insert(CAMPAIGN)
    .select()
    .single();

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate")) {
      const { data: existing } = await supabase
        .from("campaigns")
        .select()
        .eq("name", CAMPAIGN.name)
        .single();
      if (existing) {
        console.log("Campaign already exists:", existing.id);
        return existing.id;
      }
    }
    throw error;
  }
  console.log("Campaign created:", data.id);
  return data.id;
}

async function fetchApifyDataset(datasetId) {
  console.log(`Fetching dataset ${datasetId}...`);
  const { items } = await apify.dataset(datasetId).listItems({ limit: 10 });
  console.log(`Retrieved ${items.length} records`);
  return items;
}

async function findExistingLead(lead) {
  // Priority 1: placeId / source_record_id
  if (lead._dedupe.placeId) {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .eq("source_record_id", `gmaps-${lead._dedupe.placeId}`)
      .limit(1)
      .single();
    if (data) return data.id;
  }

  // Priority 2: normalized phone
  if (lead._dedupe.normalizedPhone) {
    const { data } = await supabase
      .from("leads")
      .select("id, phone")
      .limit(50);
    if (data) {
      for (const existing of data) {
        if (normalizePhone(existing.phone) === lead._dedupe.normalizedPhone) {
          return existing.id;
        }
      }
    }
  }

  // Priority 3: normalized website
  if (lead._dedupe.normalizedWebsite) {
    const { data } = await supabase
      .from("leads")
      .select("id, website")
      .limit(50);
    if (data) {
      for (const existing of data) {
        if (normalizeWebsite(existing.website) === lead._dedupe.normalizedWebsite) {
          return existing.id;
        }
      }
    }
  }

  // Priority 4: normalized name + address
  const { data: byName } = await supabase
    .from("leads")
    .select("id, business_name, address")
    .ilike("business_name", lead.businessName)
    .limit(10);
  if (byName) {
    for (const existing of byName) {
      if (normalizeName(existing.business_name) === lead._dedupe.normalizedName &&
          normalizeName(existing.address) === lead._dedupe.normalizedAddress) {
        return existing.id;
      }
    }
  }

  return null;
}

async function importLeads(campaignId, records, apifyRunId, apifyDatasetId) {
  console.log(`\nImporting ${records.length} leads with JS-side deduplication...`);
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const lead = normalizeApifyRecord(record, campaignId, apifyRunId, apifyDatasetId);
      const supabaseLead = toSupabaseLead(lead, campaignId);

      // Check for existing lead using deduplication logic
      const existingId = await findExistingLead(lead);

      if (existingId) {
        // Update existing
        const { error } = await supabase
          .from("leads")
          .update(supabaseLead)
          .eq("id", existingId);
        if (error) throw error;
        console.log(`  🔄 UPDATED ${lead.businessName} -> ${existingId}`);
        updated++;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("leads")
          .insert(supabaseLead)
          .select("id")
          .single();
        if (error) throw error;
        console.log(`  ✅ INSERTED ${lead.businessName} -> ${data.id}`);
        inserted++;

        // Log activity
        await supabase.from("activities").insert({
          lead_id: data.id,
          campaign_id: campaignId,
          actor: "storage-agent",
          type: "lead",
          status: "info",
          title: "Lead created",
          description: `${lead.businessName} created from ${lead.scraped.source}`,
        });
      }
    } catch (err) {
      console.error(`  ❌ Error processing ${record.title}:`, err.message);
      errors++;
    }
  }

  console.log(`\nImport complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);
  return { inserted, updated, errors };
}

async function updateCampaignStats(campaignId, totalLeads) {
  const { data: qualified } = await supabase
    .from("leads")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("status", "qualified");

  await supabase
    .from("campaigns")
    .update({
      leads_collected: totalLeads,
      leads_qualified: qualified?.length || 0,
      progress: 40,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);
}

async function main() {
  try {
    console.log("=== REAL APIFY → SUPABASE INGESTION (JS-side dedupe) ===");
    console.log("Verified Run ID:", VERIFIED_RUN_ID);
    console.log("Verified Dataset ID:", VERIFIED_DATASET_ID);
    console.log("");

    const campaignId = await createCampaign();
    const records = await fetchApifyDataset(VERIFIED_DATASET_ID);
    const result = await importLeads(campaignId, records, VERIFIED_RUN_ID, VERIFIED_DATASET_ID);
    await updateCampaignStats(campaignId, result.inserted + result.updated);

    console.log("\n=== INGESTION COMPLETE ===");
    console.log("Campaign ID:", campaignId);
    console.log("Total imported:", result.inserted + result.updated);
    console.log("Run ID:", VERIFIED_RUN_ID);
    console.log("Dataset ID:", VERIFIED_DATASET_ID);
  } catch (err) {
    console.error("❌ Ingestion failed:", err.message);
    process.exit(1);
  }
}

main();