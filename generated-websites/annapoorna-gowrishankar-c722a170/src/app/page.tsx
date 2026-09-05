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
  "metaTitle": "Annapoorna Gowrishankar | Restaurant in Coimbatore",
  "metaDescription": "Welcome to Annapoorna Gowrishankar, top-rated Restaurant in Coimbatore. Rated 4.7/5 with 2100 reviews. Call +91 422 244 5566.",
  "hero": {
    "headline": "Annapoorna Gowrishankar",
    "subheadline": "Strong website opportunity: no website - clear opportunity, excellent rating (4.5+), very high review volume (500+)",
    "ctaText": "Explore Menu & Reserve",
    "ctaLink": "#contact",
    "badge": "★ 4.7/5 (2100 Reviews)"
  },
  "about": {
    "headline": "About Annapoorna Gowrishankar",
    "body": "Welcome to Annapoorna Gowrishankar, proudly serving Coimbatore and surrounding areas. Our commitment is delivering outstanding restaurant solutions tailored to your needs. With an average rating of 4.7/5 stars from 2,100 valued clients, we take pride in quality, dependability, and customer satisfaction.",
    "highlights": [
      "4.7/5 Verified Rating",
      "2,100+ Satisfied Clients",
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
    "address": "456 RS Puram, Coimbatore, Tamil Nadu 641002",
    "phone": "+91 422 244 5566",
    "mapQuery": "456 RS Puram, Coimbatore, Tamil Nadu 641002"
  },
  "cta": {
    "headline": "Reserve Your Table or Order Today",
    "subheadline": "Experience the finest dining in Coimbatore. Call +91 422 244 5566 for reservations.",
    "buttonText": "Call +91 422 244 5566",
    "buttonLink": "tel:914222445566"
  },
  "footer": {
    "copyrightText": "© 2026 Annapoorna Gowrishankar. All rights reserved.",
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
            "description": "Freshly prepared specialty by Annapoorna Gowrishankar"
          },
          {
            "name": "Takeaway & Delivery",
            "description": "Freshly prepared specialty by Annapoorna Gowrishankar"
          },
          {
            "name": "Specialty Delicacies",
            "description": "Freshly prepared specialty by Annapoorna Gowrishankar"
          },
          {
            "name": "Beverages & Desserts",
            "description": "Freshly prepared specialty by Annapoorna Gowrishankar"
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
        "comment": "Great experience with Annapoorna Gowrishankar in Coimbatore. Excellent service and wonderful staff!",
        "rating": 5,
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

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <MenuSection />
      <ServicesSection />
      <GallerySection />
      <TestimonialsSection />
      <HoursSection />
      <ContactSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container-custom py-4 flex items-center justify-between">
        <a href="#" className="font-display text-2xl font-bold text-gray-900 tracking-tight">
          {content.hero.headline}
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#menu" className="hover:text-primary transition-colors">Menu</a>
          <a href="#services" className="hover:text-primary transition-colors">Services</a>
          <a href="#gallery" className="hover:text-primary transition-colors">Gallery</a>
          <a href="#testimonials" className="hover:text-primary transition-colors">Reviews</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </nav>
        <a
          href={content.cta.buttonLink || "#contact"}
          className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow hover:opacity-90 transition-opacity"
        >
          {content.hero.ctaText}
        </a>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section
      className="relative text-white section-padding flex items-center justify-center min-h-[75vh]"
      style={{ background: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)" }}
    >
      <div className="absolute inset-0 bg-black/35" />
      <div className="container-custom relative z-10 text-center max-w-3xl">
        {content.hero.badge && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-sm font-medium mb-6 border border-white/20">
            <span>{content.hero.badge}</span>
          </div>
        )}
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">
          {content.hero.headline}
        </h1>
        <p className="text-lg sm:text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
          {content.hero.subheadline}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={content.hero.ctaLink}
            className="bg-accent text-gray-900 font-bold px-8 py-3.5 rounded-lg shadow-lg hover:scale-105 transition-transform"
          >
            {content.hero.ctaText}
          </a>
          <a
            href={"tel:" + (content.contact.phone || "").replace(/\D/g, "")}
            className="border-2 border-white/80 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Call Now
          </a>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="section-padding bg-gray-50 border-b border-gray-100">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            {content.about.headline}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            {content.about.body}
          </p>
          {content.about.highlights && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {content.about.highlights.map((h, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm">
                  <div className="text-accent text-xl mb-1">✦</div>
                  <div className="font-semibold text-gray-900 text-sm">{h}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MenuSection() {
  if (!content.menu) return null;
  return (
    <section id="menu" className="section-padding bg-white border-b border-gray-100">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {content.menu.headline}
          </h2>
          <p className="text-gray-600">Explore our handcrafted specialties.</p>
        </div>
        {content.menu.categories.map((cat, ci) => (
          <div key={ci} className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">{cat.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cat.items.map((item, ii) => (
                <article key={ii} className="flex justify-between items-start p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">{item.name}</h4>
                    {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                  </div>
                  {item.price && <span className="font-bold text-primary ml-4">{item.price}</span>}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesSection() {
  if (!content.services?.items?.length) return null;
  return (
    <section id="services" className="section-padding bg-white border-b border-gray-100">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {content.services.headline}
          </h2>
          <p className="text-gray-600">Tailored solutions delivered with precision and care.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.services.items.map((srv, i) => (
            <div key={i} className="p-6 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
                0{i + 1}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{srv.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{srv.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section id="gallery" className="section-padding bg-gray-50 border-b border-gray-100">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Visual Highlights
          </h2>
          <p className="text-gray-600">A glimpse into our work and atmosphere.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((num) => (
            <div key={num} className="aspect-video rounded-xl overflow-hidden shadow-sm bg-gray-200 border border-gray-200">
              <img
                src={"/placeholder-" + num + ".svg"}
                alt={"Gallery visual " + num}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  if (!content.testimonials?.items?.length) return null;
  return (
    <section id="testimonials" className="section-padding bg-white border-b border-gray-100">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {content.testimonials.headline}
          </h2>
          <p className="text-gray-600">Hear directly from our satisfied customers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {content.testimonials.items.map((t, i) => (
            <div key={i} className="p-6 rounded-xl bg-gray-50 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-accent text-lg mb-3">
                {"★".repeat(t.rating)}
              </div>
              <p className="text-gray-700 italic mb-4 leading-relaxed">"{t.comment}"</p>
              <div className="text-sm font-bold text-gray-900">{t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HoursSection() {
  if (!content.hours?.schedule?.length) return null;
  return (
    <section className="section-padding bg-gray-50 border-b border-gray-100">
      <div className="container-custom max-w-md mx-auto text-center">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
          {content.hours.headline}
        </h2>
        <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm divide-y divide-gray-100">
          {content.hours.schedule.map((item, i) => (
            <div key={i} className="py-3 flex justify-between text-sm">
              <span className="font-medium text-gray-800">{item.days}</span>
              <span className="text-gray-600">{item.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="section-padding bg-white border-b border-gray-100">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {content.contact.headline}
          </h2>
          <p className="text-gray-600">We would love to hear from you. Stop by or reach out.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 flex flex-col justify-center space-y-6">
            <div>
              <div className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Address</div>
              <address className="not-italic text-lg font-semibold text-gray-900 leading-snug">
                {content.contact.address}
              </address>
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Phone Number</div>
              <a
                href={"tel:" + (content.contact.phone || "").replace(/\D/g, "")}
                className="text-lg font-bold text-primary hover:underline inline-block"
              >
                {content.contact.phone || "Contact via desk"}
              </a>
            </div>
            {content.contact.email && (
              <div>
                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Email</div>
                <a
                  href={"mailto:" + content.contact.email}
                  className="text-base text-gray-700 hover:text-primary hover:underline"
                >
                  {content.contact.email}
                </a>
              </div>
            )}
          </div>
          <div className="aspect-square md:aspect-auto rounded-2xl overflow-hidden bg-gray-200 border border-gray-200 shadow-sm min-h-[260px]">
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
  );
}

function CtaSection() {
  return (
    <section className="section-padding bg-primary text-white text-center">
      <div className="container-custom max-w-3xl mx-auto">
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4">
          {content.cta.headline}
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
          {content.cta.subheadline}
        </p>
        <a
          href={content.cta.buttonLink}
          className="inline-block bg-accent text-gray-900 font-bold px-8 py-3.5 rounded-lg shadow-lg hover:scale-105 transition-transform text-lg"
        >
          {content.cta.buttonText}
        </a>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-12 text-sm border-t border-gray-900">
      <div className="container-custom text-center">
        <p className="font-medium text-gray-300 mb-2">{content.hero.headline}</p>
        {content.footer.tagline && <p className="text-gray-500 mb-4">{content.footer.tagline}</p>}
        <p>{content.footer.copyrightText}</p>
      </div>
    </footer>
  );
}
