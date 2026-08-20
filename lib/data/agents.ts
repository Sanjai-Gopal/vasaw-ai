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
    runs: [
      { id: "sr-1", timestamp: minutesAgo(18), status: "success", durationMs: 145000, detail: "34 businesses extracted from Saibaba Colony" },
      { id: "sr-2", timestamp: minutesAgo(150), status: "success", durationMs: 160000, detail: "41 businesses extracted from RS Puram" },
      { id: "sr-3", timestamp: daysAgo(1, 21), status: "failed", durationMs: 32000, detail: "Google Maps API rate limit — queued for retry" },
      { id: "sr-4", timestamp: daysAgo(1, 9), status: "success", durationMs: 138000, detail: "56 businesses extracted from Peelamedu" },
      { id: "sr-5", timestamp: daysAgo(2, 6), status: "success", durationMs: 152000, detail: "72 businesses extracted from Race Course" },
      { id: "sr-6", timestamp: daysAgo(2, 18), status: "success", durationMs: 141000, detail: "29 businesses extracted from Ganapathy" },
      { id: "sr-7", timestamp: daysAgo(3, 6), status: "success", durationMs: 129000, detail: "45 businesses extracted from Gandhipuram" },
      { id: "sr-8", timestamp: daysAgo(4, 9), status: "failed", durationMs: 8000, detail: "Network timeout — connection dropped" },
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
    runs: [
      { id: "cr-1", timestamp: minutesAgo(12), status: "success", durationMs: 41000, detail: "34/34 businesses passed qualification" },
      { id: "cr-2", timestamp: minutesAgo(120), status: "success", durationMs: 38000, detail: "28/30 passed, 2 duplicates merged" },
      { id: "cr-3", timestamp: daysAgo(1, 8), status: "success", durationMs: 44000, detail: "41/41 businesses passed qualification" },
      { id: "cr-4", timestamp: daysAgo(2, 8), status: "success", durationMs: 39000, detail: "56/58 passed, 2 low-score rejected" },
      { id: "cr-5", timestamp: daysAgo(3, 8), status: "failed", durationMs: 12000, detail: "OpenAI API timeout during scoring" },
      { id: "cr-6", timestamp: daysAgo(4, 8), status: "success", durationMs: 42000, detail: "45/45 businesses passed qualification" },
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
    runs: [
      { id: "st-1", timestamp: minutesAgo(9), status: "success", durationMs: 12000, detail: "34 leads persisted (0 conflicts)" },
      { id: "st-2", timestamp: daysAgo(1, 9), status: "success", durationMs: 14000, detail: "41 leads persisted (2 deduplicated)" },
      { id: "st-3", timestamp: daysAgo(2, 22), status: "failed", durationMs: 30000, detail: "Supabase connection timeout — retried OK" },
      { id: "st-4", timestamp: daysAgo(3, 9), status: "success", durationMs: 11000, detail: "56 leads persisted (1 conflict resolved)" },
      { id: "st-5", timestamp: daysAgo(4, 9), status: "success", durationMs: 10000, detail: "45 leads persisted (0 conflicts)" },
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
    runs: [
      { id: "br-1", timestamp: minutesAgo(2), status: "running", durationMs: 0, detail: "Trendz Unisex Salon — generating pages (3/5)" },
      { id: "br-2", timestamp: minutesAgo(30), status: "success", durationMs: 82000, detail: "Annapurna Veg Restaurant — site generated" },
      { id: "br-3", timestamp: daysAgo(1, 10), status: "success", durationMs: 95000, detail: "The Coffee Corner — site generated" },
      { id: "br-4", timestamp: daysAgo(2, 10), status: "failed", durationMs: 45000, detail: "OpenAI rate limit — build incomplete" },
      { id: "br-5", timestamp: daysAgo(3, 10), status: "success", durationMs: 101000, detail: "Little Angels Play School — site generated" },
      { id: "br-6", timestamp: daysAgo(4, 10), status: "success", durationMs: 88000, detail: "DentaCare Dental Clinic — site generated" },
      { id: "br-7", timestamp: daysAgo(5, 10), status: "failed", durationMs: 22000, detail: "Template mismatch — retrying with Clinic Care" },
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
    runs: [
      { id: "dr-1", timestamp: minutesAgo(8), status: "success", durationMs: 46000, detail: "Annapurna Veg Restaurant — deployed to Vercel" },
      { id: "dr-2", timestamp: daysAgo(1, 18), status: "failed", durationMs: 74000, detail: "Ganga Garment — build output exceeded size limit" },
      { id: "dr-3", timestamp: daysAgo(2, 11), status: "success", durationMs: 51000, detail: "Nellai's Biryani — deployed to Vercel" },
      { id: "dr-4", timestamp: daysAgo(3, 11), status: "success", durationMs: 39000, detail: "The Coffee Corner — deployed to Vercel" },
      { id: "dr-5", timestamp: daysAgo(4, 11), status: "success", durationMs: 55000, detail: "Little Angels — deployed to Vercel" },
      { id: "dr-6", timestamp: daysAgo(5, 11), status: "success", durationMs: 48000, detail: "DentaCare — deployed to Vercel" },
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
    runs: [
      { id: "wr-1", timestamp: minutesAgo(45), status: "success", durationMs: 28000, detail: "12 messages sent, 1 interested reply" },
      { id: "wr-2", timestamp: daysAgo(1, 17), status: "success", durationMs: 31000, detail: "9 messages sent, 0 replies" },
      { id: "wr-3", timestamp: daysAgo(2, 17), status: "success", durationMs: 29000, detail: "15 messages sent, 2 replies" },
      { id: "wr-4", timestamp: daysAgo(3, 17), status: "failed", durationMs: 15000, detail: "WhatsApp session expired — authentication error" },
      { id: "wr-5", timestamp: daysAgo(4, 17), status: "success", durationMs: 33000, detail: "8 messages sent, 1 not interested" },
      { id: "wr-6", timestamp: daysAgo(5, 17), status: "success", durationMs: 27000, detail: "11 messages sent, 3 interested replies" },
    ],
  },
];
