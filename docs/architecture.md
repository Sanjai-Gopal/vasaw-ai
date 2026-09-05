# VASAW AI — System Architecture

VASAW AI is an autonomous, multi-agent local business intelligence, website generation, and outreach platform.

## High-Level Architecture Flow

```text
Campaign Request (UI / API / Scheduler)
    │
    ▼
┌────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                      │
│           (lib/agents/orchestrator/runner.ts)          │
└────────────────────────────────────────────────────────┘
    │
    ├─► Stage 1: Agent 1 — Scraping (Apify / Mock)
    │     Extracts local businesses with ratings, reviews & phones
    │
    ├─► Stage 2: Agent 2 — Qualification (AI Router / Heuristics)
    │     Scores opportunity, detects website absence, sets priority
    │
    ├─► Stage 3: Agent 3 — Storage (Supabase Postgres / In-memory)
    │     Persists leads & qualifications with deduplication
    │
    ├─► Stage 4: Agent 4 — Website Builder (Next.js Renderer / Fallback)
    │     Renders industry templates & executes real build validation
    │
    ├─► Stage 5: Agent 5 — Deployment (Vercel Cloud API / Mock)
    │     Publishes live HTTPS URLs & sets lead status to 'website_deployed'
    │
    └─► Stage 6: Agent 6 — WhatsApp (Meta Cloud API / Mock)
          Dispatches personalized outreach & sets lead status to 'contacted'
```

## Secondary Operational Layers

- **Google Sheets Synchronization**: (`lib/integrations/google-sheets/`) provides spreadsheet export and operational CRM sync for Leads, Websites, Messages, and Campaigns.
- **Frontend Presentation**: Clean Next.js App Router dashboard (`app/(dashboard)/`) with centralized typed data mapping layer (`lib/data/` & `lib/api/`).
