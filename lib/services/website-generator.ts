import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface WebsiteBuildInput {
  businessName: string;
  category: string;
  location: string;
  phone: string;
  email?: string;
  website: string | null;
  rating: number;
  reviews: number;
  scraped: {
    address: string;
    phone: string;
    email?: string;
    rating: number;
    reviews: number;
    category: string;
    subCategory?: string;
    hours?: string;
    services: string[];
    source: string;
    scrapedAt: string;
  };
  qualification: {
    hasWebsite: boolean;
    websiteQuality: number;
    hasWhatsApp: boolean;
    hasReviews: boolean;
    responseLikelihood: "high" | "medium" | "low";
    notes: string;
  };
  opportunity: {
    score: number;
    priority: "high" | "medium" | "low";
    reasons: string[];
    estimatedValue: number;
  };
}

export interface TemplateType {
  id: string;
  name: string;
  description: string;
  pages: string[];
  sections: Array<{ id: string; type: string; required: boolean; order: number }>;
}

export interface GenerateWebsiteParams {
  templateId: string;
  template: TemplateType;
  businessData: WebsiteBuildInput;
  generatedContent: Record<string, unknown>;
  leadId: string;
}

function getCategoryDesign(category: string): {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPairing: string;
  heroPattern: string;
} {
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
  
  if (lower.includes("salon") || lower.includes("spa") || lower.includes("beauty") || lower.includes("hair") || lower.includes("nail") || lower.includes("barber") || lower.includes("wellness") || lower.includes("massage") || lower.includes("facial")) {
    return {
      primaryColor: "#831843",
      secondaryColor: "#9d174d",
      accentColor: "#f9a8d4",
      fontPairing: '"DM Serif Display", serif; --font-sans: "Inter", sans-serif',
      heroPattern: "linear-gradient(135deg, #831843 0%, #9d174d 50%, #be185d 100%)",
    };
  }
  
  if (lower.includes("gym") || lower.includes("fitness") || lower.includes("workout") || lower.includes("training") || lower.includes("crossfit") || lower.includes("yoga") || lower.includes("pilates")) {
    return {
      primaryColor: "#1a1a1a",
      secondaryColor: "#000000",
      accentColor: "#22c55e",
      fontPairing: '"Bebas Neue", sans-serif; --font-sans: "Inter", sans-serif',
      heroPattern: "linear-gradient(135deg, #1a1a1a 0%, #000000 50%, #1a1a1a 100%)",
    };
  }
  
  if (lower.includes("clinic") || lower.includes("hospital") || lower.includes("dental") || lower.includes("dentist") || lower.includes("doctor") || lower.includes("medical") || lower.includes("healthcare") || lower.includes("physiotherapy")) {
    return {
      primaryColor: "#0c4a6e",
      secondaryColor: "#075985",
      accentColor: "#06b6d4",
      fontPairing: '"Inter", sans-serif; --font-serif: "Source Serif Pro", serif',
      heroPattern: "linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)",
    };
  }
  
  if (lower.includes("tattoo") || lower.includes("ink") || lower.includes("body art") || lower.includes("piercing")) {
    return {
      primaryColor: "#1a1a1a",
      secondaryColor: "#000000",
      accentColor: "#eab308",
      fontPairing: '"Bebas Neue", sans-serif; --font-sans: "Inter", sans-serif',
      heroPattern: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
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

function generateBlankPlaceholder(width: number, height: number, color = "#e5e7eb"): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect fill="${color}" width="100%" height="100%"/></svg>`;
}

export async function generateWebsiteProject(params: GenerateWebsiteParams): Promise<{ outputDir: string; previewUrl?: string }> {
  const projectName = `${params.businessData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${params.leadId.slice(0, 8)}`;
  const outputDir = path.join("/tmp/vasaw-websites", projectName);

  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const design = getCategoryDesign(params.businessData.category);
  const content = params.generatedContent as Record<string, unknown>;
  const template = params.template;

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

  const readme = `# ${params.businessData.businessName}\n\nGenerated website for ${params.businessData.businessName}.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Build\n\n\`\`\`bash\nnpm run build\n\`\`\`\n\n## Deploy\n\nThis project is configured for deployment on Vercel.`;
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

  const businessInterface = `interface Business {
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
};\n\n`;

  const businessObj = {
    businessName: params.businessData.businessName,
    category: params.businessData.category,
    location: params.businessData.location,
    phone: params.businessData.phone,
    email: params.businessData.email || "",
    address: params.businessData.scraped.address || params.businessData.location,
    rating: params.businessData.rating,
    reviews: params.businessData.reviews,
    website: params.businessData.website || "",
    hours: ((content.hours as { schedule?: Array<{ day: string; hours: string }> } | undefined)?.schedule) || (params.businessData.scraped.hours ? [{ day: "Mon-Sun", hours: params.businessData.scraped.hours }] : []),
    services: params.businessData.scraped.services || [],
    description: params.businessData.qualification.notes || `${params.businessData.businessName} - ${params.businessData.category} in ${params.businessData.location}`,
    name: params.businessData.businessName,
  };

  const layoutTsx = "import type { Metadata } from \"next\";\nimport \"../globals.css\";\n\nexport const metadata: Metadata = {\n  title: \"" + businessObj.businessName.replace(/"/g, '\\"') + "\",\n  description: \"" + (businessObj.description || ("Welcome to " + businessObj.businessName)).replace(/"/g, '\\"') + "\",\n  openGraph: {\n    title: \"" + businessObj.businessName.replace(/"/g, '\\"') + "\",\n    description: \"" + (businessObj.description || ("Welcome to " + businessObj.businessName)).replace(/"/g, '\\"') + "\",\n    type: \"website\",\n  },\n};\n\n" + businessInterface + "export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body className=\"min-h-screen bg-white font-sans antialiased\">\n        {children}\n      </body>\n    </html>\n  );\n}";
  fs.writeFileSync(path.join(appDir, "layout.tsx"), layoutTsx);

  const sections = template.sections
    .filter((s) => s.required || (content[s.id] && Object.keys(content[s.id] as object).length > 0))
    .sort((a, b) => a.order - b.order);

  const sectionComponents = sections.map((s) => "<" + capitalizeFirst(s.id) + "Section business={business} />").join("\n      ");

  const pageTsx = "'use client';\n\n" + businessInterface + "const business = " + JSON.stringify(businessObj, null, 2) + ";\n\nexport default function Home() {\n  return (\n    <main className=\"min-h-screen\">\n      " + sectionComponents + "\n    </main>\n  );\n}\n\n" + generateHeroSection(design) + "\n\n" + generateAboutSection() + "\n\n" + generateMenuSection() + "\n\n" + generateServicesSection() + "\n\n" + generateGallerySection() + "\n\n" + generateTestimonialsSection() + "\n\n" + generateHoursSection() + "\n\n" + generateContactSection() + "\n\n" + generateFooterSection();
  fs.writeFileSync(path.join(appDir, "page.tsx"), pageTsx);

  const contactPageTsx = "'use client';\n\n" + businessInterface + "const business = " + JSON.stringify(businessObj, null, 2) + ";\n\nexport default function ContactPage() {\n  return (\n    <main className=\"min-h-screen\">\n      <ContactSection business={business} />\n      <FooterSection business={business} />\n    </main>\n  );\n}\n\n" + generateContactSection() + "\n\n" + generateFooterSection();
  fs.writeFileSync(path.join(contactDir, "page.tsx"), contactPageTsx);

  const placeholderSvg = generateBlankPlaceholder(1200, 800, design.primaryColor + "20");
  fs.writeFileSync(path.join(publicDir, "placeholder-hero.jpg"), placeholderSvg);
  fs.writeFileSync(path.join(publicDir, "placeholder-1.jpg"), generateBlankPlaceholder(800, 600, "#f3f4f6"));
  fs.writeFileSync(path.join(publicDir, "placeholder-2.jpg"), generateBlankPlaceholder(800, 600, "#f3f4f6"));
  fs.writeFileSync(path.join(publicDir, "placeholder-3.jpg"), generateBlankPlaceholder(800, 600, "#f3f4f6"));

  execSync("npm install", { cwd: outputDir, stdio: "inherit" });
  execSync("npm run build", { cwd: outputDir, stdio: "inherit" });

  return { outputDir };
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateHeroSection(design: ReturnType<typeof getCategoryDesign>): string {
  return "function HeroSection({ business }: { business: Business }) {\n  return (\n    <section className=\"relative min-h-screen flex items-center justify-center\" style={{ background: \"" + design.heroPattern + "\" }}>\n      <div className=\"absolute inset-0 bg-black/40\" />\n      <div className=\"relative container px-6 text-center\">\n        <h1 className=\"font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight\">\n          {business.name}\n        </h1>\n        <p className=\"text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed\">\n          {business.description}\n        </p>\n        <div className=\"flex flex-col sm:flex-row gap-4 justify-center items-center\">\n          <div className=\"flex items-center gap-2 text-white/90\">\n            <span className=\"text-accent\" role=\"img\" aria-label=\"star\">\u2605</span>\n            <span className=\"font-medium\">{business.rating}/5</span>\n            <span className=\"text-white/60\">({business.reviews} reviews)</span>\n          </div>\n          <div className=\"flex items-center gap-2 text-white/90\">\n            <span role=\"img\" aria-label=\"location\">\u{1F4CD}</span>\n            <span className=\"font-medium\">{business.location}</span>\n          </div>\n        </div>\n        <div className=\"mt-10 flex gap-4 justify-center\">\n          <a href=\"#contact\" className=\"bg-accent text-primary px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity\">\n            Contact Us\n          </a>\n          <a href={\"tel:\" + business.phone.replace(new RegExp(\"\\\\\\\\D\", \"g\"), \"\")} className=\"border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors\">\n            Call Now\n          </a>\n        </div>\n      </div>\n    </section>\n  );\n}";
}

function generateAboutSection(): string {
  return "function AboutSection({ business }: { business: Business }) {\n  return (\n    <section id=\"about\" className=\"section bg-gray-50\">\n      <div className=\"container\">\n        <h2 className=\"section-title font-display\">About {business.name}</h2>\n        <div className=\"max-w-3xl mx-auto text-center\">\n          <p className=\"text-lg text-gray-700 leading-relaxed\">{business.description}</p>\n        </div>\n        {business.rating > 0 && (\n          <div className=\"mt-10 grid grid-cols-3 gap-6 max-w-2xl mx-auto\">\n            <div className=\"bg-white p-6 rounded-xl shadow-sm\">\n              <div className=\"text-3xl font-bold text-primary font-display\">{business.rating}</div>\n              <div className=\"text-gray-600\">Rating</div>\n            </div>\n            <div className=\"bg-white p-6 rounded-xl shadow-sm\">\n              <div className=\"text-3xl font-bold text-primary font-display\">{business.reviews.toLocaleString()}+</div>\n              <div className=\"text-gray-600\">Reviews</div>\n            </div>\n            <div className=\"bg-white p-6 rounded-xl shadow-sm\">\n              <div className=\"text-3xl font-bold text-primary font-display\">{business.category}</div>\n              <div className=\"text-gray-600\">Category</div>\n            </div>\n          </div>\n        )}\n      </div>\n    </section>\n  );\n}";
}

function generateMenuSection(): string {
  return "function MenuSection({ business }: { business: Business }) {\n  if (!business.services || business.services.length === 0) return null;\n  \n  return (\n    <section id=\"menu\" className=\"section\">\n      <div className=\"container\">\n        <h2 className=\"section-title font-display\">Our Menu</h2>\n        <div className=\"grid md:grid-cols-2 lg:grid-cols-3 gap-6\">\n          {business.services.slice(0, 9).map((service: string, i: number) => (\n            <article key={i} className=\"bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow\">\n              <h3 className=\"text-xl font-semibold text-gray-900 mb-2\">{service}</h3>\n              <p className=\"text-gray-600\">Available dish</p>\n            </article>\n          ))}\n        </div>\n      </div>\n    </section>\n  );\n}";
}

function generateServicesSection(): string {
  return "function ServicesSection({ business }: { business: Business }) {\n  if (!business.services || business.services.length === 0) return null;\n  \n  return (\n    <section id=\"services\" className=\"section bg-gray-50\">\n      <div className=\"container\">\n        <h2 className=\"section-title font-display\">Our Services</h2>\n        <div className=\"grid md:grid-cols-2 lg:grid-cols-3 gap-6\">\n          {business.services.slice(0, 9).map((service: string, i: number) => (\n            <article key={i} className=\"bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow\">\n              <h3 className=\"text-xl font-semibold text-gray-900 mb-2\">{service}</h3>\n              <p className=\"text-gray-600\">Professional service</p>\n            </article>\n          ))}\n        </div>\n      </div>\n    </section>\n  );\n}";
}

function generateGallerySection(): string {
  return "function GallerySection({ business }: { business: Business }) {\n  return (\n    <section id=\"gallery\" className=\"section\">\n      <div className=\"container\">\n        <h2 className=\"section-title font-display\">Gallery</h2>\n        <div className=\"grid grid-cols-2 md:grid-cols-3 gap-4\">\n          {[1, 2, 3].map((i) => (\n            <div key={i} className=\"aspect-square rounded-xl overflow-hidden bg-gray-100\">\n              <img \n                src={\"/placeholder-\" + i + \".jpg\"} \n                alt={business.name + \" gallery image \" + i}\n                className=\"w-full h-full object-cover hover:scale-105 transition-transform duration-300\"\n              />\n            </div>\n          ))}\n        </div>\n      </div>\n    </section>\n  );\n}";
}

function generateTestimonialsSection(): string {
  return "function TestimonialsSection({ business }: { business: Business }) {\n  return (\n    <section id=\"testimonials\" className=\"section bg-gray-50\">\n      <div className=\"container\">\n        <h2 className=\"section-title font-display\">What Our Customers Say</h2>\n        <div className=\"max-w-3xl mx-auto text-center\">\n          <div className=\"flex items-center justify-center gap-2 mb-4\">\n            <span className=\"text-accent\" role=\"img\" aria-label=\"star\">\u2605</span>\n            <span className=\"text-3xl font-bold\">{business.rating}/5</span>\n          </div>\n          <p className=\"text-lg text-gray-700\">\n            Based on {business.reviews.toLocaleString()} reviews\n          </p>\n        </div>\n      </div>\n    </section>\n  );\n}";
}

function generateHoursSection(): string {
  return "function HoursSection({ business }: { business: Business }) {\n  if (!business.hours || business.hours.length === 0) return null;\n  \n  return (\n    <section id=\"hours\" className=\"section\">\n      <div className=\"container\">\n        <h2 className=\"section-title font-display\">Opening Hours</h2>\n        <div className=\"max-w-md mx-auto\">\n          <dl className=\"space-y-4\">\n            {business.hours.map((item: { day: string; hours: string }, i: number) => (\n              <div key={i} className=\"flex justify-between py-3 border-b border-gray-200\">\n                <dt className=\"font-medium text-gray-900\">{item.day}</dt>\n                <dd className=\"text-gray-600\">{item.hours}</dd>\n              </div>\n            ))}\n          </dl>\n        </div>\n      </div>\n    </section>\n  );\n}";
}

function generateContactSection(): string {
  return "function ContactSection({ business }: { business: Business }) {\n  return (\n    <section id=\"contact\" className=\"section bg-gray-50\">\n      <div className=\"container\">\n        <h2 className=\"section-title font-display\">Contact Us</h2>\n        <div className=\"grid md:grid-cols-2 gap-10 max-w-4xl mx-auto\">\n          <div>\n            <h3 className=\"text-2xl font-semibold mb-6\">Visit Us</h3>\n            <address className=\"not-italic space-y-4 text-gray-700\">\n              <p>{business.address}</p>\n              <p>{business.location}</p>\n            </address>\n            \n            <h3 className=\"text-2xl font-semibold mt-10 mb-6\">Call Us</h3>\n            <a href={\"tel:\" + business.phone.replace(new RegExp(\"\\\\\\\\D\", \"g\"), \"\")} className=\"text-gray-700 hover:text-primary transition-colors inline-block\">\n              {business.phone}\n            </a>\n            \n            {business.email && (\n              <>\n                <h3 className=\"text-2xl font-semibold mt-10 mb-6\">Email Us</h3>\n                <a href={\"mailto:\" + business.email} className=\"text-gray-700 hover:text-primary transition-colors inline-block\">\n                  {business.email}\n                </a>\n              </>\n            )}\n            \n            {business.website && (\n              <>\n                <h3 className=\"text-2xl font-semibold mt-10 mb-6\">Website</h3>\n                <a href={business.website} target=\"_blank\" rel=\"noopener noreferrer\" className=\"text-gray-700 hover:text-primary transition-colors inline-block\">\n                  {business.website}\n                </a>\n              </>\n            )}\n          </div>\n          \n          <div className=\"aspect-video rounded-xl overflow-hidden bg-gray-200\">\n            <iframe\n              src={\"https://maps.google.com/maps?q=\" + encodeURIComponent(business.address) + \"&output=embed\"}\n              width=\"100%\"\n              height=\"100%\"\n              style={{ border: 0 }}\n              allowFullScreen\n              loading=\"lazy\"\n              referrerPolicy=\"no-referrer-when-downgrade\"\n              title={\"Location of \" + business.name}\n            />\n          </div>\n        </div>\n      </div>\n    </section>\n  );\n}";
}

function generateFooterSection(): string {
  return "function FooterSection({ business }: { business: Business }) {\n  return (\n    <footer className=\"bg-gray-900 text-white py-12\">\n      <div className=\"container\">\n        <div className=\"grid md:grid-cols-3 gap-8\">\n          <div>\n            <h3 className=\"font-display text-2xl font-bold mb-4\">{business.name}</h3>\n            <p className=\"text-gray-400\">{business.description}</p>\n          </div>\n          <div>\n            <h4 className=\"font-semibold mb-4\">Contact</h4>\n            <address className=\"not-italic text-gray-400 space-y-2\">\n              <p>{business.address}</p>\n              <p>{business.location}</p>\n              <a href={\"tel:\" + business.phone.replace(new RegExp(\"\\\\\\\\D\", \"g\"), \"\")} className=\"hover:text-accent transition-colors\">{business.phone}</a>\n              {business.email && <a href={\"mailto:\" + business.email} className=\"hover:text-accent transition-colors\">{business.email}</a>}\n            </address>\n          </div>\n          <div>\n            <h4 className=\"font-semibold mb-4\">Hours</h4>\n            <dl className=\"text-gray-400 space-y-2\">\n              {business.hours && business.hours.length > 0 ? (\n                business.hours.map((item: { day: string; hours: string }, i: number) => (\n                  <div key={i} className=\"flex justify-between\">\n                    <dt>{item.day}</dt>\n                    <dd>{item.hours}</dd>\n                  </div>\n                ))\n              ) : (\n                <p>Contact for hours</p>\n              )}\n            </dl>\n          </div>\n        </div>\n        <div className=\"border-t border-gray-800 mt-8 pt-8 text-center text-gray-400\">\n          <p>&copy; {new Date().getFullYear()} {business.name}. All rights reserved.</p>\n        </div>\n      </div>\n    </footer>\n  );\n}";
}