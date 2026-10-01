export interface Package {
  id: string;
  name: string;
  price: number;
  deliveryDays: string;
  pages: number;
  features: string[];
  popular?: boolean;
}

export interface MaintenancePlan {
  id: string;
  name: string;
  priceMonthly: number;
  features: string[];
}

export interface PaymentPlan {
  id: string;
  name: string;
  upfrontPercent: number;
  onDeliveryPercent: number;
  description: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Bundle {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  savings: number;
  features: string[];
}

export interface ReferralConfig {
  bonusAmount: number;
  bonusType: "credit" | "discount";
  description: string;
}

export interface UrgencyConfig {
  previewExpiryDays: number;
  slotsPerMonth: number;
  currentMonth: number;
  discountPercent: number;
  discountExpiryDays: number;
}

export const PACKAGES: Package[] = [
  {
    id: "starter",
    name: "Starter",
    price: 2999,
    deliveryDays: "5-7 business days",
    pages: 5,
    features: [
      "5-page mobile-first website",
      "Hero & value proposition",
      "About & story section",
      "Services/menu catalog",
      "Contact & Google Maps",
      "SEO foundation",
      "Google Analytics setup",
      "30-day support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 5999,
    deliveryDays: "10-14 business days",
    pages: 10,
    popular: true,
    features: [
      "10-page mobile-first website",
      "Everything in Starter",
      "Content management system",
      "Google Reviews integration",
      "Advanced SEO & schema markup",
      "Performance optimization",
      "Social media integration",
      "90-day priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 12999,
    deliveryDays: "3-6 weeks",
    pages: 20,
    features: [
      "Unlimited custom pages",
      "Everything in Professional",
      "Custom integrations",
      "A/B testing setup",
      "Conversion optimization",
      "Dedicated strategist",
      "E-commerce ready",
      "1-year premium support",
    ],
  },
];

export const MAINTENANCE_PLANS: MaintenancePlan[] = [
  {
    id: "essential",
    name: "Essential",
    priceMonthly: 199,
    features: [
      "Software updates",
      "Security monitoring",
      "Daily backups",
      "Uptime monitoring",
      "99.9% uptime SLA",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 499,
    features: [
      "Everything in Essential",
      "4 hours content updates/month",
      "Performance optimization",
      "Quarterly strategy review",
      "Priority email support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: 1299,
    features: [
      "Everything in Growth",
      "Unlimited content updates",
      "A/B testing",
      "Conversion optimization",
      "24/7 phone support",
      "Dedicated account manager",
    ],
  },
];

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: "standard",
    name: "Standard",
    upfrontPercent: 100,
    onDeliveryPercent: 0,
    description: "Pay in full before project starts",
  },
  {
    id: "split",
    name: "50/50 Split",
    upfrontPercent: 50,
    onDeliveryPercent: 50,
    description: "50% upfront, 50% on delivery",
  },
  {
    id: "flexible",
    name: "Flexible",
    upfrontPercent: 30,
    onDeliveryPercent: 70,
    description: "30% upfront, 70% on delivery",
  },
];

export const ADD_ONS: AddOn[] = [
  {
    id: "logo",
    name: "Professional Logo Design",
    price: 500,
    description: "Custom logo with 3 revisions",
  },
  {
    id: "content",
    name: "Professional Content Writing",
    price: 800,
    description: "Up to 10 pages of SEO-optimized content",
  },
  {
    id: "google_business",
    name: "Google Business Setup",
    price: 300,
    description: "Complete profile optimization",
  },
  {
    id: "review_mgmt",
    name: "Review Management",
    price: 400,
    description: "Monthly review monitoring & responses",
  },
  {
    id: "social_setup",
    name: "Social Media Setup",
    price: 600,
    description: "Facebook, Instagram, LinkedIn profiles",
  },
  {
    id: "photo",
    name: "Professional Photography",
    price: 1500,
    description: "Half-day on-location shoot",
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: "ads_starter",
    name: "Google Ads + Starter",
    price: 3999,
    originalPrice: 4499,
    savings: 500,
    features: [
      "Starter website package",
      "$1,000 Google Ads credit",
      "Campaign setup & management",
      "Monthly performance report",
    ],
  },
  {
    id: "ads_professional",
    name: "Google Ads + Professional",
    price: 6999,
    originalPrice: 7999,
    savings: 1000,
    features: [
      "Professional website package",
      "$1,500 Google Ads credit",
      "Campaign setup & management",
      "Monthly performance report",
      "Landing page optimization",
    ],
  },
  {
    id: "complete",
    name: "Complete Digital Presence",
    price: 8999,
    originalPrice: 10999,
    savings: 2000,
    features: [
      "Professional website package",
      "Logo design",
      "Content writing",
      "Google Business setup",
      "Social media setup",
      "3 months Growth maintenance",
    ],
  },
];

export const REFERRAL: ReferralConfig = {
  bonusAmount: 500,
  bonusType: "credit",
  description: "$500 credit for each referral that converts",
};

export const URGENCY: UrgencyConfig = {
  previewExpiryDays: 7,
  slotsPerMonth: 3,
  currentMonth: 2,
  discountPercent: 10,
  discountExpiryDays: 3,
};

export function getPackage(id: string): Package | undefined {
  return PACKAGES.find((p) => p.id === id);
}

export function getMaintenancePlan(id: string): MaintenancePlan | undefined {
  return MAINTENANCE_PLANS.find((p) => p.id === id);
}

export function getPaymentPlan(id: string): PaymentPlan | undefined {
  return PAYMENT_PLANS.find((p) => p.id === id);
}

export function getAddOn(id: string): AddOn | undefined {
  return ADD_ONS.find((a) => a.id === id);
}

export function getBundle(id: string): Bundle | undefined {
  return BUNDLES.find((b) => b.id === id);
}

export function calculateDiscountedPrice(price: number): number {
  return Math.round(price * (1 - URGENCY.discountPercent / 100));
}

export function getUpfrontAmount(price: number, planId: string): number {
  const plan = getPaymentPlan(planId);
  if (!plan) return price;
  return Math.round(price * (plan.upfrontPercent / 100));
}

export function getOnDeliveryAmount(price: number, planId: string): number {
  const plan = getPaymentPlan(planId);
  if (!plan) return 0;
  return Math.round(price * (plan.onDeliveryPercent / 100));
}