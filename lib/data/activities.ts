import type { ActivityItem, Connection } from "@/lib/types";

const daysAgo = (days: number, hour = 10, minute = 30) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const minutesAgo = (minutes: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
};

export const recentActivity: ActivityItem[] = [
  {
    id: "act-1",
    timestamp: minutesAgo(2),
    actor: "Website Building Agent",
    type: "website",
    status: "pending",
    title: "Building website for Trendz Unisex Salon",
    description: "Generating layout & copy — 3 of 5 pages complete.",
  },
  {
    id: "act-2",
    timestamp: minutesAgo(8),
    actor: "Deployment Agent",
    type: "deployment",
    status: "success",
    title: "Site deployed to production",
    description: "annapurna-restaurant.vercel.app is live.",
  },
  {
    id: "act-3",
    timestamp: minutesAgo(12),
    actor: "Checking Agent",
    type: "lead",
    status: "success",
    title: "34 businesses qualified",
    description: "Batch from Saibaba Colony (Salon & Fitness) passed qualification.",
  },
  {
    id: "act-4",
    timestamp: minutesAgo(18),
    actor: "Scraping Agent",
    type: "lead",
    status: "success",
    title: "34 businesses scraped",
    description: "New leads added from Saibaba Colony.",
  },
  {
    id: "act-5",
    timestamp: minutesAgo(45),
    actor: "WhatsApp Agent",
    type: "message",
    status: "success",
    title: "Outreach batch delivered",
    description: "12 messages delivered, 1 reply classified as interested.",
  },
  {
    id: "act-6",
    timestamp: daysAgo(1, 9),
    actor: "Scraping Agent",
    type: "lead",
    status: "success",
    title: "Scrape run completed",
    description: "Extracted 41 businesses in RS Puram (Restaurant).",
  },
  {
    id: "act-7",
    timestamp: daysAgo(1, 16),
    actor: "WhatsApp Agent",
    type: "message",
    status: "info",
    title: "Reply classified — interested",
    description: "Kovai Iron Gym replied to the outreach message.",
  },
  {
    id: "act-8",
    timestamp: daysAgo(1, 18),
    actor: "Deployment Agent",
    type: "deployment",
    status: "error",
    title: "Deploy failed for one site",
    description: "Build output size exceeded; assets reduced and retried.",
  },
  {
    id: "act-9",
    timestamp: daysAgo(2, 12),
    actor: "WhatsApp Agent",
    type: "message",
    status: "success",
    title: "Message sent",
    description: "Outreach message sent to Nellai's Biryani House.",
  },
  {
    id: "act-10",
    timestamp: daysAgo(2, 22),
    actor: "Storage Agent",
    type: "system",
    status: "error",
    title: "Storage write timeout",
    description: "Supabase connection timed out; retried successfully.",
  },
  {
    id: "act-11",
    timestamp: daysAgo(3, 14),
    actor: "WhatsApp Agent",
    type: "message",
    status: "info",
    title: "Reply classified — not interested",
    description: "GreenLeaf Ayurvedic Center declined the offer.",
  },
  {
    id: "act-12",
    timestamp: daysAgo(4, 11),
    actor: "Campaigns",
    type: "campaign",
    status: "success",
    title: "Campaign 'Textiles & Retail' completed",
    description: "88 leads collected, 9 websites deployed.",
  },
];

export const connections: Connection[] = [
  {
    id: "apify",
    name: "Apify",
    description: "Business data scraping from Google Maps.",
    status: "connected",
    lastSync: minutesAgo(18),
    config: [
      { key: "API Key", value: "apify_api_••••••••••••9f2k" },
      { key: "Actor", value: "google-maps-scraper" },
    ],
    plan: "Starter — 1,000 credits",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Postgres database, storage and auth for leads.",
    status: "connected",
    lastSync: minutesAgo(9),
    config: [
      { key: "Project", value: "vasaw-prod-01" },
      { key: "Region", value: "ap-south-1" },
    ],
    plan: "Pro — 500 MB",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "AI qualification, content generation and website copy.",
    status: "connected",
    lastSync: minutesAgo(2),
    config: [
      { key: "Model", value: "gpt-4o-mini" },
      { key: "Usage", value: "62% of monthly quota" },
    ],
    plan: "Pay-as-you-go",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repository hosting for generated websites.",
    status: "connected",
    lastSync: minutesAgo(8),
    config: [
      { key: "Org", value: "vasaw-ai" },
      { key: "Repos", value: "12 created" },
    ],
    plan: "Free",
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Builds and deploys websites to production.",
    status: "connected",
    lastSync: minutesAgo(8),
    config: [
      { key: "Team", value: "vasaw-ai" },
      { key: "Deployments", value: "9 production" },
    ],
    plan: "Pro — 100 GB",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Message sending, delivery tracking and reply classification.",
    status: "error",
    config: [
      { key: "Number", value: "+91 90000 00000" },
      { key: "Status", value: "Session expired" },
    ],
    plan: "Cloud API — Sandbox",
  },
];