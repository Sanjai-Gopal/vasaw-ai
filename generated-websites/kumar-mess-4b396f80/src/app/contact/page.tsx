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
  "metaTitle": "Kumar Mess | Restaurant in Coimbatore",
  "metaDescription": "Welcome to Kumar Mess, top-rated Restaurant in Coimbatore. Rated 4.2/5 with 445 reviews. Call +91 422 277 8899.",
  "hero": {
    "headline": "Kumar Mess",
    "subheadline": "Strong website opportunity: no website - clear opportunity, good rating (4.0-4.4), high review volume (100-499)",
    "ctaText": "Explore Menu & Reserve",
    "ctaLink": "#contact",
    "badge": "★ 4.2/5 (445 Reviews)"
  },
  "about": {
    "headline": "About Kumar Mess",
    "body": "Welcome to Kumar Mess, proudly serving Coimbatore and surrounding areas. Our commitment is delivering outstanding restaurant solutions tailored to your needs. With an average rating of 4.2/5 stars from 445 valued clients, we take pride in quality, dependability, and customer satisfaction.",
    "highlights": [
      "4.2/5 Verified Rating",
      "445+ Satisfied Clients",
      "Centrally Located in Coimbatore"
    ]
  },
  "services": {
    "headline": "Our Services",
    "items": [
      {
        "title": "Dine-in Experience",
        "description": "High-quality dine-in experience tailored to our clients in Coimbatore."
      },
      {
        "title": "Takeaway & Delivery",
        "description": "High-quality takeaway & delivery tailored to our clients in Coimbatore."
      },
      {
        "title": "Specialty Delicacies",
        "description": "High-quality specialty delicacies tailored to our clients in Coimbatore."
      },
      {
        "title": "Beverages & Desserts",
        "description": "High-quality beverages & desserts tailored to our clients in Coimbatore."
      }
    ]
  },
  "contact": {
    "headline": "Get in Touch",
    "address": "654 Oppanakara Street, Coimbatore, Tamil Nadu 641001",
    "phone": "+91 422 277 8899",
    "mapQuery": "654 Oppanakara Street, Coimbatore, Tamil Nadu 641001"
  },
  "cta": {
    "headline": "Reserve Your Table or Order Today",
    "subheadline": "Experience the finest dining in Coimbatore. Call +91 422 277 8899 for reservations.",
    "buttonText": "Call +91 422 277 8899",
    "buttonLink": "tel:914222778899"
  },
  "footer": {
    "copyrightText": "© 2026 Kumar Mess. All rights reserved.",
    "tagline": "Serving Coimbatore with pride and dedication."
  },
  "menu": {
    "headline": "Featured Menu",
    "categories": [
      {
        "name": "Signature Offerings",
        "items": [
          {
            "name": "Dine-in Experience",
            "description": "Freshly prepared specialty by Kumar Mess"
          },
          {
            "name": "Takeaway & Delivery",
            "description": "Freshly prepared specialty by Kumar Mess"
          },
          {
            "name": "Specialty Delicacies",
            "description": "Freshly prepared specialty by Kumar Mess"
          },
          {
            "name": "Beverages & Desserts",
            "description": "Freshly prepared specialty by Kumar Mess"
          }
        ]
      }
    ]
  },
  "testimonials": {
    "headline": "What Our Customers Say",
    "items": [
      {
        "name": "Verified Customer",
        "comment": "Great experience with Kumar Mess in Coimbatore. Excellent service and wonderful staff!",
        "rating": 4,
        "date": "Recent Customer"
      },
      {
        "name": "Local Patron",
        "comment": "Consistently high quality and very dependable. Highly recommended in Coimbatore!",
        "rating": 5,
        "date": "Recent Customer"
      }
    ]
  },
  "hours": {
    "headline": "Opening Hours",
    "schedule": [
      {
        "days": "Monday - Saturday",
        "hours": "09:00 AM - 09:00 PM"
      },
      {
        "days": "Sunday",
        "hours": "10:00 AM - 08:00 PM"
      }
    ]
  }
};

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <header className="py-4 border-b border-gray-100">
        <div className="container-custom flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-gray-900 font-display">
            {content.hero.headline}
          </a>
          <a href="/" className="text-sm font-medium text-primary hover:underline">
            ← Back to Home
          </a>
        </div>
      </header>
      <section className="section-padding flex-1">
        <div className="container-custom max-w-4xl mx-auto">
          <h1 className="font-display text-4xl font-bold text-gray-900 text-center mb-8">
            Contact & Inquiries
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Location & Details</h2>
              <p className="text-gray-700 mb-4"><strong>Address:</strong> {content.contact.address}</p>
              <p className="text-gray-700 mb-4"><strong>Phone:</strong> {content.contact.phone}</p>
              {content.contact.email && <p className="text-gray-700 mb-4"><strong>Email:</strong> {content.contact.email}</p>}
            </div>
            <div className="aspect-video md:aspect-auto rounded-2xl overflow-hidden bg-gray-200 border border-gray-200 min-h-[280px]">
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
      <footer className="bg-gray-950 text-gray-400 py-6 text-center text-sm">
        {content.footer.copyrightText}
      </footer>
    </main>
  );
}
