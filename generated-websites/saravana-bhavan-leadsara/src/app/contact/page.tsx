'use client';

import React from "react";

interface ContentData {
  metaTitle: string;
  metaDescription: string;
  hero: { headline: string; subheadline: string; ctaText: string; ctaLink: string; badge?: string };
  about: { headline: string; body: string; highlights?: string[] };
  services?: { headline: string; items: Array<{ title: string; description: string; price?: string }> };
  menu?: { headline: string; categories: Array<{ name: string; items: Array<{ name: string; description?: string; price?: string }> }> };
  gallery?: { headline: string; images: Array<{ url: string; alt: string; caption?: string }> };
  testimonials?: { headline: string; items: Array<{ name: string; comment: string; rating: number; date?: string }> };
  hours?: { headline: string; schedule: Array<{ days: string; hours: string }> };
  team?: { headline: string; members: Array<{ name: string; role: string; bio?: string }> };
  contact: { headline: string; address: string; phone: string; email?: string; mapQuery?: string };
  cta: { headline: string; subheadline: string; buttonText: string; buttonLink: string };
  footer: { copyrightText: string; tagline?: string };
}

const content: ContentData = {
  "metaTitle": "Saravana Bhavan | Authentic Restaurant in Coimbatore",
  "metaDescription": "Saravana Bhavan in Coimbatore. Rated 4.6★ based on 420 reviews. Enjoy freshly prepared food for dine-in and takeaway. Call +91 422 239 1234.",
  "hero": {
    "headline": "Saravana Bhavan",
    "subheadline": "Traditional recipes prepared fresh daily with the finest ingredients. Made for dine-in, takeaway, and family dining in Coimbatore.",
    "ctaText": "Explore Menu",
    "ctaLink": "#menu",
    "badge": "★ 4.6/5 (420 Reviews) · Coimbatore"
  },
  "about": {
    "headline": "Authentic Food, Served with Tradition",
    "body": "Saravana Bhavan has been serving the Coimbatore community with rich, authentic culinary traditions. From freshly ground spices to wholesome daily preparations, our kitchen takes pride in serving delicious, hygienic, and satisfying meals every single day.",
    "highlights": [
      "★ 4.6/5 Google Rating (420 Reviews)",
      "Prime Location in Coimbatore",
      "Fresh Daily Preparation & Hygienic Kitchen"
    ]
  },
  "services": {
    "headline": "Our Services",
    "items": [
      {
        "title": "Dine-In Experience",
        "description": "Comfortable, welcoming seating with attentive service for individuals, couples, and family gatherings."
      },
      {
        "title": "Takeaway & Parcel Service",
        "description": "Freshly packed meals prepared with hygienic food-grade packaging for quick and convenient takeaway."
      },
      {
        "title": "Doorstep WhatsApp Ordering",
        "description": "Order your favorite meals directly via WhatsApp for swift home or office delivery."
      },
      {
        "title": "Bulk & Catering Orders",
        "description": "Custom food arrangements and meal boxes for family celebrations, parties, and office events."
      }
    ]
  },
  "contact": {
    "headline": "Location & Contact",
    "address": "148 Brooke Fields Road, Coimbatore",
    "phone": "+91 422 239 1234",
    "mapQuery": "148 Brooke Fields Road, Coimbatore"
  },
  "cta": {
    "headline": "Planning Your Next Meal? Visit Saravana Bhavan",
    "subheadline": "Experience authentic taste in Coimbatore. Dine with us today or call ahead for quick takeaway.",
    "buttonText": "Call +91 422 239 1234",
    "buttonLink": "tel:914222391234"
  },
  "footer": {
    "copyrightText": "© 2026 Saravana Bhavan. All rights reserved.",
    "tagline": "Proudly serving Coimbatore with authentic quality and dedicated hospitality."
  },
  "menu": {
    "headline": "Our Menu & Daily Specialties",
    "categories": [
      {
        "name": "Traditional Meals & Thali",
        "items": [
          {
            "name": "South Indian Special Meals",
            "description": "Authentic full meal with steamed rice, aromatic sambar, rasam, kootu, poriyal, curd, appalam, and sweet payasam.",
            "price": "Fresh Daily"
          },
          {
            "name": "Executive Mini Meals",
            "description": "Quick lunch platter featuring sambar rice, curd rice, variety rice of the day, side dish, and crispy papad.",
            "price": "Lunch Special"
          }
        ]
      },
      {
        "name": "Tiffin & Fresh Dosa",
        "items": [
          {
            "name": "Crispy Ghee Roast Dosa",
            "description": "Golden crisp crepe roasted with pure desi ghee, served with 3 signature chutneys and hot sambar.",
            "price": "Popular"
          },
          {
            "name": "Soft Podi Idli Platter",
            "description": "Steamed fluffy rice cakes tossed in fragrant spiced gun powder and sesame oil, served hot.",
            "price": "House Special"
          },
          {
            "name": "Special Masala Dosa",
            "description": "Crispy roasted dosa filled with spiced potato masala and topped with fresh coriander.",
            "price": "Chef's Pick"
          }
        ]
      },
      {
        "name": "Biryani & Curries",
        "items": [
          {
            "name": "Special Dum Biryani",
            "description": "Slow-cooked fragrant basmati rice infused with whole spices, herbs, and served with cooling onion raita.",
            "price": "Specialty"
          },
          {
            "name": "Signature Pepper Masala & Gravy",
            "description": "Freshly roasted black peppercorns and rich traditional curry gravy cooked in rustic village style.",
            "price": "Daily Special"
          }
        ]
      },
      {
        "name": "Beverages & Refreshments",
        "items": [
          {
            "name": "Traditional Filter Coffee",
            "description": "Freshly brewed South Indian chicory blend with frothed milk served in classic brass dabarah.",
            "price": "Hot Beverage"
          },
          {
            "name": "Cooling Spiced Buttermilk",
            "description": "Fresh churned curd tempered with green chillies, ginger, curry leaves, and asafoetida.",
            "price": "Refreshing"
          }
        ]
      }
    ]
  },
  "hours": {
    "headline": "Operating Hours",
    "schedule": [
      {
        "days": "Monday – Saturday",
        "hours": "07:00 AM – 10:30 PM"
      },
      {
        "days": "Sunday",
        "hours": "07:00 AM – 10:00 PM"
      }
    ]
  }
};

export default function ContactPage() {
  const cleanPhone = (content.contact.phone || "").replace(/\D/g, "");
  const mapsUrl = "https://maps.google.com/maps?q=" + encodeURIComponent(content.contact.mapQuery || content.contact.address);

  return (
    <main className="min-h-screen flex flex-col bg-[#0c0a09] text-[#fdfbf7]">
      <header className="py-4 border-b border-white/10 bg-[#0c0a09]/90 backdrop-blur-md">
        <div className="container-custom flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-white font-display">
            {content.hero.headline}
          </a>
          <a href="/" className="text-sm font-medium text-amber-400 hover:underline">
            ← Back to Home
          </a>
        </div>
      </header>
      <section className="section-padding flex-1">
        <div className="container-custom max-w-4xl mx-auto">
          <h1 className="font-display text-4xl font-bold text-white text-center mb-8">
            Location & Inquiries
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/[0.03] p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Direct Contact</h2>
                <p className="text-stone-300 mb-4"><strong>Address:</strong> {content.contact.address}</p>
                <p className="text-stone-300 mb-4"><strong>Phone:</strong> {content.contact.phone}</p>
                {content.contact.email && <p className="text-stone-300 mb-4"><strong>Email:</strong> {content.contact.email}</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <a
                  href={"tel:" + cleanPhone}
                  className="bg-amber-400 text-stone-950 font-bold px-5 py-2.5 rounded-full text-xs hover:bg-amber-300 transition-colors"
                >
                  Call Now
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 text-white font-semibold px-5 py-2.5 rounded-full text-xs hover:bg-white/15 transition-colors border border-white/15"
                >
                  Get Directions
                </a>
              </div>
            </div>
            <div className="aspect-video md:aspect-auto rounded-3xl overflow-hidden bg-stone-900 border border-white/10 min-h-[280px]">
              <iframe
                src={"https://maps.google.com/maps?q=" + encodeURIComponent(content.contact.mapQuery || content.contact.address) + "&output=embed"}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Location Map"
              />
            </div>
          </div>
        </div>
      </section>
      <footer className="bg-[#080706] text-stone-500 py-6 text-center text-xs border-t border-white/5">
        {content.footer.copyrightText}
      </footer>
    </main>
  );
}
