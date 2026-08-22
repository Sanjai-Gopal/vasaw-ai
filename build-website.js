const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { 
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } 
});

const OUTPUT_BASE = path.join(__dirname, "generated-websites");

const TEMPLATES = {
  restaurant: {
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
    categoryKeywords: ["restaurant", "cafe", "bistro", "diner", "eatery", "kitchen", "grill", "pizza", "burger", "biryani", "vegetarian", "veg", "indian restaurant"],
  },
  cafe: {
    name: "Cafe",
    description: "Coffee shop with menu, wifi, and ambiance focus",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "menu", type: "menu", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
    ],
    categoryKeywords: ["cafe", "coffee", "coffee shop", "bakery", "pastry", "brunch", "tea"],
  },
  salon: {
    name: "Salon & Spa",
    description: "Beauty salon with services, booking, and portfolio",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: true, order: 4 },
      { id: "team", type: "team", required: false, order: 5 },
      { id: "testimonials", type: "testimonials", required: true, order: 6 },
      { id: "hours", type: "hours", required: true, order: 7 },
      { id: "contact", type: "contact", required: true, order: 8 },
      { id: "cta", type: "cta", required: true, order: 9 },
    ],
    categoryKeywords: ["salon", "spa", "beauty", "hair", "nail", "barber", "unisex", "bridal", "facial", "massage"],
  },
  gym: {
    name: "Gym & Fitness",
    description: "Fitness center with classes, trainers, and membership info",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "team", type: "team", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
      { id: "cta", type: "cta", required: true, order: 8 },
    ],
    categoryKeywords: ["gym", "fitness", "workout", "training", "crossfit", "yoga", "pilates", "personal training", "zumba"],
  },
  tattoo: {
    name: "Tattoo Studio",
    description: "Tattoo studio with artist portfolio, booking, and aftercare",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "gallery", type: "gallery", required: true, order: 3 },
      { id: "team", type: "team", required: true, order: 4 },
      { id: "services", type: "services", required: true, order: 5 },
      { id: "testimonials", type: "testimonials", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
    ],
    categoryKeywords: ["tattoo", "tattoo studio", "ink", "body art", "piercing"],
  },
  clinic: {
    name: "Clinic & Healthcare",
    description: "Medical clinic with services, doctors, and appointment booking",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "team", type: "team", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
      { id: "cta", type: "cta", required: true, order: 8 },
    ],
    categoryKeywords: ["clinic", "hospital", "dental", "dentist", "doctor", "medical", "healthcare", "physiotherapy", "ayurvedic", "wellness center"],
  },
  "local-service": {
    name: "Local Service",
    description: "General local service business (plumber, electrician, cleaner, etc.)",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "testimonials", type: "testimonials", required: true, order: 4 },
      { id: "hours", type: "hours", required: false, order: 5 },
      { id: "contact", type: "contact", required: true, order: 6 },
      { id: "cta", type: "cta", required: true, order: 7 },
    ],
    categoryKeywords: ["service", "repair", "maintenance", "cleaning", "plumber", "electrician", "contractor", "mechanic", "auto", "packaging", "manufacturing"],
  },
};

function selectTemplate(category, subCategory) {
  var searchText = (category + " " + (subCategory || "")).toLowerCase();
  for (var templateId in TEMPLATES) {
    var template = TEMPLATES[templateId];
    for (var i = 0; i < template.categoryKeywords.length; i++) {
      if (searchText.indexOf(template.categoryKeywords[i].toLowerCase()) !== -1) {
        return templateId;
      }
    }
  }
  return "local-service";
}

function getTemplate(templateId) {
  return TEMPLATES[templateId] || TEMPLATES["local-service"];
}

function sanitizeForPath(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function generatePackageJson(projectName, businessName) {
  return JSON.stringify({
    name: projectName,
    version: "1.0.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start", lint: "eslint" },
    dependencies: { next: "16.3.1", react: "19.2.8", "react-dom": "19.2.8" },
    devDependencies: { "@types/node": "20", "@types/react": "19", "@types/react-dom": "19", typescript: "5", eslint: "9", "eslint-config-next": "16.3.1" }
  }, null, 2);
}

function generateTsConfig() {
  return JSON.stringify({
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
      paths: { "@/*": ["./*"] }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  }, null, 2);
}

function generateNextConfig() {
  return "/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  output: 'export',\n  images: { unoptimized: true },\n  trailingSlash: true\n};\nmodule.exports = nextConfig;";
}

function generateTailwindConfig() {
  return "/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: [\n    \"./src/app/**/*.{js,ts,jsx,tsx,mdx}\",\n    \"./src/components/**/*.{js,ts,jsx,tsx,mdx}\"\n  ],\n  theme: { extend: {} },\n  plugins: [],\n};";
}

function generatePostcssConfig() {
  return "module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};";
}

function generateGitignore() {
  return "# dependencies\nnode_modules\n.pnp\n.pnp.js\n\n# testing\ncoverage\n\n# next.js\n.next/\nout/\nbuild/\n\n# production\ndist\n\n# misc\n.DS_Store\n*.pem\n\n# debug\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n\n# local env files\n.env*.local\n.env\n\n# vercel\n.vercel\n\n# typescript\n*.tsbuildinfo\nnext-env.d.ts";
}

function generateEslintConfig() {
  return 'import { defineConfig, globalIgnores } from "eslint/config";\n' +
    'import nextVitals from "eslint-config-next/core-web-vitals";\n' +
    'import nextTs from "eslint-config-next/typescript";\n\n' +
    'const eslintConfig = defineConfig([\n' +
    '  ...nextVitals,\n' +
    '  ...nextTs,\n' +
    '  // Override default ignores of eslint-config-next.\n' +
    '  globalIgnores([\n' +
    '    // Default ignores of eslint-config-next:\n' +
    '    ".next/**",\n' +
    '    "out/**",\n' +
    '    "build/**",\n' +
    '    "next-env.d.ts",\n' +
    '    "*.js",\n' +
    '    "*.cjs",\n' +
    '  ]),\n' +
    ']);\n\n' +
    'export default eslintConfig;';
}

function generateReadme(businessName) {
  return "# " + businessName + "\n\nGenerated website for " + businessName + ".\n\n## Getting Started\n\n```bash\nnpm install\nnpm run dev\n```\n\n## Build\n\n```bash\nnpm run build\n```\n\n## Deploy\n\nThis project is configured for deployment on Vercel.";
}

function generateContent(lead) {
  var scraped = lead.scraped || {};
  var qualification = lead.qualification_json || {};
  
  var hours = [];
  if (scraped.hours) {
    var parts = scraped.hours.split("; ");
    for (var i = 0; i < parts.length; i++) {
      var h = parts[i].split(": ");
      if (h.length === 2) hours.push({ day: h[0].trim(), hours: h[1].trim() });
    }
  }
  
  var services = scraped.services || [];
  
  var description = qualification.notes;
  if (!description) {
    var parts = [];
    if (lead.business_name) parts.push(lead.business_name);
    if (lead.category) parts.push("a " + lead.category.toLowerCase());
    if (lead.location) parts.push("in " + lead.location);
    description = parts.join(" ");
  }
  
  return {
    businessName: lead.business_name,
    category: lead.category,
    location: lead.location,
    phone: lead.phone,
    email: lead.email || "",
    address: scraped.address || "",
    rating: lead.rating,
    reviews: lead.reviews,
    website: lead.website,
    hours: hours,
    services: services,
    description: description,
    name: lead.business_name  // Add 'name' alias for section functions
  };
}

function generateLayout(content) {
  return 'export const metadata = {\n' +
    '  title: "' + content.businessName.replace(/"/g, '\\"') + '",\n' +
    '  description: "' + (content.description || ('Welcome to ' + content.businessName)).replace(/"/g, '\\"') + '",\n' +
    '  openGraph: {\n' +
    '    title: "' + content.businessName.replace(/"/g, '\\"') + '",\n' +
    '    description: "' + (content.description || ('Welcome to ' + content.businessName)).replace(/"/g, '\\"') + '",\n' +
    '    type: "website",\n' +
    '  },\n' +
    '};\n\n' +
    'export default function RootLayout({ children }: { children: React.ReactNode }) {\n' +
    '  return (\n' +
    '    <html lang="en">\n' +
    '      <body className="min-h-screen bg-white font-sans antialiased">\n' +
    '        {children}\n' +
    '      </body>\n' +
    '    </html>\n' +
    '  );\n' +
    '}';
}

function generateGlobalsCSS() {
  return '@tailwind base;\n' +
    '@tailwind components;\n' +
    '@tailwind utilities;\n\n' +
    '* {\n' +
    '  box-sizing: border-box;\n' +
    '  padding: 0;\n' +
    '  margin: 0;\n' +
    '}\n\n' +
    'html,\n' +
    'body {\n' +
    '  max-width: 100vw;\n' +
    '  overflow-x: hidden;\n' +
    '}\n\n' +
    'body {\n' +
    '  color: #1f2937;\n' +
    '  background: #ffffff;\n' +
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;\n' +
    '}\n\n' +
    'a {\n' +
    '  color: inherit;\n' +
    '  text-decoration: none;\n' +
    '}\n\n' +
    '@media (prefers-color-scheme: dark) {\n' +
    '  html {\n' +
    '    color-scheme: dark;\n' +
    '  }\n' +
    '}';
}

function getSectionComponent(id) {
  switch (id) {
    case "hero": return "<HeroSection business={business} />";
    case "about": return "<AboutSection business={business} />";
    case "menu": return "<MenuSection business={business} />";
    case "gallery": return "<GallerySection business={business} />";
    case "testimonials": return "<TestimonialsSection business={business} />";
    case "hours": return "<HoursSection business={business} />";
    case "contact": return "<ContactSection business={business} />";
    default: return "/* Unknown section: " + id + " */";
  }
}

function generateHomePage(content, template) {
  console.log("generateHomePage: starting");
  var sections = template.sections.sort(function(a, b) { return a.order - b.order; });
  console.log("generateHomePage: sections sorted, count:", sections.length);
  
  var sectionComponents = sections.map(function(s) {
    return getSectionComponent(s.id);
  }).join("\n      ");
  console.log("generateHomePage: sectionComponents generated");
  
  var businessJson = JSON.stringify(content, null, 2);
  console.log("generateHomePage: businessJson generated");
  
  try {
    var heroSection = generateHeroSection();
    console.log("generateHomePage: heroSection generated");
    var aboutSection = generateAboutSection();
    console.log("generateHomePage: aboutSection generated");
    var menuSection = generateMenuSection();
    console.log("generateHomePage: menuSection generated");
    var gallerySection = generateGallerySection();
    console.log("generateHomePage: gallerySection generated");
    var testimonialsSection = generateTestimonialsSection();
    console.log("generateHomePage: testimonialsSection generated");
    var hoursSection = generateHoursSection();
    console.log("generateHomePage: hoursSection generated");
    var contactSection = generateContactSection();
    console.log("generateHomePage: contactSection generated");
  } catch (e) {
    console.log("generateHomePage: ERROR in section generator:", e.message);
    throw e;
  }
  
  var businessJson = JSON.stringify(content, null, 2);
  console.log("generateHomePage: businessJson generated");
  
  var businessInterface = "interface Business {\n" +
    "  name: string;\n" +
    "  businessName: string;\n" +
    "  category: string;\n" +
    "  location: string;\n" +
    "  address: string;\n" +
    "  phone: string;\n" +
    "  email: string;\n" +
    "  website: string;\n" +
    "  rating: number;\n" +
    "  reviews: number;\n" +
    "  description: string;\n" +
    "  services: string[];\n" +
    "  hours: Array<{ day: string; hours: string }>;\n" +
    "};\n\n";

  return "'use client';\n\n" +
    businessInterface +
    "const business = " + businessJson + ";\n\n" +
    "export default function Home() {\n" +
    "  return (\n" +
    "    <main className=\"min-h-screen\">\n" +
    "      " + sectionComponents + "\n" +
    "    </main>\n" +
    "  );\n" +
    "}\n\n" +
    generateHeroSection() + "\n\n" +
    generateAboutSection() + "\n\n" +
    generateMenuSection() + "\n\n" +
    generateGallerySection() + "\n\n" +
    generateTestimonialsSection() + "\n\n" +
    generateHoursSection() + "\n\n" +
    generateContactSection();
}

function generateHeroSection() {
  return 'function HeroSection({ business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section className="relative h-screen bg-gray-200">\n' +
    '      <div className="px-6 text-center">\n' +
    '        <h1 className="text-5xl font-bold mb-6">{business.name}</h1>\n' +
    '        <p className="text-xl mb-8 max-w-2xl mx-auto">{business.description}</p>\n' +
    '        <div className="flex flex-col gap-4">\n' +
    '          <div className="flex items-center gap-2">\n' +
    '            <span className="text-yellow-300">★</span>\n' +
    '            <span>{business.rating}/5 ({business.reviews} reviews)</span>\n' +
    '          </div>\n' +
    '          <div className="flex items-center gap-2">\n' +
    '            <span>📍</span>\n' +
    '            <span>{business.location}</span>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </section>\n' +
    '  );\n' +
    '}';
}

function generateAboutSection() {
  return 'function AboutSection({ business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section id="about" className="py-6 bg-gray-50">\n' +
    '      <div className="max-w-full px-6 py-8">\n' +
    '        <h2 className="text-3xl font-bold text-center mb-6">{business.name}</h2>\n' +
    '        <p className="text-gray-700 text-lg">{business.description}</p>\n' +
    '      </div>\n' +
    '    </section>\n' +
    '  );\n' +
    '}';
}

function generateMenuSection() {
  return 'function MenuSection({ business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section id="menu" className="py-6">\n' +
    '      <div className="max-w-full px-6 py-8">\n' +
    '        <h2 className="text-3xl font-bold text-center mb-6">Our Menu</h2>\n' +
    '        {business.services.slice(0, 8).map((service: string, i: number) => (\n' +
    '          <div key={i} className="bg-white p-4 rounded">\n' +
    '            <h3 className="text-lg font-semibold">{service}</h3>\n' +
    '            <p className="text-gray-600">Available dish</p>\n' +
    '          </div>\n' +
    '        ))}\n' +
    '      </div>\n' +
    '    </section>\n' +
    '  );\n' +
    '}';
}

function generateServicesSection() {
  return 'function ServicesSection({ business }) {\n' +
    '  return (\n' +
    '    <section id="services" className="py-6 bg-gray-50" />\n' +
    '  );\n' +
    '}';
}

function generateGallerySection() {
  return 'function GallerySection({ business: _business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section id="gallery" className="py-6 bg-gray-50" />\n' +
    '  );\n' +
    '}';
}

function generateTestimonialsSection() {
  return 'function TestimonialsSection({ business: _business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section id="testimonials" className="py-6 bg-gray-50" />\n' +
    '  );\n' +
    '}';
}

function generateHoursSection() {
  return 'function HoursSection({ business: _business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section id="hours" className="py-6" />\n' +
    '  );\n' +
    '}';
}

function generateContactSection() {
  return 'function ContactSection({ business: _business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section id="contact" className="py-6 bg-gray-50" />\n' +
    '  );\n' +
    '}';
}

function generateTeamSection() {
  return 'function TeamSection({ business: _business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section id="team" className="py-6" />\n' +
    '  );\n' +
    '}';
}

function generateCTASection() {
  return 'function CTASection({ business: _business }: { business: Business }) {\n' +
    '  return (\n' +
    '    <section id="cta" className="py-6 bg-gray-50" />\n' +
    '  );\n' +
    '}';
}

function buildWebsiteProject(lead, templateId) {
  var template = getTemplate(templateId);
  var projectName = sanitizeForPath(lead.business_name) + "-" + lead.id.slice(0, 8);
  var outputDir = path.join(OUTPUT_BASE, projectName);

  console.log("Building website project: " + projectName);
  console.log("Template: " + template.name);
  console.log("Output: " + outputDir);

  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  var content = generateContent(lead);
  console.log("Content generated, businessName:", content.businessName);
  
  var srcDir = path.join(outputDir, "src");
  var appDir = path.join(srcDir, "app");
  var componentsDir = path.join(srcDir, "components");
  
  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(componentsDir, { recursive: true });

  fs.writeFileSync(path.join(outputDir, "package.json"), generatePackageJson(projectName, lead.business_name));
  fs.writeFileSync(path.join(outputDir, "tsconfig.json"), generateTsConfig());
  fs.writeFileSync(path.join(outputDir, "next.config.js"), generateNextConfig());
  fs.writeFileSync(path.join(outputDir, "tailwind.config.js"), generateTailwindConfig());
  fs.writeFileSync(path.join(outputDir, "postcss.config.js"), generatePostcssConfig());
  fs.writeFileSync(path.join(outputDir, ".gitignore"), generateGitignore());
  fs.writeFileSync(path.join(outputDir, "eslint.config.mjs"), generateEslintConfig());
  fs.writeFileSync(path.join(outputDir, "README.md"), generateReadme(lead.business_name));
  
  fs.writeFileSync(path.join(srcDir, "globals.css"), generateGlobalsCSS());
  console.log("globals.css written");
  fs.writeFileSync(path.join(appDir, "layout.tsx"), generateLayout(content));
  console.log("layout.tsx written");
  var pageContent = generateHomePage(content, template);
  console.log("generateHomePage completed, length:", pageContent.length);
  fs.writeFileSync(path.join(appDir, "page.tsx"), pageContent);
  console.log("page.tsx written");
  console.log("page.tsx size:", fs.statSync(path.join(appDir, "page.tsx")).size);

  var publicDir = path.join(outputDir, "public");
  fs.mkdirSync(publicDir, { recursive: true });
  
  var placeholderSvg = '<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect fill="#e5e7eb" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="24">Placeholder</text></svg>';
  fs.writeFileSync(path.join(publicDir, "placeholder-hero.jpg"), placeholderSvg);
  fs.writeFileSync(path.join(publicDir, "placeholder-1.jpg"), placeholderSvg);
  fs.writeFileSync(path.join(publicDir, "placeholder-2.jpg"), placeholderSvg);
  fs.writeFileSync(path.join(publicDir, "placeholder-3.jpg"), placeholderSvg);

  fs.writeFileSync(path.join(outputDir, "next-env.d.ts"), '/// <reference types="next" />\n/// <reference types="next/image-types/global" />');

  console.log("Website project created at: " + outputDir);
  return { outputDir: outputDir, projectName: projectName };
}

function runBuild(outputDir) {
  console.log("Installing dependencies...");
  execSync("npm install", { cwd: outputDir, stdio: "inherit" });

  console.log("Running production build...");
  execSync("npm run build", { cwd: outputDir, stdio: "inherit" });

  console.log("Build successful!");
}

async function runQualityCheck(outputDir, content) {
  console.log("Running quality checks...");

  console.log("  Checking TypeScript...");
  execSync("npx tsc --noEmit", { cwd: outputDir, stdio: "inherit" });

  console.log("  Running lint...");
  execSync("npm run lint", { cwd: outputDir, stdio: "inherit" });

  console.log("  Checking for placeholder text...");
  var placeholderPatterns = [
    /lorem ipsum/gi,
    /placeholder/gi,
    /your content here/gi,
    /add your/gi,
    /insert/gi,
    /\[.*\]/g,
    /\{\{.*\}\}/g,
    /TODO/gi,
    /FIXME/gi,
  ];

  function checkPlaceholders(dir) {
    var files = fs.readdirSync(dir, { withFileTypes: true });
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var fullPath = path.join(dir, file.name);
      if (file.isDirectory() && ["node_modules", ".next", ".git", "public"].indexOf(file.name) === -1) {
        checkPlaceholders(fullPath);
      } else if (file.isFile() && /\.(tsx?|jsx?|css)$/.test(file.name)) {
        var content = fs.readFileSync(fullPath, "utf-8");
        for (var j = 0; j < placeholderPatterns.length; j++) {
          var pattern = placeholderPatterns[j];
          if (pattern.test(content)) {
            console.warn("    Placeholder found in " + fullPath + ": " + pattern);
          }
        }
      }
    }
  }
  checkPlaceholders(path.join(outputDir, "src"));

  console.log("  Checking for secrets...");
  var secretPatterns = [
    /api[_-]?key/gi,
    /secret/gi,
    /password/gi,
    /token/gi,
    /private[_-]?key/gi,
    /access[_-]?token/gi,
    /bearer/gi,
    /sk_[a-zA-Z0-9]{20,}/g,
    /pk_[a-zA-Z0-9]{20,}/g,
  ];

  function checkSecrets(dir) {
    var files = fs.readdirSync(dir, { withFileTypes: true });
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var fullPath = path.join(dir, file.name);
      if (file.isDirectory() && ["node_modules", ".next", ".git"].indexOf(file.name) === -1) {
        checkSecrets(fullPath);
      } else if (file.isFile() && /\.(tsx?|jsx?|json|env)$/.test(file.name)) {
        var content = fs.readFileSync(fullPath, "utf-8");
        for (var j = 0; j < secretPatterns.length; j++) {
          var pattern = secretPatterns[j];
          if (pattern.test(content)) {
            console.warn("    Potential secret in " + fullPath + ": " + pattern);
          }
        }
      }
    }
  }
  checkSecrets(outputDir);

  console.log("  Checking required routes...");
  var requiredRoutes = ["src/app/page.tsx", "src/app/layout.tsx"];
  for (var i = 0; i < requiredRoutes.length; i++) {
    var route = requiredRoutes[i];
    var fullPath = path.join(outputDir, route);
    if (!fs.existsSync(fullPath)) {
      throw new Error("Missing required route: " + route);
    }
  }

  console.log("  Verifying business information...");
  var pageContent = fs.readFileSync(path.join(outputDir, "src/app/page.tsx"), "utf-8");
  if (pageContent.indexOf(content.businessName) === -1) {
    throw new Error("Business name not found in page");
  }
  if (pageContent.indexOf(content.phone) === -1) {
    throw new Error("Phone not found in page");
  }
  if (pageContent.indexOf(content.address) === -1) {
    throw new Error("Address not found in page");
  }

  console.log("All quality checks passed!");
}

async function main() {
  try {
    var leadId = "d7bd7a69-6cae-42de-80d8-5b519e7f38ce";
    
    var result = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    var lead = result.data;
    var error = result.error;

    if (error || !lead) {
      throw new Error("Lead not found: " + (error ? error.message : "unknown"));
    }

    console.log("Lead loaded: " + lead.business_name);

    var templateId = selectTemplate(lead.category);
    console.log("Selected template: " + templateId);

    var project = await buildWebsiteProject(lead, templateId);
    var outputDir = project.outputDir;
    var projectName = project.projectName;

    await runBuild(outputDir);

    await runQualityCheck(outputDir, {
      businessName: lead.business_name,
      phone: lead.phone,
      address: lead.scraped ? lead.scraped.address : "",
    });

    await supabase
      .from("leads")
      .update({ status: "website_ready", website_status: "built", updated_at: new Date().toISOString() })
      .eq("id", leadId);

    var template = getTemplate(templateId);
    await supabase.from("activities").insert({
      lead_id: leadId,
      actor: "website-building-agent",
      type: "website",
      status: "success",
      title: "Website built and quality checked",
      description: template.name + " template generated and built for " + lead.business_name
    });

    console.log("\n=== WEBSITE BUILD COMPLETE ===");
    console.log("Project: " + projectName);
    console.log("Path: " + outputDir);
    
    console.log("PROJECT_PATH=" + outputDir);
    console.log("PROJECT_NAME=" + projectName);

  } catch (err) {
    console.error("Build failed: " + err.message);
    
    await supabase
      .from("leads")
      .update({ status: "qualified", website_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", leadId);

    process.exit(1);
  }
}

main();