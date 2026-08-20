import type { Agent } from "@/lib/types";

const daysAgo = (days: number, hour = 9, minute = 15) => {
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

export const agents: Agent[] = [
  {
    id: "scraping",
    name: "Scraping Agent",
    shortName: "Scrape",
    description:
      "Discovers businesses on Google Maps using Apify and extracts name, category, rating, reviews, contact and location data.",
    status: "healthy",
    lastRun: minutesAgo(18),
    totalRuns: 312,
    successRuns: 298,
    failedRuns: 14,
    avgDurationMs: 148000,
    recentActivity: [
      {
        id: "a1",
        timestamp: minutesAgo(18),
        actor: "Scraping Agent",
        type: "agent",
        status: "success",
        title: "Scrape run completed",
        description: "Extracted 34 businesses in Saibaba Colony (Salon & Fitness).",
      },
      {
        id: "a2",
        timestamp: minutesAgo(150),
        actor: "Scraping Agent",
        type: "agent",
        status: "success",
        title: "Scrape run completed",
        description: "Extracted 41 businesses in RS Puram (Restaurant).",
      },
      {
        id: "a3",
        timestamp: daysAgo(1, 21),
        actor: "Scraping Agent",
        type: "agent",
        status: "error",
        title: "Rate limit hit",
        description: "Google Maps API throttled the request batch; queued for retry.",
      },
    ],
  },
  {
    id: "checking",
    name: "Checking Agent",
    shortName: "Check",
    description:
      "Validates scraped data, checks if the business already has a website and qualifies it against VASAW's target criteria.",
    status: "healthy",
    lastRun: minutesAgo(12),
    totalRuns: 287,
    successRuns: 281,
    failedRuns: 6,
    avgDurationMs: 42000,
    recentActivity: [
      {
        id: "b1",
        timestamp: minutesAgo(12),
        actor: "Checking Agent",
        type: "agent",
        status: "success",
        title: "Qualification passed",
        description: "34/34 businesses from latest batch qualified for outreach.",
      },
      {
        id: "b2",
        timestamp: minutesAgo(120),
        actor: "Checking Agent",
        type: "agent",
        status: "info",
        title: "Duplicates merged",
        description: "Merged 3 duplicate listings for 'The Coffee Corner'.",
      },
    ],
  },
  {
    id: "storage",
    name: "Storage Agent",
    shortName: "Store",
    description:
      "Normalizes and persists leads, campaigns and activity records into Supabase tables with deduplication.",
    status: "healthy",
    lastRun: minutesAgo(9),
    totalRuns: 291,
    successRuns: 289,
    failedRuns: 2,
    avgDurationMs: 18000,
    recentActivity: [
      {
        id: "c1",
        timestamp: minutesAgo(9),
        actor: "Storage Agent",
        type: "agent",
        status: "success",
        title: "Leads persisted",
        description: "34 leads written to leads table (0 conflicts).",
      },
      {
        id: "c2",
        timestamp: daysAgo(2, 22),
        actor: "Storage Agent",
        type: "agent",
        status: "error",
        title: "Write timeout",
        description: "Connection to Supabase timed out; retried successfully.",
      },
    ],
  },
  {
    id: "website-building",
    name: "Website Building Agent",
    shortName: "Build",
    description:
      "Generates tailored single-page websites per lead using OpenAI — layout, copy, brand colors and sections.",
    status: "running",
    lastRun: minutesAgo(2),
    totalRuns: 96,
    successRuns: 88,
    failedRuns: 8,
    avgDurationMs: 96000,
    recentActivity: [
      {
        id: "d1",
        timestamp: minutesAgo(2),
        actor: "Website Building Agent",
        type: "agent",
        status: "pending",
        title: "Building site for Trendz Unisex Salon",
        description: "Generating layout & copy — 3 of 5 pages complete.",
      },
      {
        id: "d2",
        timestamp: minutesAgo(30),
        actor: "Website Building Agent",
        type: "agent",
        status: "success",
        title: "Site built",
        description: "Annapurna Veg Restaurant — 1-page site generated.",
      },
    ],
  },
  {
    id: "deployment",
    name: "Deployment Agent",
    shortName: "Deploy",
    description:
      "Pushes generated sites to a GitHub repository and deploys them to Vercel production.",
    status: "healthy",
    lastRun: minutesAgo(8),
    totalRuns: 64,
    successRuns: 62,
    failedRuns: 2,
    avgDurationMs: 52000,
    recentActivity: [
      {
        id: "e1",
        timestamp: minutesAgo(8),
        actor: "Deployment Agent",
        type: "agent",
        status: "success",
        title: "Site deployed",
        description: "annapurna-restaurant.vercel.app is live.",
      },
      {
        id: "e2",
        timestamp: daysAgo(1, 18),
        actor: "Deployment Agent",
        type: "agent",
        status: "error",
        title: "Deploy failed",
        description: "Build output size exceeded; reduced assets and retried.",
      },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Agent",
    shortName: "Chat",
    description:
      "Drafts and sends personalized WhatsApp messages, tracks delivery and classifies replies as interested / not interested / questions.",
    status: "idle",
    lastRun: minutesAgo(45),
    totalRuns: 178,
    successRuns: 170,
    failedRuns: 8,
    avgDurationMs: 31000,
    recentActivity: [
      {
        id: "f1",
        timestamp: minutesAgo(45),
        actor: "WhatsApp Agent",
        type: "agent",
        status: "success",
        title: "Messages sent",
        description: "12 messages delivered, 3 read, 1 reply classified 'interested'.",
      },
      {
        id: "f2",
        timestamp: daysAgo(1, 16),
        actor: "WhatsApp Agent",
        type: "agent",
        status: "info",
        title: "Reply classified",
        description: "Kovai Iron Gym replied — classified as interested.",
      },
    ],
  },
];