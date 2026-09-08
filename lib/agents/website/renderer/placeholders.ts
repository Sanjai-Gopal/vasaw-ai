import { WebsiteTheme } from "../types";

export interface CategoryVisualAssets {
  heroImage: string;
  aboutImage: string;
  gallery: Array<{ url: string; alt: string; caption: string }>;
  dishThumbnails?: Record<string, string>;
}

export const CATEGORY_VISUALS: Record<string, CategoryVisualAssets> = {
  restaurant: {
    heroImage: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80",
        alt: "Crispy Golden Dosa with Chutneys",
        caption: "Signature Ghee Roast Dosa",
      },
      {
        url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=80",
        alt: "Aromatic Dum Biryani Platter",
        caption: "Special Dum Biryani & Raita",
      },
      {
        url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
        alt: "Traditional South Indian Curry & Spices",
        caption: "Freshly Ground Spice Masala",
      },
      {
        url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
        alt: "Traditional South Indian Filter Coffee",
        caption: "Fresh Brewed Filter Coffee",
      },
    ],
  },
  cafe: {
    heroImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
        alt: "Artisan Pour Over Coffee",
        caption: "Specialty Roasted Espresso",
      },
      {
        url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80",
        alt: "Freshly Baked Pastries",
        caption: "Flaky Butter Croissants",
      },
      {
        url: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=900&q=80",
        alt: "Cozy Cafe Interior",
        caption: "Relaxed Neighborhood Atmosphere",
      },
    ],
  },
  hotel: {
    heroImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
        alt: "Executive Suite",
        caption: "Comfortable Premium Rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80",
        alt: "Resort Pool & Lounge",
        caption: "Serene Leisure Amenities",
      },
      {
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
        alt: "Dining & Banquet",
        caption: "Warm Hospitality & Banquet Facilities",
      },
    ],
  },
  salon: {
    heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
        alt: "Precision Hair Styling",
        caption: "Custom Hair Styling & Treatment",
      },
      {
        url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
        alt: "Rejuvenating Skin Care",
        caption: "Glow & Facial Therapies",
      },
    ],
  },
  spa: {
    heroImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
        alt: "Herbal Aromatherapy Therapy",
        caption: "Holistic Essential Oil Massage",
      },
      {
        url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80",
        alt: "Relaxing Spa Suite",
        caption: "Calm & Restorative Atmosphere",
      },
    ],
  },
  gym: {
    heroImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=900&q=80",
        alt: "Strength Training Area",
        caption: "Free Weights & Power Racks",
      },
      {
        url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80",
        alt: "Cardio & HIIT Zone",
        caption: "High Performance Conditioning",
      },
    ],
  },
  tattoo: {
    heroImage: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=900&q=80",
        alt: "Custom Tattoo Artistry",
        caption: "Precision Needle & Ink Work",
      },
    ],
  },
  clinic: {
    heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80",
        alt: "Modern Clinical Consultation Desk",
        caption: "Patient Care & Diagnostic Suite",
      },
    ],
  },
  retail: {
    heroImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=900&q=80",
        alt: "Curated Store Display",
        caption: "Premium Quality Selections",
      },
      {
        url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=900&q=80",
        alt: "Storefront & Aisles",
        caption: "Seamless In-Store Experience",
      },
    ],
  },
  professional: {
    heroImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80",
        alt: "Executive Conference Room",
        caption: "Strategic Client Advisory",
      },
      {
        url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
        alt: "Professional Consulting Team",
        caption: "Dedicated Expertise & Precision",
      },
    ],
  },
  generic: {
    heroImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85",
    aboutImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80",
        alt: "Professional Team Consultation",
        caption: "Dedicated Client Assistance",
      },
    ],
  },
};

export function getVisualAssets(templateId: string): CategoryVisualAssets {
  return CATEGORY_VISUALS[templateId] || CATEGORY_VISUALS.generic;
}

export function generateHeroPlaceholderSvg(businessName: string, category: string, theme: WebsiteTheme): string {
  const safeName = escapeXml(businessName);
  const safeCategory = escapeXml(category);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="100%" height="100%">
  <defs>
    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.primaryColor}" stop-opacity="1" />
      <stop offset="100%" stop-color="${theme.secondaryColor}" stop-opacity="1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#heroGrad)"/>
  <rect width="1200" height="600" fill="rgba(0,0,0,0.4)"/>
  <text x="600" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle">
    ${safeName}
  </text>
  <text x="600" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="rgba(255,255,255,0.85)" text-anchor="middle" letter-spacing="2">
    ${safeCategory.toUpperCase()}
  </text>
</svg>`;
}

export function generateGalleryPlaceholderSvg(index: number, label: string, theme: WebsiteTheme): string {
  const safeLabel = escapeXml(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="galGrad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#galGrad${index})"/>
  <rect x="20" y="20" width="760" height="560" rx="16" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
  <circle cx="400" cy="270" r="48" fill="${theme.primaryColor}" fill-opacity="0.5"/>
  <text x="400" y="285" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="${theme.accentColor}" text-anchor="middle">
    ✦
  </text>
  <text x="400" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#ffffff" text-anchor="middle">
    ${safeLabel}
  </text>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
