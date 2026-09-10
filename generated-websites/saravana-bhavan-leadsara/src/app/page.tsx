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
  "metaDescription": "Saravana Bhavan in Coimbatore. Rated 4.6★ based on 420 Google reviews. Professional restaurant services. Contact us today.",
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
const visuals = {
  "heroImage": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1600&q=85",
  "aboutImage": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
  "gallery": [
    {
      "url": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80",
      "alt": "Crispy Golden Dosa with Chutneys",
      "caption": "Signature Ghee Roast Dosa"
    },
    {
      "url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=80",
      "alt": "Aromatic Dum Biryani Platter",
      "caption": "Special Dum Biryani & Raita"
    },
    {
      "url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
      "alt": "Traditional South Indian Curry & Spices",
      "caption": "Freshly Ground Spice Masala"
    },
    {
      "url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
      "alt": "Traditional South Indian Filter Coffee",
      "caption": "Fresh Brewed Filter Coffee"
    }
  ]
};

export default function HomePage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const cleanPhone = (content.contact.phone || "").replace(/\D/g, "");
  const whatsappUrl = cleanPhone ? "https://wa.me/" + cleanPhone : "#contact";
  const mapsUrl = "https://maps.google.com/maps?q=" + encodeURIComponent(content.contact.mapQuery || content.contact.address);

  const ratingValue = 4.6;
  const reviewCountValue = 420;
  const cityName = "Coimbatore";
  const templateId: string = "restaurant";
  const isFoodBusiness = templateId === "restaurant" || templateId === "cafe";
  const isHotel = templateId === "hotel";
  const isSalonOrSpa = templateId === "salon" || templateId === "spa";
  const isGym = templateId === "gym";
  const isClinic = templateId === "clinic";
  const isRetail = templateId === "retail";
  const isProfessional = templateId === "professional";

  const bookingCtaLabel = isFoodBusiness ? "Reserve Table" : isHotel ? "Book Stay" : isSalonOrSpa ? "Book Appointment" : isGym ? "Get Free Pass" : isClinic ? "Book Consultation" : isProfessional ? "Schedule Advisory" : isRetail ? "Inquire Online" : "Get in Touch";
  const modalCategoryHeading = isFoodBusiness ? "Table Reservation" : isHotel ? "Room Reservation & Inquiries" : isSalonOrSpa ? "Appointment Booking" : isGym ? "Free Day Pass & Tour" : isClinic ? "Doctor Consultation Request" : isProfessional ? "Consultation Request" : isRetail ? "Product Inquiry" : "Direct Inquiry";
  const showDateInput = isFoodBusiness || isHotel || isSalonOrSpa || isGym || isClinic || isProfessional;
  const showPartyInput = isFoodBusiness || isHotel;

  return (
    <main className="min-h-screen flex flex-col bg-[#0c0a09] text-[#fdfbf7] selection:bg-amber-500 selection:text-black">
      {/* 1. Sticky Premium Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0c0a09]/90 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="container-custom py-3.5 flex items-center justify-between">
          <a href="#" className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20 group-hover:scale-125 transition-transform" />
            <span className="group-hover:text-amber-300 transition-colors">{content.hero.headline}</span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-300">
            <a href="#about" className="hover:text-amber-400 transition-colors">About</a>
            {isFoodBusiness && <a href="#menu" className="hover:text-amber-400 transition-colors">Menu</a>}
            <a href="#services" className="hover:text-amber-400 transition-colors">{isHotel ? "Rooms & Amenities" : isRetail ? "Collections" : isProfessional ? "Practice Areas" : "Services"}</a>
            <a href="#gallery" className="hover:text-amber-400 transition-colors">Gallery</a>
            <a href="#reviews" className="hover:text-amber-400 transition-colors">Reviews</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Location & Contact</a>
          </nav>

          {/* Right Action Button & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            {content.contact.phone ? (
              <a
                href={"tel:" + cleanPhone}
                className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-stone-300 hover:text-white px-3.5 py-2 rounded-full bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors"
              >
                <span>📞</span>
                <span>{content.contact.phone}</span>
              </a>
            ) : null}

            <button
              onClick={() => setIsBookingOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_28px_rgba(234,88,12,0.5)] transition-all transform hover:-translate-y-0.5"
            >
              {bookingCtaLabel}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-stone-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#120f0d] border-b border-white/10 px-6 py-5 space-y-4">
            <div className="flex flex-col space-y-3 text-base font-medium text-stone-200">
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="py-1 hover:text-amber-400">About</a>
              {isFoodBusiness && <a href="#menu" onClick={() => setIsMobileMenuOpen(false)} className="py-1 hover:text-amber-400">Menu</a>}
              <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="py-1 hover:text-amber-400">Services</a>
              <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className="py-1 hover:text-amber-400">Gallery</a>
              <a href="#reviews" onClick={() => setIsMobileMenuOpen(false)} className="py-1 hover:text-amber-400">Reviews</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="py-1 hover:text-amber-400">Location & Hours</a>
            </div>
            {content.contact.phone && (
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <a
                  href={"tel:" + cleanPhone}
                  className="w-full text-center bg-white/10 text-white font-semibold py-2.5 rounded-xl border border-white/15 text-sm"
                >
                  Call {content.contact.phone}
                </a>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section
        className="relative text-white py-16 sm:py-24 lg:py-28 flex items-center justify-center min-h-[85vh] overflow-hidden"
        style={{ background: "radial-gradient(ellipse 90% 70% at 50% -10%, rgba(234, 88, 12, 0.22), rgba(12, 10, 9, 0)), linear-gradient(180deg, #17120e 0%, #0c0a09 100%)" }}
      >
        <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Subtle atmospheric backdrop image */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
          <img
            src={visuals.heroImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 text-left">
              {/* Verified Rating Chip */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-semibold mb-6 border border-amber-500/20 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{content.hero.badge || ("★ " + ratingValue + " on Google Maps · " + cityName)}</span>
              </div>

              {/* Business Name Headline */}
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-5 leading-[1.1] text-white">
                {content.hero.headline}
              </h1>

              {/* Customer Value Proposition */}
              <p className="text-base sm:text-lg lg:text-xl text-stone-300 mb-8 leading-relaxed max-w-2xl font-normal">
                {content.hero.subheadline}
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5">
                {isFoodBusiness && (
                  <a
                    href="#menu"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold px-7 py-3.5 rounded-full shadow-[0_0_25px_rgba(234,88,12,0.4)] hover:scale-105 transition-all text-sm sm:text-base inline-flex items-center gap-2"
                  >
                    <span>📜</span>
                    <span>{content.hero.ctaText || "View Menu"}</span>
                  </a>
                )}

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-semibold px-6 py-3.5 rounded-full border border-white/20 hover:border-amber-400/40 transition-all text-sm sm:text-base inline-flex items-center gap-2"
                >
                  <span>📍</span>
                  <span>Get Directions</span>
                </a>

                {cleanPhone && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-semibold px-6 py-3.5 rounded-full border border-[#25D366]/40 transition-all text-sm sm:text-base inline-flex items-center gap-2"
                  >
                    <span>💬</span>
                    <span>Order on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden bg-stone-900 border border-white/15 shadow-2xl group">
                <div className="aspect-[4/3] sm:aspect-[16/11] overflow-hidden">
                  <img
                    src={visuals.heroImage}
                    alt={content.hero.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex flex-col justify-end p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                      {isFoodBusiness ? "Traditional Kitchen" : "Signature Service"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-semibold border border-white/10">
                      ★ {ratingValue} Rating
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                    {content.hero.headline}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300 leading-snug mb-4">
                    Serving authentic taste and fresh preparations daily in {cityName}.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsBookingOpen(true)}
                      className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
                    >
                      {isFoodBusiness ? "Book Table / Inquire" : "Contact Desk"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Verified Quick Facts Strip */}
      <section className="bg-[#120f0d] border-y border-white/10 py-6">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-amber-400 font-display text-2xl sm:text-3xl font-bold">★ {ratingValue}</div>
              <div className="text-xs sm:text-sm text-stone-400 mt-1">Google Rating</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-white font-display text-2xl sm:text-3xl font-bold">{reviewCountValue > 0 ? reviewCountValue + "+" : "Verified"}</div>
              <div className="text-xs sm:text-sm text-stone-400 mt-1">Customer Reviews</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-amber-400 font-display text-2xl sm:text-3xl font-bold">{cityName}</div>
              <div className="text-xs sm:text-sm text-stone-400 mt-1">Prime Location</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-white font-display text-2xl sm:text-3xl font-bold">Fresh Daily</div>
              <div className="text-xs sm:text-sm text-stone-400 mt-1">{isFoodBusiness ? "Authentic Kitchen" : "Dedicated Service"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. About Section */}
      <section id="about" className="section-padding bg-[#0c0a09] border-b border-white/5">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* About Image */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                <img
                  src={visuals.aboutImage}
                  alt={content.about.headline}
                  className="w-full aspect-[4/3] sm:aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                  <span className="text-xs sm:text-sm font-semibold text-amber-300">
                    ✦ Serving {cityName} with Passion & Freshness
                  </span>
                </div>
              </div>
            </div>

            {/* About Content */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Our Story</div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                {content.about.headline}
              </h2>
              <p className="text-base sm:text-lg text-stone-300 leading-relaxed mb-8">
                {content.about.body}
              </p>

              {content.about.highlights && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {content.about.highlights.map((h, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <div className="text-amber-400 text-lg font-bold mb-1 font-display">0{i + 1}</div>
                      <div className="font-semibold text-white text-sm">{h}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Menu / Offerings Section */}
      {content.menu && content.menu.categories && content.menu.categories.length > 0 && (
        <section id="menu" className="section-padding bg-[#100d0a] border-b border-white/5">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Authentic Flavours</div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
                {content.menu.headline || "Our Specialties"}
              </h2>
              <p className="text-stone-400 text-sm sm:text-base">
                Freshly cooked daily using authentic spices and traditional recipes.
              </p>
            </div>

            {/* Category Tabs */}
            {content.menu.categories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {content.menu.categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCategory(idx)}
                    className={"px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all " + (
                      activeCategory === idx
                        ? "bg-amber-400 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-105"
                        : "bg-white/5 text-stone-300 hover:bg-white/10 border border-white/10"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active Category Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {content.menu.categories[activeCategory]?.items?.map((item, ii) => (
                <article
                  key={ii}
                  className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.04] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <h4 className="font-display font-bold text-white text-lg group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </h4>
                      {item.price && (
                        <span className="font-semibold text-amber-400 text-xs sm:text-sm bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 whitespace-nowrap">
                          {item.price}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-stone-400 leading-relaxed mb-4">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-stone-400 font-medium">✦ Fresh Preparation</span>
                    {cleanPhone && (
                      <a
                        href={whatsappUrl + "?text=" + encodeURIComponent("Hi " + content.hero.headline + ", I would like to order: " + item.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        Order on WhatsApp →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Daily Menu & Special Inquiries Notice */}
            <div className="mt-10 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 max-w-3xl mx-auto text-center">
              <p className="text-stone-300 text-sm mb-3">
                Our kitchen also serves special daily preparations and seasonal delicacies.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {content.contact.phone && (
                  <a
                    href={"tel:" + cleanPhone}
                    className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full bg-amber-400 text-stone-950 hover:bg-amber-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>📞</span> Call Kitchen for Today's Specials
                  </a>
                )}
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors"
                >
                  Reserve Table / Inquire
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Services Section */}
      {content.services?.items && content.services.items.length > 0 && (
        <section id="services" className="section-padding bg-[#0c0a09] border-b border-white/5">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Hospitality & Service</div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
                {content.services.headline}
              </h2>
              <p className="text-stone-400 text-sm sm:text-base">
                Committed to delivering exceptional dining and customer service.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.services.items.map((srv, i) => (
                <div
                  key={i}
                  className="p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.04] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
                      0{i + 1}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 font-display">{srv.title}</h3>
                    <p className="text-xs sm:text-sm text-stone-400 leading-relaxed mb-4">{srv.description}</p>
                  </div>
                  {srv.price && (
                    <div className="text-amber-400 font-semibold text-xs pt-2 border-t border-white/5">{srv.price}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Gallery Section */}
      <section id="gallery" className="section-padding bg-[#100d0a] border-b border-white/5">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Visual Showcase</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              Gallery & Ambiance
            </h2>
            <p className="text-stone-400 text-sm sm:text-base">
              A glimpse into our freshly crafted food and dining experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visuals.gallery.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxImage(img.url)}
                className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl bg-stone-900 border border-white/10 relative group cursor-pointer"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-xs font-bold text-amber-300">{img.caption}</span>
                  <span className="text-[11px] text-stone-400">Click to view full photo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl w-full max-h-[85vh] rounded-2xl overflow-hidden border border-white/20">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg hover:bg-black"
            >
              ✕
            </button>
            <img src={lightboxImage} alt="Gallery view" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* 8. Verified Google Reviews Section */}
      <section id="reviews" className="section-padding bg-[#0c0a09] border-b border-white/5">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Guest Feedback</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              Google Maps Reviews
            </h2>
            <p className="text-stone-400 text-sm sm:text-base">
              Verified scores and feedback from our guests in {cityName}.
            </p>
          </div>

          {/* Verified Google Rating Showcase Card */}
          <div className="max-w-3xl mx-auto p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 shadow-2xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-6">
              <span>★</span>
              <span>Verified Google Maps Listing</span>
            </div>

            <div className="font-display text-5xl sm:text-6xl font-bold text-white mb-2">
              {ratingValue} <span className="text-2xl sm:text-3xl text-stone-500">/ 5.0</span>
            </div>

            <div className="flex justify-center text-amber-400 text-2xl mb-3 tracking-widest">
              {"★".repeat(Math.round(ratingValue))}
            </div>

            <p className="text-stone-300 text-sm sm:text-base mb-6">
              Based on {reviewCountValue > 0 ? reviewCountValue.toLocaleString() : "hundreds of"} customer reviews on Google Maps in {cityName}.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left mb-8">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-stone-300">
                <span className="text-amber-400 font-bold block mb-0.5">✓ Authentic Taste</span>
                Fresh daily ingredients
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-stone-300">
                <span className="text-amber-400 font-bold block mb-0.5">✓ Prompt Service</span>
                Fast dine-in & parcel
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-stone-300">
                <span className="text-amber-400 font-bold block mb-0.5">✓ Clean & Hygienic</span>
                Quality food safety
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-stone-300">
                <span className="text-amber-400 font-bold block mb-0.5">✓ Family Friendly</span>
                Welcoming atmosphere
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-full border border-white/20 hover:border-amber-400/40 transition-colors"
            >
              <span>📍</span>
              <span>View Location & Reviews on Google Maps</span>
            </a>
          </div>
        </div>
      </section>

      {/* 9. Location & Contact Section */}
      <section id="contact" className="section-padding bg-[#100d0a] border-b border-white/5">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Visit & Connect</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              {content.contact.headline || "Location & Hours"}
            </h2>
            <p className="text-stone-400 text-sm sm:text-base">We look forward to welcoming you.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Contact Details Card */}
            <div className="lg:col-span-6 bg-white/[0.02] p-7 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between space-y-6">
              <div>
                <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">Address</div>
                <address className="not-italic text-base sm:text-lg font-medium text-white leading-snug">
                  {content.contact.address}
                </address>
              </div>

              {content.contact.phone && (
                <div>
                  <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">Direct Phone / Orders</div>
                  <a
                    href={"tel:" + cleanPhone}
                    className="text-xl sm:text-2xl font-bold text-amber-400 hover:underline block"
                  >
                    {content.contact.phone}
                  </a>
                </div>
              )}

              {content.hours?.schedule && (
                <div>
                  <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">Opening Hours</div>
                  <div className="space-y-1.5 text-xs sm:text-sm text-stone-300">
                    {content.hours.schedule.map((item, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-white/5">
                        <span>{item.days}</span>
                        <span className="font-mono text-amber-300">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold py-3.5 rounded-xl transition-colors text-xs sm:text-sm shadow-md"
                >
                  Get Directions ↗
                </a>
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="flex-1 text-center bg-white/10 hover:bg-white/15 text-white font-semibold py-3.5 rounded-xl border border-white/15 transition-colors text-xs sm:text-sm"
                >
                  {isFoodBusiness ? "Reserve a Table" : "Inquire Now"}
                </button>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="lg:col-span-6 rounded-3xl overflow-hidden bg-stone-900 border border-white/10 shadow-2xl min-h-[340px]">
              <iframe
                src={"https://maps.google.com/maps?q=" + encodeURIComponent(content.contact.mapQuery || content.contact.address) + "&output=embed"}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "340px" }}
                allowFullScreen
                loading="lazy"
                title="Google Maps Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 10. Natural Closing CTA Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-[#100d0a] to-[#0c0a09] border-b border-white/10">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {content.cta.headline}
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
            {content.cta.subheadline}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setIsBookingOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold px-8 py-4 rounded-full shadow-[0_0_25px_rgba(234,88,12,0.4)] hover:scale-105 transition-all text-sm sm:text-base"
            >
              {isFoodBusiness ? "Book Your Table" : "Contact Desk"}
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-full border border-white/20 transition-all text-sm sm:text-base"
            >
              Get Directions
            </a>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="bg-[#080706] text-stone-500 py-12 text-xs sm:text-sm border-t border-white/5">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-display font-bold text-white text-lg mb-2">{content.hero.headline}</p>
              <p className="text-stone-400 text-xs leading-relaxed max-w-xs">{content.footer.tagline}</p>
            </div>
            <div>
              <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">Location</div>
              <p className="text-stone-400 text-xs leading-relaxed">{content.contact.address}</p>
            </div>
            <div>
              <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">Contact</div>
              <p className="text-stone-400 text-xs">{content.contact.phone || "Reach out to our team"}</p>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>{content.footer.copyrightText}</p>
            <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
              ↑ Back to top
            </a>
          </div>
        </div>
      </footer>

      {/* 12. Floating WhatsApp Widget */}
      {cleanPhone && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 sm:p-4 rounded-full shadow-[0_10px_25px_rgba(37,211,102,0.5)] hover:scale-110 transition-transform flex items-center justify-center group"
        >
          <span className="text-2xl">💬</span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-bold text-xs sm:text-sm ml-0 group-hover:ml-2">
            Order / Inquire
          </span>
        </a>
      )}

      {/* 13. Interactive Reservation / Inquiry Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14110f] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsBookingOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white text-xl p-2"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-widest mb-1">
              {modalCategoryHeading}
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-5">
              {content.hero.headline}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem("guestName") as HTMLInputElement).value;
                const date = (form.elements.namedItem("guestDate") as HTMLInputElement)?.value || "";
                const party = (form.elements.namedItem("guestParty") as HTMLInputElement)?.value || "2";
                const notes = (form.elements.namedItem("guestNotes") as HTMLInputElement)?.value || "";
                const dateInfo = date ? (" for " + date) : "";
                const partyInfo = showPartyInput ? (" for " + party + " guests") : "";
                const text = encodeURIComponent(
                  "Hello " + content.hero.headline + "! My name is " + name + "." +
                  (isFoodBusiness ? " I would like to book a table" + partyInfo + dateInfo + "." :
                   isHotel ? " I would like to inquire about room booking" + partyInfo + dateInfo + "." :
                   isSalonOrSpa ? " I would like to book a styling/spa appointment" + dateInfo + "." :
                   isGym ? " I would like to request a free gym pass and facility tour" + dateInfo + "." :
                   isClinic ? " I would like to schedule a consultation" + dateInfo + "." :
                   isProfessional ? " I would like to schedule an advisory consultation" + dateInfo + "." :
                   " I have an inquiry regarding your services.") +
                  (notes ? " Note: " + notes : "")
                );
                window.open("https://wa.me/" + cleanPhone + "?text=" + text, "_blank");
                setIsBookingOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Your Full Name</label>
                <input
                  name="guestName"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              {showDateInput && (
                <div className={"grid " + (showPartyInput ? "grid-cols-2" : "grid-cols-1") + " gap-3"}>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">Preferred Date</label>
                    <input
                      name="guestDate"
                      type="date"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                    />
                  </div>
                  {showPartyInput && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">{isHotel ? "Guests" : "Party Size"}</label>
                      <input
                        name="guestParty"
                        type="number"
                        defaultValue="2"
                        min="1"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Special Notes / Inquiries (Optional)</label>
                <input
                  name="guestNotes"
                  placeholder="e.g. Specific requirements / timing preferences"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold py-3.5 rounded-xl transition-all text-sm mt-2 shadow-[0_0_20px_rgba(234,88,12,0.3)]"
              >
                Send Request via WhatsApp →
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
