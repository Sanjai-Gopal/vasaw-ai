import type { ScheduledJob } from "@/lib/types";

const BASE_DATE = new Date("2026-09-06T10:00:00.000Z");

const daysAgo = (days: number, hour = 6) => {
  const d = new Date(BASE_DATE);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

const hoursFromNow = (hours: number) => {
  const d = new Date(BASE_DATE);
  d.setUTCHours(d.getUTCHours() + hours, 0, 0, 0);
  return d.toISOString();
};

export const jobs: ScheduledJob[] = [
  {
    id: "J-601",
    name: "Daily Lead Scrape",
    description: "Scrape fresh businesses from target locations via Apify.",
    type: "scrape_daily",
    schedule: "Daily at 06:00 AM",
    cron: "0 6 * * *",
    active: true,
    lastRun: daysAgo(0, 6),
    lastStatus: "success",
    nextRun: hoursFromNow(20),
    runHistory: [
      { id: "r1", timestamp: daysAgo(0, 6), status: "success", durationMs: 145000, detail: "93 new leads scraped" },
      { id: "r2", timestamp: daysAgo(1, 6), status: "success", durationMs: 160000, detail: "87 new leads scraped" },
      { id: "r3", timestamp: daysAgo(2, 6), status: "success", durationMs: 132000, detail: "102 new leads scraped" },
    ],
  },
  {
    id: "J-602",
    name: "Lead Checking & Qualification",
    description: "Validate leads and compute AI qualification scores.",
    type: "check_leads",
    schedule: "Daily at 07:30 AM",
    cron: "30 7 * * *",
    active: true,
    lastRun: daysAgo(0, 7),
    lastStatus: "success",
    nextRun: hoursFromNow(21),
    runHistory: [
      { id: "r4", timestamp: daysAgo(0, 7), status: "success", durationMs: 41000, detail: "71 leads qualified" },
      { id: "r5", timestamp: daysAgo(1, 7), status: "success", durationMs: 38000, detail: "66 leads qualified" },
    ],
  },
  {
    id: "J-603",
    name: "Storage Sync",
    description: "Sync leads and activity to Supabase.",
    type: "sync_storage",
    schedule: "Every 15 minutes",
    cron: "*/15 * * * *",
    active: true,
    lastRun: daysAgo(0, 7),
    lastStatus: "success",
    nextRun: hoursFromNow(0),
    runHistory: [
      { id: "r6", timestamp: daysAgo(0, 7), status: "success", durationMs: 12000 },
      { id: "r7", timestamp: daysAgo(0, 6), status: "success", durationMs: 11000 },
    ],
  },
  {
    id: "J-604",
    name: "Website Build Queue",
    description: "Generate websites for qualified high-priority leads.",
    type: "build_websites",
    schedule: "Daily at 09:00 AM",
    cron: "0 9 * * *",
    active: true,
    lastRun: daysAgo(0, 9),
    lastStatus: "success",
    nextRun: hoursFromNow(23),
    runHistory: [
      { id: "r8", timestamp: daysAgo(0, 9), status: "success", durationMs: 520000, detail: "2 websites generated" },
      { id: "r9", timestamp: daysAgo(1, 9), status: "failed", durationMs: 30000, detail: "OpenAI rate limit" },
    ],
  },
  {
    id: "J-605",
    name: "Deployment Pipeline",
    description: "Push sites to GitHub and deploy to Vercel.",
    type: "deploy_websites",
    schedule: "Daily at 11:00 AM",
    cron: "0 11 * * *",
    active: true,
    lastRun: daysAgo(0, 11),
    lastStatus: "success",
    nextRun: hoursFromNow(25),
    runHistory: [
      { id: "r10", timestamp: daysAgo(0, 11), status: "success", durationMs: 140000, detail: "1 site deployed" },
      { id: "r11", timestamp: daysAgo(1, 11), status: "success", durationMs: 160000, detail: "2 sites deployed" },
    ],
  },
  {
    id: "J-606",
    name: "WhatsApp Outreach",
    description: "Send prepared messages to qualified leads.",
    type: "send_messages",
    schedule: "Daily at 05:00 PM",
    cron: "0 17 * * *",
    active: false,
    lastRun: daysAgo(2, 17),
    lastStatus: "success",
    nextRun: hoursFromNow(31),
    runHistory: [
      { id: "r12", timestamp: daysAgo(2, 17), status: "success", durationMs: 90000, detail: "12 messages sent" },
      { id: "r13", timestamp: daysAgo(3, 17), status: "success", durationMs: 85000, detail: "9 messages sent" },
    ],
  },
  {
    id: "J-607",
    name: "Weekly Report",
    description: "Generate and store weekly performance summary.",
    type: "check_leads",
    schedule: "Every Sunday 08:00 PM",
    cron: "0 20 * * 0",
    active: true,
    lastRun: daysAgo(6, 20),
    lastStatus: "success",
    nextRun: daysAgo(-1, 20),
    runHistory: [
      { id: "r14", timestamp: daysAgo(6, 20), status: "success", durationMs: 20000, detail: "Report generated" },
    ],
  },
];