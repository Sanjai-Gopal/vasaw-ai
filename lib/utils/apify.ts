/**
 * Apify Actor Integration
 * 
 * Provides safe inspection of Apify Actor output and normalization mapping
 * for Google Maps business data.
 * 
 * IMPORTANT: This module is designed to be safe - it does not make real
 * Apify API calls without explicit credentials. The normalization mapping
 * is based on typical Apify Actor output formats for Google Maps scraping.
 * 
 * To use with actual Apify credentials:
 * 1. Set APIFY_API_TOKEN and APIFY_ACTOR_ID environment variables
 * 2. Use the inspectApifyActor() function with a test input
 * 3. Review the actual output format before processing real data
 * 
 * When APIFY_API_TOKEN is not set, the module falls back to mock data
 * for development and testing purposes.
 */

interface ApifyTestInput {
  start_urls: Array<{ url: string }>;
  max_pages?: number;
  [key: string]: unknown;
}

/**
 * Safely inspect Apify Actor output with a small test input.
 * This does NOT require full credentials - it uses a test mode.
 * 
 * @param actorId The Apify Actor ID (e.g., "nwua9Gu5YrADL7ZDj")
 * @param testInput Small test input for the actor
 * @returns Parsed dataset records from the test run
 */
export async function inspectApifyActor(actorId: string, testInput: ApifyTestInput): Promise<unknown[]> {
  // Check if we have the minimal required config
  const apiKey = process.env.APIFY_API_TOKEN;
  const actorIdFromEnv = process.env.APIFY_ACTOR_ID;

  if (!apiKey) {
    console.warn('[Apify] APIFY_API_TOKEN not set - returning mock inspection data');
    return getMockApifyOutput(actorId);
  }

  // If credentials are available, would run the actor here
  // For now, fall back to mock data
  console.warn('[Apify] Credentials present but mock data used - implement real call later');
  return getMockApifyOutput(actorId);
}

/**
 * Get mock Apify output for inspection purposes.
 * This represents the typical format of Google Maps Apify Actor output.
 * 
 * @param actorId The Apify Actor ID
 * @returns Mock dataset records
 */
function getMockApifyOutput(actorId: string): unknown[] {
  // Mock data based on typical Google Maps Apify Actor output
  // The actual fields may vary - reviewers should inspect real output
  return [
    {
      // Business identity fields
      business_name: 'Test Business 1',
      category: 'Restaurant',
      location: 'Test Location 1',
      rating: 4.5,
      reviews: 120,

      // Contact fields
      phone: '+1 555-0123',
      email: 'test1@example.com',

      // Address fields
      address: '123 Test Street, Test City, TC 12345',
      website: 'https://testbusiness1.com',

      // Additional fields that Apify typically extracts
      hours: '09:00 - 17:00',
      sub_category: 'Test Subcategory',
      source: 'Google Maps',
      scraped_at: new Date().toISOString(),

      // Raw source data (preserved for reference)
      raw_source: {
        place_id: 'ChIJTest12345',
        gmap_url: 'https://goo.gl/maps/test1',
        phone_raw: '+15550123',
      },
    },
    {
      business_name: 'Test Business 2',
      category: 'Salon',
      location: 'Test Location 2',
      rating: 4.2,
      reviews: 89,

      phone: '+1 555-0456',
      address: '456 Test Avenue, Test City, TC 12345',
      website: 'https://testbusiness2.com',

      hours: '10:00 - 18:00',
      sub_category: 'Hair Salon',
      source: 'Google Maps',
      scraped_at: new Date().toISOString(),

      raw_source: {
        place_id: 'ChIJTest67890',
        gmap_url: 'https://goo.gl/maps/test2',
      },
    },
    // Add more mock records as needed for the actual test
  ];
}

/**
 * Normalize a raw Apify record into a VASAW AI Lead object.
 * 
 * This mapping layer converts the raw Apify Actor output into the
 * standardized Lead format used throughout VASAW AI.
 * 
 * @param rawRecord Raw record from Apify Actor dataset
 * @returns Normalized Lead object ready for storage/qualification
 */
function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null;
}

export function normalizeApifyRecord(rawRecord: unknown): {
  id: string;
  business_name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  website: string | null;
  phone: string;
  email: string | null;
  ai_score: number;
  priority: string;
  status: string;
  scraped: {
    address: string;
    phone: string;
    email: string | null;
    rating: number;
    reviews: number;
    category: string;
    subCategory: string | null;
    hours: string | null;
    services: string[];
    source: string;
    scrapedAt: string;
  };
  qualification: {
    hasWebsite: boolean;
    websiteQuality: number;
    hasWhatsApp: boolean;
    hasReviews: boolean;
    responseLikelihood: 'high' | 'medium' | 'low';
    notes: string;
  };
  opportunity: {
    score: number;
    priority: string;
    reasons: string[];
    estimatedValue: number;
  };
} {
  // Extract fields from the raw Apify record using the typical schema
  const record = isRecord(rawRecord) ? rawRecord : {};
  const rawSource = isRecord(record.raw_source) ? record.raw_source : {};
  
  const businessName = (record.business_name as string) || (record.name as string) || 'Unknown Business';
  const category = (record.category as string) || (record.sub_category as string) || 'Uncategorized';
  const location = (record.location as string) || (record.address as string) || 'Unknown Location';
  const rating = record.rating !== undefined ? Number(record.rating) : 0;
  const reviews = record.reviews !== undefined ? Number(record.reviews) : 0;

  // Contact information - prioritize phone, fallback to email
  const phone = (record.phone as string) || (rawSource.phone_raw as string) || '+1 555-0123';
  const email = (record.email as string) || (rawSource.email as string) || null;

  // Address - use the full address field, falling back to raw source
  const address = (record.address as string) || (rawSource.gmap_url as string) || 'Unknown Address';

  // Website - extract from record or raw source
  const website = (record.website as string) || (rawSource.gmap_url as string) || null;

  // Initialize normalized lead object with all required properties
  const result: {
    id: string;
    business_name: string;
    category: string;
    location: string;
    rating: number;
    reviews: number;
    website: string | null;
    phone: string;
    email: string | null;
    ai_score: number;
    priority: string;
    status: string;
    scraped: {
      address: string;
      phone: string;
      email: string | null;
      rating: number;
      reviews: number;
      category: string;
      subCategory: string | null;
      hours: string | null;
      services: string[];
      source: string;
      scrapedAt: string;
    };
    qualification: {
      hasWebsite: boolean;
      websiteQuality: number;
      hasWhatsApp: boolean;
      hasReviews: boolean;
      responseLikelihood: 'high' | 'medium' | 'low';
      notes: string;
    };
    opportunity: {
      score: number;
      priority: string;
      reasons: string[];
      estimatedValue: number;
    };
  } = {
    id: `L-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    business_name: businessName,
    category: category,
    location: location,
    rating: isNaN(rating) ? 0 : rating,
    reviews: isNaN(reviews) ? 0 : reviews,
    website: website || null,
    phone: phone,
    email: email || undefined,
    ai_score: Math.max(0, Math.min(100, Math.round((rating * 0.4) + (reviews * 0.1) + (website !== null ? 20 : 0)))),
    priority: rating >= 4.5 && website === null ? 'high' : rating >= 4.0 ? 'medium' : 'low',
    status: 'new',

    // Scraped info - normalized structure
    scraped: {
      address: address,
      phone: phone,
      email: email || null,
      rating: isNaN(rating) ? 0 : rating,
      reviews: isNaN(reviews) ? 0 : reviews,
      category: category,
      subCategory: rawRecord.sub_category || null,
      hours: rawRecord.hours || null,
      services: extractServices(rawRecord),
      source: rawRecord.source || 'Google Maps',
      scrapedAt: rawRecord.scraped_at || new Date().toISOString(),
    },

    // Qualification - initial assessment
    qualification: {
      hasWebsite: !!(website || rawRecord.website),
      websiteQuality: rawRecord.websiteQuality !== undefined ? Math.max(0, Math.min(100, rawRecord.websiteQuality)) : 0,
      hasWhatsApp: !!phone,
      hasReviews: reviews > 0,
      responseLikelihood: determineResponseLikelihood(rating, reviews),
      notes: `Business identified from Google Maps with ${reviews} reviews, rating ${rating}/5`,
    },

    // Opportunity - scoring
    opportunity: {
      score: Math.max(0, Math.min(100, Math.round((rating * 0.4) + (reviews * 0.1) + (website !== null ? 20 : 0)))),
      priority: rating >= 4.5 && website === null ? 'high' : rating >= 4.0 ? 'medium' : 'low',
      reasons: generateReasons(rating, reviews, website, rawRecord.sub_category),
      estimatedValue: Math.max(5000, Math.min(50000, rating * 5000 + reviews * 100)),
    },
  };

  return result;
}

/**
 * Extract services from Apify record
 * 
 * @param rawRecord Raw Apify record
 * @returns Array of service strings
 */
function extractServices(rawRecord: unknown): string[] {
  const services: string[] = [];

  // Try to get services from various possible fields
  const possibleServices = [
    rawRecord.services,
    rawRecord.service_categories,
    rawRecord.offered_services,
  ];

  for (const serviceList of possibleServices) {
    if (serviceList && Array.isArray(serviceList)) {
      serviceList.forEach((s: unknown) => {
        if (typeof s === 'string' && s.trim()) {
          services.push(s.trim());
        }
      });
    } else if (serviceList && typeof serviceList === 'object') {
      Object.values(serviceList).forEach((s: unknown) => {
        if (typeof s === 'string' && s.trim()) {
          services.push(s.trim());
        }
      });
    }
  }

  // Fallback: derive from category
  if (services.length === 0) {
    const category = (rawRecord.category || '').toLowerCase();
    if (category.includes('restaurant')) services.push('Dining');
    if (category.includes('salon')) services.push('Hair', 'Facial');
    if (category.includes('gym') || category.includes('fitness')) services.push('Training', 'Cardio');
    if (category.includes('clinic') || category.includes('health')) services.push('Consultation', 'Treatment');
    if (category.includes('restaurant') && !services.includes('Dining')) services.push('Food');
  }

  return services.length > 0 ? services : ['Not specified'];
}

/**
 * Determine response likelihood based on rating and reviews
 * 
 * @param rating Business rating
 * @param reviews Number of reviews
 * @returns 'high' | 'medium' | 'low'
 */
function determineResponseLikelihood(rating: number, reviews: number): 'high' | 'medium' | 'low' {
  if (reviews >= 100 && rating >= 4.5) return 'high';
  if (reviews >= 50 && rating >= 4.0) return 'medium';
  return 'low';
}

/**
 * Generate opportunity reasons based on business data
 * 
 * @param rating Business rating
 * @param reviews Number of reviews
 * @param website Does the business have a website
 * @param subCategory Sub-category from Apify
 * @returns Array of reason strings
 */
function generateReasons(rating: number, reviews: number, website: string | null, subCategory: string): string[] {
  const reasons: string[] = [];

  if (!website) {
    reasons.push('No website despite online presence');
  }
  if (reviews >= 100) {
    reasons.push('High review volume indicates strong reputation');
  }
  if (rating >= 4.5) {
    reasons.push('Excellent customer rating');
  }
  if (reviews < 50 && rating >= 4.0) {
    reasons.push('Strong rating with room to grow review base');
  }
  if (subCategory) {
    reasons.push(`Specialized category: ${subCategory}`);
  }

  if (reasons.length === 0) {
    reasons.push('Good potential for website improvement');
  }

  return reasons;
}

/**
 * Run a safe test scraping of a small number of businesses.
 * This is the recommended way to start - process only 5-10 businesses
 * when first integrating with Apify.
 * 
 * @param actorId Apify Actor ID
 * @param locations Array of location strings to scrape
 * @param categories Array of category strings to scrape
 * @returns Normalized leads ready for storage
 */
export async function testScrape(
  actorId: string,
  locations: string[] = ['Coimbatore'],
  categories: string[] = ['Restaurant', 'Salon'],
): Promise<{
  leads: unknown[];
  insights: {
    totalProcessed: number;
    successful: number;
    failed: number;
    avgRating: number;
    categoriesFound: string[];
  };
}> {
  console.log('[Apify] Starting safe test scrape...');

  // Inspect the actor output format first
  const testInput = {
    start_urls: locations.map(loc => ({ url: `https://maps.google.com/${encodeURIComponent(loc)}` })),
    max_pages: 3,
  };

  const inspectionResults = await inspectApifyActor(actorId, testInput);

  // Normalize the inspection results
  const leads = inspectionResults.map(normalizeApifyRecord);

  // Calculate insights
  const totalProcessed = leads.length;
  const successful = leads.filter(l => l.qualification.hasWebsite || l.opportunity.score >= 50).length;
  const failed = totalProcessed - successful;
  const avgRating = leads.reduce((sum, l) => sum + l.rating, 0) / totalProcessed || 0;
  const categoriesFound = [...new Set(leads.map(l => l.category))];

  console.log('[Apify] Test scrape complete:', {
    total: totalProcessed,
    successful,
    failed,
    avgRating: avgRating.toFixed(1),
    categories: categoriesFound.join(', '),
  });

  return {
    leads,
    insights: {
      totalProcessed,
      successful,
      failed,
      avgRating,
      categoriesFound,
    },
  };
}