import { generateWebsiteProject } from './lib/services/website-generator.js';

console.log('Testing website generator...');

const design = {
  primaryColor: "#7f1d1d",
  secondaryColor: "#991b1b",
  accentColor: "#fbbf24",
  fontPairing: '"Playfair Display", serif; --font-sans: "Inter", sans-serif',
  heroPattern: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)",
};

const template = {
  id: 'restaurant',
  name: 'Restaurant',
  pages: ['index', 'contact'],
  sections: [
    { id: 'hero', type: 'hero', required: true, order: 1 },
    { id: 'about', type: 'about', required: true, order: 2 },
    { id: 'menu', type: 'menu', required: true, order: 3 },
    { id: 'gallery', type: 'gallery', required: false, order: 4 },
    { id: 'testimonials', type: 'testimonials', required: true, order: 5 },
    { id: 'hours', type: 'hours', required: true, order: 6 },
    { id: 'contact', type: 'contact', required: true, order: 7 },
  ],
};

const businessData = {
  businessName: 'Ganga Restaurant - Indian Restaurants in Coimbatore',
  category: 'Indian restaurant',
  location: '22 - Nanjundapuram, Coimbatore',
  phone: '+919080808008',
  email: null,
  website: 'https://www.darzaresorts.com/dining.html',
  rating: 4.8,
  reviews: 189,
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
};

const generatedContent = {
  hero: {
    headline: 'Ganga Restaurant - Indian Restaurants in Coimbatore',
    subheadline: 'Premium dining experience',
    ctaText: 'Contact Us',
    ctaLink: '/contact',
  },
  about: {
    headline: 'About Ganga Restaurant',
    body: 'Located in Coimbatore, Ganga Restaurant has been serving the community with 4.8/5 stars from 189 reviews.',
  },
  menu: { headline: 'Our Menu', categories: [{ name: 'Popular Items', items: [] }] },
  gallery: { headline: 'Gallery', images: [] },
  testimonials: { headline: 'What Our Customers Say', items: [] },
  hours: { headline: 'Opening Hours', schedule: [] },
  contact: {
    headline: 'Contact Us',
    address: '22 - Nanjundapuram, Coimbatore',
    phone: '+919080808008',
    email: '',
    mapEmbedUrl: 'https://maps.google.com/maps?q=22%20-%20Nanjundapuram%2C%20Coimbatore&output=embed',
  },
};

const result = await generateWebsiteProject({
  templateId: 'restaurant',
  template,
  businessData,
  generatedContent,
  leadId: 'd7bd7a69-6cae-42de-80d8-5b519e7f38ce',
});

console.log('Website generated:', result);