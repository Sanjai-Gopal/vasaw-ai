import { runWebsiteBuildingAgent } from './lib/agents/website-building.js';

process.env.DRY_RUN = 'true';

console.log('Imported successfully');

const leadId = 'd7bd7a69-6cae-42de-80d8-5b519e7f38ce';

const result = await runWebsiteBuildingAgent({
  leadId,
  businessName: 'Ganga Restaurant - Indian Restaurants in Coimbatore',
  category: 'Indian restaurant',
  subCategory: 'Indian',
  location: '22 - Nanjundapuram, Coimbatore',
  rating: 4.8,
  reviews: 189,
  phone: '+919080808008',
  email: null,
  website: 'https://www.darzaresorts.com/dining.html',
  scraped: {
    address: '22 - Nanjundapuram, Coimbatore',
    phone: '+919080808008',
    email: undefined,
    rating: 4.8,
    reviews: 189,
    category: 'Indian restaurant',
    subCategory: 'Indian',
    hours: undefined,
    services: [],
    source: 'Google Maps',
    scrapedAt: new Date().toISOString(),
  },
  qualification: {
    hasWebsite: true,
    websiteQuality: 50,
    hasWhatsApp: true,
    hasReviews: true,
    responseLikelihood: 'medium',
    notes: 'Business identified from Google Maps with 189 reviews, rating 4.8/5',
  },
  opportunity: {
    score: 72,
    priority: 'medium',
    reasons: ['High review volume indicates strong reputation'],
    estimatedValue: 0,
  },
});

console.log('Website built:', result);