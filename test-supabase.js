require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error("❌ SUPABASE_URL is missing");
  process.exit(1);
}

if (!secretKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function main() {
  console.log("Testing Supabase server connection...");

  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .limit(1);

  if (error) {
    console.error("❌ Supabase FAILED");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    process.exit(1);
  }

  console.log("✅ Supabase connection works");
  console.log("✅ Leads table is accessible");
  console.log("Rows returned:", data.length);
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error.message);
  process.exit(1);
});