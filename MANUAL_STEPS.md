# MANUAL STEPS REQUIRED

## 1. Fix Supabase Permissions (REQUIRED)

**Run this in Supabase Dashboard → SQL Editor:**

```sql
-- Grant all privileges on all tables to service_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
```

**File:** `supabase/migrations/003_grant_permissions.sql`

---

## 2. Verify Tables Exist

After running the GRANT, verify the tables are accessible:

```bash
node test-supabase.js
```

Should output: `✅ Supabase connection works` and `✅ Leads table is accessible`

---

## 3. Run Ingestion Pipeline

Once permissions are fixed:

```bash
node ingest-apify-to-supabase.js
```

This will:
1. Create "Coimbatore Restaurant Test" campaign
2. Import 5 real restaurants from Apify dataset `9glAE8H5htfaW7krw`
3. Deduplicate using `placeId` / `source_record_id`
4. Update campaign stats

---

## 4. Run AI Qualification

After ingestion:

```bash
node qualify-leads.js
```

This will:
1. Fetch all `scraped` leads from the campaign
2. Run AI Router (reasoning task) on each
3. Update `ai_score`, `priority`, `status` (qualified/rejected)
4. Persist qualification JSON

---

## 5. Verify Dashboard

Start the dev server and verify dashboard shows real data:

```bash
npm run dev
```

Navigate to `http://localhost:3000` - should show real campaign, lead counts, qualification results.

---

## Files Ready for Execution

- `ingest-apify-to-supabase.js` - Apify → Supabase ingestion
- `qualify-leads.js` - AI qualification (to be created)
- `supabase/migrations/003_grant_permissions.sql` - Fix permissions
- `lib/utils/apify-normalize.ts` - Normalization logic (TypeScript)