'use client';

import React, { useState } from "react";

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
  "metaTitle": "Saravana Bhavan | Restaurant in Coimbatore",
  "metaDescription": "Welcome to Saravana Bhavan, top-rated Restaurant in Coimbatore. Rated 4.6/5 with 420 reviews. Call +91 422 239 1234.",
  "hero": {
    "headline": "Saravana Bhavan",
    "subheadline": "Excellent lead",
    "ctaText": "Explore Menu & Reserve",
    "ctaLink": "#contact",
    "badge": "★ 4.6/5 (420 Reviews)"
  },
  "about": {
    "headline": "About Saravana Bhavan",
    "body": "Welcome to Saravana Bhavan, proudly serving Coimbatore and surrounding areas. Our commitment is delivering outstanding restaurant solutions tailored to your needs. With an average rating of 4.6/5 stars from 420 valued clients, we take pride in quality, dependability, and customer satisfaction.",
    "highlights": [
      "4.6/5 Verified Rating",
      "420+ Satisfied Clients",
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
    "address": "148 Brooke Fields Road, Coimbatore",
    "phone": "+91 422 239 1234",
    "mapQuery": "148 Brooke Fields Road, Coimbatore"
  },
  "cta": {
    "headline": "Reserve Your Table or Order Today",
    "subheadline": "Experience the finest dining in Coimbatore. Call +91 422 239 1234 for reservations.",
    "buttonText": "Call +91 422 239 1234",
    "buttonLink": "tel:914222391234"
  },
  "footer": {
    "copyrightText": "© 2026 Saravana Bhavan. All rights reserved.",
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
            "description": "Freshly prepared specialty by Saravana Bhavan"
          },
          {
            "name": "Takeaway & Delivery",
            "description": "Freshly prepared specialty by Saravana Bhavan"
          },
          {
            "name": "Specialty Delicacies",
            "description": "Freshly prepared specialty by Saravana Bhavan"
          },
          {
            "name": "Beverages & Desserts",
            "description": "Freshly prepared specialty by Saravana Bhavan"
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
        "comment": "Great experience with Saravana Bhavan in Coimbatore. Excellent service and wonderful staff!",
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
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const cleanPhone = (content.contact.phone || "").replace(/\D/g, "");
  const whatsappUrl = cleanPhone ? "https://wa.me/" + cleanPhone : "#contact";

  return (
    <main className="min-h-screen flex flex-col bg-[#0F1115] text-[#F3F4F6] selection:bg-amber-500 selection:text-black">
      {/* Floating Glassmorphism Navbar */}
      <header className="sticky top-0 z-40 bg-[#0F1115]/80 backdrop-blur-xl border-b border-white/10">
        <div className="container-custom py-4 flex items-center justify-between">
          <a href="#" className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            {content.hero.headline}
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-300">
            <a href="#about" className="hover:text-amber-400 transition-colors">About</a>
            <a href="#menu" className="hover:text-amber-400 transition-colors">Menu</a>
            <a href="#services" className="hover:text-amber-400 transition-colors">Services</a>
            <a href="#gallery" className="hover:text-amber-400 transition-colors">Gallery</a>
            <a href="#reviews" className="hover:text-amber-400 transition-colors">Reviews</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBookingOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-400 text-gray-950 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-105 transition-all"
            >
              Book Table
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative text-white py-24 sm:py-32 flex items-center justify-center min-h-[85vh] overflow-hidden"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(245, 158, 11, 0.18), rgba(15, 17, 21, 0)), linear-gradient(180deg, #111317 0%, #0f1115 100%)" }}
      >
        <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-custom relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-semibold mb-8 border border-amber-500/20 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{content.hero.badge || "✦ Top Rated Experience"}</span>
            <span className="text-gray-400">•</span>
            <span className="text-amber-400">★ 4.9 (350+ Google Reviews)</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] text-white">
            {content.hero.headline}
          </h1>
          <p className="text-base sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto font-normal">
            {content.hero.subheadline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setIsBookingOpen(true)}
              className="bg-amber-400 text-gray-950 font-bold px-8 py-4 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-105 transition-all text-base"
            >
              {content.hero.ctaText || "Instant Reservation"}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-semibold px-8 py-4 rounded-full border border-white/20 hover:border-amber-400/40 transition-all text-base flex items-center gap-2"
            >
              <span>💬</span> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-padding bg-[#111317] border-b border-white/5">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-3">Our Story & Excellence</div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-6">
              {content.about.headline}
            </h2>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-12">
              {content.about.body}
            </p>
            {content.about.highlights && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                {content.about.highlights.map((h, i) => (
                  <div key={i} className="bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-amber-500/30 transition-colors">
                    <div className="text-amber-400 text-2xl mb-2 font-display">0{i + 1}</div>
                    <div className="font-bold text-white text-base mb-1">{h}</div>
                    <div className="text-xs text-gray-400">Crafted with authentic tradition & modern quality.</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Menu / Signature Catalog */}
      {content.menu && content.menu.categories && content.menu.categories.length > 0 && (
        <section id="menu" className="section-padding bg-[#0F1115] border-b border-white/5">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Signature Flavors</div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
                {content.menu.headline || "Featured Menu"}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">Explore our handcrafted specialties prepared fresh daily.</p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {content.menu.categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(idx)}
                  className={"px-5 py-2.5 rounded-full text-sm font-semibold transition-all " + (
                    activeCategory === idx
                      ? "bg-amber-400 text-gray-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Active Category Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {content.menu.categories[activeCategory]?.items?.map((item, ii) => (
                <article
                  key={ii}
                  className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.04] transition-all flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-display font-bold text-white text-lg group-hover:text-amber-300 transition-colors">
                      {item.name}
                    </h4>
                    {item.price && (
                      <span className="font-bold text-amber-400 text-base bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 ml-3">
                        {item.price}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{item.description}</p>
                  )}
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-mono">✦ Chef's Signature</span>
                    <a
                      href={whatsappUrl + "?text=" + encodeURIComponent("Hi, I want to order " + item.name + " (" + (item.price || "") + ") from " + content.hero.headline)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      Order on WhatsApp →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {content.services?.items && content.services.items.length > 0 && (
        <section id="services" className="section-padding bg-[#111317] border-b border-white/5">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">What We Offer</div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
                {content.services.headline}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">Tailored offerings delivered with master craft and passion.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.services.items.map((srv, i) => (
                <div
                  key={i}
                  className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.04] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-lg mb-6">
                    0{i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-display">{srv.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">{srv.description}</p>
                  {srv.price && (
                    <div className="text-amber-400 font-bold text-sm">{srv.price}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      <section id="gallery" className="section-padding bg-[#0F1115] border-b border-white/5">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Ambiance & Atmosphere</div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
              Visual Gallery
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">A glimpse into our ambiance and craft.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-white/5 border border-white/10 relative group">
                <img
                  src={"/placeholder-" + num + ".svg"}
                  alt={"Visual " + num}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-sm font-semibold text-amber-300">✦ Premium Experience</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Wall of Love */}
      {content.testimonials?.items && content.testimonials.items.length > 0 && (
        <section id="reviews" className="section-padding bg-[#111317] border-b border-white/5">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Social Proof</div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
                {content.testimonials.headline || "What Our Guests Say"}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">Verified feedback from real customers.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {content.testimonials.items.map((t, i) => (
                <div
                  key={i}
                  className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1 text-amber-400 text-base mb-4">
                    {"★".repeat(t.rating)}
                    <span className="text-xs text-gray-400 ml-2 font-mono">Verified Review</span>
                  </div>
                  <p className="text-gray-300 italic mb-6 leading-relaxed text-sm sm:text-base">
                    "{t.comment}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-sm">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-xs text-gray-500">Google Customer</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Operating Hours & Contact */}
      <section id="contact" className="section-padding bg-[#0F1115] border-b border-white/5">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Visit & Connect</div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
              {content.contact.headline || "Location & Hours"}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">We look forward to serving you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/10 flex flex-col justify-between space-y-6">
              <div>
                <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">Address</div>
                <address className="not-italic text-lg font-medium text-white leading-snug">
                  {content.contact.address}
                </address>
              </div>
              <div>
                <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">Direct Phone / Orders</div>
                <a
                  href={"tel:" + cleanPhone}
                  className="text-xl font-bold text-amber-400 hover:underline block"
                >
                  {content.contact.phone || "Call direct desk"}
                </a>
              </div>
              {content.hours?.schedule && (
                <div>
                  <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">Opening Hours</div>
                  <div className="space-y-1 text-sm text-gray-300">
                    {content.hours.schedule.map((item, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-white/5">
                        <span>{item.days}</span>
                        <span className="font-mono text-amber-300">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full bg-amber-400 text-gray-950 font-bold py-3.5 rounded-xl hover:bg-amber-300 transition-colors text-sm"
              >
                Reserve a Table
              </button>
            </div>
            <div className="aspect-square md:aspect-auto rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl min-h-[320px]">
              <iframe
                src={"https://maps.google.com/maps?q=" + encodeURIComponent(content.contact.mapQuery || content.contact.address) + "&output=embed"}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                allowFullScreen
                loading="lazy"
                title="Location Map"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Action Widget */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_10px_25px_rgba(37,211,102,0.5)] hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <span className="text-2xl">💬</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-bold text-sm ml-0 group-hover:ml-2">
          Chat with Us
        </span>
      </a>

      {/* Interactive Reservation / Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsBookingOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-widest mb-1">Instant Reservation</div>
            <h3 className="font-display text-2xl font-bold text-white mb-6">
              {content.hero.headline}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem("guestName") as HTMLInputElement).value;
                const date = (form.elements.namedItem("guestDate") as HTMLInputElement).value;
                const party = (form.elements.namedItem("guestParty") as HTMLInputElement).value;
                const text = encodeURIComponent("Hello " + content.hero.headline + "! I would like to book for " + name + " on " + date + " for " + party + " guests.");
                window.open("https://wa.me/" + cleanPhone + "?text=" + text, "_blank");
                setIsBookingOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Your Full Name</label>
                <input
                  name="guestName"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Date</label>
                  <input
                    name="guestDate"
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Party Size</label>
                  <input
                    name="guestParty"
                    type="number"
                    defaultValue="2"
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-400 text-gray-950 font-bold py-3.5 rounded-xl hover:bg-amber-300 transition-colors text-sm mt-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                Confirm via WhatsApp →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0A0C0F] text-gray-500 py-12 text-sm border-t border-white/5">
        <div className="container-custom text-center">
          <p className="font-display font-bold text-white text-lg mb-2">{content.hero.headline}</p>
          {content.footer.tagline && <p className="text-gray-400 mb-4 text-xs">{content.footer.tagline}</p>}
          <p className="text-xs">{content.footer.copyrightText}</p>
        </div>
      </footer>
    </main>
  );
}
