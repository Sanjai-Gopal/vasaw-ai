const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPABASE_URL = 'https://vumaeodrcxylyrtgpeep.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bWFlb2RyY3h5bHlydGdwZWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIyNjA2OCwiZXhwIjoyMTAyODAyMDY4fQ.tT03G0mSemGQBUH8c6VjXNxFqgFuS0VA9fZdo9Yg_sA';
const GITHUB_TOKEN = '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';
const VERCEL_TOKEN = 'vcp_7Ir1fK3jPx5aHbJMOI3MHoQWH3pwWVKVYW6TNRFXBrLF91e2Kn3hRxVh';
const VERCEL_TEAM_ID = undefined;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GITHUB_API = 'https://api.github.com';
const VERCEL_API = 'https://api.vercel.com';

const businesses = [
  {
    leadId: '7e7a7d98-a8e4-4886-a0ba-78db2de92ed3',
    websiteId: 'a650ef83-fea4-409c-b49b-fd782701ff0b',
    businessName: 'Nagerkovil Arya Bhavan',
    category: 'South Indian restaurant',
    location: 'Coimbatore',
    phone: '+918903174444',
    email: null,
    website: 'https://www.nagerkovilaryabhavan.in/',
    rating: 4.2,
    reviews: 10107,
    address: 'Nagerkovil Arya Bhavan, Coimbatore',
    subCategory: 'South Indian',
    hours: 'Mon-Sun: 7:00 AM - 10:00 PM',
    services: ['Idli', 'Dosa', 'Vada', 'Pongal', 'Filter Coffee', 'Meals', 'Tiffin'],
    source: 'Google Maps',
  },
  {
    leadId: 'beb1bf5f-d79f-4985-a452-79acc3dd3375',
    websiteId: '565a46a4-aa00-482a-948b-e3586b71ae84',
    businessName: 'Welcomcafe Kovai',
    category: 'Buffet restaurant',
    location: 'Coimbatore',
    phone: '+914222226555',
    email: null,
    website: 'https://www.itchotels.com/in/en/restaurant-listing.html?hotel=welcomhotelcoimbatore',
    rating: 4.4,
    reviews: 700,
    address: 'Welcomhotel Coimbatore, Race Course, Coimbatore',
    subCategory: 'Buffet',
    hours: 'Mon-Sun: 7:00 AM - 11:00 PM',
    services: ['Breakfast Buffet', 'Lunch Buffet', 'Dinner Buffet', 'Sunday Brunch', 'High Tea', 'A La Carte'],
    source: 'Google Maps',
  },
  {
    leadId: 'fac214d9-253e-4b6a-91c0-de83ea7c8ff5',
    websiteId: 'fb1f2bc6-86e5-4147-8af1-6de2438ab555',
    businessName: 'Kovai Kitchen',
    category: 'North Indian restaurant',
    location: 'Coimbatore',
    phone: '+917094446622',
    email: null,
    website: 'https://marriottbonvoyasia.com/restaurants-bars/Fairfield-by-Marriott-Coimbatore-Kovai-Kitchen',
    rating: 4.7,
    reviews: 613,
    address: 'Fairfield by Marriott Coimbatore, Trichy Road, Coimbatore',
    subCategory: 'North Indian',
    hours: 'Mon-Sun: 7:00 AM - 11:00 PM',
    services: ['North Indian Cuisine', 'Breakfast Buffet', 'Lunch Buffet', 'Dinner Buffet', 'A La Carte', 'Room Service'],
    source: 'Google Maps',
  },
];

function getCategoryDesign(category) {
  const lower = category.toLowerCase();
  if (lower.includes("restaurant") || lower.includes("cafe") || lower.includes("bakery") || lower.includes("food") || lower.includes("kitchen") || lower.includes("diner") || lower.includes("bistro") || lower.includes("grill") || lower.includes("pizza") || lower.includes("burger")) {
    return {
      primaryColor: "#7f1d1d",
      secondaryColor: "#991b1b",
      accentColor: "#fbbf24",
      fontPairing: '"Playfair Display", serif; --font-sans: "Inter", sans-serif',
      heroPattern: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)",
    };
  }
  return {
    primaryColor: "#1e3a8a",
    secondaryColor: "#1e40af",
    accentColor: "#f59e0b",
    fontPairing: '"Inter", sans-serif',
    heroPattern: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)",
  };
}

function getTemplate(templateName) {
  const templates = {
    "restaurant": {
      id: "restaurant",
      name: "Restaurant",
      description: "Full-service restaurant with menu, reservations, and online ordering",
      pages: ["index"],
      sections: [
        { id: "hero", type: "hero", required: true, order: 1 },
        { id: "about", type: "about", required: true, order: 2 },
        { id: "menu", type: "menu", required: true, order: 3 },
        { id: "gallery", type: "gallery", required: false, order: 4 },
        { id: "testimonials", type: "testimonials", required: true, order: 5 },
        { id: "hours", type: "hours", required: true, order: 6 },
        { id: "contact", type: "contact", required: true, order: 7 },
      ],
    },
  };
  return templates[templateName] || templates["restaurant"];
}

function mapToBuildInput(biz) {
  return {
    businessName: biz.businessName,
    category: biz.category,
    location: biz.location,
    phone: biz.phone,
    email: biz.email ?? undefined,
    website: biz.website,
    rating: biz.rating,
    reviews: biz.reviews,
    scraped: {
      address: biz.address || biz.location,
      phone: biz.phone,
      email: biz.email ?? undefined,
      rating: biz.rating,
      reviews: biz.reviews,
      category: biz.category,
      subCategory: biz.subCategory,
      hours: biz.hours,
      services: biz.services || [],
      source: biz.source || 'Google Maps',
      scrapedAt: new Date().toISOString(),
    },
    qualification: {
      hasWebsite: true,
      websiteQuality: 50,
      hasWhatsApp: true,
      hasReviews: true,
      responseLikelihood: 'medium',
      notes: `Business identified from Google Maps with ${biz.reviews} reviews, rating ${biz.rating}/5`,
    },
    opportunity: {
      score: 70,
      priority: 'high',
      reasons: ['High review volume indicates strong reputation'],
      estimatedValue: 0,
    },
  };
}

function getRepoSubdir(businessName) {
  return businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function generateBlankPlaceholder(width, height, color = "#e5e7eb") {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect fill="${color}" width="100%" height="100%"/></svg>`;
}

async function generateWebsite(biz) {
  const template = getTemplate('restaurant');
  const buildInput = mapToBuildInput(biz);
  const projectName = `${getRepoSubdir(biz.businessName)}-${biz.leadId.slice(0, 8)}`;
  const outputDir = path.join(process.cwd(), 'generated-websites', projectName);
  
  console.log(`\n=== Generating website for ${biz.businessName} ===`);
  console.log(`Output dir: ${outputDir}`);
  
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const design = getCategoryDesign(biz.category);
  const content = {};
  const templateObj = template;

  const packageJson = {
    name: projectName,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "eslint",
    },
    dependencies: {
      next: "16.3.1",
      react: "19.2.8",
      "react-dom": "19.2.8",
    },
    devDependencies: {
      "@types/node": "20",
      "@types/react": "19",
      "@types/react-dom": "19",
      typescript: "5",
      eslint: "9",
      "eslint-config-next": "16.3.1",
      tailwindcss: "^3.4.0",
      postcss: "^8.4.0",
      autoprefixer: "^10.4.0",
    },
  };
  fs.writeFileSync(path.join(outputDir, "package.json"), JSON.stringify(packageJson, null, 2));

  const tsConfig = {
    compilerOptions: {
      target: "es5",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  };
  fs.writeFileSync(path.join(outputDir, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));

  const nextConfig = "/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  output: 'export',\n  images: { unoptimized: true },\n  trailingSlash: true\n};\nmodule.exports = nextConfig;";
  fs.writeFileSync(path.join(outputDir, "next.config.js"), nextConfig);

  const tailwindConfig = "/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: [\n    \"./src/app/**/*.{js,ts,jsx,tsx,mdx}\",\n    \"./src/components/**/*.{js,ts,jsx,tsx,mdx}\"\n  ],\n  theme: { \n    extend: {\n      colors: {\n        primary: {\n          DEFAULT: \"" + design.primaryColor + "\",\n          light: \"" + design.secondaryColor + "\",\n        },\n        accent: \"" + design.accentColor + "\",\n      },\n      fontFamily: {\n        sans: [\"Inter\", \"sans-serif\"],\n        display: [\"Playfair Display\", \"serif\"],\n      },\n    },\n  },\n  plugins: [],\n};";
  fs.writeFileSync(path.join(outputDir, "tailwind.config.js"), tailwindConfig);

  const postcssConfig = "module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};";
  fs.writeFileSync(path.join(outputDir, "postcss.config.js"), postcssConfig);

  const gitignore = `# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next/
out/
build/

# production
dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`;
  fs.writeFileSync(path.join(outputDir, ".gitignore"), gitignore);

  const readme = `# ${biz.businessName}\n\nGenerated website for ${biz.businessName}.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Build\n\n\`\`\`bash\nnpm run build\n\`\`\`\n\n## Deploy\n\nThis project is configured for deployment on Vercel.`;
  fs.writeFileSync(path.join(outputDir, "README.md"), readme);

  fs.writeFileSync(path.join(outputDir, "next-env.d.ts"), '/// <reference types="next" />\n/// <reference types="next/image-types/global" />');

  const srcDir = path.join(outputDir, "src");
  const appDir = path.join(srcDir, "app");
  const componentsDir = path.join(srcDir, "components");
  const publicDir = path.join(outputDir, "public");

  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(componentsDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  const contactDir = path.join(appDir, "contact");
  fs.mkdirSync(contactDir, { recursive: true });

  const globalsCss = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=DM+Serif+Display&family=Bebas+Neue&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: ` + design.primaryColor + `;
  --color-primary-light: ` + design.secondaryColor + `;
  --color-accent: ` + design.accentColor + `;
  --font-display: ` + design.fontPairing + `;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html {
  scroll-behavior: smooth;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  color: #1f2937;
  background: #ffffff;
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
  line-height: 1.6;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
}

.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section {
  padding: 5rem 0;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: #111827;
}

@media (max-width: 768px) {
  .section-title {
    font-size: 2rem;
  }
  .section {
    padding: 3rem 0;
  }
}`;
  fs.writeFileSync(path.join(srcDir, "globals.css"), globalsCss);

  const businessObj = {
    businessName: biz.businessName,
    category: biz.category,
    location: biz.location,
    phone: biz.phone,
    email: biz.email || "",
    address: biz.address || biz.location,
    rating: biz.rating,
    reviews: biz.reviews,
    website: biz.website || "",
    hours: biz.hours ? [{ day: "Mon-Sun", hours: biz.hours }] : [],
    services: biz.services || [],
    description: `Welcome to ${biz.businessName} - ${biz.category} in ${biz.location}`,
    name: biz.businessName,
  };

  const layoutTsx = `import type { Metadata } from "next";
import "../globals.css";

export const metadata = Metadata = {
  title: "${businessObj.businessName.replace(/"/g, '\\"')}",
  description: "${businessObj.description.replace(/"/g, '\\"')}",
  openGraph: {
    title: "${businessObj.businessName.replace(/"/g, '\\"')}",
    description: "${businessObj.description.replace(/"/g, '\\"')}",
    type: "website",
  },
};

interface Business {
  name: string;
  businessName: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  reviews: number;
  description: string;
  services: string[];
  hours: Array<{ day: string; hours: string }>;
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}`;
  fs.writeFileSync(path.join(appDir, "layout.tsx"), layoutTsx);

  const sections = templateObj.sections
    .filter((s) => s.required || (content[s.id] && Object.keys(content[s.id]).length > 0))
    .sort((a, b) => a.order - b.order);

  const sectionComponents = sections.map((s) => `<${s.id.charAt(0).toUpperCase() + s.id.slice(1)}Section business={business} />`).join("\n      ");

  const pageTsx = `'use client';

interface Business {
  name: string;
  businessName: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  reviews: number;
  description: string;
  services: string[];
  hours: Array<{ day: string; hours: string }>;
};

const business = ${JSON.stringify(businessObj, null, 2)};

export default function Home() {
  return (
    <main className="min-h-screen">
      ${sectionComponents}
    </main>
  );
}

${generateHeroSection(design)}

${generateAboutSection()}

${generateMenuSection()}

${generateServicesSection()}

${generateGallerySection()}

${generateTestimonialsSection()}

${generateHoursSection()}

${generateContactSection()}

${generateFooterSection()}`;
  fs.writeFileSync(path.join(appDir, "page.tsx"), pageTsx);

  const contactPageTsx = `'use client';

interface Business {
  name: string;
  businessName: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  reviews: number;
  description: string;
  services: string[];
  hours: Array<{ day: string; hours: string }>;
};

const business = ${JSON.stringify(businessObj, null, 2)};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <ContactSection business={business} />
      <FooterSection business={business} />
    </main>
  );
}

${generateContactSection()}

${generateFooterSection()}`;
  fs.writeFileSync(path.join(contactDir, "page.tsx"), contactPageTsx);

  const placeholderSvg = generateBlankPlaceholder(1200, 800, design.primaryColor + "20");
  fs.writeFileSync(path.join(publicDir, "placeholder-hero.jpg"), placeholderSvg);
  fs.writeFileSync(path.join(publicDir, "placeholder-1.jpg"), generateBlankPlaceholder(800, 600, "#f3f4f6"));
  fs.writeFileSync(path.join(publicDir, "placeholder-2.jpg"), generateBlankPlaceholder(800, 600, "#f3f4f6"));
  fs.writeFileSync(path.join(publicDir, "placeholder-3.jpg"), generateBlankPlaceholder(800, 600, "#f3f4f6"));

  console.log("Installing dependencies...");
  execSync("npm install", { cwd: outputDir, stdio: "inherit" });
  console.log("Building project...");
  execSync("npm run build", { cwd: outputDir, stdio: "inherit" });

  return outputDir;
}

function generateHeroSection(design) {
  return `function HeroSection({ business }) {
  const star = String.fromCharCode(0x2605);
  const location = String.fromCodePoint(0x1F4CD);
  return (
    <section className="relative min-h-screen flex items-center justify-center" style={{ background: "${design.heroPattern}" }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative container px-6 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          {business.name}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
          {business.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex items-center gap-2 text-white/90">
            <span className="text-accent" role="img" aria-label="star">{star}</span>
            <span className="font-medium">{business.rating}/5</span>
            <span className="text-white/60">({business.reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span role="img" aria-label="location">{location}</span>
            <span className="font-medium">{business.location}</span>
          </div>
        </div>
        <div className="mt-10 flex gap-4 justify-center">
          <a href="#contact" className="bg-accent text-primary px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity">
            Contact Us
          </a>
          <a href={"tel:" + business.phone.replace(/\\D/g, "")} className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors">
            Call Now
          </a>
        </div>
      </div>
    </section>
  );
}`;
}

function generateAboutSection() {
  return `function AboutSection({ business }) {
  return (
    <section id="about" className="section bg-gray-50">
      <div className="container">
        <h2 className="section-title font-display">About {business.name}</h2>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-700 leading-relaxed">{business.description}</p>
        </div>
        {business.rating > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-primary font-display">{business.rating}</div>
              <div className="text-gray-600">Rating</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-primary font-display">{business.reviews.toLocaleString()}+</div>
              <div className="text-gray-600">Reviews</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-primary font-display">{business.category}</div>
              <div className="text-gray-600">Category</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}`;
}

function generateMenuSection() {
  return `function MenuSection({ business }) {
  if (!business.services || business.services.length === 0) return null;
  
  return (
    <section id="menu" className="section">
      <div className="container">
        <h2 className="section-title font-display">Our Menu</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {business.services.slice(0, 9).map((service, i) => (
            <article key={i} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{service}</h3>
              <p className="text-gray-600">Available dish</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}`;
}

function generateServicesSection() {
  return `function ServicesSection({ business }) {
  if (!business.services || business.services.length === 0) return null;
  
  return (
    <section id="services" className="section bg-gray-50">
      <div className="container">
        <h2 className="section-title font-display">Our Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {business.services.slice(0, 9).map((service, i) => (
            <article key={i} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{service}</h3>
              <p className="text-gray-600">Professional service</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}`;
}

function generateGallerySection() {
  return `function GallerySection({ business }) {
  return (
    <section id="gallery" className="section">
      <div className="container">
        <h2 className="section-title font-display">Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img 
                src={"/placeholder-" + i + ".jpg"} 
                alt={business.name + " gallery image " + i}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;
}

function generateTestimonialsSection() {
  return `function TestimonialsSection({ business }) {
  const star = String.fromCharCode(0x2605);
  return (
    <section id="testimonials" className="section bg-gray-50">
      <div className="container">
        <h2 className="section-title font-display">What Our Customers Say</h2>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-accent" role="img" aria-label="star">{star}</span>
            <span className="text-3xl font-bold">{business.rating}/5</span>
          </div>
          <p className="text-lg text-gray-700">
            Based on {business.reviews.toLocaleString()} reviews
          </p>
        </div>
      </div>
    </section>
  );
}`;
}

function generateHoursSection() {
  return `function HoursSection({ business }) {
  if (!business.hours || business.hours.length === 0) return null;
  
  return (
    <section id="hours" className="section">
      <div className="container">
        <h2 className="section-title font-display">Opening Hours</h2>
        <div className="max-w-md mx-auto">
          <dl className="space-y-4">
            {business.hours.map((item, i) => (
              <div key={i} className="flex justify-between py-3 border-b border-gray-200">
                <dt className="font-medium text-gray-900">{item.day}</dt>
                <dd className="text-gray-600">{item.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}`;
}

function generateContactSection() {
  return `function ContactSection({ business }) {
  return (
    <section id="contact" className="section bg-gray-50">
      <div className="container">
        <h2 className="section-title font-display">Contact Us</h2>
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Visit Us</h3>
            <address className="not-italic space-y-4 text-gray-700">
              <p>{business.address}</p>
              <p>{business.location}</p>
            </address>
            <h3 className="text-2xl font-semibold mt-10 mb-6">Call Us</h3>
            <a href={"tel:" + business.phone.replace(/\\D/g, "")} className="text-gray-700 hover:text-primary transition-colors inline-block">
              {business.phone}
            </a>
            {business.email && (
              <>
                <h3 className="text-2xl font-semibold mt-10 mb-6">Email Us</h3>
                <a href={"mailto:" + business.email} className="text-gray-700 hover:text-primary transition-colors inline-block">
                  {business.email}
                </a>
              </>
            )}
            {business.website && (
              <>
                <h3 className="text-2xl font-semibold mt-10 mb-6">Website</h3>
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary transition-colors inline-block">
                  {business.website}
                </a>
              </>
            )}
          </div>
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-200">
            <iframe
              src={"https://maps.google.com/maps?q=" + encodeURIComponent(business.address) + "&output=embed"}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}`;
}

function generateFooterSection() {
  return `function FooterSection({ business }) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">{business.name}</h3>
            <p className="text-gray-400">{business.description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <address className="not-italic text-gray-400 space-y-2">
              <p>{business.address}</p>
              <p>{business.location}</p>
              <a href={"tel:" + business.phone.replace(/\\D/g, "")} className="hover:text-accent transition-colors">{business.phone}</a>
              {business.email && <a href={"mailto:" + business.email} className="hover:text-accent transition-colors">{business.email}</a>}
            </address>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hours</h4>
            <dl className="text-gray-400 space-y-2">
              {business.hours && business.hours.length > 0 ? (
                business.hours.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <dt>{item.day}</dt>
                    <dd>{item.hours}</dd>
                  </div>
                ))
              ) : (
                <p>Contact for hours</p>
              )}
            </dl>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {business.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}`;
}

async function githubRequest(endpoint, token, options = {}) {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }
  return response.json();
}

async function getAuthenticatedUser(token) {
  return githubRequest("/user", token);
}

async function pushFiles(token, owner, repo, files, commitMessage, branch = "main") {
  const ref = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
  const latestCommitSha = ref.object.sha;

  const blobs = await Promise.all(
    files.map(async (file) => {
      const content = typeof file.content === "string" ? file.content : new TextDecoder().decode(file.content);
      const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      return { path: file.path, sha: blob.sha };
    })
  );

  const tree = await githubRequest(`/repos/${owner}/${repo}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({
      base_tree: latestCommitSha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      })),
    }),
  });

  const commit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({
      message: commitMessage,
      tree: tree.sha,
      parents: [latestCommitSha],
    }),
  });

  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return commit;
}

async function scanForSecrets(files) {
  const secretPatterns = [
    { name: "API Key", pattern: /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Secret", pattern: /secret\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Password", pattern: /password\s*[=:]\s*['"][^'"]{8,}['"]/gi },
    { name: "Token", pattern: /token\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Private Key", pattern: /private[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Access Token", pattern: /access[_-]?token\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Bearer", pattern: /bearer\s+[a-zA-Z0-9_\-]{20,}/gi },
    { name: "Stripe Key", pattern: /sk_[a-zA-Z0-9]{20,}/g },
    { name: "Supabase Key", pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g },
    { name: "Vercel Token", pattern: /vcp_[a-zA-Z0-9]{20,}/g },
    { name: "GitHub Token", pattern: /github_pat_[a-zA-Z0-9_]{20,}/g },
  ];

  const foundSecrets = [];
  for (const file of files) {
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const { name, pattern } of secretPatterns) {
        if (pattern.test(lines[i])) {
          foundSecrets.push({ file: file.path, pattern: name, line: i + 1 });
        }
      }
    }
  }
  return { hasSecrets: foundSecrets.length > 0, secrets: foundSecrets };
}

async function pushToGitHub(subdir, outputDir, commitMessage) {
  console.log(`\n=== Pushing ${subdir} to GitHub ===`);
  
  const files = [];
  const excludeDirs = ['node_modules', '.next', '.git', '.vercel', 'out'];
  const excludeFiles = ['.DS_Store', 'tsconfig.tsbuildinfo'];
  
  function walk(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(prefix, entry.name).replace(/\\/g, '/');
      const finalPath = path.join(subdir, relPath).replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        walk(fullPath, path.join(prefix, entry.name));
      } else if (!excludeFiles.includes(entry.name)) {
        const content = fs.readFileSync(fullPath);
        files.push({ path: finalPath, content });
      }
    }
  }
  
  walk(outputDir);
  console.log(`Collected ${files.length} files`);
  
  const secretScan = await scanForSecrets(files.map(f => ({ 
    path: f.path, 
    content: typeof f.content === 'string' ? f.content : new TextDecoder().decode(f.content) 
  })));
  
  if (secretScan.hasSecrets) {
    throw new Error(`Secret scan failed: ${secretScan.secrets.map(s => `${s.file}:${s.line}`).join(', ')}`);
  }
  
  const user = await getAuthenticatedUser(GITHUB_TOKEN);
  const owner = user.login;
  const repoName = 'vasaw-ai';
  
  const commit = await pushFiles(GITHUB_TOKEN, owner, repoName, files, commitMessage, 'main');
  
  console.log(`Pushed commit: ${commit.sha}`);
  console.log(`Repo URL: ${commit.html_url}`);
  
  return commit;
}

async function vercelRequest(endpoint, token, options = {}) {
  const response = await fetch(`${VERCEL_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Vercel API error ${response.status}: ${text}`);
  }
  return response.json();
}

async function createProject(token, options) {
  const body = {
    name: options.name,
    framework: options.framework || "nextjs",
  };
  if (options.gitRepository) body.gitRepository = options.gitRepository;
  if (options.teamId) body.teamId = options.teamId;
  
  return vercelRequest("/v9/projects", token, { method: "POST", body: JSON.stringify(body) });
}

async function createDeployment(token, options) {
  const body = {
    name: options.name,
    project: options.projectId,
    target: options.target || "production",
  };
  if (options.gitSource) body.gitSource = options.gitSource;
  if (options.teamId) body.teamId = options.teamId;
  
  return vercelRequest("/v13/deployments", token, { method: "POST", body: JSON.stringify(body) });
}

async function getDeployment(token, deploymentId, teamId) {
  const params = teamId ? `?teamId=${teamId}` : "";
  return vercelRequest(`/v13/deployments/${deploymentId}${params}`, token);
}

async function waitForDeployment(token, deploymentId, options = {}) {
  const maxWaitMs = options.maxWaitMs ?? 300000;
  const pollIntervalMs = options.pollIntervalMs ?? 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const deployment = await getDeployment(token, deploymentId, options.teamId);
    if (deployment.readyState === "READY" || deployment.readyState === "ERROR" || deployment.readyState === "CANCELED") {
      return deployment;
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Vercel deployment timed out after ${maxWaitMs}ms`);
}

async function deployToVercel(biz, subdir, commitSha) {
  console.log(`\n=== Deploying ${biz.businessName} to Vercel ===`);
  
  const repoName = `vasaw-${subdir}`;
  
  const vercelProject = await createProject(VERCEL_TOKEN, {
    name: repoName,
    framework: 'nextjs',
    gitRepository: {
      type: 'github',
      repo: `Sanjai-Gopal/vasaw-ai`,
    },
    teamId: VERCEL_TEAM_ID,
  });
  
  console.log(`Created Vercel project: ${vercelProject.id} (${vercelProject.name})`);
  
  const deployment = await createDeployment(VERCEL_TOKEN, {
    name: repoName,
    projectId: vercelProject.id,
    gitSource: {
      type: 'github',
      repo: `Sanjai-Gopal/vasaw-ai`,
      ref: 'main',
      sha: commitSha,
    },
    target: 'production',
    teamId: VERCEL_TEAM_ID,
  });
  
  console.log(`Created deployment: ${deployment.id}`);
  
  const finalDeployment = await waitForDeployment(VERCEL_TOKEN, deployment.id, {
    teamId: VERCEL_TEAM_ID,
    maxWaitMs: 300000,
    pollIntervalMs: 10000,
  });
  
  console.log(`Deployment status: ${finalDeployment.readyState}`);
  
  if (finalDeployment.readyState !== 'READY') {
    throw new Error(`Vercel deployment failed: ${finalDeployment.readyState}`);
  }
  
  const liveUrl = `https://${finalDeployment.url}`;
  console.log(`Live URL: ${liveUrl}`);
  
  return {
    projectId: vercelProject.id,
    deploymentId: finalDeployment.id,
    liveUrl,
  };
}

async function verifyDeployment(liveUrl, businessName) {
  console.log(`\n=== Verifying deployment at ${liveUrl} ===`);
  
  const response = await fetch(liveUrl);
  console.log(`HTTP Status: ${response.status}`);
  
  if (!response.ok) {
    throw new Error(`Live URL verification failed: ${response.status}`);
  }
  
  const html = await response.text();
  
  if (!html.includes(businessName)) {
    throw new Error(`Business name "${businessName}" not found in deployed page`);
  }
  console.log(`✓ Business name found`);
  
  if (html.includes('.css') || html.includes('styles') || html.includes('tailwind')) {
    console.log(`✓ CSS appears to be loaded`);
  } else {
    console.warn('⚠ CSS may not be loaded');
  }
  
  return true;
}

async function updateSupabase(biz, result) {
  console.log(`\n=== Updating Supabase for ${biz.businessName} ===`);
  
  await admin.from('websites').update({
    status: 'deployed',
    live_url: result.liveUrl,
    repo_url: result.repoUrl,
    commit_hash: result.commitSha,
    updated_at: new Date().toISOString(),
  }).eq('id', biz.websiteId);
  
  await admin.from('deployments').upsert({
    id: result.deploymentId,
    website_id: biz.websiteId,
    lead_id: biz.leadId,
    business_name: biz.businessName,
    status: 'deployed',
    provider: 'vercel',
    environment: 'production',
    live_url: result.liveUrl,
    commit_hash: result.commitSha,
    duration_sec: 0,
    deployed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
  
  await admin.from('leads').update({
    deployment_status: 'deployed',
    website_status: 'deployed',
    updated_at: new Date().toISOString(),
  }).eq('id', biz.leadId);
  
  await admin.from('activities').insert({
    lead_id: biz.leadId,
    actor: 'deployment-agent',
    type: 'deployment',
    status: 'success',
    title: 'Website deployed',
    description: `${biz.businessName} deployed to ${result.liveUrl}`,
  });
  
  console.log('✓ Supabase updated');
}

async function recheckGangaRestaurant() {
  console.log('\n=== Re-checking Ganga Restaurant ===');
  
  const liveUrl = 'https://ganga-restaurant-indian-restaurants.vercel.app';
  
  try {
    await verifyDeployment(liveUrl, 'Ganga Restaurant');
    
    await admin.from('websites').update({
      status: 'deployed',
      live_url: liveUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', '4d7ec33a-9701-4cf0-8d5a-1a675fae0e88');
    
    await admin.from('leads').update({
      deployment_status: 'deployed',
      website_status: 'deployed',
      updated_at: new Date().toISOString(),
    }).eq('id', 'd7bd7a69-6cae-42de-80d8-5b519e7f38ce');
    
    console.log('✓ Ganga Restaurant verified and updated');
    return { liveUrl, status: 'verified' };
  } catch (err) {
    console.error('✗ Ganga Restaurant verification failed:', err);
    return { liveUrl, status: 'failed', error: String(err) };
  }
}

async function main() {
  console.log('=== Starting Full Deployment Pipeline ===');
  
  const user = await getAuthenticatedUser(GITHUB_TOKEN);
  console.log(`GitHub user: ${user.login}`);
  
  const results = [];
  
  for (const biz of businesses) {
    try {
      const subdir = getRepoSubdir(biz.businessName);
      const outputDir = await generateWebsite(biz);
      
      const commit = await pushToGitHub(subdir, outputDir, `Initial commit: VASAW AI generated website for ${biz.businessName}`);
      
      const repoUrl = `https://github.com/Sanjai-Gopal/vasaw-ai/tree/main/${subdir}`;
      
      const deployResult = await deployToVercel(biz, subdir, commit.sha);
      
      await verifyDeployment(deployResult.liveUrl, biz.businessName);
      
      await updateSupabase(biz, {
        repoUrl,
        commitSha: commit.sha,
        vercelProjectId: deployResult.projectId,
        deploymentId: deployResult.deploymentId,
        liveUrl: deployResult.liveUrl,
      });
      
      results.push({
        business: biz.businessName,
        repoUrl,
        commitSha: commit.sha,
        vercelProjectId: deployResult.projectId,
        deploymentId: deployResult.deploymentId,
        liveUrl: deployResult.liveUrl,
        status: 'success',
      });
      
      console.log(`\n✅ ${biz.businessName} DEPLOYED SUCCESSFULLY`);
      console.log(`   Repo: ${repoUrl}`);
      console.log(`   Commit: ${commit.sha}`);
      console.log(`   Vercel Project: ${deployResult.projectId}`);
      console.log(`   Deployment: ${deployResult.deploymentId}`);
      console.log(`   Live URL: ${deployResult.liveUrl}`);
      
    } catch (err) {
      console.error(`\n❌ ${biz.businessName} FAILED:`, err);
      results.push({
        business: biz.businessName,
        status: 'failed',
        error: String(err),
      });
    }
  }
  
  const gangaResult = await recheckGangaRestaurant();
  results.push({
    business: 'Ganga Restaurant',
    ...gangaResult,
  });
  
  console.log('\n=== FINAL REPORT ===');
  console.log(JSON.stringify(results, null, 2));
  
  console.log('\n=== Running Build Checks ===');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✓ TypeScript check passed');
  } catch (e) {
    console.error('✗ TypeScript check failed');
  }
  
  try {
    execSync('npm run lint', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✓ Lint passed');
  } catch (e) {
    console.error('✗ Lint failed');
  }
  
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✓ Build passed');
  } catch (e) {
    console.error('✗ Build failed');
  }
  
  try {
    execSync('npm audit', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✓ Audit passed');
  } catch (e) {
    console.error('✗ Audit failed');
  }
  
  console.log('\n=== COMPLETE ===');
}

main().catch(console.error);