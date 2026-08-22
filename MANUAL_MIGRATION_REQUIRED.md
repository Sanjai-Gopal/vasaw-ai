# MANUAL MIGRATION REQUIRED

## Run this in Supabase Dashboard → SQL Editor

```sql
-- Function: upsert_lead
-- Idempotent upsert for leads with deduplication
-- Priority: phone > normalized_website > source/place_id > normalized_name+address
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
  -- Normalize phone (remove non-digits)
  normalized_phone := regexp_replace(p_phone, '\D', '', 'g');
  
  -- Normalize website (lowercase, remove protocol/www)
  normalized_website := CASE
    WHEN p_website IS NOT NULL AND p_website != '' THEN
      lower(regexp_replace(p_website, '^https?://(www\.)?', ''))
    ELSE NULL
  END;
  
  -- Normalize business name (lowercase, trim)
  normalized_name := lower(trim(p_business_name));

  -- Try to find existing lead by phone (highest priority)
  IF normalized_phone != '' THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE regexp_replace(phone, '\D', '', 'g') = normalized_phone
    LIMIT 1;
  END IF;

  -- Try by normalized website
  IF lead_id IS NULL AND normalized_website IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE lower(regexp_replace(website, '^https?://(www\.)?', '')) = normalized_website
    LIMIT 1;
  END IF;

  -- Try by source record ID
  IF lead_id IS NULL AND p_source_record_id IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE source_record_id = p_source_record_id
    LIMIT 1;
  END IF;

  -- Try by normalized name + address
  IF lead_id IS NULL AND p_address IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE lower(trim(business_name)) = normalized_name
      AND lower(address) = lower(p_address)
    LIMIT 1;
  END IF;

  -- Upsert
  IF lead_id IS NOT NULL THEN
    -- Update existing
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
    -- Insert new
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

  -- Log activity
  INSERT INTO activities (lead_id, campaign_id, actor, type, status, title, description)
  VALUES (lead_id, p_campaign_id, 'storage-agent', 'lead', 'info', 'Lead upserted', format('Lead %s upserted from %s', p_business_name, p_source));

  RETURN lead_id;
END;
$$;
```

---

After running this, re-run:
```bash
node ingest-apify-to-supabase.js
```