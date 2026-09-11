import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface WebsitePreviewData {
  id: string;
  businessName: string;
  category: string;
  location: string;
  template: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Finds a matching directory in generated-websites/ based on id, leadId, or businessName.
 */
export function findGeneratedWebsiteDir(
  identifier: string,
  businessName?: string,
  leadId?: string
): string | null {
  const baseDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "generated-websites");
  if (!fs.existsSync(/*turbopackIgnore: true*/ baseDir)) return null;

  const entries = fs.readdirSync(/*turbopackIgnore: true*/ baseDir);

  // 1. Direct match with folder name
  if (entries.includes(identifier)) {
    return path.join(/*turbopackIgnore: true*/ baseDir, identifier);
  }

  // 2. Match by short ID (first 8 characters)
  const shortId = identifier.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  if (shortId.length >= 4) {
    const idMatch = entries.find((dir) => dir.toLowerCase().includes(shortId));
    if (idMatch) return path.join(/*turbopackIgnore: true*/ baseDir, idMatch);
  }

  // 3. Match by leadId if provided
  if (leadId) {
    const shortLeadId = leadId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
    if (shortLeadId.length >= 4) {
      const leadMatch = entries.find((dir) => dir.toLowerCase().includes(shortLeadId));
      if (leadMatch) return path.join(/*turbopackIgnore: true*/ baseDir, leadMatch);
    }
  }

  // 4. Match by slugified business name
  if (businessName) {
    const nameSlug = slugify(businessName).slice(0, 30);
    if (nameSlug.length >= 3) {
      const nameMatch = entries.find((dir) => dir.toLowerCase().startsWith(nameSlug) || dir.toLowerCase().includes(nameSlug));
      if (nameMatch) return path.join(/*turbopackIgnore: true*/ baseDir, nameMatch);
    }
  }

  return null;
}

/**
 * Processes pre-built Next.js out/index.html to be fully self-contained
 * by inlining CSS and removing external Next.js hydration chunks.
 */
function processOutHtml(projectDir: string): string | null {
  const htmlPath = path.join(projectDir, "out", "index.html");
  if (!fs.existsSync(htmlPath)) return null;

  let html = fs.readFileSync(htmlPath, "utf8");

  // Inlined Tailwind CSS chunk
  const chunksDir = path.join(projectDir, "out", "_next", "static", "chunks");
  if (fs.existsSync(chunksDir)) {
    const cssFile = fs.readdirSync(chunksDir).find((f) => f.endsWith(".css"));
    if (cssFile) {
      try {
        const cssContent = fs.readFileSync(path.join(chunksDir, cssFile), "utf8");
        html = html.replace(/<link[^>]+stylesheet[^>]*>/gi, "");
        html = html.replace("</head>", `<style>${cssContent}</style></head>`);
      } catch (err) {
        console.warn("Could not inline CSS chunk:", err);
      }
    }
  }

  // Remove script preloads and chunk scripts that fail without parent next runtime
  html = html.replace(/<link[^>]+as=["']script["'][^>]*>/gi, "");
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Interactive client runtime helper
  const helperScript = `
<script>
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for nav anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Mobile menu hamburger toggle
  const menuBtn = document.querySelector('button[aria-label="Toggle Navigation Menu"]');
  const nav = document.querySelector('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('hidden');
      nav.classList.toggle('flex');
      nav.classList.toggle('flex-col');
      nav.classList.toggle('absolute');
      nav.classList.toggle('top-full');
      nav.classList.toggle('left-0');
      nav.classList.toggle('w-full');
      nav.classList.toggle('bg-stone-950');
      nav.classList.toggle('p-5');
      nav.classList.toggle('border-b');
      nav.classList.toggle('border-white/10');
    });
  }

  // Interactive reservation & booking buttons
  document.querySelectorAll('button').forEach(btn => {
    const text = (btn.innerText || '').trim();
    if (
      text.includes('Reserve') ||
      text.includes('Book') ||
      text.includes('Order') ||
      text.includes('Inquire') ||
      text.includes('Appointment')
    ) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '24px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = '#059669';
        notification.style.color = '#ffffff';
        notification.style.padding = '12px 24px';
        notification.style.borderRadius = '9999px';
        notification.style.fontWeight = '600';
        notification.style.fontSize = '14px';
        notification.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
        notification.style.zIndex = '99999';
        notification.style.transition = 'all 0.3s ease';
        notification.innerText = '✓ Table reservation request confirmed! Confirmation sent to your WhatsApp.';
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 3500);
      });
    }
  });
});
</script>
</body>`;

  html = html.replace("</body>", helperScript);
  return html;
}

/**
 * Universal fallback high-fidelity generator when a site directory doesn't have pre-built out/
 */
export function generateSyntheticWebsiteHtml(data: WebsitePreviewData): string {
  const isFood = /restaurant|cafe|bar|kitchen|dining|bistro|dhaba|bhavan|grill|biryani|pizza/i.test(
    `${data.businessName} ${data.category}`
  );
  const isHealthOrSalon = /spa|salon|clinic|dental|health|care|wellness|beauty/i.test(
    `${data.businessName} ${data.category}`
  );

  const heroImage = isFood
    ? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
    : isHealthOrSalon
      ? "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80"
      : "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";

  const galleryImages = isFood
    ? [
        "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
      ]
    : [
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
      ];

  const rating = data.rating || 4.7;
  const reviews = data.reviewCount || 480;
  const phone = data.phone || "+91 422 244 5536";
  const cleanPhone = phone.replace(/[^0-9]/g, "") || "914222445536";

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${data.businessName} | Verified Business Website</title>
  <meta name="description" content="Official website for ${data.businessName} in ${data.location}. Rated ${rating}★ based on verified reviews."/>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-[#0c0a09] text-[#fdfbf7] antialiased min-h-screen flex flex-col selection:bg-amber-500 selection:text-black">
  <!-- Sticky Header -->
  <header class="sticky top-0 z-40 bg-[#0c0a09]/90 backdrop-blur-xl border-b border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
      <a href="#" class="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
        <span class="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></span>
        <span>${data.businessName}</span>
      </a>
      <nav class="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
        <a href="#about" class="hover:text-amber-400 transition-colors">About</a>
        <a href="#services" class="hover:text-amber-400 transition-colors">Offerings</a>
        <a href="#gallery" class="hover:text-amber-400 transition-colors">Gallery</a>
        <a href="#reviews" class="hover:text-amber-400 transition-colors">Reviews</a>
        <a href="#contact" class="hover:text-amber-400 transition-colors">Contact</a>
      </nav>
      <div class="flex items-center gap-3">
        <a href="tel:${cleanPhone}" class="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-stone-300 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 hover:border-amber-400/40">
          <span>📞</span><span>${phone}</span>
        </a>
        <button id="book-cta" class="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105">
          ${isFood ? "Reserve Table" : "Book Appointment"}
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative text-white py-20 lg:py-28 flex items-center justify-center overflow-hidden" style="background: radial-gradient(ellipse 90% 70% at 50% -10%, rgba(234, 88, 12, 0.22), rgba(12, 10, 9, 0)), linear-gradient(180deg, #17120e 0%, #0c0a09 100%)">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-semibold mb-6 border border-amber-500/20">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>★ ${rating} / 5.0 (${reviews} Verified Reviews) · ${data.location || "Coimbatore"}</span>
        </div>
        <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight mb-5 leading-tight text-white">
          ${data.businessName}
        </h1>
        <p class="text-base sm:text-lg text-stone-300 mb-8 leading-relaxed max-w-2xl font-normal">
          Premium ${data.category.toLowerCase()} experience in ${data.location || "the city"}. Dedicated to verified quality, artisanal craftsmanship, and exceptional customer hospitality.
        </p>
        <div class="flex flex-wrap items-center gap-3.5">
          <a href="#services" class="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold px-7 py-3.5 rounded-full shadow-xl hover:scale-105 transition-all text-sm sm:text-base inline-flex items-center gap-2">
            <span>📜</span><span>Explore Offerings</span>
          </a>
          <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(data.businessName)}%2C%20I%20found%20your%20website%20and%20would%20like%20to%20inquire" target="_blank" rel="noopener noreferrer" class="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-semibold px-6 py-3.5 rounded-full border border-[#25D366]/40 transition-all text-sm sm:text-base inline-flex items-center gap-2">
            <span>💬</span><span>WhatsApp Inquiry</span>
          </a>
        </div>
      </div>
      <div class="lg:col-span-5">
        <div class="relative rounded-3xl overflow-hidden bg-stone-900 border border-white/15 shadow-2xl">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="${heroImage}" alt="${data.businessName}" class="w-full h-full object-cover"/>
          </div>
          <div class="p-6 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent">
            <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Verified Listing</span>
            <h3 class="text-xl font-bold text-white mt-1">${data.businessName}</h3>
            <p class="text-xs text-stone-400 mt-1">${data.location} · Google Maps Verified</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Telemetry Stats Strip -->
  <section class="bg-[#120f0d] border-y border-white/10 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="text-amber-400 text-2xl sm:text-3xl font-bold">★ ${rating}</div>
          <div class="text-xs text-stone-400 mt-1">Google Rating</div>
        </div>
        <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="text-white text-2xl sm:text-3xl font-bold">${reviews}+</div>
          <div class="text-xs text-stone-400 mt-1">Verified Reviews</div>
        </div>
        <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="text-amber-400 text-2xl sm:text-3xl font-bold">${data.location || "Coimbatore"}</div>
          <div class="text-xs text-stone-400 mt-1">Prime Location</div>
        </div>
        <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="text-white text-2xl sm:text-3xl font-bold">100%</div>
          <div class="text-xs text-stone-400 mt-1">Authentic Quality</div>
        </div>
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section id="about" class="py-20 bg-[#0c0a09] border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-5">
        <div class="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img src="${galleryImages[0]}" alt="About ${data.businessName}" class="w-full aspect-[4/3] object-cover"/>
        </div>
      </div>
      <div class="lg:col-span-7">
        <div class="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Our Heritage</div>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">Serving with Dedication &amp; Excellence</h2>
        <p class="text-stone-300 text-base sm:text-lg leading-relaxed mb-6">
          At ${data.businessName}, we take immense pride in crafting exceptional experiences for our patrons. From our location in ${data.location || "the city"}, our team upholds rigorous standards of quality, freshness, and courteous customer service.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div class="text-amber-400 font-bold mb-1">01</div>
            <div class="text-white text-sm font-semibold">Premium Craftsmanship</div>
          </div>
          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div class="text-amber-400 font-bold mb-1">02</div>
            <div class="text-white text-sm font-semibold">Verified Hospitality</div>
          </div>
          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div class="text-amber-400 font-bold mb-1">03</div>
            <div class="text-white text-sm font-semibold">Swift Customer Care</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Gallery Section -->
  <section id="gallery" class="py-20 bg-[#100d0a] border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Visual Showcase</div>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-4">Gallery &amp; Ambiance</h2>
      <p class="text-stone-400 text-sm max-w-xl mx-auto mb-12">A glimpse into our freshly crafted experience and welcoming premises.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        ${galleryImages
          .map(
            (img, idx) => `
        <div class="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-xl group cursor-pointer relative">
          <img src="${img}" alt="Gallery ${idx + 1}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <span class="text-xs font-semibold text-amber-300">✦ Verified Experience</span>
          </div>
        </div>`
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- Reviews Section -->
  <section id="reviews" class="py-20 bg-[#0c0a09] border-b border-white/5">
    <div class="max-w-4xl mx-auto px-4 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-6">
        <span>★</span><span>Verified Google Maps Listing</span>
      </div>
      <div class="text-5xl sm:text-6xl font-extrabold text-white mb-2">${rating} <span class="text-2xl text-stone-500">/ 5.0</span></div>
      <div class="text-amber-400 text-2xl mb-4 tracking-widest">★★★★★</div>
      <p class="text-stone-300 text-sm sm:text-base mb-8">Based on ${reviews}+ verified customer ratings on Google Maps.</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-stone-300">
          <span class="text-amber-400 font-bold block mb-0.5">✓ Verified Service</span>Top local standard
        </div>
        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-stone-300">
          <span class="text-amber-400 font-bold block mb-0.5">✓ Prompt Care</span>Attentive staff
        </div>
        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-stone-300">
          <span class="text-amber-400 font-bold block mb-0.5">✓ Clean Premises</span>Strict hygiene
        </div>
        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-stone-300">
          <span class="text-amber-400 font-bold block mb-0.5">✓ High Value</span>Fair pricing
        </div>
      </div>
    </div>
  </section>

  <!-- Contact & Location Map -->
  <section id="contact" class="py-20 bg-[#100d0a] border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <div class="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2">Visit Us</div>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-3">Location &amp; Contact</h2>
        <p class="text-stone-400 text-sm">We look forward to welcoming you.</p>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-stretch">
        <div class="lg:col-span-6 bg-white/[0.02] p-8 rounded-3xl border border-white/10 flex flex-col justify-between space-y-6">
          <div>
            <div class="text-xs uppercase font-bold text-amber-400 mb-2">Address</div>
            <p class="text-base sm:text-lg font-medium text-white">${data.location || "Coimbatore, Tamil Nadu"}</p>
          </div>
          <div>
            <div class="text-xs uppercase font-bold text-amber-400 mb-2">Phone Inquiries</div>
            <a href="tel:${cleanPhone}" class="text-xl sm:text-2xl font-bold text-amber-400 hover:underline">${phone}</a>
          </div>
          <div>
            <div class="text-xs uppercase font-bold text-amber-400 mb-2">Hours</div>
            <p class="text-sm text-stone-300">Monday – Sunday: 08:00 AM – 10:30 PM</p>
          </div>
          <div class="pt-2 flex gap-3">
            <button id="book-bottom-cta" class="flex-1 text-center bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold py-3.5 rounded-xl transition-colors text-xs sm:text-sm shadow-md">
              ${isFood ? "Book Table" : "Book Service"}
            </button>
            <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-semibold py-3.5 rounded-xl border border-[#25D366]/40 text-xs sm:text-sm flex items-center justify-center gap-1.5">
              <span>💬</span> WhatsApp
            </a>
          </div>
        </div>
        <div class="lg:col-span-6 rounded-3xl overflow-hidden bg-stone-900 border border-white/10 min-h-[320px]">
          <iframe 
            src="https://maps.google.com/maps?q=${encodeURIComponent(data.businessName + " " + (data.location || "Coimbatore"))}&output=embed" 
            width="100%" 
            height="100%" 
            style="border:0;min-height:320px" 
            allowfullscreen="" 
            loading="lazy"
            title="Google Maps Location"
          ></iframe>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-[#080706] text-stone-500 py-10 text-xs border-t border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p>© 2026 ${data.businessName}. Synthesized by Vasaw AI. All rights reserved.</p>
      <a href="#" class="text-stone-400 hover:text-amber-400 transition-colors">↑ Back to top</a>
    </div>
  </footer>

  <!-- Floating WhatsApp CTA -->
  <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(data.businessName)}" target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center">
    <span class="text-2xl">💬</span>
  </a>

  <script>
    function showToast() {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:#fff;padding:12px 24px;border-radius:9999px;font-weight:600;font-size:14px;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:99999;transition:all 0.3s ease;';
      el.innerText = '✓ Request registered! We will reach out via WhatsApp shortly.';
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
    }
    document.querySelectorAll('#book-cta, #book-bottom-cta').forEach(b => b.addEventListener('click', showToast));
  </script>
</body>
</html>`;
}

/**
 * Main public entrypoint: resolves website HTML for previewing
 */
export async function getWebsitePreviewHtml(identifier: string): Promise<string> {
  const knownConvs: Record<string, WebsitePreviewData> = {
    "conv-1": {
      id: "conv-1",
      businessName: "Saravana Bhavan Grand",
      category: "Restaurant",
      location: "Covent Garden, London",
      template: "restaurant",
      phone: "+44 20 7946 0991",
      rating: 4.8,
      reviewCount: 920,
    },
    "conv-2": {
      id: "conv-2",
      businessName: "Aura Luxury Salon & Spa",
      category: "Salon & Spa",
      location: "SoHo, New York",
      template: "salon",
      phone: "+1 212 555 0192",
      rating: 4.9,
      reviewCount: 440,
    },
    "conv-3": {
      id: "conv-3",
      businessName: "Metropolitan Dental Healthcare",
      category: "Healthcare",
      location: "Shibuya, Tokyo",
      template: "healthcare",
      phone: "+81 3 5555 0143",
      rating: 4.7,
      reviewCount: 310,
    },
    "conv-4": {
      id: "conv-4",
      businessName: "L'Artisan Boulangerie",
      category: "Cafe",
      location: "Downtown, Dubai",
      template: "cafe",
      phone: "+971 4 321 4567",
      rating: 4.8,
      reviewCount: 650,
    },
    "conv-5": {
      id: "conv-5",
      businessName: "Apex CrossFit & Fitness Hub",
      category: "Fitness",
      location: "SOMA, San Francisco",
      template: "fitness",
      phone: "+1 415 555 0188",
      rating: 4.9,
      reviewCount: 520,
    },
  };

  let websiteData: WebsitePreviewData = knownConvs[identifier] || {
    id: identifier,
    businessName: "Business Website",
    category: "Restaurant",
    location: "Coimbatore, Tamil Nadu",
    template: "corporate-v2",
  };

  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("websites")
      .select("*")
      .or(`id.eq.${identifier},lead_id.eq.${identifier}`)
      .limit(1)
      .single();

    if (data) {
      websiteData = {
        id: data.id,
        businessName: data.business_name || "Business Website",
        category: data.category || "Restaurant",
        location: data.location || "Coimbatore, Tamil Nadu",
        template: data.template || "corporate-v2",
      };
    }
  } catch {
    // Continue with identifier
  }

  // 2. Look for project directory on disk
  const matchedDir = findGeneratedWebsiteDir(identifier, websiteData.businessName, websiteData.id);

  if (matchedDir) {
    const processed = processOutHtml(matchedDir);
    if (processed) {
      return processed;
    }
  }

  // 3. Fallback: generate high-fidelity responsive HTML
  return generateSyntheticWebsiteHtml(websiteData);
}
