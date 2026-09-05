import { WebsiteTheme } from "../types";

export function generateHeroPlaceholderSvg(businessName: string, category: string, theme: WebsiteTheme): string {
  const safeName = escapeXml(businessName);
  const safeCategory = escapeXml(category);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="100%" height="100%">
  <defs>
    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.primaryColor}" stop-opacity="1" />
      <stop offset="100%" stop-color="${theme.secondaryColor}" stop-opacity="1" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="600" fill="url(#heroGrad)"/>
  <rect width="1200" height="600" fill="url(#grid)"/>
  <circle cx="600" cy="300" r="180" fill="${theme.accentColor}" fill-opacity="0.15"/>
  <text x="600" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle">
    ${safeName}
  </text>
  <text x="600" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="rgba(255,255,255,0.8)" text-anchor="middle" letter-spacing="2">
    ${safeCategory.toUpperCase()}
  </text>
</svg>`;
}

export function generateGalleryPlaceholderSvg(index: number, label: string, theme: WebsiteTheme): string {
  const safeLabel = escapeXml(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="galGrad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#galGrad${index})"/>
  <rect x="20" y="20" width="760" height="560" rx="16" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
  <circle cx="400" cy="270" r="60" fill="${theme.primaryColor}" fill-opacity="0.5"/>
  <text x="400" y="285" font-family="system-ui, -apple-system, sans-serif" font-size="40" fill="${theme.accentColor}" text-anchor="middle">
    ✦
  </text>
  <text x="400" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#ffffff" text-anchor="middle">
    ${safeLabel}
  </text>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
