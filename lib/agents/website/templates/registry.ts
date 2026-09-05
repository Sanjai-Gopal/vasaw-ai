import { TemplateDefinition, TemplateType } from "../types";
import { THEMES } from "../themes";

export const TEMPLATES: Record<TemplateType, TemplateDefinition> = {
  restaurant: {
    id: "restaurant",
    name: "Restaurant",
    description: "Full-service restaurant with menu, culinary gallery, reviews, and reservations",
    pages: ["index", "contact"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, title: "Welcome" },
      { id: "about", type: "about", required: true, order: 2, title: "Our Story" },
      { id: "menu", type: "menu", required: true, order: 3, title: "Our Menu" },
      { id: "gallery", type: "gallery", required: false, order: 4, title: "Gallery" },
      { id: "testimonials", type: "testimonials", required: true, order: 5, title: "Guest Reviews" },
      { id: "hours", type: "hours", required: true, order: 6, title: "Operating Hours" },
      { id: "contact", type: "contact", required: true, order: 7, title: "Find Us" },
      { id: "cta", type: "cta", required: true, order: 8, title: "Reservation" },
    ],
    categoryKeywords: [
      "restaurant",
      "bistro",
      "diner",
      "eatery",
      "kitchen",
      "grill",
      "pizza",
      "burger",
      "biryani",
      "vegetarian",
      "veg",
      "dining",
      "food",
      "bar & grill",
      "tandoori",
      "dhaba",
      "caterer",
      "cuisine",
      "indian restaurant",
    ],
    defaultTheme: THEMES.restaurant,
  },
  cafe: {
    id: "cafe",
    name: "Cafe & Bakery",
    description: "Coffee shop & bakery with beverage menu, ambience focus, and online orders",
    pages: ["index", "contact"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, title: "Welcome" },
      { id: "about", type: "about", required: true, order: 2, title: "About Our Cafe" },
      { id: "menu", type: "menu", required: true, order: 3, title: "Beverages & Bakes" },
      { id: "gallery", type: "gallery", required: true, order: 4, title: "Ambience" },
      { id: "testimonials", type: "testimonials", required: true, order: 5, title: "Customer Love" },
      { id: "hours", type: "hours", required: true, order: 6, title: "Cafe Hours" },
      { id: "contact", type: "contact", required: true, order: 7, title: "Visit Us" },
      { id: "cta", type: "cta", required: true, order: 8, title: "Order Now" },
    ],
    categoryKeywords: [
      "cafe",
      "coffee",
      "coffee shop",
      "bakery",
      "pastry",
      "brunch",
      "tea",
      "espresso",
      "dessert",
      "bakes",
      "patisserie",
      "sweet shop",
    ],
    defaultTheme: THEMES.cafe,
  },
  salon: {
    id: "salon",
    name: "Salon & Spa",
    description: "Beauty salon with service catalog, portfolio gallery, and appointment booking",
    pages: ["index", "contact"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, title: "Welcome" },
      { id: "about", type: "about", required: true, order: 2, title: "About Our Salon" },
      { id: "services", type: "services", required: true, order: 3, title: "Our Services" },
      { id: "gallery", type: "gallery", required: true, order: 4, title: "Lookbook" },
      { id: "team", type: "team", required: false, order: 5, title: "Stylists" },
      { id: "testimonials", type: "testimonials", required: true, order: 6, title: "Client Reviews" },
      { id: "hours", type: "hours", required: true, order: 7, title: "Hours" },
      { id: "contact", type: "contact", required: true, order: 8, title: "Location" },
      { id: "cta", type: "cta", required: true, order: 9, title: "Book Appointment" },
    ],
    categoryKeywords: [
      "salon",
      "spa",
      "beauty",
      "hair",
      "nail",
      "barber",
      "barbershop",
      "unisex",
      "bridal",
      "facial",
      "massage",
      "skin",
      "makeup",
      "grooming",
      "parlour",
    ],
    defaultTheme: THEMES.salon,
  },
  gym: {
    id: "gym",
    name: "Gym & Fitness",
    description: "Fitness center with workout programs, equipment showcase, and membership CTA",
    pages: ["index", "contact"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, title: "Ignite Your Fitness" },
      { id: "about", type: "about", required: true, order: 2, title: "Why Choose Us" },
      { id: "services", type: "services", required: true, order: 3, title: "Training Programs" },
      { id: "gallery", type: "gallery", required: true, order: 4, title: "Facility & Equipment" },
      { id: "testimonials", type: "testimonials", required: true, order: 5, title: "Member Transformations" },
      { id: "hours", type: "hours", required: true, order: 6, title: "Gym Hours" },
      { id: "contact", type: "contact", required: true, order: 7, title: "Location & Gym Desk" },
      { id: "cta", type: "cta", required: true, order: 8, title: "Start Your Free Pass" },
    ],
    categoryKeywords: [
      "gym",
      "fitness",
      "workout",
      "training",
      "crossfit",
      "yoga",
      "pilates",
      "personal training",
      "zumba",
      "health club",
      "bodybuilding",
      "martial arts",
      "mma",
      "boxing",
    ],
    defaultTheme: THEMES.gym,
  },
  tattoo: {
    id: "tattoo",
    name: "Tattoo Studio",
    description: "Tattoo & piercing studio with portfolio gallery, custom design showcase, and booking CTA",
    pages: ["index", "contact"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, title: "Custom Ink & Artistry" },
      { id: "about", type: "about", required: true, order: 2, title: "Studio Philosophy" },
      { id: "gallery", type: "gallery", required: true, order: 3, title: "Portfolio Gallery" },
      { id: "services", type: "services", required: true, order: 4, title: "Tattoo & Piercing Services" },
      { id: "testimonials", type: "testimonials", required: true, order: 5, title: "Client Stories" },
      { id: "hours", type: "hours", required: false, order: 6, title: "Studio Hours" },
      { id: "contact", type: "contact", required: true, order: 7, title: "Visit Studio" },
      { id: "cta", type: "cta", required: true, order: 8, title: "Book a Consultation" },
    ],
    categoryKeywords: [
      "tattoo",
      "tattoo studio",
      "ink",
      "body art",
      "piercing",
      "artist",
      "tattooing",
    ],
    defaultTheme: THEMES.tattoo,
  },
  clinic: {
    id: "clinic",
    name: "Clinic & Healthcare",
    description: "Medical clinic with patient services, appointment booking, and trust credentials",
    pages: ["index", "contact"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, title: "Compassionate Care" },
      { id: "about", type: "about", required: true, order: 2, title: "About Our Practice" },
      { id: "services", type: "services", required: true, order: 3, title: "Clinical Services" },
      { id: "testimonials", type: "testimonials", required: true, order: 4, title: "Patient Feedback" },
      { id: "hours", type: "hours", required: true, order: 5, title: "Consultation Hours" },
      { id: "contact", type: "contact", required: true, order: 6, title: "Clinic Address & Contact" },
      { id: "cta", type: "cta", required: true, order: 7, title: "Request Appointment" },
    ],
    categoryKeywords: [
      "clinic",
      "hospital",
      "dental",
      "dentist",
      "doctor",
      "medical",
      "healthcare",
      "physiotherapy",
      "ayurvedic",
      "health center",
      "optician",
      "dermatology",
      "pediatric",
      "wellness center",
    ],
    defaultTheme: THEMES.clinic,
  },
  generic: {
    id: "generic",
    name: "Generic Local Business",
    description: "Professional responsive website for local trades, retail, and commercial services",
    pages: ["index", "contact"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, title: "Welcome" },
      { id: "about", type: "about", required: true, order: 2, title: "About Us" },
      { id: "services", type: "services", required: true, order: 3, title: "Our Services" },
      { id: "testimonials", type: "testimonials", required: true, order: 4, title: "Customer Reviews" },
      { id: "hours", type: "hours", required: false, order: 5, title: "Business Hours" },
      { id: "contact", type: "contact", required: true, order: 6, title: "Contact Us" },
      { id: "cta", type: "cta", required: true, order: 7, title: "Get in Touch" },
    ],
    categoryKeywords: [
      "service",
      "repair",
      "maintenance",
      "cleaning",
      "plumber",
      "electrician",
      "contractor",
      "mechanic",
      "auto",
      "packaging",
      "manufacturing",
      "store",
      "shop",
      "retail",
      "agency",
      "consulting",
      "lawyer",
      "accountant",
      "school",
      "education",
    ],
    defaultTheme: THEMES.generic,
  },
  "local-service": {
    id: "local-service",
    name: "Local Service",
    description: "General local service business",
    pages: ["index", "contact"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, title: "Welcome" },
      { id: "about", type: "about", required: true, order: 2, title: "About Us" },
      { id: "services", type: "services", required: true, order: 3, title: "Our Services" },
      { id: "testimonials", type: "testimonials", required: true, order: 4, title: "Customer Reviews" },
      { id: "hours", type: "hours", required: false, order: 5, title: "Business Hours" },
      { id: "contact", type: "contact", required: true, order: 6, title: "Contact Us" },
      { id: "cta", type: "cta", required: true, order: 7, title: "Get in Touch" },
    ],
    categoryKeywords: ["service", "repair", "contractor", "maintenance"],
    defaultTheme: THEMES["local-service"],
  },
};

function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return regex.test(text);
}

export function selectTemplate(category: string, subCategory?: string): TemplateType {
  const searchText = `${category || ""} ${subCategory || ""}`.toLowerCase();

  // Specific priority check for known categories first
  const priorityOrder: TemplateType[] = [
    "restaurant",
    "cafe",
    "salon",
    "gym",
    "tattoo",
    "clinic",
  ];

  for (const templateId of priorityOrder) {
    const template = TEMPLATES[templateId];
    for (const keyword of template.categoryKeywords) {
      if (matchesKeyword(searchText, keyword)) {
        return templateId;
      }
    }
  }

  // Fallback to generic local business template
  return "generic";
}

export function getTemplate(templateId: TemplateType | string): TemplateDefinition {
  const normalized = (templateId || "").toLowerCase();
  if (normalized === "local-service") {
    return TEMPLATES["local-service"] ?? TEMPLATES.generic;
  }
  return TEMPLATES[normalized as TemplateType] ?? TEMPLATES.generic;
}

export function listTemplates(): TemplateDefinition[] {
  return [
    TEMPLATES.restaurant,
    TEMPLATES.cafe,
    TEMPLATES.salon,
    TEMPLATES.gym,
    TEMPLATES.tattoo,
    TEMPLATES.clinic,
    TEMPLATES.generic,
  ];
}
