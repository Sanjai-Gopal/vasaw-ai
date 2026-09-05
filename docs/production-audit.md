# VASAW AI — System Architecture & Production Audit

## 1. Current Architecture Overview
VASAW AI coordinates an autonomous 6-agent lifecycle managed by an Orchestrator state engine with Supabase PostgreSQL as the primary persistence layer and Google Sheets as an operational synchronization layer.

```text
Campaign (UI / API / Scheduler)
    │
    ▼
┌────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                      │
│           (lib/agents/orchestrator/runner.ts)          │
└────────────────────────────────────────────────────────┘
    │
    ├─► Stage 1: Agent 1 — Scraping (Apify / Mock)
    ├─► Stage 2: Agent 2 — Qualification (AI Router / Heuristics)
    ├─► Stage 3: Agent 3 — Storage (Supabase Postgres / In-memory)
    ├─► Stage 4: Agent 4 — Website Builder (Next.js Renderer / Fallback)
    ├─► Stage 5: Agent 5 — Deployment (Vercel Cloud API / Mock)
    └─► Stage 6: Agent 6 — WhatsApp (Meta Cloud API / Mock)
```

## 2. Dependency Graph
- **Next.js 16.3.1 (App Router)** + React 19 + Tailwind CSS + Lucide Icons + Framer Motion
- **Vitest 4.1.11** (Test runner)
- **Supabase JS Client** (`@supabase/supabase-js`)
- **Apify Client** (`apify-client`)
- **Zod** (Schema validation)

## 3. Data Flow
1. **Scraping**: Fetches listings via Apify Google Maps Actor -> maps to canonical `Lead` objects.
2. **Qualification**: AI router or heuristic engine analyzes review count, rating, and website presence -> produces `score` (0-100), `priority`, and `qualification` metadata.
3. **Storage**: Agent 3 stores records into Supabase `leads` and `agent_runs` tables.
4. **Website Builder**: Templates (`restaurant`, `salon`, `clinic`, `auto`, `retail`, `professional`) rendered to disk with real build verification.
5. **Deployment**: Deploys project artifact via Vercel Cloud API or deterministic mock -> sets lead lifecycle to `website_deployed`.
6. **WhatsApp**: Prepares text/template message -> normalizes phone to E.164 -> sends via Meta Cloud API v21.0 -> records in `messages` -> sets lead lifecycle to `contacted`.

## 4. Agent Lifecycle State Transitions
`new` ──► `scraped` ──► `checking` ──► `qualified` ──► `website_building` ──► `website_deployed` ──► `contacted` ──► `replied` ──► `interested` ──► `won`

## 5. Database Audit
- Primary keys: UUIDs (`uuid_generate_v4()`)
- Foreign keys: Cascade deletion on `leads`, `websites`, `deployments`, `messages`, `conversations`
- RLS Status: RLS is enabled on all tables, but default policies currently allow `authenticated` users read access and `service_role` full access. Multi-tenant `user_id` / `org_id` partitioning is not yet enforced in the schema.

## 6. Known Risks & Production Limitations
1. **Multi-tenant Isolation**: Currently single-tenant schema without `user_id` / `org_id` column partitioning on leads.
2. **Authentication Middleware**: API routes execute with service role access and do not validate JWT session tokens from incoming requests.
3. **External Rate Limits**: Live Apify, Meta WhatsApp, and Vercel APIs require active paid credentials and rate limit backoff headers in high-throughput environments.
