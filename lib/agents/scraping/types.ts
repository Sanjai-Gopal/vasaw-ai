export interface Lead {
  id: string;
  externalId?: string;
  businessName: string;
  category: string;
  phone: string;
  website: string | null;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  socialLinks: string[];
  source: string;
  scrapedAt: string;
}

export interface ScrapingRequest {
  campaignId: string;
  category: string;
  location: string;
  limit: number;
  offset?: number;
  excludeExternalIds?: string[];
  minimumRating?: number;
  minimumReviews?: number;
  mode: "mock" | "apify";
}

export interface ScrapingResponse {
  success: boolean;
  agent: "scraping";
  mode: "mock" | "apify";
  count: number;
  leads: Lead[];
  error?: string;
}

export interface ScrapingProvider {
  scrape(request: ScrapingRequest): Promise<Lead[]>;
}

export interface RawRecord {
  business_name?: string | null;
  title?: string | null;
  name?: string | null;
  businessName?: string | null;
  category?: string | null;
  categoryName?: string | null;
  sub_category?: string | null;
  subCategory?: string | null;
  phone?: string | null;
  phone_raw?: string | null;
  phoneUnformatted?: string | null;
  phone_number?: string | null;
  website?: string | null;
  site?: string | null;
  url?: string | null;
  address?: string | null;
  full_address?: string | null;
  location?: string | null;
  street_address?: string | null;
  city?: string | null;
  location_city?: string | null;
  rating?: number | null;
  totalScore?: number | null;
  stars?: number | null;
  reviews?: number | null;
  reviewsCount?: number | null;
  review_count?: number | null;
  scraped_at?: string | null;
  scrapedAt?: string | null;
  created_at?: string | null;
  place_id?: string | null;
  placeId?: string | null;
  fid?: string | null;
  cid?: string | null;
  social_links?: string[] | null;
  socialLinks?: string[] | null;
  social?: string[] | null;
  [key: string]: unknown;
}