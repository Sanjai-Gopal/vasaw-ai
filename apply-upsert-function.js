require("dotenv").config({ path: ".env.local" });

const { Client } = require("pg");

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secretKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

// Parse the Supabase URL to get connection details
// Format: https://<project-ref>.supabase.co
const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error("❌ Could not parse project ref from URL");
  process.exit(1);
}

const pgHost = `db.${projectRef}.supabase.co`;
const pgPort = 5432;
const pgDatabase = "postgres";
const pgUser = "postgres";
const pgPassword = secretKey; // Service role key works as password

console.log("Connecting to Postgres...");
console.log("Host:", pgHost);

const client = new Client({
  host: pgHost,
  port: pgPort,
  database: pgDatabase,
  user: pgUser,
  password: pgPassword,
  ssl: { rejectUnauthorized: false },
});

const upsertLeadFunction = `
CREATE OR REPLACE FUNCTION upsert_lead(
  p_campaign_id UUID,
  p_business_name TEXT,
  p_category TEXT,
  p_location TEXT,
  p_rating NUMERIC,
  p_reviews INTEGER,
  p_phone TEXT,
  p_email TEXT,
  p_website TEXT,
  p_address TEXT,
  p_source TEXT,
  p_source_record_id TEXT,
  p_apify_run_id TEXT,
  p_apify_dataset_id TEXT,
  p_raw_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  lead_id UUID;
  normalized_website TEXT;
  normalized_phone TEXT;
  normalized_name TEXT;
BEGIN
  normalized_phone := regexp_replace(p_phone, '\\D', '', 'g');
  
  normalized_website := CASE
    WHEN p_website IS NOT NULL AND p_website != '' THEN
      lower(regexp_replace(p_website, '^https?://(www\\.)?', ''))
    ELSE NULL
  END;
  
  normalized_name := lower(trim(p_business_name));

  IF normalized_phone != '' THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE regexp_replace(phone, '\\D', '', 'g') = normalized_phone
    LIMIT 1;
  END IF;

  IF lead_id IS NULL AND normalized_website IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE lower(regexp_replace(website, '^https?://(www\\.)?', '')) = normalized_website
    LIMIT 1;
  END IF;

  IF lead_id IS NULL AND p_source_record_id IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE source_record_id = p_source_record_id
    LIMIT 1;
  END IF;

  IF lead_id IS NULL AND p_address IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE lower(trim(business_name)) = normalized_name
      AND lower(address) = lower(p_address)
    LIMIT 1;
  END IF;

  IF lead_id IS NOT NULL THEN
    UPDATE leads
    SET campaign_id = COALESCE(p_campaign_id, campaign_id),
        business_name = p_business_name,
        category = p_category,
        location = p_location,
        rating = p_rating,
        reviews = p_reviews,
        phone = p_phone,
        email = COALESCE(p_email, email),
        website = p_website,
        source = COALESCE(p_source, source),
        source_record_id = COALESCE(p_source_record_id, source_record_id),
        apify_run_id = COALESCE(p_apify_run_id, apify_run_id),
        apify_dataset_id = COALESCE(p_apify_dataset_id, apify_dataset_id),
        updated_at = now()
    WHERE id = lead_id;
  ELSE
    INSERT INTO leads (
      campaign_id, business_name, category, location, rating, reviews,
      phone, email, website, source, source_record_id,
      apify_run_id, apify_dataset_id
    ) VALUES (
      p_campaign_id, p_business_name, p_category, p_location, p_rating, p_reviews,
      p_phone, p_email, p_website, p_source, p_source_record_id,
      p_apify_run_id, p_apify_dataset_id
    )
    RETURNING id INTO lead_id;
  END IF;

  INSERT INTO activities (lead_id, campaign_id, actor, type, status, title, description)
  VALUES (lead_id, p_campaign_id, 'storage-agent', 'lead', 'info', 'Lead upserted', format('Lead %s upserted from %s', p_business_name, p_source));

  RETURN lead_id;
END;
$$;
`;

async function applyFunction() {
  try {
    await client.connect();
    console.log("✅ Connected to Postgres");
    
    console.log("Applying upsert_lead function...");
    await client.query(upsertLeadFunction);
    console.log("✅ Function applied successfully");
    
    // Verify function exists
    const result = await client.query(`
      SELECT proname FROM pg_proc WHERE proname = 'upsert_lead'
    `);
    console.log("✅ Function verified:", result.rows[0]?.proname);
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFunction();