# VASAW AI — API Reference

All API routes return JSON with an `ok: boolean` status flag.

## Agents & Orchestrator
- `POST /api/agents/orchestrator` — Coordinates Agents 1 to 6 through complete workflow.
- `POST /api/agents/scraping` — Runs Agent 1 (Apify Google Maps or Mock).
- `POST /api/agents/qualification` — Runs Agent 2 (AI scoring & qualification).
- `POST /api/agents/website` — Runs Agent 4 (Next.js project generation & build).
- `POST /api/agents/deployment` — Runs Agent 5 (Vercel deployment).
- `POST /api/agents/whatsapp` — Runs Agent 6 (Meta WhatsApp outreach).
- `GET /api/agents/status` — Retrieves real-time status of all 6 agents.

## Core Resources
- `GET /api/leads` — Retrieves canonical leads.
- `GET /api/leads/:id` — Retrieves a specific lead by ID.
- `PATCH /api/leads/:id/status` — Updates lead lifecycle status.
- `GET /api/websites` — Retrieves generated websites.
- `POST /api/websites/:id/deploy` — Deploys a website.
- `POST /api/websites/:id/rebuild` — Rebuilds a website.
- `GET /api/messages` — Retrieves WhatsApp message history.
- `GET /api/campaigns` — Retrieves campaigns.
- `POST /api/campaigns` — Creates a new campaign.
- `GET /api/dashboard/stats` — Aggregates real-time metrics across all tables.

## Google Sheets Integration
- `POST /api/sheets/export/leads` — Exports leads to Google Sheets.
- `POST /api/sheets/export/websites` — Exports websites to Google Sheets.
- `POST /api/sheets/export/messages` — Exports outreach logs to Google Sheets.
- `POST /api/sheets/export/campaigns` — Exports campaigns to Google Sheets.
- `POST /api/sheets/sync` — Synchronizes all CRM entities to Google Sheets.
