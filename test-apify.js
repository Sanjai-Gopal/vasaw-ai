require("dotenv").config({ path: ".env.local" });

const { ApifyClient } = require("apify-client");

const token = process.env.APIFY_API_TOKEN;
const actorId = process.env.APIFY_ACTOR_ID;

if (!token) {
  console.error("❌ APIFY_API_TOKEN is missing");
  process.exit(1);
}
if (!actorId) {
  console.error("❌ APIFY_ACTOR_ID is missing");
  process.exit(1);
}

const client = new ApifyClient({ token });

async function main() {
  try {
    console.log("=== REAL APIFY TEST ===");
    console.log("Actor ID:", actorId);
    console.log("Token: [REDACTED]\n");

    const input = {
      searchStringsArray: ["restaurants in Coimbatore"],
      maxCrawledPlacesPerSearch: 5,
    };

    console.log("Starting Apify run...");
    const run = await client.actor(actorId).call(input);

    console.log("\n✅ Actor finished");
    console.log("Run ID:", run.id);
    console.log("Status:", run.status);
    console.log("Dataset ID:", run.defaultDatasetId);

    const { items } = await client.dataset(run.defaultDatasetId).listItems({
      limit: 5,
    });

    console.log("\n✅ Dataset retrieved");
    console.log("Records:", items.length);

    console.log("\n===== REAL APIFY DATA (first 2 records) =====");
    for (let i = 0; i < Math.min(2, items.length); i++) {
      const item = items[i];
      console.log(`\n--- Record ${i + 1} ---`);
      console.log("title:", item.title);
      console.log("categoryName:", item.categoryName);
      console.log("address:", item.address);
      console.log("phone:", item.phone);
      console.log("phoneUnformatted:", item.phoneUnformatted);
      console.log("website:", item.website);
      console.log("totalScore:", item.totalScore);
      console.log("reviewsCount:", item.reviewsCount);
      console.log("placeId:", item.placeId);
      console.log("categories:", item.categories);
      console.log("location:", item.location);
      console.log("openingHours:", item.openingHours);
      console.log("additionalInfo keys:", Object.keys(item.additionalInfo || {}));
      console.log("url:", item.url);
      console.log("searchString:", item.searchString);
      console.log("isAdvertisement:", item.isAdvertisement);
      console.log("imageUrl:", item.imageUrl);
    }

    console.log("\n=== TEST PASSED ===");
    console.log("Run ID:", run.id);
    console.log("Dataset ID:", run.defaultDatasetId);
  } catch (error) {
    console.error("\n❌ Apify test failed");
    console.error("Status:", error?.statusCode || error?.status);
    console.error("Message:", error?.message);
    process.exit(1);
  }
}

main();