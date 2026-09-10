import { Lead, RawRecord } from "./types";
import { randomUUID } from "crypto";

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

function safeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => safeString(v))
      .filter((v) => v.length > 0);
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value)
      .map((v) => safeString(v))
      .filter((v) => v.length > 0);
  }
  return [];
}

function extractCityFromAddress(address: string): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return parts[0] || "";
}

export interface NormalizeOptions {
  source_mode?: "mock" | "live";
  campaignLocation?: string;
  normalizedLocation?: string;
}

export function normalizeRecord(raw: RawRecord, source: string, options?: NormalizeOptions): Lead {
  const businessName = safeString(
    raw.business_name ?? raw.title ?? raw.name ?? raw.businessName
  );

  const category = safeString(
    raw.category ?? raw.categoryName ?? raw.sub_category ?? raw.subCategory
  );

  const phone = safeString(
    raw.phone ?? raw.phone_raw ?? raw.phoneUnformatted ?? raw.phone_number
  );

  const website = raw.website ?? raw.site ?? raw.url ?? null;
  const websiteStr = website ? safeString(website) : null;

  const address = safeString(
    raw.address ?? raw.full_address ?? raw.location ?? raw.street_address
  );

  const city = safeString(
    raw.city ?? raw.location_city ?? extractCityFromAddress(address)
  );

  const rating = safeNumber(raw.rating ?? raw.totalScore ?? raw.stars);
  const reviewCount = safeNumber(raw.reviews ?? raw.reviewsCount ?? raw.review_count);

  const socialLinks = safeArray(raw.social_links ?? raw.socialLinks ?? raw.social);

  const scrapedAt = safeString(
    raw.scraped_at ?? raw.scrapedAt ?? raw.created_at ?? new Date().toISOString()
  );

  const externalId = safeString(
    raw.place_id ?? raw.placeId ?? raw.id ?? raw.fid ?? raw.cid
  );

  const isMock = options?.source_mode ? options.source_mode === "mock" : source.toLowerCase().includes("mock");
  const source_mode: "mock" | "live" = isMock ? "mock" : "live";
  const is_synthetic = isMock;

  const campaignLoc = options?.campaignLocation?.trim();
  const normalizedLoc = options?.normalizedLocation || (!campaignLoc || ["worldwide", "global", "worldwide (global)", "all"].includes(campaignLoc.toLowerCase())
    ? "Worldwide (Global)"
    : campaignLoc);

  return {
    id: randomUUID(),
    externalId: externalId || undefined,
    businessName: businessName || "Unknown Business",
    category: category || "Unknown",
    phone,
    website: websiteStr,
    address: address || "Unknown Address",
    city: city || "Unknown City",
    rating: Math.max(0, Math.min(5, rating)),
    reviewCount: Math.max(0, reviewCount),
    socialLinks,
    source,
    scrapedAt,
    source_mode,
    is_synthetic,
    campaignLocation: campaignLoc || normalizedLoc,
    normalizedLocation: normalizedLoc,
  };
}

export function normalizeRecords(records: RawRecord[], source: string, options?: NormalizeOptions): Lead[] {
  return records.map((record) => normalizeRecord(record, source, options));
}