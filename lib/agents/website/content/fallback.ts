import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";
import { TemplateDefinition, WebsiteContent } from "../types";

export function generateDeterministicContent(
  lead: Lead,
  qualification?: QualificationResult | null,
  template?: TemplateDefinition
): WebsiteContent {
  const businessName = lead.businessName || "Local Business";
  const city = lead.city || lead.address || "Coimbatore";
  const category = lead.category || "Local Business";
  const rating = typeof lead.rating === "number" ? lead.rating : 4.5;
  const reviews = typeof lead.reviewCount === "number" ? lead.reviewCount : 50;
  const phone = lead.phone || "";
  const address = lead.address || city;
  const rawServices = (lead as unknown as { scraped?: { services?: string[] } }).scraped?.services ?? [];

  const templateId = template?.id || "restaurant";
  const serviceList = rawServices.length > 0
    ? rawServices
    : getDefaultServicesForCategory(templateId, category);

  const metaTitle = `${businessName} | ${category} in ${city}`;
  const metaDescription = `Welcome to ${businessName}, top-rated ${category} in ${city}. Rated ${rating}/5 with ${reviews} reviews. Call ${phone || "today"}.`;

  const heroBadge = reviews > 0 ? `★ ${rating}/5 (${reviews} Reviews)` : `Top Rated ${category}`;

  let ctaText = "Get in Touch";
  const ctaLink = "#contact";
  let ctaHeadline = `Ready to experience ${businessName}?`;
  let ctaSubheadline = `Visit us in ${city} or call our team directly at ${phone || "our helpline"}.`;

  switch (templateId) {
    case "restaurant":
      ctaText = "Explore Menu & Reserve";
      ctaHeadline = "Reserve Your Table or Order Today";
      ctaSubheadline = `Experience the finest dining in ${city}. Call ${phone} for reservations.`;
      break;
    case "cafe":
      ctaText = "View Menu";
      ctaHeadline = "Fresh Brews & Artisan Treats Await";
      ctaSubheadline = `Drop by our cafe in ${city} for freshly crafted beverages and snacks.`;
      break;
    case "salon":
      ctaText = "Book Your Appointment";
      ctaHeadline = "Treat Yourself to Expert Care";
      ctaSubheadline = `Transform your look with ${businessName}. Call ${phone} to schedule.`;
      break;
    case "gym":
      ctaText = "Start Your Membership";
      ctaHeadline = "Achieve Your Fitness Goals";
      ctaSubheadline = `Join ${businessName} in ${city} today and kickstart your transformation.`;
      break;
    case "tattoo":
      ctaText = "Consult with an Artist";
      ctaHeadline = "Bring Your Vision to Life";
      ctaSubheadline = `Book your tattoo consultation at ${businessName} in ${city}.`;
      break;
    case "clinic":
      ctaText = "Book Consultation";
      ctaHeadline = "Professional Healthcare for You & Your Family";
      ctaSubheadline = `Contact our clinical desk in ${city} at ${phone} to book an appointment.`;
      break;
  }

  const aboutBody = `Welcome to ${businessName}, proudly serving ${city} and surrounding areas. Our commitment is delivering outstanding ${category.toLowerCase()} solutions tailored to your needs. With an average rating of ${rating}/5 stars from ${reviews.toLocaleString()} valued clients, we take pride in quality, dependability, and customer satisfaction.`;

  const content: WebsiteContent = {
    metaTitle,
    metaDescription,
    hero: {
      headline: businessName,
      subheadline: qualification?.reason || (qualification as { notes?: string })?.notes || `Premier ${category} in ${city}`,
      ctaText,
      ctaLink,
      badge: heroBadge,
    },
    about: {
      headline: `About ${businessName}`,
      body: aboutBody,
      highlights: [
        `${rating}/5 Verified Rating`,
        `${reviews.toLocaleString()}+ Satisfied Clients`,
        `Centrally Located in ${city}`,
      ],
    },
    services: {
      headline: templateId === "gym" ? "Programs & Training" : "Our Services",
      items: serviceList.slice(0, 8).map((name) => ({
        title: name,
        description: `High-quality ${name.toLowerCase()} tailored to our clients in ${city}.`,
      })),
    },
    contact: {
      headline: "Get in Touch",
      address,
      phone,
      email: (lead as unknown as { email?: string }).email,
      mapQuery: address,
    },
    cta: {
      headline: ctaHeadline,
      subheadline: ctaSubheadline,
      buttonText: phone ? `Call ${phone}` : ctaText,
      buttonLink: phone ? `tel:${phone.replace(/\D/g, "")}` : "#contact",
    },
    footer: {
      copyrightText: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
      tagline: `Serving ${city} with pride and dedication.`,
    },
  };

  if (templateId === "restaurant" || templateId === "cafe") {
    content.menu = {
      headline: templateId === "cafe" ? "Coffee & Beverages" : "Featured Menu",
      categories: [
        {
          name: "Signature Offerings",
          items: serviceList.slice(0, 6).map((item) => ({
            name: item,
            description: `Freshly prepared specialty by ${businessName}`,
          })),
        },
      ],
    };
  }

  if (reviews > 0) {
    content.testimonials = {
      headline: "What Our Customers Say",
      items: [
        {
          name: "Verified Customer",
          comment: `Great experience with ${businessName} in ${city}. Excellent service and wonderful staff!`,
          rating: Math.min(5, Math.max(4, Math.round(rating))),
          date: "Recent Customer",
        },
        {
          name: "Local Patron",
          comment: `Consistently high quality and very dependable. Highly recommended in ${city}!`,
          rating: 5,
          date: "Recent Customer",
        },
      ],
    };
  }

  content.hours = {
    headline: "Opening Hours",
    schedule: [
      { days: "Monday - Saturday", hours: "09:00 AM - 09:00 PM" },
      { days: "Sunday", hours: "10:00 AM - 08:00 PM" },
    ],
  };

  return content;
}

function getDefaultServicesForCategory(templateId: string, category: string): string[] {
  switch (templateId) {
    case "restaurant":
      return ["Dine-in Experience", "Takeaway & Delivery", "Specialty Delicacies", "Beverages & Desserts"];
    case "cafe":
      return ["Artisan Espresso", "Specialty Teas", "Fresh Bakes & Pastries", "Snacks & Refreshments"];
    case "salon":
      return ["Hair Styling & Cut", "Facial & Skin Therapy", "Bridal & Party Makeovers", "Manicure & Pedicure"];
    case "gym":
      return ["Strength & Cardio Training", "Personal Coaching", "Group Workout Sessions", "Fitness Assessment"];
    case "tattoo":
      return ["Custom Tattoo Design", "Black & Grey Realism", "Color Tattooing", "Safe Body Piercing"];
    case "clinic":
      return ["General Consultation", "Preventive Health Check", "Diagnostic Care", "Personalized Treatment"];
    default:
      return [`Professional ${category} Services`, "Customer Consultation", "Reliable Support", "Quality Assurance"];
  }
}
