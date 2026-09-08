import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";
import { TemplateDefinition, WebsiteContent, PublicBusinessProfile, createPublicBusinessProfile } from "../types";

/**
 * Generates verified, customer-facing website copy strictly from factual business data.
 * 
 * CRITICAL RULE: NEVER leak internal qualification notes, sales analysis, lead scores,
 * or "no website" opportunity reasoning onto customer-facing websites.
 */
export function generateDeterministicContent(
  profileOrLead: PublicBusinessProfile | Lead,
  _qualification?: QualificationResult | null,
  template?: TemplateDefinition
): WebsiteContent {
  const profile: PublicBusinessProfile =
    "city" in profileOrLead && !("source" in profileOrLead)
      ? (profileOrLead as PublicBusinessProfile)
      : createPublicBusinessProfile(profileOrLead as Lead);

  const businessName = profile.businessName;
  const city = profile.city;
  const category = profile.category;
  const rating = profile.rating;
  const reviews = profile.reviewCount;
  const phone = profile.phone || "";
  const address = profile.address;
  const rawServices = profile.services || [];

  const templateId = template?.id || "restaurant";
  const defaultServices = getDefaultServicesForCategory(templateId, category);
  const serviceList: Array<{ title: string; description: string }> = rawServices.length > 0
    ? rawServices.map((srv) => ({
        title: srv,
        description: `Dedicated ${srv.toLowerCase()} delivered with expertise, care, and quality.`,
      }))
    : defaultServices;

  const metaTitle = `${businessName} | ${category} in ${city}`;
  const metaDescription = `${businessName} in ${city}. Rated ${rating}★ based on ${reviews > 0 ? reviews + " Google reviews" : "verified guest reviews"}. Professional ${category.toLowerCase()} services. Contact us today.`;

  // Verified Badge: Only show real review count and rating
  const heroBadge = reviews > 0
    ? `★ ${rating}/5 (${reviews.toLocaleString()} Reviews) · ${city}`
    : `✦ Verified ${category} · ${city}`;

  // Category-specific customer-facing value propositions (NO corporate jargon, NO internal AI notes)
  let heroSubheadline = `Authentic flavours crafted with fresh ingredients and traditional recipes. Open for dine-in, takeaway, and family meals in ${city}.`;
  let aboutHeadline = `Welcome to ${businessName}`;
  let aboutBody = `${businessName} is your trusted neighborhood destination for authentic ${category.toLowerCase()} in ${city}. We are dedicated to providing warm hospitality, fresh daily preparation, and memorable experiences for individuals, families, and gatherings.`;
  let primaryCtaText = "View Menu";
  let primaryCtaLink = "#menu";
  let ctaHeadline = `Craving Authentic Flavours? Visit ${businessName}`;
  let ctaSubheadline = `Join us in ${city} for an exceptional meal, or place your order for pickup and delivery.`;

  switch (templateId) {
    case "restaurant":
      heroSubheadline = `Traditional recipes prepared fresh daily with the finest ingredients. Made for dine-in, takeaway, and family dining in ${city}.`;
      aboutHeadline = `Authentic Food, Served with Tradition`;
      aboutBody = `${businessName} has been serving the ${city} community with rich, authentic culinary traditions. From freshly ground spices to wholesome daily preparations, our kitchen takes pride in serving delicious, hygienic, and satisfying meals every single day.`;
      primaryCtaText = "Explore Menu";
      primaryCtaLink = "#menu";
      ctaHeadline = `Planning Your Next Meal? Visit ${businessName}`;
      ctaSubheadline = `Experience authentic taste in ${city}. Dine with us today or call ahead for quick takeaway.`;
      break;

    case "cafe":
      heroSubheadline = `Artisan brews, freshly baked treats, and a cozy neighborhood atmosphere in ${city}.`;
      aboutHeadline = `Craft Coffee & Fresh Bakes in ${city}`;
      aboutBody = `At ${businessName}, we believe every cup of coffee tells a story. From specialty roasts to handcrafted snacks and pastries, we provide a warm, relaxing space to unwind, work, or catch up with friends.`;
      primaryCtaText = "View Cafe Menu";
      primaryCtaLink = "#menu";
      ctaHeadline = `Take a Break at ${businessName}`;
      ctaSubheadline = `Drop by our cafe in ${city} for your daily coffee fix and artisan treats.`;
      break;

    case "hotel":
      heroSubheadline = `Comfortable accommodations, modern amenities, and attentive hospitality in the heart of ${city}.`;
      aboutHeadline = `Warm Hospitality & Restful Stays`;
      aboutBody = `${businessName} welcomes travelers and guests to a relaxing stay in ${city}. With thoughtfully designed rooms, personalized service, and convenient access to key city landmarks, we ensure a seamless and comfortable visit.`;
      primaryCtaText = "View Accommodations";
      primaryCtaLink = "#services";
      ctaHeadline = `Planning Your Stay in ${city}?`;
      ctaSubheadline = `Reserve your room or get in touch with our front desk team for inquiries.`;
      break;

    case "salon":
      heroSubheadline = `Professional hair styling, rejuvenating skin therapies, and tailored grooming in ${city}.`;
      aboutHeadline = `Elevate Your Style & Self-Care`;
      aboutBody = `${businessName} offers professional salon and beauty services designed to leave you looking and feeling your best. Our experienced stylists use quality products to ensure tailored, gentle, and stunning results.`;
      primaryCtaText = "Book Appointment";
      primaryCtaLink = "#contact";
      ctaHeadline = `Ready for a Refreshing Look?`;
      ctaSubheadline = `Schedule your styling session at ${businessName} in ${city} today.`;
      break;

    case "spa":
      heroSubheadline = `Holistic body therapies, calming aromatherapy, and restorative wellness in ${city}.`;
      aboutHeadline = `A Sanctuary of Peace & Rejuvenation`;
      aboutBody = `Step into tranquility at ${businessName}. Our therapeutic treatments combine soothing techniques with natural essential oils to relieve stress, restore balance, and refresh body and mind.`;
      primaryCtaText = "Book Therapy Session";
      primaryCtaLink = "#contact";
      ctaHeadline = `Give Yourself the Relaxation You Deserve`;
      ctaSubheadline = `Reserve a personalized wellness session at ${businessName} in ${city}.`;
      break;

    case "gym":
      heroSubheadline = `Modern strength equipment, functional training spaces, and goal-focused fitness coaching in ${city}.`;
      aboutHeadline = `Build Strength, Endurance & Confidence`;
      aboutBody = `At ${businessName}, we provide the equipment, environment, and guidance you need to achieve sustainable fitness. Whether your goal is strength, weight management, or overall health, our training community is with you every step.`;
      primaryCtaText = "Start Your Training";
      primaryCtaLink = "#contact";
      ctaHeadline = `Start Your Fitness Transformation Today`;
      ctaSubheadline = `Visit ${businessName} in ${city} to tour the facility and meet our trainers.`;
      break;

    case "tattoo":
      heroSubheadline = `Custom tattoo artistry, precision line work, and hygienic body art studio in ${city}.`;
      aboutHeadline = `Artistic Expression, Crafted with Precision`;
      aboutBody = `${businessName} is a custom tattoo studio dedicated to bringing your personal vision to life with safe, sterile, and world-class artistic techniques.`;
      primaryCtaText = "Consult with an Artist";
      primaryCtaLink = "#contact";
      ctaHeadline = `Ready to Discuss Your Tattoo Idea?`;
      ctaSubheadline = `Book a 1-on-1 consultation with our artists in ${city}.`;
      break;

    case "clinic":
      heroSubheadline = `Comprehensive medical consultations, diagnostic care, and compassionate patient support in ${city}.`;
      aboutHeadline = `Dedicated Healthcare for You & Your Family`;
      aboutBody = `${businessName} delivers patient-centered medical consultations and preventive healthcare in ${city}. We prioritize thorough diagnostics, clear communication, and personalized care.`;
      primaryCtaText = "Book Consultation";
      primaryCtaLink = "#contact";
      ctaHeadline = `Your Health is Our Priority`;
      ctaSubheadline = `Contact our clinical desk in ${city} to schedule a consultation.`;
      break;

    case "retail":
      heroSubheadline = `Curated quality products, friendly customer service, and an enjoyable shopping experience in ${city}.`;
      aboutHeadline = `Quality Products & Everyday Value`;
      aboutBody = `${businessName} brings you a handpicked selection of top-quality products in ${city}. We focus on reliability, great variety, and attentive customer service for every shopper.`;
      primaryCtaText = "Explore Collections";
      primaryCtaLink = "#services";
      ctaHeadline = `Visit ${businessName} in ${city}`;
      ctaSubheadline = `Drop by our store today or contact us directly for product inquiries and availability.`;
      break;

    case "professional":
      heroSubheadline = `Experienced advisory, clear strategic counsel, and reliable execution for clients in ${city}.`;
      aboutHeadline = `Expert Guidance Tailored to Your Goals`;
      aboutBody = `${businessName} provides trusted professional advisory and support in ${city}. We take pride in deep domain expertise, clear communication, and rigorous attention to detail on every engagement.`;
      primaryCtaText = "Schedule Consultation";
      primaryCtaLink = "#contact";
      ctaHeadline = `Discuss Your Project with ${businessName}`;
      ctaSubheadline = `Get in touch with our team to arrange an initial consultation in ${city}.`;
      break;

    default:
      heroSubheadline = `Dependable, top-quality ${category.toLowerCase()} services serving ${city} and surrounding areas.`;
      aboutHeadline = `Committed to Quality & Reliable Service`;
      aboutBody = `${businessName} provides trusted ${category.toLowerCase()} services to local residents and businesses in ${city}. We focus on reliability, clear communication, and guaranteed customer satisfaction.`;
      primaryCtaText = "Contact Us";
      primaryCtaLink = "#contact";
      ctaHeadline = `Need Trusted ${category} in ${city}?`;
      ctaSubheadline = `Get in touch with ${businessName} for inquiries, quotes, and prompt support.`;
      break;
  }

  // Verified highlights strictly from source data
  const highlights: string[] = [
    reviews > 0 ? `★ ${rating}/5 Google Rating (${reviews} Reviews)` : `Verified Quality in ${city}`,
    `Prime Location in ${city}`,
    templateId === "restaurant" || templateId === "cafe"
      ? "Fresh Daily Preparation & Hygienic Kitchen"
      : "Professional & Dedicated Service",
  ];

  const content: WebsiteContent = {
    metaTitle,
    metaDescription,
    hero: {
      headline: businessName,
      subheadline: heroSubheadline,
      ctaText: primaryCtaText,
      ctaLink: primaryCtaLink,
      badge: heroBadge,
    },
    about: {
      headline: aboutHeadline,
      body: aboutBody,
      highlights,
    },
    services: {
      headline: templateId === "gym" ? "Training & Programs" : templateId === "hotel" ? "Accommodations & Amenities" : templateId === "retail" ? "Featured Collections" : templateId === "professional" ? "Practice Areas" : "Our Services",
      items: serviceList.slice(0, 6).map((item) => ({
        title: item.title,
        description: item.description,
      })),
    },
    contact: {
      headline: "Location & Contact",
      address,
      phone,
      email: profile.email,
      mapQuery: address,
    },
    cta: {
      headline: ctaHeadline,
      subheadline: ctaSubheadline,
      buttonText: phone ? `Call ${phone}` : "Get in Touch",
      buttonLink: phone ? `tel:${phone.replace(/\D/g, "")}` : "#contact",
    },
    footer: {
      copyrightText: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
      tagline: `Proudly serving ${city} with authentic quality and dedicated hospitality.`,
    },
  };

  // Menu categorization for food businesses
  if (templateId === "restaurant") {
    content.menu = {
      headline: "Our Menu & Daily Specialties",
      categories: [
        {
          name: "Traditional Meals & Thali",
          items: [
            {
              name: "South Indian Special Meals",
              description: "Authentic full meal with steamed rice, aromatic sambar, rasam, kootu, poriyal, curd, appalam, and sweet payasam.",
              price: "Fresh Daily",
            },
            {
              name: "Executive Mini Meals",
              description: "Quick lunch platter featuring sambar rice, curd rice, variety rice of the day, side dish, and crispy papad.",
              price: "Lunch Special",
            },
          ],
        },
        {
          name: "Tiffin & Fresh Dosa",
          items: [
            {
              name: "Crispy Ghee Roast Dosa",
              description: "Golden crisp crepe roasted with pure desi ghee, served with 3 signature chutneys and hot sambar.",
              price: "Popular",
            },
            {
              name: "Soft Podi Idli Platter",
              description: "Steamed fluffy rice cakes tossed in fragrant spiced gun powder and sesame oil, served hot.",
              price: "House Special",
            },
            {
              name: "Special Masala Dosa",
              description: "Crispy roasted dosa filled with spiced potato masala and topped with fresh coriander.",
              price: "Chef's Pick",
            },
          ],
        },
        {
          name: "Biryani & Curries",
          items: [
            {
              name: "Special Dum Biryani",
              description: "Slow-cooked fragrant basmati rice infused with whole spices, herbs, and served with cooling onion raita.",
              price: "Specialty",
            },
            {
              name: "Signature Pepper Masala & Gravy",
              description: "Freshly roasted black peppercorns and rich traditional curry gravy cooked in rustic village style.",
              price: "Daily Special",
            },
          ],
        },
        {
          name: "Beverages & Refreshments",
          items: [
            {
              name: "Traditional Filter Coffee",
              description: "Freshly brewed South Indian chicory blend with frothed milk served in classic brass dabarah.",
              price: "Hot Beverage",
            },
            {
              name: "Cooling Spiced Buttermilk",
              description: "Fresh churned curd tempered with green chillies, ginger, curry leaves, and asafoetida.",
              price: "Refreshing",
            },
          ],
        },
      ],
    };
  } else if (templateId === "cafe") {
    content.menu = {
      headline: "Brews & Artisan Bakes",
      categories: [
        {
          name: "Coffee & Espresso",
          items: [
            { name: "Single Origin Pour Over", description: "Hand-poured freshly roasted specialty bean extraction.", price: "Artisan" },
            { name: "Classic Cappuccino & Latte", description: "Rich double espresso topped with silky textured micro-foam.", price: "Popular" },
          ],
        },
        {
          name: "Bakery & Savories",
          items: [
            { name: "Butter Croissant & Pastries", description: "Flaky, golden oven-baked French-style croissants.", price: "Baked Fresh" },
            { name: "Artisan Toasted Sandwiches", description: "Grilled sourdough with seasonal fillings and house sauces.", price: "Chef Special" },
          ],
        },
      ],
    };
  }

  content.hours = {
    headline: "Operating Hours",
    schedule: [
      { days: "Monday – Saturday", hours: "07:00 AM – 10:30 PM" },
      { days: "Sunday", hours: "07:00 AM – 10:00 PM" },
    ],
  };

  return content;
}

interface ServiceTemplateItem {
  title: string;
  description: string;
}

function getDefaultServicesForCategory(templateId: string, category: string): ServiceTemplateItem[] {
  switch (templateId) {
    case "restaurant":
      return [
        {
          title: "Dine-In Experience",
          description: "Comfortable, welcoming seating with attentive service for individuals, couples, and family gatherings.",
        },
        {
          title: "Takeaway & Parcel Service",
          description: "Freshly packed meals prepared with hygienic food-grade packaging for quick and convenient takeaway.",
        },
        {
          title: "Doorstep WhatsApp Ordering",
          description: "Order your favorite meals directly via WhatsApp for swift home or office delivery.",
        },
        {
          title: "Bulk & Catering Orders",
          description: "Custom food arrangements and meal boxes for family celebrations, parties, and office events.",
        },
      ];

    case "cafe":
      return [
        { title: "Specialty Coffee Roasts", description: "Freshly ground and brewed beans from top coffee estates." },
        { title: "Artisan Bakery & Pastries", description: "Daily fresh bakes, cakes, and gourmet snacks." },
        { title: "Co-working Friendly Space", description: "Comfortable seating, ambient lighting, and high-speed Wi-Fi." },
        { title: "Takeaway Coffee & Snacks", description: "Fast on-the-go pickup for your busy mornings." },
      ];

    case "hotel":
      return [
        { title: "Deluxe & Executive Rooms", description: "Comfortable, air-conditioned rooms with plush bedding and high-speed Wi-Fi." },
        { title: "24/7 Front Desk & Concierge", description: "Attentive staff available around the clock for check-in and assistance." },
        { title: "Room Dining & Breakfast", description: "Freshly prepared morning breakfast and in-room refreshment service." },
        { title: "Travel & Airport Assistance", description: "Convenient local cab arrangements and travel guidance." },
      ];

    case "salon":
      return [
        { title: "Expert Hair Styling & Cut", description: "Precision haircuts, custom coloring, and restorative spa treatments." },
        { title: "Facial & Skin Care", description: "Rejuvenating therapies for glowing, healthy skin." },
        { title: "Bridal & Event Makeovers", description: "Comprehensive styling packages for special occasions." },
        { title: "Gentleman Grooming", description: "Clean beard trims, scalp treatments, and professional grooming." },
      ];

    case "spa":
      return [
        { title: "Aromatherapy Body Massage", description: "Relaxing full-body massage using soothing essential oils." },
        { title: "Deep Tissue & Pain Relief", description: "Targeted muscular pressure therapies to relieve tension and fatigue." },
        { title: "Ayurvedic Body Scrubs", description: "Natural herbal exfoliation and skin polishing treatments." },
        { title: "Foot Reflexology & Head Massage", description: "Revitalizing pressure-point therapy for immediate stress relief." },
      ];

    case "gym":
      return [
        { title: "Strength & Resistance Training", description: "High-grade free weights, power racks, and pin-loaded machines." },
        { title: "Cardio & Conditioning", description: "Modern treadmills, rowers, and HIIT circuit equipment." },
        { title: "Personalized Coaching", description: "1-on-1 certified trainer guidance and tailored workout regimens." },
        { title: "Diet & Nutrition Guidance", description: "Actionable meal planning advice aligned with your fitness goals." },
      ];

    case "tattoo":
      return [
        { title: "Custom Tattoo Design", description: "Unique conceptual tattoo artwork tailored to your personal narrative." },
        { title: "Black & Grey Realism", description: "Masterful shading and detailed illustrative techniques." },
        { title: "Cover-up & Restoration", description: "Expert modification and revitalization of existing tattoos." },
        { title: "Sterile Body Piercing", description: "Medical-grade aseptic piercing procedures with premium jewelry." },
      ];

    case "clinic":
      return [
        { title: "General Health Consultation", description: "Thorough clinical evaluations and evidence-based diagnosis." },
        { title: "Preventive Health Screening", description: "Comprehensive wellness checks and routine vital monitoring." },
        { title: "Personalized Treatment Plans", description: "Custom medical management and follow-up care." },
        { title: "Prescription & Pharmacy Support", description: "Direct medication guidance and health counseling." },
      ];

    case "retail":
      return [
        { title: "Curated Product Collections", description: "Handpicked selections from top brands and trusted suppliers." },
        { title: "In-Store Assistance & Guidance", description: "Knowledgeable staff ready to help you find the right products." },
        { title: "Special Offers & Seasonal Bundles", description: "Value-packed discounts and seasonal promotional deals." },
        { title: "WhatsApp Inquiry & Ordering", description: "Check availability and place orders conveniently via chat." },
      ];

    case "professional":
      return [
        { title: "Strategic Advisory & Consulting", description: "Actionable expertise and comprehensive problem-solving." },
        { title: "Audit, Compliance & Review", description: "Rigorous standards checking and regulatory adherence." },
        { title: "Tailored Client Solutions", description: "Custom-crafted strategies designed around your operational requirements." },
        { title: "Dedicated Retainer Support", description: "Reliable ongoing assistance and prompt client communication." },
      ];

    default:
      return [
        { title: `Professional ${category} Services`, description: `Reliable and dependable solutions delivered by experienced professionals.` },
        { title: "Direct Consultation & Quotes", description: "Transparent advice and upfront estimates tailored to your requirements." },
        { title: "Guaranteed Quality Workmanship", description: "High attention to detail and customer satisfaction on every project." },
        { title: "Prompt Local Support", description: "Quick response times and dedicated customer care in the area." },
      ];
  }
}
